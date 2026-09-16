import { describe, it, expect, vi, beforeEach } from "vitest";
import { Decimal } from "@prisma/client/runtime/library";

// ── Hoisted mocks ─────────────────────────────────────────────────────────────

const mocks = vi.hoisted(() => ({
  requireActionPermission: vi.fn(),
  auth: vi.fn(),
  writeAuditLog: vi.fn(),
  // tx mock compartido: cada test configura los resolved values que necesita.
  tx: {
    movimientoCC: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    cuentaCorriente: {
      findFirst: vi.fn(),
      findUniqueOrThrow: vi.fn(),
      update: vi.fn(),
    },
    plazoFijo: {
      findMany: vi.fn(),
      findUniqueOrThrow: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    $queryRaw: vi.fn(),
  },
  mockPrisma: {
    $transaction: vi.fn(),
  },
}));

vi.mock("@/lib/auth/permissions", () => ({
  requireActionPermission: mocks.requireActionPermission,
}));

vi.mock("@/auth", () => ({
  auth: mocks.auth,
}));

vi.mock("@/lib/services/audit.service", () => ({
  writeAuditLog: mocks.writeAuditLog,
}));

vi.mock("@/lib/config", () => ({
  readOnlyPreview: false,
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: mocks.mockPrisma,
}));

// Implementación real (no un stub arbitrario): misma regex que
// src/lib/data/movimiento-cc.ts, para no divergir de la lógica que también
// usa la UI. Se mockea el módulo completo solo porque cargarlo tal cual
// dispara un problema de resolución de rutas de Vite en este entorno de test
// (mismo síntoma visto con @/lib/services/precioPromedio.service).
vi.mock("@/lib/data/movimiento-cc", () => ({
  esMovimientoDeOperacionAgrupada: (descripcion: string | null | undefined) =>
    /op:[a-zA-Z0-9-]+/.test(descripcion ?? ""),
  extraerOperationRef: (texto: string | null | undefined) =>
    texto?.match(/op:([a-zA-Z0-9-]+)/)?.[1] ?? null,
}));

import { revertirOperacion, revertirMovimientoCC, ejecutarOperacion } from "./actions";

const tx = mocks.tx;
const mockPrisma = mocks.mockPrisma;

// ── Helpers ────────────────────────────────────────────────────────────────────

function movOriginal(over: Partial<{ id: string; cuentaCorrienteId: string; tipo: string; monto: Decimal; descripcion: string }>) {
  return {
    id: over.id ?? "m1",
    cuentaCorrienteId: over.cuentaCorrienteId ?? "cc-1",
    tipo: over.tipo ?? "EGRESO",
    monto: over.monto ?? new Decimal(100),
    descripcion: over.descripcion ?? "RULO ARS->USD | op:REF1",
  };
}

function formDataOp(operationRef: string) {
  const fd = new FormData();
  fd.set("operationRef", operationRef);
  return fd;
}

function formDataId(id: string) {
  const fd = new FormData();
  fd.set("id", id);
  return fd;
}

function plazoFijoMock(over: Partial<{
  id: string; clienteId: string; capital: Decimal; saldoActual: Decimal; tasaAnual: Decimal;
  moneda: string; estado: string; notas: string; fechaInicio: Date; fechaVencimiento: Date;
}>) {
  return {
    id: over.id ?? "pf-1",
    clienteId: over.clienteId ?? "cli-1",
    capital: over.capital ?? new Decimal(1000),
    saldoActual: over.saldoActual ?? new Decimal(1000),
    tasaAnual: over.tasaAnual ?? new Decimal(5),
    moneda: over.moneda ?? "USD",
    estado: over.estado ?? "ACTIVO",
    notas: over.notas ?? "LP automático | op:REF-LP-1",
    fechaInicio: over.fechaInicio ?? new Date("2026-01-01"),
    fechaVencimiento: over.fechaVencimiento ?? new Date("2026-02-01"),
  };
}

function formDataEjecutarLP(over?: Partial<{ clienteId: string; monto: string; tasa: string; plazoDias: string }>) {
  const fd = new FormData();
  fd.set("clienteId", over?.clienteId ?? "cli-1");
  fd.set("tipo", "LP");
  fd.set("monedaOrigen", "USD");
  fd.set("monto", over?.monto ?? "1000");
  fd.set("tasa", over?.tasa ?? "5");
  fd.set("plazoDias", over?.plazoDias ?? "30");
  return fd;
}

function resetTx() {
  Object.values(tx.movimientoCC).forEach((f) => f.mockReset());
  Object.values(tx.cuentaCorriente).forEach((f) => f.mockReset());
  Object.values(tx.plazoFijo).forEach((f) => f.mockReset());
  tx.$queryRaw.mockReset();
  tx.$queryRaw.mockResolvedValue([]);
  // por defecto sin PF (operaciones no-LP no lo tocan); los tests de LP lo sobreescriben.
  tx.plazoFijo.findMany.mockResolvedValue([]);
}

beforeEach(() => {
  vi.clearAllMocks();
  mockPrisma.$transaction.mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => fn(tx));
  resetTx();
  mocks.requireActionPermission.mockResolvedValue(null); // permiso concedido por defecto
  mocks.auth.mockResolvedValue({ user: { id: "user-1", name: "Tester" } });
  tx.cuentaCorriente.findFirst.mockResolvedValue({ id: "cc-1", saldo: new Decimal(1000) });
  tx.cuentaCorriente.findUniqueOrThrow.mockResolvedValue({ id: "cc-1", saldo: new Decimal(1000) });
  tx.cuentaCorriente.update.mockResolvedValue({});
  tx.movimientoCC.create.mockResolvedValue({});
  tx.plazoFijo.create.mockResolvedValue(plazoFijoMock({}));
});

