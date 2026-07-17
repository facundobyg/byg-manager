// Lógica real de carga del Excel de bolsa — deliberadamente NO es "use server".
// Esto la hace inalcanzable como Server Action sin importar qué se exporte
// de acá: solo un archivo con la directiva "use server" puede convertir sus
// exports en endpoints invocables desde el cliente. El único punto de entrada
// gateado para la UI es importarBolsaExcelAction en actions.ts.

import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { parseBolsaExcel } from "@/lib/importers/bolsa-excel/parser";
import type { BolsaExcelBloque, BolsaExcelRawOp } from "@/lib/importers/bolsa-excel/types";
import type { TipoOpBolsa } from "@prisma/client";
import { parseFechaOperativa, isoDateString } from "./fecha-operativa";

const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5 MB

/**
 * Estados de lote sobre los que un reanálisis puede reemplazar filas.
 * EN_VALIDACION, APROBADO, CONFIRMADO (y CONFIRMADO_PARCIAL/RECHAZADO) nunca
 * se sobrescriben — ya salieron de staging o están bajo revisión de Augusto.
 */
export const ESTADOS_REANALIZABLES = new Set(["REVISION_PENDIENTE", "FALLIDO", "DEVUELTO"]);

function sha256(buf: Buffer): string {
  return crypto.createHash("sha256").update(buf).digest("hex");
}

export interface ProcessBolsaResult {
  ok: boolean;
  error?: string;
  estado?: "DUPLICADO" | "FALLIDO" | "REVISION_PENDIENTE";
  loteId?: string;
  archivoId?: string;
  nombreArchivo: string;
  totalFilas: number;
  filasResuelta: number;
  filasConAdvertencia: number;
  filasConError: number;
  archivoExistente?: {
    loteId: string;
    creadoEl: string;
    estadoArchivo?: string;
    /** Estado del LOTE (no del archivo) — determina si se puede "Reanalizar". */
    estadoLote?: string;
    /** true si estadoLote admite reanálisis (REVISION_PENDIENTE/FALLIDO/DEVUELTO). */
    reanalizable?: boolean;
  };
  advertencias?: string[];
}

export interface ComitenteResolucion {
  estado: "RESUELTA" | "ADVERTENCIA" | "ERROR";
  comitenteResueltoId: string | null;
  carteraResueltaId: string | null;
  tipoSujeto: "COMITENTE" | "CARTERA" | null;
  conflictoNombre: boolean;
  errorMsg: string | null;
  /** Mensaje informativo cuando la resolución vino de la coincidencia
   * aproximada por nombre (ver findComitenteByNameFallback) — nunca se
   * pierde silenciosamente que el número no matcheó de forma exacta. */
  warningMsg?: string | null;
}

function normalizeNombre(s: string | null | undefined): string {
  return (s ?? "").trim().toLowerCase().replace(/\s+/g, " ");
}

export function levenshteinDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] : 1 + Math.min(dp[i - 1][j - 1], dp[i - 1][j], dp[i][j - 1]);
    }
  }
  return dp[m][n];
}

interface ComitenteNameCandidate {
  numero: string;
  nombre: string;
  tipoSujeto: "COMITENTE" | "CARTERA";
  comitenteId: string | null;
  carteraId: string | null;
}

/**
 * Último recurso cuando NINGÚN registro (ComitenteInversion ni Cartera)
 * coincide exactamente con el número detectado por OCR — busca, entre TODOS
 * los registros activos de ambas tablas, aquellos cuyo nombre normalizado
 * coincida EXACTAMENTE con el nombre detectado. Solo resuelve si:
 *   - el número detectado tiene al menos 4 dígitos (un número corto tiene
 *     demasiadas coincidencias casuales posibles — nunca se aproxima);
 *   - existe un único candidato con ese nombre (nunca por aproximación si hay
 *     más de uno — ambigüedad real nunca se adivina);
 *   - el número real y el detectado tienen la MISMA longitud de dígitos;
 *   - la distancia de edición entre ambos números es <= 1 (un solo dígito
 *     mal leído por el OCR, nunca una transposición mayor).
 * Nunca hardcodea ningún nombre o número — es un fallback genérico que opera
 * sobre cualquier registro real de la base.
 */
