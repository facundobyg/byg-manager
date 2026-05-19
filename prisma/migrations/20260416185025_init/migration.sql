-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'SOCIO', 'EMPLEADO', 'CLIENTE');

-- CreateEnum
CREATE TYPE "ClienteRol" AS ENUM ('CLIENTE', 'SOCIO');

-- CreateEnum
CREATE TYPE "Moneda" AS ENUM ('USD', 'ARS', 'EUR', 'BRL');

-- CreateEnum
CREATE TYPE "TipoMovCC" AS ENUM ('INGRESO', 'EGRESO', 'INTERES', 'AJUSTE');

-- CreateEnum
CREATE TYPE "EstadoPF" AS ENUM ('ACTIVO', 'VENCIDO', 'CANCELADO', 'RENOVADO');

-- CreateEnum
CREATE TYPE "TipoMovCaja" AS ENUM ('ENTRADA', 'SALIDA', 'TRANSFERENCIA_IN', 'TRANSFERENCIA_OUT');

-- CreateEnum
CREATE TYPE "CategoriaActivo" AS ENUM ('BONO_ARS', 'BONO_USD', 'ON_USD', 'ACCION_USD', 'ACCION_USD_EXT', 'CEDEAR', 'CRIPTO', 'FCI');

-- CreateEnum
CREATE TYPE "TipoCartera" AS ENUM ('COMPLETA', 'CRIPTO');

-- CreateEnum
CREATE TYPE "TipoTransferencia" AS ENUM ('FIRMA_A_CLIENTE', 'CLIENTE_A_FIRMA');

-- CreateEnum
CREATE TYPE "TipoOperacionCambio" AS ENUM ('COMPRA_USD', 'VENTA_USD', 'COMPRA_EUR', 'VENTA_EUR', 'COMPRA_BRL', 'VENTA_BRL', 'HONORARIO_CLIENTE', 'HONORARIO_EXTERNO', 'GASTO_OPERATIVO', 'COMISION', 'AJUSTE', 'OTRO');

-- CreateEnum
CREATE TYPE "TipoOperacionLP" AS ENUM ('COMPRA', 'VENTA', 'CUPON', 'COMISION', 'RENTA', 'AMORTIZACION');

-- CreateEnum
CREATE TYPE "TipoSnapshot" AS ENUM ('CIERRE', 'MANUAL', 'AUTO');

-- CreateEnum
CREATE TYPE "TipoInversionInmobiliaria" AS ENUM ('INGRESO', 'EGRESO', 'RENTA', 'MEJORA', 'IMPUESTO');

