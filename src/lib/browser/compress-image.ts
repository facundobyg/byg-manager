// Solo se ejecuta en el navegador — no importar en código servidor.

const MAX_DIM = 2000;
const MAX_BYTES = 3.5 * 1024 * 1024;

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error ?? new Error("FileReader falló."));
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("No se pudo cargar la imagen."));
    img.src = src;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("canvas.toBlob devolvió null."));
      },
      type,
      quality,
    );
  });
}

/**
 * Redimensiona (si supera 2000 px en el lado largo) y comprime la imagen a
 * JPEG con calidad decreciente hasta quedar en ≤ 3.5 MB.
 * Lanza si el resultado sigue superando el límite.
 */
export async function resizeAndCompress(file: File): Promise<File> {
  const dataUrl = await fileToDataUrl(file);
  const img = await loadImage(dataUrl);

  const w = img.naturalWidth;
  const h = img.naturalHeight;
  let tw = w;
  let th = h;

  if (w > MAX_DIM || h > MAX_DIM) {
    if (w >= h) {
      tw = MAX_DIM;
      th = Math.round(h * (MAX_DIM / w));
    } else {
      th = MAX_DIM;
      tw = Math.round(w * (MAX_DIM / h));
    }
  }

  const canvas = document.createElement("canvas");
  canvas.width = tw;
  canvas.height = th;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No se pudo obtener contexto 2D del canvas.");
  ctx.drawImage(img, 0, 0, tw, th);

  let quality = 0.85;
  let blob: Blob;
  do {
    blob = await canvasToBlob(canvas, "image/jpeg", quality);
    quality -= 0.1;
  } while (blob.size > MAX_BYTES && quality > 0.2);

  if (blob.size > MAX_BYTES) {
    throw new Error(
      "La imagen supera los 3,5 MB incluso tras comprimir. Reducí la resolución antes de subir.",
    );
  }

  const dotIdx = file.name.lastIndexOf(".");
  const baseName = dotIdx >= 0 ? file.name.slice(0, dotIdx) : file.name;
  return new File([blob], `${baseName}.jpg`, { type: "image/jpeg" });
}
