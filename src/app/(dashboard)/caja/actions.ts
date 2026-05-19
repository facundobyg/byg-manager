"use server"

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { Decimal } from "@prisma/client/runtime/library";
import { calcularSaldoCaja } from "@/lib/services/caja.service";
import { readOnlyPreview } from "@/lib/config";

export async function crearMovimientoCaja(prevState: any, formData: FormData) {
  if (readOnlyPreview) return { error: "Modo lectura activo" };
  const operationRef = crypto.randomUUID();
  const cajaId = formData.get("cajaId") as string;
  const tipo = formData.get("tipo") as string;
  const montoRaw = formData.get("monto") as string;
  const moneda = formData.get("moneda") as string;
  const descripcion = formData.get("descripcion") as string;
  const slug = formData.get("slug") as string;

  if (!cajaId || !tipo || !montoRaw || !moneda) {
    return { error: "Faltan datos obligatorios" };
  }

  try {
    const monto = new Decimal(montoRaw);
    const descFinal = `${descripcion?.trim() || "MOV"} | op:${operationRef}`;

    await prisma.movimientoCaja.create({
      data: {
        id: crypto.randomUUID(),
        cajaId,
        tipo: tipo as never,
        monto,
        moneda: moneda as never,
        descripcion: descFinal,
        confirmado: true,
        fecha: new Date(),
      },
    });

    revalidatePath("/caja");
    if (slug) {
      revalidatePath(`/caja/${slug}`);
    }

    return { success: true, message: "Movimiento creado exitosamente" };
  } catch (error) {
    return { error: "Error al procesar el monto o guardar en base de datos" };
  }
}

export async function cubrirParcialMovimientoCaja(prevState: unknown, formData: FormData) {
  if (readOnlyPreview) return { error: "Modo lectura activo" };

  const movimientoId = (formData.get("movimientoId") as string)?.trim();
  const cajaId = (formData.get("cajaId") as string)?.trim();
  const montoCubiertoRaw = (formData.get("montoCubierto") as string)?.trim();
  const descripcionExtra = (formData.get("descripcionExtra") as string)?.trim() ?? "";
  const slug = (formData.get("slug") as string)?.trim();

  if (!movimientoId || !cajaId || !montoCubiertoRaw) return { error: "Faltan datos obligatorios" };

  let montoCubierto: Decimal;
  try {
    montoCubierto = new Decimal(montoCubiertoRaw);
    if (montoCubierto.lte(0)) return { error: "El monto debe ser mayor a 0" };
  } catch {
    return { error: "Monto inválido" };
  }

  try {
    const original = await prisma.movimientoCaja.findUnique({ where: { id: movimientoId } });
    if (!original) return { error: "Movimiento no encontrado" };
    if (original.confirmado) return { error: "El movimiento ya está confirmado" };
    if (montoCubierto.gt(new Decimal(original.monto.toString()))) {
      return { error: "El monto cubierto supera el monto original" };
    }

    const desc = `COBERTURA PARCIAL ${movimientoId}${descripcionExtra ? ` | ${descripcionExtra}` : ""}`;

    await prisma.movimientoCaja.create({
      data: {
        id: crypto.randomUUID(),
        cajaId,
        tipo: original.tipo as never,
        monto: montoCubierto,
        moneda: original.moneda as never,
        descripcion: desc,
        confirmado: true,
        fecha: new Date(),
      },
    });

    revalidatePath("/caja");
    if (slug) revalidatePath(`/caja/${slug}`);

    return { success: true };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error al registrar cobertura";
    return { error: msg };
  }
}

export async function transferirEntreCajas(prevState: any, formData: FormData) {
  if (readOnlyPreview) return { error: "Modo lectura activo" };
  const origenId = formData.get("origenId") as string;
  const destinoId = formData.get("destinoId") as string;
  const moneda = formData.get("moneda") as string;
  const descripcion = formData.get("descripcion") as string;

  const montoRaw = formData.get("monto") as string;
  const monto = new Decimal(montoRaw);

  // VALIDACIONES BASE
  if (!origenId || !destinoId || origenId === destinoId) {
    return { error: "Datos inválidos" };
  }

  if (!["USD", "ARS"].includes(moneda)) {
    return { error: "Moneda inválida" };
  }

  if (monto.lte(0)) {
    return { error: "El monto debe ser mayor a 0" };
  }

  // GENERAR ID DE TRANSFERENCIA
  const transferenciaRef = crypto.randomUUID();

  // VALIDAR SALDO
  try {
    const saldo = await calcularSaldoCaja(origenId, moneda as "USD" | "ARS");

    if (saldo.lessThan(monto)) {
      return { error: "Saldo insuficiente en la caja origen" };
    }
  } catch (error) {
    return { error: "Caja origen no encontrada o error de cálculo" };
  }

  // TRANSACCIÓN ATÓMICA
  try {
    await prisma.$transaction([
      prisma.movimientoCaja.create({
        data: {
          id: crypto.randomUUID(),
          cajaId: origenId,
          tipo: "TRANSFERENCIA_OUT" as never,
          monto,
          moneda: moneda as never,
          descripcion: `TRANSFERENCIA | op:${transferenciaRef}`,
          confirmado: true,
          fecha: new Date(),
          transferenciaRef,
        },
      }),
      prisma.movimientoCaja.create({
        data: {
          id: crypto.randomUUID(),
          cajaId: destinoId,
          tipo: "TRANSFERENCIA_IN" as never,
          monto,
          moneda: moneda as never,
          descripcion: `TRANSFERENCIA | op:${transferenciaRef}`,
          confirmado: true,
          fecha: new Date(),
          transferenciaRef,
        },
      }),
    ]);

    revalidatePath("/caja");

    return { success: true };
  } catch (error) {
    return { error: "Error crítico al ejecutar la transferencia" };
  }
}

