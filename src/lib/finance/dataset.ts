// MACRO 2 — Datos crudos que consume el motor (sin Prisma: el loader en
// load.ts los arma desde la DB y los tests los arman a mano). Fechas como
// "YYYY-MM-DD"; montos como Decimal.Value.

import type { Decimal } from "@prisma/client/runtime/library";
import type { FxBaseApertura, MonedaFx } from "./fx-cost-basis";
import type { TcResolver } from "./tc";
import type { Moneda } from "./types";

type V = Decimal.Value;

export interface DsCaja { id: string; label: string; activa: boolean; saldoInicialUSD: V; saldoInicialARS: V }

export interface DsMovCaja {
  id: string; cajaId: string; fecha: string; createdAt: string;
  tipo: "ENTRADA" | "SALIDA" | "TRANSFERENCIA_IN" | "TRANSFERENCIA_OUT";
  moneda: Moneda; monto: V; descripcion: string | null;
  confirmado: boolean; anulado: boolean;
  pagoDeId: string | null; operacionCambioId: string | null;
}

export interface DsOpCambio {
  id: string; fecha: string; createdAt: string; tipo: string; moneda: Moneda;
  cantidad: V; totalARS: V; cobroUSD: V; descripcion: string | null; pendiente: boolean;
}

export interface DsOpBolsa {
  id: string; tipoOperacion: string; ticker: string; cantidad: V; precio: V; moneda: Moneda;
  estado: string; anulada: boolean; grupoArbitrajeId: string | null; carteraId: string | null;
  comitenteId: string | null; fechaOperativa: string | null; createdAt: string;
  netoLiquidado: V | null; costoReal: V | null;
}

export interface DsCostoCartera { operacionId: string; costoUnitario: V }

export interface DsMovCC { id: string; fecha: string; tipo: string; monto: V; moneda: Moneda; clienteId: string; descripcion: string | null }

/**
 * Reversas REALES de movimientos CC (las dos formas estructuradas que escribe el sistema):
 *   - grupal  (revertirOperacion):   "REVERSO INTERES | op:<nuevo> | ref:<operationRef original>"
 *   - individual (revertirMovimientoCC): "[REVERSO por X] … | movref:<id original>"
 */
export interface DsMovCCReversa { id: string; fecha: string; descripcion: string }

export interface DsPfMov { id: string; plazoFijoId: string; fecha: string; tipo: string; monto: V; moneda: Moneda }

export interface DsInmueble { id: string; propiedadId: string; fecha: string; tipo: string; monto: V; moneda: Moneda }
export interface DsPropiedad { id: string; nombre: string; activa: boolean }

export interface DsPosicion { ticker: string; cantidad: V; precioCompra: V; precioActual: V | null; monedaPrecio: Moneda }
export interface DsCartera {
  id: string; nombre: string; activa: boolean;
  saldoPesos: V; saldoUSDCable: V; saldoUSDMep: V; posiciones: DsPosicion[];
}

export interface DsCliente {
  id: string; nombre: string; activo: boolean;
  cc: { id: string; moneda: Moneda; saldo: V }[];
  pf: { id: string; moneda: Moneda; capital: V; saldoActual: V; estado: string }[];
}

export interface DsCustodia { cantidadTotal: V; precioPromedio: V; precioActual: V | null; monedaPrecio: Moneda }

/** Registros de Rulo / Div-Int / Largo Plazo (detalles JSON por cuenta operativa). */
export interface DsRegistroCuenta {
  id: string; origen: "RULO" | "DIVINT" | "LP"; fecha: string; cuenta: string | null;
  usd: V; ars: V;
}

export interface FinanceDataset {
  hoy: string;
  cajas: DsCaja[];
  movsCaja: DsMovCaja[];
  opsCambio: DsOpCambio[];
  opsBolsa: DsOpBolsa[];
  costosCartera: DsCostoCartera[];
  movsCCInteres: DsMovCC[];
  movsCCReversas: DsMovCCReversa[];
  pfMovs: DsPfMov[];
  inmuebles: DsInmueble[];
  propiedades: DsPropiedad[];
  carteras: DsCartera[];
  clientes: DsCliente[];
  custodia: DsCustodia[];
  registrosCuenta: DsRegistroCuenta[];
  fxApertura: Partial<Record<MonedaFx, FxBaseApertura>>;
  tc: TcResolver;
}
