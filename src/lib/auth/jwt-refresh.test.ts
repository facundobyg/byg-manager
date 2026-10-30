import { describe, it, expect, vi } from "vitest";
import { refreshTokenOnUpdate } from "./jwt-refresh";

// MACRO 1 — R2-02: el cliente no puede elevar 2FA/rol con session.update().

describe("refreshTokenOnUpdate", () => {
  const token = { id: "u1", role: "SOCIO", twoFactorEnabled: false, name: "X" };

  it("cliente intenta elevar 2FA, DB dice false → el token NO queda elevado", async () => {
    // El payload del cliente ni siquiera llega a esta función: el token se arma solo desde DB.
    const r = await refreshTokenOnUpdate({ ...token }, async () => ({ role: "SOCIO", activo: true, twoFactorEnabled: false }));
    expect(r?.twoFactorEnabled).toBe(false);
  });

  it("caso legítimo: 2FA activado realmente en DB → el token se actualiza", async () => {
    const r = await refreshTokenOnUpdate({ ...token }, async () => ({ role: "SOCIO", activo: true, twoFactorEnabled: true }));
    expect(r?.twoFactorEnabled).toBe(true);
  });

  it("el rol también sale de DB (degradación se refleja; no se puede elevar)", async () => {
    const r = await refreshTokenOnUpdate({ ...token, role: "ADMIN" }, async () => ({ role: "SOCIO", activo: true, twoFactorEnabled: true }));
    expect(r?.role).toBe("SOCIO");
  });

  it("usuario inactivo o inexistente → sesión invalidada (null)", async () => {
    expect(await refreshTokenOnUpdate({ ...token }, async () => ({ role: "SOCIO", activo: false, twoFactorEnabled: true }))).toBeNull();
    expect(await refreshTokenOnUpdate({ ...token }, async () => null)).toBeNull();
  });

  it("token sin id → null, sin consultar DB", async () => {
    const load = vi.fn();
    expect(await refreshTokenOnUpdate({ role: "ADMIN" }, load)).toBeNull();
    expect(load).not.toHaveBeenCalled();
  });
});
