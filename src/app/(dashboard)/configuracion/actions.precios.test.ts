import { describe, it, expect, vi, beforeEach } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

// P1-03B — Server Actions de precios manuales: todas pasan por el write path canónico
// (registrarPreciosManuales / actualizarPrecioManualTx), parser es-AR estricto, todo o nada.

const m = vi.hoisted(() => ({
  requireActionPermission: vi.fn(),
  auth: vi.fn(),
  registrar: vi.fn(),
  helperTx: vi.fn(),
  prisma: {
    $transaction: vi.fn(),
    activo: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn() },
    precioHistorico: { upsert: vi.fn(), create: vi.fn() },
  },
}));

vi.mock("@/lib/auth/permissions", () => ({ requireActionPermission: m.requireActionPermission }));
vi.mock("@/auth", () => ({ auth: m.auth }));
vi.mock("@/lib/services/audit.service", () => ({ writeAuditLog: vi.fn() }));
vi.mock("@/lib/prisma", () => ({ prisma: m.prisma }));
vi.mock("@/lib/services/config.service", () => ({
  setTCBlue: vi.fn(), setTCMep: vi.fn(), setMesActivo: vi.fn(), getProductoresConfig: vi.fn(), getAlycConfig: vi.fn(), updateAlycConfig: vi.fn(),
}));
vi.mock("@/lib/locks/withOperationalLocks", () => ({ withOperationalLocks: vi.fn() }));
vi.mock("@/lib/locks/keys", async () => await import("../../../lib/locks/keys"));
vi.mock("@/lib/locks/errors", async () => await import("../../../lib/locks/errors"));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/fecha-negocio", async () => await import("../../../lib/fecha-negocio"));
vi.mock("@/lib/numero-ar", async () => await import("../../../lib/numero-ar"));
vi.mock("@/lib/services/price-ticker-resolver.service", async () => await import("../../../lib/services/price-ticker-resolver.service"));
vi.mock("@/lib/services/precio-manual.service", async () => {
  const real = await vi.importActual<Record<string, unknown>>("../../../lib/services/precio-manual.service");
  return { ...real, registrarPreciosManuales: m.registrar, actualizarPrecioManualTx: m.helperTx };
});

import {
  registrarValuacionManual, updatePrecioActivo, updatePreciosActivosBatch, updatePreciosTickerBatch, importPreciosExcel, createActivo,
} from "./actions";

const DENEGADO = { error: "No tenés permisos para realizar esta acción." };
const fd = (e: Record<string, string | string[]>) => {
  const f = new FormData();
  for (const [k, v] of Object.entries(e)) for (const x of Array.isArray(v) ? v : [v]) f.append(k, x);
  return f;
};
const s = (d: { toString(): string }) => d.toString();
const nadaEscrito = () => {
  expect(m.registrar).not.toHaveBeenCalled();
  expect(m.helperTx).not.toHaveBeenCalled();
  expect(m.prisma.$transaction).not.toHaveBeenCalled();
  expect(m.prisma.activo.create).not.toHaveBeenCalled();
  expect(m.prisma.activo.update).not.toHaveBeenCalled();
};

beforeEach(() => {
  vi.clearAllMocks();
  m.requireActionPermission.mockResolvedValue(null);
  m.auth.mockResolvedValue({ user: { id: "facu", name: "Facu" } });
  m.prisma.$transaction.mockImplementation(async (fn: (tx: unknown) => unknown) => fn(m.prisma));
  m.registrar.mockResolvedValue([{ ticker: "IAM RENTA USD", moneda: "USD", fechaValor: "2026-11-12", precioNuevo: "1.707824", valuacionResultante: "51385.008512", diferencia: "0.008512" }]);
});