async function findComitenteByNameFallback(
  nroComitenteDetectado: string,
  nombreDetectado: string | null,
): Promise<ComitenteNameCandidate | null> {
  if (nroComitenteDetectado.length < 4) return null;

  const normNombre = normalizeNombre(nombreDetectado);
  if (!normNombre) return null;

  const [comitentes, carteras] = await Promise.all([
    prisma.comitenteInversion.findMany({
      where: { activo: true },
      select: { id: true, nombre: true, nroComitente: true },
    }),
    prisma.cartera.findMany({
      where: { activa: true, comitenteNumber: { not: null } },
      select: { id: true, nombre: true, comitenteNumber: true },
    }),
  ]);

  const candidates: ComitenteNameCandidate[] = [
    ...comitentes
      .filter((c) => normalizeNombre(c.nombre) === normNombre)
      .map((c) => ({
        numero: c.nroComitente,
        nombre: c.nombre,
        tipoSujeto: "COMITENTE" as const,
        comitenteId: c.id,
        carteraId: null,
      })),
    ...carteras
      .filter((c) => normalizeNombre(c.nombre) === normNombre)
      .map((c) => ({
        numero: c.comitenteNumber!,
        nombre: c.nombre,
        tipoSujeto: "CARTERA" as const,
        comitenteId: null,
        carteraId: c.id,
      })),
  ];

  // Nunca resolver por aproximación si hay más de un candidato con ese nombre.
  if (candidates.length !== 1) return null;

  const candidate = candidates[0];
  if (candidate.numero.length !== nroComitenteDetectado.length) return null;
  if (levenshteinDistance(candidate.numero, nroComitenteDetectado) > 1) return null;

  return candidate;
}

// ── Resolución de ticker contra el catálogo real de Activo (E4.6C.2) ───────
//
// Misma fuente exacta que usa el alta manual de operaciones de bolsa
// (src/app/(dashboard)/bolsa/nueva/page.tsx: prisma.activo.findMany() sin
// filtro, más BrokerTickerAlias para variantes de broker) — nunca una lista
// separada ni hardcodeada.

export function normalizeTickerText(raw: string): string {
  return raw
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .trim();
}

export interface TickerResolution {
  ticker: string | null;
  warning: string | null;
}

/**
 * Resuelve un ticker leído por OCR contra el catálogo real, en orden de
 * confianza decreciente — nunca adivina si el resultado es ambiguo:
 *   1. coincidencia exacta (normalizada) contra el catálogo;
 *   2. alias existente (BrokerTickerAlias u otro alias operativo) que
 *      apunte a un ticker del catálogo;
 *   3. sufijo "D" (variante dólar/MEP de un ticker ya listado — convención
 *      real y ya usada en el catálogo, p.ej. GGAL/GGALD, AAPL/AAPLD) cuando
 *      la base sin la "D" existe;
 *   4. distancia de edición pequeña (<=1) contra el catálogo, solo si hay
 *      un único candidato — más de un candidato nunca se resuelve.
 * Cada candidato de OCR (múltiples lecturas del mismo recorte) se prueba en
 * todos los niveles antes de pasar al siguiente.
 */
export function resolveTickerAgainstCatalog(
  rawCandidates: Array<string | null | undefined>,
  catalog: string[],
  aliases: Record<string, string> = {},
): TickerResolution {
  const catalogSet = new Set(catalog.map(normalizeTickerText));
  const aliasMap = new Map(
    Object.entries(aliases).map(([k, v]) => [normalizeTickerText(k), normalizeTickerText(v)]),
  );
  const candidates = Array.from(
    new Set(rawCandidates.filter((c): c is string => !!c && c.trim().length > 0).map(normalizeTickerText)),
  ).filter(Boolean);

  if (candidates.length === 0) return { ticker: null, warning: null };

  // 1. Coincidencia exacta.
  for (const cand of candidates) {
    if (catalogSet.has(cand)) return { ticker: cand, warning: null };
  }

  // 2. Alias existente.
  for (const cand of candidates) {
    const target = aliasMap.get(cand);
    if (target && catalogSet.has(target)) {
      return {
        ticker: target,
        warning: `Ticker detectado ${cand}; asociado a ${target} por alias. Requiere revisión.`,
      };
    }
  }

  // 3. Sufijo "D" (variante dólar/MEP) de un ticker base ya listado.
  for (const cand of candidates) {
    if (cand.endsWith("D") && cand.length > 1) {
      const base = cand.slice(0, -1);
      if (catalogSet.has(base)) {
        return {
          ticker: cand,
          warning: `Ticker detectado ${cand}; variante dólar/MEP de ${base} (aún no está en el catálogo). Requiere revisión.`,
        };
      }
    }
  }

  // 4. Distancia de edición pequeña — solo si hay un único candidato en TODO el catálogo.
  const fuzzy = new Set<string>();
  let bestSourceCand = candidates[0];
  for (const cand of candidates) {
    for (const catTicker of Array.from(catalogSet)) {
      if (Math.abs(cand.length - catTicker.length) <= 1 && levenshteinDistance(cand, catTicker) <= 1) {
        fuzzy.add(catTicker);
        bestSourceCand = cand;
      }
    }
  }
  if (fuzzy.size === 1) {
    const match = Array.from(fuzzy)[0];
    return {
      ticker: match,
      warning: `Ticker detectado ${bestSourceCand}; asociado a ${match}. Requiere revisión.`,
    };
  }

  // Ambiguo (0 o >1 candidatos) — nunca se elige arbitrariamente.
  return { ticker: null, warning: null };
}

