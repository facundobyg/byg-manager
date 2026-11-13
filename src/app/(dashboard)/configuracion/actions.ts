"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { setTCBlue, setMesActivo, setTCMep, getProductoresConfig, getAlycConfig, updateAlycConfig } from "@/lib/services/config.service";
import {
  actualizarPrecioManualTx, registrarPreciosManuales, PrecioManualError,
  parsePrecioUnitarioAR, parseVnAR, parseValuacionAR,
} from "@/lib/services/precio-manual.service";
import type { Decimal } from "@prisma/client/runtime/library";
import type { ProductorOption, AlycOption } from "@/lib/services/config.service";
import { writeAuditLog } from "@/lib/services/audit.service";
import { requireActionPermission } from "@/lib/auth/permissions";
import { prisma } from "@/lib/prisma";
import { TipoCartera, CategoriaActivo, Moneda } from "@prisma/client";
import { withOperationalLocks } from "@/lib/locks/withOperationalLocks";
import { assertValidClientId } from "@/lib/locks/keys";
import { InvalidClientIdError, LockOwnershipError } from "@/lib/locks/errors";

// ─── Productores ──────────────────────────────────────────────────────────────

async function saveProductoresConfig(list: ProductorOption[]) {
  await prisma.config.upsert({
    where:  { clave: "productores_config" },
    update: { valor: JSON.stringify(list), updatedAt: new Date() },
    create: { id: crypto.randomUUID(), clave: "productores_config", valor: JSON.stringify(list), updatedAt: new Date() },
  });
}

export async function addProductor(
  _prev: { error?: string; ok?: boolean } | null,
  formData: FormData,
): Promise<{ error?: string; ok?: boolean }> {
  const denied = await requireActionPermission("configuracion:editar");
  if (denied) return denied;

  const label = formData.get("label")?.toString().trim();
  const value = formData.get("value")?.toString() as ProductorOption["value"];

  if (!label) return { error: "El nombre es obligatorio" };
  if (!["BYG", "OTRO"].includes(value)) return { error: "Tipo de productor inválido" };

  const list = await getProductoresConfig();
  if (list.some((p) => p.label.toLowerCase() === label.toLowerCase())) {
    return { error: "Ya existe un productor con ese nombre" };
  }

  list.push({ label, value, activo: true });
  await saveProductoresConfig(list);
  const session = await auth();
  await writeAuditLog({ userId: session?.user?.id, accion: "ALTA_PRODUCTOR", entidad: "Config", description: `${(session?.user as any)?.name ?? "Usuario"} agregó productor ${label} (${value})` });
  revalidatePath("/configuracion");
  return { ok: true };
}

export async function toggleProductorActivo(
  _prev: { error?: string; ok?: boolean } | null,
  formData: FormData,
): Promise<{ error?: string; ok?: boolean }> {
  const denied = await requireActionPermission("configuracion:editar");
  if (denied) return denied;

  const label = formData.get("label")?.toString();
  if (!label) return { error: "Label requerido" };

  const list = await getProductoresConfig();
  const idx  = list.findIndex((p) => p.label === label);
  if (idx === -1) return { error: "Productor no encontrado" };

  const wasActivo = list[idx].activo;
  list[idx] = { ...list[idx], activo: !wasActivo };
  await saveProductoresConfig(list);
  const session = await auth();
  await writeAuditLog({ userId: session?.user?.id, accion: "TOGGLE_PRODUCTOR", entidad: "Config", description: `${(session?.user as any)?.name ?? "Usuario"} ${wasActivo ? "desactivó" : "activó"} productor ${label}` });
  revalidatePath("/configuracion");
  return { ok: true };
}

export async function eliminarProductor(
  _prev: { error?: string; ok?: boolean } | null,
  formData: FormData,
): Promise<{ error?: string; ok?: boolean }> {
  const denied = await requireActionPermission("configuracion:editar");
  if (denied) return denied;

  const label = formData.get("label")?.toString();
  if (!label) return { error: "Label requerido" };

  const list = await getProductoresConfig();
  const idx  = list.findIndex((p) => p.label === label);
  if (idx === -1) return { error: "Productor no encontrado" };
  if (list[idx].value === "BYG") return { error: "BYG no puede ser eliminado" };

  list.splice(idx, 1);
  await saveProductoresConfig(list);
  const session = await auth();
  await writeAuditLog({ userId: session?.user?.id, accion: "BAJA_PRODUCTOR", entidad: "Config", description: `${(session?.user as any)?.name ?? "Usuario"} eliminó productor ${label}` });
  revalidatePath("/configuracion");
  return { ok: true };
}

// ─── ALYCs ────────────────────────────────────────────────────────────────────

export async function addAlyc(
  _prev: { error?: string; ok?: boolean } | null,
  formData: FormData,
): Promise<{ error?: string; ok?: boolean }> {
  const denied = await requireActionPermission("configuracion:editar");
  if (denied) return denied;

  const nombre = formData.get("nombre")?.toString().trim();
  if (!nombre) return { error: "El nombre es obligatorio" };

  const list = await getAlycConfig();
  if (list.some((a) => a.nombre.toLowerCase() === nombre.toLowerCase())) {
    return { error: "Ya existe una ALYC con ese nombre" };
  }

  list.push({ nombre, activa: true });
  await updateAlycConfig(list);
  const session = await auth();
  await writeAuditLog({ userId: session?.user?.id, accion: "ALTA_ALYC", entidad: "Config", description: `${(session?.user as any)?.name ?? "Usuario"} agregó ALYC ${nombre}` });
  revalidatePath("/configuracion");
  return { ok: true };
}

