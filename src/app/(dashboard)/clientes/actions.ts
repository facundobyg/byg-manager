"use server"

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { Decimal } from "@prisma/client/runtime/library";
import { readOnlyPreview } from "@/lib/config";
import { requireActionPermission } from "@/lib/auth/permissions";

export async function crearMovimientoCC(prevState: any, formData: FormData) {
  if (readOnlyPreview) return { error: "Modo lectura activo" };
  const createMovCCDenied = await requireActionPermission("cc:crear_movimiento");
  if (createMovCCDenied) return createMovCCDenied;
  const cuentaId = formData.get("cuentaId") as string;
  const clienteId = formData.get("clienteId") as string;
  const tipo = formData.get("tipo") as "INGRESO" | "EGRESO";
  const montoRaw = formData.get("monto") as string;
  const descripcion = formData.get("descripcion") as string;

  if (!cuentaId || !clienteId || !tipo || !montoRaw) {
    return { error: "Faltan datos obligatorios" };
  }

  try {
    const monto = new Decimal(montoRaw);

    if (monto.lte(0)) {
      return { error: "El monto debe ser mayor a 0" };
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Buscar la cuenta
      const cuenta = await tx.cuentaCorriente.findUnique({
        where: { id: cuentaId }
      });

      if (!cuenta) {
        throw new Error("Cuenta no encontrada");
      }

      // 2. Calcular nuevo saldo
      const nuevoSaldo = tipo === "INGRESO" 
        ? cuenta.saldo.add(monto) 
        : cuenta.saldo.sub(monto);

      // 3. Crear el movimiento
      const movimiento = await tx.movimientoCC.create({
        data: {
          id: crypto.randomUUID(),
          cuentaCorrienteId: cuentaId,
          tipo,
          monto,
          descripcion: descripcion?.trim() || "MOV",
          fecha: new Date(),
        }
      });

      // 4. Actualizar el saldo de la cuenta
      await tx.cuentaCorriente.update({
        where: { id: cuentaId },
        data: { saldo: nuevoSaldo }
      });

      return { success: true };
    });

    revalidatePath(`/clientes/${clienteId}`);
    revalidatePath(`/clientes/${clienteId}/cuentas/${cuentaId}`);
    revalidatePath(`/clientes/cc/${cuentaId}`);

    return { success: true, message: "Movimiento registrado con éxito" };
  } catch (error: any) {
    console.error("Error en crearMovimientoCC:", error);
    return { error: error.message || "Error al procesar el movimiento" };
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

  let tasa: Decimal;
  let interesAplicado: Decimal;
  let fechaInicio: Date;
  let fechaFin: Date;

  try {
    tasa = new Decimal(tasaRaw);
    interesAplicado = new Decimal(interesAplicadoRaw);
  } catch {
    return { error: "Tasa o interés aplicado no son valores numéricos válidos" };
  }

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
  const cuentaId = formData.get("cuentaId") as string;
  const montoAplicado = new Decimal(formData.get("montoAplicado") as string);
  const descripcion = formData.get("descripcion") as string;

  const hoy = new Date();
  const inicioDia = new Date(Date.UTC(hoy.getFullYear(), hoy.getMonth(), hoy.getDate()));
  const finDia = new Date(Date.UTC(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + 1));

  const result = await prisma.$transaction(async (tx) => {
    const ultimoInteres = await tx.movimientoCC.findFirst({
      where: {
        cuentaCorrienteId: cuentaId,
        tipo: "INTERES",
        fecha: { gte: inicioDia, lt: finDia },
      },
      orderBy: { createdAt: "desc" },
    });

    if (ultimoInteres && new Decimal(ultimoInteres.monto.toString()).equals(montoAplicado)) {
      return { error: "Interés ya aplicado hoy" };
    }

    const cuenta = await tx.cuentaCorriente.findUniqueOrThrow({ where: { id: cuentaId } });

    const operationRef = crypto.randomUUID();
    await tx.movimientoCC.create({
      data: {
        id: crypto.randomUUID(),
        cuentaCorrienteId: cuentaId,
        fecha: hoy,
        tipo: "INTERES",
        monto: montoAplicado,
        descripcion: `INTERES CC | op:${operationRef}`,
      },
    });

    await tx.cuentaCorriente.update({
      where: { id: cuentaId },
      data: { saldo: cuenta.saldo.add(montoAplicado) },
    });

    return { success: true };
  });

  if (result && "success" in result) {
    revalidatePath("/intereses");
  }

  return result;
}

