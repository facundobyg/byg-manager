// Constructores de datasets en memoria para los tests del motor financiero.
import type { DsCaja, DsMovCaja, DsOpBolsa, DsOpCambio, FinanceDataset } from "./dataset";
import { TcResolver, type TcPunto } from "./tc";
import { D, type Moneda } from "./types";

let seq = 0;
export const nid = (p: string) => `${p}-${++seq}`;

/** TC diario (mismo valor) entre dos fechas inclusive: cobertura completa para tests. */
export function tcDiario(ars: number, desde = "2025-12-01", hasta = "2027-01-31", extra: TcPunto[] = []): TcResolver {
  const puntos: TcPunto[] = [];
  for (let d = new Date(`${desde}T00:00:00Z`); d.toISOString().slice(0, 10) <= hasta; d.setUTCDate(d.getUTCDate() + 1)) {
    puntos.push({ moneda: "ARS", fecha: d.toISOString().slice(0, 10), usdPorUnidad: D(1).div(ars), fuente: "test" });
  }
  return new TcResolver([...puntos, ...extra]);
}

/** TC: ARS por USD por fecha. EUR/BRL opcionales en USD por unidad. */
export function tcSerie(ars: Record<string, number>, extra: TcPunto[] = []): TcResolver {
  const puntos: TcPunto[] = Object.entries(ars).map(([fecha, v]) => ({ moneda: "ARS", fecha, usdPorUnidad: D(1).div(v), fuente: "test" }));
  return new TcResolver([...puntos, ...extra]);
}

export function caja(p: Partial<DsCaja> = {}): DsCaja {
  return { id: p.id ?? "oficina", label: p.label ?? "Oficina", activa: p.activa ?? true, saldoInicialUSD: p.saldoInicialUSD ?? 0, saldoInicialARS: p.saldoInicialARS ?? 0 };
}

export function mov(p: Partial<DsMovCaja> & { monto: number; moneda: Moneda; tipo: DsMovCaja["tipo"]; fecha: string }): DsMovCaja {
  return {
    id: p.id ?? nid("mov"), cajaId: p.cajaId ?? "oficina", createdAt: p.createdAt ?? `${p.fecha}T12:00:00.000Z`,
    descripcion: p.descripcion ?? null, confirmado: p.confirmado ?? true, anulado: p.anulado ?? false,
    pagoDeId: p.pagoDeId ?? null, operacionCambioId: p.operacionCambioId ?? null,
    fecha: p.fecha, tipo: p.tipo, moneda: p.moneda, monto: p.monto,
  };
}

export const ro = (sub: string, p: Parameters<typeof mov>[0]) => mov({ ...p, descripcion: `[RESULTADO_OPERATIVO:${sub}] ${p.descripcion ?? "x"}` });

export function opCambio(p: Partial<DsOpCambio> & { tipo: string; fecha: string }): DsOpCambio {
  return {
    id: p.id ?? nid("op"), fecha: p.fecha, createdAt: p.createdAt ?? `${p.fecha}T12:00:00.000Z`, tipo: p.tipo,
    moneda: p.moneda ?? "USD", cantidad: p.cantidad ?? 0, totalARS: p.totalARS ?? 0, cobroUSD: p.cobroUSD ?? 0,
    descripcion: p.descripcion ?? null, pendiente: p.pendiente ?? false,
  };
}

export function opBolsa(p: Partial<DsOpBolsa> & { tipoOperacion: string; cantidad: number; precio: number }): DsOpBolsa {
  return {
    id: p.id ?? nid("bolsa"), ticker: p.ticker ?? "AL30", moneda: p.moneda ?? "ARS", estado: p.estado ?? "CONCERTADA",
    anulada: p.anulada ?? false, grupoArbitrajeId: p.grupoArbitrajeId ?? null, carteraId: p.carteraId ?? null,
    comitenteId: p.comitenteId ?? null, fechaOperativa: p.fechaOperativa ?? "2026-04-10", createdAt: p.createdAt ?? "2026-04-10",
    netoLiquidado: p.netoLiquidado ?? null, costoReal: p.costoReal ?? null,
    tipoOperacion: p.tipoOperacion, cantidad: p.cantidad, precio: p.precio,
  };
}

export function dataset(p: Partial<FinanceDataset> = {}): FinanceDataset {
  return {
    hoy: p.hoy ?? "2026-10-30",
    cajas: p.cajas ?? [caja()],
    movsCaja: p.movsCaja ?? [],
    opsCambio: p.opsCambio ?? [],
    opsBolsa: p.opsBolsa ?? [],
    costosCartera: p.costosCartera ?? [],
    movsCCInteres: p.movsCCInteres ?? [],
    movsCCReversas: p.movsCCReversas ?? [],
    pfMovs: p.pfMovs ?? [],
    inmuebles: p.inmuebles ?? [],
    propiedades: p.propiedades ?? [],
    carteras: p.carteras ?? [],
    clientes: p.clientes ?? [],
    custodia: p.custodia ?? [],
    registrosCuenta: p.registrosCuenta ?? [],
    fxApertura: p.fxApertura ?? {},
    tc: p.tc ?? tcDiario(1000),
  };
}
