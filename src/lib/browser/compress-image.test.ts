import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mocks de APIs de navegador ────────────────────────────────────────────────

// Estado mutable para controlar el tamaño del blob que devuelve toBlob
let mockBlobSize = 100_000; // 100 KB por defecto

const mockCtx = { drawImage: vi.fn() };
const mockCanvas = {
  width: 0,
  height: 0,
  getContext: vi.fn(() => mockCtx),
  toBlob: vi.fn((cb: (blob: Blob | null) => void, type?: string) => {
    Promise.resolve().then(() =>
      cb(new Blob([new Uint8Array(mockBlobSize)], { type: type ?? "image/jpeg" })),
    );
  }),
};

vi.stubGlobal("document", {
  createElement: vi.fn(() => {
    mockCanvas.width = 0;
    mockCanvas.height = 0;
    return mockCanvas;
  }),
});

// Mock de Image — simula una imagen de 3000×2000 por defecto
let mockImgWidth = 3000;
let mockImgHeight = 2000;

class MockImage {
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  get naturalWidth() {
    return mockImgWidth;
  }
  get naturalHeight() {
    return mockImgHeight;
  }
  set src(_: string) {
    Promise.resolve().then(() => this.onload?.());
  }
}
vi.stubGlobal("Image", MockImage);

// Mock de FileReader
class MockFileReader {
  result: string | null = null;
  onload: (() => void) | null = null;
  onerror: ((e: unknown) => void) | null = null;
  readAsDataURL(_file: File) {
    this.result = "data:image/jpeg;base64,/9j/fake";
    Promise.resolve().then(() => this.onload?.());
  }
}
vi.stubGlobal("FileReader", MockFileReader);

// ── Importar después de stubs ──────────────────────────────────────────────────
import { resizeAndCompress } from "./compress-image";

// ── Tests ─────────────────────────────────────────────────────────────────────

function makeJpegFile(name = "foto.jpg", size = 500_000): File {
  return new File([new Uint8Array(size)], name, { type: "image/jpeg" });
}

describe("resizeAndCompress", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockBlobSize = 100_000;
    mockImgWidth = 3000;
    mockImgHeight = 2000;
    // Re-wirear toBlob con el tamaño actualizado
    mockCanvas.toBlob.mockImplementation(
      (cb: (blob: Blob | null) => void, type?: string) => {
        Promise.resolve().then(() =>
          cb(
            new Blob([new Uint8Array(mockBlobSize)], {
              type: type ?? "image/jpeg",
            }),
          ),
        );
      },
    );
  });

  // ── C-1: imagen grande se redimensiona al lado largo 2000 px ──────────────
  it("C-1: resizes a 3000×2000 image so the long side is ≤ 2000px", async () => {
    const file = makeJpegFile("grande.jpg");
    await resizeAndCompress(file);
    // El canvas debe haber sido configurado con 2000×1333 (approx)
    expect(mockCanvas.width).toBe(2000);
    expect(mockCanvas.height).toBe(1333);
  });

  // ── C-2: imagen vertical — el lado largo es la altura ─────────────────────
  it("C-2: resizes a 1500×3000 portrait image correctly", async () => {
    mockImgWidth = 1500;
    mockImgHeight = 3000;
    const file = makeJpegFile("portrait.jpg");
    await resizeAndCompress(file);
    expect(mockCanvas.height).toBe(2000);
    expect(mockCanvas.width).toBe(1000);
  });

  // ── C-3: imagen pequeña no se redimensiona ─────────────────────────────────
  it("C-3: does not resize a 1000×800 image", async () => {
    mockImgWidth = 1000;
    mockImgHeight = 800;
    const file = makeJpegFile("chica.jpg");
    await resizeAndCompress(file);
    expect(mockCanvas.width).toBe(1000);
    expect(mockCanvas.height).toBe(800);
  });

  // ── C-4: devuelve File con tipo image/jpeg ─────────────────────────────────
  it("C-4: returns a File with type image/jpeg", async () => {
    const file = makeJpegFile("foto.png");
    const result = await resizeAndCompress(file);
    expect(result).toBeInstanceOf(File);
    expect(result.type).toBe("image/jpeg");
  });

  // ── C-5: el nombre del archivo resultante termina en .jpg ─────────────────
  it("C-5: output filename has .jpg extension", async () => {
    const file = makeJpegFile("captura.png");
    const result = await resizeAndCompress(file);
    expect(result.name).toBe("captura.jpg");
  });

  // ── C-6: lanza cuando el blob supera 3.5 MB tras comprimir al máximo ───────
  it("C-6: throws when compressed blob still exceeds 3.5 MB", async () => {
    mockBlobSize = 4 * 1024 * 1024; // 4 MB — siempre demasiado grande
    mockCanvas.toBlob.mockImplementation(
      (cb: (blob: Blob | null) => void, type?: string) => {
        Promise.resolve().then(() =>
          cb(
            new Blob([new Uint8Array(mockBlobSize)], {
              type: type ?? "image/jpeg",
            }),
          ),
        );
      },
    );
    const file = makeJpegFile("grande.jpg");
    await expect(resizeAndCompress(file)).rejects.toThrow(/3,5 MB/);
  });

  // ── C-7: drawImage recibe las dimensiones correctas ────────────────────────
  it("C-7: calls drawImage with scaled dimensions", async () => {
    mockImgWidth = 3000;
    mockImgHeight = 2000;
    const file = makeJpegFile();
    await resizeAndCompress(file);
    expect(mockCtx.drawImage).toHaveBeenCalledWith(
      expect.anything(),
      0,
      0,
      2000,
      1333,
    );
  });
});
