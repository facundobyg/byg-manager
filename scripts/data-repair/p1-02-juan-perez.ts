// P1-02 — DATA REPAIR PUNTUAL: neutralizar + archivar el cliente seed/prueba "Juan Pérez".
//
// DECISIÓN (Facundo, 2026-11-11): cliente seed (prisma/seed.ts) confirmado de PRUEBA; los hechos del
// 2026-05-21 fueron operaciones de QA sin movimiento físico. Opción B: neutralizar + archivar, SIN
// hard delete y SIN reescribir mayo: todas las compensaciones llevan la fecha real de ejecución.
//
// APPLY (UNA tx serializable; cualquier assert ⇒ ROLLBACK total). Crea EXACTAMENTE 8 movimientos:
//   MovimientoCC (5):
//     R-USD  regularización EGRESO 1.000 USD  (operacionCambioId=op; NO mueve saldo: faltaba desde el legacy)
//     R-ARS  regularización INGRESO 1.380.000  (ídem)
//     X-USD  "[REVERSO] Reverso op cambio | op:<op>" INGRESO 1.000   ← revertirCambioTx (neutralizarCC)
//     X-ARS  "[REVERSO] Reverso op cambio | op:<op>" EGRESO 1.380.000 ← revertirCambioTx (neutralizarCC)
//     M-USD  "[REVERSO por …] ingreso | movref:f14e4627…" EGRESO 2.000 ← revertirMovimientoCCTx
//   MovimientoCaja (3), Caja Oficina:
//     K-USD  "[REVERSO Cambio <op>] Reverso de liquidación" SALIDA 1.000 USD     ← revertirCambioTx (pata A)
//     K-ARS  "[REVERSO Cambio <op>] Reverso de liquidación" ENTRADA 1.380.000   ← revertirCambioTx (pata B)
//     C-REV  "REVERSO | ref:36b9c122… | [MOV_CC] ingreso | …" SALIDA 2.000 USD  ← Macro 3 estructural (pata C)
//   + OperacionCambio [REVERTIDA POR: …] pendiente=true (revertirCambioTx)
//   + Cliente activo=false, tasaCC 0, notas "[P1-02] Cliente seed/prueba archivado"
//   + 1 AuditLog REPARACION_CLIENTE_PRUEBA con TODOS los ids y el estado previo exacto.
// La pata [MOV_CC] SALIDA 1.000 USD 7cbe7f00 es de Marianela RIRI: EXCLUIDA (se verifica intacta).
//
// El AuditLog guarda además datosNuevos.huellasPost: huella de FILA COMPLETA de las 19 entidades congeladas
// (cliente, 2 CC, cambio, caja A/B/C, f14e4627, 2 PF, Marianela y los 8 hechos creados).
// ROLLBACK (UNA tx): ANTES de escribir recalcula esas huellas y exige igualdad EXACTA (si cualquier entidad
// cambió después del apply ⇒ DENY "entidad modificada después del apply"); luego borra exactamente esos 8 ids, restaura de forma DIRECTA (sin movimientos de
// ajuste) saldo+updatedAt de ambas CC, descripción/pendiente/updatedAt del cambio y
// activo/tasaCC/notas/updatedAt del cliente ⇒ el precheck original vuelve a dar PASS.
//
// Uso (por defecto SOLO LECTURA):
//   npx tsx scripts/data-repair/p1-02-juan-perez.ts --target test|prod [--precheck | --postcheck]
//   … --apply --confirm P1-02 --ejecutor <email ADMIN>
//   … --rollback --confirm P1-02-ROLLBACK --ejecutor <email ADMIN>
// precheck/postcheck abren la sesión Postgres en read-only. Nunca imprime credenciales.

import { readFileSync } from "node:fs";
import { createHash, randomUUID } from "node:crypto";
import { PrismaClient, type Prisma } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";
import { esOpRevertida, netoPorCajaMoneda, prefijoReverso } from "../../src/lib/caja/integridad";
import { idsRevertidos, lockMovimientosCaja, lockOperacionCambio, movimientosDeCambio, revertirCambioTx, tieneCCVigente } from "../../src/lib/caja/integridad.service";
import { saldoReconstruido } from "../../src/lib/cc/integridad";
import { estaRevertidoCC, lockCuentas, revertirMovimientoCCTx } from "../../src/lib/cc/integridad.service";

type Tx = Prisma.TransactionClient;

export const P1_02 = {
  clienteId: "431e76a9-62bd-4bfc-bf47-6e592236f507",
  ccUSD: "8683135b-fc26-450d-a5f8-437567b018af",
  ccARS: "46f74834-1806-4a27-ad4c-146b4ca5f590",
  op: "8228ccd4-e83c-4ee2-8ead-0cf2660b6fe3",
  cajaA: "91ce00ff-72bb-4ccf-bae9-1a526fec43b7",
  cajaB: "c9c66de8-0712-4cac-aa52-f3bda27727e2",
  cajaC: "36b9c122-ed24-4ac2-8941-51fadf3e1ff4",
  movCC: "f14e4627-fe8d-40f3-938d-9c79f6506640",
  pfs: ["52c5cabd-3345-42f8-b3e1-e7fe440d890e", "dff40087-6241-4eb8-aa49-efc36b5f111a"],
  marianela: "7cbe7f00-699f-4a16-9864-78b6b8ad6760",
  marca: "P1-02",
  accion: "REPARACION_CLIENTE_PRUEBA",
  accionRollback: "REPARACION_CLIENTE_PRUEBA_ROLLBACK",
  notasArchivo: "[P1-02] Cliente seed/prueba archivado",
  deltaFxAgostoEsperadoARS: "-473.68",
} as const;

/** Estado previo EXACTO (auditado en PROD y TEST V5 el 2026-11-11). El rollback restaura esto. */
export const PREVIO = {
  cliente: { nombre: "Juan Pérez", email: "juan.perez@email.com", activo: true, tasaCC: "4", notas: null as string | null, updatedAt: "2026-04-16T18:52:11.834Z" },
  ccUSD: { saldo: "1000", reconstruido: "2000", movimientos: 1, updatedAt: "2026-05-21T16:20:27.720Z" },
  ccARS: { saldo: "1380000", reconstruido: "0", movimientos: 0, updatedAt: "2026-05-21T16:20:27.831Z" },
  op: { descripcion: "[CC] Operación de COMPRA USD | usr:Facundo", pendiente: false, updatedAt: "2026-05-21T16:20:27.600Z" },
} as const;

export const descRegUSD = `Compra USD 1.000 a TC 1.380 — Op Cambio · REGULARIZACION ${P1_02.marca}: impacto CC legacy del 2026-05-21 sin MovimientoCC (cliente seed/prueba) | op:${P1_02.op}`;
export const descRegARS = `Contrapartida ARS por Compra USD 1.000 a TC 1.380 · REGULARIZACION ${P1_02.marca}: impacto CC legacy del 2026-05-21 sin MovimientoCC (cliente seed/prueba) | op:${P1_02.op}`;

export class P102Error extends Error {}
export interface Chequeo { chequeo: string; ok: boolean; detalle: string }
export type Creados = {
  regUSD: string; regARS: string; revCCUSD: string; revCCARS: string; revMovCC: string;
  revCajaUSD: string; revCajaARS: string; revCajaC: string;
};

