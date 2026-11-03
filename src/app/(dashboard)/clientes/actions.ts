"use server"

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { Decimal } from "@prisma/client/runtime/library";
import { readOnlyPreview } from "@/lib/config";
import { requireActionPermission, requireCajaPermission } from "@/lib/auth/permissions";
import { Moneda, Prisma, TipoMovCaja } from "@prisma/client";
import { auth } from "@/auth";
import { writeAuditLog } from "@/lib/services/audit.service";
import { esMonedaValida, parseMontoPositivo, validarTextoUsuario } from "@/lib/caja/integridad";
import { parseMontoEstricto } from "@/lib/parse-monto";
import { validarEdicionPF } from "@/lib/cc/integridad";
import {
  CCIntegridadError, aplicarInteresPendienteCCTx, crearMovimientoCCTx, crearPfDesdeCCTx, patasCajaDeOperacionCC, eliminarClienteSeguroTx, lockCuentas, lockPlazoFijo, registrarMovimientoCC,
  revertirMovimientoCCTx, revertirOperacionCCTx,
} from "@/lib/cc/integridad.service";

export async function crearMovimientoCC(prevState: any, formData: FormData): Promise<{ error?: string; success?: boolean; message?: string }> {
  if (readOnlyPreview) return { error: "Modo lectura activo" };
  const createMovCCDenied = await requireActionPermission("cc:crear_movimiento");
  if (createMovCCDenied) return createMovCCDenied;
  const cuentaId = formData.get("cuentaId") as string;
  const clienteId = formData.get("clienteId") as string;
  const tipo = formData.get("tipo") as "INGRESO" | "EGRESO";
  const montoRaw = formData.get("monto") as string;
  const descripcion = formData.get("descripcion") as string;
  const impactaCaja = formData.get("impactaCaja") === "on";
  const cajaImpactoId = formData.get("cajaImpactoId") as string | null;

  if (!cuentaId || !clienteId || !tipo || !montoRaw) {
    return { error: "Faltan datos obligatorios" };
  }
  if (tipo !== "INGRESO" && tipo !== "EGRESO") return { error: "Tipo inválido" };
  if (impactaCaja && !cajaImpactoId) {
    return { error: "Seleccionar caja para el impacto" };
  }
  if (impactaCaja) {
    // Mover dinero en una caja exige el scope de esa caja (Oficina vs Trenque).
    const scopeDenied = await requireCajaPermission([cajaImpactoId]);
    if (scopeDenied) return scopeDenied;
  }

  // MACRO 3: monto decimal estricto > 0 (new Decimal("NaN") pasaba lte(0) y llegaba a la DB)
  // y descripción sin marcas internas ("op:", "ref:", "movref:"… vinculan reversas de CC y caja).
  const monto = parseMontoPositivo(montoRaw);
  if (!monto) return { error: "Monto inválido: usá solo números mayores a 0" };
  const textoError = validarTextoUsuario(descripcion);
  if (textoError) return { error: textoError };

  try {
    const hoy = new Date();
    const fecha = new Date(Date.UTC(hoy.getUTCFullYear(), hoy.getUTCMonth(), hoy.getUTCDate()));
    // MACRO 4: movimiento + increment atómico; con impacto en caja, CC y caja son UN
    // hecho que comparte op:<ref> (reversa conjunta desde Operaciones).
    await prisma.$transaction((tx) => crearMovimientoCCTx(tx, {
      cuentaId, tipo, monto, fecha, descripcion: descripcion?.trim() || null, cajaImpactoId: impactaCaja ? cajaImpactoId : null,
    }), { timeout: 15000 });

    revalidatePath(`/clientes/${clienteId}`);
    revalidatePath(`/clientes/${clienteId}/cuentas/${cuentaId}`);
    revalidatePath(`/clientes/cc/${cuentaId}`);
    if (impactaCaja) {
      revalidatePath("/caja");
      revalidatePath("/operativa/mov-diarios");
    }

    return { success: true, message: "Movimiento registrado con éxito" };
  } catch (error: any) {
    console.error("Error en crearMovimientoCC:", error);
    return { error: error instanceof CCIntegridadError ? error.message : "Error al procesar el movimiento" };
  }
}