export async function toggleAlycActiva(
  _prev: { error?: string; ok?: boolean } | null,
  formData: FormData,
): Promise<{ error?: string; ok?: boolean }> {
  const denied = await requireActionPermission("configuracion:editar");
  if (denied) return denied;

  const nombre = formData.get("nombre")?.toString();
  if (!nombre) return { error: "Nombre requerido" };

  const list = await getAlycConfig();
  const idx  = list.findIndex((a) => a.nombre === nombre);
  if (idx === -1) return { error: "ALYC no encontrada" };

  const wasActiva = list[idx].activa;
  list[idx] = { ...list[idx], activa: !wasActiva };
  await updateAlycConfig(list);
  const session = await auth();
  await writeAuditLog({ userId: session?.user?.id, accion: "TOGGLE_ALYC", entidad: "Config", description: `${(session?.user as any)?.name ?? "Usuario"} ${wasActiva ? "desactivó" : "activó"} ALYC ${nombre}` });
  revalidatePath("/configuracion");
  return { ok: true };
}

export async function eliminarAlyc(
  _prev: { error?: string; ok?: boolean } | null,
  formData: FormData,
): Promise<{ error?: string; ok?: boolean }> {
  const denied = await requireActionPermission("configuracion:editar");
  if (denied) return denied;

  const nombre = formData.get("nombre")?.toString();
  if (!nombre) return { error: "Nombre requerido" };
  if (nombre === "Banco Industrial") return { error: "Banco Industrial no puede ser eliminada" };

  const list = await getAlycConfig();
  const idx  = list.findIndex((a) => a.nombre === nombre);
  if (idx === -1) return { error: "ALYC no encontrada" };

  list.splice(idx, 1);
  await updateAlycConfig(list);
  const session = await auth();
  await writeAuditLog({ userId: session?.user?.id, accion: "BAJA_ALYC", entidad: "Config", description: `${(session?.user as any)?.name ?? "Usuario"} eliminó ALYC ${nombre}` });
  revalidatePath("/configuracion");
  return { ok: true };
}

/**
 * A3.1.2.2 — primera mutación CONFIG cableada al lease CONFIG (piloto).
 * Lock = coordinación entre usuarios autorizados; permission = autorización
 * — se mantienen separados a propósito (ver lock-actions.ts). Adquirir/tener
 * el lease NUNCA reemplaza requireActionPermission, y viceversa: poseer el
 * permiso no alcanza para escribir si no se posee el lease vigente.
 */
export async function updateTCBlue(
  _prev: { error?: string; ok?: boolean },
  formData: FormData,
): Promise<{ error?: string; ok?: boolean }> {
  const denied = await requireActionPermission("configuracion:editar");
  if (denied) return denied;

  // requireActionPermission ya hizo su propio auth() interno pero no expone
  // la sesión al caller — hace falta un auth() propio acá para obtener el
  // ownerUserId real. NO se toca requireActionPermission (usado por ~20
  // Server Actions) solo para evitar esta segunda llamada, barata en el
  // caso común (lee la sesión, no pega a la DB).
  const session = await auth();
  if (!session?.user?.id) return { error: "Sin sesión activa" };

  const ownerClientId = formData.get("ownerClientId")?.toString() ?? "";
  try {
    assertValidClientId(ownerClientId);
  } catch (error) {
    if (!(error instanceof InvalidClientIdError)) throw error;
    // No se expone el mensaje interno de InvalidClientIdError — mensaje
    // fijo, seguro, accionable para el usuario.
    return { error: "No se pudo verificar la pestaña. Recargá la página." };
  }

  const raw = formData.get("valor")?.toString().trim().replace(",", ".");
  if (!raw) return { error: "Valor requerido" };

  const valor = parseFloat(raw);
  if (isNaN(valor) || valor <= 0) return { error: "Valor inválido" };

  try {
    await withOperationalLocks(["CONFIG"], session.user.id, ownerClientId, async (tx) => {
      // P1-03A: Config + nueva vigencia en TipoCambio + AuditLog, atómico en esta tx.
      await setTCBlue(valor, tx, { userId: session.user.id });
    });
  } catch (error) {
    if (error instanceof LockOwnershipError) {
      return { error: "Perdiste el control de edición. Recargá la página para continuar." };
    }
    // Deadlock/serialization con retries agotados, o cualquier error de DB
    // no reconocido: nunca exponer error.message crudo (SQL, stack, IDs
    // internos) — mensaje genérico fijo.
    return { error: "No se pudo guardar. Probá de nuevo en unos segundos." };
  }

  revalidatePath("/configuracion");
  return { ok: true };
}

export async function updateTCMep(
  _prev: { error?: string; ok?: boolean },
  formData: FormData,
): Promise<{ error?: string; ok?: boolean }> {
  const denied = await requireActionPermission("configuracion:editar");
  if (denied) return denied;

  const raw = formData.get("valor")?.toString().trim().replace(",", ".");
  if (!raw) return { error: "Valor requerido" };
  const valor = parseFloat(raw);
  if (isNaN(valor) || valor <= 0) return { error: "Valor inválido" };
  await setTCMep(valor);
  revalidatePath("/configuracion");
  return { ok: true };
}

