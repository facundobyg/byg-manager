import { describe, it, expect, vi, beforeEach } from "vitest";
import { Decimal } from "@prisma/client/runtime/library";

// P1-03B — write path canónico de precio manual (actualizarPrecioManualTx).
// tx falsa en memoria: verifica cálculo, validaciones, orden de escritura y AuditLog.
// La atomicidad real (rollback de Postgres) se prueba en TEST V5.

vi.mock("@/lib/prisma", () => ({ prisma: {} }));
vi.mock("@/lib/fecha-negocio", async () => await import("../fecha-negocio"));
vi.mock("@/lib/numero-ar", async () => await import("../numero-ar"));
vi.mock("@/lib/services/price-ticker-resolver.service", async () => await import("./price-ticker-resolver.service"));

import {
  actualizarPrecioManualTx, calcularPrecioDesdeValuacion, PrecioManualError,
  parsePrecioUnitarioAR, parseVnAR, parseValuacionAR, TOLERANCIA_VALUACION,
} from "./precio-manual.service";
import { resolveTickerForData912 } from "./price-ticker-resolver.service";

const D = (v: string | number) => new Decimal(v);
// 12/11/2026 15:00 ART
const AHORA = new Date("2026-11-12T18:00:00Z");

type Hist = { id: string; activoId: string; fecha: Date; precio: Decimal; userId: string | null };
interface Estado {
  activo: null | {
    id: string; ticker: string; categoria: string; monedaPrecio: string;
    precioActual: Decimal | null; precioAnterior: Decimal | null;
    priceSource: string; priceStatus: string; priceSyncedAt: Date | null;
    [k: string]: unknown;
  };
  pos: { cantidad: Decimal }[];
  hist: Hist[];
  audit: Record<string, any>[];
  writes: string[];
  fallarEn?: "activo" | "hist" | "audit";
}

function estado(over: Partial<Estado["activo"]> = {}, pos: string[] = ["30088"]): Estado {
  return {
    activo: {
      id: "iam", ticker: "IAM RENTA USD", categoria: "FCI", monedaPrecio: "USD",
      precioActual: null, precioAnterior: null, priceSource: "MANUAL", priceStatus: "OK", priceSyncedAt: null, ...over,
    },
    pos: pos.map((c) => ({ cantidad: D(c) })),
    hist: [], audit: [], writes: [],
  };
}

function txFalsa(st: Estado) {
  return {
    $queryRaw: vi.fn(async () => { st.writes.push("lock"); return []; }),
    activo: {
      findUnique: vi.fn(async ({ where }: any) => (st.activo && st.activo.id === where.id ? { ...st.activo } : null)),
      update: vi.fn(async ({ data }: any) => {
        if (st.fallarEn === "activo") throw new Error("fallo activo");
        Object.assign(st.activo!, data); st.writes.push("activo"); return st.activo;
      }),
    },
    posicionCartera: { findMany: vi.fn(async () => st.pos) },
    precioHistorico: {
      findFirst: vi.fn(async () => [...st.hist].sort((a, b) => b.fecha.getTime() - a.fecha.getTime())[0] ?? null),
      upsert: vi.fn(async ({ where, update, create }: any) => {
        if (st.fallarEn === "hist") throw new Error("fallo hist");
        const k = where.activoId_fecha;
        const ex = st.hist.find((h) => h.activoId === k.activoId && h.fecha.getTime() === k.fecha.getTime());
        st.writes.push("hist");
        if (ex) { Object.assign(ex, update); return ex; }
        st.hist.push({ ...create }); return create;
      }),
    },
    auditLog: {
      create: vi.fn(async ({ data }: any) => {
        if (st.fallarEn === "audit") throw new Error("fallo audit");
        st.audit.push(data); st.writes.push("audit"); return data;
      }),
    },
  };
}

const valuacion = (vn: string, total: string) => ({ modo: "VALUACION" as const, vn: parseVnAR(vn), valuacionTotal: parseValuacionAR(total) });
const correr = (st: Estado, p: Partial<Parameters<typeof actualizarPrecioManualTx>[1]> = {}) =>
  actualizarPrecioManualTx(txFalsa(st) as never, {
    activoId: "iam", entrada: valuacion("30.088", "51.385"), fechaValor: "2026-11-12",
    userId: "facu", origen: "FORM_VALUACION", ahora: AHORA, ...p,
  });

