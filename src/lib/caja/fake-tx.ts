// Transacción Prisma FALSA en memoria para tests de integridad.service.ts:
// soporta exactamente los filtros que usa el servicio (igualdad, in, startsWith,
// endsWith, OR) y registra los locks pedidos. No modela concurrencia real
// (eso lo cubre la QA contra Postgres de TEST V5).

import { Decimal } from "@prisma/client/runtime/library";

type Row = Record<string, unknown>;
type Where = Record<string, unknown>;

function cumple(row: Row, where: Where | undefined): boolean {
  if (!where) return true;
  for (const [k, cond] of Object.entries(where)) {
    if (k === "OR") {
      if (!(cond as Where[]).some((w) => cumple(row, w))) return false;
      continue;
    }
    // Clave compuesta de Prisma ("carteraId_activoId": { carteraId, activoId }).
    if (!(k in row) && k.includes("_") && cond !== null && typeof cond === "object" && !(cond instanceof Date) && !(cond instanceof Decimal)) {
      if (!cumple(row, cond as Where)) return false;
      continue;
    }
    const v = row[k];
    if (cond !== null && typeof cond === "object" && !(cond instanceof Decimal) && !(cond instanceof Date)) {
      const c = cond as { in?: unknown[]; startsWith?: string; endsWith?: string; contains?: string; gte?: Date; lt?: Date; not?: unknown };
      if (c.in && !c.in.includes(v)) return false;
      if (c.startsWith !== undefined && !(typeof v === "string" && v.startsWith(c.startsWith))) return false;
      if (c.endsWith !== undefined && !(typeof v === "string" && v.endsWith(c.endsWith))) return false;
      if (c.contains !== undefined && !(typeof v === "string" && v.includes(c.contains))) return false;
      if (c.gte !== undefined && !(v instanceof Date && v.getTime() >= c.gte.getTime())) return false;
      if (c.lt !== undefined && !(v instanceof Date && v.getTime() < c.lt.getTime())) return false;
      if ("not" in c && v === c.not) return false;
      continue;
    }
    if (cond instanceof Date) {
      if (!(v instanceof Date && v.getTime() === cond.getTime())) return false;
      continue;
    }
    if (v !== cond) return false;
  }
  return true;
}

function aplicar(row: Row, data: Row): void {
  for (const [k, v] of Object.entries(data)) {
    if (v && typeof v === "object" && "increment" in (v as Row)) {
      row[k] = new Decimal(row[k] as Decimal.Value).plus(new Decimal((v as { increment: Decimal.Value }).increment));
    } else if (v && typeof v === "object" && "decrement" in (v as Row)) {
      row[k] = new Decimal(row[k] as Decimal.Value).minus(new Decimal((v as { decrement: Decimal.Value }).decrement));
    } else {
      row[k] = v;
    }
  }
}

export function tabla(rows: Row[], defaults: Row = {}) {
  return {
    rows,
    findUnique: async ({ where }: { where: Where }) => rows.find((r) => cumple(r, where)) ?? null,
    findUniqueOrThrow: async ({ where }: { where: Where }) => {
      const r = rows.find((x) => cumple(x, where));
      if (!r) throw new Error("no existe");
      return r;
    },
    upsert: async ({ where, create, update }: { where: Where; create: Row; update: Row }) => {
      const clave = Object.values(where)[0];
      const w = clave && typeof clave === "object" && !(clave instanceof Date) ? (clave as Where) : where;
      const r = rows.find((x) => cumple(x, w));
      if (r) { aplicar(r, update); return r; }
      const n = { ...defaults, ...create }; rows.push(n); return n;
    },
    findFirst: async ({ where }: { where?: Where } = {}) => rows.find((r) => cumple(r, where)) ?? null,
    findMany: async ({ where }: { where?: Where } = {}) => rows.filter((r) => cumple(r, where)),
    count: async ({ where }: { where?: Where } = {}) => rows.filter((r) => cumple(r, where)).length,
    create: async ({ data }: { data: Row }) => { const r = { ...defaults, ...data }; rows.push(r); return r; },
    update: async ({ where, data }: { where: Where; data: Row }) => {
      const r = rows.find((x) => cumple(x, where));
      if (!r) throw new Error("no existe");
      aplicar(r, data);
      return r;
    },
    delete: async ({ where }: { where: Where }) => {
      const i = rows.findIndex((x) => cumple(x, where));
      if (i < 0) throw new Error("no existe");
      return rows.splice(i, 1)[0];
    },
    updateMany: async ({ where, data }: { where?: Where; data: Row }) => {
      const sel = rows.filter((x) => cumple(x, where));
      sel.forEach((r) => aplicar(r, data));
      return { count: sel.length };
    },
    deleteMany: async ({ where }: { where?: Where } = {}) => {
      let count = 0;
      for (let i = rows.length - 1; i >= 0; i--) if (cumple(rows[i], where)) { rows.splice(i, 1); count++; }
      return { count };
    },
  };
}

export function fakeTx(seed: { movs?: Row[]; ops?: Row[]; ccMovs?: Row[]; cuentas?: Row[] } = {}) {
  const locks: string[] = [];
  const tx = {
    movimientoCaja: tabla(seed.movs ?? [], { confirmado: false, anulado: false, pagoDeId: null, transferenciaRef: null, operacionCambioId: null, descripcion: null }),
    operacionCambio: tabla(seed.ops ?? []),
    movimientoCC: tabla(seed.ccMovs ?? [], { operacionCambioId: null }),
    cuentaCorriente: tabla(seed.cuentas ?? []),
    $queryRaw: async (strings: TemplateStringsArray) => { locks.push(strings.join("?")); return []; },
  };
  return { tx: tx as never, db: tx, locks };
}

/** Saldo de una caja/moneda a partir de los movimientos CONFIRMADOS (invariante de caja). */
export function saldoCaja(movs: Row[], cajaId: string, moneda: string): Decimal {
  return movs
    .filter((m) => m.cajaId === cajaId && m.moneda === moneda && m.confirmado === true)
    .reduce<Decimal>((s, m) => s.plus(new Decimal(m.monto as Decimal.Value).mul(m.tipo === "ENTRADA" || m.tipo === "TRANSFERENCIA_IN" ? 1 : -1)), new Decimal(0));
}
