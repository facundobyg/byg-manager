import Link from "next/link";
import { ChevronLeft, CandlestickChart } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { NuevaOpForm } from "@/components/modules/bolsa/NuevaOpForm";

export default async function NuevaBolsaPage() {
  const [comitentes, carteras, activos] = await Promise.all([
    prisma.comitenteInversion.findMany({
      where:   { activo: true },
      select:  { id: true, nombre: true, nroComitente: true, productor: true },
      orderBy: { nroComitente: "asc" },
    }),
    prisma.cartera.findMany({
      where: {
        activa: true,
        tipo: { not: "CRIPTO" },
        slug: { not: "binance" },
      },
      select:  { id: true, nombre: true, comitenteNumber: true },
      orderBy: { nombre: "asc" },
    }),
    prisma.activo.findMany({
      select:  { ticker: true, categoria: true },
      orderBy: { ticker: "asc" },
    }),
  ]);

  const comitentesMapped = comitentes.map(c => ({
    id: c.id,
    nombre: `${c.nombre} (${c.nroComitente}) — ${c.productor}`
  }));

  const carterasMapped = carteras.map(c => ({
    id: c.id,
    nombre: c.comitenteNumber ? `${c.nombre} (${c.comitenteNumber})` : c.nombre
  }));

  return (
    <div className="flex flex-col gap-8 max-w-2xl">
      <Link
        href="/bolsa"
        className="flex items-center gap-1 text-byg-muted hover:text-byg-accent text-[10px] font-black uppercase tracking-widest transition-colors group w-fit"
      >
        <ChevronLeft size={13} className="group-hover:-translate-x-0.5 transition-transform" />
        Operaciones Bolsa
      </Link>

      <header className="flex items-center gap-4">
        <div className="p-3 bg-byg-accent text-white rounded-xl shrink-0">
          <CandlestickChart size={22} />
        </div>
        <div>
          <p className="text-[10px] font-black text-byg-accent uppercase tracking-widest mb-0.5">Nueva Operación</p>
          <h1 className="text-2xl font-black text-byg-text tracking-tight">Carga — Paso 1</h1>
        </div>
      </header>

      <NuevaOpForm
        comitentes={comitentesMapped}
        carteras={carterasMapped}
        activos={activos}
      />
    </div>
  );
}