// COMPRA: ARS sale de cajaArs, divisa entra en cajaDivisa
// VENTA:  divisa sale de cajaDivisa, ARS entra en cajaArs
export async function registrarOperacionCambioEnCajas(prevState: any, formData: FormData) {
  if (readOnlyPreview) return { error: "Modo lectura activo" };

  const cajaDivisaId = (formData.get("cajaDivisaId") as string)?.trim();
  const cajaArsId = (formData.get("cajaArsId") as string)?.trim();
  const montoDivisaRaw = (formData.get("montoDivisa") as string)?.trim();
  const montoArsRaw = (formData.get("montoArs") as string)?.trim();
  const tipoOperacion = (formData.get("tipoOperacion") as string)?.trim();
  const descripcion = (formData.get("descripcion") as string)?.trim() || "OPERACION CAMBIO";
  const moneda = ((formData.get("moneda") as string)?.trim() || "USD") as "USD" | "ARS" | "EUR" | "BRL";

  if (!cajaDivisaId || !cajaArsId) return { error: "Cajas requeridas" };
  if (!tipoOperacion || !["COMPRA", "VENTA"].includes(tipoOperacion)) return { error: "tipoOperacion debe ser COMPRA o VENTA" };

  let montoDivisa: Decimal;
  let montoArs: Decimal;
  try {
    montoDivisa = new Decimal(montoDivisaRaw);
    montoArs = new Decimal(montoArsRaw);
  } catch {
    return { error: "Montos inválidos" };
  }

  if (montoDivisa.lte(0) || montoArs.lte(0)) return { error: "Montos deben ser mayores a 0" };

  try {
    const [cajaDivisa, cajaArs] = await Promise.all([
      prisma.caja.findUnique({ where: { id: cajaDivisaId } }),
      prisma.caja.findUnique({ where: { id: cajaArsId } }),
    ]);
    if (!cajaDivisa) return { error: "Caja divisa no encontrada" };
    if (!cajaArs) return { error: "Caja ARS no encontrada" };
  } catch {
    return { error: "Error validando cajas" };
  }

  const opRef = crypto.randomUUID();
  const fecha = new Date();

  // COMPRA: compramos divisa → sale ARS, entra divisa
  // VENTA:  vendemos divisa → sale divisa, entra ARS
  const [tipoDivisa, tipoArs] =
    tipoOperacion === "COMPRA"
      ? (["ENTRADA", "SALIDA"] as const)
      : (["SALIDA", "ENTRADA"] as const);

  if (tipoOperacion === "COMPRA") {
    try {
      const saldoArs = await calcularSaldoCaja(cajaArsId, "ARS");
      if (saldoArs.lessThan(montoArs)) {
        return { error: "Saldo ARS insuficiente en caja seleccionada" };
      }
    } catch {
      return { error: "Error al calcular saldo ARS de caja" };
    }
  }

  try {
    await prisma.$transaction([
      prisma.movimientoCaja.create({
        data: {
          id: crypto.randomUUID(),
          cajaId: cajaDivisaId,
          tipo: tipoDivisa,
          monto: montoDivisa,
          moneda,
          descripcion: `${descripcion} | ${tipoOperacion} | op:${opRef}`,
          confirmado: true,
          fecha,
          transferenciaRef: opRef,
        },
      }),
      prisma.movimientoCaja.create({
        data: {
          id: crypto.randomUUID(),
          cajaId: cajaArsId,
          tipo: tipoArs,
          monto: montoArs,
          moneda: "ARS",
          descripcion: `${descripcion} | ${tipoOperacion} | op:${opRef}`,
          confirmado: true,
          fecha,
          transferenciaRef: opRef,
        },
      }),
    ]);

    revalidatePath("/caja");
    return { success: true };
  } catch {
    return { error: "Error al registrar operación de cambio" };
  }
}