export async function liquidarInteresCCAction(prevState: unknown, formData: FormData) {
  if (readOnlyPreview) return { error: "Modo lectura activo" };
  const liquidarDenied = await requireActionPermission("cc:intereses", { allowTemporary: true });
  if (liquidarDenied) return liquidarDenied;
  const cuentaId = (formData.get("cuentaId") as string)?.trim();
  const clienteId = (formData.get("clienteId") as string)?.trim();
  const fechaInicioRaw = (formData.get("fechaInicio") as string)?.trim();
  const fechaFinRaw = (formData.get("fechaFin") as string)?.trim();
  const tasaRaw = (formData.get("tasa") as string)?.trim();
  const interesAplicadoRaw = (formData.get("interesAplicado") as string)?.trim();

  if (!cuentaId || !clienteId || !fechaInicioRaw || !fechaFinRaw || !tasaRaw || !interesAplicadoRaw) {
    return { error: "Faltan datos obligatorios" };
  }

  let fechaInicio: Date;
  let fechaFin: Date;

  // MACRO 4: parser estricto (new Decimal(raw) aceptaba NaN/Infinity/hex/exponentes).
  // interesAplicado = 0 significa "aplicar el calculado".
  const tasaP = parseMontoEstricto(tasaRaw);
  const interesP = parseMontoEstricto(interesAplicadoRaw);
  if (!tasaP.ok || !tasaP.value || !interesP.ok || !interesP.value) {
    return { error: "Tasa o interés aplicado no son valores numéricos válidos" };
  }
  const tasa = tasaP.value;
  const interesAplicado = interesP.value;

  try {
    fechaInicio = new Date(fechaInicioRaw);
    fechaFin = new Date(fechaFinRaw);
    if (isNaN(fechaInicio.getTime()) || isNaN(fechaFin.getTime())) throw new Error();
  } catch {
    return { error: "Las fechas ingresadas no son válidas" };
  }

  if (fechaFin <= fechaInicio) {
    return { error: "La fecha de cierre debe ser posterior al inicio del período" };
  }

  if (interesAplicado.lt(0)) {
    return { error: "El interés aplicado no puede ser negativo" };
  }

  if (tasa.lte(0)) {
    return { error: "La tasa debe ser mayor a 0" };
  }

  try {
    const { liquidarInteresCC } = await import("@/lib/services/liquidacion-cc.service");

    const result = await liquidarInteresCC({
      cuentaId,
      fechaInicio,
      fechaFin,
      tasa,
      interesAplicado,
    });

    revalidatePath(`/clientes/${clienteId}`);
    revalidatePath(`/clientes/${clienteId}/cuentas/${cuentaId}`);
    revalidatePath(`/clientes/cc/${cuentaId}`);

    return {
      success: true,
      interesCalculado: result.interesCalculado.toFixed(2),
      interesAplicado: result.interesAplicado.toFixed(2),
      diferencia: result.diferencia.toFixed(2),
      movimientoId: result.movimientoId,
    };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error al liquidar interés";
    return { error: msg };
  }
}

export async function aplicarInteresCC(formData: FormData) {
  if (readOnlyPreview) return { error: "Modo lectura activo" };
  const aplicarDenied = await requireActionPermission("cc:intereses", { allowTemporary: true });
  if (aplicarDenied) return aplicarDenied;
  // MACRO 4: el cliente solo identifica la cuenta. Período pendiente, tasa y monto se
  // recalculan en el servidor bajo lock (un "montoAplicado" enviado se ignora).
  const cuentaId = (formData.get("cuentaId") as string)?.trim();
  if (!cuentaId) return { error: "Cuenta requerida" };

  try {
    await prisma.$transaction((tx) => aplicarInteresPendienteCCTx(tx, { cuentaId, ahora: new Date() }), { timeout: 15000 });
  } catch (e: unknown) {
    return { error: e instanceof CCIntegridadError ? e.message : "Error al aplicar interés" };
  }

  revalidatePath("/intereses");
  return { success: true };
}

export async function aplicarTodosInteresesCC(formData: FormData) {
  if (readOnlyPreview) return { error: "Modo lectura activo" };
  const todosInteresesDenied = await requireActionPermission("cc:intereses", { allowTemporary: true });
  if (todosInteresesDenied) return todosInteresesDenied;
  const raw = formData.get("payload") as string;

  // MACRO 4: el payload solo identifica cuentas; cualquier monto que traiga se ignora.
  let cuentaIds: string[];
  try {
    const items = JSON.parse(raw) as { cuentaId?: unknown }[];
    if (!Array.isArray(items)) throw new Error();
    cuentaIds = Array.from(new Set(items.map((i) => i?.cuentaId))) as string[];
    if (cuentaIds.some((c) => typeof c !== "string" || !c)) throw new Error();
  } catch {
    return { error: "Payload inválido" };
  }

  try {
    let applied = 0;
    const ahora = new Date();

    await prisma.$transaction(async (tx) => {
      for (const cuentaId of cuentaIds) {
        try {
          await aplicarInteresPendienteCCTx(tx, { cuentaId, ahora });
          applied++;
        } catch (e) {
          // Sin días pendientes / sin interés (saldo ≤ 0) / ya liquidado: se omite esa
          // cuenta. Son validaciones previas a cualquier escritura; un error de DB aborta el lote.
          if (!(e instanceof CCIntegridadError)) throw e;
        }
      }
    }, { timeout: 30000 });

    revalidatePath("/intereses");
    return { success: true, total: applied };
  } catch (error: unknown) {
    const msg = error instanceof CCIntegridadError ? error.message : "Error al aplicar intereses";
    return { error: msg };
  }
}

