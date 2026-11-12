import { describe, it, expect, vi, beforeEach } from "vitest";

// P1-03A.1 — el import legacy de backup (Etapa 1) NO puede modificar el TC: no tiene fecha
// de vigencia confiable ni pasa por el write path canónico (TipoCambio fecha ART + AuditLog).
// Debe IGNORAR el campo con aviso explícito y hacer 0 writes de Config/TipoCambio/AuditLog.

const st = vi.hoisted(() => ({ llamadas: [] as string[], denied: null as null | { error: string } }));
/** prisma falso: registra CUALQUIER llamada modelo.método; lecturas devuelven null/[]. */
vi.mock("@/lib/prisma", () => ({
  prisma: new Proxy({}, {
    get: (_t, modelo: string) => new Proxy({}, {
      get: (_m, metodo: string) => async () => {
        st.llamadas.push(`${modelo}.${metodo}`);
        return metodo.startsWith("findMany") ? [] : metodo === "count" ? 0 : null;
      },
    }),
  }),
}));
vi.mock("@/lib/auth/permissions", () => ({ requireActionPermission: vi.fn(async () => st.denied) }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { importarEtapa1Legacy } from "./actions";

const WRITES_TC = /^(config|tipoCambio|auditLog)\.(create|createMany|update|updateMany|upsert|delete|deleteMany)$/;

beforeEach(() => { st.llamadas.length = 0; st.denied = null; });

describe("P1-03A.1 — importarEtapa1Legacy no es un write path del TC", () => {
  it.each([
    ["objeto { tc_blue }", { tc_blue: "1600" }],
    ["objeto { tc }", { tc: 1600 }],
    ["array [{ clave: tc_blue }]", [{ clave: "tc_blue", valor: "1600" }]],
    ["objeto { tipoCambio }", { tipoCambio: "1600.5" }],
  ])("payload con TC (%s) → IGNORADO con aviso, 0 writes de Config/TipoCambio/AuditLog", async (_k, config) => {
    const r = await importarEtapa1Legacy({ config, cajas: [], pnHist: [] });
    expect(st.llamadas.filter((c) => WRITES_TC.test(c))).toEqual([]);
    expect(st.llamadas.filter((c) => c.startsWith("config.") || c.startsWith("tipoCambio."))).toEqual([]);
    expect(r.log.some((l) => /TC Blue del backup .*IGNORADO.*Configuración/.test(l))).toBe(true);
    expect(r.imported.config).toBe(0);
    expect(r.errors).toEqual([]);
  });

  it("payload sin TC → aviso de omitido y tampoco toca Config/TipoCambio", async () => {
    const r = await importarEtapa1Legacy({ config: {}, cajas: [], pnHist: [] });
    expect(st.llamadas.filter((c) => c.startsWith("config.") || c.startsWith("tipoCambio."))).toEqual([]);
    expect(r.log.some((l) => /TC Blue: omitido/.test(l))).toBe(true);
  });

  it("sin permiso sistema:admin → DENY antes de cualquier acceso a la base", async () => {
    st.denied = { error: "No tenés permisos para realizar esta acción." };
    const r = await importarEtapa1Legacy({ config: { tc_blue: "1600" }, cajas: [], pnHist: [] });
    expect(r.success).toBe(false);
    expect(st.llamadas).toEqual([]);
  });
});
