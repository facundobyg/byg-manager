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
        return {
            error: e.message || "Error al crear operación"
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
    const netoLiquidado = esVenta ? valorBruto - costoReal : valorBruto + costoReal;
    const precioPromedioReal = !esVenta && cantidad > 0 ? netoLiquidado / cantidad : null;
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
        });
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["revalidatePath"])("/bolsa");
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["revalidatePath"])(`/bolsa/${operacionId}`);
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["revalidatePath"])("/cuentas-inversion", "layout");
        return {
            ok: true
        };
    } catch (e) {
        return {
            error: e.message || "Error al concertar operación"
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
        return {
            error: e.message || "Error al crear operación"
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
"[project]/.next-internal/server/app/(dashboard)/bolsa/page/actions.js { ACTIONS_MODULE0 => \"[project]/src/components/layout/Topbar.tsx [app-rsc] (ecmascript)\", ACTIONS_MODULE1 => \"[project]/src/app/(dashboard)/bolsa/actions.ts [app-rsc] (ecmascript)\" } [app-rsc] (server actions loader, ecmascript) <locals>": ((__turbopack_context__) => {
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
"[project]/.next-internal/server/app/(dashboard)/bolsa/page/actions.js { ACTIONS_MODULE0 => \"[project]/src/components/layout/Topbar.tsx [app-rsc] (ecmascript)\", ACTIONS_MODULE1 => \"[project]/src/app/(dashboard)/bolsa/actions.ts [app-rsc] (ecmascript)\" } [app-rsc] (server actions loader, ecmascript) <module evaluation>": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({});
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$layout$2f$Topbar$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/layout/Topbar.tsx [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f28$dashboard$292f$bolsa$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/app/(dashboard)/bolsa/actions.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f2e$next$2d$internal$2f$server$2f$app$2f28$dashboard$292f$bolsa$2f$page$2f$actions$2e$js__$7b$__ACTIONS_MODULE0__$3d3e$__$225b$project$5d2f$src$2f$components$2f$layout$2f$Topbar$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29222c$__ACTIONS_MODULE1__$3d3e$__$225b$project$5d2f$src$2f$app$2f28$dashboard$292f$bolsa$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$2922$__$7d$__$5b$app$2d$rsc$5d$__$28$server__actions__loader$2c$__ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i('[project]/.next-internal/server/app/(dashboard)/bolsa/page/actions.js { ACTIONS_MODULE0 => "[project]/src/components/layout/Topbar.tsx [app-rsc] (ecmascript)", ACTIONS_MODULE1 => "[project]/src/app/(dashboard)/bolsa/actions.ts [app-rsc] (ecmascript)" } [app-rsc] (server actions loader, ecmascript) <locals>');
}}),
"[project]/.next-internal/server/app/(dashboard)/bolsa/page/actions.js { ACTIONS_MODULE0 => \"[project]/src/components/layout/Topbar.tsx [app-rsc] (ecmascript)\", ACTIONS_MODULE1 => \"[project]/src/app/(dashboard)/bolsa/actions.ts [app-rsc] (ecmascript)\" } [app-rsc] (server actions loader, ecmascript) <exports>": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "0011ff4319847fa321c161740d2e30453828714a2e": (()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$layout$2f$Topbar$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["$$RSC_SERVER_ACTION_0"]),
    "6035d53977bf5bc76d2c85bdca3e747632711bac75": (()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f28$dashboard$292f$bolsa$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["crearOpMesaDiaria"]),
    "606cfa9090426e36c2b3b1981fe0f1dea0988a1482": (()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f28$dashboard$292f$bolsa$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["agruparOperacionesArbitraje"])
});
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$layout$2f$Topbar$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/layout/Topbar.tsx [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f28$dashboard$292f$bolsa$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/app/(dashboard)/bolsa/actions.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f2e$next$2d$internal$2f$server$2f$app$2f28$dashboard$292f$bolsa$2f$page$2f$actions$2e$js__$7b$__ACTIONS_MODULE0__$3d3e$__$225b$project$5d2f$src$2f$components$2f$layout$2f$Topbar$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29222c$__ACTIONS_MODULE1__$3d3e$__$225b$project$5d2f$src$2f$app$2f28$dashboard$292f$bolsa$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$2922$__$7d$__$5b$app$2d$rsc$5d$__$28$server__actions__loader$2c$__ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i('[project]/.next-internal/server/app/(dashboard)/bolsa/page/actions.js { ACTIONS_MODULE0 => "[project]/src/components/layout/Topbar.tsx [app-rsc] (ecmascript)", ACTIONS_MODULE1 => "[project]/src/app/(dashboard)/bolsa/actions.ts [app-rsc] (ecmascript)" } [app-rsc] (server actions loader, ecmascript) <locals>');
}}),
"[project]/.next-internal/server/app/(dashboard)/bolsa/page/actions.js { ACTIONS_MODULE0 => \"[project]/src/components/layout/Topbar.tsx [app-rsc] (ecmascript)\", ACTIONS_MODULE1 => \"[project]/src/app/(dashboard)/bolsa/actions.ts [app-rsc] (ecmascript)\" } [app-rsc] (server actions loader, ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "0011ff4319847fa321c161740d2e30453828714a2e": (()=>__TURBOPACK__imported__module__$5b$project$5d2f2e$next$2d$internal$2f$server$2f$app$2f28$dashboard$292f$bolsa$2f$page$2f$actions$2e$js__$7b$__ACTIONS_MODULE0__$3d3e$__$225b$project$5d2f$src$2f$components$2f$layout$2f$Topbar$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29222c$__ACTIONS_MODULE1__$3d3e$__$225b$project$5d2f$src$2f$app$2f28$dashboard$292f$bolsa$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$2922$__$7d$__$5b$app$2d$rsc$5d$__$28$server__actions__loader$2c$__ecmascript$29$__$3c$exports$3e$__["0011ff4319847fa321c161740d2e30453828714a2e"]),
    "6035d53977bf5bc76d2c85bdca3e747632711bac75": (()=>__TURBOPACK__imported__module__$5b$project$5d2f2e$next$2d$internal$2f$server$2f$app$2f28$dashboard$292f$bolsa$2f$page$2f$actions$2e$js__$7b$__ACTIONS_MODULE0__$3d3e$__$225b$project$5d2f$src$2f$components$2f$layout$2f$Topbar$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29222c$__ACTIONS_MODULE1__$3d3e$__$225b$project$5d2f$src$2f$app$2f28$dashboard$292f$bolsa$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$2922$__$7d$__$5b$app$2d$rsc$5d$__$28$server__actions__loader$2c$__ecmascript$29$__$3c$exports$3e$__["6035d53977bf5bc76d2c85bdca3e747632711bac75"]),
    "606cfa9090426e36c2b3b1981fe0f1dea0988a1482": (()=>__TURBOPACK__imported__module__$5b$project$5d2f2e$next$2d$internal$2f$server$2f$app$2f28$dashboard$292f$bolsa$2f$page$2f$actions$2e$js__$7b$__ACTIONS_MODULE0__$3d3e$__$225b$project$5d2f$src$2f$components$2f$layout$2f$Topbar$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29222c$__ACTIONS_MODULE1__$3d3e$__$225b$project$5d2f$src$2f$app$2f28$dashboard$292f$bolsa$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$2922$__$7d$__$5b$app$2d$rsc$5d$__$28$server__actions__loader$2c$__ecmascript$29$__$3c$exports$3e$__["606cfa9090426e36c2b3b1981fe0f1dea0988a1482"])
});
var __TURBOPACK__imported__module__$5b$project$5d2f2e$next$2d$internal$2f$server$2f$app$2f28$dashboard$292f$bolsa$2f$page$2f$actions$2e$js__$7b$__ACTIONS_MODULE0__$3d3e$__$225b$project$5d2f$src$2f$components$2f$layout$2f$Topbar$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29222c$__ACTIONS_MODULE1__$3d3e$__$225b$project$5d2f$src$2f$app$2f28$dashboard$292f$bolsa$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$2922$__$7d$__$5b$app$2d$rsc$5d$__$28$server__actions__loader$2c$__ecmascript$29$__$3c$module__evaluation$3e$__ = __turbopack_context__.i('[project]/.next-internal/server/app/(dashboard)/bolsa/page/actions.js { ACTIONS_MODULE0 => "[project]/src/components/layout/Topbar.tsx [app-rsc] (ecmascript)", ACTIONS_MODULE1 => "[project]/src/app/(dashboard)/bolsa/actions.ts [app-rsc] (ecmascript)" } [app-rsc] (server actions loader, ecmascript) <module evaluation>');
var __TURBOPACK__imported__module__$5b$project$5d2f2e$next$2d$internal$2f$server$2f$app$2f28$dashboard$292f$bolsa$2f$page$2f$actions$2e$js__$7b$__ACTIONS_MODULE0__$3d3e$__$225b$project$5d2f$src$2f$components$2f$layout$2f$Topbar$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29222c$__ACTIONS_MODULE1__$3d3e$__$225b$project$5d2f$src$2f$app$2f28$dashboard$292f$bolsa$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$2922$__$7d$__$5b$app$2d$rsc$5d$__$28$server__actions__loader$2c$__ecmascript$29$__$3c$exports$3e$__ = __turbopack_context__.i('[project]/.next-internal/server/app/(dashboard)/bolsa/page/actions.js { ACTIONS_MODULE0 => "[project]/src/components/layout/Topbar.tsx [app-rsc] (ecmascript)", ACTIONS_MODULE1 => "[project]/src/app/(dashboard)/bolsa/actions.ts [app-rsc] (ecmascript)" } [app-rsc] (server actions loader, ecmascript) <exports>');
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
"[externals]/@prisma/client/runtime/library [external] (@prisma/client/runtime/library, esm_import)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname, a: __turbopack_async_module__ } = __turbopack_context__;
__turbopack_async_module__(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {
const mod = await __turbopack_context__.y("@prisma/client/runtime/library");

__turbopack_context__.n(mod);
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, true);}),
"[project]/src/lib/services/config.service.ts [app-rsc] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname, a: __turbopack_async_module__ } = __turbopack_context__;
__turbopack_async_module__(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {
__turbopack_context__.s({
    "getActivosPrecios": (()=>getActivosPrecios),
    "getClienteDeMap": (()=>getClienteDeMap),
    "getMesActivo": (()=>getMesActivo),
    "getMesOperativo": (()=>getMesOperativo),
    "getProductoresConfig": (()=>getProductoresConfig),
    "getSocios": (()=>getSocios),
    "getTCBlue": (()=>getTCBlue),
    "getTCHistorial": (()=>getTCHistorial),
    "getTCMep": (()=>getTCMep),
    "setMesActivo": (()=>setMesActivo),
    "setTCBlue": (()=>setTCBlue),
    "setTCMep": (()=>setTCMep),
    "updatePrecioActivo": (()=>updatePrecioActivo),
    "updatePreciosActivosBatch": (()=>updatePreciosActivosBatch)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/prisma.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client$2f$runtime$2f$library__$5b$external$5d$__$2840$prisma$2f$client$2f$runtime$2f$library$2c$__esm_import$29$__ = __turbopack_context__.i("[externals]/@prisma/client/runtime/library [external] (@prisma/client/runtime/library, esm_import)");
var __turbopack_async_dependencies__ = __turbopack_handle_async_dependencies__([
    __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client$2f$runtime$2f$library__$5b$external$5d$__$2840$prisma$2f$client$2f$runtime$2f$library$2c$__esm_import$29$__
]);
([__TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client$2f$runtime$2f$library__$5b$external$5d$__$2840$prisma$2f$client$2f$runtime$2f$library$2c$__esm_import$29$__] = __turbopack_async_dependencies__.then ? (await __turbopack_async_dependencies__)() : __turbopack_async_dependencies__);
;
;
const PRODUCTORES_DEFAULT = [
    {
        label: "BYG",
        value: "BYG",
        activo: true
    },
    {
        label: "Otro",
        value: "OTRO",
        activo: true
    }
];
async function getProductoresConfig() {
    try {
        const row = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].config.findUnique({
            where: {
                clave: "productores_config"
            }
        });
        if (!row) return PRODUCTORES_DEFAULT;
        const parsed = JSON.parse(row.valor);
        if (!Array.isArray(parsed) || parsed.length === 0) return PRODUCTORES_DEFAULT;
        // Migrate IPS to OTRO
        return parsed.map((p)=>({
                ...p,
                value: p.value === "IPS" ? "OTRO" : p.value
            }));
    } catch  {
        return PRODUCTORES_DEFAULT;
    }
}
async function getTCBlue() {
    return __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].config.findUnique({
        where: {
            clave: "tc_blue"
        }
    });
}
async function setTCBlue(value) {
    const dec = new __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client$2f$runtime$2f$library__$5b$external$5d$__$2840$prisma$2f$client$2f$runtime$2f$library$2c$__esm_import$29$__["Decimal"](value).toDecimalPlaces(4);
    const hoy = new Date();
    const fecha = new Date(Date.UTC(hoy.getFullYear(), hoy.getMonth(), hoy.getDate()));
    await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].$transaction([
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].config.upsert({
            where: {
                clave: "tc_blue"
            },
            update: {
                valor: dec.toString()
            },
            create: {
                id: crypto.randomUUID(),
                clave: "tc_blue",
                valor: dec.toString(),
                updatedAt: new Date()
            }
        }),
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].tipoCambio.upsert({
            where: {
                monedaOrigen_monedaDestino_fecha: {
                    monedaOrigen: "ARS",
                    monedaDestino: "USD",
                    fecha
                }
            },
            update: {
                valor: dec
            },
            create: {
                id: crypto.randomUUID(),
                monedaOrigen: "ARS",
                monedaDestino: "USD",
                valor: dec,
                fecha
            }
        })
    ]);
}
async function getMesActivo() {
    return __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].mesContable.findFirst({
        where: {
            activo: true
        }
    });
}
async function getMesOperativo() {
    const activo = await getMesActivo();
    if (activo?.mes) return activo.mes;
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}
async function setMesActivo(mes) {
    await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].$transaction([
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].mesContable.updateMany({
            data: {
                activo: false
            }
        }),
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].mesContable.upsert({
            where: {
                mes
            },
            update: {
                activo: true
            },
            create: {
                id: crypto.randomUUID(),
                mes,
                activo: true
            }
        })
    ]);
}
async function getSocios() {
    return __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].socioPorcentaje.findMany({
        orderBy: {
            nombre: "asc"
        }
    });
}
async function getTCHistorial() {
    return __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].tipoCambio.findMany({
        where: {
            monedaOrigen: "ARS",
            monedaDestino: "USD"
        },
        orderBy: {
            fecha: "desc"
        },
        take: 7
    });
}
async function getActivosPrecios() {
    return __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].activo.findMany({
        orderBy: {
            ticker: "asc"
        }
    });
}
async function updatePrecioActivo(activoId, precio) {
    const dec = new __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client$2f$runtime$2f$library__$5b$external$5d$__$2840$prisma$2f$client$2f$runtime$2f$library$2c$__esm_import$29$__["Decimal"](precio).toDecimalPlaces(6);
    const now = new Date();
    const fecha = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
    await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].$transaction([
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].activo.update({
            where: {
                id: activoId
            },
            data: {
                precioActual: dec,
                updatedAt: now
            }
        }),
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].precioHistorico.upsert({
            where: {
                activoId_fecha: {
                    activoId,
                    fecha
                }
            },
            update: {
                precio: dec
            },
            create: {
                id: crypto.randomUUID(),
                activoId,
                fecha,
                precio: dec
            }
        })
    ]);
}
async function getTCMep() {
    return __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].config.findUnique({
        where: {
            clave: "tc_mep"
        }
    });
}
async function setTCMep(value) {
    const dec = new __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client$2f$runtime$2f$library__$5b$external$5d$__$2840$prisma$2f$client$2f$runtime$2f$library$2c$__esm_import$29$__["Decimal"](value).toDecimalPlaces(4);
    await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].config.upsert({
        where: {
            clave: "tc_mep"
        },
        update: {
            valor: dec.toString(),
            updatedAt: new Date()
        },
        create: {
            id: crypto.randomUUID(),
            clave: "tc_mep",
            valor: dec.toString(),
            updatedAt: new Date()
        }
    });
}
async function getClienteDeMap() {
    try {
        const row = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].config.findUnique({
            where: {
                clave: "cliente_de_map"
            }
        });
        if (!row) return {};
        const parsed = JSON.parse(row.valor);
        return typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
    } catch  {
        return {};
    }
}
async function updatePreciosActivosBatch(items) {
    const now = new Date();
    const fecha = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
    const operations = items.flatMap((item)=>{
        const dec = new __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client$2f$runtime$2f$library__$5b$external$5d$__$2840$prisma$2f$client$2f$runtime$2f$library$2c$__esm_import$29$__["Decimal"](item.precio).toDecimalPlaces(6);
        return [
            __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].activo.update({
                where: {
                    id: item.id
                },
                data: {
                    precioActual: dec,
                    updatedAt: now
                }
            }),
            __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].precioHistorico.upsert({
                where: {
                    activoId_fecha: {
                        activoId: item.id,
                        fecha
                    }
                },
                update: {
                    precio: dec
                },
                create: {
                    id: crypto.randomUUID(),
                    activoId: item.id,
                    fecha,
                    precio: dec
                }
            })
        ];
    });
    await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].$transaction(operations);
}
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, false);}),
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
            const resultado = row.resultadoNeto ?? row.resultadoBruto ?? 0;
            if (r.moneda === "ARS") g.totalResultadoARS += resultado;
            else if (r.moneda === "USD") g.totalResultadoUSD += resultado;
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
            const resultado = row.resultadoNeto ?? row.resultadoBruto ?? 0;
            if (r.moneda === "ARS") g.totalResultadoARS += resultado;
            else if (r.moneda === "USD") g.totalResultadoUSD += resultado;
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
"[project]/src/components/modules/bolsa/MesaDiariaForm.tsx (client reference/proxy) <module evaluation>": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "MesaDiariaForm": (()=>MesaDiariaForm)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$server$2d$dom$2d$turbopack$2d$server$2d$edge$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-server-dom-turbopack-server-edge.js [app-rsc] (ecmascript)");
;
const MesaDiariaForm = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$server$2d$dom$2d$turbopack$2d$server$2d$edge$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerClientReference"])(function() {
    throw new Error("Attempted to call MesaDiariaForm() from the server but MesaDiariaForm is on the client. It's not possible to invoke a client function from the server, it can only be rendered as a Component or passed to props of a Client Component.");
}, "[project]/src/components/modules/bolsa/MesaDiariaForm.tsx <module evaluation>", "MesaDiariaForm");
}}),
"[project]/src/components/modules/bolsa/MesaDiariaForm.tsx (client reference/proxy)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "MesaDiariaForm": (()=>MesaDiariaForm)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$server$2d$dom$2d$turbopack$2d$server$2d$edge$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-server-dom-turbopack-server-edge.js [app-rsc] (ecmascript)");
;
const MesaDiariaForm = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$server$2d$dom$2d$turbopack$2d$server$2d$edge$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerClientReference"])(function() {
    throw new Error("Attempted to call MesaDiariaForm() from the server but MesaDiariaForm is on the client. It's not possible to invoke a client function from the server, it can only be rendered as a Component or passed to props of a Client Component.");
}, "[project]/src/components/modules/bolsa/MesaDiariaForm.tsx", "MesaDiariaForm");
}}),
"[project]/src/components/modules/bolsa/MesaDiariaForm.tsx [app-rsc] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$modules$2f$bolsa$2f$MesaDiariaForm$2e$tsx__$28$client__reference$2f$proxy$29$__$3c$module__evaluation$3e$__ = __turbopack_context__.i("[project]/src/components/modules/bolsa/MesaDiariaForm.tsx (client reference/proxy) <module evaluation>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$modules$2f$bolsa$2f$MesaDiariaForm$2e$tsx__$28$client__reference$2f$proxy$29$__ = __turbopack_context__.i("[project]/src/components/modules/bolsa/MesaDiariaForm.tsx (client reference/proxy)");
;
__turbopack_context__.n(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$modules$2f$bolsa$2f$MesaDiariaForm$2e$tsx__$28$client__reference$2f$proxy$29$__);
}}),
"[project]/src/components/modules/bolsa/MesaDiariaTable.tsx (client reference/proxy) <module evaluation>": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "MesaDiariaTable": (()=>MesaDiariaTable)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$server$2d$dom$2d$turbopack$2d$server$2d$edge$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-server-dom-turbopack-server-edge.js [app-rsc] (ecmascript)");
;
const MesaDiariaTable = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$server$2d$dom$2d$turbopack$2d$server$2d$edge$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerClientReference"])(function() {
    throw new Error("Attempted to call MesaDiariaTable() from the server but MesaDiariaTable is on the client. It's not possible to invoke a client function from the server, it can only be rendered as a Component or passed to props of a Client Component.");
}, "[project]/src/components/modules/bolsa/MesaDiariaTable.tsx <module evaluation>", "MesaDiariaTable");
}}),
"[project]/src/components/modules/bolsa/MesaDiariaTable.tsx (client reference/proxy)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "MesaDiariaTable": (()=>MesaDiariaTable)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$server$2d$dom$2d$turbopack$2d$server$2d$edge$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-server-dom-turbopack-server-edge.js [app-rsc] (ecmascript)");
;
const MesaDiariaTable = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$server$2d$dom$2d$turbopack$2d$server$2d$edge$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerClientReference"])(function() {
    throw new Error("Attempted to call MesaDiariaTable() from the server but MesaDiariaTable is on the client. It's not possible to invoke a client function from the server, it can only be rendered as a Component or passed to props of a Client Component.");
}, "[project]/src/components/modules/bolsa/MesaDiariaTable.tsx", "MesaDiariaTable");
}}),
"[project]/src/components/modules/bolsa/MesaDiariaTable.tsx [app-rsc] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$modules$2f$bolsa$2f$MesaDiariaTable$2e$tsx__$28$client__reference$2f$proxy$29$__$3c$module__evaluation$3e$__ = __turbopack_context__.i("[project]/src/components/modules/bolsa/MesaDiariaTable.tsx (client reference/proxy) <module evaluation>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$modules$2f$bolsa$2f$MesaDiariaTable$2e$tsx__$28$client__reference$2f$proxy$29$__ = __turbopack_context__.i("[project]/src/components/modules/bolsa/MesaDiariaTable.tsx (client reference/proxy)");
;
__turbopack_context__.n(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$modules$2f$bolsa$2f$MesaDiariaTable$2e$tsx__$28$client__reference$2f$proxy$29$__);
}}),
"[project]/src/components/modules/bolsa/BolsaTabla.tsx (client reference/proxy) <module evaluation>": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "BolsaTabla": (()=>BolsaTabla)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$server$2d$dom$2d$turbopack$2d$server$2d$edge$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-server-dom-turbopack-server-edge.js [app-rsc] (ecmascript)");
;
const BolsaTabla = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$server$2d$dom$2d$turbopack$2d$server$2d$edge$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerClientReference"])(function() {
    throw new Error("Attempted to call BolsaTabla() from the server but BolsaTabla is on the client. It's not possible to invoke a client function from the server, it can only be rendered as a Component or passed to props of a Client Component.");
}, "[project]/src/components/modules/bolsa/BolsaTabla.tsx <module evaluation>", "BolsaTabla");
}}),
"[project]/src/components/modules/bolsa/BolsaTabla.tsx (client reference/proxy)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "BolsaTabla": (()=>BolsaTabla)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$server$2d$dom$2d$turbopack$2d$server$2d$edge$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-server-dom-turbopack-server-edge.js [app-rsc] (ecmascript)");
;
const BolsaTabla = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$server$2d$dom$2d$turbopack$2d$server$2d$edge$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerClientReference"])(function() {
    throw new Error("Attempted to call BolsaTabla() from the server but BolsaTabla is on the client. It's not possible to invoke a client function from the server, it can only be rendered as a Component or passed to props of a Client Component.");
}, "[project]/src/components/modules/bolsa/BolsaTabla.tsx", "BolsaTabla");
}}),
"[project]/src/components/modules/bolsa/BolsaTabla.tsx [app-rsc] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$modules$2f$bolsa$2f$BolsaTabla$2e$tsx__$28$client__reference$2f$proxy$29$__$3c$module__evaluation$3e$__ = __turbopack_context__.i("[project]/src/components/modules/bolsa/BolsaTabla.tsx (client reference/proxy) <module evaluation>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$modules$2f$bolsa$2f$BolsaTabla$2e$tsx__$28$client__reference$2f$proxy$29$__ = __turbopack_context__.i("[project]/src/components/modules/bolsa/BolsaTabla.tsx (client reference/proxy)");
;
__turbopack_context__.n(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$modules$2f$bolsa$2f$BolsaTabla$2e$tsx__$28$client__reference$2f$proxy$29$__);
}}),
"[project]/src/components/modules/bolsa/TabsNav.tsx (client reference/proxy) <module evaluation>": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "TabsNav": (()=>TabsNav)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$server$2d$dom$2d$turbopack$2d$server$2d$edge$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-server-dom-turbopack-server-edge.js [app-rsc] (ecmascript)");
;
const TabsNav = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$server$2d$dom$2d$turbopack$2d$server$2d$edge$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerClientReference"])(function() {
    throw new Error("Attempted to call TabsNav() from the server but TabsNav is on the client. It's not possible to invoke a client function from the server, it can only be rendered as a Component or passed to props of a Client Component.");
}, "[project]/src/components/modules/bolsa/TabsNav.tsx <module evaluation>", "TabsNav");
}}),
"[project]/src/components/modules/bolsa/TabsNav.tsx (client reference/proxy)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "TabsNav": (()=>TabsNav)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$server$2d$dom$2d$turbopack$2d$server$2d$edge$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-server-dom-turbopack-server-edge.js [app-rsc] (ecmascript)");
;
const TabsNav = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$server$2d$dom$2d$turbopack$2d$server$2d$edge$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerClientReference"])(function() {
    throw new Error("Attempted to call TabsNav() from the server but TabsNav is on the client. It's not possible to invoke a client function from the server, it can only be rendered as a Component or passed to props of a Client Component.");
}, "[project]/src/components/modules/bolsa/TabsNav.tsx", "TabsNav");
}}),
"[project]/src/components/modules/bolsa/TabsNav.tsx [app-rsc] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$modules$2f$bolsa$2f$TabsNav$2e$tsx__$28$client__reference$2f$proxy$29$__$3c$module__evaluation$3e$__ = __turbopack_context__.i("[project]/src/components/modules/bolsa/TabsNav.tsx (client reference/proxy) <module evaluation>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$modules$2f$bolsa$2f$TabsNav$2e$tsx__$28$client__reference$2f$proxy$29$__ = __turbopack_context__.i("[project]/src/components/modules/bolsa/TabsNav.tsx (client reference/proxy)");
;
__turbopack_context__.n(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$modules$2f$bolsa$2f$TabsNav$2e$tsx__$28$client__reference$2f$proxy$29$__);
}}),
"[project]/src/app/(dashboard)/bolsa/page.tsx [app-rsc] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname, a: __turbopack_async_module__ } = __turbopack_context__;
__turbopack_async_module__(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {
__turbopack_context__.s({
    "default": (()=>BolsaPage)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-jsx-dev-runtime.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chart$2d$candlestick$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__default__as__CandlestickChart$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/chart-candlestick.js [app-rsc] (ecmascript) <export default as CandlestickChart>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/client/app-dir/link.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/prisma.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$services$2f$config$2e$service$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/services/config.service.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$data$2f$operacion$2d$bolsa$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/data/operacion-bolsa.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$modules$2f$bolsa$2f$MesaDiariaForm$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/modules/bolsa/MesaDiariaForm.tsx [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$modules$2f$bolsa$2f$MesaDiariaTable$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/modules/bolsa/MesaDiariaTable.tsx [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$modules$2f$bolsa$2f$BolsaTabla$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/modules/bolsa/BolsaTabla.tsx [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$modules$2f$bolsa$2f$TabsNav$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/modules/bolsa/TabsNav.tsx [app-rsc] (ecmascript)");
var __turbopack_async_dependencies__ = __turbopack_handle_async_dependencies__([
    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$services$2f$config$2e$service$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__
]);
([__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$services$2f$config$2e$service$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__] = __turbopack_async_dependencies__.then ? (await __turbopack_async_dependencies__)() : __turbopack_async_dependencies__);
;
;
;
;
;
;
;
;
;
;
;
function todayStr() {
    return new Date().toISOString().split("T")[0];
}
async function BolsaPage({ searchParams }) {
    const params = await searchParams;
    const fecha = params.fecha || todayStr();
    const tab = params.tab || "mesa";
    // Resolve active month for historial default
    const mesOperativo = tab === "historial" ? await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$services$2f$config$2e$service$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getMesOperativo"])() : null;
    const now = new Date();
    const mesCalendario = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const historialMes = tab === "historial" ? params.mes ?? mesOperativo ?? mesCalendario : undefined;
    // Month navigation helpers for historial
    const histNavMes = historialMes ?? mesCalendario;
    const [hYear, hMonth] = histNavMes.split("-").map(Number);
    const histPrevMes = (()=>{
        const d = new Date(Date.UTC(hYear, hMonth - 2, 1));
        return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
    })();
    const histNextMes = (()=>{
        const d = new Date(Date.UTC(hYear, hMonth, 1));
        return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
    })();
    const histIsCurrentMes = histNavMes === mesCalendario;
    const histMesLabel = new Date(Date.UTC(hYear, hMonth - 1, 1)).toLocaleDateString("es-AR", {
        month: "long",
        year: "numeric",
        timeZone: "UTC"
    });
    // Mesa Diaria data
    const [mesaData, carteras, comitentes] = tab !== "historial" ? await Promise.all([
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$data$2f$operacion$2d$bolsa$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getOperacionesMesaDiaria"])(fecha),
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].cartera.findMany({
            where: {
                activa: true,
                tipo: {
                    not: "CRIPTO"
                },
                slug: {
                    not: "binance"
                }
            },
            select: {
                id: true,
                nombre: true
            },
            orderBy: {
                nombre: "asc"
            }
        }),
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].comitenteInversion.findMany({
            where: {
                activo: true
            },
            select: {
                id: true,
                nombre: true,
                nroComitente: true
            },
            orderBy: {
                nombre: "asc"
            }
        })
    ]) : [
        null,
        [],
        []
    ];
    // Historial data (filtered by active month)
    const historialOps = tab === "historial" ? await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$data$2f$operacion$2d$bolsa$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getOperacionesBolsa"])(historialMes) : null;
    const historialRows = historialOps ? historialOps.map((op)=>({
            id: op.id,
            fechaCarga: op.fechaCarga.toISOString(),
            sujeto: op.ComitenteInversion?.nombre ?? op.Cliente?.nombre ?? op.Cartera?.nombre ?? "Cartera Propia",
            tipoOperacion: op.tipoOperacion,
            ticker: op.ticker,
            cantidad: Number(op.cantidad),
            precio: Number(op.precio),
            moneda: op.moneda,
            estado: op.estado,
            operador: op.OperadorCarga.name,
            anulada: op.anulada
        })) : [];
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "flex flex-col gap-6",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("header", {
                className: "bg-byg-surface rounded-2xl border border-byg-border p-6 relative overflow-hidden",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "absolute top-0 left-0 w-full h-[3px] bg-byg-accent"
                    }, void 0, false, {
                        fileName: "[project]/src/app/(dashboard)/bolsa/page.tsx",
                        lineNumber: 85,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "text-[10px] font-black text-byg-accent uppercase tracking-[0.3em] mb-1",
                        children: "Operativa"
                    }, void 0, false, {
                        fileName: "[project]/src/app/(dashboard)/bolsa/page.tsx",
                        lineNumber: 86,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex items-end justify-between gap-6",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                                    className: "text-3xl font-black text-byg-text tracking-tight flex items-center gap-3",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chart$2d$candlestick$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__default__as__CandlestickChart$3e$__["CandlestickChart"], {
                                            size: 28,
                                            className: "text-byg-accent"
                                        }, void 0, false, {
                                            fileName: "[project]/src/app/(dashboard)/bolsa/page.tsx",
                                            lineNumber: 90,
                                            columnNumber: 15
                                        }, this),
                                        "Operaciones Bolsa"
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/app/(dashboard)/bolsa/page.tsx",
                                    lineNumber: 89,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                    className: "text-xs font-medium text-byg-muted mt-1",
                                    children: tab !== "historial" ? `Mesa diaria — ${fecha}` : "Historial de operaciones"
                                }, void 0, false, {
                                    fileName: "[project]/src/app/(dashboard)/bolsa/page.tsx",
                                    lineNumber: 93,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/app/(dashboard)/bolsa/page.tsx",
                            lineNumber: 88,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/src/app/(dashboard)/bolsa/page.tsx",
                        lineNumber: 87,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/app/(dashboard)/bolsa/page.tsx",
                lineNumber: 84,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$modules$2f$bolsa$2f$TabsNav$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["TabsNav"], {
                fecha: fecha,
                tab: tab
            }, void 0, false, {
                fileName: "[project]/src/app/(dashboard)/bolsa/page.tsx",
                lineNumber: 101,
                columnNumber: 7
            }, this),
            tab !== "historial" && mesaData && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["Fragment"], {
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$modules$2f$bolsa$2f$MesaDiariaForm$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["MesaDiariaForm"], {
                        comitentes: comitentes,
                        carteras: carteras,
                        defaultFecha: fecha
                    }, void 0, false, {
                        fileName: "[project]/src/app/(dashboard)/bolsa/page.tsx",
                        lineNumber: 106,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$modules$2f$bolsa$2f$MesaDiariaTable$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["MesaDiariaTable"], {
                        data: mesaData
                    }, void 0, false, {
                        fileName: "[project]/src/app/(dashboard)/bolsa/page.tsx",
                        lineNumber: 111,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true),
            tab === "historial" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["Fragment"], {
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex items-center gap-3 flex-wrap",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"], {
                                href: `/bolsa?tab=historial&mes=${histPrevMes}`,
                                className: "px-3 py-1.5 rounded-lg border border-byg-border bg-byg-surface text-byg-muted hover:text-byg-accent hover:border-byg-accent/40 text-[11px] font-black transition-colors",
                                children: "←"
                            }, void 0, false, {
                                fileName: "[project]/src/app/(dashboard)/bolsa/page.tsx",
                                lineNumber: 120,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "text-[12px] font-bold text-byg-text tabular-nums capitalize min-w-[140px] text-center",
                                children: histMesLabel
                            }, void 0, false, {
                                fileName: "[project]/src/app/(dashboard)/bolsa/page.tsx",
                                lineNumber: 126,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"], {
                                href: `/bolsa?tab=historial&mes=${histNextMes}`,
                                className: `px-3 py-1.5 rounded-lg border border-byg-border bg-byg-surface text-[11px] font-black transition-colors ${histIsCurrentMes ? "opacity-30 pointer-events-none text-byg-muted" : "text-byg-muted hover:text-byg-accent hover:border-byg-accent/40"}`,
                                children: "→"
                            }, void 0, false, {
                                fileName: "[project]/src/app/(dashboard)/bolsa/page.tsx",
                                lineNumber: 129,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "text-[10px] text-byg-muted font-mono",
                                children: [
                                    historialRows.length,
                                    " ops"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/(dashboard)/bolsa/page.tsx",
                                lineNumber: 137,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/app/(dashboard)/bolsa/page.tsx",
                        lineNumber: 119,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "grid grid-cols-2 sm:grid-cols-4 gap-4",
                        children: [
                            {
                                label: "Total",
                                value: historialRows.length,
                                color: "text-byg-text",
                                top: "border-t-byg-border-2"
                            },
                            {
                                label: "Pendientes",
                                value: historialRows.filter((r)=>r.estado === "PENDIENTE_CONCERTACION").length,
                                color: "text-amber-400",
                                top: "border-t-amber-400"
                            },
                            {
                                label: "Concertadas",
                                value: historialRows.filter((r)=>r.estado === "CONCERTADA").length,
                                color: "text-byg-accent",
                                top: "border-t-blue-500"
                            },
                            {
                                label: "Liquidadas",
                                value: historialRows.filter((r)=>r.estado === "LIQUIDADA").length,
                                color: "text-emerald-400",
                                top: "border-t-emerald-500"
                            }
                        ].map(({ label, value, color, top })=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: `bg-byg-surface rounded-xl border border-byg-border border-t-[3px] ${top} p-5`,
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "text-[10px] font-bold uppercase tracking-widest text-byg-muted mb-1",
                                        children: label
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/(dashboard)/bolsa/page.tsx",
                                        lineNumber: 148,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: `text-3xl font-black tabular-nums font-mono tracking-tight ${color}`,
                                        children: value
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/(dashboard)/bolsa/page.tsx",
                                        lineNumber: 149,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, label, true, {
                                fileName: "[project]/src/app/(dashboard)/bolsa/page.tsx",
                                lineNumber: 147,
                                columnNumber: 15
                            }, this))
                    }, void 0, false, {
                        fileName: "[project]/src/app/(dashboard)/bolsa/page.tsx",
                        lineNumber: 140,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$modules$2f$bolsa$2f$BolsaTabla$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["BolsaTabla"], {
                        rows: historialRows
                    }, void 0, false, {
                        fileName: "[project]/src/app/(dashboard)/bolsa/page.tsx",
                        lineNumber: 153,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true)
        ]
    }, void 0, true, {
        fileName: "[project]/src/app/(dashboard)/bolsa/page.tsx",
        lineNumber: 82,
        columnNumber: 5
    }, this);
}
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, false);}),
"[project]/src/app/(dashboard)/bolsa/page.tsx [app-rsc] (ecmascript, Next.js server component)": ((__turbopack_context__) => {

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.n(__turbopack_context__.i("[project]/src/app/(dashboard)/bolsa/page.tsx [app-rsc] (ecmascript)"));
}}),

};

//# sourceMappingURL=%5Broot-of-the-server%5D__10b1bdbc._.js.map