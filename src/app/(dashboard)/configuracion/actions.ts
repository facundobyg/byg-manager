"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { setTCBlue, setMesActivo, setTCMep, updatePrecioActivo as updatePrecioActivoService, updatePreciosActivosBatch as updatePreciosActivosBatchService, getProductoresConfig, getAlycConfig, updateAlycConfig } from "@/lib/services/config.service";
import type { ProductorOption, AlycOption } from "@/lib/services/config.service";
import { writeAuditLog } from "@/lib/services/audit.service";
import { requireActionPermission } from "@/lib/auth/permissions";
import { prisma } from "@/lib/prisma";
import { TipoCartera, CategoriaActivo, Moneda } from "@prisma/client";

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

export async function updateTCBlue(
  _prev: { error?: string; ok?: boolean },
  formData: FormData,
): Promise<{ error?: string; ok?: boolean }> {
  const raw = formData.get("valor")?.toString().trim().replace(",", ".");
  if (!raw) return { error: "Valor requerido" };

  const valor = parseFloat(raw);
  if (isNaN(valor) || valor <= 0) return { error: "Valor inválido" };

  await setTCBlue(valor);
  revalidatePath("/configuracion");
  return { ok: true };
}

export async function updateTCMep(
  _prev: { error?: string; ok?: boolean },
  formData: FormData,
): Promise<{ error?: string; ok?: boolean }> {
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

export async function updatePrecioActivo(
  _prev: { error?: string; ok?: boolean },
  formData: FormData,
): Promise<{ error?: string; ok?: boolean }> {
  const activoId = formData.get("activoId")?.toString().trim();
  const rawPrecio = formData.get("precioActual")?.toString().trim().replace(",", ".");

  if (!activoId || !rawPrecio) return { error: "Datos faltantes" };

  const precio = parseFloat(rawPrecio);
  if (isNaN(precio) || precio < 0) return { error: "Precio inválido" };

  try {
    const session = await auth();
    await updatePrecioActivoService(activoId, precio, session?.user?.id);
    revalidatePath("/configuracion");
    revalidatePath("/precios");
    revalidatePath("/carteras", "layout");
    revalidatePath("/clientes");
    return { ok: true };
  } catch (error: any) {
    return { error: error.message || "Error al actualizar precio" };
  }
}

export async function updatePreciosActivosBatch(
  _prev: { error?: string; ok?: boolean; count?: number },
  formData: FormData,
): Promise<{ error?: string; ok?: boolean; count?: number }> {
  const assetIds = formData.getAll("activoId") as string[];
  const prices = formData.getAll("precioActual") as string[];

  if (!assetIds.length) return { error: "No hay activos para actualizar" };

  const updates: { id: string; precio: number }[] = [];

  for (let i = 0; i < assetIds.length; i++) {
    const id = assetIds[i];
    const rawPrecio = prices[i]?.toString().trim().replace(",", ".");

    if (!id || !rawPrecio) continue;

    const precio = parseFloat(rawPrecio);
    if (isNaN(precio) || precio < 0) continue;

    updates.push({ id, precio });
  }

  if (updates.length === 0) return { error: "No se ingresaron cambios válidos" };

  try {
    const session = await auth();
    await updatePreciosActivosBatchService(updates, session?.user?.id);
    revalidatePath("/configuracion");
    revalidatePath("/precios");
    revalidatePath("/carteras", "layout");
    revalidatePath("/clientes");
    return { ok: true, count: updates.length };
  } catch (error: any) {
    return { error: error.message || "Error en la actualización masiva" };
  }
}

export async function updateSociosPorcentaje(
  _prev: { error?: string; ok?: boolean } | null,
  formData: FormData,
): Promise<{ error?: string; ok?: boolean }> {
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
  const text  = formData.get("batch")?.toString() ?? "";
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);

  const updated: string[] = [];
  const notFound: string[] = [];
  const invalid: string[]  = [];

  for (const line of lines) {
    // Skip header if present
    if (line.toLowerCase().startsWith("ticker")) continue;

    // Support multiple separators: =, tab, ;, comma
    let ticker = "";
    let raw = "";

    if (line.includes("\t")) {
      const parts = line.split("\t");
      ticker = parts[0].trim();
      raw = parts[1]?.trim();
    } else if (line.includes("=")) {
      const parts = line.split("=");
      ticker = parts[0].trim();
      raw = parts[1]?.trim();
    } else if (line.includes(";")) {
      const parts = line.split(";");
      ticker = parts[0].trim();
      raw = parts[1]?.trim();
    } else if (line.includes(",")) {
      const parts = line.split(",");
      ticker = parts[0].trim();
      raw = parts[1]?.trim();
    } else {
      invalid.push(line);
      continue;
    }

    if (!ticker) { invalid.push(line); continue; }
    if (!raw) continue; // Ignore empty values

    const precio = parseFloat(raw.replace(",", "."));
    if (isNaN(precio) || precio < 0) { invalid.push(line); continue; }

    const tickerUpper = ticker.toUpperCase();
    const activo = await prisma.activo.findUnique({ where: { ticker: tickerUpper } });
    if (!activo) { notFound.push(tickerUpper); continue; }

    await updatePrecioActivoService(activo.id, precio);
    updated.push(tickerUpper);
  }

  if (updated.length > 0) {
    revalidatePath("/configuracion");
    revalidatePath("/carteras", "layout");
    revalidatePath("/posicion");
    revalidatePath("/precios");
  }

  return { ok: updated.length > 0, updated, notFound, invalid };
}

