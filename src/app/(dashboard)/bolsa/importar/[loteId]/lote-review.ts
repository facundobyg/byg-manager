// Lógica de revisión/edición del lote de staging — deliberadamente NO es
// "use server". El único punto de entrada gateado para la UI es actions.ts
// en esta misma carpeta.
//
// Nada de lo que hay acá crea OperacionBolsa ni toca caja/holdings/saldos/
// carteras reales — solo lee y escribe BolsaImportLote/BolsaImportFila.

import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { parseFechaOperativa, isoDateString } from "../fecha-operativa";
import { checkCantidadCoherence, checkCaucionPrincipalCoherence } from "../process-upload";
import { Prisma } from "@prisma/client";
import type { Moneda, TipoOpBolsa, BolsaFilaEstado } from "@prisma/client";

// ── Estados editables del lote ────────────────────────────────────────────────

export const EDITABLE_LOTE_ESTADOS = new Set(["REVISION_PENDIENTE", "DEVUELTO"]);

export function esLoteEditable(estadoLote: string): boolean {
  return EDITABLE_LOTE_ESTADOS.has(estadoLote);
}

// ── Whitelist de campos editables por fila (nunca aceptar extra del cliente) ──

export interface FilaEditPatch {
  destinoTipo?: "COMITENTE" | "CARTERA" | null;
  destinoId?: string | null;
  tipoOperacionResuelta?: TipoOpBolsa | null;
  ticker?: string | null;
  cantidad?: string | null;
  precio?: string | null;
  moneda?: Moneda | null;
  fechaConcertacion?: string | null;
  plazo?: string | null;
  fechaVencimiento?: string | null;
  tasaCaucion?: string | null;
  montoNetoReferencia?: string | null;
  montoCobrarReferencia?: string | null;
  montoPagarReferencia?: string | null;
  observaciones?: string | null;
}

export interface MutationResult {
  ok: boolean;
  error?: string;
}

const TIPO_OP_VALUES = new Set<TipoOpBolsa>([
  "COMPRA_BONO",
  "VENTA_BONO",
  "COMPRA_ACCION",
  "VENTA_ACCION",
  "COMPRA_CEDEAR",
  "VENTA_CEDEAR",
  "CAUCION_COLOCADORA",
  "CAUCION_TOMADORA",
  "FUTURO",
  "OPCION_CALL",
  "OPCION_PUT",
  "MEP",
  "SENEBI",
]);

const MONEDA_VALUES = new Set<Moneda>(["USD", "ARS", "EUR", "BRL"]);

function isCaucion(tipo: TipoOpBolsa | null | undefined): boolean {
  return tipo === "CAUCION_COLOCADORA" || tipo === "CAUCION_TOMADORA";
}

// ── Validación de campos Decimal contra la precisión real de la columna ──────

function parseDecimalField(
  raw: string | null | undefined,
  precision: number,
  scale: number,
  label: string,
): { ok: true; value: string | null } | { ok: false; error: string } {
  if (raw === null || raw === undefined || raw.trim() === "") return { ok: true, value: null };
  const n = Number(raw);
  if (!Number.isFinite(n)) return { ok: false, error: `${label}: valor numérico inválido.` };
  const maxIntDigits = precision - scale;
  const max = Math.pow(10, maxIntDigits) - Math.pow(10, -scale);
  if (Math.abs(n) > max) return { ok: false, error: `${label}: fuera de rango para guardar.` };
  return { ok: true, value: raw.trim() };
}

/**
 * Resuelve un campo Decimal opcional del patch: si el cliente no lo tocó
 * (`undefined`), conserva el valor existente sin re-validarlo; si lo tocó
 * (incluido limpiarlo a null/""), lo valida contra la precisión de columna.
 * `dbValue` es lo que hay que escribir en Prisma (`undefined` = no tocar).
 */