export async function updateMesActivo(
  _prev: { error?: string; ok?: boolean },
  formData: FormData,
): Promise<{ error?: string; ok?: boolean }> {
  const denied = await requireActionPermission("mes:editar");
  if (denied) return denied;

  const mes = formData.get("mes")?.toString().trim();
  if (!mes || !/^\d{4}-(0[1-9]|1[0-2])$/.test(mes)) return { error: "Formato inválido (YYYY-MM)" };

  await setMesActivo(mes);
  revalidatePath("/configuracion");
  return { ok: true };
}

// ─── Precios manuales (P1-03B) ────────────────────────────────────────────────
// Todas las cargas manuales de precio pasan por registrarPreciosManuales →
// actualizarPrecioManualTx (parser es-AR estricto, fecha valor argentina, PrecioHistorico,
// AuditLog, usuario obligatorio, atómico). Ninguna escribe Activo.precioActual directo.

function revalidarPrecios() {
  revalidatePath("/configuracion");
  revalidatePath("/precios");
  revalidatePath("/carteras", "layout");
  revalidatePath("/clientes");
}

async function usuarioDeSesion(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ?? null;
}

function errorPrecio(e: unknown, fallback: string): { error: string } {
  if (e instanceof PrecioManualError) return { error: e.message };
  console.error(fallback, e);
  return { error: fallback };
}

/** Fecha valor del form: vacía ⇒ hoy argentino (lo resuelve el helper). */
function fechaValorDe(formData: FormData): string | undefined {
  const f = formData.get("fechaValor")?.toString().trim();
  return f ? f : undefined;
}

export async function updatePrecioActivo(
  _prev: { error?: string; ok?: boolean },
  formData: FormData,
): Promise<{ error?: string; ok?: boolean }> {
  const denied = await requireActionPermission("configuracion:editar");
  if (denied) return denied;

  const activoId = formData.get("activoId")?.toString().trim();
  if (!activoId) return { error: "Datos faltantes" };

  try {
    const precio = parsePrecioUnitarioAR(formData.get("precioActual")?.toString());
    const userId = await usuarioDeSesion();
    if (!userId) return { error: "Sesión sin usuario: no se puede registrar el precio" };
    await registrarPreciosManuales(
      [{ activoId, entrada: { modo: "UNITARIO", precio }, fechaValor: fechaValorDe(formData) }],
      { userId, origen: "FORM_UNITARIO" },
    );
    revalidarPrecios();
    return { ok: true };
  } catch (e) {
    return errorPrecio(e, "Error al actualizar precio");
  }
}

export type ValuacionManualState = {
  error?: string;
  ok?: boolean;
  resultado?: { ticker: string; moneda: string; fechaValor: string; precioNuevo: string; valuacionResultante: string | null; diferencia: string | null };
};

/**
 * Instrumentos MANUALES (FCI/CRIPTO): el banco informa VN + valuación total; el sistema
 * calcula precio = valuación ÷ VN (Decimal). El VN debe coincidir con la tenencia y no se toca.
 */
export async function registrarValuacionManual(
  _prev: ValuacionManualState,
  formData: FormData,
): Promise<ValuacionManualState> {
  const denied = await requireActionPermission("configuracion:editar");
  if (denied) return denied;

  const activoId = formData.get("activoId")?.toString().trim();
  if (!activoId) return { error: "Datos faltantes" };

  try {
    const vn = parseVnAR(formData.get("vn")?.toString());
    const valuacionTotal = parseValuacionAR(formData.get("valuacionTotal")?.toString());
    const fechaValor = fechaValorDe(formData);
    if (!fechaValor) return { error: "Fecha valor obligatoria" };
    const userId = await usuarioDeSesion();
    if (!userId) return { error: "Sesión sin usuario: no se puede registrar el precio" };
    const [r] = await registrarPreciosManuales(
      [{ activoId, entrada: { modo: "VALUACION", vn, valuacionTotal }, fechaValor }],
      { userId, origen: "FORM_VALUACION" },
    );
    revalidarPrecios();
    return {
      ok: true,
      resultado: {
        ticker: r.ticker, moneda: r.moneda, fechaValor: r.fechaValor, precioNuevo: r.precioNuevo,
        valuacionResultante: r.valuacionResultante, diferencia: r.diferencia,
      },
    };
  } catch (e) {
    return errorPrecio(e, "Error al registrar la valuación");
  }
}

export async function updatePreciosActivosBatch(
  _prev: { error?: string; ok?: boolean; count?: number },
  formData: FormData,
): Promise<{ error?: string; ok?: boolean; count?: number }> {
  const denied = await requireActionPermission("configuracion:editar");
  if (denied) return denied;

  const assetIds = formData.getAll("activoId") as string[];
  const prices = formData.getAll("precioActual") as string[];

  if (!assetIds.length) return { error: "No hay activos para actualizar" };

  // Todo o nada: un valor malformado rechaza el lote entero (antes se salteaba en silencio).
  const items: { activoId: string; entrada: { modo: "UNITARIO"; precio: Decimal } }[] = [];
  const invalidos: string[] = [];
  for (let i = 0; i < assetIds.length; i++) {
    const id = assetIds[i];
    const raw = prices[i]?.toString().trim();
    if (!id || !raw) continue; // fila sin cambio
    try {
      items.push({ activoId: id, entrada: { modo: "UNITARIO", precio: parsePrecioUnitarioAR(raw) } });
    } catch (e) {
      invalidos.push(e instanceof Error ? e.message : raw);
    }
  }
  if (invalidos.length > 0) return { error: `Valores inválidos, no se guardó nada: ${invalidos.join(" | ")}` };
  if (items.length === 0) return { error: "No se ingresaron cambios válidos" };

  try {
    const userId = await usuarioDeSesion();
    if (!userId) return { error: "Sesión sin usuario: no se puede registrar el precio" };
    await registrarPreciosManuales(items, { userId, origen: "BATCH" });
    revalidarPrecios();
    return { ok: true, count: items.length };
  } catch (e) {
    return errorPrecio(e, "Error en la actualización masiva");
  }
}

