-- CreateEnum
CREATE TYPE "ProductorInversion" AS ENUM ('IPS', 'BYG', 'OTRO');

-- CreateEnum
CREATE TYPE "CategoriaHoldingInversion" AS ENUM ('BONO', 'ON', 'ACCION', 'CEDEAR', 'FCI', 'CAUCION');

-- CreateTable
CREATE TABLE "CuentaInversion" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "notas" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CuentaInversion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComitenteInversion" (
    "id" TEXT NOT NULL,
    "cuentaInversionId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "razonSocial" TEXT,
    "nroComitente" TEXT NOT NULL,
    "productor" "ProductorInversion" NOT NULL DEFAULT 'BYG',
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "notas" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ComitenteInversion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SaldoComitenteInversion" (
    "id" TEXT NOT NULL,
    "comitenteId" TEXT NOT NULL,
    "saldoARS" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "saldoUSDCable" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "saldoUSDMep" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SaldoComitenteInversion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HoldingComitenteInversion" (
    "id" TEXT NOT NULL,
    "comitenteId" TEXT NOT NULL,
    "ticker" TEXT NOT NULL,
    "descripcion" TEXT,
    "categoria" "CategoriaHoldingInversion" NOT NULL,
    "cantidad" DECIMAL(18,6) NOT NULL,
    "precioPromedio" DECIMAL(18,6) NOT NULL,
    "precioActual" DECIMAL(18,6),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HoldingComitenteInversion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CuentaInversion_nombre_key" ON "CuentaInversion"("nombre");

-- CreateIndex
CREATE INDEX "CuentaInversion_activa_idx" ON "CuentaInversion"("activa");

-- CreateIndex
CREATE INDEX "ComitenteInversion_cuentaInversionId_idx" ON "ComitenteInversion"("cuentaInversionId");

-- CreateIndex
CREATE INDEX "ComitenteInversion_productor_idx" ON "ComitenteInversion"("productor");

-- CreateIndex
CREATE UNIQUE INDEX "ComitenteInversion_cuentaInversionId_nroComitente_key" ON "ComitenteInversion"("cuentaInversionId", "nroComitente");

-- CreateIndex
CREATE UNIQUE INDEX "SaldoComitenteInversion_comitenteId_key" ON "SaldoComitenteInversion"("comitenteId");

-- CreateIndex
CREATE INDEX "HoldingComitenteInversion_comitenteId_idx" ON "HoldingComitenteInversion"("comitenteId");

-- CreateIndex
CREATE INDEX "HoldingComitenteInversion_categoria_idx" ON "HoldingComitenteInversion"("categoria");

-- CreateIndex
CREATE UNIQUE INDEX "HoldingComitenteInversion_comitenteId_ticker_key" ON "HoldingComitenteInversion"("comitenteId", "ticker");

-- AddForeignKey
ALTER TABLE "ComitenteInversion" ADD CONSTRAINT "ComitenteInversion_cuentaInversionId_fkey" FOREIGN KEY ("cuentaInversionId") REFERENCES "CuentaInversion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaldoComitenteInversion" ADD CONSTRAINT "SaldoComitenteInversion_comitenteId_fkey" FOREIGN KEY ("comitenteId") REFERENCES "ComitenteInversion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HoldingComitenteInversion" ADD CONSTRAINT "HoldingComitenteInversion_comitenteId_fkey" FOREIGN KEY ("comitenteId") REFERENCES "ComitenteInversion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
