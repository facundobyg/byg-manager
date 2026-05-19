module.exports = {

"[project]/src/app/(dashboard)/bolsa/actions.ts [app-rsc] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
/* __next_internal_action_entry_do_not_use__ [{"6035d53977bf5bc76d2c85bdca3e747632711bac75":"crearOpMesaDiaria","604d803f139ab5aa6ec97524e2ce14b730def75378":"concertarOperacion","60af330acff09f27046538c72d5de4c2db61ff0417":"crearOperacionBolsa","60ccca7881a3263e68458c7cf624546246d209d57f":"anularOperacion"},"",""] */ __turbopack_context__.s({
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
    const senebiBruto = toN(formData.get("senebiBruto"));
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
    anularOperacion
]);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(crearOperacionBolsa, "60af330acff09f27046538c72d5de4c2db61ff0417", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(concertarOperacion, "604d803f139ab5aa6ec97524e2ce14b730def75378", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(crearOpMesaDiaria, "6035d53977bf5bc76d2c85bdca3e747632711bac75", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(anularOperacion, "60ccca7881a3263e68458c7cf624546246d209d57f", null);
}}),
"[project]/.next-internal/server/app/(dashboard)/bolsa/nueva/page/actions.js { ACTIONS_MODULE0 => \"[project]/src/components/layout/Topbar.tsx [app-rsc] (ecmascript)\", ACTIONS_MODULE1 => \"[project]/src/app/(dashboard)/bolsa/actions.ts [app-rsc] (ecmascript)\" } [app-rsc] (server actions loader, ecmascript) <locals>": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({});
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$layout$2f$Topbar$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/layout/Topbar.tsx [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f28$dashboard$292f$bolsa$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/app/(dashboard)/bolsa/actions.ts [app-rsc] (ecmascript)");
;
;
}}),
"[project]/.next-internal/server/app/(dashboard)/bolsa/nueva/page/actions.js { ACTIONS_MODULE0 => \"[project]/src/components/layout/Topbar.tsx [app-rsc] (ecmascript)\", ACTIONS_MODULE1 => \"[project]/src/app/(dashboard)/bolsa/actions.ts [app-rsc] (ecmascript)\" } [app-rsc] (server actions loader, ecmascript) <module evaluation>": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({});
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$layout$2f$Topbar$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/layout/Topbar.tsx [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f28$dashboard$292f$bolsa$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/app/(dashboard)/bolsa/actions.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f2e$next$2d$internal$2f$server$2f$app$2f28$dashboard$292f$bolsa$2f$nueva$2f$page$2f$actions$2e$js__$7b$__ACTIONS_MODULE0__$3d3e$__$225b$project$5d2f$src$2f$components$2f$layout$2f$Topbar$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29222c$__ACTIONS_MODULE1__$3d3e$__$225b$project$5d2f$src$2f$app$2f28$dashboard$292f$bolsa$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$2922$__$7d$__$5b$app$2d$rsc$5d$__$28$server__actions__loader$2c$__ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i('[project]/.next-internal/server/app/(dashboard)/bolsa/nueva/page/actions.js { ACTIONS_MODULE0 => "[project]/src/components/layout/Topbar.tsx [app-rsc] (ecmascript)", ACTIONS_MODULE1 => "[project]/src/app/(dashboard)/bolsa/actions.ts [app-rsc] (ecmascript)" } [app-rsc] (server actions loader, ecmascript) <locals>');
}}),
"[project]/.next-internal/server/app/(dashboard)/bolsa/nueva/page/actions.js { ACTIONS_MODULE0 => \"[project]/src/components/layout/Topbar.tsx [app-rsc] (ecmascript)\", ACTIONS_MODULE1 => \"[project]/src/app/(dashboard)/bolsa/actions.ts [app-rsc] (ecmascript)\" } [app-rsc] (server actions loader, ecmascript) <exports>": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "0011ff4319847fa321c161740d2e30453828714a2e": (()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$layout$2f$Topbar$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["$$RSC_SERVER_ACTION_0"]),
    "60af330acff09f27046538c72d5de4c2db61ff0417": (()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f28$dashboard$292f$bolsa$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["crearOperacionBolsa"])
});
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$layout$2f$Topbar$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/layout/Topbar.tsx [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f28$dashboard$292f$bolsa$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/app/(dashboard)/bolsa/actions.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f2e$next$2d$internal$2f$server$2f$app$2f28$dashboard$292f$bolsa$2f$nueva$2f$page$2f$actions$2e$js__$7b$__ACTIONS_MODULE0__$3d3e$__$225b$project$5d2f$src$2f$components$2f$layout$2f$Topbar$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29222c$__ACTIONS_MODULE1__$3d3e$__$225b$project$5d2f$src$2f$app$2f28$dashboard$292f$bolsa$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$2922$__$7d$__$5b$app$2d$rsc$5d$__$28$server__actions__loader$2c$__ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i('[project]/.next-internal/server/app/(dashboard)/bolsa/nueva/page/actions.js { ACTIONS_MODULE0 => "[project]/src/components/layout/Topbar.tsx [app-rsc] (ecmascript)", ACTIONS_MODULE1 => "[project]/src/app/(dashboard)/bolsa/actions.ts [app-rsc] (ecmascript)" } [app-rsc] (server actions loader, ecmascript) <locals>');
}}),
"[project]/.next-internal/server/app/(dashboard)/bolsa/nueva/page/actions.js { ACTIONS_MODULE0 => \"[project]/src/components/layout/Topbar.tsx [app-rsc] (ecmascript)\", ACTIONS_MODULE1 => \"[project]/src/app/(dashboard)/bolsa/actions.ts [app-rsc] (ecmascript)\" } [app-rsc] (server actions loader, ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "0011ff4319847fa321c161740d2e30453828714a2e": (()=>__TURBOPACK__imported__module__$5b$project$5d2f2e$next$2d$internal$2f$server$2f$app$2f28$dashboard$292f$bolsa$2f$nueva$2f$page$2f$actions$2e$js__$7b$__ACTIONS_MODULE0__$3d3e$__$225b$project$5d2f$src$2f$components$2f$layout$2f$Topbar$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29222c$__ACTIONS_MODULE1__$3d3e$__$225b$project$5d2f$src$2f$app$2f28$dashboard$292f$bolsa$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$2922$__$7d$__$5b$app$2d$rsc$5d$__$28$server__actions__loader$2c$__ecmascript$29$__$3c$exports$3e$__["0011ff4319847fa321c161740d2e30453828714a2e"]),
    "60af330acff09f27046538c72d5de4c2db61ff0417": (()=>__TURBOPACK__imported__module__$5b$project$5d2f2e$next$2d$internal$2f$server$2f$app$2f28$dashboard$292f$bolsa$2f$nueva$2f$page$2f$actions$2e$js__$7b$__ACTIONS_MODULE0__$3d3e$__$225b$project$5d2f$src$2f$components$2f$layout$2f$Topbar$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29222c$__ACTIONS_MODULE1__$3d3e$__$225b$project$5d2f$src$2f$app$2f28$dashboard$292f$bolsa$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$2922$__$7d$__$5b$app$2d$rsc$5d$__$28$server__actions__loader$2c$__ecmascript$29$__$3c$exports$3e$__["60af330acff09f27046538c72d5de4c2db61ff0417"])
});
var __TURBOPACK__imported__module__$5b$project$5d2f2e$next$2d$internal$2f$server$2f$app$2f28$dashboard$292f$bolsa$2f$nueva$2f$page$2f$actions$2e$js__$7b$__ACTIONS_MODULE0__$3d3e$__$225b$project$5d2f$src$2f$components$2f$layout$2f$Topbar$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29222c$__ACTIONS_MODULE1__$3d3e$__$225b$project$5d2f$src$2f$app$2f28$dashboard$292f$bolsa$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$2922$__$7d$__$5b$app$2d$rsc$5d$__$28$server__actions__loader$2c$__ecmascript$29$__$3c$module__evaluation$3e$__ = __turbopack_context__.i('[project]/.next-internal/server/app/(dashboard)/bolsa/nueva/page/actions.js { ACTIONS_MODULE0 => "[project]/src/components/layout/Topbar.tsx [app-rsc] (ecmascript)", ACTIONS_MODULE1 => "[project]/src/app/(dashboard)/bolsa/actions.ts [app-rsc] (ecmascript)" } [app-rsc] (server actions loader, ecmascript) <module evaluation>');
var __TURBOPACK__imported__module__$5b$project$5d2f2e$next$2d$internal$2f$server$2f$app$2f28$dashboard$292f$bolsa$2f$nueva$2f$page$2f$actions$2e$js__$7b$__ACTIONS_MODULE0__$3d3e$__$225b$project$5d2f$src$2f$components$2f$layout$2f$Topbar$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29222c$__ACTIONS_MODULE1__$3d3e$__$225b$project$5d2f$src$2f$app$2f28$dashboard$292f$bolsa$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$2922$__$7d$__$5b$app$2d$rsc$5d$__$28$server__actions__loader$2c$__ecmascript$29$__$3c$exports$3e$__ = __turbopack_context__.i('[project]/.next-internal/server/app/(dashboard)/bolsa/nueva/page/actions.js { ACTIONS_MODULE0 => "[project]/src/components/layout/Topbar.tsx [app-rsc] (ecmascript)", ACTIONS_MODULE1 => "[project]/src/app/(dashboard)/bolsa/actions.ts [app-rsc] (ecmascript)" } [app-rsc] (server actions loader, ecmascript) <exports>');
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
"[project]/src/components/modules/bolsa/NuevaOpForm.tsx (client reference/proxy) <module evaluation>": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "NuevaOpForm": (()=>NuevaOpForm)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$server$2d$dom$2d$turbopack$2d$server$2d$edge$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-server-dom-turbopack-server-edge.js [app-rsc] (ecmascript)");
;
const NuevaOpForm = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$server$2d$dom$2d$turbopack$2d$server$2d$edge$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerClientReference"])(function() {
    throw new Error("Attempted to call NuevaOpForm() from the server but NuevaOpForm is on the client. It's not possible to invoke a client function from the server, it can only be rendered as a Component or passed to props of a Client Component.");
}, "[project]/src/components/modules/bolsa/NuevaOpForm.tsx <module evaluation>", "NuevaOpForm");
}}),
"[project]/src/components/modules/bolsa/NuevaOpForm.tsx (client reference/proxy)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "NuevaOpForm": (()=>NuevaOpForm)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$server$2d$dom$2d$turbopack$2d$server$2d$edge$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-server-dom-turbopack-server-edge.js [app-rsc] (ecmascript)");
;
const NuevaOpForm = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$server$2d$dom$2d$turbopack$2d$server$2d$edge$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerClientReference"])(function() {
    throw new Error("Attempted to call NuevaOpForm() from the server but NuevaOpForm is on the client. It's not possible to invoke a client function from the server, it can only be rendered as a Component or passed to props of a Client Component.");
}, "[project]/src/components/modules/bolsa/NuevaOpForm.tsx", "NuevaOpForm");
}}),
"[project]/src/components/modules/bolsa/NuevaOpForm.tsx [app-rsc] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$modules$2f$bolsa$2f$NuevaOpForm$2e$tsx__$28$client__reference$2f$proxy$29$__$3c$module__evaluation$3e$__ = __turbopack_context__.i("[project]/src/components/modules/bolsa/NuevaOpForm.tsx (client reference/proxy) <module evaluation>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$modules$2f$bolsa$2f$NuevaOpForm$2e$tsx__$28$client__reference$2f$proxy$29$__ = __turbopack_context__.i("[project]/src/components/modules/bolsa/NuevaOpForm.tsx (client reference/proxy)");
;
__turbopack_context__.n(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$modules$2f$bolsa$2f$NuevaOpForm$2e$tsx__$28$client__reference$2f$proxy$29$__);
}}),
"[project]/src/app/(dashboard)/bolsa/nueva/page.tsx [app-rsc] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "default": (()=>NuevaBolsaPage)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-jsx-dev-runtime.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/client/app-dir/link.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$left$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronLeft$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/chevron-left.js [app-rsc] (ecmascript) <export default as ChevronLeft>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chart$2d$candlestick$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__default__as__CandlestickChart$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/chart-candlestick.js [app-rsc] (ecmascript) <export default as CandlestickChart>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/prisma.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$modules$2f$bolsa$2f$NuevaOpForm$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/modules/bolsa/NuevaOpForm.tsx [app-rsc] (ecmascript)");
;
;
;
;
;
async function NuevaBolsaPage() {
    const [comitentes, carteras, activos] = await Promise.all([
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].comitenteInversion.findMany({
            where: {
                activo: true
            },
            select: {
                id: true,
                nombre: true,
                nroComitente: true,
                productor: true
            },
            orderBy: {
                nombre: "asc"
            }
        }),
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
                nombre: true,
                comitenteNumber: true
            },
            orderBy: {
                nombre: "asc"
            }
        }),
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].activo.findMany({
            select: {
                ticker: true
            },
            orderBy: {
                ticker: "asc"
            }
        })
    ]);
    const comitentesMapped = comitentes.map((c)=>({
            id: c.id,
            nombre: `${c.nombre} (${c.nroComitente}) — ${c.productor}`
        }));
    const carterasMapped = carteras.map((c)=>({
            id: c.id,
            nombre: c.comitenteNumber ? `${c.nombre} (${c.comitenteNumber})` : c.nombre
        }));
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "flex flex-col gap-8 max-w-2xl",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"], {
                href: "/bolsa",
                className: "flex items-center gap-1 text-byg-muted hover:text-byg-accent text-[10px] font-black uppercase tracking-widest transition-colors group w-fit",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$left$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronLeft$3e$__["ChevronLeft"], {
                        size: 13,
                        className: "group-hover:-translate-x-0.5 transition-transform"
                    }, void 0, false, {
                        fileName: "[project]/src/app/(dashboard)/bolsa/nueva/page.tsx",
                        lineNumber: 44,
                        columnNumber: 9
                    }, this),
                    "Operaciones Bolsa"
                ]
            }, void 0, true, {
                fileName: "[project]/src/app/(dashboard)/bolsa/nueva/page.tsx",
                lineNumber: 40,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("header", {
                className: "flex items-center gap-4",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "p-3 bg-byg-accent text-white rounded-xl shrink-0",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chart$2d$candlestick$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__default__as__CandlestickChart$3e$__["CandlestickChart"], {
                            size: 22
                        }, void 0, false, {
                            fileName: "[project]/src/app/(dashboard)/bolsa/nueva/page.tsx",
                            lineNumber: 50,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/src/app/(dashboard)/bolsa/nueva/page.tsx",
                        lineNumber: 49,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-[10px] font-black text-byg-accent uppercase tracking-widest mb-0.5",
                                children: "Nueva Operación"
                            }, void 0, false, {
                                fileName: "[project]/src/app/(dashboard)/bolsa/nueva/page.tsx",
                                lineNumber: 53,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                                className: "text-2xl font-black text-byg-text tracking-tight",
                                children: "Carga — Paso 1"
                            }, void 0, false, {
                                fileName: "[project]/src/app/(dashboard)/bolsa/nueva/page.tsx",
                                lineNumber: 54,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/app/(dashboard)/bolsa/nueva/page.tsx",
                        lineNumber: 52,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/app/(dashboard)/bolsa/nueva/page.tsx",
                lineNumber: 48,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$modules$2f$bolsa$2f$NuevaOpForm$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["NuevaOpForm"], {
                comitentes: comitentesMapped,
                carteras: carterasMapped,
                tickers: activos.map((a)=>a.ticker)
            }, void 0, false, {
                fileName: "[project]/src/app/(dashboard)/bolsa/nueva/page.tsx",
                lineNumber: 58,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/app/(dashboard)/bolsa/nueva/page.tsx",
        lineNumber: 39,
        columnNumber: 5
    }, this);
}
}}),
"[project]/src/app/(dashboard)/bolsa/nueva/page.tsx [app-rsc] (ecmascript, Next.js server component)": ((__turbopack_context__) => {

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.n(__turbopack_context__.i("[project]/src/app/(dashboard)/bolsa/nueva/page.tsx [app-rsc] (ecmascript)"));
}}),

};

//# sourceMappingURL=_82738ff4._.js.map