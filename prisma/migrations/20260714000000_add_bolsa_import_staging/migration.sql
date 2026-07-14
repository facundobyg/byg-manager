
-- CreateEnum
CREATE TYPE "BolsaImportOrigen" AS ENUM ('EXCEL', 'IMAGEN');

-- CreateEnum
CREATE TYPE "BolsaLoteEstado" AS ENUM ('SUBIDO', 'PROCESANDO', 'REVISION_PENDIENTE', 'LISTO_PARA_ENVIO', 'EN_VALIDACION', 'DEVUELTO', 'RECHAZADO', 'APROBADO', 'CONFIRMANDO', 'CONFIRMADO', 'CONFIRMADO_PARCIAL', 'FALLIDO');

-- CreateEnum
CREATE TYPE "BolsaArchivoEstado" AS ENUM ('PROCESANDO', 'LISTO', 'ERROR', 'DUPLICADO');

-- CreateEnum
CREATE TYPE "BolsaFilaEstado" AS ENUM ('DETECTADA', 'RESUELTA', 'ADVERTENCIA', 'ERROR', 'EXCLUIDA', 'LISTA', 'ENVIADA', 'APROBADA', 'RECHAZADA', 'CONFIRMADA', 'FALLIDA');

-- CreateEnum
CREATE TYPE "BolsaImportTipoSujeto" AS ENUM ('COMITENTE', 'CARTERA');

