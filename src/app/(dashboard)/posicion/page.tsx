import type { ReactNode } from "react";
import { getCajasWithBalances } from "@/lib/data/caja";
import { getResultadoCambioMensual } from "@/lib/data/mov-diarios";
import { calcExposicionCambiaria } from "@/lib/data/exposicion-cambiaria";
import { prisma } from "@/lib/prisma";

// ─── Helpers ────────────────────────────────────────────────────────────────

function fmt(n: number, dec = 2) {
  return n.toLocaleString("es-AR", { minimumFractionDigits: dec, maximumFractionDigits: dec });
}

function Kpi({
  label, value, sub, color = "text-byg-text",
}: {
  label: string; value: string; sub?: string; color?: string;
}) {
  return (
    <div className="bg-byg-surface rounded-2xl border border-byg-border p-5 flex flex-col gap-1">
      <p className="text-[10px] font-black uppercase tracking-widest text-byg-muted">{label}</p>
      <p className={`text-2xl font-black tabular-nums font-mono tracking-tight ${color}`}>{value}</p>
      {sub && <p className="text-[10px] text-byg-muted font-medium">{sub}</p>}
    </div>
  );
}

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-byg-muted">{children}</h2>
  );
}

function FinTable({ headers, children }: { headers: string[]; children: ReactNode }) {
  return (
    <div className="rounded-xl border border-byg-border overflow-hidden">
      <table className="w-full text-xs">
        <thead>
          <tr className="bg-byg-bg border-b border-byg-border">
            {headers.map((h, i) => (
              <th
                key={i}
                className={`px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-byg-muted ${i === 0 ? "text-left" : "text-right"}`}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

function Tr({ cells, subtotal }: { cells: ReactNode[]; subtotal?: boolean }) {
  return (
    <tr className={`border-b border-byg-border/40 last:border-0 ${subtotal ? "bg-byg-bg" : "bg-byg-surface hover:bg-byg-surface-2"}`}>
      {cells.map((cell, i) => (
        <td
          key={i}
          className={`px-4 py-2.5 ${i === 0 ? "text-left text-byg-text" : "text-right tabular-nums font-mono text-byg-muted"} ${subtotal ? "font-black text-byg-text" : "font-medium"}`}
        >
          {cell}
        </td>
      ))}
    </tr>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="text-xs text-byg-muted italic py-5 text-center">{text}</p>;
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default async function PosicionPage() {
  const [cajas, clientes, carteras, propiedades, tcConfig, movPendientes, mesActivo, todaCustodia] =
    await Promise.all([
      getCajasWithBalances(),
      prisma.cliente.findMany({
        where: { activo: true },
        orderBy: { nombre: "asc" },
        include: {
          CuentaCorriente: true,
          PlazoFijo: { where: { estado: "ACTIVO" } },
        },
      }),
      prisma.cartera.findMany({
        where: { activa: true },
        orderBy: { orden: "asc" },
        include: {
          PosicionCartera: {
            include: {
              Activo: { select: { ticker: true, precioActual: true, monedaPrecio: true } },
            },
          },
        },
      }),
      prisma.propiedad.findMany({
        where: { activa: true },
        orderBy: { nombre: "asc" },
        include: { InversionInmobiliaria: true },
      }),
      prisma.config.findUnique({ where: { clave: "tc_blue" } }),
      prisma.movimientoCaja.findMany({
        where: { confirmado: false, tipo: { in: ["ENTRADA", "SALIDA"] as never[] } },
        include: { Caja: { select: { label: true } } },
        orderBy: { fecha: "desc" },
      }),
      prisma.mesContable.findFirst({ where: { activo: true } }),
      prisma.custodiaCliente.findMany({
        include: { Activo: { select: { precioActual: true, monedaPrecio: true } } },
      }),
    ]);

  const tcBlue = Number(tcConfig?.valor ?? "1000");
  const arsToUSD = (ars: number) => ars / tcBlue;

  // Utilidad del mes (best-effort)
  let utilidadMes: number | null = null;
  if (mesActivo) {
    try {
      const r = await getResultadoCambioMensual(mesActivo.mes);
      utilidadMes = r.totalUSD;
    } catch {
      // omit gracefully
    }
  }

  // ── Cajas ──────────────────────────────────────────────────────────────────
  const cajasRows = cajas.map((c) => {
    const usd = Number(c.saldoActualUSD);
    const ars = Number(c.saldoActualARS);
    return { label: c.label, usd, ars, totalUSD: usd + arsToUSD(ars) };
  });
  const cajaTotalUSD = cajasRows.reduce((s, c) => s + c.totalUSD, 0);

  // ── Carteras ───────────────────────────────────────────────────────────────
  const carterasRows = carteras.map((c) => {
    let posValUSD = 0;
    let sinPrecio = 0;
    for (const pos of c.PosicionCartera) {
      if (pos.Activo.precioActual != null) {
        const precioUSD =
          pos.Activo.monedaPrecio === "ARS"
            ? Number(pos.Activo.precioActual) / tcBlue
            : Number(pos.Activo.precioActual);
        posValUSD += Number(pos.cantidad) * precioUSD;
      } else {
        sinPrecio++;
      }
    }
    const cashUSD =
      Number(c.saldoUSDCable) + Number(c.saldoUSDMep) + arsToUSD(Number(c.saldoPesos));
    return { nombre: c.nombre, posValUSD, cashUSD, total: posValUSD + cashUSD, sinPrecio };
  });
  const carteraTotalUSD = carterasRows.reduce((s, c) => s + c.total, 0);

  // ── Inmobiliarias ──────────────────────────────────────────────────────────
  const propiedadesRows = propiedades.map((p) => {
    let netUSD = 0;
    let netARS = 0;
    for (const m of p.InversionInmobiliaria) {
      if (m.tipo === "RENTA") continue; // rental income, not capital
      const sign = m.tipo === "INGRESO" || m.tipo === "MEJORA" ? 1 : -1;
      if (m.moneda === "USD") netUSD += sign * Number(m.monto);
      else if (m.moneda === "ARS") netARS += sign * Number(m.monto);
    }
    return { nombre: p.nombre, netUSD, netARS, totalUSD: netUSD + arsToUSD(netARS) };
  });
  const propiedadTotalUSD = propiedadesRows.reduce((s, p) => s + p.totalUSD, 0);

  // ── Clientes CC & PF ───────────────────────────────────────────────────────
  const clientesData = clientes.map((c) => {
    let ccUSD = 0;
    let ccARS = 0;
    for (const cc of c.CuentaCorriente) {
      const s = Number(cc.saldo);
      if (cc.moneda === "USD") ccUSD += s;
      else if (cc.moneda === "ARS") ccARS += s;
    }
    const ccTotalUSD = ccUSD + arsToUSD(ccARS);
    let pfUSD = 0;
    let pfARS = 0;
    for (const pf of c.PlazoFijo) {
      const m = Number(pf.saldoActual);
      if (pf.moneda === "USD") pfUSD += m;
      else if (pf.moneda === "ARS") pfARS += m;
    }
    const pfCap = pfUSD + arsToUSD(pfARS);
    return { id: c.id, nombre: c.nombre, ccUSD, ccARS, ccTotalUSD, pfCap, pfUSD, pfARS };
  });

  // positive CC = BYG owes client → Pasivo
  const pasivoCCTotalUSD = clientesData.reduce((s, c) => s + Math.max(0, c.ccTotalUSD), 0);
  // negative CC = client owes BYG → Activo
  const activoCCTotalUSD = clientesData.reduce((s, c) => s + Math.max(0, -c.ccTotalUSD), 0);
  const pasivoPFTotalUSD = clientesData.reduce((s, c) => s + c.pfCap, 0);

  // ── Movimientos pendientes ─────────────────────────────────────────────────
  const pendingRec = movPendientes.filter((m) => m.tipo === "ENTRADA");
  const pendingPay = movPendientes.filter((m) => m.tipo === "SALIDA");

  const pendingRecTotalUSD = pendingRec.reduce((s, m) => {
    const n = Number(m.monto);
    return s + (m.moneda === "ARS" ? arsToUSD(n) : n);
  }, 0);
  const pendingPayTotalUSD = pendingPay.reduce((s, m) => {
    const n = Number(m.monto);
    return s + (m.moneda === "ARS" ? arsToUSD(n) : n);
  }, 0);

  // Currency split for compact display
  const pendingRecUSD = pendingRec.reduce((s, m) => m.moneda === "USD" ? s + Number(m.monto) : s, 0);
  const pendingRecARS = pendingRec.reduce((s, m) => m.moneda === "ARS" ? s + Number(m.monto) : s, 0);
  const pendingPayUSD = pendingPay.reduce((s, m) => m.moneda === "USD" ? s + Number(m.monto) : s, 0);
  const pendingPayARS = pendingPay.reduce((s, m) => m.moneda === "ARS" ? s + Number(m.monto) : s, 0);

  // ── Custodia clientes (SOLO informativo — NUNCA suma al activo) ───────────
  const custodiaValorUSD = todaCustodia.reduce((s, c) => {
    const pa = c.Activo.precioActual;
    if (!pa) return s;
    const precioUSD = c.Activo.monedaPrecio === "ARS" ? Number(pa) / tcBlue : Number(pa);
    return s + Number(c.cantidadTotal) * precioUSD;
  }, 0);

  // ── Balance ────────────────────────────────────────────────────────────────
  const activoTotal =
    cajaTotalUSD + carteraTotalUSD + propiedadTotalUSD + activoCCTotalUSD + pendingRecTotalUSD;
  const pasivoTotal = pasivoCCTotalUSD + pasivoPFTotalUSD + pendingPayTotalUSD;
  const patrimonioNeto = activoTotal - pasivoTotal;

  // ── Exposición Cambiaria ───────────────────────────────────────────────────
  const cajaUSD = cajasRows.reduce((s, c) => s + c.usd, 0);
  const cajaARS = cajasRows.reduce((s, c) => s + c.ars, 0);

  let carteraUSDDirecto = 0;
  let carteraARSDirecto = 0;
  for (const c of carteras) {
    carteraUSDDirecto += Number(c.saldoUSDCable) + Number(c.saldoUSDMep);
    carteraARSDirecto += Number(c.saldoPesos);
    for (const pos of c.PosicionCartera) {
      if (pos.Activo.precioActual == null) continue;
      const valor = Number(pos.cantidad) * Number(pos.Activo.precioActual);
      if (pos.Activo.monedaPrecio === "ARS") carteraARSDirecto += valor;
      else carteraUSDDirecto += valor;
    }
  }

  const pasivoCCUSD  = clientesData.reduce((s, c) => s + Math.max(0,  c.ccUSD), 0);
  const pasivoCCARS  = clientesData.reduce((s, c) => s + Math.max(0,  c.ccARS), 0);
  const activoCCUSD  = clientesData.reduce((s, c) => s + Math.max(0, -c.ccUSD), 0);
  const activoCCARS  = clientesData.reduce((s, c) => s + Math.max(0, -c.ccARS), 0);
  const pasivoPFUSD  = clientesData.reduce((s, c) => s + c.pfUSD, 0);
  const pasivoPFARS  = clientesData.reduce((s, c) => s + c.pfARS, 0);

  const exposicion = calcExposicionCambiaria({
    cajaUSD, cajaARS,
    carteraUSDDirecto, carteraARSDirecto,
    activoCCUSD, activoCCARS,
    pasivoCCUSD, pasivoCCARS,
    pasivoPFUSD, pasivoPFARS,
    tcBlue,
  });

  const clientesPasivo = clientesData
    .filter((c) => Math.max(0, c.ccTotalUSD) > 0 || c.pfCap > 0)
    .sort(
      (a, b) =>
        b.pfCap + Math.max(0, b.ccTotalUSD) - (a.pfCap + Math.max(0, a.ccTotalUSD)),
    );

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <header>
        <p className="text-[10px] font-black text-byg-accent uppercase tracking-[0.3em]">General</p>
        <h1 className="text-4xl font-black text-byg-text tracking-tight">Posición</h1>
        <p className="text-sm text-byg-muted font-medium mt-1">
          Balance patrimonial · TC Blue ${fmt(tcBlue, 0)} ARS/USD
        </p>
      </header>

      {/* KPI row 1 */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Kpi label="Activo Total" value={`USD ${fmt(activoTotal)}`} color="text-emerald-400" />
        <Kpi label="Pasivo Total" value={`USD ${fmt(pasivoTotal)}`} color="text-red-400" />
        <Kpi
          label="Patrimonio Neto"
          value={`USD ${fmt(patrimonioNeto)}`}
          color={patrimonioNeto >= 0 ? "text-byg-accent" : "text-red-400"}
        />
        {utilidadMes != null ? (
          <Kpi
            label="Utilidad del Mes"
            value={`USD ${fmt(utilidadMes)}`}
            sub={mesActivo?.mes}
            color={utilidadMes >= 0 ? "text-emerald-400" : "text-red-400"}
          />
        ) : (
          <Kpi label="Utilidad del Mes" value="—" sub="Sin mes activo" />
        )}
        <Kpi label="TC Blue" value={`$ ${fmt(tcBlue, 0)}`} sub="ARS/USD configurado" />
      </div>

      {/* KPI row 2 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi
          label="Valor Carteras"
          value={`USD ${fmt(carteraTotalUSD)}`}
          sub={`${carteras.length} cartera${carteras.length !== 1 ? "s" : ""} activa${carteras.length !== 1 ? "s" : ""}`}
        />
        <Kpi
          label="Total Cajas"
          value={`USD ${fmt(cajaTotalUSD)}`}
          sub={`${cajas.length} caja${cajas.length !== 1 ? "s" : ""}`}
        />
        <Kpi
          label="Pasivo Clientes"
          value={`USD ${fmt(pasivoCCTotalUSD + pasivoPFTotalUSD)}`}
          sub={`CC ${fmt(pasivoCCTotalUSD)} · PF ${fmt(pasivoPFTotalUSD)}`}
          color={(pasivoCCTotalUSD + pasivoPFTotalUSD) > 0 ? "text-red-400" : "text-byg-text"}
        />
        <div className="bg-byg-surface rounded-2xl border border-byg-border border-l-[5px] border-l-amber-400 p-5 flex flex-col gap-1">
          <p className="text-[10px] font-black uppercase tracking-widest text-amber-500">Custodia Clientes</p>
          <p className="text-2xl font-black tabular-nums font-mono tracking-tight text-amber-400">
            {`USD ${fmt(custodiaValorUSD)}`}
          </p>
          <p className="text-[10px] text-amber-500/70 font-medium">
            {todaCustodia.length} pos. · solo informativo
          </p>
        </div>
      </div>

      {/* Main two-column balance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* ── ACTIVO ── */}
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-2">
            <div className="w-1 h-5 bg-emerald-500 rounded-full" />
            <h2 className="text-sm font-black text-emerald-400 uppercase tracking-widest font-mono">
              Activo · USD {fmt(activoTotal)}
            </h2>
          </div>

          {/* Cajas físicas */}
          <div className="flex flex-col gap-2">
            <SectionTitle>Cajas físicas · USD {fmt(cajaTotalUSD)}</SectionTitle>
            {cajasRows.length === 0 ? (
              <Empty text="Sin cajas activas" />
            ) : (
              <FinTable headers={["Caja", "USD", "ARS", "Est. USD"]}>
                {cajasRows.map((c) => (
                  <Tr
                    key={c.label}
                    cells={[
                      c.label,
                      `USD ${fmt(c.usd)}`,
                      `$ ${fmt(c.ars)}`,
                      `USD ${fmt(c.totalUSD)}`,
                    ]}
                  />
                ))}
                {cajasRows.length > 1 && (
                  <Tr subtotal cells={["Total", "", "", `USD ${fmt(cajaTotalUSD)}`]} />
                )}
              </FinTable>
            )}
          </div>

          {/* Inmobiliarias */}
          <div className="flex flex-col gap-2">
            <SectionTitle>Inmobiliarias / Providencia · USD {fmt(propiedadTotalUSD)}</SectionTitle>
            {propiedadesRows.length === 0 ? (
              <Empty text="Sin propiedades activas" />
            ) : (
              <FinTable headers={["Propiedad", "Neto USD", "Neto ARS", "Est. USD"]}>
                {propiedadesRows.map((p) => (
                  <Tr
                    key={p.nombre}
                    cells={[
                      p.nombre,
                      `USD ${fmt(p.netUSD)}`,
                      `$ ${fmt(p.netARS)}`,
                      `USD ${fmt(p.totalUSD)}`,
                    ]}
                  />
                ))}
                {propiedadesRows.length > 1 && (
                  <Tr subtotal cells={["Total", "", "", `USD ${fmt(propiedadTotalUSD)}`]} />
                )}
              </FinTable>
            )}
          </div>

          {/* Carteras */}
          <div className="flex flex-col gap-2">
            <SectionTitle>Carteras propias · USD {fmt(carteraTotalUSD)}</SectionTitle>
            {carterasRows.length === 0 ? (
              <Empty text="Sin carteras activas" />
            ) : (
              <FinTable headers={["Cartera", "Posiciones", "Cash", "Total USD"]}>
                {carterasRows.map((c) => (
                  <Tr
                    key={c.nombre}
                    cells={[
                      <span key="n" className="flex items-center gap-1.5">
                        {c.nombre}
                        {c.sinPrecio > 0 && (
                          <span className="text-[10px] text-amber-500 font-bold">
                            ({c.sinPrecio} sin precio)
                          </span>
                        )}
                      </span>,
                      `USD ${fmt(c.posValUSD)}`,
                      `USD ${fmt(c.cashUSD)}`,
                      `USD ${fmt(c.total)}`,
                    ]}
                  />
                ))}
                {carterasRows.length > 1 && (
                  <Tr subtotal cells={["Total", "", "", `USD ${fmt(carteraTotalUSD)}`]} />
                )}
              </FinTable>
            )}
          </div>

        </div>

        {/* ── PASIVO ── */}
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-2">
            <div className="w-1 h-5 bg-red-500 rounded-full" />
            <h2 className="text-sm font-black text-red-400 uppercase tracking-widest font-mono">
              Pasivo · USD {fmt(pasivoTotal)}
            </h2>
          </div>

          {/* Pasivo Clientes (Agrupado) */}
          <div className="flex flex-col gap-2">
            <SectionTitle>Pasivo Clientes</SectionTitle>
            {clientesPasivo.length === 0 ? (
              <Empty text="Sin pasivos con clientes" />
            ) : (
              <div className="rounded-xl border border-byg-border overflow-hidden">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-byg-bg border-b border-byg-border">
                      <th className="px-4 py-2.5 text-left text-[10px] font-black uppercase tracking-widest text-byg-muted">Concepto</th>
                      <th className="px-4 py-2.5 text-right text-[10px] font-black uppercase tracking-widest text-byg-muted">USD Est.</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="bg-byg-surface border-b border-byg-border/40 hover:bg-byg-surface-2 transition-colors">
                      <td className="px-4 py-2.5 text-left text-byg-text font-medium">Cuentas Corrientes (Adeudado)</td>
                      <td className="px-4 py-2.5 text-right tabular-nums font-mono text-byg-muted font-medium">{`USD ${fmt(pasivoCCTotalUSD)}`}</td>
                    </tr>
                    <tr className="bg-byg-surface border-b border-byg-border/40 hover:bg-byg-surface-2 transition-colors">
                      <td className="px-4 py-2.5 text-left text-byg-text font-medium">Plazos Fijos (Activos)</td>
                      <td className="px-4 py-2.5 text-right tabular-nums font-mono text-byg-muted font-medium">{`USD ${fmt(pasivoPFTotalUSD)}`}</td>
                    </tr>
                    <tr className="bg-byg-bg">
                      <td className="px-4 py-3 text-left font-black text-byg-muted uppercase tracking-wider text-[10px]">Total Pasivo Clientes</td>
                      <td className="px-4 py-3 text-right tabular-nums font-mono text-byg-text font-black">{`USD ${fmt(pasivoCCTotalUSD + pasivoPFTotalUSD)}`}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
            
            {clientesPasivo.length > 0 && (
              <div className="mt-2">
                <details className="group border border-byg-border rounded-xl bg-byg-surface overflow-hidden [&_summary::-webkit-details-marker]:hidden">
                  <summary className="px-4 py-3 text-xs font-bold text-byg-muted cursor-pointer flex items-center justify-between hover:bg-byg-surface-2 transition-colors">
                    Ver desglose por cliente
                    <span className="text-[10px] font-black tracking-widest uppercase text-byg-muted group-open:hidden">Expandir</span>
                    <span className="text-[10px] font-black tracking-widest uppercase text-byg-muted hidden group-open:block">Ocultar</span>
                  </summary>
                  <div className="border-t border-byg-border/40">
                    <FinTable headers={["Cliente", "CC", "PF", "Total"]}>
                      {clientesPasivo.map((c) => {
                        const ccPas = Math.max(0, c.ccTotalUSD);
                        return (
                          <Tr
                            key={c.id}
                            cells={[
                              <a key="n" href={`/clientes/${c.id}`} className="hover:text-byg-accent transition-colors">{c.nombre}</a>,
                              ccPas > 0 ? `USD ${fmt(ccPas)}` : "—",
                              c.pfCap > 0 ? `USD ${fmt(c.pfCap)}` : "—",
                              `USD ${fmt(ccPas + c.pfCap)}`,
                            ]}
                          />
                        );
                      })}
                    </FinTable>
                  </div>
                </details>
              </div>
            )}
          </div>

          {/* CC Activo note */}
          {activoCCTotalUSD > 0 && (
            <div className="rounded-xl border border-byg-accent/20 bg-byg-accent/10 p-4 flex flex-col gap-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-byg-accent">
                Nota — CC en Activo
              </p>
              <p className="text-xs text-byg-text font-medium">
                Clientes con saldo negativo en CC aportan{" "}
                <strong>USD {fmt(activoCCTotalUSD)}</strong> al Activo Total (deudas a cobrar a clientes).
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── Pendientes sin confirmar ─────────────────────────────────────── */}
      {(pendingRec.length > 0 || pendingPay.length > 0) && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="w-1 h-5 bg-amber-400 rounded-full" />
            <h2 className="text-sm font-black text-amber-400 uppercase tracking-widest font-mono">
              Pendientes sin confirmar
            </h2>
            <span className="text-[10px] text-byg-muted font-medium">· Chequear con caja física</span>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Kpi label="A cobrar USD" value={`USD ${fmt(pendingRecUSD)}`} color={pendingRecUSD > 0 ? "text-emerald-400" : "text-byg-muted"} />
            <Kpi label="A cobrar ARS" value={`$ ${fmt(pendingRecARS)}`}   color={pendingRecARS > 0 ? "text-emerald-400" : "text-byg-muted"} />
            <Kpi label="A pagar USD"  value={`USD ${fmt(pendingPayUSD)}`} color={pendingPayUSD > 0 ? "text-red-400" : "text-byg-muted"} />
            <Kpi label="A pagar ARS"  value={`$ ${fmt(pendingPayARS)}`}   color={pendingPayARS > 0 ? "text-red-400" : "text-byg-muted"} />
          </div>
          <details className="group border border-byg-border rounded-xl bg-byg-surface overflow-hidden [&_summary::-webkit-details-marker]:hidden">
            <summary className="px-4 py-3 text-xs font-bold text-byg-muted cursor-pointer flex items-center justify-between hover:bg-byg-surface-2 transition-colors">
              Ver detalle de pendientes
              <span className="text-[10px] font-black tracking-widest uppercase text-byg-muted group-open:hidden">Expandir</span>
              <span className="text-[10px] font-black tracking-widest uppercase text-byg-muted hidden group-open:block">Ocultar</span>
            </summary>
            <div className="border-t border-byg-border/40">
              {pendingRec.length > 0 && (
                <>
                  <div className="px-4 py-2 bg-byg-bg text-[10px] font-black uppercase tracking-widest text-byg-muted border-b border-byg-border/40">
                    A cobrar ({pendingRec.length})
                  </div>
                  <FinTable headers={["Caja", "Moneda", "Monto", "Descripción"]}>
                    {pendingRec.map((m) => (
                      <Tr key={m.id} cells={[m.Caja.label, m.moneda, fmt(Number(m.monto)), m.descripcion ?? "—"]} />
                    ))}
                  </FinTable>
                </>
              )}
              {pendingPay.length > 0 && (
                <>
                  <div className="px-4 py-2 bg-byg-bg text-[10px] font-black uppercase tracking-widest text-byg-muted border-b border-byg-border/40">
                    A pagar ({pendingPay.length})
                  </div>
                  <FinTable headers={["Caja", "Moneda", "Monto", "Descripción"]}>
                    {pendingPay.map((m) => (
                      <Tr key={m.id} cells={[m.Caja.label, m.moneda, fmt(Number(m.monto)), m.descripcion ?? "—"]} />
                    ))}
                  </FinTable>
                </>
              )}
            </div>
          </details>
        </div>
      )}

      {/* ── Exposición Cambiaria BYG ─────────────────────────────────────── */}
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-3">
          <div className="w-1 h-5 bg-byg-accent rounded-full" />
          <h2 className="text-sm font-black text-byg-accent uppercase tracking-widest font-mono">
            Exposición Cambiaria BYG
          </h2>
          <span className="text-[10px] text-byg-muted font-medium">· caja + cartera propia · sin custodia ni comitentes</span>
        </div>

        {/* Activos y Pasivos por moneda */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Kpi
            label="Activo USD Directo"
            value={`USD ${fmt(exposicion.activoUSDDirecto)}`}
            sub="caja USD + cartera USD + recobros"
            color="text-emerald-400"
          />
          <Kpi
            label="Activo ARS Equiv."
            value={`USD ${fmt(exposicion.activoARSEnUSD)}`}
            sub={`$ ${fmt(exposicion.activoARS, 0)} ARS`}
            color="text-emerald-400"
          />
          <Kpi
            label="Pasivo USD"
            value={`USD ${fmt(exposicion.pasivoUSD)}`}
            sub="CC USD positivas + PF USD"
            color="text-red-400"
          />
          <Kpi
            label="Pasivo ARS Equiv."
            value={`USD ${fmt(exposicion.pasivoARSEnUSD)}`}
            sub={`$ ${fmt(exposicion.pasivoARS, 0)} ARS`}
            color="text-red-400"
          />
        </div>

        {/* Aperturas netas */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <Kpi
            label="Apertura USD Neta"
            value={`${exposicion.aperturaUSD >= 0 ? "+" : ""}USD ${fmt(exposicion.aperturaUSD)}`}
            sub="activo USD − pasivo USD"
            color={exposicion.aperturaUSD >= 0 ? "text-emerald-400" : "text-red-400"}
          />
          <Kpi
            label="Apertura ARS Neta (Equiv.)"
            value={`${exposicion.aperturaARS >= 0 ? "+" : ""}USD ${fmt(exposicion.aperturaARS / (exposicion.tcBlue || 1))}`}
            sub={`$ ${fmt(exposicion.aperturaARS, 0)} ARS netos`}
            color={exposicion.aperturaARS >= 0 ? "text-byg-text" : "text-red-400"}
          />
          <div className="bg-byg-surface rounded-2xl border border-byg-border border-l-[5px] border-l-byg-accent p-5 flex flex-col gap-1">
            <p className="text-[10px] font-black uppercase tracking-widest text-byg-muted">Apertura Total Equiv.</p>
            <p className={`text-2xl font-black tabular-nums font-mono tracking-tight ${exposicion.aperturaUSDTotalEquivalente >= 0 ? "text-byg-accent" : "text-red-400"}`}>
              {`${exposicion.aperturaUSDTotalEquivalente >= 0 ? "+" : ""}USD ${fmt(exposicion.aperturaUSDTotalEquivalente)}`}
            </p>
            <p className="text-[10px] text-byg-muted font-medium">posición neta consolidada</p>
          </div>
        </div>

        {/* Sensibilidad cambiaria */}
        <div className="flex flex-col gap-2">
          <SectionTitle>Sensibilidad cambiaria · escenarios de suba TC</SectionTitle>
          <FinTable headers={["Escenario", "TC Nuevo", "Impacto en apertura", "Apertura total equiv."]}>
            {exposicion.sensibilidad.map((row) => (
              <Tr
                key={row.delta}
                cells={[
                  `+${row.delta} ARS/USD`,
                  `$ ${fmt(row.tcNuevo, 0)}`,
                  <span key="imp" className={row.impactoUSD >= 0 ? "text-emerald-400" : "text-red-400"}>
                    {row.impactoUSD >= 0 ? "+" : ""}{fmt(row.impactoUSD)} USD
                  </span>,
                  `USD ${fmt(row.aperturaEquiv)}`,
                ]}
              />
            ))}
          </FinTable>
        </div>
      </div>
    </div>
  );
}
