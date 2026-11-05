// P1-01 — DATA REPAIR PUNTUAL: Augusto Ber, CC USD c99efc46.
//
// INCIDENTE: el 2026-08-12 se creó el PF d1a367fc (5.000 USD) con el código legacy 4062b54
// (clientes/actions.ts crearPlazoFijo): plazoFijo.create + cuentaCorriente.upsert({ saldo: decrement })
// SIN MovimientoCC. El saldo almacenado (33.491) es el económico correcto; al historial le falta el
// EGRESO de 5.000 (reconstruido = 38.491). AuditLog original: c74adff8 (CREAR PlazoFijo).
//
// REPARACIÓN (solo historia; el saldo NO se toca): en UNA transacción, con locks y revalidación,
//   - 1 MovimientoCC EGRESO 5.000 fecha 2026-08-12 "PF egreso | op:<ref> | REPARACION HISTORICA P1-01 …"
//   - notas del PF = "PF desde CC | op:<ref>" (mismo vínculo que crearPfDesdeCCTx)
//   - AuditLog REPARACION_CC_HISTORICA en la misma tx
//   - assert: almacenado = reconstruido = 33.491; PF intacto salvo notas.
// No usa registrarMovimientoCC (movería el saldo a 28.491).
//
// Uso (por defecto SOLO LECTURA):
//   npx tsx scripts/data-repair/p1-01-augusto-ber-cc.ts --target test|prod [--precheck]
//   npx tsx scripts/data-repair/p1-01-augusto-ber-cc.ts --target test|prod --postcheck
//   npx tsx scripts/data-repair/p1-01-augusto-ber-cc.ts --target … --apply --confirm P1-01 --ejecutor <email ADMIN>
//   npx tsx scripts/data-repair/p1-01-augusto-ber-cc.ts --target … --rollback --confirm P1-01-ROLLBACK --ejecutor <email ADMIN>
// precheck/postcheck abren la sesión Postgres en read-only. Nunca imprime credenciales.

import { readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { PrismaClient, type Prisma } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";
import { refOperacion, saldoInicialInteresCC, saldoReconstruido, tipoOperacionCC } from "../../src/lib/cc/integridad";
import { lockCuentas, lockPlazoFijo } from "../../src/lib/cc/integridad.service";

type Tx = Prisma.TransactionClient;

export const P1_01 = {
  cuentaId: "c99efc46-2fe2-4c4b-8776-4cb472c41474",
  clienteId: "5aa56dc4-b5e2-425b-81a4-53e7564716df",
  pfId: "d1a367fc-d2c4-4806-a5de-9a20dcd2f781",
  moneda: "USD",
  fecha: new Date(Date.UTC(2026, 7, 12)),
  fechaVencimiento: new Date(Date.UTC(2027, 7, 12)),
  monto: new Decimal(5000),
  saldoAlmacenado: new Decimal(33491),
  reconstruidoAntes: new Decimal(38491),
  movimientosAntes: 322,
  marca: "REPARACION HISTORICA P1-01",
  accion: "REPARACION_CC_HISTORICA",
  accionRollback: "REPARACION_CC_HISTORICA_ROLLBACK",
  legacyCommit: "4062b54",
  auditOriginal: "c74adff8-8662-4722-a854-d6baf571a75e",
} as const;

export const descripcionReparacion = (ref: string) =>
  `PF egreso | op:${ref} | ${P1_01.marca}: PF d1a367fc creado 2026-08-12 sin MovimientoCC (legacy ${P1_01.legacyCommit})`;
export const notasPfCanonicas = (ref: string) => `PF desde CC | op:${ref}`;

export class P101Error extends Error {}

export interface Chequeo { chequeo: string; ok: boolean; detalle: string }
export interface Estado {
  saldo: string | null; reconstruido: string; diferencia: string | null; movimientos: number;
  reparaciones: { id: string; ref: string | null; descripcion: string | null }[];
  pf: { capital: string; saldoActual: string; estado: string; fechaInicio: string; fechaVencimiento: string; notas: string | null } | null;
  pfMovimientos: number; auditAplicadas: number; auditRollbacks: number;
}

const D = (v: unknown) => new Decimal(String(v));
const dia = (d: unknown) => (d instanceof Date ? d.toISOString().slice(0, 10) : String(d).slice(0, 10));

/** Lectura del estado relevante (sirve igual dentro y fuera de la tx). */
export async function leerEstado(db: Tx): Promise<Estado> {
  const cuenta = await db.cuentaCorriente.findUnique({ where: { id: P1_01.cuentaId } });
  const movs = await db.movimientoCC.findMany({ where: { cuentaCorrienteId: P1_01.cuentaId } });
  const reconstruido = saldoReconstruido(movs);
  const pf = await db.plazoFijo.findUnique({ where: { id: P1_01.pfId } });
  const [pfMovimientos, auditAplicadas, auditRollbacks] = await Promise.all([
    db.plazoFijoMovimiento.count({ where: { plazoFijoId: P1_01.pfId } }),
    db.auditLog.count({ where: { accion: P1_01.accion, entidadId: P1_01.cuentaId } }),
    db.auditLog.count({ where: { accion: P1_01.accionRollback, entidadId: P1_01.cuentaId } }),
  ]);
  return {
    saldo: cuenta ? D(cuenta.saldo).toString() : null,
    reconstruido: reconstruido.toString(),
    diferencia: cuenta ? D(cuenta.saldo).minus(reconstruido).toString() : null,
    movimientos: movs.length,
    reparaciones: movs.filter((m) => (m.descripcion ?? "").includes(P1_01.marca))
      .map((m) => ({ id: m.id, ref: refOperacion(m.descripcion), descripcion: m.descripcion })),
    pf: pf && {
      capital: D(pf.capital).toString(), saldoActual: D(pf.saldoActual).toString(), estado: String(pf.estado),
      fechaInicio: dia(pf.fechaInicio), fechaVencimiento: dia(pf.fechaVencimiento), notas: pf.notas ?? null,
    },
    pfMovimientos, auditAplicadas, auditRollbacks,
  };
}

function chk(lista: Chequeo[], chequeo: string, ok: boolean, detalle: string) { lista.push({ chequeo, ok, detalle }); }

/** PF intacto en todo lo económico (las notas se evalúan aparte). */
function chequeosPf(c: Chequeo[], db: Estado["pf"], movsPf: number) {
  chk(c, "PF existe", !!db, db ? P1_01.pfId : "no existe");
  if (!db) return;
  chk(c, "PF capital = 5000", D(db.capital).eq(P1_01.monto), db.capital);
  chk(c, "PF saldoActual = 5000", D(db.saldoActual).eq(P1_01.monto), db.saldoActual);
  chk(c, "PF estado ACTIVO", db.estado === "ACTIVO", db.estado);
  chk(c, "PF fechaInicio = 2026-08-12", db.fechaInicio === "2026-08-12", db.fechaInicio);
  chk(c, "PF fechaVencimiento = 2027-08-12", db.fechaVencimiento === "2027-08-12", db.fechaVencimiento);
  chk(c, "PF sin movimientos propios", movsPf === 0, String(movsPf));
}

/** PRECHECK (solo lectura): estado exacto auditado antes de reparar. */
export async function precheck(db: Tx): Promise<{ ok: boolean; chequeos: Chequeo[]; estado: Estado }> {
  const c: Chequeo[] = [];
  const cuenta = await db.cuentaCorriente.findUnique({ where: { id: P1_01.cuentaId } });
  chk(c, "cuenta exacta", !!cuenta, cuenta ? P1_01.cuentaId : "no existe");
  chk(c, "cliente exacto", cuenta?.clienteId === P1_01.clienteId, String(cuenta?.clienteId));
  chk(c, "moneda USD", String(cuenta?.moneda) === P1_01.moneda, String(cuenta?.moneda));
  const pfRow = await db.plazoFijo.findUnique({ where: { id: P1_01.pfId } });
  chk(c, "PF del mismo cliente", pfRow?.clienteId === P1_01.clienteId, String(pfRow?.clienteId));
  chk(c, "PF moneda USD", String(pfRow?.moneda) === P1_01.moneda, String(pfRow?.moneda));
  const e = await leerEstado(db);
  chk(c, "saldo almacenado = 33491", e.saldo !== null && D(e.saldo).eq(P1_01.saldoAlmacenado), String(e.saldo));
  chk(c, "saldo reconstruido = 38491", D(e.reconstruido).eq(P1_01.reconstruidoAntes), e.reconstruido);
  chk(c, "diferencia = -5000", e.diferencia !== null && D(e.diferencia).eq(P1_01.monto.neg()), String(e.diferencia));
  chk(c, "movimientos = 322", e.movimientos === P1_01.movimientosAntes, String(e.movimientos));
  chequeosPf(c, e.pf, e.pfMovimientos);
  chk(c, "PF notas NULL", !!e.pf && e.pf.notas === null, String(e.pf?.notas));
  chk(c, "sin reparación P1-01 previa", e.reparaciones.length === 0, String(e.reparaciones.length));
  const equivalentes = await db.movimientoCC.count({ where: { cuentaCorrienteId: P1_01.cuentaId, descripcion: { startsWith: "PF egreso | op:" } } });
  chk(c, "sin 'PF egreso | op:' equivalente en la cuenta", equivalentes === 0, String(equivalentes));
  const refsPf = await db.movimientoCC.count({ where: { descripcion: { contains: P1_01.pfId } } });
  chk(c, "ningún MovimientoCC referencia el PF", refsPf === 0, String(refsPf));
  chk(c, "sin AuditLog REPARACION_CC_HISTORICA vigente (aplicadas − rollbacks = 0)",
    e.auditAplicadas - e.auditRollbacks === 0, `aplicadas ${e.auditAplicadas}, rollbacks ${e.auditRollbacks}`);
  return { ok: c.every((x) => x.ok), chequeos: c, estado: e };
}

/** POSTCHECK (solo lectura): reparación aplicada exactamente una vez y consistente. */
export async function postcheck(db: Tx, ahora = new Date()): Promise<{ ok: boolean; chequeos: Chequeo[]; estado: Estado }> {
  const c: Chequeo[] = [];
  const e = await leerEstado(db);
  chk(c, "saldo almacenado = 33491", e.saldo !== null && D(e.saldo).eq(P1_01.saldoAlmacenado), String(e.saldo));
  chk(c, "saldo reconstruido = 33491", D(e.reconstruido).eq(P1_01.saldoAlmacenado), e.reconstruido);
  chk(c, "diferencia (reconciliación) = 0", e.diferencia !== null && D(e.diferencia).isZero(), String(e.diferencia));
  chk(c, "movimientos = 323", e.movimientos === P1_01.movimientosAntes + 1, String(e.movimientos));
  chk(c, "exactamente 1 reparación P1-01", e.reparaciones.length === 1, String(e.reparaciones.length));
  const rep = e.reparaciones[0];
  if (rep) {
    const mov = await db.movimientoCC.findUnique({ where: { id: rep.id } });
    chk(c, "reparación: EGRESO 5000 USD fecha 2026-08-12",
      !!mov && mov.tipo === "EGRESO" && D(mov.monto).eq(P1_01.monto) && dia(mov.fecha) === "2026-08-12" && !mov.operacionCambioId,
      mov ? `${mov.tipo} ${mov.monto} ${dia(mov.fecha)}` : "no existe");
    chk(c, "reparación: tipo de operación canónico 'PF'", tipoOperacionCC(rep.descripcion) === "PF", tipoOperacionCC(rep.descripcion));
    chk(c, "PF notas = 'PF desde CC | op:<ref>' (mismo ref)", !!rep.ref && e.pf?.notas === notasPfCanonicas(rep.ref) && refOperacion(e.pf?.notas) === rep.ref, String(e.pf?.notas));
  }
  chequeosPf(c, e.pf, e.pfMovimientos);
  chk(c, "1 AuditLog REPARACION_CC_HISTORICA vigente", e.auditAplicadas - e.auditRollbacks === 1, `aplicadas ${e.auditAplicadas}, rollbacks ${e.auditRollbacks}`);
  // Interés futuro: el saldo base que usaría la liquidación (historial) = saldo almacenado.
  const movs = await db.movimientoCC.findMany({ where: { cuentaCorrienteId: P1_01.cuentaId } });
  const base = saldoInicialInteresCC(movs, ahora);
  chk(c, "base de interés CC (historial) = 33491", base.eq(P1_01.saldoAlmacenado), base.toString());
  return { ok: c.every((x) => x.ok), chequeos: c, estado: e };
}

function exigir(cond: boolean, msg: string): void { if (!cond) throw new P101Error(msg); }

async function validarEjecutor(tx: Tx, ejecutorId: string): Promise<void> {
  const u = await tx.user.findUnique({ where: { id: ejecutorId } });
  exigir(!!u && u.activo && u.role === "ADMIN", "Ejecutor inválido: debe ser un usuario ADMIN activo");
}

/** APPLY: dentro de UNA tx (el llamador la abre). Cualquier excepción ⇒ ROLLBACK total. */
export async function aplicarTx(tx: Tx, p: { ejecutorId: string; ref?: string; movimientoId?: string }) {
  await lockCuentas(tx, [P1_01.cuentaId]);
  await lockPlazoFijo(tx, P1_01.pfId);
  await validarEjecutor(tx, p.ejecutorId);

  const pre = await precheck(tx);
  if (!pre.ok) throw new P101Error(`PRECHECK FAIL: ${pre.chequeos.filter((x) => !x.ok).map((x) => `${x.chequeo} (${x.detalle})`).join("; ")}`);

  const ref = p.ref ?? randomUUID();
  const movimientoId = p.movimientoId ?? randomUUID();
  exigir(/^[a-zA-Z0-9-]+$/.test(ref), "ref inválido");
  const descripcion = descripcionReparacion(ref);
  exigir(refOperacion(descripcion) === ref && tipoOperacionCC(descripcion) === "PF", "descripción no canónica");

  // Historia: el movimiento faltante. NO se toca CuentaCorriente.saldo (no se usa registrarMovimientoCC).
  await tx.movimientoCC.create({
    data: {
      id: movimientoId, cuentaCorrienteId: P1_01.cuentaId, fecha: P1_01.fecha, tipo: "EGRESO", monto: P1_01.monto,
      descripcion, operacionCambioId: null, userId: p.ejecutorId,
    },
  });
  // Vínculo canónico PF ↔ CC (solo notas).
  await tx.plazoFijo.update({ where: { id: P1_01.pfId }, data: { notas: notasPfCanonicas(ref) } });

  await tx.auditLog.create({
    data: {
      id: randomUUID(), userId: p.ejecutorId, accion: P1_01.accion, entidad: "CuentaCorriente", entidadId: P1_01.cuentaId,
      datosPrevios: {
        saldoAlmacenado: pre.estado.saldo, saldoReconstruido: pre.estado.reconstruido, movimientos: pre.estado.movimientos, pfNotas: null,
      },
      datosNuevos: {
        description: `P1-01: EGRESO PF faltante agregado al historial (PF ${P1_01.pfId} creado 2026-08-12 sin MovimientoCC, legacy ${P1_01.legacyCommit}). Saldo almacenado sin cambios.`,
        motivo: "PF creado desde CC por código legacy sin MovimientoCC",
        incidente: `legacy ${P1_01.legacyCommit} / AuditLog ${P1_01.auditOriginal}`,
        cuentaId: P1_01.cuentaId, clienteId: P1_01.clienteId, plazoFijoId: P1_01.pfId, movimientoId, operationRef: ref,
        saldoAlmacenadoAntes: P1_01.saldoAlmacenado.toString(), saldoAlmacenadoDespues: P1_01.saldoAlmacenado.toString(),
        saldoReconstruidoAntes: P1_01.reconstruidoAntes.toString(), saldoReconstruidoDespues: P1_01.saldoAlmacenado.toString(),
        ejecutorId: p.ejecutorId,
      },
    },
  });

  const post = await postcheck(tx);
  if (!post.ok) throw new P101Error(`POSTCHECK FAIL: ${post.chequeos.filter((x) => !x.ok).map((x) => `${x.chequeo} (${x.detalle})`).join("; ")}`);
  return { movimientoId, operationRef: ref, post };
}

/** ROLLBACK: deshace EXACTAMENTE la reparación P1-01, en UNA tx. El saldo no se toca. */
export async function rollbackTx(tx: Tx, p: { ejecutorId: string }) {
  await lockCuentas(tx, [P1_01.cuentaId]);
  await lockPlazoFijo(tx, P1_01.pfId);
  await validarEjecutor(tx, p.ejecutorId);

  const post = await postcheck(tx);
  if (!post.ok) throw new P101Error(`ROLLBACK DENY (estado incompatible): ${post.chequeos.filter((x) => !x.ok).map((x) => `${x.chequeo} (${x.detalle})`).join("; ")}`);
  const rep = post.estado.reparaciones[0];
  const ref = rep.ref!;
  // Hechos posteriores dependientes: reversas (ref:/movref:) u otros movimientos con el mismo op.
  const dependientes = await tx.movimientoCC.findMany({
    where: { OR: [{ descripcion: { contains: `ref:${ref}` } }, { descripcion: { contains: `movref:${rep.id}` } }, { descripcion: { contains: `op:${ref}` } }] },
  });
  const ajenos = dependientes.filter((m) => m.id !== rep.id);
  exigir(ajenos.length === 0, `ROLLBACK DENY: ${ajenos.length} hecho(s) posterior(es) dependiente(s) de la reparación`);
  const cajaDep = await tx.movimientoCaja.count({ where: { descripcion: { contains: `op:${ref}` } } });
  exigir(cajaDep === 0, "ROLLBACK DENY: movimientos de caja dependientes de la reparación");

  await tx.movimientoCC.delete({ where: { id: rep.id } });
  await tx.plazoFijo.update({ where: { id: P1_01.pfId }, data: { notas: null } });
  await tx.auditLog.create({
    data: {
      id: randomUUID(), userId: p.ejecutorId, accion: P1_01.accionRollback, entidad: "CuentaCorriente", entidadId: P1_01.cuentaId,
      datosPrevios: { movimientoId: rep.id, operationRef: ref, saldoReconstruido: P1_01.saldoAlmacenado.toString(), pfNotas: notasPfCanonicas(ref) },
      datosNuevos: {
        description: `P1-01 ROLLBACK: se quitó el EGRESO de reparación ${rep.id} y se restauraron las notas del PF a NULL. Saldo almacenado sin cambios.`,
        saldoAlmacenado: P1_01.saldoAlmacenado.toString(), saldoReconstruido: P1_01.reconstruidoAntes.toString(), ejecutorId: p.ejecutorId,
      },
    },
  });

  const e = await leerEstado(tx);
  exigir(e.movimientos === P1_01.movimientosAntes, `ROLLBACK post: movimientos ${e.movimientos}`);
  exigir(D(e.reconstruido).eq(P1_01.reconstruidoAntes), `ROLLBACK post: reconstruido ${e.reconstruido}`);
  exigir(e.saldo !== null && D(e.saldo).eq(P1_01.saldoAlmacenado), `ROLLBACK post: saldo ${e.saldo}`);
  exigir(e.pf?.notas === null && e.reparaciones.length === 0, "ROLLBACK post: PF/reparación no restaurados");
  exigir(e.auditAplicadas - e.auditRollbacks === 0, "ROLLBACK post: auditoría inconsistente");
  return { movimientoEliminado: rep.id, operationRef: ref, estado: e };
}

// ── CLI ───────────────────────────────────────────────────────────────────────

const HOSTS = { test: "ep-purple-waterfall-act57gj7.sa-east-1.aws.neon.tech", prod: "ep-cool-hill-acuymnh3.sa-east-1.aws.neon.tech" } as const;

function urlDestino(target: "test" | "prod", soloLectura: boolean): string {
  const raw = target === "prod"
    ? /^DIRECT_URL="?([^"\n]+)"?/m.exec(readFileSync(".env", "utf8"))?.[1]
    : /^TEST_DIRECT_URL="?([^"\n]+)"?/m.exec(readFileSync(".env.test.local", "utf8"))?.[1];
  if (!raw) throw new P101Error(`URL de ${target} no encontrada`);
  const u = new URL(raw);
  if (u.hostname !== HOSTS[target] || u.pathname !== "/neondb") throw new P101Error(`ABORT: base inesperada para ${target} (${u.hostname})`);
  if (soloLectura) u.searchParams.set("options", "-c default_transaction_read_only=on");
  return u.toString();
}

