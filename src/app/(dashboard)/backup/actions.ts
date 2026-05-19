"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { TipoOperacionCambio } from "@prisma/client";

// ─── Etapa 1: Config + Cajas + PN Historial ───────────────────────────────────

export interface ImportEtapa1Result {
  success:  boolean;
  imported: { config: number; cajas: number; pnHist: number };
  skipped:  { config: number; cajas: number; pnHist: number };
  errors:   string[];
  log:      string[];
}

export async function importarEtapa1Legacy(payload: {
  config: unknown;
  cajas:  unknown;
  pnHist: unknown;
}): Promise<ImportEtapa1Result> {
  const imported = { config: 0, cajas: 0, pnHist: 0 };
  const skipped  = { config: 0, cajas: 0, pnHist: 0 };
  const errors:   string[] = [];
  const log:      string[] = [];

  // ── A. Config (tc_blue + mes) ──────────────────────────────────────────────
  try {
    const cfg     = payload.config;
    const cfgObj  = (typeof cfg === "object" && cfg !== null && !Array.isArray(cfg))
      ? (cfg as Record<string, unknown>)
      : {} as Record<string, unknown>;
    const cfgArr  = Array.isArray(cfg)
      ? (cfg as Array<Record<string, unknown>>)
      : [];

    const pickVal = (keys: string[]): unknown => {
      for (const k of keys) {
        if (cfgObj[k] !== undefined) return cfgObj[k];
      }
      const item = cfgArr.find((i) => keys.includes(String(i.clave ?? i.key ?? "")));
      return item ? (item.valor ?? item.value) : undefined;
    };

    // TC Blue
    const tcRaw = pickVal(["tc", "tc_blue", "tipo_cambio", "tipoCambio"]);
    const tcVal = tcRaw !== undefined ? parseFloat(String(tcRaw)) : NaN;
    if (!isNaN(tcVal) && tcVal > 0) {
      await prisma.config.upsert({
        where:  { clave: "tc_blue" },
        update: { valor: tcVal.toFixed(4), updatedAt: new Date() },
        create: { id: crypto.randomUUID(), clave: "tc_blue", valor: tcVal.toFixed(4), updatedAt: new Date() },
      });
      imported.config++;
      log.push(`✓ TC Blue: ${tcVal.toFixed(4)} → Config (clave: tc_blue)`);
    } else {
      skipped.config++;
      log.push(`— TC Blue: omitido (valor no detectado o inválido)`);
    }

    // Mes contable — create only if not yet present; do not deactivate existing active month
    const mesRaw = pickVal(["mes", "mes_activo", "mesActivo", "mes_contable"]);
    const mesStr = typeof mesRaw === "string" ? mesRaw.trim() : null;
    if (mesStr && /^\d{4}-(0[1-9]|1[0-2])$/.test(mesStr)) {
      const existing = await prisma.mesContable.findUnique({ where: { mes: mesStr } });
      await prisma.mesContable.upsert({
        where:  { mes: mesStr },
        update: {},
        create: { id: crypto.randomUUID(), mes: mesStr, activo: false },
      });
      if (existing) {
        skipped.config++;
        log.push(`— MesContable ${mesStr}: ya existía, omitido`);
      } else {
        imported.config++;
        log.push(`✓ MesContable ${mesStr}: creado como inactivo → MesContable`);
      }
    } else {
      skipped.config++;
      log.push(`— MesContable: omitido (valor no detectado o formato inválido)`);
    }
  } catch (e) {
    errors.push(`Config: ${e instanceof Error ? e.message : String(e)}`);
  }

  // ── B. Cajas ───────────────────────────────────────────────────────────────
  try {
    const cajasRaw: unknown[] = Array.isArray(payload.cajas)
      ? payload.cajas
      : typeof payload.cajas === "object" && payload.cajas !== null
        ? Object.values(payload.cajas)
        : [];

    const IMPORT_TAG  = "IMPORT LEGACY CAJA";
    const importFecha = new Date(Date.UTC(2026, 3, 30)); // 2026-04-30

    for (const item of cajasRaw) {
      try {
        const c = (typeof item === "object" && item !== null ? item : {}) as Record<string, unknown>;
        const slug = String(c.slug ?? c.key ?? c.id ?? c.nombre ?? "")
          .toLowerCase().replace(/\s+/g, "-").trim();
        if (!slug) { skipped.cajas++; log.push(`— Caja sin slug: omitida`); continue; }

        const dbCaja = await prisma.caja.findUnique({ where: { slug } });
        if (!dbCaja) { skipped.cajas++; log.push(`— Caja '${slug}': no encontrada en la base de datos, omitida`); continue; }

        const newLabel = String(c.label ?? c.nombre ?? c.name ?? dbCaja.label).trim();
        await prisma.caja.update({ where: { id: dbCaja.id }, data: { label: newLabel } });
        log.push(`✓ Caja '${slug}': label actualizado → '${newLabel}'`);

        const saldoUSD = parseFloat(String(c.saldo_usd ?? c.saldoUSD ?? c.saldo ?? 0));
        if (!isNaN(saldoUSD) && saldoUSD !== 0) {
          const dup = await prisma.movimientoCaja.findFirst({
            where: { cajaId: dbCaja.id, moneda: "USD", descripcion: { contains: IMPORT_TAG } },
          });
          if (!dup) {
            await prisma.movimientoCaja.create({
              data: {
                id:          crypto.randomUUID(),
                cajaId:      dbCaja.id,
                fecha:       importFecha,
                tipo:        saldoUSD > 0 ? "ENTRADA" : "SALIDA",
                moneda:      "USD",
                monto:       Math.abs(saldoUSD),
                descripcion: `${IMPORT_TAG} 2026-04-30 — saldo inicial USD`,
                confirmado:  true,
              },
            });
            log.push(`  ✓ '${slug}' USD: saldo ${saldoUSD > 0 ? "+" : ""}${saldoUSD} importado → MovimientoCaja`);
          } else {
            log.push(`  — '${slug}' USD: ${IMPORT_TAG} ya existe, omitido`);
          }
        }

        const saldoARS = parseFloat(String(c.saldo_ars ?? c.saldoARS ?? c.saldo_pesos ?? 0));
        if (!isNaN(saldoARS) && saldoARS !== 0) {
          const dup = await prisma.movimientoCaja.findFirst({
            where: { cajaId: dbCaja.id, moneda: "ARS", descripcion: { contains: IMPORT_TAG } },
          });
          if (!dup) {
            await prisma.movimientoCaja.create({
              data: {
                id:          crypto.randomUUID(),
                cajaId:      dbCaja.id,
                fecha:       importFecha,
                tipo:        saldoARS > 0 ? "ENTRADA" : "SALIDA",
                moneda:      "ARS",
                monto:       Math.abs(saldoARS),
                descripcion: `${IMPORT_TAG} 2026-04-30 — saldo inicial ARS`,
                confirmado:  true,
              },
            });
            log.push(`  ✓ '${slug}' ARS: saldo ${saldoARS > 0 ? "+" : ""}${saldoARS} importado → MovimientoCaja`);
          } else {
            log.push(`  — '${slug}' ARS: ${IMPORT_TAG} ya existe, omitido`);
          }
        }

        imported.cajas++;
      } catch (e) {
        errors.push(`Caja: ${e instanceof Error ? e.message : String(e)}`);
        skipped.cajas++;
      }
    }
  } catch (e) {
    errors.push(`Cajas section: ${e instanceof Error ? e.message : String(e)}`);
  }

  // ── C. PN Historial ────────────────────────────────────────────────────────
  try {
    const pnArr: unknown[] = Array.isArray(payload.pnHist)
      ? payload.pnHist
      : typeof payload.pnHist === "object" && payload.pnHist !== null
        ? Object.values(payload.pnHist)
        : [];

    for (const item of pnArr) {
      try {
        const p = (typeof item === "object" && item !== null ? item : {}) as Record<string, unknown>;
        const fechaRaw = p.fecha ?? p.date ?? p.fecha_snapshot;
        if (!fechaRaw) { skipped.pnHist++; log.push(`— PN sin fecha: omitido`); continue; }
        const d = new Date(String(fechaRaw));
        if (isNaN(d.getTime())) { skipped.pnHist++; log.push(`— PN '${fechaRaw}': fecha inválida, omitido`); continue; }
        const fecha = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
        const fechaStr = fecha.toISOString().split("T")[0];

        const already = await prisma.snapshotPatrimonio.findFirst({ where: { fecha } });
        if (already) { skipped.pnHist++; log.push(`— PN ${fechaStr}: ya existe en SnapshotPatrimonio, omitido`); continue; }

        const activo = parseFloat(String(p.activo   ?? p.total_activo   ?? p.totalActivo   ?? 0));
        const pasivo = parseFloat(String(p.pasivo   ?? p.total_pasivo   ?? p.totalPasivo   ?? 0));
        const pnVal  = parseFloat(String(p.patrimonio_neto ?? p.patrimonioNeto ?? p.pn ?? p.patrimonio ?? (activo - pasivo)));
        const tc     = parseFloat(String(p.tipo_cambio ?? p.tipoCambio ?? p.tc ?? 1000));
        const util   = p.utilidad !== undefined ? parseFloat(String(p.utilidad)) : null;

        if (isNaN(activo) || isNaN(pasivo) || isNaN(pnVal)) { skipped.pnHist++; log.push(`— PN ${fechaStr}: activo/pasivo/pn inválidos, omitido`); continue; }

        await prisma.snapshotPatrimonio.create({
          data: {
            id:             crypto.randomUUID(),
            fecha,
            activo,
            pasivo,
            patrimonioNeto: pnVal,
            utilidad:       util !== null && !isNaN(util) ? util : undefined,
            tipoCambio:     isNaN(tc) ? 1000 : tc,
            tipo:           "MANUAL",
            detalle:        { source: "LEGACY_IMPORT" },
          },
        });
        imported.pnHist++;
        log.push(`✓ PN ${fechaStr}: importado → SnapshotPatrimonio (activo=${activo.toFixed(0)}, pn=${pnVal.toFixed(0)})`);
      } catch (e) {
        errors.push(`PN Hist: ${e instanceof Error ? e.message : String(e)}`);
        skipped.pnHist++;
      }
    }
  } catch (e) {
    errors.push(`PN Hist section: ${e instanceof Error ? e.message : String(e)}`);
  }

  revalidatePath("/configuracion");
  revalidatePath("/backup");

  return { success: errors.length === 0, imported, skipped, errors, log };
}