export async function updateCartera(
  _prev: { error?: string; ok?: boolean },
  formData: FormData,
): Promise<{ error?: string; ok?: boolean }> {
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
  const ticker       = formData.get("ticker")?.toString().trim().toUpperCase();
  const descripcion  = formData.get("descripcion")?.toString().trim();
  const categoria    = formData.get("categoria")?.toString() as CategoriaActivo;
  const monedaPrecio = (formData.get("monedaPrecio")?.toString() || "USD") as Moneda;
  const rawPrecio    = formData.get("precioActual")?.toString().trim().replace(",", ".");

  if (!ticker || !categoria) return { error: "Ticker y Categoría son obligatorios" };

  const exists = await prisma.activo.findUnique({ where: { ticker } });
  if (exists) return { error: "Ya existe un activo con ese ticker" };

  const precioActual = rawPrecio ? parseFloat(rawPrecio) : null;

  try {
    await prisma.activo.create({
      data: {
        id: crypto.randomUUID(),
        ticker,
        descripcion,
        categoria,
        monedaPrecio,
        precioActual: precioActual != null ? precioActual : null,
        updatedAt: new Date(),
        ...(precioActual != null
          ? { priceSource: "MANUAL" as const, priceStatus: "OK" as const, priceSyncedAt: new Date(), providerUpdatedAt: null, priceErrorMessage: null }
          : {}),
      },
    });
    revalidatePath("/precios");
    revalidatePath("/configuracion");
    return { ok: true };
  } catch (error) {
    return { error: "Error al crear el activo" };
  }
}

export async function importPreciosExcel(
  _prev: { error?: string; ok?: boolean; report?: { updated: string[]; created: string[]; skipped: number; errors: string[] } } | null,
  formData: FormData,
): Promise<{ error?: string; ok?: boolean; report?: { updated: string[]; created: string[]; skipped: number; errors: string[] } }> {
  const text = formData.get("csv")?.toString() ?? "";
  if (!text) return { error: "No hay datos para procesar" };

  const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
  const report = { updated: [] as string[], created: [] as string[], skipped: 0, errors: [] as string[] };

  // Detect separator from first line
  const firstLine = lines[0];
  let sep = ";";
  if (firstLine.includes("\t")) sep = "\t";
  else if (firstLine.includes(";")) sep = ";";
  else if (firstLine.includes(",")) sep = ",";

  // Parse headers to find indexes
  const headers = firstLine.split(sep).map(h => h.trim().toLowerCase().replace(/"/g, ''));
  const idx = {
    ticker: headers.indexOf("ticker"),
    descripcion: headers.indexOf("descripcion"),
    categoria: headers.indexOf("categoria"),
    monedaPrecio: headers.indexOf("monedaprecio"),
    precioActual: headers.indexOf("precioactual"),
    nuevoPrecio: headers.indexOf("nuevoprecio"),
  };

  if (idx.ticker === -1) return { error: "No se encontró la columna 'ticker'" };

  for (let i = 1; i < lines.length; i++) {
    const cells = lines[i].split(sep).map(c => c.trim().replace(/"/g, ''));
    const ticker = cells[idx.ticker]?.toUpperCase();
    if (!ticker) { report.skipped++; continue; }

    const nuevoPrecioRaw = idx.nuevoPrecio !== -1 ? cells[idx.nuevoPrecio] : "";
    const precioActualRaw = idx.precioActual !== -1 ? cells[idx.precioActual] : "";
    
    const valorParaUsar = nuevoPrecioRaw || precioActualRaw;
    const precio = valorParaUsar ? parseFloat(valorParaUsar.replace(",", ".")) : null;

    try {
      const existing = await prisma.activo.findUnique({ where: { ticker } });

      if (existing) {
        if (precio != null) {
          await updatePrecioActivoService(existing.id, precio);
          report.updated.push(ticker);
        } else {
          report.skipped++;
        }
      } else {
        // Create new
        const desc = idx.descripcion !== -1 ? cells[idx.descripcion] : "";
        const cat  = idx.categoria !== -1 ? cells[idx.categoria] : "";
        const mon  = idx.monedaPrecio !== -1 ? (cells[idx.monedaPrecio] || "USD") : "USD";

        if (ticker && cat) {
          await prisma.activo.create({
            data: {
              id: crypto.randomUUID(),
              ticker,
              descripcion: desc || null,
              categoria: cat as CategoriaActivo,
              monedaPrecio: mon as Moneda,
              precioActual: precio,
              updatedAt: new Date(),
              ...(precio != null
                ? { priceSource: "MANUAL" as const, priceStatus: "OK" as const, priceSyncedAt: new Date(), providerUpdatedAt: null, priceErrorMessage: null }
                : {}),
            }
          });
          report.created.push(ticker);
        } else {
          report.skipped++;
        }
      }
    } catch (e: any) {
      report.errors.push(`${ticker}: ${e.message}`);
    }
  }

  revalidatePath("/precios");
  revalidatePath("/configuracion");
  revalidatePath("/carteras", "layout");
  
  return { ok: true, report };
}
