import { InteresesTable } from "@/components/modules/clientes/InteresesTable";
import { getClientes } from "@/lib/data/cliente";
import { soloPFActivos } from "@/lib/data/plazo-fijo";
import { calcularInteresPF } from "@/lib/services/intereses.service";
import { previewInteresPendienteCC, tasaCCDecimal } from "@/lib/cc/integridad";
import { calcularDiasEntreFechas } from "@/lib/services/intereses.service";
import { aplicarTodosInteresesCC } from "@/app/(dashboard)/clientes/actions";
import { readOnlyPreview } from "@/lib/config";

function fmtNum(n: number) {
  return n.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default async function InteresesPage() {
  const clientes = await getClientes();

  const hoy = new Date();

  const ccItems = clientes.flatMap((cliente) => {
    // tasaCC is stored as decimal (0.045 for 4.5%). Legacy data may have it as percent (4.5).
    const tasaCC = tasaCCDecimal(cliente.tasaCC);
    const tasaCCPct = Number(tasaCC.toString()) * 100;

    return (cliente.CuentaCorriente ?? []).flatMap((cuenta) => {
      const movimientos = cuenta.MovimientoCC ?? [];
      if (movimientos.length === 0) return [];

      // MACRO 4: vista previa del interés PENDIENTE con la misma fórmula que aplica el
      // servidor (saldo canónico al inicio del período, todos los movimientos, desde
      // lo ya liquidado). El monto mostrado no viaja: el servidor lo recalcula al aplicar.
      const p = previewInteresPendienteCC(movimientos, tasaCC, hoy);
      if (p.dias === 0) return [];
      const ultimo = p.periodos[p.periodos.length - 1];

      return [
        {
          cliente: cliente.nombre,
          tipo: "CC" as const,
          base: (ultimo?.saldo ?? p.saldoInicial).toFixed(2),
          tasa: tasaCCPct.toLocaleString("es-AR", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }) + "%",
          dias: p.dias,
          calculado: p.interesTotal.toFixed(2),
          aplicado: p.interesTotal.toFixed(2),
          nuevoSaldo: cuenta.saldo.add(p.interesTotal.toDecimalPlaces(2)).toFixed(2),
          cuentaId: cuenta.id,
          puedeAplicar: p.interesTotal.toDecimalPlaces(2).gt(0),
        },
      ];
    });
  });

  const pfItems = clientes.flatMap((cliente) =>
    soloPFActivos(cliente.PlazoFijo ?? []).map((pf) => {
      const dias = calcularDiasEntreFechas(pf.fechaInicio, pf.fechaVencimiento);
      // tasaAnual stored as percent (4.5 for 4.5%); formula expects decimal
      const interes = calcularInteresPF({
        capital: pf.capital,
        tasa: pf.tasaAnual.div(100),
        fechaInicio: pf.fechaInicio,
        fechaVencimiento: pf.fechaVencimiento,
      });

      return {
        cliente: cliente.nombre,
        tipo: "PF" as const,
        base: pf.capital.toString(),
        tasa: Number(pf.tasaAnual.toString()).toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + "%",
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
    ccAplicables.map((r) => ({ cuentaId: r.cuentaId }))
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