let st: Estado;
beforeEach(() => { st = estado(); });

describe("P1-03B — cálculo Decimal (valuación ÷ VN, half-up 6 decimales)", () => {
  it("IAM RENTA USD: 51.385 / 30.088 → 1,707824; VN × precio = 51.385,008512 (error < 0,01)", () => {
    const c = calcularPrecioDesdeValuacion(parseVnAR("30.088"), parseValuacionAR("51.385"));
    expect(c.precio.toString()).toBe("1.707824");
    expect(c.valuacionResultante.toString()).toBe("51385.008512");
    expect(c.diferencia.toString()).toBe("0.008512");
    expect(c.diferencia.abs().lte(TOLERANCIA_VALUACION)).toBe(true);
  });
  it("IPA: 15.109 / 11.701 → 1,291257; VN × precio = 15.108,998157 (error < 0,01)", () => {
    const c = calcularPrecioDesdeValuacion(parseVnAR("11.701"), parseValuacionAR("15.109"));
    expect(c.precio.toString()).toBe("1.291257");
    expect(c.valuacionResultante.toString()).toBe("15108.998157");
    expect(c.diferencia.toString()).toBe("-0.001843");
  });
  it("redondeo half-up exacto en el 7º decimal", () => {
    expect(calcularPrecioDesdeValuacion(D(2), D("0.0000025")).precio.toString()).toBe("0.000001"); // 0.00000125 → 0.000001
    expect(calcularPrecioDesdeValuacion(D(1), D("1.0000005")).precio.toString()).toBe("1.000001"); // .5 → arriba
    expect(calcularPrecioDesdeValuacion(D(1), D("1.00000049")).precio.toString()).toBe("1");
  });
  it("Decimal, no Number: 0,1 + 0,2 exacto", () => {
    expect(calcularPrecioDesdeValuacion(D(1), D("0.3")).precio.eq(D("0.1").plus(D("0.2")))).toBe(true);
  });
  it("VN o valuación ≤ 0 → rechazo; precio que redondea a 0 → rechazo", () => {
    expect(() => calcularPrecioDesdeValuacion(D(0), D(1))).toThrow(PrecioManualError);
    expect(() => calcularPrecioDesdeValuacion(D(1), D(0))).toThrow(PrecioManualError);
    expect(() => calcularPrecioDesdeValuacion(D(10_000_000), D("1"))).toThrow(/redondea a 0/);
  });
  it("la mala lectura vieja queda imposible: '51.385' NO es 51,385", () => {
    expect(parseValuacionAR("51.385").toString()).toBe("51385");
    expect(() => parsePrecioUnitarioAR("1.707824")).toThrow(PrecioManualError); // punto decimal en-US: rechazado
    expect(parsePrecioUnitarioAR("1,707824").toString()).toBe("1.707824");
  });
});

