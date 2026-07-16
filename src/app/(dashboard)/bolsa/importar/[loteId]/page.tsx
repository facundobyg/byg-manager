import { notFound } from "next/navigation";
import Link from "next/link";
import { requirePermission } from "@/lib/auth/permissions";
import { getLoteReview } from "./lote-review";
import { LoteReviewClient } from "./LoteReviewClient";

type PageProps = { params: Promise<{ loteId: string }> };

export default async function LoteReviewPage({ params }: PageProps) {
  await requirePermission("bolsa:crear");
  const { loteId } = await params;

  const data = await getLoteReview(loteId);
  if (!data) notFound();

  const { lote, comitentes, carteras } = data;

  const filas = lote.Filas.map((f) => ({
    id: f.id,
    estado: f.estado,
    numeroBloque: f.numeroBloque,
    numeroFila: f.numeroFila,
    nombreDetectado: f.nombreDetectado,
    nroComitenteDetectado: f.nroComitenteDetectado,
    tipoOperacionDetectada: f.tipoOperacionDetectada,
    comitenteResueltoId: f.comitenteResueltoId,
    carteraResueltaId: f.carteraResueltaId,
    tipoSujeto: f.tipoSujeto,
    conflictoNombre: f.conflictoNombre,
    tipoOperacionResuelta: f.tipoOperacionResuelta,
    ticker: f.ticker,
    moneda: f.moneda,
    cantidad: f.cantidad != null ? f.cantidad.toString() : null,
    precio: f.precio != null ? f.precio.toString() : null,
    montoNetoReferencia: f.montoNetoReferencia != null ? f.montoNetoReferencia.toString() : null,
    fechaConcertacion: f.fechaConcertacion ? f.fechaConcertacion.toISOString().slice(0, 10) : null,
    plazo: f.plazo,
    fechaVencimiento: f.fechaVencimiento ? f.fechaVencimiento.toISOString().slice(0, 10) : null,
    tasaCaucion: f.tasaCaucion != null ? f.tasaCaucion.toString() : null,
    montoCobrarReferencia: f.montoCobrarReferencia != null ? f.montoCobrarReferencia.toString() : null,
    montoPagarReferencia: f.montoPagarReferencia != null ? f.montoPagarReferencia.toString() : null,
    erroresJson: Array.isArray(f.erroresJson) ? (f.erroresJson as string[]) : [],
    warningsJson: Array.isArray(f.warningsJson) ? (f.warningsJson as string[]) : [],
    camposCorregidosJson:
      f.camposCorregidosJson && typeof f.camposCorregidosJson === "object"
        ? (f.camposCorregidosJson as { campos?: string[]; observaciones?: string })
        : null,
    corregidoPorId: f.corregidoPorId,
    confirmadoComoDuplicadoDistinto: f.confirmadoComoDuplicadoDistinto,
    fingerprint: f.fingerprint,
    updatedAt: f.updatedAt.toISOString(),
  }));

  const loteSerializado = {
    id: lote.id,
    estado: lote.estado,
    origen: lote.origen,
    fechaOperativa: lote.fechaOperativa ? lote.fechaOperativa.toISOString().slice(0, 10) : null,
    totalFilas: lote.totalFilas,
    filasListas: lote.filasListas,
    filasConAdvertencia: lote.filasConAdvertencia,
    filasConError: lote.filasConError,
    filasExcluidas: lote.filasExcluidas,
    filasConfirmadas: lote.filasConfirmadas,
    createdAt: lote.createdAt.toISOString(),
  };

  return (
    <div className="flex flex-col gap-6 pb-20">
      <header className="flex flex-col gap-3">
        <Link
          href="/bolsa/importar"
          className="text-[10px] font-black uppercase tracking-[0.3em] text-byg-accent hover:opacity-80 transition-opacity"
        >
          ← Importar operaciones
        </Link>
        <h1 className="text-3xl font-black text-byg-text tracking-tight">Revisión del lote</h1>
      </header>

      <LoteReviewClient
        lote={loteSerializado}
        filas={filas}
        comitentes={comitentes}
        carteras={carteras}
      />
    </div>
  );
}
