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
"[project]/.next-internal/server/app/(dashboard)/clientes/[id]/page/actions.js { ACTIONS_MODULE0 => \"[project]/src/components/layout/Topbar.tsx [app-rsc] (ecmascript)\", ACTIONS_MODULE1 => \"[project]/src/app/(dashboard)/clientes/actions.ts [app-rsc] (ecmascript)\" } [app-rsc] (server actions loader, ecmascript) <locals>": ((__turbopack_context__) => {
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
;
;
;
;
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, false);}),
"[project]/.next-internal/server/app/(dashboard)/clientes/[id]/page/actions.js { ACTIONS_MODULE0 => \"[project]/src/components/layout/Topbar.tsx [app-rsc] (ecmascript)\", ACTIONS_MODULE1 => \"[project]/src/app/(dashboard)/clientes/actions.ts [app-rsc] (ecmascript)\" } [app-rsc] (server actions loader, ecmascript) <module evaluation>": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname, a: __turbopack_async_module__ } = __turbopack_context__;
__turbopack_async_module__(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {
__turbopack_context__.s({});
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$layout$2f$Topbar$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/layout/Topbar.tsx [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f28$dashboard$292f$clientes$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/app/(dashboard)/clientes/actions.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f2e$next$2d$internal$2f$server$2f$app$2f28$dashboard$292f$clientes$2f5b$id$5d2f$page$2f$actions$2e$js__$7b$__ACTIONS_MODULE0__$3d3e$__$225b$project$5d2f$src$2f$components$2f$layout$2f$Topbar$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29222c$__ACTIONS_MODULE1__$3d3e$__$225b$project$5d2f$src$2f$app$2f28$dashboard$292f$clientes$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$2922$__$7d$__$5b$app$2d$rsc$5d$__$28$server__actions__loader$2c$__ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i('[project]/.next-internal/server/app/(dashboard)/clientes/[id]/page/actions.js { ACTIONS_MODULE0 => "[project]/src/components/layout/Topbar.tsx [app-rsc] (ecmascript)", ACTIONS_MODULE1 => "[project]/src/app/(dashboard)/clientes/actions.ts [app-rsc] (ecmascript)" } [app-rsc] (server actions loader, ecmascript) <locals>');
var __turbopack_async_dependencies__ = __turbopack_handle_async_dependencies__([
    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f28$dashboard$292f$clientes$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__,
    __TURBOPACK__imported__module__$5b$project$5d2f2e$next$2d$internal$2f$server$2f$app$2f28$dashboard$292f$clientes$2f5b$id$5d2f$page$2f$actions$2e$js__$7b$__ACTIONS_MODULE0__$3d3e$__$225b$project$5d2f$src$2f$components$2f$layout$2f$Topbar$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29222c$__ACTIONS_MODULE1__$3d3e$__$225b$project$5d2f$src$2f$app$2f28$dashboard$292f$clientes$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$2922$__$7d$__$5b$app$2d$rsc$5d$__$28$server__actions__loader$2c$__ecmascript$29$__$3c$locals$3e$__
]);
([__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f28$dashboard$292f$clientes$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__, __TURBOPACK__imported__module__$5b$project$5d2f2e$next$2d$internal$2f$server$2f$app$2f28$dashboard$292f$clientes$2f5b$id$5d2f$page$2f$actions$2e$js__$7b$__ACTIONS_MODULE0__$3d3e$__$225b$project$5d2f$src$2f$components$2f$layout$2f$Topbar$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29222c$__ACTIONS_MODULE1__$3d3e$__$225b$project$5d2f$src$2f$app$2f28$dashboard$292f$clientes$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$2922$__$7d$__$5b$app$2d$rsc$5d$__$28$server__actions__loader$2c$__ecmascript$29$__$3c$locals$3e$__] = __turbopack_async_dependencies__.then ? (await __turbopack_async_dependencies__)() : __turbopack_async_dependencies__);
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, false);}),
"[project]/.next-internal/server/app/(dashboard)/clientes/[id]/page/actions.js { ACTIONS_MODULE0 => \"[project]/src/components/layout/Topbar.tsx [app-rsc] (ecmascript)\", ACTIONS_MODULE1 => \"[project]/src/app/(dashboard)/clientes/actions.ts [app-rsc] (ecmascript)\" } [app-rsc] (server actions loader, ecmascript) <exports>": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname, a: __turbopack_async_module__ } = __turbopack_context__;
__turbopack_async_module__(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {
__turbopack_context__.s({
    "0011ff4319847fa321c161740d2e30453828714a2e": (()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$layout$2f$Topbar$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["$$RSC_SERVER_ACTION_0"]),
    "6027f3939de1643fde27e4fac73b02a76bbb3c3181": (()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f28$dashboard$292f$clientes$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["darDeBajaCliente"]),
    "603f13fe685d9aa3186ad4542463121b906bdccf2a": (()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f28$dashboard$292f$clientes$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["eliminarCliente"]),
    "605c1c4a375b322407e4ac55aac3d23c96ab231321": (()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f28$dashboard$292f$clientes$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["eliminarClienteConDatos"]),
    "60642c7ba8d2b9604b3047b4cf3f94a8f344263f1a": (()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f28$dashboard$292f$clientes$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["crearCuentaCorriente"]),
    "606c11c70eca808e4d5c70681ea9705ffa0d43f872": (()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f28$dashboard$292f$clientes$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["crearPlazoFijoSimple"])
});
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$layout$2f$Topbar$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/layout/Topbar.tsx [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f28$dashboard$292f$clientes$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/app/(dashboard)/clientes/actions.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f2e$next$2d$internal$2f$server$2f$app$2f28$dashboard$292f$clientes$2f5b$id$5d2f$page$2f$actions$2e$js__$7b$__ACTIONS_MODULE0__$3d3e$__$225b$project$5d2f$src$2f$components$2f$layout$2f$Topbar$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29222c$__ACTIONS_MODULE1__$3d3e$__$225b$project$5d2f$src$2f$app$2f28$dashboard$292f$clientes$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$2922$__$7d$__$5b$app$2d$rsc$5d$__$28$server__actions__loader$2c$__ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i('[project]/.next-internal/server/app/(dashboard)/clientes/[id]/page/actions.js { ACTIONS_MODULE0 => "[project]/src/components/layout/Topbar.tsx [app-rsc] (ecmascript)", ACTIONS_MODULE1 => "[project]/src/app/(dashboard)/clientes/actions.ts [app-rsc] (ecmascript)" } [app-rsc] (server actions loader, ecmascript) <locals>');
var __turbopack_async_dependencies__ = __turbopack_handle_async_dependencies__([
    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f28$dashboard$292f$clientes$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__,
    __TURBOPACK__imported__module__$5b$project$5d2f2e$next$2d$internal$2f$server$2f$app$2f28$dashboard$292f$clientes$2f5b$id$5d2f$page$2f$actions$2e$js__$7b$__ACTIONS_MODULE0__$3d3e$__$225b$project$5d2f$src$2f$components$2f$layout$2f$Topbar$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29222c$__ACTIONS_MODULE1__$3d3e$__$225b$project$5d2f$src$2f$app$2f28$dashboard$292f$clientes$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$2922$__$7d$__$5b$app$2d$rsc$5d$__$28$server__actions__loader$2c$__ecmascript$29$__$3c$locals$3e$__
]);
([__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f28$dashboard$292f$clientes$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__, __TURBOPACK__imported__module__$5b$project$5d2f2e$next$2d$internal$2f$server$2f$app$2f28$dashboard$292f$clientes$2f5b$id$5d2f$page$2f$actions$2e$js__$7b$__ACTIONS_MODULE0__$3d3e$__$225b$project$5d2f$src$2f$components$2f$layout$2f$Topbar$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29222c$__ACTIONS_MODULE1__$3d3e$__$225b$project$5d2f$src$2f$app$2f28$dashboard$292f$clientes$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$2922$__$7d$__$5b$app$2d$rsc$5d$__$28$server__actions__loader$2c$__ecmascript$29$__$3c$locals$3e$__] = __turbopack_async_dependencies__.then ? (await __turbopack_async_dependencies__)() : __turbopack_async_dependencies__);
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, false);}),
"[project]/.next-internal/server/app/(dashboard)/clientes/[id]/page/actions.js { ACTIONS_MODULE0 => \"[project]/src/components/layout/Topbar.tsx [app-rsc] (ecmascript)\", ACTIONS_MODULE1 => \"[project]/src/app/(dashboard)/clientes/actions.ts [app-rsc] (ecmascript)\" } [app-rsc] (server actions loader, ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname, a: __turbopack_async_module__ } = __turbopack_context__;
__turbopack_async_module__(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {
__turbopack_context__.s({
    "0011ff4319847fa321c161740d2e30453828714a2e": (()=>__TURBOPACK__imported__module__$5b$project$5d2f2e$next$2d$internal$2f$server$2f$app$2f28$dashboard$292f$clientes$2f5b$id$5d2f$page$2f$actions$2e$js__$7b$__ACTIONS_MODULE0__$3d3e$__$225b$project$5d2f$src$2f$components$2f$layout$2f$Topbar$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29222c$__ACTIONS_MODULE1__$3d3e$__$225b$project$5d2f$src$2f$app$2f28$dashboard$292f$clientes$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$2922$__$7d$__$5b$app$2d$rsc$5d$__$28$server__actions__loader$2c$__ecmascript$29$__$3c$exports$3e$__["0011ff4319847fa321c161740d2e30453828714a2e"]),
    "6027f3939de1643fde27e4fac73b02a76bbb3c3181": (()=>__TURBOPACK__imported__module__$5b$project$5d2f2e$next$2d$internal$2f$server$2f$app$2f28$dashboard$292f$clientes$2f5b$id$5d2f$page$2f$actions$2e$js__$7b$__ACTIONS_MODULE0__$3d3e$__$225b$project$5d2f$src$2f$components$2f$layout$2f$Topbar$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29222c$__ACTIONS_MODULE1__$3d3e$__$225b$project$5d2f$src$2f$app$2f28$dashboard$292f$clientes$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$2922$__$7d$__$5b$app$2d$rsc$5d$__$28$server__actions__loader$2c$__ecmascript$29$__$3c$exports$3e$__["6027f3939de1643fde27e4fac73b02a76bbb3c3181"]),
    "603f13fe685d9aa3186ad4542463121b906bdccf2a": (()=>__TURBOPACK__imported__module__$5b$project$5d2f2e$next$2d$internal$2f$server$2f$app$2f28$dashboard$292f$clientes$2f5b$id$5d2f$page$2f$actions$2e$js__$7b$__ACTIONS_MODULE0__$3d3e$__$225b$project$5d2f$src$2f$components$2f$layout$2f$Topbar$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29222c$__ACTIONS_MODULE1__$3d3e$__$225b$project$5d2f$src$2f$app$2f28$dashboard$292f$clientes$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$2922$__$7d$__$5b$app$2d$rsc$5d$__$28$server__actions__loader$2c$__ecmascript$29$__$3c$exports$3e$__["603f13fe685d9aa3186ad4542463121b906bdccf2a"]),
    "605c1c4a375b322407e4ac55aac3d23c96ab231321": (()=>__TURBOPACK__imported__module__$5b$project$5d2f2e$next$2d$internal$2f$server$2f$app$2f28$dashboard$292f$clientes$2f5b$id$5d2f$page$2f$actions$2e$js__$7b$__ACTIONS_MODULE0__$3d3e$__$225b$project$5d2f$src$2f$components$2f$layout$2f$Topbar$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29222c$__ACTIONS_MODULE1__$3d3e$__$225b$project$5d2f$src$2f$app$2f28$dashboard$292f$clientes$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$2922$__$7d$__$5b$app$2d$rsc$5d$__$28$server__actions__loader$2c$__ecmascript$29$__$3c$exports$3e$__["605c1c4a375b322407e4ac55aac3d23c96ab231321"]),
    "60642c7ba8d2b9604b3047b4cf3f94a8f344263f1a": (()=>__TURBOPACK__imported__module__$5b$project$5d2f2e$next$2d$internal$2f$server$2f$app$2f28$dashboard$292f$clientes$2f5b$id$5d2f$page$2f$actions$2e$js__$7b$__ACTIONS_MODULE0__$3d3e$__$225b$project$5d2f$src$2f$components$2f$layout$2f$Topbar$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29222c$__ACTIONS_MODULE1__$3d3e$__$225b$project$5d2f$src$2f$app$2f28$dashboard$292f$clientes$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$2922$__$7d$__$5b$app$2d$rsc$5d$__$28$server__actions__loader$2c$__ecmascript$29$__$3c$exports$3e$__["60642c7ba8d2b9604b3047b4cf3f94a8f344263f1a"]),
    "606c11c70eca808e4d5c70681ea9705ffa0d43f872": (()=>__TURBOPACK__imported__module__$5b$project$5d2f2e$next$2d$internal$2f$server$2f$app$2f28$dashboard$292f$clientes$2f5b$id$5d2f$page$2f$actions$2e$js__$7b$__ACTIONS_MODULE0__$3d3e$__$225b$project$5d2f$src$2f$components$2f$layout$2f$Topbar$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29222c$__ACTIONS_MODULE1__$3d3e$__$225b$project$5d2f$src$2f$app$2f28$dashboard$292f$clientes$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$2922$__$7d$__$5b$app$2d$rsc$5d$__$28$server__actions__loader$2c$__ecmascript$29$__$3c$exports$3e$__["606c11c70eca808e4d5c70681ea9705ffa0d43f872"])
});
var __TURBOPACK__imported__module__$5b$project$5d2f2e$next$2d$internal$2f$server$2f$app$2f28$dashboard$292f$clientes$2f5b$id$5d2f$page$2f$actions$2e$js__$7b$__ACTIONS_MODULE0__$3d3e$__$225b$project$5d2f$src$2f$components$2f$layout$2f$Topbar$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29222c$__ACTIONS_MODULE1__$3d3e$__$225b$project$5d2f$src$2f$app$2f28$dashboard$292f$clientes$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$2922$__$7d$__$5b$app$2d$rsc$5d$__$28$server__actions__loader$2c$__ecmascript$29$__$3c$module__evaluation$3e$__ = __turbopack_context__.i('[project]/.next-internal/server/app/(dashboard)/clientes/[id]/page/actions.js { ACTIONS_MODULE0 => "[project]/src/components/layout/Topbar.tsx [app-rsc] (ecmascript)", ACTIONS_MODULE1 => "[project]/src/app/(dashboard)/clientes/actions.ts [app-rsc] (ecmascript)" } [app-rsc] (server actions loader, ecmascript) <module evaluation>');
var __TURBOPACK__imported__module__$5b$project$5d2f2e$next$2d$internal$2f$server$2f$app$2f28$dashboard$292f$clientes$2f5b$id$5d2f$page$2f$actions$2e$js__$7b$__ACTIONS_MODULE0__$3d3e$__$225b$project$5d2f$src$2f$components$2f$layout$2f$Topbar$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29222c$__ACTIONS_MODULE1__$3d3e$__$225b$project$5d2f$src$2f$app$2f28$dashboard$292f$clientes$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$2922$__$7d$__$5b$app$2d$rsc$5d$__$28$server__actions__loader$2c$__ecmascript$29$__$3c$exports$3e$__ = __turbopack_context__.i('[project]/.next-internal/server/app/(dashboard)/clientes/[id]/page/actions.js { ACTIONS_MODULE0 => "[project]/src/components/layout/Topbar.tsx [app-rsc] (ecmascript)", ACTIONS_MODULE1 => "[project]/src/app/(dashboard)/clientes/actions.ts [app-rsc] (ecmascript)" } [app-rsc] (server actions loader, ecmascript) <exports>');
var __turbopack_async_dependencies__ = __turbopack_handle_async_dependencies__([
    __TURBOPACK__imported__module__$5b$project$5d2f2e$next$2d$internal$2f$server$2f$app$2f28$dashboard$292f$clientes$2f5b$id$5d2f$page$2f$actions$2e$js__$7b$__ACTIONS_MODULE0__$3d3e$__$225b$project$5d2f$src$2f$components$2f$layout$2f$Topbar$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29222c$__ACTIONS_MODULE1__$3d3e$__$225b$project$5d2f$src$2f$app$2f28$dashboard$292f$clientes$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$2922$__$7d$__$5b$app$2d$rsc$5d$__$28$server__actions__loader$2c$__ecmascript$29$__$3c$module__evaluation$3e$__,
    __TURBOPACK__imported__module__$5b$project$5d2f2e$next$2d$internal$2f$server$2f$app$2f28$dashboard$292f$clientes$2f5b$id$5d2f$page$2f$actions$2e$js__$7b$__ACTIONS_MODULE0__$3d3e$__$225b$project$5d2f$src$2f$components$2f$layout$2f$Topbar$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29222c$__ACTIONS_MODULE1__$3d3e$__$225b$project$5d2f$src$2f$app$2f28$dashboard$292f$clientes$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$2922$__$7d$__$5b$app$2d$rsc$5d$__$28$server__actions__loader$2c$__ecmascript$29$__$3c$exports$3e$__
]);
([__TURBOPACK__imported__module__$5b$project$5d2f2e$next$2d$internal$2f$server$2f$app$2f28$dashboard$292f$clientes$2f5b$id$5d2f$page$2f$actions$2e$js__$7b$__ACTIONS_MODULE0__$3d3e$__$225b$project$5d2f$src$2f$components$2f$layout$2f$Topbar$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29222c$__ACTIONS_MODULE1__$3d3e$__$225b$project$5d2f$src$2f$app$2f28$dashboard$292f$clientes$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$2922$__$7d$__$5b$app$2d$rsc$5d$__$28$server__actions__loader$2c$__ecmascript$29$__$3c$module__evaluation$3e$__, __TURBOPACK__imported__module__$5b$project$5d2f2e$next$2d$internal$2f$server$2f$app$2f28$dashboard$292f$clientes$2f5b$id$5d2f$page$2f$actions$2e$js__$7b$__ACTIONS_MODULE0__$3d3e$__$225b$project$5d2f$src$2f$components$2f$layout$2f$Topbar$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29222c$__ACTIONS_MODULE1__$3d3e$__$225b$project$5d2f$src$2f$app$2f28$dashboard$292f$clientes$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$2922$__$7d$__$5b$app$2d$rsc$5d$__$28$server__actions__loader$2c$__ecmascript$29$__$3c$exports$3e$__] = __turbopack_async_dependencies__.then ? (await __turbopack_async_dependencies__)() : __turbopack_async_dependencies__);
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
"[project]/src/lib/data/cuenta-corriente.ts [app-rsc] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "getClienteById": (()=>getClienteById)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/prisma.ts [app-rsc] (ecmascript)");
;
async function getClienteById(id) {
    const cliente = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].cliente.findUnique({
        where: {
            id
        },
        include: {
            CuentaCorriente: {
                orderBy: {
                    moneda: "asc"
                }
            },
            PlazoFijo: {
                orderBy: {
                    fechaVencimiento: "asc"
                }
            },
            CustodiaCliente: {
                include: {
                    Activo: true
                }
            }
        }
    });
    if (!cliente) return null;
    const operaciones = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].operacionCambio.findMany({
        where: {
            OR: [
                {
                    clienteId: cliente.id
                },
                {
                    clienteNombre: {
                        equals: cliente.nombre,
                        mode: "insensitive"
                    }
                }
            ]
        },
        orderBy: {
            fecha: "desc"
        },
        take: 50
    });
    const pfCapitalMap = {};
    try {
        const pfIds = cliente.PlazoFijo.map((pf)=>pf.id);
        if (pfIds.length > 0) {
            const moves = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].plazoFijoMovimiento.findMany({
                where: {
                    plazoFijoId: {
                        in: pfIds
                    },
                    tipo: {
                        in: [
                            "APERTURA",
                            "CIERRE_RENOV"
                        ]
                    }
                },
                orderBy: [
                    {
                        plazoFijoId: "asc"
                    },
                    {
                        fecha: "desc"
                    }
                ],
                select: {
                    plazoFijoId: true,
                    monto: true
                }
            });
            for (const m of moves){
                if (!(m.plazoFijoId in pfCapitalMap)) {
                    pfCapitalMap[m.plazoFijoId] = Number(m.monto.toString());
                }
            }
        }
    } catch  {
    // stale binary fallback — pages use pf.capital
    }
    return {
        ...cliente,
        operaciones,
        pfCapitalMap
    };
}
}}),
"[project]/src/components/modules/clientes/ClienteFormsClientSlot.tsx (client reference/proxy) <module evaluation>": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "ClienteFormsClientSlot": (()=>ClienteFormsClientSlot)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$server$2d$dom$2d$turbopack$2d$server$2d$edge$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-server-dom-turbopack-server-edge.js [app-rsc] (ecmascript)");
;
const ClienteFormsClientSlot = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$server$2d$dom$2d$turbopack$2d$server$2d$edge$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerClientReference"])(function() {
    throw new Error("Attempted to call ClienteFormsClientSlot() from the server but ClienteFormsClientSlot is on the client. It's not possible to invoke a client function from the server, it can only be rendered as a Component or passed to props of a Client Component.");
}, "[project]/src/components/modules/clientes/ClienteFormsClientSlot.tsx <module evaluation>", "ClienteFormsClientSlot");
}}),
"[project]/src/components/modules/clientes/ClienteFormsClientSlot.tsx (client reference/proxy)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "ClienteFormsClientSlot": (()=>ClienteFormsClientSlot)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$server$2d$dom$2d$turbopack$2d$server$2d$edge$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-server-dom-turbopack-server-edge.js [app-rsc] (ecmascript)");
;
const ClienteFormsClientSlot = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$server$2d$dom$2d$turbopack$2d$server$2d$edge$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerClientReference"])(function() {
    throw new Error("Attempted to call ClienteFormsClientSlot() from the server but ClienteFormsClientSlot is on the client. It's not possible to invoke a client function from the server, it can only be rendered as a Component or passed to props of a Client Component.");
}, "[project]/src/components/modules/clientes/ClienteFormsClientSlot.tsx", "ClienteFormsClientSlot");
}}),
"[project]/src/components/modules/clientes/ClienteFormsClientSlot.tsx [app-rsc] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$modules$2f$clientes$2f$ClienteFormsClientSlot$2e$tsx__$28$client__reference$2f$proxy$29$__$3c$module__evaluation$3e$__ = __turbopack_context__.i("[project]/src/components/modules/clientes/ClienteFormsClientSlot.tsx (client reference/proxy) <module evaluation>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$modules$2f$clientes$2f$ClienteFormsClientSlot$2e$tsx__$28$client__reference$2f$proxy$29$__ = __turbopack_context__.i("[project]/src/components/modules/clientes/ClienteFormsClientSlot.tsx (client reference/proxy)");
;
__turbopack_context__.n(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$modules$2f$clientes$2f$ClienteFormsClientSlot$2e$tsx__$28$client__reference$2f$proxy$29$__);
}}),
"[project]/src/components/modules/clientes/ClienteAdminActions.tsx (client reference/proxy) <module evaluation>": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "ClienteAdminActions": (()=>ClienteAdminActions)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$server$2d$dom$2d$turbopack$2d$server$2d$edge$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-server-dom-turbopack-server-edge.js [app-rsc] (ecmascript)");
;
const ClienteAdminActions = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$server$2d$dom$2d$turbopack$2d$server$2d$edge$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerClientReference"])(function() {
    throw new Error("Attempted to call ClienteAdminActions() from the server but ClienteAdminActions is on the client. It's not possible to invoke a client function from the server, it can only be rendered as a Component or passed to props of a Client Component.");
}, "[project]/src/components/modules/clientes/ClienteAdminActions.tsx <module evaluation>", "ClienteAdminActions");
}}),
"[project]/src/components/modules/clientes/ClienteAdminActions.tsx (client reference/proxy)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "ClienteAdminActions": (()=>ClienteAdminActions)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$server$2d$dom$2d$turbopack$2d$server$2d$edge$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-server-dom-turbopack-server-edge.js [app-rsc] (ecmascript)");
;
const ClienteAdminActions = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$server$2d$dom$2d$turbopack$2d$server$2d$edge$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerClientReference"])(function() {
    throw new Error("Attempted to call ClienteAdminActions() from the server but ClienteAdminActions is on the client. It's not possible to invoke a client function from the server, it can only be rendered as a Component or passed to props of a Client Component.");
}, "[project]/src/components/modules/clientes/ClienteAdminActions.tsx", "ClienteAdminActions");
}}),
"[project]/src/components/modules/clientes/ClienteAdminActions.tsx [app-rsc] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$modules$2f$clientes$2f$ClienteAdminActions$2e$tsx__$28$client__reference$2f$proxy$29$__$3c$module__evaluation$3e$__ = __turbopack_context__.i("[project]/src/components/modules/clientes/ClienteAdminActions.tsx (client reference/proxy) <module evaluation>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$modules$2f$clientes$2f$ClienteAdminActions$2e$tsx__$28$client__reference$2f$proxy$29$__ = __turbopack_context__.i("[project]/src/components/modules/clientes/ClienteAdminActions.tsx (client reference/proxy)");
;
__turbopack_context__.n(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$modules$2f$clientes$2f$ClienteAdminActions$2e$tsx__$28$client__reference$2f$proxy$29$__);
}}),
"[project]/src/components/modules/clientes/VerPFButton.tsx (client reference/proxy) <module evaluation>": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "VerPFButton": (()=>VerPFButton)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$server$2d$dom$2d$turbopack$2d$server$2d$edge$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-server-dom-turbopack-server-edge.js [app-rsc] (ecmascript)");
;
const VerPFButton = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$server$2d$dom$2d$turbopack$2d$server$2d$edge$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerClientReference"])(function() {
    throw new Error("Attempted to call VerPFButton() from the server but VerPFButton is on the client. It's not possible to invoke a client function from the server, it can only be rendered as a Component or passed to props of a Client Component.");
}, "[project]/src/components/modules/clientes/VerPFButton.tsx <module evaluation>", "VerPFButton");
}}),
"[project]/src/components/modules/clientes/VerPFButton.tsx (client reference/proxy)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "VerPFButton": (()=>VerPFButton)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$server$2d$dom$2d$turbopack$2d$server$2d$edge$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-server-dom-turbopack-server-edge.js [app-rsc] (ecmascript)");
;
const VerPFButton = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$server$2d$dom$2d$turbopack$2d$server$2d$edge$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerClientReference"])(function() {
    throw new Error("Attempted to call VerPFButton() from the server but VerPFButton is on the client. It's not possible to invoke a client function from the server, it can only be rendered as a Component or passed to props of a Client Component.");
}, "[project]/src/components/modules/clientes/VerPFButton.tsx", "VerPFButton");
}}),
"[project]/src/components/modules/clientes/VerPFButton.tsx [app-rsc] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$modules$2f$clientes$2f$VerPFButton$2e$tsx__$28$client__reference$2f$proxy$29$__$3c$module__evaluation$3e$__ = __turbopack_context__.i("[project]/src/components/modules/clientes/VerPFButton.tsx (client reference/proxy) <module evaluation>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$modules$2f$clientes$2f$VerPFButton$2e$tsx__$28$client__reference$2f$proxy$29$__ = __turbopack_context__.i("[project]/src/components/modules/clientes/VerPFButton.tsx (client reference/proxy)");
;
__turbopack_context__.n(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$modules$2f$clientes$2f$VerPFButton$2e$tsx__$28$client__reference$2f$proxy$29$__);
}}),
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
"[project]/src/app/(dashboard)/clientes/[id]/page.tsx [app-rsc] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname, a: __turbopack_async_module__ } = __turbopack_context__;
__turbopack_async_module__(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {
__turbopack_context__.s({
    "default": (()=>ClienteDetailPage)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-jsx-dev-runtime.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$auth$2f$permissions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/auth/permissions.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$api$2f$navigation$2e$react$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$module__evaluation$3e$__ = __turbopack_context__.i("[project]/node_modules/next/dist/api/navigation.react-server.js [app-rsc] (ecmascript) <module evaluation>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$components$2f$navigation$2e$react$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/client/components/navigation.react-server.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/client/app-dir/link.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$left$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronLeft$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/chevron-left.js [app-rsc] (ecmascript) <export default as ChevronLeft>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$user$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__default__as__UserCircle$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/circle-user.js [app-rsc] (ecmascript) <export default as UserCircle>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$arrow$2d$right$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__default__as__ArrowRight$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/arrow-right.js [app-rsc] (ecmascript) <export default as ArrowRight>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$banknote$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__default__as__Banknote$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/banknote.js [app-rsc] (ecmascript) <export default as Banknote>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$trending$2d$up$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__default__as__TrendingUp$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/trending-up.js [app-rsc] (ecmascript) <export default as TrendingUp>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chart$2d$no$2d$axes$2d$column$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__default__as__BarChart2$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/chart-no-axes-column.js [app-rsc] (ecmascript) <export default as BarChart2>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$briefcase$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__default__as__Briefcase$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/briefcase.js [app-rsc] (ecmascript) <export default as Briefcase>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$data$2f$cuenta$2d$corriente$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/data/cuenta-corriente.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$modules$2f$clientes$2f$ClienteFormsClientSlot$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/modules/clientes/ClienteFormsClientSlot.tsx [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$modules$2f$clientes$2f$ClienteAdminActions$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/modules/clientes/ClienteAdminActions.tsx [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$modules$2f$clientes$2f$VerPFButton$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/modules/clientes/VerPFButton.tsx [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$services$2f$config$2e$service$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/services/config.service.ts [app-rsc] (ecmascript)");
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
const SOCIOS = new Set([
    "Facu",
    "Fran",
    "Nanu"
]);
const SOCIO_BADGE = {
    Facu: "bg-blue-600 text-white",
    Fran: "bg-emerald-600 text-white",
    Nanu: "bg-violet-600 text-white"
};
function toNum(v) {
    if (v == null) return 0;
    const n = Number(v.toString());
    return isNaN(n) ? 0 : n;
}
function fmt(n) {
    try {
        return toNum(n).toLocaleString("es-AR", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    } catch  {
        return "0,00";
    }
}
function fmtFecha(d) {
    if (!d) return "-";
    try {
        return new Date(d).toLocaleDateString("es-AR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            timeZone: "UTC"
        });
    } catch  {
        return "-";
    }
}
function diasHasta(d) {
    if (!d) return null;
    try {
        const hoy = new Date();
        const a = Date.UTC(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
        const v = new Date(d);
        const b = Date.UTC(v.getFullYear(), v.getMonth(), v.getDate());
        return Math.round((b - a) / 86_400_000);
    } catch  {
        return null;
    }
}
const ESTADO_BADGE = {
    ACTIVO: "bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20",
    VENCIDO: "bg-rose-500/10 text-rose-400 ring-1 ring-rose-500/20",
    CANCELADO: "bg-byg-surface-2 text-byg-muted",
    RENOVADO: "bg-byg-accent/10 text-byg-accent ring-1 ring-byg-accent/20"
};
function EmptyState({ message }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
        className: "px-6 py-3 text-[12px] text-byg-muted italic",
        children: message
    }, void 0, false, {
        fileName: "[project]/src/app/(dashboard)/clientes/[id]/page.tsx",
        lineNumber: 65,
        columnNumber: 10
    }, this);
}
function SectionHeader({ label, count, right }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "px-6 py-4 border-b border-byg-border flex items-center justify-between bg-byg-bg",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex items-center gap-3",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                        className: "text-[12px] font-bold uppercase tracking-widest text-byg-text",
                        children: label
                    }, void 0, false, {
                        fileName: "[project]/src/app/(dashboard)/clientes/[id]/page.tsx",
                        lineNumber: 72,
                        columnNumber: 9
                    }, this),
                    count !== undefined && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "text-[11px] font-bold bg-byg-surface-2 text-byg-muted px-2 py-0.5 rounded-md tabular-nums",
                        children: count
                    }, void 0, false, {
                        fileName: "[project]/src/app/(dashboard)/clientes/[id]/page.tsx",
                        lineNumber: 74,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/app/(dashboard)/clientes/[id]/page.tsx",
                lineNumber: 71,
                columnNumber: 7
            }, this),
            right && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                children: right
            }, void 0, false, {
                fileName: "[project]/src/app/(dashboard)/clientes/[id]/page.tsx",
                lineNumber: 79,
                columnNumber: 17
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/app/(dashboard)/clientes/[id]/page.tsx",
        lineNumber: 70,
        columnNumber: 5
    }, this);
}
async function ClienteDetailPage({ params }) {
    await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$auth$2f$permissions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["requirePermission"])("clientes:leer");
    const { id } = await params;
    const [cliente, deMap] = await Promise.all([
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$data$2f$cuenta$2d$corriente$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getClienteById"])(id),
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$services$2f$config$2e$service$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getClienteDeMap"])()
    ]);
    if (!cliente) (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$components$2f$navigation$2e$react$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["notFound"])();
    const socio = deMap[cliente.nombre] ?? null;
    const isSocio = SOCIOS.has(cliente.nombre);
    const { pfCapitalMap } = cliente;
    const cuentasCorrientes = cliente.CuentaCorriente || [];
    const plazosFijos = cliente.PlazoFijo || [];
    const custodias = cliente.CustodiaCliente || [];
    const operaciones = cliente.operaciones;
    const saldoCC = cuentasCorrientes.reduce((acc, cc)=>acc + toNum(cc.saldo), 0);
    const pfActivos = plazosFijos.filter((pf)=>pf.estado === "ACTIVO");
    const capitalPF = pfActivos.reduce((acc, pf)=>acc + toNum(pf.saldoActual), 0);
    const totalCustodia = custodias.reduce((acc, cu)=>{
        const precio = cu.Activo?.precioActual != null ? toNum(cu.Activo.precioActual) : toNum(cu.precioPromedio);
        return acc + toNum(cu.cantidadTotal) * precio;
    }, 0);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "flex flex-col gap-7",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"], {
                href: "/clientes",
                className: "flex items-center gap-1 text-byg-muted hover:text-byg-accent text-[10px] font-black uppercase tracking-widest transition-colors group w-fit",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$left$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronLeft$3e$__["ChevronLeft"], {
                        size: 13,
                        className: "group-hover:-translate-x-0.5 transition-transform"
                    }, void 0, false, {
                        fileName: "[project]/src/app/(dashboard)/clientes/[id]/page.tsx",
                        lineNumber: 117,
                        columnNumber: 9
                    }, this),
                    "Clientes"
                ]
            }, void 0, true, {
                fileName: "[project]/src/app/(dashboard)/clientes/[id]/page.tsx",
                lineNumber: 113,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("header", {
                className: "flex items-center gap-5 bg-byg-surface p-6 rounded-2xl border border-byg-border relative overflow-hidden",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "absolute top-0 left-0 w-full h-[3px] bg-byg-accent"
                    }, void 0, false, {
                        fileName: "[project]/src/app/(dashboard)/clientes/[id]/page.tsx",
                        lineNumber: 123,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "p-4 bg-byg-bg text-byg-accent rounded-2xl border border-byg-border shrink-0",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$user$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__default__as__UserCircle$3e$__["UserCircle"], {
                            size: 32
                        }, void 0, false, {
                            fileName: "[project]/src/app/(dashboard)/clientes/[id]/page.tsx",
                            lineNumber: 125,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/src/app/(dashboard)/clientes/[id]/page.tsx",
                        lineNumber: 124,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex-1 min-w-0",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex items-center gap-3 mb-1.5",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "text-[10px] font-bold text-byg-accent uppercase tracking-widest",
                                        children: "Cliente 360"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/(dashboard)/clientes/[id]/page.tsx",
                                        lineNumber: 129,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "bg-byg-surface-2 text-byg-muted text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider border border-byg-border",
                                        children: cliente.rol || "CLIENTE"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/(dashboard)/clientes/[id]/page.tsx",
                                        lineNumber: 130,
                                        columnNumber: 13
                                    }, this),
                                    isSocio && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: `text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-widest ${SOCIO_BADGE[cliente.nombre] ?? "bg-byg-surface-2 text-byg-muted"}`,
                                        children: "SOCIO"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/(dashboard)/clientes/[id]/page.tsx",
                                        lineNumber: 134,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: `text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider ${socio ? SOCIO_BADGE[socio] ?? "bg-byg-surface-2 text-byg-muted" : "bg-byg-surface-2 text-byg-muted"}`,
                                        children: [
                                            "Responsable: ",
                                            socio ?? "—"
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/app/(dashboard)/clientes/[id]/page.tsx",
                                        lineNumber: 138,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/(dashboard)/clientes/[id]/page.tsx",
                                lineNumber: 128,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                                className: "text-4xl font-black text-byg-text tracking-tight truncate pb-1",
                                children: cliente.nombre || "Sin nombre"
                            }, void 0, false, {
                                fileName: "[project]/src/app/(dashboard)/clientes/[id]/page.tsx",
                                lineNumber: 142,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex flex-wrap items-center gap-x-4 gap-y-2 mt-1",
                                children: [
                                    cliente.email,
                                    cliente.telefono,
                                    cliente.banco
                                ].filter(Boolean).map((val, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "flex items-center gap-1.5",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "w-1 h-1 rounded-full bg-byg-border-2"
                                            }, void 0, false, {
                                                fileName: "[project]/src/app/(dashboard)/clientes/[id]/page.tsx",
                                                lineNumber: 150,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "text-[13px] font-medium text-byg-muted",
                                                children: val
                                            }, void 0, false, {
                                                fileName: "[project]/src/app/(dashboard)/clientes/[id]/page.tsx",
                                                lineNumber: 151,
                                                columnNumber: 19
                                            }, this)
                                        ]
                                    }, i, true, {
                                        fileName: "[project]/src/app/(dashboard)/clientes/[id]/page.tsx",
                                        lineNumber: 149,
                                        columnNumber: 17
                                    }, this))
                            }, void 0, false, {
                                fileName: "[project]/src/app/(dashboard)/clientes/[id]/page.tsx",
                                lineNumber: 145,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/app/(dashboard)/clientes/[id]/page.tsx",
                        lineNumber: 127,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$modules$2f$clientes$2f$ClienteAdminActions$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["ClienteAdminActions"], {
                        clienteId: cliente.id
                    }, void 0, false, {
                        fileName: "[project]/src/app/(dashboard)/clientes/[id]/page.tsx",
                        lineNumber: 156,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/app/(dashboard)/clientes/[id]/page.tsx",
                lineNumber: 122,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "grid grid-cols-2 lg:grid-cols-4 gap-3",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(Card, {
                        icon: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$banknote$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__default__as__Banknote$3e$__["Banknote"], {
                            size: 15,
                            className: "text-blue-400"
                        }, void 0, false, {
                            fileName: "[project]/src/app/(dashboard)/clientes/[id]/page.tsx",
                            lineNumber: 162,
                            columnNumber: 17
                        }, void 0),
                        label: "Saldo CC",
                        value: fmt(saldoCC),
                        sub: `${cuentasCorrientes.length} cuenta${cuentasCorrientes.length !== 1 ? "s" : ""}`,
                        valueClass: saldoCC < 0 ? "text-rose-400" : "text-byg-text",
                        accent: "blue"
                    }, void 0, false, {
                        fileName: "[project]/src/app/(dashboard)/clientes/[id]/page.tsx",
                        lineNumber: 161,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(Card, {
                        icon: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$trending$2d$up$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__default__as__TrendingUp$3e$__["TrendingUp"], {
                            size: 15,
                            className: "text-green-400"
                        }, void 0, false, {
                            fileName: "[project]/src/app/(dashboard)/clientes/[id]/page.tsx",
                            lineNumber: 170,
                            columnNumber: 17
                        }, void 0),
                        label: "PF activos",
                        value: String(pfActivos.length),
                        sub: `de ${plazosFijos.length} total`,
                        accent: "green"
                    }, void 0, false, {
                        fileName: "[project]/src/app/(dashboard)/clientes/[id]/page.tsx",
                        lineNumber: 169,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(Card, {
                        icon: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chart$2d$no$2d$axes$2d$column$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__default__as__BarChart2$3e$__["BarChart2"], {
                            size: 15,
                            className: "text-emerald-400"
                        }, void 0, false, {
                            fileName: "[project]/src/app/(dashboard)/clientes/[id]/page.tsx",
                            lineNumber: 177,
                            columnNumber: 17
                        }, void 0),
                        label: "Saldo PF",
                        value: fmt(capitalPF),
                        sub: "saldo actual · solo activos",
                        accent: "emerald"
                    }, void 0, false, {
                        fileName: "[project]/src/app/(dashboard)/clientes/[id]/page.tsx",
                        lineNumber: 176,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(Card, {
                        icon: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$briefcase$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__default__as__Briefcase$3e$__["Briefcase"], {
                            size: 15,
                            className: "text-purple-400"
                        }, void 0, false, {
                            fileName: "[project]/src/app/(dashboard)/clientes/[id]/page.tsx",
                            lineNumber: 184,
                            columnNumber: 17
                        }, void 0),
                        label: "Custodia",
                        value: fmt(totalCustodia),
                        sub: `${custodias.length} posición${custodias.length !== 1 ? "es" : ""}`,
                        accent: "purple"
                    }, void 0, false, {
                        fileName: "[project]/src/app/(dashboard)/clientes/[id]/page.tsx",
                        lineNumber: 183,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/app/(dashboard)/clientes/[id]/page.tsx",
                lineNumber: 160,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                className: "bg-byg-surface rounded-xl border border-byg-border overflow-hidden",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(SectionHeader, {
                        label: "Cuentas corrientes",
                        count: cuentasCorrientes.length,
                        right: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$modules$2f$clientes$2f$ClienteFormsClientSlot$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["ClienteFormsClientSlot"], {
                            clienteId: cliente.id
                        }, void 0, false, {
                            fileName: "[project]/src/app/(dashboard)/clientes/[id]/page.tsx",
                            lineNumber: 194,
                            columnNumber: 91
                        }, void 0)
                    }, void 0, false, {
                        fileName: "[project]/src/app/(dashboard)/clientes/[id]/page.tsx",
                        lineNumber: 194,
                        columnNumber: 9
                    }, this),
                    cuentasCorrientes.length === 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(EmptyState, {
                        message: "Sin cuentas corrientes registradas"
                    }, void 0, false, {
                        fileName: "[project]/src/app/(dashboard)/clientes/[id]/page.tsx",
                        lineNumber: 196,
                        columnNumber: 11
                    }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("table", {
                        className: "w-full text-left border-collapse",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("thead", {
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                                    className: "border-b border-byg-border bg-byg-bg",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                            className: "px-6 py-3 text-[10px] font-bold uppercase text-byg-muted tracking-widest",
                                            children: "Moneda"
                                        }, void 0, false, {
                                            fileName: "[project]/src/app/(dashboard)/clientes/[id]/page.tsx",
                                            lineNumber: 201,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                            className: "px-6 py-3 text-[10px] font-bold uppercase text-byg-muted tracking-widest text-right",
                                            children: "Saldo"
                                        }, void 0, false, {
                                            fileName: "[project]/src/app/(dashboard)/clientes/[id]/page.tsx",
                                            lineNumber: 202,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                            className: "px-6 py-3 text-[10px] font-bold uppercase text-byg-muted tracking-widest text-right"
                                        }, void 0, false, {
                                            fileName: "[project]/src/app/(dashboard)/clientes/[id]/page.tsx",
                                            lineNumber: 203,
                                            columnNumber: 17
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/app/(dashboard)/clientes/[id]/page.tsx",
                                    lineNumber: 200,
                                    columnNumber: 15
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/src/app/(dashboard)/clientes/[id]/page.tsx",
                                lineNumber: 199,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("tbody", {
                                className: "divide-y divide-byg-border/40",
                                children: cuentasCorrientes.map((cc)=>{
                                    const saldo = toNum(cc.saldo);
                                    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                                        className: "hover:bg-byg-surface-2 transition-colors group",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                className: "px-6 py-3.5",
                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    className: "text-[11px] font-bold text-byg-text bg-byg-surface-2 px-2.5 py-1 rounded-md tracking-wider border border-byg-border",
                                                    children: cc.moneda || "-"
                                                }, void 0, false, {
                                                    fileName: "[project]/src/app/(dashboard)/clientes/[id]/page.tsx",
                                                    lineNumber: 212,
                                                    columnNumber: 23
                                                }, this)
                                            }, void 0, false, {
                                                fileName: "[project]/src/app/(dashboard)/clientes/[id]/page.tsx",
                                                lineNumber: 211,
                                                columnNumber: 21
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                className: `px-6 py-3.5 text-[15px] text-right tabular-nums font-black font-mono tracking-tight ${saldo < 0 ? "text-rose-400" : "text-byg-text"}`,
                                                children: fmt(saldo)
                                            }, void 0, false, {
                                                fileName: "[project]/src/app/(dashboard)/clientes/[id]/page.tsx",
                                                lineNumber: 216,
                                                columnNumber: 21
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                className: "px-6 py-3.5 text-right",
                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"], {
                                                    href: `/clientes/cc/${cc.id}`,
                                                    className: "inline-flex items-center gap-1 text-[10px] font-black px-2.5 py-1.5 rounded-lg bg-byg-accent text-white hover:bg-blue-500 transition-colors uppercase tracking-wider shadow-sm shadow-blue-600/20",
                                                    children: [
                                                        "Ver ",
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$arrow$2d$right$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__default__as__ArrowRight$3e$__["ArrowRight"], {
                                                            size: 10
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/app/(dashboard)/clientes/[id]/page.tsx",
                                                            lineNumber: 224,
                                                            columnNumber: 29
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/src/app/(dashboard)/clientes/[id]/page.tsx",
                                                    lineNumber: 220,
                                                    columnNumber: 23
                                                }, this)
                                            }, void 0, false, {
                                                fileName: "[project]/src/app/(dashboard)/clientes/[id]/page.tsx",
                                                lineNumber: 219,
                                                columnNumber: 21
                                            }, this)
                                        ]
                                    }, cc.id, true, {
                                        fileName: "[project]/src/app/(dashboard)/clientes/[id]/page.tsx",
                                        lineNumber: 210,
                                        columnNumber: 19
                                    }, this);
                                })
                            }, void 0, false, {
                                fileName: "[project]/src/app/(dashboard)/clientes/[id]/page.tsx",
                                lineNumber: 206,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/app/(dashboard)/clientes/[id]/page.tsx",
                        lineNumber: 198,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/app/(dashboard)/clientes/[id]/page.tsx",
                lineNumber: 193,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                className: "bg-byg-surface rounded-2xl border border-byg-border overflow-hidden flex flex-col relative",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "absolute top-0 left-0 w-1 h-full bg-emerald-500"
                    }, void 0, false, {
                        fileName: "[project]/src/app/(dashboard)/clientes/[id]/page.tsx",
                        lineNumber: 237,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(SectionHeader, {
                        label: "Plazos fijos",
                        count: plazosFijos.length,
                        right: pfActivos.length > 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            className: "text-[10px] font-black text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-md uppercase tracking-wider border border-emerald-500/20",
                            children: [
                                pfActivos.length,
                                " Activo",
                                pfActivos.length !== 1 ? "s" : ""
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/app/(dashboard)/clientes/[id]/page.tsx",
                            lineNumber: 243,
                            columnNumber: 15
                        }, void 0) : undefined
                    }, void 0, false, {
                        fileName: "[project]/src/app/(dashboard)/clientes/[id]/page.tsx",
                        lineNumber: 238,
                        columnNumber: 9
                    }, this),
                    plazosFijos.length === 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(EmptyState, {
                        message: "No hay plazos fijos registrados para este cliente"
                    }, void 0, false, {
                        fileName: "[project]/src/app/(dashboard)/clientes/[id]/page.tsx",
                        lineNumber: 250,
                        columnNumber: 11
                    }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "overflow-x-auto",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("table", {
                            className: "w-full text-left border-collapse min-w-[800px]",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("thead", {
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                                        className: "border-b border-byg-border bg-byg-bg",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                className: "px-6 py-3.5 text-[10px] font-bold uppercase text-byg-muted tracking-widest text-right",
                                                children: "Capital inicial"
                                            }, void 0, false, {
                                                fileName: "[project]/src/app/(dashboard)/clientes/[id]/page.tsx",
                                                lineNumber: 256,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                className: "px-6 py-3.5 text-[10px] font-bold uppercase text-byg-muted tracking-widest text-right",
                                                children: "Saldo actual"
                                            }, void 0, false, {
                                                fileName: "[project]/src/app/(dashboard)/clientes/[id]/page.tsx",
                                                lineNumber: 257,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                className: "px-6 py-3.5 text-[10px] font-bold uppercase text-byg-muted tracking-widest text-right",
                                                children: "Tasa"
                                            }, void 0, false, {
                                                fileName: "[project]/src/app/(dashboard)/clientes/[id]/page.tsx",
                                                lineNumber: 258,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                className: "px-6 py-3.5 text-[10px] font-bold uppercase text-byg-muted tracking-widest",
                                                children: "Inicio"
                                            }, void 0, false, {
                                                fileName: "[project]/src/app/(dashboard)/clientes/[id]/page.tsx",
                                                lineNumber: 259,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                className: "px-6 py-3.5 text-[10px] font-bold uppercase text-byg-muted tracking-widest",
                                                children: "Vencimiento"
                                            }, void 0, false, {
                                                fileName: "[project]/src/app/(dashboard)/clientes/[id]/page.tsx",
                                                lineNumber: 260,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                className: "px-6 py-3.5 text-[10px] font-bold uppercase text-byg-muted tracking-widest text-right",
                                                children: "Días"
                                            }, void 0, false, {
                                                fileName: "[project]/src/app/(dashboard)/clientes/[id]/page.tsx",
                                                lineNumber: 261,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                className: "px-6 py-3.5 text-[10px] font-bold uppercase text-byg-muted tracking-widest text-center",
                                                children: "Estado"
                                            }, void 0, false, {
                                                fileName: "[project]/src/app/(dashboard)/clientes/[id]/page.tsx",
                                                lineNumber: 262,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                className: "px-6 py-3.5 text-[10px] font-bold uppercase text-byg-muted tracking-widest text-right"
                                            }, void 0, false, {
                                                fileName: "[project]/src/app/(dashboard)/clientes/[id]/page.tsx",
                                                lineNumber: 263,
                                                columnNumber: 19
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/app/(dashboard)/clientes/[id]/page.tsx",
                                        lineNumber: 255,
                                        columnNumber: 17
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/src/app/(dashboard)/clientes/[id]/page.tsx",
                                    lineNumber: 254,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("tbody", {
                                    className: "divide-y divide-byg-border/40",
                                    children: plazosFijos.map((pf)=>{
                                        const dias = diasHasta(pf.fechaVencimiento);
                                        const isVencido = pf.estado === "ACTIVO" && dias !== null && dias < 0;
                                        const isUrgent = pf.estado === "ACTIVO" && dias !== null && dias >= 0 && dias <= 7;
                                        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                                            className: `transition-colors group hover:bg-slate-50/80 ${isVencido ? "bg-rose-500/5" : isUrgent ? "bg-amber-500/5" : ""}`,
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                    className: "px-6 py-3.5 text-right tabular-nums whitespace-nowrap",
                                                    children: [
                                                        pf.moneda && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                            className: "text-[11px] font-bold text-byg-muted mr-1",
                                                            children: pf.moneda
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/app/(dashboard)/clientes/[id]/page.tsx",
                                                            lineNumber: 282,
                                                            columnNumber: 27
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                            className: "text-[13px] font-semibold text-byg-muted font-mono",
                                                            children: fmt(pfCapitalMap[pf.id] ?? pf.capital)
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/app/(dashboard)/clientes/[id]/page.tsx",
                                                            lineNumber: 284,
                                                            columnNumber: 25
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/src/app/(dashboard)/clientes/[id]/page.tsx",
                                                    lineNumber: 280,
                                                    columnNumber: 23
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                    className: "px-6 py-3.5 text-right tabular-nums whitespace-nowrap",
                                                    children: [
                                                        pf.moneda && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                            className: "text-[11px] font-bold text-byg-muted mr-1",
                                                            children: pf.moneda
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/app/(dashboard)/clientes/[id]/page.tsx",
                                                            lineNumber: 288,
                                                            columnNumber: 27
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                            className: "text-[15px] font-black text-emerald-400 tracking-tight font-mono",
                                                            children: fmt(pf.saldoActual)
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/app/(dashboard)/clientes/[id]/page.tsx",
                                                            lineNumber: 290,
                                                            columnNumber: 25
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/src/app/(dashboard)/clientes/[id]/page.tsx",
                                                    lineNumber: 286,
                                                    columnNumber: 23
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                    className: "px-6 py-3.5 text-[13px] text-right tabular-nums text-byg-accent font-semibold font-mono",
                                                    children: [
                                                        fmt(pf.tasaAnual),
                                                        "%"
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/src/app/(dashboard)/clientes/[id]/page.tsx",
                                                    lineNumber: 292,
                                                    columnNumber: 23
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                    className: "px-6 py-3.5 text-[13px] text-byg-muted font-medium whitespace-nowrap font-mono",
                                                    children: fmtFecha(pf.fechaInicio)
                                                }, void 0, false, {
                                                    fileName: "[project]/src/app/(dashboard)/clientes/[id]/page.tsx",
                                                    lineNumber: 295,
                                                    columnNumber: 23
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                    className: "px-6 py-3.5 text-[13px] font-bold text-byg-text whitespace-nowrap font-mono",
                                                    children: fmtFecha(pf.fechaVencimiento)
                                                }, void 0, false, {
                                                    fileName: "[project]/src/app/(dashboard)/clientes/[id]/page.tsx",
                                                    lineNumber: 296,
                                                    columnNumber: 23
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                    className: "px-6 py-3.5 text-right tabular-nums",
                                                    children: dias !== null ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: `text-[12px] font-black tracking-wide font-mono ${dias < 0 ? "text-rose-400" : dias <= 7 ? "text-amber-400" : "text-byg-muted"}`,
                                                        children: dias < 0 ? `+${Math.abs(dias)}v` : dias === 0 ? "hoy" : `${dias}d`
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/app/(dashboard)/clientes/[id]/page.tsx",
                                                        lineNumber: 299,
                                                        columnNumber: 27
                                                    }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: "text-byg-border-2 text-xs",
                                                        children: "—"
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/app/(dashboard)/clientes/[id]/page.tsx",
                                                        lineNumber: 303,
                                                        columnNumber: 27
                                                    }, this)
                                                }, void 0, false, {
                                                    fileName: "[project]/src/app/(dashboard)/clientes/[id]/page.tsx",
                                                    lineNumber: 297,
                                                    columnNumber: 23
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                    className: "px-6 py-3.5 text-center",
                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: `text-[9px] font-black px-2.5 py-1 rounded-md uppercase tracking-widest shadow-sm ${isVencido ? "bg-red-600 text-white" : isUrgent ? "bg-amber-500 text-white" : ESTADO_BADGE[pf.estado] ?? "bg-slate-100 text-slate-400"}`,
                                                        children: isVencido ? "VENCIDO" : isUrgent ? "PRÓXIMO" : pf.estado
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/app/(dashboard)/clientes/[id]/page.tsx",
                                                        lineNumber: 307,
                                                        columnNumber: 25
                                                    }, this)
                                                }, void 0, false, {
                                                    fileName: "[project]/src/app/(dashboard)/clientes/[id]/page.tsx",
                                                    lineNumber: 306,
                                                    columnNumber: 23
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                    className: "px-6 py-3.5 text-right",
                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$modules$2f$clientes$2f$VerPFButton$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["VerPFButton"], {
                                                        pfId: pf.id
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/app/(dashboard)/clientes/[id]/page.tsx",
                                                        lineNumber: 316,
                                                        columnNumber: 25
                                                    }, this)
                                                }, void 0, false, {
                                                    fileName: "[project]/src/app/(dashboard)/clientes/[id]/page.tsx",
                                                    lineNumber: 315,
                                                    columnNumber: 23
                                                }, this)
                                            ]
                                        }, pf.id, true, {
                                            fileName: "[project]/src/app/(dashboard)/clientes/[id]/page.tsx",
                                            lineNumber: 273,
                                            columnNumber: 21
                                        }, this);
                                    })
                                }, void 0, false, {
                                    fileName: "[project]/src/app/(dashboard)/clientes/[id]/page.tsx",
                                    lineNumber: 266,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/app/(dashboard)/clientes/[id]/page.tsx",
                            lineNumber: 253,
                            columnNumber: 13
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/src/app/(dashboard)/clientes/[id]/page.tsx",
                        lineNumber: 252,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/app/(dashboard)/clientes/[id]/page.tsx",
                lineNumber: 236,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                className: "bg-white rounded-2xl border border-slate-200 border-l-[5px] border-l-amber-400 shadow-sm overflow-hidden flex flex-col relative",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(SectionHeader, {
                        label: "Cartera",
                        count: custodias.length,
                        right: custodias.length > 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            className: "text-xs font-black tabular-nums text-byg-text font-mono",
                            children: fmt(totalCustodia)
                        }, void 0, false, {
                            fileName: "[project]/src/app/(dashboard)/clientes/[id]/page.tsx",
                            lineNumber: 334,
                            columnNumber: 15
                        }, void 0) : undefined
                    }, void 0, false, {
                        fileName: "[project]/src/app/(dashboard)/clientes/[id]/page.tsx",
                        lineNumber: 329,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "px-6 py-2 text-[10px] font-bold text-amber-400 bg-amber-500/5 border-b border-amber-500/20",
                        children: "Posiciones asignadas desde carteras — no computan como CC ni PF"
                    }, void 0, false, {
                        fileName: "[project]/src/app/(dashboard)/clientes/[id]/page.tsx",
                        lineNumber: 338,
                        columnNumber: 9
                    }, this),
                    custodias.length === 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(EmptyState, {
                        message: "Sin posiciones en cartera asignada"
                    }, void 0, false, {
                        fileName: "[project]/src/app/(dashboard)/clientes/[id]/page.tsx",
                        lineNumber: 342,
                        columnNumber: 11
                    }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "overflow-x-auto",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("table", {
                            className: "w-full text-left border-collapse min-w-[680px]",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("thead", {
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                                        className: "border-b border-byg-border bg-byg-bg",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                className: "px-5 py-3 text-[10px] font-bold uppercase text-byg-muted tracking-widest w-[90px]",
                                                children: "Ticker"
                                            }, void 0, false, {
                                                fileName: "[project]/src/app/(dashboard)/clientes/[id]/page.tsx",
                                                lineNumber: 348,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                className: "px-5 py-3 text-[10px] font-bold uppercase text-byg-muted tracking-widest",
                                                children: "Descripción"
                                            }, void 0, false, {
                                                fileName: "[project]/src/app/(dashboard)/clientes/[id]/page.tsx",
                                                lineNumber: 349,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                className: "px-5 py-3 text-[10px] font-bold uppercase text-byg-muted tracking-widest text-right",
                                                children: "Cantidad"
                                            }, void 0, false, {
                                                fileName: "[project]/src/app/(dashboard)/clientes/[id]/page.tsx",
                                                lineNumber: 350,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                className: "px-5 py-3 text-[10px] font-bold uppercase text-byg-muted tracking-widest text-right",
                                                children: "P. Promedio"
                                            }, void 0, false, {
                                                fileName: "[project]/src/app/(dashboard)/clientes/[id]/page.tsx",
                                                lineNumber: 351,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                className: "px-5 py-3 text-[10px] font-bold uppercase text-byg-muted tracking-widest text-right",
                                                children: "P. Actual"
                                            }, void 0, false, {
                                                fileName: "[project]/src/app/(dashboard)/clientes/[id]/page.tsx",
                                                lineNumber: 352,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                className: "px-5 py-3 text-[10px] font-bold uppercase text-byg-muted tracking-widest text-right",
                                                children: "Valor est."
                                            }, void 0, false, {
                                                fileName: "[project]/src/app/(dashboard)/clientes/[id]/page.tsx",
                                                lineNumber: 353,
                                                columnNumber: 19
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/app/(dashboard)/clientes/[id]/page.tsx",
                                        lineNumber: 347,
                                        columnNumber: 17
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/src/app/(dashboard)/clientes/[id]/page.tsx",
                                    lineNumber: 346,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("tbody", {
                                    className: "divide-y divide-byg-border/40",
                                    children: custodias.map((cu)=>{
                                        const cantidad = toNum(cu.cantidadTotal);
                                        const promedio = toNum(cu.precioPromedio);
                                        const hasPrecio = cu.Activo?.precioActual != null;
                                        const precioActual = hasPrecio ? toNum(cu.Activo.precioActual) : null;
                                        const valorEst = cantidad * (precioActual ?? promedio);
                                        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                                            className: "hover:bg-byg-surface-2 transition-colors",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                    className: "px-5 py-3",
                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: "text-[11px] font-black font-mono text-byg-text bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded",
                                                        children: cu.Activo?.ticker || "N/A"
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/app/(dashboard)/clientes/[id]/page.tsx",
                                                        lineNumber: 367,
                                                        columnNumber: 25
                                                    }, this)
                                                }, void 0, false, {
                                                    fileName: "[project]/src/app/(dashboard)/clientes/[id]/page.tsx",
                                                    lineNumber: 366,
                                                    columnNumber: 23
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                    className: "px-5 py-3 text-[12px] text-byg-muted max-w-[200px] truncate",
                                                    children: cu.Activo?.descripcion || "—"
                                                }, void 0, false, {
                                                    fileName: "[project]/src/app/(dashboard)/clientes/[id]/page.tsx",
                                                    lineNumber: 371,
                                                    columnNumber: 23
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                    className: "px-5 py-3 text-[12px] font-bold text-right tabular-nums text-byg-text font-mono",
                                                    children: fmt(cantidad)
                                                }, void 0, false, {
                                                    fileName: "[project]/src/app/(dashboard)/clientes/[id]/page.tsx",
                                                    lineNumber: 374,
                                                    columnNumber: 23
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                    className: "px-5 py-3 text-[12px] text-right tabular-nums text-byg-muted font-mono",
                                                    children: fmt(promedio)
                                                }, void 0, false, {
                                                    fileName: "[project]/src/app/(dashboard)/clientes/[id]/page.tsx",
                                                    lineNumber: 377,
                                                    columnNumber: 23
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                    className: "px-5 py-3 text-right tabular-nums",
                                                    children: hasPrecio ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: "text-[12px] text-byg-text font-mono",
                                                        children: fmt(precioActual)
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/app/(dashboard)/clientes/[id]/page.tsx",
                                                        lineNumber: 382,
                                                        columnNumber: 29
                                                    }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: "text-[10px] italic text-byg-border-2",
                                                        children: "Sin dato"
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/app/(dashboard)/clientes/[id]/page.tsx",
                                                        lineNumber: 383,
                                                        columnNumber: 29
                                                    }, this)
                                                }, void 0, false, {
                                                    fileName: "[project]/src/app/(dashboard)/clientes/[id]/page.tsx",
                                                    lineNumber: 380,
                                                    columnNumber: 23
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                    className: "px-5 py-3 text-[13px] font-black text-right tabular-nums text-byg-text font-mono",
                                                    children: fmt(valorEst)
                                                }, void 0, false, {
                                                    fileName: "[project]/src/app/(dashboard)/clientes/[id]/page.tsx",
                                                    lineNumber: 386,
                                                    columnNumber: 23
                                                }, this)
                                            ]
                                        }, cu.id, true, {
                                            fileName: "[project]/src/app/(dashboard)/clientes/[id]/page.tsx",
                                            lineNumber: 365,
                                            columnNumber: 21
                                        }, this);
                                    })
                                }, void 0, false, {
                                    fileName: "[project]/src/app/(dashboard)/clientes/[id]/page.tsx",
                                    lineNumber: 356,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/app/(dashboard)/clientes/[id]/page.tsx",
                            lineNumber: 345,
                            columnNumber: 13
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/src/app/(dashboard)/clientes/[id]/page.tsx",
                        lineNumber: 344,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/app/(dashboard)/clientes/[id]/page.tsx",
                lineNumber: 328,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                className: "bg-byg-surface rounded-2xl border border-byg-border overflow-hidden flex flex-col",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(SectionHeader, {
                        label: "Operaciones relacionadas",
                        count: operaciones.length
                    }, void 0, false, {
                        fileName: "[project]/src/app/(dashboard)/clientes/[id]/page.tsx",
                        lineNumber: 400,
                        columnNumber: 9
                    }, this),
                    operaciones.length === 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(EmptyState, {
                        message: "No hay operaciones relacionadas."
                    }, void 0, false, {
                        fileName: "[project]/src/app/(dashboard)/clientes/[id]/page.tsx",
                        lineNumber: 402,
                        columnNumber: 11
                    }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "overflow-x-auto",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("table", {
                            className: "w-full text-left border-collapse min-w-[800px]",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("thead", {
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                                        className: "border-b border-byg-border bg-byg-bg",
                                        children: [
                                            "Fecha",
                                            "Tipo",
                                            "Moneda",
                                            "Cantidad",
                                            "Total ARS",
                                            "Estado",
                                            "Origen"
                                        ].map((h)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                className: "px-6 py-3.5 text-[10px] font-bold uppercase text-byg-muted tracking-widest",
                                                children: h
                                            }, h, false, {
                                                fileName: "[project]/src/app/(dashboard)/clientes/[id]/page.tsx",
                                                lineNumber: 409,
                                                columnNumber: 21
                                            }, this))
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/(dashboard)/clientes/[id]/page.tsx",
                                        lineNumber: 407,
                                        columnNumber: 17
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/src/app/(dashboard)/clientes/[id]/page.tsx",
                                    lineNumber: 406,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("tbody", {
                                    className: "divide-y divide-byg-border/40",
                                    children: operaciones.map((op)=>{
                                        const esImport = op.descripcion?.includes("[IMPORT LEGACY CAMBIO]") ?? false;
                                        const origen = esImport ? "Import legacy" : op.clienteId === cliente.id ? "Vinculada" : "Legacy / nombre";
                                        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                                            className: "hover:bg-byg-surface-2 transition-colors",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                    className: "px-6 py-3 text-[12px] text-byg-muted whitespace-nowrap font-mono",
                                                    children: fmtFecha(op.fecha)
                                                }, void 0, false, {
                                                    fileName: "[project]/src/app/(dashboard)/clientes/[id]/page.tsx",
                                                    lineNumber: 425,
                                                    columnNumber: 23
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                    className: "px-6 py-3 text-[11px] font-bold text-byg-text uppercase tracking-tight whitespace-nowrap",
                                                    children: op.tipo.replace(/_/g, " ")
                                                }, void 0, false, {
                                                    fileName: "[project]/src/app/(dashboard)/clientes/[id]/page.tsx",
                                                    lineNumber: 428,
                                                    columnNumber: 23
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                    className: "px-6 py-3",
                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: "text-[11px] font-bold bg-byg-surface-2 text-byg-muted px-2 py-0.5 rounded-md border border-byg-border",
                                                        children: op.moneda
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/app/(dashboard)/clientes/[id]/page.tsx",
                                                        lineNumber: 432,
                                                        columnNumber: 25
                                                    }, this)
                                                }, void 0, false, {
                                                    fileName: "[project]/src/app/(dashboard)/clientes/[id]/page.tsx",
                                                    lineNumber: 431,
                                                    columnNumber: 23
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                    className: "px-6 py-3 text-[13px] font-black text-right tabular-nums text-byg-text font-mono",
                                                    children: fmt(op.cantidad)
                                                }, void 0, false, {
                                                    fileName: "[project]/src/app/(dashboard)/clientes/[id]/page.tsx",
                                                    lineNumber: 436,
                                                    columnNumber: 23
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                    className: "px-6 py-3 text-[13px] font-black text-right tabular-nums text-byg-text font-mono",
                                                    children: fmt(op.totalARS)
                                                }, void 0, false, {
                                                    fileName: "[project]/src/app/(dashboard)/clientes/[id]/page.tsx",
                                                    lineNumber: 439,
                                                    columnNumber: 23
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                    className: "px-6 py-3 text-center",
                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: `text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest ${op.pendiente ? "bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/20" : "bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20"}`,
                                                        children: op.pendiente ? "Pendiente" : "Confirmada"
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/app/(dashboard)/clientes/[id]/page.tsx",
                                                        lineNumber: 443,
                                                        columnNumber: 25
                                                    }, this)
                                                }, void 0, false, {
                                                    fileName: "[project]/src/app/(dashboard)/clientes/[id]/page.tsx",
                                                    lineNumber: 442,
                                                    columnNumber: 23
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                    className: "px-6 py-3 text-center",
                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: `text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest ${origen === "Vinculada" ? "bg-byg-accent/10 text-byg-accent ring-1 ring-byg-accent/20" : origen === "Import legacy" ? "bg-byg-surface-2 text-byg-muted" : "bg-violet-500/10 text-violet-400 ring-1 ring-violet-500/20"}`,
                                                        children: origen
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/app/(dashboard)/clientes/[id]/page.tsx",
                                                        lineNumber: 452,
                                                        columnNumber: 25
                                                    }, this)
                                                }, void 0, false, {
                                                    fileName: "[project]/src/app/(dashboard)/clientes/[id]/page.tsx",
                                                    lineNumber: 451,
                                                    columnNumber: 23
                                                }, this)
                                            ]
                                        }, op.id, true, {
                                            fileName: "[project]/src/app/(dashboard)/clientes/[id]/page.tsx",
                                            lineNumber: 424,
                                            columnNumber: 21
                                        }, this);
                                    })
                                }, void 0, false, {
                                    fileName: "[project]/src/app/(dashboard)/clientes/[id]/page.tsx",
                                    lineNumber: 415,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/app/(dashboard)/clientes/[id]/page.tsx",
                            lineNumber: 405,
                            columnNumber: 13
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/src/app/(dashboard)/clientes/[id]/page.tsx",
                        lineNumber: 404,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/app/(dashboard)/clientes/[id]/page.tsx",
                lineNumber: 399,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/app/(dashboard)/clientes/[id]/page.tsx",
        lineNumber: 110,
        columnNumber: 5
    }, this);
}
const ACCENT_BORDER = {
    blue: "border-t-blue-400",
    green: "border-t-green-400",
    emerald: "border-t-emerald-400",
    purple: "border-t-purple-400"
};
function Card({ icon, label, value, sub, valueClass = "text-byg-text", accent }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: `bg-byg-surface rounded-xl border border-byg-border border-t-[3px] p-5 flex flex-col justify-between min-h-[110px] ${ACCENT_BORDER[accent]} transition-colors hover:bg-byg-surface-2`,
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex items-center gap-2 mb-3",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "p-1.5 rounded-lg bg-byg-bg border border-byg-border",
                        children: icon
                    }, void 0, false, {
                        fileName: "[project]/src/app/(dashboard)/clientes/[id]/page.tsx",
                        lineNumber: 499,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "text-[11px] font-bold uppercase tracking-widest text-byg-muted",
                        children: label
                    }, void 0, false, {
                        fileName: "[project]/src/app/(dashboard)/clientes/[id]/page.tsx",
                        lineNumber: 500,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/app/(dashboard)/clientes/[id]/page.tsx",
                lineNumber: 498,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: `text-3xl font-black tabular-nums tracking-tight leading-none mb-1.5 font-mono ${valueClass}`,
                        children: value
                    }, void 0, false, {
                        fileName: "[project]/src/app/(dashboard)/clientes/[id]/page.tsx",
                        lineNumber: 503,
                        columnNumber: 9
                    }, this),
                    sub && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "text-xs font-medium text-byg-muted",
                        children: sub
                    }, void 0, false, {
                        fileName: "[project]/src/app/(dashboard)/clientes/[id]/page.tsx",
                        lineNumber: 504,
                        columnNumber: 17
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/app/(dashboard)/clientes/[id]/page.tsx",
                lineNumber: 502,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/app/(dashboard)/clientes/[id]/page.tsx",
        lineNumber: 497,
        columnNumber: 5
    }, this);
}
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, false);}),
"[project]/src/app/(dashboard)/clientes/[id]/page.tsx [app-rsc] (ecmascript, Next.js server component)": ((__turbopack_context__) => {

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.n(__turbopack_context__.i("[project]/src/app/(dashboard)/clientes/[id]/page.tsx [app-rsc] (ecmascript)"));
}}),

};

//# sourceMappingURL=%5Broot-of-the-server%5D__7898999c._.js.map