module.exports = {

"[externals]/@prisma/client/runtime/library [external] (@prisma/client/runtime/library, esm_import)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname, a: __turbopack_async_module__ } = __turbopack_context__;
__turbopack_async_module__(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {
const mod = await __turbopack_context__.y("@prisma/client/runtime/library");

__turbopack_context__.n(mod);
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, true);}),
"[project]/src/app/(dashboard)/cuentas-inversion/actions.ts [app-rsc] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname, a: __turbopack_async_module__ } = __turbopack_context__;
__turbopack_async_module__(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {
/* __next_internal_action_entry_do_not_use__ [{"60501021f2a99b12807a2047a717d7a5f8d3c8d05d":"deleteComitente","60582695dbbb046ce2cc072ee4a82a0ff1a754cce2":"updateComitente","60865beb05caebbc767d1ae2fa01f13b5991ea2d00":"updateSaldos","60e12128710bd8b2db31fa497a12a16323be8db45d":"createComitente"},"",""] */ __turbopack_context__.s({
    "createComitente": (()=>createComitente),
    "deleteComitente": (()=>deleteComitente),
    "updateComitente": (()=>updateComitente),
    "updateSaldos": (()=>updateSaldos)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/build/webpack/loaders/next-flight-loader/server-reference.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$app$2d$render$2f$encryption$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/app-render/encryption.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/prisma.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/cache.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client$2f$runtime$2f$library__$5b$external$5d$__$2840$prisma$2f$client$2f$runtime$2f$library$2c$__esm_import$29$__ = __turbopack_context__.i("[externals]/@prisma/client/runtime/library [external] (@prisma/client/runtime/library, esm_import)");
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
const PRODUCTORES = [
    "IPS",
    "BYG",
    "OTRO"
];
function parseDecimal(raw) {
    try {
        return new __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client$2f$runtime$2f$library__$5b$external$5d$__$2840$prisma$2f$client$2f$runtime$2f$library$2c$__esm_import$29$__["Decimal"](raw?.toString().trim() || "0");
    } catch  {
        return new __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client$2f$runtime$2f$library__$5b$external$5d$__$2840$prisma$2f$client$2f$runtime$2f$library$2c$__esm_import$29$__["Decimal"]("0");
    }
}
function revalidate(cuentaId) {
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["revalidatePath"])("/cuentas-inversion");
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["revalidatePath"])(`/cuentas-inversion/${cuentaId}`);
}
async function createComitente(_, formData) {
    const cuentaId = formData.get("cuentaInversionId")?.toString().trim();
    const nroComitente = formData.get("nroComitente")?.toString().trim();
    const nombre = formData.get("nombre")?.toString().trim();
    const razonSocial = formData.get("razonSocial")?.toString().trim() || null;
    const productorRaw = formData.get("productor")?.toString();
    const notas = formData.get("notas")?.toString().trim() || null;
    const esPropioBYG = formData.get("esPropioBYG") === "true";
    if (!cuentaId || !nroComitente || !nombre) return {
        error: "Número de comitente y nombre son requeridos"
    };
    if (!PRODUCTORES.includes(productorRaw)) return {
        error: "Productor inválido"
    };
    const exists = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].comitenteInversion.findUnique({
        where: {
            cuentaInversionId_nroComitente: {
                cuentaInversionId: cuentaId,
                nroComitente
            }
        }
    });
    if (exists) return {
        error: `El número de comitente ${nroComitente} ya existe en esta cuenta`
    };
    await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].$transaction(async (tx)=>{
        const comitente = await tx.comitenteInversion.create({
            data: {
                id: crypto.randomUUID(),
                cuentaInversionId: cuentaId,
                nroComitente,
                nombre,
                razonSocial,
                productor: productorRaw,
                notas,
                activo: true,
                esPropioBYG,
                updatedAt: new Date()
            }
        });
        await tx.saldoComitenteInversion.create({
            data: {
                id: crypto.randomUUID(),
                comitenteId: comitente.id,
                saldoARS: new __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client$2f$runtime$2f$library__$5b$external$5d$__$2840$prisma$2f$client$2f$runtime$2f$library$2c$__esm_import$29$__["Decimal"](0),
                saldoUSDCable: new __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client$2f$runtime$2f$library__$5b$external$5d$__$2840$prisma$2f$client$2f$runtime$2f$library$2c$__esm_import$29$__["Decimal"](0),
                saldoUSDMep: new __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client$2f$runtime$2f$library__$5b$external$5d$__$2840$prisma$2f$client$2f$runtime$2f$library$2c$__esm_import$29$__["Decimal"](0),
                updatedAt: new Date()
            }
        });
    });
    revalidate(cuentaId);
    return {
        success: true
    };
}
async function updateComitente(_, formData) {
    const id = formData.get("id")?.toString().trim();
    const cuentaId = formData.get("cuentaInversionId")?.toString().trim();
    const nroComitente = formData.get("nroComitente")?.toString().trim();
    const nombre = formData.get("nombre")?.toString().trim();
    const razonSocial = formData.get("razonSocial")?.toString().trim() || null;
    const productorRaw = formData.get("productor")?.toString();
    const notas = formData.get("notas")?.toString().trim() || null;
    const activo = formData.get("activo") === "true";
    const esPropioBYG = formData.get("esPropioBYG") === "true";
    if (!id || !cuentaId || !nroComitente || !nombre) return {
        error: "Campos requeridos incompletos"
    };
    if (!PRODUCTORES.includes(productorRaw)) return {
        error: "Productor inválido"
    };
    const duplicate = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].comitenteInversion.findFirst({
        where: {
            cuentaInversionId: cuentaId,
            nroComitente,
            id: {
                not: id
            }
        }
    });
    if (duplicate) return {
        error: `El número de comitente ${nroComitente} ya existe en esta cuenta`
    };
    await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].comitenteInversion.update({
        where: {
            id
        },
        data: {
            nroComitente,
            nombre,
            razonSocial,
            productor: productorRaw,
            notas,
            activo,
            esPropioBYG
        }
    });
    revalidate(cuentaId);
    return {
        success: true
    };
}
async function updateSaldos(_, formData) {
    const comitenteId = formData.get("comitenteId")?.toString().trim();
    const cuentaId = formData.get("cuentaInversionId")?.toString().trim();
    if (!comitenteId || !cuentaId) return {
        error: "Datos requeridos incompletos"
    };
    const saldoARS = parseDecimal(formData.get("saldoARS"));
    const saldoUSDCable = parseDecimal(formData.get("saldoUSDCable"));
    const saldoUSDMep = parseDecimal(formData.get("saldoUSDMep"));
    if (saldoARS.lt(0) || saldoUSDCable.lt(0) || saldoUSDMep.lt(0)) return {
        error: "Los saldos no pueden ser negativos"
    };
    await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].saldoComitenteInversion.upsert({
        where: {
            comitenteId
        },
        update: {
            saldoARS,
            saldoUSDCable,
            saldoUSDMep
        },
        create: {
            id: crypto.randomUUID(),
            comitenteId,
            saldoARS,
            saldoUSDCable,
            saldoUSDMep,
            updatedAt: new Date()
        }
    });
    revalidate(cuentaId);
    return {
        success: true
    };
}
async function deleteComitente(_, formData) {
    const id = formData.get("id")?.toString().trim();
    const cuentaId = formData.get("cuentaInversionId")?.toString().trim();
    if (!id || !cuentaId) return {
        error: "ID requerido"
    };
    const holdingsCount = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].holdingComitenteInversion.count({
        where: {
            comitenteId: id
        }
    });
    if (holdingsCount > 0) return {
        error: `No se puede eliminar: el comitente tiene ${holdingsCount} holding(s) registrado(s)`
    };
    await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].comitenteInversion.delete({
        where: {
            id
        }
    });
    revalidate(cuentaId);
    return {
        success: true
    };
}
;
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$validate$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["ensureServerEntryExports"])([
    createComitente,
    updateComitente,
    updateSaldos,
    deleteComitente
]);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(createComitente, "60e12128710bd8b2db31fa497a12a16323be8db45d", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(updateComitente, "60582695dbbb046ce2cc072ee4a82a0ff1a754cce2", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(updateSaldos, "60865beb05caebbc767d1ae2fa01f13b5991ea2d00", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(deleteComitente, "60501021f2a99b12807a2047a717d7a5f8d3c8d05d", null);
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, false);}),
"[project]/.next-internal/server/app/(dashboard)/cuentas-inversion/[id]/page/actions.js { ACTIONS_MODULE0 => \"[project]/src/components/layout/Topbar.tsx [app-rsc] (ecmascript)\", ACTIONS_MODULE1 => \"[project]/src/app/(dashboard)/cuentas-inversion/actions.ts [app-rsc] (ecmascript)\" } [app-rsc] (server actions loader, ecmascript) <locals>": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname, a: __turbopack_async_module__ } = __turbopack_context__;
__turbopack_async_module__(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {
__turbopack_context__.s({});
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$layout$2f$Topbar$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/layout/Topbar.tsx [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f28$dashboard$292f$cuentas$2d$inversion$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/app/(dashboard)/cuentas-inversion/actions.ts [app-rsc] (ecmascript)");
var __turbopack_async_dependencies__ = __turbopack_handle_async_dependencies__([
    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f28$dashboard$292f$cuentas$2d$inversion$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__
]);
([__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f28$dashboard$292f$cuentas$2d$inversion$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__] = __turbopack_async_dependencies__.then ? (await __turbopack_async_dependencies__)() : __turbopack_async_dependencies__);
;
;
;
;
;
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, false);}),
"[project]/.next-internal/server/app/(dashboard)/cuentas-inversion/[id]/page/actions.js { ACTIONS_MODULE0 => \"[project]/src/components/layout/Topbar.tsx [app-rsc] (ecmascript)\", ACTIONS_MODULE1 => \"[project]/src/app/(dashboard)/cuentas-inversion/actions.ts [app-rsc] (ecmascript)\" } [app-rsc] (server actions loader, ecmascript) <module evaluation>": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname, a: __turbopack_async_module__ } = __turbopack_context__;
__turbopack_async_module__(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {
__turbopack_context__.s({});
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$layout$2f$Topbar$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/layout/Topbar.tsx [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f28$dashboard$292f$cuentas$2d$inversion$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/app/(dashboard)/cuentas-inversion/actions.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f2e$next$2d$internal$2f$server$2f$app$2f28$dashboard$292f$cuentas$2d$inversion$2f5b$id$5d2f$page$2f$actions$2e$js__$7b$__ACTIONS_MODULE0__$3d3e$__$225b$project$5d2f$src$2f$components$2f$layout$2f$Topbar$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29222c$__ACTIONS_MODULE1__$3d3e$__$225b$project$5d2f$src$2f$app$2f28$dashboard$292f$cuentas$2d$inversion$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$2922$__$7d$__$5b$app$2d$rsc$5d$__$28$server__actions__loader$2c$__ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i('[project]/.next-internal/server/app/(dashboard)/cuentas-inversion/[id]/page/actions.js { ACTIONS_MODULE0 => "[project]/src/components/layout/Topbar.tsx [app-rsc] (ecmascript)", ACTIONS_MODULE1 => "[project]/src/app/(dashboard)/cuentas-inversion/actions.ts [app-rsc] (ecmascript)" } [app-rsc] (server actions loader, ecmascript) <locals>');
var __turbopack_async_dependencies__ = __turbopack_handle_async_dependencies__([
    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f28$dashboard$292f$cuentas$2d$inversion$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__,
    __TURBOPACK__imported__module__$5b$project$5d2f2e$next$2d$internal$2f$server$2f$app$2f28$dashboard$292f$cuentas$2d$inversion$2f5b$id$5d2f$page$2f$actions$2e$js__$7b$__ACTIONS_MODULE0__$3d3e$__$225b$project$5d2f$src$2f$components$2f$layout$2f$Topbar$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29222c$__ACTIONS_MODULE1__$3d3e$__$225b$project$5d2f$src$2f$app$2f28$dashboard$292f$cuentas$2d$inversion$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$2922$__$7d$__$5b$app$2d$rsc$5d$__$28$server__actions__loader$2c$__ecmascript$29$__$3c$locals$3e$__
]);
([__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f28$dashboard$292f$cuentas$2d$inversion$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__, __TURBOPACK__imported__module__$5b$project$5d2f2e$next$2d$internal$2f$server$2f$app$2f28$dashboard$292f$cuentas$2d$inversion$2f5b$id$5d2f$page$2f$actions$2e$js__$7b$__ACTIONS_MODULE0__$3d3e$__$225b$project$5d2f$src$2f$components$2f$layout$2f$Topbar$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29222c$__ACTIONS_MODULE1__$3d3e$__$225b$project$5d2f$src$2f$app$2f28$dashboard$292f$cuentas$2d$inversion$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$2922$__$7d$__$5b$app$2d$rsc$5d$__$28$server__actions__loader$2c$__ecmascript$29$__$3c$locals$3e$__] = __turbopack_async_dependencies__.then ? (await __turbopack_async_dependencies__)() : __turbopack_async_dependencies__);
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, false);}),
"[project]/.next-internal/server/app/(dashboard)/cuentas-inversion/[id]/page/actions.js { ACTIONS_MODULE0 => \"[project]/src/components/layout/Topbar.tsx [app-rsc] (ecmascript)\", ACTIONS_MODULE1 => \"[project]/src/app/(dashboard)/cuentas-inversion/actions.ts [app-rsc] (ecmascript)\" } [app-rsc] (server actions loader, ecmascript) <exports>": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname, a: __turbopack_async_module__ } = __turbopack_context__;
__turbopack_async_module__(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {
__turbopack_context__.s({
    "0011ff4319847fa321c161740d2e30453828714a2e": (()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$layout$2f$Topbar$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["$$RSC_SERVER_ACTION_0"]),
    "60501021f2a99b12807a2047a717d7a5f8d3c8d05d": (()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f28$dashboard$292f$cuentas$2d$inversion$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["deleteComitente"]),
    "60582695dbbb046ce2cc072ee4a82a0ff1a754cce2": (()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f28$dashboard$292f$cuentas$2d$inversion$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["updateComitente"]),
    "60865beb05caebbc767d1ae2fa01f13b5991ea2d00": (()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f28$dashboard$292f$cuentas$2d$inversion$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["updateSaldos"]),
    "60e12128710bd8b2db31fa497a12a16323be8db45d": (()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f28$dashboard$292f$cuentas$2d$inversion$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createComitente"])
});
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$layout$2f$Topbar$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/layout/Topbar.tsx [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f28$dashboard$292f$cuentas$2d$inversion$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/app/(dashboard)/cuentas-inversion/actions.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f2e$next$2d$internal$2f$server$2f$app$2f28$dashboard$292f$cuentas$2d$inversion$2f5b$id$5d2f$page$2f$actions$2e$js__$7b$__ACTIONS_MODULE0__$3d3e$__$225b$project$5d2f$src$2f$components$2f$layout$2f$Topbar$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29222c$__ACTIONS_MODULE1__$3d3e$__$225b$project$5d2f$src$2f$app$2f28$dashboard$292f$cuentas$2d$inversion$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$2922$__$7d$__$5b$app$2d$rsc$5d$__$28$server__actions__loader$2c$__ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i('[project]/.next-internal/server/app/(dashboard)/cuentas-inversion/[id]/page/actions.js { ACTIONS_MODULE0 => "[project]/src/components/layout/Topbar.tsx [app-rsc] (ecmascript)", ACTIONS_MODULE1 => "[project]/src/app/(dashboard)/cuentas-inversion/actions.ts [app-rsc] (ecmascript)" } [app-rsc] (server actions loader, ecmascript) <locals>');
var __turbopack_async_dependencies__ = __turbopack_handle_async_dependencies__([
    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f28$dashboard$292f$cuentas$2d$inversion$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__,
    __TURBOPACK__imported__module__$5b$project$5d2f2e$next$2d$internal$2f$server$2f$app$2f28$dashboard$292f$cuentas$2d$inversion$2f5b$id$5d2f$page$2f$actions$2e$js__$7b$__ACTIONS_MODULE0__$3d3e$__$225b$project$5d2f$src$2f$components$2f$layout$2f$Topbar$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29222c$__ACTIONS_MODULE1__$3d3e$__$225b$project$5d2f$src$2f$app$2f28$dashboard$292f$cuentas$2d$inversion$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$2922$__$7d$__$5b$app$2d$rsc$5d$__$28$server__actions__loader$2c$__ecmascript$29$__$3c$locals$3e$__
]);
([__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f28$dashboard$292f$cuentas$2d$inversion$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__, __TURBOPACK__imported__module__$5b$project$5d2f2e$next$2d$internal$2f$server$2f$app$2f28$dashboard$292f$cuentas$2d$inversion$2f5b$id$5d2f$page$2f$actions$2e$js__$7b$__ACTIONS_MODULE0__$3d3e$__$225b$project$5d2f$src$2f$components$2f$layout$2f$Topbar$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29222c$__ACTIONS_MODULE1__$3d3e$__$225b$project$5d2f$src$2f$app$2f28$dashboard$292f$cuentas$2d$inversion$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$2922$__$7d$__$5b$app$2d$rsc$5d$__$28$server__actions__loader$2c$__ecmascript$29$__$3c$locals$3e$__] = __turbopack_async_dependencies__.then ? (await __turbopack_async_dependencies__)() : __turbopack_async_dependencies__);
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, false);}),
"[project]/.next-internal/server/app/(dashboard)/cuentas-inversion/[id]/page/actions.js { ACTIONS_MODULE0 => \"[project]/src/components/layout/Topbar.tsx [app-rsc] (ecmascript)\", ACTIONS_MODULE1 => \"[project]/src/app/(dashboard)/cuentas-inversion/actions.ts [app-rsc] (ecmascript)\" } [app-rsc] (server actions loader, ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname, a: __turbopack_async_module__ } = __turbopack_context__;
__turbopack_async_module__(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {
__turbopack_context__.s({
    "0011ff4319847fa321c161740d2e30453828714a2e": (()=>__TURBOPACK__imported__module__$5b$project$5d2f2e$next$2d$internal$2f$server$2f$app$2f28$dashboard$292f$cuentas$2d$inversion$2f5b$id$5d2f$page$2f$actions$2e$js__$7b$__ACTIONS_MODULE0__$3d3e$__$225b$project$5d2f$src$2f$components$2f$layout$2f$Topbar$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29222c$__ACTIONS_MODULE1__$3d3e$__$225b$project$5d2f$src$2f$app$2f28$dashboard$292f$cuentas$2d$inversion$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$2922$__$7d$__$5b$app$2d$rsc$5d$__$28$server__actions__loader$2c$__ecmascript$29$__$3c$exports$3e$__["0011ff4319847fa321c161740d2e30453828714a2e"]),
    "60501021f2a99b12807a2047a717d7a5f8d3c8d05d": (()=>__TURBOPACK__imported__module__$5b$project$5d2f2e$next$2d$internal$2f$server$2f$app$2f28$dashboard$292f$cuentas$2d$inversion$2f5b$id$5d2f$page$2f$actions$2e$js__$7b$__ACTIONS_MODULE0__$3d3e$__$225b$project$5d2f$src$2f$components$2f$layout$2f$Topbar$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29222c$__ACTIONS_MODULE1__$3d3e$__$225b$project$5d2f$src$2f$app$2f28$dashboard$292f$cuentas$2d$inversion$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$2922$__$7d$__$5b$app$2d$rsc$5d$__$28$server__actions__loader$2c$__ecmascript$29$__$3c$exports$3e$__["60501021f2a99b12807a2047a717d7a5f8d3c8d05d"]),
    "60582695dbbb046ce2cc072ee4a82a0ff1a754cce2": (()=>__TURBOPACK__imported__module__$5b$project$5d2f2e$next$2d$internal$2f$server$2f$app$2f28$dashboard$292f$cuentas$2d$inversion$2f5b$id$5d2f$page$2f$actions$2e$js__$7b$__ACTIONS_MODULE0__$3d3e$__$225b$project$5d2f$src$2f$components$2f$layout$2f$Topbar$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29222c$__ACTIONS_MODULE1__$3d3e$__$225b$project$5d2f$src$2f$app$2f28$dashboard$292f$cuentas$2d$inversion$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$2922$__$7d$__$5b$app$2d$rsc$5d$__$28$server__actions__loader$2c$__ecmascript$29$__$3c$exports$3e$__["60582695dbbb046ce2cc072ee4a82a0ff1a754cce2"]),
    "60865beb05caebbc767d1ae2fa01f13b5991ea2d00": (()=>__TURBOPACK__imported__module__$5b$project$5d2f2e$next$2d$internal$2f$server$2f$app$2f28$dashboard$292f$cuentas$2d$inversion$2f5b$id$5d2f$page$2f$actions$2e$js__$7b$__ACTIONS_MODULE0__$3d3e$__$225b$project$5d2f$src$2f$components$2f$layout$2f$Topbar$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29222c$__ACTIONS_MODULE1__$3d3e$__$225b$project$5d2f$src$2f$app$2f28$dashboard$292f$cuentas$2d$inversion$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$2922$__$7d$__$5b$app$2d$rsc$5d$__$28$server__actions__loader$2c$__ecmascript$29$__$3c$exports$3e$__["60865beb05caebbc767d1ae2fa01f13b5991ea2d00"]),
    "60e12128710bd8b2db31fa497a12a16323be8db45d": (()=>__TURBOPACK__imported__module__$5b$project$5d2f2e$next$2d$internal$2f$server$2f$app$2f28$dashboard$292f$cuentas$2d$inversion$2f5b$id$5d2f$page$2f$actions$2e$js__$7b$__ACTIONS_MODULE0__$3d3e$__$225b$project$5d2f$src$2f$components$2f$layout$2f$Topbar$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29222c$__ACTIONS_MODULE1__$3d3e$__$225b$project$5d2f$src$2f$app$2f28$dashboard$292f$cuentas$2d$inversion$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$2922$__$7d$__$5b$app$2d$rsc$5d$__$28$server__actions__loader$2c$__ecmascript$29$__$3c$exports$3e$__["60e12128710bd8b2db31fa497a12a16323be8db45d"])
});
var __TURBOPACK__imported__module__$5b$project$5d2f2e$next$2d$internal$2f$server$2f$app$2f28$dashboard$292f$cuentas$2d$inversion$2f5b$id$5d2f$page$2f$actions$2e$js__$7b$__ACTIONS_MODULE0__$3d3e$__$225b$project$5d2f$src$2f$components$2f$layout$2f$Topbar$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29222c$__ACTIONS_MODULE1__$3d3e$__$225b$project$5d2f$src$2f$app$2f28$dashboard$292f$cuentas$2d$inversion$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$2922$__$7d$__$5b$app$2d$rsc$5d$__$28$server__actions__loader$2c$__ecmascript$29$__$3c$module__evaluation$3e$__ = __turbopack_context__.i('[project]/.next-internal/server/app/(dashboard)/cuentas-inversion/[id]/page/actions.js { ACTIONS_MODULE0 => "[project]/src/components/layout/Topbar.tsx [app-rsc] (ecmascript)", ACTIONS_MODULE1 => "[project]/src/app/(dashboard)/cuentas-inversion/actions.ts [app-rsc] (ecmascript)" } [app-rsc] (server actions loader, ecmascript) <module evaluation>');
var __TURBOPACK__imported__module__$5b$project$5d2f2e$next$2d$internal$2f$server$2f$app$2f28$dashboard$292f$cuentas$2d$inversion$2f5b$id$5d2f$page$2f$actions$2e$js__$7b$__ACTIONS_MODULE0__$3d3e$__$225b$project$5d2f$src$2f$components$2f$layout$2f$Topbar$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29222c$__ACTIONS_MODULE1__$3d3e$__$225b$project$5d2f$src$2f$app$2f28$dashboard$292f$cuentas$2d$inversion$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$2922$__$7d$__$5b$app$2d$rsc$5d$__$28$server__actions__loader$2c$__ecmascript$29$__$3c$exports$3e$__ = __turbopack_context__.i('[project]/.next-internal/server/app/(dashboard)/cuentas-inversion/[id]/page/actions.js { ACTIONS_MODULE0 => "[project]/src/components/layout/Topbar.tsx [app-rsc] (ecmascript)", ACTIONS_MODULE1 => "[project]/src/app/(dashboard)/cuentas-inversion/actions.ts [app-rsc] (ecmascript)" } [app-rsc] (server actions loader, ecmascript) <exports>');
var __turbopack_async_dependencies__ = __turbopack_handle_async_dependencies__([
    __TURBOPACK__imported__module__$5b$project$5d2f2e$next$2d$internal$2f$server$2f$app$2f28$dashboard$292f$cuentas$2d$inversion$2f5b$id$5d2f$page$2f$actions$2e$js__$7b$__ACTIONS_MODULE0__$3d3e$__$225b$project$5d2f$src$2f$components$2f$layout$2f$Topbar$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29222c$__ACTIONS_MODULE1__$3d3e$__$225b$project$5d2f$src$2f$app$2f28$dashboard$292f$cuentas$2d$inversion$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$2922$__$7d$__$5b$app$2d$rsc$5d$__$28$server__actions__loader$2c$__ecmascript$29$__$3c$module__evaluation$3e$__,
    __TURBOPACK__imported__module__$5b$project$5d2f2e$next$2d$internal$2f$server$2f$app$2f28$dashboard$292f$cuentas$2d$inversion$2f5b$id$5d2f$page$2f$actions$2e$js__$7b$__ACTIONS_MODULE0__$3d3e$__$225b$project$5d2f$src$2f$components$2f$layout$2f$Topbar$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29222c$__ACTIONS_MODULE1__$3d3e$__$225b$project$5d2f$src$2f$app$2f28$dashboard$292f$cuentas$2d$inversion$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$2922$__$7d$__$5b$app$2d$rsc$5d$__$28$server__actions__loader$2c$__ecmascript$29$__$3c$exports$3e$__
]);
([__TURBOPACK__imported__module__$5b$project$5d2f2e$next$2d$internal$2f$server$2f$app$2f28$dashboard$292f$cuentas$2d$inversion$2f5b$id$5d2f$page$2f$actions$2e$js__$7b$__ACTIONS_MODULE0__$3d3e$__$225b$project$5d2f$src$2f$components$2f$layout$2f$Topbar$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29222c$__ACTIONS_MODULE1__$3d3e$__$225b$project$5d2f$src$2f$app$2f28$dashboard$292f$cuentas$2d$inversion$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$2922$__$7d$__$5b$app$2d$rsc$5d$__$28$server__actions__loader$2c$__ecmascript$29$__$3c$module__evaluation$3e$__, __TURBOPACK__imported__module__$5b$project$5d2f2e$next$2d$internal$2f$server$2f$app$2f28$dashboard$292f$cuentas$2d$inversion$2f5b$id$5d2f$page$2f$actions$2e$js__$7b$__ACTIONS_MODULE0__$3d3e$__$225b$project$5d2f$src$2f$components$2f$layout$2f$Topbar$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29222c$__ACTIONS_MODULE1__$3d3e$__$225b$project$5d2f$src$2f$app$2f28$dashboard$292f$cuentas$2d$inversion$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$2922$__$7d$__$5b$app$2d$rsc$5d$__$28$server__actions__loader$2c$__ecmascript$29$__$3c$exports$3e$__] = __turbopack_async_dependencies__.then ? (await __turbopack_async_dependencies__)() : __turbopack_async_dependencies__);
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
"[project]/src/lib/services/config.service.ts [app-rsc] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname, a: __turbopack_async_module__ } = __turbopack_context__;
__turbopack_async_module__(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {
__turbopack_context__.s({
    "getActivosPrecios": (()=>getActivosPrecios),
    "getClienteDeMap": (()=>getClienteDeMap),
    "getMesActivo": (()=>getMesActivo),
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
"[project]/src/components/modules/cuentas-inversion/CreateComitenteModal.tsx (client reference/proxy) <module evaluation>": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "CreateComitenteModal": (()=>CreateComitenteModal)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$server$2d$dom$2d$turbopack$2d$server$2d$edge$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-server-dom-turbopack-server-edge.js [app-rsc] (ecmascript)");
;
const CreateComitenteModal = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$server$2d$dom$2d$turbopack$2d$server$2d$edge$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerClientReference"])(function() {
    throw new Error("Attempted to call CreateComitenteModal() from the server but CreateComitenteModal is on the client. It's not possible to invoke a client function from the server, it can only be rendered as a Component or passed to props of a Client Component.");
}, "[project]/src/components/modules/cuentas-inversion/CreateComitenteModal.tsx <module evaluation>", "CreateComitenteModal");
}}),
"[project]/src/components/modules/cuentas-inversion/CreateComitenteModal.tsx (client reference/proxy)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "CreateComitenteModal": (()=>CreateComitenteModal)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$server$2d$dom$2d$turbopack$2d$server$2d$edge$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-server-dom-turbopack-server-edge.js [app-rsc] (ecmascript)");
;
const CreateComitenteModal = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$server$2d$dom$2d$turbopack$2d$server$2d$edge$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerClientReference"])(function() {
    throw new Error("Attempted to call CreateComitenteModal() from the server but CreateComitenteModal is on the client. It's not possible to invoke a client function from the server, it can only be rendered as a Component or passed to props of a Client Component.");
}, "[project]/src/components/modules/cuentas-inversion/CreateComitenteModal.tsx", "CreateComitenteModal");
}}),
"[project]/src/components/modules/cuentas-inversion/CreateComitenteModal.tsx [app-rsc] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$modules$2f$cuentas$2d$inversion$2f$CreateComitenteModal$2e$tsx__$28$client__reference$2f$proxy$29$__$3c$module__evaluation$3e$__ = __turbopack_context__.i("[project]/src/components/modules/cuentas-inversion/CreateComitenteModal.tsx (client reference/proxy) <module evaluation>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$modules$2f$cuentas$2d$inversion$2f$CreateComitenteModal$2e$tsx__$28$client__reference$2f$proxy$29$__ = __turbopack_context__.i("[project]/src/components/modules/cuentas-inversion/CreateComitenteModal.tsx (client reference/proxy)");
;
__turbopack_context__.n(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$modules$2f$cuentas$2d$inversion$2f$CreateComitenteModal$2e$tsx__$28$client__reference$2f$proxy$29$__);
}}),
"[project]/src/components/modules/cuentas-inversion/EditComitenteForm.tsx (client reference/proxy) <module evaluation>": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "EditComitenteForm": (()=>EditComitenteForm)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$server$2d$dom$2d$turbopack$2d$server$2d$edge$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-server-dom-turbopack-server-edge.js [app-rsc] (ecmascript)");
;
const EditComitenteForm = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$server$2d$dom$2d$turbopack$2d$server$2d$edge$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerClientReference"])(function() {
    throw new Error("Attempted to call EditComitenteForm() from the server but EditComitenteForm is on the client. It's not possible to invoke a client function from the server, it can only be rendered as a Component or passed to props of a Client Component.");
}, "[project]/src/components/modules/cuentas-inversion/EditComitenteForm.tsx <module evaluation>", "EditComitenteForm");
}}),
"[project]/src/components/modules/cuentas-inversion/EditComitenteForm.tsx (client reference/proxy)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "EditComitenteForm": (()=>EditComitenteForm)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$server$2d$dom$2d$turbopack$2d$server$2d$edge$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-server-dom-turbopack-server-edge.js [app-rsc] (ecmascript)");
;
const EditComitenteForm = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$server$2d$dom$2d$turbopack$2d$server$2d$edge$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerClientReference"])(function() {
    throw new Error("Attempted to call EditComitenteForm() from the server but EditComitenteForm is on the client. It's not possible to invoke a client function from the server, it can only be rendered as a Component or passed to props of a Client Component.");
}, "[project]/src/components/modules/cuentas-inversion/EditComitenteForm.tsx", "EditComitenteForm");
}}),
"[project]/src/components/modules/cuentas-inversion/EditComitenteForm.tsx [app-rsc] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$modules$2f$cuentas$2d$inversion$2f$EditComitenteForm$2e$tsx__$28$client__reference$2f$proxy$29$__$3c$module__evaluation$3e$__ = __turbopack_context__.i("[project]/src/components/modules/cuentas-inversion/EditComitenteForm.tsx (client reference/proxy) <module evaluation>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$modules$2f$cuentas$2d$inversion$2f$EditComitenteForm$2e$tsx__$28$client__reference$2f$proxy$29$__ = __turbopack_context__.i("[project]/src/components/modules/cuentas-inversion/EditComitenteForm.tsx (client reference/proxy)");
;
__turbopack_context__.n(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$modules$2f$cuentas$2d$inversion$2f$EditComitenteForm$2e$tsx__$28$client__reference$2f$proxy$29$__);
}}),
"[project]/src/components/modules/cuentas-inversion/EditSaldosForm.tsx (client reference/proxy) <module evaluation>": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "EditSaldosForm": (()=>EditSaldosForm)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$server$2d$dom$2d$turbopack$2d$server$2d$edge$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-server-dom-turbopack-server-edge.js [app-rsc] (ecmascript)");
;
const EditSaldosForm = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$server$2d$dom$2d$turbopack$2d$server$2d$edge$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerClientReference"])(function() {
    throw new Error("Attempted to call EditSaldosForm() from the server but EditSaldosForm is on the client. It's not possible to invoke a client function from the server, it can only be rendered as a Component or passed to props of a Client Component.");
}, "[project]/src/components/modules/cuentas-inversion/EditSaldosForm.tsx <module evaluation>", "EditSaldosForm");
}}),
"[project]/src/components/modules/cuentas-inversion/EditSaldosForm.tsx (client reference/proxy)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "EditSaldosForm": (()=>EditSaldosForm)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$server$2d$dom$2d$turbopack$2d$server$2d$edge$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-server-dom-turbopack-server-edge.js [app-rsc] (ecmascript)");
;
const EditSaldosForm = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$server$2d$dom$2d$turbopack$2d$server$2d$edge$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerClientReference"])(function() {
    throw new Error("Attempted to call EditSaldosForm() from the server but EditSaldosForm is on the client. It's not possible to invoke a client function from the server, it can only be rendered as a Component or passed to props of a Client Component.");
}, "[project]/src/components/modules/cuentas-inversion/EditSaldosForm.tsx", "EditSaldosForm");
}}),
"[project]/src/components/modules/cuentas-inversion/EditSaldosForm.tsx [app-rsc] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$modules$2f$cuentas$2d$inversion$2f$EditSaldosForm$2e$tsx__$28$client__reference$2f$proxy$29$__$3c$module__evaluation$3e$__ = __turbopack_context__.i("[project]/src/components/modules/cuentas-inversion/EditSaldosForm.tsx (client reference/proxy) <module evaluation>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$modules$2f$cuentas$2d$inversion$2f$EditSaldosForm$2e$tsx__$28$client__reference$2f$proxy$29$__ = __turbopack_context__.i("[project]/src/components/modules/cuentas-inversion/EditSaldosForm.tsx (client reference/proxy)");
;
__turbopack_context__.n(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$modules$2f$cuentas$2d$inversion$2f$EditSaldosForm$2e$tsx__$28$client__reference$2f$proxy$29$__);
}}),
"[project]/src/components/modules/cuentas-inversion/DeleteComitenteButton.tsx (client reference/proxy) <module evaluation>": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "DeleteComitenteButton": (()=>DeleteComitenteButton)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$server$2d$dom$2d$turbopack$2d$server$2d$edge$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-server-dom-turbopack-server-edge.js [app-rsc] (ecmascript)");
;
const DeleteComitenteButton = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$server$2d$dom$2d$turbopack$2d$server$2d$edge$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerClientReference"])(function() {
    throw new Error("Attempted to call DeleteComitenteButton() from the server but DeleteComitenteButton is on the client. It's not possible to invoke a client function from the server, it can only be rendered as a Component or passed to props of a Client Component.");
}, "[project]/src/components/modules/cuentas-inversion/DeleteComitenteButton.tsx <module evaluation>", "DeleteComitenteButton");
}}),
"[project]/src/components/modules/cuentas-inversion/DeleteComitenteButton.tsx (client reference/proxy)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "DeleteComitenteButton": (()=>DeleteComitenteButton)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$server$2d$dom$2d$turbopack$2d$server$2d$edge$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-server-dom-turbopack-server-edge.js [app-rsc] (ecmascript)");
;
const DeleteComitenteButton = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$server$2d$dom$2d$turbopack$2d$server$2d$edge$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerClientReference"])(function() {
    throw new Error("Attempted to call DeleteComitenteButton() from the server but DeleteComitenteButton is on the client. It's not possible to invoke a client function from the server, it can only be rendered as a Component or passed to props of a Client Component.");
}, "[project]/src/components/modules/cuentas-inversion/DeleteComitenteButton.tsx", "DeleteComitenteButton");
}}),
"[project]/src/components/modules/cuentas-inversion/DeleteComitenteButton.tsx [app-rsc] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$modules$2f$cuentas$2d$inversion$2f$DeleteComitenteButton$2e$tsx__$28$client__reference$2f$proxy$29$__$3c$module__evaluation$3e$__ = __turbopack_context__.i("[project]/src/components/modules/cuentas-inversion/DeleteComitenteButton.tsx (client reference/proxy) <module evaluation>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$modules$2f$cuentas$2d$inversion$2f$DeleteComitenteButton$2e$tsx__$28$client__reference$2f$proxy$29$__ = __turbopack_context__.i("[project]/src/components/modules/cuentas-inversion/DeleteComitenteButton.tsx (client reference/proxy)");
;
__turbopack_context__.n(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$modules$2f$cuentas$2d$inversion$2f$DeleteComitenteButton$2e$tsx__$28$client__reference$2f$proxy$29$__);
}}),
"[project]/src/app/(dashboard)/cuentas-inversion/[id]/page.tsx [app-rsc] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname, a: __turbopack_async_module__ } = __turbopack_context__;
__turbopack_async_module__(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {
__turbopack_context__.s({
    "default": (()=>CuentaInversionPage)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-jsx-dev-runtime.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$api$2f$navigation$2e$react$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$module__evaluation$3e$__ = __turbopack_context__.i("[project]/node_modules/next/dist/api/navigation.react-server.js [app-rsc] (ecmascript) <module evaluation>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$components$2f$navigation$2e$react$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/client/components/navigation.react-server.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/client/app-dir/link.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/prisma.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$services$2f$config$2e$service$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/services/config.service.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$modules$2f$cuentas$2d$inversion$2f$CreateComitenteModal$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/modules/cuentas-inversion/CreateComitenteModal.tsx [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$modules$2f$cuentas$2d$inversion$2f$EditComitenteForm$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/modules/cuentas-inversion/EditComitenteForm.tsx [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$modules$2f$cuentas$2d$inversion$2f$EditSaldosForm$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/modules/cuentas-inversion/EditSaldosForm.tsx [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$modules$2f$cuentas$2d$inversion$2f$DeleteComitenteButton$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/modules/cuentas-inversion/DeleteComitenteButton.tsx [app-rsc] (ecmascript)");
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
// ── Helpers ───────────────────────────────────────────────────────────────────
function fmt(n, dec = 2) {
    return n.toLocaleString("es-AR", {
        minimumFractionDigits: dec,
        maximumFractionDigits: dec
    });
}
function fmtDate(v) {
    if (!v) return "—";
    return v.toLocaleDateString("es-AR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        timeZone: "UTC"
    });
}
const PRODUCTOR_LABEL = {
    IPS: "IPS",
    BYG: "BYG",
    OTRO: "Otro"
};
const PRODUCTOR_CLS = {
    IPS: "bg-violet-50 text-violet-700",
    BYG: "bg-blue-50 text-blue-700",
    OTRO: "bg-slate-100 text-slate-600"
};
const TIPO_LABEL = {
    COMPRA_BONO: "Compra Bono",
    VENTA_BONO: "Venta Bono",
    COMPRA_ACCION: "Compra Acción",
    VENTA_ACCION: "Venta Acción",
    COMPRA_CEDEAR: "Compra CEDEAR",
    VENTA_CEDEAR: "Venta CEDEAR",
    CAUCION_COLOCADORA: "Caución Coloc.",
    CAUCION_TOMADORA: "Caución Tomad.",
    FUTURO: "Futuro",
    OPCION_CALL: "Opción Call",
    OPCION_PUT: "Opción Put",
    MEP: "MEP",
    SENEBI: "SENEBI"
};
function comGenReport(op) {
    if (op.esSenebi) return op.senebiBruto ?? 0;
    const vb = op.cantidad * op.precio;
    return (op.comisionFija ?? 0) + vb * ((op.comisionPct ?? 0) / 100);
}
// ── UI Components ─────────────────────────────────────────────────────────────
function TabLink({ href, active, children }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"], {
        href: href,
        className: `px-4 py-2.5 text-xs font-bold border-b-2 -mb-px transition-colors whitespace-nowrap ${active ? "border-blue-600 text-blue-700" : "border-transparent text-slate-500 hover:text-slate-700"}`,
        children: children
    }, void 0, false, {
        fileName: "[project]/src/app/(dashboard)/cuentas-inversion/[id]/page.tsx",
        lineNumber: 92,
        columnNumber: 5
    }, this);
}
function StatCard({ label, value }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col gap-1",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                className: "text-[10px] font-black uppercase tracking-widest text-slate-400",
                children: label
            }, void 0, false, {
                fileName: "[project]/src/app/(dashboard)/cuentas-inversion/[id]/page.tsx",
                lineNumber: 106,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "text-3xl font-black text-slate-900 tabular-nums",
                children: value
            }, void 0, false, {
                fileName: "[project]/src/app/(dashboard)/cuentas-inversion/[id]/page.tsx",
                lineNumber: 107,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/app/(dashboard)/cuentas-inversion/[id]/page.tsx",
        lineNumber: 105,
        columnNumber: 5
    }, this);
}
function ResumeCard({ label, value, sub, highlight }) {
    const colors = {
        blue: "border-t-blue-500 text-blue-700",
        emerald: "border-t-emerald-500 text-emerald-700",
        violet: "border-t-violet-500 text-violet-700",
        rose: "border-t-rose-400 text-rose-600"
    };
    const hl = highlight ? colors[highlight] : "";
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: `bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col gap-0.5 ${highlight ? "border-t-[3px] " + hl : ""}`,
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                className: "text-[10px] font-black uppercase tracking-widest text-slate-400",
                children: label
            }, void 0, false, {
                fileName: "[project]/src/app/(dashboard)/cuentas-inversion/[id]/page.tsx",
                lineNumber: 124,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                className: `text-xl font-black tabular-nums font-mono ${highlight ? hl.split(" ")[1] : "text-slate-900"}`,
                children: value
            }, void 0, false, {
                fileName: "[project]/src/app/(dashboard)/cuentas-inversion/[id]/page.tsx",
                lineNumber: 125,
                columnNumber: 7
            }, this),
            sub && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                className: "text-[10px] text-slate-400 font-mono",
                children: sub
            }, void 0, false, {
                fileName: "[project]/src/app/(dashboard)/cuentas-inversion/[id]/page.tsx",
                lineNumber: 126,
                columnNumber: 15
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/app/(dashboard)/cuentas-inversion/[id]/page.tsx",
        lineNumber: 123,
        columnNumber: 5
    }, this);
}
async function CuentaInversionPage({ params, searchParams }) {
    const { id } = await params;
    const { editId, editSaldosId, tab: tabParam, productor: prodParam, mes: mesParam } = await searchParams;
    // "comitentes" kept as backward-compat alias → resolves to "clientes"
    const tab = tabParam === "comitentes" || !tabParam ? "clientes" : tabParam;
    // Reportes filter params (always computed, cheap)
    const now = new Date();
    const mesActual = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const reportProductor = prodParam === "BYG" || prodParam === "OTRO" ? prodParam : "IPS";
    const reportMes = mesParam ?? mesActual;
    const [rYear, rMonth] = reportMes.split("-").map(Number);
    const reportMesStart = new Date(Date.UTC(rYear, rMonth - 1, 1));
    const reportMesEnd = new Date(Date.UTC(rYear, rMonth, 1));
    const reportMesLabel = reportMesStart.toLocaleDateString("es-AR", {
        month: "long",
        year: "numeric",
        timeZone: "UTC"
    });
    const reportPrevMes = (()=>{
        const d = new Date(Date.UTC(rYear, rMonth - 2, 1));
        return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
    })();
    const reportNextMes = (()=>{
        const d = new Date(Date.UTC(rYear, rMonth, 1));
        return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
    })();
    const isCurrentMes = reportMes === mesActual;
    const [cuenta, mirroredCarteras, productores] = await Promise.all([
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].cuentaInversion.findUnique({
            where: {
                id
            },
            include: {
                ComitenteInversion: {
                    orderBy: {
                        nroComitente: "asc"
                    },
                    include: {
                        SaldoComitenteInversion: true,
                        Cartera: {
                            select: {
                                slug: true,
                                nombre: true,
                                mirrorInInvestmentAccounts: true
                            }
                        },
                        _count: {
                            select: {
                                HoldingComitenteInversion: true
                            }
                        }
                    }
                }
            }
        }),
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].cartera.findMany({
            where: {
                mirrorInInvestmentAccounts: true,
                comitenteNumber: {
                    not: null
                }
            },
            select: {
                id: true,
                nombre: true,
                slug: true,
                comitenteNumber: true,
                investmentAccountType: true,
                saldoPesos: true,
                saldoUSDCable: true,
                saldoUSDMep: true,
                _count: {
                    select: {
                        PosicionCartera: true
                    }
                }
            },
            orderBy: {
                nombre: "asc"
            }
        }),
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$services$2f$config$2e$service$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getProductoresConfig"])()
    ]);
    if (!cuenta) (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$components$2f$navigation$2e$react$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["notFound"])();
    const baseUrl = `/cuentas-inversion/${id}`;
    // Split comitentes
    const clienteComitentes = cuenta.ComitenteInversion.filter((c)=>!c.esPropioBYG);
    const propiosComitentes = cuenta.ComitenteInversion.filter((c)=>c.esPropioBYG);
    const activeClientes = clienteComitentes.filter((c)=>c.activo);
    const holdingsClientes = activeClientes.reduce((s, c)=>s + c._count.HoldingComitenteInversion, 0);
    const holdingsPropios = propiosComitentes.reduce((s, c)=>s + c._count.HoldingComitenteInversion, 0);
    // comitente → productor map (used by comisiones + reportes)
    const comitenteProductorMap = new Map(cuenta.ComitenteInversion.map((c)=>[
            c.id,
            c.productor
        ]));
    // ── Comisiones data ───────────────────────────────────────────────────────
    let comisionesStats = null;
    let pendientesOps = [];
    if (tab === "comisiones") {
        const cids = cuenta.ComitenteInversion.map((c)=>c.id);
        const acctWhere = cids.length > 0 ? {
            OR: [
                {
                    cuentaInversionId: id
                },
                {
                    comitenteId: {
                        in: cids
                    }
                }
            ]
        } : {
            cuentaInversionId: id
        };
        const mes1 = new Date(now.getFullYear(), now.getMonth(), 1);
        const mes2 = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        const [cnt0, cnt1, cnt2, cnt3, rawOps] = await Promise.all([
            __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].operacionBolsa.count({
                where: {
                    ...acctWhere,
                    anulada: false,
                    estado: "PENDIENTE_CONCERTACION"
                }
            }),
            __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].operacionBolsa.count({
                where: {
                    ...acctWhere,
                    anulada: false,
                    estado: "CONCERTADA"
                }
            }),
            __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].operacionBolsa.count({
                where: {
                    ...acctWhere,
                    anulada: false,
                    estado: "LIQUIDADA"
                }
            }),
            __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].operacionBolsa.count({
                where: {
                    ...acctWhere,
                    anulada: false,
                    fechaOperativa: {
                        gte: mes1,
                        lt: mes2
                    }
                }
            }),
            __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].operacionBolsa.findMany({
                where: {
                    ...acctWhere,
                    anulada: false,
                    estado: "PENDIENTE_CONCERTACION"
                },
                orderBy: [
                    {
                        fechaOperativa: "asc"
                    },
                    {
                        fechaCarga: "asc"
                    }
                ],
                include: {
                    ComitenteInversion: {
                        select: {
                            nombre: true
                        }
                    },
                    Cartera: {
                        select: {
                            nombre: true
                        }
                    },
                    OperadorCarga: {
                        select: {
                            name: true
                        }
                    }
                }
            })
        ]);
        comisionesStats = {
            pendientesCount: cnt0,
            concertadasCount: cnt1,
            liquidadasCount: cnt2,
            totalMesCount: cnt3
        };
        pendientesOps = rawOps.map((op)=>({
                id: op.id,
                fechaOperativa: op.fechaOperativa,
                tipoOperacion: op.tipoOperacion,
                ticker: op.ticker,
                cantidad: Number(op.cantidad),
                precio: Number(op.precio),
                moneda: op.moneda,
                resultadoBruto: op.resultadoBruto !== null ? Number(op.resultadoBruto) : null,
                comisionPct: op.comisionPct !== null ? Number(op.comisionPct) : null,
                comisionFija: op.comisionFija !== null ? Number(op.comisionFija) : null,
                operador: op.OperadorCarga.name ?? "—",
                sujeto: op.ComitenteInversion?.nombre ?? op.Cartera?.nombre ?? "—"
            }));
    }
    const opsByFecha = new Map();
    for (const op of pendientesOps){
        const key = op.fechaOperativa ? op.fechaOperativa.toISOString().split("T")[0] : "sin-fecha";
        if (!opsByFecha.has(key)) opsByFecha.set(key, []);
        opsByFecha.get(key).push(op);
    }
    // ── Reportes data ─────────────────────────────────────────────────────────
    let reportOps = [];
    let reportCfg = {
        iibbPct: 3,
        ipsPct: 40,
        otroPct: 40
    };
    if (tab === "reportes") {
        const cids = cuenta.ComitenteInversion.map((c)=>c.id);
        const acctWhere = cids.length > 0 ? {
            OR: [
                {
                    cuentaInversionId: id
                },
                {
                    comitenteId: {
                        in: cids
                    }
                }
            ]
        } : {
            cuentaInversionId: id
        };
        const [rawOps, cfgRows] = await Promise.all([
            __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].operacionBolsa.findMany({
                where: {
                    ...acctWhere,
                    anulada: false,
                    estado: {
                        in: [
                            "CONCERTADA",
                            "LIQUIDADA"
                        ]
                    },
                    fechaConcertacion: {
                        gte: reportMesStart,
                        lt: reportMesEnd
                    }
                },
                orderBy: [
                    {
                        fechaConcertacion: "asc"
                    },
                    {
                        fechaCarga: "asc"
                    }
                ],
                include: {
                    ComitenteInversion: {
                        select: {
                            nombre: true,
                            productor: true
                        }
                    },
                    Cartera: {
                        select: {
                            nombre: true
                        }
                    },
                    OperadorCarga: {
                        select: {
                            name: true
                        }
                    }
                }
            }),
            __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].config.findMany({
                where: {
                    clave: {
                        in: [
                            "bolsa_iibb_pct",
                            "bolsa_ips_pct",
                            "bolsa_otro_pct"
                        ]
                    }
                }
            })
        ]);
        const cfgMap = Object.fromEntries(cfgRows.map((r)=>[
                r.clave,
                parseFloat(r.valor)
            ]));
        reportCfg = {
            iibbPct: cfgMap["bolsa_iibb_pct"] ?? 3,
            ipsPct: cfgMap["bolsa_ips_pct"] ?? 40,
            otroPct: cfgMap["bolsa_otro_pct"] ?? 40
        };
        const allOps = rawOps.map((op)=>({
                id: op.id,
                fechaConcertacion: op.fechaConcertacion,
                tipoOperacion: op.tipoOperacion,
                ticker: op.ticker,
                cantidad: Number(op.cantidad),
                precio: Number(op.precio),
                moneda: op.moneda,
                comisionPct: op.comisionPct != null ? Number(op.comisionPct) : null,
                comisionFija: op.comisionFija != null ? Number(op.comisionFija) : null,
                esSenebi: op.esSenebi,
                senebiBruto: op.senebiBruto != null ? Number(op.senebiBruto) : null,
                sujeto: op.ComitenteInversion?.nombre ?? op.Cartera?.nombre ?? "Cartera Propia",
                comitenteId: op.comitenteId,
                estado: op.estado,
                operador: op.OperadorCarga.name ?? "—"
            }));
        // Filter by selected productor
        reportOps = allOps.filter((op)=>{
            const prod = op.comitenteId ? comitenteProductorMap.get(op.comitenteId) ?? "BYG" : "BYG";
            return prod === reportProductor;
        });
    }
    // Resumen ejecutivo for selected producer
    const { iibbPct, ipsPct, otroPct } = reportCfg;
    const pctProductor = reportProductor === "IPS" ? ipsPct : reportProductor === "OTRO" ? otroPct : 0;
    const rTotalNormal = reportOps.filter((o)=>!o.esSenebi).reduce((s, o)=>s + comGenReport(o), 0);
    const rSenebi = reportOps.filter((o)=>o.esSenebi).reduce((s, o)=>s + comGenReport(o), 0);
    const rBruto = rTotalNormal + rSenebi;
    const rIibb = rBruto * (iibbPct / 100);
    const rNeto = rBruto - rIibb;
    const rAPagar = rNeto * (pctProductor / 100);
    const rRetiene = rNeto - rAPagar;
    const porClienteMap = new Map();
    for (const op of reportOps){
        const key = op.comitenteId ?? "__cartera__" + op.sujeto;
        if (!porClienteMap.has(key)) {
            porClienteMap.set(key, {
                sujeto: op.sujeto,
                comisionNormal: 0,
                senebi: 0,
                total: 0
            });
        }
        const r = porClienteMap.get(key);
        const gen = comGenReport(op);
        if (op.esSenebi) {
            r.senebi += gen;
        } else {
            r.comisionNormal += gen;
        }
        r.total += gen;
    }
    const clienteResumenes = Array.from(porClienteMap.values()).sort((a, b)=>b.total - a.total);
    // ── Render ────────────────────────────────────────────────────────────────
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "flex flex-col gap-8",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("header", {
                className: "flex flex-row items-end justify-between",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"], {
                                href: "/cuentas-inversion",
                                className: "text-[10px] font-black uppercase tracking-[0.3em] text-blue-600 hover:text-blue-700 transition-colors",
                                children: "← Cuentas de Inversión"
                            }, void 0, false, {
                                fileName: "[project]/src/app/(dashboard)/cuentas-inversion/[id]/page.tsx",
                                lineNumber: 356,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                                className: "text-3xl font-black text-slate-900 tracking-tight mt-1",
                                children: cuenta.nombre
                            }, void 0, false, {
                                fileName: "[project]/src/app/(dashboard)/cuentas-inversion/[id]/page.tsx",
                                lineNumber: 362,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-slate-500 mt-1 text-sm",
                                children: "Clientes, carteras y comisiones"
                            }, void 0, false, {
                                fileName: "[project]/src/app/(dashboard)/cuentas-inversion/[id]/page.tsx",
                                lineNumber: 363,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/app/(dashboard)/cuentas-inversion/[id]/page.tsx",
                        lineNumber: 355,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex items-center gap-2",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"], {
                                href: `${baseUrl}/precios`,
                                className: "px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors",
                                children: "Actualizar precios"
                            }, void 0, false, {
                                fileName: "[project]/src/app/(dashboard)/cuentas-inversion/[id]/page.tsx",
                                lineNumber: 366,
                                columnNumber: 11
                            }, this),
                            tab === "clientes" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$modules$2f$cuentas$2d$inversion$2f$CreateComitenteModal$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["CreateComitenteModal"], {
                                cuentaInversionId: id,
                                productores: productores
                            }, void 0, false, {
                                fileName: "[project]/src/app/(dashboard)/cuentas-inversion/[id]/page.tsx",
                                lineNumber: 373,
                                columnNumber: 13
                            }, this),
                            !cuenta.activa && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-full bg-slate-100 text-slate-500",
                                children: "Inactiva"
                            }, void 0, false, {
                                fileName: "[project]/src/app/(dashboard)/cuentas-inversion/[id]/page.tsx",
                                lineNumber: 376,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/app/(dashboard)/cuentas-inversion/[id]/page.tsx",
                        lineNumber: 365,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/app/(dashboard)/cuentas-inversion/[id]/page.tsx",
                lineNumber: 354,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex items-center border-b border-slate-200",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(TabLink, {
                        href: `${baseUrl}?tab=clientes`,
                        active: tab === "clientes",
                        children: "Clientes"
                    }, void 0, false, {
                        fileName: "[project]/src/app/(dashboard)/cuentas-inversion/[id]/page.tsx",
                        lineNumber: 385,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(TabLink, {
                        href: `${baseUrl}?tab=carteras`,
                        active: tab === "carteras",
                        children: "Carteras propias"
                    }, void 0, false, {
                        fileName: "[project]/src/app/(dashboard)/cuentas-inversion/[id]/page.tsx",
                        lineNumber: 386,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(TabLink, {
                        href: `${baseUrl}?tab=comisiones`,
                        active: tab === "comisiones",
                        children: "Comisiones"
                    }, void 0, false, {
                        fileName: "[project]/src/app/(dashboard)/cuentas-inversion/[id]/page.tsx",
                        lineNumber: 387,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(TabLink, {
                        href: `${baseUrl}?tab=reportes`,
                        active: tab === "reportes",
                        children: "Reportes"
                    }, void 0, false, {
                        fileName: "[project]/src/app/(dashboard)/cuentas-inversion/[id]/page.tsx",
                        lineNumber: 388,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/app/(dashboard)/cuentas-inversion/[id]/page.tsx",
                lineNumber: 384,
                columnNumber: 7
            }, this),
            tab === "clientes" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                className: "flex flex-col gap-6",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "grid grid-cols-2 lg:grid-cols-3 gap-4",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(StatCard, {
                                label: "Clientes activos",
                                value: activeClientes.length
                            }, void 0, false, {
                                fileName: "[project]/src/app/(dashboard)/cuentas-inversion/[id]/page.tsx",
                                lineNumber: 395,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(StatCard, {
                                label: "Holdings clientes",
                                value: holdingsClientes
                            }, void 0, false, {
                                fileName: "[project]/src/app/(dashboard)/cuentas-inversion/[id]/page.tsx",
                                lineNumber: 396,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(StatCard, {
                                label: "Actualizado",
                                value: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    className: "text-sm",
                                    children: cuenta.updatedAt.toLocaleDateString("es-AR", {
                                        day: "2-digit",
                                        month: "2-digit",
                                        year: "numeric"
                                    })
                                }, void 0, false, {
                                    fileName: "[project]/src/app/(dashboard)/cuentas-inversion/[id]/page.tsx",
                                    lineNumber: 399,
                                    columnNumber: 22
                                }, void 0)
                            }, void 0, false, {
                                fileName: "[project]/src/app/(dashboard)/cuentas-inversion/[id]/page.tsx",
                                lineNumber: 397,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/app/(dashboard)/cuentas-inversion/[id]/page.tsx",
                        lineNumber: 394,
                        columnNumber: 11
                    }, this),
                    clienteComitentes.length === 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "rounded-xl border border-slate-200 bg-white p-8 text-center",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            className: "text-sm text-slate-400 italic",
                            children: 'Sin clientes. Usar "Nuevo Comitente" arriba.'
                        }, void 0, false, {
                            fileName: "[project]/src/app/(dashboard)/cuentas-inversion/[id]/page.tsx",
                            lineNumber: 405,
                            columnNumber: 15
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/src/app/(dashboard)/cuentas-inversion/[id]/page.tsx",
                        lineNumber: 404,
                        columnNumber: 13
                    }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "rounded-xl border border-slate-200 overflow-hidden",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("table", {
                            className: "w-full text-xs",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("thead", {
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                                        className: "bg-slate-50 border-b border-slate-200",
                                        children: [
                                            "N° Comitente",
                                            "Cliente",
                                            "Productor",
                                            "ARS",
                                            "USD Cable",
                                            "USD MEP",
                                            "Holdings",
                                            ""
                                        ].map((h, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                className: `px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 ${i < 3 || i === 7 ? "text-left" : "text-right"}`,
                                                children: h
                                            }, h || `col-${i}`, false, {
                                                fileName: "[project]/src/app/(dashboard)/cuentas-inversion/[id]/page.tsx",
                                                lineNumber: 413,
                                                columnNumber: 23
                                            }, this))
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/(dashboard)/cuentas-inversion/[id]/page.tsx",
                                        lineNumber: 411,
                                        columnNumber: 19
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/src/app/(dashboard)/cuentas-inversion/[id]/page.tsx",
                                    lineNumber: 410,
                                    columnNumber: 17
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("tbody", {
                                    children: clienteComitentes.map((c)=>{
                                        const ars = Number(c.SaldoComitenteInversion?.saldoARS ?? 0);
                                        const cable = Number(c.SaldoComitenteInversion?.saldoUSDCable ?? 0);
                                        const mep = Number(c.SaldoComitenteInversion?.saldoUSDMep ?? 0);
                                        const isEditingData = editId === c.id;
                                        const isEditingSaldos = editSaldosId === c.id;
                                        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"].Fragment, {
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                                                    className: `border-b border-slate-50 last:border-0 transition-colors ${isEditingData || isEditingSaldos ? "bg-slate-50" : c.activo ? "bg-white hover:bg-slate-50/60" : "bg-slate-50 opacity-60"}`,
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                            className: "px-4 py-3 font-mono text-slate-700 font-semibold",
                                                            children: c.nroComitente
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/app/(dashboard)/cuentas-inversion/[id]/page.tsx",
                                                            lineNumber: 429,
                                                            columnNumber: 27
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                            className: "px-4 py-3 font-medium",
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"], {
                                                                    href: `${baseUrl}/comitentes/${c.id}`,
                                                                    className: "text-slate-800 hover:text-blue-600 transition-colors",
                                                                    children: c.nombre ?? c.razonSocial
                                                                }, void 0, false, {
                                                                    fileName: "[project]/src/app/(dashboard)/cuentas-inversion/[id]/page.tsx",
                                                                    lineNumber: 431,
                                                                    columnNumber: 29
                                                                }, this),
                                                                c.nombre && c.razonSocial && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                    className: "block text-[10px] text-slate-400 font-normal",
                                                                    children: c.razonSocial
                                                                }, void 0, false, {
                                                                    fileName: "[project]/src/app/(dashboard)/cuentas-inversion/[id]/page.tsx",
                                                                    lineNumber: 435,
                                                                    columnNumber: 31
                                                                }, this),
                                                                !c.activo && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                    className: "ml-1 text-[10px] text-slate-400 font-bold",
                                                                    children: "(inactivo)"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/src/app/(dashboard)/cuentas-inversion/[id]/page.tsx",
                                                                    lineNumber: 437,
                                                                    columnNumber: 43
                                                                }, this)
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/src/app/(dashboard)/cuentas-inversion/[id]/page.tsx",
                                                            lineNumber: 430,
                                                            columnNumber: 27
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                            className: "px-4 py-3",
                                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                className: `text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${PRODUCTOR_CLS[c.productor]}`,
                                                                children: PRODUCTOR_LABEL[c.productor]
                                                            }, void 0, false, {
                                                                fileName: "[project]/src/app/(dashboard)/cuentas-inversion/[id]/page.tsx",
                                                                lineNumber: 440,
                                                                columnNumber: 29
                                                            }, this)
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/app/(dashboard)/cuentas-inversion/[id]/page.tsx",
                                                            lineNumber: 439,
                                                            columnNumber: 27
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                            className: "px-4 py-3 text-right tabular-nums text-slate-600",
                                                            children: ars !== 0 ? `$ ${fmt(ars)}` : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                className: "text-slate-300",
                                                                children: "—"
                                                            }, void 0, false, {
                                                                fileName: "[project]/src/app/(dashboard)/cuentas-inversion/[id]/page.tsx",
                                                                lineNumber: 444,
                                                                columnNumber: 123
                                                            }, this)
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/app/(dashboard)/cuentas-inversion/[id]/page.tsx",
                                                            lineNumber: 444,
                                                            columnNumber: 27
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                            className: "px-4 py-3 text-right tabular-nums text-slate-600",
                                                            children: cable !== 0 ? `USD ${fmt(cable)}` : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                className: "text-slate-300",
                                                                children: "—"
                                                            }, void 0, false, {
                                                                fileName: "[project]/src/app/(dashboard)/cuentas-inversion/[id]/page.tsx",
                                                                lineNumber: 445,
                                                                columnNumber: 129
                                                            }, this)
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/app/(dashboard)/cuentas-inversion/[id]/page.tsx",
                                                            lineNumber: 445,
                                                            columnNumber: 27
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                            className: "px-4 py-3 text-right tabular-nums text-slate-600",
                                                            children: mep !== 0 ? `USD ${fmt(mep)}` : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                className: "text-slate-300",
                                                                children: "—"
                                                            }, void 0, false, {
                                                                fileName: "[project]/src/app/(dashboard)/cuentas-inversion/[id]/page.tsx",
                                                                lineNumber: 446,
                                                                columnNumber: 125
                                                            }, this)
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/app/(dashboard)/cuentas-inversion/[id]/page.tsx",
                                                            lineNumber: 446,
                                                            columnNumber: 27
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                            className: "px-4 py-3 text-right tabular-nums text-slate-600 font-medium",
                                                            children: c._count.HoldingComitenteInversion
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/app/(dashboard)/cuentas-inversion/[id]/page.tsx",
                                                            lineNumber: 447,
                                                            columnNumber: 27
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                            className: "px-4 py-3",
                                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                className: "flex items-center gap-1",
                                                                children: [
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"], {
                                                                        href: isEditingData ? `${baseUrl}?tab=clientes` : `${baseUrl}?tab=clientes&editId=${c.id}`,
                                                                        className: `px-2 py-1 rounded-lg text-[10px] font-bold transition-colors ${isEditingData ? "bg-amber-100 text-amber-700" : "text-slate-500 hover:bg-amber-50 hover:text-amber-600"}`,
                                                                        children: "Editar"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/src/app/(dashboard)/cuentas-inversion/[id]/page.tsx",
                                                                        lineNumber: 450,
                                                                        columnNumber: 31
                                                                    }, this),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"], {
                                                                        href: isEditingSaldos ? `${baseUrl}?tab=clientes` : `${baseUrl}?tab=clientes&editSaldosId=${c.id}`,
                                                                        className: `px-2 py-1 rounded-lg text-[10px] font-bold transition-colors ${isEditingSaldos ? "bg-emerald-100 text-emerald-700" : "text-slate-500 hover:bg-emerald-50 hover:text-emerald-600"}`,
                                                                        children: "Saldos"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/src/app/(dashboard)/cuentas-inversion/[id]/page.tsx",
                                                                        lineNumber: 451,
                                                                        columnNumber: 31
                                                                    }, this),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$modules$2f$cuentas$2d$inversion$2f$DeleteComitenteButton$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["DeleteComitenteButton"], {
                                                                        id: c.id,
                                                                        cuentaInversionId: id
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/src/app/(dashboard)/cuentas-inversion/[id]/page.tsx",
                                                                        lineNumber: 452,
                                                                        columnNumber: 31
                                                                    }, this)
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/src/app/(dashboard)/cuentas-inversion/[id]/page.tsx",
                                                                lineNumber: 449,
                                                                columnNumber: 29
                                                            }, this)
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/app/(dashboard)/cuentas-inversion/[id]/page.tsx",
                                                            lineNumber: 448,
                                                            columnNumber: 27
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/src/app/(dashboard)/cuentas-inversion/[id]/page.tsx",
                                                    lineNumber: 428,
                                                    columnNumber: 25
                                                }, this),
                                                isEditingData && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                                                    className: "bg-amber-50/50",
                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                        colSpan: 8,
                                                        className: "px-4 py-4",
                                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$modules$2f$cuentas$2d$inversion$2f$EditComitenteForm$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["EditComitenteForm"], {
                                                            id: c.id,
                                                            cuentaInversionId: id,
                                                            nroComitente: c.nroComitente,
                                                            nombre: c.nombre,
                                                            razonSocial: c.razonSocial,
                                                            productor: c.productor,
                                                            notas: c.notas,
                                                            activo: c.activo,
                                                            esPropioBYG: c.esPropioBYG,
                                                            cancelHref: `${baseUrl}?tab=clientes`,
                                                            productores: productores
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/app/(dashboard)/cuentas-inversion/[id]/page.tsx",
                                                            lineNumber: 459,
                                                            columnNumber: 31
                                                        }, this)
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/app/(dashboard)/cuentas-inversion/[id]/page.tsx",
                                                        lineNumber: 458,
                                                        columnNumber: 29
                                                    }, this)
                                                }, void 0, false, {
                                                    fileName: "[project]/src/app/(dashboard)/cuentas-inversion/[id]/page.tsx",
                                                    lineNumber: 457,
                                                    columnNumber: 27
                                                }, this),
                                                isEditingSaldos && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                                                    className: "bg-emerald-50/30",
                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                        colSpan: 8,
                                                        className: "px-4 py-4",
                                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$modules$2f$cuentas$2d$inversion$2f$EditSaldosForm$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["EditSaldosForm"], {
                                                            comitenteId: c.id,
                                                            cuentaInversionId: id,
                                                            saldoARS: ars,
                                                            saldoUSDCable: cable,
                                                            saldoUSDMep: mep,
                                                            cancelHref: `${baseUrl}?tab=clientes`
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/app/(dashboard)/cuentas-inversion/[id]/page.tsx",
                                                            lineNumber: 466,
                                                            columnNumber: 31
                                                        }, this)
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/app/(dashboard)/cuentas-inversion/[id]/page.tsx",
                                                        lineNumber: 465,
                                                        columnNumber: 29
                                                    }, this)
                                                }, void 0, false, {
                                                    fileName: "[project]/src/app/(dashboard)/cuentas-inversion/[id]/page.tsx",
                                                    lineNumber: 464,
                                                    columnNumber: 27
                                                }, this)
                                            ]
                                        }, c.id, true, {
                                            fileName: "[project]/src/app/(dashboard)/cuentas-inversion/[id]/page.tsx",
                                            lineNumber: 427,
                                            columnNumber: 23
                                        }, this);
                                    })
                                }, void 0, false, {
                                    fileName: "[project]/src/app/(dashboard)/cuentas-inversion/[id]/page.tsx",
                                    lineNumber: 419,
                                    columnNumber: 17
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/app/(dashboard)/cuentas-inversion/[id]/page.tsx",
                            lineNumber: 409,
                            columnNumber: 15
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/src/app/(dashboard)/cuentas-inversion/[id]/page.tsx",
                        lineNumber: 408,
                        columnNumber: 13
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/app/(dashboard)/cuentas-inversion/[id]/page.tsx",
                lineNumber: 393,
                columnNumber: 9
            }, this),
            tab === "carteras" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                className: "flex flex-col gap-6",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "grid grid-cols-2 lg:grid-cols-3 gap-4",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(StatCard, {
                                label: "Carteras propias",
                                value: propiosComitentes.length + mirroredCarteras.length
                            }, void 0, false, {
                                fileName: "[project]/src/app/(dashboard)/cuentas-inversion/[id]/page.tsx",
                                lineNumber: 484,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(StatCard, {
                                label: "Holdings propios",
                                value: holdingsPropios
                            }, void 0, false, {
                                fileName: "[project]/src/app/(dashboard)/cuentas-inversion/[id]/page.tsx",
                                lineNumber: 485,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(StatCard, {
                                label: "Actualizado",
                                value: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    className: "text-sm",
                                    children: cuenta.updatedAt.toLocaleDateString("es-AR", {
                                        day: "2-digit",
                                        month: "2-digit",
                                        year: "numeric"
                                    })
                                }, void 0, false, {
                                    fileName: "[project]/src/app/(dashboard)/cuentas-inversion/[id]/page.tsx",
                                    lineNumber: 488,
                                    columnNumber: 22
                                }, void 0)
                            }, void 0, false, {
                                fileName: "[project]/src/app/(dashboard)/cuentas-inversion/[id]/page.tsx",
                                lineNumber: 486,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/app/(dashboard)/cuentas-inversion/[id]/page.tsx",
                        lineNumber: 483,
                        columnNumber: 11
                    }, this),
                    propiosComitentes.length === 0 && mirroredCarteras.length === 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "rounded-xl border border-slate-200 bg-white p-8 text-center",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            className: "text-sm text-slate-400 italic",
                            children: "Sin carteras propias vinculadas."
                        }, void 0, false, {
                            fileName: "[project]/src/app/(dashboard)/cuentas-inversion/[id]/page.tsx",
                            lineNumber: 494,
                            columnNumber: 15
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/src/app/(dashboard)/cuentas-inversion/[id]/page.tsx",
                        lineNumber: 493,
                        columnNumber: 13
                    }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "rounded-xl border border-slate-200 overflow-hidden",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("table", {
                            className: "w-full text-xs",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("thead", {
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                                        className: "bg-slate-50 border-b border-slate-200",
                                        children: [
                                            "Cartera",
                                            "Comitente espejo",
                                            "ARS",
                                            "USD Cable",
                                            "USD MEP",
                                            "Holdings",
                                            ""
                                        ].map((h, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                className: `px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 ${i < 2 || i === 6 ? "text-left" : "text-right"}`,
                                                children: h
                                            }, h || `col-${i}`, false, {
                                                fileName: "[project]/src/app/(dashboard)/cuentas-inversion/[id]/page.tsx",
                                                lineNumber: 502,
                                                columnNumber: 23
                                            }, this))
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/(dashboard)/cuentas-inversion/[id]/page.tsx",
                                        lineNumber: 500,
                                        columnNumber: 19
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/src/app/(dashboard)/cuentas-inversion/[id]/page.tsx",
                                    lineNumber: 499,
                                    columnNumber: 17
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("tbody", {
                                    children: [
                                        propiosComitentes.map((c)=>{
                                            const ars = Number(c.SaldoComitenteInversion?.saldoARS ?? 0);
                                            const cable = Number(c.SaldoComitenteInversion?.saldoUSDCable ?? 0);
                                            const mep = Number(c.SaldoComitenteInversion?.saldoUSDMep ?? 0);
                                            return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                                                className: "border-b border-slate-50 last:border-0 bg-white hover:bg-violet-50/40 transition-colors",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                        className: "px-4 py-3 font-medium",
                                                        children: c.Cartera ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"], {
                                                            href: `/carteras/${c.Cartera.slug}`,
                                                            className: "text-slate-800 hover:text-violet-600 transition-colors font-semibold",
                                                            children: c.Cartera.nombre
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/app/(dashboard)/cuentas-inversion/[id]/page.tsx",
                                                            lineNumber: 517,
                                                            columnNumber: 29
                                                        }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                            className: "text-slate-500 italic",
                                                            children: c.nombre ?? "—"
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/app/(dashboard)/cuentas-inversion/[id]/page.tsx",
                                                            lineNumber: 519,
                                                            columnNumber: 29
                                                        }, this)
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/app/(dashboard)/cuentas-inversion/[id]/page.tsx",
                                                        lineNumber: 515,
                                                        columnNumber: 25
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                        className: "px-4 py-3 font-mono text-slate-600",
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                className: "text-slate-400",
                                                                children: c.nroComitente
                                                            }, void 0, false, {
                                                                fileName: "[project]/src/app/(dashboard)/cuentas-inversion/[id]/page.tsx",
                                                                lineNumber: 523,
                                                                columnNumber: 27
                                                            }, this),
                                                            c.nombre && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                className: "ml-2 text-slate-700",
                                                                children: c.nombre
                                                            }, void 0, false, {
                                                                fileName: "[project]/src/app/(dashboard)/cuentas-inversion/[id]/page.tsx",
                                                                lineNumber: 524,
                                                                columnNumber: 40
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/src/app/(dashboard)/cuentas-inversion/[id]/page.tsx",
                                                        lineNumber: 522,
                                                        columnNumber: 25
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                        className: "px-4 py-3 text-right tabular-nums text-slate-600",
                                                        children: ars !== 0 ? `$ ${fmt(ars)}` : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                            className: "text-slate-300",
                                                            children: "—"
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/app/(dashboard)/cuentas-inversion/[id]/page.tsx",
                                                            lineNumber: 526,
                                                            columnNumber: 121
                                                        }, this)
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/app/(dashboard)/cuentas-inversion/[id]/page.tsx",
                                                        lineNumber: 526,
                                                        columnNumber: 25
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                        className: "px-4 py-3 text-right tabular-nums text-slate-600",
                                                        children: cable !== 0 ? `USD ${fmt(cable)}` : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                            className: "text-slate-300",
                                                            children: "—"
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/app/(dashboard)/cuentas-inversion/[id]/page.tsx",
                                                            lineNumber: 527,
                                                            columnNumber: 127
                                                        }, this)
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/app/(dashboard)/cuentas-inversion/[id]/page.tsx",
                                                        lineNumber: 527,
                                                        columnNumber: 25
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                        className: "px-4 py-3 text-right tabular-nums text-slate-600",
                                                        children: mep !== 0 ? `USD ${fmt(mep)}` : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                            className: "text-slate-300",
                                                            children: "—"
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/app/(dashboard)/cuentas-inversion/[id]/page.tsx",
                                                            lineNumber: 528,
                                                            columnNumber: 123
                                                        }, this)
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/app/(dashboard)/cuentas-inversion/[id]/page.tsx",
                                                        lineNumber: 528,
                                                        columnNumber: 25
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                        className: "px-4 py-3 text-right tabular-nums text-slate-600 font-medium",
                                                        children: c._count.HoldingComitenteInversion
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/app/(dashboard)/cuentas-inversion/[id]/page.tsx",
                                                        lineNumber: 529,
                                                        columnNumber: 25
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                        className: "px-4 py-3",
                                                        children: c.Cartera && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"], {
                                                            href: `/carteras/${c.Cartera.slug}`,
                                                            className: "px-2 py-1 rounded-lg text-[10px] font-bold text-violet-500 hover:bg-violet-100 hover:text-violet-700 transition-colors",
                                                            children: "Ver cartera"
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/app/(dashboard)/cuentas-inversion/[id]/page.tsx",
                                                            lineNumber: 532,
                                                            columnNumber: 29
                                                        }, this)
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/app/(dashboard)/cuentas-inversion/[id]/page.tsx",
                                                        lineNumber: 530,
                                                        columnNumber: 25
                                                    }, this)
                                                ]
                                            }, c.id, true, {
                                                fileName: "[project]/src/app/(dashboard)/cuentas-inversion/[id]/page.tsx",
                                                lineNumber: 514,
                                                columnNumber: 23
                                            }, this);
                                        }),
                                        mirroredCarteras.map((cartera)=>{
                                            const ars = Number(cartera.saldoPesos);
                                            const cable = Number(cartera.saldoUSDCable);
                                            const mep = Number(cartera.saldoUSDMep);
                                            return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                                                className: "border-b border-violet-100 last:border-0 bg-violet-50/30 hover:bg-violet-50/70 transition-colors",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                        className: "px-4 py-3 font-medium",
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"], {
                                                                href: `/carteras/${cartera.slug}`,
                                                                className: "text-slate-800 hover:text-violet-600 transition-colors font-semibold",
                                                                children: cartera.nombre
                                                            }, void 0, false, {
                                                                fileName: "[project]/src/app/(dashboard)/cuentas-inversion/[id]/page.tsx",
                                                                lineNumber: 547,
                                                                columnNumber: 27
                                                            }, this),
                                                            cartera.investmentAccountType && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                className: "block text-[10px] text-slate-400 font-normal",
                                                                children: cartera.investmentAccountType
                                                            }, void 0, false, {
                                                                fileName: "[project]/src/app/(dashboard)/cuentas-inversion/[id]/page.tsx",
                                                                lineNumber: 548,
                                                                columnNumber: 61
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/src/app/(dashboard)/cuentas-inversion/[id]/page.tsx",
                                                        lineNumber: 546,
                                                        columnNumber: 25
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                        className: "px-4 py-3 font-mono text-slate-400",
                                                        children: cartera.comitenteNumber
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/app/(dashboard)/cuentas-inversion/[id]/page.tsx",
                                                        lineNumber: 550,
                                                        columnNumber: 25
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                        className: "px-4 py-3 text-right tabular-nums text-slate-600",
                                                        children: ars !== 0 ? `$ ${fmt(ars)}` : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                            className: "text-slate-300",
                                                            children: "—"
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/app/(dashboard)/cuentas-inversion/[id]/page.tsx",
                                                            lineNumber: 551,
                                                            columnNumber: 121
                                                        }, this)
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/app/(dashboard)/cuentas-inversion/[id]/page.tsx",
                                                        lineNumber: 551,
                                                        columnNumber: 25
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                        className: "px-4 py-3 text-right tabular-nums text-slate-600",
                                                        children: cable !== 0 ? `USD ${fmt(cable)}` : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                            className: "text-slate-300",
                                                            children: "—"
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/app/(dashboard)/cuentas-inversion/[id]/page.tsx",
                                                            lineNumber: 552,
                                                            columnNumber: 127
                                                        }, this)
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/app/(dashboard)/cuentas-inversion/[id]/page.tsx",
                                                        lineNumber: 552,
                                                        columnNumber: 25
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                        className: "px-4 py-3 text-right tabular-nums text-slate-600",
                                                        children: mep !== 0 ? `USD ${fmt(mep)}` : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                            className: "text-slate-300",
                                                            children: "—"
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/app/(dashboard)/cuentas-inversion/[id]/page.tsx",
                                                            lineNumber: 553,
                                                            columnNumber: 123
                                                        }, this)
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/app/(dashboard)/cuentas-inversion/[id]/page.tsx",
                                                        lineNumber: 553,
                                                        columnNumber: 25
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                        className: "px-4 py-3 text-right tabular-nums text-slate-600 font-medium",
                                                        children: cartera._count.PosicionCartera
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/app/(dashboard)/cuentas-inversion/[id]/page.tsx",
                                                        lineNumber: 554,
                                                        columnNumber: 25
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                        className: "px-4 py-3",
                                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"], {
                                                            href: `/carteras/${cartera.slug}`,
                                                            className: "px-2 py-1 rounded-lg text-[10px] font-bold text-violet-500 hover:bg-violet-100 hover:text-violet-700 transition-colors",
                                                            children: "Ver cartera"
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/app/(dashboard)/cuentas-inversion/[id]/page.tsx",
                                                            lineNumber: 556,
                                                            columnNumber: 27
                                                        }, this)
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/app/(dashboard)/cuentas-inversion/[id]/page.tsx",
                                                        lineNumber: 555,
                                                        columnNumber: 25
                                                    }, this)
                                                ]
                                            }, cartera.id, true, {
                                                fileName: "[project]/src/app/(dashboard)/cuentas-inversion/[id]/page.tsx",
                                                lineNumber: 545,
                                                columnNumber: 23
                                            }, this);
                                        })
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/app/(dashboard)/cuentas-inversion/[id]/page.tsx",
                                    lineNumber: 508,
                                    columnNumber: 17
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/app/(dashboard)/cuentas-inversion/[id]/page.tsx",
                            lineNumber: 498,
                            columnNumber: 15
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/src/app/(dashboard)/cuentas-inversion/[id]/page.tsx",
                        lineNumber: 497,
                        columnNumber: 13
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/app/(dashboard)/cuentas-inversion/[id]/page.tsx",
                lineNumber: 482,
                columnNumber: 9
            }, this),
            tab === "comisiones" && comisionesStats && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                className: "flex flex-col gap-6",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "grid grid-cols-2 lg:grid-cols-4 gap-4",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "bg-white rounded-xl border border-slate-200 border-t-[3px] border-t-amber-400 shadow-sm p-5",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1",
                                        children: "Pendientes revisión"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/(dashboard)/cuentas-inversion/[id]/page.tsx",
                                        lineNumber: 573,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "text-3xl font-black tabular-nums text-amber-500",
                                        children: comisionesStats.pendientesCount
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/(dashboard)/cuentas-inversion/[id]/page.tsx",
                                        lineNumber: 574,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/(dashboard)/cuentas-inversion/[id]/page.tsx",
                                lineNumber: 572,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "bg-white rounded-xl border border-slate-200 border-t-[3px] border-t-blue-500 shadow-sm p-5",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1",
                                        children: "Concertadas"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/(dashboard)/cuentas-inversion/[id]/page.tsx",
                                        lineNumber: 577,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "text-3xl font-black tabular-nums text-blue-600",
                                        children: comisionesStats.concertadasCount
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/(dashboard)/cuentas-inversion/[id]/page.tsx",
                                        lineNumber: 578,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/(dashboard)/cuentas-inversion/[id]/page.tsx",
                                lineNumber: 576,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "bg-white rounded-xl border border-slate-200 border-t-[3px] border-t-emerald-500 shadow-sm p-5",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1",
                                        children: "Liquidadas"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/(dashboard)/cuentas-inversion/[id]/page.tsx",
                                        lineNumber: 581,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "text-3xl font-black tabular-nums text-emerald-600",
                                        children: comisionesStats.liquidadasCount
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/(dashboard)/cuentas-inversion/[id]/page.tsx",
                                        lineNumber: 582,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/(dashboard)/cuentas-inversion/[id]/page.tsx",
                                lineNumber: 580,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "bg-white rounded-xl border border-slate-200 shadow-sm p-5",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1",
                                        children: "Total del mes"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/(dashboard)/cuentas-inversion/[id]/page.tsx",
                                        lineNumber: 585,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "text-3xl font-black tabular-nums text-slate-900",
                                        children: comisionesStats.totalMesCount
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/(dashboard)/cuentas-inversion/[id]/page.tsx",
                                        lineNumber: 586,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/(dashboard)/cuentas-inversion/[id]/page.tsx",
                                lineNumber: 584,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/app/(dashboard)/cuentas-inversion/[id]/page.tsx",
                        lineNumber: 571,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex justify-end",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"], {
                            href: `${baseUrl}/comisiones-mes`,
                            className: "inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-[11px] font-black uppercase tracking-widest bg-byg-accent text-white hover:bg-blue-500 transition-colors shadow-sm shadow-blue-600/20",
                            children: "Cálculo del mes →"
                        }, void 0, false, {
                            fileName: "[project]/src/app/(dashboard)/cuentas-inversion/[id]/page.tsx",
                            lineNumber: 591,
                            columnNumber: 13
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/src/app/(dashboard)/cuentas-inversion/[id]/page.tsx",
                        lineNumber: 590,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex flex-col gap-3",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                className: "text-[10px] font-black uppercase tracking-[0.3em] text-slate-400",
                                children: "Pendientes de revisión"
                            }, void 0, false, {
                                fileName: "[project]/src/app/(dashboard)/cuentas-inversion/[id]/page.tsx",
                                lineNumber: 597,
                                columnNumber: 13
                            }, this),
                            pendientesOps.length === 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "rounded-xl border border-slate-200 bg-white p-8 text-center",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                    className: "text-sm text-slate-400 italic",
                                    children: "Sin operaciones pendientes de revisión."
                                }, void 0, false, {
                                    fileName: "[project]/src/app/(dashboard)/cuentas-inversion/[id]/page.tsx",
                                    lineNumber: 600,
                                    columnNumber: 17
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/src/app/(dashboard)/cuentas-inversion/[id]/page.tsx",
                                lineNumber: 599,
                                columnNumber: 15
                            }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "rounded-xl border border-slate-200 overflow-hidden",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "overflow-x-auto",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("table", {
                                        className: "w-full text-xs min-w-[900px]",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("thead", {
                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                                                    className: "bg-slate-50 border-b border-slate-200",
                                                    children: [
                                                        {
                                                            h: "Fecha",
                                                            align: "left"
                                                        },
                                                        {
                                                            h: "Comitente/Cartera",
                                                            align: "left"
                                                        },
                                                        {
                                                            h: "Tipo",
                                                            align: "left"
                                                        },
                                                        {
                                                            h: "Ticker",
                                                            align: "left"
                                                        },
                                                        {
                                                            h: "Cantidad",
                                                            align: "right"
                                                        },
                                                        {
                                                            h: "Precio",
                                                            align: "right"
                                                        },
                                                        {
                                                            h: "Mon.",
                                                            align: "left"
                                                        },
                                                        {
                                                            h: "Resultado est.",
                                                            align: "right"
                                                        },
                                                        {
                                                            h: "Comisión",
                                                            align: "right"
                                                        },
                                                        {
                                                            h: "Operador",
                                                            align: "left"
                                                        },
                                                        {
                                                            h: "Estado",
                                                            align: "left"
                                                        },
                                                        {
                                                            h: "",
                                                            align: "left"
                                                        }
                                                    ].map(({ h, align }, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                            className: `px-3 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 whitespace-nowrap text-${align}`,
                                                            children: h
                                                        }, h || `col-${i}`, false, {
                                                            fileName: "[project]/src/app/(dashboard)/cuentas-inversion/[id]/page.tsx",
                                                            lineNumber: 609,
                                                            columnNumber: 27
                                                        }, this))
                                                }, void 0, false, {
                                                    fileName: "[project]/src/app/(dashboard)/cuentas-inversion/[id]/page.tsx",
                                                    lineNumber: 607,
                                                    columnNumber: 23
                                                }, this)
                                            }, void 0, false, {
                                                fileName: "[project]/src/app/(dashboard)/cuentas-inversion/[id]/page.tsx",
                                                lineNumber: 606,
                                                columnNumber: 21
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("tbody", {
                                                children: Array.from(opsByFecha.entries()).map(([fecha, ops])=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"].Fragment, {
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                                                                className: "bg-slate-50/80 border-y border-slate-100",
                                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                    colSpan: 12,
                                                                    className: "px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-500",
                                                                    children: fecha === "sin-fecha" ? "Sin fecha operativa" : new Date(fecha + "T12:00:00").toLocaleDateString("es-AR", {
                                                                        weekday: "long",
                                                                        day: "2-digit",
                                                                        month: "long",
                                                                        year: "numeric"
                                                                    })
                                                                }, void 0, false, {
                                                                    fileName: "[project]/src/app/(dashboard)/cuentas-inversion/[id]/page.tsx",
                                                                    lineNumber: 617,
                                                                    columnNumber: 29
                                                                }, this)
                                                            }, void 0, false, {
                                                                fileName: "[project]/src/app/(dashboard)/cuentas-inversion/[id]/page.tsx",
                                                                lineNumber: 616,
                                                                columnNumber: 27
                                                            }, this),
                                                            ops.map((op)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                                                                    className: "border-b border-slate-50 last:border-0 bg-white hover:bg-amber-50/20 transition-colors",
                                                                    children: [
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                            className: "px-3 py-3 font-mono text-slate-500 whitespace-nowrap",
                                                                            children: op.fechaOperativa ? op.fechaOperativa.toLocaleDateString("es-AR", {
                                                                                day: "2-digit",
                                                                                month: "2-digit"
                                                                            }) : "—"
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/src/app/(dashboard)/cuentas-inversion/[id]/page.tsx",
                                                                            lineNumber: 623,
                                                                            columnNumber: 31
                                                                        }, this),
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                            className: "px-3 py-3 font-medium text-slate-800 max-w-[160px] truncate",
                                                                            children: op.sujeto
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/src/app/(dashboard)/cuentas-inversion/[id]/page.tsx",
                                                                            lineNumber: 624,
                                                                            columnNumber: 31
                                                                        }, this),
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                            className: "px-3 py-3 text-slate-500 whitespace-nowrap",
                                                                            children: TIPO_LABEL[op.tipoOperacion] ?? op.tipoOperacion
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/src/app/(dashboard)/cuentas-inversion/[id]/page.tsx",
                                                                            lineNumber: 625,
                                                                            columnNumber: 31
                                                                        }, this),
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                            className: "px-3 py-3",
                                                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                                className: "font-black text-slate-900 tracking-tight",
                                                                                children: op.ticker
                                                                            }, void 0, false, {
                                                                                fileName: "[project]/src/app/(dashboard)/cuentas-inversion/[id]/page.tsx",
                                                                                lineNumber: 626,
                                                                                columnNumber: 57
                                                                            }, this)
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/src/app/(dashboard)/cuentas-inversion/[id]/page.tsx",
                                                                            lineNumber: 626,
                                                                            columnNumber: 31
                                                                        }, this),
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                            className: "px-3 py-3 text-right tabular-nums font-mono text-slate-700",
                                                                            children: fmt(op.cantidad)
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/src/app/(dashboard)/cuentas-inversion/[id]/page.tsx",
                                                                            lineNumber: 627,
                                                                            columnNumber: 31
                                                                        }, this),
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                            className: "px-3 py-3 text-right tabular-nums font-mono text-slate-700",
                                                                            children: fmt(op.precio)
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/src/app/(dashboard)/cuentas-inversion/[id]/page.tsx",
                                                                            lineNumber: 628,
                                                                            columnNumber: 31
                                                                        }, this),
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                            className: "px-3 py-3 text-slate-400",
                                                                            children: op.moneda
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/src/app/(dashboard)/cuentas-inversion/[id]/page.tsx",
                                                                            lineNumber: 629,
                                                                            columnNumber: 31
                                                                        }, this),
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                            className: "px-3 py-3 text-right tabular-nums font-mono",
                                                                            children: op.resultadoBruto !== null ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                                className: op.resultadoBruto >= 0 ? "text-emerald-600" : "text-red-500",
                                                                                children: fmt(op.resultadoBruto)
                                                                            }, void 0, false, {
                                                                                fileName: "[project]/src/app/(dashboard)/cuentas-inversion/[id]/page.tsx",
                                                                                lineNumber: 631,
                                                                                columnNumber: 63
                                                                            }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                                className: "text-slate-300 italic text-[10px]",
                                                                                children: "Sin cargar"
                                                                            }, void 0, false, {
                                                                                fileName: "[project]/src/app/(dashboard)/cuentas-inversion/[id]/page.tsx",
                                                                                lineNumber: 631,
                                                                                columnNumber: 176
                                                                            }, this)
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/src/app/(dashboard)/cuentas-inversion/[id]/page.tsx",
                                                                            lineNumber: 630,
                                                                            columnNumber: 31
                                                                        }, this),
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                            className: "px-3 py-3 text-right tabular-nums text-slate-500 whitespace-nowrap",
                                                                            children: op.comisionPct !== null ? `${op.comisionPct}%` : op.comisionFija !== null ? `$ ${fmt(op.comisionFija)}` : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                                className: "text-slate-300 italic text-[10px]",
                                                                                children: "Sin cargar"
                                                                            }, void 0, false, {
                                                                                fileName: "[project]/src/app/(dashboard)/cuentas-inversion/[id]/page.tsx",
                                                                                lineNumber: 634,
                                                                                columnNumber: 140
                                                                            }, this)
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/src/app/(dashboard)/cuentas-inversion/[id]/page.tsx",
                                                                            lineNumber: 633,
                                                                            columnNumber: 31
                                                                        }, this),
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                            className: "px-3 py-3 text-slate-500 whitespace-nowrap",
                                                                            children: op.operador
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/src/app/(dashboard)/cuentas-inversion/[id]/page.tsx",
                                                                            lineNumber: 636,
                                                                            columnNumber: 31
                                                                        }, this),
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                            className: "px-3 py-3",
                                                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                                className: "text-[9px] font-black px-2 py-1 rounded-md uppercase tracking-widest bg-amber-500/10 text-amber-600 ring-1 ring-amber-500/20 whitespace-nowrap",
                                                                                children: "Pendiente revisión"
                                                                            }, void 0, false, {
                                                                                fileName: "[project]/src/app/(dashboard)/cuentas-inversion/[id]/page.tsx",
                                                                                lineNumber: 638,
                                                                                columnNumber: 33
                                                                            }, this)
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/src/app/(dashboard)/cuentas-inversion/[id]/page.tsx",
                                                                            lineNumber: 637,
                                                                            columnNumber: 31
                                                                        }, this),
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                            className: "px-3 py-3",
                                                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"], {
                                                                                href: `/bolsa/${op.id}`,
                                                                                className: "px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest bg-amber-500 text-white hover:bg-amber-600 transition-colors shadow-sm shadow-amber-500/20 whitespace-nowrap",
                                                                                children: "Revisar →"
                                                                            }, void 0, false, {
                                                                                fileName: "[project]/src/app/(dashboard)/cuentas-inversion/[id]/page.tsx",
                                                                                lineNumber: 641,
                                                                                columnNumber: 33
                                                                            }, this)
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/src/app/(dashboard)/cuentas-inversion/[id]/page.tsx",
                                                                            lineNumber: 640,
                                                                            columnNumber: 31
                                                                        }, this)
                                                                    ]
                                                                }, op.id, true, {
                                                                    fileName: "[project]/src/app/(dashboard)/cuentas-inversion/[id]/page.tsx",
                                                                    lineNumber: 622,
                                                                    columnNumber: 29
                                                                }, this))
                                                        ]
                                                    }, fecha, true, {
                                                        fileName: "[project]/src/app/(dashboard)/cuentas-inversion/[id]/page.tsx",
                                                        lineNumber: 615,
                                                        columnNumber: 25
                                                    }, this))
                                            }, void 0, false, {
                                                fileName: "[project]/src/app/(dashboard)/cuentas-inversion/[id]/page.tsx",
                                                lineNumber: 613,
                                                columnNumber: 21
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/app/(dashboard)/cuentas-inversion/[id]/page.tsx",
                                        lineNumber: 605,
                                        columnNumber: 19
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/src/app/(dashboard)/cuentas-inversion/[id]/page.tsx",
                                    lineNumber: 604,
                                    columnNumber: 17
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/src/app/(dashboard)/cuentas-inversion/[id]/page.tsx",
                                lineNumber: 603,
                                columnNumber: 15
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/app/(dashboard)/cuentas-inversion/[id]/page.tsx",
                        lineNumber: 596,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/app/(dashboard)/cuentas-inversion/[id]/page.tsx",
                lineNumber: 570,
                columnNumber: 9
            }, this),
            tab === "reportes" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                className: "flex flex-col gap-8",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex items-center gap-4 flex-wrap",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex items-center gap-0.5 bg-slate-100 rounded-lg p-1",
                                children: [
                                    "IPS",
                                    "BYG",
                                    "OTRO"
                                ].map((p)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"], {
                                        href: `${baseUrl}?tab=reportes&productor=${p}&mes=${reportMes}`,
                                        className: `px-4 py-1.5 rounded-md text-[11px] font-black uppercase tracking-widest transition-all ${reportProductor === p ? "bg-white text-blue-700 shadow-sm" : "text-slate-500 hover:text-slate-700"}`,
                                        children: p === "OTRO" ? "Otro" : p
                                    }, p, false, {
                                        fileName: "[project]/src/app/(dashboard)/cuentas-inversion/[id]/page.tsx",
                                        lineNumber: 665,
                                        columnNumber: 17
                                    }, this))
                            }, void 0, false, {
                                fileName: "[project]/src/app/(dashboard)/cuentas-inversion/[id]/page.tsx",
                                lineNumber: 663,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex items-center gap-2",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"], {
                                        href: `${baseUrl}?tab=reportes&productor=${reportProductor}&mes=${reportPrevMes}`,
                                        className: "px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-blue-600 hover:border-blue-300 text-[11px] font-black transition-colors",
                                        children: "←"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/(dashboard)/cuentas-inversion/[id]/page.tsx",
                                        lineNumber: 681,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "text-[12px] font-bold text-slate-700 tabular-nums capitalize min-w-[140px] text-center",
                                        children: reportMesLabel
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/(dashboard)/cuentas-inversion/[id]/page.tsx",
                                        lineNumber: 687,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"], {
                                        href: `${baseUrl}?tab=reportes&productor=${reportProductor}&mes=${reportNextMes}`,
                                        className: `px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-[11px] font-black transition-colors ${isCurrentMes ? "opacity-30 pointer-events-none text-slate-400" : "text-slate-500 hover:text-blue-600 hover:border-blue-300"}`,
                                        children: "→"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/(dashboard)/cuentas-inversion/[id]/page.tsx",
                                        lineNumber: 690,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/(dashboard)/cuentas-inversion/[id]/page.tsx",
                                lineNumber: 680,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-auto",
                                children: [
                                    reportOps.length,
                                    " operaciones"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/(dashboard)/cuentas-inversion/[id]/page.tsx",
                                lineNumber: 700,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/app/(dashboard)/cuentas-inversion/[id]/page.tsx",
                        lineNumber: 661,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex flex-col gap-3",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                className: "text-[10px] font-black uppercase tracking-[0.3em] text-slate-400",
                                children: [
                                    "Resumen ejecutivo · ",
                                    PRODUCTOR_LABEL[reportProductor],
                                    " · ",
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "capitalize",
                                        children: reportMesLabel
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/(dashboard)/cuentas-inversion/[id]/page.tsx",
                                        lineNumber: 708,
                                        columnNumber: 72
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/(dashboard)/cuentas-inversion/[id]/page.tsx",
                                lineNumber: 707,
                                columnNumber: 13
                            }, this),
                            reportOps.length === 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "rounded-xl border border-slate-200 bg-white p-8 text-center",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                    className: "text-sm text-slate-400 italic",
                                    children: [
                                        "Sin operaciones concertadas para ",
                                        PRODUCTOR_LABEL[reportProductor],
                                        " en ",
                                        reportMesLabel,
                                        "."
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/app/(dashboard)/cuentas-inversion/[id]/page.tsx",
                                    lineNumber: 713,
                                    columnNumber: 17
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/src/app/(dashboard)/cuentas-inversion/[id]/page.tsx",
                                lineNumber: 712,
                                columnNumber: 15
                            }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["Fragment"], {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "grid grid-cols-2 sm:grid-cols-4 gap-3",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(ResumeCard, {
                                                label: "Comisiones normales",
                                                value: `ARS ${fmt(rTotalNormal)}`
                                            }, void 0, false, {
                                                fileName: "[project]/src/app/(dashboard)/cuentas-inversion/[id]/page.tsx",
                                                lineNumber: 719,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(ResumeCard, {
                                                label: "SENEBI",
                                                value: `ARS ${fmt(rSenebi)}`,
                                                highlight: rSenebi > 0 ? "violet" : undefined
                                            }, void 0, false, {
                                                fileName: "[project]/src/app/(dashboard)/cuentas-inversion/[id]/page.tsx",
                                                lineNumber: 720,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(ResumeCard, {
                                                label: "Bruto total",
                                                value: `ARS ${fmt(rBruto)}`
                                            }, void 0, false, {
                                                fileName: "[project]/src/app/(dashboard)/cuentas-inversion/[id]/page.tsx",
                                                lineNumber: 721,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(ResumeCard, {
                                                label: `IIBB (${iibbPct}%)`,
                                                value: `− ARS ${fmt(rIibb)}`,
                                                highlight: "rose",
                                                sub: `base: ARS ${fmt(rBruto)}`
                                            }, void 0, false, {
                                                fileName: "[project]/src/app/(dashboard)/cuentas-inversion/[id]/page.tsx",
                                                lineNumber: 722,
                                                columnNumber: 19
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/app/(dashboard)/cuentas-inversion/[id]/page.tsx",
                                        lineNumber: 718,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "grid grid-cols-2 sm:grid-cols-4 gap-3",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(ResumeCard, {
                                                label: "Neto",
                                                value: `ARS ${fmt(rNeto)}`,
                                                highlight: "blue"
                                            }, void 0, false, {
                                                fileName: "[project]/src/app/(dashboard)/cuentas-inversion/[id]/page.tsx",
                                                lineNumber: 726,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(ResumeCard, {
                                                label: `% ${PRODUCTOR_LABEL[reportProductor]}`,
                                                value: `${pctProductor}%`,
                                                sub: "sobre neto"
                                            }, void 0, false, {
                                                fileName: "[project]/src/app/(dashboard)/cuentas-inversion/[id]/page.tsx",
                                                lineNumber: 727,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(ResumeCard, {
                                                label: `A pagar ${PRODUCTOR_LABEL[reportProductor]}`,
                                                value: rAPagar > 0 ? `ARS ${fmt(rAPagar)}` : "—",
                                                highlight: rAPagar > 0 ? "emerald" : undefined,
                                                sub: rAPagar > 0 ? `${pctProductor}% s/ ARS ${fmt(rNeto)}` : undefined
                                            }, void 0, false, {
                                                fileName: "[project]/src/app/(dashboard)/cuentas-inversion/[id]/page.tsx",
                                                lineNumber: 732,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(ResumeCard, {
                                                label: "Retiene BYG",
                                                value: `ARS ${fmt(rRetiene)}`,
                                                highlight: "blue"
                                            }, void 0, false, {
                                                fileName: "[project]/src/app/(dashboard)/cuentas-inversion/[id]/page.tsx",
                                                lineNumber: 738,
                                                columnNumber: 19
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/app/(dashboard)/cuentas-inversion/[id]/page.tsx",
                                        lineNumber: 725,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, void 0, true)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/app/(dashboard)/cuentas-inversion/[id]/page.tsx",
                        lineNumber: 706,
                        columnNumber: 11
                    }, this),
                    clienteResumenes.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex flex-col gap-3",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                className: "text-[10px] font-black uppercase tracking-[0.3em] text-slate-400",
                                children: "Detalle por cliente"
                            }, void 0, false, {
                                fileName: "[project]/src/app/(dashboard)/cuentas-inversion/[id]/page.tsx",
                                lineNumber: 747,
                                columnNumber: 15
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "rounded-xl border border-slate-200 overflow-hidden",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("table", {
                                    className: "w-full text-xs",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("thead", {
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                                                className: "bg-slate-50 border-b border-slate-200",
                                                children: [
                                                    "Cliente",
                                                    "Comisión normal",
                                                    "SENEBI",
                                                    "Total"
                                                ].map((h, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                        className: `px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 ${i === 0 ? "text-left" : "text-right"}`,
                                                        children: h
                                                    }, h, false, {
                                                        fileName: "[project]/src/app/(dashboard)/cuentas-inversion/[id]/page.tsx",
                                                        lineNumber: 755,
                                                        columnNumber: 25
                                                    }, this))
                                            }, void 0, false, {
                                                fileName: "[project]/src/app/(dashboard)/cuentas-inversion/[id]/page.tsx",
                                                lineNumber: 753,
                                                columnNumber: 21
                                            }, this)
                                        }, void 0, false, {
                                            fileName: "[project]/src/app/(dashboard)/cuentas-inversion/[id]/page.tsx",
                                            lineNumber: 752,
                                            columnNumber: 19
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("tbody", {
                                            children: clienteResumenes.map((r, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                                                    className: "border-b border-slate-50 last:border-0 bg-white hover:bg-slate-50/60 transition-colors",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                            className: "px-4 py-3 font-medium text-slate-800",
                                                            children: r.sujeto
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/app/(dashboard)/cuentas-inversion/[id]/page.tsx",
                                                            lineNumber: 762,
                                                            columnNumber: 25
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                            className: "px-4 py-3 text-right tabular-nums font-mono text-slate-600",
                                                            children: r.comisionNormal > 0 ? `ARS ${fmt(r.comisionNormal)}` : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                className: "text-slate-300",
                                                                children: "—"
                                                            }, void 0, false, {
                                                                fileName: "[project]/src/app/(dashboard)/cuentas-inversion/[id]/page.tsx",
                                                                lineNumber: 764,
                                                                columnNumber: 84
                                                            }, this)
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/app/(dashboard)/cuentas-inversion/[id]/page.tsx",
                                                            lineNumber: 763,
                                                            columnNumber: 25
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                            className: "px-4 py-3 text-right tabular-nums font-mono",
                                                            children: r.senebi > 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                className: "text-violet-600 font-semibold",
                                                                children: [
                                                                    "ARS ",
                                                                    fmt(r.senebi)
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/src/app/(dashboard)/cuentas-inversion/[id]/page.tsx",
                                                                lineNumber: 768,
                                                                columnNumber: 29
                                                            }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                className: "text-slate-300",
                                                                children: "—"
                                                            }, void 0, false, {
                                                                fileName: "[project]/src/app/(dashboard)/cuentas-inversion/[id]/page.tsx",
                                                                lineNumber: 770,
                                                                columnNumber: 29
                                                            }, this)
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/app/(dashboard)/cuentas-inversion/[id]/page.tsx",
                                                            lineNumber: 766,
                                                            columnNumber: 25
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                            className: "px-4 py-3 text-right tabular-nums font-mono font-bold text-slate-900",
                                                            children: [
                                                                "ARS ",
                                                                fmt(r.total)
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/src/app/(dashboard)/cuentas-inversion/[id]/page.tsx",
                                                            lineNumber: 773,
                                                            columnNumber: 25
                                                        }, this)
                                                    ]
                                                }, i, true, {
                                                    fileName: "[project]/src/app/(dashboard)/cuentas-inversion/[id]/page.tsx",
                                                    lineNumber: 761,
                                                    columnNumber: 23
                                                }, this))
                                        }, void 0, false, {
                                            fileName: "[project]/src/app/(dashboard)/cuentas-inversion/[id]/page.tsx",
                                            lineNumber: 759,
                                            columnNumber: 19
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("tfoot", {
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                                                className: "border-t-2 border-slate-200 bg-slate-50",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                        className: "px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400",
                                                        children: "Total"
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/app/(dashboard)/cuentas-inversion/[id]/page.tsx",
                                                        lineNumber: 781,
                                                        columnNumber: 23
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                        className: "px-4 py-3 text-right tabular-nums font-mono font-bold text-slate-700",
                                                        children: [
                                                            "ARS ",
                                                            fmt(rTotalNormal)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/src/app/(dashboard)/cuentas-inversion/[id]/page.tsx",
                                                        lineNumber: 782,
                                                        columnNumber: 23
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                        className: "px-4 py-3 text-right tabular-nums font-mono font-bold text-violet-600",
                                                        children: rSenebi > 0 ? `ARS ${fmt(rSenebi)}` : "—"
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/app/(dashboard)/cuentas-inversion/[id]/page.tsx",
                                                        lineNumber: 783,
                                                        columnNumber: 23
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                        className: "px-4 py-3 text-right tabular-nums font-mono font-bold text-slate-900",
                                                        children: [
                                                            "ARS ",
                                                            fmt(rBruto)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/src/app/(dashboard)/cuentas-inversion/[id]/page.tsx",
                                                        lineNumber: 784,
                                                        columnNumber: 23
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/src/app/(dashboard)/cuentas-inversion/[id]/page.tsx",
                                                lineNumber: 780,
                                                columnNumber: 21
                                            }, this)
                                        }, void 0, false, {
                                            fileName: "[project]/src/app/(dashboard)/cuentas-inversion/[id]/page.tsx",
                                            lineNumber: 779,
                                            columnNumber: 19
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/app/(dashboard)/cuentas-inversion/[id]/page.tsx",
                                    lineNumber: 751,
                                    columnNumber: 17
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/src/app/(dashboard)/cuentas-inversion/[id]/page.tsx",
                                lineNumber: 750,
                                columnNumber: 15
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/app/(dashboard)/cuentas-inversion/[id]/page.tsx",
                        lineNumber: 746,
                        columnNumber: 13
                    }, this),
                    reportOps.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex flex-col gap-3",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                className: "text-[10px] font-black uppercase tracking-[0.3em] text-slate-400",
                                children: "Detalle de operaciones"
                            }, void 0, false, {
                                fileName: "[project]/src/app/(dashboard)/cuentas-inversion/[id]/page.tsx",
                                lineNumber: 795,
                                columnNumber: 15
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "rounded-xl border border-slate-200 overflow-hidden",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "overflow-x-auto",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("table", {
                                        className: "w-full text-xs min-w-[900px]",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("thead", {
                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                                                    className: "bg-slate-50 border-b border-slate-200",
                                                    children: [
                                                        {
                                                            h: "Fecha concert.",
                                                            align: "left"
                                                        },
                                                        {
                                                            h: "Cliente",
                                                            align: "left"
                                                        },
                                                        {
                                                            h: "Tipo",
                                                            align: "left"
                                                        },
                                                        {
                                                            h: "Ticker",
                                                            align: "left"
                                                        },
                                                        {
                                                            h: "Cantidad",
                                                            align: "right"
                                                        },
                                                        {
                                                            h: "Precio",
                                                            align: "right"
                                                        },
                                                        {
                                                            h: "Comisión",
                                                            align: "right"
                                                        },
                                                        {
                                                            h: "SENEBI",
                                                            align: "right"
                                                        },
                                                        {
                                                            h: "Total generado",
                                                            align: "right"
                                                        },
                                                        {
                                                            h: "Operador",
                                                            align: "left"
                                                        },
                                                        {
                                                            h: "Estado",
                                                            align: "left"
                                                        }
                                                    ].map(({ h, align }, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                            className: `px-3 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 whitespace-nowrap text-${align}`,
                                                            children: h
                                                        }, h || `col-${i}`, false, {
                                                            fileName: "[project]/src/app/(dashboard)/cuentas-inversion/[id]/page.tsx",
                                                            lineNumber: 816,
                                                            columnNumber: 27
                                                        }, this))
                                                }, void 0, false, {
                                                    fileName: "[project]/src/app/(dashboard)/cuentas-inversion/[id]/page.tsx",
                                                    lineNumber: 802,
                                                    columnNumber: 23
                                                }, this)
                                            }, void 0, false, {
                                                fileName: "[project]/src/app/(dashboard)/cuentas-inversion/[id]/page.tsx",
                                                lineNumber: 801,
                                                columnNumber: 21
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("tbody", {
                                                children: reportOps.map((op)=>{
                                                    const gen = comGenReport(op);
                                                    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                                                        className: "border-b border-slate-50 last:border-0 bg-white hover:bg-slate-50/60 transition-colors",
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                className: "px-3 py-3 font-mono text-slate-500 whitespace-nowrap",
                                                                children: fmtDate(op.fechaConcertacion)
                                                            }, void 0, false, {
                                                                fileName: "[project]/src/app/(dashboard)/cuentas-inversion/[id]/page.tsx",
                                                                lineNumber: 825,
                                                                columnNumber: 29
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                className: "px-3 py-3 font-medium text-slate-800 max-w-[150px] truncate",
                                                                children: op.sujeto
                                                            }, void 0, false, {
                                                                fileName: "[project]/src/app/(dashboard)/cuentas-inversion/[id]/page.tsx",
                                                                lineNumber: 826,
                                                                columnNumber: 29
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                className: "px-3 py-3 text-slate-500 whitespace-nowrap",
                                                                children: TIPO_LABEL[op.tipoOperacion] ?? op.tipoOperacion
                                                            }, void 0, false, {
                                                                fileName: "[project]/src/app/(dashboard)/cuentas-inversion/[id]/page.tsx",
                                                                lineNumber: 827,
                                                                columnNumber: 29
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                className: "px-3 py-3",
                                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                    className: "flex items-center gap-1.5",
                                                                    children: [
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                            className: "font-black text-slate-900 tracking-tight",
                                                                            children: op.ticker
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/src/app/(dashboard)/cuentas-inversion/[id]/page.tsx",
                                                                            lineNumber: 830,
                                                                            columnNumber: 33
                                                                        }, this),
                                                                        op.esSenebi && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                            className: "text-[9px] font-black px-1.5 py-0.5 rounded bg-violet-100 text-violet-700 uppercase tracking-widest",
                                                                            children: "SENEBI"
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/src/app/(dashboard)/cuentas-inversion/[id]/page.tsx",
                                                                            lineNumber: 832,
                                                                            columnNumber: 35
                                                                        }, this)
                                                                    ]
                                                                }, void 0, true, {
                                                                    fileName: "[project]/src/app/(dashboard)/cuentas-inversion/[id]/page.tsx",
                                                                    lineNumber: 829,
                                                                    columnNumber: 31
                                                                }, this)
                                                            }, void 0, false, {
                                                                fileName: "[project]/src/app/(dashboard)/cuentas-inversion/[id]/page.tsx",
                                                                lineNumber: 828,
                                                                columnNumber: 29
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                className: "px-3 py-3 text-right tabular-nums font-mono text-slate-600",
                                                                children: fmt(op.cantidad, 0)
                                                            }, void 0, false, {
                                                                fileName: "[project]/src/app/(dashboard)/cuentas-inversion/[id]/page.tsx",
                                                                lineNumber: 836,
                                                                columnNumber: 29
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                className: "px-3 py-3 text-right tabular-nums font-mono text-slate-600",
                                                                children: fmt(op.precio, 4)
                                                            }, void 0, false, {
                                                                fileName: "[project]/src/app/(dashboard)/cuentas-inversion/[id]/page.tsx",
                                                                lineNumber: 837,
                                                                columnNumber: 29
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                className: "px-3 py-3 text-right tabular-nums font-mono text-slate-600",
                                                                children: !op.esSenebi ? op.comisionPct != null ? `${fmt(op.comisionPct, 4)}%` : op.comisionFija != null ? fmt(op.comisionFija) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                    className: "text-slate-300",
                                                                    children: "—"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/src/app/(dashboard)/cuentas-inversion/[id]/page.tsx",
                                                                    lineNumber: 840,
                                                                    columnNumber: 138
                                                                }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                    className: "text-slate-300",
                                                                    children: "—"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/src/app/(dashboard)/cuentas-inversion/[id]/page.tsx",
                                                                    lineNumber: 841,
                                                                    columnNumber: 35
                                                                }, this)
                                                            }, void 0, false, {
                                                                fileName: "[project]/src/app/(dashboard)/cuentas-inversion/[id]/page.tsx",
                                                                lineNumber: 838,
                                                                columnNumber: 29
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                className: "px-3 py-3 text-right tabular-nums font-mono",
                                                                children: op.esSenebi ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                    className: "text-violet-600 font-semibold",
                                                                    children: [
                                                                        "ARS ",
                                                                        fmt(op.senebiBruto ?? 0)
                                                                    ]
                                                                }, void 0, true, {
                                                                    fileName: "[project]/src/app/(dashboard)/cuentas-inversion/[id]/page.tsx",
                                                                    lineNumber: 845,
                                                                    columnNumber: 35
                                                                }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                    className: "text-slate-300",
                                                                    children: "—"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/src/app/(dashboard)/cuentas-inversion/[id]/page.tsx",
                                                                    lineNumber: 846,
                                                                    columnNumber: 35
                                                                }, this)
                                                            }, void 0, false, {
                                                                fileName: "[project]/src/app/(dashboard)/cuentas-inversion/[id]/page.tsx",
                                                                lineNumber: 843,
                                                                columnNumber: 29
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                className: "px-3 py-3 text-right tabular-nums font-mono font-bold text-slate-900",
                                                                children: [
                                                                    "ARS ",
                                                                    fmt(gen)
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/src/app/(dashboard)/cuentas-inversion/[id]/page.tsx",
                                                                lineNumber: 848,
                                                                columnNumber: 29
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                className: "px-3 py-3 text-slate-500 whitespace-nowrap",
                                                                children: op.operador
                                                            }, void 0, false, {
                                                                fileName: "[project]/src/app/(dashboard)/cuentas-inversion/[id]/page.tsx",
                                                                lineNumber: 851,
                                                                columnNumber: 29
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                className: "px-3 py-3",
                                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                    className: `text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-widest ${op.estado === "LIQUIDADA" ? "bg-emerald-50 text-emerald-700" : "bg-blue-50 text-blue-700"}`,
                                                                    children: op.estado === "LIQUIDADA" ? "Liquidada" : "Concertada"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/src/app/(dashboard)/cuentas-inversion/[id]/page.tsx",
                                                                    lineNumber: 853,
                                                                    columnNumber: 31
                                                                }, this)
                                                            }, void 0, false, {
                                                                fileName: "[project]/src/app/(dashboard)/cuentas-inversion/[id]/page.tsx",
                                                                lineNumber: 852,
                                                                columnNumber: 29
                                                            }, this)
                                                        ]
                                                    }, op.id, true, {
                                                        fileName: "[project]/src/app/(dashboard)/cuentas-inversion/[id]/page.tsx",
                                                        lineNumber: 824,
                                                        columnNumber: 27
                                                    }, this);
                                                })
                                            }, void 0, false, {
                                                fileName: "[project]/src/app/(dashboard)/cuentas-inversion/[id]/page.tsx",
                                                lineNumber: 820,
                                                columnNumber: 21
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("tfoot", {
                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                                                    className: "border-t-2 border-slate-200 bg-slate-50",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                            colSpan: 8,
                                                            className: "px-3 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right",
                                                            children: "Total"
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/app/(dashboard)/cuentas-inversion/[id]/page.tsx",
                                                            lineNumber: 867,
                                                            columnNumber: 25
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                            className: "px-3 py-3 text-right tabular-nums font-mono font-black text-slate-900",
                                                            children: [
                                                                "ARS ",
                                                                fmt(rBruto)
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/src/app/(dashboard)/cuentas-inversion/[id]/page.tsx",
                                                            lineNumber: 868,
                                                            columnNumber: 25
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                            colSpan: 2
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/app/(dashboard)/cuentas-inversion/[id]/page.tsx",
                                                            lineNumber: 869,
                                                            columnNumber: 25
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/src/app/(dashboard)/cuentas-inversion/[id]/page.tsx",
                                                    lineNumber: 866,
                                                    columnNumber: 23
                                                }, this)
                                            }, void 0, false, {
                                                fileName: "[project]/src/app/(dashboard)/cuentas-inversion/[id]/page.tsx",
                                                lineNumber: 865,
                                                columnNumber: 21
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/app/(dashboard)/cuentas-inversion/[id]/page.tsx",
                                        lineNumber: 800,
                                        columnNumber: 19
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/src/app/(dashboard)/cuentas-inversion/[id]/page.tsx",
                                    lineNumber: 799,
                                    columnNumber: 17
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/src/app/(dashboard)/cuentas-inversion/[id]/page.tsx",
                                lineNumber: 798,
                                columnNumber: 15
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/app/(dashboard)/cuentas-inversion/[id]/page.tsx",
                        lineNumber: 794,
                        columnNumber: 13
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/app/(dashboard)/cuentas-inversion/[id]/page.tsx",
                lineNumber: 658,
                columnNumber: 9
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/app/(dashboard)/cuentas-inversion/[id]/page.tsx",
        lineNumber: 351,
        columnNumber: 5
    }, this);
}
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, false);}),
"[project]/src/app/(dashboard)/cuentas-inversion/[id]/page.tsx [app-rsc] (ecmascript, Next.js server component)": ((__turbopack_context__) => {

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.n(__turbopack_context__.i("[project]/src/app/(dashboard)/cuentas-inversion/[id]/page.tsx [app-rsc] (ecmascript)"));
}}),

};

//# sourceMappingURL=%5Broot-of-the-server%5D__bd119a77._.js.map