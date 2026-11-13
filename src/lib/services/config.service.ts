import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";
import { fechaNegocio, fechaNegocioDate, ZONA_NEGOCIO } from "@/lib/fecha-negocio";

export type ProductorOption = {
  label:  string;
  value:  "BYG" | "OTRO";
  activo: boolean;
};

const PRODUCTORES_DEFAULT: ProductorOption[] = [
  { label: "BYG",  value: "BYG",  activo: true },
  { label: "Otro", value: "OTRO", activo: true },
];

export async function getProductoresConfig(): Promise<ProductorOption[]> {
  try {
    const row = await prisma.config.findUnique({ where: { clave: "productores_config" } });
    if (!row) return PRODUCTORES_DEFAULT;
    const parsed = JSON.parse(row.valor);
    if (!Array.isArray(parsed) || parsed.length === 0) return PRODUCTORES_DEFAULT;
    
    // Migrate IPS to OTRO
    return parsed.map(p => ({
      ...p,
      value: (p.value === "IPS" ? "OTRO" : p.value) as "BYG" | "OTRO"
    })) as ProductorOption[];
  } catch {
    return PRODUCTORES_DEFAULT;
  }
}

export async function getTCBlue() {
  return prisma.config.findUnique({ where: { clave: "tc_blue" } });
}

/** Origen de un cambio de TC (queda en el AuditLog). */
export type OrigenCambioTc = "MANUAL";

export class TcUpdateError extends Error {}

/**
 * P1-03A / P1-03A.1 — ÚNICO write path canónico del TC ARS/USD vigente.
 * Todo flujo productivo que cambie el TC actual DEBE pasar por acá (hoy: setTCBlue ←
 * updateTCBlue, Configuración). Atómico: todo dentro de `tx`; cualquier fallo ⇒ rollback total.
 *
 *   0. exige usuario (no se inventa: sin userId ⇒ TcUpdateError, 0 writes);
 *   1. lee el TC vigente anterior (último TipoCambio ARS→USD con fecha ≤ fecha efectiva) y
 *      Config.tc_blue, capturados como VALORES antes de escribir;
 *   2. Config.tc_blue = nuevo valor, updatedAt = timestamp REAL (Config.updatedAt no tiene @updatedAt);
 *   3. upsert TipoCambio(ARS→USD, fecha = FECHA EFECTIVA ARGENTINA). La historia anterior NO se toca;
 *   4. AuditLog ACTUALIZAR_TIPO_CAMBIO (usuario, timestamp real, fecha efectiva ART, anterior,
 *      nuevo, par, fila, origen).
 *
 * Fecha efectiva = día calendario en America/Argentina/Buenos_Aires del instante del cambio
 * (fechaNegocio), NUNCA el día UTC del servidor: 2026-11-12T00:30Z (21:30 ART del 11/11) rige
 * desde el 11/11. Timestamp real (Config.updatedAt, AuditLog) = el instante, en UTC.
 * Dos cambios el MISMO día ARGENTINO (aunque caigan en días UTC distintos): el unique
 * (monedaOrigen, monedaDestino, fecha) deja UNA fila con la última carga; cada carga deja su
 * AuditLog con el valor anterior y el nuevo.
 */
export async function actualizarTcBlueTx(
  tx: Prisma.TransactionClient,
  p: { valor: number | string; userId: string; origen: OrigenCambioTc; ahora?: Date },
) {
  if (!p.userId) throw new TcUpdateError("Cambio de TC sin usuario: rechazado (el TC solo cambia con un usuario autenticado)");
  const dec = new Decimal(p.valor).toDecimalPlaces(4);
  if (!dec.isFinite() || dec.lte(0)) throw new TcUpdateError("TC inválido");
  const ahora = p.ahora ?? new Date();
  const fechaISO = fechaNegocio(ahora);
  const fecha = fechaNegocioDate(ahora);

  // 1. Estado anterior, capturado como valores (no referencias) ANTES de cualquier write.
  const cfg = await tx.config.findUnique({ where: { clave: "tc_blue" } });
  const configPrevia = cfg ? { valor: cfg.valor, updatedAt: cfg.updatedAt.toISOString() } : null;
  const serie = await tx.tipoCambio.findMany({ where: { monedaOrigen: "ARS", monedaDestino: "USD" } });
  const ant = serie
    .filter((r) => r.fecha.getTime() <= fecha.getTime())
    .sort((a, b) => b.fecha.getTime() - a.fecha.getTime())[0] ?? null;
  const vigenteAnterior = ant
    ? { valor: ant.valor.toString(), fechaEfectiva: ant.fecha.toISOString().slice(0, 10), tipoCambioId: ant.id }
    : null;

  // 2. TC vigente para UI, con updatedAt real.
  await tx.config.upsert({
    where:  { clave: "tc_blue" },
    update: { valor: dec.toString(), updatedAt: ahora },
    create: { id: crypto.randomUUID(), clave: "tc_blue", valor: dec.toString(), updatedAt: ahora },
  });
  // 3. Nueva vigencia desde la fecha efectiva argentina (SSOT histórico).
  const fila = await tx.tipoCambio.upsert({
    where:  { monedaOrigen_monedaDestino_fecha: { monedaOrigen: "ARS", monedaDestino: "USD", fecha } },
    update: { valor: dec },
    create: { id: crypto.randomUUID(), monedaOrigen: "ARS", monedaDestino: "USD", valor: dec, fecha },
  });
  // 4. Auditoría en la MISMA transacción.
  await tx.auditLog.create({
    data: {
      id: crypto.randomUUID(),
      userId: p.userId,
      accion: "ACTUALIZAR_TIPO_CAMBIO",
      entidad: "TipoCambio",
      entidadId: fila.id,
      datosPrevios: { tcVigenteAnterior: vigenteAnterior, configTcBlue: configPrevia },
      datosNuevos: {
        description: `TC ARS/USD ${vigenteAnterior?.valor ?? "—"} → ${dec.toString()} vigente desde ${fechaISO}`,
        valor: dec.toString(),
        monedaOrigen: "ARS",
        monedaDestino: "USD",
        fechaEfectiva: fechaISO,
        zonaFechaEfectiva: ZONA_NEGOCIO,
        timestamp: ahora.toISOString(),
        source: p.origen,
        tipoCambioId: fila.id,
        mismoDia: vigenteAnterior?.fechaEfectiva === fechaISO,
      },
    },
  });
  return { tipoCambioId: fila.id, fechaEfectiva: fechaISO, anterior: vigenteAnterior?.valor ?? null };
}

