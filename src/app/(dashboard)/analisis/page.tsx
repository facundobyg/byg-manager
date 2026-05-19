import { getResultadoCambioMensual, getMovimientosDiarios } from "@/lib/data/mov-diarios";
import { getTotalesRulos } from "@/lib/data/rulos-bolsa";
import { getTotalesDivIntereses } from "@/lib/data/div-intereses";

function fmt(n: number, dec = 2) {
  return n.toLocaleString("es-AR", { minimumFractionDigits: dec, maximumFractionDigits: dec });
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col gap-4">
      <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">{title}</h2>
      {children}
    </section>
  );
}

export default async function AnalisisPage() {
  const mesActual = new Date().toISOString().slice(0, 7);
  const mesStart  = new Date(mesActual + "-01T00:00:00Z");
  const mesEnd    = new Date(Date.UTC(mesStart.getUTCFullYear(), mesStart.getUTCMonth() + 1, 1));

  const [cambioRes, rulosRes, divRes, movsRes] = await Promise.allSettled([
    getResultadoCambioMensual(mesActual),
    getTotalesRulos(mesActual),
    getTotalesDivIntereses(mesActual),
    getMovimientosDiarios(),
  ]);

  const cambio = cambioRes.status === "fulfilled" ? cambioRes.value : null;
  const rulos  = rulosRes.status  === "fulfilled" ? rulosRes.value  : null;
  const div    = divRes.status    === "fulfilled" ? divRes.value    : null;
  const movs   = movsRes.status   === "fulfilled" ? movsRes.value   : null;

  // Top clientes por volumen de cambio (mes actual)
  const cambioOps = movs
    ? movs.filter((m) => m.tipo === "CAMBIO" && m.cliente !== "—" && m.fecha >= mesStart && m.fecha < mesEnd)
    : [];
  const clienteMap = new Map<string, { ops: number; volumen: number }>();
  for (const op of cambioOps) {
    const entry = clienteMap.get(op.cliente) ?? { ops: 0, volumen: 0 };
    entry.ops++;
    if (op.moneda === "USD") entry.volumen += op.monto;
    clienteMap.set(op.cliente, entry);
  }
  const topClientes = Array.from(clienteMap.entries())
    .sort((a, b) => b[1].volumen - a[1].volumen)
    .slice(0, 10);

  // Gastos operativos del mes
  const gastos = movs
    ? movs.filter(
        (m) =>
          m.subtipoOperativo === "GASTO_OPERATIVO" &&
          m.fecha >= mesStart &&
          m.fecha < mesEnd,
      )
    : [];

  return (
    <div className="flex flex-col gap-8">
      <header>
        <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em]">General</p>
        <h1 className="text-4xl font-black text-slate-900 tracking-tight">Análisis</h1>
        <p className="text-sm text-slate-400 font-medium mt-1">Resumen del mes {mesActual}</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Resultado Cambio */}
        <Card title="Resultado de Cambio — Mes Actual">
          {!cambio ? (
            <p className="text-sm text-slate-400 italic">Sin datos suficientes</p>
          ) : (
            <div className="flex flex-col gap-3">
              {(["USD", "EUR", "BRL"] as const).map((m) => {
                const r = cambio[m];
                if (Number(r.netoDivisa) === 0 && r.resultado === 0) return null;
                return (
                  <div key={m} className="flex items-center justify-between border-b border-slate-50 pb-2 last:border-0">
                    <p className="text-xs font-bold text-slate-600 w-10">{m}</p>
                    <div className="flex gap-6">
                      <div className="text-right">
                        <p className="text-[9px] text-slate-400 uppercase font-bold">Neto divisa</p>
                        <p className="text-sm font-black tabular-nums text-slate-700">
                          {Number(r.netoDivisa) >= 0 ? "+" : ""}{fmt(Number(r.netoDivisa))}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[9px] text-slate-400 uppercase font-bold">Resultado USD</p>
                        <p className={`text-sm font-black tabular-nums ${r.resultado >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                          {r.resultado >= 0 ? "+" : ""}USD {fmt(r.resultado)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                <p className="text-xs font-black text-slate-700 uppercase tracking-widest">Total mes</p>
                <p className={`text-xl font-black tabular-nums ${cambio.totalUSD >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                  {cambio.totalUSD >= 0 ? "+" : ""}USD {fmt(cambio.totalUSD)}
                </p>
              </div>
            </div>
          )}
        </Card>

        {/* Operaciones del mes */}
        <Card title="Operaciones — Mes Actual">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Rulos Bolsa</p>
              {!rulos ? (
                <p className="text-xs text-slate-400 italic">—</p>
              ) : (
                <>
                  <p className={`text-lg font-black tabular-nums ${rulos.usd >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                    {rulos.usd >= 0 ? "+" : ""}USD {fmt(rulos.usd)}
                  </p>
                  {rulos.ars !== 0 && (
                    <p className="text-xs text-slate-500 tabular-nums">$ {fmt(rulos.ars)}</p>
                  )}
                </>
              )}
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Div / Intereses</p>
              {!div ? (
                <p className="text-xs text-slate-400 italic">—</p>
              ) : (
                <p className="text-lg font-black tabular-nums text-emerald-600">
                  USD {fmt(div.totalEquivalenteUSD)}
                </p>
              )}
            </div>
          </div>
        </Card>

        {/* Top clientes por volumen */}
        <Card title="Top Clientes por Volumen (Cambio)">
          {topClientes.length === 0 ? (
            <p className="text-sm text-slate-400 italic">Sin datos suficientes</p>
          ) : (
            <div className="flex flex-col gap-0.5">
              {topClientes.map(([cliente, data], idx) => (
                <div key={cliente} className="flex items-center justify-between py-1.5 border-b border-slate-50 last:border-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black text-slate-300 w-5 tabular-nums">{idx + 1}</span>
                    <p className="text-xs font-medium text-slate-700">{cliente}</p>
                  </div>
                  <div className="flex gap-4 text-right">
                    <div>
                      <p className="text-[9px] text-slate-400">ops</p>
                      <p className="text-xs font-bold text-slate-800 tabular-nums">{data.ops}</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-slate-400">vol USD</p>
                      <p className="text-xs font-bold text-slate-800 tabular-nums">{fmt(data.volumen)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Gastos operativos */}
        <Card title="Gastos Operativos — Mes Actual">
          {!movs ? (
            <p className="text-sm text-slate-400 italic">Sin datos suficientes</p>
          ) : gastos.length === 0 ? (
            <p className="text-sm text-slate-400 italic">Sin gastos registrados este mes</p>
          ) : (
            <div className="flex flex-col gap-0.5">
              {gastos.slice(0, 15).map((g) => (
                <div key={g.id} className="flex items-center justify-between py-1.5 border-b border-slate-50 last:border-0">
                  <p className="text-xs text-slate-600 truncate max-w-[60%]">{g.descripcion}</p>
                  <p className="text-xs font-bold tabular-nums text-red-600">
                    -{g.moneda === "ARS" ? "$" : "USD"} {fmt(g.monto)}
                  </p>
                </div>
              ))}
              <div className="flex items-center pt-2 border-t border-slate-200 mt-1">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  {gastos.length} registro{gastos.length !== 1 ? "s" : ""}
                </p>
              </div>
            </div>
          )}
        </Card>

      </div>
    </div>
  );
}
