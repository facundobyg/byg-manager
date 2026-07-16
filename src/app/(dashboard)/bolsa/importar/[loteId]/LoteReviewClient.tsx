"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  actualizarFilaAction,
  excluirFilaAction,
  restaurarFilaAction,
  marcarDuplicadoLegitimoAction,
  agregarOperacionManualAction,
  enviarLoteAction,
} from "./actions";

// ── Tipos ─────────────────────────────────────────────────────────────────────

export interface SerializedFila {
  id: string;
  estado: string;
  numeroBloque: number | null;
  numeroFila: number | null;
  nombreDetectado: string | null;
  nroComitenteDetectado: string | null;
  tipoOperacionDetectada: string | null;
  comitenteResueltoId: string | null;
  carteraResueltaId: string | null;
  tipoSujeto: string | null;
  conflictoNombre: boolean;
  tipoOperacionResuelta: string | null;
  ticker: string | null;
  moneda: string | null;
  cantidad: string | null;
  precio: string | null;
  montoNetoReferencia: string | null;
  fechaConcertacion: string | null;
  plazo: string | null;
  fechaVencimiento: string | null;
  tasaCaucion: string | null;
  montoCobrarReferencia: string | null;
  montoPagarReferencia: string | null;
  erroresJson: string[];
  warningsJson: string[];
  camposCorregidosJson: { campos?: string[]; observaciones?: string } | null;
  corregidoPorId: string | null;
  confirmadoComoDuplicadoDistinto: boolean;
  fingerprint: string | null;
  updatedAt: string;
}

export interface SerializedLote {
  id: string;
  estado: string;
  origen: string;
  fechaOperativa: string | null;
  totalFilas: number;
  filasListas: number;
  filasConAdvertencia: number;
  filasConError: number;
  filasExcluidas: number;
  filasConfirmadas: number;
  createdAt: string;
}

interface ComitenteOption {
  id: string;
  nombre: string;
  nroComitente: string;
}

interface CarteraOption {
  id: string;
  nombre: string;
}

const TIPO_OP_LABEL: Record<string, string> = {
  COMPRA_BONO: "Compra Bono",
  VENTA_BONO: "Venta Bono",
  COMPRA_ACCION: "Compra Acción",
  VENTA_ACCION: "Venta Acción",
  COMPRA_CEDEAR: "Compra CEDEAR",
  VENTA_CEDEAR: "Venta CEDEAR",
  CAUCION_COLOCADORA: "Caución Colocadora",
  CAUCION_TOMADORA: "Caución Tomadora",
  FUTURO: "Futuro",
  OPCION_CALL: "Opción Call",
  OPCION_PUT: "Opción Put",
  MEP: "MEP",
  SENEBI: "SENEBI",
};

const ESTADO_LABEL: Record<string, string> = {
  DETECTADA: "Detectada",
  RESUELTA: "Resuelta",
  ADVERTENCIA: "Advertencia",
  ERROR: "Error",
  EXCLUIDA: "Excluida",
  LISTA: "Lista",
  ENVIADA: "Enviada",
  APROBADA: "Aprobada",
  RECHAZADA: "Rechazada",
  CONFIRMADA: "Confirmada",
  FALLIDA: "Fallida",
};

const ESTADO_STYLE: Record<string, string> = {
  DETECTADA: "bg-byg-surface-2 text-byg-muted",
  RESUELTA: "bg-byg-accent/10 text-byg-accent",
  ADVERTENCIA: "bg-amber-500/10 text-amber-500",
  ERROR: "bg-red-500/10 text-red-500",
  EXCLUIDA: "bg-byg-surface-2 text-byg-muted line-through",
  LISTA: "bg-emerald-500/10 text-emerald-500",
  ENVIADA: "bg-violet-500/10 text-violet-500",
};

function estadoBadge(estado: string) {
  return (
    <span
      className={`text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-widest ${ESTADO_STYLE[estado] ?? "bg-byg-surface-2 text-byg-muted"}`}
    >
      {ESTADO_LABEL[estado] ?? estado}
    </span>
  );
}

function n(v: string | null): string {
  return v ?? "";
}