/**
 * A3.1.2.2 — participa del lease CONFIG: el caller (updateTCBlue) es
 * responsable de haber confirmado posesión vigente del lock DENTRO de la
 * misma transacción antes de invocar esto (ver withOperationalLocks). `tx`
 * es obligatorio a propósito — el único caller real siempre lo provee, y un
 * fallback a `prisma` global reabriría la ventana TOCTOU que el lease existe
 * para cerrar.
 *
 * P1-03A — Cambio MANUAL desde Configuración: delega en el write path canónico
 * actualizarTcBlueTx (Config + TipoCambio fecha ART + AuditLog, atómico).
 */
export async function setTCBlue(
  value: number,
  tx: Prisma.TransactionClient,
  opts: { userId: string; ahora?: Date },
) {
  return actualizarTcBlueTx(tx, { valor: value, userId: opts.userId, origen: "MANUAL", ahora: opts.ahora });
}

/**
 * P1-03A — TC vigente para Configuración: valor, vigente desde, última modificación y autor.
 * `configDifiere` = Config.tc_blue no coincide con el TC vigente de TipoCambio (inconsistencia
 * legacy o de datos): solo se INFORMA, no se repara automáticamente.
 */
export async function getTcVigenteInfo() {
  const [config, vigente, ultimoAudit] = await Promise.all([
    prisma.config.findUnique({ where: { clave: "tc_blue" } }),
    prisma.tipoCambio.findFirst({ where: { monedaOrigen: "ARS", monedaDestino: "USD", fecha: { lte: fechaNegocioDate() } }, orderBy: { fecha: "desc" } }),
    prisma.auditLog.findFirst({
      where: { accion: "ACTUALIZAR_TIPO_CAMBIO" }, orderBy: { createdAt: "desc" },
      select: { createdAt: true, User: { select: { name: true, email: true } } },
    }),
  ]);
  return {
    valor: vigente?.valor.toString() ?? config?.valor ?? null,
    vigenteDesde: vigente ? vigente.fecha.toISOString().slice(0, 10) : null,
    ultimaModificacion: ultimoAudit?.createdAt.toISOString() ?? null,
    modificadoPor: ultimoAudit?.User?.name ?? ultimoAudit?.User?.email ?? null,
    configTcBlue: config?.valor ?? null,
    configDifiere: !!config && !!vigente && !new Decimal(config.valor).eq(vigente.valor.toString()),
  };
}

export async function getMesActivo() {
  return prisma.mesContable.findFirst({ where: { activo: true } });
}

export async function getMesOperativo(now: Date = new Date()): Promise<string> {
  const activo = await getMesActivo();
  if (activo?.mes) return activo.mes;
  // Sin mes activo: mes CALENDARIO ARGENTINO (P1-03A.2), no el del servidor UTC
  // (el 31 a las 21:30 ART sigue siendo ese mes aunque UTC ya sea el día 1 siguiente).
  return fechaNegocio(now).slice(0, 7);
}

export async function setMesActivo(mes: string) {
  await prisma.$transaction([
    prisma.mesContable.updateMany({ data: { activo: false } }),
    prisma.mesContable.upsert({
      where:  { mes },
      update: { activo: true },
      create: { id: crypto.randomUUID(), mes, activo: true },
    }),
  ]);
}

export async function getSocios() {
  return prisma.socioPorcentaje.findMany({ orderBy: { nombre: "asc" } });
}

export async function getTCHistorial() {
  return prisma.tipoCambio.findMany({
    where: { monedaOrigen: "ARS", monedaDestino: "USD" },
    orderBy: { fecha: "desc" },
    take: 7,
  });
}