describe("P1-03B — actualizarPrecioManualTx: IAM / IPA", () => {
  it("IAM: precioActual 1.707824, PrecioHistorico a la fecha valor, AuditLog completo, VN NO se toca", async () => {
    const r = await correr(st);
    expect(r.precioNuevo).toBe("1.707824");
    expect(r.valuacionResultante).toBe("51385.008512");
    expect(st.activo!.precioActual!.toString()).toBe("1.707824");
    expect(st.activo!.priceSource).toBe("MANUAL");
    expect(st.activo!.priceStatus).toBe("OK");
    expect(st.activo!.priceSyncedAt).toEqual(AHORA);
    expect(st.pos[0].cantidad.toString()).toBe("30088");
    expect(st.hist).toHaveLength(1);
    expect(st.hist[0].fecha.toISOString()).toBe("2026-11-12T00:00:00.000Z");
    expect(st.hist[0].precio.toString()).toBe("1.707824");
    expect(st.hist[0].userId).toBe("facu");
    expect(st.writes).toEqual(["lock", "activo", "hist", "audit"]);

    const a = st.audit[0];
    expect(a.userId).toBe("facu");
    expect(a.accion).toBe("ACTUALIZAR_PRECIO_MANUAL");
    expect(a.entidad).toBe("Activo");
    expect(a.entidadId).toBe("iam");
    expect(a.datosPrevios).toMatchObject({ precioActual: null, precioAnterior: null, historicoFechaValor: null });
    expect(a.datosNuevos).toMatchObject({
      ticker: "IAM RENTA USD", moneda: "USD", modo: "VALUACION", vn: "30088", valuacionInformada: "51385",
      precioAnterior: null, precioNuevo: "1.707824", valuacionResultante: "51385.008512", diferenciaRedondeo: "0.008512",
      tenenciaRegistrada: "30088", fechaValor: "2026-11-12", zonaFechaValor: "America/Argentina/Buenos_Aires",
      timestamp: AHORA.toISOString(), source: "MANUAL", origen: "FORM_VALUACION", mismoDia: false,
    });
  });

  it("IPA: precioActual 1.291257", async () => {
    st = estado({ id: "ipa", ticker: "IPA" }, ["11701"]);
    const r = await correr(st, { activoId: "ipa", entrada: valuacion("11.701", "15.109") });
    expect(r.precioNuevo).toBe("1.291257");
    expect(r.diferencia).toBe("-0.001843");
    expect(st.audit[0].datosNuevos).toMatchObject({ ticker: "IPA", vn: "11701", valuacionInformada: "15109", precioNuevo: "1.291257" });
  });

  it("VN en varias carteras: se valida contra la SUMA", async () => {
    st = estado({}, ["20000", "10088"]);
    expect((await correr(st)).precioNuevo).toBe("1.707824");
  });
});