function resolvePatchedDecimal(
  raw: string | null | undefined,
  precision: number,
  scale: number,
  label: string,
  existing: { toString(): string } | null,
): { ok: true; value: string | null; dbValue: string | null | undefined } | { ok: false; error: string } {
  if (raw === undefined) {
    return { ok: true, value: existing?.toString() ?? null, dbValue: undefined };
  }
  const parsed = parseDecimalField(raw, precision, scale, label);
  if (!parsed.ok) return parsed;
  return { ok: true, value: parsed.value, dbValue: parsed.value };
}

interface ResolvedFila {
  comitenteResueltoId: string | null;
  carteraResueltaId: string | null;
  tipoOperacionResuelta: TipoOpBolsa | null;
  ticker: string | null;
  cantidad: string | null;
  precio: string | null;
  fechaConcertacion: string | null;
  tasaCaucion: string | null;
  fechaVencimiento?: string | null;
  montoNetoReferencia?: string | null;
  montoCobrarReferencia?: string | null;
  montoPagarReferencia?: string | null;
}

/**
 * Errores bloqueantes — si hay alguno, la fila nunca puede quedar LISTA.
 * Recalcula tanto la presencia de campos como la coherencia entre ellos
 * (E4.6C.3) — guardar una fila desde la pantalla de revisión nunca se
 * limita a limpiar errores previos: si la edición introduce una
 * combinación incoherente (cantidad × precio ≈ monto, o principal vs.
 * monto a cobrar/pagar en una caución), vuelve a bloquear igual que en el
 * alta original. Nunca infiere un valor — solo confirma o rechaza.
 */
export function computeBlockingErrors(f: ResolvedFila): string[] {
  const errors: string[] = [];
  if (!f.comitenteResueltoId && !f.carteraResueltaId) {
    errors.push("Sin comitente ni cartera asignado.");
  }
  if (!f.tipoOperacionResuelta) {
    errors.push("Tipo de operación no asignado.");
  }
  if (!f.fechaConcertacion) {
    errors.push("Fecha de concertación faltante.");
  }
  if (f.tipoOperacionResuelta) {
    if (isCaucion(f.tipoOperacionResuelta)) {
      if (!f.cantidad) errors.push("Monto de la caución faltante.");
      if (!f.fechaVencimiento) errors.push("Vencimiento faltante.");
      if (!f.tasaCaucion) errors.push("Tasa de caución faltante.");

      const montoReferencia = f.tipoOperacionResuelta === "CAUCION_COLOCADORA" ? f.montoCobrarReferencia : f.montoPagarReferencia;
      if (!montoReferencia) errors.push("Monto final de la caución faltante.");

      const { error: principalError } = checkCaucionPrincipalCoherence(f.cantidad ?? null, montoReferencia ?? null);
      if (principalError) errors.push(principalError);
    } else {
      if (!f.ticker) errors.push("Ticker faltante.");
      if (!f.cantidad) errors.push("Cantidad faltante.");
      if (!f.precio) errors.push("Precio faltante.");

      const { error: coherenceError } = checkCantidadCoherence(
        f.cantidad ?? null,
        f.precio ?? null,
        f.montoNetoReferencia ?? null,
      );
      if (coherenceError) errors.push(coherenceError);
    }
  }
  return errors;
}

function computeFingerprint(f: ResolvedFila & { rawOperacion?: string | null }): string {
  const parts = [
    f.comitenteResueltoId ?? "",
    f.fechaConcertacion ?? "",
    f.tipoOperacionResuelta ?? "",
    f.ticker ?? "",
    f.cantidad ?? "",
    f.precio ?? "",
  ];
  return crypto.createHash("sha256").update(parts.join("|")).digest("hex").slice(0, 32);
}

async function recalcularContadoresLote(
  tx: Pick<typeof prisma, "bolsaImportFila" | "bolsaImportLote">,
  loteId: string,
): Promise<void> {
  const filas = await tx.bolsaImportFila.findMany({ where: { loteId }, select: { estado: true } });
  const count = (e: BolsaFilaEstado) => filas.filter((f) => f.estado === e).length;
  await tx.bolsaImportLote.update({
    where: { id: loteId },
    data: {
      totalFilas: filas.length,
      filasListas: count("LISTA"),
      filasConAdvertencia: count("ADVERTENCIA"),
      filasConError: count("ERROR"),
      filasExcluidas: count("EXCLUIDA"),
      filasConfirmadas: count("CONFIRMADA"),
      updatedAt: new Date(),
    },
  });
}

