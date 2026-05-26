// EXPERIMENTAL: removable operational topbar widget

import { getTopbarOperationalSummary, type TopbarSummary } from "@/lib/data/topbar";

function fmtUSD(n: number) {
  if (n === null || n === undefined) return "—";
  const abs = Math.abs(n).toLocaleString("es-AR", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  return `${n < 0 ? "-" : ""}USD ${abs}`;
}

function fmtARS(n: number) {
  if (n === null || n === undefined) return "—";
  const abs = Math.abs(n).toLocaleString("es-AR", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  return `${n < 0 ? "-" : ""}$ ${abs}`;
}

function Sep() {
  return <div className="w-px h-6 bg-byg-border shrink-0" />;
}

function Bloque({ label, usd, ars }: { label: string; usd: number; ars: number }) {
  return (
    <div className="flex flex-col leading-none min-w-0">
      <span className="text-[8px] font-black uppercase tracking-[0.12em] text-byg-muted mb-0.5">{label}</span>
      <span className={`text-[10px] font-black font-mono tabular-nums ${usd < 0 ? "text-rose-400" : "text-byg-text"}`}>{fmtUSD(usd)}</span>
      <span className={`text-[9px] font-mono tabular-nums mt-px ${ars < 0 ? "text-rose-400" : "text-byg-muted"}`}>{fmtARS(ars)}</span>
    </div>
  );
}

function BloqueCount({ label, count, color = "text-byg-text" }: { label: string; count: number; color?: string }) {
  return (
    <div className="flex flex-col leading-none">
      <span className="text-[8px] font-black uppercase tracking-[0.12em] text-byg-muted mb-0.5">{label}</span>
      <span className={`text-[13px] font-black tabular-nums ${color}`}>{count}</span>
    </div>
  );
}

function TopbarCajaResumenDisplay({ summary, userRole }: { summary: TopbarSummary; userRole?: string | null }) {
  const isAdmin = userRole === "ADMIN";
  const isSocio = userRole === "SOCIO";
  const isEmpleado = userRole === "EMPLEADO";

  if (!isAdmin && !isSocio && !isEmpleado) return null;

  return (
    <div className="hidden lg:flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-byg-surface border border-byg-border h-10 shrink-0">
      {/* Admin / Socio: Oficina → Trenque → Total → Pendientes */}
      {(isAdmin || isSocio) && (
        <>
          {summary.cajaOficina && (
            <>
              <Bloque label="Oficina" usd={summary.cajaOficina.usd} ars={summary.cajaOficina.ars} />
              <Sep />
            </>
          )}
          {summary.cajaTrenque && (
            <>
              <Bloque label="Trenque" usd={summary.cajaTrenque.usd} ars={summary.cajaTrenque.ars} />
              <Sep />
            </>
          )}
          <Bloque label="Total" usd={summary.totalUSD} ars={summary.totalARS} />
          {summary.pendientesCount > 0 && (
            <>
              <Sep />
              <BloqueCount label="Pendientes" count={summary.pendientesCount} color="text-amber-400" />
            </>
          )}
        </>
      )}

      {/* Empleado: Ops hoy → Pendientes → Total USD resumido */}
      {isEmpleado && (
        <>
          <BloqueCount label="Ops hoy" count={summary.opsDiaCount} />
          {summary.pendientesCount > 0 && (
            <>
              <Sep />
              <BloqueCount label="Pendientes" count={summary.pendientesCount} color="text-amber-400" />
            </>
          )}
          <Sep />
          <div className="flex flex-col leading-none">
            <span className="text-[8px] font-black uppercase tracking-[0.12em] text-byg-muted mb-0.5">Total</span>
            <span className={`text-[10px] font-black font-mono tabular-nums ${summary.totalUSD < 0 ? "text-rose-400" : "text-byg-text"}`}>{fmtUSD(summary.totalUSD)}</span>
          </div>
        </>
      )}
    </div>
  );
}

export async function TopbarCajaResumenServer({ userRole }: { userRole?: string | null }) {
  try {
    const summary = await getTopbarOperationalSummary();
    return <TopbarCajaResumenDisplay summary={summary} userRole={userRole} />;
  } catch {
    return null;
  }
}
