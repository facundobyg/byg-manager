import Link from "next/link";
import { getResumenConsolidado, getBalanceGeneral, getExposicionPorMoneda, getExposicionPorCliente } from "@/lib/data/reportes";
import { getPlazosFijosVencimientos } from "@/lib/data/plazos-fijos";

const ACCESOS = [
  { href: "/pendientes",  title: "Pendientes",  desc: "CC negativas, PF vencidos y próximos a vencer."  },
  { href: "/reportes",    title: "Reportes",    desc: "Balance general, exposición por moneda y cliente." },
  { href: "/caja",        title: "Caja",        desc: "Movimientos, saldos y confirmaciones de caja."    },
  { href: "/clientes",    title: "Clientes",    desc: "Gestión de clientes, CC y plazos fijos."          },
  { href: "/operaciones", title: "Operaciones", desc: "Carga y seguimiento de operaciones del día."      },
  { href: "/backup",      title: "Backup",      desc: "Exportar, analizar y restaurar datos del sistema." },
] as const;

function SummaryCard({ label, value, alert }: { label: string; value: string; alert?: boolean }) {
  return (
    <div className={`bg-byg-surface rounded-xl border p-4 flex flex-col gap-1 ${alert ? "border-red-500/40" : "border-byg-border"}`}>
      <p className="text-[10px] font-black uppercase tracking-widest text-byg-muted">{label}</p>
      <p className={`text-2xl font-black tabular-nums ${alert ? "text-red-400" : "text-byg-text"}`}>{value}</p>
    </div>
  );
}

const fmtUSD = (n: number) =>
  `USD ${new Intl.NumberFormat("es-AR", { maximumFractionDigits: 0 }).format(n)}`;

export default async function DashboardPage() {
  const [resumenRes, balanceRes, monedaRes, clientesRes, pfRes] = await Promise.allSettled([
    getResumenConsolidado(),
    getBalanceGeneral(),
    getExposicionPorMoneda(),
    getExposicionPorCliente(),
    getPlazosFijosVencimientos(),
  ]);

  const resumen  = resumenRes.status  === "fulfilled" ? resumenRes.value  : null;
  const balance  = balanceRes.status  === "fulfilled" ? balanceRes.value  : null;
  const monedas  = monedaRes.status   === "fulfilled" ? monedaRes.value   : null;
  const clientes = clientesRes.status === "fulfilled" ? clientesRes.value : null;
  const pfs      = pfRes.status       === "fulfilled" ? pfRes.value       : null;

  const pfVencidos      = pfs      ? pfs.filter((p) => p.estado === "VENCIDO").length : null;
  const ccNegativas     = clientes ? clientes.filter((c) => c.ccSaldo < 0).length     : null;
  const monedaDominante = monedas  && monedas.length > 0  ? monedas[0].moneda          : null;
  const clienteMayorExp = clientes && clientes.length > 0 ? clientes[0].clienteNombre  : null;

  const posiciones = resumen
    ? resumen.totalPosicionesCartera + resumen.totalPosicionesCustodia
    : null;

  return (
    <div className="flex flex-col gap-8">
      <header>
        <p className="text-[10px] font-black text-byg-accent uppercase tracking-[0.3em]">General</p>
        <h1 className="text-4xl font-black text-byg-text tracking-tight">Inicio</h1>
        <p className="text-sm text-byg-muted font-medium mt-1">Panel operativo</p>
      </header>

      <section className="flex flex-col gap-3">
        <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-byg-muted">Resumen operativo</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <SummaryCard label="Clientes activos" value={resumen ? String(resumen.totalClientes) : "—"} />
          <SummaryCard
            label="CC negativas"
            value={ccNegativas !== null ? String(ccNegativas) : "—"}
            alert={ccNegativas !== null && ccNegativas > 0}
          />
          <SummaryCard label="PF activos"  value={resumen    ? String(resumen.totalPlazosFijos) : "—"} />
          <SummaryCard
            label="PF vencidos"
            value={pfVencidos !== null ? String(pfVencidos) : "—"}
            alert={pfVencidos !== null && pfVencidos > 0}
          />
          <SummaryCard label="Posiciones"  value={posiciones !== null ? String(posiciones) : "—"} />
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-byg-muted">Estado operativo</h2>
        <div className="bg-byg-surface rounded-xl border border-byg-border p-5 grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="flex flex-col gap-1">
            <p className="text-[10px] font-black uppercase tracking-widest text-byg-muted">Patrimonio neto</p>
            <p className="text-xl font-black text-byg-text tabular-nums">
              {balance ? fmtUSD(balance.patrimonioNeto) : "—"}
            </p>
          </div>
          <div className="flex flex-col gap-1">
            <p className="text-[10px] font-black uppercase tracking-widest text-byg-muted">Moneda dominante</p>
            <p className="text-xl font-black text-byg-text">{monedaDominante ?? "—"}</p>
          </div>
          <div className="flex flex-col gap-1">
            <p className="text-[10px] font-black uppercase tracking-widest text-byg-muted">Mayor exposición</p>
            <p className="text-xl font-black text-byg-text truncate">{clienteMayorExp ?? "—"}</p>
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-byg-muted">Accesos rápidos</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {ACCESOS.map(({ href, title, desc }) => (
            <Link
              key={href}
              href={href}
              className="bg-byg-surface rounded-xl border border-byg-border p-5 flex flex-col gap-2 hover:border-byg-accent hover:bg-byg-surface-2 transition-all group"
            >
              <p className="text-sm font-black text-byg-text group-hover:text-byg-accent transition-colors">
                {title}
              </p>
              <p className="text-xs text-byg-muted font-medium leading-relaxed flex-1">{desc}</p>
              <p className="text-[10px] font-black text-byg-accent uppercase tracking-widest mt-1">
                Abrir →
              </p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
