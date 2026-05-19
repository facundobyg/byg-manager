import { PrismaClient, UserRole } from "@prisma/client";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const bcrypt = require("bcryptjs") as { hash(data: string, saltOrRounds: string | number): Promise<string> };

const prisma = new PrismaClient();

// ═══════════════════════════════════════════════════════════════
//  CONSTANTES DE PERMISOS
//  Estos son los módulos y acciones conocidos.
//  Definidos aquí para el seed; en producción se importan
//  desde src/lib/permissions.ts
// ═══════════════════════════════════════════════════════════════

const MODULOS = [
  // Legacy granular modules (kept for backward compat)
  "dashboard",
  "clientes",
  "cuentas_corrientes",
  "plazos_fijos",
  "caja",
  "operaciones_cambio",
  "operaciones_rulo",
  "operaciones_divint",
  "operaciones_lp",
  "carteras",
  "custodia",
  "transferencias",
  "activos",
  "patrimonio",
  "historial",
  "configuracion",
  "backups",
  "auditoria",
  "usuarios",
  "socios_porcentaje",
  "inmobiliarias",
  "recordatorios",
  "notas",
  // Page-level modules (match requirePermission keys used in pages)
  "posicion",
  "analisis",
  "mov_diarios",
  "rulos",
  "div_intereses",
  "largo_plazo",
  "banco_industrial",
] as const;

const ACCIONES = ["leer", "crear", "editar", "eliminar", "exportar", "escribir"] as const;

// Permisos por rol por defecto
// ADMIN: todo
// SOCIO: lectura total + edición en la mayoría, sin gestión de usuarios
// EMPLEADO: solo lectura + operaciones básicas
const ROLE_DEFAULTS: Record<string, { modulos: string[]; acciones: string[] }[]> = {
  ADMIN: [{ modulos: [...MODULOS], acciones: [...ACCIONES] }],
  SOCIO: [
    { modulos: [...MODULOS], acciones: ["leer", "exportar", "escribir"] },
    {
      modulos: [
        "clientes",
        "cuentas_corrientes",
        "plazos_fijos",
        "caja",
        "operaciones_cambio",
        "operaciones_rulo",
        "operaciones_divint",
        "operaciones_lp",
        "carteras",
        "custodia",
        "transferencias",
        "activos",
        "patrimonio",
        "inmobiliarias",
        "recordatorios",
        "notas",
        "configuracion",
        "mov_diarios",
        "rulos",
        "div_intereses",
        "largo_plazo",
        "banco_industrial",
      ],
      acciones: ["crear", "editar", "eliminar"],
    },
  ],
  EMPLEADO: [
    {
      modulos: ["dashboard", "clientes", "cuentas_corrientes", "operaciones_cambio", "activos", "notas"],
      acciones: ["leer"],
    },
    {
      modulos: ["operaciones_cambio", "notas"],
      acciones: ["crear"],
    },
  ],
};