// ── Componente principal ──────────────────────────────────────────────────────

export function LoteReviewClient({
  lote,
  filas,
  comitentes,
  carteras,
}: {
  lote: SerializedLote;
  filas: SerializedFila[];
  comitentes: ComitenteOption[];
  carteras: CarteraOption[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [globalMsg, setGlobalMsg] = useState<string | null>(null);

  const [filtroComitente, setFiltroComitente] = useState<string>("TODOS");
  const [filtroEstado, setFiltroEstado] = useState<string>("TODOS");
  const [filtroTipo, setFiltroTipo] = useState<string>("TODOS");
  const [soloErrores, setSoloErrores] = useState(false);
  const [seleccionadas, setSeleccionadas] = useState<Set<string>>(new Set());
  const [mostrarAgregar, setMostrarAgregar] = useState(false);

  const editable = lote.estado === "REVISION_PENDIENTE" || lote.estado === "DEVUELTO";

  const gruposComitente = useMemo(() => {
    const map = new Map<string, string>();
    for (const f of filas) {
      const key = f.comitenteResueltoId ?? f.carteraResueltaId ?? f.nroComitenteDetectado ?? "sin-destino";
      const label = f.nombreDetectado ?? "Sin comitente";
      if (!map.has(key)) map.set(key, label);
    }
    return Array.from(map.entries());
  }, [filas]);

  const filasFiltradas = useMemo(() => {
    return filas.filter((f) => {
      if (soloErrores && f.estado !== "ERROR") return false;
      if (filtroEstado !== "TODOS" && f.estado !== filtroEstado) return false;
      if (filtroTipo !== "TODOS") {
        const esCompra = f.tipoOperacionResuelta?.startsWith("COMPRA");
        const esVenta = f.tipoOperacionResuelta?.startsWith("VENTA");
        const esCaucion = f.tipoOperacionResuelta?.startsWith("CAUCION");
        if (filtroTipo === "COMPRA" && !esCompra) return false;
        if (filtroTipo === "VENTA" && !esVenta) return false;
        if (filtroTipo === "CAUCION" && !esCaucion) return false;
      }
      if (filtroComitente !== "TODOS") {
        const key = f.comitenteResueltoId ?? f.carteraResueltaId ?? f.nroComitenteDetectado ?? "sin-destino";
        if (key !== filtroComitente) return false;
      }
      return true;
    });
  }, [filas, soloErrores, filtroEstado, filtroTipo, filtroComitente]);

  const porComitente = useMemo(() => {
    const map = new Map<string, SerializedFila[]>();
    for (const f of filasFiltradas) {
      const key = f.comitenteResueltoId ?? f.carteraResueltaId ?? f.nroComitenteDetectado ?? "sin-destino";
      const arr = map.get(key) ?? [];
      arr.push(f);
      map.set(key, arr);
    }
    return Array.from(map.entries());
  }, [filasFiltradas]);

  const activasNoExcluidas = filas.filter((f) => f.estado !== "EXCLUIDA");
  const listasParaEnviar = activasNoExcluidas.filter((f) => f.estado === "LISTA");
  const puedeEnviar =
    editable &&
    activasNoExcluidas.length > 0 &&
    activasNoExcluidas.every((f) => f.estado === "LISTA");

  function refrescar() {
    router.refresh();
  }

  function toggleSeleccion(id: string) {
    setSeleccionadas((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function runAction(fn: () => Promise<{ ok: boolean; error?: string }>) {
    setGlobalError(null);
    setGlobalMsg(null);
    startTransition(async () => {
      const result = await fn();
      if (!result.ok) {
        setGlobalError(result.error ?? "No se pudo completar la acción.");
      } else {
        refrescar();
      }
    });
  }

  function excluirSeleccionadas() {
    runAction(async () => {
      for (const id of Array.from(seleccionadas)) {
        const r = await excluirFilaAction(id);
        if (!r.ok) return r;
      }
      setSeleccionadas(new Set());
      return { ok: true };
    });
  }

  function restaurarSeleccionadas() {
    runAction(async () => {
      for (const id of Array.from(seleccionadas)) {
        const r = await restaurarFilaAction(id);
        if (!r.ok) return r;
      }
      setSeleccionadas(new Set());
      return { ok: true };
    });
  }

  function enviarLote() {
    setGlobalError(null);
    setGlobalMsg(null);
    startTransition(async () => {
      const result = await enviarLoteAction(lote.id);
      if (!result.ok) {
        setGlobalError(result.error ?? "No se pudo enviar el lote.");
      } else {
        setGlobalMsg(`${result.totalEnviadas ?? 0} operaciones enviadas a validación.`);
        refrescar();
      }
    });
  }

  const comitentesCount = new Set(
    filas.map((f) => f.comitenteResueltoId ?? f.carteraResueltaId ?? f.nroComitenteDetectado).filter(Boolean),
  ).size;

  return (
    <div className="flex flex-col gap-6">
      {/* ── Header de estadísticas ── */}
      <div className="bg-byg-surface rounded-2xl border border-byg-border p-5 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
        <HeaderStat label="Fecha operativa" value={lote.fechaOperativa ?? "—"} />
        <HeaderStat label="Origen" value={lote.origen === "EXCEL" ? "Excel" : "Imagen"} />
        <HeaderStat label="Comitentes" value={String(comitentesCount)} />
        <HeaderStat label="Total filas" value={String(lote.totalFilas)} />
        <HeaderStat label="Listas" value={String(lote.filasListas)} color="text-emerald-500" />
        <HeaderStat label="Advertencias" value={String(lote.filasConAdvertencia)} color="text-amber-500" />
        <HeaderStat label="Errores" value={String(lote.filasConError)} color="text-red-500" />
        <HeaderStat label="Excluidas" value={String(lote.filasExcluidas)} color="text-byg-muted" />
      </div>

      {!editable && (
        <div className="rounded-xl border border-byg-border bg-byg-surface-2 p-4 text-sm text-byg-muted">
          Este lote está en estado <strong>{lote.estado}</strong> — ya no admite ediciones.
        </div>
      )}

      {globalError && (
        <div className="rounded-xl border border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-800/40 p-4 text-sm text-red-700 dark:text-red-300">
          {globalError}
        </div>
      )}
      {globalMsg && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 dark:bg-emerald-950/20 dark:border-emerald-800/40 p-4 text-sm text-emerald-700 dark:text-emerald-300">
          {globalMsg}
        </div>
      )}

      {/* ── Filtros ── */}
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={filtroComitente}
          onChange={(e) => setFiltroComitente(e.target.value)}
          className="px-3 py-2 rounded-lg border border-byg-border bg-byg-surface text-xs text-byg-text"
        >
          <option value="TODOS">Todos los comitentes</option>
          {gruposComitente.map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>

        <select
          value={filtroEstado}
          onChange={(e) => setFiltroEstado(e.target.value)}
          className="px-3 py-2 rounded-lg border border-byg-border bg-byg-surface text-xs text-byg-text"
        >
          <option value="TODOS">Todos los estados</option>
          {Object.entries(ESTADO_LABEL).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>

        <select
          value={filtroTipo}
          onChange={(e) => setFiltroTipo(e.target.value)}
          className="px-3 py-2 rounded-lg border border-byg-border bg-byg-surface text-xs text-byg-text"
        >
          <option value="TODOS">Todos los tipos</option>
          <option value="COMPRA">Compra</option>
          <option value="VENTA">Venta</option>
          <option value="CAUCION">Caución</option>
        </select>

        <label className="flex items-center gap-1.5 text-xs text-byg-text">
          <input
            type="checkbox"
            checked={soloErrores}
            onChange={(e) => setSoloErrores(e.target.checked)}
          />
          Solo errores
        </label>

        {seleccionadas.size > 0 && editable && (
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-xs text-byg-muted">{seleccionadas.size} seleccionadas</span>
            <button
              type="button"
              disabled={pending}
              onClick={excluirSeleccionadas}
              className="px-3 py-1.5 rounded-lg border border-byg-border text-[11px] font-black uppercase tracking-wider text-byg-muted hover:text-byg-text disabled:opacity-40"
            >
              Excluir
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={restaurarSeleccionadas}
              className="px-3 py-1.5 rounded-lg border border-byg-border text-[11px] font-black uppercase tracking-wider text-byg-muted hover:text-byg-text disabled:opacity-40"
            >
              Restaurar
            </button>
          </div>
        )}
      </div>

      {/* ── Grupos por comitente ── */}
      <div className="flex flex-col gap-4">
        {porComitente.map(([key, filasGrupo]) => (
          <GrupoComitente
            key={key}
            label={filasGrupo[0].nombreDetectado ?? "Sin comitente"}
            filas={filasGrupo}
            editable={editable}
            comitentes={comitentes}
            carteras={carteras}
            seleccionadas={seleccionadas}
            onToggleSeleccion={toggleSeleccion}
            onAction={runAction}
          />
        ))}
        {porComitente.length === 0 && (
          <p className="text-sm text-byg-muted text-center py-8">No hay filas que coincidan con los filtros.</p>
        )}
      </div>

      {/* ── Agregar operación manual ── */}
      {editable && (
        <div className="bg-byg-surface rounded-2xl border border-byg-border p-5">
          {!mostrarAgregar ? (
            <button
              type="button"
              onClick={() => setMostrarAgregar(true)}
              className="px-5 py-2.5 rounded-lg bg-byg-accent text-white text-[11px] font-black uppercase tracking-wider hover:opacity-90 transition-opacity"
            >
              Agregar operación
            </button>
          ) : (
            <AgregarOperacionForm
              loteId={lote.id}
              comitentes={comitentes}
              carteras={carteras}
              fechaOperativa={lote.fechaOperativa}
              onCancel={() => setMostrarAgregar(false)}
              onSaved={() => {
                setMostrarAgregar(false);
                refrescar();
              }}
            />
          )}
        </div>
      )}

      {/* ── Envío a Augusto ── */}
      <div className="bg-byg-surface rounded-2xl border border-byg-border p-5 flex items-center justify-between">
        <div>
          <p className="text-sm text-byg-text font-semibold">
            {listasParaEnviar.length} operación(es) listas para enviar
          </p>
          {!puedeEnviar && editable && (
            <p className="text-[11px] text-byg-muted mt-1">
              Todas las filas no excluidas deben quedar en estado &quot;Lista&quot; (sin errores, revisadas) antes de
              enviar.
            </p>
          )}
        </div>
        <button
          type="button"
          disabled={!puedeEnviar || pending}
          onClick={enviarLote}
          className="px-5 py-2.5 rounded-lg bg-byg-accent text-white text-[11px] font-black uppercase tracking-wider hover:opacity-90 transition-opacity disabled:opacity-30 disabled:cursor-not-allowed"
        >
          Enviar {activasNoExcluidas.length} operaciones a revisión
        </button>
      </div>
    </div>
  );
}

function HeaderStat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-[9px] uppercase tracking-widest text-byg-muted font-bold">{label}</span>
      <span className={`text-sm font-black tabular-nums ${color ?? "text-byg-text"}`}>{value}</span>
    </div>
  );
}

// ── Grupo colapsable por comitente ─────────────────────────────────────────────

function GrupoComitente({
  label,
  filas,
  editable,
  comitentes,
  carteras,
  seleccionadas,
  onToggleSeleccion,
  onAction,
}: {
  label: string;
  filas: SerializedFila[];
  editable: boolean;
  comitentes: ComitenteOption[];
  carteras: CarteraOption[];
  seleccionadas: Set<string>;
  onToggleSeleccion: (id: string) => void;
  onAction: (fn: () => Promise<{ ok: boolean; error?: string }>) => void;
}) {
  const [abierto, setAbierto] = useState(true);
  const conError = filas.filter((f) => f.estado === "ERROR").length;

  return (
    <div className="bg-byg-surface rounded-2xl border border-byg-border overflow-hidden">
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        className="w-full px-5 py-3 flex items-center justify-between bg-byg-surface-2/40"
      >
        <span className="text-[12px] font-bold text-byg-text">
          {label} <span className="text-byg-muted font-normal">({filas.length})</span>
        </span>
        <div className="flex items-center gap-3">
          {conError > 0 && (
            <span className="text-[9px] font-black px-2 py-0.5 rounded bg-red-500/10 text-red-500 uppercase tracking-widest">
              {conError} error{conError > 1 ? "es" : ""}
            </span>
          )}
          <span className="text-byg-muted text-xs">{abierto ? "▲" : "▼"}</span>
        </div>
      </button>
      {abierto && (
        <div className="divide-y divide-byg-border">
          {filas.map((f) => (
            <FilaRow
              key={f.id}
              fila={f}
              editable={editable}
              comitentes={comitentes}
              carteras={carteras}
              seleccionada={seleccionadas.has(f.id)}
              onToggleSeleccion={() => onToggleSeleccion(f.id)}
              onAction={onAction}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Fila individual ────────────────────────────────────────────────────────────

function FilaRow({
  fila,
  editable,
  comitentes,
  carteras,
  seleccionada,
  onToggleSeleccion,
  onAction,
}: {
  fila: SerializedFila;
  editable: boolean;
  comitentes: ComitenteOption[];
  carteras: CarteraOption[];
  seleccionada: boolean;
  onToggleSeleccion: () => void;
  onAction: (fn: () => Promise<{ ok: boolean; error?: string }>) => void;
}) {
  const [editando, setEditando] = useState(false);

  return (
    <div className="px-5 py-3">
      <div className="flex items-center gap-3">
        {editable && fila.estado !== "EXCLUIDA" && (
          <input type="checkbox" checked={seleccionada} onChange={onToggleSeleccion} />
        )}
        <div className="flex-1 grid grid-cols-2 md:grid-cols-6 gap-2 text-[12px]">
          <span className="text-byg-text font-semibold">
            {fila.tipoOperacionResuelta ? TIPO_OP_LABEL[fila.tipoOperacionResuelta] : fila.tipoOperacionDetectada ?? "—"}
          </span>
          <span className="text-byg-muted font-mono">{fila.ticker ?? "—"}</span>
          <span className="text-byg-muted font-mono">{fila.cantidad ?? "—"}</span>
          <span className="text-byg-muted font-mono">{fila.precio ?? "—"}</span>
          <span className="text-byg-muted font-mono">{fila.fechaConcertacion ?? "—"}</span>
          {estadoBadge(fila.estado)}
        </div>
        {editable && (
          <div className="flex items-center gap-2">
            {fila.estado === "EXCLUIDA" ? (
              <button
                type="button"
                onClick={() => onAction(() => restaurarFilaAction(fila.id))}
                className="px-3 py-1 rounded-lg border border-byg-border text-[10px] font-black uppercase tracking-wider text-byg-muted hover:text-byg-text"
              >
                Restaurar
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setEditando((v) => !v)}
                  className="px-3 py-1 rounded-lg border border-byg-border text-[10px] font-black uppercase tracking-wider text-byg-muted hover:text-byg-text"
                >
                  {editando ? "Cerrar" : "Editar"}
                </button>
                <button
                  type="button"
                  onClick={() => onAction(() => excluirFilaAction(fila.id))}
                  className="px-3 py-1 rounded-lg border border-byg-border text-[10px] font-black uppercase tracking-wider text-byg-muted hover:text-red-500"
                >
                  Excluir
                </button>
                <button
                  type="button"
                  onClick={() => onAction(() => marcarDuplicadoLegitimoAction(fila.id))}
                  className="px-3 py-1 rounded-lg border border-byg-border text-[10px] font-black uppercase tracking-wider text-byg-muted hover:text-byg-text"
                  title="Marcar como operación distinta aunque coincida con otra"
                >
                  Duplicado legítimo
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {fila.erroresJson.length > 0 && (
        <p className="text-[11px] text-red-500 mt-1">{fila.erroresJson.join(" · ")}</p>
      )}
      {fila.warningsJson.length > 0 && (
        <p className="text-[11px] text-amber-500 mt-1">{fila.warningsJson.join(" · ")}</p>
      )}
      {fila.conflictoNombre && (
        <p className="text-[11px] text-amber-500 mt-1">
          El nombre detectado (&quot;{fila.nombreDetectado}&quot;) difiere del registrado para este comitente.
        </p>
      )}

      {editando && (
        <FilaEditForm
          fila={fila}
          comitentes={comitentes}
          carteras={carteras}
          onCancel={() => setEditando(false)}
          onSaved={() => setEditando(false)}
          onAction={onAction}
        />
      )}
    </div>
  );
}

// ── Formulario de edición de una fila ─────────────────────────────────────────

const INPUT_CLS =
  "w-full px-2.5 py-1.5 text-[12px] border border-byg-border rounded-lg bg-byg-bg focus:outline-none focus:ring-1 focus:ring-byg-accent/40 text-byg-text";
const LABEL_CLS = "block text-[9px] font-black uppercase tracking-widest text-byg-muted mb-1";

function destinoKey(f: { comitenteResueltoId: string | null; carteraResueltaId: string | null }): string {
  if (f.comitenteResueltoId) return `COMITENTE:${f.comitenteResueltoId}`;
  if (f.carteraResueltaId) return `CARTERA:${f.carteraResueltaId}`;
  return "";
}

function FilaEditForm({
  fila,
  comitentes,
  carteras,
  onCancel,
  onSaved,
  onAction,
}: {
  fila: SerializedFila;
  comitentes: ComitenteOption[];
  carteras: CarteraOption[];
  onCancel: () => void;
  onSaved: () => void;
  onAction: (fn: () => Promise<{ ok: boolean; error?: string }>) => void;
}) {
  const [destino, setDestino] = useState(destinoKey(fila));
  const [tipo, setTipo] = useState(fila.tipoOperacionResuelta ?? "");
  const [ticker, setTicker] = useState(n(fila.ticker));
  const [cantidad, setCantidad] = useState(n(fila.cantidad));
  const [precio, setPrecio] = useState(n(fila.precio));
  const [moneda, setMoneda] = useState(fila.moneda ?? "");
  const [fecha, setFecha] = useState(n(fila.fechaConcertacion));
  const [plazo, setPlazo] = useState(n(fila.plazo));
  const [vencimiento, setVencimiento] = useState(n(fila.fechaVencimiento));
  const [tasa, setTasa] = useState(n(fila.tasaCaucion));
  const [montoNeto, setMontoNeto] = useState(n(fila.montoNetoReferencia));
  const [montoCobrar, setMontoCobrar] = useState(n(fila.montoCobrarReferencia));
  const [montoPagar, setMontoPagar] = useState(n(fila.montoPagarReferencia));
  const [observaciones, setObservaciones] = useState(fila.camposCorregidosJson?.observaciones ?? "");

  function guardar() {
    const [destinoTipo, destinoId] = destino ? (destino.split(":") as ["COMITENTE" | "CARTERA", string]) : [null, null];
    onAction(async () => {
      const result = await actualizarFilaAction(fila.id, {
        destinoTipo,
        destinoId,
        tipoOperacionResuelta: (tipo || null) as never,
        ticker: ticker || null,
        cantidad: cantidad || null,
        precio: precio || null,
        moneda: (moneda || null) as never,
        fechaConcertacion: fecha || null,
        plazo: plazo || null,
        fechaVencimiento: vencimiento || null,
        tasaCaucion: tasa || null,
        montoNetoReferencia: montoNeto || null,
        montoCobrarReferencia: montoCobrar || null,
        montoPagarReferencia: montoPagar || null,
        observaciones: observaciones || null,
      });
      if (result.ok) onSaved();
      return result;
    });
  }

  return (
    <div className="mt-3 p-4 rounded-xl border border-byg-border bg-byg-surface-2/30 grid grid-cols-2 md:grid-cols-4 gap-3">
      <div>
        <label className={LABEL_CLS}>Comitente / Cartera</label>
        <select value={destino} onChange={(e) => setDestino(e.target.value)} className={INPUT_CLS}>
          <option value="">Sin asignar</option>
          <optgroup label="Comitentes">
            {comitentes.map((c) => (
              <option key={c.id} value={`COMITENTE:${c.id}`}>
                {c.nombre} ({c.nroComitente})
              </option>
            ))}
          </optgroup>
          <optgroup label="Carteras">
            {carteras.map((c) => (
              <option key={c.id} value={`CARTERA:${c.id}`}>
                {c.nombre}
              </option>
            ))}
          </optgroup>
        </select>
      </div>
      <div>
        <label className={LABEL_CLS}>Tipo</label>
        <select value={tipo} onChange={(e) => setTipo(e.target.value)} className={INPUT_CLS}>
          <option value="">Sin asignar</option>
          {Object.entries(TIPO_OP_LABEL).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className={LABEL_CLS}>Ticker</label>
        <input value={ticker} onChange={(e) => setTicker(e.target.value)} className={INPUT_CLS} />
      </div>
      <div>
        <label className={LABEL_CLS}>Moneda</label>
        <select value={moneda} onChange={(e) => setMoneda(e.target.value)} className={INPUT_CLS}>
          <option value="">—</option>
          <option value="ARS">ARS</option>
          <option value="USD">USD</option>
          <option value="EUR">EUR</option>
          <option value="BRL">BRL</option>
        </select>
      </div>
      <div>
        <label className={LABEL_CLS}>Cantidad / VN</label>
        <input value={cantidad} onChange={(e) => setCantidad(e.target.value)} className={INPUT_CLS} />
      </div>
      <div>
        <label className={LABEL_CLS}>Precio</label>
        <input value={precio} onChange={(e) => setPrecio(e.target.value)} className={INPUT_CLS} />
      </div>
      <div>
        <label className={LABEL_CLS}>Fecha concertación</label>
        <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} className={INPUT_CLS} />
      </div>
      <div>
        <label className={LABEL_CLS}>Plazo</label>
        <input value={plazo} onChange={(e) => setPlazo(e.target.value)} className={INPUT_CLS} />
      </div>
      <div>
        <label className={LABEL_CLS}>Vencimiento</label>
        <input type="date" value={vencimiento} onChange={(e) => setVencimiento(e.target.value)} className={INPUT_CLS} />
      </div>
      <div>
        <label className={LABEL_CLS}>Tasa caución</label>
        <input value={tasa} onChange={(e) => setTasa(e.target.value)} className={INPUT_CLS} />
      </div>
      <div>
        <label className={LABEL_CLS}>Monto neto</label>
        <input value={montoNeto} onChange={(e) => setMontoNeto(e.target.value)} className={INPUT_CLS} />
      </div>
      <div>
        <label className={LABEL_CLS}>Monto a cobrar</label>
        <input value={montoCobrar} onChange={(e) => setMontoCobrar(e.target.value)} className={INPUT_CLS} />
      </div>
      <div>
        <label className={LABEL_CLS}>Monto a pagar</label>
        <input value={montoPagar} onChange={(e) => setMontoPagar(e.target.value)} className={INPUT_CLS} />
      </div>
      <div className="col-span-2 md:col-span-4">
        <label className={LABEL_CLS}>Observaciones</label>
        <textarea
          value={observaciones}
          onChange={(e) => setObservaciones(e.target.value)}
          rows={2}
          className={INPUT_CLS}
        />
      </div>
      <div className="col-span-2 md:col-span-4 flex gap-2">
        <button
          type="button"
          onClick={guardar}
          className="px-4 py-2 rounded-lg bg-byg-accent text-white text-[11px] font-black uppercase tracking-wider hover:opacity-90"
        >
          Guardar cambios
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 rounded-lg border border-byg-border text-byg-muted text-[11px] font-black uppercase tracking-wider hover:text-byg-text"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}

// ── Agregar operación manual ───────────────────────────────────────────────────

function AgregarOperacionForm({
  loteId,
  comitentes,
  carteras,
  fechaOperativa,
  onCancel,
  onSaved,
}: {
  loteId: string;
  comitentes: ComitenteOption[];
  carteras: CarteraOption[];
  fechaOperativa: string | null;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [destino, setDestino] = useState("");
  const [tipo, setTipo] = useState("COMPRA_ACCION");
  const [ticker, setTicker] = useState("");
  const [cantidad, setCantidad] = useState("");
  const [precio, setPrecio] = useState("");
  const [moneda, setMoneda] = useState("ARS");
  const [fecha, setFecha] = useState(fechaOperativa ?? "");
  const [plazo, setPlazo] = useState("");
  const [tasa, setTasa] = useState("");
  const [observaciones, setObservaciones] = useState("");

  function guardar() {
    setError(null);
    if (!destino) {
      setError("Seleccioná un comitente o cartera de destino.");
      return;
    }
    const [destinoTipo, destinoId] = destino.split(":") as ["COMITENTE" | "CARTERA", string];
    startTransition(async () => {
      const result = await agregarOperacionManualAction(loteId, {
        destinoTipo,
        destinoId,
        tipoOperacionResuelta: tipo as never,
        ticker: ticker || null,
        cantidad: cantidad || null,
        precio: precio || null,
        moneda: (moneda || null) as never,
        fechaConcertacion: fecha,
        plazo: plazo || null,
        tasaCaucion: tasa || null,
        observaciones: observaciones || null,
      });
      if (!result.ok) {
        setError(result.error ?? "No se pudo agregar la operación.");
        return;
      }
      onSaved();
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-[11px] font-black uppercase tracking-widest text-byg-muted">
        Agregar operación no detectada
      </p>
      {error && <p className="text-[12px] text-red-500">{error}</p>}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div>
          <label className={LABEL_CLS}>Comitente / Cartera</label>
          <select value={destino} onChange={(e) => setDestino(e.target.value)} className={INPUT_CLS}>
            <option value="">Seleccionar…</option>
            <optgroup label="Comitentes">
              {comitentes.map((c) => (
                <option key={c.id} value={`COMITENTE:${c.id}`}>
                  {c.nombre} ({c.nroComitente})
                </option>
              ))}
            </optgroup>
            <optgroup label="Carteras">
              {carteras.map((c) => (
                <option key={c.id} value={`CARTERA:${c.id}`}>
                  {c.nombre}
                </option>
              ))}
            </optgroup>
          </select>
        </div>
        <div>
          <label className={LABEL_CLS}>Tipo</label>
          <select value={tipo} onChange={(e) => setTipo(e.target.value)} className={INPUT_CLS}>
            {Object.entries(TIPO_OP_LABEL).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={LABEL_CLS}>Ticker</label>
          <input value={ticker} onChange={(e) => setTicker(e.target.value)} className={INPUT_CLS} />
        </div>
        <div>
          <label className={LABEL_CLS}>Moneda</label>
          <select value={moneda} onChange={(e) => setMoneda(e.target.value)} className={INPUT_CLS}>
            <option value="ARS">ARS</option>
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
            <option value="BRL">BRL</option>
          </select>
        </div>
        <div>
          <label className={LABEL_CLS}>Cantidad / VN</label>
          <input value={cantidad} onChange={(e) => setCantidad(e.target.value)} className={INPUT_CLS} />
        </div>
        <div>
          <label className={LABEL_CLS}>Precio</label>
          <input value={precio} onChange={(e) => setPrecio(e.target.value)} className={INPUT_CLS} />
        </div>
        <div>
          <label className={LABEL_CLS}>Fecha concertación</label>
          <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} className={INPUT_CLS} />
        </div>
        <div>
          <label className={LABEL_CLS}>Plazo</label>
          <input value={plazo} onChange={(e) => setPlazo(e.target.value)} className={INPUT_CLS} />
        </div>
        <div>
          <label className={LABEL_CLS}>Tasa caución</label>
          <input value={tasa} onChange={(e) => setTasa(e.target.value)} className={INPUT_CLS} />
        </div>
        <div className="col-span-2 md:col-span-4">
          <label className={LABEL_CLS}>Observaciones</label>
          <textarea
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
            rows={2}
            className={INPUT_CLS}
          />
        </div>
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          disabled={pending}
          onClick={guardar}
          className="px-4 py-2 rounded-lg bg-byg-accent text-white text-[11px] font-black uppercase tracking-wider hover:opacity-90 disabled:opacity-40"
        >
          {pending ? "Guardando..." : "Agregar"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 rounded-lg border border-byg-border text-byg-muted text-[11px] font-black uppercase tracking-wider hover:text-byg-text"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
