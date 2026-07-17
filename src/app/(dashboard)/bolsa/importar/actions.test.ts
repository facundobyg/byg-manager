import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Hoisted mocks ─────────────────────────────────────────────────────────────

const mocks = vi.hoisted(() => ({
  requireActionPermission: vi.fn(),
  auth: vi.fn(),
  processBolsaImageUpload: vi.fn(),
  processBolsaExcelUpload: vi.fn(),
}));

vi.mock("@/lib/auth/permissions", () => ({
  requireActionPermission: mocks.requireActionPermission,
}));

vi.mock("@/auth", () => ({
  auth: mocks.auth,
}));

vi.mock("./process-upload-image", () => ({
  processBolsaImageUpload: mocks.processBolsaImageUpload,
}));

vi.mock("./process-upload", () => ({
  processBolsaExcelUpload: mocks.processBolsaExcelUpload,
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

import { importarBolsaImagenAction } from "./actions";

// ── Helpers ────────────────────────────────────────────────────────────────────

function makeImagenFormData(overrides?: { fechaOperativa?: string | null }): FormData {
  const fd = new FormData();
  fd.set("result", JSON.stringify({ bloques: [], warningsGlobales: [], erroresGlobales: [], totalOperaciones: 0 }));
  fd.set("fileName", "ops.jpg");
  fd.set("fileSize", "1024");
  fd.set("mimeType", "image/jpeg");
  const fecha = overrides?.fechaOperativa;
  if (fecha !== null) fd.set("fechaOperativa", fecha ?? "2026-07-14");
  return fd;
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.requireActionPermission.mockResolvedValue(null); // permiso concedido
  mocks.auth.mockResolvedValue({ user: { id: "user-1" } });
  mocks.processBolsaImageUpload.mockResolvedValue({
    ok: true,
    estado: "REVISION_PENDIENTE",
    loteId: "lote-1",
    archivoId: "arch-1",
    nombreArchivo: "ops.jpg",
    totalFilas: 0,
    filasResuelta: 0,
    filasConAdvertencia: 0,
    filasConError: 0,
  });
});

describe("importarBolsaImagenAction — fecha operativa (E4.5C)", () => {
  it("ACT-1: imagen sin fechaOperativa → error obligatoria, nunca llega a processBolsaImageUpload", async () => {
    const result = await importarBolsaImagenAction(makeImagenFormData({ fechaOperativa: null }));

    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/fecha de operaciones/i);
    expect(mocks.processBolsaImageUpload).not.toHaveBeenCalled();
  });

  it("ACT-2: imagen con fechaOperativa inválida → error, nunca llega a processBolsaImageUpload", async () => {
    const result = await importarBolsaImagenAction(makeImagenFormData({ fechaOperativa: "14/07/2026" }));

    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/fecha de operaciones/i);
    expect(mocks.processBolsaImageUpload).not.toHaveBeenCalled();
  });

  it("ACT-3: imagen con fechaOperativa válida → se reenvía como Date a processBolsaImageUpload", async () => {
    const result = await importarBolsaImagenAction(makeImagenFormData({ fechaOperativa: "2026-07-14" }));

    expect(result.ok).toBe(true);
    expect(mocks.processBolsaImageUpload).toHaveBeenCalledTimes(1);
    const [input] = mocks.processBolsaImageUpload.mock.calls[0];
    expect(input.fechaOperativa).toEqual(new Date("2026-07-14T00:00:00.000Z"));
  });
});

describe("importarBolsaImagenAction — reanálisis (E4.6A)", () => {
  it("ACT-4: sin campo 'reanalizar' en el FormData, se reenvía reanalizar=false", async () => {
    await importarBolsaImagenAction(makeImagenFormData());
    const [input] = mocks.processBolsaImageUpload.mock.calls[0];
    expect(input.reanalizar).toBe(false);
  });

  it("ACT-5: reanalizar='true' en el FormData se reenvía como reanalizar=true", async () => {
    const fd = makeImagenFormData();
    fd.set("reanalizar", "true");

    await importarBolsaImagenAction(fd);

    const [input] = mocks.processBolsaImageUpload.mock.calls[0];
    expect(input.reanalizar).toBe(true);
  });
});