describe("P1-03B — registrarValuacionManual (VN + valuación + fecha valor)", () => {
  it("permiso configuracion:editar; denegado → 0 writes", async () => {
    m.requireActionPermission.mockResolvedValue(DENEGADO);
    expect(await registrarValuacionManual({}, fd({ activoId: "iam", vn: "30.088", valuacionTotal: "51.385", fechaValor: "2026-11-12" }))).toEqual(DENEGADO);
    expect(m.requireActionPermission).toHaveBeenCalledWith("configuracion:editar");
    expect(m.auth).not.toHaveBeenCalled();
    nadaEscrito();
  });

  it("IAM: '30.088' / '51.385' en notación argentina → Decimal 30088 / 51385, origen FORM_VALUACION, usuario de sesión", async () => {
    const r = await registrarValuacionManual({}, fd({ activoId: "iam", vn: "30.088", valuacionTotal: "51.385", fechaValor: "2026-11-12" }));
    expect(r.ok).toBe(true);
    expect(r.resultado).toMatchObject({ precioNuevo: "1.707824", valuacionResultante: "51385.008512" });
    const [[items, ctx]] = m.registrar.mock.calls;
    expect(ctx).toEqual({ userId: "facu", origen: "FORM_VALUACION" });
    expect(items[0].activoId).toBe("iam");
    expect(items[0].fechaValor).toBe("2026-11-12");
    expect(items[0].entrada.modo).toBe("VALUACION");
    expect(s(items[0].entrada.vn)).toBe("30088");
    expect(s(items[0].entrada.valuacionTotal)).toBe("51385");
  });

  it.each([
    [{ vn: "30.08", valuacionTotal: "51.385" }, /VN/],
    [{ vn: "30.088", valuacionTotal: "51.385,001" }, /Valuación.*máximo 2/],
    [{ vn: "30088.0", valuacionTotal: "51.385" }, /VN/],
    [{ vn: "", valuacionTotal: "51.385" }, /VN: vacío/],
  ])("malformado %o → error, 0 writes", async (campos, re) => {
    const r = await registrarValuacionManual({}, fd({ activoId: "iam", fechaValor: "2026-11-12", ...campos }));
    expect(r.error).toMatch(re);
    nadaEscrito();
  });

  it("fecha valor obligatoria", async () => {
    expect((await registrarValuacionManual({}, fd({ activoId: "iam", vn: "30.088", valuacionTotal: "51.385" }))).error).toMatch(/Fecha valor obligatoria/);
    nadaEscrito();
  });

  it("sesión sin usuario → error, 0 writes", async () => {
    m.auth.mockResolvedValue({ user: {} });
    expect((await registrarValuacionManual({}, fd({ activoId: "iam", vn: "30.088", valuacionTotal: "51.385", fechaValor: "2026-11-12" }))).error).toMatch(/sin usuario/i);
    nadaEscrito();
  });

  it("error de negocio del helper (p. ej. VN ≠ tenencia) → se muestra su mensaje", async () => {
    const { PrecioManualError } = await import("../../../lib/services/precio-manual.service");
    m.registrar.mockRejectedValue(new PrecioManualError("IAM RENTA USD: el VN informado (1) no coincide"));
    expect((await registrarValuacionManual({}, fd({ activoId: "iam", vn: "1", valuacionTotal: "51.385", fechaValor: "2026-11-12" }))).error).toMatch(/no coincide/);
  });

  it("error técnico → mensaje genérico (sin filtrar detalles internos)", async () => {
    m.registrar.mockRejectedValue(new Error("relation Activo secreto interno"));
    const r = await registrarValuacionManual({}, fd({ activoId: "iam", vn: "30.088", valuacionTotal: "51.385", fechaValor: "2026-11-12" }));
    expect(r.error).toBe("Error al registrar la valuación");
  });
});

describe("P1-03B — updatePrecioActivo (unitario, es-AR)", () => {
  it("'1.707824' (punto decimal en-US) → rechazo, 0 writes", async () => {
    expect((await updatePrecioActivo({}, fd({ activoId: "a", precioActual: "1.707824" }))).error).toMatch(/formato argentino/);
    nadaEscrito();
  });
  it("'1,707824' → Decimal 1.707824, fecha valor opcional", async () => {
    expect(await updatePrecioActivo({}, fd({ activoId: "a", precioActual: "1,707824", fechaValor: "2026-11-10" }))).toEqual({ ok: true });
    const [[items, ctx]] = m.registrar.mock.calls;
    expect(s(items[0].entrada.precio)).toBe("1.707824");
    expect(items[0].fechaValor).toBe("2026-11-10");
    expect(ctx.origen).toBe("FORM_UNITARIO");
  });
});

describe("P1-03B — batch: todo o nada", () => {
  it("un valor malformado rechaza el lote entero (antes se salteaba en silencio)", async () => {
    const r = await updatePreciosActivosBatch({}, fd({ activoId: ["a", "b"], precioActual: ["100", "1.5"] }));
    expect(r.error).toMatch(/no se guardó nada/);
    nadaEscrito();
  });
  it("filas vacías se ignoran; el resto en UNA llamada (una tx)", async () => {
    m.registrar.mockResolvedValue([]);
    expect(await updatePreciosActivosBatch({}, fd({ activoId: ["a", "b", "c"], precioActual: ["1.234,5", "", "2"] }))).toEqual({ ok: true, count: 2 });
    expect(m.registrar).toHaveBeenCalledTimes(1);
    expect(m.registrar.mock.calls[0][0].map((i: any) => [i.activoId, s(i.entrada.precio)])).toEqual([["a", "1234.5"], ["c", "2"]]);
    expect(m.registrar.mock.calls[0][1]).toEqual({ userId: "facu", origen: "BATCH" });
  });
});

