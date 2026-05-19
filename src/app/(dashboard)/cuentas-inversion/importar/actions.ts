"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { Decimal } from "@prisma/client/runtime/library";
import { CategoriaHoldingInversion } from "@prisma/client";
import * as XLSX from "xlsx";

// ── Shared types (must be JSON-serialisable) ──────────────────────────────────

export type ParsedRow = {
  nroComitente: string;
  nombre: string;
  ticker: string;
  descripcion: string;
  categoria: CategoriaHoldingInversion;
  cantidad: number;
  precio: number;
  moneda: string;
  exists: boolean;
  comitenteId: string | null;
};

export type ParseState = {
  rows?: ParsedRow[];
  cuentaId?: string;
  filename?: string;
  error?: string;
};

export type ImportState = {
  created?: number;
  updated?: number;
  skipped?: number;
  newComitentes?: number;
  errors?: string[];
  done?: boolean;
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function norm(s: unknown): string {
  return String(s ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

function findCol(headers: unknown[], ...candidates: string[]): number {
  const nh = headers.map(norm);
  for (const c of candidates) {
    const nc = norm(c);
    const idx = nh.findIndex((h) => h.includes(nc));
    if (idx !== -1) return idx;
  }
  return -1;
}

function inferCategoria(ticker: string, desc: string, tipo?: string): CategoriaHoldingInversion {
  const s = [ticker, desc, tipo ?? ""].join(" ").toUpperCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  if (/CAUCION|CAUC/.test(s)) return "CAUCION";
  if (/\bFCI\b|FONDO COMUN|CUOTAPARTE|CUOTA PARTE/.test(s)) return "FCI";
  if (/OBLIGACION NEGOCIABLE|OBLIGACIONES NEGOCIABLES|\bON\b|CORP BOND/.test(s)) return "ON";
  if (/CEDEAR|GDR|ADR|AMERICAN DEPOSITARY/.test(s)) return "CEDEAR";
  if (/^(AL|GD|TX|PR|TY|TC|BPY|DICP|PARA|AE|AA|GJ|TL|TM|TB|BJ|PAR|DISC|LEDE|LECER|LEDES)\d/.test(ticker.toUpperCase())
    || /\bBONO\b|SOBERANO|TREASURY|LETRA/.test(s)) return "BONO";
  return "ACCION";
}

function toNum(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(String(v).replace(/[^0-9.\-]/g, ""));
  return isNaN(n) ? null : n;
}

function toStr(v: unknown): string {
  return String(v ?? "").trim();
}

// ── Parse action ──────────────────────────────────────────────────────────────

export async function parseXlsxAction(
  _: ParseState | null,
  formData: FormData,
): Promise<ParseState> {
  const cuentaId = formData.get("cuentaId")?.toString().trim();
  const file     = formData.get("file") as File | null;

  if (!cuentaId) return { error: "Seleccioná una cuenta de inversión" };
  if (!file || file.size === 0) return { error: "Adjuntá un archivo .xlsx" };
  if (!file.name.match(/\.xlsx?$/i)) return { error: "Solo se aceptan archivos .xlsx" };

  const buffer   = Buffer.from(await file.arrayBuffer());
  const workbook = XLSX.read(buffer, { type: "buffer", cellDates: true });
  const sheet    = workbook.Sheets[workbook.SheetNames[0]];
  const raw: unknown[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });

  // Find header row (first with ≥ 4 non-empty cells)
  let headerIdx = 0;
  for (let i = 0; i < Math.min(raw.length, 25); i++) {
    if ((raw[i] as unknown[]).filter((c) => toStr(c).length > 0).length >= 4) {
      headerIdx = i;
      break;
    }
  }

  const headers = raw[headerIdx] as unknown[];
  const cols = {
    nro:  findCol(headers, "comitente", "nrocuenta", "cuenta", "nro", "numero"),
    nom:  findCol(headers, "nombre", "razonsocial", "cliente", "denominacion"),
    tick: findCol(headers, "ticker", "especie", "simbolo", "instrumento", "codigo"),
    desc: findCol(headers, "descripcion", "denominacionespecie", "denominacion", "descripcionespecie", "denominacion"),
    tipo: findCol(headers, "tipo", "tipoinstrumento", "clase", "categoria"),
    cant: findCol(headers, "cantidad", "cant", "tenencia", "qty", "unidades", "saldo"),
    prec: findCol(headers, "precio", "cotizacion", "valorunitario", "valorunit", "preciocierre"),
    mon:  findCol(headers, "moneda", "currency", "divisa"),
  };

  const dataRows = raw.slice(headerIdx + 1).filter((r) => {
    const row = r as unknown[];
    return row.some((c) => toStr(c).length > 0);
  });

  const parsed: Omit<ParsedRow, "exists" | "comitenteId">[] = [];

  for (const row of dataRows) {
    const r = row as unknown[];
    const nro   = cols.nro  >= 0 ? toStr(r[cols.nro])  : "";
    const nom   = cols.nom  >= 0 ? toStr(r[cols.nom])  : "";
    const tick  = cols.tick >= 0 ? toStr(r[cols.tick]).toUpperCase() : "";
    const desc  = cols.desc >= 0 ? toStr(r[cols.desc]) : "";
    const tipo  = cols.tipo >= 0 ? toStr(r[cols.tipo]) : "";
    const cant  = cols.cant >= 0 ? toNum(r[cols.cant])  : null;
    const prec  = cols.prec >= 0 ? toNum(r[cols.prec])  : null;
    const mon   = cols.mon  >= 0 ? toStr(r[cols.mon]).toUpperCase() : "USD";

    if (!tick || cant === null || cant <= 0) continue;

    parsed.push({
      nroComitente: nro || "S/N",
      nombre:       nom || "Sin nombre",
      ticker:       tick,
      descripcion:  desc,
      categoria:    inferCategoria(tick, desc, tipo),
      cantidad:     cant,
      precio:       prec ?? 0,
      moneda:       mon || "USD",
    });
  }

  if (parsed.length === 0) return { error: "No se encontraron filas válidas en el archivo" };

  // Check existence in DB
  const nros = Array.from(new Set(parsed.map((r) => r.nroComitente)));
  const existing = await prisma.comitenteInversion.findMany({
    where: { cuentaInversionId: cuentaId, nroComitente: { in: nros } },
    select: { id: true, nroComitente: true, esPropioBYG: true, carteraId: true },
  });
  const existMap = new Map(existing.map((e) => [e.nroComitente, e.id]));

  const rows: ParsedRow[] = parsed.map((r) => ({
    ...r,
    exists:      existMap.has(r.nroComitente),
    comitenteId: existMap.get(r.nroComitente) ?? null,
  }));

  return { rows, cuentaId, filename: file.name };
}

// ── Import action ─────────────────────────────────────────────────────────────

export async function importHoldingsAction(
  _: ImportState | null,
  formData: FormData,
): Promise<ImportState> {
  const cuentaId  = formData.get("cuentaId")?.toString().trim();
  const rowsJson  = formData.get("rows")?.toString();
  const createNew = formData.get("createNew") === "1";
  const filename  = formData.get("filename")?.toString() ?? "importacion.xlsx";

  if (!cuentaId || !rowsJson) return { errors: ["Datos incompletos"] };

  let rows: ParsedRow[];
  try { rows = JSON.parse(rowsJson); } catch { return { errors: ["JSON inválido"] }; }

  const errors: string[] = [];
  let created = 0, updated = 0, skipped = 0, newComitentes = 0;

  // Build comitente map (existing)
  const existingComitentes = await prisma.comitenteInversion.findMany({
    where: { cuentaInversionId: cuentaId },
    select: { id: true, nroComitente: true, esPropioBYG: true, carteraId: true },
  });
  const comitenteMap = new Map(existingComitentes.map((c) => [c.nroComitente, c]));
  const comitenteIdMap = new Map(existingComitentes.map((c) => [c.nroComitente, c.id]));

  // Group rows by nroComitente to create comitentes first
  const byComitente = new Map<string, ParsedRow[]>();
  for (const r of rows) {
    if (!byComitente.has(r.nroComitente)) byComitente.set(r.nroComitente, []);
    byComitente.get(r.nroComitente)!.push(r);
  }

  for (const [nro, grupo] of Array.from(byComitente.entries())) {
    // Block import for mirrored (esPropioBYG + carteraId) comitentes
    const existing = comitenteMap.get(nro);
    if (existing?.esPropioBYG && existing.carteraId) {
      errors.push(`Comitente ${nro} es espejo de cartera — importar no permitido`);
      skipped += grupo.length;
      continue;
    }

    let comitenteId = comitenteIdMap.get(nro);

    if (!comitenteId) {
      if (!createNew) { skipped += grupo.length; continue; }
      try {
        const nom = grupo[0].nombre;
        const c = await prisma.comitenteInversion.create({
          data: {
            id:                crypto.randomUUID(),
            cuentaInversionId: cuentaId,
            nroComitente:      nro,
            nombre:            nom,
            productor:         "BYG",
            activo:            true,
            updatedAt:         new Date(),
          },
        });
        await prisma.saldoComitenteInversion.create({
          data: { id: crypto.randomUUID(), comitenteId: c.id, saldoARS: new Decimal(0), saldoUSDCable: new Decimal(0), saldoUSDMep: new Decimal(0), updatedAt: new Date() },
        });
        comitenteId = c.id;
        comitenteIdMap.set(nro, comitenteId);
        newComitentes++;
      } catch (e) {
        errors.push(`Error creando comitente ${nro}: ${String(e)}`);
        skipped += grupo.length;
        continue;
      }
    }

    for (const row of grupo) {
      try {
        const existing = await prisma.holdingComitenteInversion.findUnique({
          where: { comitenteId_ticker: { comitenteId: comitenteId!, ticker: row.ticker } },
        });

        if (existing) {
          // Update precioActual only — quantity/cost managed via Comprar/Vender
          await prisma.holdingComitenteInversion.update({
            where: { id: existing.id },
            data:  { precioActual: row.precio > 0 ? new Decimal(row.precio) : null },
          });
          updated++;
        } else {
          await prisma.holdingComitenteInversion.create({
            data: {
              id:            crypto.randomUUID(),
              comitenteId:   comitenteId!,
              ticker:        row.ticker,
              descripcion:   row.descripcion || null,
              categoria:     row.categoria as CategoriaHoldingInversion,
              cantidad:      new Decimal(row.cantidad),
              precioPromedio: row.precio > 0 ? new Decimal(row.precio) : new Decimal(0),
              precioActual:  row.precio > 0 ? new Decimal(row.precio) : null,
              updatedAt:     new Date(),
            },
          });
          created++;
        }
      } catch (e) {
        errors.push(`${row.ticker} (${nro}): ${String(e)}`);
        skipped++;
      }
    }
  }

  // Log import history
  await prisma.importacionHolding.create({
    data: {
      id:              crypto.randomUUID(),
      cuentaId,
      nombreArchivo:   filename,
      filasTotal:      rows.length,
      filasImportadas: created + updated,
    },
  });

  revalidatePath("/cuentas-inversion", "layout");
  return { created, updated, skipped, newComitentes, errors: errors.slice(0, 10), done: true };
}
