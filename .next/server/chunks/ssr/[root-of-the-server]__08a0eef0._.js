module.exports = {

"[externals]/@prisma/client/runtime/library [external] (@prisma/client/runtime/library, esm_import)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname, a: __turbopack_async_module__ } = __turbopack_context__;
__turbopack_async_module__(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {
const mod = await __turbopack_context__.y("@prisma/client/runtime/library");

__turbopack_context__.n(mod);
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, true);}),
"[project]/src/app/(dashboard)/clientes/actions.ts [app-rsc] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname, a: __turbopack_async_module__ } = __turbopack_context__;
__turbopack_async_module__(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {
/* __next_internal_action_entry_do_not_use__ [{"40797e04c37731ef0a9e0be86a65ddbe7fe5f0e83e":"ejecutarOperacion","4093a7529c4b91f4799dc96d2f180cae11b20803ed":"revertirOperacion","40afc8212129cb4e6c2d32294c9bc930b19b708bc4":"aplicarInteresCC","40f598eb7dd1f47927e7eff0ad4bb4b803288230f9":"aplicarTodosInteresesCC","6027f3939de1643fde27e4fac73b02a76bbb3c3181":"darDeBajaCliente","6039368a734845d3170b68ee6de052d66790113159":"actualizarTasaCC","603f13fe685d9aa3186ad4542463121b906bdccf2a":"eliminarCliente","605c1c4a375b322407e4ac55aac3d23c96ab231321":"eliminarClienteConDatos","60602e5524be1e0141e15ed2b144aa2cf8c06e7af6":"liquidarInteresCCAction","60642c7ba8d2b9604b3047b4cf3f94a8f344263f1a":"crearCuentaCorriente","606c11c70eca808e4d5c70681ea9705ffa0d43f872":"crearPlazoFijoSimple","606f4a7094766aa7fdc26b194b9bf19160c76847f9":"crearMovimientoCC","60aca3b4b97fff5866c0a64120260e81d5a54bb8b7":"editarCliente","60cd43e06a5c40892207602493ac9830bd1e86058f":"reactivarCliente","60eca7c59cedc36d94fa1ddeec6f4734244df468ee":"crearCliente","60f10d2dfced8cf4cccedca86d9bc36dc4cd90c1c0":"editarPlazoFijo"},"",""] */ __turbopack_context__.s({
    "actualizarTasaCC": (()=>actualizarTasaCC),
    "aplicarInteresCC": (()=>aplicarInteresCC),
    "aplicarTodosInteresesCC": (()=>aplicarTodosInteresesCC),
    "crearCliente": (()=>crearCliente),
    "crearCuentaCorriente": (()=>crearCuentaCorriente),
    "crearMovimientoCC": (()=>crearMovimientoCC),
    "crearPlazoFijoSimple": (()=>crearPlazoFijoSimple),
    "darDeBajaCliente": (()=>darDeBajaCliente),
    "editarCliente": (()=>editarCliente),
    "editarPlazoFijo": (()=>editarPlazoFijo),
    "ejecutarOperacion": (()=>ejecutarOperacion),
    "eliminarCliente": (()=>eliminarCliente),
    "eliminarClienteConDatos": (()=>eliminarClienteConDatos),
    "liquidarInteresCCAction": (()=>liquidarInteresCCAction),
    "reactivarCliente": (()=>reactivarCliente),
    "revertirOperacion": (()=>revertirOperacion)
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
async function crearMovimientoCC(prevState, formData) {
    if (__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$config$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["readOnlyPreview"]) return {
        error: "Modo lectura activo"
    };
    const cuentaId = formData.get("cuentaId");
    const clienteId = formData.get("clienteId");
    const tipo = formData.get("tipo");
    const montoRaw = formData.get("monto");
    const descripcion = formData.get("descripcion");
    if (!cuentaId || !clienteId || !tipo || !montoRaw) {
        return {
            error: "Faltan datos obligatorios"
        };
    }
    try {
        const monto = new __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client$2f$runtime$2f$library__$5b$external$5d$__$2840$prisma$2f$client$2f$runtime$2f$library$2c$__esm_import$29$__["Decimal"](montoRaw);
        if (monto.lte(0)) {
            return {
                error: "El monto debe ser mayor a 0"
            };
        }
        const result = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].$transaction(async (tx)=>{
            // 1. Buscar la cuenta
            const cuenta = await tx.cuentaCorriente.findUnique({
                where: {
                    id: cuentaId
                }
            });
            if (!cuenta) {
                throw new Error("Cuenta no encontrada");
            }
            // 2. Calcular nuevo saldo
            const nuevoSaldo = tipo === "INGRESO" ? cuenta.saldo.add(monto) : cuenta.saldo.sub(monto);
            // 3. Crear el movimiento
            const movimiento = await tx.movimientoCC.create({
                data: {
                    id: crypto.randomUUID(),
                    cuentaCorrienteId: cuentaId,
                    tipo,
                    monto,
                    descripcion: descripcion?.trim() || "MOV",
                    fecha: new Date()
                }
            });
            // 4. Actualizar el saldo de la cuenta
            await tx.cuentaCorriente.update({
                where: {
                    id: cuentaId
                },
                data: {
                    saldo: nuevoSaldo
                }
            });
            return {
                success: true
            };
        });
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["revalidatePath"])(`/clientes/${clienteId}`);
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["revalidatePath"])(`/clientes/${clienteId}/cuentas/${cuentaId}`);
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["revalidatePath"])(`/clientes/cc/${cuentaId}`);
        return {
            success: true,
            message: "Movimiento registrado con éxito"
        };
    } catch (error) {
        console.error("Error en crearMovimientoCC:", error);
        return {
            error: error.message || "Error al procesar el movimiento"
        };
    }
}
async function liquidarInteresCCAction(prevState, formData) {
    if (__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$config$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["readOnlyPreview"]) return {
        error: "Modo lectura activo"
    };
    const cuentaId = formData.get("cuentaId")?.trim();
    const clienteId = formData.get("clienteId")?.trim();
    const fechaInicioRaw = formData.get("fechaInicio")?.trim();
    const fechaFinRaw = formData.get("fechaFin")?.trim();
    const tasaRaw = formData.get("tasa")?.trim();
    const interesAplicadoRaw = formData.get("interesAplicado")?.trim();
    if (!cuentaId || !clienteId || !fechaInicioRaw || !fechaFinRaw || !tasaRaw || !interesAplicadoRaw) {
        return {
            error: "Faltan datos obligatorios"
        };
    }
    let tasa;
    let interesAplicado;
    let fechaInicio;
    let fechaFin;
    try {
        tasa = new __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client$2f$runtime$2f$library__$5b$external$5d$__$2840$prisma$2f$client$2f$runtime$2f$library$2c$__esm_import$29$__["Decimal"](tasaRaw);
        interesAplicado = new __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client$2f$runtime$2f$library__$5b$external$5d$__$2840$prisma$2f$client$2f$runtime$2f$library$2c$__esm_import$29$__["Decimal"](interesAplicadoRaw);
    } catch  {
        return {
            error: "Tasa o interés aplicado no son valores numéricos válidos"
        };
    }
    try {
        fechaInicio = new Date(fechaInicioRaw);
        fechaFin = new Date(fechaFinRaw);
        if (isNaN(fechaInicio.getTime()) || isNaN(fechaFin.getTime())) throw new Error();
    } catch  {
        return {
            error: "Las fechas ingresadas no son válidas"
        };
    }
    if (fechaFin <= fechaInicio) {
        return {
            error: "La fecha de cierre debe ser posterior al inicio del período"
        };
    }
    if (interesAplicado.lt(0)) {
        return {
            error: "El interés aplicado no puede ser negativo"
        };
    }
    if (tasa.lte(0)) {
        return {
            error: "La tasa debe ser mayor a 0"
        };
    }
    try {
        const { liquidarInteresCC } = await __turbopack_context__.r("[project]/src/lib/services/liquidacion-cc.service.ts [app-rsc] (ecmascript, async loader)")(__turbopack_context__.i);
        const result = await liquidarInteresCC({
            cuentaId,
            fechaInicio,
            fechaFin,
            tasa,
            interesAplicado
        });
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["revalidatePath"])(`/clientes/${clienteId}`);
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["revalidatePath"])(`/clientes/${clienteId}/cuentas/${cuentaId}`);
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["revalidatePath"])(`/clientes/cc/${cuentaId}`);
        return {
            success: true,
            interesCalculado: result.interesCalculado.toFixed(2),
            interesAplicado: result.interesAplicado.toFixed(2),
            diferencia: result.diferencia.toFixed(2),
            movimientoId: result.movimientoId
        };
    } catch (error) {
        const msg = error instanceof Error ? error.message : "Error al liquidar interés";
        return {
            error: msg
        };
    }
}
async function aplicarInteresCC(formData) {
    if (__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$config$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["readOnlyPreview"]) return {
        error: "Modo lectura activo"
    };
    const cuentaId = formData.get("cuentaId");
    const montoAplicado = new __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client$2f$runtime$2f$library__$5b$external$5d$__$2840$prisma$2f$client$2f$runtime$2f$library$2c$__esm_import$29$__["Decimal"](formData.get("montoAplicado"));
    const descripcion = formData.get("descripcion");
    const hoy = new Date();
    const inicioDia = new Date(Date.UTC(hoy.getFullYear(), hoy.getMonth(), hoy.getDate()));
    const finDia = new Date(Date.UTC(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + 1));
    const result = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].$transaction(async (tx)=>{
        const ultimoInteres = await tx.movimientoCC.findFirst({
            where: {
                cuentaCorrienteId: cuentaId,
                tipo: "INTERES",
                fecha: {
                    gte: inicioDia,
                    lt: finDia
                }
            },
            orderBy: {
                createdAt: "desc"
            }
        });
        if (ultimoInteres && new __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client$2f$runtime$2f$library__$5b$external$5d$__$2840$prisma$2f$client$2f$runtime$2f$library$2c$__esm_import$29$__["Decimal"](ultimoInteres.monto.toString()).equals(montoAplicado)) {
            return {
                error: "Interés ya aplicado hoy"
            };
        }
        const cuenta = await tx.cuentaCorriente.findUniqueOrThrow({
            where: {
                id: cuentaId
            }
        });
        const operationRef = crypto.randomUUID();
        await tx.movimientoCC.create({
            data: {
                id: crypto.randomUUID(),
                cuentaCorrienteId: cuentaId,
                fecha: hoy,
                tipo: "INTERES",
                monto: montoAplicado,
                descripcion: `INTERES CC | op:${operationRef}`
            }
        });
        await tx.cuentaCorriente.update({
            where: {
                id: cuentaId
            },
            data: {
                saldo: cuenta.saldo.add(montoAplicado)
            }
        });
        return {
            success: true
        };
    });
    if (result && "success" in result) {
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["revalidatePath"])("/intereses");
    }
    return result;
}
async function aplicarTodosInteresesCC(formData) {
    if (__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$config$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["readOnlyPreview"]) return {
        error: "Modo lectura activo"
    };
    const raw = formData.get("payload");
    let items;
    try {
        items = JSON.parse(raw);
    } catch  {
        return {
            error: "Payload inválido"
        };
    }
    const hoy = new Date();
    const inicioDia = new Date(Date.UTC(hoy.getFullYear(), hoy.getMonth(), hoy.getDate()));
    const finDia = new Date(Date.UTC(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + 1));
    try {
        let applied = 0;
        await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].$transaction(async (tx)=>{
            for (const item of items){
                const monto = new __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client$2f$runtime$2f$library__$5b$external$5d$__$2840$prisma$2f$client$2f$runtime$2f$library$2c$__esm_import$29$__["Decimal"](item.montoAplicado);
                const ultimoInteres = await tx.movimientoCC.findFirst({
                    where: {
                        cuentaCorrienteId: item.cuentaId,
                        tipo: "INTERES",
                        fecha: {
                            gte: inicioDia,
                            lt: finDia
                        }
                    },
                    orderBy: {
                        createdAt: "desc"
                    }
                });
                if (ultimoInteres && new __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client$2f$runtime$2f$library__$5b$external$5d$__$2840$prisma$2f$client$2f$runtime$2f$library$2c$__esm_import$29$__["Decimal"](ultimoInteres.monto.toString()).equals(monto)) {
                    continue;
                }
                const cuenta = await tx.cuentaCorriente.findUniqueOrThrow({
                    where: {
                        id: item.cuentaId
                    }
                });
                const operationRef = crypto.randomUUID();
                await tx.movimientoCC.create({
                    data: {
                        id: crypto.randomUUID(),
                        cuentaCorrienteId: item.cuentaId,
                        fecha: hoy,
                        tipo: "INTERES",
                        monto,
                        descripcion: `INTERES CC | op:${operationRef}`
                    }
                });
                await tx.cuentaCorriente.update({
                    where: {
                        id: item.cuentaId
                    },
                    data: {
                        saldo: cuenta.saldo.add(monto)
                    }
                });
                applied++;
            }
        });
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["revalidatePath"])("/intereses");
        return {
            success: true,
            total: applied
        };
    } catch (error) {
        const msg = error instanceof Error ? error.message : "Error al aplicar intereses";
        return {
            error: msg
        };
    }
}
async function ejecutarOperacion(formData) {
    if (__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$config$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["readOnlyPreview"]) return {
        error: "Modo lectura activo"
    };
    const clienteId = formData.get("clienteId")?.trim();
    const tipo = formData.get("tipo")?.trim();
    const monedaOrigen = formData.get("monedaOrigen")?.trim();
    const monedaDestino = formData.get("monedaDestino")?.trim();
    const montoRaw = formData.get("monto")?.trim();
    const tasaRaw = formData.get("tasa")?.trim();
    const tcRaw = formData.get("tipoCambio")?.trim();
    const plazoDiasRaw = formData.get("plazoDias")?.trim();
    if (!clienteId || !tipo || !montoRaw) return {
        error: "Faltan datos obligatorios"
    };
    let monto;
    try {
        monto = new __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client$2f$runtime$2f$library__$5b$external$5d$__$2840$prisma$2f$client$2f$runtime$2f$library$2c$__esm_import$29$__["Decimal"](montoRaw);
    } catch  {
        return {
            error: "Monto inválido"
        };
    }
    if (monto.lte(0)) return {
        error: "El monto debe ser mayor a 0"
    };
    const hoy = new Date();
    const operationRef = crypto.randomUUID();
    try {
        const txResult = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].$transaction(async (tx)=>{
            if (tipo === "LP") {
                if (!monedaOrigen || monedaOrigen !== "USD") throw new Error("LP requiere moneda USD");
                const plazoDias = parseInt(plazoDiasRaw ?? "0", 10);
                if (isNaN(plazoDias) || plazoDias <= 0) throw new Error("Plazo en días inválido");
                let tasaLP;
                try {
                    tasaLP = new __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client$2f$runtime$2f$library__$5b$external$5d$__$2840$prisma$2f$client$2f$runtime$2f$library$2c$__esm_import$29$__["Decimal"](tasaRaw || "0");
                    if (tasaLP.lte(0)) throw new Error();
                } catch  {
                    throw new Error("Tasa inválida para LP");
                }
                const cuentaOrigen = await tx.cuentaCorriente.findFirst({
                    where: {
                        clienteId,
                        moneda: "USD"
                    }
                });
                if (!cuentaOrigen) throw new Error("Cuenta USD no encontrada");
                await tx.movimientoCC.create({
                    data: {
                        id: crypto.randomUUID(),
                        cuentaCorrienteId: cuentaOrigen.id,
                        fecha: hoy,
                        tipo: "EGRESO",
                        monto,
                        descripcion: `LP egreso | op:${operationRef}`
                    }
                });
                await tx.cuentaCorriente.update({
                    where: {
                        id: cuentaOrigen.id
                    },
                    data: {
                        saldo: cuentaOrigen.saldo.sub(monto)
                    }
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
                        updatedAt: new Date()
                    }
                });
                return {
                    tipo: "LP",
                    plazoFijoId: pf.id,
                    clienteId,
                    capital: monto.toString(),
                    fechaVencimiento: fechaVencimiento.toISOString()
                };
            }
            const descOp = `${tipo} ${monedaOrigen}->${monedaDestino} | op:${operationRef}`;
            // RULO / DIVISA: EGRESO origen + INGRESO destino
            const factor = tipo === "DIVISA" ? new __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client$2f$runtime$2f$library__$5b$external$5d$__$2840$prisma$2f$client$2f$runtime$2f$library$2c$__esm_import$29$__["Decimal"](tcRaw || "1") : new __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client$2f$runtime$2f$library__$5b$external$5d$__$2840$prisma$2f$client$2f$runtime$2f$library$2c$__esm_import$29$__["Decimal"](1).add(new __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client$2f$runtime$2f$library__$5b$external$5d$__$2840$prisma$2f$client$2f$runtime$2f$library$2c$__esm_import$29$__["Decimal"](tasaRaw || "0").div(100));
            const montoDestino = monto.mul(factor);
            const [cuentaOrigen, cuentaDestino] = await Promise.all([
                tx.cuentaCorriente.findFirst({
                    where: {
                        clienteId,
                        moneda: monedaOrigen
                    }
                }),
                tx.cuentaCorriente.findFirst({
                    where: {
                        clienteId,
                        moneda: monedaDestino
                    }
                })
            ]);
            if (!cuentaOrigen) throw new Error(`Cuenta ${monedaOrigen} no encontrada`);
            if (!cuentaDestino) throw new Error(`Cuenta ${monedaDestino} no encontrada`);
            await tx.movimientoCC.create({
                data: {
                    id: crypto.randomUUID(),
                    cuentaCorrienteId: cuentaOrigen.id,
                    fecha: hoy,
                    tipo: "EGRESO",
                    monto,
                    descripcion: descOp
                }
            });
            await tx.cuentaCorriente.update({
                where: {
                    id: cuentaOrigen.id
                },
                data: {
                    saldo: cuentaOrigen.saldo.sub(monto)
                }
            });
            await tx.movimientoCC.create({
                data: {
                    id: crypto.randomUUID(),
                    cuentaCorrienteId: cuentaDestino.id,
                    fecha: hoy,
                    tipo: "INGRESO",
                    monto: montoDestino,
                    descripcion: descOp
                }
            });
            await tx.cuentaCorriente.update({
                where: {
                    id: cuentaDestino.id
                },
                data: {
                    saldo: cuentaDestino.saldo.add(montoDestino)
                }
            });
            return null;
        });
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["revalidatePath"])(`/clientes/${clienteId}`);
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["revalidatePath"])("/operaciones");
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["revalidatePath"])("/plazos-fijos");
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["revalidatePath"])("/reportes");
        return {
            success: true,
            ...txResult ?? {}
        };
    } catch (error) {
        const msg = error instanceof Error ? error.message : "Error al ejecutar operación";
        return {
            error: msg
        };
    }
}
async function editarCliente(_prev, formData) {
    if (__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$config$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["readOnlyPreview"]) return {
        error: "Modo lectura activo"
    };
    const id = formData.get("id")?.toString();
    const nombre = formData.get("nombre")?.toString()?.trim();
    const email = formData.get("email")?.toString()?.trim() || null;
    const telefono = formData.get("telefono")?.toString()?.trim() || null;
    const notas = formData.get("notas")?.toString()?.trim() || null;
    if (!id) return {
        error: "ID requerido"
    };
    if (!nombre) return {
        error: "El nombre es obligatorio"
    };
    await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].cliente.update({
        where: {
            id
        },
        data: {
            nombre,
            email,
            telefono,
            notas,
            updatedAt: new Date()
        }
    });
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["revalidatePath"])("/clientes");
    return {
        ok: true
    };
}
async function darDeBajaCliente(_prev, formData) {
    if (__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$config$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["readOnlyPreview"]) return {
        error: "Modo lectura activo"
    };
    const id = formData.get("id")?.toString();
    if (!id) return {
        error: "ID requerido"
    };
    await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].cliente.update({
        where: {
            id
        },
        data: {
            activo: false,
            updatedAt: new Date()
        }
    });
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["revalidatePath"])("/clientes");
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["revalidatePath"])("/clientes/cc");
    return {
        ok: true
    };
}
async function reactivarCliente(_prev, formData) {
    if (__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$config$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["readOnlyPreview"]) return {
        error: "Modo lectura activo"
    };
    const id = formData.get("id")?.toString();
    if (!id) return {
        error: "ID requerido"
    };
    await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].cliente.update({
        where: {
            id
        },
        data: {
            activo: true,
            updatedAt: new Date()
        }
    });
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["revalidatePath"])("/clientes");
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["revalidatePath"])("/clientes/cc");
    return {
        ok: true
    };
}
async function eliminarCliente(_prev, formData) {
    if (__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$config$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["readOnlyPreview"]) return {
        error: "Modo lectura activo"
    };
    const id = formData.get("id")?.toString();
    if (!id) return {
        error: "ID requerido"
    };
    const cliente = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].cliente.findUnique({
        where: {
            id
        },
        include: {
            _count: {
                select: {
                    CuentaCorriente: true,
                    PlazoFijo: true,
                    OperacionCambio: true,
                    CustodiaCliente: true
                }
            }
        }
    });
    if (!cliente) return {
        error: "Cliente no encontrado"
    };
    const cc = cliente._count.CuentaCorriente;
    const pf = cliente._count.PlazoFijo;
    const ops = cliente._count.OperacionCambio;
    const custody = cliente._count.CustodiaCliente;
    // Legacy ops: only those NOT linked by clienteId, normalized name match
    const normalizado = cliente.nombre.trim().toLowerCase().replace(/\s+/g, " ");
    const legacyCandidates = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].operacionCambio.findMany({
        where: {
            clienteId: null,
            clienteNombre: {
                not: null
            }
        },
        select: {
            clienteNombre: true
        }
    });
    const legacy = legacyCandidates.filter((op)=>(op.clienteNombre ?? "").trim().toLowerCase().replace(/\s+/g, " ") === normalizado).length;
    const hasBlock = cc > 0 || pf > 0 || ops > 0 || custody > 0 || legacy > 0;
    if (hasBlock) {
        const parts = [];
        if (cc > 0) parts.push(`CC ${cc}`);
        if (pf > 0) parts.push(`PF ${pf}`);
        if (ops > 0) parts.push(`Operaciones ${ops}`);
        if (custody > 0) parts.push(`Custodia ${custody}`);
        if (legacy > 0) parts.push(`Legacy ${legacy} (importado)`);
        const msg = legacy > 0 ? `No se puede forzar: tiene ${legacy} op. importadas por nombre. Archivalo.` : `Tiene datos asociados: ${parts.join(", ")}. Usá "Eliminar con datos" para borrar todo.`;
        return {
            error: msg,
            canForce: legacy === 0
        };
    }
    await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].cliente.delete({
        where: {
            id
        }
    });
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["revalidatePath"])("/clientes");
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["revalidatePath"])("/clientes/cc");
    return {
        ok: true
    };
}
async function eliminarClienteConDatos(_prev, formData) {
    if (__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$config$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["readOnlyPreview"]) return {
        error: "Modo lectura activo"
    };
    const id = formData.get("id")?.toString();
    if (!id) return {
        error: "ID requerido"
    };
    const cliente = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].cliente.findUnique({
        where: {
            id
        },
        select: {
            nombre: true
        }
    });
    if (!cliente) return {
        error: "Cliente no encontrado"
    };
    // Hard block: legacy ops by name
    const normalizado = cliente.nombre.trim().toLowerCase().replace(/\s+/g, " ");
    const legacyCandidates = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].operacionCambio.findMany({
        where: {
            clienteId: null,
            clienteNombre: {
                not: null
            }
        },
        select: {
            clienteNombre: true
        }
    });
    const legacy = legacyCandidates.filter((op)=>(op.clienteNombre ?? "").trim().toLowerCase().replace(/\s+/g, " ") === normalizado).length;
    if (legacy > 0) {
        return {
            error: `Bloqueado: existen ${legacy} operaciones importadas por nombre. Archivá el cliente.`
        };
    }
    // Nullify clienteId on linked OperacionCambio (preserve them as anonymous)
    await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].operacionCambio.updateMany({
        where: {
            clienteId: id
        },
        data: {
            clienteId: null
        }
    });
    // Delete client — cascades CC→MovimientoCC, PF→PlazoFijoMovimiento, CustodiaCliente
    await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].cliente.delete({
        where: {
            id
        }
    });
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["revalidatePath"])("/clientes");
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["revalidatePath"])("/clientes/cc");
    return {
        ok: true
    };
}
async function revertirOperacion(formData) {
    if (__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$config$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["readOnlyPreview"]) return {
        error: "Modo lectura activo"
    };
    const operationRef = formData.get("operationRef")?.trim();
    if (!operationRef) return {
        error: "operationRef requerido"
    };
    const { getMovimientosByOperationRef } = await __turbopack_context__.r("[project]/src/lib/data/movimiento-cc.ts [app-rsc] (ecmascript, async loader)")(__turbopack_context__.i);
    const movimientos = await getMovimientosByOperationRef(operationRef);
    if (movimientos.length === 0) return {
        error: "No se encontraron movimientos para esta operación"
    };
    // Guard: prevent double reversal
    if (movimientos.some((m)=>m.descripcion?.includes("REVERSO"))) {
        return {
            error: "Esta operación ya fue revertida"
        };
    }
    const reversalRef = crypto.randomUUID();
    const hoy = new Date();
    try {
        await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].$transaction(async (tx)=>{
            for (const mov of movimientos){
                const inversoTipo = mov.tipo === "INGRESO" ? "EGRESO" : "INGRESO";
                const desc = `REVERSO ${mov.tipo} | op:${reversalRef} | ref:${operationRef}`;
                await tx.movimientoCC.create({
                    data: {
                        id: crypto.randomUUID(),
                        cuentaCorrienteId: mov.cuentaCorrienteId,
                        fecha: hoy,
                        tipo: inversoTipo,
                        monto: mov.monto,
                        descripcion: desc
                    }
                });
                const cuenta = await tx.cuentaCorriente.findUniqueOrThrow({
                    where: {
                        id: mov.cuentaCorrienteId
                    }
                });
                const nuevoSaldo = inversoTipo === "INGRESO" ? cuenta.saldo.add(mov.monto) : cuenta.saldo.sub(mov.monto);
                await tx.cuentaCorriente.update({
                    where: {
                        id: mov.cuentaCorrienteId
                    },
                    data: {
                        saldo: nuevoSaldo
                    }
                });
            }
        });
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["revalidatePath"])("/operaciones");
        return {
            success: true
        };
    } catch (error) {
        const msg = error instanceof Error ? error.message : "Error al revertir operación";
        return {
            error: msg
        };
    }
}
async function crearCliente(_prev, formData) {
    if (__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$config$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["readOnlyPreview"]) return {
        error: "Modo lectura activo"
    };
    const nombre = formData.get("nombre")?.toString().trim() ?? "";
    const email = formData.get("email")?.toString().trim() || null;
    const telefono = formData.get("telefono")?.toString().trim() || null;
    if (!nombre) return {
        error: "El nombre es obligatorio"
    };
    try {
        const dup = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].cliente.findFirst({
            where: {
                nombre: {
                    equals: nombre,
                    mode: "insensitive"
                }
            },
            select: {
                id: true
            }
        });
        if (dup) return {
            error: "Ya existe un cliente con ese nombre"
        };
        await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].cliente.create({
            data: {
                id: crypto.randomUUID(),
                nombre,
                email,
                telefono,
                activo: true,
                updatedAt: new Date()
            }
        });
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["revalidatePath"])("/clientes/cc");
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["revalidatePath"])("/clientes");
        return {
            ok: true
        };
    } catch (e) {
        const msg = e instanceof Error ? e.message : "Error al crear cliente";
        return {
            error: msg
        };
    }
}
async function crearCuentaCorriente(_prev, formData) {
    if (__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$config$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["readOnlyPreview"]) return {
        error: "Modo lectura activo"
    };
    const clienteId = formData.get("clienteId")?.toString();
    const moneda = formData.get("moneda")?.toString();
    if (!clienteId) return {
        error: "clienteId requerido"
    };
    if (moneda !== "USD" && moneda !== "ARS") return {
        error: "Moneda debe ser USD o ARS"
    };
    const dup = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].cuentaCorriente.findUnique({
        where: {
            clienteId_moneda: {
                clienteId,
                moneda
            }
        },
        select: {
            id: true
        }
    });
    if (dup) return {
        error: `Ya existe una cuenta ${moneda} para este cliente`
    };
    try {
        await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].cuentaCorriente.create({
            data: {
                id: crypto.randomUUID(),
                clienteId,
                moneda,
                saldo: 0,
                updatedAt: new Date()
            }
        });
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["revalidatePath"])(`/clientes/${clienteId}`);
        return {
            ok: true
        };
    } catch (e) {
        const msg = e instanceof Error ? e.message : "Error al crear cuenta corriente";
        return {
            error: msg
        };
    }
}
async function crearPlazoFijoSimple(_prev, formData) {
    if (__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$config$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["readOnlyPreview"]) return {
        error: "Modo lectura activo"
    };
    const clienteId = formData.get("clienteId")?.toString();
    const moneda = formData.get("moneda")?.toString();
    const rawCapital = formData.get("capital")?.toString().replace(",", ".");
    const rawTasa = formData.get("tasaAnual")?.toString().replace(",", ".");
    const fechaInicioStr = formData.get("fechaInicio")?.toString();
    const fechaVencStr = formData.get("fechaVencimiento")?.toString();
    if (!clienteId) return {
        error: "clienteId requerido"
    };
    if (moneda !== "USD" && moneda !== "ARS" && moneda !== "EUR" && moneda !== "BRL") {
        return {
            error: "Moneda inválida"
        };
    }
    const capital = parseFloat(rawCapital ?? "");
    const tasa = parseFloat(rawTasa ?? "");
    if (isNaN(capital) || capital <= 0) return {
        error: "Capital inválido"
    };
    if (isNaN(tasa) || tasa < 0) return {
        error: "Tasa inválida"
    };
    const dIni = fechaInicioStr ? new Date(fechaInicioStr) : null;
    const dVenc = fechaVencStr ? new Date(fechaVencStr) : null;
    if (!dIni || isNaN(dIni.getTime())) return {
        error: "Fecha de inicio inválida"
    };
    if (!dVenc || isNaN(dVenc.getTime())) return {
        error: "Fecha de vencimiento inválida"
    };
    if (dVenc <= dIni) return {
        error: "Vencimiento debe ser posterior al inicio"
    };
    const fechaInicio = new Date(Date.UTC(dIni.getUTCFullYear(), dIni.getUTCMonth(), dIni.getUTCDate()));
    const fechaVencimiento = new Date(Date.UTC(dVenc.getUTCFullYear(), dVenc.getUTCMonth(), dVenc.getUTCDate()));
    try {
        await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].plazoFijo.create({
            data: {
                id: crypto.randomUUID(),
                clienteId,
                moneda,
                capital,
                saldoActual: capital,
                tasaAnual: tasa,
                fechaInicio,
                fechaVencimiento,
                estado: "ACTIVO",
                updatedAt: new Date()
            }
        });
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["revalidatePath"])(`/clientes/${clienteId}`);
        return {
            ok: true
        };
    } catch (e) {
        const msg = e instanceof Error ? e.message : "Error al registrar plazo fijo";
        return {
            error: msg
        };
    }
}
async function actualizarTasaCC(_prev, formData) {
    if (__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$config$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["readOnlyPreview"]) return {
        error: "Modo lectura activo"
    };
    const clienteId = formData.get("clienteId")?.toString();
    const cuentaId = formData.get("cuentaId")?.toString();
    const tasaRaw = formData.get("tasaCC")?.toString().replace(",", ".");
    if (!clienteId) return {
        error: "clienteId requerido"
    };
    const tasaPct = parseFloat(tasaRaw ?? "");
    if (isNaN(tasaPct) || tasaPct < 0) return {
        error: "Tasa inválida (debe ser ≥ 0)"
    };
    await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].cliente.update({
        where: {
            id: clienteId
        },
        data: {
            tasaCC: new __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client$2f$runtime$2f$library__$5b$external$5d$__$2840$prisma$2f$client$2f$runtime$2f$library$2c$__esm_import$29$__["Decimal"](tasaPct / 100),
            updatedAt: new Date()
        }
    });
    if (cuentaId) (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["revalidatePath"])(`/clientes/cc/${cuentaId}`);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["revalidatePath"])(`/clientes/${clienteId}`);
    return {
        ok: true
    };
}
async function editarPlazoFijo(_prev, formData) {
    if (__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$config$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["readOnlyPreview"]) return {
        error: "Modo lectura activo"
    };
    const pfId = formData.get("pfId")?.toString();
    const clienteId = formData.get("clienteId")?.toString();
    if (!pfId || !clienteId) return {
        error: "ID requerido"
    };
    const capitalRaw = formData.get("capital")?.toString();
    const tasaRaw = formData.get("tasaAnual")?.toString();
    const fechaInicioRaw = formData.get("fechaInicio")?.toString();
    const fechaVencimientoRaw = formData.get("fechaVencimiento")?.toString();
    const saldoActualRaw = formData.get("saldoActual")?.toString();
    const estadoRaw = formData.get("estado")?.toString();
    const capital = parseFloat(capitalRaw ?? "");
    const tasa = parseFloat(tasaRaw ?? "");
    const saldo = parseFloat(saldoActualRaw ?? "");
    if (isNaN(capital) || capital <= 0) return {
        error: "Capital inválido"
    };
    if (isNaN(tasa) || tasa < 0) return {
        error: "Tasa inválida"
    };
    if (isNaN(saldo)) return {
        error: "Saldo actual inválido"
    };
    const ESTADOS = [
        "ACTIVO",
        "VENCIDO",
        "CANCELADO",
        "RENOVADO"
    ];
    if (!estadoRaw || !ESTADOS.includes(estadoRaw)) {
        return {
            error: "Estado inválido"
        };
    }
    const fechaInicio = fechaInicioRaw ? new Date(fechaInicioRaw + "T00:00:00Z") : null;
    const fechaVenc = fechaVencimientoRaw ? new Date(fechaVencimientoRaw + "T00:00:00Z") : null;
    if (!fechaInicio || isNaN(fechaInicio.getTime())) return {
        error: "Fecha inicio inválida"
    };
    if (!fechaVenc || isNaN(fechaVenc.getTime())) return {
        error: "Fecha vencimiento inválida"
    };
    await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].plazoFijo.update({
        where: {
            id: pfId
        },
        data: {
            capital: new __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client$2f$runtime$2f$library__$5b$external$5d$__$2840$prisma$2f$client$2f$runtime$2f$library$2c$__esm_import$29$__["Decimal"](capital),
            tasaAnual: new __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client$2f$runtime$2f$library__$5b$external$5d$__$2840$prisma$2f$client$2f$runtime$2f$library$2c$__esm_import$29$__["Decimal"](tasa),
            saldoActual: new __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client$2f$runtime$2f$library__$5b$external$5d$__$2840$prisma$2f$client$2f$runtime$2f$library$2c$__esm_import$29$__["Decimal"](saldo),
            estado: estadoRaw,
            fechaInicio,
            fechaVencimiento: fechaVenc,
            updatedAt: new Date()
        }
    });
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["revalidatePath"])(`/clientes/pf/${pfId}`);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["revalidatePath"])(`/clientes/${clienteId}`);
    return {
        ok: true
    };
}
;
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$validate$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["ensureServerEntryExports"])([
    crearMovimientoCC,
    liquidarInteresCCAction,
    aplicarInteresCC,
    aplicarTodosInteresesCC,
    ejecutarOperacion,
    editarCliente,
    darDeBajaCliente,
    reactivarCliente,
    eliminarCliente,
    eliminarClienteConDatos,
    revertirOperacion,
    crearCliente,
    crearCuentaCorriente,
    crearPlazoFijoSimple,
    actualizarTasaCC,
    editarPlazoFijo
]);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(crearMovimientoCC, "606f4a7094766aa7fdc26b194b9bf19160c76847f9", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(liquidarInteresCCAction, "60602e5524be1e0141e15ed2b144aa2cf8c06e7af6", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(aplicarInteresCC, "40afc8212129cb4e6c2d32294c9bc930b19b708bc4", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(aplicarTodosInteresesCC, "40f598eb7dd1f47927e7eff0ad4bb4b803288230f9", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(ejecutarOperacion, "40797e04c37731ef0a9e0be86a65ddbe7fe5f0e83e", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(editarCliente, "60aca3b4b97fff5866c0a64120260e81d5a54bb8b7", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(darDeBajaCliente, "6027f3939de1643fde27e4fac73b02a76bbb3c3181", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(reactivarCliente, "60cd43e06a5c40892207602493ac9830bd1e86058f", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(eliminarCliente, "603f13fe685d9aa3186ad4542463121b906bdccf2a", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(eliminarClienteConDatos, "605c1c4a375b322407e4ac55aac3d23c96ab231321", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(revertirOperacion, "4093a7529c4b91f4799dc96d2f180cae11b20803ed", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(crearCliente, "60eca7c59cedc36d94fa1ddeec6f4734244df468ee", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(crearCuentaCorriente, "60642c7ba8d2b9604b3047b4cf3f94a8f344263f1a", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(crearPlazoFijoSimple, "606c11c70eca808e4d5c70681ea9705ffa0d43f872", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(actualizarTasaCC, "6039368a734845d3170b68ee6de052d66790113159", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(editarPlazoFijo, "60f10d2dfced8cf4cccedca86d9bc36dc4cd90c1c0", null);
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, false);}),
"[project]/.next-internal/server/app/(dashboard)/clientes/pf/[pfId]/page/actions.js { ACTIONS_MODULE0 => \"[project]/src/components/layout/Topbar.tsx [app-rsc] (ecmascript)\", ACTIONS_MODULE1 => \"[project]/src/app/(dashboard)/clientes/actions.ts [app-rsc] (ecmascript)\" } [app-rsc] (server actions loader, ecmascript) <locals>": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname, a: __turbopack_async_module__ } = __turbopack_context__;
__turbopack_async_module__(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {
__turbopack_context__.s({});
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$layout$2f$Topbar$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/layout/Topbar.tsx [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f28$dashboard$292f$clientes$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/app/(dashboard)/clientes/actions.ts [app-rsc] (ecmascript)");
var __turbopack_async_dependencies__ = __turbopack_handle_async_dependencies__([
    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f28$dashboard$292f$clientes$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__
]);
([__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f28$dashboard$292f$clientes$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__] = __turbopack_async_dependencies__.then ? (await __turbopack_async_dependencies__)() : __turbopack_async_dependencies__);
;
;
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, false);}),
"[project]/.next-internal/server/app/(dashboard)/clientes/pf/[pfId]/page/actions.js { ACTIONS_MODULE0 => \"[project]/src/components/layout/Topbar.tsx [app-rsc] (ecmascript)\", ACTIONS_MODULE1 => \"[project]/src/app/(dashboard)/clientes/actions.ts [app-rsc] (ecmascript)\" } [app-rsc] (server actions loader, ecmascript) <module evaluation>": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname, a: __turbopack_async_module__ } = __turbopack_context__;
__turbopack_async_module__(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {
__turbopack_context__.s({});
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$layout$2f$Topbar$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/layout/Topbar.tsx [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f28$dashboard$292f$clientes$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/app/(dashboard)/clientes/actions.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f2e$next$2d$internal$2f$server$2f$app$2f28$dashboard$292f$clientes$2f$pf$2f5b$pfId$5d2f$page$2f$actions$2e$js__$7b$__ACTIONS_MODULE0__$3d3e$__$225b$project$5d2f$src$2f$components$2f$layout$2f$Topbar$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29222c$__ACTIONS_MODULE1__$3d3e$__$225b$project$5d2f$src$2f$app$2f28$dashboard$292f$clientes$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$2922$__$7d$__$5b$app$2d$rsc$5d$__$28$server__actions__loader$2c$__ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i('[project]/.next-internal/server/app/(dashboard)/clientes/pf/[pfId]/page/actions.js { ACTIONS_MODULE0 => "[project]/src/components/layout/Topbar.tsx [app-rsc] (ecmascript)", ACTIONS_MODULE1 => "[project]/src/app/(dashboard)/clientes/actions.ts [app-rsc] (ecmascript)" } [app-rsc] (server actions loader, ecmascript) <locals>');
var __turbopack_async_dependencies__ = __turbopack_handle_async_dependencies__([
    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f28$dashboard$292f$clientes$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__,
    __TURBOPACK__imported__module__$5b$project$5d2f2e$next$2d$internal$2f$server$2f$app$2f28$dashboard$292f$clientes$2f$pf$2f5b$pfId$5d2f$page$2f$actions$2e$js__$7b$__ACTIONS_MODULE0__$3d3e$__$225b$project$5d2f$src$2f$components$2f$layout$2f$Topbar$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29222c$__ACTIONS_MODULE1__$3d3e$__$225b$project$5d2f$src$2f$app$2f28$dashboard$292f$clientes$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$2922$__$7d$__$5b$app$2d$rsc$5d$__$28$server__actions__loader$2c$__ecmascript$29$__$3c$locals$3e$__
]);
([__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f28$dashboard$292f$clientes$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__, __TURBOPACK__imported__module__$5b$project$5d2f2e$next$2d$internal$2f$server$2f$app$2f28$dashboard$292f$clientes$2f$pf$2f5b$pfId$5d2f$page$2f$actions$2e$js__$7b$__ACTIONS_MODULE0__$3d3e$__$225b$project$5d2f$src$2f$components$2f$layout$2f$Topbar$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29222c$__ACTIONS_MODULE1__$3d3e$__$225b$project$5d2f$src$2f$app$2f28$dashboard$292f$clientes$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$2922$__$7d$__$5b$app$2d$rsc$5d$__$28$server__actions__loader$2c$__ecmascript$29$__$3c$locals$3e$__] = __turbopack_async_dependencies__.then ? (await __turbopack_async_dependencies__)() : __turbopack_async_dependencies__);
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, false);}),
"[project]/.next-internal/server/app/(dashboard)/clientes/pf/[pfId]/page/actions.js { ACTIONS_MODULE0 => \"[project]/src/components/layout/Topbar.tsx [app-rsc] (ecmascript)\", ACTIONS_MODULE1 => \"[project]/src/app/(dashboard)/clientes/actions.ts [app-rsc] (ecmascript)\" } [app-rsc] (server actions loader, ecmascript) <exports>": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname, a: __turbopack_async_module__ } = __turbopack_context__;
__turbopack_async_module__(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {
__turbopack_context__.s({
    "0011ff4319847fa321c161740d2e30453828714a2e": (()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$layout$2f$Topbar$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["$$RSC_SERVER_ACTION_0"]),
    "60f10d2dfced8cf4cccedca86d9bc36dc4cd90c1c0": (()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f28$dashboard$292f$clientes$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["editarPlazoFijo"])
});
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$layout$2f$Topbar$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/layout/Topbar.tsx [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f28$dashboard$292f$clientes$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/app/(dashboard)/clientes/actions.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f2e$next$2d$internal$2f$server$2f$app$2f28$dashboard$292f$clientes$2f$pf$2f5b$pfId$5d2f$page$2f$actions$2e$js__$7b$__ACTIONS_MODULE0__$3d3e$__$225b$project$5d2f$src$2f$components$2f$layout$2f$Topbar$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29222c$__ACTIONS_MODULE1__$3d3e$__$225b$project$5d2f$src$2f$app$2f28$dashboard$292f$clientes$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$2922$__$7d$__$5b$app$2d$rsc$5d$__$28$server__actions__loader$2c$__ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i('[project]/.next-internal/server/app/(dashboard)/clientes/pf/[pfId]/page/actions.js { ACTIONS_MODULE0 => "[project]/src/components/layout/Topbar.tsx [app-rsc] (ecmascript)", ACTIONS_MODULE1 => "[project]/src/app/(dashboard)/clientes/actions.ts [app-rsc] (ecmascript)" } [app-rsc] (server actions loader, ecmascript) <locals>');
var __turbopack_async_dependencies__ = __turbopack_handle_async_dependencies__([
    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f28$dashboard$292f$clientes$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__,
    __TURBOPACK__imported__module__$5b$project$5d2f2e$next$2d$internal$2f$server$2f$app$2f28$dashboard$292f$clientes$2f$pf$2f5b$pfId$5d2f$page$2f$actions$2e$js__$7b$__ACTIONS_MODULE0__$3d3e$__$225b$project$5d2f$src$2f$components$2f$layout$2f$Topbar$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29222c$__ACTIONS_MODULE1__$3d3e$__$225b$project$5d2f$src$2f$app$2f28$dashboard$292f$clientes$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$2922$__$7d$__$5b$app$2d$rsc$5d$__$28$server__actions__loader$2c$__ecmascript$29$__$3c$locals$3e$__
]);
([__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f28$dashboard$292f$clientes$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__, __TURBOPACK__imported__module__$5b$project$5d2f2e$next$2d$internal$2f$server$2f$app$2f28$dashboard$292f$clientes$2f$pf$2f5b$pfId$5d2f$page$2f$actions$2e$js__$7b$__ACTIONS_MODULE0__$3d3e$__$225b$project$5d2f$src$2f$components$2f$layout$2f$Topbar$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29222c$__ACTIONS_MODULE1__$3d3e$__$225b$project$5d2f$src$2f$app$2f28$dashboard$292f$clientes$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$2922$__$7d$__$5b$app$2d$rsc$5d$__$28$server__actions__loader$2c$__ecmascript$29$__$3c$locals$3e$__] = __turbopack_async_dependencies__.then ? (await __turbopack_async_dependencies__)() : __turbopack_async_dependencies__);
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, false);}),
"[project]/.next-internal/server/app/(dashboard)/clientes/pf/[pfId]/page/actions.js { ACTIONS_MODULE0 => \"[project]/src/components/layout/Topbar.tsx [app-rsc] (ecmascript)\", ACTIONS_MODULE1 => \"[project]/src/app/(dashboard)/clientes/actions.ts [app-rsc] (ecmascript)\" } [app-rsc] (server actions loader, ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname, a: __turbopack_async_module__ } = __turbopack_context__;
__turbopack_async_module__(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {
__turbopack_context__.s({
    "0011ff4319847fa321c161740d2e30453828714a2e": (()=>__TURBOPACK__imported__module__$5b$project$5d2f2e$next$2d$internal$2f$server$2f$app$2f28$dashboard$292f$clientes$2f$pf$2f5b$pfId$5d2f$page$2f$actions$2e$js__$7b$__ACTIONS_MODULE0__$3d3e$__$225b$project$5d2f$src$2f$components$2f$layout$2f$Topbar$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29222c$__ACTIONS_MODULE1__$3d3e$__$225b$project$5d2f$src$2f$app$2f28$dashboard$292f$clientes$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$2922$__$7d$__$5b$app$2d$rsc$5d$__$28$server__actions__loader$2c$__ecmascript$29$__$3c$exports$3e$__["0011ff4319847fa321c161740d2e30453828714a2e"]),
    "60f10d2dfced8cf4cccedca86d9bc36dc4cd90c1c0": (()=>__TURBOPACK__imported__module__$5b$project$5d2f2e$next$2d$internal$2f$server$2f$app$2f28$dashboard$292f$clientes$2f$pf$2f5b$pfId$5d2f$page$2f$actions$2e$js__$7b$__ACTIONS_MODULE0__$3d3e$__$225b$project$5d2f$src$2f$components$2f$layout$2f$Topbar$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29222c$__ACTIONS_MODULE1__$3d3e$__$225b$project$5d2f$src$2f$app$2f28$dashboard$292f$clientes$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$2922$__$7d$__$5b$app$2d$rsc$5d$__$28$server__actions__loader$2c$__ecmascript$29$__$3c$exports$3e$__["60f10d2dfced8cf4cccedca86d9bc36dc4cd90c1c0"])
});
var __TURBOPACK__imported__module__$5b$project$5d2f2e$next$2d$internal$2f$server$2f$app$2f28$dashboard$292f$clientes$2f$pf$2f5b$pfId$5d2f$page$2f$actions$2e$js__$7b$__ACTIONS_MODULE0__$3d3e$__$225b$project$5d2f$src$2f$components$2f$layout$2f$Topbar$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29222c$__ACTIONS_MODULE1__$3d3e$__$225b$project$5d2f$src$2f$app$2f28$dashboard$292f$clientes$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$2922$__$7d$__$5b$app$2d$rsc$5d$__$28$server__actions__loader$2c$__ecmascript$29$__$3c$module__evaluation$3e$__ = __turbopack_context__.i('[project]/.next-internal/server/app/(dashboard)/clientes/pf/[pfId]/page/actions.js { ACTIONS_MODULE0 => "[project]/src/components/layout/Topbar.tsx [app-rsc] (ecmascript)", ACTIONS_MODULE1 => "[project]/src/app/(dashboard)/clientes/actions.ts [app-rsc] (ecmascript)" } [app-rsc] (server actions loader, ecmascript) <module evaluation>');
var __TURBOPACK__imported__module__$5b$project$5d2f2e$next$2d$internal$2f$server$2f$app$2f28$dashboard$292f$clientes$2f$pf$2f5b$pfId$5d2f$page$2f$actions$2e$js__$7b$__ACTIONS_MODULE0__$3d3e$__$225b$project$5d2f$src$2f$components$2f$layout$2f$Topbar$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29222c$__ACTIONS_MODULE1__$3d3e$__$225b$project$5d2f$src$2f$app$2f28$dashboard$292f$clientes$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$2922$__$7d$__$5b$app$2d$rsc$5d$__$28$server__actions__loader$2c$__ecmascript$29$__$3c$exports$3e$__ = __turbopack_context__.i('[project]/.next-internal/server/app/(dashboard)/clientes/pf/[pfId]/page/actions.js { ACTIONS_MODULE0 => "[project]/src/components/layout/Topbar.tsx [app-rsc] (ecmascript)", ACTIONS_MODULE1 => "[project]/src/app/(dashboard)/clientes/actions.ts [app-rsc] (ecmascript)" } [app-rsc] (server actions loader, ecmascript) <exports>');
var __turbopack_async_dependencies__ = __turbopack_handle_async_dependencies__([
    __TURBOPACK__imported__module__$5b$project$5d2f2e$next$2d$internal$2f$server$2f$app$2f28$dashboard$292f$clientes$2f$pf$2f5b$pfId$5d2f$page$2f$actions$2e$js__$7b$__ACTIONS_MODULE0__$3d3e$__$225b$project$5d2f$src$2f$components$2f$layout$2f$Topbar$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29222c$__ACTIONS_MODULE1__$3d3e$__$225b$project$5d2f$src$2f$app$2f28$dashboard$292f$clientes$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$2922$__$7d$__$5b$app$2d$rsc$5d$__$28$server__actions__loader$2c$__ecmascript$29$__$3c$module__evaluation$3e$__,
    __TURBOPACK__imported__module__$5b$project$5d2f2e$next$2d$internal$2f$server$2f$app$2f28$dashboard$292f$clientes$2f$pf$2f5b$pfId$5d2f$page$2f$actions$2e$js__$7b$__ACTIONS_MODULE0__$3d3e$__$225b$project$5d2f$src$2f$components$2f$layout$2f$Topbar$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29222c$__ACTIONS_MODULE1__$3d3e$__$225b$project$5d2f$src$2f$app$2f28$dashboard$292f$clientes$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$2922$__$7d$__$5b$app$2d$rsc$5d$__$28$server__actions__loader$2c$__ecmascript$29$__$3c$exports$3e$__
]);
([__TURBOPACK__imported__module__$5b$project$5d2f2e$next$2d$internal$2f$server$2f$app$2f28$dashboard$292f$clientes$2f$pf$2f5b$pfId$5d2f$page$2f$actions$2e$js__$7b$__ACTIONS_MODULE0__$3d3e$__$225b$project$5d2f$src$2f$components$2f$layout$2f$Topbar$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29222c$__ACTIONS_MODULE1__$3d3e$__$225b$project$5d2f$src$2f$app$2f28$dashboard$292f$clientes$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$2922$__$7d$__$5b$app$2d$rsc$5d$__$28$server__actions__loader$2c$__ecmascript$29$__$3c$module__evaluation$3e$__, __TURBOPACK__imported__module__$5b$project$5d2f2e$next$2d$internal$2f$server$2f$app$2f28$dashboard$292f$clientes$2f$pf$2f5b$pfId$5d2f$page$2f$actions$2e$js__$7b$__ACTIONS_MODULE0__$3d3e$__$225b$project$5d2f$src$2f$components$2f$layout$2f$Topbar$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29222c$__ACTIONS_MODULE1__$3d3e$__$225b$project$5d2f$src$2f$app$2f28$dashboard$292f$clientes$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$2922$__$7d$__$5b$app$2d$rsc$5d$__$28$server__actions__loader$2c$__ecmascript$29$__$3c$exports$3e$__] = __turbopack_async_dependencies__.then ? (await __turbopack_async_dependencies__)() : __turbopack_async_dependencies__);
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
"[project]/src/lib/data/plazo-fijo.ts [app-rsc] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "getPlazoFijoById": (()=>getPlazoFijoById),
    "getVencimientosPF": (()=>getVencimientosPF)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/prisma.ts [app-rsc] (ecmascript)");
;
async function getPlazoFijoById(pfId) {
    try {
        return await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].plazoFijo.findUnique({
            where: {
                id: pfId
            },
            include: {
                Cliente: true,
                PlazoFijoMovimiento: {
                    orderBy: {
                        fecha: "asc"
                    }
                }
            }
        });
    } catch  {
        // Fallback if query engine doesn't know PlazoFijoMovimiento yet (pending regenerate)
        const pf = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].plazoFijo.findUnique({
            where: {
                id: pfId
            },
            include: {
                Cliente: true
            }
        });
        if (!pf) return null;
        return {
            ...pf,
            PlazoFijoMovimiento: []
        };
    }
}
async function getVencimientosPF() {
    return __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].plazoFijo.findMany({
        where: {
            estado: "ACTIVO"
        },
        include: {
            Cliente: {
                select: {
                    id: true,
                    nombre: true
                }
            }
        },
        orderBy: {
            fechaVencimiento: "asc"
        }
    });
}
}}),
"[project]/src/components/modules/clientes/EditarPFForm.tsx (client reference/proxy) <module evaluation>": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "EditarPFForm": (()=>EditarPFForm)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$server$2d$dom$2d$turbopack$2d$server$2d$edge$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-server-dom-turbopack-server-edge.js [app-rsc] (ecmascript)");
;
const EditarPFForm = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$server$2d$dom$2d$turbopack$2d$server$2d$edge$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerClientReference"])(function() {
    throw new Error("Attempted to call EditarPFForm() from the server but EditarPFForm is on the client. It's not possible to invoke a client function from the server, it can only be rendered as a Component or passed to props of a Client Component.");
}, "[project]/src/components/modules/clientes/EditarPFForm.tsx <module evaluation>", "EditarPFForm");
}}),
"[project]/src/components/modules/clientes/EditarPFForm.tsx (client reference/proxy)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "EditarPFForm": (()=>EditarPFForm)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$server$2d$dom$2d$turbopack$2d$server$2d$edge$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-server-dom-turbopack-server-edge.js [app-rsc] (ecmascript)");
;
const EditarPFForm = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$server$2d$dom$2d$turbopack$2d$server$2d$edge$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerClientReference"])(function() {
    throw new Error("Attempted to call EditarPFForm() from the server but EditarPFForm is on the client. It's not possible to invoke a client function from the server, it can only be rendered as a Component or passed to props of a Client Component.");
}, "[project]/src/components/modules/clientes/EditarPFForm.tsx", "EditarPFForm");
}}),
"[project]/src/components/modules/clientes/EditarPFForm.tsx [app-rsc] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$modules$2f$clientes$2f$EditarPFForm$2e$tsx__$28$client__reference$2f$proxy$29$__$3c$module__evaluation$3e$__ = __turbopack_context__.i("[project]/src/components/modules/clientes/EditarPFForm.tsx (client reference/proxy) <module evaluation>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$modules$2f$clientes$2f$EditarPFForm$2e$tsx__$28$client__reference$2f$proxy$29$__ = __turbopack_context__.i("[project]/src/components/modules/clientes/EditarPFForm.tsx (client reference/proxy)");
;
__turbopack_context__.n(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$modules$2f$clientes$2f$EditarPFForm$2e$tsx__$28$client__reference$2f$proxy$29$__);
}}),
"[project]/src/app/(dashboard)/clientes/pf/[pfId]/page.tsx [app-rsc] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "default": (()=>PFDetailPage)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-jsx-dev-runtime.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$data$2f$plazo$2d$fijo$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/data/plazo-fijo.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$api$2f$navigation$2e$react$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$module__evaluation$3e$__ = __turbopack_context__.i("[project]/node_modules/next/dist/api/navigation.react-server.js [app-rsc] (ecmascript) <module evaluation>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$components$2f$navigation$2e$react$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/client/components/navigation.react-server.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/client/app-dir/link.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$left$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronLeft$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/chevron-left.js [app-rsc] (ecmascript) <export default as ChevronLeft>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$trending$2d$up$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__default__as__TrendingUp$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/trending-up.js [app-rsc] (ecmascript) <export default as TrendingUp>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$calendar$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__default__as__Calendar$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/calendar.js [app-rsc] (ecmascript) <export default as Calendar>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$target$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__default__as__Target$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/target.js [app-rsc] (ecmascript) <export default as Target>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$clock$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__default__as__Clock$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/clock.js [app-rsc] (ecmascript) <export default as Clock>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$modules$2f$clientes$2f$EditarPFForm$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/modules/clientes/EditarPFForm.tsx [app-rsc] (ecmascript)");
;
;
;
;
;
;
function toNum(v) {
    if (v == null) return 0;
    const n = Number(v.toString());
    return isNaN(n) ? 0 : n;
}
function fmt(v) {
    return toNum(v).toLocaleString("es-AR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}
function fmtFecha(d) {
    if (!d) return "—";
    try {
        return new Date(d).toLocaleDateString("es-AR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            timeZone: "UTC"
        });
    } catch  {
        return "—";
    }
}
function diasEntre(a, b) {
    try {
        const da = new Date(a);
        const db = new Date(b);
        const utcA = Date.UTC(da.getUTCFullYear(), da.getUTCMonth(), da.getUTCDate());
        const utcB = Date.UTC(db.getUTCFullYear(), db.getUTCMonth(), db.getUTCDate());
        return Math.round((utcB - utcA) / 86_400_000);
    } catch  {
        return 0;
    }
}
const ESTADO_BADGE = {
    ACTIVO: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
    VENCIDO: "bg-red-50 text-red-600 ring-1 ring-red-200",
    CANCELADO: "bg-slate-100 text-slate-400",
    RENOVADO: "bg-blue-50 text-blue-600 ring-1 ring-blue-200"
};
const TIPO_BADGE = {
    INTERES: "text-blue-600",
    INGRESO: "text-emerald-600",
    EGRESO: "text-red-500"
};
async function PFDetailPage({ params }) {
    const { pfId } = await params;
    const pf = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$data$2f$plazo$2d$fijo$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getPlazoFijoById"])(pfId);
    if (!pf) (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$components$2f$navigation$2e$react$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["notFound"])();
    const clienteId = pf.clienteId;
    const capitalMovs = pf.PlazoFijoMovimiento.filter((m)=>m.tipo === "APERTURA" || m.tipo === "CIERRE_RENOV");
    const capital = capitalMovs.length > 0 ? toNum(capitalMovs[capitalMovs.length - 1].monto) : toNum(pf.capital);
    const saldoActual = toNum(pf.saldoActual);
    const tasa = toNum(pf.tasaAnual);
    const plazo = diasEntre(pf.fechaInicio, pf.fechaVencimiento);
    const interesEst = capital * (tasa / 100) * (plazo / 365);
    const hoy = new Date();
    const diasHastaVenc = diasEntre(hoy, pf.fechaVencimiento);
    const movimientos = pf.PlazoFijoMovimiento;
    const fechaInicioISO = new Date(pf.fechaInicio).toISOString().slice(0, 10);
    const fechaVencimientoISO = new Date(pf.fechaVencimiento).toISOString().slice(0, 10);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "flex flex-col gap-8",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"], {
                href: `/clientes/${clienteId}`,
                className: "flex items-center gap-1 text-slate-400 hover:text-blue-600 text-[10px] font-black uppercase tracking-widest transition-colors group w-fit",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$left$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronLeft$3e$__["ChevronLeft"], {
                        size: 13,
                        className: "group-hover:-translate-x-0.5 transition-transform"
                    }, void 0, false, {
                        fileName: "[project]/src/app/(dashboard)/clientes/pf/[pfId]/page.tsx",
                        lineNumber: 83,
                        columnNumber: 9
                    }, this),
                    pf.Cliente.nombre
                ]
            }, void 0, true, {
                fileName: "[project]/src/app/(dashboard)/clientes/pf/[pfId]/page.tsx",
                lineNumber: 79,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("header", {
                className: "flex items-center gap-5 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "p-4 bg-emerald-600 text-white rounded-2xl shadow-inner shrink-0",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$trending$2d$up$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__default__as__TrendingUp$3e$__["TrendingUp"], {
                            size: 28
                        }, void 0, false, {
                            fileName: "[project]/src/app/(dashboard)/clientes/pf/[pfId]/page.tsx",
                            lineNumber: 90,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/src/app/(dashboard)/clientes/pf/[pfId]/page.tsx",
                        lineNumber: 89,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex-1 min-w-0",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-1",
                                children: "Plazo Fijo"
                            }, void 0, false, {
                                fileName: "[project]/src/app/(dashboard)/clientes/pf/[pfId]/page.tsx",
                                lineNumber: 93,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                                className: "text-3xl font-black text-slate-900 tracking-tight truncate",
                                children: pf.Cliente.nombre
                            }, void 0, false, {
                                fileName: "[project]/src/app/(dashboard)/clientes/pf/[pfId]/page.tsx",
                                lineNumber: 94,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex items-center gap-2 mt-1",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "text-[11px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md uppercase tracking-wider",
                                        children: pf.moneda
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/(dashboard)/clientes/pf/[pfId]/page.tsx",
                                        lineNumber: 98,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: `text-[9px] font-black px-2.5 py-1 rounded-md uppercase tracking-widest shadow-sm ${ESTADO_BADGE[pf.estado] ?? "bg-slate-100 text-slate-400"}`,
                                        children: pf.estado
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/(dashboard)/clientes/pf/[pfId]/page.tsx",
                                        lineNumber: 101,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/(dashboard)/clientes/pf/[pfId]/page.tsx",
                                lineNumber: 97,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/app/(dashboard)/clientes/pf/[pfId]/page.tsx",
                        lineNumber: 92,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "text-right pl-6 border-l border-slate-100 shrink-0",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-1",
                                children: "Saldo actual"
                            }, void 0, false, {
                                fileName: "[project]/src/app/(dashboard)/clientes/pf/[pfId]/page.tsx",
                                lineNumber: 107,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-3xl font-black text-emerald-700 tabular-nums tracking-tight",
                                children: fmt(saldoActual)
                            }, void 0, false, {
                                fileName: "[project]/src/app/(dashboard)/clientes/pf/[pfId]/page.tsx",
                                lineNumber: 108,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-[10px] text-slate-400 mt-0.5",
                                children: [
                                    "Capital inicial: ",
                                    fmt(capital)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/(dashboard)/clientes/pf/[pfId]/page.tsx",
                                lineNumber: 109,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/app/(dashboard)/clientes/pf/[pfId]/page.tsx",
                        lineNumber: 106,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/app/(dashboard)/clientes/pf/[pfId]/page.tsx",
                lineNumber: 88,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "grid grid-cols-2 lg:grid-cols-4 gap-4",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "bg-white rounded-xl border border-slate-200 border-t-[3px] border-t-emerald-400 shadow-sm p-5 flex flex-col gap-2",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex items-center gap-1.5 text-slate-500",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$target$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__default__as__Target$3e$__["Target"], {
                                        size: 13,
                                        className: "text-emerald-500"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/(dashboard)/clientes/pf/[pfId]/page.tsx",
                                        lineNumber: 117,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "text-[11px] font-bold uppercase tracking-widest",
                                        children: "Saldo actual"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/(dashboard)/clientes/pf/[pfId]/page.tsx",
                                        lineNumber: 118,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/(dashboard)/clientes/pf/[pfId]/page.tsx",
                                lineNumber: 116,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-2xl font-black text-emerald-700 tabular-nums",
                                children: fmt(saldoActual)
                            }, void 0, false, {
                                fileName: "[project]/src/app/(dashboard)/clientes/pf/[pfId]/page.tsx",
                                lineNumber: 120,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-[11px] text-slate-400",
                                children: [
                                    "Capital inicial: ",
                                    fmt(capital),
                                    " ",
                                    pf.moneda
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/(dashboard)/clientes/pf/[pfId]/page.tsx",
                                lineNumber: 121,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/app/(dashboard)/clientes/pf/[pfId]/page.tsx",
                        lineNumber: 115,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "bg-white rounded-xl border border-slate-200 border-t-[3px] border-t-blue-400 shadow-sm p-5 flex flex-col gap-2",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex items-center gap-1.5 text-slate-500",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$trending$2d$up$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__default__as__TrendingUp$3e$__["TrendingUp"], {
                                        size: 13,
                                        className: "text-blue-500"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/(dashboard)/clientes/pf/[pfId]/page.tsx",
                                        lineNumber: 126,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "text-[11px] font-bold uppercase tracking-widest",
                                        children: "Tasa anual"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/(dashboard)/clientes/pf/[pfId]/page.tsx",
                                        lineNumber: 127,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/(dashboard)/clientes/pf/[pfId]/page.tsx",
                                lineNumber: 125,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-2xl font-black text-blue-600 tabular-nums",
                                children: [
                                    fmt(tasa),
                                    "%"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/(dashboard)/clientes/pf/[pfId]/page.tsx",
                                lineNumber: 129,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-[11px] text-slate-400",
                                children: "TNA"
                            }, void 0, false, {
                                fileName: "[project]/src/app/(dashboard)/clientes/pf/[pfId]/page.tsx",
                                lineNumber: 130,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/app/(dashboard)/clientes/pf/[pfId]/page.tsx",
                        lineNumber: 124,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "bg-white rounded-xl border border-slate-200 border-t-[3px] border-t-slate-300 shadow-sm p-5 flex flex-col gap-2",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex items-center gap-1.5 text-slate-500",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$calendar$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__default__as__Calendar$3e$__["Calendar"], {
                                        size: 13
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/(dashboard)/clientes/pf/[pfId]/page.tsx",
                                        lineNumber: 135,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "text-[11px] font-bold uppercase tracking-widest",
                                        children: "Inicio"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/(dashboard)/clientes/pf/[pfId]/page.tsx",
                                        lineNumber: 136,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/(dashboard)/clientes/pf/[pfId]/page.tsx",
                                lineNumber: 134,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-xl font-black text-slate-900",
                                children: fmtFecha(pf.fechaInicio)
                            }, void 0, false, {
                                fileName: "[project]/src/app/(dashboard)/clientes/pf/[pfId]/page.tsx",
                                lineNumber: 138,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-[11px] text-slate-400",
                                children: [
                                    plazo,
                                    " días de plazo"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/(dashboard)/clientes/pf/[pfId]/page.tsx",
                                lineNumber: 139,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/app/(dashboard)/clientes/pf/[pfId]/page.tsx",
                        lineNumber: 133,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "bg-white rounded-xl border border-slate-200 border-t-[3px] border-t-amber-400 shadow-sm p-5 flex flex-col gap-2",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex items-center gap-1.5 text-slate-500",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$clock$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__default__as__Clock$3e$__["Clock"], {
                                        size: 13,
                                        className: "text-amber-500"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/(dashboard)/clientes/pf/[pfId]/page.tsx",
                                        lineNumber: 144,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "text-[11px] font-bold uppercase tracking-widest",
                                        children: "Vencimiento"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/(dashboard)/clientes/pf/[pfId]/page.tsx",
                                        lineNumber: 145,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/(dashboard)/clientes/pf/[pfId]/page.tsx",
                                lineNumber: 143,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-xl font-black text-slate-900",
                                children: fmtFecha(pf.fechaVencimiento)
                            }, void 0, false, {
                                fileName: "[project]/src/app/(dashboard)/clientes/pf/[pfId]/page.tsx",
                                lineNumber: 147,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: `text-[11px] font-bold ${diasHastaVenc < 0 ? "text-red-500" : diasHastaVenc <= 7 ? "text-amber-600" : "text-slate-400"}`,
                                children: diasHastaVenc < 0 ? `Vencido hace ${Math.abs(diasHastaVenc)}d` : diasHastaVenc === 0 ? "Vence hoy" : `Faltan ${diasHastaVenc}d`
                            }, void 0, false, {
                                fileName: "[project]/src/app/(dashboard)/clientes/pf/[pfId]/page.tsx",
                                lineNumber: 148,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/app/(dashboard)/clientes/pf/[pfId]/page.tsx",
                        lineNumber: 142,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/app/(dashboard)/clientes/pf/[pfId]/page.tsx",
                lineNumber: 114,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                className: "bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "px-6 py-4 border-b border-slate-100",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                            className: "text-[12px] font-bold uppercase tracking-widest text-slate-800",
                            children: "Resumen de rendimiento"
                        }, void 0, false, {
                            fileName: "[project]/src/app/(dashboard)/clientes/pf/[pfId]/page.tsx",
                            lineNumber: 161,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/src/app/(dashboard)/clientes/pf/[pfId]/page.tsx",
                        lineNumber: 160,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "px-6 py-5 flex flex-wrap gap-8",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1",
                                        children: "Capital inicial"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/(dashboard)/clientes/pf/[pfId]/page.tsx",
                                        lineNumber: 165,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "text-xl font-black text-slate-900 tabular-nums",
                                        children: [
                                            pf.moneda,
                                            " ",
                                            fmt(capital)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/app/(dashboard)/clientes/pf/[pfId]/page.tsx",
                                        lineNumber: 166,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/(dashboard)/clientes/pf/[pfId]/page.tsx",
                                lineNumber: 164,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1",
                                        children: "Tasa × Plazo"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/(dashboard)/clientes/pf/[pfId]/page.tsx",
                                        lineNumber: 169,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "text-xl font-black text-slate-700 tabular-nums",
                                        children: [
                                            fmt(tasa),
                                            "% × ",
                                            plazo,
                                            "d / 365"
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/app/(dashboard)/clientes/pf/[pfId]/page.tsx",
                                        lineNumber: 170,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/(dashboard)/clientes/pf/[pfId]/page.tsx",
                                lineNumber: 168,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "text-[10px] font-bold uppercase tracking-widest text-emerald-500 mb-1",
                                        children: "Interés estimado"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/(dashboard)/clientes/pf/[pfId]/page.tsx",
                                        lineNumber: 173,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "text-2xl font-black text-emerald-600 tabular-nums",
                                        children: [
                                            pf.moneda,
                                            " ",
                                            fmt(interesEst)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/app/(dashboard)/clientes/pf/[pfId]/page.tsx",
                                        lineNumber: 174,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/(dashboard)/clientes/pf/[pfId]/page.tsx",
                                lineNumber: 172,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "text-[10px] font-bold uppercase tracking-widest text-blue-500 mb-1",
                                        children: "Saldo actual registrado"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/(dashboard)/clientes/pf/[pfId]/page.tsx",
                                        lineNumber: 177,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "text-2xl font-black text-blue-700 tabular-nums",
                                        children: [
                                            pf.moneda,
                                            " ",
                                            fmt(saldoActual)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/app/(dashboard)/clientes/pf/[pfId]/page.tsx",
                                        lineNumber: 178,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/(dashboard)/clientes/pf/[pfId]/page.tsx",
                                lineNumber: 176,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/app/(dashboard)/clientes/pf/[pfId]/page.tsx",
                        lineNumber: 163,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "px-6 pb-4 text-[10px] text-slate-400 italic",
                        children: "Interés estimado: capital × tasa/100 × días/365. Saldo actual: valor real registrado (puede diferir por capitalización o ajustes)."
                    }, void 0, false, {
                        fileName: "[project]/src/app/(dashboard)/clientes/pf/[pfId]/page.tsx",
                        lineNumber: 181,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/app/(dashboard)/clientes/pf/[pfId]/page.tsx",
                lineNumber: 159,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                className: "bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "px-6 py-4 border-b border-slate-100 flex items-center justify-between",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                className: "text-[12px] font-bold uppercase tracking-widest text-slate-800",
                                children: "Detalle mensual de intereses"
                            }, void 0, false, {
                                fileName: "[project]/src/app/(dashboard)/clientes/pf/[pfId]/page.tsx",
                                lineNumber: 189,
                                columnNumber: 11
                            }, this),
                            movimientos.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "text-[11px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md tabular-nums",
                                children: [
                                    movimientos.length,
                                    " movimientos"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/(dashboard)/clientes/pf/[pfId]/page.tsx",
                                lineNumber: 191,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/app/(dashboard)/clientes/pf/[pfId]/page.tsx",
                        lineNumber: 188,
                        columnNumber: 9
                    }, this),
                    movimientos.length === 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "px-6 py-5",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            className: "text-xs text-slate-400 italic",
                            children: "No hay detalle mensual importado para este PF."
                        }, void 0, false, {
                            fileName: "[project]/src/app/(dashboard)/clientes/pf/[pfId]/page.tsx",
                            lineNumber: 198,
                            columnNumber: 13
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/src/app/(dashboard)/clientes/pf/[pfId]/page.tsx",
                        lineNumber: 197,
                        columnNumber: 11
                    }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "overflow-x-auto",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("table", {
                            className: "w-full text-left border-collapse min-w-[560px]",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("thead", {
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                                        className: "border-b border-slate-100 bg-slate-50/60",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                className: "px-6 py-3 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]",
                                                children: "Fecha"
                                            }, void 0, false, {
                                                fileName: "[project]/src/app/(dashboard)/clientes/pf/[pfId]/page.tsx",
                                                lineNumber: 205,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                className: "px-6 py-3 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]",
                                                children: "Descripción"
                                            }, void 0, false, {
                                                fileName: "[project]/src/app/(dashboard)/clientes/pf/[pfId]/page.tsx",
                                                lineNumber: 206,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                className: "px-6 py-3 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] text-right",
                                                children: "Ingreso"
                                            }, void 0, false, {
                                                fileName: "[project]/src/app/(dashboard)/clientes/pf/[pfId]/page.tsx",
                                                lineNumber: 207,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                className: "px-6 py-3 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] text-right",
                                                children: "Egreso"
                                            }, void 0, false, {
                                                fileName: "[project]/src/app/(dashboard)/clientes/pf/[pfId]/page.tsx",
                                                lineNumber: 208,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                className: "px-6 py-3 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] text-right",
                                                children: "Saldo acum."
                                            }, void 0, false, {
                                                fileName: "[project]/src/app/(dashboard)/clientes/pf/[pfId]/page.tsx",
                                                lineNumber: 209,
                                                columnNumber: 19
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/app/(dashboard)/clientes/pf/[pfId]/page.tsx",
                                        lineNumber: 204,
                                        columnNumber: 17
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/src/app/(dashboard)/clientes/pf/[pfId]/page.tsx",
                                    lineNumber: 203,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("tbody", {
                                    className: "divide-y divide-slate-50",
                                    children: movimientos.map((m)=>{
                                        const monto = toNum(m.monto);
                                        const saldo = toNum(m.saldoAcumulado);
                                        const isIngreso = m.tipo !== "EGRESO";
                                        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                                            className: "hover:bg-slate-50/60 transition-colors",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                    className: "px-6 py-3 text-[12px] font-medium text-slate-400 whitespace-nowrap",
                                                    children: fmtFecha(m.fecha)
                                                }, void 0, false, {
                                                    fileName: "[project]/src/app/(dashboard)/clientes/pf/[pfId]/page.tsx",
                                                    lineNumber: 219,
                                                    columnNumber: 23
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                    className: "px-6 py-3",
                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "flex flex-col gap-0.5",
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                className: "text-[13px] font-bold text-slate-700",
                                                                children: m.descripcion ?? "—"
                                                            }, void 0, false, {
                                                                fileName: "[project]/src/app/(dashboard)/clientes/pf/[pfId]/page.tsx",
                                                                lineNumber: 224,
                                                                columnNumber: 27
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                className: `text-[9px] font-black uppercase tracking-widest ${TIPO_BADGE[m.tipo] ?? "text-slate-400"}`,
                                                                children: m.tipo
                                                            }, void 0, false, {
                                                                fileName: "[project]/src/app/(dashboard)/clientes/pf/[pfId]/page.tsx",
                                                                lineNumber: 225,
                                                                columnNumber: 27
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/src/app/(dashboard)/clientes/pf/[pfId]/page.tsx",
                                                        lineNumber: 223,
                                                        columnNumber: 25
                                                    }, this)
                                                }, void 0, false, {
                                                    fileName: "[project]/src/app/(dashboard)/clientes/pf/[pfId]/page.tsx",
                                                    lineNumber: 222,
                                                    columnNumber: 23
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                    className: "px-6 py-3 text-[13px] font-black text-right tabular-nums text-emerald-600",
                                                    children: isIngreso ? fmt(monto) : ""
                                                }, void 0, false, {
                                                    fileName: "[project]/src/app/(dashboard)/clientes/pf/[pfId]/page.tsx",
                                                    lineNumber: 230,
                                                    columnNumber: 23
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                    className: "px-6 py-3 text-[13px] font-black text-right tabular-nums text-red-500",
                                                    children: !isIngreso ? fmt(monto) : ""
                                                }, void 0, false, {
                                                    fileName: "[project]/src/app/(dashboard)/clientes/pf/[pfId]/page.tsx",
                                                    lineNumber: 233,
                                                    columnNumber: 23
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                    className: `px-6 py-3 text-[13px] font-black text-right tabular-nums tracking-tight ${saldo < 0 ? "text-red-600" : "text-slate-900"}`,
                                                    children: fmt(saldo)
                                                }, void 0, false, {
                                                    fileName: "[project]/src/app/(dashboard)/clientes/pf/[pfId]/page.tsx",
                                                    lineNumber: 236,
                                                    columnNumber: 23
                                                }, this)
                                            ]
                                        }, m.id, true, {
                                            fileName: "[project]/src/app/(dashboard)/clientes/pf/[pfId]/page.tsx",
                                            lineNumber: 218,
                                            columnNumber: 21
                                        }, this);
                                    })
                                }, void 0, false, {
                                    fileName: "[project]/src/app/(dashboard)/clientes/pf/[pfId]/page.tsx",
                                    lineNumber: 212,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/app/(dashboard)/clientes/pf/[pfId]/page.tsx",
                            lineNumber: 202,
                            columnNumber: 13
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/src/app/(dashboard)/clientes/pf/[pfId]/page.tsx",
                        lineNumber: 201,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/app/(dashboard)/clientes/pf/[pfId]/page.tsx",
                lineNumber: 187,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$modules$2f$clientes$2f$EditarPFForm$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["EditarPFForm"], {
                pfId: pfId,
                clienteId: clienteId,
                capital: capital,
                tasaAnual: tasa,
                fechaInicio: fechaInicioISO,
                fechaVencimiento: fechaVencimientoISO,
                saldoActual: saldoActual,
                estado: pf.estado
            }, void 0, false, {
                fileName: "[project]/src/app/(dashboard)/clientes/pf/[pfId]/page.tsx",
                lineNumber: 249,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/app/(dashboard)/clientes/pf/[pfId]/page.tsx",
        lineNumber: 76,
        columnNumber: 5
    }, this);
}
}}),
"[project]/src/app/(dashboard)/clientes/pf/[pfId]/page.tsx [app-rsc] (ecmascript, Next.js server component)": ((__turbopack_context__) => {

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.n(__turbopack_context__.i("[project]/src/app/(dashboard)/clientes/pf/[pfId]/page.tsx [app-rsc] (ecmascript)"));
}}),

};

//# sourceMappingURL=%5Broot-of-the-server%5D__08a0eef0._.js.map