/**
 * Trae el lote y valida, en el servidor (nunca solo en la UI):
 * - que exista;
 * - que quien edita sea su creador o ADMIN;
 * - que esté en un estado editable (REVISION_PENDIENTE / DEVUELTO).
 */
async function getLoteForMutation(loteId: string, userId: string) {
  const lote = await prisma.bolsaImportLote.findUnique({ where: { id: loteId } });
  if (!lote) return { ok: false as const, error: "Lote no encontrado." };

  if (lote.creadoPorId !== userId) {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
    if (user?.role !== "ADMIN") {
      return { ok: false as const, error: "No tenés permisos para editar este lote." };
    }
  }

  if (!esLoteEditable(lote.estado)) {
    return { ok: false as const, error: "El lote no está en un estado editable." };
  }

  return { ok: true as const, lote };
}

/** Resuelve y valida el destino (comitente activo o cartera existente). */
async function resolveDestino(
  destinoTipo: "COMITENTE" | "CARTERA" | null | undefined,
  destinoId: string | null | undefined,
): Promise<
  | { ok: true; comitenteResueltoId: string | null; carteraResueltaId: string | null; nombreDetectado: string | null; nroComitenteDetectado: string | null }
  | { ok: false; error: string }
> {
  if (!destinoTipo || !destinoId) {
    return { ok: true, comitenteResueltoId: null, carteraResueltaId: null, nombreDetectado: null, nroComitenteDetectado: null };
  }
  if (destinoTipo === "COMITENTE") {
    const c = await prisma.comitenteInversion.findUnique({ where: { id: destinoId } });
    if (!c || !c.activo) return { ok: false, error: "Comitente inválido o inactivo." };
    return {
      ok: true,
      comitenteResueltoId: c.id,
      carteraResueltaId: null,
      nombreDetectado: c.nombre,
      nroComitenteDetectado: c.nroComitente,
    };
  }
  const cart = await prisma.cartera.findUnique({ where: { id: destinoId } });
  if (!cart || !cart.activa) return { ok: false, error: "Cartera inválida o inactiva." };
  return {
    ok: true,
    comitenteResueltoId: null,
    carteraResueltaId: cart.id,
    nombreDetectado: cart.nombre,
    nroComitenteDetectado: null,
  };
}

// ── Edición de una fila existente ─────────────────────────────────────────────