export async function ejecutarOperacion(formData: FormData) {
  if (readOnlyPreview) return { error: "Modo lectura activo" };

  const ejecutarDenied = await requireActionPermission("cc:crear_movimiento");
  if (ejecutarDenied) return ejecutarDenied;

  const clienteId = (formData.get("clienteId") as string)?.trim();
  const tipo = (formData.get("tipo") as string)?.trim() as "RULO" | "DIVISA" | "LP";
  const monedaOrigen = (formData.get("monedaOrigen") as string)?.trim();
  const monedaDestino = (formData.get("monedaDestino") as string)?.trim();
  const montoRaw = (formData.get("monto") as string)?.trim();
  const tasaRaw = (formData.get("tasa") as string)?.trim();
  const tcRaw = (formData.get("tipoCambio") as string)?.trim();
  const plazoDiasRaw = (formData.get("plazoDias") as string)?.trim();

  if (!clienteId || !tipo || !montoRaw) return { error: "Faltan datos obligatorios" };
  if (tipo !== "RULO" && tipo !== "DIVISA" && tipo !== "LP") return { error: "Tipo de operación inválido" };

  // MACRO 4: parser estricto (new Decimal(raw) aceptaba NaN/Infinity/hex/exponentes).
  const monto = parseMontoPositivo(montoRaw);
  if (!monto) return { error: "Monto inválido: usá solo números mayores a 0" };

  const hoy = new Date();
  const operationRef = crypto.randomUUID();

  try {
    const txResult = await prisma.$transaction(async (tx) => {
      if (tipo === "LP") {
        if (!monedaOrigen || monedaOrigen !== "USD") throw new CCIntegridadError("LP requiere moneda USD");

        const plazoDias = /^\d+$/.test(plazoDiasRaw ?? "") ? parseInt(plazoDiasRaw!, 10) : NaN;
        if (isNaN(plazoDias) || plazoDias <= 0) throw new CCIntegridadError("Plazo en días inválido");

        const tasaLP = parseMontoPositivo(tasaRaw);
        if (!tasaLP) throw new CCIntegridadError("Tasa inválida para LP");

        const cuentaOrigen = await tx.cuentaCorriente.findFirst({
          where: { clienteId, moneda: "USD" },
        });
        if (!cuentaOrigen) throw new CCIntegridadError("Cuenta USD no encontrada");

        // Movimiento + increment atómico (antes: saldo absoluto leído fuera de lock).
        await lockCuentas(tx, [cuentaOrigen.id]);
        await registrarMovimientoCC(tx, { cuentaId: cuentaOrigen.id, tipo: "EGRESO", monto, fecha: hoy, descripcion: `LP egreso | op:${operationRef}` });

        const fechaVencimiento = new Date(hoy);
        fechaVencimiento.setUTCDate(fechaVencimiento.getUTCDate() + plazoDias);

        const pf = await tx.plazoFijo.create({
          data: {
            id: crypto.randomUUID(),
            clienteId,
            capital: monto,
            saldoActual: monto,
            tasaAnual: tasaLP,
            moneda: "USD",
            fechaInicio: hoy,
            fechaVencimiento,
            estado: "ACTIVO",
            notas: `LP automático | op:${operationRef}`,
            updatedAt: new Date(),
          },
        });

        return {
          tipo: "LP" as const,
          plazoFijoId: pf.id,
          clienteId,
          capital: monto.toString(),
          fechaVencimiento: fechaVencimiento.toISOString(),
        };
      }

      if (!esMonedaValida(monedaOrigen) || !esMonedaValida(monedaDestino)) throw new CCIntegridadError("Moneda inválida");
      const descOp = `${tipo} ${monedaOrigen}->${monedaDestino} | op:${operationRef}`;

      // RULO / DIVISA: EGRESO origen + INGRESO destino
      let factor: Decimal;
      if (tipo === "DIVISA") {
        const tc = tcRaw ? parseMontoPositivo(tcRaw) : new Decimal(1);
        if (!tc) throw new CCIntegridadError("Tipo de cambio inválido");
        factor = tc;
      } else {
        const tasa = tasaRaw ? parseMontoEstricto(tasaRaw) : { ok: true as const, value: new Decimal(0) };
        if (!tasa.ok || !tasa.value) throw new CCIntegridadError("Tasa inválida");
        factor = new Decimal(1).add(tasa.value.div(100));
      }

      const montoDestino = monto.mul(factor).toDecimalPlaces(2);
      if (!montoDestino.gt(0)) throw new CCIntegridadError("Monto destino inválido");

      const [cuentaOrigen, cuentaDestino] = await Promise.all([
        tx.cuentaCorriente.findFirst({ where: { clienteId, moneda: monedaOrigen } }),
        tx.cuentaCorriente.findFirst({ where: { clienteId, moneda: monedaDestino } }),
      ]);

      if (!cuentaOrigen) throw new CCIntegridadError(`Cuenta ${monedaOrigen} no encontrada`);
      if (!cuentaDestino) throw new CCIntegridadError(`Cuenta ${monedaDestino} no encontrada`);

      // Misma moneda → misma fila: con increments el efecto neto es exacto
      // (antes el segundo "saldo = X" absoluto pisaba al primero).
      await lockCuentas(tx, [cuentaOrigen.id, cuentaDestino.id]);
      await registrarMovimientoCC(tx, { cuentaId: cuentaOrigen.id, tipo: "EGRESO", monto, fecha: hoy, descripcion: descOp });
      await registrarMovimientoCC(tx, { cuentaId: cuentaDestino.id, tipo: "INGRESO", monto: montoDestino, fecha: hoy, descripcion: descOp });

      return null;
    });

    revalidatePath(`/clientes/${clienteId}`);
    revalidatePath("/operaciones");
    revalidatePath("/plazos-fijos");
    revalidatePath("/reportes");
    return { success: true, ...(txResult ?? {}) };
  } catch (error: unknown) {
    const msg = error instanceof CCIntegridadError ? error.message : "Error al ejecutar operación";
    return { error: msg };
  }
}