const D = (v: unknown) => new Decimal(String(v));
const iso = (d: unknown) => (d instanceof Date ? d.toISOString() : String(d));
const dia = (d: unknown) => iso(d).slice(0, 10);
const hoyUTC = (now = new Date()) => new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
function chk(l: Chequeo[], chequeo: string, ok: boolean, detalle: unknown) { l.push({ chequeo, ok, detalle: String(detalle) }); }
function exigir(cond: boolean, msg: string): void { if (!cond) throw new P102Error(msg); }
const fallas = (l: Chequeo[]) => l.filter((x) => !x.ok).map((x) => `${x.chequeo} (${x.detalle})`).join("; ");

/** Huella determinística de filas (Decimal → string, Date → ISO), orden por id. */
export function huella(rows: readonly Record<string, unknown>[]): string {
  const norm = (v: unknown): unknown => (v instanceof Decimal ? v.toString() : v instanceof Date ? v.toISOString() : v && typeof v === "object" && "toFixed" in (v as object) ? String(v) : v);
  const s = [...rows].sort((a, b) => String(a.id).localeCompare(String(b.id)))
    .map((r) => JSON.stringify(Object.keys(r).sort().map((k) => [k, norm(r[k])])));
  return createHash("md5").update(s.join("\n")).digest("hex");
}

/** Forma canónica profunda: claves ordenadas en todo nivel, Decimal → string, Date → ISO, undefined → null. */
export function canon(v: unknown): unknown {
  if (v === undefined || v === null) return null;
  if (v instanceof Decimal) return v.toString();
  if (v instanceof Date) return v.toISOString();
  if (typeof v === "bigint") return v.toString();
  if (Array.isArray(v)) return v.map(canon);
  if (typeof v === "object") {
    if ("toFixed" in (v as object) && typeof (v as { toString: unknown }).toString === "function") return String(v);
    const o = v as Record<string, unknown>;
    return Object.keys(o).sort().map((k) => [k, canon(o[k])]);
  }
  return v;
}
/** Huella de UNA fila completa (todas las columnas persistidas, sin selección). Fila inexistente ⇒ "AUSENTE". */
export function huellaFila(row: unknown): string {
  if (!row) return "AUSENTE";
  return createHash("sha256").update(JSON.stringify(canon(row))).digest("hex");
}

/** Entidades congeladas entre el apply y un eventual rollback (11 fijas + los 8 hechos creados = 19). */
export const CLAVES_FIJAS = ["cliente", "ccUSD", "ccARS", "op", "cajaA", "cajaB", "cajaC", "f14", "pf52c5cabd", "pfdff40087", "marianela"] as const;
export const CLAVES_CREADOS = ["regUSD", "regARS", "revCCUSD", "revCCARS", "revMovCC", "revCajaUSD", "revCajaARS", "revCajaC"] as const satisfies readonly (keyof Creados)[];
export const CLAVES_HUELLA = [...CLAVES_FIJAS, ...CLAVES_CREADOS.map((k) => `creado.${k}`)];
/** Identificador ÚNICO del algoritmo de huellasPost (apply lo escribe; rollback exige igualdad exacta). */
export const HUELLAS_ALGORITMO_P1_02 = "sha256(JSON(canon(fila completa))) · claves ordenadas · 19 entidades";

/**
 * HUELLAS POST-APPLY: fila COMPLETA (findUnique sin select ⇒ todas las columnas escalares persistidas,
 * incluidos fecha, userId, clienteNombre, createdAt/updatedAt y opcionales) de cada entidad congelada.
 * Determinística: canonicalización profunda con claves ordenadas; resultado indexado por clave fija.
 */
export async function huellasPost(db: Tx, cr: Creados): Promise<Record<string, string>> {
  const caja = (id: string) => db.movimientoCaja.findUnique({ where: { id } });
  const mcc = (id: string) => db.movimientoCC.findUnique({ where: { id } });
  const filas: Record<string, unknown> = {
    cliente: await db.cliente.findUnique({ where: { id: P1_02.clienteId } }),
    ccUSD: await db.cuentaCorriente.findUnique({ where: { id: P1_02.ccUSD } }),
    ccARS: await db.cuentaCorriente.findUnique({ where: { id: P1_02.ccARS } }),
    op: await db.operacionCambio.findUnique({ where: { id: P1_02.op } }),
    cajaA: await caja(P1_02.cajaA), cajaB: await caja(P1_02.cajaB), cajaC: await caja(P1_02.cajaC),
    f14: await mcc(P1_02.movCC),
    pf52c5cabd: await db.plazoFijo.findUnique({ where: { id: P1_02.pfs[0] } }),
    pfdff40087: await db.plazoFijo.findUnique({ where: { id: P1_02.pfs[1] } }),
    marianela: await caja(P1_02.marianela),
  };
  for (const k of CLAVES_CREADOS) filas[`creado.${k}`] = k.startsWith("revCaja") ? await caja(cr[k]) : await mcc(cr[k]);
  return Object.fromEntries(CLAVES_HUELLA.map((k) => [k, huellaFila(filas[k])]));
}
/** Claves cuya huella difiere (o falta) entre dos juegos; [] ⇒ idénticos. */
export function difHuellas(guardadas: Record<string, string> | null | undefined, actuales: Record<string, string>): string[] {
  if (!guardadas || typeof guardadas !== "object") return ["huellasPost ausentes"];
  const claves = new Set([...CLAVES_HUELLA, ...Object.keys(guardadas), ...Object.keys(actuales)]);
  return Array.from(claves).filter((k) => typeof guardadas[k] !== "string" || guardadas[k] !== actuales[k]).sort();
}

const MOV_A = { tipo: "ENTRADA", moneda: "USD", monto: "1000", descripcion: `[Cambio ${P1_02.op}] Compra divisa` };
const MOV_B = { tipo: "SALIDA", moneda: "ARS", monto: "1380000", descripcion: `[Cambio ${P1_02.op}] Pago ARS x Compra` };
const MOV_C = { tipo: "ENTRADA", moneda: "USD", monto: "2000", descripcion: `[MOV_CC] ingreso | cc:${P1_02.ccUSD}` };
const MARIANELA = { tipo: "SALIDA", moneda: "USD", monto: "1000", descripcion: "[MOV_CC] Retiro efec | cc:2cc55645-12a8-45c5-b205-d0d315f6694d" };

async function auditVigente(db: Tx) {
  const [aplicadas, rollbacks] = await Promise.all([
    db.auditLog.findMany({ where: { accion: P1_02.accion, entidadId: P1_02.clienteId } }),
    db.auditLog.findMany({ where: { accion: P1_02.accionRollback, entidadId: P1_02.clienteId } }),
  ]);
  return { aplicadas, rollbacks, vigentes: aplicadas.length - rollbacks.length };
}