export async function actualizarFila(
  filaId: string,
  userId: string,
  patch: FilaEditPatch,
): Promise<MutationResult> {
  const fila = await prisma.bolsaImportFila.findUnique({ where: { id: filaId } });
  if (!fila) return { ok: false, error: "Fila no encontrada." };

  const loteRes = await getLoteForMutation(fila.loteId, userId);
  if (!loteRes.ok) return loteRes;
  if (fila.estado === "EXCLUIDA") {
    return { ok: false, error: "La fila está excluida — restaurala antes de editarla." };
  }

  if (patch.destinoTipo && patch.destinoId === undefined) {
    return { ok: false, error: "Falta el destino seleccionado." };
  }
  const destino = await resolveDestino(patch.destinoTipo, patch.destinoId);
  if (!destino.ok) return destino;

  if (patch.tipoOperacionResuelta != null && !TIPO_OP_VALUES.has(patch.tipoOperacionResuelta)) {
    return { ok: false, error: "Tipo de operación inválido." };
  }
  if (patch.moneda != null && !MONEDA_VALUES.has(patch.moneda)) {
    return { ok: false, error: "Moneda inválida." };
  }

  const cantidad = resolvePatchedDecimal(patch.cantidad, 18, 6, "Cantidad", fila.cantidad);
  if (!cantidad.ok) return cantidad;
  const precio = resolvePatchedDecimal(patch.precio, 18, 6, "Precio", fila.precio);
  if (!precio.ok) return precio;
  const tasaCaucion = resolvePatchedDecimal(patch.tasaCaucion, 8, 4, "Tasa de caución", fila.tasaCaucion);
  if (!tasaCaucion.ok) return tasaCaucion;
  const montoNetoReferencia = resolvePatchedDecimal(patch.montoNetoReferencia, 18, 2, "Monto neto", fila.montoNetoReferencia);
  if (!montoNetoReferencia.ok) return montoNetoReferencia;
  const montoCobrarReferencia = resolvePatchedDecimal(
    patch.montoCobrarReferencia, 18, 2, "Monto a cobrar", fila.montoCobrarReferencia,
  );
  if (!montoCobrarReferencia.ok) return montoCobrarReferencia;
  const montoPagarReferencia = resolvePatchedDecimal(
    patch.montoPagarReferencia, 18, 2, "Monto a pagar", fila.montoPagarReferencia,
  );
  if (!montoPagarReferencia.ok) return montoPagarReferencia;

  let fechaConcertacion: Date | null = fila.fechaConcertacion;
  if (patch.fechaConcertacion !== undefined) {
    if (patch.fechaConcertacion === null || patch.fechaConcertacion === "") {
      fechaConcertacion = null;
    } else {
      const d = parseFechaOperativa(patch.fechaConcertacion);
      if (!d) return { ok: false, error: "Fecha de concertación con formato inválido." };
      fechaConcertacion = d;
    }
  }
  let fechaVencimiento: Date | null = fila.fechaVencimiento;
  if (patch.fechaVencimiento !== undefined) {
    if (patch.fechaVencimiento === null || patch.fechaVencimiento === "") {
      fechaVencimiento = null;
    } else {
      const d = parseFechaOperativa(patch.fechaVencimiento);
      if (!d) return { ok: false, error: "Fecha de vencimiento con formato inválido." };
      fechaVencimiento = d;
    }
  }

  const tipoOperacionResuelta =
    patch.tipoOperacionResuelta !== undefined ? patch.tipoOperacionResuelta : fila.tipoOperacionResuelta;
  const ticker = patch.ticker !== undefined ? (patch.ticker?.trim() || null) : fila.ticker;
  const moneda = patch.moneda !== undefined ? patch.moneda : fila.moneda;
  const plazo = patch.plazo !== undefined ? (patch.plazo?.trim() || null) : fila.plazo;

  const comitenteResueltoId = patch.destinoTipo !== undefined ? destino.comitenteResueltoId : fila.comitenteResueltoId;
  const carteraResueltaId = patch.destinoTipo !== undefined ? destino.carteraResueltaId : fila.carteraResueltaId;

  const resolved: ResolvedFila = {
    comitenteResueltoId,
    carteraResueltaId,
    tipoOperacionResuelta,
    ticker,
    cantidad: cantidad.value,
    precio: precio.value,
    fechaConcertacion: fechaConcertacion ? isoDateString(fechaConcertacion) : null,
    tasaCaucion: tasaCaucion.value,
    fechaVencimiento: fechaVencimiento ? isoDateString(fechaVencimiento) : null,
    montoNetoReferencia: montoNetoReferencia.value,
    montoCobrarReferencia: montoCobrarReferencia.value,
    montoPagarReferencia: montoPagarReferencia.value,
  };

  const bloqueantes = computeBlockingErrors(resolved);
  const estado: BolsaFilaEstado = bloqueantes.length > 0 ? "ERROR" : "LISTA";
  const fingerprint = computeFingerprint(resolved);

  const camposCorregidos: string[] = Object.keys(patch).filter(
    (k) => k !== "observaciones" && (patch as Record<string, unknown>)[k] !== undefined,
  );

  await prisma.$transaction(async (tx) => {
    await tx.bolsaImportFila.update({
      where: { id: filaId },
      data: {
        estado,
        comitenteResueltoId: comitenteResueltoId ?? null,
        carteraResueltaId: carteraResueltaId ?? null,
        tipoSujeto: comitenteResueltoId ? "COMITENTE" : carteraResueltaId ? "CARTERA" : null,
        nombreDetectado: patch.destinoTipo !== undefined ? destino.nombreDetectado ?? fila.nombreDetectado : fila.nombreDetectado,
        nroComitenteDetectado:
          patch.destinoTipo !== undefined ? destino.nroComitenteDetectado ?? fila.nroComitenteDetectado : fila.nroComitenteDetectado,
        tipoOperacionResuelta,
        ticker,
        moneda,
        plazo,
        cantidad: cantidad.dbValue,
        precio: precio.dbValue,
        tasaCaucion: tasaCaucion.dbValue,
        montoNetoReferencia: montoNetoReferencia.dbValue,
        montoCobrarReferencia: montoCobrarReferencia.dbValue,
        montoPagarReferencia: montoPagarReferencia.dbValue,
        fechaConcertacion,
        fechaVencimiento,
        // Prisma.JsonNull (no undefined) para limpiar errores previos si la edición los resolvió.
        erroresJson: bloqueantes.length > 0 ? bloqueantes : Prisma.JsonNull,
        camposCorregidosJson: { campos: camposCorregidos, observaciones: patch.observaciones ?? undefined },
        corregidoPorId: userId,
        fingerprint,
        updatedAt: new Date(),
      },
    });
    await recalcularContadoresLote(tx, fila.loteId);
  });

  return { ok: true };
}

