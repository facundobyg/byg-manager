import Link from "next/link";
import { requirePermission } from "@/lib/auth/permissions";
import { getTCBlue, getTCMep, getMesActivo, getSocios, getTCHistorial, getProductoresConfig, getAlycConfig } from "@/lib/services/config.service";
import { TcBlueForm } from "@/components/modules/configuracion/TcBlueForm";
import { TcMepForm } from "@/components/modules/configuracion/TcMepForm";
import { MesActivoForm } from "@/components/modules/configuracion/MesActivoForm";
import { SociosForm } from "@/components/modules/configuracion/SociosForm";
import { EditCarteraForm } from "@/components/modules/configuracion/EditCarteraForm";
import { CreateCarteraForm } from "@/components/modules/configuracion/CreateCarteraForm";
import { ProductoresForm } from "@/components/modules/configuracion/ProductoresForm";
import { AlycForm } from "@/components/modules/configuracion/AlycForm";
import { Decimal } from "@prisma/client/runtime/library";
import { prisma } from "@/lib/prisma";

import { EditCajaForm } from "@/components/modules/configuracion/EditCajaForm";
import { CreateCajaForm } from "@/components/modules/configuracion/CreateCajaForm";

function fmt(n: string | null) {
  if (!n) return "—";
  return Number(new Decimal(n)).toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 6 });
}

function fmtMes(mes: string) {
  const [y, m] = mes.split("-");
  const nombre = new Date(Number(y), Number(m) - 1, 1).toLocaleDateString("es-AR", { month: "long", year: "numeric" });
  return nombre.charAt(0).toUpperCase() + nombre.slice(1);
}

