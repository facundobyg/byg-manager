import { prisma } from "@/lib/prisma";
import { Decimal } from "@prisma/client/runtime/library";

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

export async function setTCBlue(value: number) {
  const dec = new Decimal(value).toDecimalPlaces(4);
  const hoy = new Date();
  const fecha = new Date(Date.UTC(hoy.getFullYear(), hoy.getMonth(), hoy.getDate()));

  await prisma.$transaction([
    prisma.config.upsert({
      where:  { clave: "tc_blue" },
      update: { valor: dec.toString() },
      create: { id: crypto.randomUUID(), clave: "tc_blue", valor: dec.toString(), updatedAt: new Date() },
    }),
    prisma.tipoCambio.upsert({
      where:  { monedaOrigen_monedaDestino_fecha: { monedaOrigen: "ARS", monedaDestino: "USD", fecha } },
      update: { valor: dec },
      create: { id: crypto.randomUUID(), monedaOrigen: "ARS", monedaDestino: "USD", valor: dec, fecha },
    }),
  ]);
}

export async function getMesActivo() {
  return prisma.mesContable.findFirst({ where: { activo: true } });
}

export async function getMesOperativo(): Promise<string> {
  const activo = await getMesActivo();
  if (activo?.mes) return activo.mes;
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
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

export async function updatePrecioActivo(activoId: string, precio: number, userId?: string) {
  const dec = new Decimal(precio).toDecimalPlaces(6);
  const now = new Date();
  const fecha = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));

  await prisma.$transaction([
    prisma.activo.update({
      where: { id: activoId },
      data: {
        precioActual: dec,
        updatedAt: now,
        priceSource: "MANUAL",
        priceStatus: "OK",
        priceSyncedAt: now,
        providerUpdatedAt: null,
        priceErrorMessage: null,
      },
    }),
    prisma.precioHistorico.upsert({
      where: { activoId_fecha: { activoId, fecha } },
      update: { precio: dec, ...(userId ? { userId } : {}) },
      create: { id: crypto.randomUUID(), activoId, fecha, precio: dec, userId: userId ?? null },
    }),
  ]);
}

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

export async function updatePreciosActivosBatch(items: { id: string; precio: number }[], userId?: string) {
  const now = new Date();
  const fecha = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));

  const operations = items.flatMap((item) => {
    const dec = new Decimal(item.precio).toDecimalPlaces(6);
    return [
      prisma.activo.update({
        where: { id: item.id },
        data: {
          precioActual: dec,
          updatedAt: now,
          priceSource: "MANUAL",
          priceStatus: "OK",
          priceSyncedAt: now,
          providerUpdatedAt: null,
          priceErrorMessage: null,
        },
      }),
      prisma.precioHistorico.upsert({
        where: { activoId_fecha: { activoId: item.id, fecha } },
        update: { precio: dec, ...(userId ? { userId } : {}) },
        create: { id: crypto.randomUUID(), activoId: item.id, fecha, precio: dec, userId: userId ?? null },
      }),
    ];
  });

  await prisma.$transaction(operations);
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
