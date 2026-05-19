(globalThis.TURBOPACK = globalThis.TURBOPACK || []).push([typeof document === "object" ? document.currentScript : undefined, {

"[project]/src/app/(dashboard)/carteras/inmobiliarias/data:ff44ae [app-client] (ecmascript) <text/javascript>": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname, k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
/* __next_internal_action_entry_do_not_use__ [{"603318fe8408f86178860a82cdda38e114f49eca31":"crearMovimientoInmobiliario"},"src/app/(dashboard)/carteras/inmobiliarias/actions.ts",""] */ __turbopack_context__.s({
    "crearMovimientoInmobiliario": (()=>crearMovimientoInmobiliario)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$client$2d$wrapper$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/build/webpack/loaders/next-flight-loader/action-client-wrapper.js [app-client] (ecmascript)");
"use turbopack no side effects";
;
var crearMovimientoInmobiliario = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$client$2d$wrapper$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createServerReference"])("603318fe8408f86178860a82cdda38e114f49eca31", __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$client$2d$wrapper$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["callServer"], void 0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$client$2d$wrapper$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["findSourceMapURL"], "crearMovimientoInmobiliario"); //# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4vYWN0aW9ucy50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJcInVzZSBzZXJ2ZXJcIjtcblxuaW1wb3J0IHsgcHJpc21hIH0gZnJvbSBcIkAvbGliL3ByaXNtYVwiO1xuaW1wb3J0IHsgcmV2YWxpZGF0ZVBhdGggfSBmcm9tIFwibmV4dC9jYWNoZVwiO1xuaW1wb3J0IHsgRGVjaW1hbCB9IGZyb20gXCJAcHJpc21hL2NsaWVudC9ydW50aW1lL2xpYnJhcnlcIjtcbmltcG9ydCB7IFRpcG9JbnZlcnNpb25Jbm1vYmlsaWFyaWEsIE1vbmVkYSB9IGZyb20gXCJAcHJpc21hL2NsaWVudFwiO1xuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gY3JlYXJNb3ZpbWllbnRvSW5tb2JpbGlhcmlvKFxuICBfcHJldjogeyBlcnJvcj86IHN0cmluZzsgb2s/OiBib29sZWFuIH0sXG4gIGZvcm1EYXRhOiBGb3JtRGF0YVxuKTogUHJvbWlzZTx7IGVycm9yPzogc3RyaW5nOyBvaz86IGJvb2xlYW4gfT4ge1xuICBjb25zdCBwcm9waWVkYWRJZCA9IGZvcm1EYXRhLmdldChcInByb3BpZWRhZElkXCIpPy50b1N0cmluZygpO1xuICBjb25zdCBmZWNoYVN0ciA9IGZvcm1EYXRhLmdldChcImZlY2hhXCIpPy50b1N0cmluZygpO1xuICBjb25zdCB0aXBvID0gZm9ybURhdGEuZ2V0KFwidGlwb1wiKT8udG9TdHJpbmcoKSBhcyBUaXBvSW52ZXJzaW9uSW5tb2JpbGlhcmlhO1xuICBjb25zdCBkZXNjcmlwY2lvbiA9IGZvcm1EYXRhLmdldChcImRlc2NyaXBjaW9uXCIpPy50b1N0cmluZygpO1xuICBjb25zdCBtb250b1N0ciA9IGZvcm1EYXRhLmdldChcIm1vbnRvXCIpPy50b1N0cmluZygpLnJlcGxhY2UoXCIsXCIsIFwiLlwiKTtcbiAgY29uc3QgbW9uZWRhID0gZm9ybURhdGEuZ2V0KFwibW9uZWRhXCIpPy50b1N0cmluZygpIGFzIE1vbmVkYTtcbiAgY29uc3QgcXVpZW4gPSBmb3JtRGF0YS5nZXQoXCJxdWllblwiKT8udG9TdHJpbmcoKTtcblxuICBpZiAoIXByb3BpZWRhZElkIHx8ICFmZWNoYVN0ciB8fCAhdGlwbyB8fCAhbW9udG9TdHIgfHwgIW1vbmVkYSB8fCAhcXVpZW4pIHtcbiAgICByZXR1cm4geyBlcnJvcjogXCJUb2RvcyBsb3MgY2FtcG9zIHNvbiBvYmxpZ2F0b3Jpb3NcIiB9O1xuICB9XG5cbiAgY29uc3QgbW9udG8gPSBwYXJzZUZsb2F0KG1vbnRvU3RyKTtcbiAgaWYgKGlzTmFOKG1vbnRvKSB8fCBtb250byA8PSAwKSB7XG4gICAgcmV0dXJuIHsgZXJyb3I6IFwiTW9udG8gaW52w6FsaWRvXCIgfTtcbiAgfVxuXG4gIGNvbnN0IGZlY2hhID0gbmV3IERhdGUoZmVjaGFTdHIpO1xuICBpZiAoaXNOYU4oZmVjaGEuZ2V0VGltZSgpKSkge1xuICAgIHJldHVybiB7IGVycm9yOiBcIkZlY2hhIGludsOhbGlkYVwiIH07XG4gIH1cblxuICB0cnkge1xuICAgIGF3YWl0IHByaXNtYS5pbnZlcnNpb25Jbm1vYmlsaWFyaWEuY3JlYXRlKHtcbiAgICAgIGRhdGE6IHtcbiAgICAgICAgaWQ6IGNyeXB0by5yYW5kb21VVUlEKCksXG4gICAgICAgIHByb3BpZWRhZElkLFxuICAgICAgICBmZWNoYSxcbiAgICAgICAgdGlwbyxcbiAgICAgICAgZGVzY3JpcGNpb246IGRlc2NyaXBjaW9uIHx8IFwiXCIsXG4gICAgICAgIG1vbnRvOiBuZXcgRGVjaW1hbChtb250byksXG4gICAgICAgIG1vbmVkYSxcbiAgICAgICAgcXVpZW4sXG4gICAgICB9LFxuICAgIH0pO1xuXG4gICAgcmV2YWxpZGF0ZVBhdGgoXCIvY2FydGVyYXMvaW5tb2JpbGlhcmlhc1wiKTtcbiAgICByZXR1cm4geyBvazogdHJ1ZSB9O1xuICB9IGNhdGNoIChlcnJvcjogYW55KSB7XG4gICAgcmV0dXJuIHsgZXJyb3I6IGVycm9yLm1lc3NhZ2UgfHwgXCJFcnJvciBhbCBjcmVhciBtb3ZpbWllbnRvXCIgfTtcbiAgfVxufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gY3JlYXJQcm9waWVkYWQoXG4gIF9wcmV2OiB7IGVycm9yPzogc3RyaW5nOyBvaz86IGJvb2xlYW4gfSxcbiAgZm9ybURhdGE6IEZvcm1EYXRhXG4pOiBQcm9taXNlPHsgZXJyb3I/OiBzdHJpbmc7IG9rPzogYm9vbGVhbiB9PiB7XG4gIGNvbnN0IG5vbWJyZSA9IGZvcm1EYXRhLmdldChcIm5vbWJyZVwiKT8udG9TdHJpbmcoKS50cmltKCk7XG5cbiAgaWYgKCFub21icmUpIHtcbiAgICByZXR1cm4geyBlcnJvcjogXCJFbCBub21icmUgZXMgb2JsaWdhdG9yaW9cIiB9O1xuICB9XG5cbiAgdHJ5IHtcbiAgICBhd2FpdCBwcmlzbWEucHJvcGllZGFkLmNyZWF0ZSh7XG4gICAgICBkYXRhOiB7IGlkOiBjcnlwdG8ucmFuZG9tVVVJRCgpLCBub21icmUsIGFjdGl2YTogdHJ1ZSB9LFxuICAgIH0pO1xuXG4gICAgcmV2YWxpZGF0ZVBhdGgoXCIvY2FydGVyYXMvaW5tb2JpbGlhcmlhc1wiKTtcbiAgICByZXR1cm4geyBvazogdHJ1ZSB9O1xuICB9IGNhdGNoIChlcnJvcjogYW55KSB7XG4gICAgaWYgKGVycm9yLmNvZGUgPT09IFwiUDIwMDJcIikge1xuICAgICAgcmV0dXJuIHsgZXJyb3I6IFwiWWEgZXhpc3RlIHVuYSBwcm9waWVkYWQgY29uIGVzZSBub21icmVcIiB9O1xuICAgIH1cbiAgICByZXR1cm4geyBlcnJvcjogZXJyb3IubWVzc2FnZSB8fCBcIkVycm9yIGFsIGNyZWFyIHByb3BpZWRhZFwiIH07XG4gIH1cbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGRlc2FjdGl2YXJQcm9waWVkYWQocHJvcGllZGFkSWQ6IHN0cmluZykge1xuICB0cnkge1xuICAgIGF3YWl0IHByaXNtYS5wcm9waWVkYWQudXBkYXRlKHtcbiAgICAgIHdoZXJlOiB7IGlkOiBwcm9waWVkYWRJZCB9LFxuICAgICAgZGF0YTogeyBhY3RpdmE6IGZhbHNlIH0sXG4gICAgfSk7XG5cbiAgICByZXZhbGlkYXRlUGF0aChcIi9jYXJ0ZXJhcy9pbm1vYmlsaWFyaWFzXCIpO1xuICAgIHJldHVybiB7IG9rOiB0cnVlIH07XG4gIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcbiAgICByZXR1cm4geyBlcnJvcjogZXJyb3IubWVzc2FnZSB8fCBcIkVycm9yIGFsIGRlc2FjdGl2YXIgcHJvcGllZGFkXCIgfTtcbiAgfVxufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiIwVUFPc0IifQ==
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/src/components/modules/carteras/NuevoMovimientoInmobiliarioForm.tsx [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname, k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
__turbopack_context__.s({
    "NuevoMovimientoInmobiliarioForm": (()=>NuevoMovimientoInmobiliarioForm)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f28$dashboard$292f$carteras$2f$inmobiliarias$2f$data$3a$ff44ae__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$text$2f$javascript$3e$__ = __turbopack_context__.i("[project]/src/app/(dashboard)/carteras/inmobiliarias/data:ff44ae [app-client] (ecmascript) <text/javascript>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$plus$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__PlusCircle$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/circle-plus.js [app-client] (ecmascript) <export default as PlusCircle>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$loader$2d$circle$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Loader2$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/loader-circle.js [app-client] (ecmascript) <export default as Loader2>");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
;
const init = {};
function NuevoMovimientoInmobiliarioForm({ propiedades }) {
    _s();
    const [state, action, pending] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useActionState"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f28$dashboard$292f$carteras$2f$inmobiliarias$2f$data$3a$ff44ae__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$text$2f$javascript$3e$__["crearMovimientoInmobiliario"], init);
    const formRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "NuevoMovimientoInmobiliarioForm.useEffect": ()=>{
            if (state.ok) {
                formRef.current?.reset();
            }
        }
    }["NuevoMovimientoInmobiliarioForm.useEffect"], [
        state.ok
    ]);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
        className: "bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col relative",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "absolute top-0 left-0 w-1 h-full bg-blue-600"
            }, void 0, false, {
                fileName: "[project]/src/components/modules/carteras/NuevoMovimientoInmobiliarioForm.tsx",
                lineNumber: 27,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "px-6 py-4 border-b border-slate-100 bg-slate-50/30",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                    className: "text-[12px] font-bold uppercase tracking-widest text-slate-800 flex items-center gap-2",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$plus$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__PlusCircle$3e$__["PlusCircle"], {
                            size: 14,
                            className: "text-blue-600"
                        }, void 0, false, {
                            fileName: "[project]/src/components/modules/carteras/NuevoMovimientoInmobiliarioForm.tsx",
                            lineNumber: 30,
                            columnNumber: 11
                        }, this),
                        "Nuevo Movimiento"
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/components/modules/carteras/NuevoMovimientoInmobiliarioForm.tsx",
                    lineNumber: 29,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/src/components/modules/carteras/NuevoMovimientoInmobiliarioForm.tsx",
                lineNumber: 28,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("form", {
                ref: formRef,
                action: action,
                className: "p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex flex-col gap-1.5",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                className: "text-[10px] font-black uppercase tracking-widest text-slate-400",
                                children: "Propiedad"
                            }, void 0, false, {
                                fileName: "[project]/src/components/modules/carteras/NuevoMovimientoInmobiliarioForm.tsx",
                                lineNumber: 38,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                name: "propiedadId",
                                required: true,
                                className: "bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                        value: "",
                                        children: "Seleccionar..."
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/modules/carteras/NuevoMovimientoInmobiliarioForm.tsx",
                                        lineNumber: 44,
                                        columnNumber: 13
                                    }, this),
                                    propiedades.map((p)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                            value: p.id,
                                            children: p.nombre
                                        }, p.id, false, {
                                            fileName: "[project]/src/components/modules/carteras/NuevoMovimientoInmobiliarioForm.tsx",
                                            lineNumber: 46,
                                            columnNumber: 15
                                        }, this))
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/modules/carteras/NuevoMovimientoInmobiliarioForm.tsx",
                                lineNumber: 39,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/modules/carteras/NuevoMovimientoInmobiliarioForm.tsx",
                        lineNumber: 37,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex flex-col gap-1.5",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                className: "text-[10px] font-black uppercase tracking-widest text-slate-400",
                                children: "Fecha"
                            }, void 0, false, {
                                fileName: "[project]/src/components/modules/carteras/NuevoMovimientoInmobiliarioForm.tsx",
                                lineNumber: 55,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                name: "fecha",
                                type: "date",
                                required: true,
                                defaultValue: new Date().toISOString().split("T")[0],
                                className: "bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100"
                            }, void 0, false, {
                                fileName: "[project]/src/components/modules/carteras/NuevoMovimientoInmobiliarioForm.tsx",
                                lineNumber: 56,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/modules/carteras/NuevoMovimientoInmobiliarioForm.tsx",
                        lineNumber: 54,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex flex-col gap-1.5",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                className: "text-[10px] font-black uppercase tracking-widest text-slate-400",
                                children: "Tipo"
                            }, void 0, false, {
                                fileName: "[project]/src/components/modules/carteras/NuevoMovimientoInmobiliarioForm.tsx",
                                lineNumber: 67,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                name: "tipo",
                                required: true,
                                className: "bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                        value: "INGRESO",
                                        children: "INGRESO (Aporte)"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/modules/carteras/NuevoMovimientoInmobiliarioForm.tsx",
                                        lineNumber: 73,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                        value: "RENTA",
                                        children: "RENTA (Cobro)"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/modules/carteras/NuevoMovimientoInmobiliarioForm.tsx",
                                        lineNumber: 74,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                        value: "EGRESO",
                                        children: "EGRESO (Gasto)"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/modules/carteras/NuevoMovimientoInmobiliarioForm.tsx",
                                        lineNumber: 75,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                        value: "MEJORA",
                                        children: "MEJORA (Inversión)"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/modules/carteras/NuevoMovimientoInmobiliarioForm.tsx",
                                        lineNumber: 76,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                        value: "IMPUESTO",
                                        children: "IMPUESTO"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/modules/carteras/NuevoMovimientoInmobiliarioForm.tsx",
                                        lineNumber: 77,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/modules/carteras/NuevoMovimientoInmobiliarioForm.tsx",
                                lineNumber: 68,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/modules/carteras/NuevoMovimientoInmobiliarioForm.tsx",
                        lineNumber: 66,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex flex-col gap-1.5",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                className: "text-[10px] font-black uppercase tracking-widest text-slate-400",
                                children: "Moneda"
                            }, void 0, false, {
                                fileName: "[project]/src/components/modules/carteras/NuevoMovimientoInmobiliarioForm.tsx",
                                lineNumber: 83,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                name: "moneda",
                                required: true,
                                className: "bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                        value: "USD",
                                        children: "USD"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/modules/carteras/NuevoMovimientoInmobiliarioForm.tsx",
                                        lineNumber: 89,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                        value: "ARS",
                                        children: "ARS"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/modules/carteras/NuevoMovimientoInmobiliarioForm.tsx",
                                        lineNumber: 90,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/modules/carteras/NuevoMovimientoInmobiliarioForm.tsx",
                                lineNumber: 84,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/modules/carteras/NuevoMovimientoInmobiliarioForm.tsx",
                        lineNumber: 82,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex flex-col gap-1.5",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                className: "text-[10px] font-black uppercase tracking-widest text-slate-400",
                                children: "Monto"
                            }, void 0, false, {
                                fileName: "[project]/src/components/modules/carteras/NuevoMovimientoInmobiliarioForm.tsx",
                                lineNumber: 96,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                name: "monto",
                                type: "number",
                                step: "0.01",
                                min: "0.01",
                                required: true,
                                placeholder: "0.00",
                                className: "bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold tabular-nums focus:outline-none focus:ring-2 focus:ring-blue-100"
                            }, void 0, false, {
                                fileName: "[project]/src/components/modules/carteras/NuevoMovimientoInmobiliarioForm.tsx",
                                lineNumber: 97,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/modules/carteras/NuevoMovimientoInmobiliarioForm.tsx",
                        lineNumber: 95,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex flex-col gap-1.5",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                className: "text-[10px] font-black uppercase tracking-widest text-slate-400",
                                children: "Quién (Responsable)"
                            }, void 0, false, {
                                fileName: "[project]/src/components/modules/carteras/NuevoMovimientoInmobiliarioForm.tsx",
                                lineNumber: 110,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                name: "quien",
                                type: "text",
                                required: true,
                                placeholder: "Nombre del socio/cliente",
                                className: "bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100"
                            }, void 0, false, {
                                fileName: "[project]/src/components/modules/carteras/NuevoMovimientoInmobiliarioForm.tsx",
                                lineNumber: 111,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/modules/carteras/NuevoMovimientoInmobiliarioForm.tsx",
                        lineNumber: 109,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex flex-col gap-1.5 lg:col-span-2",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                className: "text-[10px] font-black uppercase tracking-widest text-slate-400",
                                children: "Descripción"
                            }, void 0, false, {
                                fileName: "[project]/src/components/modules/carteras/NuevoMovimientoInmobiliarioForm.tsx",
                                lineNumber: 122,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                name: "descripcion",
                                type: "text",
                                placeholder: "Detalle del movimiento...",
                                className: "bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100"
                            }, void 0, false, {
                                fileName: "[project]/src/components/modules/carteras/NuevoMovimientoInmobiliarioForm.tsx",
                                lineNumber: 123,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/modules/carteras/NuevoMovimientoInmobiliarioForm.tsx",
                        lineNumber: 121,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "lg:col-span-4 flex flex-col gap-3 mt-2",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                type: "submit",
                                disabled: pending,
                                className: "bg-slate-900 hover:bg-blue-600 disabled:opacity-50 text-white text-xs font-black uppercase tracking-[0.2em] py-3.5 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2",
                                children: pending ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$loader$2d$circle$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Loader2$3e$__["Loader2"], {
                                            size: 16,
                                            className: "animate-spin"
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/modules/carteras/NuevoMovimientoInmobiliarioForm.tsx",
                                            lineNumber: 140,
                                            columnNumber: 17
                                        }, this),
                                        "Registrando..."
                                    ]
                                }, void 0, true) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$plus$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__PlusCircle$3e$__["PlusCircle"], {
                                            size: 16
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/modules/carteras/NuevoMovimientoInmobiliarioForm.tsx",
                                            lineNumber: 145,
                                            columnNumber: 17
                                        }, this),
                                        "Registrar Movimiento"
                                    ]
                                }, void 0, true)
                            }, void 0, false, {
                                fileName: "[project]/src/components/modules/carteras/NuevoMovimientoInmobiliarioForm.tsx",
                                lineNumber: 133,
                                columnNumber: 11
                            }, this),
                            state.error && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-[11px] font-black uppercase text-red-500 bg-red-50 p-3 rounded-lg border border-red-100",
                                children: [
                                    "⚠️ ",
                                    state.error
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/modules/carteras/NuevoMovimientoInmobiliarioForm.tsx",
                                lineNumber: 152,
                                columnNumber: 13
                            }, this),
                            state.ok && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-[11px] font-black uppercase text-emerald-600 bg-emerald-50 p-3 rounded-lg border border-emerald-100",
                                children: "✓ Movimiento registrado correctamente"
                            }, void 0, false, {
                                fileName: "[project]/src/components/modules/carteras/NuevoMovimientoInmobiliarioForm.tsx",
                                lineNumber: 157,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/modules/carteras/NuevoMovimientoInmobiliarioForm.tsx",
                        lineNumber: 132,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/modules/carteras/NuevoMovimientoInmobiliarioForm.tsx",
                lineNumber: 35,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/modules/carteras/NuevoMovimientoInmobiliarioForm.tsx",
        lineNumber: 26,
        columnNumber: 5
    }, this);
}
_s(NuevoMovimientoInmobiliarioForm, "xspG6zU6cC70tO/4cwwoQMXvO38=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useActionState"]
    ];
});
_c = NuevoMovimientoInmobiliarioForm;
var _c;
__turbopack_context__.k.register(_c, "NuevoMovimientoInmobiliarioForm");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/src/app/(dashboard)/carteras/inmobiliarias/data:cd771a [app-client] (ecmascript) <text/javascript>": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname, k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
/* __next_internal_action_entry_do_not_use__ [{"60bdff7b892501031030bd76d2233c1833d8f4e7b6":"crearPropiedad"},"src/app/(dashboard)/carteras/inmobiliarias/actions.ts",""] */ __turbopack_context__.s({
    "crearPropiedad": (()=>crearPropiedad)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$client$2d$wrapper$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/build/webpack/loaders/next-flight-loader/action-client-wrapper.js [app-client] (ecmascript)");
"use turbopack no side effects";
;
var crearPropiedad = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$client$2d$wrapper$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createServerReference"])("60bdff7b892501031030bd76d2233c1833d8f4e7b6", __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$client$2d$wrapper$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["callServer"], void 0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$client$2d$wrapper$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["findSourceMapURL"], "crearPropiedad"); //# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4vYWN0aW9ucy50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJcInVzZSBzZXJ2ZXJcIjtcblxuaW1wb3J0IHsgcHJpc21hIH0gZnJvbSBcIkAvbGliL3ByaXNtYVwiO1xuaW1wb3J0IHsgcmV2YWxpZGF0ZVBhdGggfSBmcm9tIFwibmV4dC9jYWNoZVwiO1xuaW1wb3J0IHsgRGVjaW1hbCB9IGZyb20gXCJAcHJpc21hL2NsaWVudC9ydW50aW1lL2xpYnJhcnlcIjtcbmltcG9ydCB7IFRpcG9JbnZlcnNpb25Jbm1vYmlsaWFyaWEsIE1vbmVkYSB9IGZyb20gXCJAcHJpc21hL2NsaWVudFwiO1xuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gY3JlYXJNb3ZpbWllbnRvSW5tb2JpbGlhcmlvKFxuICBfcHJldjogeyBlcnJvcj86IHN0cmluZzsgb2s/OiBib29sZWFuIH0sXG4gIGZvcm1EYXRhOiBGb3JtRGF0YVxuKTogUHJvbWlzZTx7IGVycm9yPzogc3RyaW5nOyBvaz86IGJvb2xlYW4gfT4ge1xuICBjb25zdCBwcm9waWVkYWRJZCA9IGZvcm1EYXRhLmdldChcInByb3BpZWRhZElkXCIpPy50b1N0cmluZygpO1xuICBjb25zdCBmZWNoYVN0ciA9IGZvcm1EYXRhLmdldChcImZlY2hhXCIpPy50b1N0cmluZygpO1xuICBjb25zdCB0aXBvID0gZm9ybURhdGEuZ2V0KFwidGlwb1wiKT8udG9TdHJpbmcoKSBhcyBUaXBvSW52ZXJzaW9uSW5tb2JpbGlhcmlhO1xuICBjb25zdCBkZXNjcmlwY2lvbiA9IGZvcm1EYXRhLmdldChcImRlc2NyaXBjaW9uXCIpPy50b1N0cmluZygpO1xuICBjb25zdCBtb250b1N0ciA9IGZvcm1EYXRhLmdldChcIm1vbnRvXCIpPy50b1N0cmluZygpLnJlcGxhY2UoXCIsXCIsIFwiLlwiKTtcbiAgY29uc3QgbW9uZWRhID0gZm9ybURhdGEuZ2V0KFwibW9uZWRhXCIpPy50b1N0cmluZygpIGFzIE1vbmVkYTtcbiAgY29uc3QgcXVpZW4gPSBmb3JtRGF0YS5nZXQoXCJxdWllblwiKT8udG9TdHJpbmcoKTtcblxuICBpZiAoIXByb3BpZWRhZElkIHx8ICFmZWNoYVN0ciB8fCAhdGlwbyB8fCAhbW9udG9TdHIgfHwgIW1vbmVkYSB8fCAhcXVpZW4pIHtcbiAgICByZXR1cm4geyBlcnJvcjogXCJUb2RvcyBsb3MgY2FtcG9zIHNvbiBvYmxpZ2F0b3Jpb3NcIiB9O1xuICB9XG5cbiAgY29uc3QgbW9udG8gPSBwYXJzZUZsb2F0KG1vbnRvU3RyKTtcbiAgaWYgKGlzTmFOKG1vbnRvKSB8fCBtb250byA8PSAwKSB7XG4gICAgcmV0dXJuIHsgZXJyb3I6IFwiTW9udG8gaW52w6FsaWRvXCIgfTtcbiAgfVxuXG4gIGNvbnN0IGZlY2hhID0gbmV3IERhdGUoZmVjaGFTdHIpO1xuICBpZiAoaXNOYU4oZmVjaGEuZ2V0VGltZSgpKSkge1xuICAgIHJldHVybiB7IGVycm9yOiBcIkZlY2hhIGludsOhbGlkYVwiIH07XG4gIH1cblxuICB0cnkge1xuICAgIGF3YWl0IHByaXNtYS5pbnZlcnNpb25Jbm1vYmlsaWFyaWEuY3JlYXRlKHtcbiAgICAgIGRhdGE6IHtcbiAgICAgICAgaWQ6IGNyeXB0by5yYW5kb21VVUlEKCksXG4gICAgICAgIHByb3BpZWRhZElkLFxuICAgICAgICBmZWNoYSxcbiAgICAgICAgdGlwbyxcbiAgICAgICAgZGVzY3JpcGNpb246IGRlc2NyaXBjaW9uIHx8IFwiXCIsXG4gICAgICAgIG1vbnRvOiBuZXcgRGVjaW1hbChtb250byksXG4gICAgICAgIG1vbmVkYSxcbiAgICAgICAgcXVpZW4sXG4gICAgICB9LFxuICAgIH0pO1xuXG4gICAgcmV2YWxpZGF0ZVBhdGgoXCIvY2FydGVyYXMvaW5tb2JpbGlhcmlhc1wiKTtcbiAgICByZXR1cm4geyBvazogdHJ1ZSB9O1xuICB9IGNhdGNoIChlcnJvcjogYW55KSB7XG4gICAgcmV0dXJuIHsgZXJyb3I6IGVycm9yLm1lc3NhZ2UgfHwgXCJFcnJvciBhbCBjcmVhciBtb3ZpbWllbnRvXCIgfTtcbiAgfVxufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gY3JlYXJQcm9waWVkYWQoXG4gIF9wcmV2OiB7IGVycm9yPzogc3RyaW5nOyBvaz86IGJvb2xlYW4gfSxcbiAgZm9ybURhdGE6IEZvcm1EYXRhXG4pOiBQcm9taXNlPHsgZXJyb3I/OiBzdHJpbmc7IG9rPzogYm9vbGVhbiB9PiB7XG4gIGNvbnN0IG5vbWJyZSA9IGZvcm1EYXRhLmdldChcIm5vbWJyZVwiKT8udG9TdHJpbmcoKS50cmltKCk7XG5cbiAgaWYgKCFub21icmUpIHtcbiAgICByZXR1cm4geyBlcnJvcjogXCJFbCBub21icmUgZXMgb2JsaWdhdG9yaW9cIiB9O1xuICB9XG5cbiAgdHJ5IHtcbiAgICBhd2FpdCBwcmlzbWEucHJvcGllZGFkLmNyZWF0ZSh7XG4gICAgICBkYXRhOiB7IGlkOiBjcnlwdG8ucmFuZG9tVVVJRCgpLCBub21icmUsIGFjdGl2YTogdHJ1ZSB9LFxuICAgIH0pO1xuXG4gICAgcmV2YWxpZGF0ZVBhdGgoXCIvY2FydGVyYXMvaW5tb2JpbGlhcmlhc1wiKTtcbiAgICByZXR1cm4geyBvazogdHJ1ZSB9O1xuICB9IGNhdGNoIChlcnJvcjogYW55KSB7XG4gICAgaWYgKGVycm9yLmNvZGUgPT09IFwiUDIwMDJcIikge1xuICAgICAgcmV0dXJuIHsgZXJyb3I6IFwiWWEgZXhpc3RlIHVuYSBwcm9waWVkYWQgY29uIGVzZSBub21icmVcIiB9O1xuICAgIH1cbiAgICByZXR1cm4geyBlcnJvcjogZXJyb3IubWVzc2FnZSB8fCBcIkVycm9yIGFsIGNyZWFyIHByb3BpZWRhZFwiIH07XG4gIH1cbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGRlc2FjdGl2YXJQcm9waWVkYWQocHJvcGllZGFkSWQ6IHN0cmluZykge1xuICB0cnkge1xuICAgIGF3YWl0IHByaXNtYS5wcm9waWVkYWQudXBkYXRlKHtcbiAgICAgIHdoZXJlOiB7IGlkOiBwcm9waWVkYWRJZCB9LFxuICAgICAgZGF0YTogeyBhY3RpdmE6IGZhbHNlIH0sXG4gICAgfSk7XG5cbiAgICByZXZhbGlkYXRlUGF0aChcIi9jYXJ0ZXJhcy9pbm1vYmlsaWFyaWFzXCIpO1xuICAgIHJldHVybiB7IG9rOiB0cnVlIH07XG4gIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcbiAgICByZXR1cm4geyBlcnJvcjogZXJyb3IubWVzc2FnZSB8fCBcIkVycm9yIGFsIGRlc2FjdGl2YXIgcHJvcGllZGFkXCIgfTtcbiAgfVxufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI2VEFzRHNCIn0=
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/src/app/(dashboard)/carteras/inmobiliarias/data:91c0e9 [app-client] (ecmascript) <text/javascript>": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname, k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
/* __next_internal_action_entry_do_not_use__ [{"40f755a6f0bf32e8569c0046a7ad4e651f56a98993":"desactivarPropiedad"},"src/app/(dashboard)/carteras/inmobiliarias/actions.ts",""] */ __turbopack_context__.s({
    "desactivarPropiedad": (()=>desactivarPropiedad)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$client$2d$wrapper$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/build/webpack/loaders/next-flight-loader/action-client-wrapper.js [app-client] (ecmascript)");
"use turbopack no side effects";
;
var desactivarPropiedad = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$client$2d$wrapper$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createServerReference"])("40f755a6f0bf32e8569c0046a7ad4e651f56a98993", __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$client$2d$wrapper$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["callServer"], void 0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$client$2d$wrapper$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["findSourceMapURL"], "desactivarPropiedad"); //# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4vYWN0aW9ucy50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJcInVzZSBzZXJ2ZXJcIjtcblxuaW1wb3J0IHsgcHJpc21hIH0gZnJvbSBcIkAvbGliL3ByaXNtYVwiO1xuaW1wb3J0IHsgcmV2YWxpZGF0ZVBhdGggfSBmcm9tIFwibmV4dC9jYWNoZVwiO1xuaW1wb3J0IHsgRGVjaW1hbCB9IGZyb20gXCJAcHJpc21hL2NsaWVudC9ydW50aW1lL2xpYnJhcnlcIjtcbmltcG9ydCB7IFRpcG9JbnZlcnNpb25Jbm1vYmlsaWFyaWEsIE1vbmVkYSB9IGZyb20gXCJAcHJpc21hL2NsaWVudFwiO1xuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gY3JlYXJNb3ZpbWllbnRvSW5tb2JpbGlhcmlvKFxuICBfcHJldjogeyBlcnJvcj86IHN0cmluZzsgb2s/OiBib29sZWFuIH0sXG4gIGZvcm1EYXRhOiBGb3JtRGF0YVxuKTogUHJvbWlzZTx7IGVycm9yPzogc3RyaW5nOyBvaz86IGJvb2xlYW4gfT4ge1xuICBjb25zdCBwcm9waWVkYWRJZCA9IGZvcm1EYXRhLmdldChcInByb3BpZWRhZElkXCIpPy50b1N0cmluZygpO1xuICBjb25zdCBmZWNoYVN0ciA9IGZvcm1EYXRhLmdldChcImZlY2hhXCIpPy50b1N0cmluZygpO1xuICBjb25zdCB0aXBvID0gZm9ybURhdGEuZ2V0KFwidGlwb1wiKT8udG9TdHJpbmcoKSBhcyBUaXBvSW52ZXJzaW9uSW5tb2JpbGlhcmlhO1xuICBjb25zdCBkZXNjcmlwY2lvbiA9IGZvcm1EYXRhLmdldChcImRlc2NyaXBjaW9uXCIpPy50b1N0cmluZygpO1xuICBjb25zdCBtb250b1N0ciA9IGZvcm1EYXRhLmdldChcIm1vbnRvXCIpPy50b1N0cmluZygpLnJlcGxhY2UoXCIsXCIsIFwiLlwiKTtcbiAgY29uc3QgbW9uZWRhID0gZm9ybURhdGEuZ2V0KFwibW9uZWRhXCIpPy50b1N0cmluZygpIGFzIE1vbmVkYTtcbiAgY29uc3QgcXVpZW4gPSBmb3JtRGF0YS5nZXQoXCJxdWllblwiKT8udG9TdHJpbmcoKTtcblxuICBpZiAoIXByb3BpZWRhZElkIHx8ICFmZWNoYVN0ciB8fCAhdGlwbyB8fCAhbW9udG9TdHIgfHwgIW1vbmVkYSB8fCAhcXVpZW4pIHtcbiAgICByZXR1cm4geyBlcnJvcjogXCJUb2RvcyBsb3MgY2FtcG9zIHNvbiBvYmxpZ2F0b3Jpb3NcIiB9O1xuICB9XG5cbiAgY29uc3QgbW9udG8gPSBwYXJzZUZsb2F0KG1vbnRvU3RyKTtcbiAgaWYgKGlzTmFOKG1vbnRvKSB8fCBtb250byA8PSAwKSB7XG4gICAgcmV0dXJuIHsgZXJyb3I6IFwiTW9udG8gaW52w6FsaWRvXCIgfTtcbiAgfVxuXG4gIGNvbnN0IGZlY2hhID0gbmV3IERhdGUoZmVjaGFTdHIpO1xuICBpZiAoaXNOYU4oZmVjaGEuZ2V0VGltZSgpKSkge1xuICAgIHJldHVybiB7IGVycm9yOiBcIkZlY2hhIGludsOhbGlkYVwiIH07XG4gIH1cblxuICB0cnkge1xuICAgIGF3YWl0IHByaXNtYS5pbnZlcnNpb25Jbm1vYmlsaWFyaWEuY3JlYXRlKHtcbiAgICAgIGRhdGE6IHtcbiAgICAgICAgaWQ6IGNyeXB0by5yYW5kb21VVUlEKCksXG4gICAgICAgIHByb3BpZWRhZElkLFxuICAgICAgICBmZWNoYSxcbiAgICAgICAgdGlwbyxcbiAgICAgICAgZGVzY3JpcGNpb246IGRlc2NyaXBjaW9uIHx8IFwiXCIsXG4gICAgICAgIG1vbnRvOiBuZXcgRGVjaW1hbChtb250byksXG4gICAgICAgIG1vbmVkYSxcbiAgICAgICAgcXVpZW4sXG4gICAgICB9LFxuICAgIH0pO1xuXG4gICAgcmV2YWxpZGF0ZVBhdGgoXCIvY2FydGVyYXMvaW5tb2JpbGlhcmlhc1wiKTtcbiAgICByZXR1cm4geyBvazogdHJ1ZSB9O1xuICB9IGNhdGNoIChlcnJvcjogYW55KSB7XG4gICAgcmV0dXJuIHsgZXJyb3I6IGVycm9yLm1lc3NhZ2UgfHwgXCJFcnJvciBhbCBjcmVhciBtb3ZpbWllbnRvXCIgfTtcbiAgfVxufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gY3JlYXJQcm9waWVkYWQoXG4gIF9wcmV2OiB7IGVycm9yPzogc3RyaW5nOyBvaz86IGJvb2xlYW4gfSxcbiAgZm9ybURhdGE6IEZvcm1EYXRhXG4pOiBQcm9taXNlPHsgZXJyb3I/OiBzdHJpbmc7IG9rPzogYm9vbGVhbiB9PiB7XG4gIGNvbnN0IG5vbWJyZSA9IGZvcm1EYXRhLmdldChcIm5vbWJyZVwiKT8udG9TdHJpbmcoKS50cmltKCk7XG5cbiAgaWYgKCFub21icmUpIHtcbiAgICByZXR1cm4geyBlcnJvcjogXCJFbCBub21icmUgZXMgb2JsaWdhdG9yaW9cIiB9O1xuICB9XG5cbiAgdHJ5IHtcbiAgICBhd2FpdCBwcmlzbWEucHJvcGllZGFkLmNyZWF0ZSh7XG4gICAgICBkYXRhOiB7IGlkOiBjcnlwdG8ucmFuZG9tVVVJRCgpLCBub21icmUsIGFjdGl2YTogdHJ1ZSB9LFxuICAgIH0pO1xuXG4gICAgcmV2YWxpZGF0ZVBhdGgoXCIvY2FydGVyYXMvaW5tb2JpbGlhcmlhc1wiKTtcbiAgICByZXR1cm4geyBvazogdHJ1ZSB9O1xuICB9IGNhdGNoIChlcnJvcjogYW55KSB7XG4gICAgaWYgKGVycm9yLmNvZGUgPT09IFwiUDIwMDJcIikge1xuICAgICAgcmV0dXJuIHsgZXJyb3I6IFwiWWEgZXhpc3RlIHVuYSBwcm9waWVkYWQgY29uIGVzZSBub21icmVcIiB9O1xuICAgIH1cbiAgICByZXR1cm4geyBlcnJvcjogZXJyb3IubWVzc2FnZSB8fCBcIkVycm9yIGFsIGNyZWFyIHByb3BpZWRhZFwiIH07XG4gIH1cbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGRlc2FjdGl2YXJQcm9waWVkYWQocHJvcGllZGFkSWQ6IHN0cmluZykge1xuICB0cnkge1xuICAgIGF3YWl0IHByaXNtYS5wcm9waWVkYWQudXBkYXRlKHtcbiAgICAgIHdoZXJlOiB7IGlkOiBwcm9waWVkYWRJZCB9LFxuICAgICAgZGF0YTogeyBhY3RpdmE6IGZhbHNlIH0sXG4gICAgfSk7XG5cbiAgICByZXZhbGlkYXRlUGF0aChcIi9jYXJ0ZXJhcy9pbm1vYmlsaWFyaWFzXCIpO1xuICAgIHJldHVybiB7IG9rOiB0cnVlIH07XG4gIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcbiAgICByZXR1cm4geyBlcnJvcjogZXJyb3IubWVzc2FnZSB8fCBcIkVycm9yIGFsIGRlc2FjdGl2YXIgcHJvcGllZGFkXCIgfTtcbiAgfVxufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJrVUErRXNCIn0=
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/src/components/modules/carteras/GestionPropiedades.tsx [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname, k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
__turbopack_context__.s({
    "GestionPropiedades": (()=>GestionPropiedades)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f28$dashboard$292f$carteras$2f$inmobiliarias$2f$data$3a$cd771a__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$text$2f$javascript$3e$__ = __turbopack_context__.i("[project]/src/app/(dashboard)/carteras/inmobiliarias/data:cd771a [app-client] (ecmascript) <text/javascript>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f28$dashboard$292f$carteras$2f$inmobiliarias$2f$data$3a$91c0e9__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$text$2f$javascript$3e$__ = __turbopack_context__.i("[project]/src/app/(dashboard)/carteras/inmobiliarias/data:91c0e9 [app-client] (ecmascript) <text/javascript>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$house$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Home$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/house.js [app-client] (ecmascript) <export default as Home>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$plus$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Plus$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/plus.js [app-client] (ecmascript) <export default as Plus>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__X$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/x.js [app-client] (ecmascript) <export default as X>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$loader$2d$circle$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Loader2$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/loader-circle.js [app-client] (ecmascript) <export default as Loader2>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$down$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronDown$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/chevron-down.js [app-client] (ecmascript) <export default as ChevronDown>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$up$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronUp$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/chevron-up.js [app-client] (ecmascript) <export default as ChevronUp>");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
;
const init = {};
function GestionPropiedades({ propiedades }) {
    _s();
    const [isOpen, setIsOpen] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [state, action, pending] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useActionState"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f28$dashboard$292f$carteras$2f$inmobiliarias$2f$data$3a$cd771a__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$text$2f$javascript$3e$__["crearPropiedad"], init);
    const [isDeleting, setIsDeleting] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const formRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "GestionPropiedades.useEffect": ()=>{
            if (state.ok) {
                formRef.current?.reset();
            }
        }
    }["GestionPropiedades.useEffect"], [
        state.ok
    ]);
    const handleDesactivar = async (id)=>{
        if (!confirm("¿Seguro que desea desactivar esta propiedad? No aparecerá en los selectores de nuevos movimientos.")) return;
        setIsDeleting(id);
        await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f28$dashboard$292f$carteras$2f$inmobiliarias$2f$data$3a$91c0e9__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$text$2f$javascript$3e$__["desactivarPropiedad"])(id);
        setIsDeleting(null);
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
        className: "bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col relative",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "absolute top-0 left-0 w-1 h-full bg-slate-400"
            }, void 0, false, {
                fileName: "[project]/src/components/modules/carteras/GestionPropiedades.tsx",
                lineNumber: 36,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                onClick: ()=>setIsOpen(!isOpen),
                className: "px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors group",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex items-center gap-2",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$house$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Home$3e$__["Home"], {
                                size: 14,
                                className: "text-slate-400"
                            }, void 0, false, {
                                fileName: "[project]/src/components/modules/carteras/GestionPropiedades.tsx",
                                lineNumber: 43,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                className: "text-[12px] font-bold uppercase tracking-widest text-slate-800",
                                children: "Gestión de propiedades"
                            }, void 0, false, {
                                fileName: "[project]/src/components/modules/carteras/GestionPropiedades.tsx",
                                lineNumber: 44,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/modules/carteras/GestionPropiedades.tsx",
                        lineNumber: 42,
                        columnNumber: 9
                    }, this),
                    isOpen ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$up$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronUp$3e$__["ChevronUp"], {
                        size: 16,
                        className: "text-slate-400"
                    }, void 0, false, {
                        fileName: "[project]/src/components/modules/carteras/GestionPropiedades.tsx",
                        lineNumber: 48,
                        columnNumber: 19
                    }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$down$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronDown$3e$__["ChevronDown"], {
                        size: 16,
                        className: "text-slate-400"
                    }, void 0, false, {
                        fileName: "[project]/src/components/modules/carteras/GestionPropiedades.tsx",
                        lineNumber: 48,
                        columnNumber: 72
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/modules/carteras/GestionPropiedades.tsx",
                lineNumber: 38,
                columnNumber: 7
            }, this),
            isOpen && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "px-6 pb-6 pt-2 animate-in slide-in-from-top-2 duration-200 flex flex-col gap-6",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex flex-wrap gap-2",
                        children: propiedades.length === 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            className: "text-xs text-slate-400 italic",
                            children: "No hay propiedades activas."
                        }, void 0, false, {
                            fileName: "[project]/src/components/modules/carteras/GestionPropiedades.tsx",
                            lineNumber: 56,
                            columnNumber: 15
                        }, this) : propiedades.map((p)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl group transition-all hover:border-red-200",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "text-[11px] font-black text-slate-700 uppercase tracking-tight",
                                        children: p.nombre
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/modules/carteras/GestionPropiedades.tsx",
                                        lineNumber: 63,
                                        columnNumber: 19
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        onClick: ()=>handleDesactivar(p.id),
                                        disabled: isDeleting === p.id,
                                        className: "text-slate-300 hover:text-red-500 transition-colors",
                                        title: "Desactivar propiedad",
                                        children: isDeleting === p.id ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$loader$2d$circle$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Loader2$3e$__["Loader2"], {
                                            size: 12,
                                            className: "animate-spin"
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/modules/carteras/GestionPropiedades.tsx",
                                            lineNumber: 70,
                                            columnNumber: 44
                                        }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__X$3e$__["X"], {
                                            size: 12
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/modules/carteras/GestionPropiedades.tsx",
                                            lineNumber: 70,
                                            columnNumber: 93
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/modules/carteras/GestionPropiedades.tsx",
                                        lineNumber: 64,
                                        columnNumber: 19
                                    }, this)
                                ]
                            }, p.id, true, {
                                fileName: "[project]/src/components/modules/carteras/GestionPropiedades.tsx",
                                lineNumber: 59,
                                columnNumber: 17
                            }, this))
                    }, void 0, false, {
                        fileName: "[project]/src/components/modules/carteras/GestionPropiedades.tsx",
                        lineNumber: 54,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "h-px bg-slate-100 w-full"
                    }, void 0, false, {
                        fileName: "[project]/src/components/modules/carteras/GestionPropiedades.tsx",
                        lineNumber: 77,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("form", {
                        ref: formRef,
                        action: action,
                        className: "flex flex-col gap-4",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex flex-col gap-1.5",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                        className: "text-[10px] font-black uppercase tracking-widest text-slate-400",
                                        children: "Nombre de la nueva propiedad"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/modules/carteras/GestionPropiedades.tsx",
                                        lineNumber: 82,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "flex gap-2",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                name: "nombre",
                                                type: "text",
                                                required: true,
                                                placeholder: "Ej: Edificio Libertador, Quinta Olivos...",
                                                className: "flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100"
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/modules/carteras/GestionPropiedades.tsx",
                                                lineNumber: 84,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                type: "submit",
                                                disabled: pending,
                                                className: "bg-slate-900 hover:bg-blue-600 disabled:opacity-50 text-white text-[10px] font-black uppercase tracking-widest px-6 rounded-xl transition-all shadow-md flex items-center gap-2",
                                                children: [
                                                    pending ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$loader$2d$circle$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Loader2$3e$__["Loader2"], {
                                                        size: 14,
                                                        className: "animate-spin"
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/components/modules/carteras/GestionPropiedades.tsx",
                                                        lineNumber: 96,
                                                        columnNumber: 30
                                                    }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$plus$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Plus$3e$__["Plus"], {
                                                        size: 14
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/components/modules/carteras/GestionPropiedades.tsx",
                                                        lineNumber: 96,
                                                        columnNumber: 79
                                                    }, this),
                                                    "Crear"
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/src/components/modules/carteras/GestionPropiedades.tsx",
                                                lineNumber: 91,
                                                columnNumber: 17
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/components/modules/carteras/GestionPropiedades.tsx",
                                        lineNumber: 83,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/modules/carteras/GestionPropiedades.tsx",
                                lineNumber: 81,
                                columnNumber: 13
                            }, this),
                            state.error && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-[10px] font-black uppercase text-red-500 bg-red-50 px-3 py-2 rounded-lg border border-red-100",
                                children: [
                                    "⚠️ ",
                                    state.error
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/modules/carteras/GestionPropiedades.tsx",
                                lineNumber: 103,
                                columnNumber: 15
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/modules/carteras/GestionPropiedades.tsx",
                        lineNumber: 80,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/modules/carteras/GestionPropiedades.tsx",
                lineNumber: 52,
                columnNumber: 9
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/modules/carteras/GestionPropiedades.tsx",
        lineNumber: 35,
        columnNumber: 5
    }, this);
}
_s(GestionPropiedades, "sLqRryk00CNW26ZiQgNJ2ua6z2g=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useActionState"]
    ];
});
_c = GestionPropiedades;
var _c;
__turbopack_context__.k.register(_c, "GestionPropiedades");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/node_modules/next/dist/build/webpack/loaders/next-flight-loader/action-client-wrapper.js [app-client] (ecmascript)": (function(__turbopack_context__) {

