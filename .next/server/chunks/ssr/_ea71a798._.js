module.exports = {

"[project]/src/app/(dashboard)/bolsa/actions.ts [app-rsc] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
/* __next_internal_action_entry_do_not_use__ [{"6035d53977bf5bc76d2c85bdca3e747632711bac75":"crearOpMesaDiaria","604d803f139ab5aa6ec97524e2ce14b730def75378":"concertarOperacion","606cfa9090426e36c2b3b1981fe0f1dea0988a1482":"agruparOperacionesArbitraje","60af330acff09f27046538c72d5de4c2db61ff0417":"crearOperacionBolsa","60ccca7881a3263e68458c7cf624546246d209d57f":"anularOperacion"},"",""] */ __turbopack_context__.s({
    "agruparOperacionesArbitraje": (()=>agruparOperacionesArbitraje),
    "anularOperacion": (()=>anularOperacion),
    "concertarOperacion": (()=>concertarOperacion),
    "crearOpMesaDiaria": (()=>crearOpMesaDiaria),
    "crearOperacionBolsa": (()=>crearOperacionBolsa)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/build/webpack/loaders/next-flight-loader/server-reference.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$app$2d$render$2f$encryption$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/app-render/encryption.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$auth$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/auth.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/prisma.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/cache.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$config$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/config.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$validate$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/build/webpack/loaders/next-flight-loader/action-validate.js [app-rsc] (ecmascript)");
;
;
;
;
;
;
const VENTA_TIPOS = new Set([
    "VENTA_BONO",
    "VENTA_ACCION",
    "VENTA_CEDEAR",
    "CAUCION_COLOCADORA"
]);
const COMPRA_ACTIVO = new Set([
    "COMPRA_BONO",
    "COMPRA_ACCION",
    "COMPRA_CEDEAR"
]);
const VENTA_ACTIVO = new Set([
    "VENTA_BONO",
    "VENTA_ACCION",
    "VENTA_CEDEAR"
]);
const TIPO_TO_HOLDING = {
    COMPRA_BONO: "BONO",
    VENTA_BONO: "BONO",
    COMPRA_ACCION: "ACCION",
    VENTA_ACCION: "ACCION",
    COMPRA_CEDEAR: "CEDEAR",
    VENTA_CEDEAR: "CEDEAR",
    CAUCION_COLOCADORA: "CAUCION",
    CAUCION_TOMADORA: "CAUCION"
};
function toN(v) {
    if (!v) return null;
    const n = parseFloat(v);
    return isNaN(n) ? null : n;
}
async function crearOperacionBolsa(prevState, formData) {
    if (__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$config$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["readOnlyPreview"]) return {
        error: "Modo lectura activo"
    };
    const session = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$auth$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["auth"])();
    const userId = session?.user?.id;
    if (!userId) return {
        error: "Sin sesión activa"
    };
    const sujetoTipo = formData.get("sujetoTipo");
    const comitenteId = formData.get("comitenteId") || null;
    const carteraId = formData.get("carteraId") || null;
    const tipoRaw = formData.get("tipoOperacion");
    const ticker = formData.get("ticker")?.trim().toUpperCase();
    const cantidadRaw = formData.get("cantidad");
    const precioRaw = formData.get("precio");
    const moneda = formData.get("moneda");
    const mercado = formData.get("mercado");
    const observaciones = formData.get("observaciones")?.trim() || null;
    if (!tipoRaw || !ticker || !cantidadRaw || !precioRaw || !moneda || !mercado) return {
        error: "Faltan campos obligatorios"
    };
    if (sujetoTipo === "comitente" && !comitenteId) return {
        error: "Seleccionar comitente"
    };
    if (sujetoTipo === "cartera" && !carteraId) return {
        error: "Seleccionar cartera"
    };
    const cantidad = parseFloat(cantidadRaw);
    const precio = parseFloat(precioRaw);
    if (isNaN(cantidad) || cantidad <= 0) return {
        error: "Cantidad inválida"
    };
    if (isNaN(precio) || precio <= 0) return {
        error: "Precio inválido"
    };
    try {
        const now = new Date();
        const id = crypto.randomUUID();
        await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].$transaction(async (tx)=>{
            await tx.operacionBolsa.create({
                data: {
                    id,
                    comitenteId: sujetoTipo === "comitente" ? comitenteId : null,
                    carteraId: sujetoTipo === "cartera" ? carteraId : null,
                    tipoOperacion: tipoRaw,
                    ticker,
                    cantidad,
                    precio,
                    moneda: moneda,
                    mercado: mercado,
                    observaciones,
                    operadorCargaId: userId,
                    estado: "PENDIENTE_CONCERTACION",
                    updatedAt: now
                }
            });
            await tx.operacionBolsaLog.create({
                data: {
                    id: crypto.randomUUID(),
                    operacionId: id,
                    userId,
                    accion: "CARGA",
                    estadoNuevo: "PENDIENTE_CONCERTACION",
                    snapshot: {
                        ticker,
                        cantidad,
                        precio,
                        moneda,
                        mercado,
                        tipoOperacion: tipoRaw
                    }
                }
            });
        });
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["revalidatePath"])("/bolsa");
        return {
            ok: true,
            id
        };
    } catch (e) {
        console.error("[crearOperacionBolsa]", e);
        return {
            error: "Error al guardar la operación. Verificar datos ingresados."
        };
    }
}
async function concertarOperacion(prevState, formData) {
    if (__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$config$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["readOnlyPreview"]) return {
        error: "Modo lectura activo"
    };
    const session = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$auth$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["auth"])();
    const userId = session?.user?.id;
    if (!userId) return {
        error: "Sin sesión activa"
    };
    const operacionId = formData.get("operacionId");
    if (!operacionId) return {
        error: "ID operación requerido"
    };
    const op = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].operacionBolsa.findUnique({
        where: {
            id: operacionId
        }
    });
    if (!op) return {
        error: "Operación no encontrada"
    };
    if (op.estado === "ANULADA") return {
        error: "Operación anulada, no modificable"
    };
    if (op.estado === "LIQUIDADA") return {
        error: "Operación liquidada, no modificable"
    };
    const nroBoleto = formData.get("nroBoleto")?.trim() || null;
    const alyc = formData.get("alyc")?.trim() || null;
    const fechaConcertRaw = formData.get("fechaConcertacion");
    const fechaLiquidRaw = formData.get("fechaLiquidacion");
    const comisionPct = toN(formData.get("comisionPct"));
    const comisionFija = toN(formData.get("comisionFija"));
    const derechosMercado = toN(formData.get("derechosMercado"));
    const gastos = toN(formData.get("gastos"));
    const impuestos = toN(formData.get("impuestos"));
    const tcMepDia = toN(formData.get("tcMepDia"));
    const comisionUSD = toN(formData.get("comisionUSD"));
    const netoLiquidadoManual = toN(formData.get("netoLiquidadoManual"));
    const esSenebi = formData.get("esSenebi") === "true";
    const senebiBruto = esSenebi ? toN(formData.get("senebiBruto")) : null;
    const diasCaucionRaw = formData.get("diasCaucion");
    const diasCaucion = diasCaucionRaw ? parseInt(diasCaucionRaw) : null;
    const tasaCaucion = toN(formData.get("tasaCaucion"));
    // Calculations
    const cantidad = Number(op.cantidad);
    const precio = Number(op.precio);
    const valorBruto = cantidad * precio;
    const costoReal = (comisionFija ?? 0) + valorBruto * ((comisionPct ?? 0) / 100) + (derechosMercado ?? 0) + (gastos ?? 0) + (impuestos ?? 0);
    const esVenta = VENTA_TIPOS.has(op.tipoOperacion);
    const netoCalculado = esVenta ? valorBruto - costoReal : valorBruto + costoReal;
    const netoLiquidado = netoLiquidadoManual ?? netoCalculado;
    const precioPromedioReal = !esVenta && cantidad > 0 ? netoLiquidado / cantidad : null;
    const isNewConcertation = op.estado === "PENDIENTE_CONCERTACION";
    try {
        const now = new Date();
        await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].$transaction(async (tx)=>{
            await tx.operacionBolsa.update({
                where: {
                    id: operacionId
                },
                data: {
                    estado: "CONCERTADA",
                    operadorCierreId: userId,
                    nroBoleto,
                    alyc,
                    fechaConcertacion: fechaConcertRaw ? new Date(fechaConcertRaw) : null,
                    fechaLiquidacion: fechaLiquidRaw ? new Date(fechaLiquidRaw) : null,
                    comisionPct,
                    comisionFija,
                    derechosMercado,
                    gastos,
                    impuestos,
                    tcMepDia,
                    comisionUSD,
                    esSenebi,
                    senebiBruto,
                    diasCaucion: isNaN(diasCaucion) ? null : diasCaucion,
                    tasaCaucion,
                    costoReal,
                    netoLiquidado,
                    precioPromedioReal,
                    updatedAt: now
                }
            });
            await tx.operacionBolsaLog.create({
                data: {
                    id: crypto.randomUUID(),
                    operacionId,
                    userId,
                    accion: "CONCERTACION",
                    estadoAnterior: op.estado,
                    estadoNuevo: "CONCERTADA",
                    snapshot: {
                        nroBoleto,
                        alyc,
                        costoReal,
                        netoLiquidado,
                        precioPromedioReal
                    }
                }
            });
            // ── Impacto en comitente (solo primera concertación, solo compra/venta activos) ──
            if (isNewConcertation && op.comitenteId) {
                const holdingCat = TIPO_TO_HOLDING[op.tipoOperacion];
                const isCompra = COMPRA_ACTIVO.has(op.tipoOperacion);
                const isVenta = VENTA_ACTIVO.has(op.tipoOperacion);
                if ((isCompra || isVenta) && holdingCat) {
                    // 1. Actualizar saldo disponible
                    const saldoActual = await tx.saldoComitenteInversion.findUnique({
                        where: {
                            comitenteId: op.comitenteId
                        }
                    });
                    const delta = Math.abs(netoLiquidado);
                    const saldoData = op.moneda === "ARS" ? {
                        saldoARS: Number(saldoActual?.saldoARS ?? 0) + (isVenta ? delta : -delta)
                    } : {
                        saldoUSDCable: Number(saldoActual?.saldoUSDCable ?? 0) + (isVenta ? delta : -delta)
                    };
                    await tx.saldoComitenteInversion.upsert({
                        where: {
                            comitenteId: op.comitenteId
                        },
                        update: {
                            ...saldoData,
                            updatedAt: new Date()
                        },
                        create: {
                            id: crypto.randomUUID(),
                            comitenteId: op.comitenteId,
                            saldoARS: 0,
                            saldoUSDCable: 0,
                            saldoUSDMep: 0,
                            ...saldoData,
                            updatedAt: new Date()
                        }
                    });
                    // 2. Actualizar holding
                    const existing = await tx.holdingComitenteInversion.findUnique({
                        where: {
                            comitenteId_ticker: {
                                comitenteId: op.comitenteId,
                                ticker: op.ticker
                            }
                        }
                    });
                    if (isCompra) {
                        const precioReal = precioPromedioReal ?? precio;
                        if (existing) {
                            const existQty = Number(existing.cantidad);
                            const newQty = existQty + cantidad;
                            const newPrecioP = (existQty * Number(existing.precioPromedio) + cantidad * precioReal) / newQty;
                            await tx.holdingComitenteInversion.update({
                                where: {
                                    id: existing.id
                                },
                                data: {
                                    cantidad: newQty,
                                    precioPromedio: newPrecioP,
                                    updatedAt: new Date()
                                }
                            });
                        } else {
                            await tx.holdingComitenteInversion.create({
                                data: {
                                    id: crypto.randomUUID(),
                                    comitenteId: op.comitenteId,
                                    ticker: op.ticker,
                                    categoria: holdingCat,
                                    cantidad,
                                    precioPromedio: precioReal,
                                    updatedAt: new Date()
                                }
                            });
                        }
                        await tx.operacionHoldingInversion.create({
                            data: {
                                id: crypto.randomUUID(),
                                comitenteId: op.comitenteId,
                                holdingId: existing?.id ?? null,
                                tipo: "COMPRA",
                                ticker: op.ticker,
                                categoria: holdingCat,
                                cantidad,
                                precio,
                                precioPromedio: precioPromedioReal ?? precio,
                                notas: `Bolsa #${operacionId.slice(0, 8)}`
                            }
                        });
                    } else if (isVenta && existing) {
                        const existQty = Number(existing.cantidad);
                        const newQty = Math.max(0, existQty - cantidad);
                        if (newQty === 0) {
                            await tx.holdingComitenteInversion.delete({
                                where: {
                                    id: existing.id
                                }
                            });
                        } else {
                            await tx.holdingComitenteInversion.update({
                                where: {
                                    id: existing.id
                                },
                                data: {
                                    cantidad: newQty,
                                    updatedAt: new Date()
                                }
                            });
                        }
                        await tx.operacionHoldingInversion.create({
                            data: {
                                id: crypto.randomUUID(),
                                comitenteId: op.comitenteId,
                                holdingId: existing.id,
                                tipo: "VENTA",
                                ticker: op.ticker,
                                categoria: holdingCat,
                                cantidad,
                                precio,
                                precioPromedio: Number(existing.precioPromedio),
                                notas: `Bolsa #${operacionId.slice(0, 8)}`
                            }
                        });
                    }
                }
            }
        });
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["revalidatePath"])("/bolsa");
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["revalidatePath"])(`/bolsa/${operacionId}`);
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["revalidatePath"])("/cuentas-inversion", "layout");
        return {
            ok: true
        };
    } catch (e) {
        console.error("[concertarOperacion]", e);
        return {
            error: "Error al concertar la operación. Verificar datos y volver a intentar."
        };
    }
}
// ── CREAR (Mesa Diaria) ────────────────────────────────────────────────────
const CAUCION_TIPOS = new Set([
    "CAUCION_COLOCADORA",
    "CAUCION_TOMADORA"
]);
async function crearOpMesaDiaria(_prevState, formData) {
    if (__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$config$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["readOnlyPreview"]) return {
        error: "Modo lectura activo"
    };
    const session = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$auth$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["auth"])();
    const userId = session?.user?.id;
    if (!userId) return {
        error: "Sin sesión activa"
    };
    const sujetoTipo = formData.get("sujetoTipo");
    const comitenteId = formData.get("comitenteId") || null;
    const carteraId = formData.get("carteraId") || null;
    const tipoRaw = formData.get("tipoOperacion");
    const tickerRaw = (formData.get("ticker") || "").trim().toUpperCase();
    const cantidadRaw = formData.get("cantidad");
    const precioRaw = formData.get("precio");
    const moneda = formData.get("moneda");
    const mercado = formData.get("mercado");
    const fechaOpRaw = formData.get("fechaOperativa");
    const observaciones = (formData.get("observaciones") || "").trim() || null;
    const resultadoBruto = toN(formData.get("resultadoBruto"));
    const resultadoNeto = toN(formData.get("resultadoNeto"));
    const tcMepDia = toN(formData.get("tcMepDia"));
    const tasaCaucion = toN(formData.get("tasaCaucion"));
    const diasRaw = formData.get("diasCaucion");
    const diasCaucion = diasRaw ? parseInt(diasRaw) : null;
    if (!tipoRaw || !cantidadRaw || !precioRaw || !moneda || !mercado) return {
        error: "Faltan campos obligatorios"
    };
    if (sujetoTipo === "comitente" && !comitenteId) return {
        error: "Seleccionar comitente"
    };
    if (sujetoTipo === "cartera" && !carteraId) return {
        error: "Seleccionar cartera"
    };
    const ticker = tickerRaw || (CAUCION_TIPOS.has(tipoRaw) ? "CAUCION" : "");
    if (!ticker) return {
        error: "Ticker requerido para este tipo de operación"
    };
    const cantidad = parseFloat(cantidadRaw);
    const precio = parseFloat(precioRaw);
    if (isNaN(cantidad) || cantidad <= 0) return {
        error: "Cantidad inválida"
    };
    if (isNaN(precio) || precio <= 0) return {
        error: "Precio inválido"
    };
    const fechaOperativa = fechaOpRaw ? new Date(fechaOpRaw + "T00:00:00.000Z") : null;
    try {
        const now = new Date();
        const id = crypto.randomUUID();
        await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].$transaction(async (tx)=>{
            await tx.operacionBolsa.create({
                data: {
                    id,
                    comitenteId: sujetoTipo === "comitente" ? comitenteId : null,
                    carteraId: sujetoTipo === "cartera" ? carteraId : null,
                    tipoOperacion: tipoRaw,
                    ticker,
                    cantidad,
                    precio,
                    moneda: moneda,
                    mercado: mercado,
                    observaciones,
                    operadorCargaId: userId,
                    estado: "PENDIENTE_CONCERTACION",
                    fechaOperativa,
                    resultadoBruto,
                    resultadoNeto,
                    tcMepDia,
                    tasaCaucion,
                    diasCaucion: diasCaucion !== null && !isNaN(diasCaucion) ? diasCaucion : null,
                    updatedAt: now
                }
            });
            await tx.operacionBolsaLog.create({
                data: {
                    id: crypto.randomUUID(),
                    operacionId: id,
                    userId,
                    accion: "CARGA",
                    estadoNuevo: "PENDIENTE_CONCERTACION",
                    snapshot: {
                        ticker,
                        cantidad,
                        precio,
                        moneda,
                        mercado,
                        tipoOperacion: tipoRaw,
                        resultadoBruto,
                        resultadoNeto
                    }
                }
            });
        });
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["revalidatePath"])("/bolsa");
        return {
            ok: true,
            id
        };
    } catch (e) {
        console.error("[crearOpMesaDiaria]", e);
        return {
            error: "Error al guardar la operación. Verificar datos ingresados."
        };
    }
}
async function agruparOperacionesArbitraje(_prevState, formData) {
    if (__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$config$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["readOnlyPreview"]) return {
        error: "Modo lectura activo"
    };
    const session = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$auth$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["auth"])();
    const userId = session?.user?.id;
    if (!userId) return {
        error: "Sin sesión activa"
    };
    const idsRaw = formData.get("operationIds") || "";
    const ids = idsRaw.split(",").map((s)=>s.trim()).filter(Boolean);
    if (ids.length < 2) return {
        error: "Seleccionar al menos 2 operaciones"
    };
    const ops = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].operacionBolsa.findMany({
        where: {
            id: {
                in: ids
            }
        },
        select: {
            id: true,
            anulada: true,
            estado: true
        }
    });
    if (ops.length !== ids.length) return {
        error: "Una o más operaciones no encontradas"
    };
    if (ops.some((o)=>o.anulada)) return {
        error: "No se pueden agrupar operaciones anuladas"
    };
    if (ops.some((o)=>o.estado !== "PENDIENTE_CONCERTACION")) return {
        error: "Solo se pueden agrupar operaciones pendientes de revisión"
    };
    const grupoId = crypto.randomUUID().slice(0, 8).toUpperCase();
    await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].operacionBolsa.updateMany({
        where: {
            id: {
                in: ids
            }
        },
        data: {
            grupoArbitrajeId: grupoId,
            updatedAt: new Date()
        }
    });
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["revalidatePath"])("/bolsa");
    return {
        ok: true,
        grupoId
    };
}
async function anularOperacion(prevState, formData) {
    if (__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$config$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["readOnlyPreview"]) return {
        error: "Modo lectura activo"
    };
    const session = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$auth$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["auth"])();
    const userId = session?.user?.id;
    if (!userId) return {
        error: "Sin sesión activa"
    };
    const operacionId = formData.get("operacionId");
    const motivoAnulacion = formData.get("motivoAnulacion")?.trim();
    if (!operacionId) return {
        error: "ID operación requerido"
    };
    if (!motivoAnulacion) return {
        error: "El motivo de anulación es obligatorio"
    };
    const op = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].operacionBolsa.findUnique({
        where: {
            id: operacionId
        }
    });
    if (!op) return {
        error: "Operación no encontrada"
    };
    if (op.anulada) return {
        error: "Operación ya anulada"
    };
    try {
        const now = new Date();
        await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].$transaction(async (tx)=>{
            await tx.operacionBolsa.update({
                where: {
                    id: operacionId
                },
                data: {
                    estado: "ANULADA",
                    anulada: true,
                    motivoAnulacion,
                    updatedAt: now
                }
            });
            await tx.operacionBolsaLog.create({
                data: {
                    id: crypto.randomUUID(),
                    operacionId,
                    userId,
                    accion: "ANULACION",
                    estadoAnterior: op.estado,
                    estadoNuevo: "ANULADA",
                    snapshot: {
                        motivoAnulacion
                    }
                }
            });
        });
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["revalidatePath"])("/bolsa");
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["revalidatePath"])(`/bolsa/${operacionId}`);
        return {
            ok: true
        };
    } catch (e) {
        return {
            error: e.message || "Error al anular operación"
        };
    }
}
;
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$validate$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["ensureServerEntryExports"])([
    crearOperacionBolsa,
    concertarOperacion,
    crearOpMesaDiaria,
    agruparOperacionesArbitraje,
    anularOperacion
]);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(crearOperacionBolsa, "60af330acff09f27046538c72d5de4c2db61ff0417", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(concertarOperacion, "604d803f139ab5aa6ec97524e2ce14b730def75378", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(crearOpMesaDiaria, "6035d53977bf5bc76d2c85bdca3e747632711bac75", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(agruparOperacionesArbitraje, "606cfa9090426e36c2b3b1981fe0f1dea0988a1482", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(anularOperacion, "60ccca7881a3263e68458c7cf624546246d209d57f", null);
}}),
"[project]/.next-internal/server/app/(dashboard)/bolsa/[id]/page/actions.js { ACTIONS_MODULE0 => \"[project]/src/components/layout/Topbar.tsx [app-rsc] (ecmascript)\", ACTIONS_MODULE1 => \"[project]/src/app/(dashboard)/bolsa/actions.ts [app-rsc] (ecmascript)\" } [app-rsc] (server actions loader, ecmascript) <locals>": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({});
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$layout$2f$Topbar$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/layout/Topbar.tsx [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f28$dashboard$292f$bolsa$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/app/(dashboard)/bolsa/actions.ts [app-rsc] (ecmascript)");
;
;
;
}}),
"[project]/.next-internal/server/app/(dashboard)/bolsa/[id]/page/actions.js { ACTIONS_MODULE0 => \"[project]/src/components/layout/Topbar.tsx [app-rsc] (ecmascript)\", ACTIONS_MODULE1 => \"[project]/src/app/(dashboard)/bolsa/actions.ts [app-rsc] (ecmascript)\" } [app-rsc] (server actions loader, ecmascript) <module evaluation>": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({});
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$layout$2f$Topbar$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/layout/Topbar.tsx [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f28$dashboard$292f$bolsa$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/app/(dashboard)/bolsa/actions.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f2e$next$2d$internal$2f$server$2f$app$2f28$dashboard$292f$bolsa$2f5b$id$5d2f$page$2f$actions$2e$js__$7b$__ACTIONS_MODULE0__$3d3e$__$225b$project$5d2f$src$2f$components$2f$layout$2f$Topbar$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29222c$__ACTIONS_MODULE1__$3d3e$__$225b$project$5d2f$src$2f$app$2f28$dashboard$292f$bolsa$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$2922$__$7d$__$5b$app$2d$rsc$5d$__$28$server__actions__loader$2c$__ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i('[project]/.next-internal/server/app/(dashboard)/bolsa/[id]/page/actions.js { ACTIONS_MODULE0 => "[project]/src/components/layout/Topbar.tsx [app-rsc] (ecmascript)", ACTIONS_MODULE1 => "[project]/src/app/(dashboard)/bolsa/actions.ts [app-rsc] (ecmascript)" } [app-rsc] (server actions loader, ecmascript) <locals>');
}}),
"[project]/.next-internal/server/app/(dashboard)/bolsa/[id]/page/actions.js { ACTIONS_MODULE0 => \"[project]/src/components/layout/Topbar.tsx [app-rsc] (ecmascript)\", ACTIONS_MODULE1 => \"[project]/src/app/(dashboard)/bolsa/actions.ts [app-rsc] (ecmascript)\" } [app-rsc] (server actions loader, ecmascript) <exports>": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "0011ff4319847fa321c161740d2e30453828714a2e": (()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$layout$2f$Topbar$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["$$RSC_SERVER_ACTION_0"]),
    "604d803f139ab5aa6ec97524e2ce14b730def75378": (()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f28$dashboard$292f$bolsa$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["concertarOperacion"]),
    "60ccca7881a3263e68458c7cf624546246d209d57f": (()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f28$dashboard$292f$bolsa$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["anularOperacion"])
});
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$layout$2f$Topbar$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/layout/Topbar.tsx [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f28$dashboard$292f$bolsa$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/app/(dashboard)/bolsa/actions.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f2e$next$2d$internal$2f$server$2f$app$2f28$dashboard$292f$bolsa$2f5b$id$5d2f$page$2f$actions$2e$js__$7b$__ACTIONS_MODULE0__$3d3e$__$225b$project$5d2f$src$2f$components$2f$layout$2f$Topbar$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29222c$__ACTIONS_MODULE1__$3d3e$__$225b$project$5d2f$src$2f$app$2f28$dashboard$292f$bolsa$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$2922$__$7d$__$5b$app$2d$rsc$5d$__$28$server__actions__loader$2c$__ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i('[project]/.next-internal/server/app/(dashboard)/bolsa/[id]/page/actions.js { ACTIONS_MODULE0 => "[project]/src/components/layout/Topbar.tsx [app-rsc] (ecmascript)", ACTIONS_MODULE1 => "[project]/src/app/(dashboard)/bolsa/actions.ts [app-rsc] (ecmascript)" } [app-rsc] (server actions loader, ecmascript) <locals>');
}}),
"[project]/.next-internal/server/app/(dashboard)/bolsa/[id]/page/actions.js { ACTIONS_MODULE0 => \"[project]/src/components/layout/Topbar.tsx [app-rsc] (ecmascript)\", ACTIONS_MODULE1 => \"[project]/src/app/(dashboard)/bolsa/actions.ts [app-rsc] (ecmascript)\" } [app-rsc] (server actions loader, ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "0011ff4319847fa321c161740d2e30453828714a2e": (()=>__TURBOPACK__imported__module__$5b$project$5d2f2e$next$2d$internal$2f$server$2f$app$2f28$dashboard$292f$bolsa$2f5b$id$5d2f$page$2f$actions$2e$js__$7b$__ACTIONS_MODULE0__$3d3e$__$225b$project$5d2f$src$2f$components$2f$layout$2f$Topbar$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29222c$__ACTIONS_MODULE1__$3d3e$__$225b$project$5d2f$src$2f$app$2f28$dashboard$292f$bolsa$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$2922$__$7d$__$5b$app$2d$rsc$5d$__$28$server__actions__loader$2c$__ecmascript$29$__$3c$exports$3e$__["0011ff4319847fa321c161740d2e30453828714a2e"]),
    "604d803f139ab5aa6ec97524e2ce14b730def75378": (()=>__TURBOPACK__imported__module__$5b$project$5d2f2e$next$2d$internal$2f$server$2f$app$2f28$dashboard$292f$bolsa$2f5b$id$5d2f$page$2f$actions$2e$js__$7b$__ACTIONS_MODULE0__$3d3e$__$225b$project$5d2f$src$2f$components$2f$layout$2f$Topbar$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29222c$__ACTIONS_MODULE1__$3d3e$__$225b$project$5d2f$src$2f$app$2f28$dashboard$292f$bolsa$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$2922$__$7d$__$5b$app$2d$rsc$5d$__$28$server__actions__loader$2c$__ecmascript$29$__$3c$exports$3e$__["604d803f139ab5aa6ec97524e2ce14b730def75378"]),
    "60ccca7881a3263e68458c7cf624546246d209d57f": (()=>__TURBOPACK__imported__module__$5b$project$5d2f2e$next$2d$internal$2f$server$2f$app$2f28$dashboard$292f$bolsa$2f5b$id$5d2f$page$2f$actions$2e$js__$7b$__ACTIONS_MODULE0__$3d3e$__$225b$project$5d2f$src$2f$components$2f$layout$2f$Topbar$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29222c$__ACTIONS_MODULE1__$3d3e$__$225b$project$5d2f$src$2f$app$2f28$dashboard$292f$bolsa$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$2922$__$7d$__$5b$app$2d$rsc$5d$__$28$server__actions__loader$2c$__ecmascript$29$__$3c$exports$3e$__["60ccca7881a3263e68458c7cf624546246d209d57f"])
});
var __TURBOPACK__imported__module__$5b$project$5d2f2e$next$2d$internal$2f$server$2f$app$2f28$dashboard$292f$bolsa$2f5b$id$5d2f$page$2f$actions$2e$js__$7b$__ACTIONS_MODULE0__$3d3e$__$225b$project$5d2f$src$2f$components$2f$layout$2f$Topbar$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29222c$__ACTIONS_MODULE1__$3d3e$__$225b$project$5d2f$src$2f$app$2f28$dashboard$292f$bolsa$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$2922$__$7d$__$5b$app$2d$rsc$5d$__$28$server__actions__loader$2c$__ecmascript$29$__$3c$module__evaluation$3e$__ = __turbopack_context__.i('[project]/.next-internal/server/app/(dashboard)/bolsa/[id]/page/actions.js { ACTIONS_MODULE0 => "[project]/src/components/layout/Topbar.tsx [app-rsc] (ecmascript)", ACTIONS_MODULE1 => "[project]/src/app/(dashboard)/bolsa/actions.ts [app-rsc] (ecmascript)" } [app-rsc] (server actions loader, ecmascript) <module evaluation>');
var __TURBOPACK__imported__module__$5b$project$5d2f2e$next$2d$internal$2f$server$2f$app$2f28$dashboard$292f$bolsa$2f5b$id$5d2f$page$2f$actions$2e$js__$7b$__ACTIONS_MODULE0__$3d3e$__$225b$project$5d2f$src$2f$components$2f$layout$2f$Topbar$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29222c$__ACTIONS_MODULE1__$3d3e$__$225b$project$5d2f$src$2f$app$2f28$dashboard$292f$bolsa$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$2922$__$7d$__$5b$app$2d$rsc$5d$__$28$server__actions__loader$2c$__ecmascript$29$__$3c$exports$3e$__ = __turbopack_context__.i('[project]/.next-internal/server/app/(dashboard)/bolsa/[id]/page/actions.js { ACTIONS_MODULE0 => "[project]/src/components/layout/Topbar.tsx [app-rsc] (ecmascript)", ACTIONS_MODULE1 => "[project]/src/app/(dashboard)/bolsa/actions.ts [app-rsc] (ecmascript)" } [app-rsc] (server actions loader, ecmascript) <exports>');
}}),
"[project]/src/app/layout.tsx [app-rsc] (ecmascript, Next.js server component)": ((__turbopack_context__) => {

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.n(__turbopack_context__.i("[project]/src/app/layout.tsx [app-rsc] (ecmascript)"));
}}),
"[project]/src/app/loading.tsx [app-rsc] (ecmascript, Next.js server component)": ((__turbopack_context__) => {

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.n(__turbopack_context__.i("[project]/src/app/loading.tsx [app-rsc] (ecmascript)"));
}}),
"[project]/src/app/(dashboard)/layout.tsx [app-rsc] (ecmascript, Next.js server component)": ((__turbopack_context__) => {

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.n(__turbopack_context__.i("[project]/src/app/(dashboard)/layout.tsx [app-rsc] (ecmascript)"));
}}),
"[project]/src/lib/data/operacion-bolsa.ts [app-rsc] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "getOperacionBolsaById": (()=>getOperacionBolsaById),
    "getOperacionesBolsa": (()=>getOperacionesBolsa),
    "getOperacionesMesaDiaria": (()=>getOperacionesMesaDiaria)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/prisma.ts [app-rsc] (ecmascript)");