describe("P1-03B — batch por ticker", () => {
  beforeEach(() => {
    m.registrar.mockResolvedValue([]);
    m.prisma.activo.findUnique.mockImplementation(async ({ where }: any) => (["AL30", "GGAL"].includes(where.ticker) ? { id: `id-${where.ticker}` } : null));
  });
  it("'AL30;1,5' y 'GGAL=1.234,5' → 1.5 y 1234.5 (decimal es-AR), una tx, TICKER_BATCH", async () => {
    const r = await updatePreciosTickerBatch({}, fd({ batch: "ticker;precio\nAL30;1,5\nGGAL=1.234,5" }));
    expect(r).toMatchObject({ ok: true, updated: ["AL30", "GGAL"] });
    expect(m.registrar.mock.calls[0][0].map((i: any) => s(i.entrada.precio))).toEqual(["1.5", "1234.5"]);
    expect(m.registrar.mock.calls[0][1]).toEqual({ userId: "facu", origen: "TICKER_BATCH" });
  });
  it("'AL30,1,5' (coma como separador) → inválida: antes grababa precio 1", async () => {
    const r = await updatePreciosTickerBatch({}, fd({ batch: "AL30,1,5" }));
    expect(r.invalid).toEqual(["AL30,1,5"]);
    nadaEscrito();
  });
  it("una línea inválida o un ticker inexistente → no se escribe NINGUNA", async () => {
    const r1 = await updatePreciosTickerBatch({}, fd({ batch: "AL30;1,5\nGGAL;1.5" }));
    expect(r1.error).toMatch(/no se guardó nada/);
    const r2 = await updatePreciosTickerBatch({}, fd({ batch: "AL30;1,5\nNOEXISTE;2" }));
    expect(r2.notFound).toEqual(["NOEXISTE"]);
    nadaEscrito();
  });
});

describe("P1-03B — import Excel/CSV", () => {
  beforeEach(() => {
    m.prisma.activo.findUnique.mockImplementation(async ({ where }: any) => (["AL30", "IAM RENTA USD"].includes(where.ticker) ? { id: `id-${where.ticker}` } : null));
    m.prisma.activo.create.mockImplementation(async ({ data }: any) => ({ id: data.id }));
  });
  const H = "ticker;descripcion;categoria;monedaPrecio;precioActual;nuevoPrecio";

  it("la columna precioActual del export se IGNORA (antes re-grababa el precio con fecha de hoy)", async () => {
    const r = await importPreciosExcel({}, fd({ csv: `${H}\nAL30;Bono;BONO_USD;USD;65,2;` }));
    expect(r.ok).toBe(true);
    expect(r.report).toMatchObject({ updated: [], created: [], skipped: 1 });
    nadaEscrito();
  });
  it("nuevoPrecio es-AR → helper canónico IMPORT_EXCEL con usuario, en UNA tx", async () => {
    const r = await importPreciosExcel({}, fd({ csv: `${H}\nAL30;Bono;BONO_USD;USD;65,2;66,00` }));
    expect(r.report?.updated).toEqual(["AL30"]);
    expect(m.prisma.$transaction).toHaveBeenCalledTimes(1);
    const p = m.helperTx.mock.calls[0][1];
    expect(p).toMatchObject({ activoId: "id-AL30", userId: "facu", origen: "IMPORT_EXCEL" });
    expect(s(p.entrada.precio)).toBe("66");
  });
  it("un nuevoPrecio malformado → error, no se escribe nada (tampoco las filas válidas)", async () => {
    const r = await importPreciosExcel({}, fd({ csv: `${H}\nAL30;;;;;66,00\nIAM RENTA USD;;;;;1.5` }));
    expect(r.error).toMatch(/no se guardó nada/);
    expect(r.report?.errors[0]).toMatch(/IAM RENTA USD/);
    nadaEscrito();
  });
  it("separador coma → rechazo (la coma es el decimal)", async () => {
    expect((await importPreciosExcel({}, fd({ csv: "ticker,nuevoPrecio\nAL30,66" }))).error).toMatch(/Separador no admitido/);
    nadaEscrito();
  });
  it("activo nuevo con precio → create sin precio + helper (ALTA por import) en la misma tx", async () => {
    const r = await importPreciosExcel({}, fd({ csv: `${H}\nNUEVO;Desc;CEDEAR;ARS;;1.234,5` }));
    expect(r.report?.created).toEqual(["NUEVO"]);
    expect(m.prisma.activo.create.mock.calls[0][0].data.precioActual).toBeNull();
    expect(s(m.helperTx.mock.calls[0][1].entrada.precio)).toBe("1234.5");
  });
  it("categoría inválida en alta → error, nada escrito", async () => {
    const r = await importPreciosExcel({}, fd({ csv: `${H}\nNUEVO;Desc;NOEXISTE;ARS;;1` }));
    expect(r.error).toMatch(/no se guardó nada/);
    nadaEscrito();
  });
});

