/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // pdfjs-dist (parser de PDFs Bind, Módulo 4.12B) usa @napi-rs/canvas para
  // polyfillear DOMMatrix/Path2D/ImageData en Node. Son paquetes con binarios
  // nativos por plataforma — si Next los bundlea con webpack/turbopack, el
  // tracing de archivos de Vercel puede no incluir el binario .node correcto
  // en la función serverless ("DOMMatrix is not defined" en runtime). Dejarlos
  // afuera del bundle para que se resuelvan como node_modules normales.
  serverExternalPackages: ["pdfjs-dist", "@napi-rs/canvas"],
  experimental: {
    // Default de Next.js (1mb) no alcanza para subir varios PDFs en una sola
    // Server Action (Módulo 4.12D, import batch Bind). El límite real de
    // archivos por carga lo impone la app (ver MAX_FILES_PER_SUBMIT en
    // cuentas-inversion/importaciones/bind/actions.ts), no este valor.
    serverActions: {
      bodySizeLimit: "8mb",
    },
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options",  value: "nosniff" },
          { key: "X-Frame-Options",         value: "DENY" },
          { key: "X-XSS-Protection",        value: "1; mode=block" },
          { key: "Referrer-Policy",         value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy",      value: "camera=(), microphone=(), geolocation=()" },
          {
            key:   "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "style-src 'self' 'unsafe-inline'",
              "font-src 'self' data:",
              "img-src 'self' data: blob:",
              "connect-src 'self'",
              "frame-ancestors 'none'",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