export async function updateSociosPorcentaje(
  _prev: { error?: string; ok?: boolean } | null,
  formData: FormData,
): Promise<{ error?: string; ok?: boolean }> {
  const denied = await requireActionPermission("configuracion:editar");
  if (denied) return denied;

  const ids = formData.getAll("socioId") as string[];
  const pcts = formData.getAll("porcentaje") as string[];

  const updates: { id: string; porcentaje: number }[] = [];

  for (let i = 0; i < ids.length; i++) {
    const raw = pcts[i]?.toString().trim().replace(",", ".");
    if (!ids[i] || !raw) continue;
    const pct = parseFloat(raw);
    if (isNaN(pct) || pct < 0 || pct > 100) return { error: "Porcentaje inválido" };
    updates.push({ id: ids[i], porcentaje: pct });
  }

  const total = updates.reduce((acc, u) => acc + u.porcentaje, 0);
  if (Math.abs(total - 100) > 0.01) {
    return { error: `La suma debe ser 100%. Actual: ${total.toFixed(2)}%` };
  }

  await Promise.all(
    updates.map((u) =>
      prisma.socioPorcentaje.update({ where: { id: u.id }, data: { porcentaje: u.porcentaje } })
    )
  );

  revalidatePath("/configuracion");
  return { ok: true };
}

// ─── Carteras ─────────────────────────────────────────────────────────────────

function validateSlug(slug: string): string | null {
  if (!slug) return "El slug es obligatorio";
  if (!/^[a-z0-9-]+$/.test(slug)) return "El slug solo puede tener minúsculas, números y guiones";
  return null;
}

export async function createCartera(
  _prev: { error?: string; ok?: boolean },
  formData: FormData,
): Promise<{ error?: string; ok?: boolean }> {
  const denied = await requireActionPermission("configuracion:editar");
  if (denied) return denied;

  const nombre                    = formData.get("nombre")?.toString().trim();
  const slug                      = formData.get("slug")?.toString().trim().toLowerCase();
  const tipo                      = (formData.get("tipo")?.toString() ?? "COMPLETA") as TipoCartera;
  const comitenteNumber           = formData.get("comitenteNumber")?.toString().trim() || null;
  const investmentAccountType     = formData.get("investmentAccountType")?.toString().trim() || null;
  const mirrorInInvestmentAccounts = formData.get("mirrorInInvestmentAccounts") === "true";

  if (!nombre) return { error: "El nombre es obligatorio" };
  const slugErr = validateSlug(slug ?? "");
  if (slugErr) return { error: slugErr };

  if (mirrorInInvestmentAccounts && tipo === "CRIPTO") {
    return { error: "Las carteras CRIPTO no pueden mirrorearse en Banco Industrial" };
  }
  if (mirrorInInvestmentAccounts && !comitenteNumber) {
    return { error: "Se requiere número de comitente para activar el espejo en Banco Industrial" };
  }
  if (comitenteNumber) {
    const dup = await prisma.cartera.findFirst({ where: { comitenteNumber } });
    if (dup) return { error: "Ese número de comitente ya está en uso por otra cartera" };
  }

  const exists = await prisma.cartera.findUnique({ where: { slug: slug! } });
  if (exists) return { error: "Ya existe una cartera con ese slug" };

  try {
    await prisma.cartera.create({
      data: {
        id: crypto.randomUUID(),
        nombre,
        slug: slug!,
        tipo,
        comitenteNumber,
        investmentAccountType,
        mirrorInInvestmentAccounts,
        updatedAt: new Date(),
      },
    });
    revalidatePath("/configuracion");
    revalidatePath("/", "layout");
    return { ok: true };
  } catch {
    return { error: "Error al crear la cartera" };
  }
}

