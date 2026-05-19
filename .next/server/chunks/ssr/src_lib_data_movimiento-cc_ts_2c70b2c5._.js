module.exports = {

"[project]/src/lib/data/movimiento-cc.ts [app-rsc] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "getMovimientosByOperationRef": (()=>getMovimientosByOperationRef),
    "getMovimientosCuentaCorriente": (()=>getMovimientosCuentaCorriente),
    "getRecentOperacionMovimientos": (()=>getRecentOperacionMovimientos),
    "getResumenOperacionesPorCliente": (()=>getResumenOperacionesPorCliente)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/prisma.ts [app-rsc] (ecmascript)");
;
function cleanDesc(d) {
    if (!d) return "—";
    return d.replace(/\s*\|\s*op:[a-zA-Z0-9-]+/, "").replace(/\s*\|\s*ref:[a-zA-Z0-9-]+/, "").trim();
}
async function getRecentOperacionMovimientos() {
    const movs = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].movimientoCC.findMany({
        orderBy: [
            {
                fecha: "desc"
            },
            {
                createdAt: "desc"
            }
        ],
        take: 100,
        include: {
            CuentaCorriente: {
                include: {
                    Cliente: true
                }
            }
        }
    });
    const byRef = new Map();
    const noRef = [];
    for (const m of movs){
        const refMatch = m.descripcion?.match(/op:([a-zA-Z0-9-]+)/);
        const ref = refMatch?.[1] ?? null;
        if (ref) {
            const group = byRef.get(ref) ?? [];
            group.push(m);
            byRef.set(ref, group);
        } else {
            noRef.push(m);
        }
    }
    // Find all LP refs to resolve linked plazo fijo records
    const lpRefs = [];
    for (const [ref, group] of Array.from(byRef.entries())){
        const primary = group.find((m)=>m.tipo === "INGRESO") ?? group[0];
        const tipoOperacion = primary.descripcion?.split(" ")[0]?.toUpperCase() ?? "MOV";
        if (tipoOperacion === "LP") lpRefs.push(ref);
    }
    const pfByRef = new Map();
    if (lpRefs.length > 0) {
        const pfs = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].plazoFijo.findMany({
            where: {
                notas: {
                    contains: "op:"
                }
            },
            select: {
                id: true,
                notas: true
            }
        });
        for (const pf of pfs){
            const match = pf.notas?.match(/op:([a-zA-Z0-9-]+)/);
            if (match?.[1] && lpRefs.includes(match[1])) {
                pfByRef.set(match[1], pf.id);
            }
        }
    }
    const ledger = [];
    for (const [ref, group] of Array.from(byRef.entries())){
        const primary = group.find((m)=>m.tipo === "INGRESO") ?? group[0];
        const revertida = group.some((m)=>m.descripcion?.includes("REVERSO"));
        const latestFecha = group.reduce((l, m)=>m.fecha > l ? m.fecha : l, group[0].fecha);
        const tipoOperacion = primary.descripcion?.split(" ")[0]?.toUpperCase() ?? "MOV";
        const plazoFijoId = pfByRef.get(ref) ?? null;
        ledger.push({
            operationRef: ref,
            fecha: latestFecha,
            clienteId: primary.CuentaCorriente.Cliente.id,
            clienteNombre: primary.CuentaCorriente.Cliente.nombre,
            tipoOperacion,
            descripcion: cleanDesc(primary.descripcion),
            cantidadMovimientos: group.length,
            montoPrincipal: Number(primary.monto.toString()),
            moneda: primary.CuentaCorriente.moneda,
            revertida,
            generoPlazoFijo: plazoFijoId !== null,
            plazoFijoId,
            pfRevertido: tipoOperacion === "LP" && revertida && plazoFijoId !== null
        });
    }
    for (const m of noRef){
        const tipoOperacion = m.descripcion?.split(" ")[0]?.toUpperCase() ?? "MOV";
        ledger.push({
            operationRef: null,
            fecha: m.fecha,
            clienteId: m.CuentaCorriente.Cliente.id,
            clienteNombre: m.CuentaCorriente.Cliente.nombre,
            tipoOperacion,
            descripcion: cleanDesc(m.descripcion),
            cantidadMovimientos: 1,
            montoPrincipal: Number(m.monto.toString()),
            moneda: m.CuentaCorriente.moneda,
            revertida: false,
            generoPlazoFijo: false,
            plazoFijoId: null,
            pfRevertido: false
        });
    }
    return ledger.sort((a, b)=>b.fecha.getTime() - a.fecha.getTime());
}
async function getResumenOperacionesPorCliente() {
    const ledger = await getRecentOperacionMovimientos();
    const map = new Map();
    for (const row of ledger){
        const key = row.clienteId;
        if (!map.has(key)) {
            map.set(key, {
                clienteId: row.clienteId,
                clienteNombre: row.clienteNombre,
                totalOperaciones: 0,
                activas: 0,
                revertidas: 0,
                totalRulo: 0,
                totalDivisa: 0,
                totalLP: 0,
                totalInteres: 0,
                totalTransferencia: 0,
                montoTotalMovido: 0
            });
        }
        const entry = map.get(key);
        entry.totalOperaciones++;
        if (row.revertida) entry.revertidas++;
        else entry.activas++;
        const monto = row.montoPrincipal;
        entry.montoTotalMovido += monto;
        switch(row.tipoOperacion){
            case "RULO":
                entry.totalRulo++;
                break;
            case "DIVISA":
                entry.totalDivisa++;
                break;
            case "LP":
                entry.totalLP++;
                break;
            case "INTERES":
                entry.totalInteres++;
                break;
            case "TRANSFERENCIA":
                entry.totalTransferencia++;
                break;
        }
    }
    return Array.from(map.values()).sort((a, b)=>b.totalOperaciones - a.totalOperaciones);
}
async function getMovimientosByOperationRef(operationRef) {
    return __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].movimientoCC.findMany({
        where: {
            descripcion: {
                contains: `op:${operationRef}`
            }
        },
        include: {
            CuentaCorriente: true
        }
    });
}
async function getMovimientosCuentaCorriente(cuentaId) {
    return __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].cuentaCorriente.findUnique({
        where: {
            id: cuentaId
        },
        include: {
            Cliente: true,
            MovimientoCC: {
                orderBy: [
                    {
                        fecha: "desc"
                    },
                    {
                        createdAt: "desc"
                    }
                ]
            }
        }
    });
}
}}),

};

//# sourceMappingURL=src_lib_data_movimiento-cc_ts_2c70b2c5._.js.map