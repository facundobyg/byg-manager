import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PrintButton } from "@/components/PrintButton";
import { getClienteDeMap } from "@/lib/services/config.service";
import Decimal from "decimal.js";

function fmt(n: Decimal | number | string | null | undefined) {
  const val = n == null ? 0 : typeof n === "object" && "toString" in n ? Number(n.toString()) : Number(n);
  return (isNaN(val) ? 0 : val).toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtFecha(d: Date | string | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "UTC" });
}

export default async function PrintClientePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [cliente, tcConfig] = await Promise.all([
    prisma.cliente.findUnique({
      where: { id },
      include: {
        CuentaCorriente: {
          orderBy: { moneda: "asc" },
          include: {
            MovimientoCC: {
              orderBy: [{ fecha: "desc" }],
              take: 20,
            },
          },
        },
        PlazoFijo: {
          where: { estado: { in: ["ACTIVO", "VENCIDO"] } },
          orderBy: { fechaVencimiento: "asc" },
        },
        CustodiaCliente: {
          include: {
            Activo: { select: { ticker: true, descripcion: true, precioActual: true, monedaPrecio: true } },
          },
        },
        Productor: { select: { nombre: true, porcentaje: true } },
      },
    }),
    prisma.config.findUnique({ where: { clave: "tc_blue" } }),
  ]);

  if (!cliente) notFound();

  const deMap = await getClienteDeMap();
  const socio = deMap[cliente.nombre] ?? null;
  const tcBlue = Number(tcConfig?.valor ?? "1000");

  const ahora = new Date();
  const fechaStr = ahora.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" });
  const horaStr  = ahora.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });

  const ESTADO_CLS: Record<string, { color: string; background: string }> = {
    ACTIVO:    { color: "#065f46", background: "#d1fae5" },
    VENCIDO:   { color: "#991b1b", background: "#fee2e2" },
    CANCELADO: { color: "#6b7280", background: "#f3f4f6" },
    RENOVADO:  { color: "#1d4ed8", background: "#dbeafe" },
  };

  const ccUSD = cliente.CuentaCorriente.filter((cc) => cc.moneda === "USD")
    .reduce((s, cc) => s + Number(cc.saldo), 0);
  const ccARS = cliente.CuentaCorriente.filter((cc) => cc.moneda === "ARS")
    .reduce((s, cc) => s + Number(cc.saldo), 0);

  const pfActivos = cliente.PlazoFijo.filter((pf) => pf.estado === "ACTIVO");
  const pfCapUSD  = pfActivos.filter((pf) => pf.moneda === "USD")
    .reduce((s, pf) => s + Number(pf.capital), 0);
  const pfCapARS  = pfActivos.filter((pf) => pf.moneda === "ARS")
    .reduce((s, pf) => s + Number(pf.capital), 0);

  const custodias = cliente.CustodiaCliente;
  const custodiaValorUSD = custodias.reduce((s, cu) => {
    if (!cu.Activo.precioActual) return s;
    const precio = cu.Activo.monedaPrecio === "ARS"
      ? Number(cu.Activo.precioActual) / tcBlue
      : Number(cu.Activo.precioActual);
    return s + Number(cu.cantidadTotal) * precio;
  }, 0);

  const hasCustodia = custodias.length > 0;

  return (
    <html lang="es">
      <head>
        <style>{`
          @page { margin: 16mm 14mm; }
          body { font-family: 'Inter', 'Helvetica Neue', Arial, sans-serif; color: #111827; background: white; margin: 0; }
          .page { max-width: 760px; margin: 0 auto; padding: 0; }
          table { width: 100%; border-collapse: collapse; font-size: 11px; }
          th, td { padding: 6px 10px; border-bottom: 1px solid #e5e7eb; text-align: left; }
          th { background: #f9fafb; font-size: 9px; text-transform: uppercase; letter-spacing: .08em; color: #6b7280; font-weight: 700; }
          tr:last-child td { border-bottom: none; }
          @media print { .no-print { display: none !important; } }
        `}</style>
      </head>
      <body>
        {/* Toolbar */}
        <div className="no-print" style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"12px 24px", borderBottom:"1px solid #e5e7eb", background:"#f9fafb", position:"sticky", top:0, zIndex:10 }}>
          <p style={{ fontSize:12, color:"#6b7280", margin:0 }}>
            Vista previa · <kbd style={{ padding:"2px 6px", background:"white", border:"1px solid #d1d5db", borderRadius:4, fontSize:11, fontFamily:"monospace" }}>Ctrl+P</kbd> para imprimir
          </p>
          <div style={{ display:"flex", gap:8 }}>
            <Link href={`/clientes/${id}`} style={{ padding:"6px 14px", borderRadius:8, fontSize:12, fontWeight:700, color:"#4b5563", textDecoration:"none", background:"#e5e7eb" }}>
              ← Volver
            </Link>
            <PrintButton />
          </div>
        </div>

        <div className="page" style={{ padding:"32px 40px" }}>

          {/* Letterhead */}
          <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:24, paddingBottom:16, borderBottom:"3px solid #111827" }}>
            <div>
              <p style={{ fontSize:9, fontWeight:900, textTransform:"uppercase", letterSpacing:".25em", color:"#9ca3af", margin:0 }}>BYG Manager</p>
              <h1 style={{ fontSize:22, fontWeight:900, margin:"4px 0 0", letterSpacing:"-.5px" }}>Extracto de Cliente</h1>
            </div>
            <div style={{ textAlign:"right" }}>
              <p style={{ fontSize:9, fontWeight:900, textTransform:"uppercase", letterSpacing:".1em", color:"#9ca3af", margin:0 }}>Emitido</p>
              <p style={{ fontSize:15, fontWeight:900, margin:"2px 0 0" }}>{fechaStr}</p>
              <p style={{ fontSize:10, color:"#9ca3af", margin:0 }}>{horaStr}</p>
            </div>
          </div>

          {/* Client header */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:16, marginBottom:24, padding:16, background:"#f9fafb", borderRadius:10, border:"1px solid #e5e7eb" }}>
            <div>
              <p style={{ fontSize:9, fontWeight:900, textTransform:"uppercase", letterSpacing:".1em", color:"#9ca3af", margin:"0 0 4px" }}>Cliente</p>
              <p style={{ fontSize:17, fontWeight:900, margin:0, lineHeight:1.2 }}>{cliente.nombre}</p>
              {cliente.email    && <p style={{ fontSize:10, color:"#6b7280", margin:"2px 0 0" }}>{cliente.email}</p>}
              {cliente.telefono && <p style={{ fontSize:10, color:"#6b7280", margin:"1px 0 0" }}>{cliente.telefono}</p>}
            </div>
            <div>
              <p style={{ fontSize:9, fontWeight:900, textTransform:"uppercase", letterSpacing:".1em", color:"#9ca3af", margin:"0 0 4px" }}>Socio responsable</p>
              <p style={{ fontSize:15, fontWeight:900, margin:0 }}>{socio ?? "—"}</p>
              {cliente.Productor && (
                <>
                  <p style={{ fontSize:9, fontWeight:900, textTransform:"uppercase", letterSpacing:".1em", color:"#9ca3af", margin:"8px 0 2px" }}>Productor</p>
                  <p style={{ fontSize:13, fontWeight:700, margin:0 }}>{cliente.Productor.nombre} ({Number(cliente.Productor.porcentaje).toFixed(1)}%)</p>
                </>
              )}
            </div>
            <div>
              <p style={{ fontSize:9, fontWeight:900, textTransform:"uppercase", letterSpacing:".1em", color:"#9ca3af", margin:"0 0 4px" }}>PF activos (capital)</p>
              {pfCapUSD > 0 && <p style={{ fontSize:13, fontWeight:900, margin:0, fontVariantNumeric:"tabular-nums" }}>USD {fmt(pfCapUSD)}</p>}
              {pfCapARS > 0 && <p style={{ fontSize:13, fontWeight:900, margin:"2px 0 0", fontVariantNumeric:"tabular-nums" }}>ARS {fmt(pfCapARS)}</p>}
              {pfCapUSD === 0 && pfCapARS === 0 && <p style={{ fontSize:12, color:"#9ca3af", margin:0 }}>—</p>}
              <p style={{ fontSize:9, color:"#9ca3af", margin:"2px 0 0" }}>{pfActivos.length} plazo(s) activo(s)</p>
            </div>
          </div>

          {/* CC Summary */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:24 }}>
            <div style={{ padding:12, background:"#f9fafb", borderRadius:8, border:"1px solid #e5e7eb" }}>
              <p style={{ fontSize:9, fontWeight:900, textTransform:"uppercase", letterSpacing:".1em", color:"#9ca3af", margin:"0 0 2px" }}>Saldo CC — USD</p>
              <p style={{ fontSize:18, fontWeight:900, margin:0, fontVariantNumeric:"tabular-nums", color: ccUSD < 0 ? "#dc2626" : "#111827" }}>
                {fmt(ccUSD)} USD
              </p>
            </div>
            <div style={{ padding:12, background:"#f9fafb", borderRadius:8, border:"1px solid #e5e7eb" }}>
              <p style={{ fontSize:9, fontWeight:900, textTransform:"uppercase", letterSpacing:".1em", color:"#9ca3af", margin:"0 0 2px" }}>Saldo CC — ARS</p>
              <p style={{ fontSize:18, fontWeight:900, margin:0, fontVariantNumeric:"tabular-nums", color: ccARS < 0 ? "#dc2626" : "#111827" }}>
                $ {fmt(ccARS)}
              </p>
            </div>
          </div>

          {/* Custodia section */}
          {hasCustodia && (
            <div style={{ marginBottom:24 }}>
              <h2 style={{ fontSize:10, fontWeight:900, textTransform:"uppercase", letterSpacing:".2em", color:"#6b7280", margin:"0 0 8px" }}>
                Custodia BYG · USD {fmt(custodiaValorUSD)}
              </h2>
              <table>
                <thead>
                  <tr>
                    <th>Ticker</th>
                    <th>Descripción</th>
                    <th style={{ textAlign:"right" }}>Cantidad</th>
                    <th style={{ textAlign:"right" }}>Precio prom.</th>
                    <th style={{ textAlign:"right" }}>Precio actual</th>
                  </tr>
                </thead>
                <tbody>
                  {custodias.map((cu) => (
                    <tr key={cu.id}>
                      <td style={{ fontWeight:700 }}>{cu.Activo.ticker}</td>
                      <td style={{ color:"#6b7280" }}>{cu.Activo.descripcion ?? "—"}</td>
                      <td style={{ textAlign:"right", fontVariantNumeric:"tabular-nums" }}>{fmt(cu.cantidadTotal)}</td>
                      <td style={{ textAlign:"right", fontVariantNumeric:"tabular-nums" }}>{fmt(cu.precioPromedio)}</td>
                      <td style={{ textAlign:"right", fontVariantNumeric:"tabular-nums" }}>
                        {cu.Activo.precioActual ? fmt(cu.Activo.precioActual) : <span style={{ color:"#9ca3af" }}>sin dato</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p style={{ fontSize:9, color:"#9ca3af", margin:"6px 0 0", fontStyle:"italic" }}>
                ⚠ La custodia no integra el patrimonio propio de BYG. Son activos de terceros bajo administración.
              </p>
            </div>
          )}

          {/* CC sections */}
          {cliente.CuentaCorriente.map((cc) => (
            <div key={cc.id} style={{ marginBottom:24 }}>
              <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:8 }}>
                <h2 style={{ fontSize:10, fontWeight:900, textTransform:"uppercase", letterSpacing:".2em", color:"#6b7280", margin:0 }}>
                  Cuenta Corriente — {cc.moneda}
                </h2>
                <span style={{ fontSize:13, fontWeight:900, fontVariantNumeric:"tabular-nums", color: Number(cc.saldo) < 0 ? "#dc2626" : "#111827" }}>
                  Saldo: {fmt(cc.saldo)} {cc.moneda}
                </span>
              </div>
              {cc.MovimientoCC.length === 0 ? (
                <p style={{ fontSize:11, color:"#9ca3af", fontStyle:"italic", margin:0 }}>Sin movimientos recientes</p>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Tipo</th>
                      <th>Descripción</th>
                      <th style={{ textAlign:"right" }}>Monto</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cc.MovimientoCC.map((m) => {
                      const esIn = m.tipo === "INGRESO" || m.tipo === "INTERES";
                      return (
                        <tr key={m.id}>
                          <td style={{ color:"#6b7280", whiteSpace:"nowrap" }}>{fmtFecha(m.fecha)}</td>
                          <td>
                            <span style={{ fontSize:9, fontWeight:900, textTransform:"uppercase", padding:"2px 5px", borderRadius:3, ...(esIn ? { background:"#d1fae5", color:"#065f46" } : { background:"#fee2e2", color:"#991b1b" }) }}>
                              {m.tipo}
                            </span>
                          </td>
                          <td style={{ color:"#4b5563", maxWidth:220, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{m.descripcion || "—"}</td>
                          <td style={{ textAlign:"right", fontWeight:700, fontVariantNumeric:"tabular-nums", color: esIn ? "#065f46" : "#111827" }}>
                            {esIn ? "+" : "−"}{fmt(m.monto)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          ))}

          {/* PF section */}
          {cliente.PlazoFijo.length > 0 && (
            <div style={{ marginBottom:24 }}>
              <h2 style={{ fontSize:10, fontWeight:900, textTransform:"uppercase", letterSpacing:".2em", color:"#6b7280", margin:"0 0 8px" }}>
                Plazos Fijos
              </h2>
              <table>
                <thead>
                  <tr>
                    {["Moneda", "Capital", "Tasa", "Inicio", "Vencimiento", "Saldo actual", "Estado"].map((h) => (
                      <th key={h}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {cliente.PlazoFijo.map((pf) => (
                    <tr key={pf.id}>
                      <td style={{ fontWeight:700 }}>{pf.moneda}</td>
                      <td style={{ fontVariantNumeric:"tabular-nums", fontWeight:700 }}>{fmt(pf.capital)}</td>
                      <td style={{ fontVariantNumeric:"tabular-nums" }}>
                        {Number(pf.tasaAnual).toLocaleString("es-AR", { minimumFractionDigits:2, maximumFractionDigits:2 })}%
                      </td>
                      <td style={{ color:"#6b7280", whiteSpace:"nowrap" }}>{fmtFecha(pf.fechaInicio)}</td>
                      <td style={{ color:"#6b7280", whiteSpace:"nowrap" }}>{fmtFecha(pf.fechaVencimiento)}</td>
                      <td style={{ fontVariantNumeric:"tabular-nums", fontWeight:700 }}>{fmt(pf.saldoActual)}</td>
                      <td>
                        <span style={{ fontSize:9, fontWeight:900, textTransform:"uppercase", padding:"2px 5px", borderRadius:3, ...(ESTADO_CLS[pf.estado] ?? {}) }}>
                          {pf.estado}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Footer */}
          <div style={{ marginTop:32, paddingTop:16, borderTop:"1px solid #e5e7eb", display:"flex", justifyContent:"space-between" }}>
            <p style={{ fontSize:9, color:"#9ca3af", margin:0 }}>BYG Manager · Documento generado el {fechaStr}</p>
            <p style={{ fontSize:9, color:"#9ca3af", margin:0 }}>Confidencial · TC Blue ${tcBlue.toLocaleString("es-AR")}</p>
          </div>

        </div>
      </body>
    </html>
  );
}
