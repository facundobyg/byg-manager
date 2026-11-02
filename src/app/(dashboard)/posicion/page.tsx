import type { ReactNode } from "react";
import { getFinanceDataset, getPatrimonioNeto, getResultadoRealizadoMes } from "@/lib/finance";
import { arsPorUsd } from "@/lib/finance/compat";
import { CalidadBadge, DetalleIncompleto } from "@/components/ui/CalidadFinanciera";
import { calcExposicionCambiaria } from "@/lib/data/exposicion-cambiaria";
import { prisma } from "@/lib/prisma";

// ─── Helpers ────────────────────────────────────────────────────────────────

/** MACRO 2: null = cifra INCOMPLETA (nunca se muestra como 0). */
function fmt(n: number | null, dec = 2) {
  if (n === null) return "Incompleto";
  return n.toLocaleString("es-AR", { minimumFractionDigits: dec, maximumFractionDigits: dec });
}
const sumaN = (a: number | null, b: number | null) => (a === null || b === null ? null : a + b);

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
  // MACRO 2 — Todo número patrimonial sale del motor canónico (src/lib/finance):
  // la página ya no recalcula el PN. Home y Reportes reciben el mismo PN.
  const [pn, mesActivo, cajasLabel] = await Promise.all([
    getPatrimonioNeto(),
    prisma.mesContable.findFirst({ where: { activo: true } }),
    prisma.caja.findMany({ select: { id: true, label: true } }),
  ]);
  const ds = await getFinanceDataset();
  const tcBlue = arsPorUsd(ds, pn.corte);

  // Utilidad del mes: resultado realizado canónico con su calidad (null = incompleto).
  const resultadoMes = mesActivo ? await getResultadoRealizadoMes(mesActivo.mes) : null;
  const utilidadMes = resultadoMes?.totalUSD ?? null;

  const c = pn.componentes;
  const activoTotal = pn.activoUSD;
  const pasivoTotal = pn.pasivoUSD;
  const patrimonioNeto = pn.pnUSD;
  const custodiaValorUSD = pn.custodiaExcluidaUSD;
  const todaCustodia = ds.custodia;
  const carteras = pn.detalle.carteras.filter((k) => k.activa);
  const cajas = pn.detalle.cajas.filter((k) => k.activa);

  // ── Cajas ──────────────────────────────────────────────────────────────────
  const cajasRows = pn.detalle.cajas
    .filter((k) => k.activa || k.usd !== 0)
    .map((k) => ({ label: k.label, usd: k.nativo.USD, ars: k.nativo.ARS, totalUSD: k.usd }));
  const cajaTotalUSD = c.cajas.usd;

  // ── Carteras ───────────────────────────────────────────────────────────────
  const carterasRows = pn.detalle.carteras.map((k) => ({
    nombre: k.nombre, posValUSD: k.posicionesUSD, cashUSD: k.cashUSD, total: k.totalUSD, sinPrecio: k.sinPrecio,
  }));
  const carteraTotalUSD = c.carteras.usd;

  // ── Inmobiliarias ──────────────────────────────────────────────────────────
  const propiedadesRows = pn.detalle.inmuebles
    .filter((p) => p.activa || p.usd !== 0)
    .map((p) => ({ nombre: p.nombre, netUSD: p.nativo.USD, netARS: p.nativo.ARS, totalUSD: p.usd }));
  const propiedadTotalUSD = c.inmuebles.usd;

  // ── Clientes CC & PF ───────────────────────────────────────────────────────
  const clientesData = pn.detalle.clientes.map((k) => ({
    id: k.id, nombre: k.nombre,
    ccUSD: k.ccNativo.USD, ccARS: k.ccNativo.ARS, ccTotalUSD: k.ccUSD,
    pfCap: k.pfUSD, pfUSD: k.pfNativo.USD, pfARS: k.pfNativo.ARS,
  }));
  const pasivoCCTotalUSD = c.ccAcreedora.usd;
  const activoCCTotalUSD = c.ccDeudora.usd;
  const pasivoPFTotalUSD = c.pf.usd;

  // ── Pendientes (saldo residual: monto − pagos parciales confirmados) ───────
  const labelCaja = new Map(cajasLabel.map((k) => [k.id, k.label]));
  const pendientes = pn.detalle.pendientes
    .filter((p) => p.residual > 0)
    .sort((a, b) => (a.fecha < b.fecha ? 1 : -1))
    .map((p) => ({ ...p, monto: p.residual, Caja: { label: labelCaja.get(p.cajaId) ?? "—" } }));
  const pendingRec = pendientes.filter((m) => m.lado === "COBRAR");
  const pendingPay = pendientes.filter((m) => m.lado === "PAGAR");
  const pendingRecUSD = pendingRec.reduce((s, m) => m.moneda === "USD" ? s + m.monto : s, 0);
  const pendingRecARS = pendingRec.reduce((s, m) => m.moneda === "ARS" ? s + m.monto : s, 0);
  const pendingPayUSD = pendingPay.reduce((s, m) => m.moneda === "USD" ? s + m.monto : s, 0);
  const pendingPayARS = pendingPay.reduce((s, m) => m.moneda === "ARS" ? s + m.monto : s, 0);

  // ── Exposición Cambiaria (desde los mismos saldos nativos del PN) ──────────
  const cajaUSD = c.cajas.nativo.USD;
  const cajaARS = c.cajas.nativo.ARS;
  let carteraUSDDirecto = 0;
  let carteraARSDirecto = 0;
  for (const k of pn.detalle.carteras) {
    carteraUSDDirecto += k.cashNativo.USD + k.posicionesNativo.USD;
    carteraARSDirecto += k.cashNativo.ARS + k.posicionesNativo.ARS;
  }
  const pasivoCCUSD  = clientesData.reduce((s, k) => s + Math.max(0,  k.ccUSD), 0);
  const pasivoCCARS  = clientesData.reduce((s, k) => s + Math.max(0,  k.ccARS), 0);
  const activoCCUSD  = clientesData.reduce((s, k) => s + Math.max(0, -k.ccUSD), 0);
  const activoCCARS  = clientesData.reduce((s, k) => s + Math.max(0, -k.ccARS), 0);
  const pasivoPFUSD  = clientesData.reduce((s, k) => s + k.pfUSD, 0);
  const pasivoPFARS  = clientesData.reduce((s, k) => s + k.pfARS, 0);


  // Sin TC utilizable al corte no hay exposición en USD que mostrar.
  const exposicion = tcBlue === null ? null : calcExposicionCambiaria({
    cajaUSD, cajaARS,
    carteraUSDDirecto, carteraARSDirecto,
    activoCCUSD, activoCCARS,
    pasivoCCUSD, pasivoCCARS,
    pasivoPFUSD, pasivoPFARS,
    tcBlue,
  });

  // (?? 0 solo para filtrar/ordenar; los montos mostrados conservan null)
  const clientesPasivo = clientesData
    .filter((c) => c.ccTotalUSD === null || c.pfCap === null || Math.max(0, c.ccTotalUSD) > 0 || c.pfCap > 0)
    .sort(
      (a, b) =>
        (b.pfCap ?? 0) + Math.max(0, b.ccTotalUSD ?? 0) - ((a.pfCap ?? 0) + Math.max(0, a.ccTotalUSD ?? 0)),
    );

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <header>
        <p className="text-[10px] font-black text-byg-accent uppercase tracking-[0.3em]">General</p>
        <h1 className="text-4xl font-black text-byg-text tracking-tight">Posición</h1>
        <p className="text-sm text-byg-muted font-medium mt-1">
          Balance patrimonial · TC Blue ${fmt(tcBlue, 0)} ARS/USD <CalidadBadge quality={pn.quality} reasons={pn.qualityReasons} />
        </p>
        <DetalleIncompleto quality={pn.quality} reasons={pn.qualityReasons} knownSubtotalUSD={pn.knownSubtotalUSD} fmt={(n) => `USD ${fmt(n)}`} />
      </header>

      {/* KPI row 1 */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Kpi label="Activo Total" value={`USD ${fmt(activoTotal)}`} color="text-emerald-400" />
        <Kpi label="Pasivo Total" value={`USD ${fmt(pasivoTotal)}`} color="text-red-400" />
        <Kpi
          label="Patrimonio Neto"
          value={`USD ${fmt(patrimonioNeto)}`}
          sub={pn.quality === "EXACT" ? undefined : pn.quality === "APPROXIMATE" ? "Aproximado" : `Incompleto · parcial conocido USD ${fmt(pn.knownSubtotalUSD)}`}
          color={patrimonioNeto === null ? "text-amber-400" : patrimonioNeto >= 0 ? "text-byg-accent" : "text-red-400"}
        />
        {resultadoMes ? (
          <Kpi
            label="Utilidad del Mes"
            value={utilidadMes === null ? "Incompleto" : `USD ${fmt(utilidadMes)}`}
            sub={`${mesActivo?.mes}${resultadoMes.quality === "EXACT" ? "" : resultadoMes.quality === "APPROXIMATE" ? " · aproximado" : ` · parcial conocido USD ${fmt(resultadoMes.knownSubtotalUSD)}`}`}
            color={utilidadMes === null ? "text-amber-400" : utilidadMes >= 0 ? "text-emerald-400" : "text-red-400"}
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
          value={`USD ${fmt(sumaN(pasivoCCTotalUSD, pasivoPFTotalUSD))}`}
          sub={`CC ${fmt(pasivoCCTotalUSD)} · PF ${fmt(pasivoPFTotalUSD)}`}
          color={(sumaN(pasivoCCTotalUSD, pasivoPFTotalUSD) ?? 0) > 0 ? "text-red-400" : "text-byg-text"}
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
                      <td className="px-4 py-3 text-right tabular-nums font-mono text-byg-text font-black">{`USD ${fmt(sumaN(pasivoCCTotalUSD, pasivoPFTotalUSD))}`}</td>
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
                        const ccPas = c.ccTotalUSD === null ? null : Math.max(0, c.ccTotalUSD);
                        return (
                          <Tr
                            key={c.id}
                            cells={[
                              <a key="n" href={`/clientes/${c.id}`} className="hover:text-byg-accent transition-colors">{c.nombre}</a>,
                              ccPas === null || ccPas > 0 ? `USD ${fmt(ccPas)}` : "—",
                              c.pfCap === null || c.pfCap > 0 ? `USD ${fmt(c.pfCap)}` : "—",
                              `USD ${fmt(sumaN(ccPas, c.pfCap))}`,
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
          {(activoCCTotalUSD === null || activoCCTotalUSD > 0) && (
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
      {exposicion && (
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
      )}
    </div>
  );
}