export async function editarCliente(
  _prev: { error?: string; ok?: boolean } | null,
  formData: FormData,
): Promise<{ error?: string; ok?: boolean }> {
  if (readOnlyPreview) return { error: "Modo lectura activo" };

  const editarClienteDenied = await requireActionPermission("clientes:editar");
  if (editarClienteDenied) return editarClienteDenied;

  const id       = formData.get("id")?.toString();
  const nombre   = formData.get("nombre")?.toString()?.trim();
  const email    = formData.get("email")?.toString()?.trim() || null;
  const telefono = formData.get("telefono")?.toString()?.trim() || null;
  const notas    = formData.get("notas")?.toString()?.trim() || null;

  if (!id)     return { error: "ID requerido" };
  if (!nombre) return { error: "El nombre es obligatorio" };

  await prisma.cliente.update({
    where: { id },
    data: { nombre, email, telefono, notas, updatedAt: new Date() },
  });

  revalidatePath("/clientes");
  return { ok: true };
}

export async function darDeBajaCliente(
  _prev: { error?: string; ok?: boolean } | null,
  formData: FormData,
): Promise<{ error?: string; ok?: boolean }> {
  if (readOnlyPreview) return { error: "Modo lectura activo" };

  const darBajaDenied = await requireActionPermission("clientes:editar");
  if (darBajaDenied) return darBajaDenied;

  const id = formData.get("id")?.toString();
  if (!id) return { error: "ID requerido" };

  await prisma.cliente.update({
    where: { id },
    data: { activo: false, updatedAt: new Date() },
  });

  revalidatePath("/clientes");
  revalidatePath("/clientes/cc");
  return { ok: true };
}

export async function reactivarCliente(
  _prev: { error?: string; ok?: boolean } | null,
  formData: FormData,
): Promise<{ error?: string; ok?: boolean }> {
  if (readOnlyPreview) return { error: "Modo lectura activo" };

  const reactivarDenied = await requireActionPermission("clientes:editar");
  if (reactivarDenied) return reactivarDenied;

  const id = formData.get("id")?.toString();
  if (!id) return { error: "ID requerido" };

  await prisma.cliente.update({
    where: { id },
    data: { activo: true, updatedAt: new Date() },
  });

  revalidatePath("/clientes");
  revalidatePath("/clientes/cc");
  return { ok: true };
}

export async function eliminarCliente(
  _prev: { error?: string; ok?: boolean; canForce?: boolean } | null,
  formData: FormData,
): Promise<{ error?: string; ok?: boolean; canForce?: boolean }> {
  if (readOnlyPreview) return { error: "Modo lectura activo" };

  const elimClienteDenied = await requireActionPermission("clientes:eliminar");
  if (elimClienteDenied) return elimClienteDenied;

  const id = formData.get("id")?.toString();
  if (!id) return { error: "ID requerido" };

  const cliente = await prisma.cliente.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          CuentaCorriente: true,
          PlazoFijo:       true,
          OperacionCambio: true,
          CustodiaCliente: true,
        },
      },
    },
  });

  if (!cliente) return { error: "Cliente no encontrado" };

  const cc      = cliente._count.CuentaCorriente;
  const pf      = cliente._count.PlazoFijo;
  const ops     = cliente._count.OperacionCambio;
  const custody = cliente._count.CustodiaCliente;

  // Legacy ops: only those NOT linked by clienteId, normalized name match
  const normalizado = cliente.nombre.trim().toLowerCase().replace(/\s+/g, " ");
  const legacyCandidates = await prisma.operacionCambio.findMany({
    where: { clienteId: null, clienteNombre: { not: null } },
    select: { clienteNombre: true },
  });
  const legacy = legacyCandidates.filter(
    (op) => (op.clienteNombre ?? "").trim().toLowerCase().replace(/\s+/g, " ") === normalizado,
  ).length;

  const hasBlock = cc > 0 || pf > 0 || ops > 0 || custody > 0 || legacy > 0;

  if (hasBlock) {
    const parts: string[] = [];
    if (cc > 0)      parts.push(`CC ${cc}`);
    if (pf > 0)      parts.push(`PF ${pf}`);
    if (ops > 0)     parts.push(`Operaciones ${ops}`);
    if (custody > 0) parts.push(`Custodia ${custody}`);
    if (legacy > 0)  parts.push(`Legacy ${legacy} (importado)`);
    const msg = legacy > 0
      ? `No se puede forzar: tiene ${legacy} op. importadas por nombre. Archivalo.`
      : `Tiene datos asociados: ${parts.join(", ")}. Si no tiene historia financiera usá "Eliminar con datos"; si la tiene, dalo de baja.`;
    return { error: msg, canForce: legacy === 0 };
  }

  await prisma.cliente.delete({ where: { id } });
  revalidatePath("/clientes");
  revalidatePath("/clientes/cc");
  return { ok: true };
}

