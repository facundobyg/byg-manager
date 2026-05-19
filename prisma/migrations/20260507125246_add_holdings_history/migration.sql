-- CreateEnum
CREATE TYPE "TipoOperacionHolding" AS ENUM ('COMPRA', 'VENTA', 'AJUSTE');

-- AlterTable
ALTER TABLE "HoldingComitenteInversion" ADD COLUMN     "fechaCompra" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "OperacionHoldingInversion" (
    "id" TEXT NOT NULL,
    "comitenteId" TEXT NOT NULL,
    "holdingId" TEXT,
    "tipo" "TipoOperacionHolding" NOT NULL,
    "ticker" TEXT NOT NULL,
    "categoria" "CategoriaHoldingInversion" NOT NULL,
    "cantidad" DECIMAL(18,6) NOT NULL,
    "precio" DECIMAL(18,6) NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notas" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OperacionHoldingInversion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OperacionHoldingInversion_comitenteId_idx" ON "OperacionHoldingInversion"("comitenteId");

-- CreateIndex
CREATE INDEX "OperacionHoldingInversion_holdingId_idx" ON "OperacionHoldingInversion"("holdingId");

-- CreateIndex
CREATE INDEX "OperacionHoldingInversion_fecha_idx" ON "OperacionHoldingInversion"("fecha");

-- AddForeignKey
ALTER TABLE "OperacionHoldingInversion" ADD CONSTRAINT "OperacionHoldingInversion_comitenteId_fkey" FOREIGN KEY ("comitenteId") REFERENCES "ComitenteInversion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OperacionHoldingInversion" ADD CONSTRAINT "OperacionHoldingInversion_holdingId_fkey" FOREIGN KEY ("holdingId") REFERENCES "HoldingComitenteInversion"("id") ON DELETE SET NULL ON UPDATE CASCADE;