/** Huella de TODA la tabla de caja (para probar que la reparación no la toca). */
async function huellaCaja(db: PrismaClient): Promise<string> {
  const [r] = await db.$queryRawUnsafe<{ n: bigint; h: string | null }[]>(
    `SELECT count(*) n, md5(string_agg(id||'|'||"cajaId"||'|'||tipo||'|'||moneda||'|'||monto::text||'|'||confirmado::text||'|'||anulado::text||'|'||coalesce(descripcion,''), ',' ORDER BY id)) h FROM "MovimientoCaja"`);
  return `${r.n}:${r.h}`;
}

function imprimir(titulo: string, r: { ok: boolean; chequeos: Chequeo[]; estado: Estado }) {
  console.log(`\n== ${titulo}: ${r.ok ? "PASS" : "FAIL"} ==`);
  for (const x of r.chequeos) console.log(`  [${x.ok ? "OK" : "FAIL"}] ${x.chequeo} → ${x.detalle}`);
  console.log("  estado:", JSON.stringify({ ...r.estado, reparaciones: r.estado.reparaciones.map((m) => ({ id: m.id, ref: m.ref })) }));
}

async function cli(argv: string[]) {
  const arg = (k: string) => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : undefined; };
  const target = arg("--target");
  if (target !== "test" && target !== "prod") throw new P101Error("--target test|prod es obligatorio");
  const modo = argv.includes("--apply") ? "apply" : argv.includes("--rollback") ? "rollback" : argv.includes("--postcheck") ? "postcheck" : "precheck";
  const escribe = modo === "apply" || modo === "rollback";
  if (modo === "apply" && arg("--confirm") !== "P1-01") throw new P101Error("--apply requiere --confirm P1-01");
  if (modo === "rollback" && arg("--confirm") !== "P1-01-ROLLBACK") throw new P101Error("--rollback requiere --confirm P1-01-ROLLBACK");

  const db = new PrismaClient({ datasourceUrl: urlDestino(target, !escribe) });
  try {
    const [s] = await db.$queryRawUnsafe<{ ro: string }[]>(`SELECT current_setting('default_transaction_read_only') ro`);
    console.log(`[P1-01] destino ${target.toUpperCase()} ${HOSTS[target]} · modo ${modo} · sesión ${s.ro === "on" ? "READ-ONLY" : "READ-WRITE"}`);
    if (!escribe) {
      const r = modo === "precheck" ? await precheck(db) : await postcheck(db);
      imprimir(modo.toUpperCase(), r);
      console.log("  huella caja:", await huellaCaja(db));
      process.exitCode = r.ok ? 0 : 2;
      return;
    }
    const email = arg("--ejecutor");
    if (!email) throw new P101Error("--ejecutor <email ADMIN> es obligatorio para escribir");
    const ejecutor = await db.user.findUnique({ where: { email }, select: { id: true } });
    if (!ejecutor) throw new P101Error("ejecutor no encontrado");
    const cajaAntes = await huellaCaja(db);
    const opts = { timeout: 60000, maxWait: 20000, isolationLevel: "Serializable" as const };
    if (modo === "apply") {
      imprimir("PRECHECK", await precheck(db));
      const r = await db.$transaction((tx) => aplicarTx(tx, { ejecutorId: ejecutor.id }), opts);
      console.log(`\n[P1-01] APPLY COMMIT OK · movimiento ${r.movimientoId} · op ${r.operationRef}`);
      imprimir("POSTCHECK", await postcheck(db));
    } else {
      const r = await db.$transaction((tx) => rollbackTx(tx, { ejecutorId: ejecutor.id }), opts);
      console.log(`\n[P1-01] ROLLBACK COMMIT OK · movimiento eliminado ${r.movimientoEliminado} · op ${r.operationRef}`);
      console.log("  estado:", JSON.stringify({ ...r.estado, reparaciones: [] }));
    }
    const cajaDespues = await huellaCaja(db);
    console.log(`  caja: ${cajaAntes === cajaDespues ? "IDÉNTICA" : "CAMBIÓ"} (${cajaDespues})`);
    if (cajaAntes !== cajaDespues) process.exitCode = 3;
  } finally {
    await db.$disconnect();
  }
}

if ((process.argv[1] ?? "").replace(/\\/g, "/").endsWith("scripts/data-repair/p1-01-augusto-ber-cc.ts")) {
  cli(process.argv.slice(2)).catch((e) => {
    console.error(`[P1-01] ABORT — ${e instanceof Error ? e.message.split("\n").filter(Boolean).slice(-2).join(" | ") : String(e)}`);
    process.exitCode = 1;
  });
}