// ── Excluir / restaurar ────────────────────────────────────────────────────────

export async function excluirFila(filaId: string, userId: string): Promise<MutationResult> {
  const fila = await prisma.bolsaImportFila.findUnique({ where: { id: filaId } });
  if (!fila) return { ok: false, error: "Fila no encontrada." };
  const loteRes = await getLoteForMutation(fila.loteId, userId);
  if (!loteRes.ok) return loteRes;

  await prisma.$transaction(async (tx) => {
    await tx.bolsaImportFila.update({
      where: { id: filaId },
      data: { estado: "EXCLUIDA", corregidoPorId: userId, updatedAt: new Date() },
    });
    await recalcularContadoresLote(tx, fila.loteId);
  });
  return { ok: true };
}

export async function restaurarFila(filaId: string, userId: string): Promise<MutationResult> {
  const fila = await prisma.bolsaImportFila.findUnique({ where: { id: filaId } });
  if (!fila) return { ok: false, error: "Fila no encontrada." };
  if (fila.estado !== "EXCLUIDA") return { ok: false, error: "La fila no está excluida." };
  const loteRes = await getLoteForMutation(fila.loteId, userId);
  if (!loteRes.ok) return loteRes;

  const resolved: ResolvedFila = {
    comitenteResueltoId: fila.comitenteResueltoId,
    carteraResueltaId: fila.carteraResueltaId,
    tipoOperacionResuelta: fila.tipoOperacionResuelta,
    ticker: fila.ticker,
    cantidad: fila.cantidad?.toString() ?? null,
    precio: fila.precio?.toString() ?? null,
    fechaConcertacion: fila.fechaConcertacion ? isoDateString(fila.fechaConcertacion) : null,
    tasaCaucion: fila.tasaCaucion?.toString() ?? null,
    fechaVencimiento: fila.fechaVencimiento ? isoDateString(fila.fechaVencimiento) : null,
    montoNetoReferencia: fila.montoNetoReferencia?.toString() ?? null,
    montoCobrarReferencia: fila.montoCobrarReferencia?.toString() ?? null,
    montoPagarReferencia: fila.montoPagarReferencia?.toString() ?? null,
  };
  const bloqueantes = computeBlockingErrors(resolved);
  // Al restaurar vuelve a un estado que requiere revisión explícita de nuevo.
  const estado: BolsaFilaEstado = bloqueantes.length > 0 ? "ERROR" : "ADVERTENCIA";

  await prisma.$transaction(async (tx) => {
    await tx.bolsaImportFila.update({
      where: { id: filaId },
      data: { estado, corregidoPorId: userId, updatedAt: new Date() },
    });
    await recalcularContadoresLote(tx, fila.loteId);
  });
  return { ok: true };
}