// ── Coherencia cantidad × precio ≈ monto neto (E4.6C.3 — rechazo, nunca corrección) ─
//
// E4.6C.2 intentaba RE-DERIVAR la cantidad desde precio×monto cuando eran
// incoherentes. E4.6C.3 revierte esa idea explícitamente: "no considerar un
// valor confiable solo porque cantidad × precio coincide con un monto que
// también puede estar mal leído" — precio y monto pueden estar TAN
// corruptos como cantidad, así que inventar un reemplazo a partir de ellos
// no es más seguro que la lectura original. Esta función SOLO puede anular
// la cantidad y devolver un error — nunca la reemplaza por otro valor.

const COHERENCE_TOLERANCE = { min: 0.5, max: 2 };

/**
 * Cantidad × precio debe ser razonablemente coherente con el monto neto
 * (tolerancia amplia por gastos/comisiones). Si no lo es, la cantidad se
 * considera no confiable — nunca se reemplaza por un valor derivado.
 */
export function checkCantidadCoherence(
  cantidad: string | null,
  precio: string | null,
  montoNeto: string | null,
  tolerance = COHERENCE_TOLERANCE,
): { error: string | null } {
  if (cantidad === null || precio === null || montoNeto === null) return { error: null };

  const cantidadNum = Number(cantidad);
  const precioNum = Number(precio);
  const montoNum = Number(montoNeto);

  if (
    !Number.isFinite(cantidadNum) ||
    !Number.isFinite(precioNum) ||
    !Number.isFinite(montoNum) ||
    precioNum <= 0 ||
    montoNum <= 0
  ) {
    return { error: null };
  }

  const ratio = (cantidadNum * precioNum) / montoNum;
  if (ratio >= tolerance.min && ratio <= tolerance.max) return { error: null };

  return { error: "Cantidad no confiable." };
}

/**
 * Para CAUCION_COLOCADORA/TOMADORA: el monto a cobrar/pagar (principal +
 * interés del plazo) siempre debe ser MAYOR O IGUAL al principal — nunca
 * menor — y la diferencia entre ambos nunca debería ser de orden de
 * magnitud (una caución real rinde intereses de corto plazo, no duplica ni
 * multiplica el capital). Nunca infiere el principal desde el monto a
 * cobrar — solo anula el principal con error cuando la relación es
 * imposible.
 */
export function checkCaucionPrincipalCoherence(
  principal: string | null,
  montoCobrarOPagar: string | null,
  maxRatio = 2,
): { error: string | null } {
  if (principal === null || montoCobrarOPagar === null) return { error: null };

  const principalNum = Number(principal);
  const montoNum = Number(montoCobrarOPagar);

  if (!Number.isFinite(principalNum) || !Number.isFinite(montoNum) || principalNum <= 0 || montoNum <= 0) {
    return { error: null };
  }

  if (montoNum < principalNum) {
    return { error: "Principal no confiable: el monto a cobrar/pagar es menor al principal." };
  }

  const ratio = montoNum / principalNum;
  if (ratio > maxRatio) {
    return { error: "Principal no confiable: diferencia de magnitud frente al monto a cobrar/pagar." };
  }

  return { error: null };
}