export async function revertirMovimientoCaja(
  _prev: { error?: string; ok?: boolean } | null,
  formData: FormData,
): Promise<{ error?: string; ok?: boolean }> {
  if (readOnlyPreview) return { error: "Modo lectura activo" };

  const movimientoId = formData.get("movimientoId")?.toString().trim();
  if (!movimientoId) return { error: "ID requerido" };

  const original = await prisma.movimientoCaja.findUnique({ where: { id: movimientoId } });
  if (!original) return { error: "Movimiento no encontrado" };
  if (!original.confirmado) return { error: "No se puede revertir un movimiento no confirmado" };
  if (original.descripcion?.startsWith("REVERSO |")) return { error: "Este movimiento ya es un reverso" };

  const yaRevertido = await prisma.movimientoCaja.findFirst({
    where: { descripcion: { startsWith: `REVERSO | ref:${movimientoId}` } },
  });
  if (yaRevertido) return { error: "Este movimiento ya fue revertido" };

  const tipoMap: Record<string, string> = {
    ENTRADA: "SALIDA",
    SALIDA: "ENTRADA",
    TRANSFERENCIA_IN: "TRANSFERENCIA_OUT",
    TRANSFERENCIA_OUT: "TRANSFERENCIA_IN",
  };
  const tipoReverso = tipoMap[original.tipo];
  if (!tipoReverso) return { error: "Tipo de movimiento no reversible" };

  await prisma.movimientoCaja.create({
    data: {
      id: crypto.randomUUID(),
      cajaId: original.cajaId,
      tipo: tipoReverso as never,
      monto: original.monto,
      moneda: original.moneda,
      descripcion: `REVERSO | ref:${movimientoId} | ${original.descripcion ?? ""}`,
      confirmado: true,
      fecha: new Date(),
    },
  });

  revalidatePath("/caja");
  return { ok: true };
}

export async function confirmarMovimientoCajaPendiente(
  _prev: { error?: string; ok?: boolean } | null,
  formData: FormData,
): Promise<{ error?: string; ok?: boolean }> {
  if (readOnlyPreview) return { error: "Modo lectura activo" };

  const movimientoId = formData.get("movimientoId")?.toString().trim();
  if (!movimientoId) return { error: "ID requerido" };

  const mov = await prisma.movimientoCaja.findUnique({ where: { id: movimientoId } });
  if (!mov) return { error: "Movimiento no encontrado" };
  if (mov.confirmado) return { error: "El movimiento ya está confirmado" };

  await prisma.movimientoCaja.update({
    where: { id: movimientoId },
    data: { confirmado: true },
  });

  revalidatePath("/caja");
  return { ok: true };
}

export async function transferirCajaACartera(
  _prev: { error?: string; success?: boolean } | null,
  formData: FormData,
): Promise<{ error?: string; success?: boolean }> {
  if (readOnlyPreview) return { error: "Modo lectura activo" };

  const cajaId       = formData.get("cajaId")?.toString().trim();
  const carteraId    = formData.get("carteraId")?.toString().trim();
  const moneda       = formData.get("moneda")?.toString().trim() as "USD" | "ARS" | undefined;
  const destinoSaldo = formData.get("destinoSaldo")?.toString().trim() as "CABLE" | "MEP" | "PESOS" | undefined;
  const montoRaw     = formData.get("monto")?.toString().trim().replace(",", ".");
  const descripcion  = formData.get("descripcion")?.toString().trim() || null;

  if (!cajaId || !carteraId || !moneda || !destinoSaldo || !montoRaw) {
    return { error: "Faltan datos obligatorios" };
  }

  let monto: Decimal;
  try {
    monto = new Decimal(montoRaw);
  } catch {
    return { error: "Monto inválido" };
  }
  if (monto.lte(0)) return { error: "El monto debe ser mayor a cero" };

  // Validate moneda ↔ destinoSaldo compatibility
  if (moneda === "USD" && destinoSaldo === "PESOS") {
    return { error: "USD no puede ir a saldo Pesos" };
  }
  if (moneda === "ARS" && (destinoSaldo === "CABLE" || destinoSaldo === "MEP")) {
    return { error: "ARS solo puede ir a saldo Pesos" };
  }

  // Verify caja and cartera exist
  const [caja, cartera] = await Promise.all([
    prisma.caja.findUnique({ where: { id: cajaId }, select: { id: true, label: true } }),
    prisma.cartera.findUnique({ where: { id: carteraId }, select: { id: true, nombre: true, slug: true } }),
  ]);
  if (!caja)    return { error: "Caja no encontrada" };
  if (!cartera) return { error: "Cartera no encontrada" };

  // Validate caja has sufficient balance
  try {
    const saldo = await calcularSaldoCaja(cajaId, moneda);
    if (saldo.lessThan(monto)) {
      return { error: `Saldo insuficiente en caja. Disponible: ${moneda} ${saldo.toFixed(2)}` };
    }
  } catch {
    return { error: "Error al calcular saldo de caja" };
  }

  const desc = [
    `Transferencia interna a cartera ${cartera.nombre}`,
    descripcion,
  ].filter(Boolean).join(" | ");

  // Build cartera increment field
  const carteraData =
    destinoSaldo === "CABLE" ? { saldoUSDCable: { increment: monto } } :
    destinoSaldo === "MEP"   ? { saldoUSDMep:   { increment: monto } } :
                               { saldoPesos:     { increment: monto } };

  try {
    await prisma.$transaction([
      prisma.movimientoCaja.create({
        data: {
          id: crypto.randomUUID(),
          cajaId,
          tipo: "TRANSFERENCIA_OUT",
          monto,
          moneda,
          descripcion: desc,
          confirmado: true,
          fecha: new Date(),
        },
      }),
      prisma.cartera.update({
        where: { id: carteraId },
        data: carteraData,
      }),
    ]);

    revalidatePath("/caja");
    revalidatePath("/carteras", "layout");
    if (cartera.slug) revalidatePath(`/carteras/${cartera.slug}`);

    return { success: true };
  } catch {
    return { error: "Error al ejecutar la transferencia" };
  }
}

