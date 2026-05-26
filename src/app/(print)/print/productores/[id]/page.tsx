import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PrintButton } from "@/components/PrintButton";
import { getResumenComisiones } from "@/lib/data/comisiones";
import { getMesOperativo } from "@/lib/services/config.service";

function fmt(n: number) {
  return n.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtFecha(d: Date | string) {
  return new Date(d).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "UTC" });
}

export default async function PrintProductorPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ mes?: string }>;
}) {
  const { id } = await params;
  const { mes: mesParam } = await searchParams;

  const mesFallback = await getMesOperativo();
  const mes = mesParam ?? mesFallback;

  const [productor, resumen, tcConfig] = await Promise.all([
    prisma.productor.findUnique({ where: { id } }),
    getResumenComisiones(mes),
    prisma.config.findUnique({ where: { clave: "tc_blue" } }),
  ]);

  if (!productor) notFound();

  const data = resumen.find((r) => r.productor.id === id);
  const tcBlue = Number(tcConfig?.valor ?? "1000");

  const ahora   = new Date();
  const fechaStr = ahora.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" });
  const horaStr  = ahora.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });

  const [mesY, mesM] = mes.split("-").map(Number);
  const mesLabel = new Date(mesY, mesM - 1, 1).toLocaleDateString("es-AR", { month: "long", year: "numeric" });

  const lineas    = data?.lineas ?? [];
  const totalBase = data?.totalBaseUSD ?? 0;
  const totalCom  = data?.totalComisionUSD ?? 0;
  const pct       = Number(productor.porcentaje);

  return (
    <html lang="es">
      <head>
        <style>{`
          @page { margin: 16mm 14mm; }
          body { font-family: 'Inter', 'Helvetica Neue', Arial, sans-serif; color: #111827; background: white; margin: 0; }
          .page { max-width: 820px; margin: 0 auto; padding: 0; }
          table { width: 100%; border-collapse: collapse; font-size: 11px; }
          th, td { padding: 6px 10px; border-bottom: 1px solid #e5e7eb; text-align: left; }
          th { background: #f9fafb; font-size: 9px; text-transform: uppercase; letter-spacing: .08em; color: #6b7280; font-weight: 700; }
          tr:last-child td { border-bottom: none; }
          tfoot td { background: #f9fafb; font-weight: 700; border-top: 2px solid #e5e7eb; }
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
            <Link href="/comisiones" style={{ padding:"6px 14px", borderRadius:8, fontSize:12, fontWeight:700, color:"#4b5563", textDecoration:"none", background:"#e5e7eb" }}>
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
              <h1 style={{ fontSize:22, fontWeight:900, margin:"4px 0 0", letterSpacing:"-.5px" }}>Reporte de Productor</h1>
            </div>
            <div style={{ textAlign:"right" }}>
              <p style={{ fontSize:9, fontWeight:900, textTransform:"uppercase", letterSpacing:".1em", color:"#9ca3af", margin:0 }}>Emitido</p>
              <p style={{ fontSize:15, fontWeight:900, margin:"2px 0 0" }}>{fechaStr}</p>
              <p style={{ fontSize:10, color:"#9ca3af", margin:0 }}>{horaStr}</p>
            </div>
          </div>

          {/* Productor header */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", gap:16, marginBottom:24, padding:16, background:"#f9fafb", borderRadius:10, border:"1px solid #e5e7eb" }}>
            <div>
              <p style={{ fontSize:9, fontWeight:900, textTransform:"uppercase", letterSpacing:".1em", color:"#9ca3af", margin:"0 0 4px" }}>Productor</p>
              <p style={{ fontSize:18, fontWeight:900, margin:0 }}>{productor.nombre}</p>
            </div>
            <div>
              <p style={{ fontSize:9, fontWeight:900, textTransform:"uppercase", letterSpacing:".1em", color:"#9ca3af", margin:"0 0 4px" }}>Período</p>
              <p style={{ fontSize:15, fontWeight:900, margin:0 }}>{mesLabel.charAt(0).toUpperCase() + mesLabel.slice(1)}</p>
            </div>
            <div>
              <p style={{ fontSize:9, fontWeight:900, textTransform:"uppercase", letterSpacing:".1em", color:"#9ca3af", margin:"0 0 4px" }}>Base comisionable</p>
              <p style={{ fontSize:15, fontWeight:900, margin:0, fontVariantNumeric:"tabular-nums" }}>USD {fmt(totalBase)}</p>
            </div>
            <div>
              <p style={{ fontSize:9, fontWeight:900, textTransform:"uppercase", letterSpacing:".1em", color:"#9ca3af", margin:"0 0 4px" }}>Comisión ({pct.toFixed(1)}%)</p>
              <p style={{ fontSize:18, fontWeight:900, margin:0, fontVariantNumeric:"tabular-nums", color:"#b45309" }}>USD {fmt(totalCom)}</p>
            </div>
          </div>

          {/* Operations table */}
          {lineas.length === 0 ? (
            <p style={{ fontSize:12, color:"#9ca3af", fontStyle:"italic", textAlign:"center", padding:"32px 0" }}>
              Sin operaciones para el período seleccionado.
            </p>
          ) : (
            <div style={{ marginBottom:24 }}>
              <p style={{ fontSize:9, fontWeight:900, textTransform:"uppercase", letterSpacing:".15em", color:"#6b7280", margin:"0 0 8px" }}>
                Detalle de operaciones — {lineas.length} registros
              </p>
              <table>
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Cliente</th>
                    <th>Operación</th>
                    <th>Módulo</th>
                    <th style={{ textAlign:"right" }}>Com. Fija ARS</th>
                    <th style={{ textAlign:"right" }}>Com. USD</th>
                    <th style={{ textAlign:"right" }}>Base USD</th>
                    <th style={{ textAlign:"right" }}>%</th>
                    <th style={{ textAlign:"right" }}>Comisión USD</th>
                  </tr>
                </thead>
                <tbody>
                  {lineas.map((l) => (
                    <tr key={l.id} style={l.sinBase ? { background:"#fffbeb" } : {}}>
                      <td style={{ color:"#6b7280", whiteSpace:"nowrap" }}>{fmtFecha(l.fecha)}</td>
                      <td style={{ fontWeight:600 }}>{l.clienteNombre}</td>
                      <td style={{ color:"#4b5563", maxWidth:200, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{l.descripcion}</td>
                      <td>
                        <span style={{ fontSize:9, fontWeight:700, textTransform:"uppercase", padding:"2px 5px", borderRadius:3, background: l.modulo === "bolsa" ? "#dbeafe" : "#f3e8ff", color: l.modulo === "bolsa" ? "#1d4ed8" : "#7e22ce" }}>
                          {l.modulo}
                        </span>
                      </td>
                      <td style={{ textAlign:"right", fontVariantNumeric:"tabular-nums", color:"#6b7280" }}>
                        {l.comisionFijaARS > 0 ? `$ ${fmt(l.comisionFijaARS)}` : "—"}
                      </td>
                      <td style={{ textAlign:"right", fontVariantNumeric:"tabular-nums", color:"#6b7280" }}>
                        {l.comisionUSD > 0 ? fmt(l.comisionUSD) : "—"}
                      </td>
                      <td style={{ textAlign:"right", fontWeight:700, fontVariantNumeric:"tabular-nums", color: l.sinBase ? "#d97706" : "#111827" }}>
                        {l.sinBase ? "⚠ sin base" : fmt(l.baseTotalUSD)}
                      </td>
                      <td style={{ textAlign:"right", color:"#6b7280" }}>{pct.toFixed(1)}%</td>
                      <td style={{ textAlign:"right", fontWeight:700, fontVariantNumeric:"tabular-nums", color: l.sinBase ? "#9ca3af" : "#b45309" }}>
                        {l.sinBase ? "—" : fmt(l.comisionProductorUSD)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={6} style={{ textAlign:"left", fontSize:9, textTransform:"uppercase", letterSpacing:".05em", color:"#6b7280" }}>Total</td>
                    <td style={{ textAlign:"right", fontVariantNumeric:"tabular-nums" }}>USD {fmt(totalBase)}</td>
                    <td style={{ textAlign:"right", color:"#6b7280" }}>{pct.toFixed(1)}%</td>
                    <td style={{ textAlign:"right", fontVariantNumeric:"tabular-nums", color:"#b45309" }}>USD {fmt(totalCom)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}

          {/* Footer */}
          <div style={{ marginTop:32, paddingTop:16, borderTop:"1px solid #e5e7eb", display:"flex", justifyContent:"space-between" }}>
            <p style={{ fontSize:9, color:"#9ca3af", margin:0 }}>BYG Manager · Reporte generado el {fechaStr}</p>
            <p style={{ fontSize:9, color:"#9ca3af", margin:0 }}>Confidencial · TC Blue ${tcBlue.toLocaleString("es-AR")}</p>
          </div>

        </div>
      </body>
    </html>
  );
}
