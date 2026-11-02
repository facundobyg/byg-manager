// MACRO 2 — PATRIMONIO NETO canónico a una fecha de CORTE (función pura).
//
// ACTIVO
//   Cajas       : saldo inicial + movimientos CONFIRMADOS con fecha ≤ corte (4 monedas).
//                 Transferencias internas suman 0 entre cajas. Incluye cajas
//                 inactivas con saldo (se advierte): el dinero no desaparece.
//   Carteras    : posiciones (precio actual en su moneda) + cash
//                 (saldoPesos ARS, saldoUSDCable + saldoUSDMep USD).
//   Inmuebles   : base patrimonial = aportes (INGRESO/MEJORA) − retiros (EGRESO).
//                 RENTA e IMPUESTO son resultado, no base.
//   CC deudora  : clientes que deben a BYG (saldo neto del cliente < 0).
//   Pendientes  : a cobrar, por SALDO RESIDUAL (monto − pagos parciales confirmados).
// PASIVO
//   CC acreedora: clientes a los que BYG debe (saldo neto > 0).
//   PF          : obligación vigente (saldoActual = capital + interés devengado).
//   Pendientes  : a pagar, por saldo residual.
// EXCLUIDO SIEMPRE: custodia de clientes (se informa aparte).
//
// Consolidado USD: TC del CORTE (ventana ±31 días). CALIDAD (quality.ts):
//   TC aproximado → APPROXIMATE ; TC faltante → INCOMPLETE ;
//   posición sin precio de mercado → INCOMPLETE (no se usa 0 ni el costo) ;
//   corte pasado con Carteras/CC/PF (sin historial) → INCOMPLETE.
// INCOMPLETE ⇒ pnUSD/activoUSD/pasivoUSD = null; knownSubtotalUSD = lo valuable.

import { Decimal } from "@prisma/client/runtime/library";
import type { FinanceDataset } from "./dataset";
import { construirCalidad, type Calidad, type QualityReason } from "./quality";
import { TcBitacora } from "./tc";
import { D, MONEDAS, montosANumero, montosVacios, sumarMonto, sumarMontos, type Moneda, type Montos } from "./types";

export type ClaveComponente =
  | "cajas" | "carteras" | "inmuebles" | "ccDeudora" | "pendientesCobrar"
  | "ccAcreedora" | "pf" | "pendientesPagar";

export interface Componente {
  clave: ClaveComponente;
  lado: "ACTIVO" | "PASIVO";
  nativo: Record<Moneda, number>;
  /** null si el componente tiene algún importe no convertible o no valuable. */
  usd: number | null;
  /** Lo que sí se pudo convertir/valuar (diagnóstico). */
  usdConocido: number;
}

export interface PatrimonioNeto extends Calidad {
  corte: string;
  esCorteActual: boolean;
  componentes: Record<ClaveComponente, Componente>;
  porMoneda: Record<Moneda, number>;
  activoUSD: number | null;
  pasivoUSD: number | null;
  /** = totalUSD del contrato (null si INCOMPLETE). */
  pnUSD: number | null;
  detalle: {
    cajas: { id: string; label: string; activa: boolean; nativo: Record<Moneda, number>; usd: number | null }[];
    carteras: {
      id: string; nombre: string; activa: boolean;
      posicionesUSD: number | null; cashUSD: number | null; totalUSD: number | null; sinPrecio: number;
      posicionesNativo: Record<Moneda, number>; cashNativo: Record<Moneda, number>;
    }[];
    inmuebles: { id: string; nombre: string; activa: boolean; nativo: Record<Moneda, number>; usd: number | null }[];
    clientes: {
      id: string; nombre: string; ccNativo: Record<Moneda, number>; ccUSD: number | null;
      pfNativo: Record<Moneda, number>; pfUSD: number | null;
    }[];
    pendientes: {
      id: string; cajaId: string; lado: "COBRAR" | "PAGAR"; moneda: Moneda; fecha: string;
      montoOriginal: number; pagado: number; residual: number; residualUSD: number | null; descripcion: string | null;
    }[];
  };
  custodiaExcluidaUSD: number | null;
  tc: ReturnType<TcBitacora["resumen"]>;
  advertencias: string[];
}