export async function transferirCarteraACaja(
  _prev: { error?: string; success?: boolean } | null,
  formData: FormData,
): Promise<{ error?: string; success?: boolean }> {
  if (readOnlyPreview) return { error: "Modo lectura activo" };

  const carteraId   = formData.get("carteraId")?.toString().trim();
  const cajaId      = formData.get("cajaId")?.toString().trim();
  const origenSaldo = formData.get("origenSaldo")?.toString().trim() as "CABLE" | "MEP" | "PESOS" | undefined;
  const montoRaw    = formData.get("monto")?.toString().trim().replace(",", ".");
  const descripcion = formData.get("descripcion")?.toString().trim() || null;

  if (!carteraId || !cajaId || !origenSaldo || !montoRaw) {
    return { error: "Faltan datos obligatorios" };
  }

  let monto: Decimal;
  try {
    monto = new Decimal(montoRaw);
  } catch {
    return { error: "Monto inválido" };
  }
  if (monto.lte(0)) return { error: "El monto debe ser mayor a cero" };

  const moneda: "USD" | "ARS" = origenSaldo === "PESOS" ? "ARS" : "USD";

  const [cartera, caja] = await Promise.all([
    prisma.cartera.findUnique({
      where: { id: carteraId },
      select: { id: true, nombre: true, slug: true, saldoUSDCable: true, saldoUSDMep: true, saldoPesos: true },
    }),
    prisma.caja.findUnique({ where: { id: cajaId }, select: { id: true, label: true } }),
  ]);
  if (!cartera) return { error: "Cartera no encontrada" };
  if (!caja)    return { error: "Caja no encontrada" };

  // Validate sufficient cartera saldo
  const saldoDisponible = new Decimal(
    origenSaldo === "CABLE" ? cartera.saldoUSDCable.toString() :
    origenSaldo === "MEP"   ? cartera.saldoUSDMep.toString() :
                              cartera.saldoPesos.toString()
  );
  if (monto.gt(saldoDisponible)) {
    return { error: `Saldo insuficiente en cartera. Disponible: ${moneda} ${saldoDisponible.toFixed(2)}` };
  }

  const desc = [
    `Transferencia interna desde cartera ${cartera.nombre}`,
    descripcion,
  ].filter(Boolean).join(" | ");

  const carteraData =
    origenSaldo === "CABLE" ? { saldoUSDCable: { decrement: monto } } :
    origenSaldo === "MEP"   ? { saldoUSDMep:   { decrement: monto } } :
                              { saldoPesos:     { decrement: monto } };

  try {
    await prisma.$transaction([
      prisma.cartera.update({ where: { id: carteraId }, data: carteraData }),
      prisma.movimientoCaja.create({
        data: {
          id: crypto.randomUUID(),
          cajaId,
          tipo: "TRANSFERENCIA_IN",
          monto,
          moneda,
          descripcion: desc,
          confirmado: true,
          fecha: new Date(),
        },
      }),
    ]);

    revalidatePath("/caja");
    revalidatePath("/carteras", "layout");
    if (cartera.slug) revalidatePath(`/carteras/${cartera.slug}`);

    return { success: true };
  } catch {
    return { error: "Error al ejecutar la transferencia" };
  }
}
