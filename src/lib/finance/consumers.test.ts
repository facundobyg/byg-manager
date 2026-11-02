import { describe, it, expect, vi } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";
import { calcularPatrimonioNeto } from "./patrimonio";
import { caja, dataset, mov } from "./test-fixtures";
import { presentarTotal } from "./quality";

// Home (getPosicionPN), Reportes (getBalanceGeneral) y Posición (getPatrimonioNeto
// directo) deben recibir el MISMO PN canónico. Ninguna pantalla recalcula PN.

const pn = calcularPatrimonioNeto(dataset({
  cajas: [caja({ saldoInicialUSD: 100 })],
  movsCaja: [mov({ tipo: "ENTRADA", moneda: "USD", monto: 50, fecha: "2026-04-01" })],
  clientes: [{ id: "c", nombre: "C", activo: true, cc: [{ id: "cc", moneda: "USD", saldo: 30 }], pf: [] }],
}));

vi.mock("@/lib/prisma", () => ({ prisma: {} }));
vi.mock("@/lib/finance", () => ({ getPatrimonioNeto: async () => pn }));
vi.mock("@/lib/finance/compat", async () => await import("./compat"));

import { getBalanceGeneral, getPosicionPN } from "../data/reportes";

describe("Consumidores del PN canónico", () => {
  it("Home y Reportes = mismo PN", async () => {
    expect(pn.pnUSD).toBe(120);
    const home = await getPosicionPN();
    expect(home.pnUSD).toBe(pn.pnUSD);
    expect(home.quality).toBe(pn.quality);
    expect(home.knownSubtotalUSD).toBe(pn.knownSubtotalUSD);
    expect((await getBalanceGeneral()).patrimonioNeto).toBe(pn.pnUSD);
  });

  const root = path.resolve(__dirname, "../../..");
  const src = (f: string) => fs.readFileSync(path.join(root, f), "utf8");

  it("Posición consume el motor y no recalcula PN", () => {
    const s = src("src/app/(dashboard)/posicion/page.tsx");
    expect(s).toMatch(/getPatrimonioNeto\(\)/);
    expect(s).not.toMatch(/getCajasWithBalances|prisma\.cliente\.findMany|prisma\.cartera\.findMany/);
    expect(s).toMatch(/const patrimonioNeto = pn\.pnUSD;/);
  });

  it("U1/U2 y el cierre delegan al motor (sin fórmula propia)", () => {
    expect(src("src/lib/data/mov-diarios.ts")).toMatch(/mapResultadoCambio\(r, ledger, ds\)/);
    expect(src("src/lib/data/mov-diarios.ts")).not.toMatch(/RESULTADO_OPERATIVO:/);
    expect(src("src/lib/data/reportes-ejecutivo.ts")).toMatch(/mapUtilidadMes\(r, ds\)/);
    // marcadores de la fórmula U2 vieja (arbitraje/honorarios recalculados en el archivo)
    expect(src("src/lib/data/reportes-ejecutivo.ts")).not.toMatch(/VENTA_TIPOS_ARB|INGRESO_CAMBIO|EGRESO_CAMBIO|_sum: { totalARS: true }/);
    expect(src("src/lib/data/cierres.ts")).toMatch(/getUtilidadMes\(mes\)/);
    expect(src("src/lib/data/cierres.ts")).toMatch(/getPatrimonioNeto\(\)/);
  });

  it("balance.service.ts eliminado (0 callers)", () => {
    expect(fs.existsSync(path.join(root, "src/lib/services/balance.service.ts"))).toBe(false);
  });
});

describe("Home — PN con su calidad (Codex final focalizado)", () => {
  const fmt = (n: number) => `USD ${n}`;

  it("A. EXACT → muestra el PN", () => {
    expect(presentarTotal({ quality: "EXACT", totalUSD: 120, knownSubtotalUSD: 120 }, fmt)).toEqual({ principal: "USD 120", esTotal: true, nota: null });
  });

  it("B. APPROXIMATE → muestra el PN marcado como aproximado", () => {
    const v = presentarTotal({ quality: "APPROXIMATE", totalUSD: 120, knownSubtotalUSD: 120 }, fmt);
    expect(v.principal).toBe("USD 120");
    expect(v.nota).toBe("Aproximado");
  });

  it("C. INCOMPLETE → nunca un total definitivo", () => {
    const v = presentarTotal({ quality: "INCOMPLETE", totalUSD: null, knownSubtotalUSD: 80 }, fmt);
    expect(v.principal).toBe("Incompleto");
    expect(v.esTotal).toBe(false);
  });

  it("D. knownSubtotal solo como PARCIAL / NO ES TOTAL, nunca como principal", () => {
    const v = presentarTotal({ quality: "INCOMPLETE", totalUSD: null, knownSubtotalUSD: 80 }, fmt);
    expect(v.principal).not.toContain("80");
    expect(v.nota).toBe("Parcial conocido USD 80 — NO es total");
  });

  it("Home consume el contrato completo y el badge de calidad (sin fórmula propia)", () => {
    const home = fs.readFileSync(path.resolve(__dirname, "../../app/(dashboard)/inicio/page.tsx"), "utf8");
    expect(home).toContain("presentarTotal({ quality: pn.quality, totalUSD: pn.pnUSD, knownSubtotalUSD: pn.knownSubtotalUSD }");
    expect(home).toContain("<CalidadBadge quality={pn.quality} reasons={pn.qualityReasons} />");
    expect(home).not.toContain("fmtUSD(pn)");
  });
});