/** Terceros: todo lo que NO es de Juan Pérez ni fue creado por P1-02 (debe quedar idéntico). */
export async function huellaTerceros(db: Tx, excluir: readonly string[] = []) {
  const ex = new Set<string>(excluir);
  const jpCC = new Set<string>([P1_02.ccUSD, P1_02.ccARS]);
  const [caja, cc, movcc, ops, pfs, clientes] = await Promise.all([
    db.movimientoCaja.findMany({}), db.cuentaCorriente.findMany({}), db.movimientoCC.findMany({}),
    db.operacionCambio.findMany({}), db.plazoFijo.findMany({}), db.cliente.findMany({}),
  ]);
  const jpCaja = new Set<string>([P1_02.cajaA, P1_02.cajaB, P1_02.cajaC]);
  return {
    caja: huella((caja as Record<string, unknown>[]).filter((r) => !ex.has(String(r.id)) && !jpCaja.has(String(r.id)))),
    cc: huella((cc as Record<string, unknown>[]).filter((r) => !jpCC.has(String(r.id)))),
    movcc: huella((movcc as Record<string, unknown>[]).filter((r) => !ex.has(String(r.id)) && !jpCC.has(String(r.cuentaCorrienteId)))),
    ops: huella((ops as Record<string, unknown>[]).filter((r) => r.id !== P1_02.op)),
    pfs: huella(pfs as Record<string, unknown>[]),
    clientes: huella((clientes as Record<string, unknown>[]).filter((r) => r.id !== P1_02.clienteId)),
  };
}

function chequeoCaja(c: Chequeo[], nombre: string, m: Record<string, unknown> | null | undefined, esp: typeof MOV_A, cajaId?: string) {
  chk(c, `${nombre} exacto (${esp.tipo} ${esp.monto} ${esp.moneda}, confirmado, no anulado)`,
    !!m && m.tipo === esp.tipo && m.moneda === esp.moneda && D(m.monto).eq(esp.monto) && m.descripcion === esp.descripcion
      && m.confirmado === true && m.anulado === false && (!cajaId || m.cajaId === cajaId),
    m ? `${m.tipo} ${m.monto} ${m.moneda} ${m.confirmado ? "conf" : "noconf"} ${m.anulado ? "anulado" : ""}` : "no existe");
}

/** PRECHECK (solo lectura). Estado EXACTO aprobado. */
export async function precheck(db: Tx): Promise<{ ok: boolean; chequeos: Chequeo[]; oficinaId: string | null }> {
  const c: Chequeo[] = [];
  const cli = await db.cliente.findUnique({ where: { id: P1_02.clienteId } });
  chk(c, "cliente existe", !!cli, P1_02.clienteId);
  chk(c, "cliente nombre/email seed", cli?.nombre === PREVIO.cliente.nombre && cli?.email === PREVIO.cliente.email, `${cli?.nombre} ${cli?.email}`);
  chk(c, "cliente activo=true", cli?.activo === true, cli?.activo);
  chk(c, "cliente tasaCC=4", !!cli && D(cli.tasaCC).eq(PREVIO.cliente.tasaCC), cli?.tasaCC);
  chk(c, "cliente notas NULL", !!cli && cli.notas === null, cli?.notas);
  chk(c, "cliente updatedAt sin cambios", iso(cli?.updatedAt) === PREVIO.cliente.updatedAt, iso(cli?.updatedAt));

  for (const [k, id] of [["ccUSD", P1_02.ccUSD], ["ccARS", P1_02.ccARS]] as const) {
    const cta = await db.cuentaCorriente.findUnique({ where: { id } });
    const movs = await db.movimientoCC.findMany({ where: { cuentaCorrienteId: id } });
    const p = PREVIO[k];
    chk(c, `${k} del cliente, moneda ${k === "ccUSD" ? "USD" : "ARS"}`, cta?.clienteId === P1_02.clienteId && String(cta?.moneda) === (k === "ccUSD" ? "USD" : "ARS"), `${cta?.clienteId} ${cta?.moneda}`);
    chk(c, `${k} saldo almacenado = ${p.saldo}`, !!cta && D(cta.saldo).eq(p.saldo), cta?.saldo);
    chk(c, `${k} reconstruido = ${p.reconstruido}`, saldoReconstruido(movs).eq(p.reconstruido), saldoReconstruido(movs));
    chk(c, `${k} movimientos = ${p.movimientos}`, movs.length === p.movimientos, movs.length);
    chk(c, `${k} updatedAt sin cambios`, iso(cta?.updatedAt) === p.updatedAt, iso(cta?.updatedAt));
  }
  const f14 = await db.movimientoCC.findUnique({ where: { id: P1_02.movCC } });
  chk(c, "f14e4627: INGRESO 2000 'ingreso' sin op ni operacionCambioId", !!f14 && f14.cuentaCorrienteId === P1_02.ccUSD && f14.tipo === "INGRESO"
    && D(f14.monto).eq(2000) && f14.descripcion === "ingreso" && !f14.operacionCambioId, f14 ? `${f14.tipo} ${f14.monto} ${f14.descripcion}` : "no existe");
  chk(c, "f14e4627 no revertido", !(await estaRevertidoCC(db, { id: P1_02.movCC, descripcion: null })), "");

  const op = await db.operacionCambio.findUnique({ where: { id: P1_02.op } });
  chk(c, "cambio COMPRA_USD 1000 USD a 1380 = 1.380.000 del cliente", !!op && op.tipo === "COMPRA_USD" && String(op.moneda) === "USD" && D(op.cantidad).eq(1000)
    && D(op.tipoCambio).eq(1380) && D(op.totalARS).eq(1380000) && op.clienteId === P1_02.clienteId, op ? `${op.tipo} ${op.cantidad}@${op.tipoCambio}` : "no existe");
  chk(c, "cambio pendiente=false, descripción original, no revertido", !!op && op.pendiente === PREVIO.op.pendiente && op.descripcion === PREVIO.op.descripcion && !esOpRevertida(op.descripcion), `${op?.pendiente} ${op?.descripcion}`);
  chk(c, "cambio updatedAt sin cambios", iso(op?.updatedAt) === PREVIO.op.updatedAt, iso(op?.updatedAt));
  const ccDeOp = await db.movimientoCC.count({ where: { operacionCambioId: P1_02.op } });
  chk(c, "0 MovimientoCC asociados al cambio", ccDeOp === 0, ccDeOp);

  const [a, b, cc, mar] = await Promise.all([P1_02.cajaA, P1_02.cajaB, P1_02.cajaC, P1_02.marianela].map((id) => db.movimientoCaja.findUnique({ where: { id } })));
  const oficina = await db.caja.findUnique({ where: { id: String(a?.cajaId) } });
  const oficinaId = oficina?.slug === "oficina" ? oficina.id : null;
  chk(c, "A/B/C en Caja Oficina", !!oficinaId && b?.cajaId === oficinaId && cc?.cajaId === oficinaId, oficina?.slug);
  chequeoCaja(c, "A 91ce00ff", a, MOV_A, oficinaId ?? undefined);
  chequeoCaja(c, "B c9c66de8", b, MOV_B, oficinaId ?? undefined);
  chequeoCaja(c, "C 36b9c122", cc, MOV_C, oficinaId ?? undefined);
  const patas = (await movimientosDeCambio(db, P1_02.op)).map((m) => m.id).sort();
  chk(c, "patas de caja del cambio = {A, B}", JSON.stringify(patas) === JSON.stringify([P1_02.cajaA, P1_02.cajaB].sort()), patas.join(","));
  const rev = await idsRevertidos(db, [P1_02.cajaA, P1_02.cajaB, P1_02.cajaC]);
  chk(c, "A/B/C sin reversas", rev.size === 0, rev.size);
  const refsCC = await db.movimientoCaja.findMany({ where: { descripcion: { contains: P1_02.ccUSD } } });
  chk(c, "única pata de caja que referencia la CC USD = C", refsCC.length === 1 && refsCC[0].id === P1_02.cajaC, refsCC.map((r) => r.id).join(","));
  // Marianela RIRI: existe, intacta y EXCLUIDA del caso.
  chequeoCaja(c, "Marianela RIRI 7cbe7f00 (EXCLUIDA)", mar, MARIANELA);
  chk(c, "Marianela RIRI fuera del conjunto Juan", !([P1_02.cajaA, P1_02.cajaB, P1_02.cajaC] as string[]).includes(P1_02.marianela), "excluida");

  for (const id of P1_02.pfs) {
    const pf = await db.plazoFijo.findUnique({ where: { id } });
    const n = await db.plazoFijoMovimiento.count({ where: { plazoFijoId: id } });
    chk(c, `PF ${id.slice(0, 8)} CANCELADO 5000 USD sin movimientos`, !!pf && pf.clienteId === P1_02.clienteId && pf.estado === "CANCELADO" && D(pf.capital).eq(5000)
      && D(pf.saldoActual).eq(5000) && String(pf.moneda) === "USD" && n === 0, pf ? `${pf.estado} ${pf.capital} movs ${n}` : "no existe");
  }
  const pfsCliente = await db.plazoFijo.count({ where: { clienteId: P1_02.clienteId } });
  chk(c, "cliente con exactamente 2 PF", pfsCliente === 2, pfsCliente);
  const opsCliente = await db.operacionCambio.count({ where: { clienteId: P1_02.clienteId } });
  chk(c, "cliente con exactamente 1 operación de cambio", opsCliente === 1, opsCliente);
  const marcas = await db.movimientoCC.count({ where: { descripcion: { contains: `REGULARIZACION ${P1_02.marca}` } } });
  chk(c, "sin movimientos P1-02 previos", marcas === 0, marcas);
  const au = await auditVigente(db);
  chk(c, "sin reparación P1-02 vigente (aplicadas − rollbacks = 0)", au.vigentes === 0, `aplicadas ${au.aplicadas.length}, rollbacks ${au.rollbacks.length}`);
  return { ok: c.every((x) => x.ok), chequeos: c, oficinaId };
}