-- CreateTable
CREATE TABLE "BolsaImportLote" (
    "id" TEXT NOT NULL,
    "estado" "BolsaLoteEstado" NOT NULL DEFAULT 'SUBIDO',
    "origen" "BolsaImportOrigen" NOT NULL,
    "fechaOperativa" DATE,
    "creadoPorId" TEXT,
    "validadoPorId" TEXT,
    "observacionValidacion" TEXT,
    "totalFilas" INTEGER NOT NULL DEFAULT 0,
    "filasListas" INTEGER NOT NULL DEFAULT 0,
    "filasConAdvertencia" INTEGER NOT NULL DEFAULT 0,
    "filasConError" INTEGER NOT NULL DEFAULT 0,
    "filasExcluidas" INTEGER NOT NULL DEFAULT 0,
    "filasConfirmadas" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BolsaImportLote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BolsaImportArchivo" (
    "id" TEXT NOT NULL,
    "loteId" TEXT NOT NULL,
    "nombreOriginal" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "tamano" INTEGER NOT NULL,
    "fileHashSha256" TEXT NOT NULL,
    "estado" "BolsaArchivoEstado" NOT NULL DEFAULT 'PROCESANDO',
    "origen" "BolsaImportOrigen" NOT NULL,
    "hojaDetectada" TEXT,
    "rawJson" JSONB,
    "warningsJson" JSONB,
    "errorMessage" TEXT,
    "totalFilas" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BolsaImportArchivo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BolsaImportFila" (
    "id" TEXT NOT NULL,
    "loteId" TEXT NOT NULL,
    "archivoId" TEXT NOT NULL,
    "estado" "BolsaFilaEstado" NOT NULL DEFAULT 'DETECTADA',
    "numeroBloque" INTEGER,
    "numeroFila" INTEGER,
    "rawJson" JSONB NOT NULL,
    "nombreDetectado" TEXT,
    "nroComitenteDetectado" TEXT,
    "tipoOperacionDetectada" TEXT,
    "comitenteResueltoId" TEXT,
    "carteraResueltaId" TEXT,
    "tipoSujeto" "BolsaImportTipoSujeto",
    "conflictoNombre" BOOLEAN NOT NULL DEFAULT false,
    "tipoOperacionResuelta" "TipoOpBolsa",
    "ticker" TEXT,
    "instrumento" TEXT,
    "moneda" "Moneda",
    "cantidad" DECIMAL(18,6),
    "precio" DECIMAL(18,6),
    "montoNetoReferencia" DECIMAL(18,2),
    "fechaConcertacion" DATE,
    "plazo" TEXT,
    "fechaVencimiento" DATE,
    "tasaCaucion" DECIMAL(8,4),
    "diasCaucion" INTEGER,
    "montoCobrarReferencia" DECIMAL(18,2),
    "montoPagarReferencia" DECIMAL(18,2),
    "confianzaGeneral" DECIMAL(5,4),
    "confianzaPorCampoJson" JSONB,
    "erroresJson" JSONB,
    "warningsJson" JSONB,
    "camposCorregidosJson" JSONB,
    "corregidoPorId" TEXT,
    "confirmadoComoDuplicadoDistinto" BOOLEAN NOT NULL DEFAULT false,
    "grupoArbitrajeStaging" TEXT,
    "fingerprint" TEXT,
    "operacionBolsaId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BolsaImportFila_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BolsaImportLote_estado_idx" ON "BolsaImportLote"("estado");

-- CreateIndex
CREATE INDEX "BolsaImportLote_creadoPorId_idx" ON "BolsaImportLote"("creadoPorId");

-- CreateIndex
CREATE INDEX "BolsaImportLote_fechaOperativa_idx" ON "BolsaImportLote"("fechaOperativa");

-- CreateIndex
CREATE UNIQUE INDEX "BolsaImportArchivo_fileHashSha256_key" ON "BolsaImportArchivo"("fileHashSha256");

-- CreateIndex
CREATE INDEX "BolsaImportArchivo_loteId_estado_idx" ON "BolsaImportArchivo"("loteId", "estado");

-- CreateIndex
CREATE INDEX "BolsaImportArchivo_estado_idx" ON "BolsaImportArchivo"("estado");

-- CreateIndex
CREATE UNIQUE INDEX "BolsaImportFila_operacionBolsaId_key" ON "BolsaImportFila"("operacionBolsaId");

-- CreateIndex
CREATE INDEX "BolsaImportFila_loteId_estado_idx" ON "BolsaImportFila"("loteId", "estado");

-- CreateIndex
CREATE INDEX "BolsaImportFila_archivoId_idx" ON "BolsaImportFila"("archivoId");

-- CreateIndex
CREATE INDEX "BolsaImportFila_nroComitenteDetectado_idx" ON "BolsaImportFila"("nroComitenteDetectado");

-- CreateIndex
CREATE INDEX "BolsaImportFila_comitenteResueltoId_idx" ON "BolsaImportFila"("comitenteResueltoId");

-- CreateIndex
CREATE INDEX "BolsaImportFila_fingerprint_idx" ON "BolsaImportFila"("fingerprint");

-- CreateIndex
CREATE INDEX "BolsaImportFila_grupoArbitrajeStaging_idx" ON "BolsaImportFila"("grupoArbitrajeStaging");

-- AddForeignKey
ALTER TABLE "BolsaImportLote" ADD CONSTRAINT "BolsaImportLote_creadoPorId_fkey" FOREIGN KEY ("creadoPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BolsaImportLote" ADD CONSTRAINT "BolsaImportLote_validadoPorId_fkey" FOREIGN KEY ("validadoPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BolsaImportArchivo" ADD CONSTRAINT "BolsaImportArchivo_loteId_fkey" FOREIGN KEY ("loteId") REFERENCES "BolsaImportLote"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BolsaImportFila" ADD CONSTRAINT "BolsaImportFila_loteId_fkey" FOREIGN KEY ("loteId") REFERENCES "BolsaImportLote"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BolsaImportFila" ADD CONSTRAINT "BolsaImportFila_archivoId_fkey" FOREIGN KEY ("archivoId") REFERENCES "BolsaImportArchivo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BolsaImportFila" ADD CONSTRAINT "BolsaImportFila_comitenteResueltoId_fkey" FOREIGN KEY ("comitenteResueltoId") REFERENCES "ComitenteInversion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BolsaImportFila" ADD CONSTRAINT "BolsaImportFila_carteraResueltaId_fkey" FOREIGN KEY ("carteraResueltaId") REFERENCES "Cartera"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BolsaImportFila" ADD CONSTRAINT "BolsaImportFila_corregidoPorId_fkey" FOREIGN KEY ("corregidoPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BolsaImportFila" ADD CONSTRAINT "BolsaImportFila_operacionBolsaId_fkey" FOREIGN KEY ("operacionBolsaId") REFERENCES "OperacionBolsa"("id") ON DELETE SET NULL ON UPDATE CASCADE;