export default async function ConfiguracionPage() {
  await requirePermission("configuracion:leer");
  const [tcBlueConfig, tcMepConfig, mesActivo, socios, tcHistorial, carteras, productores, cajas, alycs] = await Promise.all([
    getTCBlue(),
    getTCMep(),
    getMesActivo(),
    getSocios(),
    getTCHistorial(),
    prisma.cartera.findMany({ orderBy: { orden: "asc" } }),
    getProductoresConfig(),
    prisma.caja.findMany({ orderBy: { orden: "asc" } }),
    getAlycConfig(),
  ]);

  return (
    <div className="flex flex-col gap-8 pb-20">
      <header>
        <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em]">Sistema</p>
        <h1 className="text-4xl font-black text-slate-900 tracking-tight">Configuración</h1>
        <p className="text-sm text-slate-400 font-medium mt-1">TC Blue · Mes activo · Socios · Carteras</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* TC Blue */}
        <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col gap-5">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Tipo de cambio blue</p>
            <p className="text-3xl font-black text-slate-900 tabular-nums mt-1">
              {fmt(tcBlueConfig?.valor ?? null)}
              <span className="text-sm font-medium text-slate-400 ml-2">ARS/USD</span>
            </p>
          </div>

          <TcBlueForm valorActual={tcBlueConfig?.valor ?? null} />

          {tcHistorial.length > 0 && (
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Últimos registros</p>
              <div className="divide-y divide-slate-100">
                {tcHistorial.map((tc) => (
                  <div key={tc.id} className="flex justify-between py-1.5 text-xs">
                    <span className="text-slate-500">
                      {new Date(tc.fecha).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "UTC" })}
                    </span>
                    <span className="font-semibold tabular-nums text-slate-800">
                      {Number(tc.valor).toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* TC MEP */}
        <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col gap-5">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Tipo de cambio MEP</p>
            <p className="text-3xl font-black text-slate-900 tabular-nums mt-1">
              {fmt(tcMepConfig?.valor ?? null)}
              <span className="text-sm font-medium text-slate-400 ml-2">ARS/USD</span>
            </p>
            <p className="text-[10px] text-slate-400 mt-1">Usado para conversión Banco Industrial</p>
          </div>
          <TcMepForm valorActual={tcMepConfig?.valor ?? null} />
        </section>

        {/* Mes operativo */}
        <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col gap-5">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Mes operativo</p>
            {mesActivo ? (
              <>
                <p className="text-3xl font-black text-slate-900 mt-1">{fmtMes(mesActivo.mes)}</p>
                <p className="text-xs text-slate-400 mt-0.5 tabular-nums">{mesActivo.mes}</p>
              </>
            ) : (
              <p className="text-sm text-slate-400 italic mt-1">Sin mes activo</p>
            )}
          </div>

          <MesActivoForm mesActual={mesActivo?.mes ?? null} />

          <p className="text-[10px] text-slate-400 leading-relaxed">
            El sistema mostrará por defecto los datos del mes seleccionado. El histórico seguirá disponible navegando hacia atrás en cada módulo.
          </p>
        </section>
      </div>

      {/* Cajas */}
      <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3 bg-slate-50/30">
          <h2 className="text-[12px] font-bold uppercase tracking-widest text-slate-800">Cajas</h2>
          <span className="text-[11px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md tabular-nums">
            {cajas.length}
          </span>
        </div>
        <div className="divide-y divide-slate-100">
          {cajas.map((c) => (
            <div key={c.id} className="px-6 py-3 flex flex-wrap items-center gap-4">
              <div className="w-24 shrink-0">
                <span className="text-[10px] font-black font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                  {c.slug}
                </span>
              </div>
              <EditCajaForm
                id={c.id}
                label={c.label}
                tipo={c.tipo}
                activa={c.activa}
                esPrincipal={c.esPrincipal}
              />
            </div>
          ))}
        </div>
        <CreateCajaForm />
      </section>

      {/* ALYCs */}
      <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3 bg-slate-50/30">
          <h2 className="text-[12px] font-bold uppercase tracking-widest text-slate-800">ALYCs</h2>
          <span className="text-[11px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md tabular-nums">
            {alycs.length}
          </span>
        </div>
        <div className="px-6 py-4">
          <AlycForm alycs={alycs} />
        </div>
      </section>

      {/* Productores */}
      <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3 bg-slate-50/30">
          <h2 className="text-[12px] font-bold uppercase tracking-widest text-slate-800">Productores</h2>
          <span className="text-[11px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md tabular-nums">
            {productores.length}
          </span>
        </div>
        <div className="px-6 py-4">
          <ProductoresForm productores={productores} />
        </div>
      </section>

      {/* Carteras */}
      <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3 bg-slate-50/30">
          <h2 className="text-[12px] font-bold uppercase tracking-widest text-slate-800">Carteras</h2>
          <span className="text-[11px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md tabular-nums">
            {carteras.length}
          </span>
        </div>
        {carteras.length === 0 ? (
          <p className="px-6 py-8 text-sm text-slate-400 italic">Sin carteras. Crea la primera abajo.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {carteras.map((c) => (
              <div key={c.id} className="px-6 py-3 flex flex-wrap items-center gap-4">
                <div className="w-24 shrink-0">
                  <span className="text-[10px] font-black font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                    {c.slug}
                  </span>
                </div>
                <EditCarteraForm
                  id={c.id}
                  nombre={c.nombre}
                  slug={c.slug}
                  tipo={c.tipo}
                  comitenteNumber={c.comitenteNumber}
                  investmentAccountType={c.investmentAccountType}
                  mirrorInInvestmentAccounts={c.mirrorInInvestmentAccounts}
                />
              </div>
            ))}
          </div>
        )}
        <CreateCarteraForm />
      </section>

      {/* Distribución de socios */}
      <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Distribución de socios</p>
        </div>
        {socios.length === 0 ? (
          <p className="px-6 py-8 text-sm text-slate-400 italic">Sin socios cargados</p>
        ) : (
          <SociosForm
            socios={socios.map((s) => ({
              id: s.id,
              nombre: s.nombre,
              porcentaje: Number(s.porcentaje),
              activo: s.activo,
            }))}
          />
        )}
      </section>

      {/* Accesos administrativos */}
      <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/30">
          <h2 className="text-[12px] font-bold uppercase tracking-widest text-slate-800">Administración</h2>
        </div>
        <div className="px-6 py-4 flex flex-wrap gap-4">
          <Link
            href="/permisos?role=SOCIO"
            className="flex items-center gap-3 px-5 py-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-slate-300 transition-all group"
          >
            <div className="flex flex-col">
              <span className="text-[12px] font-bold text-slate-800 group-hover:text-slate-900">Perfiles de socios</span>
              <span className="text-[11px] text-slate-400">Usuarios con rol Socio</span>
            </div>
            <span className="text-slate-400 group-hover:translate-x-0.5 transition-transform">→</span>
          </Link>
          <Link
            href="/configuracion/2fa"
            className="flex items-center gap-3 px-5 py-3 rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100 hover:border-blue-300 transition-all group"
          >
            <div className="flex flex-col">
              <span className="text-[12px] font-bold text-blue-800 group-hover:text-blue-900">Autenticación 2FA</span>
              <span className="text-[11px] text-blue-500">TOTP — Google Authenticator / Authy</span>
            </div>
            <span className="text-blue-400 group-hover:translate-x-0.5 transition-transform">→</span>
          </Link>
          <Link
            href="/permisos"
            className="flex items-center gap-3 px-5 py-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-slate-300 transition-all group"
          >
            <div className="flex flex-col">
              <span className="text-[12px] font-bold text-slate-800 group-hover:text-slate-900">Permisos de usuarios</span>
              <span className="text-[11px] text-slate-400">Gestionar roles y permisos</span>
            </div>
            <span className="text-slate-400 group-hover:translate-x-0.5 transition-transform">→</span>
          </Link>
          <Link
            href="/backup"
            className="flex items-center gap-3 px-5 py-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-slate-300 transition-all group"
          >
            <div className="flex flex-col">
              <span className="text-[12px] font-bold text-slate-800 group-hover:text-slate-900">Backup</span>
              <span className="text-[11px] text-slate-400">Exportar y respaldar datos</span>
            </div>
            <span className="text-slate-400 group-hover:translate-x-0.5 transition-transform">→</span>
          </Link>
        </div>
      </section>

    </div>
  );
}