describe("P1-03B — createActivo con precio inicial", () => {
  beforeEach(() => {
    m.prisma.activo.findUnique.mockResolvedValue(null);
    m.prisma.activo.create.mockImplementation(async ({ data }: any) => ({ id: data.id }));
  });
  it("precio es-AR → create sin precio + helper ALTA_ACTIVO (historial + AuditLog)", async () => {
    expect(await createActivo({}, fd({ ticker: "x", categoria: "CEDEAR", precioActual: "1.234,5" }))).toEqual({ ok: true });
    expect(m.prisma.activo.create.mock.calls[0][0].data.precioActual).toBeNull();
    expect(m.helperTx.mock.calls[0][1]).toMatchObject({ userId: "facu", origen: "ALTA_ACTIVO" });
    expect(s(m.helperTx.mock.calls[0][1].entrada.precio)).toBe("1234.5");
  });
  it("precio malformado → error, no se crea el activo", async () => {
    expect((await createActivo({}, fd({ ticker: "x", categoria: "CEDEAR", precioActual: "1.5" }))).error).toMatch(/formato argentino/);
    nadaEscrito();
  });
  it("sin precio → solo catálogo, sin helper", async () => {
    expect(await createActivo({}, fd({ ticker: "x", categoria: "CEDEAR" }))).toEqual({ ok: true });
    expect(m.helperTx).not.toHaveBeenCalled();
  });
});

// ── Guard estático: ningún writer manual de precio fuera del write path canónico ──
describe("P1-03B — sin bypasses (escaneo del código)", () => {
  const ROOT = join(__dirname, "../../..");
  const archivos: string[] = [];
  (function walk(d: string) {
    for (const n of readdirSync(d)) {
      const p = join(d, n);
      if (statSync(p).isDirectory()) walk(p);
      else if (/\.(ts|tsx)$/.test(n) && !/\.test\.tsx?$/.test(n)) archivos.push(p);
    }
  })(ROOT);
  const rel = (p: string) => relative(ROOT, p).replace(/\\/g, "/");
  const PERMITIDOS = new Set(["lib/services/precio-manual.service.ts", "lib/services/data912-price-sync.service.ts"]);

  it("PrecioHistorico solo se escribe en precio-manual.service (manual) y data912-price-sync (DATA912)", () => {
    const ofensores = archivos.filter((p) => /precioHistorico\.(upsert|create|update|createMany|updateMany)\b/.test(readFileSync(p, "utf8")) && !PERMITIDOS.has(rel(p)));
    expect(ofensores.map(rel)).toEqual([]);
  });

  it("Activo.precioActual con valor solo se escribe en esos dos servicios (las altas van con precioActual: null)", () => {
    const ofensores: string[] = [];
    for (const p of archivos) {
      if (PERMITIDOS.has(rel(p))) continue;
      const src = readFileSync(p, "utf8");
      for (const mm of Array.from(src.matchAll(/(?:activo|Activo)\.(?:create|update|upsert|updateMany)\(\s*\{[\s\S]{0,600}?\}\s*\)/g))) {
        if (/precioActual\s*:(?!\s*null)/.test(mm[0])) ofensores.push(rel(p));
      }
    }
    expect(ofensores).toEqual([]);
  });

  it("el parser inseguro .replace(\",\", \".\") ya no lee ningún PRECIO (quedan solo TC blue/MEP y % socios, fuera de alcance)", () => {
    const src = readFileSync(join(ROOT, "app/(dashboard)/configuracion/actions.ts"), "utf8");
    const lineas = src.split("\n").filter((l) => l.includes(`.replace(",", ".")`)).map((l) => l.trim());
    expect(lineas.some((l) => /precio/i.test(l))).toBe(false);
    expect(lineas).toEqual([
      `const raw = formData.get("valor")?.toString().trim().replace(",", ".");`, // updateTCBlue (P1-03A, FREEZE)
      `const raw = formData.get("valor")?.toString().trim().replace(",", ".");`, // updateTCMep
      `const raw = pcts[i]?.toString().trim().replace(",", ".");`,                // updateSociosPorcentaje
    ]);
  });
});
