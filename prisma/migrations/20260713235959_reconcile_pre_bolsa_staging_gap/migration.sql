-- Migration histórica de reconciliación (MIG-HIST-01).
-- Entre 2026-05-07 y 2026-07-14 se aplicaron cambios de schema directamente
-- con "prisma db push", sin generar migrations versionadas. Esta migration
-- rellena retroactivamente ese hueco para que el historial de Prisma sea
-- reproducible desde una base vacía, sin alterar production/test donde esos
-- objetos ya existen. Cada operación es idempotente: crea lo que falta y no
-- toca lo que ya está. No hace DROP/TRUNCATE/UPDATE/DELETE ni backfills.

-- CreateEnum (idempotente): PriceSource
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'PriceSource') THEN
    CREATE TYPE "PriceSource" AS ENUM ('DATA912', 'MANUAL', 'LAST_KNOWN');
  ELSE
    IF (
      SELECT array_agg(enumlabel::text ORDER BY enumsortorder)
      FROM pg_enum
      WHERE enumtypid = '"PriceSource"'::regtype
    ) IS DISTINCT FROM ARRAY['DATA912', 'MANUAL', 'LAST_KNOWN']::text[] THEN
      RAISE EXCEPTION 'MIG-HIST-01: el enum "PriceSource" ya existe con labels distintos a los esperados por la reconciliación';
    END IF;
  END IF;
END $$;

-- CreateEnum (idempotente): PriceStatus
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'PriceStatus') THEN
    CREATE TYPE "PriceStatus" AS ENUM ('OK', 'NOT_FOUND', 'ERROR', 'STALE');
  ELSE
    IF (
      SELECT array_agg(enumlabel::text ORDER BY enumsortorder)
      FROM pg_enum
      WHERE enumtypid = '"PriceStatus"'::regtype
    ) IS DISTINCT FROM ARRAY['OK', 'NOT_FOUND', 'ERROR', 'STALE']::text[] THEN
      RAISE EXCEPTION 'MIG-HIST-01: el enum "PriceStatus" ya existe con labels distintos a los esperados por la reconciliación';
    END IF;
  END IF;
END $$;

-- CreateEnum (idempotente): TipoCaja
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'TipoCaja') THEN
    CREATE TYPE "TipoCaja" AS ENUM ('CENTRAL_CONTABLE', 'SUCURSAL_OPERATIVA', 'CAJA_SEGURIDAD', 'BANCO');
  ELSE
    IF (
      SELECT array_agg(enumlabel::text ORDER BY enumsortorder)
      FROM pg_enum
      WHERE enumtypid = '"TipoCaja"'::regtype
    ) IS DISTINCT FROM ARRAY['CENTRAL_CONTABLE', 'SUCURSAL_OPERATIVA', 'CAJA_SEGURIDAD', 'BANCO']::text[] THEN
      RAISE EXCEPTION 'MIG-HIST-01: el enum "TipoCaja" ya existe con labels distintos a los esperados por la reconciliación';
    END IF;
  END IF;
END $$;

-- CreateEnum (idempotente): EstadoComision
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'EstadoComision') THEN
    CREATE TYPE "EstadoComision" AS ENUM ('PENDIENTE', 'REVISADO', 'PAGADO');
  ELSE
    IF (
      SELECT array_agg(enumlabel::text ORDER BY enumsortorder)
      FROM pg_enum
      WHERE enumtypid = '"EstadoComision"'::regtype
    ) IS DISTINCT FROM ARRAY['PENDIENTE', 'REVISADO', 'PAGADO']::text[] THEN
      RAISE EXCEPTION 'MIG-HIST-01: el enum "EstadoComision" ya existe con labels distintos a los esperados por la reconciliación';
    END IF;
  END IF;
END $$;

-- CreateEnum (idempotente): BindImportBatchStatus
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'BindImportBatchStatus') THEN
    CREATE TYPE "BindImportBatchStatus" AS ENUM ('DRAFT', 'PARSED', 'PARTIAL_ERROR', 'READY_TO_CONFIRM', 'CONFIRMED', 'CANCELLED');
  ELSE
    IF (
      SELECT array_agg(enumlabel::text ORDER BY enumsortorder)
      FROM pg_enum
      WHERE enumtypid = '"BindImportBatchStatus"'::regtype
    ) IS DISTINCT FROM ARRAY['DRAFT', 'PARSED', 'PARTIAL_ERROR', 'READY_TO_CONFIRM', 'CONFIRMED', 'CANCELLED']::text[] THEN
      RAISE EXCEPTION 'MIG-HIST-01: el enum "BindImportBatchStatus" ya existe con labels distintos a los esperados por la reconciliación';
    END IF;
  END IF;
END $$;

-- CreateEnum (idempotente): BindImportFileStatus
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'BindImportFileStatus') THEN
    CREATE TYPE "BindImportFileStatus" AS ENUM ('PARSED', 'ERROR', 'DUPLICATE', 'NEEDS_ACCOUNT_MAPPING', 'NEEDS_TICKER_MAPPING', 'READY', 'CONFIRMED', 'SKIPPED');
  ELSE
    IF (
      SELECT array_agg(enumlabel::text ORDER BY enumsortorder)
      FROM pg_enum
      WHERE enumtypid = '"BindImportFileStatus"'::regtype
    ) IS DISTINCT FROM ARRAY['PARSED', 'ERROR', 'DUPLICATE', 'NEEDS_ACCOUNT_MAPPING', 'NEEDS_TICKER_MAPPING', 'READY', 'CONFIRMED', 'SKIPPED']::text[] THEN
      RAISE EXCEPTION 'MIG-HIST-01: el enum "BindImportFileStatus" ya existe con labels distintos a los esperados por la reconciliación';
    END IF;
  END IF;
END $$;