export function calcularPatrimonioNeto(ds: FinanceDataset, corte: string = ds.hoy): PatrimonioNeto {
  const tc = new TcBitacora(ds.tc);
  const advertencias: string[] = [];
  const reasons: QualityReason[] = [];
  const esCorteActual = corte >= ds.hoy;

  /** Convierte montos nativos: usd (null si algún importe no convierte) y lo conocido. */
  const conv = (m: Montos): { usd: number | null; conocido: Decimal } => {
    let t = new Decimal(0);
    let completo = true;
    for (const k of MONEDAS) {
      if (m[k].isZero()) continue;
      const u = tc.aUSD(m[k], k, corte);
      if (u === null) { completo = false; continue; }
      t = t.plus(u);
    }
    return { usd: completo ? t.toNumber() : null, conocido: t };
  };
  const usdDe = (m: Montos) => conv(m).usd;

  const comp = {} as Record<ClaveComponente, Montos>;
  for (const k of ["cajas", "carteras", "inmuebles", "ccDeudora", "pendientesCobrar", "ccAcreedora", "pf", "pendientesPagar"] as const) {
    comp[k] = montosVacios();
  }
  /** Importes no valuables por componente (p. ej. posición sin precio). */
  const sinValuar = new Set<ClaveComponente>();
  // CC deudora/acreedora: el lado se decide por cliente en USD (conocido).
  let ccDeudoraUSD = new Decimal(0);
  let ccAcreedoraUSD = new Decimal(0);
  let ccSinTc = false;

  // ── Cajas ──
  const porCaja = new Map<string, Montos>();
  for (const c of ds.cajas) {
    const m = montosVacios();
    sumarMonto(m, "USD", c.saldoInicialUSD);
    sumarMonto(m, "ARS", c.saldoInicialARS);
    porCaja.set(c.id, m);
  }
  for (const mv of ds.movsCaja) {
    if (!mv.confirmado || mv.fecha > corte) continue;
    const m = porCaja.get(mv.cajaId);
    if (!m) { advertencias.push(`Movimiento ${mv.id} de caja inexistente ${mv.cajaId}`); continue; }
    const signo = mv.tipo === "ENTRADA" || mv.tipo === "TRANSFERENCIA_IN" ? 1 : -1;
    sumarMonto(m, mv.moneda, D(mv.monto).mul(signo));
  }
  const detCajas = ds.cajas.map((c) => {
    const m = porCaja.get(c.id)!;
    comp.cajas = sumarMontos(comp.cajas, m);
    if (!c.activa && MONEDAS.some((k) => !m[k].isZero())) advertencias.push(`Caja inactiva "${c.label}" con saldo: incluida en el PN`);
    return { id: c.id, label: c.label, activa: c.activa, nativo: montosANumero(m), usd: usdDe(m) };
  });

  // ── Pendientes (saldo residual) ──
  const pagadoPor = new Map<string, Decimal>();
  for (const mv of ds.movsCaja) {
    if (!mv.pagoDeId || !mv.confirmado || mv.anulado || mv.fecha > corte) continue;
    pagadoPor.set(mv.pagoDeId, (pagadoPor.get(mv.pagoDeId) ?? new Decimal(0)).plus(D(mv.monto)));
  }
  const detPendientes: PatrimonioNeto["detalle"]["pendientes"] = [];
  for (const mv of ds.movsCaja) {
    if (mv.confirmado || mv.anulado || mv.fecha > corte) continue;
    if (mv.tipo !== "ENTRADA" && mv.tipo !== "SALIDA") continue;
    const pagado = pagadoPor.get(mv.id) ?? new Decimal(0);
    const residual = Decimal.max(D(mv.monto).minus(pagado), 0);
    const lado = mv.tipo === "ENTRADA" ? "COBRAR" : "PAGAR";
    if (!residual.isZero()) sumarMonto(lado === "COBRAR" ? comp.pendientesCobrar : comp.pendientesPagar, mv.moneda, residual);
    const r = residual.isZero() ? new Decimal(0) : tc.aUSD(residual, mv.moneda, corte);
    detPendientes.push({
      id: mv.id, cajaId: mv.cajaId, lado, moneda: mv.moneda, fecha: mv.fecha,
      montoOriginal: D(mv.monto).toNumber(), pagado: pagado.toNumber(), residual: residual.toNumber(),
      residualUSD: r === null ? null : r.toNumber(), descripcion: mv.descripcion,
    });
  }

  // ── Carteras propias (posiciones + cash) ──
  const detCarteras = ds.carteras.map((c) => {
    const pos = montosVacios();
    let sinPrecio = 0;
    for (const p of c.posiciones) {
      if (p.precioActual == null) {
        // Sin precio de mercado: no se valúa (ni a 0 ni a costo).
        if (!D(p.cantidad).isZero()) {
          sinPrecio++;
          reasons.push({ code: "MISSING_MARKET_PRICE", severity: "INCOMPLETE", detail: `${c.nombre}/${p.ticker}: sin precio de mercado` });
        }
        continue;
      }
      sumarMonto(pos, p.monedaPrecio, D(p.cantidad).mul(D(p.precioActual)));
    }
    if (sinPrecio > 0) sinValuar.add("carteras");
    const cash = montosVacios();
    sumarMonto(cash, "ARS", c.saldoPesos);
    sumarMonto(cash, "USD", D(c.saldoUSDCable).plus(D(c.saldoUSDMep)));
    const total = sumarMontos(pos, cash);
    comp.carteras = sumarMontos(comp.carteras, total);
    if (!c.activa && MONEDAS.some((k) => !total[k].isZero())) advertencias.push(`Cartera inactiva "${c.nombre}" con valor: incluida en el PN`);
    const totalUSD = usdDe(total);
    return {
      id: c.id, nombre: c.nombre, activa: c.activa, sinPrecio,
      posicionesUSD: sinPrecio > 0 ? null : usdDe(pos), cashUSD: usdDe(cash), totalUSD: sinPrecio > 0 ? null : totalUSD,
      posicionesNativo: montosANumero(pos), cashNativo: montosANumero(cash),
    };
  });

  // ── Inmuebles (base patrimonial) ──
  const basePorProp = new Map<string, Montos>();
  for (const m of ds.inmuebles) {
    if (m.fecha > corte) continue;
    const signo = m.tipo === "INGRESO" || m.tipo === "MEJORA" ? 1 : m.tipo === "EGRESO" ? -1 : 0;
    if (signo === 0) continue;
    const b = basePorProp.get(m.propiedadId) ?? montosVacios();
    sumarMonto(b, m.moneda, D(m.monto).abs().mul(signo));
    basePorProp.set(m.propiedadId, b);
  }
  const detInmuebles = ds.propiedades.map((p) => {
    const b = basePorProp.get(p.id) ?? montosVacios();
    comp.inmuebles = sumarMontos(comp.inmuebles, b);
    if (!p.activa && MONEDAS.some((k) => !b[k].isZero())) advertencias.push(`Propiedad inactiva "${p.nombre}" con base: incluida en el PN`);
    return { id: p.id, nombre: p.nombre, activa: p.activa, nativo: montosANumero(b), usd: usdDe(b) };
  });

  // ── Clientes: CC (neto por cliente) y PF (obligación vigente) ──
  const detClientes = ds.clientes.map((cl) => {
    const cc = montosVacios();
    for (const c of cl.cc) sumarMonto(cc, c.moneda, c.saldo);
    const pf = montosVacios();
    for (const p of cl.pf) {
      if (p.estado !== "ACTIVO") continue;
      sumarMonto(pf, p.moneda, p.saldoActual);
    }
    const ccUSD = usdDe(cc);
    if (ccUSD === null) ccSinTc = true;
    else if (ccUSD > 0) { ccAcreedoraUSD = ccAcreedoraUSD.plus(ccUSD); comp.ccAcreedora = sumarMontos(comp.ccAcreedora, cc); }
    else if (ccUSD < 0) { ccDeudoraUSD = ccDeudoraUSD.plus(-ccUSD); comp.ccDeudora = sumarMontos(comp.ccDeudora, cc, -1); }
    comp.pf = sumarMontos(comp.pf, pf);
    return { id: cl.id, nombre: cl.nombre, ccNativo: montosANumero(cc), ccUSD, pfNativo: montosANumero(pf), pfUSD: usdDe(pf) };
  });

  // Consistencia PF: saldoActual debería = capital + Σ movimientos (INGRESO − EGRESO + INTERES).
  const movsPorPf = new Map<string, Decimal>();
  for (const m of ds.pfMovs) {
    const s = m.tipo === "EGRESO" ? -1 : 1;
    movsPorPf.set(m.plazoFijoId, (movsPorPf.get(m.plazoFijoId) ?? new Decimal(0)).plus(D(m.monto).mul(s)));
  }
  for (const cl of ds.clientes) for (const p of cl.pf) {
    if (p.estado !== "ACTIVO") continue;
    const esperado = D(p.capital).plus(movsPorPf.get(p.id) ?? 0);
    const dif = D(p.saldoActual).minus(esperado);
    if (dif.abs().gt(0.01)) {
      advertencias.push(`PF ${p.id}: saldoActual difiere en ${dif.toFixed(2)} ${p.moneda} de capital + movimientos (interés devengado sin fecha: no entra en el resultado mensual)`);
    }
  }

  // Corte pasado: Carteras / CC / PF solo existen en su estado actual.
  if (!esCorteActual) {
    const sinHistoria = (["carteras", "ccDeudora", "ccAcreedora", "pf"] as const)
      .filter((k) => MONEDAS.some((m) => !comp[k][m].isZero()));
    if (sinHistoria.length > 0) {
      reasons.push({
        code: "HISTORICAL_STATE_UNAVAILABLE", severity: "INCOMPLETE",
        detail: `Corte ${corte} anterior a hoy: ${sinHistoria.join(", ")} sin historial (solo estado actual)`,
      });
    }
  }

  // ── Custodia (excluida) ──
  const cust = montosVacios();
  for (const c of ds.custodia) {
    const precio = c.precioActual != null ? D(c.precioActual) : D(c.precioPromedio);
    sumarMonto(cust, c.monedaPrecio, D(c.cantidadTotal).mul(precio));
  }
  // Bitácora propia: la custodia no forma parte del PN y no debe afectar su calidad.
  const tcCust = new TcBitacora(ds.tc);
  let custUSD: Decimal | null = new Decimal(0);
  for (const k of MONEDAS) {
    if (cust[k].isZero() || custUSD === null) continue;
    const u = tcCust.aUSD(cust[k], k, corte);
    custUSD = u === null ? null : custUSD.plus(u);
  }
  const custodiaExcluidaUSD = custUSD === null ? null : custUSD.toNumber();

  // ── Totales ──
  const componentes = {} as Record<ClaveComponente, Componente>;
  const lado: Record<ClaveComponente, "ACTIVO" | "PASIVO"> = {
    cajas: "ACTIVO", carteras: "ACTIVO", inmuebles: "ACTIVO", ccDeudora: "ACTIVO", pendientesCobrar: "ACTIVO",
    ccAcreedora: "PASIVO", pf: "PASIVO", pendientesPagar: "PASIVO",
  };
  let activoConocido = new Decimal(0);
  let pasivoConocido = new Decimal(0);
  for (const k of Object.keys(comp) as ClaveComponente[]) {
    const esCC = k === "ccDeudora" || k === "ccAcreedora";
    const c = esCC
      ? { usd: ccSinTc ? null : (k === "ccDeudora" ? ccDeudoraUSD : ccAcreedoraUSD).toNumber(), conocido: k === "ccDeudora" ? ccDeudoraUSD : ccAcreedoraUSD }
      : conv(comp[k]);
    const usd = sinValuar.has(k) ? null : c.usd;
    componentes[k] = { clave: k, lado: lado[k], nativo: montosANumero(comp[k]), usd, usdConocido: c.conocido.toNumber() };
    if (lado[k] === "ACTIVO") activoConocido = activoConocido.plus(c.conocido);
    else pasivoConocido = pasivoConocido.plus(c.conocido);
  }
  const porMoneda = montosVacios();
  for (const c of Object.values(componentes)) {
    for (const k of MONEDAS) sumarMonto(porMoneda, k, D(c.nativo[k]).mul(c.lado === "ACTIVO" ? 1 : -1));
  }

  reasons.push(...tc.motivos());
  const calidad = construirCalidad(activoConocido.minus(pasivoConocido).toNumber(), reasons);
  const completo = calidad.totalUSD !== null;

  return {
    ...calidad,
    corte, esCorteActual, componentes,
    porMoneda: montosANumero(porMoneda),
    activoUSD: completo ? activoConocido.toNumber() : null,
    pasivoUSD: completo ? pasivoConocido.toNumber() : null,
    pnUSD: calidad.totalUSD,
    detalle: { cajas: detCajas, carteras: detCarteras, inmuebles: detInmuebles, clientes: detClientes, pendientes: detPendientes },
    custodiaExcluidaUSD,
    tc: tc.resumen(),
    advertencias,
  };
}