export async function resolveComitente(
  nroComitenteDetectado: string | null,
  nombreDetectado: string | null,
): Promise<ComitenteResolucion> {
  const errorBase: ComitenteResolucion = {
    estado: "ERROR",
    comitenteResueltoId: null,
    carteraResueltaId: null,
    tipoSujeto: null,
    conflictoNombre: false,
    errorMsg: null,
  };

  if (!nroComitenteDetectado) {
    return { ...errorBase, errorMsg: "Sin número de comitente detectado." };
  }

  const matches = await prisma.comitenteInversion.findMany({
    where: { nroComitente: nroComitenteDetectado, activo: true },
    select: { id: true, nombre: true, esPropioBYG: true, carteraId: true },
  });

  let resolved: (typeof matches)[0] | null = null;

  if (matches.length === 1) {
    resolved = matches[0];
  } else if (matches.length > 1) {
    // Desambiguar por nombre
    const normNombre = normalizeNombre(nombreDetectado);
    const byName = matches.filter((m) => normalizeNombre(m.nombre) === normNombre);
    if (byName.length === 1) {
      resolved = byName[0];
    } else {
      return {
        ...errorBase,
        errorMsg: `Comitente ambiguo: ${matches.length} registros activos con nroComitente=${nroComitenteDetectado}`,
      };
    }
  }

  if (!resolved) {
    // Ningún cliente/comitente normal con ese número — puede ser una cartera
    // propia registrada con ese mismo número de comitente en Banco Industrial
    // (Cartera.comitenteNumber, usado para el espejo en cuentas de inversión).
    const carteras = await prisma.cartera.findMany({
      where: { comitenteNumber: nroComitenteDetectado, activa: true },
      select: { id: true, nombre: true },
    });
    if (carteras.length === 1) {
      const cartera = carteras[0];
      return {
        estado: normalizeNombre(cartera.nombre) !== normalizeNombre(nombreDetectado) ? "ADVERTENCIA" : "RESUELTA",
        comitenteResueltoId: null,
        carteraResueltaId: cartera.id,
        tipoSujeto: "CARTERA",
        conflictoNombre: normalizeNombre(cartera.nombre) !== normalizeNombre(nombreDetectado),
        errorMsg: null,
      };
    }
    if (carteras.length > 1) {
      return {
        ...errorBase,
        errorMsg: `Cartera ambigua: ${carteras.length} registros con comitenteNumber=${nroComitenteDetectado}`,
      };
    }

    // Último recurso: ningún número coincide exactamente — buscar un único
    // candidato por nombre exacto cuyo número real difiera del detectado por
    // a lo sumo 1 dígito (mismo largo). Nunca se resuelve así si hay más de
    // un candidato o la diferencia es mayor — queda en ADVERTENCIA, no LISTA,
    // hasta revisión explícita.
    const fallback = await findComitenteByNameFallback(nroComitenteDetectado, nombreDetectado);
    if (fallback) {
      return {
        estado: "ADVERTENCIA",
        comitenteResueltoId: fallback.comitenteId,
        carteraResueltaId: fallback.carteraId,
        tipoSujeto: fallback.tipoSujeto,
        conflictoNombre: false,
        errorMsg: null,
        warningMsg: `Número detectado ${nroComitenteDetectado}; asociado a ${fallback.nombre} / ${fallback.numero} por coincidencia de nombre. Requiere revisión.`,
      };
    }

    return { ...errorBase, errorMsg: `Comitente no encontrado: nro ${nroComitenteDetectado}` };
  }

  const conflictoNombre = normalizeNombre(resolved.nombre) !== normalizeNombre(nombreDetectado);

  // Resolver como CARTERA si esPropioBYG=true O si tiene carteraId asignado
  if (resolved.esPropioBYG || resolved.carteraId !== null) {
    if (!resolved.carteraId) {
      // esPropioBYG=true pero carteraId no asignado: error de configuración
      return {
        ...errorBase,
        errorMsg: `Comitente ${nroComitenteDetectado} marcado como propio BYG pero sin carteraId asignado.`,
      };
    }
    return {
      estado: conflictoNombre ? "ADVERTENCIA" : "RESUELTA",
      comitenteResueltoId: null,
      carteraResueltaId: resolved.carteraId,
      tipoSujeto: "CARTERA",
      conflictoNombre,
      errorMsg: null,
    };
  }

  return {
    estado: conflictoNombre ? "ADVERTENCIA" : "RESUELTA",
    comitenteResueltoId: resolved.id,
    carteraResueltaId: null,
    tipoSujeto: "COMITENTE",
    conflictoNombre,
    errorMsg: null,
  };
}