-- CreateEnum
CREATE TYPE "CategoriaRecordatorio" AS ENUM ('ALQUILER', 'EXPENSAS', 'SUELDO', 'IMPUESTO', 'SERVICIO', 'OTRO');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'SOCIO',
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Permiso" (
    "id" TEXT NOT NULL,
    "modulo" TEXT NOT NULL,
    "accion" TEXT NOT NULL,

    CONSTRAINT "Permiso_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RolPermiso" (
    "id" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "permisoId" TEXT NOT NULL,

    CONSTRAINT "RolPermiso_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserPermiso" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "permisoId" TEXT NOT NULL,
    "concedido" BOOLEAN NOT NULL DEFAULT true,
    "temporal" BOOLEAN NOT NULL DEFAULT false,
    "fechaExpiracion" TIMESTAMP(3),
    "notas" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserPermiso_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cliente" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "rol" "ClienteRol" NOT NULL DEFAULT 'CLIENTE',
    "email" TEXT,
    "telefono" TEXT,
    "banco" TEXT,
    "tasaCC" DECIMAL(8,4) NOT NULL DEFAULT 0,
    "notas" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Cliente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CuentaCorriente" (
    "id" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "moneda" "Moneda" NOT NULL DEFAULT 'USD',
    "saldo" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CuentaCorriente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MovimientoCC" (
    "id" TEXT NOT NULL,
    "cuentaCorrienteId" TEXT NOT NULL,
    "fecha" DATE NOT NULL,
    "tipo" "TipoMovCC" NOT NULL,
    "monto" DECIMAL(18,2) NOT NULL,
    "descripcion" TEXT,
    "operacionCambioId" TEXT,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MovimientoCC_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlazoFijo" (
    "id" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "capital" DECIMAL(18,2) NOT NULL,
    "tasaAnual" DECIMAL(8,4) NOT NULL,
    "moneda" "Moneda" NOT NULL DEFAULT 'USD',
    "fechaInicio" DATE NOT NULL,
    "fechaVencimiento" DATE NOT NULL,
    "estado" "EstadoPF" NOT NULL DEFAULT 'ACTIVO',
    "saldoActual" DECIMAL(18,2) NOT NULL,
    "notas" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlazoFijo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Caja" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "saldoInicialUSD" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "saldoInicialARS" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "esPrincipal" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Caja_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MovimientoCaja" (
    "id" TEXT NOT NULL,
    "cajaId" TEXT NOT NULL,
    "fecha" DATE NOT NULL,
    "tipo" "TipoMovCaja" NOT NULL,
    "moneda" "Moneda" NOT NULL,
    "monto" DECIMAL(18,2) NOT NULL,
    "descripcion" TEXT,
    "confirmado" BOOLEAN NOT NULL DEFAULT false,
    "operacionCambioId" TEXT,
    "transferenciaRef" TEXT,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MovimientoCaja_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Activo" (
    "id" TEXT NOT NULL,
    "ticker" TEXT NOT NULL,
    "descripcion" TEXT,
    "categoria" "CategoriaActivo" NOT NULL,
    "precioActual" DECIMAL(18,6),
    "precioAnterior" DECIMAL(18,6),
    "monedaPrecio" "Moneda" NOT NULL DEFAULT 'USD',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Activo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrecioHistorico" (
    "id" TEXT NOT NULL,
    "activoId" TEXT NOT NULL,
    "fecha" DATE NOT NULL,
    "precio" DECIMAL(18,6) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PrecioHistorico_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cartera" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "tipo" "TipoCartera" NOT NULL DEFAULT 'COMPLETA',
    "orden" INTEGER NOT NULL DEFAULT 0,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "saldoPesos" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "saldoUSDCable" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "saldoUSDMep" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Cartera_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PosicionCartera" (
    "id" TEXT NOT NULL,
    "carteraId" TEXT NOT NULL,
    "activoId" TEXT NOT NULL,
    "cantidad" DECIMAL(18,6) NOT NULL,
    "precioCompra" DECIMAL(18,6) NOT NULL,
    "precioObjetivo" DECIMAL(18,6),
    "fecha" DATE NOT NULL,
    "notas" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PosicionCartera_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustodiaCliente" (
    "id" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "activoId" TEXT NOT NULL,
    "cantidadTotal" DECIMAL(18,6) NOT NULL,
    "precioPromedio" DECIMAL(18,6) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustodiaCliente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TransferenciaActivo" (
    "id" TEXT NOT NULL,
    "fecha" DATE NOT NULL,
    "carteraOrigenId" TEXT NOT NULL,
    "custodiaDestinoId" TEXT,
    "clienteDestinoId" TEXT NOT NULL,
    "activoId" TEXT NOT NULL,
    "cantidad" DECIMAL(18,6) NOT NULL,
    "precioEnTransferencia" DECIMAL(18,6) NOT NULL,
    "tipo" "TipoTransferencia" NOT NULL,
    "userId" TEXT NOT NULL,
    "notas" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TransferenciaActivo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OperacionCambio" (
    "id" TEXT NOT NULL,
    "fecha" DATE NOT NULL,
    "tipo" "TipoOperacionCambio" NOT NULL,
    "clienteNombre" TEXT,
    "clienteId" TEXT,
    "moneda" "Moneda" NOT NULL DEFAULT 'USD',
    "cantidad" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "tipoCambio" DECIMAL(12,4) NOT NULL DEFAULT 0,
    "totalARS" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "cobroUSD" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "cobroARS" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "descripcion" TEXT,
    "pendiente" BOOLEAN NOT NULL DEFAULT false,
    "mesContable" TEXT,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OperacionCambio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OperacionRulo" (
    "id" TEXT NOT NULL,
    "fecha" DATE NOT NULL,
    "descripcion" TEXT,
    "notas" TEXT,
    "detalles" JSONB NOT NULL,
    "mesContable" TEXT,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OperacionRulo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OperacionDivInt" (
    "id" TEXT NOT NULL,
    "fecha" DATE NOT NULL,
    "ticker" TEXT,
    "descripcion" TEXT,
    "detalles" JSONB NOT NULL,
    "mesContable" TEXT,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OperacionDivInt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OperacionLargoPlazo" (
    "id" TEXT NOT NULL,
    "fecha" DATE NOT NULL,
    "tipo" "TipoOperacionLP" NOT NULL,
    "ticker" TEXT,
    "descripcion" TEXT,
    "detalles" JSONB NOT NULL,
    "mesContable" TEXT,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OperacionLargoPlazo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TipoCambio" (
    "id" TEXT NOT NULL,
    "monedaOrigen" "Moneda" NOT NULL,
    "monedaDestino" "Moneda" NOT NULL,
    "valor" DECIMAL(12,4) NOT NULL,
    "fecha" DATE NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TipoCambio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Config" (
    "id" TEXT NOT NULL,
    "clave" TEXT NOT NULL,
    "valor" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Config_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MesContable" (
    "id" TEXT NOT NULL,
    "mes" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "cerradoAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MesContable_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HistorialMes" (
    "id" TEXT NOT NULL,
    "mes" TEXT NOT NULL,
    "datos" JSONB NOT NULL,
    "cerradoAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HistorialMes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SnapshotPatrimonio" (
    "id" TEXT NOT NULL,
    "fecha" DATE NOT NULL,
    "activo" DECIMAL(18,2) NOT NULL,
    "pasivo" DECIMAL(18,2) NOT NULL,
    "patrimonioNeto" DECIMAL(18,2) NOT NULL,
    "utilidad" DECIMAL(18,2),
    "tipoCambio" DECIMAL(12,4) NOT NULL,
    "detalle" JSONB,
    "tipo" "TipoSnapshot" NOT NULL DEFAULT 'MANUAL',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SnapshotPatrimonio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Propiedad" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Propiedad_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InversionInmobiliaria" (
    "id" TEXT NOT NULL,
    "propiedadId" TEXT NOT NULL,
    "fecha" DATE NOT NULL,
    "descripcion" TEXT NOT NULL,
    "tipo" "TipoInversionInmobiliaria" NOT NULL,
    "monto" DECIMAL(18,2) NOT NULL,
    "moneda" "Moneda" NOT NULL DEFAULT 'USD',
    "quien" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InversionInmobiliaria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SocioPorcentaje" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "porcentaje" DECIMAL(5,2) NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SocioPorcentaje_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Recordatorio" (
    "id" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "diaMes" INTEGER NOT NULL,
    "anticipo" INTEGER NOT NULL DEFAULT 3,
    "categoria" "CategoriaRecordatorio" NOT NULL,
    "moneda" "Moneda" NOT NULL DEFAULT 'USD',
    "monto" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "notas" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Recordatorio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Backup" (
    "id" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "version" TEXT,
    "tamano" INTEGER,
    "datos" JSONB,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Backup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "accion" TEXT NOT NULL,
    "entidad" TEXT NOT NULL,
    "entidadId" TEXT,
    "datosPrevios" JSONB,
    "datosNuevos" JSONB,
    "ip" VARCHAR(45),
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Nota" (
    "id" TEXT NOT NULL,
    "titulo" TEXT,
    "contenido" TEXT NOT NULL,
    "color" TEXT,
    "fijada" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Nota_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE INDEX "Permiso_modulo_idx" ON "Permiso"("modulo");

-- CreateIndex
CREATE UNIQUE INDEX "Permiso_modulo_accion_key" ON "Permiso"("modulo", "accion");

-- CreateIndex
CREATE INDEX "RolPermiso_role_idx" ON "RolPermiso"("role");

-- CreateIndex
CREATE UNIQUE INDEX "RolPermiso_role_permisoId_key" ON "RolPermiso"("role", "permisoId");

-- CreateIndex
CREATE INDEX "UserPermiso_userId_idx" ON "UserPermiso"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserPermiso_userId_permisoId_key" ON "UserPermiso"("userId", "permisoId");

-- CreateIndex
CREATE INDEX "Cliente_nombre_idx" ON "Cliente"("nombre");

-- CreateIndex
CREATE INDEX "Cliente_activo_idx" ON "Cliente"("activo");

-- CreateIndex
CREATE INDEX "CuentaCorriente_clienteId_idx" ON "CuentaCorriente"("clienteId");

-- CreateIndex
CREATE UNIQUE INDEX "CuentaCorriente_clienteId_moneda_key" ON "CuentaCorriente"("clienteId", "moneda");

-- CreateIndex
CREATE INDEX "MovimientoCC_cuentaCorrienteId_fecha_idx" ON "MovimientoCC"("cuentaCorrienteId", "fecha");

-- CreateIndex
CREATE INDEX "MovimientoCC_operacionCambioId_idx" ON "MovimientoCC"("operacionCambioId");

-- CreateIndex
CREATE INDEX "PlazoFijo_clienteId_idx" ON "PlazoFijo"("clienteId");

-- CreateIndex
CREATE INDEX "PlazoFijo_estado_idx" ON "PlazoFijo"("estado");

-- CreateIndex
CREATE INDEX "PlazoFijo_fechaVencimiento_idx" ON "PlazoFijo"("fechaVencimiento");

-- CreateIndex
CREATE UNIQUE INDEX "Caja_slug_key" ON "Caja"("slug");

-- CreateIndex
CREATE INDEX "MovimientoCaja_cajaId_fecha_idx" ON "MovimientoCaja"("cajaId", "fecha");

-- CreateIndex
CREATE INDEX "MovimientoCaja_cajaId_moneda_confirmado_idx" ON "MovimientoCaja"("cajaId", "moneda", "confirmado");

-- CreateIndex
CREATE INDEX "MovimientoCaja_operacionCambioId_idx" ON "MovimientoCaja"("operacionCambioId");

-- CreateIndex
CREATE UNIQUE INDEX "Activo_ticker_key" ON "Activo"("ticker");

-- CreateIndex
CREATE INDEX "Activo_categoria_idx" ON "Activo"("categoria");

-- CreateIndex
CREATE INDEX "Activo_ticker_idx" ON "Activo"("ticker");

-- CreateIndex
CREATE INDEX "PrecioHistorico_activoId_fecha_idx" ON "PrecioHistorico"("activoId", "fecha");

-- CreateIndex
CREATE UNIQUE INDEX "PrecioHistorico_activoId_fecha_key" ON "PrecioHistorico"("activoId", "fecha");

-- CreateIndex
CREATE UNIQUE INDEX "Cartera_nombre_key" ON "Cartera"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "Cartera_slug_key" ON "Cartera"("slug");

-- CreateIndex
CREATE INDEX "PosicionCartera_carteraId_idx" ON "PosicionCartera"("carteraId");

-- CreateIndex
CREATE INDEX "PosicionCartera_activoId_idx" ON "PosicionCartera"("activoId");

-- CreateIndex
CREATE UNIQUE INDEX "PosicionCartera_carteraId_activoId_key" ON "PosicionCartera"("carteraId", "activoId");

-- CreateIndex
CREATE INDEX "CustodiaCliente_clienteId_idx" ON "CustodiaCliente"("clienteId");

-- CreateIndex
CREATE INDEX "CustodiaCliente_activoId_idx" ON "CustodiaCliente"("activoId");

-- CreateIndex
CREATE UNIQUE INDEX "CustodiaCliente_clienteId_activoId_key" ON "CustodiaCliente"("clienteId", "activoId");

-- CreateIndex
CREATE INDEX "TransferenciaActivo_carteraOrigenId_idx" ON "TransferenciaActivo"("carteraOrigenId");

-- CreateIndex
CREATE INDEX "TransferenciaActivo_clienteDestinoId_idx" ON "TransferenciaActivo"("clienteDestinoId");

-- CreateIndex
CREATE INDEX "TransferenciaActivo_activoId_idx" ON "TransferenciaActivo"("activoId");

-- CreateIndex
CREATE INDEX "TransferenciaActivo_fecha_idx" ON "TransferenciaActivo"("fecha");

-- CreateIndex
CREATE INDEX "TransferenciaActivo_userId_idx" ON "TransferenciaActivo"("userId");

-- CreateIndex
CREATE INDEX "OperacionCambio_fecha_idx" ON "OperacionCambio"("fecha");

-- CreateIndex
CREATE INDEX "OperacionCambio_mesContable_idx" ON "OperacionCambio"("mesContable");

-- CreateIndex
CREATE INDEX "OperacionCambio_tipo_idx" ON "OperacionCambio"("tipo");

-- CreateIndex
CREATE INDEX "OperacionCambio_clienteId_idx" ON "OperacionCambio"("clienteId");

-- CreateIndex
CREATE INDEX "OperacionRulo_fecha_idx" ON "OperacionRulo"("fecha");

-- CreateIndex
CREATE INDEX "OperacionRulo_mesContable_idx" ON "OperacionRulo"("mesContable");

-- CreateIndex
CREATE INDEX "OperacionDivInt_fecha_idx" ON "OperacionDivInt"("fecha");

-- CreateIndex
CREATE INDEX "OperacionDivInt_mesContable_idx" ON "OperacionDivInt"("mesContable");

-- CreateIndex
CREATE INDEX "OperacionLargoPlazo_fecha_idx" ON "OperacionLargoPlazo"("fecha");

-- CreateIndex
CREATE INDEX "OperacionLargoPlazo_mesContable_idx" ON "OperacionLargoPlazo"("mesContable");

-- CreateIndex
CREATE INDEX "OperacionLargoPlazo_tipo_idx" ON "OperacionLargoPlazo"("tipo");

-- CreateIndex
CREATE INDEX "TipoCambio_monedaOrigen_monedaDestino_fecha_idx" ON "TipoCambio"("monedaOrigen", "monedaDestino", "fecha");

-- CreateIndex
CREATE UNIQUE INDEX "TipoCambio_monedaOrigen_monedaDestino_fecha_key" ON "TipoCambio"("monedaOrigen", "monedaDestino", "fecha");

-- CreateIndex
CREATE UNIQUE INDEX "Config_clave_key" ON "Config"("clave");

-- CreateIndex
CREATE UNIQUE INDEX "MesContable_mes_key" ON "MesContable"("mes");

-- CreateIndex
CREATE INDEX "MesContable_activo_idx" ON "MesContable"("activo");

-- CreateIndex
CREATE UNIQUE INDEX "HistorialMes_mes_key" ON "HistorialMes"("mes");

-- CreateIndex
CREATE INDEX "SnapshotPatrimonio_fecha_idx" ON "SnapshotPatrimonio"("fecha");

-- CreateIndex
CREATE INDEX "SnapshotPatrimonio_tipo_idx" ON "SnapshotPatrimonio"("tipo");

-- CreateIndex
CREATE UNIQUE INDEX "Propiedad_nombre_key" ON "Propiedad"("nombre");

-- CreateIndex
CREATE INDEX "InversionInmobiliaria_propiedadId_idx" ON "InversionInmobiliaria"("propiedadId");

-- CreateIndex
CREATE INDEX "InversionInmobiliaria_fecha_idx" ON "InversionInmobiliaria"("fecha");

-- CreateIndex
CREATE UNIQUE INDEX "SocioPorcentaje_nombre_key" ON "SocioPorcentaje"("nombre");

-- CreateIndex
CREATE INDEX "SocioPorcentaje_activo_idx" ON "SocioPorcentaje"("activo");

-- CreateIndex
CREATE INDEX "Backup_createdAt_idx" ON "Backup"("createdAt");

-- CreateIndex
CREATE INDEX "Backup_tipo_idx" ON "Backup"("tipo");

-- CreateIndex
CREATE INDEX "AuditLog_entidad_entidadId_idx" ON "AuditLog"("entidad", "entidadId");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_accion_idx" ON "AuditLog"("accion");

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolPermiso" ADD CONSTRAINT "RolPermiso_permisoId_fkey" FOREIGN KEY ("permisoId") REFERENCES "Permiso"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPermiso" ADD CONSTRAINT "UserPermiso_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPermiso" ADD CONSTRAINT "UserPermiso_permisoId_fkey" FOREIGN KEY ("permisoId") REFERENCES "Permiso"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CuentaCorriente" ADD CONSTRAINT "CuentaCorriente_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovimientoCC" ADD CONSTRAINT "MovimientoCC_cuentaCorrienteId_fkey" FOREIGN KEY ("cuentaCorrienteId") REFERENCES "CuentaCorriente"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlazoFijo" ADD CONSTRAINT "PlazoFijo_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovimientoCaja" ADD CONSTRAINT "MovimientoCaja_cajaId_fkey" FOREIGN KEY ("cajaId") REFERENCES "Caja"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrecioHistorico" ADD CONSTRAINT "PrecioHistorico_activoId_fkey" FOREIGN KEY ("activoId") REFERENCES "Activo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PosicionCartera" ADD CONSTRAINT "PosicionCartera_carteraId_fkey" FOREIGN KEY ("carteraId") REFERENCES "Cartera"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PosicionCartera" ADD CONSTRAINT "PosicionCartera_activoId_fkey" FOREIGN KEY ("activoId") REFERENCES "Activo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustodiaCliente" ADD CONSTRAINT "CustodiaCliente_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustodiaCliente" ADD CONSTRAINT "CustodiaCliente_activoId_fkey" FOREIGN KEY ("activoId") REFERENCES "Activo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransferenciaActivo" ADD CONSTRAINT "TransferenciaActivo_carteraOrigenId_fkey" FOREIGN KEY ("carteraOrigenId") REFERENCES "Cartera"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransferenciaActivo" ADD CONSTRAINT "TransferenciaActivo_custodiaDestinoId_fkey" FOREIGN KEY ("custodiaDestinoId") REFERENCES "CustodiaCliente"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransferenciaActivo" ADD CONSTRAINT "TransferenciaActivo_activoId_fkey" FOREIGN KEY ("activoId") REFERENCES "Activo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransferenciaActivo" ADD CONSTRAINT "TransferenciaActivo_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OperacionCambio" ADD CONSTRAINT "OperacionCambio_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InversionInmobiliaria" ADD CONSTRAINT "InversionInmobiliaria_propiedadId_fkey" FOREIGN KEY ("propiedadId") REFERENCES "Propiedad"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Backup" ADD CONSTRAINT "Backup_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