var { g: global, __dirname, m: module, e: exports } = __turbopack_context__;
{
// This file must be bundled in the app's client layer, it shouldn't be directly
// imported by the server.
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
0 && (module.exports = {
    callServer: null,
    createServerReference: null,
    findSourceMapURL: null
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
    });
}
_export(exports, {
    callServer: function() {
        return _appcallserver.callServer;
    },
    createServerReference: function() {
        return createServerReference;
    },
    findSourceMapURL: function() {
        return _appfindsourcemapurl.findSourceMapURL;
    }
});
const _appcallserver = __turbopack_context__.r("[project]/node_modules/next/dist/client/app-call-server.js [app-client] (ecmascript)");
const _appfindsourcemapurl = __turbopack_context__.r("[project]/node_modules/next/dist/client/app-find-source-map-url.js [app-client] (ecmascript)");
const createServerReference = (("TURBOPACK compile-time falsy", 0) ? ("TURBOPACK unreachable", undefined) : __turbopack_context__.r("[project]/node_modules/next/dist/compiled/react-server-dom-turbopack/client.js [app-client] (ecmascript)")).createServerReference; //# sourceMappingURL=action-client-wrapper.js.map
}}),
"[project]/node_modules/lucide-react/dist/esm/icons/circle-plus.js [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ __turbopack_context__.s({
    "default": (()=>CirclePlus)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$createLucideIcon$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/createLucideIcon.js [app-client] (ecmascript)");