-- CreateEnum (idempotente): BindSectionType
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'BindSectionType') THEN
    CREATE TYPE "BindSectionType" AS ENUM ('CASH_USD_CABLE', 'CASH_USD_MEP', 'CASH_ARS', 'EQUITY_SECTION_MIXED', 'CEDEAR', 'BOND', 'FCI', 'CAUCION_ALERT', 'UNKNOWN_SECTION');
  ELSE
    IF (
      SELECT array_agg(enumlabel::text ORDER BY enumsortorder)
      FROM pg_enum
      WHERE enumtypid = '"BindSectionType"'::regtype
    ) IS DISTINCT FROM ARRAY['CASH_USD_CABLE', 'CASH_USD_MEP', 'CASH_ARS', 'EQUITY_SECTION_MIXED', 'CEDEAR', 'BOND', 'FCI', 'CAUCION_ALERT', 'UNKNOWN_SECTION']::text[] THEN
      RAISE EXCEPTION 'MIG-HIST-01: el enum "BindSectionType" ya existe con labels distintos a los esperados por la reconciliación';
    END IF;
  END IF;
END $$;

-- CreateEnum (idempotente): EstadoCierre
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'EstadoCierre') THEN
    CREATE TYPE "EstadoCierre" AS ENUM ('ABIERTO', 'CERRADO', 'REABIERTO');
  ELSE
    IF (
      SELECT array_agg(enumlabel::text ORDER BY enumsortorder)
      FROM pg_enum
      WHERE enumtypid = '"EstadoCierre"'::regtype
    ) IS DISTINCT FROM ARRAY['ABIERTO', 'CERRADO', 'REABIERTO']::text[] THEN
      RAISE EXCEPTION 'MIG-HIST-01: el enum "EstadoCierre" ya existe con labels distintos a los esperados por la reconciliación';
    END IF;
  END IF;
END $$;

-- CreateEnum (idempotente): EstadoHonorario
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'EstadoHonorario') THEN
    CREATE TYPE "EstadoHonorario" AS ENUM ('PENDIENTE', 'COBRADO', 'NO_CORRESPONDE');
  ELSE
    IF (
      SELECT array_agg(enumlabel::text ORDER BY enumsortorder)
      FROM pg_enum
      WHERE enumtypid = '"EstadoHonorario"'::regtype
    ) IS DISTINCT FROM ARRAY['PENDIENTE', 'COBRADO', 'NO_CORRESPONDE']::text[] THEN
      RAISE EXCEPTION 'MIG-HIST-01: el enum "EstadoHonorario" ya existe con labels distintos a los esperados por la reconciliación';
    END IF;
  END IF;
END $$;

-- CreateEnum (idempotente): TipoOpBolsa
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'TipoOpBolsa') THEN
    CREATE TYPE "TipoOpBolsa" AS ENUM ('COMPRA_BONO', 'VENTA_BONO', 'COMPRA_ACCION', 'VENTA_ACCION', 'COMPRA_CEDEAR', 'VENTA_CEDEAR', 'CAUCION_COLOCADORA', 'CAUCION_TOMADORA', 'FUTURO', 'OPCION_CALL', 'OPCION_PUT', 'MEP', 'SENEBI');
  ELSE
    IF (
      SELECT array_agg(enumlabel::text ORDER BY enumsortorder)
      FROM pg_enum
      WHERE enumtypid = '"TipoOpBolsa"'::regtype
    ) IS DISTINCT FROM ARRAY['COMPRA_BONO', 'VENTA_BONO', 'COMPRA_ACCION', 'VENTA_ACCION', 'COMPRA_CEDEAR', 'VENTA_CEDEAR', 'CAUCION_COLOCADORA', 'CAUCION_TOMADORA', 'FUTURO', 'OPCION_CALL', 'OPCION_PUT', 'MEP', 'SENEBI']::text[] THEN
      RAISE EXCEPTION 'MIG-HIST-01: el enum "TipoOpBolsa" ya existe con labels distintos a los esperados por la reconciliación';
    END IF;
  END IF;
END $$;

-- CreateEnum (idempotente): EstadoOpBolsa
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'EstadoOpBolsa') THEN
    CREATE TYPE "EstadoOpBolsa" AS ENUM ('PENDIENTE_CONCERTACION', 'CONCERTADA', 'LIQUIDADA', 'ANULADA');
  ELSE
    IF (
      SELECT array_agg(enumlabel::text ORDER BY enumsortorder)
      FROM pg_enum
      WHERE enumtypid = '"EstadoOpBolsa"'::regtype
    ) IS DISTINCT FROM ARRAY['PENDIENTE_CONCERTACION', 'CONCERTADA', 'LIQUIDADA', 'ANULADA']::text[] THEN
      RAISE EXCEPTION 'MIG-HIST-01: el enum "EstadoOpBolsa" ya existe con labels distintos a los esperados por la reconciliación';
    END IF;
  END IF;
END $$;

-- CreateEnum (idempotente): MercadoBolsa
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'MercadoBolsa') THEN
    CREATE TYPE "MercadoBolsa" AS ENUM ('BYMA', 'MAE', 'SENEBI_OTC', 'MATBA_ROFEX', 'OTC');
  ELSE
    IF (
      SELECT array_agg(enumlabel::text ORDER BY enumsortorder)
      FROM pg_enum
      WHERE enumtypid = '"MercadoBolsa"'::regtype
    ) IS DISTINCT FROM ARRAY['BYMA', 'MAE', 'SENEBI_OTC', 'MATBA_ROFEX', 'OTC']::text[] THEN
      RAISE EXCEPTION 'MIG-HIST-01: el enum "MercadoBolsa" ya existe con labels distintos a los esperados por la reconciliación';
    END IF;
  END IF;
END $$;

