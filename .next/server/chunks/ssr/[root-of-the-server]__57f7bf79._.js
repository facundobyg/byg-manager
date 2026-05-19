module.exports = {

"[externals]/@prisma/client/runtime/library [external] (@prisma/client/runtime/library, esm_import)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname, a: __turbopack_async_module__ } = __turbopack_context__;
__turbopack_async_module__(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {
const mod = await __turbopack_context__.y("@prisma/client/runtime/library");

__turbopack_context__.n(mod);
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, true);}),
"[project]/src/app/(dashboard)/operativa/mov-diarios/actions.ts [app-rsc] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname, a: __turbopack_async_module__ } = __turbopack_context__;
__turbopack_async_module__(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {
/* __next_internal_action_entry_do_not_use__ [{"00097151d4153500c74ce6d8f3ae648d83fa5aef6f":"relocalizarMovimientosIniciales","600cba79616f461cd8dc6b66bbceddea6fdc568b41":"crearOperacionCambio","603405245415f7e0e768454297390a51f8125a39a9":"cancelarOperacionCambioPendiente","6056ae46c86a4afa3a20b72b300a272330221b3a0e":"eliminarMovimientoCaja","6099147828385782b133ccd0b52a0b9a813bdef4ec":"editarMovimientoCajaCompleto","60a722b68d590728b40a99841cf74ddab5a8da6bd8":"cobrarOperacionCambio","60c90163a5763ad215b7206fe95dfb2bec902f1ac8":"editarFechaMovimientoCaja","60fcafe35ff1dcb55bcab4baa908f51363b1e3fa5b":"crearMovimientoDiario"},"",""] */ __turbopack_context__.s({
    "cancelarOperacionCambioPendiente": (()=>cancelarOperacionCambioPendiente),
    "cobrarOperacionCambio": (()=>cobrarOperacionCambio),
    "crearMovimientoDiario": (()=>crearMovimientoDiario),
    "crearOperacionCambio": (()=>crearOperacionCambio),
    "editarFechaMovimientoCaja": (()=>editarFechaMovimientoCaja),
    "editarMovimientoCajaCompleto": (()=>editarMovimientoCajaCompleto),
    "eliminarMovimientoCaja": (()=>eliminarMovimientoCaja),
    "relocalizarMovimientosIniciales": (()=>relocalizarMovimientosIniciales)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/build/webpack/loaders/next-flight-loader/server-reference.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$app$2d$render$2f$encryption$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/app-render/encryption.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/prisma.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/cache.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client$2f$runtime$2f$library__$5b$external$5d$__$2840$prisma$2f$client$2f$runtime$2f$library$2c$__esm_import$29$__ = __turbopack_context__.i("[externals]/@prisma/client/runtime/library [external] (@prisma/client/runtime/library, esm_import)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$config$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/config.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$validate$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/build/webpack/loaders/next-flight-loader/action-validate.js [app-rsc] (ecmascript)");
var __turbopack_async_dependencies__ = __turbopack_handle_async_dependencies__([
    __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client$2f$runtime$2f$library__$5b$external$5d$__$2840$prisma$2f$client$2f$runtime$2f$library$2c$__esm_import$29$__
]);
([__TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client$2f$runtime$2f$library__$5b$external$5d$__$2840$prisma$2f$client$2f$runtime$2f$library$2c$__esm_import$29$__] = __turbopack_async_dependencies__.then ? (await __turbopack_async_dependencies__)() : __turbopack_async_dependencies__);
;
;
;
;
;
;
async function crearMovimientoDiario(_prev, formData) {
    const cajaId = formData.get("cajaId")?.toString();
    const fechaStr = formData.get("fecha")?.toString();
    const tipo = formData.get("tipo")?.toString();
    const descripcion = formData.get("descripcion")?.toString();
    const rawMonto = formData.get("monto")?.toString().replace(",", ".");
    const moneda = formData.get("moneda")?.toString();
    const clasificacion = formData.get("clasificacion")?.toString(); // RESULTADO_OPERATIVO | MOVIMIENTO_CAJA | TRANSFERENCIA
    const subtipoOperativo = formData.get("subtipoOperativo")?.toString();
    // Campos para transferencia
    const cajaDestinoId = formData.get("cajaDestinoId")?.toString();
    if (!fechaStr || !rawMonto || !moneda || !clasificacion) {
        return {
            error: "Faltan campos obligatorios"
        };
    }
    const monto = parseFloat(rawMonto);
    if (isNaN(monto) || monto <= 0) {
        return {
            error: "Monto inválido"
        };
    }
    const d = new Date(fechaStr);
    if (isNaN(d.getTime())) return {
        error: "Fecha inválida"
    };
    const fecha = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
    try {
        if (clasificacion === "TRANSFERENCIA") {
            if (!cajaId || !cajaDestinoId) return {
                error: "Faltan cajas de origen o destino"
            };
            if (cajaId === cajaDestinoId) return {
                error: "La caja de origen y destino deben ser diferentes"
            };
            const labelOrigen = (await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].caja.findUnique({
                where: {
                    id: cajaId
                },
                select: {
                    label: true
                }
            }))?.label;
            const labelDestino = (await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].caja.findUnique({
                where: {
                    id: cajaDestinoId
                },
                select: {
                    label: true
                }
            }))?.label;
            await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].$transaction(async (tx)=>{
                // SALIDA de origen
                await tx.movimientoCaja.create({
                    data: {
                        id: crypto.randomUUID(),
                        cajaId,
                        fecha,
                        tipo: "SALIDA",
                        moneda,
                        monto: new __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client$2f$runtime$2f$library__$5b$external$5d$__$2840$prisma$2f$client$2f$runtime$2f$library$2c$__esm_import$29$__["Decimal"](monto),
                        descripcion: `[TRANSFERENCIA:OUT] a ${labelDestino} | ${descripcion || ""}`,
                        confirmado: true
                    }
                });
                // ENTRADA a destino
                await tx.movimientoCaja.create({
                    data: {
                        id: crypto.randomUUID(),
                        cajaId: cajaDestinoId,
                        fecha,
                        tipo: "ENTRADA",
                        moneda,
                        monto: new __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client$2f$runtime$2f$library__$5b$external$5d$__$2840$prisma$2f$client$2f$runtime$2f$library$2c$__esm_import$29$__["Decimal"](monto),
                        descripcion: `[TRANSFERENCIA:IN] desde ${labelOrigen} | ${descripcion || ""}`,
                        confirmado: true
                    }
                });
            });
        } else {
            if (!cajaId || !tipo || !subtipoOperativo) return {
                error: "Faltan campos para registrar movimiento"
            };
            const prefix = `[${clasificacion}:${subtipoOperativo}]`;
            const finalDesc = `${prefix} ${descripcion?.trim() || "Movimiento operativo manual"}`;
            await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].movimientoCaja.create({
                data: {
                    id: crypto.randomUUID(),
                    cajaId,
                    fecha,
                    tipo,
                    moneda,
                    monto: new __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client$2f$runtime$2f$library__$5b$external$5d$__$2840$prisma$2f$client$2f$runtime$2f$library$2c$__esm_import$29$__["Decimal"](monto),
                    descripcion: finalDesc,
                    confirmado: true
                }
            });
        }
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["revalidatePath"])("/operativa/mov-diarios");
        return {
            ok: true
        };
    } catch (error) {
        console.error("Error creating manual movement:", error);
        return {
            error: "Error al registrar el movimiento"
        };
    }
}
async function crearOperacionCambio(_prev, formData) {
    const fechaStr = formData.get("fecha")?.toString();
    const tipoOp = formData.get("tipoOperacion")?.toString(); // COMPRA | VENTA
    const clienteNombre = formData.get("clienteNombre")?.toString();
    const clienteId = formData.get("clienteId")?.toString() || null;
    const moneda = formData.get("moneda")?.toString();
    const rawCantidad = formData.get("cantidad")?.toString().replace(",", ".");
    const rawTipoCambio = formData.get("tipoCambio")?.toString().replace(",", ".");
    const descripcion = formData.get("descripcion")?.toString();
    const estado = formData.get("estado")?.toString(); // PENDIENTE | COBRADA
    const impactoCC = formData.get("impactoCC") === "on";
    if (!fechaStr || !tipoOp || !moneda || !rawCantidad || !rawTipoCambio || !estado) {
        return {
            error: "Todos los campos obligatorios deben completarse"
        };
    }
    // Reconstruir tipo para Prisma: COMPRA_USD, VENTA_EUR, etc.
    const tipo = `${tipoOp}_${moneda}`;
    const cantidad = parseFloat(rawCantidad);
    const tc = parseFloat(rawTipoCambio);
    if (isNaN(cantidad) || cantidad <= 0 || isNaN(tc) || tc <= 0) {
        return {
            error: "Monto o tipo de cambio inválido"
        };
    }
    const totalARS = new __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client$2f$runtime$2f$library__$5b$external$5d$__$2840$prisma$2f$client$2f$runtime$2f$library$2c$__esm_import$29$__["Decimal"](cantidad).mul(new __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client$2f$runtime$2f$library__$5b$external$5d$__$2840$prisma$2f$client$2f$runtime$2f$library$2c$__esm_import$29$__["Decimal"](tc));
    const pendiente = estado === "PENDIENTE";
    const d = new Date(fechaStr);
    if (isNaN(d.getTime())) return {
        error: "Fecha inválida"
    };
    const fecha = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
    const mesContable = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
    let finalDesc = descripcion?.trim() || `Operación de ${tipo.replace(/_/g, " ")}`;
    if (impactoCC) finalDesc = `[CC] ${finalDesc}`;
    try {
        await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].$transaction(async (tx)=>{
            // 1. Crear OperacionCambio
            const op = await tx.operacionCambio.create({
                data: {
                    id: crypto.randomUUID(),
                    fecha,
                    tipo,
                    clienteNombre: clienteNombre || "Cliente General",
                    clienteId,
                    moneda,
                    cantidad: new __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client$2f$runtime$2f$library__$5b$external$5d$__$2840$prisma$2f$client$2f$runtime$2f$library$2c$__esm_import$29$__["Decimal"](cantidad),
                    tipoCambio: new __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client$2f$runtime$2f$library__$5b$external$5d$__$2840$prisma$2f$client$2f$runtime$2f$library$2c$__esm_import$29$__["Decimal"](tc),
                    totalARS,
                    cobroUSD: moneda === "USD" ? new __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client$2f$runtime$2f$library__$5b$external$5d$__$2840$prisma$2f$client$2f$runtime$2f$library$2c$__esm_import$29$__["Decimal"](cantidad) : new __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client$2f$runtime$2f$library__$5b$external$5d$__$2840$prisma$2f$client$2f$runtime$2f$library$2c$__esm_import$29$__["Decimal"](0),
                    cobroARS: totalARS,
                    descripcion: finalDesc,
                    pendiente,
                    mesContable,
                    updatedAt: new Date()
                }
            });
            // 2. Si no es pendiente, impactar Cajas automáticas
            if (!pendiente) {
                // TODO: En una versión futura permitir elegir caja origen/destino por moneda 
                // y repartir una operación entre varias cajas.
                // Buscamos la Caja Oficina (principal)
                const cajaOficina = await tx.caja.findFirst({
                    where: {
                        OR: [
                            {
                                esPrincipal: true
                            },
                            {
                                slug: "oficina"
                            }
                        ],
                        activa: true
                    }
                });
                if (!cajaOficina) {
                    throw new Error("Falta configurar Caja Oficina para USD o ARS");
                }
                const esCompra = tipo.startsWith("COMPRA");
                const esVenta = tipo.startsWith("VENTA");
                if (esCompra) {
                    // COMPRA: Entra Divisa, Sale ARS
                    await tx.movimientoCaja.create({
                        data: {
                            id: crypto.randomUUID(),
                            cajaId: cajaOficina.id,
                            fecha,
                            tipo: "ENTRADA",
                            moneda,
                            monto: new __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client$2f$runtime$2f$library__$5b$external$5d$__$2840$prisma$2f$client$2f$runtime$2f$library$2c$__esm_import$29$__["Decimal"](cantidad),
                            descripcion: `[Cambio ${op.id}] Compra divisa`,
                            confirmado: true
                        }
                    });
                    await tx.movimientoCaja.create({
                        data: {
                            id: crypto.randomUUID(),
                            cajaId: cajaOficina.id,
                            fecha,
                            tipo: "SALIDA",
                            moneda: "ARS",
                            monto: totalARS,
                            descripcion: `[Cambio ${op.id}] Pago ARS x Compra`,
                            confirmado: true
                        }
                    });
                } else if (esVenta) {
                    // VENTA: Sale Divisa, Entra ARS
                    await tx.movimientoCaja.create({
                        data: {
                            id: crypto.randomUUID(),
                            cajaId: cajaOficina.id,
                            fecha,
                            tipo: "SALIDA",
                            moneda,
                            monto: new __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client$2f$runtime$2f$library__$5b$external$5d$__$2840$prisma$2f$client$2f$runtime$2f$library$2c$__esm_import$29$__["Decimal"](cantidad),
                            descripcion: `[Cambio ${op.id}] Venta divisa`,
                            confirmado: true
                        }
                    });
                    await tx.movimientoCaja.create({
                        data: {
                            id: crypto.randomUUID(),
                            cajaId: cajaOficina.id,
                            fecha,
                            tipo: "ENTRADA",
                            moneda: "ARS",
                            monto: totalARS,
                            descripcion: `[Cambio ${op.id}] Cobro ARS x Venta`,
                            confirmado: true
                        }
                    });
                }
            }
        });
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["revalidatePath"])("/operativa/mov-diarios");
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["revalidatePath"])("/caja");
        return {
            ok: true
        };
    } catch (error) {
        console.error("Error creating exchange operation:", error);
        return {
            error: error.message || "Error al registrar la operación"
        };
    }
}
async function eliminarMovimientoCaja(_prev, formData) {
    if (__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$config$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["readOnlyPreview"]) return {
        error: "Modo lectura activo"
    };
    const id = formData.get("id")?.toString();
    if (!id) return {
        error: "ID requerido"
    };
    const mov = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].movimientoCaja.findUnique({
        where: {
            id
        }
    });
    if (!mov) return {
        error: "Movimiento no encontrado"
    };
    const desc = mov.descripcion || "";
    if (desc.startsWith("[Cambio ") || desc.startsWith("[Cobro Cambio ") || desc.startsWith("[TRANSFERENCIA:")) {
        return {
            error: "Movimiento vinculado a cambio/transferencia: no se puede eliminar directamente"
        };
    }
    try {
        await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].movimientoCaja.delete({
            where: {
                id
            }
        });
    } catch (error) {
        return {
            error: "Error al eliminar el movimiento"
        };
    }
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["revalidatePath"])("/operativa/mov-diarios");
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["revalidatePath"])("/caja");
    return {
        ok: true
    };
}
async function editarFechaMovimientoCaja(_prev, formData) {
    if (__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$config$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["readOnlyPreview"]) return {
        error: "Modo lectura activo"
    };
    const id = formData.get("id")?.toString();
    const fechaStr = formData.get("fecha")?.toString();
    if (!id || !fechaStr) return {
        error: "ID y fecha requeridos"
    };
    const d = new Date(fechaStr);
    if (isNaN(d.getTime())) return {
        error: "Fecha inválida"
    };
    const fecha = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
    try {
        await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].movimientoCaja.update({
            where: {
                id
            },
            data: {
                fecha
            }
        });
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["revalidatePath"])("/operativa/mov-diarios");
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["revalidatePath"])("/caja");
        return {
            ok: true
        };
    } catch (error) {
        console.error("Error updating movement date:", error);
        return {
            error: "Error al actualizar la fecha"
        };
    }
}
async function editarMovimientoCajaCompleto(_prev, formData) {
    if (__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$config$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["readOnlyPreview"]) return {
        error: "Modo lectura activo"
    };
    const id = formData.get("id")?.toString();
    const fechaStr = formData.get("fecha")?.toString();
    const tipo = formData.get("tipo")?.toString();
    const moneda = formData.get("moneda")?.toString();
    const rawMonto = formData.get("monto")?.toString().replace(",", ".");
    const descripcion = formData.get("descripcion")?.toString();
    if (!id || !fechaStr || !tipo || !moneda || !rawMonto) {
        return {
            error: "Faltan campos obligatorios"
        };
    }
    const monto = parseFloat(rawMonto);
    if (isNaN(monto) || monto < 0) return {
        error: "Monto inválido"
    };
    const d = new Date(fechaStr);
    if (isNaN(d.getTime())) return {
        error: "Fecha inválida"
    };
    const fecha = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
    try {
        await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].movimientoCaja.update({
            where: {
                id
            },
            data: {
                fecha,
                tipo,
                moneda,
                monto: new __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client$2f$runtime$2f$library__$5b$external$5d$__$2840$prisma$2f$client$2f$runtime$2f$library$2c$__esm_import$29$__["Decimal"](monto),
                descripcion: descripcion || null
            }
        });
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["revalidatePath"])("/operativa/mov-diarios");
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["revalidatePath"])("/caja");
        return {
            ok: true
        };
    } catch (error) {
        console.error("Error updating movement:", error);
        return {
            error: "Error al actualizar el movimiento"
        };
    }
}
async function relocalizarMovimientosIniciales() {
    if (__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$config$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["readOnlyPreview"]) return {
        error: "Modo lectura activo"
    };
    try {
        const targetDate = new Date(Date.UTC(2026, 4, 1)); // 01/05/2026
        const result = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].movimientoCaja.updateMany({
            where: {
                OR: [
                    {
                        descripcion: {
                            contains: "AJUSTE INICIAL",
                            mode: "insensitive"
                        }
                    },
                    {
                        descripcion: {
                            startsWith: "[IMPORT LEGACY"
                        }
                    }
                ]
            },
            data: {
                fecha: targetDate
            }
        });
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["revalidatePath"])("/operativa/mov-diarios");
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["revalidatePath"])("/caja");
        return {
            ok: true,
            count: result.count
        };
    } catch (error) {
        console.error("Error relocating movements:", error);
        return {
            error: "Error al relocalizar movimientos"
        };
    }
}
async function cancelarOperacionCambioPendiente(_prev, formData) {
    if (__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$config$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["readOnlyPreview"]) return {
        error: "Modo lectura activo"
    };
    const id = formData.get("id")?.toString();
    if (!id) return {
        error: "ID requerido"
    };
    const op = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].operacionCambio.findUnique({
        where: {
            id
        }
    });
    if (!op) return {
        error: "Operación no encontrada"
    };
    if (!op.pendiente) return {
        error: "Solo se pueden cancelar operaciones pendientes"
    };
    const cajaMovs = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].movimientoCaja.findFirst({
        where: {
            descripcion: {
                contains: id
            }
        },
        select: {
            id: true
        }
    });
    if (cajaMovs) {
        return {
            error: "No se puede eliminar una operación con movimientos de caja. Revertir desde historial."
        };
    }
    try {
        await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].operacionCambio.delete({
            where: {
                id
            }
        });
    } catch  {
        return {
            error: "Error al cancelar la operación"
        };
    }
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["revalidatePath"])("/operativa/mov-diarios");
    return {
        ok: true
    };
}
async function cobrarOperacionCambio(_prev, formData) {
    if (__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$config$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["readOnlyPreview"]) return {
        error: "Modo lectura activo"
    };
    const ids = formData.getAll("operacionId").map((v)=>v.toString().trim()).filter(Boolean);
    if (ids.length === 0) return {
        error: "Debe indicar al menos una operación"
    };
    const ops = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].operacionCambio.findMany({
        where: {
            id: {
                in: ids
            },
            pendiente: true
        }
    });
    if (ops.length === 0) return {
        error: "No se encontraron operaciones pendientes"
    };
    const cajaOficina = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].caja.findFirst({
        where: {
            OR: [
                {
                    esPrincipal: true
                },
                {
                    slug: "oficina"
                }
            ],
            activa: true
        }
    });
    if (!cajaOficina) return {
        error: "Caja Oficina no configurada"
    };
    const fecha = new Date();
    try {
        await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].$transaction(async (tx)=>{
            for (const op of ops){
                await tx.operacionCambio.update({
                    where: {
                        id: op.id
                    },
                    data: {
                        pendiente: false
                    }
                });
                const esCompra = op.tipo.startsWith("COMPRA");
                if (esCompra) {
                    await tx.movimientoCaja.create({
                        data: {
                            id: crypto.randomUUID(),
                            cajaId: cajaOficina.id,
                            fecha,
                            tipo: "ENTRADA",
                            moneda: op.moneda,
                            monto: op.cantidad,
                            descripcion: `[Cobro Cambio ${op.id}] Compra divisa`,
                            confirmado: true
                        }
                    });
                    await tx.movimientoCaja.create({
                        data: {
                            id: crypto.randomUUID(),
                            cajaId: cajaOficina.id,
                            fecha,
                            tipo: "SALIDA",
                            moneda: "ARS",
                            monto: op.totalARS,
                            descripcion: `[Cobro Cambio ${op.id}] Pago ARS x Compra`,
                            confirmado: true
                        }
                    });
                } else {
                    await tx.movimientoCaja.create({
                        data: {
                            id: crypto.randomUUID(),
                            cajaId: cajaOficina.id,
                            fecha,
                            tipo: "SALIDA",
                            moneda: op.moneda,
                            monto: op.cantidad,
                            descripcion: `[Cobro Cambio ${op.id}] Venta divisa`,
                            confirmado: true
                        }
                    });
                    await tx.movimientoCaja.create({
                        data: {
                            id: crypto.randomUUID(),
                            cajaId: cajaOficina.id,
                            fecha,
                            tipo: "ENTRADA",
                            moneda: "ARS",
                            monto: op.totalARS,
                            descripcion: `[Cobro Cambio ${op.id}] Cobro ARS x Venta`,
                            confirmado: true
                        }
                    });
                }
            }
        });
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["revalidatePath"])("/operativa/mov-diarios");
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["revalidatePath"])("/caja");
        return {
            ok: true
        };
    } catch (error) {
        return {
            error: error.message || "Error al cobrar las operaciones"
        };
    }
}
;
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$validate$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["ensureServerEntryExports"])([
    crearMovimientoDiario,
    crearOperacionCambio,
    eliminarMovimientoCaja,
    editarFechaMovimientoCaja,
    editarMovimientoCajaCompleto,
    relocalizarMovimientosIniciales,
    cancelarOperacionCambioPendiente,
    cobrarOperacionCambio
]);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(crearMovimientoDiario, "60fcafe35ff1dcb55bcab4baa908f51363b1e3fa5b", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(crearOperacionCambio, "600cba79616f461cd8dc6b66bbceddea6fdc568b41", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(eliminarMovimientoCaja, "6056ae46c86a4afa3a20b72b300a272330221b3a0e", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(editarFechaMovimientoCaja, "60c90163a5763ad215b7206fe95dfb2bec902f1ac8", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(editarMovimientoCajaCompleto, "6099147828385782b133ccd0b52a0b9a813bdef4ec", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(relocalizarMovimientosIniciales, "00097151d4153500c74ce6d8f3ae648d83fa5aef6f", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(cancelarOperacionCambioPendiente, "603405245415f7e0e768454297390a51f8125a39a9", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(cobrarOperacionCambio, "60a722b68d590728b40a99841cf74ddab5a8da6bd8", null);
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, false);}),
"[project]/.next-internal/server/app/(dashboard)/operativa/mov-diarios/page/actions.js { ACTIONS_MODULE0 => \"[project]/src/components/layout/Topbar.tsx [app-rsc] (ecmascript)\", ACTIONS_MODULE1 => \"[project]/src/app/(dashboard)/operativa/mov-diarios/actions.ts [app-rsc] (ecmascript)\" } [app-rsc] (server actions loader, ecmascript) <locals>": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname, a: __turbopack_async_module__ } = __turbopack_context__;
__turbopack_async_module__(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {
__turbopack_context__.s({});
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$layout$2f$Topbar$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/layout/Topbar.tsx [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f28$dashboard$292f$operativa$2f$mov$2d$diarios$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/app/(dashboard)/operativa/mov-diarios/actions.ts [app-rsc] (ecmascript)");
var __turbopack_async_dependencies__ = __turbopack_handle_async_dependencies__([
    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f28$dashboard$292f$operativa$2f$mov$2d$diarios$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__
]);
([__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f28$dashboard$292f$operativa$2f$mov$2d$diarios$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__] = __turbopack_async_dependencies__.then ? (await __turbopack_async_dependencies__)() : __turbopack_async_dependencies__);
;
;
;
;
;
;
;
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, false);}),
"[project]/.next-internal/server/app/(dashboard)/operativa/mov-diarios/page/actions.js { ACTIONS_MODULE0 => \"[project]/src/components/layout/Topbar.tsx [app-rsc] (ecmascript)\", ACTIONS_MODULE1 => \"[project]/src/app/(dashboard)/operativa/mov-diarios/actions.ts [app-rsc] (ecmascript)\" } [app-rsc] (server actions loader, ecmascript) <module evaluation>": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname, a: __turbopack_async_module__ } = __turbopack_context__;
__turbopack_async_module__(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {
__turbopack_context__.s({});
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$layout$2f$Topbar$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/layout/Topbar.tsx [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f28$dashboard$292f$operativa$2f$mov$2d$diarios$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/app/(dashboard)/operativa/mov-diarios/actions.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f2e$next$2d$internal$2f$server$2f$app$2f28$dashboard$292f$operativa$2f$mov$2d$diarios$2f$page$2f$actions$2e$js__$7b$__ACTIONS_MODULE0__$3d3e$__$225b$project$5d2f$src$2f$components$2f$layout$2f$Topbar$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29222c$__ACTIONS_MODULE1__$3d3e$__$225b$project$5d2f$src$2f$app$2f28$dashboard$292f$operativa$2f$mov$2d$diarios$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$2922$__$7d$__$5b$app$2d$rsc$5d$__$28$server__actions__loader$2c$__ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i('[project]/.next-internal/server/app/(dashboard)/operativa/mov-diarios/page/actions.js { ACTIONS_MODULE0 => "[project]/src/components/layout/Topbar.tsx [app-rsc] (ecmascript)", ACTIONS_MODULE1 => "[project]/src/app/(dashboard)/operativa/mov-diarios/actions.ts [app-rsc] (ecmascript)" } [app-rsc] (server actions loader, ecmascript) <locals>');
var __turbopack_async_dependencies__ = __turbopack_handle_async_dependencies__([
    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f28$dashboard$292f$operativa$2f$mov$2d$diarios$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__,
    __TURBOPACK__imported__module__$5b$project$5d2f2e$next$2d$internal$2f$server$2f$app$2f28$dashboard$292f$operativa$2f$mov$2d$diarios$2f$page$2f$actions$2e$js__$7b$__ACTIONS_MODULE0__$3d3e$__$225b$project$5d2f$src$2f$components$2f$layout$2f$Topbar$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29222c$__ACTIONS_MODULE1__$3d3e$__$225b$project$5d2f$src$2f$app$2f28$dashboard$292f$operativa$2f$mov$2d$diarios$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$2922$__$7d$__$5b$app$2d$rsc$5d$__$28$server__actions__loader$2c$__ecmascript$29$__$3c$locals$3e$__
]);
([__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f28$dashboard$292f$operativa$2f$mov$2d$diarios$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__, __TURBOPACK__imported__module__$5b$project$5d2f2e$next$2d$internal$2f$server$2f$app$2f28$dashboard$292f$operativa$2f$mov$2d$diarios$2f$page$2f$actions$2e$js__$7b$__ACTIONS_MODULE0__$3d3e$__$225b$project$5d2f$src$2f$components$2f$layout$2f$Topbar$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29222c$__ACTIONS_MODULE1__$3d3e$__$225b$project$5d2f$src$2f$app$2f28$dashboard$292f$operativa$2f$mov$2d$diarios$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$2922$__$7d$__$5b$app$2d$rsc$5d$__$28$server__actions__loader$2c$__ecmascript$29$__$3c$locals$3e$__] = __turbopack_async_dependencies__.then ? (await __turbopack_async_dependencies__)() : __turbopack_async_dependencies__);
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, false);}),
"[project]/.next-internal/server/app/(dashboard)/operativa/mov-diarios/page/actions.js { ACTIONS_MODULE0 => \"[project]/src/components/layout/Topbar.tsx [app-rsc] (ecmascript)\", ACTIONS_MODULE1 => \"[project]/src/app/(dashboard)/operativa/mov-diarios/actions.ts [app-rsc] (ecmascript)\" } [app-rsc] (server actions loader, ecmascript) <exports>": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname, a: __turbopack_async_module__ } = __turbopack_context__;
__turbopack_async_module__(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {
__turbopack_context__.s({
    "0011ff4319847fa321c161740d2e30453828714a2e": (()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$layout$2f$Topbar$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["$$RSC_SERVER_ACTION_0"]),
    "600cba79616f461cd8dc6b66bbceddea6fdc568b41": (()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f28$dashboard$292f$operativa$2f$mov$2d$diarios$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["crearOperacionCambio"]),
    "603405245415f7e0e768454297390a51f8125a39a9": (()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f28$dashboard$292f$operativa$2f$mov$2d$diarios$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["cancelarOperacionCambioPendiente"]),
    "6056ae46c86a4afa3a20b72b300a272330221b3a0e": (()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f28$dashboard$292f$operativa$2f$mov$2d$diarios$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["eliminarMovimientoCaja"]),
    "6099147828385782b133ccd0b52a0b9a813bdef4ec": (()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f28$dashboard$292f$operativa$2f$mov$2d$diarios$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["editarMovimientoCajaCompleto"]),
    "60a722b68d590728b40a99841cf74ddab5a8da6bd8": (()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f28$dashboard$292f$operativa$2f$mov$2d$diarios$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["cobrarOperacionCambio"]),
    "60fcafe35ff1dcb55bcab4baa908f51363b1e3fa5b": (()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f28$dashboard$292f$operativa$2f$mov$2d$diarios$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["crearMovimientoDiario"])
});
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$layout$2f$Topbar$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/layout/Topbar.tsx [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f28$dashboard$292f$operativa$2f$mov$2d$diarios$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/app/(dashboard)/operativa/mov-diarios/actions.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f2e$next$2d$internal$2f$server$2f$app$2f28$dashboard$292f$operativa$2f$mov$2d$diarios$2f$page$2f$actions$2e$js__$7b$__ACTIONS_MODULE0__$3d3e$__$225b$project$5d2f$src$2f$components$2f$layout$2f$Topbar$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29222c$__ACTIONS_MODULE1__$3d3e$__$225b$project$5d2f$src$2f$app$2f28$dashboard$292f$operativa$2f$mov$2d$diarios$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$2922$__$7d$__$5b$app$2d$rsc$5d$__$28$server__actions__loader$2c$__ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i('[project]/.next-internal/server/app/(dashboard)/operativa/mov-diarios/page/actions.js { ACTIONS_MODULE0 => "[project]/src/components/layout/Topbar.tsx [app-rsc] (ecmascript)", ACTIONS_MODULE1 => "[project]/src/app/(dashboard)/operativa/mov-diarios/actions.ts [app-rsc] (ecmascript)" } [app-rsc] (server actions loader, ecmascript) <locals>');
var __turbopack_async_dependencies__ = __turbopack_handle_async_dependencies__([
    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f28$dashboard$292f$operativa$2f$mov$2d$diarios$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__,
    __TURBOPACK__imported__module__$5b$project$5d2f2e$next$2d$internal$2f$server$2f$app$2f28$dashboard$292f$operativa$2f$mov$2d$diarios$2f$page$2f$actions$2e$js__$7b$__ACTIONS_MODULE0__$3d3e$__$225b$project$5d2f$src$2f$components$2f$layout$2f$Topbar$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29222c$__ACTIONS_MODULE1__$3d3e$__$225b$project$5d2f$src$2f$app$2f28$dashboard$292f$operativa$2f$mov$2d$diarios$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$2922$__$7d$__$5b$app$2d$rsc$5d$__$28$server__actions__loader$2c$__ecmascript$29$__$3c$locals$3e$__
]);
([__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f28$dashboard$292f$operativa$2f$mov$2d$diarios$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__, __TURBOPACK__imported__module__$5b$project$5d2f2e$next$2d$internal$2f$server$2f$app$2f28$dashboard$292f$operativa$2f$mov$2d$diarios$2f$page$2f$actions$2e$js__$7b$__ACTIONS_MODULE0__$3d3e$__$225b$project$5d2f$src$2f$components$2f$layout$2f$Topbar$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29222c$__ACTIONS_MODULE1__$3d3e$__$225b$project$5d2f$src$2f$app$2f28$dashboard$292f$operativa$2f$mov$2d$diarios$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$2922$__$7d$__$5b$app$2d$rsc$5d$__$28$server__actions__loader$2c$__ecmascript$29$__$3c$locals$3e$__] = __turbopack_async_dependencies__.then ? (await __turbopack_async_dependencies__)() : __turbopack_async_dependencies__);
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, false);}),
"[project]/.next-internal/server/app/(dashboard)/operativa/mov-diarios/page/actions.js { ACTIONS_MODULE0 => \"[project]/src/components/layout/Topbar.tsx [app-rsc] (ecmascript)\", ACTIONS_MODULE1 => \"[project]/src/app/(dashboard)/operativa/mov-diarios/actions.ts [app-rsc] (ecmascript)\" } [app-rsc] (server actions loader, ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname, a: __turbopack_async_module__ } = __turbopack_context__;
__turbopack_async_module__(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {
__turbopack_context__.s({
    "0011ff4319847fa321c161740d2e30453828714a2e": (()=>__TURBOPACK__imported__module__$5b$project$5d2f2e$next$2d$internal$2f$server$2f$app$2f28$dashboard$292f$operativa$2f$mov$2d$diarios$2f$page$2f$actions$2e$js__$7b$__ACTIONS_MODULE0__$3d3e$__$225b$project$5d2f$src$2f$components$2f$layout$2f$Topbar$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29222c$__ACTIONS_MODULE1__$3d3e$__$225b$project$5d2f$src$2f$app$2f28$dashboard$292f$operativa$2f$mov$2d$diarios$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$2922$__$7d$__$5b$app$2d$rsc$5d$__$28$server__actions__loader$2c$__ecmascript$29$__$3c$exports$3e$__["0011ff4319847fa321c161740d2e30453828714a2e"]),
    "600cba79616f461cd8dc6b66bbceddea6fdc568b41": (()=>__TURBOPACK__imported__module__$5b$project$5d2f2e$next$2d$internal$2f$server$2f$app$2f28$dashboard$292f$operativa$2f$mov$2d$diarios$2f$page$2f$actions$2e$js__$7b$__ACTIONS_MODULE0__$3d3e$__$225b$project$5d2f$src$2f$components$2f$layout$2f$Topbar$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29222c$__ACTIONS_MODULE1__$3d3e$__$225b$project$5d2f$src$2f$app$2f28$dashboard$292f$operativa$2f$mov$2d$diarios$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$2922$__$7d$__$5b$app$2d$rsc$5d$__$28$server__actions__loader$2c$__ecmascript$29$__$3c$exports$3e$__["600cba79616f461cd8dc6b66bbceddea6fdc568b41"]),
    "603405245415f7e0e768454297390a51f8125a39a9": (()=>__TURBOPACK__imported__module__$5b$project$5d2f2e$next$2d$internal$2f$server$2f$app$2f28$dashboard$292f$operativa$2f$mov$2d$diarios$2f$page$2f$actions$2e$js__$7b$__ACTIONS_MODULE0__$3d3e$__$225b$project$5d2f$src$2f$components$2f$layout$2f$Topbar$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29222c$__ACTIONS_MODULE1__$3d3e$__$225b$project$5d2f$src$2f$app$2f28$dashboard$292f$operativa$2f$mov$2d$diarios$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$2922$__$7d$__$5b$app$2d$rsc$5d$__$28$server__actions__loader$2c$__ecmascript$29$__$3c$exports$3e$__["603405245415f7e0e768454297390a51f8125a39a9"]),
    "6056ae46c86a4afa3a20b72b300a272330221b3a0e": (()=>__TURBOPACK__imported__module__$5b$project$5d2f2e$next$2d$internal$2f$server$2f$app$2f28$dashboard$292f$operativa$2f$mov$2d$diarios$2f$page$2f$actions$2e$js__$7b$__ACTIONS_MODULE0__$3d3e$__$225b$project$5d2f$src$2f$components$2f$layout$2f$Topbar$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29222c$__ACTIONS_MODULE1__$3d3e$__$225b$project$5d2f$src$2f$app$2f28$dashboard$292f$operativa$2f$mov$2d$diarios$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$2922$__$7d$__$5b$app$2d$rsc$5d$__$28$server__actions__loader$2c$__ecmascript$29$__$3c$exports$3e$__["6056ae46c86a4afa3a20b72b300a272330221b3a0e"]),
    "6099147828385782b133ccd0b52a0b9a813bdef4ec": (()=>__TURBOPACK__imported__module__$5b$project$5d2f2e$next$2d$internal$2f$server$2f$app$2f28$dashboard$292f$operativa$2f$mov$2d$diarios$2f$page$2f$actions$2e$js__$7b$__ACTIONS_MODULE0__$3d3e$__$225b$project$5d2f$src$2f$components$2f$layout$2f$Topbar$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29222c$__ACTIONS_MODULE1__$3d3e$__$225b$project$5d2f$src$2f$app$2f28$dashboard$292f$operativa$2f$mov$2d$diarios$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$2922$__$7d$__$5b$app$2d$rsc$5d$__$28$server__actions__loader$2c$__ecmascript$29$__$3c$exports$3e$__["6099147828385782b133ccd0b52a0b9a813bdef4ec"]),
    "60a722b68d590728b40a99841cf74ddab5a8da6bd8": (()=>__TURBOPACK__imported__module__$5b$project$5d2f2e$next$2d$internal$2f$server$2f$app$2f28$dashboard$292f$operativa$2f$mov$2d$diarios$2f$page$2f$actions$2e$js__$7b$__ACTIONS_MODULE0__$3d3e$__$225b$project$5d2f$src$2f$components$2f$layout$2f$Topbar$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29222c$__ACTIONS_MODULE1__$3d3e$__$225b$project$5d2f$src$2f$app$2f28$dashboard$292f$operativa$2f$mov$2d$diarios$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$2922$__$7d$__$5b$app$2d$rsc$5d$__$28$server__actions__loader$2c$__ecmascript$29$__$3c$exports$3e$__["60a722b68d590728b40a99841cf74ddab5a8da6bd8"]),
    "60fcafe35ff1dcb55bcab4baa908f51363b1e3fa5b": (()=>__TURBOPACK__imported__module__$5b$project$5d2f2e$next$2d$internal$2f$server$2f$app$2f28$dashboard$292f$operativa$2f$mov$2d$diarios$2f$page$2f$actions$2e$js__$7b$__ACTIONS_MODULE0__$3d3e$__$225b$project$5d2f$src$2f$components$2f$layout$2f$Topbar$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29222c$__ACTIONS_MODULE1__$3d3e$__$225b$project$5d2f$src$2f$app$2f28$dashboard$292f$operativa$2f$mov$2d$diarios$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$2922$__$7d$__$5b$app$2d$rsc$5d$__$28$server__actions__loader$2c$__ecmascript$29$__$3c$exports$3e$__["60fcafe35ff1dcb55bcab4baa908f51363b1e3fa5b"])
});
var __TURBOPACK__imported__module__$5b$project$5d2f2e$next$2d$internal$2f$server$2f$app$2f28$dashboard$292f$operativa$2f$mov$2d$diarios$2f$page$2f$actions$2e$js__$7b$__ACTIONS_MODULE0__$3d3e$__$225b$project$5d2f$src$2f$components$2f$layout$2f$Topbar$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29222c$__ACTIONS_MODULE1__$3d3e$__$225b$project$5d2f$src$2f$app$2f28$dashboard$292f$operativa$2f$mov$2d$diarios$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$2922$__$7d$__$5b$app$2d$rsc$5d$__$28$server__actions__loader$2c$__ecmascript$29$__$3c$module__evaluation$3e$__ = __turbopack_context__.i('[project]/.next-internal/server/app/(dashboard)/operativa/mov-diarios/page/actions.js { ACTIONS_MODULE0 => "[project]/src/components/layout/Topbar.tsx [app-rsc] (ecmascript)", ACTIONS_MODULE1 => "[project]/src/app/(dashboard)/operativa/mov-diarios/actions.ts [app-rsc] (ecmascript)" } [app-rsc] (server actions loader, ecmascript) <module evaluation>');
var __TURBOPACK__imported__module__$5b$project$5d2f2e$next$2d$internal$2f$server$2f$app$2f28$dashboard$292f$operativa$2f$mov$2d$diarios$2f$page$2f$actions$2e$js__$7b$__ACTIONS_MODULE0__$3d3e$__$225b$project$5d2f$src$2f$components$2f$layout$2f$Topbar$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29222c$__ACTIONS_MODULE1__$3d3e$__$225b$project$5d2f$src$2f$app$2f28$dashboard$292f$operativa$2f$mov$2d$diarios$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$2922$__$7d$__$5b$app$2d$rsc$5d$__$28$server__actions__loader$2c$__ecmascript$29$__$3c$exports$3e$__ = __turbopack_context__.i('[project]/.next-internal/server/app/(dashboard)/operativa/mov-diarios/page/actions.js { ACTIONS_MODULE0 => "[project]/src/components/layout/Topbar.tsx [app-rsc] (ecmascript)", ACTIONS_MODULE1 => "[project]/src/app/(dashboard)/operativa/mov-diarios/actions.ts [app-rsc] (ecmascript)" } [app-rsc] (server actions loader, ecmascript) <exports>');
var __turbopack_async_dependencies__ = __turbopack_handle_async_dependencies__([
    __TURBOPACK__imported__module__$5b$project$5d2f2e$next$2d$internal$2f$server$2f$app$2f28$dashboard$292f$operativa$2f$mov$2d$diarios$2f$page$2f$actions$2e$js__$7b$__ACTIONS_MODULE0__$3d3e$__$225b$project$5d2f$src$2f$components$2f$layout$2f$Topbar$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29222c$__ACTIONS_MODULE1__$3d3e$__$225b$project$5d2f$src$2f$app$2f28$dashboard$292f$operativa$2f$mov$2d$diarios$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$2922$__$7d$__$5b$app$2d$rsc$5d$__$28$server__actions__loader$2c$__ecmascript$29$__$3c$module__evaluation$3e$__,
    __TURBOPACK__imported__module__$5b$project$5d2f2e$next$2d$internal$2f$server$2f$app$2f28$dashboard$292f$operativa$2f$mov$2d$diarios$2f$page$2f$actions$2e$js__$7b$__ACTIONS_MODULE0__$3d3e$__$225b$project$5d2f$src$2f$components$2f$layout$2f$Topbar$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29222c$__ACTIONS_MODULE1__$3d3e$__$225b$project$5d2f$src$2f$app$2f28$dashboard$292f$operativa$2f$mov$2d$diarios$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$2922$__$7d$__$5b$app$2d$rsc$5d$__$28$server__actions__loader$2c$__ecmascript$29$__$3c$exports$3e$__
]);
([__TURBOPACK__imported__module__$5b$project$5d2f2e$next$2d$internal$2f$server$2f$app$2f28$dashboard$292f$operativa$2f$mov$2d$diarios$2f$page$2f$actions$2e$js__$7b$__ACTIONS_MODULE0__$3d3e$__$225b$project$5d2f$src$2f$components$2f$layout$2f$Topbar$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29222c$__ACTIONS_MODULE1__$3d3e$__$225b$project$5d2f$src$2f$app$2f28$dashboard$292f$operativa$2f$mov$2d$diarios$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$2922$__$7d$__$5b$app$2d$rsc$5d$__$28$server__actions__loader$2c$__ecmascript$29$__$3c$module__evaluation$3e$__, __TURBOPACK__imported__module__$5b$project$5d2f2e$next$2d$internal$2f$server$2f$app$2f28$dashboard$292f$operativa$2f$mov$2d$diarios$2f$page$2f$actions$2e$js__$7b$__ACTIONS_MODULE0__$3d3e$__$225b$project$5d2f$src$2f$components$2f$layout$2f$Topbar$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29222c$__ACTIONS_MODULE1__$3d3e$__$225b$project$5d2f$src$2f$app$2f28$dashboard$292f$operativa$2f$mov$2d$diarios$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$2922$__$7d$__$5b$app$2d$rsc$5d$__$28$server__actions__loader$2c$__ecmascript$29$__$3c$exports$3e$__] = __turbopack_async_dependencies__.then ? (await __turbopack_async_dependencies__)() : __turbopack_async_dependencies__);
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, false);}),
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
"[project]/src/lib/data/mov-diarios-utils.ts [app-rsc] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
// Client-safe: types and pure utilities only — no server-only, no Prisma
__turbopack_context__.s({
    "agruparPorCliente": (()=>agruparPorCliente),
    "normalizarNombreCliente": (()=>normalizarNombreCliente)
});
function normalizarNombreCliente(nombre) {
    return nombre.trim().toLowerCase().replace(/\s+/g, " ");
}
function agruparPorCliente(rows) {
    return rows.reduce((acc, row)=>{
        const key = normalizarNombreCliente(row.cliente) || "SIN_CLIENTE";
        if (!acc[key]) {
            acc[key] = {
                cliente: row.cliente || "SIN_CLIENTE",
                totalUSD: 0,
                totalARS: 0,
                operaciones: []
            };
        }
        acc[key].operaciones.push(row);
        if (row.moneda === "USD") {
            acc[key].totalUSD += Number(row.monto || 0);
        } else if (row.moneda === "ARS") {
            acc[key].totalARS += Number(row.monto || 0);
        }
        if (row.tipo === "CAMBIO") {
            const isCompra = row.subTipo?.startsWith("COMPRA");
            const montoUSD = row.moneda === "USD" ? Number(row.monto || 0) : 0;
            const montoARS = Number(row.totalARS || 0);
            if (isCompra) {
                acc[key].totalARS -= montoARS;
            } else {
                if (row.moneda === "USD") acc[key].totalUSD -= montoUSD * 2;
                acc[key].totalARS += montoARS;
            }
        }
        return acc;
    }, {});
}
}}),
"[project]/src/lib/data/mov-diarios.ts [app-rsc] (ecmascript) <locals>": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname, a: __turbopack_async_module__ } = __turbopack_context__;
__turbopack_async_module__(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {
__turbopack_context__.s({
    "getMovimientosDiarios": (()=>getMovimientosDiarios),
    "getResultadoCambioMensual": (()=>getResultadoCambioMensual)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$server$2d$only$2f$empty$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/server-only/empty.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/prisma.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client$2f$runtime$2f$library__$5b$external$5d$__$2840$prisma$2f$client$2f$runtime$2f$library$2c$__esm_import$29$__ = __turbopack_context__.i("[externals]/@prisma/client/runtime/library [external] (@prisma/client/runtime/library, esm_import)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$data$2f$mov$2d$diarios$2d$utils$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/data/mov-diarios-utils.ts [app-rsc] (ecmascript)");
var __turbopack_async_dependencies__ = __turbopack_handle_async_dependencies__([
    __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client$2f$runtime$2f$library__$5b$external$5d$__$2840$prisma$2f$client$2f$runtime$2f$library$2c$__esm_import$29$__
]);
([__TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client$2f$runtime$2f$library__$5b$external$5d$__$2840$prisma$2f$client$2f$runtime$2f$library$2c$__esm_import$29$__] = __turbopack_async_dependencies__.then ? (await __turbopack_async_dependencies__)() : __turbopack_async_dependencies__);
;
;
;
;
const TIPO_CAJA = {
    ENTRADA: "INGRESO",
    TRANSFERENCIA_IN: "INGRESO",
    SALIDA: "EGRESO",
    TRANSFERENCIA_OUT: "EGRESO"
};
const TIPO_CAMBIO_MAP = {
    COMPRA_USD: "CAMBIO",
    VENTA_USD: "CAMBIO",
    COMPRA_EUR: "CAMBIO",
    VENTA_EUR: "CAMBIO",
    COMPRA_BRL: "CAMBIO",
    VENTA_BRL: "CAMBIO",
    HONORARIO_CLIENTE: "INGRESO",
    HONORARIO_EXTERNO: "INGRESO",
    COMISION: "INGRESO",
    AJUSTE: "INGRESO",
    GASTO_OPERATIVO: "EGRESO",
    DISTRIBUCION_UTILIDADES: "EGRESO",
    OTRO: "INGRESO"
};
function cleanDesc(d) {
    if (!d) return "—";
    return d.replace(/\[CC\]\s*/, "").replace(/\s*\|\s*op:[a-zA-Z0-9-]+/, "").trim() || "—";
}
function inferOrigenCaja(tipo) {
    if (tipo === "ENTRADA" || tipo === "TRANSFERENCIA_IN") return "INGRESO_EXTRA";
    return "EGRESO_EXTRA";
}
function inferOrigenCambio(tipo) {
    if (tipo === "COMPRA_USD" || tipo === "VENTA_USD" || tipo === "COMPRA_EUR" || tipo === "VENTA_EUR" || tipo === "COMPRA_BRL" || tipo === "VENTA_BRL") return "CAMBIO";
    return "MOV_MANUAL";
}
async function getMovimientosDiarios(slug) {
    // Determine which caja to filter for
    let cajaId = undefined;
    if (slug) {
        const caja = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].caja.findUnique({
            where: {
                slug
            },
            select: {
                id: true
            }
        });
        cajaId = caja?.id;
    } else {
        const principal = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].caja.findFirst({
            where: {
                esPrincipal: true
            },
            select: {
                id: true
            }
        });
        cajaId = principal?.id;
    }
    const [movCaja, opsCambio] = await Promise.all([
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].movimientoCaja.findMany({
            orderBy: {
                fecha: "desc"
            },
            take: 200,
            where: {
                cajaId: cajaId,
                descripcion: {
                    not: {
                        startsWith: "COBERTURA PARCIAL"
                    }
                },
                tipo: {
                    in: [
                        "ENTRADA",
                        "SALIDA"
                    ]
                }
            }
        }),
        // Operations only appear in the principal/central view (Oficina)
        // unless they were specifically recorded for another box (future feature)
        !slug || slug === 'oficina' ? __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].operacionCambio.findMany({
            orderBy: {
                fecha: "desc"
            },
            take: 200,
            include: {
                Cliente: {
                    select: {
                        nombre: true
                    }
                }
            }
        }) : Promise.resolve([])
    ]);
    const allCoverage = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].movimientoCaja.findMany({
        where: {
            descripcion: {
                startsWith: "COBERTURA PARCIAL"
            },
            confirmado: true
        },
        select: {
            descripcion: true,
            monto: true
        }
    });
    const coverageMap = new Map();
    for (const c of allCoverage){
        const match = c.descripcion?.match(/^COBERTURA PARCIAL ([a-zA-Z0-9-]+)/);
        if (match?.[1]) {
            const prev = coverageMap.get(match[1]) ?? new __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client$2f$runtime$2f$library__$5b$external$5d$__$2840$prisma$2f$client$2f$runtime$2f$library$2c$__esm_import$29$__["Decimal"](0);
            coverageMap.set(match[1], prev.plus(new __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client$2f$runtime$2f$library__$5b$external$5d$__$2840$prisma$2f$client$2f$runtime$2f$library$2c$__esm_import$29$__["Decimal"](c.monto.toString())));
        }
    }
    const fromCaja = movCaja.map((m)=>{
        const monto = new __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client$2f$runtime$2f$library__$5b$external$5d$__$2840$prisma$2f$client$2f$runtime$2f$library$2c$__esm_import$29$__["Decimal"](m.monto.toString());
        let estado;
        if (m.confirmado) {
            estado = "COBRADO";
        } else {
            const cubierto = coverageMap.get(m.id) ?? new __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client$2f$runtime$2f$library__$5b$external$5d$__$2840$prisma$2f$client$2f$runtime$2f$library$2c$__esm_import$29$__["Decimal"](0);
            if (cubierto.lte(0)) {
                estado = "PENDIENTE";
            } else if (cubierto.gte(monto)) {
                estado = "COBRADO";
            } else {
                estado = "PARCIAL";
            }
        }
        // Parse structured description [CLASSIFICATION:SUBTYPE]
        const match = m.descripcion?.match(/^\[(RESULTADO_OPERATIVO|MOVIMIENTO_CAJA|TRANSFERENCIA):([^\]]+)\]/);
        const clasificacionOperativa = match?.[1] || (m.descripcion?.includes("[TRANSFERENCIA:") ? "TRANSFERENCIA" : "MOVIMIENTO_CAJA");
        const subtipoOperativo = match?.[2] || (m.descripcion?.includes("[TRANSFERENCIA:IN]") ? "IN" : m.descripcion?.includes("[TRANSFERENCIA:OUT]") ? "OUT" : "MANUAL");
        const impactaResultado = clasificacionOperativa === "RESULTADO_OPERATIVO";
        const cleanDescText = m.descripcion?.replace(/^\[[^\]]+\]\s*/, "") || "—";
        return {
            id: m.id,
            fecha: m.fecha,
            cliente: "—",
            tipo: TIPO_CAJA[m.tipo] ?? "INGRESO",
            subTipo: m.tipo,
            origen: inferOrigenCaja(m.tipo),
            descripcion: cleanDesc(cleanDescText),
            monto: monto.toNumber(),
            moneda: m.moneda,
            estado,
            impactoCC: false,
            clasificacionOperativa,
            subtipoOperativo,
            impactaResultado
        };
    });
    const fromCambio = opsCambio.map((op)=>({
            id: op.id,
            fecha: op.fecha,
            cliente: op.clienteNombre ?? op.Cliente?.nombre ?? "—",
            tipo: TIPO_CAMBIO_MAP[op.tipo] ?? "CAMBIO",
            subTipo: op.tipo,
            origen: inferOrigenCambio(op.tipo),
            descripcion: cleanDesc(op.descripcion) || op.tipo.replace(/_/g, " "),
            monto: Number(op.cantidad.toString()),
            moneda: op.moneda,
            tc: Number(op.tipoCambio.toString()),
            totalARS: Number(op.totalARS.toString()),
            estado: op.pendiente ? "PENDIENTE" : "COBRADO",
            impactoCC: op.descripcion?.includes("[CC]") ?? false,
            clasificacionOperativa: "CAMBIO",
            subtipoOperativo: op.tipo,
            impactaResultado: true
        }));
    const all = [
        ...fromCaja,
        ...fromCambio
    ];
    // Ordenamiento detallado por día y tipo
    const getOrderRank = (r)=>{
        const st = r.subTipo || "";
        if (st === "COMPRA_USD") return 1;
        if (st === "VENTA_USD") return 2;
        if (st === "COMPRA_EUR") return 3;
        if (st === "VENTA_EUR") return 4;
        if (st === "COMPRA_BRL") return 5;
        if (st === "VENTA_BRL") return 6;
        if (st === "COMISION" || st === "HONORARIO_CLIENTE" || st === "HONORARIO_EXTERNO") return 7;
        if (r.tipo === "INGRESO") return 8;
        if (r.tipo === "EGRESO") return 9;
        if (st === "AJUSTE") return 10;
        return 11;
    };
    return all.sort((a, b)=>{
        const dateDiff = b.fecha.getTime() - a.fecha.getTime();
        if (dateDiff !== 0) return dateDiff;
        const rankA = getOrderRank(a);
        const rankB = getOrderRank(b);
        if (rankA !== rankB) return rankA - rankB;
        // A igual rango, ordenar por monto descendente
        return b.monto - a.monto;
    });
}
async function getResultadoCambioMensual(mes) {
    const [ops, movs] = await Promise.all([
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].operacionCambio.findMany({
            where: {
                mesContable: mes
            }
        }),
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].movimientoCaja.findMany({
            where: {
                confirmado: true,
                descripcion: {
                    startsWith: "[RESULTADO_OPERATIVO:"
                },
                Caja: {
                    esPrincipal: true
                } // Enforce central accounting logic
            }
        })
    ]);
    const config = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].config.findUnique({
        where: {
            clave: "tc_blue"
        }
    });
    const tcBlue = new __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client$2f$runtime$2f$library__$5b$external$5d$__$2840$prisma$2f$client$2f$runtime$2f$library$2c$__esm_import$29$__["Decimal"](config?.valor || "1000");
    const results = {
        USD: {
            netoDivisa: new __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client$2f$runtime$2f$library__$5b$external$5d$__$2840$prisma$2f$client$2f$runtime$2f$library$2c$__esm_import$29$__["Decimal"](0),
            netoARS: new __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client$2f$runtime$2f$library__$5b$external$5d$__$2840$prisma$2f$client$2f$runtime$2f$library$2c$__esm_import$29$__["Decimal"](0)
        },
        EUR: {
            netoDivisa: new __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client$2f$runtime$2f$library__$5b$external$5d$__$2840$prisma$2f$client$2f$runtime$2f$library$2c$__esm_import$29$__["Decimal"](0),
            netoARS: new __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client$2f$runtime$2f$library__$5b$external$5d$__$2840$prisma$2f$client$2f$runtime$2f$library$2c$__esm_import$29$__["Decimal"](0)
        },
        BRL: {
            netoDivisa: new __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client$2f$runtime$2f$library__$5b$external$5d$__$2840$prisma$2f$client$2f$runtime$2f$library$2c$__esm_import$29$__["Decimal"](0),
            netoARS: new __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client$2f$runtime$2f$library__$5b$external$5d$__$2840$prisma$2f$client$2f$runtime$2f$library$2c$__esm_import$29$__["Decimal"](0)
        }
    };
    // 1. Impacto de Operaciones de Cambio
    for (const op of ops){
        const m = op.moneda;
        if (!results[m]) continue;
        const cant = op.cantidad;
        const totARS = op.totalARS;
        const esCompra = op.tipo.startsWith("COMPRA");
        if (esCompra) {
            results[m].netoDivisa = results[m].netoDivisa.plus(cant);
            results[m].netoARS = results[m].netoARS.minus(totARS);
        } else if (op.tipo.startsWith("VENTA")) {
            results[m].netoDivisa = results[m].netoDivisa.minus(cant);
            results[m].netoARS = results[m].netoARS.plus(totARS);
        }
    }
    // 2. Impacto de Resultados Operativos (Alquileres, Honorarios, etc.)
    let extraUSD = new __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client$2f$runtime$2f$library__$5b$external$5d$__$2840$prisma$2f$client$2f$runtime$2f$library$2c$__esm_import$29$__["Decimal"](0);
    for (const m of movs){
        const monto = new __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client$2f$runtime$2f$library__$5b$external$5d$__$2840$prisma$2f$client$2f$runtime$2f$library$2c$__esm_import$29$__["Decimal"](m.monto.toString());
        const isIngreso = m.tipo === "ENTRADA";
        // Convertir a USD para consolidar
        let montoUSD = monto;
        if (m.moneda === "ARS") montoUSD = monto.div(tcBlue);
        else if (m.moneda === "EUR" || m.moneda === "BRL") montoUSD = monto; // Simplificación
        if (isIngreso) extraUSD = extraUSD.plus(montoUSD);
        else extraUSD = extraUSD.minus(montoUSD);
    }
    const resUSD = results.USD.netoDivisa.plus(results.USD.netoARS.div(tcBlue));
    const resEUR = results.EUR.netoDivisa.plus(results.EUR.netoARS.div(tcBlue));
    const resBRL = results.BRL.netoDivisa.plus(results.BRL.netoARS.div(tcBlue));
    return {
        USD: {
            ...results.USD,
            resultado: resUSD.toNumber()
        },
        EUR: {
            ...results.EUR,
            resultado: resEUR.toNumber()
        },
        BRL: {
            ...results.BRL,
            resultado: resBRL.toNumber()
        },
        totalUSD: resUSD.plus(resEUR).plus(resBRL).plus(extraUSD).toNumber(),
        tcBlue: tcBlue.toNumber()
    };
}
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, false);}),
"[project]/src/lib/data/mov-diarios.ts [app-rsc] (ecmascript) <module evaluation>": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname, a: __turbopack_async_module__ } = __turbopack_context__;
__turbopack_async_module__(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {
__turbopack_context__.s({});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$server$2d$only$2f$empty$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/server-only/empty.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/prisma.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client$2f$runtime$2f$library__$5b$external$5d$__$2840$prisma$2f$client$2f$runtime$2f$library$2c$__esm_import$29$__ = __turbopack_context__.i("[externals]/@prisma/client/runtime/library [external] (@prisma/client/runtime/library, esm_import)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$data$2f$mov$2d$diarios$2d$utils$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/data/mov-diarios-utils.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$data$2f$mov$2d$diarios$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/src/lib/data/mov-diarios.ts [app-rsc] (ecmascript) <locals>");
var __turbopack_async_dependencies__ = __turbopack_handle_async_dependencies__([
    __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client$2f$runtime$2f$library__$5b$external$5d$__$2840$prisma$2f$client$2f$runtime$2f$library$2c$__esm_import$29$__,
    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$data$2f$mov$2d$diarios$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__
]);
([__TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client$2f$runtime$2f$library__$5b$external$5d$__$2840$prisma$2f$client$2f$runtime$2f$library$2c$__esm_import$29$__, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$data$2f$mov$2d$diarios$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__] = __turbopack_async_dependencies__.then ? (await __turbopack_async_dependencies__)() : __turbopack_async_dependencies__);
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, false);}),
"[project]/src/components/modules/operativa/MovDiariosTable.tsx (client reference/proxy) <module evaluation>": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "MovDiariosTable": (()=>MovDiariosTable)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$server$2d$dom$2d$turbopack$2d$server$2d$edge$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-server-dom-turbopack-server-edge.js [app-rsc] (ecmascript)");
;
const MovDiariosTable = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$server$2d$dom$2d$turbopack$2d$server$2d$edge$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerClientReference"])(function() {
    throw new Error("Attempted to call MovDiariosTable() from the server but MovDiariosTable is on the client. It's not possible to invoke a client function from the server, it can only be rendered as a Component or passed to props of a Client Component.");
}, "[project]/src/components/modules/operativa/MovDiariosTable.tsx <module evaluation>", "MovDiariosTable");
}}),
"[project]/src/components/modules/operativa/MovDiariosTable.tsx (client reference/proxy)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "MovDiariosTable": (()=>MovDiariosTable)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$server$2d$dom$2d$turbopack$2d$server$2d$edge$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-server-dom-turbopack-server-edge.js [app-rsc] (ecmascript)");
;
const MovDiariosTable = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$server$2d$dom$2d$turbopack$2d$server$2d$edge$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerClientReference"])(function() {
    throw new Error("Attempted to call MovDiariosTable() from the server but MovDiariosTable is on the client. It's not possible to invoke a client function from the server, it can only be rendered as a Component or passed to props of a Client Component.");
}, "[project]/src/components/modules/operativa/MovDiariosTable.tsx", "MovDiariosTable");
}}),
"[project]/src/components/modules/operativa/MovDiariosTable.tsx [app-rsc] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$modules$2f$operativa$2f$MovDiariosTable$2e$tsx__$28$client__reference$2f$proxy$29$__$3c$module__evaluation$3e$__ = __turbopack_context__.i("[project]/src/components/modules/operativa/MovDiariosTable.tsx (client reference/proxy) <module evaluation>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$modules$2f$operativa$2f$MovDiariosTable$2e$tsx__$28$client__reference$2f$proxy$29$__ = __turbopack_context__.i("[project]/src/components/modules/operativa/MovDiariosTable.tsx (client reference/proxy)");
;
__turbopack_context__.n(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$modules$2f$operativa$2f$MovDiariosTable$2e$tsx__$28$client__reference$2f$proxy$29$__);
}}),
"[project]/src/components/modules/operativa/OperativaFormToggle.tsx (client reference/proxy) <module evaluation>": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "OperativaFormToggle": (()=>OperativaFormToggle)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$server$2d$dom$2d$turbopack$2d$server$2d$edge$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-server-dom-turbopack-server-edge.js [app-rsc] (ecmascript)");
;
const OperativaFormToggle = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$server$2d$dom$2d$turbopack$2d$server$2d$edge$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerClientReference"])(function() {
    throw new Error("Attempted to call OperativaFormToggle() from the server but OperativaFormToggle is on the client. It's not possible to invoke a client function from the server, it can only be rendered as a Component or passed to props of a Client Component.");
}, "[project]/src/components/modules/operativa/OperativaFormToggle.tsx <module evaluation>", "OperativaFormToggle");
}}),
"[project]/src/components/modules/operativa/OperativaFormToggle.tsx (client reference/proxy)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "OperativaFormToggle": (()=>OperativaFormToggle)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$server$2d$dom$2d$turbopack$2d$server$2d$edge$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-server-dom-turbopack-server-edge.js [app-rsc] (ecmascript)");
;
const OperativaFormToggle = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$server$2d$dom$2d$turbopack$2d$server$2d$edge$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerClientReference"])(function() {
    throw new Error("Attempted to call OperativaFormToggle() from the server but OperativaFormToggle is on the client. It's not possible to invoke a client function from the server, it can only be rendered as a Component or passed to props of a Client Component.");
}, "[project]/src/components/modules/operativa/OperativaFormToggle.tsx", "OperativaFormToggle");
}}),
"[project]/src/components/modules/operativa/OperativaFormToggle.tsx [app-rsc] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$modules$2f$operativa$2f$OperativaFormToggle$2e$tsx__$28$client__reference$2f$proxy$29$__$3c$module__evaluation$3e$__ = __turbopack_context__.i("[project]/src/components/modules/operativa/OperativaFormToggle.tsx (client reference/proxy) <module evaluation>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$modules$2f$operativa$2f$OperativaFormToggle$2e$tsx__$28$client__reference$2f$proxy$29$__ = __turbopack_context__.i("[project]/src/components/modules/operativa/OperativaFormToggle.tsx (client reference/proxy)");
;
__turbopack_context__.n(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$modules$2f$operativa$2f$OperativaFormToggle$2e$tsx__$28$client__reference$2f$proxy$29$__);
}}),
"[project]/src/lib/services/caja.service.ts [app-rsc] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname, a: __turbopack_async_module__ } = __turbopack_context__;
__turbopack_async_module__(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {
__turbopack_context__.s({
    "calcularSaldoCaja": (()=>calcularSaldoCaja)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/prisma.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client$2f$runtime$2f$library__$5b$external$5d$__$2840$prisma$2f$client$2f$runtime$2f$library$2c$__esm_import$29$__ = __turbopack_context__.i("[externals]/@prisma/client/runtime/library [external] (@prisma/client/runtime/library, esm_import)");
var __turbopack_async_dependencies__ = __turbopack_handle_async_dependencies__([
    __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client$2f$runtime$2f$library__$5b$external$5d$__$2840$prisma$2f$client$2f$runtime$2f$library$2c$__esm_import$29$__
]);
([__TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client$2f$runtime$2f$library__$5b$external$5d$__$2840$prisma$2f$client$2f$runtime$2f$library$2c$__esm_import$29$__] = __turbopack_async_dependencies__.then ? (await __turbopack_async_dependencies__)() : __turbopack_async_dependencies__);
;
;
async function calcularSaldoCaja(cajaId, moneda) {
    if (!cajaId || cajaId.trim() === "") return new __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client$2f$runtime$2f$library__$5b$external$5d$__$2840$prisma$2f$client$2f$runtime$2f$library$2c$__esm_import$29$__["Decimal"](0);
    const caja = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].caja.findUnique({
        where: {
            id: cajaId
        }
    });
    if (!caja) return new __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client$2f$runtime$2f$library__$5b$external$5d$__$2840$prisma$2f$client$2f$runtime$2f$library$2c$__esm_import$29$__["Decimal"](0);
    // Agrupamos manualmente para evitar errores de runtime con groupBy en campos Enum en algunas versiones/entornos
    const movimientosRaw = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].movimientoCaja.findMany({
        where: {
            cajaId,
            moneda,
            confirmado: true
        },
        select: {
            tipo: true,
            monto: true
        }
    });
    const totals = movimientosRaw.reduce((acc, m)=>{
        acc[m.tipo] = (acc[m.tipo] || new __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client$2f$runtime$2f$library__$5b$external$5d$__$2840$prisma$2f$client$2f$runtime$2f$library$2c$__esm_import$29$__["Decimal"](0)).add(m.monto);
        return acc;
    }, {});
    let saldo = new __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client$2f$runtime$2f$library__$5b$external$5d$__$2840$prisma$2f$client$2f$runtime$2f$library$2c$__esm_import$29$__["Decimal"](moneda === "USD" ? caja.saldoInicialUSD : caja.saldoInicialARS);
    Object.entries(totals).forEach(([tipo, monto])=>{
        const esEntrada = tipo === "ENTRADA" || tipo === "TRANSFERENCIA_IN";
        if (esEntrada) {
            saldo = saldo.add(monto);
        } else {
            saldo = saldo.sub(monto);
        }
    });
    return saldo;
}
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, false);}),
"[project]/src/app/(dashboard)/operativa/mov-diarios/page.tsx [app-rsc] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname, a: __turbopack_async_module__ } = __turbopack_context__;
__turbopack_async_module__(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {
__turbopack_context__.s({
    "default": (()=>MovDiariosPage)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-jsx-dev-runtime.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/prisma.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$data$2f$mov$2d$diarios$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$module__evaluation$3e$__ = __turbopack_context__.i("[project]/src/lib/data/mov-diarios.ts [app-rsc] (ecmascript) <module evaluation>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$data$2f$mov$2d$diarios$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/src/lib/data/mov-diarios.ts [app-rsc] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$modules$2f$operativa$2f$MovDiariosTable$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/modules/operativa/MovDiariosTable.tsx [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$modules$2f$operativa$2f$OperativaFormToggle$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/modules/operativa/OperativaFormToggle.tsx [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$services$2f$caja$2e$service$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/services/caja.service.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$auth$2f$permissions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/auth/permissions.ts [app-rsc] (ecmascript)");
var __turbopack_async_dependencies__ = __turbopack_handle_async_dependencies__([
    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$data$2f$mov$2d$diarios$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$module__evaluation$3e$__,
    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$data$2f$mov$2d$diarios$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__,
    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$services$2f$caja$2e$service$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__
]);
([__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$data$2f$mov$2d$diarios$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$module__evaluation$3e$__, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$data$2f$mov$2d$diarios$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$services$2f$caja$2e$service$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__] = __turbopack_async_dependencies__.then ? (await __turbopack_async_dependencies__)() : __turbopack_async_dependencies__);
;
;
;
;
;
;
;
async function MovDiariosPage() {
    await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$auth$2f$permissions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["requirePermission"])("mov_diarios:leer");
    const mesActual = new Date().toISOString().slice(0, 7); // YYYY-MM
    const [rows, cajasBase, resultadoCambio] = await Promise.all([
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$data$2f$mov$2d$diarios$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__["getMovimientosDiarios"])(),
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].caja.findMany({
            where: {
                activa: true
            },
            orderBy: {
                orden: "asc"
            }
        }),
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$data$2f$mov$2d$diarios$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__["getResultadoCambioMensual"])(mesActual)
    ]);
    // Enriquecer cajas con saldos actuales
    const cajas = await Promise.all(cajasBase.map(async (c)=>({
            id: c.id,
            label: c.label,
            slug: c.slug,
            esPrincipal: c.esPrincipal,
            saldoUSD: Number(await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$services$2f$caja$2e$service$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["calcularSaldoCaja"])(c.id, "USD")),
            saldoARS: Number(await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$services$2f$caja$2e$service$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["calcularSaldoCaja"])(c.id, "ARS"))
        })));
    // Serializar datos para el cliente (Decimal -> number, Date -> string)
    const rowsPlain = rows.map((r)=>({
            ...r,
            fecha: r.fecha.toISOString(),
            monto: Number(r.monto),
            tc: r.tc ? Number(r.tc) : undefined,
            totalARS: r.totalARS ? Number(r.totalARS) : undefined
        }));
    const resultadoCambioPlain = {
        USD: {
            netoDivisa: Number(resultadoCambio.USD.netoDivisa),
            netoARS: Number(resultadoCambio.USD.netoARS),
            resultado: Number(resultadoCambio.USD.resultado)
        },
        EUR: {
            netoDivisa: Number(resultadoCambio.EUR.netoDivisa),
            netoARS: Number(resultadoCambio.EUR.netoARS),
            resultado: Number(resultadoCambio.EUR.resultado)
        },
        BRL: {
            netoDivisa: Number(resultadoCambio.BRL.netoDivisa),
            netoARS: Number(resultadoCambio.BRL.netoARS),
            resultado: Number(resultadoCambio.BRL.resultado)
        },
        totalUSD: Number(resultadoCambio.totalUSD),
        tcBlue: Number(resultadoCambio.tcBlue)
    };
    const principal = cajas.find((c)=>c.esPrincipal);
    const canWrite = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$auth$2f$permissions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["hasPermission"])("mov_diarios:escribir");
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "flex flex-col gap-6",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$modules$2f$operativa$2f$MovDiariosTable$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["MovDiariosTable"], {
            rows: rowsPlain,
            resultadoCambio: resultadoCambioPlain,
            cajas: cajas,
            title: "Caja Oficina",
            activeCajaId: principal?.id,
            canWrite: canWrite,
            children: canWrite && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$modules$2f$operativa$2f$OperativaFormToggle$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["OperativaFormToggle"], {
                cajas: cajas,
                defaultCajaId: principal?.id
            }, void 0, false, {
                fileName: "[project]/src/app/(dashboard)/operativa/mov-diarios/page.tsx",
                lineNumber: 73,
                columnNumber: 22
            }, this)
        }, void 0, false, {
            fileName: "[project]/src/app/(dashboard)/operativa/mov-diarios/page.tsx",
            lineNumber: 65,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/src/app/(dashboard)/operativa/mov-diarios/page.tsx",
        lineNumber: 64,
        columnNumber: 5
    }, this);
}
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, false);}),
"[project]/src/app/(dashboard)/operativa/mov-diarios/page.tsx [app-rsc] (ecmascript, Next.js server component)": ((__turbopack_context__) => {

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.n(__turbopack_context__.i("[project]/src/app/(dashboard)/operativa/mov-diarios/page.tsx [app-rsc] (ecmascript)"));
}}),

};

//# sourceMappingURL=%5Broot-of-the-server%5D__57f7bf79._.js.map