export async function updatePreciosTickerBatch(
  _prev: { error?: string; ok?: boolean; updated?: string[]; notFound?: string[]; invalid?: string[] },
  formData: FormData,
): Promise<{ error?: string; ok?: boolean; updated?: string[]; notFound?: string[]; invalid?: string[] }> {
  const denied = await requireActionPermission("configuracion:editar");
  if (denied) return denied;

  const text  = formData.get("batch")?.toString() ?? "";
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);

  const notFound: string[] = [];
  const invalid: string[]  = [];
  const items: { activoId: string; ticker: string; entrada: { modo: "UNITARIO"; precio: Decimal } }[] = [];

  for (const line of lines) {
    // Skip header if present
    if (line.toLowerCase().startsWith("ticker")) continue;

    // Separador = PRIMERA aparición de tab, "=", ";" (en ese orden). La coma NO separa:
    // es el decimal es-AR ("AL30,1,5" antes se leía como precio 1).
    const sep = ["\t", "=", ";"].find((s) => line.includes(s));
    if (!sep) { invalid.push(line); continue; }
    const ticker = line.slice(0, line.indexOf(sep)).trim();
    const raw = line.slice(line.indexOf(sep) + sep.length).trim();

    if (!ticker) { invalid.push(line); continue; }
    if (!raw) continue; // Ignore empty values

    let precio: Decimal;
    try { precio = parsePrecioUnitarioAR(raw); } catch { invalid.push(line); continue; }

    const tickerUpper = ticker.toUpperCase();
    const activo = await prisma.activo.findUnique({ where: { ticker: tickerUpper } });
    if (!activo) { notFound.push(tickerUpper); continue; }
    items.push({ activoId: activo.id, ticker: tickerUpper, entrada: { modo: "UNITARIO", precio } });
  }

  // Todo o nada: con una línea inválida o un ticker inexistente no se escribe ninguna.
  if (invalid.length > 0 || notFound.length > 0) {
    return { error: "Hay líneas inválidas o tickers inexistentes: no se guardó nada", ok: false, updated: [], notFound, invalid };
  }
  if (items.length === 0) return { ok: false, updated: [], notFound, invalid };

  try {
    const userId = await usuarioDeSesion();
    if (!userId) return { error: "Sesión sin usuario: no se puede registrar el precio" };
    await registrarPreciosManuales(items.map(({ activoId, entrada }) => ({ activoId, entrada })), { userId, origen: "TICKER_BATCH" });
  } catch (e) {
    return errorPrecio(e, "Error en la actualización por ticker");
  }

  revalidarPrecios();
  revalidatePath("/posicion");
  return { ok: true, updated: items.map((i) => i.ticker), notFound, invalid };
}

export async function updateCartera(
  _prev: { error?: string; ok?: boolean },
  formData: FormData,
): Promise<{ error?: string; ok?: boolean }> {
  const denied = await requireActionPermission("configuracion:editar");
  if (denied) return denied;

  const id                        = formData.get("id")?.toString().trim();
  const nombre                    = formData.get("nombre")?.toString().trim();
  const slug                      = formData.get("slug")?.toString().trim().toLowerCase();
  const tipo                      = (formData.get("tipo")?.toString() ?? "COMPLETA") as TipoCartera;
  const comitenteNumber           = formData.get("comitenteNumber")?.toString().trim() || null;
  const investmentAccountType     = formData.get("investmentAccountType")?.toString().trim() || null;
  const mirrorInInvestmentAccounts = formData.get("mirrorInInvestmentAccounts") === "true";

  if (!id)     return { error: "ID requerido" };
  if (!nombre) return { error: "El nombre es obligatorio" };
  const slugErr = validateSlug(slug ?? "");
  if (slugErr) return { error: slugErr };

  if (mirrorInInvestmentAccounts && tipo === "CRIPTO") {
    return { error: "Las carteras CRIPTO no pueden mirrorearse en Banco Industrial" };
  }
  if (mirrorInInvestmentAccounts && !comitenteNumber) {
    return { error: "Se requiere número de comitente para activar el espejo en Banco Industrial" };
  }
  if (comitenteNumber) {
    const dup = await prisma.cartera.findFirst({ where: { comitenteNumber, NOT: { id } } });
    if (dup) return { error: "Ese número de comitente ya está en uso por otra cartera" };
  }

  const conflict = await prisma.cartera.findFirst({ where: { slug: slug!, NOT: { id } } });
  if (conflict) return { error: "Ya existe una cartera con ese slug" };

  try {
    await prisma.cartera.update({
      where: { id },
      data: { nombre, slug: slug!, tipo, comitenteNumber, investmentAccountType, mirrorInInvestmentAccounts },
    });
    revalidatePath("/configuracion");
    revalidatePath("/", "layout");
    revalidatePath("/carteras", "layout");
    return { ok: true };
  } catch {
    return { error: "Error al actualizar la cartera" };
  }
}

// ─── Cajas ────────────────────────────────────────────────────────────────────

