module.exports = {

"[project]/src/lib/services/intereses.service.ts [app-rsc] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname, a: __turbopack_async_module__ } = __turbopack_context__;
__turbopack_async_module__(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {
__turbopack_context__.s({
    "calcularDiasEntreFechas": (()=>calcularDiasEntreFechas),
    "calcularInteresCC": (()=>calcularInteresCC),
    "calcularInteresCCRealista": (()=>calcularInteresCCRealista),
    "calcularInteresPF": (()=>calcularInteresPF)
});
var __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client$2f$runtime$2f$library__$5b$external$5d$__$2840$prisma$2f$client$2f$runtime$2f$library$2c$__esm_import$29$__ = __turbopack_context__.i("[externals]/@prisma/client/runtime/library [external] (@prisma/client/runtime/library, esm_import)");
var __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/@prisma/client [external] (@prisma/client, cjs)");
var __turbopack_async_dependencies__ = __turbopack_handle_async_dependencies__([
    __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client$2f$runtime$2f$library__$5b$external$5d$__$2840$prisma$2f$client$2f$runtime$2f$library$2c$__esm_import$29$__
]);
([__TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client$2f$runtime$2f$library__$5b$external$5d$__$2840$prisma$2f$client$2f$runtime$2f$library$2c$__esm_import$29$__] = __turbopack_async_dependencies__.then ? (await __turbopack_async_dependencies__)() : __turbopack_async_dependencies__);
;
;
function calcularDiasEntreFechas(fechaInicio, fechaFin) {
    const msInicio = Date.UTC(fechaInicio.getFullYear(), fechaInicio.getMonth(), fechaInicio.getDate());
    const msFin = Date.UTC(fechaFin.getFullYear(), fechaFin.getMonth(), fechaFin.getDate());
    return Math.round((msFin - msInicio) / (1000 * 60 * 60 * 24));
}
function calcularInteresCC({ saldo, tasa, dias }) {
    return saldo.mul(tasa).mul(new __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client$2f$runtime$2f$library__$5b$external$5d$__$2840$prisma$2f$client$2f$runtime$2f$library$2c$__esm_import$29$__["Decimal"](dias)).div(new __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client$2f$runtime$2f$library__$5b$external$5d$__$2840$prisma$2f$client$2f$runtime$2f$library$2c$__esm_import$29$__["Decimal"](365));
}
function calcularInteresPF({ capital, tasa, fechaInicio, fechaVencimiento }) {
    const dias = calcularDiasEntreFechas(fechaInicio, fechaVencimiento);
    return capital.mul(tasa).mul(new __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client$2f$runtime$2f$library__$5b$external$5d$__$2840$prisma$2f$client$2f$runtime$2f$library$2c$__esm_import$29$__["Decimal"](dias)).div(new __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client$2f$runtime$2f$library__$5b$external$5d$__$2840$prisma$2f$client$2f$runtime$2f$library$2c$__esm_import$29$__["Decimal"](365));
}
function calcularInteresCCRealista({ movimientos, tasa, fechaInicio, fechaFin, saldoInicial = new __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client$2f$runtime$2f$library__$5b$external$5d$__$2840$prisma$2f$client$2f$runtime$2f$library$2c$__esm_import$29$__["Decimal"](0) }) {
    // Normalize to midnight UTC to avoid DST-induced day drift
    const normalize = (d)=>new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    const inicio = normalize(fechaInicio);
    const fin = normalize(fechaFin);
    // Filter movimientos strictly within [fechaInicio, fechaFin) and sort ASC
    const movsFiltrados = movimientos.map((m)=>({
            ...m,
            fecha: normalize(m.fecha)
        })).filter((m)=>m.fecha >= inicio && m.fecha < fin).sort((a, b)=>a.fecha.getTime() - b.fecha.getTime());
    // Build timeline: unique date breakpoints within the period
    const breakpoints = [
        inicio
    ];
    for (const mov of movsFiltrados){
        const last = breakpoints[breakpoints.length - 1];
        if (mov.fecha.getTime() !== last.getTime()) {
            breakpoints.push(mov.fecha);
        }
    }
    breakpoints.push(fin);
    // Pre-compute running balance at each breakpoint start
    // saldoInicial is the balance as of fechaInicio (before any movimiento that day)
    let saldoCorrente = saldoInicial;
    const saldoPorBreakpoint = [
        saldoCorrente
    ];
    let movIdx = 0;
    for(let i = 1; i < breakpoints.length - 1; i++){
        const punto = breakpoints[i];
        // Apply all movimientos that fall on the previous breakpoint date
        const anterior = breakpoints[i - 1];
        while(movIdx < movsFiltrados.length && movsFiltrados[movIdx].fecha.getTime() === anterior.getTime()){
            const mov = movsFiltrados[movIdx];
            if (mov.tipo === __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2c$__cjs$29$__["TipoMovCC"].INGRESO || mov.tipo === __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2c$__cjs$29$__["TipoMovCC"].AJUSTE) {
                saldoCorrente = saldoCorrente.add(mov.monto);
            } else if (mov.tipo === __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2c$__cjs$29$__["TipoMovCC"].EGRESO) {
                saldoCorrente = saldoCorrente.sub(mov.monto);
            }
            // INTERES movements are excluded from balance reconstruction
            movIdx++;
        }
        saldoPorBreakpoint.push(saldoCorrente);
    }
    // Calculate interest per period
    const periodos = [];
    let interesTotal = new __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client$2f$runtime$2f$library__$5b$external$5d$__$2840$prisma$2f$client$2f$runtime$2f$library$2c$__esm_import$29$__["Decimal"](0);
    for(let i = 0; i < breakpoints.length - 1; i++){
        const fechaDesde = breakpoints[i];
        const fechaHasta = breakpoints[i + 1];
        const dias = calcularDiasEntreFechas(fechaDesde, fechaHasta);
        const saldo = saldoPorBreakpoint[i];
        // Only accrue interest on positive balances (creditor account convention)
        // Change condition to saldo.isNegative() for debtor-side accrual
        const interes = saldo.greaterThan(0) ? saldo.mul(tasa).mul(new __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client$2f$runtime$2f$library__$5b$external$5d$__$2840$prisma$2f$client$2f$runtime$2f$library$2c$__esm_import$29$__["Decimal"](dias)).div(new __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client$2f$runtime$2f$library__$5b$external$5d$__$2840$prisma$2f$client$2f$runtime$2f$library$2c$__esm_import$29$__["Decimal"](365)) : new __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client$2f$runtime$2f$library__$5b$external$5d$__$2840$prisma$2f$client$2f$runtime$2f$library$2c$__esm_import$29$__["Decimal"](0);
        interesTotal = interesTotal.add(interes);
        periodos.push({
            fechaDesde,
            fechaHasta,
            dias,
            saldo,
            interes
        });
    }
    return {
        interesTotal,
        periodos
    };
}
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, false);}),
"[project]/src/lib/services/liquidacion-cc.service.ts [app-rsc] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname, a: __turbopack_async_module__ } = __turbopack_context__;
__turbopack_async_module__(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {
__turbopack_context__.s({
    "liquidarInteresCC": (()=>liquidarInteresCC)
});
var __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client$2f$runtime$2f$library__$5b$external$5d$__$2840$prisma$2f$client$2f$runtime$2f$library$2c$__esm_import$29$__ = __turbopack_context__.i("[externals]/@prisma/client/runtime/library [external] (@prisma/client/runtime/library, esm_import)");
var __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/@prisma/client [external] (@prisma/client, cjs)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/prisma.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$services$2f$intereses$2e$service$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/services/intereses.service.ts [app-rsc] (ecmascript)");
var __turbopack_async_dependencies__ = __turbopack_handle_async_dependencies__([
    __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client$2f$runtime$2f$library__$5b$external$5d$__$2840$prisma$2f$client$2f$runtime$2f$library$2c$__esm_import$29$__,
    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$services$2f$intereses$2e$service$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__
]);
([__TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client$2f$runtime$2f$library__$5b$external$5d$__$2840$prisma$2f$client$2f$runtime$2f$library$2c$__esm_import$29$__, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$services$2f$intereses$2e$service$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__] = __turbopack_async_dependencies__.then ? (await __turbopack_async_dependencies__)() : __turbopack_async_dependencies__);
;
;
;
;
function formatFecha(fecha) {
    const d = fecha.getUTCDate().toString().padStart(2, "0");
    const m = (fecha.getUTCMonth() + 1).toString().padStart(2, "0");
    const y = fecha.getUTCFullYear();
    return `${d}/${m}/${y}`;
}
async function liquidarInteresCC({ cuentaId, fechaInicio, fechaFin, tasa, interesAplicado }) {
    if (interesAplicado.lt(0)) {
        throw new Error("El interés aplicado no puede ser negativo.");
    }
    if (fechaFin <= fechaInicio) {
        throw new Error("fechaFin debe ser posterior a fechaInicio.");
    }
    // 1. Fetch account with ALL movements in range (ordered ASC for the engine)
    const cuenta = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].cuentaCorriente.findUnique({
        where: {
            id: cuentaId
        },
        include: {
            MovimientoCC: {
                where: {
                    fecha: {
                        gte: fechaInicio,
                        lt: fechaFin
                    }
                },
                orderBy: [
                    {
                        fecha: "asc"
                    },
                    {
                        createdAt: "asc"
                    }
                ]
            }
        }
    });
    if (!cuenta) {
        throw new Error(`CuentaCorriente no encontrada: ${cuentaId}`);
    }
    // 2. Reconstruct saldoInicial as of fechaInicio by replaying all movements BEFORE that date
    const movimientosAnteriores = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].movimientoCC.findMany({
        where: {
            cuentaCorrienteId: cuentaId,
            fecha: {
                lt: fechaInicio
            }
        },
        orderBy: [
            {
                fecha: "asc"
            },
            {
                createdAt: "asc"
            }
        ]
    });
    let saldoInicial = new __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client$2f$runtime$2f$library__$5b$external$5d$__$2840$prisma$2f$client$2f$runtime$2f$library$2c$__esm_import$29$__["Decimal"](0);
    for (const mov of movimientosAnteriores){
        if (mov.tipo === __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2c$__cjs$29$__["TipoMovCC"].INGRESO || mov.tipo === __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2c$__cjs$29$__["TipoMovCC"].AJUSTE) {
            saldoInicial = saldoInicial.add(mov.monto);
        } else if (mov.tipo === __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2c$__cjs$29$__["TipoMovCC"].EGRESO) {
            saldoInicial = saldoInicial.sub(mov.monto);
        }
    // INTERES excluded — never compound previously posted interest
    }
    // 3. Run the calculation engine
    const { interesTotal, periodos } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$services$2f$intereses$2e$service$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["calcularInteresCCRealista"])({
        movimientos: cuenta.MovimientoCC.map((m)=>({
                fecha: m.fecha,
                tipo: m.tipo,
                monto: m.monto
            })),
        tasa,
        fechaInicio,
        fechaFin,
        saldoInicial
    });
    const interesCalculado = interesTotal;
    // 4. Validate: partial application is allowed, excess is not
    const aAplicar = interesAplicado.gt(0) ? interesAplicado : interesCalculado;
    if (aAplicar.greaterThan(interesCalculado)) {
        throw new Error(`El interés aplicado (${aAplicar.toFixed(2)}) no puede superar el interés calculado (${interesCalculado.toFixed(2)}).`);
    }
    if (aAplicar.lte(0)) {
        throw new Error("No hay interés a aplicar en el período seleccionado (saldo insuficiente o período vacío).");
    }
    const diferencia = interesCalculado.sub(aAplicar);
    const descripcion = `Interés CC período ${formatFecha(fechaInicio)} - ${formatFecha(fechaFin)}`;
    // 5. Atomic transaction: create movement + update balance
    const movimientoId = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].$transaction(async (tx)=>{
        const cuentaActual = await tx.cuentaCorriente.findUnique({
            where: {
                id: cuentaId
            },
            select: {
                saldo: true
            }
        });
        if (!cuentaActual) {
            throw new Error(`CuentaCorriente no encontrada dentro de la transacción: ${cuentaId}`);
        }
        const nuevoSaldo = cuentaActual.saldo.add(aAplicar);
        const movimiento = await tx.movimientoCC.create({
            data: {
                id: crypto.randomUUID(),
                cuentaCorrienteId: cuentaId,
                fecha: fechaFin,
                tipo: __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2c$__cjs$29$__["TipoMovCC"].INTERES,
                monto: aAplicar,
                descripcion
            }
        });
        await tx.cuentaCorriente.update({
            where: {
                id: cuentaId
            },
            data: {
                saldo: nuevoSaldo
            }
        });
        return movimiento.id;
    });
    return {
        interesCalculado,
        interesAplicado: aAplicar,
        diferencia,
        movimientoId,
        periodos
    };
}
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, false);}),

};

//# sourceMappingURL=src_lib_services_9f7f1737._.js.map