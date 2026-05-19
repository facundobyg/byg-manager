type Status = "ok" | "warn" | "pending";

interface Item {
  label: string;
  status: Status;
  note?: string;
}

interface Section {
  title: string;
  items: Item[];
}

const BADGE: Record<Status, string> = {
  ok:      "bg-emerald-50 text-emerald-700 border border-emerald-200",
  warn:    "bg-yellow-50 text-yellow-700 border border-yellow-200",
  pending: "bg-slate-100 text-slate-500 border border-slate-200",
};

const LABEL: Record<Status, string> = {
  ok:      "OK",
  warn:    "ATENCIÓN",
  pending: "PENDIENTE",
};

const SECTIONS: Section[] = [
  {
    title: "Variables de entorno",
    items: [
      { label: "DATABASE_URL",   status: "pending", note: "Configurar string de conexión Neon/Postgres" },
      { label: "AUTH_SECRET",    status: "pending", note: "Generar secret seguro para NextAuth"         },
      { label: "NEXTAUTH_URL",   status: "pending", note: "URL pública del deployment"                 },
      { label: "NODE_ENV",       status: "pending", note: 'Setear production en el host'               },
    ],
  },
  {
    title: "Infraestructura",
    items: [
      { label: "Neon / Postgres", status: "pending", note: "Base de datos de producción provisionada"  },
      { label: "Vercel",          status: "pending", note: "Proyecto conectado y desplegado"           },
      { label: "Backups",         status: "pending", note: "Cron externo o script programado"          },
      { label: "Logs",            status: "pending", note: "Agregador de logs configurado"             },
      { label: "Monitoring",      status: "pending", note: "Uptime check activo"                       },
    ],
  },
  {
    title: "Seguridad",
    items: [
      { label: "Auth",               status: "ok",      note: "NextAuth activo con sesión protegida"    },
      { label: "Rutas protegidas",   status: "ok",      note: "Middleware de sesión en dashboard"       },
      { label: "Read-only mode",     status: "pending", note: "No implementado"                         },
      { label: "Backup validation",  status: "warn",    note: "Sin validación de schema al restaurar"   },
      { label: "Auditoría",          status: "warn",    note: "Sin trazabilidad por operador"           },
    ],
  },
  {
    title: "Producción",
    items: [
      { label: "Build successful",      status: "pending", note: "Ejecutar npm run build sin errores"   },
      { label: "TypeScript clean",      status: "ok",      note: "tsc --noEmit sin errores"             },
      { label: "Prisma migrations",     status: "pending", note: "prisma migrate deploy en prod"        },
      { label: "Seed validation",       status: "pending", note: "Verificar datos iniciales / config"   },
      { label: "Testing operativo",     status: "pending", note: "Smoke test de flujos críticos"        },
    ],
  },
];

const PROXIMOS: string[] = [
  "Backups programados automáticos",
  "Control de restore con validación de schema",
  "Roles y permisos reales por usuario",
  "Monitoring real con alertas",
  "Error tracking (Sentry u equivalente)",
];

function Badge({ status }: { status: Status }) {
  return (
    <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${BADGE[status]}`}>
      {LABEL[status]}
    </span>
  );
}

function StatusRow({ label, status, note }: Item) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5 border-b border-slate-100 last:border-0">
      <div className="flex flex-col gap-0.5 min-w-0">
        <p className="text-sm font-bold text-slate-800 leading-tight">{label}</p>
        {note && <p className="text-[11px] text-slate-400 font-medium leading-tight">{note}</p>}
      </div>
      <Badge status={status} />
    </div>
  );
}

function SectionCard({ title, items }: Section) {
  const counts = items.reduce(
    (acc, i) => { acc[i.status]++; return acc; },
    { ok: 0, warn: 0, pending: 0 } as Record<Status, number>,
  );

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between gap-3">
        <p className="text-xs font-black uppercase tracking-[0.15em] text-slate-700">{title}</p>
        <div className="flex gap-2">
          {counts.ok      > 0 && <span className="text-[10px] font-black text-emerald-600">{counts.ok} OK</span>}
          {counts.warn    > 0 && <span className="text-[10px] font-black text-yellow-600">{counts.warn} ATENCIÓN</span>}
          {counts.pending > 0 && <span className="text-[10px] font-black text-slate-400">{counts.pending} PENDIENTE</span>}
        </div>
      </div>
      <div className="px-5">
        {items.map((item) => (
          <StatusRow key={item.label} {...item} />
        ))}
      </div>
    </div>
  );
}

export default function DeployPage() {
  const allItems = SECTIONS.flatMap((s) => s.items);
  const total    = allItems.length;
  const okCount  = allItems.filter((i) => i.status === "ok").length;
  const pct      = Math.round((okCount / total) * 100);

  const globalStatus: Status =
    pct === 100 ? "ok" : pct >= 60 ? "warn" : "pending";

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-1">
        <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em]">Sistema</p>
        <div className="flex items-end gap-4 flex-wrap">
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Deploy</h1>
          <Badge status={globalStatus} />
        </div>
        <p className="text-sm text-slate-400 font-medium mt-1">Preparación para producción</p>
      </header>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex items-center gap-6">
        <div className="flex-1">
          <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${pct === 100 ? "bg-emerald-500" : pct >= 60 ? "bg-yellow-400" : "bg-slate-300"}`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
        <p className="text-sm font-black text-slate-700 whitespace-nowrap">
          {okCount} / {total} checks OK
          <span className="ml-2 text-slate-400 font-medium">({pct}%)</span>
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {SECTIONS.map((s) => (
          <SectionCard key={s.title} {...s} />
        ))}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100">
          <p className="text-xs font-black uppercase tracking-[0.15em] text-slate-700">Próximos pasos</p>
        </div>
        <ul className="px-5 divide-y divide-slate-100">
          {PROXIMOS.map((item) => (
            <li key={item} className="flex items-center gap-3 py-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-300 shrink-0" />
              <p className="text-sm font-medium text-slate-600">{item}</p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