export async function eliminarClienteConDatos(
  _prev: { error?: string; ok?: boolean } | null,
  formData: FormData,
): Promise<{ error?: string; ok?: boolean }> {
  if (readOnlyPreview) return { error: "Modo lectura activo" };

  const elimConDatosDenied = await requireActionPermission("clientes:eliminar");
  if (elimConDatosDenied) return elimConDatosDenied;

  const id = formData.get("id")?.toString();
  if (!id) return { error: "ID requerido" };

  // MACRO 4: safe-deny. Antes borraba en cascada CC → MovimientoCC y PF → movimientos
  // (y anonimizaba sus operaciones de cambio): la historia financiera quedaba solo en
  // el AuditLog. Ahora un cliente con cualquier historia NO se elimina; solo uno
  // realmente vacío (CC en 0 sin movimientos), con sus CC bloqueadas en la tx.
  try {
    await prisma.$transaction((tx) => eliminarClienteSeguroTx(tx, id));
  } catch (e: unknown) {
    return { error: e instanceof CCIntegridadError ? e.message : "Error al eliminar cliente" };
  }

  revalidatePath("/clientes");
  revalidatePath("/clientes/cc");
  return { ok: true };
}

export async function revertirOperacion(formData: FormData) {
  if (readOnlyPreview) return { error: "Modo lectura activo" };

  const revertirDenied = await requireActionPermission("cc:eliminar_movimiento");
  if (revertirDenied) return revertirDenied;

  const operationRef = (formData.get("operationRef") as string)?.trim();
  if (!operationRef) return { error: "operationRef requerido" };

  // H: si la operación tiene pata de caja ([MOV_CC]), revertirla exige el scope de esa caja.
  const cajas = Array.from(new Set((await patasCajaDeOperacionCC(prisma, operationRef)).map((m) => m.cajaId)));
  if (cajas.length > 0) {
    const scopeDenied = await requireCajaPermission(cajas);
    if (scopeDenied) return scopeDenied;
  }

  try {
    // MACRO 4: originales por op:<ref> EXACTO (antes `contains` aceptaba un prefijo y
    // arrastraba otras operaciones), lock FOR UPDATE + idempotencia bajo lock, saldos
    // por increment atómico y PF (LP / PF desde CC) cancelado en la misma tx.
    await prisma.$transaction((tx) => revertirOperacionCCTx(tx, { operationRef, fecha: new Date(), cajasAutorizadas: cajas }));

    revalidatePath("/operaciones");
    revalidatePath("/plazos-fijos");
    revalidatePath("/intereses");
    return { success: true };
  } catch (error: unknown) {
    const msg = error instanceof CCIntegridadError ? error.message : "Error al revertir operación";
    return { error: msg };
  }
}