function mapOpBase(op: BolsaExcelRawOp): TipoOpBolsa | null {
  if (op.operacionBase === "CAUCION_COLOCADORA") return "CAUCION_COLOCADORA";
  if (op.operacionBase === "CAUCION_TOMADORA") return "CAUCION_TOMADORA";
  return null;
}

function computeFingerprint(op: BolsaExcelRawOp, bloque: BolsaExcelBloque): string {
  const parts = [
    bloque.nroComitenteDetectado ?? "",
    op.fechaConcertacion ?? "",
    op.rawOperacion,
    op.ticker ?? "",
    op.cantidad ?? "",
    op.precio ?? "",
  ];
  return crypto.createHash("sha256").update(parts.join("|")).digest("hex").slice(0, 32);
}

type FilaDataExcel = {
  op: BolsaExcelRawOp;
  bloque: BolsaExcelBloque;
  resolucion: ComitenteResolucion;
  estado: "RESUELTA" | "ADVERTENCIA" | "ERROR";
  allErrors: string[];
  allWarnings: string[];
};

/** Resuelve comitentes y prepara las filas — usado por el alta normal y el reanálisis. */
async function buildFilaDataExcel(
  parseResult: ReturnType<typeof parseBolsaExcel>,
  fechaOperativaISO: string,
): Promise<FilaDataExcel[]> {
  const filaData: FilaDataExcel[] = [];
  for (const bloque of parseResult.bloques) {
    const resolucion = await resolveComitente(bloque.nroComitenteDetectado, bloque.nombreDetectado);
    for (const op of bloque.operaciones) {
      // La fecha operativa del lote reemplaza la fechaConcertacion de cada fila,
      // así que "Fecha no detectada" del parser deja de ser un error real.
      const allErrors = op.errors.filter((e) => e !== "Fecha no detectada.");
      const allWarnings = [...op.warnings];
      if (op.fechaConcertacion && op.fechaConcertacion !== fechaOperativaISO) {
        allWarnings.push(
          `Fecha detectada (${op.fechaConcertacion}) difiere de la fecha operativa seleccionada (${fechaOperativaISO}).`,
        );
      }
      if (resolucion.errorMsg) allErrors.push(resolucion.errorMsg);
      if (resolucion.warningMsg) allWarnings.push(resolucion.warningMsg);

      let estado: "RESUELTA" | "ADVERTENCIA" | "ERROR";
      if (allErrors.length > 0 || resolucion.estado === "ERROR") {
        estado = "ERROR";
      } else if (allWarnings.length > 0 || resolucion.estado === "ADVERTENCIA") {
        estado = "ADVERTENCIA";
      } else {
        estado = "RESUELTA";
      }

      filaData.push({ op, bloque, resolucion, estado, allErrors, allWarnings });
    }
  }
  return filaData;
}