/** POSTCHECK (solo lectura): reparación aplicada exactamente una vez. */
export async function postcheck(db: Tx): Promise<{ ok: boolean; chequeos: Chequeo[]; creados: Creados | null; huellasPost: Record<string, string> | null }> {
  const c: Chequeo[] = [];
  const au = await auditVigente(db);
  chk(c, "exactamente 1 reparación P1-02 vigente", au.vigentes === 1 && au.aplicadas.length >= 1, `aplicadas ${au.aplicadas.length}, rollbacks ${au.rollbacks.length}`);
  const ultima = au.aplicadas.sort((x, y) => iso(x.createdAt).localeCompare(iso(y.createdAt))).at(-1);
  const creados = ((ultima?.datosNuevos as Record<string, unknown> | undefined)?.creados ?? null) as Creados | null;
  const huellasGuardadas = ((ultima?.datosNuevos as Record<string, unknown> | undefined)?.huellasPost ?? null) as Record<string, string> | null;
  chk(c, "AuditLog con los 8 ids creados", !!creados && Object.keys(creados).length === 8, creados ? Object.keys(creados).length : "sin ids");

  const cli = await db.cliente.findUnique({ where: { id: P1_02.clienteId } });
  chk(c, "cliente inactivo", cli?.activo === false, cli?.activo);
  chk(c, "cliente tasaCC=0", !!cli && D(cli.tasaCC).isZero(), cli?.tasaCC);
  chk(c, "cliente notas P1-02", cli?.notas === P1_02.notasArchivo, cli?.notas);
  for (const [k, id, n] of [["ccUSD", P1_02.ccUSD, 4], ["ccARS", P1_02.ccARS, 2]] as const) {
    const cta = await db.cuentaCorriente.findUnique({ where: { id } });
    const movs = await db.movimientoCC.findMany({ where: { cuentaCorrienteId: id } });
    chk(c, `${k} almacenado 0`, !!cta && D(cta.saldo).isZero(), cta?.saldo);
    chk(c, `${k} reconstruido 0 (diferencia 0)`, saldoReconstruido(movs).isZero(), saldoReconstruido(movs));
    chk(c, `${k} movimientos = ${n}`, movs.length === n, movs.length);
  }
  const op = await db.operacionCambio.findUnique({ where: { id: P1_02.op } });
  chk(c, "cambio revertido (esOpRevertida, pendiente=true)", !!op && esOpRevertida(op.descripcion) && op.pendiente === true
    && (op.descripcion ?? "").endsWith(`] ${PREVIO.op.descripcion}`), op?.descripcion);
  chk(c, "cambio sin CC vigente", !(await tieneCCVigente(db, P1_02.op)), "");
  const patas = await movimientosDeCambio(db, P1_02.op);
  const neto = netoPorCajaMoneda(patas.map((m) => ({ ...m, tipo: String(m.tipo), moneda: String(m.moneda), monto: m.monto.toString() })));
  chk(c, "caja del cambio neta 0 (A/B + reversas)", patas.length === 4 && neto.length === 0, `${patas.length} patas, neto ${JSON.stringify(neto)}`);
  chk(c, "C revertida estructuralmente (Macro 3)", (await idsRevertidos(db, [P1_02.cajaC])).has(P1_02.cajaC), "");
  chk(c, "f14e4627 revertido (movref)", await estaRevertidoCC(db, { id: P1_02.movCC, descripcion: null }), "");
  if (creados) {
    const cajaJP = await db.movimientoCaja.findMany({ where: { id: { in: [P1_02.cajaA, P1_02.cajaB, P1_02.cajaC, creados.revCajaUSD, creados.revCajaARS, creados.revCajaC] } } });
    const netoJP = netoPorCajaMoneda(cajaJP.map((m) => ({ cajaId: m.cajaId, tipo: String(m.tipo), moneda: String(m.moneda), monto: m.monto.toString() })));
    chk(c, "Caja atribuible a Juan: neto 0 USD / 0 ARS", cajaJP.length === 6 && netoJP.length === 0, `${cajaJP.length} movs, neto ${JSON.stringify(netoJP)}`);
    const ccIds = [creados.regUSD, creados.regARS, creados.revCCUSD, creados.revCCARS, creados.revMovCC];
    chk(c, "los 5 MovimientoCC creados existen", (await db.movimientoCC.count({ where: { id: { in: ccIds } } })) === 5, "");
  }
  const mar = await db.movimientoCaja.findUnique({ where: { id: P1_02.marianela } });
  chequeoCaja(c, "Marianela RIRI intacta", mar, MARIANELA);
  for (const id of P1_02.pfs) {
    const pf = await db.plazoFijo.findUnique({ where: { id } });
    chk(c, `PF ${id.slice(0, 8)} intacto`, !!pf && pf.estado === "CANCELADO" && D(pf.saldoActual).eq(5000) && D(pf.capital).eq(5000) && pf.notas === null, pf?.estado);
  }
  return { ok: c.every((x) => x.ok), chequeos: c, creados, huellasPost: huellasGuardadas };
}