-- CreateEnum (idempotente): PlazoLiquidacion
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'PlazoLiquidacion') THEN
    CREATE TYPE "PlazoLiquidacion" AS ENUM ('CI', 'T1', 'T2');
  ELSE
    IF (
      SELECT array_agg(enumlabel::text ORDER BY enumsortorder)
      FROM pg_enum
      WHERE enumtypid = '"PlazoLiquidacion"'::regtype
    ) IS DISTINCT FROM ARRAY['CI', 'T1', 'T2']::text[] THEN
      RAISE EXCEPTION 'MIG-HIST-01: el enum "PlazoLiquidacion" ya existe con labels distintos a los esperados por la reconciliación';
    END IF;
  END IF;
END $$;

-- AlterEnum (idempotente): agrega valor si falta
ALTER TYPE "CategoriaActivo" ADD VALUE IF NOT EXISTS 'ACCION_ARS';

-- AlterTable (idempotente): Activo
ALTER TABLE "Activo" ADD COLUMN IF NOT EXISTS "priceErrorMessage" TEXT;
ALTER TABLE "Activo" ADD COLUMN IF NOT EXISTS "priceSource" "PriceSource" NOT NULL DEFAULT 'MANUAL';
ALTER TABLE "Activo" ADD COLUMN IF NOT EXISTS "priceStatus" "PriceStatus" NOT NULL DEFAULT 'OK';
ALTER TABLE "Activo" ADD COLUMN IF NOT EXISTS "priceSyncedAt" TIMESTAMP(3);
ALTER TABLE "Activo" ADD COLUMN IF NOT EXISTS "providerUpdatedAt" TIMESTAMP(3);

-- AlterTable (idempotente): Caja
ALTER TABLE "Caja" ADD COLUMN IF NOT EXISTS "tipo" "TipoCaja" NOT NULL DEFAULT 'SUCURSAL_OPERATIVA';

-- AlterTable (idempotente): Cartera
ALTER TABLE "Cartera" ADD COLUMN IF NOT EXISTS "comitenteNumber" TEXT;
ALTER TABLE "Cartera" ADD COLUMN IF NOT EXISTS "investmentAccountType" TEXT;
ALTER TABLE "Cartera" ADD COLUMN IF NOT EXISTS "mirrorInInvestmentAccounts" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable (idempotente): Cliente
ALTER TABLE "Cliente" ADD COLUMN IF NOT EXISTS "productorId" TEXT;

-- AlterTable (idempotente): HoldingComitenteInversion
ALTER TABLE "HoldingComitenteInversion" ADD COLUMN IF NOT EXISTS "priceErrorMessage" TEXT;
ALTER TABLE "HoldingComitenteInversion" ADD COLUMN IF NOT EXISTS "priceSource" "PriceSource" NOT NULL DEFAULT 'MANUAL';
ALTER TABLE "HoldingComitenteInversion" ADD COLUMN IF NOT EXISTS "priceStatus" "PriceStatus" NOT NULL DEFAULT 'OK';
ALTER TABLE "HoldingComitenteInversion" ADD COLUMN IF NOT EXISTS "priceSyncedAt" TIMESTAMP(3);
ALTER TABLE "HoldingComitenteInversion" ADD COLUMN IF NOT EXISTS "providerUpdatedAt" TIMESTAMP(3);

-- AlterTable (idempotente): MovimientoCaja
ALTER TABLE "MovimientoCaja" ADD COLUMN IF NOT EXISTS "anulado" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "MovimientoCaja" ADD COLUMN IF NOT EXISTS "pagoDeId" TEXT;

-- AlterTable (idempotente): PrecioHistorico
ALTER TABLE "PrecioHistorico" ADD COLUMN IF NOT EXISTS "userId" TEXT;

-- AlterTable (idempotente): User
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "cargo" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "image" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "mustChangePassword" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "phone" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "twoFactorLastUsedAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "twoFactorSecret" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "ubicacion" TEXT;

-- CreateTable (idempotente): PriceTickerAlias
CREATE TABLE IF NOT EXISTS "PriceTickerAlias" (
    "id" TEXT NOT NULL,
    "bygTicker" TEXT NOT NULL,
    "bygCategory" "CategoriaActivo",
    "data912Endpoint" TEXT NOT NULL,
    "data912Symbol" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PriceTickerAlias_pkey" PRIMARY KEY ("id")
);

-- CreateTable (idempotente): BindTenenciasImportBatch
CREATE TABLE IF NOT EXISTS "BindTenenciasImportBatch" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdByUserId" TEXT,
    "status" "BindImportBatchStatus" NOT NULL DEFAULT 'DRAFT',
    "totalFiles" INTEGER NOT NULL DEFAULT 0,
    "parsedFiles" INTEGER NOT NULL DEFAULT 0,
    "errorFiles" INTEGER NOT NULL DEFAULT 0,
    "confirmedFiles" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,

    CONSTRAINT "BindTenenciasImportBatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable (idempotente): BindTenenciasImportFile
CREATE TABLE IF NOT EXISTS "BindTenenciasImportFile" (
    "id" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileHashSha256" TEXT NOT NULL,
    "status" "BindImportFileStatus" NOT NULL DEFAULT 'PARSED',
    "reportDate" DATE,
    "reportTime" TEXT,
    "accountNumber" TEXT,
    "accountName" TEXT,
    "matchedComitenteId" TEXT,
    "totalAmountARS" DECIMAL(18,2),
    "rawJson" JSONB NOT NULL,
    "warningsJson" JSONB,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BindTenenciasImportFile_pkey" PRIMARY KEY ("id")
);