export async function createCaja(
  _prev: { error?: string; ok?: boolean } | null,
  formData: FormData,
): Promise<{ error?: string; ok?: boolean }> {
  const denied = await requireActionPermission("configuracion:cajas");
  if (denied) return denied;

  const label = formData.get("label")?.toString().trim();
  const slug  = formData.get("slug")?.toString().trim().toLowerCase();
  const tipo  = formData.get("tipo")?.toString() as any;

  if (!label || !slug || !tipo) return { error: "Datos incompletos" };
  if (!/^[a-z0-9_-]+$/.test(slug)) return { error: "Slug inválido" };

  const exists = await prisma.caja.findUnique({ where: { slug } });
  if (exists) return { error: "Ya existe una caja con ese slug" };

  try {
    await prisma.caja.create({
      data: {
        id: crypto.randomUUID(),
        label,
        slug,
        tipo,
        activa: true,
      },
    });
    const session = await auth();
    await writeAuditLog({ userId: session?.user?.id, accion: "CREATE_CAJA", entidad: "Config", description: `${(session?.user as any)?.name ?? "Usuario"} creó caja "${label}" (${slug})` });
    revalidatePath("/configuracion");
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (error) {
    return { error: "Error al crear la caja" };
  }
}

export async function updateCaja(
  _prev: { error?: string; ok?: boolean } | null,
  formData: FormData,
): Promise<{ error?: string; ok?: boolean }> {
  const denied = await requireActionPermission("configuracion:cajas");
  if (denied) return denied;

  const id     = formData.get("id")?.toString();
  const label  = formData.get("label")?.toString().trim();
  const tipo   = formData.get("tipo")?.toString() as any;
  const activa = formData.get("activa") === "true";

  if (!id || !label || !tipo) return { error: "Datos incompletos" };

  const caja = await prisma.caja.findUnique({ 
    where: { id },
    include: { _count: { select: { MovimientoCaja: true } } }
  });
  if (!caja) return { error: "Caja no encontrada" };

  // Reglas de negocio
  if (caja.esPrincipal && !activa) {
    return { error: "La caja principal no puede ser desactivada" };
  }
  
  if (caja.esPrincipal && tipo !== "CENTRAL_CONTABLE") {
    return { error: "La caja principal debe ser de tipo CENTRAL_CONTABLE" };
  }

  try {
    await prisma.caja.update({
      where: { id },
      data: { label, tipo, activa },
    });
    const session = await auth();
    await writeAuditLog({ userId: session?.user?.id, accion: "UPDATE_CAJA", entidad: "Config", description: `${(session?.user as any)?.name ?? "Usuario"} actualizó caja "${label}" → tipo: ${tipo}, activa: ${activa}` });
    revalidatePath("/configuracion");
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (error) {
    return { error: "Error al actualizar la caja" };
  }
}

export async function deleteCaja(
  _prev: { error?: string; ok?: boolean } | null,
  formData: FormData,
): Promise<{ error?: string; ok?: boolean }> {
  const denied = await requireActionPermission("configuracion:cajas");
  if (denied) return denied;

  const id = formData.get("id")?.toString();
  if (!id) return { error: "ID requerido" };

  const caja = await prisma.caja.findUnique({
    where: { id },
    include: { _count: { select: { MovimientoCaja: true } } },
  });
  if (!caja) return { error: "Caja no encontrada" };
  if (caja.esPrincipal) return { error: "La caja principal no puede ser eliminada" };
  if (caja._count.MovimientoCaja > 0) {
    return { error: `Tiene ${caja._count.MovimientoCaja} movimientos. Marcala como inactiva en lugar de eliminarla.` };
  }

  await prisma.caja.delete({ where: { id } });

  const session = await auth();
  await writeAuditLog({
    userId: session?.user?.id,
    accion: "DELETE_CAJA",
    entidad: "Config",
    description: `${(session?.user as any)?.name ?? "Usuario"} eliminó caja "${caja.label}"`,
  });

  revalidatePath("/configuracion");
  revalidatePath("/", "layout");
  return { ok: true };
}

// ─── Activos ──────────────────────────────────────────────────────────────────

export async function createActivo(
  _prev: { error?: string; ok?: boolean } | null,
  formData: FormData,
): Promise<{ error?: string; ok?: boolean }> {
  const denied = await requireActionPermission("configuracion:editar");
  if (denied) return denied;

  const ticker       = formData.get("ticker")?.toString().trim().toUpperCase();
  const descripcion  = formData.get("descripcion")?.toString().trim();
  const categoria    = formData.get("categoria")?.toString() as CategoriaActivo;
  const monedaPrecio = (formData.get("monedaPrecio")?.toString() || "USD") as Moneda;
  const rawPrecio    = formData.get("precioActual")?.toString().trim();

  if (!ticker || !categoria) return { error: "Ticker y Categoría son obligatorios" };

  const exists = await prisma.activo.findUnique({ where: { ticker } });
  if (exists) return { error: "Ya existe un activo con ese ticker" };

  try {
    // P1-03B: el precio inicial (opcional) también entra por el write path canónico.
    const precio = rawPrecio ? parsePrecioUnitarioAR(rawPrecio) : null;
    const userId = precio ? await usuarioDeSesion() : null;
    if (precio && !userId) return { error: "Sesión sin usuario: no se puede registrar el precio" };
    const ahora = new Date();
    await prisma.$transaction(async (tx) => {
      const activo = await tx.activo.create({
        data: { id: crypto.randomUUID(), ticker, descripcion, categoria, monedaPrecio, precioActual: null, updatedAt: ahora },
      });
      if (precio && userId) {
        await actualizarPrecioManualTx(tx, { activoId: activo.id, entrada: { modo: "UNITARIO", precio }, userId, origen: "ALTA_ACTIVO", ahora });
      }
    });
    revalidatePath("/precios");
    revalidatePath("/configuracion");
    return { ok: true };
  } catch (error) {
    return errorPrecio(error, "Error al crear el activo");
  }
}

export async function importPreciosExcel(
  _prev: { error?: string; ok?: boolean; report?: { updated: string[]; created: string[]; skipped: number; errors: string[] } } | null,
  formData: FormData,
): Promise<{ error?: string; ok?: boolean; report?: { updated: string[]; created: string[]; skipped: number; errors: string[] } }> {
  const denied = await requireActionPermission("configuracion:editar");
  if (denied) return denied;

  const text = formData.get("csv")?.toString() ?? "";
  if (!text) return { error: "No hay datos para procesar" };

  const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
  const report = { updated: [] as string[], created: [] as string[], skipped: 0, errors: [] as string[] };

  // Separador: ";" o tab. La coma NO se admite como separador: es el decimal es-AR.
  const firstLine = lines[0];
  let sep: string;
  if (firstLine.includes("\t")) sep = "\t";
  else if (firstLine.includes(";")) sep = ";";
  else return { error: "Separador no admitido: usá \";\" o tabulación (la coma es el separador decimal)" };

  // Parse headers to find indexes
  const headers = firstLine.split(sep).map(h => h.trim().toLowerCase().replace(/"/g, ''));
  const idx = {
    ticker: headers.indexOf("ticker"),
    descripcion: headers.indexOf("descripcion"),
    categoria: headers.indexOf("categoria"),
    monedaPrecio: headers.indexOf("monedaprecio"),
    nuevoPrecio: headers.indexOf("nuevoprecio"),
  };

  if (idx.ticker === -1) return { error: "No se encontró la columna 'ticker'" };

  // P1-03B — Solo la columna "nuevoPrecio" es una instrucción de cambio. La columna
  // "precioActual" del export es informativa y se IGNORA (antes, una fila sin nuevoPrecio
  // re-grababa el precio exportado: historial falso con fecha de hoy y fuente MANUAL).
  // Fase 1: validar todo (es-AR estricto). Con un error, no se escribe nada.
  type Fila = { ticker: string; precio: Decimal | null; crear: null | { descripcion: string | null; categoria: CategoriaActivo; moneda: Moneda } };
  const filas: Fila[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cells = lines[i].split(sep).map(c => c.trim().replace(/"/g, ''));
    const ticker = cells[idx.ticker]?.toUpperCase();
    if (!ticker) { report.skipped++; continue; }

    const raw = idx.nuevoPrecio !== -1 ? (cells[idx.nuevoPrecio] ?? "") : "";
    let precio: Decimal | null = null;
    if (raw) {
      try { precio = parsePrecioUnitarioAR(raw); } catch (e) { report.errors.push(`${ticker}: ${e instanceof Error ? e.message : raw}`); continue; }
    }

    const existing = await prisma.activo.findUnique({ where: { ticker }, select: { id: true } });
    if (existing) {
      if (precio) filas.push({ ticker, precio, crear: null });
      else report.skipped++;
      continue;
    }
    const cat = idx.categoria !== -1 ? cells[idx.categoria] : "";
    const mon = idx.monedaPrecio !== -1 ? (cells[idx.monedaPrecio] || "USD") : "USD";
    if (!cat) { report.skipped++; continue; }
    if (!CATEGORIAS_VALIDAS.includes(cat as CategoriaActivo)) { report.errors.push(`${ticker}: categoría inválida "${cat}"`); continue; }
    if (!MONEDAS_VALIDAS.includes(mon as Moneda)) { report.errors.push(`${ticker}: moneda inválida "${mon}"`); continue; }
    const desc = idx.descripcion !== -1 ? cells[idx.descripcion] : "";
    filas.push({ ticker, precio, crear: { descripcion: desc || null, categoria: cat as CategoriaActivo, moneda: mon as Moneda } });
  }

  if (report.errors.length > 0) {
    return { error: `Hay ${report.errors.length} fila(s) inválida(s): no se guardó nada`, report: { ...report, updated: [], created: [] } };
  }
  if (filas.length === 0) return { ok: true, report };

  const conPrecio = filas.some((f) => f.precio);
  const userId = conPrecio ? await usuarioDeSesion() : null;
  if (conPrecio && !userId) return { error: "Sesión sin usuario: no se puede registrar el precio" };

  // Fase 2: todo en UNA transacción (todo o nada).
  try {
    const ahora = new Date();
    await prisma.$transaction(async (tx) => {
      for (const f of filas) {
        let activoId: string;
        if (f.crear) {
          const a = await tx.activo.create({
            data: { id: crypto.randomUUID(), ticker: f.ticker, descripcion: f.crear.descripcion, categoria: f.crear.categoria, monedaPrecio: f.crear.moneda, precioActual: null, updatedAt: ahora },
          });
          activoId = a.id;
        } else {
          const a = await tx.activo.findUnique({ where: { ticker: f.ticker }, select: { id: true } });
          if (!a) throw new PrecioManualError(`${f.ticker}: activo inexistente`);
          activoId = a.id;
        }
        if (f.precio && userId) {
          await actualizarPrecioManualTx(tx, { activoId, entrada: { modo: "UNITARIO", precio: f.precio }, userId, origen: "IMPORT_EXCEL", ahora });
        }
      }
    }, { timeout: 60_000 });
  } catch (e) {
    return errorPrecio(e, "Error al importar precios");
  }
  for (const f of filas) (f.crear ? report.created : report.updated).push(f.ticker);

  revalidatePath("/precios");
  revalidatePath("/configuracion");
  revalidatePath("/carteras", "layout");

  return { ok: true, report };
}

// ─── Edición de catálogo (metadata de Activo) ──────────────────────────────────

const CATEGORIAS_VALIDAS: CategoriaActivo[] = [
  "BONO_USD", "BONO_ARS", "ON_USD", "ACCION_ARS", "ACCION_USD", "ACCION_USD_EXT", "CEDEAR", "CRIPTO", "FCI",
];
const MONEDAS_VALIDAS: Moneda[] = ["USD", "ARS", "EUR", "BRL"];

export interface ActivoUsageSummary {
  posiciones:     { carteraNombre: string; carteraSlug: string; cantidad: number; activa: boolean }[];
  custodias:      { clienteNombre: string; cantidadTotal: number }[];
  holdings:       { comitenteNombre: string; cantidad: number }[];
  historicoCount: number;
  aliasEnabled:   boolean;
}

/** Resumen de dónde está usado un Activo, para mostrar antes de editar su catálogo. No escribe nada. */
export async function getActivoUsageSummary(activoId: string): Promise<ActivoUsageSummary | { error: string }> {
  const denied = await requireActionPermission("configuracion:leer", { mode: "read" });
  if (denied) return { error: denied.error };

  const activo = await prisma.activo.findUnique({ where: { id: activoId } });
  if (!activo) return { error: "Activo no encontrado." };

  const [posiciones, custodias, holdings, historicoCount, alias] = await Promise.all([
    prisma.posicionCartera.findMany({ where: { activoId }, include: { Cartera: { select: { nombre: true, slug: true, activa: true } } } }),
    prisma.custodiaCliente.findMany({ where: { activoId }, include: { Cliente: { select: { nombre: true } } } }),
    prisma.holdingComitenteInversion.findMany({ where: { ticker: activo.ticker }, include: { ComitenteInversion: { select: { nombre: true } } } }),
    prisma.precioHistorico.count({ where: { activoId } }),
    prisma.priceTickerAlias.findFirst({ where: { bygTicker: activo.ticker, enabled: true } }),
  ]);

  return {
    posiciones: posiciones.map((p) => ({ carteraNombre: p.Cartera.nombre, carteraSlug: p.Cartera.slug, cantidad: Number(p.cantidad), activa: p.Cartera.activa })),
    custodias: custodias.map((c) => ({ clienteNombre: c.Cliente.nombre, cantidadTotal: Number(c.cantidadTotal) })),
    holdings: holdings.map((h) => ({ comitenteNombre: h.ComitenteInversion.nombre, cantidad: Number(h.cantidad) })),
    historicoCount,
    aliasEnabled: !!alias,
  };
}

/**
 * Edita metadata de catálogo de un Activo (ticker, descripción, categoría,
 * monedaPrecio). Solo ADMIN — chequeo explícito de rol, no la matriz de
 * permisos genérica (ahí SOCIO tiene acceso total a cualquier acción de
 * configuración, y esto debe quedar reservado solo a ADMIN dado el riesgo
 * de romper matching de Data912 si se toca el ticker sin cuidado).
 * No toca precioActual, PrecioHistorico ni metadata de Data912
 * (priceSource/priceStatus/priceSyncedAt/providerUpdatedAt/priceErrorMessage).
 */
export async function updateActivoMetadata(
  _prev: { error?: string; ok?: boolean } | null,
  formData: FormData,
): Promise<{ error?: string; ok?: boolean }> {
  const denied = await requireActionPermission("sistema:admin");
  if (denied) return { error: "Solo un administrador puede editar el catálogo de activos." };
  const session = await auth();
  if (!session?.user?.id) return { error: "Sin sesión activa" };

  const activoId = formData.get("activoId")?.toString().trim();
  if (!activoId) return { error: "Falta el activo a editar." };

  const descripcion  = formData.get("descripcion")?.toString().trim();
  const categoria    = formData.get("categoria")?.toString() as CategoriaActivo;
  const monedaPrecio = formData.get("monedaPrecio")?.toString() as Moneda;
  const tickerRaw     = formData.get("ticker")?.toString().trim().toUpperCase();
  const confirmTickerChange = formData.get("confirmTickerChange") === "true";

  if (!descripcion) return { error: "La descripción no puede estar vacía." };
  if (!tickerRaw) return { error: "El ticker no puede estar vacío." };
  if (!CATEGORIAS_VALIDAS.includes(categoria)) return { error: "Categoría inválida." };
  if (!MONEDAS_VALIDAS.includes(monedaPrecio)) return { error: "Moneda inválida." };

  const existing = await prisma.activo.findUnique({ where: { id: activoId } });
  if (!existing) return { error: "El activo no existe." };

  const data: { descripcion: string; categoria: CategoriaActivo; monedaPrecio: Moneda; updatedAt: Date; ticker?: string } = {
    descripcion,
    categoria,
    monedaPrecio,
    updatedAt: new Date(),
  };

  let tickerChanged = false;
  if (tickerRaw !== existing.ticker) {
    if (!confirmTickerChange) {
      return { error: "Para cambiar el ticker tenés que confirmar el cambio explícitamente." };
    }
    const dup = await prisma.activo.findUnique({ where: { ticker: tickerRaw } });
    if (dup) return { error: `Ya existe otro activo con el ticker ${tickerRaw}.` };
    data.ticker = tickerRaw;
    tickerChanged = true;
  }

  await prisma.activo.update({ where: { id: activoId }, data });

  await writeAuditLog({
    userId: session.user.id,
    accion: "UPDATE_ACTIVO_METADATA",
    entidad: "Activo",
    entidadId: activoId,
    description: `Editado catálogo de ${existing.ticker}: descripcion="${descripcion}" categoria=${categoria} moneda=${monedaPrecio}${tickerChanged ? ` ticker:${existing.ticker}->${tickerRaw}` : ""}`,
  });

  revalidatePath("/precios");
  revalidatePath("/carteras", "layout");
  revalidatePath("/posicion");

  return { ok: true };
}