export async function crearCliente(
  _prev: { error?: string; ok?: boolean } | null,
  formData: FormData,
): Promise<{ error?: string; ok?: boolean }> {
  if (readOnlyPreview) return { error: "Modo lectura activo" };

  const crearClienteDenied = await requireActionPermission("clientes:crear");
  if (crearClienteDenied) return crearClienteDenied;

  const nombre   = formData.get("nombre")?.toString().trim() ?? "";
  const email    = formData.get("email")?.toString().trim() || null;
  const telefono = formData.get("telefono")?.toString().trim() || null;
  const socio    = formData.get("socio")?.toString().trim() || null;

  if (!nombre) return { error: "El nombre es obligatorio" };

  try {
    const dup = await prisma.cliente.findFirst({
      where: { nombre: { equals: nombre, mode: "insensitive" } },
      select: { id: true },
    });
    if (dup) return { error: "Ya existe un cliente con ese nombre" };

    await prisma.$transaction(async (tx) => {
      const clienteId = crypto.randomUUID();
      await tx.cliente.create({
        data: { id: clienteId, nombre, email, telefono, activo: true, updatedAt: new Date() },
      });
      await tx.cuentaCorriente.createMany({
        data: [
          { id: crypto.randomUUID(), clienteId, moneda: "USD", saldo: new Decimal(0), updatedAt: new Date() },
          { id: crypto.randomUUID(), clienteId, moneda: "ARS", saldo: new Decimal(0), updatedAt: new Date() },
        ],
        skipDuplicates: true,
      });
    });

    // Asignar socio responsable en el mapa de configuración
    if (socio) {
      const row = await prisma.config.findUnique({ where: { clave: "cliente_de_map" } });
      const currentMap: Record<string, string> = row ? JSON.parse(row.valor ?? "{}") : {};
      currentMap[nombre] = socio;
      await prisma.config.upsert({
        where: { clave: "cliente_de_map" },
        create: { id: crypto.randomUUID(), clave: "cliente_de_map", valor: JSON.stringify(currentMap), updatedAt: new Date() },
        update: { valor: JSON.stringify(currentMap), updatedAt: new Date() },
      });
    }

    const sessionCC = await auth();
    await writeAuditLog({
      userId:      sessionCC?.user?.id,
      accion:      "CREAR",
      entidad:     "Cliente",
      description: `Cliente creado: ${nombre}${socio ? ` (socio: ${socio})` : ""}`,
    });

    revalidatePath("/clientes/cc");
    revalidatePath("/clientes");
    return { ok: true };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Error al crear cliente";
    return { error: msg };
  }
}

export async function crearCuentaCorriente(
  _prev: { error?: string; ok?: boolean } | null,
  formData: FormData,
): Promise<{ error?: string; ok?: boolean }> {
  if (readOnlyPreview) return { error: "Modo lectura activo" };

  const crearCCDenied = await requireActionPermission("clientes:crear");
  if (crearCCDenied) return crearCCDenied;

  const clienteId = formData.get("clienteId")?.toString();
  const moneda    = formData.get("moneda")?.toString();

  if (!clienteId) return { error: "clienteId requerido" };
  if (moneda !== "USD" && moneda !== "ARS") return { error: "Moneda debe ser USD o ARS" };

  const dup = await prisma.cuentaCorriente.findUnique({
    where: { clienteId_moneda: { clienteId, moneda } },
    select: { id: true },
  });
  if (dup) return { error: `Ya existe una cuenta ${moneda} para este cliente` };

  try {
    await prisma.cuentaCorriente.create({
      data: {
        id:        crypto.randomUUID(),
        clienteId,
        moneda,
        saldo:     0,
        updatedAt: new Date(),
      },
    });

    revalidatePath(`/clientes/${clienteId}`);
    return { ok: true };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Error al crear cuenta corriente";
    return { error: msg };
  }
}

export async function crearPlazoFijoSimple(
  _prev: { error?: string; ok?: boolean } | null,
  formData: FormData,
): Promise<{ error?: string; ok?: boolean }> {
  if (readOnlyPreview) return { error: "Modo lectura activo" };

  const crearPFDenied = await requireActionPermission("pf:crear");
  if (crearPFDenied) return crearPFDenied;

  const clienteId            = formData.get("clienteId")?.toString();
  const moneda               = formData.get("moneda")?.toString();
  const fechaInicioStr       = formData.get("fechaInicio")?.toString();
  const fechaVencStr         = formData.get("fechaVencimiento")?.toString();

  if (!clienteId) return { error: "clienteId requerido" };
  if (moneda !== "USD" && moneda !== "ARS" && moneda !== "EUR" && moneda !== "BRL") {
    return { error: "Moneda inválida" };
  }

  // MACRO 4: decimales estrictos (parseFloat aceptaba "12abc", "1e3"…).
  const capital = parseMontoPositivo(formData.get("capital")?.toString());
  const tasaP   = parseMontoEstricto(formData.get("tasaAnual")?.toString());
  if (!capital) return { error: "Capital inválido" };
  if (!tasaP.ok || !tasaP.value) return { error: "Tasa inválida" };
  const tasa = tasaP.value;
  if (tasa.gt(200)) return { error: "Tasa anual excede el máximo permitido (200%)" };

  const dIni  = fechaInicioStr ? new Date(fechaInicioStr) : null;
  const dVenc = fechaVencStr   ? new Date(fechaVencStr)   : null;
  if (!dIni  || isNaN(dIni.getTime()))  return { error: "Fecha de inicio inválida" };
  if (!dVenc || isNaN(dVenc.getTime())) return { error: "Fecha de vencimiento inválida" };
  if (dVenc <= dIni) return { error: "Vencimiento debe ser posterior al inicio" };

  const fechaInicio      = new Date(Date.UTC(dIni.getUTCFullYear(),  dIni.getUTCMonth(),  dIni.getUTCDate()));
  const fechaVencimiento = new Date(Date.UTC(dVenc.getUTCFullYear(), dVenc.getUTCMonth(), dVenc.getUTCDate()));

  try {
    // MACRO 4: PF + EGRESO en la CC del cliente en UNA tx (antes: decrement del saldo
    // sin MovimientoCC → la reconciliación volvía a sumar el capital = doble pasivo).
    await prisma.$transaction((tx) => crearPfDesdeCCTx(tx, { clienteId, moneda, capital, tasaAnual: tasa, fechaInicio, fechaVencimiento }));

    const sessionPF = await auth();
    await writeAuditLog({
      userId:      sessionPF?.user?.id,
      accion:      "CREAR",
      entidad:     "PlazoFijo",
      description: `PF creado: cliente ${clienteId} ${moneda} ${capital.toString()} tasa:${tasa.toString()}% venc:${fechaVencStr}`,
    });

    revalidatePath(`/clientes/${clienteId}`);
    return { ok: true };
  } catch (e: unknown) {
    const msg = e instanceof CCIntegridadError ? e.message : "Error al registrar plazo fijo";
    return { error: msg };
  }
}

