-- CreateTable
CREATE TABLE "ImportacionHolding" (
    "id" TEXT NOT NULL,
    "cuentaId" TEXT NOT NULL,
    "nombreArchivo" TEXT NOT NULL,
    "filasTotal" INTEGER NOT NULL,
    "filasImportadas" INTEGER NOT NULL,
    "importadoPor" TEXT NOT NULL DEFAULT 'sistema',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ImportacionHolding_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ImportacionHolding_cuentaId_idx" ON "ImportacionHolding"("cuentaId");

-- AddForeignKey
ALTER TABLE "ImportacionHolding" ADD CONSTRAINT "ImportacionHolding_cuentaId_fkey" FOREIGN KEY ("cuentaId") REFERENCES "CuentaInversion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