;
const CirclePlus = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$createLucideIcon$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"])("CirclePlus", [
    [
        "circle",
        {
            cx: "12",
            cy: "12",
            r: "10",
            key: "1mglay"
        }
    ],
    [
        "path",
        {
            d: "M8 12h8",
            key: "1wcyev"
        }
    ],
    [
        "path",
        {
            d: "M12 8v8",
            key: "napkw2"
        }
    ]
]);
;
 //# sourceMappingURL=circle-plus.js.map
}}),
"[project]/node_modules/lucide-react/dist/esm/icons/circle-plus.js [app-client] (ecmascript) <export default as PlusCircle>": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "PlusCircle": (()=>__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$plus$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"])
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$plus$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/circle-plus.js [app-client] (ecmascript)");
}}),
"[project]/node_modules/lucide-react/dist/esm/icons/loader-circle.js [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ __turbopack_context__.s({
    "default": (()=>LoaderCircle)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$createLucideIcon$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/createLucideIcon.js [app-client] (ecmascript)");
;
const LoaderCircle = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$createLucideIcon$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"])("LoaderCircle", [
    [
        "path",
        {
            d: "M21 12a9 9 0 1 1-6.219-8.56",
            key: "13zald"
        }
    ]
]);
;
 //# sourceMappingURL=loader-circle.js.map
}}),
"[project]/node_modules/lucide-react/dist/esm/icons/loader-circle.js [app-client] (ecmascript) <export default as Loader2>": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "Loader2": (()=>__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$loader$2d$circle$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"])
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$loader$2d$circle$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/loader-circle.js [app-client] (ecmascript)");
}}),
"[project]/node_modules/lucide-react/dist/esm/icons/house.js [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ __turbopack_context__.s({
    "default": (()=>House)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$createLucideIcon$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/createLucideIcon.js [app-client] (ecmascript)");