export async function marcarDuplicadoLegitimo(filaId: string, userId: string): Promise<MutationResult> {
  const fila = await prisma.bolsaImportFila.findUnique({ where: { id: filaId } });
  if (!fila) return { ok: false, error: "Fila no encontrada." };
  const loteRes = await getLoteForMutation(fila.loteId, userId);
  if (!loteRes.ok) return loteRes;

  await prisma.bolsaImportFila.update({
    where: { id: filaId },
    data: { confirmadoComoDuplicadoDistinto: true, corregidoPorId: userId, updatedAt: new Date() },
  });
  return { ok: true };
}

// ── Agregar operación manual (OCR/Excel no la detectó) ────────────────────────

export interface ManualOpInput {
  destinoTipo: "COMITENTE" | "CARTERA";
  destinoId: string;
  tipoOperacionResuelta: TipoOpBolsa;
  ticker?: string | null;
  cantidad?: string | null;
  precio?: string | null;
  moneda?: Moneda | null;
  fechaConcertacion: string;
  plazo?: string | null;
  fechaVencimiento?: string | null;
  tasaCaucion?: string | null;
  montoNetoReferencia?: string | null;
  montoCobrarReferencia?: string | null;
  montoPagarReferencia?: string | null;
  observaciones?: string | null;
}

const MANUAL_ARCHIVO_HASH_PREFIX = "manual-entry:";

async function getOrCreateArchivoManual(loteId: string, origen: "EXCEL" | "IMAGEN") {
  // sha256("manual-entry:" + loteId) — determinístico por lote: único entre
  // lotes distintos, y siempre el mismo (reutilizable) dentro del mismo lote.
  const hash = crypto.createHash("sha256").update(`${MANUAL_ARCHIVO_HASH_PREFIX}${loteId}`).digest("hex");
  const existing = await prisma.bolsaImportArchivo.findUnique({ where: { fileHashSha256: hash } });
  if (existing) return existing;
  try {
    return await prisma.bolsaImportArchivo.create({
      data: {
        id: crypto.randomUUID(),
        loteId,
        nombreOriginal: "Operaciones agregadas manualmente",
        mimeType: "application/x-manual-entry",
        tamano: 0,
        fileHashSha256: hash,
        estado: "LISTO",
        origen,
        totalFilas: 0,
        updatedAt: new Date(),
      },
    });
  } catch (e) {
    // Dos altas manuales concurrentes para el mismo lote pueden chocar contra
    // el único fileHashSha256 — el que pierde la carrera reutiliza el creado.
    if (e instanceof Error && "code" in e && (e as { code: string }).code === "P2002") {
      const race = await prisma.bolsaImportArchivo.findUnique({ where: { fileHashSha256: hash } });
      if (race) return race;
    }
    throw e;
  }
}