-- CreateTable (idempotente): BindTenenciasImportRow
CREATE TABLE IF NOT EXISTS "BindTenenciasImportRow" (
    "id" TEXT NOT NULL,
    "importFileId" TEXT NOT NULL,
    "sectionName" TEXT NOT NULL,
    "sectionType" "BindSectionType" NOT NULL,
    "ticker" TEXT,
    "brokerCode" TEXT,
    "descriptionRaw" TEXT NOT NULL,
    "descriptionClean" TEXT NOT NULL,
    "quote" DECIMAL(18,6),
    "saldoVencidoQuantity" DECIMAL(18,6),
    "saldoVencidoAmountARS" DECIMAL(18,2),
    "pending24AmountARS" DECIMAL(18,2),
    "pending48AmountARS" DECIMAL(18,2),
    "pendingFutureAmountARS" DECIMAL(18,2),
    "garantiaQuantity" DECIMAL(18,6),
    "garantiaAmountARS" DECIMAL(18,2),
    "totalQuantity" DECIMAL(18,6),
    "totalAmountARS" DECIMAL(18,2),
    "inferredInstrumentType" TEXT NOT NULL,
    "inferredNativeCurrency" TEXT NOT NULL,
    "matchedActivoId" TEXT,
    "requiresMapping" BOOLEAN NOT NULL DEFAULT false,
    "warningsJson" JSONB,
    "rawJson" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BindTenenciasImportRow_pkey" PRIMARY KEY ("id")
);

-- CreateTable (idempotente): BrokerTickerAlias
CREATE TABLE IF NOT EXISTS "BrokerTickerAlias" (
    "id" TEXT NOT NULL,
    "broker" TEXT NOT NULL DEFAULT 'BIND',
    "brokerTicker" TEXT NOT NULL,
    "brokerCode" TEXT,
    "activoId" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BrokerTickerAlias_pkey" PRIMARY KEY ("id")
);

-- CreateTable (idempotente): BrokerAccountAlias
CREATE TABLE IF NOT EXISTS "BrokerAccountAlias" (
    "id" TEXT NOT NULL,
    "broker" TEXT NOT NULL DEFAULT 'BIND',
    "accountNumber" TEXT NOT NULL,
    "accountNameLastSeen" TEXT,
    "comitenteId" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BrokerAccountAlias_pkey" PRIMARY KEY ("id")
);

-- CreateTable (idempotente): PlazoFijoMovimiento
CREATE TABLE IF NOT EXISTS "PlazoFijoMovimiento" (
    "id" TEXT NOT NULL,
    "plazoFijoId" TEXT NOT NULL,
    "fecha" DATE NOT NULL,
    "tipo" TEXT NOT NULL,
    "descripcion" TEXT,
    "monto" DECIMAL(18,2) NOT NULL,
    "saldoAcumulado" DECIMAL(18,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlazoFijoMovimiento_pkey" PRIMARY KEY ("id")
);

-- CreateTable (idempotente): Productor
CREATE TABLE IF NOT EXISTS "Productor" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "porcentaje" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "notas" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Productor_pkey" PRIMARY KEY ("id")
);

-- CreateTable (idempotente): ComisionMes
CREATE TABLE IF NOT EXISTS "ComisionMes" (
    "id" TEXT NOT NULL,
    "productorId" TEXT NOT NULL,
    "mes" TEXT NOT NULL,
    "estado" "EstadoComision" NOT NULL DEFAULT 'PENDIENTE',
    "notas" TEXT,
    "paidAt" TIMESTAMP(3),
    "paidByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ComisionMes_pkey" PRIMARY KEY ("id")
);

-- CreateTable (idempotente): OperacionBolsa
CREATE TABLE IF NOT EXISTS "OperacionBolsa" (
    "id" TEXT NOT NULL,
    "clienteId" TEXT,
    "carteraId" TEXT,
    "comitenteId" TEXT,
    "tipoOperacion" "TipoOpBolsa" NOT NULL,
    "ticker" TEXT NOT NULL,
    "cantidad" DECIMAL(18,6) NOT NULL,
    "precio" DECIMAL(18,6) NOT NULL,
    "moneda" "Moneda" NOT NULL,
    "mercado" "MercadoBolsa" NOT NULL,
    "cuentaInversionId" TEXT,
    "estado" "EstadoOpBolsa" NOT NULL DEFAULT 'PENDIENTE_CONCERTACION',
    "operadorCargaId" TEXT NOT NULL,
    "operadorCierreId" TEXT,
    "fechaOperativa" DATE,
    "fechaCarga" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaConcertacion" DATE,
    "fechaLiquidacion" DATE,
    "plazoLiquidacion" "PlazoLiquidacion" NOT NULL DEFAULT 'T1',
    "observaciones" TEXT,
    "nroBoleto" TEXT,
    "alyc" TEXT,
    "comisionPct" DECIMAL(8,4),
    "comisionFija" DECIMAL(18,2),
    "derechosMercado" DECIMAL(18,2),
    "gastos" DECIMAL(18,2),
    "impuestos" DECIMAL(18,2),
    "tcMepDia" DECIMAL(12,4),
    "comisionUSD" DECIMAL(18,2),
    "senebiBruto" DECIMAL(18,2),
    "esSenebi" BOOLEAN NOT NULL DEFAULT false,
    "diasCaucion" INTEGER,
    "tasaCaucion" DECIMAL(8,4),
    "costoReal" DECIMAL(18,2),
    "precioPromedioReal" DECIMAL(18,6),
    "netoLiquidado" DECIMAL(18,2),
    "resultadoBruto" DECIMAL(18,2),
    "resultadoNeto" DECIMAL(18,2),
    "anulada" BOOLEAN NOT NULL DEFAULT false,
    "motivoAnulacion" TEXT,
    "notas" TEXT,
    "grupoArbitrajeId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OperacionBolsa_pkey" PRIMARY KEY ("id")
);