function filaCreateDataExcel(f: FilaDataExcel, loteId: string, archivoId: string, fechaOperativa: Date) {
  const { op, bloque, resolucion, estado, allErrors, allWarnings } = f;
  return {
    id: crypto.randomUUID(),
    loteId,
    archivoId,
    estado,
    numeroBloque: bloque.numeroBloque,
    numeroFila: op.numeroFila,
    rawJson: op as object,
    nombreDetectado: bloque.nombreDetectado ?? undefined,
    nroComitenteDetectado: bloque.nroComitenteDetectado ?? undefined,
    tipoOperacionDetectada: op.rawOperacion || undefined,
    comitenteResueltoId: resolucion.comitenteResueltoId ?? undefined,
    carteraResueltaId: resolucion.carteraResueltaId ?? undefined,
    tipoSujeto: resolucion.tipoSujeto ?? undefined,
    conflictoNombre: resolucion.conflictoNombre,
    tipoOperacionResuelta: mapOpBase(op) ?? undefined,
    ticker: op.ticker ?? undefined,
    instrumento: op.instrumentoHint ?? undefined,
    moneda: (op.monedaDetectada as "ARS" | "USD" | null) ?? undefined,
    cantidad: op.cantidad ?? undefined,
    precio: op.precio ?? undefined,
    montoNetoReferencia: op.montoNetoReferencia ?? undefined,
    // La fila siempre usa la fecha operativa del lote, no la detectada por
    // el parser — esa queda solo en rawJson como referencia.
    fechaConcertacion: fechaOperativa,
    plazo: op.plazoNormalizado ?? op.plazo ?? undefined,
    fechaVencimiento: op.fechaVencimiento ? new Date(op.fechaVencimiento) : undefined,
    tasaCaucion: op.tasaCaucion ?? undefined,
    montoCobrarReferencia: op.montoCobrarReferencia ?? undefined,
    montoPagarReferencia: op.montoPagarReferencia ?? undefined,
    erroresJson: allErrors.length > 0 ? allErrors : undefined,
    warningsJson: allWarnings.length > 0 ? allWarnings : undefined,
    fingerprint: computeFingerprint(op, bloque),
    updatedAt: new Date(),
  };
}

/**
 * Reanaliza un archivo Excel ya existente (mismo hash de contenido):
 * reemplaza sus filas de staging con un nuevo parseo, en una única
 * transacción. Nunca sobrescribe un lote EN_VALIDACION/APROBADO/CONFIRMADO,
 * y solo el creador del lote o un ADMIN pueden reanalizarlo.
 */
async function reanalizarArchivoExcel(
  archivoExistente: { id: string; loteId: string },
  buf: Buffer,
  file: File,
  fechaOperativa: Date,
  hash: string,
  userId: string,
): Promise<ProcessBolsaResult> {
  const baseResult = {
    nombreArchivo: file.name,
    totalFilas: 0,
    filasResuelta: 0,
    filasConAdvertencia: 0,
    filasConError: 0,
  };

  const lote = await prisma.bolsaImportLote.findUnique({ where: { id: archivoExistente.loteId } });
  if (!lote) return { ok: false, error: "Lote no encontrado.", ...baseResult };

  if (lote.creadoPorId !== userId) {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
    if (user?.role !== "ADMIN") {
      return { ok: false, error: "No tenés permisos para reanalizar este lote.", ...baseResult };
    }
  }
  if (!ESTADOS_REANALIZABLES.has(lote.estado)) {
    return {
      ok: false,
      error: `El lote está en estado ${lote.estado} y no admite reanálisis.`,
      ...baseResult,
    };
  }

  let parseResult: ReturnType<typeof parseBolsaExcel>;
  try {
    parseResult = parseBolsaExcel(buf);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error desconocido en el parser.";
    return { ok: false, error: `Error al leer el archivo: ${msg}`, ...baseResult };
  }

  const fechaOperativaISO = isoDateString(fechaOperativa);
  const filaData = await buildFilaDataExcel(parseResult, fechaOperativaISO);

  try {
    await prisma.$transaction(async (tx) => {
      await tx.bolsaImportFila.deleteMany({ where: { archivoId: archivoExistente.id } });

      await tx.bolsaImportArchivo.update({
        where: { id: archivoExistente.id },
        data: {
          nombreOriginal: file.name,
          tamano: file.size,
          fileHashSha256: hash,
          estado: "LISTO",
          hojaDetectada: parseResult.hojaProceada,
          rawJson: parseResult as object,
          warningsJson: parseResult.warningsGlobales.length > 0 ? parseResult.warningsGlobales : undefined,
          errorMessage: parseResult.erroresGlobales.length > 0 ? parseResult.erroresGlobales.join("; ") : null,
          totalFilas: filaData.length,
          updatedAt: new Date(),
        },
      });

      for (const f of filaData) {
        await tx.bolsaImportFila.create({
          data: filaCreateDataExcel(f, lote.id, archivoExistente.id, fechaOperativa),
        });
      }

      const todasLasFilas = await tx.bolsaImportFila.findMany({
        where: { loteId: lote.id },
        select: { estado: true },
      });
      await tx.bolsaImportLote.update({
        where: { id: lote.id },
        data: {
          estado: "REVISION_PENDIENTE",
          fechaOperativa,
          totalFilas: todasLasFilas.length,
          filasConAdvertencia: todasLasFilas.filter((f) => f.estado === "ADVERTENCIA").length,
          filasConError: todasLasFilas.filter((f) => f.estado === "ERROR").length,
          filasExcluidas: todasLasFilas.filter((f) => f.estado === "EXCLUIDA").length,
          filasListas: todasLasFilas.filter((f) => f.estado === "LISTA").length,
          updatedAt: new Date(),
        },
      });

      await tx.auditLog.create({
        data: {
          id: crypto.randomUUID(),
          userId,
          accion: "LOTE_REANALIZADO",
          entidad: "BolsaImportLote",
          entidadId: lote.id,
          datosNuevos: { description: `Archivo reanalizado (${filaData.length} filas nuevas).` },
        },
      });
    });
  } catch (e) {
    console.error("[reanalizarArchivoExcel] Error inesperado:", e);
    return { ok: false, error: "No se pudo reanalizar el archivo.", ...baseResult };
  }

  return {
    ok: true,
    estado: "REVISION_PENDIENTE",
    loteId: lote.id,
    archivoId: archivoExistente.id,
    nombreArchivo: file.name,
    totalFilas: filaData.length,
    filasResuelta: filaData.filter((f) => f.estado === "RESUELTA").length,
    filasConAdvertencia: filaData.filter((f) => f.estado === "ADVERTENCIA").length,
    filasConError: filaData.filter((f) => f.estado === "ERROR").length,
  };
}

