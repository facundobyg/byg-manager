/**
 * Copia los assets de Tesseract.js a public/tesseract/ para servirse
 * desde el mismo origen, sin depender de CDNs externas en runtime.
 *
 * Assets copiados desde node_modules (sin red):
 *   worker.min.js
 *   tesseract-core-{simd,relaxedsimd,}-lstm.wasm.js  (WASM embebido inline)
 *
 * Assets descargados desde jsdelivr (solo en postinstall/build, no en runtime):
 *   lang-data/eng.traineddata.gz  (@tesseract.js-data/eng@1.0.0)
 *   lang-data/spa.traineddata.gz  (@tesseract.js-data/spa@1.0.0)
 *
 * El worker detecta los magic bytes gzip (0x1F 0x8B) y descomprime
 * automáticamente al cargar cada idioma.
 *
 * El script falla con exit 1 si falta o está vacío cualquier asset requerido,
 * abortando el postinstall/build de Vercel.
 */

import {
  copyFileSync,
  existsSync,
  mkdirSync,
  statSync,
  writeFileSync,
} from "fs";
import { get } from "https";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const DEST = join(ROOT, "public", "tesseract");
const LANG_DEST = join(DEST, "lang-data");

// Versión exacta del paquete de datos de idioma (fijada, no "latest")
const LANG_DATA_VERSION = "1.0.0";
const LANG_CDN_BASE = "https://cdn.jsdelivr.net/npm/@tesseract.js-data";

// ── Helpers ───────────────────────────────────────────────────────────────────

function die(msg) {
  console.error(`\n[copy-tesseract-public] ERROR: ${msg}\n`);
  process.exit(1);
}

function copyAsset(src, dest, label) {
  if (!existsSync(src)) die(`Fuente no encontrada: ${src}`);
  copyFileSync(src, dest);
  const size = statSync(dest).size;
  if (size === 0) die(`Archivo copiado vacío: ${dest}`);
  console.log(`  ✓ ${label}  (${(size / 1024).toFixed(0)} kB)`);
}

/** GET HTTPS con seguimiento de redirecciones. Resuelve con Buffer. */
function httpsGet(url, maxRedirects = 5) {
  return new Promise((resolve, reject) => {
    if (maxRedirects <= 0) {
      reject(new Error(`Demasiadas redirecciones: ${url}`));
      return;
    }
    get(url, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        const location = res.headers.location;
        res.resume();
        resolve(httpsGet(location, maxRedirects - 1));
        return;
      }
      if (res.statusCode !== 200) {
        res.resume();
        reject(new Error(`HTTP ${res.statusCode} descargando ${url}`));
        return;
      }
      const chunks = [];
      res.on("data", (c) => chunks.push(c));
      res.on("end", () => resolve(Buffer.concat(chunks)));
      res.on("error", reject);
    }).on("error", reject);
  });
}

async function downloadLang(lang) {
  const outFile = join(LANG_DEST, `${lang}.traineddata.gz`);

  if (existsSync(outFile) && statSync(outFile).size > 0) {
    console.log(`  ↩  ${lang}.traineddata.gz  (ya existe, omitiendo)`);
    return;
  }

  const url = `${LANG_CDN_BASE}/${lang}@${LANG_DATA_VERSION}/4.0.0_best_int/${lang}.traineddata.gz`;
  console.log(`  ↓  Descargando ${lang}.traineddata.gz  (v${LANG_DATA_VERSION})...`);

  let data;
  try {
    data = await httpsGet(url);
  } catch (err) {
    die(`No se pudo descargar ${url}: ${err.message}`);
  }

  if (!data || data.length === 0) {
    die(`Descarga vacía: ${url}`);
  }

  // Verificar magic bytes de gzip (0x1F 0x8B)
  if (data[0] !== 0x1f || data[1] !== 0x8b) {
    die(
      `${lang}.traineddata.gz no es un gzip válido (magic bytes: 0x${data[0].toString(16)} 0x${data[1].toString(16)})`,
    );
  }

  writeFileSync(outFile, data);
  console.log(
    `  ✓ ${lang}.traineddata.gz  (${(data.length / 1024 / 1024).toFixed(1)} MB)`,
  );
}

function verifyComplete() {
  const required = [
    join(DEST, "worker.min.js"),
    join(DEST, "tesseract-core-simd-lstm.wasm.js"),
    join(DEST, "tesseract-core-relaxedsimd-lstm.wasm.js"),
    join(DEST, "tesseract-core-lstm.wasm.js"),
    join(LANG_DEST, "eng.traineddata.gz"),
    join(LANG_DEST, "spa.traineddata.gz"),
  ];

  const missing = required.filter(
    (f) => !existsSync(f) || statSync(f).size === 0,
  );

  if (missing.length > 0) {
    die(
      `Assets faltantes o vacíos:\n${missing.map((f) => `  - ${f}`).join("\n")}`,
    );
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────

console.log("Preparando assets de Tesseract.js en public/tesseract/...");

mkdirSync(DEST, { recursive: true });
mkdirSync(LANG_DEST, { recursive: true });

// Worker
copyAsset(
  join(ROOT, "node_modules", "tesseract.js", "dist", "worker.min.js"),
  join(DEST, "worker.min.js"),
  "worker.min.js",
);

// Core WASM: tres variantes LSTM (el worker elige la mejor según SIMD del navegador)
for (const f of [
  "tesseract-core-simd-lstm.wasm.js",
  "tesseract-core-relaxedsimd-lstm.wasm.js",
  "tesseract-core-lstm.wasm.js",
]) {
  copyAsset(
    join(ROOT, "node_modules", "tesseract.js-core", f),
    join(DEST, f),
    f,
  );
}

// Idiomas
await downloadLang("eng");
await downloadLang("spa");

// Verificación final — falla el postinstall si falta cualquier archivo
verifyComplete();

console.log("✓ Todos los assets de Tesseract.js listos en public/tesseract/");