-- CreateTable (idempotente): OperacionBolsaLog
CREATE TABLE IF NOT EXISTS "OperacionBolsaLog" (
    "id" TEXT NOT NULL,
    "operacionId" TEXT NOT NULL,
    "userId" TEXT,
    "accion" TEXT NOT NULL,
    "estadoAnterior" "EstadoOpBolsa",
    "estadoNuevo" "EstadoOpBolsa" NOT NULL,
    "snapshot" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OperacionBolsaLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable (idempotente): TcMepHistorial
CREATE TABLE IF NOT EXISTS "TcMepHistorial" (
    "id" TEXT NOT NULL,
    "fecha" DATE NOT NULL,
    "valor" DECIMAL(12,4) NOT NULL,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TcMepHistorial_pkey" PRIMARY KEY ("id")
);

-- CreateTable (idempotente): ComisionConfig
CREATE TABLE IF NOT EXISTS "ComisionConfig" (
    "id" TEXT NOT NULL,
    "productorId" TEXT NOT NULL,
    "pctProductor" DECIMAL(5,2) NOT NULL,
    "pctBYG" DECIMAL(5,2) NOT NULL,
    "pctIIBB" DECIMAL(5,2) NOT NULL DEFAULT 5.50,
    "aplicaSenebi" BOOLEAN NOT NULL DEFAULT false,
    "otrosImpuestos" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "vigenciaDesde" DATE NOT NULL,
    "notas" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ComisionConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable (idempotente): HonorarioBYG
CREATE TABLE IF NOT EXISTS "HonorarioBYG" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "clienteId" TEXT,
    "comitenteId" TEXT,
    "cobra" BOOLEAN NOT NULL DEFAULT true,
    "porcentajeAnual" DECIMAL(8,4) NOT NULL,
    "moneda" "Moneda" NOT NULL DEFAULT 'USD',
    "fechaInicio" DATE NOT NULL,
    "notas" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HonorarioBYG_pkey" PRIMARY KEY ("id")
);

-- CreateTable (idempotente): CierreMensual
CREATE TABLE IF NOT EXISTS "CierreMensual" (
    "id" TEXT NOT NULL,
    "anio" INTEGER NOT NULL,
    "mes" TEXT NOT NULL,
    "fechaCierre" TIMESTAMP(3),
    "userId" TEXT,
    "estado" "EstadoCierre" NOT NULL DEFAULT 'ABIERTO',
    "tcBlue" DECIMAL(12,4),
    "tcMep" DECIMAL(12,4),
    "notas" TEXT,
    "snapshotData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CierreMensual_pkey" PRIMARY KEY ("id")
);

-- CreateTable (idempotente): SnapshotMensual
CREATE TABLE IF NOT EXISTS "SnapshotMensual" (
    "id" TEXT NOT NULL,
    "cierreMensualId" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "descripcion" TEXT,
    "moneda" TEXT NOT NULL DEFAULT 'USD',
    "valorARS" DECIMAL(18,2),
    "valorUSD" DECIMAL(18,2),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SnapshotMensual_pkey" PRIMARY KEY ("id")
);

-- CreateTable (idempotente): HonorarioBYGMes
CREATE TABLE IF NOT EXISTS "HonorarioBYGMes" (
    "id" TEXT NOT NULL,
    "honorarioId" TEXT NOT NULL,
    "mes" TEXT NOT NULL,
    "saldoCartera" DECIMAL(18,2),
    "monedaSaldo" "Moneda" NOT NULL DEFAULT 'USD',
    "porcentaje" DECIMAL(8,4) NOT NULL,
    "honorarioUSD" DECIMAL(18,2),
    "tcMep" DECIMAL(12,4),
    "honorarioARS" DECIMAL(18,2),
    "estado" "EstadoHonorario" NOT NULL DEFAULT 'PENDIENTE',
    "notas" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HonorarioBYGMes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex (idempotente)
CREATE INDEX IF NOT EXISTS "PriceTickerAlias_bygTicker_idx" ON "PriceTickerAlias"("bygTicker");

-- CreateIndex (idempotente)
CREATE INDEX IF NOT EXISTS "PriceTickerAlias_data912Endpoint_data912Symbol_idx" ON "PriceTickerAlias"("data912Endpoint", "data912Symbol");

-- CreateIndex (idempotente)
CREATE UNIQUE INDEX IF NOT EXISTS "PriceTickerAlias_bygTicker_data912Endpoint_key" ON "PriceTickerAlias"("bygTicker", "data912Endpoint");

-- CreateIndex (idempotente)
CREATE INDEX IF NOT EXISTS "BindTenenciasImportBatch_status_idx" ON "BindTenenciasImportBatch"("status");

-- CreateIndex (idempotente)
CREATE INDEX IF NOT EXISTS "BindTenenciasImportBatch_createdByUserId_idx" ON "BindTenenciasImportBatch"("createdByUserId");

-- CreateIndex (idempotente)
CREATE UNIQUE INDEX IF NOT EXISTS "BindTenenciasImportFile_fileHashSha256_key" ON "BindTenenciasImportFile"("fileHashSha256");

-- CreateIndex (idempotente)
CREATE INDEX IF NOT EXISTS "BindTenenciasImportFile_batchId_idx" ON "BindTenenciasImportFile"("batchId");

-- CreateIndex (idempotente)
CREATE INDEX IF NOT EXISTS "BindTenenciasImportFile_accountNumber_reportDate_idx" ON "BindTenenciasImportFile"("accountNumber", "reportDate");

-- CreateIndex (idempotente)
CREATE INDEX IF NOT EXISTS "BindTenenciasImportFile_matchedComitenteId_idx" ON "BindTenenciasImportFile"("matchedComitenteId");

-- CreateIndex (idempotente)
CREATE INDEX IF NOT EXISTS "BindTenenciasImportFile_status_idx" ON "BindTenenciasImportFile"("status");

-- CreateIndex (idempotente)
CREATE INDEX IF NOT EXISTS "BindTenenciasImportRow_importFileId_idx" ON "BindTenenciasImportRow"("importFileId");

-- CreateIndex (idempotente)
CREATE INDEX IF NOT EXISTS "BindTenenciasImportRow_ticker_idx" ON "BindTenenciasImportRow"("ticker");

-- CreateIndex (idempotente)
CREATE INDEX IF NOT EXISTS "BindTenenciasImportRow_brokerCode_idx" ON "BindTenenciasImportRow"("brokerCode");

-- CreateIndex (idempotente)
CREATE INDEX IF NOT EXISTS "BindTenenciasImportRow_matchedActivoId_idx" ON "BindTenenciasImportRow"("matchedActivoId");

-- CreateIndex (idempotente)
CREATE INDEX IF NOT EXISTS "BindTenenciasImportRow_requiresMapping_idx" ON "BindTenenciasImportRow"("requiresMapping");

-- CreateIndex (idempotente)
CREATE INDEX IF NOT EXISTS "BrokerTickerAlias_activoId_idx" ON "BrokerTickerAlias"("activoId");

-- CreateIndex (idempotente)
CREATE UNIQUE INDEX IF NOT EXISTS "BrokerTickerAlias_broker_brokerTicker_brokerCode_key" ON "BrokerTickerAlias"("broker", "brokerTicker", "brokerCode");

-- CreateIndex (idempotente)
CREATE INDEX IF NOT EXISTS "BrokerAccountAlias_comitenteId_idx" ON "BrokerAccountAlias"("comitenteId");

-- CreateIndex (idempotente)
CREATE UNIQUE INDEX IF NOT EXISTS "BrokerAccountAlias_broker_accountNumber_key" ON "BrokerAccountAlias"("broker", "accountNumber");

-- CreateIndex (idempotente)
CREATE INDEX IF NOT EXISTS "PlazoFijoMovimiento_plazoFijoId_fecha_idx" ON "PlazoFijoMovimiento"("plazoFijoId", "fecha");

-- CreateIndex (idempotente)
CREATE UNIQUE INDEX IF NOT EXISTS "Productor_nombre_key" ON "Productor"("nombre");

-- CreateIndex (idempotente)
CREATE INDEX IF NOT EXISTS "Productor_activo_idx" ON "Productor"("activo");

-- CreateIndex (idempotente)
CREATE INDEX IF NOT EXISTS "ComisionMes_mes_idx" ON "ComisionMes"("mes");

-- CreateIndex (idempotente)
CREATE INDEX IF NOT EXISTS "ComisionMes_productorId_idx" ON "ComisionMes"("productorId");

-- CreateIndex (idempotente)
CREATE UNIQUE INDEX IF NOT EXISTS "ComisionMes_productorId_mes_key" ON "ComisionMes"("productorId", "mes");

-- CreateIndex (idempotente)
CREATE INDEX IF NOT EXISTS "OperacionBolsa_clienteId_idx" ON "OperacionBolsa"("clienteId");

-- CreateIndex (idempotente)
CREATE INDEX IF NOT EXISTS "OperacionBolsa_carteraId_idx" ON "OperacionBolsa"("carteraId");

-- CreateIndex (idempotente)
CREATE INDEX IF NOT EXISTS "OperacionBolsa_cuentaInversionId_idx" ON "OperacionBolsa"("cuentaInversionId");

-- CreateIndex (idempotente)
CREATE INDEX IF NOT EXISTS "OperacionBolsa_estado_idx" ON "OperacionBolsa"("estado");

-- CreateIndex (idempotente)
CREATE INDEX IF NOT EXISTS "OperacionBolsa_fechaCarga_idx" ON "OperacionBolsa"("fechaCarga");

-- CreateIndex (idempotente)
CREATE INDEX IF NOT EXISTS "OperacionBolsa_fechaOperativa_idx" ON "OperacionBolsa"("fechaOperativa");

-- CreateIndex (idempotente)
CREATE INDEX IF NOT EXISTS "OperacionBolsa_fechaConcertacion_idx" ON "OperacionBolsa"("fechaConcertacion");

-- CreateIndex (idempotente)
CREATE INDEX IF NOT EXISTS "OperacionBolsa_ticker_idx" ON "OperacionBolsa"("ticker");

-- CreateIndex (idempotente)
CREATE INDEX IF NOT EXISTS "OperacionBolsa_tipoOperacion_idx" ON "OperacionBolsa"("tipoOperacion");

-- CreateIndex (idempotente)
CREATE INDEX IF NOT EXISTS "OperacionBolsa_grupoArbitrajeId_idx" ON "OperacionBolsa"("grupoArbitrajeId");

-- CreateIndex (idempotente)
CREATE INDEX IF NOT EXISTS "OperacionBolsaLog_operacionId_idx" ON "OperacionBolsaLog"("operacionId");

-- CreateIndex (idempotente)
CREATE INDEX IF NOT EXISTS "OperacionBolsaLog_createdAt_idx" ON "OperacionBolsaLog"("createdAt");

-- CreateIndex (idempotente)
CREATE INDEX IF NOT EXISTS "TcMepHistorial_fecha_idx" ON "TcMepHistorial"("fecha");

-- CreateIndex (idempotente)
CREATE UNIQUE INDEX IF NOT EXISTS "TcMepHistorial_fecha_key" ON "TcMepHistorial"("fecha");

-- CreateIndex (idempotente)
CREATE INDEX IF NOT EXISTS "ComisionConfig_productorId_vigenciaDesde_idx" ON "ComisionConfig"("productorId", "vigenciaDesde");

-- CreateIndex (idempotente)
CREATE INDEX IF NOT EXISTS "HonorarioBYG_clienteId_idx" ON "HonorarioBYG"("clienteId");

-- CreateIndex (idempotente)
CREATE INDEX IF NOT EXISTS "HonorarioBYG_comitenteId_idx" ON "HonorarioBYG"("comitenteId");

-- CreateIndex (idempotente)
CREATE UNIQUE INDEX IF NOT EXISTS "CierreMensual_mes_key" ON "CierreMensual"("mes");

-- CreateIndex (idempotente)
CREATE INDEX IF NOT EXISTS "CierreMensual_mes_idx" ON "CierreMensual"("mes");

-- CreateIndex (idempotente)
CREATE INDEX IF NOT EXISTS "CierreMensual_estado_idx" ON "CierreMensual"("estado");

-- CreateIndex (idempotente)
CREATE INDEX IF NOT EXISTS "CierreMensual_anio_idx" ON "CierreMensual"("anio");

-- CreateIndex (idempotente)
CREATE INDEX IF NOT EXISTS "SnapshotMensual_cierreMensualId_idx" ON "SnapshotMensual"("cierreMensualId");

-- CreateIndex (idempotente)
CREATE INDEX IF NOT EXISTS "SnapshotMensual_categoria_idx" ON "SnapshotMensual"("categoria");

-- CreateIndex (idempotente)
CREATE INDEX IF NOT EXISTS "HonorarioBYGMes_mes_idx" ON "HonorarioBYGMes"("mes");

-- CreateIndex (idempotente)
CREATE INDEX IF NOT EXISTS "HonorarioBYGMes_honorarioId_idx" ON "HonorarioBYGMes"("honorarioId");

-- CreateIndex (idempotente)
CREATE UNIQUE INDEX IF NOT EXISTS "HonorarioBYGMes_honorarioId_mes_key" ON "HonorarioBYGMes"("honorarioId", "mes");

-- CreateIndex (idempotente)
CREATE INDEX IF NOT EXISTS "Cliente_productorId_idx" ON "Cliente"("productorId");

-- CreateIndex (idempotente)
CREATE INDEX IF NOT EXISTS "MovimientoCaja_pagoDeId_idx" ON "MovimientoCaja"("pagoDeId");

-- AddForeignKey (idempotente): Cliente_productorId_fkey
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Cliente_productorId_fkey' AND conrelid = '"Cliente"'::regclass
  ) THEN
    ALTER TABLE "Cliente" ADD CONSTRAINT "Cliente_productorId_fkey" FOREIGN KEY ("productorId") REFERENCES "Productor"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- AddForeignKey (idempotente): BindTenenciasImportBatch_createdByUserId_fkey
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'BindTenenciasImportBatch_createdByUserId_fkey' AND conrelid = '"BindTenenciasImportBatch"'::regclass
  ) THEN
    ALTER TABLE "BindTenenciasImportBatch" ADD CONSTRAINT "BindTenenciasImportBatch_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- AddForeignKey (idempotente): BindTenenciasImportFile_batchId_fkey
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'BindTenenciasImportFile_batchId_fkey' AND conrelid = '"BindTenenciasImportFile"'::regclass
  ) THEN
    ALTER TABLE "BindTenenciasImportFile" ADD CONSTRAINT "BindTenenciasImportFile_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "BindTenenciasImportBatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- AddForeignKey (idempotente): BindTenenciasImportFile_matchedComitenteId_fkey
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'BindTenenciasImportFile_matchedComitenteId_fkey' AND conrelid = '"BindTenenciasImportFile"'::regclass
  ) THEN
    ALTER TABLE "BindTenenciasImportFile" ADD CONSTRAINT "BindTenenciasImportFile_matchedComitenteId_fkey" FOREIGN KEY ("matchedComitenteId") REFERENCES "ComitenteInversion"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- AddForeignKey (idempotente): BindTenenciasImportRow_importFileId_fkey
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'BindTenenciasImportRow_importFileId_fkey' AND conrelid = '"BindTenenciasImportRow"'::regclass
  ) THEN
    ALTER TABLE "BindTenenciasImportRow" ADD CONSTRAINT "BindTenenciasImportRow_importFileId_fkey" FOREIGN KEY ("importFileId") REFERENCES "BindTenenciasImportFile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- AddForeignKey (idempotente): BindTenenciasImportRow_matchedActivoId_fkey
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'BindTenenciasImportRow_matchedActivoId_fkey' AND conrelid = '"BindTenenciasImportRow"'::regclass
  ) THEN
    ALTER TABLE "BindTenenciasImportRow" ADD CONSTRAINT "BindTenenciasImportRow_matchedActivoId_fkey" FOREIGN KEY ("matchedActivoId") REFERENCES "Activo"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- AddForeignKey (idempotente): BrokerTickerAlias_activoId_fkey
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'BrokerTickerAlias_activoId_fkey' AND conrelid = '"BrokerTickerAlias"'::regclass
  ) THEN
    ALTER TABLE "BrokerTickerAlias" ADD CONSTRAINT "BrokerTickerAlias_activoId_fkey" FOREIGN KEY ("activoId") REFERENCES "Activo"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- AddForeignKey (idempotente): BrokerAccountAlias_comitenteId_fkey
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'BrokerAccountAlias_comitenteId_fkey' AND conrelid = '"BrokerAccountAlias"'::regclass
  ) THEN
    ALTER TABLE "BrokerAccountAlias" ADD CONSTRAINT "BrokerAccountAlias_comitenteId_fkey" FOREIGN KEY ("comitenteId") REFERENCES "ComitenteInversion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- AddForeignKey (idempotente): MovimientoCaja_pagoDeId_fkey
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'MovimientoCaja_pagoDeId_fkey' AND conrelid = '"MovimientoCaja"'::regclass
  ) THEN
    ALTER TABLE "MovimientoCaja" ADD CONSTRAINT "MovimientoCaja_pagoDeId_fkey" FOREIGN KEY ("pagoDeId") REFERENCES "MovimientoCaja"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- AddForeignKey (idempotente): PlazoFijoMovimiento_plazoFijoId_fkey
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'PlazoFijoMovimiento_plazoFijoId_fkey' AND conrelid = '"PlazoFijoMovimiento"'::regclass
  ) THEN
    ALTER TABLE "PlazoFijoMovimiento" ADD CONSTRAINT "PlazoFijoMovimiento_plazoFijoId_fkey" FOREIGN KEY ("plazoFijoId") REFERENCES "PlazoFijo"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- AddForeignKey (idempotente): ComisionMes_productorId_fkey
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ComisionMes_productorId_fkey' AND conrelid = '"ComisionMes"'::regclass
  ) THEN
    ALTER TABLE "ComisionMes" ADD CONSTRAINT "ComisionMes_productorId_fkey" FOREIGN KEY ("productorId") REFERENCES "Productor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