;
async function getOperacionesMesaDiaria(fecha) {
    const d = new Date(fecha + "T00:00:00.000Z");
    const dNext = new Date(d);
    dNext.setUTCDate(dNext.getUTCDate() + 1);
    const rows = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].operacionBolsa.findMany({
        where: {
            fechaOperativa: {
                gte: d,
                lt: dNext
            },
            anulada: false
        },
        orderBy: [
            {
                grupoArbitrajeId: "asc"
            },
            {
                fechaCarga: "asc"
            }
        ],
        include: {
            Cartera: {
                select: {
                    id: true,
                    nombre: true
                }
            },
            ComitenteInversion: {
                select: {
                    id: true,
                    nombre: true,
                    nroComitente: true
                }
            },
            OperadorCarga: {
                select: {
                    id: true,
                    name: true
                }
            }
        }
    });
    const propiaMap = new Map();
    const clienteMap = new Map();
    for (const r of rows){
        const row = {
            id: r.id,
            tipoOperacion: r.tipoOperacion,
            ticker: r.ticker,
            cantidad: Number(r.cantidad),
            precio: Number(r.precio),
            moneda: r.moneda,
            estado: r.estado,
            resultadoBruto: r.resultadoBruto !== null ? Number(r.resultadoBruto) : null,
            resultadoNeto: r.resultadoNeto !== null ? Number(r.resultadoNeto) : null,
            tcMepDia: r.tcMepDia !== null ? Number(r.tcMepDia) : null,
            tasaCaucion: r.tasaCaucion !== null ? Number(r.tasaCaucion) : null,
            diasCaucion: r.diasCaucion,
            observaciones: r.observaciones,
            carteraId: r.carteraId,
            carteraNombre: r.Cartera?.nombre ?? null,
            comitenteId: r.comitenteId,
            comitenteNombre: r.ComitenteInversion?.nombre ?? null,
            comitenteNro: r.ComitenteInversion?.nroComitente ?? null,
            operadorNombre: r.OperadorCarga?.name ?? "—",
            grupoArbitrajeId: r.grupoArbitrajeId
        };
        if (r.carteraId) {
            if (!propiaMap.has(r.carteraId)) {
                propiaMap.set(r.carteraId, {
                    carteraId: r.carteraId,
                    carteraNombre: r.Cartera?.nombre ?? r.carteraId,
                    ops: [],
                    totalResultadoARS: 0,
                    totalResultadoUSD: 0
                });
            }
            const g = propiaMap.get(r.carteraId);
            g.ops.push(row);
            // Solo sumar resultado si fue ingresado manualmente (resultadoBruto != null)
            // Las compras/ventas normales sin resultado explícito NO suman a la mesa
            if (row.resultadoBruto !== null) {
                const resultado = row.resultadoNeto ?? row.resultadoBruto;
                if (r.moneda === "ARS") g.totalResultadoARS += resultado;
                else if (r.moneda === "USD") g.totalResultadoUSD += resultado;
            }
        } else if (r.comitenteId) {
            if (!clienteMap.has(r.comitenteId)) {
                clienteMap.set(r.comitenteId, {
                    comitenteId: r.comitenteId,
                    comitenteNombre: r.ComitenteInversion?.nombre ?? r.comitenteId,
                    nroComitente: r.ComitenteInversion?.nroComitente ?? "—",
                    ops: [],
                    totalResultadoARS: 0,
                    totalResultadoUSD: 0
                });
            }
            const g = clienteMap.get(r.comitenteId);
            g.ops.push(row);
            if (row.resultadoBruto !== null) {
                const resultado = row.resultadoNeto ?? row.resultadoBruto;
                if (r.moneda === "ARS") g.totalResultadoARS += resultado;
                else if (r.moneda === "USD") g.totalResultadoUSD += resultado;
            }
        }
    }
    const propias = Array.from(propiaMap.values());
    const clientes = Array.from(clienteMap.values());
    const resultadoMesaARS = [
        ...propias,
        ...clientes
    ].reduce((s, g)=>s + g.totalResultadoARS, 0);
    const resultadoMesaUSD = [
        ...propias,
        ...clientes
    ].reduce((s, g)=>s + g.totalResultadoUSD, 0);
    const pendientesRevision = rows.filter((r)=>r.estado === "PENDIENTE_CONCERTACION").length;
    return {
        propias,
        clientes,
        resumen: {
            resultadoMesaARS,
            resultadoMesaUSD,
            totalPropias: propias.reduce((s, g)=>s + g.ops.length, 0),
            totalClientes: clientes.reduce((s, g)=>s + g.ops.length, 0),
            pendientesRevision
        }
    };
}
async function getOperacionesBolsa(mes) {
    const fechaWhere = mes ? (()=>{
        const [y, m] = mes.split("-").map(Number);
        return {
            fechaOperativa: {
                gte: new Date(Date.UTC(y, m - 1, 1)),
                lt: new Date(Date.UTC(y, m, 1))
            }
        };
    })() : {};
    return __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].operacionBolsa.findMany({
        where: {
            ...fechaWhere
        },
        orderBy: mes ? [
            {
                fechaOperativa: "asc"
            },
            {
                fechaCarga: "asc"
            }
        ] : {
            fechaCarga: "desc"
        },
        ...mes ? {} : {
            take: 300
        },
        include: {
            Cliente: {
                select: {
                    id: true,
                    nombre: true
                }
            },
            ComitenteInversion: {
                select: {
                    id: true,
                    nombre: true
                }
            },
            Cartera: {
                select: {
                    id: true,
                    nombre: true
                }
            },
            OperadorCarga: {
                select: {
                    id: true,
                    name: true
                }
            }
        }
    });
}
async function getOperacionBolsaById(id) {
    return __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].operacionBolsa.findUnique({
        where: {
            id
        },
        include: {
            Cliente: {
                select: {
                    id: true,
                    nombre: true
                }
            },
            Cartera: {
                select: {
                    id: true,
                    nombre: true
                }
            },
            ComitenteInversion: {
                select: {
                    id: true,
                    nombre: true
                }
            },
            OperadorCarga: {
                select: {
                    id: true,
                    name: true
                }
            },
            OperadorCierre: {
                select: {
                    id: true,
                    name: true
                }
            },
            OperacionBolsaLog: {
                orderBy: {
                    createdAt: "desc"
                },
                include: {
                    User: {
                        select: {
                            name: true
                        }
                    }
                }
            }
        }
    });
}
}}),
"[project]/src/components/modules/bolsa/ConcertarForm.tsx (client reference/proxy) <module evaluation>": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "ConcertarForm": (()=>ConcertarForm)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$server$2d$dom$2d$turbopack$2d$server$2d$edge$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-server-dom-turbopack-server-edge.js [app-rsc] (ecmascript)");
;
const ConcertarForm = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$server$2d$dom$2d$turbopack$2d$server$2d$edge$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerClientReference"])(function() {
    throw new Error("Attempted to call ConcertarForm() from the server but ConcertarForm is on the client. It's not possible to invoke a client function from the server, it can only be rendered as a Component or passed to props of a Client Component.");
}, "[project]/src/components/modules/bolsa/ConcertarForm.tsx <module evaluation>", "ConcertarForm");
}}),
"[project]/src/components/modules/bolsa/ConcertarForm.tsx (client reference/proxy)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "ConcertarForm": (()=>ConcertarForm)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$server$2d$dom$2d$turbopack$2d$server$2d$edge$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-server-dom-turbopack-server-edge.js [app-rsc] (ecmascript)");
;
const ConcertarForm = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$server$2d$dom$2d$turbopack$2d$server$2d$edge$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerClientReference"])(function() {
    throw new Error("Attempted to call ConcertarForm() from the server but ConcertarForm is on the client. It's not possible to invoke a client function from the server, it can only be rendered as a Component or passed to props of a Client Component.");
}, "[project]/src/components/modules/bolsa/ConcertarForm.tsx", "ConcertarForm");
}}),
"[project]/src/components/modules/bolsa/ConcertarForm.tsx [app-rsc] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$modules$2f$bolsa$2f$ConcertarForm$2e$tsx__$28$client__reference$2f$proxy$29$__$3c$module__evaluation$3e$__ = __turbopack_context__.i("[project]/src/components/modules/bolsa/ConcertarForm.tsx (client reference/proxy) <module evaluation>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$modules$2f$bolsa$2f$ConcertarForm$2e$tsx__$28$client__reference$2f$proxy$29$__ = __turbopack_context__.i("[project]/src/components/modules/bolsa/ConcertarForm.tsx (client reference/proxy)");
;
__turbopack_context__.n(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$modules$2f$bolsa$2f$ConcertarForm$2e$tsx__$28$client__reference$2f$proxy$29$__);
}}),
"[project]/src/components/modules/bolsa/AnularForm.tsx (client reference/proxy) <module evaluation>": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "AnularForm": (()=>AnularForm)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$server$2d$dom$2d$turbopack$2d$server$2d$edge$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-server-dom-turbopack-server-edge.js [app-rsc] (ecmascript)");
;
const AnularForm = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$server$2d$dom$2d$turbopack$2d$server$2d$edge$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerClientReference"])(function() {
    throw new Error("Attempted to call AnularForm() from the server but AnularForm is on the client. It's not possible to invoke a client function from the server, it can only be rendered as a Component or passed to props of a Client Component.");
}, "[project]/src/components/modules/bolsa/AnularForm.tsx <module evaluation>", "AnularForm");
}}),
"[project]/src/components/modules/bolsa/AnularForm.tsx (client reference/proxy)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "AnularForm": (()=>AnularForm)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$server$2d$dom$2d$turbopack$2d$server$2d$edge$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-server-dom-turbopack-server-edge.js [app-rsc] (ecmascript)");
;
const AnularForm = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$server$2d$dom$2d$turbopack$2d$server$2d$edge$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerClientReference"])(function() {
    throw new Error("Attempted to call AnularForm() from the server but AnularForm is on the client. It's not possible to invoke a client function from the server, it can only be rendered as a Component or passed to props of a Client Component.");
}, "[project]/src/components/modules/bolsa/AnularForm.tsx", "AnularForm");
}}),
"[project]/src/components/modules/bolsa/AnularForm.tsx [app-rsc] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$modules$2f$bolsa$2f$AnularForm$2e$tsx__$28$client__reference$2f$proxy$29$__$3c$module__evaluation$3e$__ = __turbopack_context__.i("[project]/src/components/modules/bolsa/AnularForm.tsx (client reference/proxy) <module evaluation>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$modules$2f$bolsa$2f$AnularForm$2e$tsx__$28$client__reference$2f$proxy$29$__ = __turbopack_context__.i("[project]/src/components/modules/bolsa/AnularForm.tsx (client reference/proxy)");
;
__turbopack_context__.n(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$modules$2f$bolsa$2f$AnularForm$2e$tsx__$28$client__reference$2f$proxy$29$__);
}}),
"[project]/src/app/(dashboard)/bolsa/[id]/page.tsx [app-rsc] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "default": (()=>BolsaDetailPage)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-jsx-dev-runtime.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$api$2f$navigation$2e$react$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$module__evaluation$3e$__ = __turbopack_context__.i("[project]/node_modules/next/dist/api/navigation.react-server.js [app-rsc] (ecmascript) <module evaluation>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$components$2f$navigation$2e$react$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/client/components/navigation.react-server.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/client/app-dir/link.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$left$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronLeft$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/chevron-left.js [app-rsc] (ecmascript) <export default as ChevronLeft>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chart$2d$candlestick$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__default__as__CandlestickChart$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/chart-candlestick.js [app-rsc] (ecmascript) <export default as CandlestickChart>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$data$2f$operacion$2d$bolsa$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/data/operacion-bolsa.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$modules$2f$bolsa$2f$ConcertarForm$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/modules/bolsa/ConcertarForm.tsx [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$modules$2f$bolsa$2f$AnularForm$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/modules/bolsa/AnularForm.tsx [app-rsc] (ecmascript)");
;
;
;
;
;
;
;
const TIPO_LABEL = {
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
    SENEBI: "SENEBI"
};
const MERCADO_LABEL = {
    BYMA: "BYMA",
    MAE: "MAE",
    SENEBI_OTC: "SENEBI OTC",
    MATBA_ROFEX: "MATBA-ROFEX",
    OTC: "OTC"
};
const ESTADO_STYLE = {
    PENDIENTE_CONCERTACION: "bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/20",
    CONCERTADA: "bg-byg-accent/10 text-byg-accent ring-1 ring-byg-accent/20",
    LIQUIDADA: "bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20",
    ANULADA: "bg-byg-surface-2 text-byg-muted"
};
const ESTADO_LABEL = {
    PENDIENTE_CONCERTACION: "Pendiente revisión",
    CONCERTADA: "Concertada",
    LIQUIDADA: "Liquidada",
    ANULADA: "Anulada"
};
const LOG_ACCION_STYLE = {
    CARGA: "bg-byg-surface-2 text-byg-muted",
    CONCERTACION: "bg-byg-accent/10 text-byg-accent",
    LIQUIDACION: "bg-emerald-500/10 text-emerald-400",
    ANULACION: "bg-rose-500/10 text-rose-400",
    EDICION: "bg-violet-500/10 text-violet-400"
};
function fmt(n, decimals = 2) {
    if (n == null) return "—";
    return n.toLocaleString("es-AR", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    });
}
function fmtDate(v) {
    if (!v) return "—";
    try {
        return new Date(v).toLocaleDateString("es-AR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            timeZone: "UTC"
        });
    } catch  {
        return "—";
    }
}
function fmtDateTime(v) {
    try {
        return new Date(v).toLocaleString("es-AR", {
            day: "2-digit",
            month: "2-digit",
            year: "2-digit",
            hour: "2-digit",
            minute: "2-digit"
        });
    } catch  {
        return "—";
    }
}
function InfoCell({ label, value }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                className: "text-[10px] font-bold uppercase tracking-widest text-byg-muted mb-0.5",
                children: label
            }, void 0, false, {
                fileName: "[project]/src/app/(dashboard)/bolsa/[id]/page.tsx",
                lineNumber: 82,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                className: "text-[13px] font-semibold text-byg-text font-mono",
                children: value
            }, void 0, false, {
                fileName: "[project]/src/app/(dashboard)/bolsa/[id]/page.tsx",
                lineNumber: 83,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/app/(dashboard)/bolsa/[id]/page.tsx",
        lineNumber: 81,
        columnNumber: 5
    }, this);
}
async function BolsaDetailPage({ params }) {
    const { id } = await params;
    const op = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$data$2f$operacion$2d$bolsa$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getOperacionBolsaById"])(id);
    if (!op) (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$components$2f$navigation$2e$react$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["notFound"])();
    const sujeto = op.ComitenteInversion?.nombre ?? op.Cliente?.nombre ?? op.Cartera?.nombre ?? "Cartera Propia";
    const tipoLabel = TIPO_LABEL[op.tipoOperacion] ?? op.tipoOperacion;
    const cantidad = Number(op.cantidad);
    const precio = Number(op.precio);
    const valorBruto = cantidad * precio;
    // Serialized for client components — use != null (not falsy) so 0 values survive
    const formDefaults = {
        nroBoleto: op.nroBoleto,
        alyc: op.alyc,
        fechaConcertacion: op.fechaConcertacion ? new Date(op.fechaConcertacion).toISOString().slice(0, 10) : null,
        fechaLiquidacion: op.fechaLiquidacion ? new Date(op.fechaLiquidacion).toISOString().slice(0, 10) : null,
        comisionPct: op.comisionPct != null ? Number(op.comisionPct) : null,
        comisionFija: op.comisionFija != null ? Number(op.comisionFija) : null,
        derechosMercado: op.derechosMercado != null ? Number(op.derechosMercado) : null,
        gastos: op.gastos != null ? Number(op.gastos) : null,
        impuestos: op.impuestos != null ? Number(op.impuestos) : null,
        tcMepDia: op.tcMepDia != null ? Number(op.tcMepDia) : null,
        comisionUSD: op.comisionUSD != null ? Number(op.comisionUSD) : null,
        esSenebi: op.esSenebi,
        senebiBruto: op.senebiBruto != null ? Number(op.senebiBruto) : null,
        diasCaucion: op.diasCaucion,
        tasaCaucion: op.tasaCaucion != null ? Number(op.tasaCaucion) : null
    };
    const costoReal = op.costoReal != null ? Number(op.costoReal) : null;
    const netoLiquidado = op.netoLiquidado != null ? Number(op.netoLiquidado) : null;
    const precioPromedioReal = op.precioPromedioReal != null ? Number(op.precioPromedioReal) : null;
    const resultadoBruto = op.resultadoBruto != null ? Number(op.resultadoBruto) : null;
    const resultadoNeto = op.resultadoNeto != null ? Number(op.resultadoNeto) : null;
    const canEditBoleto = op.estado === "PENDIENTE_CONCERTACION" || op.estado === "CONCERTADA";
    const canAnular = !op.anulada;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "flex flex-col gap-8",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"], {
                href: "/bolsa",
                className: "flex items-center gap-1 text-byg-muted hover:text-byg-accent text-[10px] font-black uppercase tracking-widest transition-colors group w-fit",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$left$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronLeft$3e$__["ChevronLeft"], {
                        size: 13,
                        className: "group-hover:-translate-x-0.5 transition-transform"
                    }, void 0, false, {
                        fileName: "[project]/src/app/(dashboard)/bolsa/[id]/page.tsx",
                        lineNumber: 136,
                        columnNumber: 9
                    }, this),
                    "Operaciones Bolsa"
                ]
            }, void 0, true, {
                fileName: "[project]/src/app/(dashboard)/bolsa/[id]/page.tsx",
                lineNumber: 132,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("header", {
                className: "flex items-center gap-5 bg-byg-surface p-6 rounded-2xl border border-byg-border relative overflow-hidden",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "absolute top-0 left-0 w-full h-[3px] bg-byg-accent"
                    }, void 0, false, {
                        fileName: "[project]/src/app/(dashboard)/bolsa/[id]/page.tsx",
                        lineNumber: 142,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "p-4 bg-byg-accent text-white rounded-2xl shrink-0",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chart$2d$candlestick$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__default__as__CandlestickChart$3e$__["CandlestickChart"], {
                            size: 26
                        }, void 0, false, {
                            fileName: "[project]/src/app/(dashboard)/bolsa/[id]/page.tsx",
                            lineNumber: 144,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/src/app/(dashboard)/bolsa/[id]/page.tsx",
                        lineNumber: 143,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex-1 min-w-0",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-[10px] font-bold text-byg-accent uppercase tracking-widest mb-1",
                                children: "Operación Bolsa"
                            }, void 0, false, {
                                fileName: "[project]/src/app/(dashboard)/bolsa/[id]/page.tsx",
                                lineNumber: 147,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                                className: "text-3xl font-black text-byg-text tracking-tight",
                                children: [
                                    op.ticker,
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "text-byg-muted font-medium text-xl ml-3",
                                        children: tipoLabel
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/(dashboard)/bolsa/[id]/page.tsx",
                                        lineNumber: 150,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/(dashboard)/bolsa/[id]/page.tsx",
                                lineNumber: 148,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex items-center gap-2 mt-1.5",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "text-[11px] font-bold bg-byg-surface-2 text-byg-muted px-2 py-0.5 rounded-md border border-byg-border",
                                        children: sujeto
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/(dashboard)/bolsa/[id]/page.tsx",
                                        lineNumber: 153,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: `text-[9px] font-black px-2.5 py-1 rounded-md uppercase tracking-widest ${ESTADO_STYLE[op.estado] ?? "bg-byg-surface-2 text-byg-muted"}`,
                                        children: ESTADO_LABEL[op.estado] ?? op.estado
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/(dashboard)/bolsa/[id]/page.tsx",
                                        lineNumber: 154,
                                        columnNumber: 13
                                    }, this),
                                    op.anulada && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "text-[9px] font-black px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 ring-1 ring-rose-500/20 uppercase tracking-widest",
                                        children: "Anulada"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/(dashboard)/bolsa/[id]/page.tsx",
                                        lineNumber: 158,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/(dashboard)/bolsa/[id]/page.tsx",
                                lineNumber: 152,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/app/(dashboard)/bolsa/[id]/page.tsx",
                        lineNumber: 146,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "text-right pl-6 border-l border-byg-border shrink-0",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-[11px] font-bold uppercase tracking-widest text-byg-muted mb-1",
                                children: "Valor Bruto"
                            }, void 0, false, {
                                fileName: "[project]/src/app/(dashboard)/bolsa/[id]/page.tsx",
                                lineNumber: 165,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-2xl font-black text-byg-text tabular-nums font-mono",
                                children: [
                                    op.moneda,
                                    " ",
                                    fmt(valorBruto)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/(dashboard)/bolsa/[id]/page.tsx",
                                lineNumber: 166,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-[10px] text-byg-muted mt-0.5 font-mono",
                                children: [
                                    fmt(cantidad, 0),
                                    " × ",
                                    fmt(precio, 4)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/(dashboard)/bolsa/[id]/page.tsx",
                                lineNumber: 167,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/app/(dashboard)/bolsa/[id]/page.tsx",
                        lineNumber: 164,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/app/(dashboard)/bolsa/[id]/page.tsx",
                lineNumber: 141,
                columnNumber: 7
            }, this),
            op.estado === "PENDIENTE_CONCERTACION" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-5 py-4",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "w-2 h-2 mt-1.5 rounded-full bg-amber-400 shrink-0"
                    }, void 0, false, {
                        fileName: "[project]/src/app/(dashboard)/bolsa/[id]/page.tsx",
                        lineNumber: 176,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-[11px] font-black uppercase tracking-widest text-amber-400",
                                children: "Pendiente de revisión"
                            }, void 0, false, {
                                fileName: "[project]/src/app/(dashboard)/bolsa/[id]/page.tsx",
                                lineNumber: 178,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-[12px] text-byg-muted mt-0.5",
                                children: "Cargar boleto y comisiones reales para concertar la operación."
                            }, void 0, false, {
                                fileName: "[project]/src/app/(dashboard)/bolsa/[id]/page.tsx",
                                lineNumber: 181,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/app/(dashboard)/bolsa/[id]/page.tsx",
                        lineNumber: 177,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/app/(dashboard)/bolsa/[id]/page.tsx",
                lineNumber: 175,
                columnNumber: 9
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                className: "flex flex-col gap-3",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                        className: "text-[10px] font-black uppercase tracking-[0.3em] text-byg-muted",
                        children: [
                            "Carga estimada · ",
                            op.OperadorCarga.name
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/app/(dashboard)/bolsa/[id]/page.tsx",
                        lineNumber: 190,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "grid grid-cols-2 sm:grid-cols-4 gap-4",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "bg-byg-surface rounded-xl border border-byg-border p-4 flex flex-col gap-1",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "text-[10px] font-bold uppercase tracking-widest text-byg-muted",
                                        children: "Tipo"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/(dashboard)/bolsa/[id]/page.tsx",
                                        lineNumber: 195,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "text-[13px] font-black text-byg-text",
                                        children: tipoLabel
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/(dashboard)/bolsa/[id]/page.tsx",
                                        lineNumber: 196,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/(dashboard)/bolsa/[id]/page.tsx",
                                lineNumber: 194,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "bg-byg-surface rounded-xl border border-byg-border p-4 flex flex-col gap-1",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "text-[10px] font-bold uppercase tracking-widest text-byg-muted",
                                        children: "Mercado"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/(dashboard)/bolsa/[id]/page.tsx",
                                        lineNumber: 199,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "text-[13px] font-black text-byg-text",
                                        children: MERCADO_LABEL[op.mercado] ?? op.mercado
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/(dashboard)/bolsa/[id]/page.tsx",
                                        lineNumber: 200,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/(dashboard)/bolsa/[id]/page.tsx",
                                lineNumber: 198,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "bg-byg-surface rounded-xl border border-byg-border p-4 flex flex-col gap-1",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "text-[10px] font-bold uppercase tracking-widest text-byg-muted",
                                        children: "Fecha operativa"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/(dashboard)/bolsa/[id]/page.tsx",
                                        lineNumber: 203,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "text-[13px] font-black text-byg-text font-mono",
                                        children: op.fechaOperativa ? fmtDate(op.fechaOperativa.toISOString()) : "—"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/(dashboard)/bolsa/[id]/page.tsx",
                                        lineNumber: 204,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/(dashboard)/bolsa/[id]/page.tsx",
                                lineNumber: 202,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "bg-byg-surface rounded-xl border border-byg-border p-4 flex flex-col gap-1",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "text-[10px] font-bold uppercase tracking-widest text-byg-muted",
                                        children: "Cargada"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/(dashboard)/bolsa/[id]/page.tsx",
                                        lineNumber: 209,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "text-[13px] font-semibold text-byg-text",
                                        children: fmtDateTime(op.fechaCarga.toISOString())
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/(dashboard)/bolsa/[id]/page.tsx",
                                        lineNumber: 210,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/(dashboard)/bolsa/[id]/page.tsx",
                                lineNumber: 208,
                                columnNumber: 11
                            }, this),
                            op.resultadoBruto != null && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "bg-byg-surface rounded-xl border border-byg-border p-4 flex flex-col gap-1",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "text-[10px] font-bold uppercase tracking-widest text-byg-muted",
                                        children: "Resultado est."
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/(dashboard)/bolsa/[id]/page.tsx",
                                        lineNumber: 214,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "text-[13px] font-semibold font-mono text-byg-text",
                                        children: [
                                            op.moneda,
                                            " ",
                                            fmt(Number(op.resultadoBruto))
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/app/(dashboard)/bolsa/[id]/page.tsx",
                                        lineNumber: 215,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/(dashboard)/bolsa/[id]/page.tsx",
                                lineNumber: 213,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/app/(dashboard)/bolsa/[id]/page.tsx",
                        lineNumber: 193,
                        columnNumber: 9
                    }, this),
                    op.observaciones && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "bg-byg-surface-2 rounded-xl border border-byg-border px-5 py-3",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-[10px] font-bold uppercase tracking-widest text-byg-muted mb-1",
                                children: "Observaciones"
                            }, void 0, false, {
                                fileName: "[project]/src/app/(dashboard)/bolsa/[id]/page.tsx",
                                lineNumber: 223,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-[12px] text-byg-text",
                                children: op.observaciones
                            }, void 0, false, {
                                fileName: "[project]/src/app/(dashboard)/bolsa/[id]/page.tsx",
                                lineNumber: 224,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/app/(dashboard)/bolsa/[id]/page.tsx",
                        lineNumber: 222,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/app/(dashboard)/bolsa/[id]/page.tsx",
                lineNumber: 189,
                columnNumber: 7
            }, this),
            op.OperadorCierre && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex items-center gap-4 text-[11px] text-byg-muted",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        children: [
                            "Concertada por ",
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                className: "text-byg-text",
                                children: op.OperadorCierre.name
                            }, void 0, false, {
                                fileName: "[project]/src/app/(dashboard)/bolsa/[id]/page.tsx",
                                lineNumber: 232,
                                columnNumber: 32
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/app/(dashboard)/bolsa/[id]/page.tsx",
                        lineNumber: 232,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        children: fmtDate(formDefaults.fechaConcertacion)
                    }, void 0, false, {
                        fileName: "[project]/src/app/(dashboard)/bolsa/[id]/page.tsx",
                        lineNumber: 233,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/app/(dashboard)/bolsa/[id]/page.tsx",
                lineNumber: 231,
                columnNumber: 9
            }, this),
            costoReal != null && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                className: "bg-byg-surface rounded-2xl border border-byg-border overflow-hidden",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "px-6 py-4 border-b border-byg-border",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                            className: "text-[12px] font-bold uppercase tracking-widest text-byg-text",
                            children: "Concertación"
                        }, void 0, false, {
                            fileName: "[project]/src/app/(dashboard)/bolsa/[id]/page.tsx",
                            lineNumber: 241,
                            columnNumber: 13
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/src/app/(dashboard)/bolsa/[id]/page.tsx",
                        lineNumber: 240,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "px-6 py-5 flex flex-col gap-5",
                        children: [
                            netoLiquidado != null && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "rounded-xl border border-byg-accent/30 bg-byg-accent/5 px-5 py-4 flex items-baseline gap-3",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "text-[10px] font-black uppercase tracking-widest text-byg-accent",
                                        children: "Neto liquidado final"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/(dashboard)/bolsa/[id]/page.tsx",
                                        lineNumber: 247,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "text-2xl font-black tabular-nums font-mono text-byg-text",
                                        children: [
                                            op.moneda,
                                            " ",
                                            fmt(netoLiquidado)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/app/(dashboard)/bolsa/[id]/page.tsx",
                                        lineNumber: 248,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/(dashboard)/bolsa/[id]/page.tsx",
                                lineNumber: 246,
                                columnNumber: 15
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "grid grid-cols-2 sm:grid-cols-3 gap-6",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(InfoCell, {
                                        label: "Valor Bruto",
                                        value: `${op.moneda} ${fmt(valorBruto)}`
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/(dashboard)/bolsa/[id]/page.tsx",
                                        lineNumber: 254,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(InfoCell, {
                                        label: "Costo / Comisión",
                                        value: `${op.moneda} ${fmt(costoReal)}`
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/(dashboard)/bolsa/[id]/page.tsx",
                                        lineNumber: 255,
                                        columnNumber: 15
                                    }, this),
                                    precioPromedioReal != null && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(InfoCell, {
                                        label: "Precio Prom. Real",
                                        value: fmt(precioPromedioReal, 4)
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/(dashboard)/bolsa/[id]/page.tsx",
                                        lineNumber: 257,
                                        columnNumber: 17
                                    }, this),
                                    resultadoBruto != null && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(InfoCell, {
                                        label: "Resultado operador",
                                        value: `${op.moneda} ${fmt(resultadoBruto)}`
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/(dashboard)/bolsa/[id]/page.tsx",
                                        lineNumber: 261,
                                        columnNumber: 17
                                    }, this),
                                    resultadoNeto != null && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(InfoCell, {
                                        label: "Resultado neto",
                                        value: `${op.moneda} ${fmt(resultadoNeto)}`
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/(dashboard)/bolsa/[id]/page.tsx",
                                        lineNumber: 264,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/(dashboard)/bolsa/[id]/page.tsx",
                                lineNumber: 253,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/app/(dashboard)/bolsa/[id]/page.tsx",
                        lineNumber: 243,
                        columnNumber: 11
                    }, this),
                    op.nroBoleto && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "px-6 pb-4 flex items-center gap-4 text-[11px] text-byg-muted",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                children: [
                                    "Boleto: ",
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                        className: "text-byg-text",
                                        children: op.nroBoleto
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/(dashboard)/bolsa/[id]/page.tsx",
                                        lineNumber: 270,
                                        columnNumber: 29
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/(dashboard)/bolsa/[id]/page.tsx",
                                lineNumber: 270,
                                columnNumber: 15
                            }, this),
                            op.alyc && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                children: [
                                    "ALYC: ",
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                        className: "text-byg-text",
                                        children: op.alyc
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/(dashboard)/bolsa/[id]/page.tsx",
                                        lineNumber: 271,
                                        columnNumber: 39
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/(dashboard)/bolsa/[id]/page.tsx",
                                lineNumber: 271,
                                columnNumber: 27
                            }, this),
                            formDefaults.fechaLiquidacion && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                children: [
                                    "Liq.: ",
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                        className: "text-byg-text",
                                        children: fmtDate(formDefaults.fechaLiquidacion)
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/(dashboard)/bolsa/[id]/page.tsx",
                                        lineNumber: 272,
                                        columnNumber: 61
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/(dashboard)/bolsa/[id]/page.tsx",
                                lineNumber: 272,
                                columnNumber: 49
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/app/(dashboard)/bolsa/[id]/page.tsx",
                        lineNumber: 269,
                        columnNumber: 13
                    }, this),
                    op.motivoAnulacion && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "px-6 pb-4",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            className: "text-[11px] text-rose-500 font-semibold",
                            children: [
                                "Anulada: ",
                                op.motivoAnulacion
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/app/(dashboard)/bolsa/[id]/page.tsx",
                            lineNumber: 277,
                            columnNumber: 15
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/src/app/(dashboard)/bolsa/[id]/page.tsx",
                        lineNumber: 276,
                        columnNumber: 13
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/app/(dashboard)/bolsa/[id]/page.tsx",
                lineNumber: 239,
                columnNumber: 9
            }, this),
            canEditBoleto && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                className: "text-[10px] font-black uppercase tracking-[0.3em] text-byg-muted -mb-4",
                children: "Revisión · datos reales"
            }, void 0, false, {
                fileName: "[project]/src/app/(dashboard)/bolsa/[id]/page.tsx",
                lineNumber: 285,
                columnNumber: 9
            }, this),
            canEditBoleto && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$modules$2f$bolsa$2f$ConcertarForm$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["ConcertarForm"], {
                operacionId: op.id,
                estado: op.estado,
                tipoOperacion: op.tipoOperacion,
                fechaOperativa: op.fechaOperativa ? new Date(op.fechaOperativa).toISOString().slice(0, 10) : null,
                ...formDefaults
            }, void 0, false, {
                fileName: "[project]/src/app/(dashboard)/bolsa/[id]/page.tsx",
                lineNumber: 290,
                columnNumber: 9
            }, this),
            op.anulada && op.motivoAnulacion && costoReal == null && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "bg-rose-500/10 rounded-xl border border-rose-500/20 px-5 py-3",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "text-[10px] font-bold uppercase tracking-widest text-rose-400 mb-1",
                        children: "Motivo de anulación"
                    }, void 0, false, {
                        fileName: "[project]/src/app/(dashboard)/bolsa/[id]/page.tsx",
                        lineNumber: 302,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "text-[12px] text-rose-300",
                        children: op.motivoAnulacion
                    }, void 0, false, {
                        fileName: "[project]/src/app/(dashboard)/bolsa/[id]/page.tsx",
                        lineNumber: 303,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/app/(dashboard)/bolsa/[id]/page.tsx",
                lineNumber: 301,
                columnNumber: 9
            }, this),
            canAnular && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex justify-end",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$modules$2f$bolsa$2f$AnularForm$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["AnularForm"], {
                    operacionId: op.id
                }, void 0, false, {
                    fileName: "[project]/src/app/(dashboard)/bolsa/[id]/page.tsx",
                    lineNumber: 310,
                    columnNumber: 11
                }, this)
            }, void 0, false, {
                fileName: "[project]/src/app/(dashboard)/bolsa/[id]/page.tsx",
                lineNumber: 309,
                columnNumber: 9
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                className: "bg-byg-surface rounded-2xl border border-byg-border overflow-hidden",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "px-6 py-4 border-b border-byg-border",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                            className: "text-[12px] font-bold uppercase tracking-widest text-byg-text",
                            children: [
                                "Trazabilidad — ",
                                op.OperacionBolsaLog.length,
                                " eventos"
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/app/(dashboard)/bolsa/[id]/page.tsx",
                            lineNumber: 317,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/src/app/(dashboard)/bolsa/[id]/page.tsx",
                        lineNumber: 316,
                        columnNumber: 9
                    }, this),
                    op.OperacionBolsaLog.length === 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "px-6 py-4 text-xs text-byg-muted italic",
                        children: "Sin eventos."
                    }, void 0, false, {
                        fileName: "[project]/src/app/(dashboard)/bolsa/[id]/page.tsx",
                        lineNumber: 322,
                        columnNumber: 11
                    }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "divide-y divide-byg-border/40",
                        children: op.OperacionBolsaLog.map((log)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "px-6 py-3 flex items-center gap-4",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: `text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-widest ${LOG_ACCION_STYLE[log.accion] ?? "bg-byg-surface-2 text-byg-muted"}`,
                                        children: log.accion
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/(dashboard)/bolsa/[id]/page.tsx",
                                        lineNumber: 327,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "text-[11px] text-byg-muted whitespace-nowrap font-mono",
                                        children: fmtDateTime(log.createdAt.toISOString())
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/(dashboard)/bolsa/[id]/page.tsx",
                                        lineNumber: 330,
                                        columnNumber: 17
                                    }, this),
                                    log.User && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "text-[11px] font-semibold text-byg-text",
                                        children: log.User.name
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/(dashboard)/bolsa/[id]/page.tsx",
                                        lineNumber: 334,
                                        columnNumber: 19
                                    }, this),
                                    log.estadoAnterior && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "text-[10px] text-byg-muted",
                                        children: [
                                            log.estadoAnterior.replace("_", " "),
                                            " → ",
                                            log.estadoNuevo.replace("_", " ")
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/app/(dashboard)/bolsa/[id]/page.tsx",
                                        lineNumber: 337,
                                        columnNumber: 19
                                    }, this)
                                ]
                            }, log.id, true, {
                                fileName: "[project]/src/app/(dashboard)/bolsa/[id]/page.tsx",
                                lineNumber: 326,
                                columnNumber: 15
                            }, this))
                    }, void 0, false, {
                        fileName: "[project]/src/app/(dashboard)/bolsa/[id]/page.tsx",
                        lineNumber: 324,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/app/(dashboard)/bolsa/[id]/page.tsx",
                lineNumber: 315,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/app/(dashboard)/bolsa/[id]/page.tsx",
        lineNumber: 129,
        columnNumber: 5
    }, this);
}
}}),
"[project]/src/app/(dashboard)/bolsa/[id]/page.tsx [app-rsc] (ecmascript, Next.js server component)": ((__turbopack_context__) => {

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.n(__turbopack_context__.i("[project]/src/app/(dashboard)/bolsa/[id]/page.tsx [app-rsc] (ecmascript)"));
}}),

};

//# sourceMappingURL=_ea71a798._.js.map