export async function agregarOperacionManual(
  loteId: string,
  userId: string,
  input: ManualOpInput,
): Promise<MutationResult> {
  const loteRes = await getLoteForMutation(loteId, userId);
  if (!loteRes.ok) return loteRes;
  const lote = loteRes.lote;

  if (!input.destinoTipo || !input.destinoId) {
    return { ok: false, error: "Seleccioná un comitente o cartera de destino." };
  }
  const destino = await resolveDestino(input.destinoTipo, input.destinoId);
  if (!destino.ok) return destino;
  if (!input.tipoOperacionResuelta || !TIPO_OP_VALUES.has(input.tipoOperacionResuelta)) {
    return { ok: false, error: "Tipo de operación inválido." };
  }
  if (input.moneda != null && !MONEDA_VALUES.has(input.moneda)) {
    return { ok: false, error: "Moneda inválida." };
  }
  const fechaConcertacion = parseFechaOperativa(input.fechaConcertacion);
  if (!fechaConcertacion) return { ok: false, error: "Fecha de concertación obligatoria y con formato válido." };
  let fechaVencimiento: Date | null = null;
  if (input.fechaVencimiento) {
    fechaVencimiento = parseFechaOperativa(input.fechaVencimiento);
    if (!fechaVencimiento) return { ok: false, error: "Fecha de vencimiento con formato inválido." };
  }

  const cantidad = parseDecimalField(input.cantidad, 18, 6, "Cantidad");
  if (!cantidad.ok) return cantidad;
  const precio = parseDecimalField(input.precio, 18, 6, "Precio");
  if (!precio.ok) return precio;
  const tasaCaucion = parseDecimalField(input.tasaCaucion, 8, 4, "Tasa de caución");
  if (!tasaCaucion.ok) return tasaCaucion;
  const montoNetoReferencia = parseDecimalField(input.montoNetoReferencia, 18, 2, "Monto neto");
  if (!montoNetoReferencia.ok) return montoNetoReferencia;
  const montoCobrarReferencia = parseDecimalField(input.montoCobrarReferencia, 18, 2, "Monto a cobrar");
  if (!montoCobrarReferencia.ok) return montoCobrarReferencia;
  const montoPagarReferencia = parseDecimalField(input.montoPagarReferencia, 18, 2, "Monto a pagar");
  if (!montoPagarReferencia.ok) return montoPagarReferencia;

  const ticker = input.ticker?.trim() || null;
  const resolved: ResolvedFila = {
    comitenteResueltoId: destino.comitenteResueltoId,
    carteraResueltaId: destino.carteraResueltaId,
    tipoOperacionResuelta: input.tipoOperacionResuelta,
    ticker,
    cantidad: cantidad.value,
    precio: precio.value,
    fechaConcertacion: isoDateString(fechaConcertacion),
    tasaCaucion: tasaCaucion.value,
    fechaVencimiento: fechaVencimiento ? isoDateString(fechaVencimiento) : null,
    montoNetoReferencia: montoNetoReferencia.value,
    montoCobrarReferencia: montoCobrarReferencia.value,
    montoPagarReferencia: montoPagarReferencia.value,
  };
  const bloqueantes = computeBlockingErrors(resolved);
  const estado: BolsaFilaEstado = bloqueantes.length > 0 ? "ERROR" : "LISTA";
  const fingerprint = computeFingerprint(resolved);

  const archivo = await getOrCreateArchivoManual(loteId, lote.origen);
  const numeroFilaMax = await prisma.bolsaImportFila.aggregate({
    where: { loteId },
    _max: { numeroFila: true },
  });

  await prisma.$transaction(async (tx) => {
    await tx.bolsaImportFila.create({
      data: {
        id: crypto.randomUUID(),
        loteId,
        archivoId: archivo.id,
        estado,
        numeroBloque: null,
        numeroFila: (numeroFilaMax._max.numeroFila ?? 0) + 1,
        rawJson: { manual: true, ingresadoPorId: userId },
        nombreDetectado: destino.nombreDetectado,
        nroComitenteDetectado: destino.nroComitenteDetectado,
        tipoOperacionDetectada: "MANUAL",
        comitenteResueltoId: destino.comitenteResueltoId,
        carteraResueltaId: destino.carteraResueltaId,
        tipoSujeto: destino.comitenteResueltoId ? "COMITENTE" : "CARTERA",
        tipoOperacionResuelta: input.tipoOperacionResuelta,
        ticker,
        moneda: input.moneda ?? null,
        cantidad: cantidad.value,
        precio: precio.value,
        montoNetoReferencia: montoNetoReferencia.value,
        fechaConcertacion,
        plazo: input.plazo?.trim() || null,
        fechaVencimiento,
        tasaCaucion: tasaCaucion.value,
        montoCobrarReferencia: montoCobrarReferencia.value,
        montoPagarReferencia: montoPagarReferencia.value,
        erroresJson: bloqueantes.length > 0 ? bloqueantes : undefined,
        camposCorregidosJson: { campos: ["manual"], observaciones: input.observaciones ?? undefined },
        corregidoPorId: userId,
        fingerprint,
        updatedAt: new Date(),
      },
    });
    await recalcularContadoresLote(tx, loteId);
  });

  return { ok: true };
}