export async function reconciliarSaldoCC(
  _prev: { error?: string; ok?: boolean; diferencia?: string } | null,
  formData: FormData,
): Promise<{ error?: string; ok?: boolean; diferencia?: string }> {
  if (readOnlyPreview) return { error: "Modo lectura activo" };

  const denied = await requireActionPermission("cc:reconciliar");
  if (denied) return denied;

  const cuentaId  = formData.get("cuentaId")?.toString();
  const clienteId = formData.get("clienteId")?.toString();
  if (!cuentaId || !clienteId) return { error: "ID requerido" };

  const { recalculateCuentaCorriente } = await import("@/lib/services/cc.service");
  const saldoCalculado = await recalculateCuentaCorriente(cuentaId);

  const cuenta = await prisma.cuentaCorriente.findUnique({ where: { id: cuentaId }, select: { saldo: true } });
  if (!cuenta) return { error: "Cuenta no encontrada" };

  const diferencia = new Decimal(cuenta.saldo.toString()).minus(saldoCalculado);

  // MACRO 4: diagnóstico SOLAMENTE. Pisar el saldo con la reconstrucción "arreglaba"
  // saldos correctos a los que les faltaba un movimiento del sistema (p. ej. PF
  // creado desde CC sin MovimientoCC → doble pasivo). Una diferencia es legacy
  // inconsistente: se informa, no se ajusta ni se inventan movimientos.
  if (!diferencia.abs().lte(new Decimal("0.001"))) {
    const sessionRec = await auth();
    await writeAuditLog({
      userId:      sessionRec?.user?.id,
      accion:      "RECONCILIAR_CC",
      entidad:     "CuentaCorriente",
      entidadId:   cuentaId,
      description: `Reconciliación CC ${cuentaId}: saldo ${cuenta.saldo} ≠ movimientos ${saldoCalculado} (dif: ${diferencia}) — sin ajuste`,
    });
  }
  return { ok: true, diferencia: diferencia.abs().lte(new Decimal("0.001")) ? "0.00" : diferencia.toFixed(2) };
}

export async function actualizarTasaCC(
  _prev: { error?: string; ok?: boolean } | null,
  formData: FormData,
): Promise<{ error?: string; ok?: boolean }> {
  if (readOnlyPreview) return { error: "Modo lectura activo" };

  const tasaCCDenied = await requireActionPermission("cc:intereses", { allowTemporary: true });
  if (tasaCCDenied) return tasaCCDenied;

  const clienteId = formData.get("clienteId")?.toString();
  const cuentaId  = formData.get("cuentaId")?.toString();
  const tasaRaw   = formData.get("tasaCC")?.toString().replace(",", ".");

  if (!clienteId) return { error: "clienteId requerido" };

  const tasaPct = parseFloat(tasaRaw ?? "");
  if (isNaN(tasaPct) || tasaPct < 0) return { error: "Tasa inválida (debe ser ≥ 0)" };

  await prisma.cliente.update({
    where: { id: clienteId },
    data: { tasaCC: new Decimal(tasaPct / 100), updatedAt: new Date() },
  });

  if (cuentaId) revalidatePath(`/clientes/cc/${cuentaId}`);
  revalidatePath(`/clientes/${clienteId}`);
  return { ok: true };
}