export async function aplicarTodosInteresesCC(formData: FormData) {
  if (readOnlyPreview) return { error: "Modo lectura activo" };
  const todosInteresesDenied = await requireActionPermission("cc:intereses", { allowTemporary: true });
  if (todosInteresesDenied) return todosInteresesDenied;
  const raw = formData.get("payload") as string;

  let items: { cuentaId: string; montoAplicado: string; descripcion: string }[];
  try {
    items = JSON.parse(raw);
  } catch {
    return { error: "Payload inválido" };
  }

  const hoy = new Date();
  const inicioDia = new Date(Date.UTC(hoy.getFullYear(), hoy.getMonth(), hoy.getDate()));
  const finDia = new Date(Date.UTC(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + 1));

  try {
    let applied = 0;

    await prisma.$transaction(async (tx) => {
      for (const item of items) {
        const monto = new Decimal(item.montoAplicado);

        const ultimoInteres = await tx.movimientoCC.findFirst({
          where: {
            cuentaCorrienteId: item.cuentaId,
            tipo: "INTERES",
            fecha: { gte: inicioDia, lt: finDia },
          },
          orderBy: { createdAt: "desc" },
        });

        if (ultimoInteres && new Decimal(ultimoInteres.monto.toString()).equals(monto)) {
          continue;
        }

        const cuenta = await tx.cuentaCorriente.findUniqueOrThrow({ where: { id: item.cuentaId } });
        const operationRef = crypto.randomUUID();

        await tx.movimientoCC.create({
          data: {
            id: crypto.randomUUID(),
            cuentaCorrienteId: item.cuentaId,
            fecha: hoy,
            tipo: "INTERES",
            monto,
            descripcion: `INTERES CC | op:${operationRef}`,
          },
        });

        await tx.cuentaCorriente.update({
          where: { id: item.cuentaId },
          data: { saldo: cuenta.saldo.add(monto) },
        });

        applied++;
      }
    });

    revalidatePath("/intereses");
    return { success: true, total: applied };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error al aplicar intereses";
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

  let monto: Decimal;
  try {
    monto = new Decimal(montoRaw);
  } catch {
    return { error: "Monto inválido" };
  }

  if (monto.lte(0)) return { error: "El monto debe ser mayor a 0" };

  const hoy = new Date();
  const operationRef = crypto.randomUUID();

  try {
    const txResult = await prisma.$transaction(async (tx) => {
      if (tipo === "LP") {
        if (!monedaOrigen || monedaOrigen !== "USD") throw new Error("LP requiere moneda USD");

        const plazoDias = parseInt(plazoDiasRaw ?? "0", 10);
        if (isNaN(plazoDias) || plazoDias <= 0) throw new Error("Plazo en días inválido");

        let tasaLP: Decimal;
        try {
          tasaLP = new Decimal(tasaRaw || "0");
          if (tasaLP.lte(0)) throw new Error();
        } catch {
          throw new Error("Tasa inválida para LP");
        }

        const cuentaOrigen = await tx.cuentaCorriente.findFirst({
          where: { clienteId, moneda: "USD" },
        });
        if (!cuentaOrigen) throw new Error("Cuenta USD no encontrada");

        await tx.movimientoCC.create({
          data: { id: crypto.randomUUID(), cuentaCorrienteId: cuentaOrigen.id, fecha: hoy, tipo: "EGRESO", monto, descripcion: `LP egreso | op:${operationRef}` },
        });
        await tx.cuentaCorriente.update({
          where: { id: cuentaOrigen.id },
          data: { saldo: cuentaOrigen.saldo.sub(monto) },
        });

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

      const descOp = `${tipo} ${monedaOrigen}->${monedaDestino} | op:${operationRef}`;

      // RULO / DIVISA: EGRESO origen + INGRESO destino
      const factor = tipo === "DIVISA"
        ? new Decimal(tcRaw || "1")
        : new Decimal(1).add(new Decimal(tasaRaw || "0").div(100));

      const montoDestino = monto.mul(factor);

      const [cuentaOrigen, cuentaDestino] = await Promise.all([
        tx.cuentaCorriente.findFirst({ where: { clienteId, moneda: monedaOrigen as never } }),
        tx.cuentaCorriente.findFirst({ where: { clienteId, moneda: monedaDestino as never } }),
      ]);

      if (!cuentaOrigen) throw new Error(`Cuenta ${monedaOrigen} no encontrada`);
      if (!cuentaDestino) throw new Error(`Cuenta ${monedaDestino} no encontrada`);

      await tx.movimientoCC.create({
        data: { id: crypto.randomUUID(), cuentaCorrienteId: cuentaOrigen.id, fecha: hoy, tipo: "EGRESO", monto, descripcion: descOp },
      });
      await tx.cuentaCorriente.update({
        where: { id: cuentaOrigen.id },
        data: { saldo: cuentaOrigen.saldo.sub(monto) },
      });

      await tx.movimientoCC.create({
        data: { id: crypto.randomUUID(), cuentaCorrienteId: cuentaDestino.id, fecha: hoy, tipo: "INGRESO", monto: montoDestino, descripcion: descOp },
      });
      await tx.cuentaCorriente.update({
        where: { id: cuentaDestino.id },
        data: { saldo: cuentaDestino.saldo.add(montoDestino) },
      });

      return null;
    });

    revalidatePath(`/clientes/${clienteId}`);
    revalidatePath("/operaciones");
    revalidatePath("/plazos-fijos");
    revalidatePath("/reportes");
    return { success: true, ...(txResult ?? {}) };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error al ejecutar operación";
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
      : `Tiene datos asociados: ${parts.join(", ")}. Usá "Eliminar con datos" para borrar todo.`;
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

  const cliente = await prisma.cliente.findUnique({ where: { id }, select: { nombre: true } });
  if (!cliente) return { error: "Cliente no encontrado" };

  // Hard block: legacy ops by name
  const normalizado = cliente.nombre.trim().toLowerCase().replace(/\s+/g, " ");
  const legacyCandidates = await prisma.operacionCambio.findMany({
    where: { clienteId: null, clienteNombre: { not: null } },
    select: { clienteNombre: true },
  });
  const legacy = legacyCandidates.filter(
    (op) => (op.clienteNombre ?? "").trim().toLowerCase().replace(/\s+/g, " ") === normalizado,
  ).length;
  if (legacy > 0) {
    return { error: `Bloqueado: existen ${legacy} operaciones importadas por nombre. Archivá el cliente.` };
  }

  // Nullify clienteId on linked OperacionCambio (preserve them as anonymous)
  await prisma.operacionCambio.updateMany({
    where: { clienteId: id },
    data: { clienteId: null },
  });

  // Delete client — cascades CC→MovimientoCC, PF→PlazoFijoMovimiento, CustodiaCliente
  await prisma.cliente.delete({ where: { id } });

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

  const { getMovimientosByOperationRef } = await import("@/lib/data/movimiento-cc");
  const movimientos = await getMovimientosByOperationRef(operationRef);

  if (movimientos.length === 0) return { error: "No se encontraron movimientos para esta operación" };

  // Guard: prevent double reversal
  if (movimientos.some((m) => m.descripcion?.includes("REVERSO"))) {
    return { error: "Esta operación ya fue revertida" };
  }

  const reversalRef = crypto.randomUUID();
  const hoy = new Date();

  try {
    await prisma.$transaction(async (tx) => {
      for (const mov of movimientos) {
        const inversoTipo = mov.tipo === "INGRESO" ? "EGRESO" : "INGRESO";
        const desc = `REVERSO ${mov.tipo} | op:${reversalRef} | ref:${operationRef}`;

        await tx.movimientoCC.create({
          data: {
            id: crypto.randomUUID(),
            cuentaCorrienteId: mov.cuentaCorrienteId,
            fecha: hoy,
            tipo: inversoTipo,
            monto: mov.monto,
            descripcion: desc,
          },
        });

        const cuenta = await tx.cuentaCorriente.findUniqueOrThrow({
          where: { id: mov.cuentaCorrienteId },
        });

        const nuevoSaldo =
          inversoTipo === "INGRESO"
            ? cuenta.saldo.add(mov.monto)
            : cuenta.saldo.sub(mov.monto);

        await tx.cuentaCorriente.update({
          where: { id: mov.cuentaCorrienteId },
          data: { saldo: nuevoSaldo },
        });
      }
    });

    revalidatePath("/operaciones");
    return { success: true };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error al revertir operación";
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

  if (!nombre) return { error: "El nombre es obligatorio" };

  try {
    const dup = await prisma.cliente.findFirst({
      where: { nombre: { equals: nombre, mode: "insensitive" } },
      select: { id: true },
    });
    if (dup) return { error: "Ya existe un cliente con ese nombre" };

    await prisma.cliente.create({
      data: {
        id:        crypto.randomUUID(),
        nombre,
        email,
        telefono,
        activo:    true,
        updatedAt: new Date(),
      },
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

  const clienteId         = formData.get("clienteId")?.toString();
  const moneda            = formData.get("moneda")?.toString();
  const rawCapital        = formData.get("capital")?.toString().replace(",", ".");
  const rawTasa           = formData.get("tasaAnual")?.toString().replace(",", ".");
  const fechaInicioStr    = formData.get("fechaInicio")?.toString();
  const fechaVencStr      = formData.get("fechaVencimiento")?.toString();

  if (!clienteId) return { error: "clienteId requerido" };
  if (moneda !== "USD" && moneda !== "ARS" && moneda !== "EUR" && moneda !== "BRL") {
    return { error: "Moneda inválida" };
  }

  const capital = parseFloat(rawCapital ?? "");
  const tasa    = parseFloat(rawTasa ?? "");
  if (isNaN(capital) || capital <= 0) return { error: "Capital inválido" };
  if (isNaN(tasa) || tasa < 0)        return { error: "Tasa inválida" };

  const dIni  = fechaInicioStr ? new Date(fechaInicioStr) : null;
  const dVenc = fechaVencStr   ? new Date(fechaVencStr)   : null;
  if (!dIni  || isNaN(dIni.getTime()))  return { error: "Fecha de inicio inválida" };
  if (!dVenc || isNaN(dVenc.getTime())) return { error: "Fecha de vencimiento inválida" };
  if (dVenc <= dIni) return { error: "Vencimiento debe ser posterior al inicio" };

  const fechaInicio      = new Date(Date.UTC(dIni.getUTCFullYear(),  dIni.getUTCMonth(),  dIni.getUTCDate()));
  const fechaVencimiento = new Date(Date.UTC(dVenc.getUTCFullYear(), dVenc.getUTCMonth(), dVenc.getUTCDate()));

  try {
    await prisma.plazoFijo.create({
      data: {
        id:               crypto.randomUUID(),
        clienteId,
        moneda,
        capital,
        saldoActual:      capital,
        tasaAnual:        tasa,
        fechaInicio,
        fechaVencimiento,
        estado:           "ACTIVO",
        updatedAt:        new Date(),
      },
    });

    revalidatePath(`/clientes/${clienteId}`);
    return { ok: true };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Error al registrar plazo fijo";
    return { error: msg };
  }
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
  const tasaRaw             = formData.get("tasaAnual")?.toString();
  const fechaInicioRaw      = formData.get("fechaInicio")?.toString();
  const fechaVencimientoRaw = formData.get("fechaVencimiento")?.toString();
  const saldoActualRaw      = formData.get("saldoActual")?.toString();
  const estadoRaw           = formData.get("estado")?.toString();

  const capital    = parseFloat(capitalRaw ?? "");
  const tasa       = parseFloat(tasaRaw ?? "");
  const saldo      = parseFloat(saldoActualRaw ?? "");

  if (isNaN(capital) || capital <= 0) return { error: "Capital inválido" };
  if (isNaN(tasa) || tasa < 0)        return { error: "Tasa inválida" };
  if (isNaN(saldo))                   return { error: "Saldo actual inválido" };

  const ESTADOS = ["ACTIVO", "VENCIDO", "CANCELADO", "RENOVADO"] as const;
  if (!estadoRaw || !ESTADOS.includes(estadoRaw as typeof ESTADOS[number])) {
    return { error: "Estado inválido" };
  }

  const fechaInicio = fechaInicioRaw ? new Date(fechaInicioRaw + "T00:00:00Z") : null;
  const fechaVenc   = fechaVencimientoRaw ? new Date(fechaVencimientoRaw + "T00:00:00Z") : null;
  if (!fechaInicio || isNaN(fechaInicio.getTime())) return { error: "Fecha inicio inválida" };
  if (!fechaVenc   || isNaN(fechaVenc.getTime()))   return { error: "Fecha vencimiento inválida" };

  await prisma.plazoFijo.update({
    where: { id: pfId },
    data: {
      capital:          new Decimal(capital),
      tasaAnual:        new Decimal(tasa),
      saldoActual:      new Decimal(saldo),
      estado:           estadoRaw as typeof ESTADOS[number],
      fechaInicio,
      fechaVencimiento: fechaVenc,
      updatedAt:        new Date(),
    },
  });

  revalidatePath(`/clientes/pf/${pfId}`);
  revalidatePath(`/clientes/${clienteId}`);
  return { ok: true };
}