;
const House = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$createLucideIcon$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"])("House", [
    [
        "path",
        {
            d: "M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8",
            key: "5wwlr5"
        }
    ],
    [
        "path",
        {
            d: "M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z",
            key: "1d0kgt"
        }
    ]
]);
;
 //# sourceMappingURL=house.js.map
}}),
"[project]/node_modules/lucide-react/dist/esm/icons/house.js [app-client] (ecmascript) <export default as Home>": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "Home": (()=>__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$house$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"])
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$house$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/house.js [app-client] (ecmascript)");
}}),
"[project]/node_modules/lucide-react/dist/esm/icons/plus.js [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ __turbopack_context__.s({
    "default": (()=>Plus)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$createLucideIcon$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/createLucideIcon.js [app-client] (ecmascript)");
;
const Plus = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$createLucideIcon$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"])("Plus", [
    [
        "path",
        {
            d: "M5 12h14",
            key: "1ays0h"
        }
    ],
    [
        "path",
        {
            d: "M12 5v14",
            key: "s699le"
        }
    ]
]);
;
 //# sourceMappingURL=plus.js.map
}}),
"[project]/node_modules/lucide-react/dist/esm/icons/plus.js [app-client] (ecmascript) <export default as Plus>": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "Plus": (()=>__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$plus$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"])
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$plus$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/plus.js [app-client] (ecmascript)");
}}),
"[project]/node_modules/lucide-react/dist/esm/icons/x.js [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ __turbopack_context__.s({
    "default": (()=>X)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$createLucideIcon$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/createLucideIcon.js [app-client] (ecmascript)");