export async function processBolsaExcelUpload(
  formData: FormData,
  userId: string,
): Promise<ProcessBolsaResult> {
  const file = formData.get("file");
  const nombreArchivo = file instanceof File ? file.name : "";

  const baseResult = {
    nombreArchivo,
    totalFilas: 0,
    filasResuelta: 0,
    filasConAdvertencia: 0,
    filasConError: 0,
  };

  // ── Validación del archivo ────────────────────────────────────────────────────
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "No se adjuntó ningún archivo.", ...baseResult };
  }
  if (!file.name.toLowerCase().endsWith(".xlsx")) {
    return { ok: false, error: `"${file.name}" no es un .xlsx — solo se aceptan archivos Excel .xlsx.`, ...baseResult };
  }
  if (file.size > MAX_FILE_BYTES) {
    return { ok: false, error: `El archivo supera los 5 MB permitidos.`, ...baseResult };
  }

  // ── Fecha operativa del lote (obligatoria) ────────────────────────────────────
  const fechaOperativa = parseFechaOperativa(formData.get("fechaOperativa"));
  if (!fechaOperativa) {
    return {
      ok: false,
      error: "La fecha de operaciones es obligatoria y debe tener formato válido (YYYY-MM-DD).",
      ...baseResult,
    };
  }
  const fechaOperativaISO = isoDateString(fechaOperativa);

  const buf = Buffer.from(await file.arrayBuffer());

  // ── Deduplicación SHA-256 ─────────────────────────────────────────────────────
  const hash = sha256(buf);
  const existing = await prisma.bolsaImportArchivo.findUnique({ where: { fileHashSha256: hash } });
  if (existing) {
    const loteExistente = await prisma.bolsaImportLote.findUnique({ where: { id: existing.loteId } });
    const reanalizable = !!loteExistente && ESTADOS_REANALIZABLES.has(loteExistente.estado);
    const reanalizar = formData.get("reanalizar") === "true";

    if (reanalizar && reanalizable) {
      return reanalizarArchivoExcel(existing, buf, file, fechaOperativa, hash, userId);
    }

    // Siempre devolvemos DUPLICADO (sin crear un segundo lote), pero incluimos
    // estadoArchivo para que la UI pueda diferenciar LISTO de ERROR/FALLIDO.
    return {
      ok: true,
      estado: "DUPLICADO",
      loteId: existing.loteId,
      archivoId: existing.id,
      ...baseResult,
      archivoExistente: {
        loteId: existing.loteId,
        creadoEl: existing.createdAt.toISOString(),
        estadoArchivo: existing.estado as string,
        estadoLote: loteExistente?.estado,
        reanalizable,
      },
    };
  }

  // ── Parseo del Excel ──────────────────────────────────────────────────────────
  let parseResult: ReturnType<typeof parseBolsaExcel>;
  try {
    parseResult = parseBolsaExcel(buf);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error desconocido en el parser.";

    // Parser crash → intentar registrar FALLIDO lote + ERROR archivo
    let fallbackLoteId: string | undefined;
    let fallbackArchivoId: string | undefined;
    try {
      const fallback = await prisma.$transaction(async (tx) => {
        const lote = await tx.bolsaImportLote.create({
          data: {
            id: crypto.randomUUID(),
            estado: "FALLIDO",
            origen: "EXCEL",
            fechaOperativa,
            creadoPorId: userId,
            updatedAt: new Date(),
          },
        });
        const archivo = await tx.bolsaImportArchivo.create({
          data: {
            id: crypto.randomUUID(),
            loteId: lote.id,
            nombreOriginal: file.name,
            mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            tamano: file.size,
            fileHashSha256: hash,
            estado: "ERROR",
            origen: "EXCEL",
            errorMessage: msg,
            updatedAt: new Date(),
          },
        });
        return { lote, archivo };
      });
      fallbackLoteId = fallback.lote.id;
      fallbackArchivoId = fallback.archivo.id;
    } catch {
      // best-effort; no enmascarar el error del parser
    }

    return {
      ok: false,
      error: `Error al leer el archivo: ${msg}`,
      estado: "FALLIDO",
      loteId: fallbackLoteId,
      archivoId: fallbackArchivoId,
      ...baseResult,
    };
  }

  // ── Resolución de comitentes y preparación de filas ───────────────────────────
  const filaData = await buildFilaDataExcel(parseResult, fechaOperativaISO);
  const totalFilas = filaData.length;
  const filasConError = filaData.filter((f) => f.estado === "ERROR").length;
  const filasConAdvertencia = filaData.filter((f) => f.estado === "ADVERTENCIA").length;
  const filasResuelta = totalFilas - filasConError - filasConAdvertencia;

  // ── Transacción: lote + archivo + filas ───────────────────────────────────────
  let loteId: string;
  let archivoId: string;
  try {
    const created = await prisma.$transaction(async (tx) => {
      const lote = await tx.bolsaImportLote.create({
        data: {
          id: crypto.randomUUID(),
          estado: "REVISION_PENDIENTE",
          origen: "EXCEL",
          fechaOperativa,
          creadoPorId: userId,
          totalFilas,
          filasConAdvertencia,
          filasConError,
          updatedAt: new Date(),
        },
      });

      const archivo = await tx.bolsaImportArchivo.create({
        data: {
          id: crypto.randomUUID(),
          loteId: lote.id,
          nombreOriginal: file.name,
          mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          tamano: file.size,
          fileHashSha256: hash,
          estado: "LISTO",
          origen: "EXCEL",
          hojaDetectada: parseResult.hojaProceada,
          rawJson: parseResult as object,
          warningsJson: parseResult.warningsGlobales.length > 0 ? parseResult.warningsGlobales : undefined,
          errorMessage: parseResult.erroresGlobales.length > 0 ? parseResult.erroresGlobales.join("; ") : null,
          totalFilas,
          updatedAt: new Date(),
        },
      });

      for (const f of filaData) {
        await tx.bolsaImportFila.create({
          data: filaCreateDataExcel(f, lote.id, archivo.id, fechaOperativa),
        });
      }

      return { lote, archivo };
    });

    loteId = created.lote.id;
    archivoId = created.archivo.id;
  } catch (e) {
    // Race en unique hash → retornar DUPLICADO
    if (e instanceof Error && "code" in e && (e as { code: string }).code === "P2002") {
      const existing2 = await prisma.bolsaImportArchivo.findUnique({ where: { fileHashSha256: hash } });
      return {
        ok: true,
        estado: "DUPLICADO",
        loteId: existing2?.loteId,
        archivoId: existing2?.id,
        ...baseResult,
        archivoExistente: existing2
          ? { loteId: existing2.loteId, creadoEl: existing2.createdAt.toISOString() }
          : undefined,
      };
    }
    const msg = e instanceof Error ? e.message : "Error desconocido.";
    return { ok: false, error: `Error al guardar: ${msg}`, ...baseResult };
  }

  return {
    ok: true,
    estado: "REVISION_PENDIENTE",
    loteId,
    archivoId,
    nombreArchivo,
    totalFilas,
    filasResuelta,
    filasConAdvertencia,
    filasConError,
  };
}