async function validarEjecutor(tx: Tx, ejecutorId: string) {
  const u = await tx.user.findUnique({ where: { id: ejecutorId } });
  exigir(!!u && u.activo && u.role === "ADMIN", "Ejecutor inválido: debe ser un usuario ADMIN activo");
  return u!.name ?? "ADMIN";
}

async function lockTodo(tx: Tx) {
  await tx.$queryRaw`SELECT id FROM "Cliente" WHERE id = ${P1_02.clienteId} FOR UPDATE`;
  await lockCuentas(tx, [P1_02.ccUSD, P1_02.ccARS]);
  await lockOperacionCambio(tx, P1_02.op);
  await lockMovimientosCaja(tx, [P1_02.cajaA, P1_02.cajaB, P1_02.cajaC]);
  await tx.$queryRaw`SELECT id FROM "MovimientoCC" WHERE id = ${P1_02.movCC} FOR UPDATE`;
}

/** APPLY: dentro de UNA tx (el llamador la abre). Cualquier excepción ⇒ ROLLBACK total. */
export async function aplicarTx(tx: Tx, p: { ejecutorId: string; ahora?: Date }) {
  await lockTodo(tx);
  const nombre = await validarEjecutor(tx, p.ejecutorId);
  const pre = await precheck(tx);
  if (!pre.ok || !pre.oficinaId) throw new P102Error(`PRECHECK FAIL: ${fallas(pre.chequeos)}`);
  const oficinaId = pre.oficinaId;
  const ahora = p.ahora ?? new Date();
  const fecha = hoyUTC(ahora);
  const terceros = await huellaTerceros(tx);
  const cajaAntes = new Set((await tx.movimientoCaja.findMany({})).map((m) => m.id));
  const ccAntes = new Set((await tx.movimientoCC.findMany({})).map((m) => m.id));
  const cajaC = (await tx.movimientoCaja.findUnique({ where: { id: P1_02.cajaC } }))!;

  // 1) Regularización histórica (solo ledger; el saldo almacenado NO se toca).
  const regUSD = randomUUID(), regARS = randomUUID();
  await tx.movimientoCC.create({ data: { id: regUSD, cuentaCorrienteId: P1_02.ccUSD, fecha, tipo: "EGRESO", monto: new Decimal(1000), descripcion: descRegUSD, operacionCambioId: P1_02.op, userId: p.ejecutorId } });
  await tx.movimientoCC.create({ data: { id: regARS, cuentaCorrienteId: P1_02.ccARS, fecha, tipo: "INGRESO", monto: new Decimal(1380000), descripcion: descRegARS, operacionCambioId: P1_02.op, userId: p.ejecutorId } });
  for (const [id, saldo] of [[P1_02.ccUSD, "1000"], [P1_02.ccARS, "1380000"]] as const) {
    const cta = await tx.cuentaCorriente.findUnique({ where: { id } });
    const movs = await tx.movimientoCC.findMany({ where: { cuentaCorrienteId: id } });
    exigir(!!cta && D(cta.saldo).eq(saldo) && saldoReconstruido(movs).eq(saldo), `regularización: ${id} no cuadra (almacenado ${cta?.saldo}, reconstruido ${saldoReconstruido(movs)})`);
  }

  // 2) Reversa CANÓNICA del cambio (caja A/B + CC regularizada, una sola vez).
  await revertirCambioTx(tx, { opId: P1_02.op, revertidoPor: `${nombre} · ${P1_02.marca}`, fecha, cajasAutorizadas: [oficinaId] });

  // 3) Reversa CANÓNICA del INGRESO [MOV_CC] f14e4627 en la CC…
  await revertirMovimientoCCTx(tx, { id: P1_02.movCC, userName: `${nombre} · ${P1_02.marca}`, fecha });
  // 4) …y de su pata de caja C en la MISMA tx (estructura Macro 3 de revertirMovimientoTx).
  const revCajaC = randomUUID();
  await tx.movimientoCaja.create({
    data: {
      id: revCajaC, cajaId: cajaC.cajaId, tipo: "SALIDA", monto: cajaC.monto, moneda: cajaC.moneda,
      descripcion: `${prefijoReverso(cajaC.id)} ${cajaC.descripcion ?? ""}`.slice(0, 500), confirmado: true, fecha, transferenciaRef: null,
    },
  });

  // 5) Archivo del cliente.
  await tx.cliente.update({ where: { id: P1_02.clienteId }, data: { activo: false, tasaCC: new Decimal(0), notas: P1_02.notasArchivo, updatedAt: ahora } });

  // 6) Identificar EXACTAMENTE los 8 hechos creados.
  const nuevosCaja = (await tx.movimientoCaja.findMany({})).filter((m) => !cajaAntes.has(m.id));
  const nuevosCC = (await tx.movimientoCC.findMany({})).filter((m) => !ccAntes.has(m.id));
  exigir(nuevosCaja.length === 3, `se esperaban 3 MovimientoCaja nuevos, hay ${nuevosCaja.length}`);
  exigir(nuevosCC.length === 5, `se esperaban 5 MovimientoCC nuevos, hay ${nuevosCC.length}`);
  const uno = <T extends { id: string }>(xs: T[], f: (x: T) => boolean, que: string) => { const r = xs.filter(f); exigir(r.length === 1, `hecho creado ambiguo: ${que} (${r.length})`); return r[0].id; };
  const revOp = (m: { descripcion: string | null }) => (m.descripcion ?? "").startsWith(`[REVERSO Cambio ${P1_02.op}]`);
  const creados: Creados = {
    regUSD, regARS,
    revCCUSD: uno(nuevosCC, (m) => m.cuentaCorrienteId === P1_02.ccUSD && m.tipo === "INGRESO" && D(m.monto).eq(1000) && m.operacionCambioId === P1_02.op && (m.descripcion ?? "").startsWith("[REVERSO]"), "reversa CC USD del cambio"),
    revCCARS: uno(nuevosCC, (m) => m.cuentaCorrienteId === P1_02.ccARS && m.tipo === "EGRESO" && D(m.monto).eq(1380000) && m.operacionCambioId === P1_02.op && (m.descripcion ?? "").startsWith("[REVERSO]"), "reversa CC ARS del cambio"),
    revMovCC: uno(nuevosCC, (m) => m.cuentaCorrienteId === P1_02.ccUSD && m.tipo === "EGRESO" && D(m.monto).eq(2000) && (m.descripcion ?? "").endsWith(`movref:${P1_02.movCC}`), "reversa CC f14e4627"),
    revCajaUSD: uno(nuevosCaja, (m) => revOp(m) && m.tipo === "SALIDA" && String(m.moneda) === "USD" && D(m.monto).eq(1000) && m.cajaId === oficinaId, "reversa caja USD del cambio"),
    revCajaARS: uno(nuevosCaja, (m) => revOp(m) && m.tipo === "ENTRADA" && String(m.moneda) === "ARS" && D(m.monto).eq(1380000) && m.cajaId === oficinaId, "reversa caja ARS del cambio"),
    revCajaC,
  };
  exigir(new Set(Object.values(creados)).size === 8, "ids creados no únicos");

  // 6b) Huellas post-apply (todas las escrituras de P1-02 ya hechas). El AuditLog/postcheck no tocan
  //     estas filas; tras el postcheck se recalculan y deben coincidir (ver 8).
  const huellas = await huellasPost(tx, creados);
  const ausentes = CLAVES_HUELLA.filter((k) => huellas[k] === "AUSENTE");
  exigir(Object.keys(huellas).length === CLAVES_HUELLA.length && ausentes.length === 0, `huellasPost incompletas: ${ausentes.join(", ")}`);

  // 7) AuditLog en la MISMA tx (estado previo EXACTO para el rollback).
  await tx.auditLog.create({
    data: {
      id: randomUUID(), userId: p.ejecutorId, accion: P1_02.accion, entidad: "Cliente", entidadId: P1_02.clienteId,
      datosPrevios: {
        cliente: PREVIO.cliente, ccUSD: { saldo: PREVIO.ccUSD.saldo, reconstruido: PREVIO.ccUSD.reconstruido, updatedAt: PREVIO.ccUSD.updatedAt },
        ccARS: { saldo: PREVIO.ccARS.saldo, reconstruido: PREVIO.ccARS.reconstruido, updatedAt: PREVIO.ccARS.updatedAt }, op: PREVIO.op,
      },
      datosNuevos: {
        description: `${P1_02.marca}: cliente seed/prueba Juan Pérez neutralizado y archivado. Operaciones del 2026-05-21 = QA sin movimiento físico (decisión Facundo). Compensaciones con fecha ${dia(fecha)}; sin hard delete.`,
        decision: "OPERACIONES DE PRUEBA — opción B (neutralizar + archivar)",
        clienteId: P1_02.clienteId, ccUSD: P1_02.ccUSD, ccARS: P1_02.ccARS, operacionCambioId: P1_02.op,
        cajaJuan: [P1_02.cajaA, P1_02.cajaB, P1_02.cajaC], movimientoCCRevertido: P1_02.movCC, excluido: `Marianela RIRI ${P1_02.marianela}`,
        creados, fechaCompensacion: dia(fecha),
        saldosDespues: { ccUSD: "0", ccARS: "0" }, clienteDespues: { activo: false, tasaCC: "0", notas: P1_02.notasArchivo },
        deltaFxAgostoEsperadoARS: P1_02.deltaFxAgostoEsperadoARS, ejecutorId: p.ejecutorId,
        huellasPost: huellas, huellasAlgoritmo: HUELLAS_ALGORITMO_P1_02,
      },
    },
  });

  // 8) Postcheck interno + terceros idénticos.
  const post = await postcheck(tx);
  if (!post.ok) throw new P102Error(`POSTCHECK FAIL: ${fallas(post.chequeos)}`);
  const terc2 = await huellaTerceros(tx, Object.values(creados));
  for (const k of Object.keys(terceros) as (keyof typeof terceros)[]) exigir(terceros[k] === terc2[k], `terceros modificados: ${k}`);
  const difPost = difHuellas(post.huellasPost, await huellasPost(tx, creados));
  exigir(difPost.length === 0, `huellasPost no persistidas/estables: ${difPost.join(", ")}`);
  return { creados, post };
}