;
const X = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$createLucideIcon$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"])("X", [
    [
        "path",
        {
            d: "M18 6 6 18",
            key: "1bl5f8"
        }
    ],
    [
        "path",
        {
            d: "m6 6 12 12",
            key: "d8bk6v"
        }
    ]
]);
;
 //# sourceMappingURL=x.js.map
}}),
"[project]/node_modules/lucide-react/dist/esm/icons/x.js [app-client] (ecmascript) <export default as X>": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "X": (()=>__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"])
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/x.js [app-client] (ecmascript)");
}}),
"[project]/node_modules/lucide-react/dist/esm/icons/chevron-up.js [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ __turbopack_context__.s({
    "default": (()=>ChevronUp)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$createLucideIcon$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/createLucideIcon.js [app-client] (ecmascript)");
;
const ChevronUp = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$createLucideIcon$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"])("ChevronUp", [
    [
        "path",
        {
            d: "m18 15-6-6-6 6",
            key: "153udz"
        }
    ]
]);
;
 //# sourceMappingURL=chevron-up.js.map
}}),
"[project]/node_modules/lucide-react/dist/esm/icons/chevron-up.js [app-client] (ecmascript) <export default as ChevronUp>": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "ChevronUp": (()=>__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$up$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"])
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$up$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/chevron-up.js [app-client] (ecmascript)");
}}),
}]);

//# sourceMappingURL=_5fb6e302._.js.map