export async function getActivosPrecios() {
  return prisma.activo.findMany({
    orderBy: { ticker: "asc" },
  });
}

// P1-03B: la actualización manual de precios vive en precio-manual.service.ts
// (actualizarPrecioManualTx — único write path: validación es-AR, fecha valor argentina,
// PrecioHistorico, AuditLog y usuario obligatorio, atómico).

// ── TC MEP histórico ──────────────────────────────────────────────────────────

export async function getTcMepHoy(): Promise<{ valor: number; fecha: string } | null> {
  const hoy = new Date();
  const fecha = new Date(Date.UTC(hoy.getFullYear(), hoy.getMonth(), hoy.getDate()));
  const row = await prisma.tcMepHistorial.findUnique({ where: { fecha } });
  if (!row) return null;
  return { valor: Number(row.valor), fecha: fecha.toISOString().slice(0, 10) };
}

export async function getLastTcMep(): Promise<{ valor: number; fecha: string } | null> {
  const row = await prisma.tcMepHistorial.findFirst({ orderBy: { fecha: "desc" } });
  if (!row) return null;
  return { valor: Number(row.valor), fecha: row.fecha.toISOString().slice(0, 10) };
}

export async function getTcMepForDate(fecha: Date): Promise<number | null> {
  const fechaUTC = new Date(Date.UTC(fecha.getFullYear(), fecha.getMonth(), fecha.getDate()));
  // Exact match first, then last available before that date
  const row = await prisma.tcMepHistorial.findFirst({
    where: { fecha: { lte: fechaUTC } },
    orderBy: { fecha: "desc" },
  });
  return row ? Number(row.valor) : null;
}

export async function setTcMepDia(valor: number, userId?: string) {
  const dec = new Decimal(valor).toDecimalPlaces(4);
  const hoy = new Date();
  const fecha = new Date(Date.UTC(hoy.getFullYear(), hoy.getMonth(), hoy.getDate()));
  await prisma.tcMepHistorial.upsert({
    where:  { fecha },
    update: { valor: dec, userId: userId ?? null, updatedAt: new Date() },
    create: { id: crypto.randomUUID(), fecha, valor: dec, userId: userId ?? null, updatedAt: new Date() },
  });
}

export async function getTcMepHistorial(limit = 30) {
  return prisma.tcMepHistorial.findMany({
    orderBy: { fecha: "desc" },
    take: limit,
  });
}

/** Kept for backward compat — delegates to new historial */
export async function getTCMep() {
  return prisma.config.findUnique({ where: { clave: "tc_mep" } });
}

/** Kept for backward compat */
export async function setTCMep(value: number) {
  const dec = new Decimal(value).toDecimalPlaces(4);
  await prisma.config.upsert({
    where:  { clave: "tc_mep" },
    update: { valor: dec.toString(), updatedAt: new Date() },
    create: { id: crypto.randomUUID(), clave: "tc_mep", valor: dec.toString(), updatedAt: new Date() },
  });
}

export async function getClienteDeMap(): Promise<Record<string, string>> {
  try {
    const row = await prisma.config.findUnique({ where: { clave: "cliente_de_map" } });
    if (!row) return {};
    const parsed = JSON.parse(row.valor);
    return typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

export type AlycOption = {
  nombre: string;
  activa: boolean;
};

const ALYCS_DEFAULT: AlycOption[] = [
  { nombre: "Banco Industrial", activa: true },
];

export async function getAlycConfig(): Promise<AlycOption[]> {
  try {
    const row = await prisma.config.findUnique({ where: { clave: "alycs_config" } });
    if (!row) return ALYCS_DEFAULT;
    const parsed = JSON.parse(row.valor);
    if (!Array.isArray(parsed) || parsed.length === 0) return ALYCS_DEFAULT;
    return parsed as AlycOption[];
  } catch {
    return ALYCS_DEFAULT;
  }
}

export async function updateAlycConfig(alycs: AlycOption[]): Promise<void> {
  await prisma.config.upsert({
    where:  { clave: "alycs_config" },
    update: { valor: JSON.stringify(alycs), updatedAt: new Date() },
    create: { id: crypto.randomUUID(), clave: "alycs_config", valor: JSON.stringify(alycs), updatedAt: new Date() },
  });
}

// ─── Data912 — flag de sync automático (cron) ──────────────────────────────────

const DATA912_AUTO_SYNC_FLAG = "data912_auto_sync_enabled";

/** Default false hasta que se active manualmente — nunca corre sync automático sin que alguien lo prenda explícitamente. */
export async function getData912AutoSyncEnabled(): Promise<boolean> {
  const row = await prisma.config.findUnique({ where: { clave: DATA912_AUTO_SYNC_FLAG } });
  return row?.valor === "true";
}

export async function setData912AutoSyncEnabled(enabled: boolean): Promise<void> {
  await prisma.config.upsert({
    where: { clave: DATA912_AUTO_SYNC_FLAG },
    update: { valor: enabled ? "true" : "false", updatedAt: new Date() },
    create: { id: crypto.randomUUID(), clave: DATA912_AUTO_SYNC_FLAG, valor: enabled ? "true" : "false", updatedAt: new Date() },
  });
}
