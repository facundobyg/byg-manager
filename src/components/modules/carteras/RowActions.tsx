"use client";

import { useState, useCallback } from "react";
import { Edit2, ArrowRightLeft, UserPlus, Trash2 } from "lucide-react";
import { CategoriaActivo } from "@prisma/client";
import { EditarPosicionForm }    from "./EditarPosicionForm";
import { CambiarCategoriaForm }  from "./CambiarCategoriaForm";
import { AsignarCustodiaForm }   from "./AsignarCustodiaForm";
import { EliminarPosicionButton } from "./EliminarPosicionButton";

type Panel = "editar" | "categoria" | "custodia" | "eliminar" | null;

type Cliente = { id: string; nombre: string };

type Props = {
  posicionId:        string;
  activoId:          string;
  carteraSlug:       string;
  ticker:            string;
  categoriaActual:   CategoriaActivo;
  cantidadActual:    number;
  precioCompraActual: number;
  clientes:          Cliente[];
};

const btnCls =
  "p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors disabled:opacity-30";

export function RowActions({
  posicionId,
  activoId,
  carteraSlug,
  ticker,
  categoriaActual,
  cantidadActual,
  precioCompraActual,
  clientes,
}: Props) {
  const [panel, setPanel] = useState<Panel>(null);

  const close = useCallback(() => setPanel(null), []);

  const toggle = (p: Panel) => setPanel((prev) => (prev === p ? null : p));

  return (
    <div className="relative flex items-center gap-0.5">
      <button
        title="Editar posición"
        onClick={() => toggle("editar")}
        className={btnCls}
      >
        <Edit2 size={12} />
      </button>
      <button
        title="Cambiar categoría"
        onClick={() => toggle("categoria")}
        className={btnCls}
      >
        <ArrowRightLeft size={12} />
      </button>
      <button
        title="Asignar a custodia"
        onClick={() => toggle("custodia")}
        className={btnCls}
      >
        <UserPlus size={12} />
      </button>
      <button
        title="Eliminar posición"
        onClick={() => toggle("eliminar")}
        className={`${btnCls} hover:text-rose-600`}
      >
        <Trash2 size={12} />
      </button>

      {panel === "editar" && (
        <EditarPosicionForm
          posicionId={posicionId}
          carteraSlug={carteraSlug}
          cantidadActual={cantidadActual}
          precioCompraActual={precioCompraActual}
          onClose={close}
        />
      )}

      {panel === "categoria" && (
        <CambiarCategoriaForm
          activoId={activoId}
          carteraSlug={carteraSlug}
          categoriaActual={categoriaActual}
          onClose={close}
        />
      )}

      {panel === "custodia" && (
        <AsignarCustodiaForm
          posicionId={posicionId}
          carteraSlug={carteraSlug}
          cantidadMax={cantidadActual}
          clientes={clientes}
          onClose={close}
        />
      )}

      {panel === "eliminar" && (
        <EliminarPosicionButton
          posicionId={posicionId}
          carteraSlug={carteraSlug}
          ticker={ticker}
          onClose={close}
        />
      )}
    </div>
  );
}
