-- MACRO 5 (M5-F01): bolsa de USD (CABLE | MEP) que usa una operación USD de cartera propia.
-- Columna opcional: null = no aplica (ARS / comitente) o legacy (histórico = Cable).
CREATE TYPE "TipoSaldoUSD" AS ENUM ('CABLE', 'MEP');

ALTER TABLE "OperacionBolsa" ADD COLUMN "saldoUSD" "TipoSaldoUSD";