// ─── Shared utility ───────────────────────────────────────────────────────────

function parseDateUTC(raw: unknown): Date | null {
  if (raw == null) return null;
  let d: Date;
  if (typeof raw === "number") {
    d = new Date(raw > 1e10 ? raw : raw * 1000);
  } else {
    d = new Date(String(raw));
  }
  if (isNaN(d.getTime())) return null;
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

// ─── Etapa 2: Clientes + CC + Plazos Fijos ───────────────────────────────────

export interface ImportEtapa2Result {
  success:  boolean;
  imported: { clientes: number; cuentas: number; movsCC: number; plazosFijos: number };
  skipped:  { clientes: number; cuentas: number; movsCC: number; plazosFijos: number };
  errors:   string[];
  log:      string[];
}

export async function importarEtapa2Legacy(payload: {
  clientes: unknown;
}): Promise<ImportEtapa2Result> {
  const imported = { clientes: 0, cuentas: 0, movsCC: 0, plazosFijos: 0 };
  const skipped  = { clientes: 0, cuentas: 0, movsCC: 0, plazosFijos: 0 };
  const errors:  string[] = [];
  const log:     string[] = [];

  const clientesRaw: unknown[] = Array.isArray(payload.clientes)
    ? payload.clientes
    : typeof payload.clientes === "object" && payload.clientes !== null
      ? Object.values(payload.clientes as Record<string, unknown>)
      : [];

  for (const item of clientesRaw) {
    const c = (typeof item === "object" && item !== null ? item : {}) as Record<string, unknown>;
    const nombre = String(c.nombre ?? c.name ?? c.nom ?? "").trim();
    if (!nombre) { skipped.clientes++; continue; }

    const clientLog: string[]  = [];
    const ci = { clientes: 0, cuentas: 0, movsCC: 0, plazosFijos: 0 };
    const cs = { clientes: 0, cuentas: 0, movsCC: 0, plazosFijos: 0 };

    try {
      await prisma.$transaction(async (tx) => {

        // ── A. Cliente ────────────────────────────────────────────────────────
        const legacyId  = c.id != null ? String(c.id) : "";
        const legacyTag = legacyId ? `LEGACY_ID: ${legacyId}` : null;

        let cliente = await tx.cliente.findFirst({
          where: { nombre: { equals: nombre, mode: "insensitive" } },
        });
        if (!cliente && legacyId) {
          cliente = await tx.cliente.findFirst({
            where: { notas: { contains: `LEGACY_ID: ${legacyId}` } },
          });
        }

        if (!cliente) {
          cliente = await tx.cliente.create({
            data: {
              id:        crypto.randomUUID(),
              nombre,
              rol:       "CLIENTE",
              notas:     legacyTag ?? undefined,
              activo:    true,
              updatedAt: new Date(),
            },
          });
          ci.clientes++;
          clientLog.push(`✓ Cliente '${nombre}': creado${legacyTag ? ` (${legacyTag})` : ""} [id:${cliente.id}] → /clientes/${cliente.id}`);
        } else {
          cs.clientes++;
          const updateData: Record<string, unknown> = { updatedAt: new Date() };
          const logParts: string[] = [];

          if (!cliente.activo) {
            updateData.activo = true;
            logParts.push("reactivado");
          }
          if (legacyTag && (!cliente.notas || !cliente.notas.includes("LEGACY_ID:"))) {
            updateData.notas = cliente.notas ? `${cliente.notas}\n${legacyTag}` : legacyTag;
            logParts.push(legacyTag);
          }

          if (Object.keys(updateData).length > 1) {
            await tx.cliente.update({ where: { id: cliente.id }, data: updateData });
          }

          const detail = logParts.length > 0 ? ` (${logParts.join(", ")})` : ", omitido";
          clientLog.push(`— Cliente '${nombre}': ya existe [id:${cliente.id}]${detail}`);
        }

        const clienteId  = cliente.id;
        const saldoUSD   = parseFloat(String(c.saldo_usd ?? c.usd ?? c.saldo ?? 0)) || 0;
        const saldoARS   = parseFloat(String(c.saldo_ars ?? c.ars ?? c.saldo_pesos ?? 0)) || 0;
        const movsUSD    = Array.isArray(c.movs)     ? c.movs     : [] as unknown[];
        const movsARS    = Array.isArray(c.movs_ars) ? c.movs_ars : [] as unknown[];

        // ── B. Cuentas Corrientes + movimientos ───────────────────────────────
        const ccConfigs: Array<["USD" | "ARS", number, unknown[]]> = [
          ["USD", saldoUSD, movsUSD as unknown[]],
          ["ARS", saldoARS, movsARS as unknown[]],
        ];

        for (const [moneda, saldo, movsArr] of ccConfigs) {
          let cc = await tx.cuentaCorriente.findUnique({
            where: { clienteId_moneda: { clienteId, moneda } },
          });
          if (!cc) {
            cc = await tx.cuentaCorriente.create({
              data: { id: crypto.randomUUID(), clienteId, moneda, saldo: 0, updatedAt: new Date() },
            });
            ci.cuentas++;
            clientLog.push(`  ✓ CC ${moneda} creada para '${nombre}'`);
          } else {
            cs.cuentas++;
          }

          const ccId = cc.id;
          let movsOk = 0;
          let movsSkip = 0;

          for (const movItem of movsArr) {
            const m    = (typeof movItem === "object" && movItem !== null ? movItem : {}) as Record<string, unknown>;
            const ing  = parseFloat(String(m.ing  ?? m.ingreso  ?? 0)) || 0;
            const egr  = parseFloat(String(m.egr  ?? m.egreso   ?? 0)) || 0;
            const diff = ing - egr;
            if (diff === 0) { movsSkip++; continue; }

            const fecha = parseDateUTC(m.f ?? m.fecha ?? m.date);
            if (!fecha) { movsSkip++; continue; }

            const tipo:  "INGRESO" | "EGRESO" = diff > 0 ? "INGRESO" : "EGRESO";
            const monto  = Math.abs(diff);
            const desc   = String(m.d ?? m.desc ?? m.descripcion ?? "").trim() || "Movimiento legacy";

            const dup = await tx.movimientoCC.findFirst({
              where: { cuentaCorrienteId: ccId, fecha, tipo, descripcion: desc, monto },
            });
            if (dup) { movsSkip++; cs.movsCC++; continue; }

            await tx.movimientoCC.create({
              data: { id: crypto.randomUUID(), cuentaCorrienteId: ccId, fecha, tipo, monto, descripcion: desc },
            });
            movsOk++;
            ci.movsCC++;
          }

          // No movement history: create a single balance adjustment
          if (movsArr.length === 0 && saldo !== 0) {
            const STAG = "IMPORT LEGACY CC SALDO";
            const dupS = await tx.movimientoCC.findFirst({
              where: { cuentaCorrienteId: ccId, descripcion: { contains: STAG } },
            });
            if (!dupS) {
              const tipo: "INGRESO" | "EGRESO" = saldo > 0 ? "INGRESO" : "EGRESO";
              await tx.movimientoCC.create({
                data: {
                  id:                crypto.randomUUID(),
                  cuentaCorrienteId: ccId,
                  fecha:             new Date(Date.UTC(2026, 3, 30)),
                  tipo,
                  monto:             Math.abs(saldo),
                  descripcion:       `${STAG} 2026-04-30`,
                },
              });
              ci.movsCC++;
              clientLog.push(`  ✓ CC ${moneda} '${nombre}': saldo ${saldo > 0 ? "+" : ""}${saldo} importado como ajuste`);
            } else {
              cs.movsCC++;
              clientLog.push(`  — CC ${moneda} '${nombre}': ajuste de saldo ya existe, omitido`);
            }
          } else if (movsOk > 0) {
            clientLog.push(`  ✓ CC ${moneda} '${nombre}': ${movsOk} movimientos importados${movsSkip > 0 ? `, ${movsSkip} omitidos` : ""}`);
          } else if (movsArr.length > 0) {
            clientLog.push(`  — CC ${moneda} '${nombre}': ${movsSkip} movimientos ya existían`);
          }

          // Recalculate stored saldo from all movements
          const allMovs = await tx.movimientoCC.findMany({ where: { cuentaCorrienteId: ccId } });
          const saldoCalc = allMovs.reduce((acc, mv) => {
            const n = Number(mv.monto.toString());
            return mv.tipo === "EGRESO" ? acc - n : acc + n;
          }, 0);
          await tx.cuentaCorriente.update({
            where: { id: ccId },
            data:  { saldo: saldoCalc, updatedAt: new Date() },
          });
        }

        // ── C. Plazos Fijos ───────────────────────────────────────────────────
        const pfsRaw = Array.isArray(c.pfs) ? (c.pfs as unknown[]) : [];
        let pfMovsSkipped = 0;

        for (const pfItem of pfsRaw) {
          const pf   = (typeof pfItem === "object" && pfItem !== null ? pfItem : {}) as Record<string, unknown>;
          const cap  = parseFloat(String(pf.cap ?? pf.capital ?? 0));
          const tasa = parseFloat(String(pf.tasa ?? pf.tasa_anual ?? pf.tasaAnual ?? 0)) || 0;
          const ini  = parseDateUTC(pf.ini ?? pf.inicio ?? pf.fecha_inicio);
          const venc = parseDateUTC(pf.venc ?? pf.vencimiento ?? pf.fecha_vencimiento);

          if (isNaN(cap) || cap <= 0 || !ini || !venc) {
            cs.plazosFijos++;
            clientLog.push(`  — PF '${nombre}': datos incompletos (cap=${cap}), omitido`);
            continue;
          }

          const monedaRaw = String(pf.moneda ?? "USD").toUpperCase();
          const monedaEnum: "USD" | "ARS" | "EUR" | "BRL" =
            (["USD", "ARS", "EUR", "BRL"] as const).includes(monedaRaw as "USD")
              ? (monedaRaw as "USD" | "ARS" | "EUR" | "BRL")
              : "USD";

          const estadoRaw = String(pf.estado ?? pf.status ?? "activo").toLowerCase();
          const estado: "ACTIVO" | "VENCIDO" | "CANCELADO" | "RENOVADO" =
            estadoRaw.includes("vencid") ? "VENCIDO"
            : estadoRaw.includes("cancel") ? "CANCELADO"
            : estadoRaw.includes("renov")  ? "RENOVADO"
            : "ACTIVO";

          const saldoPF = parseFloat(String(pf.saldo ?? cap));

          const dup = await tx.plazoFijo.findFirst({
            where: { clienteId, capital: cap, fechaVencimiento: venc, tasaAnual: tasa },
          });

          if (dup) {
            cs.plazosFijos++;
            clientLog.push(`  — PF '${nombre}' cap=${cap} venc=${venc.toISOString().split("T")[0]}: ya existe, omitido`);
          } else {
            await tx.plazoFijo.create({
              data: {
                id:               crypto.randomUUID(),
                clienteId,
                capital:          cap,
                tasaAnual:        tasa,
                moneda:           monedaEnum,
                fechaInicio:      ini,
                fechaVencimiento: venc,
                estado,
                saldoActual:      isNaN(saldoPF) ? cap : saldoPF,
                updatedAt:        new Date(),
              },
            });
            ci.plazosFijos++;
            clientLog.push(`  ✓ PF '${nombre}': ${cap} ${monedaEnum} venc=${venc.toISOString().split("T")[0]} (${estado})`);
          }

          if (Array.isArray(pf.movs) && (pf.movs as unknown[]).length > 0) {
            pfMovsSkipped += (pf.movs as unknown[]).length;
          }
        }

        if (pfMovsSkipped > 0) {
          clientLog.push(`  — ${pfMovsSkipped} movs. PF omitidos (modelo no disponible en esquema)`);
        }
      });

      // Commit local counters + log only on transaction success
      imported.clientes    += ci.clientes;
      imported.cuentas     += ci.cuentas;
      imported.movsCC      += ci.movsCC;
      imported.plazosFijos += ci.plazosFijos;
      skipped.clientes     += cs.clientes;
      skipped.cuentas      += cs.cuentas;
      skipped.movsCC       += cs.movsCC;
      skipped.plazosFijos  += cs.plazosFijos;
      log.push(...clientLog);

    } catch (e) {
      errors.push(`Cliente '${nombre}': ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  revalidatePath("/clientes");
  revalidatePath("/clientes/cc");
  revalidatePath("/clientes/vencimientos-pf");
  revalidatePath("/backup");

  return { success: errors.length === 0, imported, skipped, errors, log };
}

// ─── Etapa 3: Operaciones Cambio + Rulos + Dividendos + Largo Plazo ──────────

export interface ImportEtapa3Result {
  success:  boolean;
  imported: { opsCambio: number; movsCaja: number; rulos: number; divint: number; largoplazo: number };
  skipped:  { opsCambio: number; movsCaja: number; rulos: number; divint: number; largoplazo: number };
  errors:   string[];
  log:      string[];
}

const CAMBIO_TIPO_MAP: Record<string, TipoOperacionCambio | undefined> = {
  compra_usd:        "COMPRA_USD",
  venta_usd:         "VENTA_USD",
  compra_eur:        "COMPRA_EUR",
  venta_eur:         "VENTA_EUR",
  compra_brl:        "COMPRA_BRL",
  venta_brl:         "VENTA_BRL",
  honorarios:        "HONORARIO_EXTERNO",
  honorario:         "HONORARIO_EXTERNO",
  honorario_cliente: "HONORARIO_CLIENTE",
  gastos:            "GASTO_OPERATIVO",
  gasto:             "GASTO_OPERATIVO",
  impuesto:          "GASTO_OPERATIVO",
  impuestos:         "GASTO_OPERATIVO",
  alquiler:          "GASTO_OPERATIVO",
  pago_intereses_pf: "GASTO_OPERATIVO",
  utilidades_dist:   "GASTO_OPERATIVO",
  comision:          "COMISION",
  comisiones:        "COMISION",
};

function monedaParaTipo(
  tipo: TipoOperacionCambio,
  cobroUSD: number,
  _cobroARS: number,
): "USD" | "ARS" | "EUR" | "BRL" {
  if (tipo.endsWith("_EUR")) return "EUR";
  if (tipo.endsWith("_BRL")) return "BRL";
  if (tipo.endsWith("_USD")) return "USD";
  return cobroUSD > 0 ? "USD" : "ARS";
}

export async function importarEtapa3Legacy(payload: {
  ops_cambio:    unknown;
  ops_rulos:     unknown;
  ops_divint:    unknown;
  ops_largoplazo: unknown;
}): Promise<ImportEtapa3Result> {
  const imported = { opsCambio: 0, movsCaja: 0, rulos: 0, divint: 0, largoplazo: 0 };
  const skipped  = { opsCambio: 0, movsCaja: 0, rulos: 0, divint: 0, largoplazo: 0 };
  const errors:  string[] = [];
  const log:     string[] = [];

  const toArr = (v: unknown): Record<string, unknown>[] =>
    Array.isArray(v)
      ? (v as Record<string, unknown>[])
      : typeof v === "object" && v !== null
        ? (Object.values(v as Record<string, unknown>) as Record<string, unknown>[])
        : [];

  const cajaOficina = await prisma.caja.findFirst({
    where: { OR: [{ esPrincipal: true }, { slug: "oficina" }], activa: true },
  });
  if (!cajaOficina) {
    errors.push("Caja principal no encontrada. Complete Etapa 1 primero.");
    return { success: false, imported, skipped, errors, log };
  }

  const TAG_CAMBIO = "[IMPORT LEGACY CAMBIO]";
  const TAG_RULO   = "[IMPORT LEGACY RULO]";
  const TAG_DIVINT = "[IMPORT LEGACY DIVINT]";
  const TAG_LP     = "[IMPORT LEGACY LP]";

  // ── A. ops_cambio ────────────────────────────────────────────────────────────
  log.push("── ops_cambio ──");
  for (const item of toArr(payload.ops_cambio)) {
    const r       = item as Record<string, unknown>;
    const tipoRaw = String(r.tipo ?? "").trim().toLowerCase();
    const fecha   = parseDateUTC(r.fecha ?? r.f ?? r.date);
    if (!fecha) { skipped.opsCambio++; continue; }

    const mesContable  = `${fecha.getUTCFullYear()}-${String(fecha.getUTCMonth() + 1).padStart(2, "0")}`;
    const clienteNom   = String(r.cliente ?? r.nombre ?? r.ticker ?? r.desc ?? "").trim() || "Importado legacy";
    const cobroUSDRaw  = parseFloat(String(r.cobr_usd  ?? r.cobro_usd ?? r.usd ?? 0)) || 0;
    const cobroARSRaw  = parseFloat(String(r.cobr_ars  ?? r.cobro_ars ?? r.ars ?? 0)) || 0;
    const cantidadRaw  = parseFloat(String(r.cantidad  ?? r.cant      ?? r.qty ?? 0)) || Math.abs(cobroUSDRaw);
    const tcRaw        = parseFloat(String(r.tc        ?? r.tipo_cambio           ?? 0)) || 0;
    const descRaw      = String(r.desc ?? r.descripcion ?? r.nota ?? "").trim();

    const tipoOC = CAMBIO_TIPO_MAP[tipoRaw];

    // Unrecognized tipo → import as MovimientoCaja audit entry
    if (!tipoOC) {
      const monedaMC: "USD" | "ARS" = cobroUSDRaw !== 0 ? "USD" : "ARS";
      const montoMC = Math.abs(cobroUSDRaw !== 0 ? cobroUSDRaw : cobroARSRaw);
      if (montoMC === 0) { skipped.movsCaja++; continue; }
      const descMC = `${TAG_CAMBIO} [tipo:${tipoRaw}] ${descRaw || clienteNom}`.trim();

      const dupMC = await prisma.movimientoCaja.findFirst({
        where: { cajaId: cajaOficina.id, fecha, moneda: monedaMC, monto: montoMC, descripcion: descMC },
      });
      if (dupMC) { skipped.movsCaja++; continue; }

      await prisma.movimientoCaja.create({
        data: {
          id: crypto.randomUUID(), cajaId: cajaOficina.id, fecha,
          tipo: "SALIDA", moneda: monedaMC, monto: montoMC,
          descripcion: descMC, confirmado: true,
        },
      });
      imported.movsCaja++;
      log.push(`  ✓ MovCaja [${tipoRaw}] ${monedaMC} ${montoMC} (${fecha.toISOString().split("T")[0]})`);
      continue;
    }

    const moneda  = monedaParaTipo(tipoOC, cobroUSDRaw, cobroARSRaw);
    const descFin = `${TAG_CAMBIO} ${descRaw || clienteNom}`.trim();

    const dup = await prisma.operacionCambio.findFirst({
      where: {
        fecha, tipo: tipoOC,
        cobroUSD: Math.abs(cobroUSDRaw),
        cobroARS: Math.abs(cobroARSRaw),
        descripcion: { contains: TAG_CAMBIO },
      },
    });
    if (dup) { skipped.opsCambio++; continue; }

    await prisma.operacionCambio.create({
      data: {
        id:            crypto.randomUUID(),
        fecha,
        tipo:          tipoOC,
        moneda,
        clienteNombre: clienteNom,
        cantidad:      Math.max(cantidadRaw, Math.abs(cobroUSDRaw)),
        tipoCambio:    tcRaw,
        totalARS:      Math.abs(cobroARSRaw),
        cobroUSD:      Math.abs(cobroUSDRaw),
        cobroARS:      Math.abs(cobroARSRaw),
        descripcion:   descFin,
        pendiente:     false,
        mesContable,
        updatedAt:     new Date(),
      },
    });
    imported.opsCambio++;
    log.push(`  ✓ OpCambio ${tipoOC} ${moneda} cobUSD=${Math.abs(cobroUSDRaw)} (${fecha.toISOString().split("T")[0]})`);
  }
  log.push(`ops_cambio: ${imported.opsCambio} importadas, ${skipped.opsCambio} omitidas, ${imported.movsCaja} movs caja para tipos no mapeados`);

  // ── B. ops_rulos ─────────────────────────────────────────────────────────────
  log.push("── ops_rulos ──");
  for (const item of toArr(payload.ops_rulos)) {
    const r     = item as Record<string, unknown>;
    const fecha = parseDateUTC(r.fecha ?? r.f ?? r.date);
    if (!fecha) { skipped.rulos++; continue; }

    const cuenta   = String(r.cuenta ?? r.account ?? "").trim();
    const desc     = String(r.desc ?? r.descripcion ?? cuenta ?? "").trim();
    const usd      = parseFloat(String(r.usd ?? 0)) || 0;
    const ars      = parseFloat(String(r.ars ?? 0)) || 0;
    const descBase = `${TAG_RULO}${cuenta ? ` [${cuenta}]` : ""} ${desc}`.trim();

    let anyImported = false;
    const amounts: Array<["USD" | "ARS", number]> = [["USD", usd], ["ARS", ars]];

    for (const [moneda, monto] of amounts) {
      if (monto === 0) continue;
      const tipo:  "ENTRADA" | "SALIDA" = monto > 0 ? "ENTRADA" : "SALIDA";
      const montoAbs = Math.abs(monto);
      const descMov  = `${descBase} (${moneda})`;

      const dup = await prisma.movimientoCaja.findFirst({
        where: { cajaId: cajaOficina.id, fecha, moneda, monto: montoAbs, descripcion: descMov },
      });
      if (dup) { skipped.rulos++; continue; }

      await prisma.movimientoCaja.create({
        data: {
          id: crypto.randomUUID(), cajaId: cajaOficina.id, fecha,
          tipo, moneda, monto: montoAbs, descripcion: descMov, confirmado: true,
        },
      });
      imported.rulos++;
      anyImported = true;
    }

    if (usd === 0 && ars === 0) skipped.rulos++;
    if (anyImported) log.push(`  ✓ Rulo [${cuenta}] ${desc} (${fecha.toISOString().split("T")[0]}) USD=${usd} ARS=${ars}`);
  }
  log.push(`ops_rulos: ${imported.rulos} movimientos importados, ${skipped.rulos} omitidos`);

  // ── C. ops_divint ─────────────────────────────────────────────────────────────
  log.push("── ops_divint ──");
  for (const item of toArr(payload.ops_divint)) {
    const r      = item as Record<string, unknown>;
    const fecha  = parseDateUTC(r.fecha ?? r.f ?? r.date);
    if (!fecha) { skipped.divint++; continue; }

    const cuenta   = String(r.cuenta ?? r.account ?? "").trim();
    const ticker   = String(r.ticker ?? r.activo ?? "").trim();
    const desc     = String(r.desc ?? r.descripcion ?? ticker ?? cuenta ?? "").trim();
    const usd      = parseFloat(String(r.usd ?? 0)) || 0;
    const ars      = parseFloat(String(r.ars ?? 0)) || 0;
    const descBase = `${TAG_DIVINT}${ticker ? ` [${ticker}]` : ""}${cuenta ? ` [${cuenta}]` : ""} ${desc}`.trim();

    let anyImported = false;
    const amounts: Array<["USD" | "ARS", number]> = [["USD", usd], ["ARS", ars]];

    for (const [moneda, monto] of amounts) {
      if (monto === 0) continue;
      const tipo:  "ENTRADA" | "SALIDA" = monto > 0 ? "ENTRADA" : "SALIDA";
      const montoAbs = Math.abs(monto);
      const descMov  = `${descBase} (${moneda})`;

      const dup = await prisma.movimientoCaja.findFirst({
        where: { cajaId: cajaOficina.id, fecha, moneda, monto: montoAbs, descripcion: descMov },
      });
      if (dup) { skipped.divint++; continue; }

      await prisma.movimientoCaja.create({
        data: {
          id: crypto.randomUUID(), cajaId: cajaOficina.id, fecha,
          tipo, moneda, monto: montoAbs, descripcion: descMov, confirmado: true,
        },
      });
      imported.divint++;
      anyImported = true;
    }

    if (usd === 0 && ars === 0) skipped.divint++;
    if (anyImported) log.push(`  ✓ DivInt [${ticker || cuenta}] ${desc} (${fecha.toISOString().split("T")[0]}) USD=${usd} ARS=${ars}`);
  }
  log.push(`ops_divint: ${imported.divint} movimientos importados, ${skipped.divint} omitidos`);

  // ── D. ops_largoplazo ─────────────────────────────────────────────────────────
  log.push("── ops_largoplazo ──");
  const lpArr = toArr(payload.ops_largoplazo);

  if (lpArr.length === 0) {
    log.push("ops_largoplazo: sin registros");
  } else {
    for (const item of lpArr) {
      const r     = item as Record<string, unknown>;
      const fecha = parseDateUTC(r.fecha ?? r.f ?? r.date);
      if (!fecha) { skipped.largoplazo++; continue; }

      const desc    = String(r.desc ?? r.descripcion ?? r.nota ?? "").trim();
      const usd     = parseFloat(String(r.usd ?? r.monto_usd ?? 0)) || 0;
      const ars     = parseFloat(String(r.ars ?? r.monto_ars ?? 0)) || 0;
      const descBase = `${TAG_LP} ${desc}`.trim();

      let anyImported = false;
      const amounts: Array<["USD" | "ARS", number]> = [["USD", usd], ["ARS", ars]];

      for (const [moneda, monto] of amounts) {
        if (monto === 0) continue;
        const tipo:  "ENTRADA" | "SALIDA" = monto > 0 ? "ENTRADA" : "SALIDA";
        const montoAbs = Math.abs(monto);
        const descMov  = `${descBase} (${moneda})`;

        const dup = await prisma.movimientoCaja.findFirst({
          where: { cajaId: cajaOficina.id, fecha, moneda, monto: montoAbs, descripcion: descMov },
        });
        if (dup) { skipped.largoplazo++; continue; }

        await prisma.movimientoCaja.create({
          data: {
            id: crypto.randomUUID(), cajaId: cajaOficina.id, fecha,
            tipo, moneda, monto: montoAbs, descripcion: descMov, confirmado: true,
          },
        });
        imported.largoplazo++;
        anyImported = true;
      }

      if (usd === 0 && ars === 0) skipped.largoplazo++;
      if (anyImported) log.push(`  ✓ LP ${desc} (${fecha.toISOString().split("T")[0]}) USD=${usd} ARS=${ars}`);
    }
    log.push(`ops_largoplazo: ${imported.largoplazo} importados, ${skipped.largoplazo} omitidos`);
  }

  revalidatePath("/operativa/mov-diarios");
  revalidatePath("/caja");
  revalidatePath("/backup");

  return { success: errors.length === 0, imported, skipped, errors, log };
}

// ─── Exportar / Analizar ───────────────────────────────────────────────────────

export async function exportarBackup() {
  try {
    const [
      config,
      cajas,
      movimientosCaja,
      operacionesCambio,
      clientes,
      cuentasCorrientes,
      movimientosCC,
      plazosFijos,
      activos,
      preciosHistoricos,
      propiedades,
      inversionesInmobiliarias,
      recordatorios,
      notas,
      mesesContables,
      sociosPorcentaje
    ] = await Promise.all([
      prisma.config.findMany(),
      prisma.caja.findMany(),
      prisma.movimientoCaja.findMany(),
      prisma.operacionCambio.findMany(),
      prisma.cliente.findMany(),
      prisma.cuentaCorriente.findMany(),
      prisma.movimientoCC.findMany(),
      prisma.plazoFijo.findMany(),
      prisma.activo.findMany(),
      prisma.precioHistorico.findMany(),
      prisma.propiedad.findMany(),
      prisma.inversionInmobiliaria.findMany(),
      prisma.recordatorio.findMany(),
      prisma.nota.findMany(),
      prisma.mesContable.findMany(),
      prisma.socioPorcentaje.findMany()
    ]);

    const backup = {
      version: "2.0.0",
      fechaExport: new Date().toISOString(),
      data: {
        config,
        cajas,
        movimientosCaja,
        operacionesCambio,
        clientes,
        cuentasCorrientes,
        movimientosCC,
        plazosFijos,
        activos,
        preciosHistoricos,
        propiedades,
        inversionesInmobiliarias,
        recordatorios,
        notas,
        mesesContables,
        sociosPorcentaje
      }
    };

    return { ok: true, backup };
  } catch (error) {
    console.error("Error al exportar backup:", error);
    return { ok: false, error: "Error al generar el backup de datos." };
  }
}

export async function analizarViabilidadBackup(formData: FormData) {
  const file = formData.get("backup") as File;
  if (!file) return { error: "No se subió ningún archivo." };

  try {
    const text = await file.text();
    const json = JSON.parse(text);

    // Detección de formato
    let format: "byg_historico" | "backup_actual" | "desconocido" = "desconocido";
    const data = json.data || json;

    const hasV1Keys = "config" in data && "cajas" in data && "ops_cambio" in data && "clientes" in data;
    const hasV2Keys = json.version === "2.0.0" && json.data && "movimientosCaja" in json.data;

    if (hasV2Keys) format = "backup_actual";
    else if (hasV1Keys) format = "byg_historico";

    const resumen = {
      config: Array.isArray(data.config),
      cajas: Array.isArray(data.cajas) ? data.cajas.length : (Array.isArray(data.caja) ? data.caja.length : 0),
      opsCambio: Array.isArray(data.operacionesCambio) ? data.operacionesCambio.length : (Array.isArray(data.ops_cambio) ? data.ops_cambio.length : 0),
      clientes: Array.isArray(data.clientes) ? data.clientes.length : 0,
      pnHist: Array.isArray(data.pn_hist) ? data.pn_hist.length : 0,
      plazosFijosEstimados: Array.isArray(data.plazos_fijos) ? data.plazos_fijos.length : 0,
    };

    const etapas = [
      {
        nombre: "Etapa 1: Configuración + Cajas",
        estado: resumen.config && resumen.cajas > 0 ? "listo" : "requiere_revision",
        motivo: resumen.config && resumen.cajas > 0 ? "Datos base detectados." : "Faltan tablas de configuración o cajas."
      },
      {
        nombre: "Etapa 2: Operaciones de Cambio",
        estado: resumen.opsCambio > 0 && resumen.cajas > 0 ? "listo" : "requiere_revision",
        motivo: resumen.opsCambio > 0 ? (resumen.cajas > 0 ? "Listo para migrar." : "Requiere cajas migradas primero.") : "No se detectaron operaciones."
      },
      {
        nombre: "Etapa 3: Clientes + Cuentas Corrientes",
        estado: resumen.clientes > 0 ? "requiere_revision" : "pendiente",
        motivo: "Requiere mapeo de IDs históricos a nuevos UUIDs."
      },
      {
        nombre: "Etapa 4: Plazos Fijos",
        estado: resumen.plazosFijosEstimados > 0 ? "requiere_revision" : "pendiente",
        motivo: "Depende de la migración exitosa de Clientes."
      },
      {
        nombre: "Etapa 5: Reportes Históricos",
        estado: resumen.pnHist > 0 ? "pendiente" : "pendiente",
        motivo: "Migración de PN Histórico sin afectar saldos actuales."
      }
    ];

    const advertencias = [];
    if (format === "byg_historico") {
      advertencias.push("Formato histórico detectado. Los IDs de clientes no coincidirán con los nuevos UUIDs.");
    }
    if (resumen.cajas > 0 && format === "byg_historico") {
      advertencias.push("Las cajas históricas deben mapearse manualmente por slug (ej: oficina).");
    }

    return { 
      ok: true, 
      formatoDetectado: format,
      resumen,
      etapas,
      advertencias,
      mensaje: "Análisis de viabilidad completado."
    };
  } catch (error) {
    console.error("Error al analizar backup:", error);
    return { error: "El archivo no es un JSON válido o está corrupto." };
  }
}