/** Reparación P1-02 vigente (la ÚLTIMA aplicada, si aplicadas − rollbacks = 1). Solo lectura. */
async function reparacionVigente(db: Tx) {
  const au = await auditVigente(db);
  const ultima = [...au.aplicadas].sort((x, y) => iso(x.createdAt).localeCompare(iso(y.createdAt))).at(-1) ?? null;
  return { vigentes: au.vigentes, ultima };
}
const esObjetoPlano = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);
/** creados: objeto con EXACTAMENTE las 8 claves, cada una un id string no vacío, todos distintos. */
function creadosValidos(v: unknown): Creados | null {
  if (!esObjetoPlano(v)) return null;
  const ks = Object.keys(v).sort();
  if (JSON.stringify(ks) !== JSON.stringify([...CLAVES_CREADOS].sort())) return null;
  const ids = CLAVES_CREADOS.map((k) => v[k]);
  if (!ids.every((x) => typeof x === "string" && x.length > 0) || new Set(ids).size !== 8) return null;
  return v as unknown as Creados;
}
/** Metadata de huellas del AuditLog APPLY: FAIL-CLOSED (sin fallback ni interpretación de otros algoritmos). */
export function validarMetadataHuellas(datosNuevos: unknown): Record<string, string> {
  const dn = esObjetoPlano(datosNuevos) ? datosNuevos : {};
  const alg = dn.huellasAlgoritmo;
  exigir(typeof alg === "string" && alg === HUELLAS_ALGORITMO_P1_02, "ROLLBACK DENY: algoritmo de huellas ausente o incompatible");
  const hp = dn.huellasPost;
  exigir(esObjetoPlano(hp) && JSON.stringify(Object.keys(hp).sort()) === JSON.stringify([...CLAVES_HUELLA].sort())
    && Object.values(hp).every((h) => typeof h === "string" && /^[0-9a-f]{64}$/.test(h)), "ROLLBACK DENY: huellasPost ausentes o incompatibles");
  return hp as Record<string, string>;
}

/**
 * ROLLBACK: deshace EXACTAMENTE P1-02 en UNA tx. Orden:
 *  1) lectura read-only de la reparación candidata (solo para saber QUÉ ids bloquear);
 *  2) locks de TODO: cliente, 2 CC, cambio, A/B/C, f14, 8 creados, Marianela, 2 PF, AuditLog P1-02;
 *  3) tras los locks: relectura de la reparación vigente (debe ser la MISMA candidata, mismos 8 ids);
 *  4) ejecutor; 5) metadata de huellas (algoritmo exacto); 6) postcheck + guards semánticos;
 *  7) 19 huellas recalculadas = guardadas; 8) recién entonces writes (restauración directa).
 * Ninguna validación que autoriza el rollback usa datos leídos antes de los locks.
 */