-- AddForeignKey (idempotente): OperacionBolsa_clienteId_fkey
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'OperacionBolsa_clienteId_fkey' AND conrelid = '"OperacionBolsa"'::regclass
  ) THEN
    ALTER TABLE "OperacionBolsa" ADD CONSTRAINT "OperacionBolsa_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- AddForeignKey (idempotente): OperacionBolsa_carteraId_fkey
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'OperacionBolsa_carteraId_fkey' AND conrelid = '"OperacionBolsa"'::regclass
  ) THEN
    ALTER TABLE "OperacionBolsa" ADD CONSTRAINT "OperacionBolsa_carteraId_fkey" FOREIGN KEY ("carteraId") REFERENCES "Cartera"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- AddForeignKey (idempotente): OperacionBolsa_comitenteId_fkey
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'OperacionBolsa_comitenteId_fkey' AND conrelid = '"OperacionBolsa"'::regclass
  ) THEN
    ALTER TABLE "OperacionBolsa" ADD CONSTRAINT "OperacionBolsa_comitenteId_fkey" FOREIGN KEY ("comitenteId") REFERENCES "ComitenteInversion"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- AddForeignKey (idempotente): OperacionBolsa_cuentaInversionId_fkey
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'OperacionBolsa_cuentaInversionId_fkey' AND conrelid = '"OperacionBolsa"'::regclass
  ) THEN
    ALTER TABLE "OperacionBolsa" ADD CONSTRAINT "OperacionBolsa_cuentaInversionId_fkey" FOREIGN KEY ("cuentaInversionId") REFERENCES "CuentaInversion"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- AddForeignKey (idempotente): OperacionBolsa_operadorCargaId_fkey
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'OperacionBolsa_operadorCargaId_fkey' AND conrelid = '"OperacionBolsa"'::regclass
  ) THEN
    ALTER TABLE "OperacionBolsa" ADD CONSTRAINT "OperacionBolsa_operadorCargaId_fkey" FOREIGN KEY ("operadorCargaId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

-- AddForeignKey (idempotente): OperacionBolsa_operadorCierreId_fkey
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'OperacionBolsa_operadorCierreId_fkey' AND conrelid = '"OperacionBolsa"'::regclass
  ) THEN
    ALTER TABLE "OperacionBolsa" ADD CONSTRAINT "OperacionBolsa_operadorCierreId_fkey" FOREIGN KEY ("operadorCierreId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- AddForeignKey (idempotente): OperacionBolsaLog_operacionId_fkey
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'OperacionBolsaLog_operacionId_fkey' AND conrelid = '"OperacionBolsaLog"'::regclass
  ) THEN
    ALTER TABLE "OperacionBolsaLog" ADD CONSTRAINT "OperacionBolsaLog_operacionId_fkey" FOREIGN KEY ("operacionId") REFERENCES "OperacionBolsa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