describe("P1-03B — validaciones (0 writes ante rechazo)", () => {
  const sinWrites = () => expect(st.writes.filter((w) => w !== "lock")).toEqual([]);

  it("usuario obligatorio", async () => {
    await expect(correr(st, { userId: "" })).rejects.toThrow(/sin usuario/);
    expect(st.writes).toEqual([]);
  });
  it("fecha futura (mañana argentino) → DENY", async () => {
    await expect(correr(st, { fechaValor: "2026-11-13" })).rejects.toThrow(/posterior a hoy/);
    sinWrites();
  });
  it("fecha argentina: 12/11 22:30 ART (UTC ya es 13/11) → hoy es 12/11: 13/11 DENY, 12/11 OK", async () => {
    const tarde = new Date("2026-11-13T01:30:00Z");
    await expect(correr(st, { fechaValor: "2026-11-13", ahora: tarde })).rejects.toThrow(/posterior a hoy \(2026-11-12/);
    const r = await correr(st, { fechaValor: undefined, ahora: tarde });
    expect(r.fechaValor).toBe("2026-11-12"); // default = hoy ARGENTINO, no el día UTC
    expect(st.hist[0].fecha.toISOString()).toBe("2026-11-12T00:00:00.000Z");
  });
  it("fecha inválida → DENY", async () => {
    await expect(correr(st, { fechaValor: "12/11/2026" })).rejects.toThrow(/Fecha valor inválida/);
    await expect(correr(st, { fechaValor: "2026-02-30" })).rejects.toThrow(/Fecha valor inválida/);
    sinWrites();
  });
  it("fecha valor anterior al último precio histórico → DENY (precioActual no retrocede)", async () => {
    st.hist.push({ id: "h0", activoId: "iam", fecha: new Date("2026-11-10T00:00:00Z"), precio: D("1.7"), userId: "x" });
    await expect(correr(st, { fechaValor: "2026-11-09" })).rejects.toThrow(/no puede ser anterior/);
    sinWrites();
  });
  it("VN distinto de la tenencia → DENY (el VN no se modifica desde acá)", async () => {
    await expect(correr(st, { entrada: valuacion("30.087", "51.385") })).rejects.toThrow(/no coincide con la tenencia registrada \(30088\)/);
    sinWrites();
    expect(st.pos[0].cantidad.toString()).toBe("30088");
  });
  it("sin tenencia registrada → DENY", async () => {
    st = estado({}, []);
    await expect(correr(st)).rejects.toThrow(/no hay tenencia/);
  });
  it("valuación por VN solo para instrumentos manuales (FCI/CRIPTO)", async () => {
    st = estado({ categoria: "BONO_USD", ticker: "AL30" });
    await expect(correr(st)).rejects.toThrow(/solo para instrumentos manuales/);
    sinWrites();
  });
  it("error de redondeo > 0,01 → DENY", async () => {
    // VN 1.000.000 y valuación 1.000.000,49 → precio 1.000000 (half-up de 1.00000049), dif −0,49
    st = estado({}, ["1000000"]);
    await expect(correr(st, { entrada: valuacion("1.000.000", "1.000.000,49") })).rejects.toThrow(/no representa la valuación/);
    sinWrites();
  });
  it("precio unitario ≤ 0 → DENY", async () => {
    await expect(correr(st, { entrada: { modo: "UNITARIO", precio: D(0) } })).rejects.toThrow(/mayor a 0/);
    sinWrites();
  });
  it("activo inexistente → DENY", async () => {
    await expect(correr(st, { activoId: "nope" })).rejects.toThrow(/inexistente/);
  });
});

describe("P1-03B — precioAnterior = precio previo inmediato", () => {
  it("cambia el precio → precioAnterior = precioActual previo; AuditLog guarda anterior y nuevo", async () => {
    st = estado({ precioActual: D("1.65"), precioAnterior: D("1.6") });
    await correr(st);
    expect(st.activo!.precioAnterior!.toString()).toBe("1.65");
    expect(st.audit[0].datosPrevios).toMatchObject({ precioActual: "1.65", precioAnterior: "1.6" });
    expect(st.audit[0].datosNuevos).toMatchObject({ precioAnterior: "1.65", precioNuevo: "1.707824", precioAnteriorGuardado: "1.65" });
  });
  it("mismo precio → precioAnterior NO se pisa", async () => {
    st = estado({ precioActual: D("1.707824"), precioAnterior: D("1.6") });
    await correr(st);
    expect(st.activo!.precioAnterior!.toString()).toBe("1.6");
  });
  it("sin precio previo → precioAnterior queda null", async () => {
    await correr(st);
    expect(st.activo!.precioAnterior).toBeNull();
  });
});

describe("P1-03B — mismo día y modo unitario", () => {
  it("segunda carga el MISMO día valor: upsert de una fila, cada carga deja su AuditLog", async () => {
    await correr(st);
    await correr(st, { entrada: { modo: "UNITARIO", precio: parsePrecioUnitarioAR("1,71") }, origen: "FORM_UNITARIO" });
    expect(st.hist).toHaveLength(1);
    expect(st.hist[0].precio.toString()).toBe("1.71");
    expect(st.audit).toHaveLength(2);
    expect(st.audit[1].datosPrevios.historicoFechaValor).toMatchObject({ precio: "1.707824", userId: "facu" });
    expect(st.audit[1].datosNuevos).toMatchObject({ mismoDia: true, modo: "UNITARIO", vn: null, precioAnterior: "1.707824" });
  });
});

describe("P1-03B — atomicidad: un fallo intermedio propaga (la tx hace rollback)", () => {
  it.each(["activo", "hist", "audit"] as const)("fallo en %s → la función lanza (no devuelve OK parcial)", async (donde) => {
    st.fallarEn = donde;
    await expect(correr(st)).rejects.toThrow(`fallo ${donde}`);
  });
});

describe("P1-03B — Data912 sigue sin tocar FCI", () => {
  it("IAM RENTA USD / IPA (FCI) → MANUAL_ONLY, sin consultar snapshots", () => {
    const snap = { fetchedAt: new Date(), results: {} as never, okCount: 0, failedCount: 0 };
    for (const t of ["IAM RENTA USD", "IPA"]) {
      const r = resolveTickerForData912({ bygTicker: t, category: "FCI", monedaPrecio: "USD" }, snap);
      expect(r.source).toBe("MANUAL_ONLY");
      expect(r.ok).toBe(false);
    }
  });
});