// ── Envío a Augusto ────────────────────────────────────────────────────────────

function checkDuplicadosResueltos(
  filas: Array<{ fingerprint: string | null; confirmadoComoDuplicadoDistinto: boolean }>,
): { ok: true } | { ok: false; error: string } {
  const porFingerprint = new Map<string, typeof filas>();
  for (const f of filas) {
    if (!f.fingerprint) continue;
    const arr = porFingerprint.get(f.fingerprint) ?? [];
    arr.push(f);
    porFingerprint.set(f.fingerprint, arr);
  }
  for (const grupo of Array.from(porFingerprint.values())) {
    if (grupo.length > 1 && grupo.some((f) => !f.confirmadoComoDuplicadoDistinto)) {
      return {
        ok: false,
        error: "Hay filas duplicadas sin resolver — marcalas como 'duplicado legítimo' o excluí una.",
      };
    }
  }
  return { ok: true };
}

export interface EnviarLoteResult extends MutationResult {
  totalEnviadas?: number;
}

export async function enviarLoteAAugusto(loteId: string, userId: string): Promise<EnviarLoteResult> {
  const loteRes = await getLoteForMutation(loteId, userId);
  if (!loteRes.ok) return loteRes;

  const filas = await prisma.bolsaImportFila.findMany({ where: { loteId } });
  const activas = filas.filter((f) => f.estado !== "EXCLUIDA");
  if (activas.length === 0) {
    return { ok: false, error: "No hay operaciones para enviar." };
  }
  const sinRevisar = activas.filter((f) => f.estado !== "LISTA");
  if (sinRevisar.length > 0) {
    return { ok: false, error: `${sinRevisar.length} fila(s) sin revisar o con errores bloqueantes.` };
  }
  const dupCheck = checkDuplicadosResueltos(activas);
  if (!dupCheck.ok) return dupCheck;

  // Filas → ENVIADA, lote → EN_VALIDACION y el registro de auditoría viajan en
  // la MISMA transacción: si cualquiera falla, no queda el lote enviado a medias.
  await prisma.$transaction(async (tx) => {
    await tx.bolsaImportFila.updateMany({
      where: { loteId, estado: "LISTA" },
      data: { estado: "ENVIADA", updatedAt: new Date() },
    });
    await tx.bolsaImportLote.update({
      where: { id: loteId },
      data: { estado: "EN_VALIDACION", updatedAt: new Date() },
    });
    await tx.auditLog.create({
      data: {
        id: crypto.randomUUID(),
        userId,
        accion: "LOTE_ENVIADO_VALIDACION",
        entidad: "BolsaImportLote",
        entidadId: loteId,
        datosNuevos: { description: `Lote enviado a validación (${activas.length} operaciones).` },
      },
    });
  });

  return { ok: true, totalEnviadas: activas.length };
}

// ── Datos para la pantalla de revisión ────────────────────────────────────────

export async function getLoteReview(loteId: string) {
  const lote = await prisma.bolsaImportLote.findUnique({
    where: { id: loteId },
    include: {
      Filas: {
        orderBy: [{ numeroBloque: "asc" }, { numeroFila: "asc" }],
        include: {
          ComitenteResuelto: { select: { id: true, nombre: true, nroComitente: true } },
          CarteraResuelta: { select: { id: true, nombre: true } },
        },
      },
    },
  });
  if (!lote) return null;

  const [comitentes, carteras] = await Promise.all([
    prisma.comitenteInversion.findMany({
      where: { activo: true },
      select: { id: true, nombre: true, nroComitente: true },
      orderBy: { nombre: "asc" },
    }),
    prisma.cartera.findMany({
      where: { activa: true },
      select: { id: true, nombre: true },
      orderBy: { nombre: "asc" },
    }),
  ]);

  return { lote, comitentes, carteras };
}