-- AddForeignKey (idempotente): OperacionBolsaLog_userId_fkey
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'OperacionBolsaLog_userId_fkey' AND conrelid = '"OperacionBolsaLog"'::regclass
  ) THEN
    ALTER TABLE "OperacionBolsaLog" ADD CONSTRAINT "OperacionBolsaLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- AddForeignKey (idempotente): ComisionConfig_productorId_fkey
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ComisionConfig_productorId_fkey' AND conrelid = '"ComisionConfig"'::regclass
  ) THEN
    ALTER TABLE "ComisionConfig" ADD CONSTRAINT "ComisionConfig_productorId_fkey" FOREIGN KEY ("productorId") REFERENCES "Productor"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- AddForeignKey (idempotente): CierreMensual_userId_fkey
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'CierreMensual_userId_fkey' AND conrelid = '"CierreMensual"'::regclass
  ) THEN
    ALTER TABLE "CierreMensual" ADD CONSTRAINT "CierreMensual_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- AddForeignKey (idempotente): SnapshotMensual_cierreMensualId_fkey
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'SnapshotMensual_cierreMensualId_fkey' AND conrelid = '"SnapshotMensual"'::regclass
  ) THEN
    ALTER TABLE "SnapshotMensual" ADD CONSTRAINT "SnapshotMensual_cierreMensualId_fkey" FOREIGN KEY ("cierreMensualId") REFERENCES "CierreMensual"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- AddForeignKey (idempotente): HonorarioBYGMes_honorarioId_fkey
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'HonorarioBYGMes_honorarioId_fkey' AND conrelid = '"HonorarioBYGMes"'::regclass
  ) THEN
    ALTER TABLE "HonorarioBYGMes" ADD CONSTRAINT "HonorarioBYGMes_honorarioId_fkey" FOREIGN KEY ("honorarioId") REFERENCES "HonorarioBYG"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
