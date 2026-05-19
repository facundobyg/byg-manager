import { InteresesTable } from "@/components/modules/clientes/InteresesTable";
import { getClientes } from "@/lib/data/cliente";
import { calcularInteresCCRealista, calcularInteresPF } from "@/lib/services/intereses.service";
import { calcularDiasEntreFechas } from "@/lib/services/intereses.service";
import { aplicarTodosInteresesCC } from "@/app/(dashboard)/clientes/actions";
import { readOnlyPreview } from "@/lib/config";

function fmtNum(n: number) {
  return n.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default async function InteresesPage() {
  const clientes = await getClientes();

  const hoy = new Date();
  const inicioMes = new Date(Date.UTC(hoy.getFullYear(), hoy.getMonth(), 1));

  const ccItems = clientes.flatMap((cliente) =>
    (cliente.CuentaCorriente ?? []).flatMap((cuenta) => {
      const movimientos = cuenta.MovimientoCC ?? [];
      if (movimientos.length === 0) return [];

      const { periodos } = calcularInteresCCRealista({
        movimientos: movimientos.map((m) => ({
          fecha: m.fecha,
          tipo: m.tipo,
          monto: m.monto,
        })),
        tasa: cliente.tasaCC,
        fechaInicio: inicioMes,
        fechaFin: hoy,
        saldoInicial: cuenta.saldo,
      });

      if (periodos.length === 0) return [];

      const periodo = periodos[periodos.length - 1];

      return [
        {
          cliente: cliente.nombre,
          tipo: "CC" as const,
          base: periodo.saldo.toFixed(2),
          tasa: Number(cliente.tasaCC.toString()).toLocaleString("es-AR", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }) + "%",
          dias: periodo.dias,
          calculado: periodo.interes.toFixed(2),
          aplicado: periodo.interes.toFixed(2),
          nuevoSaldo: periodo.saldo.add(periodo.interes).toFixed(2),
          cuentaId: cuenta.id,
          puedeAplicar: true,
        },
      ];
    })
  );

  const pfItems = clientes.flatMap((cliente) =>
    (cliente.PlazoFijo ?? []).map((pf) => {
      const dias = calcularDiasEntreFechas(pf.fechaInicio, pf.fechaVencimiento);
      const interes = calcularInteresPF({
        capital: pf.capital,
        tasa: pf.tasaAnual,
        fechaInicio: pf.fechaInicio,
        fechaVencimiento: pf.fechaVencimiento,
      });

      return {
        cliente: cliente.nombre,
        tipo: "PF" as const,
        base: pf.capital.toString(),
        tasa: pf.tasaAnual.toString(),
        dias,
        calculado: interes.toFixed(2),
        aplicado: interes.toFixed(2),
        nuevoSaldo: pf.saldoActual.toString(),
        puedeAplicar: false,
      };
    })
  );

  const items = [...ccItems, ...pfItems];

  // Filter from ccItems directly so TypeScript knows cuentaId is present
  const ccAplicables = ccItems.filter((r) => r.puedeAplicar);
  const totalCalculado = items.reduce((s, r) => s + parseFloat(r.calculado), 0);
  const totalAplicado = items.reduce((s, r) => s + parseFloat(r.aplicado), 0);

  const batchPayload = JSON.stringify(
    ccAplicables.map((r) => ({
      cuentaId: r.cuentaId,
      montoAplicado: r.aplicado,
      descripcion: "Interés CC",
    }))
  );

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-1">
        <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em]">Liquidaciones</p>
        <h1 className="text-4xl font-black text-slate-900 tracking-tight">Intereses a liquidar</h1>
        <p className="text-sm text-slate-400 font-medium">Vista global de intereses calculados</p>
        {readOnlyPreview && (
          <span className="self-start text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-full bg-amber-100 text-amber-700">
            Modo lectura
          </span>
        )}
      </header>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        {[
          { label: "Total filas", value: items.length.toString(), color: "text-slate-900" },
          { label: "CC aplicables", value: ccAplicables.length.toString(), color: "text-blue-600" },
          { label: "PF", value: pfItems.length.toString(), color: "text-purple-600" },
          { label: "Int. calculado", value: fmtNum(totalCalculado), color: "text-slate-700" },
          { label: "Int. aplicado", value: fmtNum(totalAplicado), color: "text-green-600" },
        ].map((card) => (
          <div key={card.label} className="rounded-xl border border-slate-100 bg-white p-4 flex flex-col gap-1">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{card.label}</p>
            <p className={`text-xl font-black tabular-nums ${card.color}`}>{card.value}</p>
          </div>
        ))}
      </div>

      {!readOnlyPreview && (
        <form
          action={async (fd: FormData) => {
            "use server";
            await aplicarTodosInteresesCC(fd);
          }}
          className="flex items-center gap-3"
        >
          <input type="hidden" name="payload" value={batchPayload} />
          <button
            type="submit"
            disabled={ccAplicables.length === 0}
            className="bg-slate-900 text-white text-xs font-black uppercase tracking-widest rounded-lg px-4 py-2.5 hover:bg-blue-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Aplicar todos CC ({ccAplicables.length})
          </button>
        </form>
      )}

      <InteresesTable items={items} />
    </div>
  );
}