// ════════════════════════════════════════════════════════════════════════════
// A. revertirOperacion
// ════════════════════════════════════════════════════════════════════════════

describe("revertirOperacion — Camino A (OPS-01)", () => {
  it("A1: reversión simple exitosa", async () => {
    // Descripción genérica (no-LP): esta prueba no es específica de LP, así
    // que evitamos disparar la validación de PlazoFijo de OPS-02.
    const original = movOriginal({ descripcion: "AJUSTE egreso | op:REF1" });
    tx.movimientoCC.findMany.mockResolvedValue([original]);
    tx.movimientoCC.findFirst.mockResolvedValue(null); // sin reversión previa

    const result = await revertirOperacion(formDataOp("REF1"));

    expect(result).toEqual({ success: true });
    expect(tx.movimientoCC.create).toHaveBeenCalledTimes(1);
    expect(tx.cuentaCorriente.update).toHaveBeenCalledTimes(1);
  });

  it("A2: RULO/DIVISA con múltiples movimientos se revierte completo", async () => {
    const origen = movOriginal({ id: "m-origen", cuentaCorrienteId: "cc-ars", tipo: "EGRESO", monto: new Decimal(100), descripcion: "RULO ARS->USD | op:REF1" });
    const destino = movOriginal({ id: "m-destino", cuentaCorrienteId: "cc-usd", tipo: "INGRESO", monto: new Decimal(150), descripcion: "RULO ARS->USD | op:REF1" });
    tx.movimientoCC.findMany.mockResolvedValue([origen, destino]);
    tx.movimientoCC.findFirst.mockResolvedValue(null);
    tx.cuentaCorriente.findUniqueOrThrow.mockImplementation(async ({ where }: { where: { id: string } }) =>
      where.id === "cc-ars" ? { id: "cc-ars", saldo: new Decimal(500) } : { id: "cc-usd", saldo: new Decimal(300) },
    );

    const result = await revertirOperacion(formDataOp("REF1"));

    expect(result).toEqual({ success: true });
    expect(tx.movimientoCC.create).toHaveBeenCalledTimes(2);
    expect(tx.cuentaCorriente.update).toHaveBeenCalledTimes(2);
  });

  it("A3: original + reversión suma 0 por cuenta y moneda (inverso exacto de cada pata)", async () => {
    const origen = movOriginal({ id: "m-origen", cuentaCorrienteId: "cc-ars", tipo: "EGRESO", monto: new Decimal(100), descripcion: "RULO ARS->USD | op:REF1" });
    const destino = movOriginal({ id: "m-destino", cuentaCorrienteId: "cc-usd", tipo: "INGRESO", monto: new Decimal(150), descripcion: "RULO ARS->USD | op:REF1" });
    tx.movimientoCC.findMany.mockResolvedValue([origen, destino]);
    tx.movimientoCC.findFirst.mockResolvedValue(null);
    tx.cuentaCorriente.findUniqueOrThrow.mockImplementation(async ({ where }: { where: { id: string } }) =>
      where.id === "cc-ars" ? { id: "cc-ars", saldo: new Decimal(500) } : { id: "cc-usd", saldo: new Decimal(300) },
    );

    await revertirOperacion(formDataOp("REF1"));

    const creates = tx.movimientoCC.create.mock.calls.map((c) => c[0].data);
    const invOrigen = creates.find((d: { cuentaCorrienteId: string }) => d.cuentaCorrienteId === "cc-ars");
    const invDestino = creates.find((d: { cuentaCorrienteId: string }) => d.cuentaCorrienteId === "cc-usd");

    // egreso original de 100 -> inverso debe ser INGRESO de 100 (neto 0)
    expect(invOrigen.tipo).toBe("INGRESO");
    expect(invOrigen.monto.equals(origen.monto)).toBe(true);
    // ingreso original de 150 -> inverso debe ser EGRESO de 150 (neto 0)
    expect(invDestino.tipo).toBe("EGRESO");
    expect(invDestino.monto.equals(destino.monto)).toBe(true);
  });

  it("A4/A5/A6: segunda reversión rechazada — 0 movimientos nuevos, 0 cambios de saldo", async () => {
    const original = movOriginal({ descripcion: "LP egreso | op:REF1" });
    tx.movimientoCC.findMany.mockResolvedValue([original]);
    // ya existe una reversión (ref:REF1) encontrada tras el lock
    tx.movimientoCC.findFirst.mockResolvedValue(
      movOriginal({ id: "rev1", descripcion: "REVERSO EGRESO | op:REF2 | ref:REF1" }),
    );

    const result = await revertirOperacion(formDataOp("REF1"));

    expect(result).toEqual({ error: "Esta operación ya fue revertida" });
    expect(tx.movimientoCC.create).not.toHaveBeenCalled();
    expect(tx.cuentaCorriente.update).not.toHaveBeenCalled();
  });

  it("A7: un reversalRef no puede revertirse como si fuera un operationRef original", async () => {
    // El operationRef pasado en realidad identifica un grupo REVERSO (alguien
    // intenta revertir la propia reversión).
    tx.movimientoCC.findMany.mockResolvedValue([
      movOriginal({ id: "rev1", descripcion: "REVERSO EGRESO | op:REF2 | ref:REF1" }),
    ]);

    const result = await revertirOperacion(formDataOp("REF2"));

    expect(result).toEqual({ error: "No se puede revertir una reversión" });
    expect(tx.movimientoCC.create).not.toHaveBeenCalled();
    expect(tx.cuentaCorriente.update).not.toHaveBeenCalled();
  });

  it("A8: operationRef inexistente es rechazado sin escribir nada", async () => {
    tx.movimientoCC.findMany.mockResolvedValue([]);

    const result = await revertirOperacion(formDataOp("no-existe"));

    expect(result).toEqual({ error: "No se encontraron movimientos para esta operación" });
    expect(tx.$queryRaw).not.toHaveBeenCalled();
    expect(tx.movimientoCC.create).not.toHaveBeenCalled();
  });

  it("A9: operationRef vacío/inválido rechazado antes de tocar la base", async () => {
    const result = await revertirOperacion(formDataOp("   "));

    expect(result).toEqual({ error: "operationRef requerido" });
    expect(mockPrisma.$transaction).not.toHaveBeenCalled();
  });

  it("A10: un fallo durante la escritura no continúa con las siguientes patas ni reporta éxito", async () => {
    const origen = movOriginal({ id: "m-origen", cuentaCorrienteId: "cc-ars", tipo: "EGRESO", monto: new Decimal(100), descripcion: "RULO ARS->USD | op:REF1" });
    const destino = movOriginal({ id: "m-destino", cuentaCorrienteId: "cc-usd", tipo: "INGRESO", monto: new Decimal(150), descripcion: "RULO ARS->USD | op:REF1" });
    tx.movimientoCC.findMany.mockResolvedValue([origen, destino]);
    tx.movimientoCC.findFirst.mockResolvedValue(null);

    // la creación de la 2da pata falla (simula error de escritura intermedio)
    tx.movimientoCC.create
      .mockResolvedValueOnce({})
      .mockRejectedValueOnce(new Error("DB write failed"));

    const result = await revertirOperacion(formDataOp("REF1"));

    expect(result).toEqual({ error: "DB write failed" });
    // el saldo de la 2da cuenta nunca se llegó a actualizar (la excepción
    // cortó el loop antes); en Postgres real esto además revierte todo lo
    // que sí se alcanzó a escribir porque corre dentro de una misma
    // transacción interactiva — eso no lo puede demostrar este mock, lo deja
    // para A3/integración real.
    expect(tx.cuentaCorriente.update).toHaveBeenCalledTimes(1);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// A''. ejecutarOperacion — creación LP (OPS-02, regresión)
// ════════════════════════════════════════════════════════════════════════════

describe("ejecutarOperacion — creación LP (OPS-02)", () => {
  it("1/2: crea un MovimientoCC EGRESO y reduce el saldo de la cuenta USD", async () => {
    tx.cuentaCorriente.findFirst.mockResolvedValue({ id: "cc-usd", saldo: new Decimal(5000) });
    tx.plazoFijo.create.mockResolvedValue(plazoFijoMock({ id: "pf-new" }));

    const result = await ejecutarOperacion(formDataEjecutarLP({ monto: "1000" }));

    expect("success" in result && result.success).toBe(true);
    expect(tx.movimientoCC.create).toHaveBeenCalledTimes(1);
    const movData = tx.movimientoCC.create.mock.calls[0][0].data;
    expect(movData.tipo).toBe("EGRESO");
    expect(movData.cuentaCorrienteId).toBe("cc-usd");
    expect(tx.cuentaCorriente.update).toHaveBeenCalledTimes(1);
    const nuevoSaldo = tx.cuentaCorriente.update.mock.calls[0][0].data.saldo as Decimal;
    expect(nuevoSaldo.equals(new Decimal(4000))).toBe(true);
  });

  it("3/4/5: crea exactamente 1 PlazoFijo, ACTIVO, con capital === saldoActual === monto", async () => {
    tx.plazoFijo.create.mockResolvedValue(plazoFijoMock({ id: "pf-new" }));

    await ejecutarOperacion(formDataEjecutarLP({ monto: "2500" }));

    expect(tx.plazoFijo.create).toHaveBeenCalledTimes(1);
    const pfData = tx.plazoFijo.create.mock.calls[0][0].data;
    expect(pfData.estado).toBe("ACTIVO");
    expect((pfData.capital as Decimal).equals(new Decimal(2500))).toBe(true);
    expect((pfData.saldoActual as Decimal).equals(new Decimal(2500))).toBe(true);
  });

  it("6: el MovimientoCC y el PlazoFijo comparten exactamente el mismo operationRef", async () => {
    tx.plazoFijo.create.mockResolvedValue(plazoFijoMock({ id: "pf-new" }));

    await ejecutarOperacion(formDataEjecutarLP());

    const movDesc = tx.movimientoCC.create.mock.calls[0][0].data.descripcion as string;
    const pfNotas = tx.plazoFijo.create.mock.calls[0][0].data.notas as string;
    const movRef = movDesc.match(/op:([a-zA-Z0-9-]+)/)?.[1];
    const pfRef = pfNotas.match(/op:([a-zA-Z0-9-]+)/)?.[1];
    expect(movRef).toBeTruthy();
    expect(movRef).toBe(pfRef);
  });

  it("7: un fallo en PlazoFijo.create se reporta como error (rollback lógico de toda la operación)", async () => {
    tx.plazoFijo.create.mockRejectedValue(new Error("DB write failed"));

    const result = await ejecutarOperacion(formDataEjecutarLP());

    expect(result).toEqual({ error: "DB write failed" });
  });
});

// ════════════════════════════════════════════════════════════════════════════
// B'. revertirOperacion — LP (OPS-02)
// ════════════════════════════════════════════════════════════════════════════
//
// La protección de OPS-01 (lock de MovimientoCC + re-check de ref:) queda
// intacta; estos tests cubren exclusivamente el agregado de OPS-02: resolver,
// lockear y validar el PlazoFijo asociado, y cancelarlo en la misma
// transacción.

describe("revertirOperacion — LP (OPS-02)", () => {
  function lpOriginal(monto = new Decimal(1000)) {
    return movOriginal({
      id: "lp-mov-1",
      cuentaCorrienteId: "cc-usd",
      tipo: "EGRESO",
      monto,
      descripcion: "LP egreso | op:REF-LP-1",
    });
  }

  function pfActivo(over?: Partial<{ id: string; notas: string; estado: string }>) {
    return plazoFijoMock({
      id: over?.id ?? "pf-1",
      notas: over?.notas ?? "LP automático | op:REF-LP-1",
      estado: over?.estado ?? "ACTIVO",
    });
  }

  it("8/9/10: LP ACTIVO se revierte — exactamente 1 inverso INGRESO por el capital exacto", async () => {
    tx.movimientoCC.findMany.mockResolvedValue([lpOriginal(new Decimal(1000))]);
    tx.movimientoCC.findFirst.mockResolvedValue(null);
    tx.plazoFijo.findMany.mockResolvedValue([pfActivo()]);
    tx.plazoFijo.findUniqueOrThrow.mockResolvedValue(pfActivo());

    const result = await revertirOperacion(formDataOp("REF-LP-1"));

    expect(result).toEqual({ success: true });
    expect(tx.movimientoCC.create).toHaveBeenCalledTimes(1);
    const movData = tx.movimientoCC.create.mock.calls[0][0].data;
    expect(movData.tipo).toBe("INGRESO");
    expect((movData.monto as Decimal).equals(new Decimal(1000))).toBe(true);
    expect(movData.descripcion).toMatch(/^REVERSO EGRESO \| op:[a-zA-Z0-9-]+ \| ref:REF-LP-1$/);
  });

  it("11/12: el PF queda CANCELADO con saldoActual en 0", async () => {
    tx.movimientoCC.findMany.mockResolvedValue([lpOriginal()]);
    tx.movimientoCC.findFirst.mockResolvedValue(null);
    tx.plazoFijo.findMany.mockResolvedValue([pfActivo()]);
    tx.plazoFijo.findUniqueOrThrow.mockResolvedValue(pfActivo());

    await revertirOperacion(formDataOp("REF-LP-1"));

    expect(tx.plazoFijo.update).toHaveBeenCalledTimes(1);
    const [{ where, data }] = tx.plazoFijo.update.mock.calls[0];
    expect(where.id).toBe("pf-1");
    expect(data.estado).toBe("CANCELADO");
    expect((data.saldoActual as Decimal).equals(new Decimal(0))).toBe(true);
  });

  it("13/14: capital, tasa y fechas históricas del PF no se tocan (no vienen en el update)", async () => {
    tx.movimientoCC.findMany.mockResolvedValue([lpOriginal()]);
    tx.movimientoCC.findFirst.mockResolvedValue(null);
    tx.plazoFijo.findMany.mockResolvedValue([pfActivo()]);
    tx.plazoFijo.findUniqueOrThrow.mockResolvedValue(pfActivo());

    await revertirOperacion(formDataOp("REF-LP-1"));

    const data = tx.plazoFijo.update.mock.calls[0][0].data;
    expect(data).not.toHaveProperty("capital");
    expect(data).not.toHaveProperty("tasaAnual");
    expect(data).not.toHaveProperty("fechaInicio");
    expect(data).not.toHaveProperty("fechaVencimiento");
    expect(data).not.toHaveProperty("moneda");
    expect(data).not.toHaveProperty("clienteId");
    expect(data).not.toHaveProperty("notas");
  });

  it("15: original + reversión netean cero en la cuenta corriente", async () => {
    tx.movimientoCC.findMany.mockResolvedValue([lpOriginal(new Decimal(750))]);
    tx.movimientoCC.findFirst.mockResolvedValue(null);
    tx.plazoFijo.findMany.mockResolvedValue([pfActivo()]);
    tx.plazoFijo.findUniqueOrThrow.mockResolvedValue(pfActivo());

    await revertirOperacion(formDataOp("REF-LP-1"));

    const movData = tx.movimientoCC.create.mock.calls[0][0].data;
    expect(movData.tipo).toBe("INGRESO");
    expect((movData.monto as Decimal).equals(new Decimal(750))).toBe(true);
  });

  it("16: la cancelación del PF ocurre en la misma transacción que el movimiento inverso y el saldo", async () => {
    tx.movimientoCC.findMany.mockResolvedValue([lpOriginal()]);
    tx.movimientoCC.findFirst.mockResolvedValue(null);
    tx.plazoFijo.findMany.mockResolvedValue([pfActivo()]);
    tx.plazoFijo.findUniqueOrThrow.mockResolvedValue(pfActivo());

    await revertirOperacion(formDataOp("REF-LP-1"));

    expect(mockPrisma.$transaction).toHaveBeenCalledTimes(1);
    expect(tx.movimientoCC.create).toHaveBeenCalledTimes(1);
    expect(tx.cuentaCorriente.update).toHaveBeenCalledTimes(1);
    expect(tx.plazoFijo.update).toHaveBeenCalledTimes(1);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// C'. revertirOperacion — validaciones LP (OPS-02)
// ════════════════════════════════════════════════════════════════════════════

describe("revertirOperacion — validaciones LP (OPS-02)", () => {
  it("17: LP sin PF asociado → error, 0 escrituras", async () => {
    tx.movimientoCC.findMany.mockResolvedValue([movOriginal({ descripcion: "LP egreso | op:REF-LP-X" })]);
    tx.movimientoCC.findFirst.mockResolvedValue(null);
    tx.plazoFijo.findMany.mockResolvedValue([]);

    const result = await revertirOperacion(formDataOp("REF-LP-X"));

    expect("error" in result && result.error).toMatch(/no se encontró el plazo fijo/i);
    expect(tx.movimientoCC.create).not.toHaveBeenCalled();
    expect(tx.cuentaCorriente.update).not.toHaveBeenCalled();
    expect(tx.plazoFijo.update).not.toHaveBeenCalled();
  });

  it("18: LP con 2 PF asociados al mismo ref exacto → error, 0 escrituras", async () => {
    tx.movimientoCC.findMany.mockResolvedValue([movOriginal({ descripcion: "LP egreso | op:REF-LP-DUP" })]);
    tx.movimientoCC.findFirst.mockResolvedValue(null);
    tx.plazoFijo.findMany.mockResolvedValue([
      plazoFijoMock({ id: "pf-a", notas: "LP automático | op:REF-LP-DUP" }),
      plazoFijoMock({ id: "pf-b", notas: "LP automático | op:REF-LP-DUP" }),
    ]);

    const result = await revertirOperacion(formDataOp("REF-LP-DUP"));

    expect("error" in result && result.error).toMatch(/múltiples plazos fijos/i);
    expect(tx.movimientoCC.create).not.toHaveBeenCalled();
    expect(tx.plazoFijo.update).not.toHaveBeenCalled();
  });

  it("19: un substring parecido (op:abc vs op:abcdef) NO cuenta como match del PF", async () => {
    tx.movimientoCC.findMany.mockResolvedValue([movOriginal({ descripcion: "LP egreso | op:abc" })]);
    tx.movimientoCC.findFirst.mockResolvedValue(null);
    // El "contains" de Prisma está mockeado (no filtra de verdad); simulamos
    // que la DB devolvió este candidato porque "op:abc" es substring de
    // "op:abcdef" — el código debe descartarlo igual por comparación exacta.
    tx.plazoFijo.findMany.mockResolvedValue([
      plazoFijoMock({ id: "pf-parecido", notas: "LP automático | op:abcdef" }),
    ]);

    const result = await revertirOperacion(formDataOp("abc"));

    expect("error" in result && result.error).toMatch(/no se encontró el plazo fijo/i);
    expect(tx.movimientoCC.create).not.toHaveBeenCalled();
  });

  it("post-lock: si el operationRef de la fila ya no coincide después de adquirir el lock, se rechaza sin escribir nada", async () => {
    tx.movimientoCC.findMany.mockResolvedValue([movOriginal({ descripcion: "LP egreso | op:REF-LP-RACE" })]);
    tx.movimientoCC.findFirst.mockResolvedValue(null);
    // El filtro exacto previo al lock encuentra un único candidato correcto...
    tx.plazoFijo.findMany.mockResolvedValue([
      plazoFijoMock({ id: "pf-race", notas: "LP automático | op:REF-LP-RACE", estado: "ACTIVO" }),
    ]);
    // ...pero la relectura posterior al FOR UPDATE trae una fila cuyo notas
    // ya no corresponde a ese operationRef (simula que cambió entre el
    // filtro y la adquisición del lock).
    tx.plazoFijo.findUniqueOrThrow.mockResolvedValue(
      plazoFijoMock({ id: "pf-race", notas: "LP automático | op:REF-LP-OTRO", estado: "ACTIVO" }),
    );

    const result = await revertirOperacion(formDataOp("REF-LP-RACE"));

    expect("error" in result && result.error).toMatch(/ya no corresponde a esta operación LP/i);
    expect(tx.movimientoCC.create).not.toHaveBeenCalled();
    expect(tx.cuentaCorriente.update).not.toHaveBeenCalled();
    expect(tx.plazoFijo.update).not.toHaveBeenCalled();
  });

  it("20: PF CANCELADO → reversión rechazada, 0 escrituras", async () => {
    tx.movimientoCC.findMany.mockResolvedValue([movOriginal({ descripcion: "LP egreso | op:REF-LP-CANC" })]);
    tx.movimientoCC.findFirst.mockResolvedValue(null);
    tx.plazoFijo.findMany.mockResolvedValue([plazoFijoMock({ id: "pf-c", notas: "LP automático | op:REF-LP-CANC", estado: "CANCELADO" })]);
    tx.plazoFijo.findUniqueOrThrow.mockResolvedValue(plazoFijoMock({ id: "pf-c", notas: "LP automático | op:REF-LP-CANC", estado: "CANCELADO" }));

    const result = await revertirOperacion(formDataOp("REF-LP-CANC"));

    expect("error" in result && result.error).toMatch(/CANCELADO/);
    expect(tx.movimientoCC.create).not.toHaveBeenCalled();
    expect(tx.cuentaCorriente.update).not.toHaveBeenCalled();
    expect(tx.plazoFijo.update).not.toHaveBeenCalled();
  });

  it("21: PF VENCIDO → reversión rechazada", async () => {
    tx.movimientoCC.findMany.mockResolvedValue([movOriginal({ descripcion: "LP egreso | op:REF-LP-VENC" })]);
    tx.movimientoCC.findFirst.mockResolvedValue(null);
    tx.plazoFijo.findMany.mockResolvedValue([plazoFijoMock({ id: "pf-v", notas: "LP automático | op:REF-LP-VENC", estado: "VENCIDO" })]);
    tx.plazoFijo.findUniqueOrThrow.mockResolvedValue(plazoFijoMock({ id: "pf-v", notas: "LP automático | op:REF-LP-VENC", estado: "VENCIDO" }));

    const result = await revertirOperacion(formDataOp("REF-LP-VENC"));

    expect("error" in result && result.error).toMatch(/VENCIDO/);
    expect(tx.movimientoCC.create).not.toHaveBeenCalled();
  });

  it("22: PF RENOVADO → reversión rechazada", async () => {
    tx.movimientoCC.findMany.mockResolvedValue([movOriginal({ descripcion: "LP egreso | op:REF-LP-REN" })]);
    tx.movimientoCC.findFirst.mockResolvedValue(null);
    tx.plazoFijo.findMany.mockResolvedValue([plazoFijoMock({ id: "pf-r", notas: "LP automático | op:REF-LP-REN", estado: "RENOVADO" })]);
    tx.plazoFijo.findUniqueOrThrow.mockResolvedValue(plazoFijoMock({ id: "pf-r", notas: "LP automático | op:REF-LP-REN", estado: "RENOVADO" }));

    const result = await revertirOperacion(formDataOp("REF-LP-REN"));

    expect("error" in result && result.error).toMatch(/RENOVADO/);
    expect(tx.movimientoCC.create).not.toHaveBeenCalled();
  });

  it("23: un fallo al actualizar el PF se reporta como error tras haber escrito el movimiento/saldo en la misma llamada a la transacción", async () => {
    tx.movimientoCC.findMany.mockResolvedValue([movOriginal({ descripcion: "LP egreso | op:REF-LP-FAIL" })]);
    tx.movimientoCC.findFirst.mockResolvedValue(null);
    tx.plazoFijo.findMany.mockResolvedValue([plazoFijoMock({ id: "pf-f", notas: "LP automático | op:REF-LP-FAIL", estado: "ACTIVO" })]);
    tx.plazoFijo.findUniqueOrThrow.mockResolvedValue(plazoFijoMock({ id: "pf-f", notas: "LP automático | op:REF-LP-FAIL", estado: "ACTIVO" }));
    tx.plazoFijo.update.mockRejectedValue(new Error("DB write failed"));

    const result = await revertirOperacion(formDataOp("REF-LP-FAIL"));

    expect(result).toEqual({ error: "DB write failed" });
    // Con Postgres real, al lanzar dentro del callback de $transaction, todo
    // lo ya escrito en esa misma llamada (el create y el update de abajo)
    // hace rollback junto con este error — un mock sin base real detrás no
    // puede demostrar esa reversión física, solo que ambas llamadas SÍ se
    // hicieron antes del fallo (dentro del mismo bloque transaccional):
    expect(tx.movimientoCC.create).toHaveBeenCalledTimes(1);
    expect(tx.cuentaCorriente.update).toHaveBeenCalledTimes(1);
  });

  it("24: segunda reversión de un LP sigue rechazada por el guard de OPS-01, sin llegar a resolver el PF", async () => {
    tx.movimientoCC.findMany.mockResolvedValue([movOriginal({ descripcion: "LP egreso | op:REF-LP-2ND" })]);
    tx.movimientoCC.findFirst.mockResolvedValue(
      movOriginal({ id: "rev1", descripcion: "REVERSO EGRESO | op:REF-LP-2ND-R | ref:REF-LP-2ND" }),
    );

    const result = await revertirOperacion(formDataOp("REF-LP-2ND"));

    expect(result).toEqual({ error: "Esta operación ya fue revertida" });
    expect(tx.plazoFijo.findMany).not.toHaveBeenCalled();
    expect(tx.plazoFijo.update).not.toHaveBeenCalled();
  });
});

// ════════════════════════════════════════════════════════════════════════════
// A'. INTERES — operación lógica de una sola pata (ajuste final A2.1)
// ════════════════════════════════════════════════════════════════════════════
//
// INTERES lleva op:{operationRef} igual que RULO/DIVISA/LP, pero es un único
// MovimientoCC (sin pata "destino"). revertirOperacion es genérica sobre
// cualquier grupo op: — no necesitó cambios de código para soportarlo; estos
// tests lo demuestran explícitamente.

describe("revertirOperacion — INTERES (ajuste final A2.1)", () => {
  function interesOriginal(monto = new Decimal(25)) {
    return movOriginal({
      id: "int-1",
      cuentaCorrienteId: "cc-1",
      tipo: "INTERES",
      monto,
      descripcion: "INTERES CC | op:REF-INT-1",
    });
  }

  it("1/3/4: un INTERES de un solo MovimientoCC se revierte por revertirOperacion — exactamente un movimiento inverso con op:{reversalRef} | ref:{operationRef}", async () => {
    tx.movimientoCC.findMany.mockResolvedValue([interesOriginal()]);
    tx.movimientoCC.findFirst.mockResolvedValue(null); // sin reversión previa
    tx.cuentaCorriente.findUniqueOrThrow.mockResolvedValue({ id: "cc-1", saldo: new Decimal(1025) });

    const result = await revertirOperacion(formDataOp("REF-INT-1"));

    expect(result).toEqual({ success: true });
    expect(tx.movimientoCC.create).toHaveBeenCalledTimes(1);

    const created = tx.movimientoCC.create.mock.calls[0][0].data;
    expect(created.descripcion).toMatch(/^REVERSO INTERES \| op:[a-zA-Z0-9-]+ \| ref:REF-INT-1$/);
  });

  it("2: el saldo vuelve exactamente al valor previo a aplicar el interés", async () => {
    const monto = new Decimal(25);
    tx.movimientoCC.findMany.mockResolvedValue([interesOriginal(monto)]);
    tx.movimientoCC.findFirst.mockResolvedValue(null);
    // saldo actual = 1000 (previo) + 25 (interés aplicado) = 1025
    tx.cuentaCorriente.findUniqueOrThrow.mockResolvedValue({ id: "cc-1", saldo: new Decimal(1025) });

    await revertirOperacion(formDataOp("REF-INT-1"));

    expect(tx.cuentaCorriente.update).toHaveBeenCalledTimes(1);
    const nuevoSaldo = tx.cuentaCorriente.update.mock.calls[0][0].data.saldo as Decimal;
    expect(nuevoSaldo.equals(new Decimal(1000))).toBe(true); // vuelve exacto al valor previo
  });

  it("5/6: segunda reversión del mismo INTERES es rechazada — 0 movimientos nuevos, 0 modificaciones de saldo", async () => {
    tx.movimientoCC.findMany.mockResolvedValue([interesOriginal()]);
    // ya existe una reversión (ref:REF-INT-1) encontrada tras el lock
    tx.movimientoCC.findFirst.mockResolvedValue(
      movOriginal({ id: "rev-int-1", descripcion: "REVERSO INTERES | op:REF-INT-2 | ref:REF-INT-1" }),
    );

    const result = await revertirOperacion(formDataOp("REF-INT-1"));

    expect(result).toEqual({ error: "Esta operación ya fue revertida" });
    expect(tx.movimientoCC.create).not.toHaveBeenCalled();
    expect(tx.cuentaCorriente.update).not.toHaveBeenCalled();
  });

  it("7: INTERES sigue siendo rechazado por revertirMovimientoCC(id) — tiene op:", async () => {
    tx.movimientoCC.findUnique.mockResolvedValue({
      id: "int-1",
      cuentaCorrienteId: "cc-1",
      tipo: "INTERES",
      monto: new Decimal(25),
      descripcion: "INTERES CC | op:REF-INT-1",
      operacionCambioId: null,
      CuentaCorriente: { id: "cc-1", saldo: new Decimal(1025), clienteId: "cli-1", moneda: "USD" },
    });

    const result = await revertirMovimientoCC(null, formDataId("int-1"));

    expect(result.error).toMatch(/operación agrupada/i);
    expect(tx.movimientoCC.create).not.toHaveBeenCalled();
    expect(tx.cuentaCorriente.update).not.toHaveBeenCalled();
  });
});

// ════════════════════════════════════════════════════════════════════════════
// B. Cruce de caminos
// ════════════════════════════════════════════════════════════════════════════

describe("Cruce de caminos — revertirMovimientoCC vs revertirOperacion (OPS-01)", () => {
  it("11/12: un MovimientoCC con op: no puede pasar por revertirMovimientoCC y no escribe nada", async () => {
    tx.movimientoCC.findUnique.mockResolvedValue({
      id: "leg-1",
      cuentaCorrienteId: "cc-ars",
      tipo: "EGRESO",
      monto: new Decimal(100),
      descripcion: "RULO ARS->USD | op:REF1",
      operacionCambioId: null,
      CuentaCorriente: { id: "cc-ars", saldo: new Decimal(500), clienteId: "cli-1", moneda: "ARS" },
    });

    const result = await revertirMovimientoCC(null, formDataId("leg-1"));

    expect(result.error).toMatch(/operación agrupada/i);
    expect(tx.$queryRaw).not.toHaveBeenCalled();
    expect(tx.movimientoCC.create).not.toHaveBeenCalled();
    expect(tx.cuentaCorriente.update).not.toHaveBeenCalled();
  });

  it("13: una pata ya revertida vía revertirOperacion sigue bloqueada por op: en revertirMovimientoCC (no hay forma de revertir por los dos caminos)", async () => {
    // La pata original NUNCA se modifica cuando se revierte por operación —
    // sigue trayendo su op:REF1 igual que antes. El chequeo de op: en
    // revertirMovimientoCC la bloquea sin importar si REF1 ya fue revertida o no.
    tx.movimientoCC.findUnique.mockResolvedValue({
      id: "leg-1",
      cuentaCorrienteId: "cc-ars",
      tipo: "EGRESO",
      monto: new Decimal(100),
      descripcion: "RULO ARS->USD | op:REF1",
      operacionCambioId: null,
      CuentaCorriente: { id: "cc-ars", saldo: new Decimal(500), clienteId: "cli-1", moneda: "ARS" },
    });

    const result = await revertirMovimientoCC(null, formDataId("leg-1"));

    expect(result.error).toMatch(/operación agrupada/i);
    expect(tx.movimientoCC.create).not.toHaveBeenCalled();
  });
});

// ════════════════════════════════════════════════════════════════════════════
// C. revertirMovimientoCC manual
// ════════════════════════════════════════════════════════════════════════════

describe("revertirMovimientoCC — Camino C, movimientos manuales (OPS-01)", () => {
  function movManual() {
    return {
      id: "mov-manual-1",
      cuentaCorrienteId: "cc-1",
      tipo: "EGRESO",
      monto: new Decimal(50),
      descripcion: "Ajuste manual de saldo",
      operacionCambioId: null,
      CuentaCorriente: { id: "cc-1", saldo: new Decimal(200), clienteId: "cli-1", moneda: "USD" },
    };
  }

  it("14: reversión individual válida", async () => {
    tx.movimientoCC.findUnique.mockResolvedValue(movManual());
    tx.movimientoCC.findFirst.mockResolvedValue(null); // sin reversión previa (movref:)

    const result = await revertirMovimientoCC(null, formDataId("mov-manual-1"));

    expect(result).toEqual({ ok: true });
    expect(tx.movimientoCC.create).toHaveBeenCalledTimes(1);
    expect(tx.cuentaCorriente.update).toHaveBeenCalledTimes(1);
    const createdDesc = tx.movimientoCC.create.mock.calls[0][0].data.descripcion as string;
    expect(createdDesc).toContain("movref:mov-manual-1");
  });

  it("15/16/17: segundo intento rechazado — 0 movimientos nuevos, 0 cambio de saldo", async () => {
    tx.movimientoCC.findUnique.mockResolvedValue(movManual());
    // ya existe una reversión individual previa (movref:mov-manual-1)
    tx.movimientoCC.findFirst.mockResolvedValue({
      id: "rev-1",
      descripcion: "[REVERSO por Otro] Ajuste manual de saldo | movref:mov-manual-1",
    });

    const result = await revertirMovimientoCC(null, formDataId("mov-manual-1"));

    expect(result).toEqual({ error: "Este movimiento ya fue revertido" });
    expect(tx.movimientoCC.create).not.toHaveBeenCalled();
    expect(tx.cuentaCorriente.update).not.toHaveBeenCalled();
  });

  it("18: un movimiento de reversión no puede volver a revertirse", async () => {
    tx.movimientoCC.findUnique.mockResolvedValue({
      id: "rev-1",
      cuentaCorrienteId: "cc-1",
      tipo: "INGRESO",
      monto: new Decimal(50),
      descripcion: "[REVERSO por Admin] Ajuste manual de saldo | movref:mov-manual-1",
      operacionCambioId: null,
      CuentaCorriente: { id: "cc-1", saldo: new Decimal(200), clienteId: "cli-1", moneda: "USD" },
    });

    const result = await revertirMovimientoCC(null, formDataId("rev-1"));

    expect(result).toEqual({ error: "Este movimiento ya es una reversión" });
    expect(tx.movimientoCC.create).not.toHaveBeenCalled();
  });

  it("ID vacío es rechazado sin tocar la base", async () => {
    const result = await revertirMovimientoCC(null, new FormData());
    expect(result).toEqual({ error: "ID requerido" });
    expect(mockPrisma.$transaction).not.toHaveBeenCalled();
  });

  it("movimiento inexistente es rechazado", async () => {
    tx.movimientoCC.findUnique.mockResolvedValue(null);
    const result = await revertirMovimientoCC(null, formDataId("no-existe"));
    expect(result).toEqual({ error: "Movimiento no encontrado" });
    expect(tx.movimientoCC.create).not.toHaveBeenCalled();
  });
});

// ════════════════════════════════════════════════════════════════════════════
// E. Locking — presencia y orden del mecanismo de serialización (test 22)
// ════════════════════════════════════════════════════════════════════════════
//
// Estos tests NO reproducen contención real de PostgreSQL (eso requiere un test
// de integración contra una base real, fuera del alcance de esta suite mockeada
// — queda para A3). Solo verifican, a nivel de código, que:
//   (a) se emite un SELECT ... FOR UPDATE sobre los originales/el movimiento, y
//   (b) ese lock ocurre ANTES del re-chequeo de "ya revertida/o",
// que es la estructura mínima necesaria para que el lock real de Postgres
// pueda cerrar la ventana de carrera entre dos solicitudes concurrentes sobre
// el MISMO original.

describe("Locking — presencia y orden del SELECT ... FOR UPDATE (test 22)", () => {
  it("revertirOperacion: adquiere el lock antes de re-chequear si ya fue revertida", async () => {
    const original = movOriginal({ descripcion: "LP egreso | op:REF1" });
    tx.movimientoCC.findMany.mockResolvedValue([original]);

    const order: string[] = [];
    tx.$queryRaw.mockImplementation(async () => {
      order.push("lock");
      return [];
    });
    tx.movimientoCC.findFirst.mockImplementation(async () => {
      order.push("recheck");
      return null;
    });

    await revertirOperacion(formDataOp("REF1"));

    expect(tx.$queryRaw).toHaveBeenCalledTimes(1);
    const sqlParts = (tx.$queryRaw.mock.calls[0][0] as TemplateStringsArray).join("");
    expect(sqlParts).toMatch(/FOR UPDATE/);
    expect(sqlParts).toContain('"MovimientoCC"');
    expect(order).toEqual(["lock", "recheck"]);
  });

  it("revertirMovimientoCC: adquiere el lock antes de re-chequear si ya fue revertido", async () => {
    tx.movimientoCC.findUnique.mockResolvedValue({
      id: "mov-manual-1",
      cuentaCorrienteId: "cc-1",
      tipo: "EGRESO",
      monto: new Decimal(50),
      descripcion: "Ajuste manual de saldo",
      operacionCambioId: null,
      CuentaCorriente: { id: "cc-1", saldo: new Decimal(200), clienteId: "cli-1", moneda: "USD" },
    });

    const order: string[] = [];
    tx.$queryRaw.mockImplementation(async () => {
      order.push("lock");
      return [];
    });
    tx.movimientoCC.findFirst.mockImplementation(async () => {
      order.push("recheck");
      return null;
    });

    await revertirMovimientoCC(null, formDataId("mov-manual-1"));

    expect(tx.$queryRaw).toHaveBeenCalledTimes(1);
    const sqlParts = (tx.$queryRaw.mock.calls[0][0] as TemplateStringsArray).join("");
    expect(sqlParts).toMatch(/FOR UPDATE/);
    expect(order).toEqual(["lock", "recheck"]);
  });
});