export async function rollbackTx(tx: Tx, p: { ejecutorId: string }) {
  // 1) Candidata (read-only, sin autorizar nada todavía).
  const cand = await reparacionVigente(tx);
  exigir(cand.vigentes === 1 && !!cand.ultima, `ROLLBACK DENY: no hay exactamente 1 reparación P1-02 vigente (${cand.vigentes})`);
  const crCand = creadosValidos((cand.ultima!.datosNuevos as Record<string, unknown> | null)?.creados);
  exigir(!!crCand, "ROLLBACK DENY: metadata incompatible (creados)");
  const ccIds = [crCand!.regUSD, crCand!.regARS, crCand!.revCCUSD, crCand!.revCCARS, crCand!.revMovCC];
  const cajaIds = [crCand!.revCajaUSD, crCand!.revCajaARS, crCand!.revCajaC];

  // 2) Locks de todas las entidades relevantes.
  await lockTodo(tx);
  await lockMovimientosCaja(tx, [...cajaIds, P1_02.marianela]);
  for (const id of [...ccIds].sort()) await tx.$queryRaw`SELECT id FROM "MovimientoCC" WHERE id = ${id} FOR UPDATE`;
  for (const id of [...P1_02.pfs].sort()) await tx.$queryRaw`SELECT id FROM "PlazoFijo" WHERE id = ${id} FOR UPDATE`;
  await tx.$queryRaw`SELECT id FROM "AuditLog" WHERE "entidadId" = ${P1_02.clienteId} AND accion IN (${P1_02.accion}, ${P1_02.accionRollback}) ORDER BY id FOR UPDATE`;

  // 3) Revalidación bajo lock: la misma reparación, los mismos 8 ids.
  const vig = await reparacionVigente(tx);
  exigir(vig.vigentes === 1 && !!vig.ultima && vig.ultima.id === cand.ultima!.id, "ROLLBACK DENY: la reparación vigente cambió durante el rollback");
  const dn = vig.ultima!.datosNuevos as unknown;
  const crBajoLock = creadosValidos(esObjetoPlano(dn) ? dn.creados : null);
  exigir(!!crBajoLock && CLAVES_CREADOS.every((k) => crBajoLock[k] === crCand![k]), "ROLLBACK DENY: metadata incompatible (creados)");
  const cr = crBajoLock!;

  // 4) Ejecutor.
  await validarEjecutor(tx, p.ejecutorId);

  // 5) Metadata de huellas: algoritmo EXACTO de esta versión; si no, DENY sin interpretar nada.
  const guardadas = validarMetadataHuellas(dn);

  // 6) Postcheck (estado post-apply) bajo lock.
  const post = await postcheck(tx);
  if (!post.ok || !post.creados) throw new P102Error(`ROLLBACK DENY (estado incompatible): ${fallas(post.chequeos)}`);
  exigir(CLAVES_CREADOS.every((k) => post.creados![k] === cr[k]), "ROLLBACK DENY: metadata incompatible (creados)");

  // 7) GUARD de huella completa: ninguna entidad congelada cambió desde el apply.
  // Solo si coincide EXACTO la restauración directa de campos/updatedAt es válida.
  const difRb = difHuellas(guardadas, await huellasPost(tx, cr));
  exigir(difRb.length === 0, `ROLLBACK DENY: entidad modificada después del apply (${difRb.join(", ")})`);

  // Forma exacta de cada hecho creado.
  const ccRows = await tx.movimientoCC.findMany({ where: { id: { in: ccIds } } });
  const cajaRows = await tx.movimientoCaja.findMany({ where: { id: { in: cajaIds } } });
  exigir(ccRows.length === 5 && cajaRows.length === 3, "ROLLBACK DENY: hechos creados incompletos");
  const by = <T extends { id: string }>(xs: T[], id: string) => xs.find((x) => x.id === id)!;
  exigir(by(ccRows, cr.regUSD).descripcion === descRegUSD && by(ccRows, cr.regARS).descripcion === descRegARS, "ROLLBACK DENY: regularizaciones alteradas");
  // Dependencias posteriores: nada puede referenciar los hechos creados.
  const depCC = await tx.movimientoCC.findMany({ where: { OR: ccIds.map((id) => ({ descripcion: { contains: `movref:${id}` } })) } });
  const depCaja = await tx.movimientoCaja.findMany({ where: { OR: cajaIds.map((id) => ({ descripcion: { startsWith: prefijoReverso(id) } })) } });
  exigir(depCC.length === 0 && depCaja.length === 0, `ROLLBACK DENY: ${depCC.length + depCaja.length} hecho(s) posterior(es) dependiente(s)`);
  const ccCliente = await tx.movimientoCC.findMany({ where: { OR: [{ cuentaCorrienteId: P1_02.ccUSD }, { cuentaCorrienteId: P1_02.ccARS }] } });
  exigir(ccCliente.length === 6, `ROLLBACK DENY: la CC tiene ${ccCliente.length} movimientos (esperado 6)`);
  const patas = await movimientosDeCambio(tx, P1_02.op);
  exigir(patas.length === 4, `ROLLBACK DENY: el cambio tiene ${patas.length} patas de caja (esperado 4)`);

  // Restauración exacta.
  await tx.movimientoCC.deleteMany({ where: { id: { in: ccIds } } });
  await tx.movimientoCaja.deleteMany({ where: { id: { in: cajaIds } } });
  await tx.operacionCambio.update({ where: { id: P1_02.op }, data: { descripcion: PREVIO.op.descripcion, pendiente: PREVIO.op.pendiente, updatedAt: new Date(PREVIO.op.updatedAt) } });
  await tx.cuentaCorriente.update({ where: { id: P1_02.ccUSD }, data: { saldo: new Decimal(PREVIO.ccUSD.saldo), updatedAt: new Date(PREVIO.ccUSD.updatedAt) } });
  await tx.cuentaCorriente.update({ where: { id: P1_02.ccARS }, data: { saldo: new Decimal(PREVIO.ccARS.saldo), updatedAt: new Date(PREVIO.ccARS.updatedAt) } });
  await tx.cliente.update({ where: { id: P1_02.clienteId }, data: { activo: PREVIO.cliente.activo, tasaCC: new Decimal(PREVIO.cliente.tasaCC), notas: PREVIO.cliente.notas, updatedAt: new Date(PREVIO.cliente.updatedAt) } });
  await tx.auditLog.create({
    data: {
      id: randomUUID(), userId: p.ejecutorId, accion: P1_02.accionRollback, entidad: "Cliente", entidadId: P1_02.clienteId,
      datosPrevios: { creados: cr },
      datosNuevos: { description: `${P1_02.marca} ROLLBACK: eliminados los 8 hechos de la reparación; cambio, CC y cliente restaurados al estado previo exacto.`, ejecutorId: p.ejecutorId },
    },
  });
  // El precheck original vuelve a pasar ⇒ restauración exacta.
  const pre = await precheck(tx);
  if (!pre.ok) throw new P102Error(`ROLLBACK post FAIL: ${fallas(pre.chequeos)}`);
  return { eliminados: cr };
}

// ── CLI ───────────────────────────────────────────────────────────────────────

const HOSTS = { test: "ep-purple-waterfall-act57gj7.sa-east-1.aws.neon.tech", prod: "ep-cool-hill-acuymnh3.sa-east-1.aws.neon.tech" } as const;

/** Barrido de referencias externas: 323 columnas text/json; debe coincidir EXACTO con lo auditado. */
export const BARRIDO_ESPERADO: Record<string, Record<string, number>> = {
  "Cliente.id": { cl: 1 }, "Cliente.nombre": { nombre: 1 }, "CuentaCorriente.clienteId": { cl: 2 }, "CuentaCorriente.id": { ccUSD: 1, ccARS: 1 },
  "MovimientoCC.cuentaCorrienteId": { ccUSD: 1 }, "MovimientoCC.id": { f14: 1 }, "MovimientoCaja.descripcion": { ccUSD: 1, op: 2 },
  "MovimientoCaja.id": { A: 1, B: 1, C: 1 }, "OperacionCambio.clienteId": { cl: 1 }, "OperacionCambio.clienteNombre": { nombre: 1 },
  "OperacionCambio.id": { op: 1 }, "PlazoFijo.clienteId": { cl: 2 }, "PlazoFijo.id": { pf1: 1, pf2: 1 },
};
async function barrido(db: PrismaClient) {
  const PAT: Record<string, string> = { cl: P1_02.clienteId, ccUSD: P1_02.ccUSD, ccARS: P1_02.ccARS, op: P1_02.op, A: P1_02.cajaA, B: P1_02.cajaB, C: P1_02.cajaC, f14: P1_02.movCC, pf1: P1_02.pfs[0], pf2: P1_02.pfs[1], nombre: "juan p" };
  const cols = await db.$queryRawUnsafe<{ t: string; c: string; d: string }[]>(`SELECT table_name t, column_name c, data_type d FROM information_schema.columns WHERE table_schema='public' AND data_type IN ('text','character varying','json','jsonb') ORDER BY 1,2`);
  const out: Record<string, Record<string, number>> = {};
  for (const { t, c, d } of cols) {
    const e = d.startsWith("json") ? `"${c}"::text` : `"${c}"`;
    const [r] = await db.$queryRawUnsafe<Record<string, bigint>[]>(`SELECT ${Object.entries(PAT).map(([k, v]) => `count(*) FILTER (WHERE lower(${e}) LIKE '%${v}%') AS "${k}"`).join(",")} FROM "${t}"`);
    const h = Object.fromEntries(Object.entries(r).filter(([, v]) => Number(v) > 0).map(([k, v]) => [k, Number(v)]));
    if (Object.keys(h).length) out[`${t}.${c}`] = h;
  }
  const norm = (o: Record<string, Record<string, number>>) => JSON.stringify(Object.keys(o).sort().map((k) => [k, Object.keys(o[k]).sort().map((x) => [x, o[k][x]])]));
  return { ok: norm(out) === norm(BARRIDO_ESPERADO), columnas: cols.length, out };
}