async function main() {
  console.log("🌱 Iniciando seed de BYG Manager v2.0...\n");

  // ═══════════════════════════════════════
  //  1. PERMISOS BASE
  // ═══════════════════════════════════════
  console.log("📋 Creando permisos...");

  const permisosMap: Record<string, string> = {}; // "modulo:accion" -> id

  for (const modulo of MODULOS) {
    for (const accion of ACCIONES) {
      const permiso = await prisma.permiso.upsert({
        where: { modulo_accion: { modulo, accion } },
        update: {},
        create: { id: crypto.randomUUID(), modulo, accion },
      });
      permisosMap[`${modulo}:${accion}`] = permiso.id;
    }
  }

  console.log(`  ✅ ${Object.keys(permisosMap).length} permisos creados`);

  // ═══════════════════════════════════════
  //  2. PERMISOS POR ROL
  // ═══════════════════════════════════════
  console.log("🔐 Asignando permisos por rol...");

  // Limpiar permisos de rol previos
  await prisma.rolPermiso.deleteMany({});

  for (const [role, groups] of Object.entries(ROLE_DEFAULTS)) {
    let count = 0;
    for (const group of groups) {
      for (const modulo of group.modulos) {
        for (const accion of group.acciones) {
          const key = `${modulo}:${accion}`;
          const permisoId = permisosMap[key];
          if (permisoId) {
            await prisma.rolPermiso.upsert({
              where: { role_permisoId: { role: role as UserRole, permisoId } },
              update: {},
              create: { id: crypto.randomUUID(), role: role as UserRole, permisoId },
            });
            count++;
          }
        }
      }
    }
    console.log(`  ✅ ${role}: ${count} permisos`);
  }

  // ═══════════════════════════════════════
  //  3. USUARIOS REALES
  // ═══════════════════════════════════════
  console.log("👤 Creando usuarios...");

  const defaultPassword = await bcrypt.hash("byg2026!", 12);

  const users = [
    {
      email: "facundo.byg@gmail.com",
      name: "Facundo",
      role: "ADMIN" as UserRole,
    },
    {
      email: "francisco.byg@gmail.com",
      name: "Francisco",
      role: "SOCIO" as UserRole,
    },
    {
      email: "augusto.byg@gmail.com",
      name: "Augusto",
      role: "SOCIO" as UserRole,
    },
  ];

  for (const u of users) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: { role: u.role, activo: true },
      create: {
        id: crypto.randomUUID(),
        email: u.email,
        name: u.name,
        passwordHash: defaultPassword,
        role: u.role,
        activo: true,
        updatedAt: new Date(),
      },
    });
  }

  console.log(`  ✅ ${users.map((u) => u.name).join(", ")}`);

  // ═══════════════════════════════════════
  //  4. CONFIGURACIÓN BASE
  // ═══════════════════════════════════════
  console.log("⚙️  Creando configuración...");

  const configEntries = [
    { clave: "tc_blue", valor: "1250.00" },
    { clave: "tc_mep", valor: "1230.00" },
    { clave: "tc_eur", valor: "1.08" },
    { clave: "tc_brl", valor: "5.20" },
    { clave: "mes_activo", valor: "2026-04" },
    { clave: "dias_alerta_pf", valor: "7" },
    { clave: "schema_version", valor: "2.0.0" },
  ];

  for (const entry of configEntries) {
    await prisma.config.upsert({
      where: { clave: entry.clave },
      update: { valor: entry.valor },
      create: { id: crypto.randomUUID(), ...entry, updatedAt: new Date() },
    });
  }

  console.log(`  ✅ ${configEntries.length} entradas de config`);

  // ═══════════════════════════════════════
  //  5. TIPOS DE CAMBIO INICIALES
  // ═══════════════════════════════════════
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const tiposCambio = [
    { monedaOrigen: "ARS" as const, monedaDestino: "USD" as const, valor: 1250.0 },
    { monedaOrigen: "EUR" as const, monedaDestino: "USD" as const, valor: 1.08 },
    { monedaOrigen: "BRL" as const, monedaDestino: "USD" as const, valor: 5.2 },
  ];

  for (const tc of tiposCambio) {
    await prisma.tipoCambio.upsert({
      where: {
        monedaOrigen_monedaDestino_fecha: {
          monedaOrigen: tc.monedaOrigen,
          monedaDestino: tc.monedaDestino,
          fecha: hoy,
        },
      },
      update: { valor: tc.valor },
      create: { id: crypto.randomUUID(), ...tc, fecha: hoy },
    });
  }

  console.log("  ✅ Tipos de cambio iniciales");

  // ═══════════════════════════════════════
  //  6. CARTERAS
  // ═══════════════════════════════════════
  console.log("📊 Creando carteras...");

  const carteras = [
    { nombre: "Fran", slug: "fran", tipo: "COMPLETA" as const, orden: 1 },
    { nombre: "Nanu", slug: "nanu", tipo: "COMPLETA" as const, orden: 2 },
    { nombre: "BYG", slug: "byg", tipo: "COMPLETA" as const, orden: 3 },
    { nombre: "Binance", slug: "binance", tipo: "CRIPTO" as const, orden: 4 },
  ];

  for (const c of carteras) {
    await prisma.cartera.upsert({
      where: { slug: c.slug },
      update: {},
      create: { id: crypto.randomUUID(), ...c, activa: true, saldoPesos: 0, saldoUSDCable: 0, saldoUSDMep: 0, updatedAt: new Date() },
    });
  }

  console.log(`  ✅ ${carteras.map((c) => c.nombre).join(", ")}`);

  // ═══════════════════════════════════════
  //  7. CAJAS
  //  Oficina: esPrincipal=true, no se puede desactivar
  // ═══════════════════════════════════════
  console.log("💰 Creando cajas...");

  const cajas = [
    { slug: "oficina", label: "Oficina", orden: 1, esPrincipal: true },
    { slug: "facu_cas", label: "Facu CAS", orden: 2, esPrincipal: false },
    { slug: "caja_seguridad", label: "Caja de Seguridad", orden: 3, esPrincipal: false },
    { slug: "banco_fran", label: "Banco Francés", orden: 4, esPrincipal: false },
    { slug: "nanu_trenque", label: "Trenque Lauquen", orden: 5, esPrincipal: false },
  ];

  for (const caja of cajas) {
    await prisma.caja.upsert({
      where: { slug: caja.slug },
      update: { label: caja.label, orden: caja.orden },
      create: {
        id: crypto.randomUUID(),
        slug: caja.slug,
        label: caja.label,
        saldoInicialUSD: 0,
        saldoInicialARS: 0,
        orden: caja.orden,
        activa: true,
        esPrincipal: caja.esPrincipal,
      },
    });
  }

  console.log(`  ✅ ${cajas.map((c) => c.label).join(", ")}`);
  console.log("     ⭐ Oficina marcada como caja principal");

  // ═══════════════════════════════════════
  //  8. PORCENTAJES REALES DE SOCIOS
  // ═══════════════════════════════════════
  console.log("📈 Creando porcentajes de socios...");

  const socios = [
    { nombre: "Fran", porcentaje: 50.0 },
    { nombre: "Nanu", porcentaje: 30.0 },
    { nombre: "Facu", porcentaje: 20.0 },
  ];

  for (const socio of socios) {
    await prisma.socioPorcentaje.upsert({
      where: { nombre: socio.nombre },
      update: { porcentaje: socio.porcentaje },
      create: { id: crypto.randomUUID(), ...socio, activo: true, updatedAt: new Date() },
    });
  }

  console.log(`  ✅ ${socios.map((s) => `${s.nombre}: ${s.porcentaje}%`).join(", ")}`);

  // ═══════════════════════════════════════
  //  9. ACTIVOS
  // ═══════════════════════════════════════
  console.log("📈 Creando activos...");

  const activos = [
    { ticker: "AL30", descripcion: "Bono Argentino Ley Local 2030", categoria: "BONO_ARS" as const, monedaPrecio: "USD" as const },
    { ticker: "AL35", descripcion: "Bono Argentino Ley Local 2035", categoria: "BONO_ARS" as const, monedaPrecio: "USD" as const },
    { ticker: "AE38", descripcion: "Bono Argentino 2038", categoria: "BONO_ARS" as const, monedaPrecio: "USD" as const },
    { ticker: "GD30", descripcion: "Global Bond 2030", categoria: "BONO_USD" as const, monedaPrecio: "USD" as const },
    { ticker: "GD35", descripcion: "Global Bond 2035", categoria: "BONO_USD" as const, monedaPrecio: "USD" as const },
    { ticker: "GD38", descripcion: "Global Bond 2038", categoria: "BONO_USD" as const, monedaPrecio: "USD" as const },
    { ticker: "GD41", descripcion: "Global Bond 2041", categoria: "BONO_USD" as const, monedaPrecio: "USD" as const },
    { ticker: "GD46", descripcion: "Global Bond 2046", categoria: "BONO_USD" as const, monedaPrecio: "USD" as const },
    { ticker: "YMCIO", descripcion: "ON YPF Clase IO", categoria: "ON_USD" as const, monedaPrecio: "USD" as const },
    { ticker: "MRCAO", descripcion: "ON Mercado Libre", categoria: "ON_USD" as const, monedaPrecio: "USD" as const },
    { ticker: "TLC1O", descripcion: "ON Telecom", categoria: "ON_USD" as const, monedaPrecio: "USD" as const },
    { ticker: "AAPL", descripcion: "Apple Inc.", categoria: "ACCION_USD" as const, monedaPrecio: "USD" as const },
    { ticker: "MELI", descripcion: "MercadoLibre", categoria: "ACCION_USD" as const, monedaPrecio: "USD" as const },
    { ticker: "GOOGL", descripcion: "Alphabet", categoria: "ACCION_USD" as const, monedaPrecio: "USD" as const },
    { ticker: "MSFT", descripcion: "Microsoft", categoria: "ACCION_USD" as const, monedaPrecio: "USD" as const },
    { ticker: "AAPL.BA", descripcion: "Apple CEDEAR", categoria: "CEDEAR" as const, monedaPrecio: "ARS" as const },
    { ticker: "MELI.BA", descripcion: "MercadoLibre CEDEAR", categoria: "CEDEAR" as const, monedaPrecio: "ARS" as const },
    { ticker: "GOOGL.BA", descripcion: "Alphabet CEDEAR", categoria: "CEDEAR" as const, monedaPrecio: "ARS" as const },
    { ticker: "BTC", descripcion: "Bitcoin", categoria: "CRIPTO" as const, monedaPrecio: "USD" as const },
    { ticker: "ETH", descripcion: "Ethereum", categoria: "CRIPTO" as const, monedaPrecio: "USD" as const },
    { ticker: "USDT", descripcion: "Tether USD", categoria: "CRIPTO" as const, monedaPrecio: "USD" as const },
    { ticker: "USDC", descripcion: "USD Coin", categoria: "CRIPTO" as const, monedaPrecio: "USD" as const },
    { ticker: "FCI-ALPHA", descripcion: "FCI Alpha Renta Fija", categoria: "FCI" as const, monedaPrecio: "ARS" as const },
  ];

  for (const a of activos) {
    await prisma.activo.upsert({
      where: { ticker: a.ticker },
      update: {},
      create: { id: crypto.randomUUID(), ...a, precioActual: null, precioAnterior: null, updatedAt: new Date() },
    });
  }

  console.log(`  ✅ ${activos.length} activos`);

  // ═══════════════════════════════════════
  //  10. CLIENTES DE EJEMPLO
  // ═══════════════════════════════════════
  console.log("👥 Creando clientes...");

  const clientes = [
    { nombre: "Juan Pérez", email: "juan.perez@email.com", telefono: "+54 11 1234-5678", banco: "Banco Galicia", tasaCC: 4.0 },
    { nombre: "María López", email: "maria.lopez@email.com", telefono: "+54 11 2345-6789", banco: "Banco Francés", tasaCC: 3.5 },
    { nombre: "Carlos Rodríguez", email: "carlos.rodriguez@email.com", telefono: "+54 11 3456-7890", banco: "Banco Nación", tasaCC: 4.5 },
    { nombre: "Ana García", email: null, telefono: "+54 11 4567-8901", banco: "ICBC", tasaCC: 3.0 },
    { nombre: "Roberto Fernández", email: "r.fernandez@email.com", telefono: null, banco: null, tasaCC: 4.0 },
  ];

  for (const c of clientes) {
    const existing = await prisma.cliente.findFirst({ where: { nombre: c.nombre } });
    const clienteId = existing
      ? existing.id
      : (
          await prisma.cliente.create({
            data: { id: crypto.randomUUID(), nombre: c.nombre, rol: "CLIENTE", email: c.email, telefono: c.telefono, banco: c.banco, tasaCC: c.tasaCC, activo: true, updatedAt: new Date() },
          })
        ).id;

    await prisma.cuentaCorriente.upsert({
      where: { clienteId_moneda: { clienteId, moneda: "USD" } },
      update: {},
      create: { id: crypto.randomUUID(), clienteId, moneda: "USD", saldo: 0, updatedAt: new Date() },
    });
    await prisma.cuentaCorriente.upsert({
      where: { clienteId_moneda: { clienteId, moneda: "ARS" } },
      update: {},
      create: { id: crypto.randomUUID(), clienteId, moneda: "ARS", saldo: 0, updatedAt: new Date() },
    });
  }

  console.log(`  ✅ ${clientes.length} clientes (con CC USD + ARS)`);

  // ═══════════════════════════════════════
  //  11. PROPIEDAD, RECORDATORIOS, MES, NOTA
  // ═══════════════════════════════════════
  await prisma.propiedad.upsert({
    where: { nombre: "Providencia" },
    update: {},
    create: { id: crypto.randomUUID(), nombre: "Providencia", activa: true },
  });

  const recordatorios = [
    { descripcion: "Alquiler oficina", diaMes: 1, anticipo: 5, categoria: "ALQUILER" as const, moneda: "USD" as const, monto: 800 },
    { descripcion: "Expensas oficina", diaMes: 10, anticipo: 3, categoria: "EXPENSAS" as const, moneda: "ARS" as const, monto: 150000 },
    { descripcion: "Sueldo empleados", diaMes: 5, anticipo: 5, categoria: "SUELDO" as const, moneda: "ARS" as const, monto: 500000 },
  ];

  for (const r of recordatorios) {
    const existingR = await prisma.recordatorio.findFirst({ where: { descripcion: r.descripcion } });
    if (!existingR) await prisma.recordatorio.create({ data: { id: crypto.randomUUID(), ...r, activo: true, updatedAt: new Date() } });
  }

  await prisma.mesContable.upsert({
    where: { mes: "2026-04" },
    update: {},
    create: { id: crypto.randomUUID(), mes: "2026-04", activo: true },
  });

  const existingNota = await prisma.nota.findFirst({ where: { titulo: "Sistema inicializado" } });
  if (!existingNota) {
    await prisma.nota.create({
      data: {
        id: crypto.randomUUID(),
        titulo: "Sistema inicializado",
        contenido:
          "BYG Manager v2.0 inicializado correctamente. Recordar cargar saldos iniciales de cajas y posiciones de carteras.",
        color: "#3B82F6",
        fijada: true,
        updatedAt: new Date(),
      },
    });
  }

  console.log("  ✅ Propiedad, recordatorios, mes contable, nota");

  // ═══════════════════════════════════════
  //  12. CUENTAS DE INVERSIÓN
  // ═══════════════════════════════════════
  console.log("🏦 Creando cuentas de inversión...");

  await prisma.cuentaInversion.upsert({
    where: { nombre: "Banco Industrial" },
    update: {},
    create: { id: crypto.randomUUID(), nombre: "Banco Industrial", activa: true, updatedAt: new Date() },
  });

  console.log("  ✅ Banco Industrial");

  // ═══════════════════════════════════════
  console.log("\n🎉 Seed completado exitosamente!");
  console.log("════════════════════════════════");
  console.log("  Usuarios:     3 (Francisco, Augusto, Facundo)");
  console.log("  Permisos:     " + Object.keys(permisosMap).length);
  console.log("  Config:       " + configEntries.length);
  console.log("  Carteras:     " + carteras.length);
  console.log("  Cajas:        " + cajas.length + " (Oficina = principal)");
  console.log("  Socios:       Fran 50% / Nanu 30% / Facu 20%");
  console.log("  Activos:      " + activos.length);
  console.log("  Clientes:     " + clientes.length);
  console.log("════════════════════════════════");
  console.log("\n⚠️  Cambiar contraseñas por defecto (byg2026!)");
  console.log("⚠️  Cargar saldos iniciales de cajas");
  console.log("⚠️  Cargar precios actuales de activos\n");
}

main()
  .then(async () => await prisma.$disconnect())
  .catch(async (e) => {
    console.error("❌ Error en seed:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
