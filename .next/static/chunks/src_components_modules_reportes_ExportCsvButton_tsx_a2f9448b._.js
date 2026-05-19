(globalThis.TURBOPACK = globalThis.TURBOPACK || []).push([typeof document === "object" ? document.currentScript : undefined, {

"[project]/src/components/modules/reportes/ExportCsvButton.tsx [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname, k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
__turbopack_context__.s({
    "ExportCsvButton": (()=>ExportCsvButton)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
"use client";
;
function ExportCsvButton({ rows }) {
    function handleExport() {
        const header = "Cliente,CC,PF,Custodia,Exposicion,Estado";
        const lines = rows.map((r)=>[
                `"${r.clienteNombre.replace(/"/g, '""')}"`,
                r.ccSaldo.toFixed(2),
                r.plazosFijos.toFixed(2),
                r.custodia.toFixed(2),
                r.exposicionTotal.toFixed(2),
                r.estado
            ].join(","));
        const csv = [
            header,
            ...lines
        ].join("\n");
        const blob = new Blob([
            csv
        ], {
            type: "text/csv;charset=utf-8;"
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "exposicion-clientes.csv";
        a.click();
        URL.revokeObjectURL(url);
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
        onClick: handleExport,
        className: "px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors",
        children: "Exportar CSV"
    }, void 0, false, {
        fileName: "[project]/src/components/modules/reportes/ExportCsvButton.tsx",
        lineNumber: 36,
        columnNumber: 5
    }, this);
}
_c = ExportCsvButton;
var _c;
__turbopack_context__.k.register(_c, "ExportCsvButton");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
}]);

//# sourceMappingURL=src_components_modules_reportes_ExportCsvButton_tsx_a2f9448b._.js.map