export async function editarPlazoFijo(
  _prev: { error?: string; ok?: boolean } | null,
  formData: FormData,
): Promise<{ error?: string; ok?: boolean }> {
  if (readOnlyPreview) return { error: "Modo lectura activo" };

  const editarPFDenied = await requireActionPermission("pf:editar", { allowTemporary: true });
  if (editarPFDenied) return editarPFDenied;

  const pfId      = formData.get("pfId")?.toString();
  const clienteId = formData.get("clienteId")?.toString();
  if (!pfId || !clienteId) return { error: "ID requerido" };

  const capitalRaw          = formData.get("capital")?.toString();
  const saldoActualRaw      = formData.get("saldoActual")?.toString();
  const estadoRaw           = formData.get("estado")?.toString();
  const fechaInicioRaw      = formData.get("fechaInicio")?.toString();
  const fechaVencimientoRaw = formData.get("fechaVencimiento")?.toString();

  // MACRO 4: decimales estrictos; solo tasa y fechas son editables.
  const tasaP = parseMontoEstricto(formData.get("tasaAnual")?.toString());
  if (!tasaP.ok || !tasaP.value) return { error: "Tasa inválida" };
  const tasa = tasaP.value;
  if (tasa.gt(200)) return { error: "Tasa anual excede el máximo permitido (200%)" };
  const capital = capitalRaw !== undefined ? parseMontoEstricto(capitalRaw) : null;
  const saldo   = saldoActualRaw !== undefined ? parseMontoEstricto(saldoActualRaw) : null;
  if (capital && (!capital.ok || !capital.value)) return { error: "Capital inválido" };
  if (saldo && (!saldo.ok || !saldo.value)) return { error: "Saldo actual inválido" };

  const fechaInicio = fechaInicioRaw ? new Date(fechaInicioRaw + "T00:00:00Z") : null;
  const fechaVenc   = fechaVencimientoRaw ? new Date(fechaVencimientoRaw + "T00:00:00Z") : null;
  if (!fechaInicio || isNaN(fechaInicio.getTime())) return { error: "Fecha inicio inválida" };
  if (!fechaVenc   || isNaN(fechaVenc.getTime()))   return { error: "Fecha vencimiento inválida" };
  if (fechaVenc <= fechaInicio) return { error: "Vencimiento debe ser posterior al inicio" };

  try {
    // MACRO 4: capital / saldoActual / estado tienen efecto económico sin contraparte
    // (un saldoActual editado era interés sin fecha ni movimiento): DENY bajo lock.
    await prisma.$transaction(async (tx) => {
      await lockPlazoFijo(tx, pfId);
      const pf = await tx.plazoFijo.findUnique({ where: { id: pfId } });
      if (!pf || pf.clienteId !== clienteId) throw new CCIntegridadError("Plazo fijo no encontrado");
      const err = validarEdicionPF(
        { capital: pf.capital.toString(), saldoActual: pf.saldoActual.toString(), estado: pf.estado, moneda: pf.moneda, clienteId: pf.clienteId },
        { capital: capital?.value ?? undefined, saldoActual: saldo?.value ?? undefined, estado: estadoRaw },
      );
      if (err) throw new CCIntegridadError(err);
      await tx.plazoFijo.update({
        where: { id: pfId },
        data: { tasaAnual: tasa, fechaInicio, fechaVencimiento: fechaVenc, updatedAt: new Date() },
      });
    });
  } catch (e: unknown) {
    return { error: e instanceof CCIntegridadError ? e.message : "Error al editar el plazo fijo" };
  }

  const sessionEditPF = await auth();
  await writeAuditLog({
    userId:      sessionEditPF?.user?.id,
    accion:      "EDITAR",
    entidad:     "PlazoFijo",
    entidadId:   pfId,
    description: `PF editado: ${pfId} tasa:${tasa.toString()}% inicio:${fechaInicioRaw} venc:${fechaVencimientoRaw}`,
  });

  revalidatePath(`/clientes/pf/${pfId}`);
  revalidatePath(`/clientes/${clienteId}`);
  return { ok: true };
}

export async function revertirMovimientoCC(
  _prev: { error?: string; ok?: boolean } | null,
  formData: FormData,
): Promise<{ error?: string; ok?: boolean }> {
  if (readOnlyPreview) return { error: "Modo lectura activo" };

  const denied = await requireActionPermission("cc:crear_movimiento");
  if (denied) return denied;

  const id = formData.get("id")?.toString();
  if (!id) return { error: "ID requerido" };

  const session = await auth();
  const userName = (session?.user as { name?: string })?.name ?? "Sistema";
  const hoy = new Date();
  const fecha = new Date(Date.UTC(hoy.getUTCFullYear(), hoy.getUTCMonth(), hoy.getUTCDate()));

  try {
    // Lock del movimiento ANTES de leerlo; idempotencia (movref:) bajo lock; saldo por increment.
    const result = await prisma.$transaction((tx) => revertirMovimientoCCTx(tx, { id, userName, fecha }));

    await writeAuditLog({
      userId:      session?.user?.id,
      accion:      "REVERTIR",
      entidad:     "MovimientoCC",
      entidadId:   id,
      description: `${userName} revirtió movimiento CC ${id} (${result.tipo} ${result.monto} ${result.moneda})`,
    });

    revalidatePath(`/clientes/${result.clienteId}`);
    revalidatePath(`/clientes/${result.clienteId}/cuentas/${result.cuentaId}`);
    revalidatePath("/clientes/cc");
    return { ok: true };
  } catch (e: unknown) {
    return { error: e instanceof CCIntegridadError ? e.message : "Error al revertir movimiento" };
  }
}
