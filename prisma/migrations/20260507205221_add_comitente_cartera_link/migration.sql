-- AlterTable
ALTER TABLE "ComitenteInversion" ADD COLUMN     "carteraId" TEXT;

-- CreateIndex
CREATE INDEX "ComitenteInversion_carteraId_idx" ON "ComitenteInversion"("carteraId");

-- AddForeignKey
ALTER TABLE "ComitenteInversion" ADD CONSTRAINT "ComitenteInversion_carteraId_fkey" FOREIGN KEY ("carteraId") REFERENCES "Cartera"("id") ON DELETE SET NULL ON UPDATE CASCADE;