/** Motor financiero real (import diferido: solo CLI). */
async function motor(db: PrismaClient) {
  const { cargarFinanceDataset } = await import("../../src/lib/finance/load");
  const { construirLedger } = await import("../../src/lib/finance/ledger");
  const { calcularResultadoRealizado } = await import("../../src/lib/finance/resultado");
  const ds = await cargarFinanceDataset(db as never);
  const ledger = construirLedger(ds);
  const hechoOp = ledger.hechos.find((h) => h.origen === "CAMBIO" && h.origenId === P1_02.op);
  const hechoC = ledger.hechos.find((h) => h.origen === "CAJA" && h.origenId === P1_02.cajaC);
  const res: Record<string, string> = {};
  for (const mes of ["2026-05", "2026-08", ds.hoy.slice(0, 7)]) {
    const r = calcularResultadoRealizado(ds, ledger, mes);
    res[mes] = `ARS ${r.porMoneda.ARS.toFixed(2)} · USD ${r.porMoneda.USD.toFixed(2)} · FX USD ${r.fx.USD.resultadoARS.toFixed(2)}`;
  }
  return { hechoOp: hechoOp?.estado, enFx: ledger.fxOperaciones.some((f) => f.id === P1_02.op), hechoC: hechoC?.estado, res };
}

function urlDestino(target: "test" | "prod", soloLectura: boolean): string {
  const raw = target === "prod"
    ? /^DIRECT_URL="?([^"\n]+)"?/m.exec(readFileSync(".env", "utf8"))?.[1]
    : /^TEST_DIRECT_URL="?([^"\n]+)"?/m.exec(readFileSync(".env.test.local", "utf8"))?.[1];
  if (!raw) throw new P102Error(`URL de ${target} no encontrada`);
  const u = new URL(raw);
  if (u.hostname !== HOSTS[target] || u.pathname !== "/neondb") throw new P102Error(`ABORT: base inesperada para ${target} (${u.hostname})`);
  if (soloLectura) u.searchParams.set("options", "-c default_transaction_read_only=on");
  return u.toString();
}

function imprimir(titulo: string, r: { ok: boolean; chequeos: Chequeo[] }) {
  console.log(`\n== ${titulo}: ${r.ok ? "PASS" : "FAIL"} (${r.chequeos.filter((x) => x.ok).length}/${r.chequeos.length}) ==`);
  for (const x of r.chequeos) console.log(`  [${x.ok ? "OK" : "FAIL"}] ${x.chequeo} → ${x.detalle}`);
}

async function cli(argv: string[]) {
  const arg = (k: string) => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : undefined; };
  const target = arg("--target");
  if (target !== "test" && target !== "prod") throw new P102Error("--target test|prod es obligatorio");
  const modo = argv.includes("--apply") ? "apply" : argv.includes("--rollback") ? "rollback" : argv.includes("--postcheck") ? "postcheck" : "precheck";
  const escribe = modo === "apply" || modo === "rollback";
  if (modo === "apply" && arg("--confirm") !== "P1-02") throw new P102Error("--apply requiere --confirm P1-02");
  if (modo === "rollback" && arg("--confirm") !== "P1-02-ROLLBACK") throw new P102Error("--rollback requiere --confirm P1-02-ROLLBACK");

  const db = new PrismaClient({ datasourceUrl: urlDestino(target, !escribe) });
  try {
    const [s] = await db.$queryRawUnsafe<{ ro: string }[]>(`SELECT current_setting('default_transaction_read_only') ro`);
    console.log(`[P1-02] destino ${target.toUpperCase()} ${HOSTS[target]} · modo ${modo} · sesión ${s.ro === "on" ? "READ-ONLY" : "READ-WRITE"}`);
    const opts = { timeout: 120000, maxWait: 20000, isolationLevel: "Serializable" as const };
    if (modo === "precheck" || modo === "apply") {
      const pre = await precheck(db);
      imprimir("PRECHECK", pre);
      const b = await barrido(db);
      console.log(`  [${b.ok ? "OK" : "FAIL"}] barrido de referencias externas (${b.columnas} columnas) → ${b.ok ? "idéntico al auditado" : JSON.stringify(b.out)}`);
      console.log("  motor:", JSON.stringify(await motor(db)));
      if (!pre.ok || !b.ok) { process.exitCode = 2; if (modo === "apply") throw new P102Error("PRECHECK/BARRIDO FAIL — NO APPLY"); return; }
    }
    if (modo === "postcheck") {
      const r = await postcheck(db);
      imprimir("POSTCHECK", r);
      console.log("  creados:", JSON.stringify(r.creados));
      console.log("  motor:", JSON.stringify(await motor(db)));
      process.exitCode = r.ok ? 0 : 2;
      return;
    }
    if (!escribe) return;
    const email = arg("--ejecutor");
    if (!email) throw new P102Error("--ejecutor <email ADMIN> es obligatorio para escribir");
    const ejecutor = await db.user.findUnique({ where: { email }, select: { id: true } });
    if (!ejecutor) throw new P102Error("ejecutor no encontrado");
    if (modo === "apply") {
      const r = await db.$transaction((tx) => aplicarTx(tx, { ejecutorId: ejecutor.id }), opts);
      console.log(`\n[P1-02] APPLY COMMIT OK · creados ${JSON.stringify(r.creados)}`);
      imprimir("POSTCHECK", await postcheck(db));
      console.log("  motor:", JSON.stringify(await motor(db)));
    } else {
      const r = await db.$transaction((tx) => rollbackTx(tx, { ejecutorId: ejecutor.id }), opts);
      console.log(`\n[P1-02] ROLLBACK COMMIT OK · eliminados ${JSON.stringify(r.eliminados)}`);
      imprimir("PRECHECK (post-rollback)", await precheck(db));
      console.log("  motor:", JSON.stringify(await motor(db)));
    }
  } finally {
    await db.$disconnect();
  }
}

if ((process.argv[1] ?? "").replace(/\\/g, "/").endsWith("scripts/data-repair/p1-02-juan-perez.ts")) {
  cli(process.argv.slice(2)).catch((e) => {
    console.error(`[P1-02] ABORT — ${e instanceof Error ? e.message.split("\n").filter(Boolean).slice(-2).join(" | ") : String(e)}`);
    process.exitCode = 1;
  });
}
