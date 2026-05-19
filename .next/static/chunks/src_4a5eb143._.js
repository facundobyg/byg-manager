(globalThis.TURBOPACK = globalThis.TURBOPACK || []).push([typeof document === "object" ? document.currentScript : undefined, {

"[project]/src/app/(dashboard)/bolsa/data:c0cfd2 [app-client] (ecmascript) <text/javascript>": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname, k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
/* __next_internal_action_entry_do_not_use__ [{"6035d53977bf5bc76d2c85bdca3e747632711bac75":"crearOpMesaDiaria"},"src/app/(dashboard)/bolsa/actions.ts",""] */ __turbopack_context__.s({
    "crearOpMesaDiaria": (()=>crearOpMesaDiaria)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$client$2d$wrapper$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/build/webpack/loaders/next-flight-loader/action-client-wrapper.js [app-client] (ecmascript)");
"use turbopack no side effects";
;
var crearOpMesaDiaria = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$client$2d$wrapper$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createServerReference"])("6035d53977bf5bc76d2c85bdca3e747632711bac75", __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$client$2d$wrapper$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["callServer"], void 0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$client$2d$wrapper$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["findSourceMapURL"], "crearOpMesaDiaria"); //# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4vYWN0aW9ucy50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJcInVzZSBzZXJ2ZXJcIjtcblxuaW1wb3J0IHsgYXV0aCB9IGZyb20gXCJAL2F1dGhcIjtcbmltcG9ydCB7IHByaXNtYSB9IGZyb20gXCJAL2xpYi9wcmlzbWFcIjtcbmltcG9ydCB7IHJldmFsaWRhdGVQYXRoIH0gZnJvbSBcIm5leHQvY2FjaGVcIjtcbmltcG9ydCB7IHJlYWRPbmx5UHJldmlldyB9IGZyb20gXCJAL2xpYi9jb25maWdcIjtcbmltcG9ydCB0eXBlIHsgVGlwb09wQm9sc2EsIE1lcmNhZG9Cb2xzYSwgTW9uZWRhIH0gZnJvbSBcIkBwcmlzbWEvY2xpZW50XCI7XG5cbmNvbnN0IFZFTlRBX1RJUE9TID0gbmV3IFNldDxzdHJpbmc+KFtcIlZFTlRBX0JPTk9cIiwgXCJWRU5UQV9BQ0NJT05cIiwgXCJWRU5UQV9DRURFQVJcIiwgXCJDQVVDSU9OX0NPTE9DQURPUkFcIl0pO1xuXG5mdW5jdGlvbiB0b04odjogRm9ybURhdGFFbnRyeVZhbHVlIHwgbnVsbCk6IG51bWJlciB8IG51bGwge1xuICBpZiAoIXYpIHJldHVybiBudWxsO1xuICBjb25zdCBuID0gcGFyc2VGbG9hdCh2IGFzIHN0cmluZyk7XG4gIHJldHVybiBpc05hTihuKSA/IG51bGwgOiBuO1xufVxuXG4vLyDilIDilIAgQ1JFQVIg4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSAXG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBjcmVhck9wZXJhY2lvbkJvbHNhKHByZXZTdGF0ZTogdW5rbm93biwgZm9ybURhdGE6IEZvcm1EYXRhKSB7XG4gIGlmIChyZWFkT25seVByZXZpZXcpIHJldHVybiB7IGVycm9yOiBcIk1vZG8gbGVjdHVyYSBhY3Rpdm9cIiB9O1xuXG4gIGNvbnN0IHNlc3Npb24gPSBhd2FpdCBhdXRoKCk7XG4gIGNvbnN0IHVzZXJJZCA9IHNlc3Npb24/LnVzZXI/LmlkIGFzIHN0cmluZyB8IHVuZGVmaW5lZDtcbiAgaWYgKCF1c2VySWQpIHJldHVybiB7IGVycm9yOiBcIlNpbiBzZXNpw7NuIGFjdGl2YVwiIH07XG5cbiAgY29uc3Qgc3VqZXRvVGlwbyAgICA9IGZvcm1EYXRhLmdldChcInN1amV0b1RpcG9cIikgYXMgc3RyaW5nO1xuICBjb25zdCBjb21pdGVudGVJZCAgID0gKGZvcm1EYXRhLmdldChcImNvbWl0ZW50ZUlkXCIpIGFzIHN0cmluZykgfHwgbnVsbDtcbiAgY29uc3QgY2FydGVyYUlkICAgICA9IChmb3JtRGF0YS5nZXQoXCJjYXJ0ZXJhSWRcIikgYXMgc3RyaW5nKSB8fCBudWxsO1xuICBjb25zdCB0aXBvUmF3ICAgICAgID0gZm9ybURhdGEuZ2V0KFwidGlwb09wZXJhY2lvblwiKSBhcyBzdHJpbmc7XG4gIGNvbnN0IHRpY2tlciAgICAgICAgPSAoZm9ybURhdGEuZ2V0KFwidGlja2VyXCIpIGFzIHN0cmluZyk/LnRyaW0oKS50b1VwcGVyQ2FzZSgpO1xuICBjb25zdCBjYW50aWRhZFJhdyAgID0gZm9ybURhdGEuZ2V0KFwiY2FudGlkYWRcIikgYXMgc3RyaW5nO1xuICBjb25zdCBwcmVjaW9SYXcgICAgID0gZm9ybURhdGEuZ2V0KFwicHJlY2lvXCIpIGFzIHN0cmluZztcbiAgY29uc3QgbW9uZWRhICAgICAgICA9IGZvcm1EYXRhLmdldChcIm1vbmVkYVwiKSBhcyBzdHJpbmc7XG4gIGNvbnN0IG1lcmNhZG8gICAgICAgPSBmb3JtRGF0YS5nZXQoXCJtZXJjYWRvXCIpIGFzIHN0cmluZztcbiAgY29uc3Qgb2JzZXJ2YWNpb25lcyA9IChmb3JtRGF0YS5nZXQoXCJvYnNlcnZhY2lvbmVzXCIpIGFzIHN0cmluZyk/LnRyaW0oKSB8fCBudWxsO1xuXG4gIGlmICghdGlwb1JhdyB8fCAhdGlja2VyIHx8ICFjYW50aWRhZFJhdyB8fCAhcHJlY2lvUmF3IHx8ICFtb25lZGEgfHwgIW1lcmNhZG8pXG4gICAgcmV0dXJuIHsgZXJyb3I6IFwiRmFsdGFuIGNhbXBvcyBvYmxpZ2F0b3Jpb3NcIiB9O1xuICBpZiAoc3VqZXRvVGlwbyA9PT0gXCJjb21pdGVudGVcIiAmJiAhY29taXRlbnRlSWQpXG4gICAgcmV0dXJuIHsgZXJyb3I6IFwiU2VsZWNjaW9uYXIgY29taXRlbnRlXCIgfTtcbiAgaWYgKHN1amV0b1RpcG8gPT09IFwiY2FydGVyYVwiICYmICFjYXJ0ZXJhSWQpXG4gICAgcmV0dXJuIHsgZXJyb3I6IFwiU2VsZWNjaW9uYXIgY2FydGVyYVwiIH07XG5cbiAgY29uc3QgY2FudGlkYWQgPSBwYXJzZUZsb2F0KGNhbnRpZGFkUmF3KTtcbiAgY29uc3QgcHJlY2lvICAgPSBwYXJzZUZsb2F0KHByZWNpb1Jhdyk7XG4gIGlmIChpc05hTihjYW50aWRhZCkgfHwgY2FudGlkYWQgPD0gMCkgcmV0dXJuIHsgZXJyb3I6IFwiQ2FudGlkYWQgaW52w6FsaWRhXCIgfTtcbiAgaWYgKGlzTmFOKHByZWNpbykgICB8fCBwcmVjaW8gICA8PSAwKSByZXR1cm4geyBlcnJvcjogXCJQcmVjaW8gaW52w6FsaWRvXCIgfTtcblxuICB0cnkge1xuICAgIGNvbnN0IG5vdyA9IG5ldyBEYXRlKCk7XG4gICAgY29uc3QgaWQgID0gY3J5cHRvLnJhbmRvbVVVSUQoKTtcblxuICAgIGF3YWl0IHByaXNtYS4kdHJhbnNhY3Rpb24oYXN5bmMgKHR4KSA9PiB7XG4gICAgICBhd2FpdCB0eC5vcGVyYWNpb25Cb2xzYS5jcmVhdGUoe1xuICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgaWQsXG4gICAgICAgICAgY29taXRlbnRlSWQ6ICAgICBzdWpldG9UaXBvID09PSBcImNvbWl0ZW50ZVwiID8gY29taXRlbnRlSWQgOiBudWxsLFxuICAgICAgICAgIGNhcnRlcmFJZDogICAgICAgc3VqZXRvVGlwbyA9PT0gXCJjYXJ0ZXJhXCIgPyBjYXJ0ZXJhSWQgOiBudWxsLFxuICAgICAgICAgIHRpcG9PcGVyYWNpb246ICAgdGlwb1JhdyBhcyBUaXBvT3BCb2xzYSxcbiAgICAgICAgICB0aWNrZXIsXG4gICAgICAgICAgY2FudGlkYWQsXG4gICAgICAgICAgcHJlY2lvLFxuICAgICAgICAgIG1vbmVkYTogICAgICAgICAgbW9uZWRhICBhcyBNb25lZGEsXG4gICAgICAgICAgbWVyY2FkbzogICAgICAgICBtZXJjYWRvIGFzIE1lcmNhZG9Cb2xzYSxcbiAgICAgICAgICBvYnNlcnZhY2lvbmVzLFxuICAgICAgICAgIG9wZXJhZG9yQ2FyZ2FJZDogdXNlcklkLFxuICAgICAgICAgIGVzdGFkbzogICAgICAgICAgXCJQRU5ESUVOVEVfQ09OQ0VSVEFDSU9OXCIsXG4gICAgICAgICAgdXBkYXRlZEF0OiAgICAgICBub3csXG4gICAgICAgIH0sXG4gICAgICB9KTtcbiAgICAgIGF3YWl0IHR4Lm9wZXJhY2lvbkJvbHNhTG9nLmNyZWF0ZSh7XG4gICAgICAgIGRhdGE6IHtcbiAgICAgICAgICBpZDogICAgICAgICAgY3J5cHRvLnJhbmRvbVVVSUQoKSxcbiAgICAgICAgICBvcGVyYWNpb25JZDogaWQsXG4gICAgICAgICAgdXNlcklkLFxuICAgICAgICAgIGFjY2lvbjogICAgICBcIkNBUkdBXCIsXG4gICAgICAgICAgZXN0YWRvTnVldm86IFwiUEVORElFTlRFX0NPTkNFUlRBQ0lPTlwiLFxuICAgICAgICAgIHNuYXBzaG90OiAgICB7IHRpY2tlciwgY2FudGlkYWQsIHByZWNpbywgbW9uZWRhLCBtZXJjYWRvLCB0aXBvT3BlcmFjaW9uOiB0aXBvUmF3IH0sXG4gICAgICAgIH0sXG4gICAgICB9KTtcbiAgICB9KTtcblxuICAgIHJldmFsaWRhdGVQYXRoKFwiL2JvbHNhXCIpO1xuICAgIHJldHVybiB7IG9rOiB0cnVlIGFzIGNvbnN0LCBpZCB9O1xuICB9IGNhdGNoIChlOiB1bmtub3duKSB7XG4gICAgcmV0dXJuIHsgZXJyb3I6IChlIGFzIEVycm9yKS5tZXNzYWdlIHx8IFwiRXJyb3IgYWwgY3JlYXIgb3BlcmFjacOzblwiIH07XG4gIH1cbn1cblxuLy8g4pSA4pSAIENPTkNFUlRBUiDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIBcblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGNvbmNlcnRhck9wZXJhY2lvbihwcmV2U3RhdGU6IHVua25vd24sIGZvcm1EYXRhOiBGb3JtRGF0YSkge1xuICBpZiAocmVhZE9ubHlQcmV2aWV3KSByZXR1cm4geyBlcnJvcjogXCJNb2RvIGxlY3R1cmEgYWN0aXZvXCIgfTtcblxuICBjb25zdCBzZXNzaW9uID0gYXdhaXQgYXV0aCgpO1xuICBjb25zdCB1c2VySWQgID0gc2Vzc2lvbj8udXNlcj8uaWQgYXMgc3RyaW5nIHwgdW5kZWZpbmVkO1xuICBpZiAoIXVzZXJJZCkgcmV0dXJuIHsgZXJyb3I6IFwiU2luIHNlc2nDs24gYWN0aXZhXCIgfTtcblxuICBjb25zdCBvcGVyYWNpb25JZCA9IGZvcm1EYXRhLmdldChcIm9wZXJhY2lvbklkXCIpIGFzIHN0cmluZztcbiAgaWYgKCFvcGVyYWNpb25JZCkgcmV0dXJuIHsgZXJyb3I6IFwiSUQgb3BlcmFjacOzbiByZXF1ZXJpZG9cIiB9O1xuXG4gIGNvbnN0IG9wID0gYXdhaXQgcHJpc21hLm9wZXJhY2lvbkJvbHNhLmZpbmRVbmlxdWUoeyB3aGVyZTogeyBpZDogb3BlcmFjaW9uSWQgfSB9KTtcbiAgaWYgKCFvcCkgcmV0dXJuIHsgZXJyb3I6IFwiT3BlcmFjacOzbiBubyBlbmNvbnRyYWRhXCIgfTtcbiAgaWYgKG9wLmVzdGFkbyA9PT0gXCJBTlVMQURBXCIpICAgcmV0dXJuIHsgZXJyb3I6IFwiT3BlcmFjacOzbiBhbnVsYWRhLCBubyBtb2RpZmljYWJsZVwiIH07XG4gIGlmIChvcC5lc3RhZG8gPT09IFwiTElRVUlEQURBXCIpIHJldHVybiB7IGVycm9yOiBcIk9wZXJhY2nDs24gbGlxdWlkYWRhLCBubyBtb2RpZmljYWJsZVwiIH07XG5cbiAgY29uc3QgbnJvQm9sZXRvICAgICAgICAgPSAoZm9ybURhdGEuZ2V0KFwibnJvQm9sZXRvXCIpICAgYXMgc3RyaW5nKT8udHJpbSgpIHx8IG51bGw7XG4gIGNvbnN0IGFseWMgICAgICAgICAgICAgID0gKGZvcm1EYXRhLmdldChcImFseWNcIikgICAgICAgICBhcyBzdHJpbmcpPy50cmltKCkgfHwgbnVsbDtcbiAgY29uc3QgZmVjaGFDb25jZXJ0UmF3ICAgPSBmb3JtRGF0YS5nZXQoXCJmZWNoYUNvbmNlcnRhY2lvblwiKSAgYXMgc3RyaW5nIHwgbnVsbDtcbiAgY29uc3QgZmVjaGFMaXF1aWRSYXcgICAgPSBmb3JtRGF0YS5nZXQoXCJmZWNoYUxpcXVpZGFjaW9uXCIpICAgYXMgc3RyaW5nIHwgbnVsbDtcbiAgY29uc3QgY29taXNpb25QY3QgICAgICAgPSB0b04oZm9ybURhdGEuZ2V0KFwiY29taXNpb25QY3RcIikpO1xuICBjb25zdCBjb21pc2lvbkZpamEgICAgICA9IHRvTihmb3JtRGF0YS5nZXQoXCJjb21pc2lvbkZpamFcIikpO1xuICBjb25zdCBkZXJlY2hvc01lcmNhZG8gICA9IHRvTihmb3JtRGF0YS5nZXQoXCJkZXJlY2hvc01lcmNhZG9cIikpO1xuICBjb25zdCBnYXN0b3MgICAgICAgICAgICA9IHRvTihmb3JtRGF0YS5nZXQoXCJnYXN0b3NcIikpO1xuICBjb25zdCBpbXB1ZXN0b3MgICAgICAgICA9IHRvTihmb3JtRGF0YS5nZXQoXCJpbXB1ZXN0b3NcIikpO1xuICBjb25zdCB0Y01lcERpYSAgICAgICAgICA9IHRvTihmb3JtRGF0YS5nZXQoXCJ0Y01lcERpYVwiKSk7XG4gIGNvbnN0IGNvbWlzaW9uVVNEICAgICAgID0gdG9OKGZvcm1EYXRhLmdldChcImNvbWlzaW9uVVNEXCIpKTtcbiAgY29uc3Qgc2VuZWJpQnJ1dG8gICAgICAgPSB0b04oZm9ybURhdGEuZ2V0KFwic2VuZWJpQnJ1dG9cIikpO1xuICBjb25zdCBkaWFzQ2F1Y2lvblJhdyAgICA9IGZvcm1EYXRhLmdldChcImRpYXNDYXVjaW9uXCIpIGFzIHN0cmluZyB8IG51bGw7XG4gIGNvbnN0IGRpYXNDYXVjaW9uICAgICAgID0gZGlhc0NhdWNpb25SYXcgPyBwYXJzZUludChkaWFzQ2F1Y2lvblJhdykgOiBudWxsO1xuICBjb25zdCB0YXNhQ2F1Y2lvbiAgICAgICA9IHRvTihmb3JtRGF0YS5nZXQoXCJ0YXNhQ2F1Y2lvblwiKSk7XG5cbiAgLy8gQ2FsY3VsYXRpb25zXG4gIGNvbnN0IGNhbnRpZGFkICAgID0gTnVtYmVyKG9wLmNhbnRpZGFkKTtcbiAgY29uc3QgcHJlY2lvICAgICAgPSBOdW1iZXIob3AucHJlY2lvKTtcbiAgY29uc3QgdmFsb3JCcnV0byAgPSBjYW50aWRhZCAqIHByZWNpbztcbiAgY29uc3QgY29zdG9SZWFsICAgPSAoY29taXNpb25GaWphID8/IDApXG4gICAgKyB2YWxvckJydXRvICogKChjb21pc2lvblBjdCA/PyAwKSAvIDEwMClcbiAgICArIChkZXJlY2hvc01lcmNhZG8gPz8gMClcbiAgICArIChnYXN0b3MgPz8gMClcbiAgICArIChpbXB1ZXN0b3MgPz8gMCk7XG4gIGNvbnN0IGVzVmVudGEgICAgICAgICA9IFZFTlRBX1RJUE9TLmhhcyhvcC50aXBvT3BlcmFjaW9uIGFzIHN0cmluZyk7XG4gIGNvbnN0IG5ldG9MaXF1aWRhZG8gICA9IGVzVmVudGEgPyB2YWxvckJydXRvIC0gY29zdG9SZWFsIDogdmFsb3JCcnV0byArIGNvc3RvUmVhbDtcbiAgY29uc3QgcHJlY2lvUHJvbWVkaW9SZWFsID0gIWVzVmVudGEgJiYgY2FudGlkYWQgPiAwID8gbmV0b0xpcXVpZGFkbyAvIGNhbnRpZGFkIDogbnVsbDtcblxuICB0cnkge1xuICAgIGNvbnN0IG5vdyA9IG5ldyBEYXRlKCk7XG4gICAgYXdhaXQgcHJpc21hLiR0cmFuc2FjdGlvbihhc3luYyAodHgpID0+IHtcbiAgICAgIGF3YWl0IHR4Lm9wZXJhY2lvbkJvbHNhLnVwZGF0ZSh7XG4gICAgICAgIHdoZXJlOiB7IGlkOiBvcGVyYWNpb25JZCB9LFxuICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgZXN0YWRvOiAgICAgICAgICAgXCJDT05DRVJUQURBXCIsXG4gICAgICAgICAgb3BlcmFkb3JDaWVycmVJZDogdXNlcklkLFxuICAgICAgICAgIG5yb0JvbGV0byxcbiAgICAgICAgICBhbHljLFxuICAgICAgICAgIGZlY2hhQ29uY2VydGFjaW9uOiAgZmVjaGFDb25jZXJ0UmF3ICA/IG5ldyBEYXRlKGZlY2hhQ29uY2VydFJhdykgIDogbnVsbCxcbiAgICAgICAgICBmZWNoYUxpcXVpZGFjaW9uOiAgIGZlY2hhTGlxdWlkUmF3ICAgPyBuZXcgRGF0ZShmZWNoYUxpcXVpZFJhdykgICA6IG51bGwsXG4gICAgICAgICAgY29taXNpb25QY3QsXG4gICAgICAgICAgY29taXNpb25GaWphLFxuICAgICAgICAgIGRlcmVjaG9zTWVyY2FkbyxcbiAgICAgICAgICBnYXN0b3MsXG4gICAgICAgICAgaW1wdWVzdG9zLFxuICAgICAgICAgIHRjTWVwRGlhLFxuICAgICAgICAgIGNvbWlzaW9uVVNELFxuICAgICAgICAgIHNlbmViaUJydXRvLFxuICAgICAgICAgIGRpYXNDYXVjaW9uOiAgICAgICAgaXNOYU4oZGlhc0NhdWNpb24gYXMgbnVtYmVyKSA/IG51bGwgOiBkaWFzQ2F1Y2lvbixcbiAgICAgICAgICB0YXNhQ2F1Y2lvbixcbiAgICAgICAgICBjb3N0b1JlYWwsXG4gICAgICAgICAgbmV0b0xpcXVpZGFkbyxcbiAgICAgICAgICBwcmVjaW9Qcm9tZWRpb1JlYWwsXG4gICAgICAgICAgdXBkYXRlZEF0OiAgICAgICAgICBub3csXG4gICAgICAgIH0sXG4gICAgICB9KTtcbiAgICAgIGF3YWl0IHR4Lm9wZXJhY2lvbkJvbHNhTG9nLmNyZWF0ZSh7XG4gICAgICAgIGRhdGE6IHtcbiAgICAgICAgICBpZDogICAgICAgICAgICBjcnlwdG8ucmFuZG9tVVVJRCgpLFxuICAgICAgICAgIG9wZXJhY2lvbklkLFxuICAgICAgICAgIHVzZXJJZCxcbiAgICAgICAgICBhY2Npb246ICAgICAgICBcIkNPTkNFUlRBQ0lPTlwiLFxuICAgICAgICAgIGVzdGFkb0FudGVyaW9yOiBvcC5lc3RhZG8sXG4gICAgICAgICAgZXN0YWRvTnVldm86ICAgXCJDT05DRVJUQURBXCIsXG4gICAgICAgICAgc25hcHNob3Q6ICAgICAgeyBucm9Cb2xldG8sIGFseWMsIGNvc3RvUmVhbCwgbmV0b0xpcXVpZGFkbywgcHJlY2lvUHJvbWVkaW9SZWFsIH0sXG4gICAgICAgIH0sXG4gICAgICB9KTtcbiAgICB9KTtcblxuICAgIHJldmFsaWRhdGVQYXRoKFwiL2JvbHNhXCIpO1xuICAgIHJldmFsaWRhdGVQYXRoKGAvYm9sc2EvJHtvcGVyYWNpb25JZH1gKTtcbiAgICByZXR1cm4geyBvazogdHJ1ZSBhcyBjb25zdCB9O1xuICB9IGNhdGNoIChlOiB1bmtub3duKSB7XG4gICAgcmV0dXJuIHsgZXJyb3I6IChlIGFzIEVycm9yKS5tZXNzYWdlIHx8IFwiRXJyb3IgYWwgY29uY2VydGFyIG9wZXJhY2nDs25cIiB9O1xuICB9XG59XG5cbi8vIOKUgOKUgCBDUkVBUiAoTWVzYSBEaWFyaWEpIOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgFxuXG5jb25zdCBDQVVDSU9OX1RJUE9TID0gbmV3IFNldDxzdHJpbmc+KFtcIkNBVUNJT05fQ09MT0NBRE9SQVwiLCBcIkNBVUNJT05fVE9NQURPUkFcIl0pO1xuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gY3JlYXJPcE1lc2FEaWFyaWEoX3ByZXZTdGF0ZTogdW5rbm93biwgZm9ybURhdGE6IEZvcm1EYXRhKSB7XG4gIGlmIChyZWFkT25seVByZXZpZXcpIHJldHVybiB7IGVycm9yOiBcIk1vZG8gbGVjdHVyYSBhY3Rpdm9cIiB9O1xuXG4gIGNvbnN0IHNlc3Npb24gPSBhd2FpdCBhdXRoKCk7XG4gIGNvbnN0IHVzZXJJZCAgPSBzZXNzaW9uPy51c2VyPy5pZCBhcyBzdHJpbmcgfCB1bmRlZmluZWQ7XG4gIGlmICghdXNlcklkKSByZXR1cm4geyBlcnJvcjogXCJTaW4gc2VzacOzbiBhY3RpdmFcIiB9O1xuXG4gIGNvbnN0IHN1amV0b1RpcG8gICAgPSBmb3JtRGF0YS5nZXQoXCJzdWpldG9UaXBvXCIpIGFzIHN0cmluZztcbiAgY29uc3QgY29taXRlbnRlSWQgICA9IChmb3JtRGF0YS5nZXQoXCJjb21pdGVudGVJZFwiKSBhcyBzdHJpbmcpIHx8IG51bGw7XG4gIGNvbnN0IGNhcnRlcmFJZCAgICAgPSAoZm9ybURhdGEuZ2V0KFwiY2FydGVyYUlkXCIpICAgYXMgc3RyaW5nKSB8fCBudWxsO1xuICBjb25zdCB0aXBvUmF3ICAgICAgID0gZm9ybURhdGEuZ2V0KFwidGlwb09wZXJhY2lvblwiKSBhcyBzdHJpbmc7XG4gIGNvbnN0IHRpY2tlclJhdyAgICAgPSAoKGZvcm1EYXRhLmdldChcInRpY2tlclwiKSBhcyBzdHJpbmcpIHx8IFwiXCIpLnRyaW0oKS50b1VwcGVyQ2FzZSgpO1xuICBjb25zdCBjYW50aWRhZFJhdyAgID0gZm9ybURhdGEuZ2V0KFwiY2FudGlkYWRcIikgIGFzIHN0cmluZztcbiAgY29uc3QgcHJlY2lvUmF3ICAgICA9IGZvcm1EYXRhLmdldChcInByZWNpb1wiKSAgICBhcyBzdHJpbmc7XG4gIGNvbnN0IG1vbmVkYSAgICAgICAgPSBmb3JtRGF0YS5nZXQoXCJtb25lZGFcIikgICAgYXMgc3RyaW5nO1xuICBjb25zdCBtZXJjYWRvICAgICAgID0gZm9ybURhdGEuZ2V0KFwibWVyY2Fkb1wiKSAgIGFzIHN0cmluZztcbiAgY29uc3QgZmVjaGFPcFJhdyAgICA9IGZvcm1EYXRhLmdldChcImZlY2hhT3BlcmF0aXZhXCIpIGFzIHN0cmluZztcbiAgY29uc3Qgb2JzZXJ2YWNpb25lcyA9ICgoZm9ybURhdGEuZ2V0KFwib2JzZXJ2YWNpb25lc1wiKSBhcyBzdHJpbmcpIHx8IFwiXCIpLnRyaW0oKSB8fCBudWxsO1xuXG4gIGNvbnN0IHJlc3VsdGFkb0JydXRvID0gdG9OKGZvcm1EYXRhLmdldChcInJlc3VsdGFkb0JydXRvXCIpKTtcbiAgY29uc3QgcmVzdWx0YWRvTmV0byAgPSB0b04oZm9ybURhdGEuZ2V0KFwicmVzdWx0YWRvTmV0b1wiKSk7XG4gIGNvbnN0IHRjTWVwRGlhICAgICAgID0gdG9OKGZvcm1EYXRhLmdldChcInRjTWVwRGlhXCIpKTtcbiAgY29uc3QgdGFzYUNhdWNpb24gICAgPSB0b04oZm9ybURhdGEuZ2V0KFwidGFzYUNhdWNpb25cIikpO1xuICBjb25zdCBkaWFzUmF3ICAgICAgICA9IGZvcm1EYXRhLmdldChcImRpYXNDYXVjaW9uXCIpIGFzIHN0cmluZyB8IG51bGw7XG4gIGNvbnN0IGRpYXNDYXVjaW9uICAgID0gZGlhc1JhdyA/IHBhcnNlSW50KGRpYXNSYXcpIDogbnVsbDtcblxuICBpZiAoIXRpcG9SYXcgfHwgIWNhbnRpZGFkUmF3IHx8ICFwcmVjaW9SYXcgfHwgIW1vbmVkYSB8fCAhbWVyY2FkbylcbiAgICByZXR1cm4geyBlcnJvcjogXCJGYWx0YW4gY2FtcG9zIG9ibGlnYXRvcmlvc1wiIH07XG4gIGlmIChzdWpldG9UaXBvID09PSBcImNvbWl0ZW50ZVwiICYmICFjb21pdGVudGVJZClcbiAgICByZXR1cm4geyBlcnJvcjogXCJTZWxlY2Npb25hciBjb21pdGVudGVcIiB9O1xuICBpZiAoc3VqZXRvVGlwbyA9PT0gXCJjYXJ0ZXJhXCIgJiYgIWNhcnRlcmFJZClcbiAgICByZXR1cm4geyBlcnJvcjogXCJTZWxlY2Npb25hciBjYXJ0ZXJhXCIgfTtcblxuICBjb25zdCB0aWNrZXIgPSB0aWNrZXJSYXcgfHwgKENBVUNJT05fVElQT1MuaGFzKHRpcG9SYXcpID8gXCJDQVVDSU9OXCIgOiBcIlwiKTtcbiAgaWYgKCF0aWNrZXIpIHJldHVybiB7IGVycm9yOiBcIlRpY2tlciByZXF1ZXJpZG8gcGFyYSBlc3RlIHRpcG8gZGUgb3BlcmFjacOzblwiIH07XG5cbiAgY29uc3QgY2FudGlkYWQgPSBwYXJzZUZsb2F0KGNhbnRpZGFkUmF3KTtcbiAgY29uc3QgcHJlY2lvICAgPSBwYXJzZUZsb2F0KHByZWNpb1Jhdyk7XG4gIGlmIChpc05hTihjYW50aWRhZCkgfHwgY2FudGlkYWQgPD0gMCkgcmV0dXJuIHsgZXJyb3I6IFwiQ2FudGlkYWQgaW52w6FsaWRhXCIgfTtcbiAgaWYgKGlzTmFOKHByZWNpbykgICB8fCBwcmVjaW8gICA8PSAwKSByZXR1cm4geyBlcnJvcjogXCJQcmVjaW8gaW52w6FsaWRvXCIgfTtcblxuICBjb25zdCBmZWNoYU9wZXJhdGl2YSA9IGZlY2hhT3BSYXcgPyBuZXcgRGF0ZShmZWNoYU9wUmF3ICsgXCJUMDA6MDA6MDAuMDAwWlwiKSA6IG51bGw7XG5cbiAgdHJ5IHtcbiAgICBjb25zdCBub3cgPSBuZXcgRGF0ZSgpO1xuICAgIGNvbnN0IGlkICA9IGNyeXB0by5yYW5kb21VVUlEKCk7XG5cbiAgICBhd2FpdCBwcmlzbWEuJHRyYW5zYWN0aW9uKGFzeW5jICh0eCkgPT4ge1xuICAgICAgYXdhaXQgdHgub3BlcmFjaW9uQm9sc2EuY3JlYXRlKHtcbiAgICAgICAgZGF0YToge1xuICAgICAgICAgIGlkLFxuICAgICAgICAgIGNvbWl0ZW50ZUlkOiAgICAgc3VqZXRvVGlwbyA9PT0gXCJjb21pdGVudGVcIiA/IGNvbWl0ZW50ZUlkIDogbnVsbCxcbiAgICAgICAgICBjYXJ0ZXJhSWQ6ICAgICAgIHN1amV0b1RpcG8gPT09IFwiY2FydGVyYVwiICAgPyBjYXJ0ZXJhSWQgICA6IG51bGwsXG4gICAgICAgICAgdGlwb09wZXJhY2lvbjogICB0aXBvUmF3IGFzIFRpcG9PcEJvbHNhLFxuICAgICAgICAgIHRpY2tlcixcbiAgICAgICAgICBjYW50aWRhZCxcbiAgICAgICAgICBwcmVjaW8sXG4gICAgICAgICAgbW9uZWRhOiAgICAgICAgICBtb25lZGEgIGFzIE1vbmVkYSxcbiAgICAgICAgICBtZXJjYWRvOiAgICAgICAgIG1lcmNhZG8gYXMgTWVyY2Fkb0JvbHNhLFxuICAgICAgICAgIG9ic2VydmFjaW9uZXMsXG4gICAgICAgICAgb3BlcmFkb3JDYXJnYUlkOiB1c2VySWQsXG4gICAgICAgICAgZXN0YWRvOiAgICAgICAgICBcIlBFTkRJRU5URV9DT05DRVJUQUNJT05cIixcbiAgICAgICAgICBmZWNoYU9wZXJhdGl2YSxcbiAgICAgICAgICByZXN1bHRhZG9CcnV0byxcbiAgICAgICAgICByZXN1bHRhZG9OZXRvLFxuICAgICAgICAgIHRjTWVwRGlhLFxuICAgICAgICAgIHRhc2FDYXVjaW9uLFxuICAgICAgICAgIGRpYXNDYXVjaW9uOiAgICAgZGlhc0NhdWNpb24gIT09IG51bGwgJiYgIWlzTmFOKGRpYXNDYXVjaW9uKSA/IGRpYXNDYXVjaW9uIDogbnVsbCxcbiAgICAgICAgICB1cGRhdGVkQXQ6ICAgICAgIG5vdyxcbiAgICAgICAgfSxcbiAgICAgIH0pO1xuICAgICAgYXdhaXQgdHgub3BlcmFjaW9uQm9sc2FMb2cuY3JlYXRlKHtcbiAgICAgICAgZGF0YToge1xuICAgICAgICAgIGlkOiAgICAgICAgICBjcnlwdG8ucmFuZG9tVVVJRCgpLFxuICAgICAgICAgIG9wZXJhY2lvbklkOiBpZCxcbiAgICAgICAgICB1c2VySWQsXG4gICAgICAgICAgYWNjaW9uOiAgICAgIFwiQ0FSR0FcIixcbiAgICAgICAgICBlc3RhZG9OdWV2bzogXCJQRU5ESUVOVEVfQ09OQ0VSVEFDSU9OXCIsXG4gICAgICAgICAgc25hcHNob3Q6ICAgIHsgdGlja2VyLCBjYW50aWRhZCwgcHJlY2lvLCBtb25lZGEsIG1lcmNhZG8sIHRpcG9PcGVyYWNpb246IHRpcG9SYXcsIHJlc3VsdGFkb0JydXRvLCByZXN1bHRhZG9OZXRvIH0sXG4gICAgICAgIH0sXG4gICAgICB9KTtcbiAgICB9KTtcblxuICAgIHJldmFsaWRhdGVQYXRoKFwiL2JvbHNhXCIpO1xuICAgIHJldHVybiB7IG9rOiB0cnVlIGFzIGNvbnN0LCBpZCB9O1xuICB9IGNhdGNoIChlOiB1bmtub3duKSB7XG4gICAgcmV0dXJuIHsgZXJyb3I6IChlIGFzIEVycm9yKS5tZXNzYWdlIHx8IFwiRXJyb3IgYWwgY3JlYXIgb3BlcmFjacOzblwiIH07XG4gIH1cbn1cblxuLy8g4pSA4pSAIEFHUlVQQVIgQVJCSVRSQUpFIOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgFxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gYWdydXBhck9wZXJhY2lvbmVzQXJiaXRyYWplKF9wcmV2U3RhdGU6IHVua25vd24sIGZvcm1EYXRhOiBGb3JtRGF0YSkge1xuICBpZiAocmVhZE9ubHlQcmV2aWV3KSByZXR1cm4geyBlcnJvcjogXCJNb2RvIGxlY3R1cmEgYWN0aXZvXCIgfTtcblxuICBjb25zdCBzZXNzaW9uID0gYXdhaXQgYXV0aCgpO1xuICBjb25zdCB1c2VySWQgID0gc2Vzc2lvbj8udXNlcj8uaWQgYXMgc3RyaW5nIHwgdW5kZWZpbmVkO1xuICBpZiAoIXVzZXJJZCkgcmV0dXJuIHsgZXJyb3I6IFwiU2luIHNlc2nDs24gYWN0aXZhXCIgfTtcblxuICBjb25zdCBpZHNSYXcgPSAoZm9ybURhdGEuZ2V0KFwib3BlcmF0aW9uSWRzXCIpIGFzIHN0cmluZykgfHwgXCJcIjtcbiAgY29uc3QgaWRzICAgID0gaWRzUmF3LnNwbGl0KFwiLFwiKS5tYXAoKHMpID0+IHMudHJpbSgpKS5maWx0ZXIoQm9vbGVhbik7XG5cbiAgaWYgKGlkcy5sZW5ndGggPCAyKSByZXR1cm4geyBlcnJvcjogXCJTZWxlY2Npb25hciBhbCBtZW5vcyAyIG9wZXJhY2lvbmVzXCIgfTtcblxuICBjb25zdCBvcHMgPSBhd2FpdCBwcmlzbWEub3BlcmFjaW9uQm9sc2EuZmluZE1hbnkoe1xuICAgIHdoZXJlOiAgeyBpZDogeyBpbjogaWRzIH0gfSxcbiAgICBzZWxlY3Q6IHsgaWQ6IHRydWUsIGFudWxhZGE6IHRydWUsIGVzdGFkbzogdHJ1ZSB9LFxuICB9KTtcblxuICBpZiAob3BzLmxlbmd0aCAhPT0gaWRzLmxlbmd0aCkgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB7IGVycm9yOiBcIlVuYSBvIG3DoXMgb3BlcmFjaW9uZXMgbm8gZW5jb250cmFkYXNcIiB9O1xuICBpZiAob3BzLnNvbWUoKG8pID0+IG8uYW51bGFkYSkpICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB7IGVycm9yOiBcIk5vIHNlIHB1ZWRlbiBhZ3J1cGFyIG9wZXJhY2lvbmVzIGFudWxhZGFzXCIgfTtcbiAgaWYgKG9wcy5zb21lKChvKSA9PiBvLmVzdGFkbyAhPT0gXCJQRU5ESUVOVEVfQ09OQ0VSVEFDSU9OXCIpKSAgICAgIHJldHVybiB7IGVycm9yOiBcIlNvbG8gc2UgcHVlZGVuIGFncnVwYXIgb3BlcmFjaW9uZXMgcGVuZGllbnRlcyBkZSByZXZpc2nDs25cIiB9O1xuXG4gIGNvbnN0IGdydXBvSWQgPSBjcnlwdG8ucmFuZG9tVVVJRCgpLnNsaWNlKDAsIDgpLnRvVXBwZXJDYXNlKCk7XG5cbiAgYXdhaXQgcHJpc21hLm9wZXJhY2lvbkJvbHNhLnVwZGF0ZU1hbnkoe1xuICAgIHdoZXJlOiB7IGlkOiB7IGluOiBpZHMgfSB9LFxuICAgIGRhdGE6ICB7IGdydXBvQXJiaXRyYWplSWQ6IGdydXBvSWQsIHVwZGF0ZWRBdDogbmV3IERhdGUoKSB9LFxuICB9KTtcblxuICByZXZhbGlkYXRlUGF0aChcIi9ib2xzYVwiKTtcbiAgcmV0dXJuIHsgb2s6IHRydWUgYXMgY29uc3QsIGdydXBvSWQgfTtcbn1cblxuLy8g4pSA4pSAIEFOVUxBUiDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIBcblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGFudWxhck9wZXJhY2lvbihwcmV2U3RhdGU6IHVua25vd24sIGZvcm1EYXRhOiBGb3JtRGF0YSkge1xuICBpZiAocmVhZE9ubHlQcmV2aWV3KSByZXR1cm4geyBlcnJvcjogXCJNb2RvIGxlY3R1cmEgYWN0aXZvXCIgfTtcblxuICBjb25zdCBzZXNzaW9uID0gYXdhaXQgYXV0aCgpO1xuICBjb25zdCB1c2VySWQgID0gc2Vzc2lvbj8udXNlcj8uaWQgYXMgc3RyaW5nIHwgdW5kZWZpbmVkO1xuICBpZiAoIXVzZXJJZCkgcmV0dXJuIHsgZXJyb3I6IFwiU2luIHNlc2nDs24gYWN0aXZhXCIgfTtcblxuICBjb25zdCBvcGVyYWNpb25JZCAgICAgID0gZm9ybURhdGEuZ2V0KFwib3BlcmFjaW9uSWRcIikgICAgICBhcyBzdHJpbmc7XG4gIGNvbnN0IG1vdGl2b0FudWxhY2lvbiAgPSAoZm9ybURhdGEuZ2V0KFwibW90aXZvQW51bGFjaW9uXCIpIGFzIHN0cmluZyk/LnRyaW0oKTtcblxuICBpZiAoIW9wZXJhY2lvbklkKSAgICAgcmV0dXJuIHsgZXJyb3I6IFwiSUQgb3BlcmFjacOzbiByZXF1ZXJpZG9cIiB9O1xuICBpZiAoIW1vdGl2b0FudWxhY2lvbikgcmV0dXJuIHsgZXJyb3I6IFwiRWwgbW90aXZvIGRlIGFudWxhY2nDs24gZXMgb2JsaWdhdG9yaW9cIiB9O1xuXG4gIGNvbnN0IG9wID0gYXdhaXQgcHJpc21hLm9wZXJhY2lvbkJvbHNhLmZpbmRVbmlxdWUoeyB3aGVyZTogeyBpZDogb3BlcmFjaW9uSWQgfSB9KTtcbiAgaWYgKCFvcCkgICAgICAgIHJldHVybiB7IGVycm9yOiBcIk9wZXJhY2nDs24gbm8gZW5jb250cmFkYVwiIH07XG4gIGlmIChvcC5hbnVsYWRhKSByZXR1cm4geyBlcnJvcjogXCJPcGVyYWNpw7NuIHlhIGFudWxhZGFcIiB9O1xuXG4gIHRyeSB7XG4gICAgY29uc3Qgbm93ID0gbmV3IERhdGUoKTtcbiAgICBhd2FpdCBwcmlzbWEuJHRyYW5zYWN0aW9uKGFzeW5jICh0eCkgPT4ge1xuICAgICAgYXdhaXQgdHgub3BlcmFjaW9uQm9sc2EudXBkYXRlKHtcbiAgICAgICAgd2hlcmU6IHsgaWQ6IG9wZXJhY2lvbklkIH0sXG4gICAgICAgIGRhdGE6IHsgZXN0YWRvOiBcIkFOVUxBREFcIiwgYW51bGFkYTogdHJ1ZSwgbW90aXZvQW51bGFjaW9uLCB1cGRhdGVkQXQ6IG5vdyB9LFxuICAgICAgfSk7XG4gICAgICBhd2FpdCB0eC5vcGVyYWNpb25Cb2xzYUxvZy5jcmVhdGUoe1xuICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgaWQ6ICAgICAgICAgICAgY3J5cHRvLnJhbmRvbVVVSUQoKSxcbiAgICAgICAgICBvcGVyYWNpb25JZCxcbiAgICAgICAgICB1c2VySWQsXG4gICAgICAgICAgYWNjaW9uOiAgICAgICAgXCJBTlVMQUNJT05cIixcbiAgICAgICAgICBlc3RhZG9BbnRlcmlvcjogb3AuZXN0YWRvLFxuICAgICAgICAgIGVzdGFkb051ZXZvOiAgIFwiQU5VTEFEQVwiLFxuICAgICAgICAgIHNuYXBzaG90OiAgICAgIHsgbW90aXZvQW51bGFjaW9uIH0sXG4gICAgICAgIH0sXG4gICAgICB9KTtcbiAgICB9KTtcblxuICAgIHJldmFsaWRhdGVQYXRoKFwiL2JvbHNhXCIpO1xuICAgIHJldmFsaWRhdGVQYXRoKGAvYm9sc2EvJHtvcGVyYWNpb25JZH1gKTtcbiAgICByZXR1cm4geyBvazogdHJ1ZSBhcyBjb25zdCB9O1xuICB9IGNhdGNoIChlOiB1bmtub3duKSB7XG4gICAgcmV0dXJuIHsgZXJyb3I6IChlIGFzIEVycm9yKS5tZXNzYWdlIHx8IFwiRXJyb3IgYWwgYW51bGFyIG9wZXJhY2nDs25cIiB9O1xuICB9XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IitTQTRMc0IifQ==
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/src/components/modules/bolsa/MesaDiariaForm.tsx [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname, k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
__turbopack_context__.s({
    "MesaDiariaForm": (()=>MesaDiariaForm)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f28$dashboard$292f$bolsa$2f$data$3a$c0cfd2__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$text$2f$javascript$3e$__ = __turbopack_context__.i("[project]/src/app/(dashboard)/bolsa/data:c0cfd2 [app-client] (ecmascript) <text/javascript>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$down$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronDown$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/chevron-down.js [app-client] (ecmascript) <export default as ChevronDown>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$up$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronUp$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/chevron-up.js [app-client] (ecmascript) <export default as ChevronUp>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$plus$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__PlusCircle$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/circle-plus.js [app-client] (ecmascript) <export default as PlusCircle>");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
;
const TIPO_OPTS = [
    {
        v: "COMPRA_BONO",
        l: "Compra Bono"
    },
    {
        v: "VENTA_BONO",
        l: "Venta Bono"
    },
    {
        v: "COMPRA_ACCION",
        l: "Compra Acción"
    },
    {
        v: "VENTA_ACCION",
        l: "Venta Acción"
    },
    {
        v: "COMPRA_CEDEAR",
        l: "Compra CEDEAR"
    },
    {
        v: "VENTA_CEDEAR",
        l: "Venta CEDEAR"
    },
    {
        v: "CAUCION_COLOCADORA",
        l: "Caución Coloc."
    },
    {
        v: "CAUCION_TOMADORA",
        l: "Caución Tomad."
    },
    {
        v: "FUTURO",
        l: "Futuro"
    },
    {
        v: "OPCION_CALL",
        l: "Opción Call"
    },
    {
        v: "OPCION_PUT",
        l: "Opción Put"
    }
];
const CAUCION_TIPOS = new Set([
    "CAUCION_COLOCADORA",
    "CAUCION_TOMADORA"
]);
const inputCls = "w-full px-3 py-2 text-[12px] bg-byg-bg border border-byg-border rounded-lg text-byg-text placeholder:text-byg-muted/50 focus:outline-none focus:ring-1 focus:ring-byg-accent/40";
const labelCls = "text-[10px] font-bold uppercase tracking-widest text-byg-muted mb-1 block";
function MesaDiariaForm({ comitentes, carteras, defaultFecha }) {
    _s();
    const [state, action, pending] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useActionState"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f28$dashboard$292f$bolsa$2f$data$3a$c0cfd2__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$text$2f$javascript$3e$__["crearOpMesaDiaria"], null);
    const [formKey, setFormKey] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(0);
    const [sujetoTipo, setSujetoTipo] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("cartera");
    const [tipo, setTipo] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("COMPRA_BONO");
    const [expanded, setExpanded] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(true);
    const [comitenteSearch, setComitenteSearch] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("");
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "MesaDiariaForm.useEffect": ()=>{
            if (state && "ok" in state && state.ok) {
                setFormKey({
                    "MesaDiariaForm.useEffect": (k)=>k + 1
                }["MesaDiariaForm.useEffect"]);
            }
        }
    }["MesaDiariaForm.useEffect"], [
        state
    ]);
    const isCaucion = CAUCION_TIPOS.has(tipo);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "bg-byg-surface rounded-2xl border border-byg-border overflow-hidden",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                type: "button",
                onClick: ()=>setExpanded((v)=>!v),
                className: "w-full px-5 py-3 border-b border-byg-border bg-byg-bg flex items-center justify-between hover:bg-byg-surface-2 transition-colors",
                "aria-expanded": expanded,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex items-center gap-2",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$plus$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__PlusCircle$3e$__["PlusCircle"], {
                                size: 14,
                                className: "text-byg-accent"
                            }, void 0, false, {
                                fileName: "[project]/src/components/modules/bolsa/MesaDiariaForm.tsx",
                                lineNumber: 61,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "text-[11px] font-black uppercase tracking-widest text-byg-text",
                                children: "Cargar operación"
                            }, void 0, false, {
                                fileName: "[project]/src/components/modules/bolsa/MesaDiariaForm.tsx",
                                lineNumber: 62,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/modules/bolsa/MesaDiariaForm.tsx",
                        lineNumber: 60,
                        columnNumber: 9
                    }, this),
                    expanded ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$up$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronUp$3e$__["ChevronUp"], {
                        size: 14,
                        className: "text-byg-muted"
                    }, void 0, false, {
                        fileName: "[project]/src/components/modules/bolsa/MesaDiariaForm.tsx",
                        lineNumber: 66,
                        columnNumber: 21
                    }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$down$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronDown$3e$__["ChevronDown"], {
                        size: 14,
                        className: "text-byg-muted"
                    }, void 0, false, {
                        fileName: "[project]/src/components/modules/bolsa/MesaDiariaForm.tsx",
                        lineNumber: 66,
                        columnNumber: 74
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/modules/bolsa/MesaDiariaForm.tsx",
                lineNumber: 54,
                columnNumber: 7
            }, this),
            expanded && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("form", {
                action: action,
                className: "p-5 flex flex-col gap-4",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex items-center gap-3",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: labelCls + " mb-0 whitespace-nowrap",
                                children: "Tipo cuenta"
                            }, void 0, false, {
                                fileName: "[project]/src/components/modules/bolsa/MesaDiariaForm.tsx",
                                lineNumber: 73,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex rounded-lg overflow-hidden border border-byg-border text-[11px] font-black uppercase tracking-widest",
                                children: [
                                    "cartera",
                                    "comitente"
                                ].map((t)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        type: "button",
                                        onClick: ()=>{
                                            setSujetoTipo(t);
                                            setComitenteSearch("");
                                        },
                                        className: `px-3 py-1.5 transition-colors ${sujetoTipo === t ? "bg-byg-accent text-white" : "bg-byg-bg text-byg-muted hover:bg-byg-surface-2"}`,
                                        children: t === "cartera" ? "Propias" : "Clientes"
                                    }, t, false, {
                                        fileName: "[project]/src/components/modules/bolsa/MesaDiariaForm.tsx",
                                        lineNumber: 76,
                                        columnNumber: 17
                                    }, this))
                            }, void 0, false, {
                                fileName: "[project]/src/components/modules/bolsa/MesaDiariaForm.tsx",
                                lineNumber: 74,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/modules/bolsa/MesaDiariaForm.tsx",
                        lineNumber: 72,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                        type: "hidden",
                        name: "sujetoTipo",
                        value: sujetoTipo
                    }, void 0, false, {
                        fileName: "[project]/src/components/modules/bolsa/MesaDiariaForm.tsx",
                        lineNumber: 92,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "grid grid-cols-1 sm:grid-cols-3 gap-3",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                        className: labelCls,
                                        children: sujetoTipo === "cartera" ? "Cartera" : "Comitente"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/modules/bolsa/MesaDiariaForm.tsx",
                                        lineNumber: 97,
                                        columnNumber: 15
                                    }, this),
                                    sujetoTipo === "cartera" ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                        name: "carteraId",
                                        className: inputCls,
                                        required: true,
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                value: "",
                                                children: "Seleccionar…"
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/modules/bolsa/MesaDiariaForm.tsx",
                                                lineNumber: 102,
                                                columnNumber: 19
                                            }, this),
                                            carteras.map((c)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                    value: c.id,
                                                    children: c.nombre
                                                }, c.id, false, {
                                                    fileName: "[project]/src/components/modules/bolsa/MesaDiariaForm.tsx",
                                                    lineNumber: 104,
                                                    columnNumber: 21
                                                }, this))
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/components/modules/bolsa/MesaDiariaForm.tsx",
                                        lineNumber: 101,
                                        columnNumber: 17
                                    }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                type: "text",
                                                placeholder: "Buscar por nombre o N° comitente…",
                                                value: comitenteSearch,
                                                onChange: (e)=>setComitenteSearch(e.target.value),
                                                className: inputCls + " mb-1"
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/modules/bolsa/MesaDiariaForm.tsx",
                                                lineNumber: 109,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                                name: "comitenteId",
                                                className: inputCls,
                                                required: true,
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                        value: "",
                                                        children: "Seleccionar…"
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/components/modules/bolsa/MesaDiariaForm.tsx",
                                                        lineNumber: 117,
                                                        columnNumber: 21
                                                    }, this),
                                                    comitentes.filter((c)=>{
                                                        const q = comitenteSearch.toLowerCase();
                                                        return c.nombre.toLowerCase().includes(q) || c.nroComitente.includes(comitenteSearch);
                                                    }).map((c)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                            value: c.id,
                                                            children: [
                                                                c.nombre,
                                                                " (",
                                                                c.nroComitente,
                                                                ")"
                                                            ]
                                                        }, c.id, true, {
                                                            fileName: "[project]/src/components/modules/bolsa/MesaDiariaForm.tsx",
                                                            lineNumber: 127,
                                                            columnNumber: 25
                                                        }, this))
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/src/components/modules/bolsa/MesaDiariaForm.tsx",
                                                lineNumber: 116,
                                                columnNumber: 19
                                            }, this)
                                        ]
                                    }, void 0, true)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/modules/bolsa/MesaDiariaForm.tsx",
                                lineNumber: 96,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                        className: labelCls,
                                        children: "Tipo operación"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/modules/bolsa/MesaDiariaForm.tsx",
                                        lineNumber: 137,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                        name: "tipoOperacion",
                                        value: tipo,
                                        onChange: (e)=>setTipo(e.target.value),
                                        className: inputCls,
                                        required: true,
                                        children: TIPO_OPTS.map((o)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                value: o.v,
                                                children: o.l
                                            }, o.v, false, {
                                                fileName: "[project]/src/components/modules/bolsa/MesaDiariaForm.tsx",
                                                lineNumber: 146,
                                                columnNumber: 19
                                            }, this))
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/modules/bolsa/MesaDiariaForm.tsx",
                                        lineNumber: 138,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/modules/bolsa/MesaDiariaForm.tsx",
                                lineNumber: 136,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                        className: labelCls,
                                        children: "Fecha operativa"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/modules/bolsa/MesaDiariaForm.tsx",
                                        lineNumber: 152,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                        type: "date",
                                        name: "fechaOperativa",
                                        defaultValue: defaultFecha,
                                        className: inputCls
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/modules/bolsa/MesaDiariaForm.tsx",
                                        lineNumber: 153,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/modules/bolsa/MesaDiariaForm.tsx",
                                lineNumber: 151,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/modules/bolsa/MesaDiariaForm.tsx",
                        lineNumber: 95,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "grid grid-cols-2 sm:grid-cols-5 gap-3",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                        className: labelCls,
                                        children: [
                                            "Ticker",
                                            isCaucion ? " (opcional)" : ""
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/components/modules/bolsa/MesaDiariaForm.tsx",
                                        lineNumber: 165,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                        type: "text",
                                        name: "ticker",
                                        placeholder: isCaucion ? "CAUCION" : "Ej: AL30",
                                        className: inputCls + " uppercase",
                                        required: !isCaucion
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/modules/bolsa/MesaDiariaForm.tsx",
                                        lineNumber: 168,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/modules/bolsa/MesaDiariaForm.tsx",
                                lineNumber: 164,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                        className: labelCls,
                                        children: "Cantidad"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/modules/bolsa/MesaDiariaForm.tsx",
                                        lineNumber: 178,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                        type: "number",
                                        name: "cantidad",
                                        placeholder: "0",
                                        min: "0.000001",
                                        step: "any",
                                        className: inputCls,
                                        required: true
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/modules/bolsa/MesaDiariaForm.tsx",
                                        lineNumber: 179,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/modules/bolsa/MesaDiariaForm.tsx",
                                lineNumber: 177,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                        className: labelCls,
                                        children: "Precio"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/modules/bolsa/MesaDiariaForm.tsx",
                                        lineNumber: 191,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                        type: "number",
                                        name: "precio",
                                        placeholder: "0.00",
                                        min: "0.000001",
                                        step: "any",
                                        className: inputCls,
                                        required: true
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/modules/bolsa/MesaDiariaForm.tsx",
                                        lineNumber: 192,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/modules/bolsa/MesaDiariaForm.tsx",
                                lineNumber: 190,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                        className: labelCls,
                                        children: "Moneda"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/modules/bolsa/MesaDiariaForm.tsx",
                                        lineNumber: 204,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                        name: "moneda",
                                        className: inputCls,
                                        defaultValue: "ARS",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                value: "ARS",
                                                children: "ARS"
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/modules/bolsa/MesaDiariaForm.tsx",
                                                lineNumber: 206,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                value: "USD",
                                                children: "USD"
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/modules/bolsa/MesaDiariaForm.tsx",
                                                lineNumber: 207,
                                                columnNumber: 17
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/components/modules/bolsa/MesaDiariaForm.tsx",
                                        lineNumber: 205,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/modules/bolsa/MesaDiariaForm.tsx",
                                lineNumber: 203,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                type: "hidden",
                                name: "mercado",
                                value: "BYMA"
                            }, void 0, false, {
                                fileName: "[project]/src/components/modules/bolsa/MesaDiariaForm.tsx",
                                lineNumber: 211,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/modules/bolsa/MesaDiariaForm.tsx",
                        lineNumber: 163,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "grid grid-cols-2 sm:grid-cols-4 gap-3",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                        className: labelCls,
                                        children: "Resultado bruto"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/modules/bolsa/MesaDiariaForm.tsx",
                                        lineNumber: 217,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                        type: "number",
                                        name: "resultadoBruto",
                                        placeholder: "—",
                                        step: "any",
                                        className: inputCls
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/modules/bolsa/MesaDiariaForm.tsx",
                                        lineNumber: 218,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/modules/bolsa/MesaDiariaForm.tsx",
                                lineNumber: 216,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                        className: labelCls,
                                        children: "Resultado neto"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/modules/bolsa/MesaDiariaForm.tsx",
                                        lineNumber: 228,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                        type: "number",
                                        name: "resultadoNeto",
                                        placeholder: "—",
                                        step: "any",
                                        className: inputCls
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/modules/bolsa/MesaDiariaForm.tsx",
                                        lineNumber: 229,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/modules/bolsa/MesaDiariaForm.tsx",
                                lineNumber: 227,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                        className: labelCls,
                                        children: "TC MEP día"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/modules/bolsa/MesaDiariaForm.tsx",
                                        lineNumber: 239,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                        type: "number",
                                        name: "tcMepDia",
                                        placeholder: "—",
                                        step: "any",
                                        className: inputCls
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/modules/bolsa/MesaDiariaForm.tsx",
                                        lineNumber: 240,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/modules/bolsa/MesaDiariaForm.tsx",
                                lineNumber: 238,
                                columnNumber: 13
                            }, this),
                            isCaucion ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                className: labelCls,
                                                children: "Tasa caución %"
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/modules/bolsa/MesaDiariaForm.tsx",
                                                lineNumber: 252,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                type: "number",
                                                name: "tasaCaucion",
                                                placeholder: "—",
                                                step: "any",
                                                className: inputCls
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/modules/bolsa/MesaDiariaForm.tsx",
                                                lineNumber: 253,
                                                columnNumber: 19
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/components/modules/bolsa/MesaDiariaForm.tsx",
                                        lineNumber: 251,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                className: labelCls,
                                                children: "Días caución"
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/modules/bolsa/MesaDiariaForm.tsx",
                                                lineNumber: 262,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                type: "number",
                                                name: "diasCaucion",
                                                placeholder: "—",
                                                min: "1",
                                                step: "1",
                                                className: inputCls
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/modules/bolsa/MesaDiariaForm.tsx",
                                                lineNumber: 263,
                                                columnNumber: 19
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/components/modules/bolsa/MesaDiariaForm.tsx",
                                        lineNumber: 261,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, void 0, true) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                        className: labelCls,
                                        children: "Observaciones"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/modules/bolsa/MesaDiariaForm.tsx",
                                        lineNumber: 275,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                        type: "text",
                                        name: "observaciones",
                                        placeholder: "—",
                                        className: inputCls
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/modules/bolsa/MesaDiariaForm.tsx",
                                        lineNumber: 276,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/modules/bolsa/MesaDiariaForm.tsx",
                                lineNumber: 274,
                                columnNumber: 15
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/modules/bolsa/MesaDiariaForm.tsx",
                        lineNumber: 215,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex items-center gap-3 pt-1",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                type: "submit",
                                disabled: pending,
                                className: "inline-flex items-center gap-1.5 text-[11px] font-black px-5 py-2.5 rounded-xl bg-byg-accent text-white hover:bg-blue-500 disabled:opacity-50 transition-colors uppercase tracking-widest shadow-sm shadow-blue-600/20",
                                children: pending ? "Guardando…" : "Guardar operación"
                            }, void 0, false, {
                                fileName: "[project]/src/components/modules/bolsa/MesaDiariaForm.tsx",
                                lineNumber: 288,
                                columnNumber: 13
                            }, this),
                            state && "ok" in state && state.ok && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "text-[11px] font-semibold text-emerald-400",
                                children: "Operación guardada"
                            }, void 0, false, {
                                fileName: "[project]/src/components/modules/bolsa/MesaDiariaForm.tsx",
                                lineNumber: 297,
                                columnNumber: 15
                            }, this),
                            state && "error" in state && state.error && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "text-[11px] font-semibold text-red-400",
                                children: state.error
                            }, void 0, false, {
                                fileName: "[project]/src/components/modules/bolsa/MesaDiariaForm.tsx",
                                lineNumber: 302,
                                columnNumber: 15
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/modules/bolsa/MesaDiariaForm.tsx",
                        lineNumber: 287,
                        columnNumber: 11
                    }, this)
                ]
            }, formKey, true, {
                fileName: "[project]/src/components/modules/bolsa/MesaDiariaForm.tsx",
                lineNumber: 70,
                columnNumber: 9
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/modules/bolsa/MesaDiariaForm.tsx",
        lineNumber: 53,
        columnNumber: 5
    }, this);
}
_s(MesaDiariaForm, "UdCYD3c34xuVgDfOJaNKJ6AQrzY=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useActionState"]
    ];
});
_c = MesaDiariaForm;
var _c;
__turbopack_context__.k.register(_c, "MesaDiariaForm");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/src/app/(dashboard)/bolsa/data:2915f1 [app-client] (ecmascript) <text/javascript>": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname, k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
/* __next_internal_action_entry_do_not_use__ [{"606cfa9090426e36c2b3b1981fe0f1dea0988a1482":"agruparOperacionesArbitraje"},"src/app/(dashboard)/bolsa/actions.ts",""] */ __turbopack_context__.s({
    "agruparOperacionesArbitraje": (()=>agruparOperacionesArbitraje)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$client$2d$wrapper$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/build/webpack/loaders/next-flight-loader/action-client-wrapper.js [app-client] (ecmascript)");
"use turbopack no side effects";
;
var agruparOperacionesArbitraje = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$client$2d$wrapper$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createServerReference"])("606cfa9090426e36c2b3b1981fe0f1dea0988a1482", __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$client$2d$wrapper$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["callServer"], void 0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$client$2d$wrapper$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["findSourceMapURL"], "agruparOperacionesArbitraje"); //# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4vYWN0aW9ucy50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJcInVzZSBzZXJ2ZXJcIjtcblxuaW1wb3J0IHsgYXV0aCB9IGZyb20gXCJAL2F1dGhcIjtcbmltcG9ydCB7IHByaXNtYSB9IGZyb20gXCJAL2xpYi9wcmlzbWFcIjtcbmltcG9ydCB7IHJldmFsaWRhdGVQYXRoIH0gZnJvbSBcIm5leHQvY2FjaGVcIjtcbmltcG9ydCB7IHJlYWRPbmx5UHJldmlldyB9IGZyb20gXCJAL2xpYi9jb25maWdcIjtcbmltcG9ydCB0eXBlIHsgVGlwb09wQm9sc2EsIE1lcmNhZG9Cb2xzYSwgTW9uZWRhIH0gZnJvbSBcIkBwcmlzbWEvY2xpZW50XCI7XG5cbmNvbnN0IFZFTlRBX1RJUE9TID0gbmV3IFNldDxzdHJpbmc+KFtcIlZFTlRBX0JPTk9cIiwgXCJWRU5UQV9BQ0NJT05cIiwgXCJWRU5UQV9DRURFQVJcIiwgXCJDQVVDSU9OX0NPTE9DQURPUkFcIl0pO1xuXG5mdW5jdGlvbiB0b04odjogRm9ybURhdGFFbnRyeVZhbHVlIHwgbnVsbCk6IG51bWJlciB8IG51bGwge1xuICBpZiAoIXYpIHJldHVybiBudWxsO1xuICBjb25zdCBuID0gcGFyc2VGbG9hdCh2IGFzIHN0cmluZyk7XG4gIHJldHVybiBpc05hTihuKSA/IG51bGwgOiBuO1xufVxuXG4vLyDilIDilIAgQ1JFQVIg4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSAXG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBjcmVhck9wZXJhY2lvbkJvbHNhKHByZXZTdGF0ZTogdW5rbm93biwgZm9ybURhdGE6IEZvcm1EYXRhKSB7XG4gIGlmIChyZWFkT25seVByZXZpZXcpIHJldHVybiB7IGVycm9yOiBcIk1vZG8gbGVjdHVyYSBhY3Rpdm9cIiB9O1xuXG4gIGNvbnN0IHNlc3Npb24gPSBhd2FpdCBhdXRoKCk7XG4gIGNvbnN0IHVzZXJJZCA9IHNlc3Npb24/LnVzZXI/LmlkIGFzIHN0cmluZyB8IHVuZGVmaW5lZDtcbiAgaWYgKCF1c2VySWQpIHJldHVybiB7IGVycm9yOiBcIlNpbiBzZXNpw7NuIGFjdGl2YVwiIH07XG5cbiAgY29uc3Qgc3VqZXRvVGlwbyAgICA9IGZvcm1EYXRhLmdldChcInN1amV0b1RpcG9cIikgYXMgc3RyaW5nO1xuICBjb25zdCBjb21pdGVudGVJZCAgID0gKGZvcm1EYXRhLmdldChcImNvbWl0ZW50ZUlkXCIpIGFzIHN0cmluZykgfHwgbnVsbDtcbiAgY29uc3QgY2FydGVyYUlkICAgICA9IChmb3JtRGF0YS5nZXQoXCJjYXJ0ZXJhSWRcIikgYXMgc3RyaW5nKSB8fCBudWxsO1xuICBjb25zdCB0aXBvUmF3ICAgICAgID0gZm9ybURhdGEuZ2V0KFwidGlwb09wZXJhY2lvblwiKSBhcyBzdHJpbmc7XG4gIGNvbnN0IHRpY2tlciAgICAgICAgPSAoZm9ybURhdGEuZ2V0KFwidGlja2VyXCIpIGFzIHN0cmluZyk/LnRyaW0oKS50b1VwcGVyQ2FzZSgpO1xuICBjb25zdCBjYW50aWRhZFJhdyAgID0gZm9ybURhdGEuZ2V0KFwiY2FudGlkYWRcIikgYXMgc3RyaW5nO1xuICBjb25zdCBwcmVjaW9SYXcgICAgID0gZm9ybURhdGEuZ2V0KFwicHJlY2lvXCIpIGFzIHN0cmluZztcbiAgY29uc3QgbW9uZWRhICAgICAgICA9IGZvcm1EYXRhLmdldChcIm1vbmVkYVwiKSBhcyBzdHJpbmc7XG4gIGNvbnN0IG1lcmNhZG8gICAgICAgPSBmb3JtRGF0YS5nZXQoXCJtZXJjYWRvXCIpIGFzIHN0cmluZztcbiAgY29uc3Qgb2JzZXJ2YWNpb25lcyA9IChmb3JtRGF0YS5nZXQoXCJvYnNlcnZhY2lvbmVzXCIpIGFzIHN0cmluZyk/LnRyaW0oKSB8fCBudWxsO1xuXG4gIGlmICghdGlwb1JhdyB8fCAhdGlja2VyIHx8ICFjYW50aWRhZFJhdyB8fCAhcHJlY2lvUmF3IHx8ICFtb25lZGEgfHwgIW1lcmNhZG8pXG4gICAgcmV0dXJuIHsgZXJyb3I6IFwiRmFsdGFuIGNhbXBvcyBvYmxpZ2F0b3Jpb3NcIiB9O1xuICBpZiAoc3VqZXRvVGlwbyA9PT0gXCJjb21pdGVudGVcIiAmJiAhY29taXRlbnRlSWQpXG4gICAgcmV0dXJuIHsgZXJyb3I6IFwiU2VsZWNjaW9uYXIgY29taXRlbnRlXCIgfTtcbiAgaWYgKHN1amV0b1RpcG8gPT09IFwiY2FydGVyYVwiICYmICFjYXJ0ZXJhSWQpXG4gICAgcmV0dXJuIHsgZXJyb3I6IFwiU2VsZWNjaW9uYXIgY2FydGVyYVwiIH07XG5cbiAgY29uc3QgY2FudGlkYWQgPSBwYXJzZUZsb2F0KGNhbnRpZGFkUmF3KTtcbiAgY29uc3QgcHJlY2lvICAgPSBwYXJzZUZsb2F0KHByZWNpb1Jhdyk7XG4gIGlmIChpc05hTihjYW50aWRhZCkgfHwgY2FudGlkYWQgPD0gMCkgcmV0dXJuIHsgZXJyb3I6IFwiQ2FudGlkYWQgaW52w6FsaWRhXCIgfTtcbiAgaWYgKGlzTmFOKHByZWNpbykgICB8fCBwcmVjaW8gICA8PSAwKSByZXR1cm4geyBlcnJvcjogXCJQcmVjaW8gaW52w6FsaWRvXCIgfTtcblxuICB0cnkge1xuICAgIGNvbnN0IG5vdyA9IG5ldyBEYXRlKCk7XG4gICAgY29uc3QgaWQgID0gY3J5cHRvLnJhbmRvbVVVSUQoKTtcblxuICAgIGF3YWl0IHByaXNtYS4kdHJhbnNhY3Rpb24oYXN5bmMgKHR4KSA9PiB7XG4gICAgICBhd2FpdCB0eC5vcGVyYWNpb25Cb2xzYS5jcmVhdGUoe1xuICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgaWQsXG4gICAgICAgICAgY29taXRlbnRlSWQ6ICAgICBzdWpldG9UaXBvID09PSBcImNvbWl0ZW50ZVwiID8gY29taXRlbnRlSWQgOiBudWxsLFxuICAgICAgICAgIGNhcnRlcmFJZDogICAgICAgc3VqZXRvVGlwbyA9PT0gXCJjYXJ0ZXJhXCIgPyBjYXJ0ZXJhSWQgOiBudWxsLFxuICAgICAgICAgIHRpcG9PcGVyYWNpb246ICAgdGlwb1JhdyBhcyBUaXBvT3BCb2xzYSxcbiAgICAgICAgICB0aWNrZXIsXG4gICAgICAgICAgY2FudGlkYWQsXG4gICAgICAgICAgcHJlY2lvLFxuICAgICAgICAgIG1vbmVkYTogICAgICAgICAgbW9uZWRhICBhcyBNb25lZGEsXG4gICAgICAgICAgbWVyY2FkbzogICAgICAgICBtZXJjYWRvIGFzIE1lcmNhZG9Cb2xzYSxcbiAgICAgICAgICBvYnNlcnZhY2lvbmVzLFxuICAgICAgICAgIG9wZXJhZG9yQ2FyZ2FJZDogdXNlcklkLFxuICAgICAgICAgIGVzdGFkbzogICAgICAgICAgXCJQRU5ESUVOVEVfQ09OQ0VSVEFDSU9OXCIsXG4gICAgICAgICAgdXBkYXRlZEF0OiAgICAgICBub3csXG4gICAgICAgIH0sXG4gICAgICB9KTtcbiAgICAgIGF3YWl0IHR4Lm9wZXJhY2lvbkJvbHNhTG9nLmNyZWF0ZSh7XG4gICAgICAgIGRhdGE6IHtcbiAgICAgICAgICBpZDogICAgICAgICAgY3J5cHRvLnJhbmRvbVVVSUQoKSxcbiAgICAgICAgICBvcGVyYWNpb25JZDogaWQsXG4gICAgICAgICAgdXNlcklkLFxuICAgICAgICAgIGFjY2lvbjogICAgICBcIkNBUkdBXCIsXG4gICAgICAgICAgZXN0YWRvTnVldm86IFwiUEVORElFTlRFX0NPTkNFUlRBQ0lPTlwiLFxuICAgICAgICAgIHNuYXBzaG90OiAgICB7IHRpY2tlciwgY2FudGlkYWQsIHByZWNpbywgbW9uZWRhLCBtZXJjYWRvLCB0aXBvT3BlcmFjaW9uOiB0aXBvUmF3IH0sXG4gICAgICAgIH0sXG4gICAgICB9KTtcbiAgICB9KTtcblxuICAgIHJldmFsaWRhdGVQYXRoKFwiL2JvbHNhXCIpO1xuICAgIHJldHVybiB7IG9rOiB0cnVlIGFzIGNvbnN0LCBpZCB9O1xuICB9IGNhdGNoIChlOiB1bmtub3duKSB7XG4gICAgcmV0dXJuIHsgZXJyb3I6IChlIGFzIEVycm9yKS5tZXNzYWdlIHx8IFwiRXJyb3IgYWwgY3JlYXIgb3BlcmFjacOzblwiIH07XG4gIH1cbn1cblxuLy8g4pSA4pSAIENPTkNFUlRBUiDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIBcblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGNvbmNlcnRhck9wZXJhY2lvbihwcmV2U3RhdGU6IHVua25vd24sIGZvcm1EYXRhOiBGb3JtRGF0YSkge1xuICBpZiAocmVhZE9ubHlQcmV2aWV3KSByZXR1cm4geyBlcnJvcjogXCJNb2RvIGxlY3R1cmEgYWN0aXZvXCIgfTtcblxuICBjb25zdCBzZXNzaW9uID0gYXdhaXQgYXV0aCgpO1xuICBjb25zdCB1c2VySWQgID0gc2Vzc2lvbj8udXNlcj8uaWQgYXMgc3RyaW5nIHwgdW5kZWZpbmVkO1xuICBpZiAoIXVzZXJJZCkgcmV0dXJuIHsgZXJyb3I6IFwiU2luIHNlc2nDs24gYWN0aXZhXCIgfTtcblxuICBjb25zdCBvcGVyYWNpb25JZCA9IGZvcm1EYXRhLmdldChcIm9wZXJhY2lvbklkXCIpIGFzIHN0cmluZztcbiAgaWYgKCFvcGVyYWNpb25JZCkgcmV0dXJuIHsgZXJyb3I6IFwiSUQgb3BlcmFjacOzbiByZXF1ZXJpZG9cIiB9O1xuXG4gIGNvbnN0IG9wID0gYXdhaXQgcHJpc21hLm9wZXJhY2lvbkJvbHNhLmZpbmRVbmlxdWUoeyB3aGVyZTogeyBpZDogb3BlcmFjaW9uSWQgfSB9KTtcbiAgaWYgKCFvcCkgcmV0dXJuIHsgZXJyb3I6IFwiT3BlcmFjacOzbiBubyBlbmNvbnRyYWRhXCIgfTtcbiAgaWYgKG9wLmVzdGFkbyA9PT0gXCJBTlVMQURBXCIpICAgcmV0dXJuIHsgZXJyb3I6IFwiT3BlcmFjacOzbiBhbnVsYWRhLCBubyBtb2RpZmljYWJsZVwiIH07XG4gIGlmIChvcC5lc3RhZG8gPT09IFwiTElRVUlEQURBXCIpIHJldHVybiB7IGVycm9yOiBcIk9wZXJhY2nDs24gbGlxdWlkYWRhLCBubyBtb2RpZmljYWJsZVwiIH07XG5cbiAgY29uc3QgbnJvQm9sZXRvICAgICAgICAgPSAoZm9ybURhdGEuZ2V0KFwibnJvQm9sZXRvXCIpICAgYXMgc3RyaW5nKT8udHJpbSgpIHx8IG51bGw7XG4gIGNvbnN0IGFseWMgICAgICAgICAgICAgID0gKGZvcm1EYXRhLmdldChcImFseWNcIikgICAgICAgICBhcyBzdHJpbmcpPy50cmltKCkgfHwgbnVsbDtcbiAgY29uc3QgZmVjaGFDb25jZXJ0UmF3ICAgPSBmb3JtRGF0YS5nZXQoXCJmZWNoYUNvbmNlcnRhY2lvblwiKSAgYXMgc3RyaW5nIHwgbnVsbDtcbiAgY29uc3QgZmVjaGFMaXF1aWRSYXcgICAgPSBmb3JtRGF0YS5nZXQoXCJmZWNoYUxpcXVpZGFjaW9uXCIpICAgYXMgc3RyaW5nIHwgbnVsbDtcbiAgY29uc3QgY29taXNpb25QY3QgICAgICAgPSB0b04oZm9ybURhdGEuZ2V0KFwiY29taXNpb25QY3RcIikpO1xuICBjb25zdCBjb21pc2lvbkZpamEgICAgICA9IHRvTihmb3JtRGF0YS5nZXQoXCJjb21pc2lvbkZpamFcIikpO1xuICBjb25zdCBkZXJlY2hvc01lcmNhZG8gICA9IHRvTihmb3JtRGF0YS5nZXQoXCJkZXJlY2hvc01lcmNhZG9cIikpO1xuICBjb25zdCBnYXN0b3MgICAgICAgICAgICA9IHRvTihmb3JtRGF0YS5nZXQoXCJnYXN0b3NcIikpO1xuICBjb25zdCBpbXB1ZXN0b3MgICAgICAgICA9IHRvTihmb3JtRGF0YS5nZXQoXCJpbXB1ZXN0b3NcIikpO1xuICBjb25zdCB0Y01lcERpYSAgICAgICAgICA9IHRvTihmb3JtRGF0YS5nZXQoXCJ0Y01lcERpYVwiKSk7XG4gIGNvbnN0IGNvbWlzaW9uVVNEICAgICAgID0gdG9OKGZvcm1EYXRhLmdldChcImNvbWlzaW9uVVNEXCIpKTtcbiAgY29uc3Qgc2VuZWJpQnJ1dG8gICAgICAgPSB0b04oZm9ybURhdGEuZ2V0KFwic2VuZWJpQnJ1dG9cIikpO1xuICBjb25zdCBkaWFzQ2F1Y2lvblJhdyAgICA9IGZvcm1EYXRhLmdldChcImRpYXNDYXVjaW9uXCIpIGFzIHN0cmluZyB8IG51bGw7XG4gIGNvbnN0IGRpYXNDYXVjaW9uICAgICAgID0gZGlhc0NhdWNpb25SYXcgPyBwYXJzZUludChkaWFzQ2F1Y2lvblJhdykgOiBudWxsO1xuICBjb25zdCB0YXNhQ2F1Y2lvbiAgICAgICA9IHRvTihmb3JtRGF0YS5nZXQoXCJ0YXNhQ2F1Y2lvblwiKSk7XG5cbiAgLy8gQ2FsY3VsYXRpb25zXG4gIGNvbnN0IGNhbnRpZGFkICAgID0gTnVtYmVyKG9wLmNhbnRpZGFkKTtcbiAgY29uc3QgcHJlY2lvICAgICAgPSBOdW1iZXIob3AucHJlY2lvKTtcbiAgY29uc3QgdmFsb3JCcnV0byAgPSBjYW50aWRhZCAqIHByZWNpbztcbiAgY29uc3QgY29zdG9SZWFsICAgPSAoY29taXNpb25GaWphID8/IDApXG4gICAgKyB2YWxvckJydXRvICogKChjb21pc2lvblBjdCA/PyAwKSAvIDEwMClcbiAgICArIChkZXJlY2hvc01lcmNhZG8gPz8gMClcbiAgICArIChnYXN0b3MgPz8gMClcbiAgICArIChpbXB1ZXN0b3MgPz8gMCk7XG4gIGNvbnN0IGVzVmVudGEgICAgICAgICA9IFZFTlRBX1RJUE9TLmhhcyhvcC50aXBvT3BlcmFjaW9uIGFzIHN0cmluZyk7XG4gIGNvbnN0IG5ldG9MaXF1aWRhZG8gICA9IGVzVmVudGEgPyB2YWxvckJydXRvIC0gY29zdG9SZWFsIDogdmFsb3JCcnV0byArIGNvc3RvUmVhbDtcbiAgY29uc3QgcHJlY2lvUHJvbWVkaW9SZWFsID0gIWVzVmVudGEgJiYgY2FudGlkYWQgPiAwID8gbmV0b0xpcXVpZGFkbyAvIGNhbnRpZGFkIDogbnVsbDtcblxuICB0cnkge1xuICAgIGNvbnN0IG5vdyA9IG5ldyBEYXRlKCk7XG4gICAgYXdhaXQgcHJpc21hLiR0cmFuc2FjdGlvbihhc3luYyAodHgpID0+IHtcbiAgICAgIGF3YWl0IHR4Lm9wZXJhY2lvbkJvbHNhLnVwZGF0ZSh7XG4gICAgICAgIHdoZXJlOiB7IGlkOiBvcGVyYWNpb25JZCB9LFxuICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgZXN0YWRvOiAgICAgICAgICAgXCJDT05DRVJUQURBXCIsXG4gICAgICAgICAgb3BlcmFkb3JDaWVycmVJZDogdXNlcklkLFxuICAgICAgICAgIG5yb0JvbGV0byxcbiAgICAgICAgICBhbHljLFxuICAgICAgICAgIGZlY2hhQ29uY2VydGFjaW9uOiAgZmVjaGFDb25jZXJ0UmF3ICA/IG5ldyBEYXRlKGZlY2hhQ29uY2VydFJhdykgIDogbnVsbCxcbiAgICAgICAgICBmZWNoYUxpcXVpZGFjaW9uOiAgIGZlY2hhTGlxdWlkUmF3ICAgPyBuZXcgRGF0ZShmZWNoYUxpcXVpZFJhdykgICA6IG51bGwsXG4gICAgICAgICAgY29taXNpb25QY3QsXG4gICAgICAgICAgY29taXNpb25GaWphLFxuICAgICAgICAgIGRlcmVjaG9zTWVyY2FkbyxcbiAgICAgICAgICBnYXN0b3MsXG4gICAgICAgICAgaW1wdWVzdG9zLFxuICAgICAgICAgIHRjTWVwRGlhLFxuICAgICAgICAgIGNvbWlzaW9uVVNELFxuICAgICAgICAgIHNlbmViaUJydXRvLFxuICAgICAgICAgIGRpYXNDYXVjaW9uOiAgICAgICAgaXNOYU4oZGlhc0NhdWNpb24gYXMgbnVtYmVyKSA/IG51bGwgOiBkaWFzQ2F1Y2lvbixcbiAgICAgICAgICB0YXNhQ2F1Y2lvbixcbiAgICAgICAgICBjb3N0b1JlYWwsXG4gICAgICAgICAgbmV0b0xpcXVpZGFkbyxcbiAgICAgICAgICBwcmVjaW9Qcm9tZWRpb1JlYWwsXG4gICAgICAgICAgdXBkYXRlZEF0OiAgICAgICAgICBub3csXG4gICAgICAgIH0sXG4gICAgICB9KTtcbiAgICAgIGF3YWl0IHR4Lm9wZXJhY2lvbkJvbHNhTG9nLmNyZWF0ZSh7XG4gICAgICAgIGRhdGE6IHtcbiAgICAgICAgICBpZDogICAgICAgICAgICBjcnlwdG8ucmFuZG9tVVVJRCgpLFxuICAgICAgICAgIG9wZXJhY2lvbklkLFxuICAgICAgICAgIHVzZXJJZCxcbiAgICAgICAgICBhY2Npb246ICAgICAgICBcIkNPTkNFUlRBQ0lPTlwiLFxuICAgICAgICAgIGVzdGFkb0FudGVyaW9yOiBvcC5lc3RhZG8sXG4gICAgICAgICAgZXN0YWRvTnVldm86ICAgXCJDT05DRVJUQURBXCIsXG4gICAgICAgICAgc25hcHNob3Q6ICAgICAgeyBucm9Cb2xldG8sIGFseWMsIGNvc3RvUmVhbCwgbmV0b0xpcXVpZGFkbywgcHJlY2lvUHJvbWVkaW9SZWFsIH0sXG4gICAgICAgIH0sXG4gICAgICB9KTtcbiAgICB9KTtcblxuICAgIHJldmFsaWRhdGVQYXRoKFwiL2JvbHNhXCIpO1xuICAgIHJldmFsaWRhdGVQYXRoKGAvYm9sc2EvJHtvcGVyYWNpb25JZH1gKTtcbiAgICByZXR1cm4geyBvazogdHJ1ZSBhcyBjb25zdCB9O1xuICB9IGNhdGNoIChlOiB1bmtub3duKSB7XG4gICAgcmV0dXJuIHsgZXJyb3I6IChlIGFzIEVycm9yKS5tZXNzYWdlIHx8IFwiRXJyb3IgYWwgY29uY2VydGFyIG9wZXJhY2nDs25cIiB9O1xuICB9XG59XG5cbi8vIOKUgOKUgCBDUkVBUiAoTWVzYSBEaWFyaWEpIOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgFxuXG5jb25zdCBDQVVDSU9OX1RJUE9TID0gbmV3IFNldDxzdHJpbmc+KFtcIkNBVUNJT05fQ09MT0NBRE9SQVwiLCBcIkNBVUNJT05fVE9NQURPUkFcIl0pO1xuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gY3JlYXJPcE1lc2FEaWFyaWEoX3ByZXZTdGF0ZTogdW5rbm93biwgZm9ybURhdGE6IEZvcm1EYXRhKSB7XG4gIGlmIChyZWFkT25seVByZXZpZXcpIHJldHVybiB7IGVycm9yOiBcIk1vZG8gbGVjdHVyYSBhY3Rpdm9cIiB9O1xuXG4gIGNvbnN0IHNlc3Npb24gPSBhd2FpdCBhdXRoKCk7XG4gIGNvbnN0IHVzZXJJZCAgPSBzZXNzaW9uPy51c2VyPy5pZCBhcyBzdHJpbmcgfCB1bmRlZmluZWQ7XG4gIGlmICghdXNlcklkKSByZXR1cm4geyBlcnJvcjogXCJTaW4gc2VzacOzbiBhY3RpdmFcIiB9O1xuXG4gIGNvbnN0IHN1amV0b1RpcG8gICAgPSBmb3JtRGF0YS5nZXQoXCJzdWpldG9UaXBvXCIpIGFzIHN0cmluZztcbiAgY29uc3QgY29taXRlbnRlSWQgICA9IChmb3JtRGF0YS5nZXQoXCJjb21pdGVudGVJZFwiKSBhcyBzdHJpbmcpIHx8IG51bGw7XG4gIGNvbnN0IGNhcnRlcmFJZCAgICAgPSAoZm9ybURhdGEuZ2V0KFwiY2FydGVyYUlkXCIpICAgYXMgc3RyaW5nKSB8fCBudWxsO1xuICBjb25zdCB0aXBvUmF3ICAgICAgID0gZm9ybURhdGEuZ2V0KFwidGlwb09wZXJhY2lvblwiKSBhcyBzdHJpbmc7XG4gIGNvbnN0IHRpY2tlclJhdyAgICAgPSAoKGZvcm1EYXRhLmdldChcInRpY2tlclwiKSBhcyBzdHJpbmcpIHx8IFwiXCIpLnRyaW0oKS50b1VwcGVyQ2FzZSgpO1xuICBjb25zdCBjYW50aWRhZFJhdyAgID0gZm9ybURhdGEuZ2V0KFwiY2FudGlkYWRcIikgIGFzIHN0cmluZztcbiAgY29uc3QgcHJlY2lvUmF3ICAgICA9IGZvcm1EYXRhLmdldChcInByZWNpb1wiKSAgICBhcyBzdHJpbmc7XG4gIGNvbnN0IG1vbmVkYSAgICAgICAgPSBmb3JtRGF0YS5nZXQoXCJtb25lZGFcIikgICAgYXMgc3RyaW5nO1xuICBjb25zdCBtZXJjYWRvICAgICAgID0gZm9ybURhdGEuZ2V0KFwibWVyY2Fkb1wiKSAgIGFzIHN0cmluZztcbiAgY29uc3QgZmVjaGFPcFJhdyAgICA9IGZvcm1EYXRhLmdldChcImZlY2hhT3BlcmF0aXZhXCIpIGFzIHN0cmluZztcbiAgY29uc3Qgb2JzZXJ2YWNpb25lcyA9ICgoZm9ybURhdGEuZ2V0KFwib2JzZXJ2YWNpb25lc1wiKSBhcyBzdHJpbmcpIHx8IFwiXCIpLnRyaW0oKSB8fCBudWxsO1xuXG4gIGNvbnN0IHJlc3VsdGFkb0JydXRvID0gdG9OKGZvcm1EYXRhLmdldChcInJlc3VsdGFkb0JydXRvXCIpKTtcbiAgY29uc3QgcmVzdWx0YWRvTmV0byAgPSB0b04oZm9ybURhdGEuZ2V0KFwicmVzdWx0YWRvTmV0b1wiKSk7XG4gIGNvbnN0IHRjTWVwRGlhICAgICAgID0gdG9OKGZvcm1EYXRhLmdldChcInRjTWVwRGlhXCIpKTtcbiAgY29uc3QgdGFzYUNhdWNpb24gICAgPSB0b04oZm9ybURhdGEuZ2V0KFwidGFzYUNhdWNpb25cIikpO1xuICBjb25zdCBkaWFzUmF3ICAgICAgICA9IGZvcm1EYXRhLmdldChcImRpYXNDYXVjaW9uXCIpIGFzIHN0cmluZyB8IG51bGw7XG4gIGNvbnN0IGRpYXNDYXVjaW9uICAgID0gZGlhc1JhdyA/IHBhcnNlSW50KGRpYXNSYXcpIDogbnVsbDtcblxuICBpZiAoIXRpcG9SYXcgfHwgIWNhbnRpZGFkUmF3IHx8ICFwcmVjaW9SYXcgfHwgIW1vbmVkYSB8fCAhbWVyY2FkbylcbiAgICByZXR1cm4geyBlcnJvcjogXCJGYWx0YW4gY2FtcG9zIG9ibGlnYXRvcmlvc1wiIH07XG4gIGlmIChzdWpldG9UaXBvID09PSBcImNvbWl0ZW50ZVwiICYmICFjb21pdGVudGVJZClcbiAgICByZXR1cm4geyBlcnJvcjogXCJTZWxlY2Npb25hciBjb21pdGVudGVcIiB9O1xuICBpZiAoc3VqZXRvVGlwbyA9PT0gXCJjYXJ0ZXJhXCIgJiYgIWNhcnRlcmFJZClcbiAgICByZXR1cm4geyBlcnJvcjogXCJTZWxlY2Npb25hciBjYXJ0ZXJhXCIgfTtcblxuICBjb25zdCB0aWNrZXIgPSB0aWNrZXJSYXcgfHwgKENBVUNJT05fVElQT1MuaGFzKHRpcG9SYXcpID8gXCJDQVVDSU9OXCIgOiBcIlwiKTtcbiAgaWYgKCF0aWNrZXIpIHJldHVybiB7IGVycm9yOiBcIlRpY2tlciByZXF1ZXJpZG8gcGFyYSBlc3RlIHRpcG8gZGUgb3BlcmFjacOzblwiIH07XG5cbiAgY29uc3QgY2FudGlkYWQgPSBwYXJzZUZsb2F0KGNhbnRpZGFkUmF3KTtcbiAgY29uc3QgcHJlY2lvICAgPSBwYXJzZUZsb2F0KHByZWNpb1Jhdyk7XG4gIGlmIChpc05hTihjYW50aWRhZCkgfHwgY2FudGlkYWQgPD0gMCkgcmV0dXJuIHsgZXJyb3I6IFwiQ2FudGlkYWQgaW52w6FsaWRhXCIgfTtcbiAgaWYgKGlzTmFOKHByZWNpbykgICB8fCBwcmVjaW8gICA8PSAwKSByZXR1cm4geyBlcnJvcjogXCJQcmVjaW8gaW52w6FsaWRvXCIgfTtcblxuICBjb25zdCBmZWNoYU9wZXJhdGl2YSA9IGZlY2hhT3BSYXcgPyBuZXcgRGF0ZShmZWNoYU9wUmF3ICsgXCJUMDA6MDA6MDAuMDAwWlwiKSA6IG51bGw7XG5cbiAgdHJ5IHtcbiAgICBjb25zdCBub3cgPSBuZXcgRGF0ZSgpO1xuICAgIGNvbnN0IGlkICA9IGNyeXB0by5yYW5kb21VVUlEKCk7XG5cbiAgICBhd2FpdCBwcmlzbWEuJHRyYW5zYWN0aW9uKGFzeW5jICh0eCkgPT4ge1xuICAgICAgYXdhaXQgdHgub3BlcmFjaW9uQm9sc2EuY3JlYXRlKHtcbiAgICAgICAgZGF0YToge1xuICAgICAgICAgIGlkLFxuICAgICAgICAgIGNvbWl0ZW50ZUlkOiAgICAgc3VqZXRvVGlwbyA9PT0gXCJjb21pdGVudGVcIiA/IGNvbWl0ZW50ZUlkIDogbnVsbCxcbiAgICAgICAgICBjYXJ0ZXJhSWQ6ICAgICAgIHN1amV0b1RpcG8gPT09IFwiY2FydGVyYVwiICAgPyBjYXJ0ZXJhSWQgICA6IG51bGwsXG4gICAgICAgICAgdGlwb09wZXJhY2lvbjogICB0aXBvUmF3IGFzIFRpcG9PcEJvbHNhLFxuICAgICAgICAgIHRpY2tlcixcbiAgICAgICAgICBjYW50aWRhZCxcbiAgICAgICAgICBwcmVjaW8sXG4gICAgICAgICAgbW9uZWRhOiAgICAgICAgICBtb25lZGEgIGFzIE1vbmVkYSxcbiAgICAgICAgICBtZXJjYWRvOiAgICAgICAgIG1lcmNhZG8gYXMgTWVyY2Fkb0JvbHNhLFxuICAgICAgICAgIG9ic2VydmFjaW9uZXMsXG4gICAgICAgICAgb3BlcmFkb3JDYXJnYUlkOiB1c2VySWQsXG4gICAgICAgICAgZXN0YWRvOiAgICAgICAgICBcIlBFTkRJRU5URV9DT05DRVJUQUNJT05cIixcbiAgICAgICAgICBmZWNoYU9wZXJhdGl2YSxcbiAgICAgICAgICByZXN1bHRhZG9CcnV0byxcbiAgICAgICAgICByZXN1bHRhZG9OZXRvLFxuICAgICAgICAgIHRjTWVwRGlhLFxuICAgICAgICAgIHRhc2FDYXVjaW9uLFxuICAgICAgICAgIGRpYXNDYXVjaW9uOiAgICAgZGlhc0NhdWNpb24gIT09IG51bGwgJiYgIWlzTmFOKGRpYXNDYXVjaW9uKSA/IGRpYXNDYXVjaW9uIDogbnVsbCxcbiAgICAgICAgICB1cGRhdGVkQXQ6ICAgICAgIG5vdyxcbiAgICAgICAgfSxcbiAgICAgIH0pO1xuICAgICAgYXdhaXQgdHgub3BlcmFjaW9uQm9sc2FMb2cuY3JlYXRlKHtcbiAgICAgICAgZGF0YToge1xuICAgICAgICAgIGlkOiAgICAgICAgICBjcnlwdG8ucmFuZG9tVVVJRCgpLFxuICAgICAgICAgIG9wZXJhY2lvbklkOiBpZCxcbiAgICAgICAgICB1c2VySWQsXG4gICAgICAgICAgYWNjaW9uOiAgICAgIFwiQ0FSR0FcIixcbiAgICAgICAgICBlc3RhZG9OdWV2bzogXCJQRU5ESUVOVEVfQ09OQ0VSVEFDSU9OXCIsXG4gICAgICAgICAgc25hcHNob3Q6ICAgIHsgdGlja2VyLCBjYW50aWRhZCwgcHJlY2lvLCBtb25lZGEsIG1lcmNhZG8sIHRpcG9PcGVyYWNpb246IHRpcG9SYXcsIHJlc3VsdGFkb0JydXRvLCByZXN1bHRhZG9OZXRvIH0sXG4gICAgICAgIH0sXG4gICAgICB9KTtcbiAgICB9KTtcblxuICAgIHJldmFsaWRhdGVQYXRoKFwiL2JvbHNhXCIpO1xuICAgIHJldHVybiB7IG9rOiB0cnVlIGFzIGNvbnN0LCBpZCB9O1xuICB9IGNhdGNoIChlOiB1bmtub3duKSB7XG4gICAgcmV0dXJuIHsgZXJyb3I6IChlIGFzIEVycm9yKS5tZXNzYWdlIHx8IFwiRXJyb3IgYWwgY3JlYXIgb3BlcmFjacOzblwiIH07XG4gIH1cbn1cblxuLy8g4pSA4pSAIEFHUlVQQVIgQVJCSVRSQUpFIOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgFxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gYWdydXBhck9wZXJhY2lvbmVzQXJiaXRyYWplKF9wcmV2U3RhdGU6IHVua25vd24sIGZvcm1EYXRhOiBGb3JtRGF0YSkge1xuICBpZiAocmVhZE9ubHlQcmV2aWV3KSByZXR1cm4geyBlcnJvcjogXCJNb2RvIGxlY3R1cmEgYWN0aXZvXCIgfTtcblxuICBjb25zdCBzZXNzaW9uID0gYXdhaXQgYXV0aCgpO1xuICBjb25zdCB1c2VySWQgID0gc2Vzc2lvbj8udXNlcj8uaWQgYXMgc3RyaW5nIHwgdW5kZWZpbmVkO1xuICBpZiAoIXVzZXJJZCkgcmV0dXJuIHsgZXJyb3I6IFwiU2luIHNlc2nDs24gYWN0aXZhXCIgfTtcblxuICBjb25zdCBpZHNSYXcgPSAoZm9ybURhdGEuZ2V0KFwib3BlcmF0aW9uSWRzXCIpIGFzIHN0cmluZykgfHwgXCJcIjtcbiAgY29uc3QgaWRzICAgID0gaWRzUmF3LnNwbGl0KFwiLFwiKS5tYXAoKHMpID0+IHMudHJpbSgpKS5maWx0ZXIoQm9vbGVhbik7XG5cbiAgaWYgKGlkcy5sZW5ndGggPCAyKSByZXR1cm4geyBlcnJvcjogXCJTZWxlY2Npb25hciBhbCBtZW5vcyAyIG9wZXJhY2lvbmVzXCIgfTtcblxuICBjb25zdCBvcHMgPSBhd2FpdCBwcmlzbWEub3BlcmFjaW9uQm9sc2EuZmluZE1hbnkoe1xuICAgIHdoZXJlOiAgeyBpZDogeyBpbjogaWRzIH0gfSxcbiAgICBzZWxlY3Q6IHsgaWQ6IHRydWUsIGFudWxhZGE6IHRydWUsIGVzdGFkbzogdHJ1ZSB9LFxuICB9KTtcblxuICBpZiAob3BzLmxlbmd0aCAhPT0gaWRzLmxlbmd0aCkgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB7IGVycm9yOiBcIlVuYSBvIG3DoXMgb3BlcmFjaW9uZXMgbm8gZW5jb250cmFkYXNcIiB9O1xuICBpZiAob3BzLnNvbWUoKG8pID0+IG8uYW51bGFkYSkpICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB7IGVycm9yOiBcIk5vIHNlIHB1ZWRlbiBhZ3J1cGFyIG9wZXJhY2lvbmVzIGFudWxhZGFzXCIgfTtcbiAgaWYgKG9wcy5zb21lKChvKSA9PiBvLmVzdGFkbyAhPT0gXCJQRU5ESUVOVEVfQ09OQ0VSVEFDSU9OXCIpKSAgICAgIHJldHVybiB7IGVycm9yOiBcIlNvbG8gc2UgcHVlZGVuIGFncnVwYXIgb3BlcmFjaW9uZXMgcGVuZGllbnRlcyBkZSByZXZpc2nDs25cIiB9O1xuXG4gIGNvbnN0IGdydXBvSWQgPSBjcnlwdG8ucmFuZG9tVVVJRCgpLnNsaWNlKDAsIDgpLnRvVXBwZXJDYXNlKCk7XG5cbiAgYXdhaXQgcHJpc21hLm9wZXJhY2lvbkJvbHNhLnVwZGF0ZU1hbnkoe1xuICAgIHdoZXJlOiB7IGlkOiB7IGluOiBpZHMgfSB9LFxuICAgIGRhdGE6ICB7IGdydXBvQXJiaXRyYWplSWQ6IGdydXBvSWQsIHVwZGF0ZWRBdDogbmV3IERhdGUoKSB9LFxuICB9KTtcblxuICByZXZhbGlkYXRlUGF0aChcIi9ib2xzYVwiKTtcbiAgcmV0dXJuIHsgb2s6IHRydWUgYXMgY29uc3QsIGdydXBvSWQgfTtcbn1cblxuLy8g4pSA4pSAIEFOVUxBUiDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIBcblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGFudWxhck9wZXJhY2lvbihwcmV2U3RhdGU6IHVua25vd24sIGZvcm1EYXRhOiBGb3JtRGF0YSkge1xuICBpZiAocmVhZE9ubHlQcmV2aWV3KSByZXR1cm4geyBlcnJvcjogXCJNb2RvIGxlY3R1cmEgYWN0aXZvXCIgfTtcblxuICBjb25zdCBzZXNzaW9uID0gYXdhaXQgYXV0aCgpO1xuICBjb25zdCB1c2VySWQgID0gc2Vzc2lvbj8udXNlcj8uaWQgYXMgc3RyaW5nIHwgdW5kZWZpbmVkO1xuICBpZiAoIXVzZXJJZCkgcmV0dXJuIHsgZXJyb3I6IFwiU2luIHNlc2nDs24gYWN0aXZhXCIgfTtcblxuICBjb25zdCBvcGVyYWNpb25JZCAgICAgID0gZm9ybURhdGEuZ2V0KFwib3BlcmFjaW9uSWRcIikgICAgICBhcyBzdHJpbmc7XG4gIGNvbnN0IG1vdGl2b0FudWxhY2lvbiAgPSAoZm9ybURhdGEuZ2V0KFwibW90aXZvQW51bGFjaW9uXCIpIGFzIHN0cmluZyk/LnRyaW0oKTtcblxuICBpZiAoIW9wZXJhY2lvbklkKSAgICAgcmV0dXJuIHsgZXJyb3I6IFwiSUQgb3BlcmFjacOzbiByZXF1ZXJpZG9cIiB9O1xuICBpZiAoIW1vdGl2b0FudWxhY2lvbikgcmV0dXJuIHsgZXJyb3I6IFwiRWwgbW90aXZvIGRlIGFudWxhY2nDs24gZXMgb2JsaWdhdG9yaW9cIiB9O1xuXG4gIGNvbnN0IG9wID0gYXdhaXQgcHJpc21hLm9wZXJhY2lvbkJvbHNhLmZpbmRVbmlxdWUoeyB3aGVyZTogeyBpZDogb3BlcmFjaW9uSWQgfSB9KTtcbiAgaWYgKCFvcCkgICAgICAgIHJldHVybiB7IGVycm9yOiBcIk9wZXJhY2nDs24gbm8gZW5jb250cmFkYVwiIH07XG4gIGlmIChvcC5hbnVsYWRhKSByZXR1cm4geyBlcnJvcjogXCJPcGVyYWNpw7NuIHlhIGFudWxhZGFcIiB9O1xuXG4gIHRyeSB7XG4gICAgY29uc3Qgbm93ID0gbmV3IERhdGUoKTtcbiAgICBhd2FpdCBwcmlzbWEuJHRyYW5zYWN0aW9uKGFzeW5jICh0eCkgPT4ge1xuICAgICAgYXdhaXQgdHgub3BlcmFjaW9uQm9sc2EudXBkYXRlKHtcbiAgICAgICAgd2hlcmU6IHsgaWQ6IG9wZXJhY2lvbklkIH0sXG4gICAgICAgIGRhdGE6IHsgZXN0YWRvOiBcIkFOVUxBREFcIiwgYW51bGFkYTogdHJ1ZSwgbW90aXZvQW51bGFjaW9uLCB1cGRhdGVkQXQ6IG5vdyB9LFxuICAgICAgfSk7XG4gICAgICBhd2FpdCB0eC5vcGVyYWNpb25Cb2xzYUxvZy5jcmVhdGUoe1xuICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgaWQ6ICAgICAgICAgICAgY3J5cHRvLnJhbmRvbVVVSUQoKSxcbiAgICAgICAgICBvcGVyYWNpb25JZCxcbiAgICAgICAgICB1c2VySWQsXG4gICAgICAgICAgYWNjaW9uOiAgICAgICAgXCJBTlVMQUNJT05cIixcbiAgICAgICAgICBlc3RhZG9BbnRlcmlvcjogb3AuZXN0YWRvLFxuICAgICAgICAgIGVzdGFkb051ZXZvOiAgIFwiQU5VTEFEQVwiLFxuICAgICAgICAgIHNuYXBzaG90OiAgICAgIHsgbW90aXZvQW51bGFjaW9uIH0sXG4gICAgICAgIH0sXG4gICAgICB9KTtcbiAgICB9KTtcblxuICAgIHJldmFsaWRhdGVQYXRoKFwiL2JvbHNhXCIpO1xuICAgIHJldmFsaWRhdGVQYXRoKGAvYm9sc2EvJHtvcGVyYWNpb25JZH1gKTtcbiAgICByZXR1cm4geyBvazogdHJ1ZSBhcyBjb25zdCB9O1xuICB9IGNhdGNoIChlOiB1bmtub3duKSB7XG4gICAgcmV0dXJuIHsgZXJyb3I6IChlIGFzIEVycm9yKS5tZXNzYWdlIHx8IFwiRXJyb3IgYWwgYW51bGFyIG9wZXJhY2nDs25cIiB9O1xuICB9XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6InlUQXdSc0IifQ==
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/src/components/modules/bolsa/MesaDiariaTable.tsx [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname, k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
__turbopack_context__.s({
    "MesaDiariaTable": (()=>MesaDiariaTable)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/client/app-dir/link.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$down$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronDown$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/chevron-down.js [app-client] (ecmascript) <export default as ChevronDown>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$right$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronRight$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/chevron-right.js [app-client] (ecmascript) <export default as ChevronRight>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$link$2d$2$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Link2$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/link-2.js [app-client] (ecmascript) <export default as Link2>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f28$dashboard$292f$bolsa$2f$data$3a$2915f1__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$text$2f$javascript$3e$__ = __turbopack_context__.i("[project]/src/app/(dashboard)/bolsa/data:2915f1 [app-client] (ecmascript) <text/javascript>");
;
var _s = __turbopack_context__.k.signature(), _s1 = __turbopack_context__.k.signature(), _s2 = __turbopack_context__.k.signature();
"use client";
;
;
;
;
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
const ESTADO_LABEL = {
    PENDIENTE_CONCERTACION: "Pendiente revisión",
    CONCERTADA: "Concertada",
    LIQUIDADA: "Liquidada",
    ANULADA: "Anulada"
};
const ESTADO_STYLE = {
    PENDIENTE_CONCERTACION: "bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/20",
    CONCERTADA: "bg-byg-accent/10 text-byg-accent ring-1 ring-byg-accent/20",
    LIQUIDADA: "bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20",
    ANULADA: "bg-byg-surface-2 text-byg-muted"
};
function fmt(n, decimals = 2) {
    if (n === null) return "—";
    return n.toLocaleString("es-AR", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    });
}
function fmtResult(n) {
    if (n === null) return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
        className: "text-byg-muted/50",
        children: "—"
    }, void 0, false, {
        fileName: "[project]/src/components/modules/bolsa/MesaDiariaTable.tsx",
        lineNumber: 50,
        columnNumber: 26
    }, this);
    const color = n >= 0 ? "text-emerald-400" : "text-red-400";
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
        className: `${color} font-semibold tabular-nums`,
        children: fmt(n)
    }, void 0, false, {
        fileName: "[project]/src/components/modules/bolsa/MesaDiariaTable.tsx",
        lineNumber: 52,
        columnNumber: 10
    }, this);
}
function OpsTable({ ops, selectedIds, onToggle }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "overflow-x-auto",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("table", {
            className: "w-full text-left border-collapse min-w-[940px]",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("thead", {
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                        className: "border-b border-byg-border/60 bg-byg-bg/50",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                className: "px-3 py-2 w-8"
                            }, void 0, false, {
                                fileName: "[project]/src/components/modules/bolsa/MesaDiariaTable.tsx",
                                lineNumber: 66,
                                columnNumber: 13
                            }, this),
                            [
                                "Tipo",
                                "Ticker",
                                "Cant.",
                                "Precio",
                                "Mon.",
                                "Res. Bruto",
                                "Res. Neto",
                                "TC MEP",
                                "Caución",
                                "Estado",
                                "Operador",
                                ""
                            ].map((h)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                    className: "px-3 py-2 text-[9px] font-black uppercase text-byg-muted tracking-[0.15em] whitespace-nowrap",
                                    children: h
                                }, h, false, {
                                    fileName: "[project]/src/components/modules/bolsa/MesaDiariaTable.tsx",
                                    lineNumber: 68,
                                    columnNumber: 15
                                }, this))
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/modules/bolsa/MesaDiariaTable.tsx",
                        lineNumber: 65,
                        columnNumber: 11
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/src/components/modules/bolsa/MesaDiariaTable.tsx",
                    lineNumber: 64,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tbody", {
                    className: "divide-y divide-byg-border/30",
                    children: ops.map((op)=>{
                        const isPending = op.estado === "PENDIENTE_CONCERTACION";
                        const isChecked = selectedIds.has(op.id);
                        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                            className: `hover:bg-byg-surface-2/50 transition-colors ${isChecked ? "bg-violet-500/5" : ""}`,
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                    className: "px-3 py-2.5 w-8",
                                    children: isPending && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                        type: "checkbox",
                                        checked: isChecked,
                                        onChange: ()=>onToggle(op.id),
                                        className: "accent-violet-500 cursor-pointer"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/modules/bolsa/MesaDiariaTable.tsx",
                                        lineNumber: 85,
                                        columnNumber: 21
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/src/components/modules/bolsa/MesaDiariaTable.tsx",
                                    lineNumber: 83,
                                    columnNumber: 17
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                    className: "px-3 py-2.5 text-[11px] text-byg-muted whitespace-nowrap",
                                    children: TIPO_LABEL[op.tipoOperacion] ?? op.tipoOperacion
                                }, void 0, false, {
                                    fileName: "[project]/src/components/modules/bolsa/MesaDiariaTable.tsx",
                                    lineNumber: 93,
                                    columnNumber: 17
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                    className: "px-3 py-2.5",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "flex items-center gap-1.5 flex-wrap",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "text-[12px] font-black text-byg-text tracking-tight",
                                                children: op.ticker
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/modules/bolsa/MesaDiariaTable.tsx",
                                                lineNumber: 98,
                                                columnNumber: 21
                                            }, this),
                                            op.grupoArbitrajeId && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "text-[8px] font-black px-1.5 py-0.5 rounded bg-violet-500/15 text-violet-400 ring-1 ring-violet-500/20 tracking-wider whitespace-nowrap",
                                                children: [
                                                    "ARB ",
                                                    op.grupoArbitrajeId.slice(0, 6)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/src/components/modules/bolsa/MesaDiariaTable.tsx",
                                                lineNumber: 100,
                                                columnNumber: 23
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/components/modules/bolsa/MesaDiariaTable.tsx",
                                        lineNumber: 97,
                                        columnNumber: 19
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/src/components/modules/bolsa/MesaDiariaTable.tsx",
                                    lineNumber: 96,
                                    columnNumber: 17
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                    className: "px-3 py-2.5 text-[11px] text-right tabular-nums font-mono text-byg-text whitespace-nowrap",
                                    children: fmt(op.cantidad, 0)
                                }, void 0, false, {
                                    fileName: "[project]/src/components/modules/bolsa/MesaDiariaTable.tsx",
                                    lineNumber: 106,
                                    columnNumber: 17
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                    className: "px-3 py-2.5 text-[11px] text-right tabular-nums font-mono text-byg-text whitespace-nowrap",
                                    children: fmt(op.precio)
                                }, void 0, false, {
                                    fileName: "[project]/src/components/modules/bolsa/MesaDiariaTable.tsx",
                                    lineNumber: 109,
                                    columnNumber: 17
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                    className: "px-3 py-2.5 text-[11px] text-byg-muted",
                                    children: op.moneda
                                }, void 0, false, {
                                    fileName: "[project]/src/components/modules/bolsa/MesaDiariaTable.tsx",
                                    lineNumber: 112,
                                    columnNumber: 17
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                    className: "px-3 py-2.5 text-[11px] text-right whitespace-nowrap",
                                    children: fmtResult(op.resultadoBruto)
                                }, void 0, false, {
                                    fileName: "[project]/src/components/modules/bolsa/MesaDiariaTable.tsx",
                                    lineNumber: 113,
                                    columnNumber: 17
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                    className: "px-3 py-2.5 text-[11px] text-right whitespace-nowrap",
                                    children: fmtResult(op.resultadoNeto)
                                }, void 0, false, {
                                    fileName: "[project]/src/components/modules/bolsa/MesaDiariaTable.tsx",
                                    lineNumber: 116,
                                    columnNumber: 17
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                    className: "px-3 py-2.5 text-[11px] text-right tabular-nums font-mono text-byg-muted whitespace-nowrap",
                                    children: op.tcMepDia !== null ? fmt(op.tcMepDia, 4) : "—"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/modules/bolsa/MesaDiariaTable.tsx",
                                    lineNumber: 119,
                                    columnNumber: 17
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                    className: "px-3 py-2.5 text-[11px] text-byg-muted whitespace-nowrap",
                                    children: op.diasCaucion !== null ? `${op.diasCaucion}d${op.tasaCaucion !== null ? ` @ ${fmt(op.tasaCaucion, 2)}%` : ""}` : "—"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/modules/bolsa/MesaDiariaTable.tsx",
                                    lineNumber: 122,
                                    columnNumber: 17
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                    className: "px-3 py-2.5 whitespace-nowrap",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: `text-[9px] font-black px-2 py-1 rounded-md uppercase tracking-widest ${ESTADO_STYLE[op.estado] ?? "bg-byg-surface-2 text-byg-muted"}`,
                                        children: ESTADO_LABEL[op.estado] ?? op.estado
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/modules/bolsa/MesaDiariaTable.tsx",
                                        lineNumber: 128,
                                        columnNumber: 19
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/src/components/modules/bolsa/MesaDiariaTable.tsx",
                                    lineNumber: 127,
                                    columnNumber: 17
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                    className: "px-3 py-2.5 text-[11px] text-byg-muted whitespace-nowrap",
                                    children: op.operadorNombre
                                }, void 0, false, {
                                    fileName: "[project]/src/components/modules/bolsa/MesaDiariaTable.tsx",
                                    lineNumber: 132,
                                    columnNumber: 17
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                    className: "px-3 py-2.5",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                        href: `/bolsa/${op.id}`,
                                        className: "inline-flex items-center text-[10px] font-black px-2 py-1 rounded-lg bg-byg-accent text-white hover:bg-blue-500 transition-colors uppercase tracking-widest",
                                        children: "Ver →"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/modules/bolsa/MesaDiariaTable.tsx",
                                        lineNumber: 136,
                                        columnNumber: 19
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/src/components/modules/bolsa/MesaDiariaTable.tsx",
                                    lineNumber: 135,
                                    columnNumber: 17
                                }, this)
                            ]
                        }, op.id, true, {
                            fileName: "[project]/src/components/modules/bolsa/MesaDiariaTable.tsx",
                            lineNumber: 79,
                            columnNumber: 15
                        }, this);
                    })
                }, void 0, false, {
                    fileName: "[project]/src/components/modules/bolsa/MesaDiariaTable.tsx",
                    lineNumber: 74,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/src/components/modules/bolsa/MesaDiariaTable.tsx",
            lineNumber: 63,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/src/components/modules/bolsa/MesaDiariaTable.tsx",
        lineNumber: 62,
        columnNumber: 5
    }, this);
}
_c = OpsTable;
function PropiaGroup({ g, selectedIds, onToggle }) {
    _s();
    const [open, setOpen] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(true);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "border border-byg-border rounded-xl overflow-hidden",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                type: "button",
                onClick: ()=>setOpen((v)=>!v),
                className: "w-full flex items-center justify-between px-4 py-3 bg-byg-bg hover:bg-byg-surface-2 transition-colors text-left",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex items-center gap-2",
                        children: [
                            open ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$down$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronDown$3e$__["ChevronDown"], {
                                size: 13,
                                className: "text-byg-muted"
                            }, void 0, false, {
                                fileName: "[project]/src/components/modules/bolsa/MesaDiariaTable.tsx",
                                lineNumber: 162,
                                columnNumber: 19
                            }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$right$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronRight$3e$__["ChevronRight"], {
                                size: 13,
                                className: "text-byg-muted"
                            }, void 0, false, {
                                fileName: "[project]/src/components/modules/bolsa/MesaDiariaTable.tsx",
                                lineNumber: 162,
                                columnNumber: 74
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "text-[12px] font-black text-byg-text",
                                children: g.carteraNombre
                            }, void 0, false, {
                                fileName: "[project]/src/components/modules/bolsa/MesaDiariaTable.tsx",
                                lineNumber: 163,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "text-[10px] text-byg-muted font-medium",
                                children: [
                                    "(",
                                    g.ops.length,
                                    " op",
                                    g.ops.length !== 1 ? "s" : "",
                                    ")"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/modules/bolsa/MesaDiariaTable.tsx",
                                lineNumber: 164,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/modules/bolsa/MesaDiariaTable.tsx",
                        lineNumber: 161,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex items-center gap-4 text-[11px] font-mono tabular-nums",
                        children: [
                            g.totalResultadoARS !== 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: g.totalResultadoARS >= 0 ? "text-emerald-400" : "text-red-400",
                                children: [
                                    fmt(g.totalResultadoARS),
                                    " ARS"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/modules/bolsa/MesaDiariaTable.tsx",
                                lineNumber: 168,
                                columnNumber: 13
                            }, this),
                            g.totalResultadoUSD !== 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: g.totalResultadoUSD >= 0 ? "text-emerald-400" : "text-red-400",
                                children: [
                                    fmt(g.totalResultadoUSD),
                                    " USD"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/modules/bolsa/MesaDiariaTable.tsx",
                                lineNumber: 173,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/modules/bolsa/MesaDiariaTable.tsx",
                        lineNumber: 166,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/modules/bolsa/MesaDiariaTable.tsx",
                lineNumber: 156,
                columnNumber: 7
            }, this),
            open && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(OpsTable, {
                ops: g.ops,
                selectedIds: selectedIds,
                onToggle: onToggle
            }, void 0, false, {
                fileName: "[project]/src/components/modules/bolsa/MesaDiariaTable.tsx",
                lineNumber: 179,
                columnNumber: 16
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/modules/bolsa/MesaDiariaTable.tsx",
        lineNumber: 155,
        columnNumber: 5
    }, this);
}
_s(PropiaGroup, "dVkDIfRb5RN4FjtonjBYYwpg89o=");
_c1 = PropiaGroup;
function ClienteGroup({ g, selectedIds, onToggle }) {
    _s1();
    const [open, setOpen] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(true);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "border border-byg-border rounded-xl overflow-hidden",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                type: "button",
                onClick: ()=>setOpen((v)=>!v),
                className: "w-full flex items-center justify-between px-4 py-3 bg-byg-bg hover:bg-byg-surface-2 transition-colors text-left",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex items-center gap-2",
                        children: [
                            open ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$down$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronDown$3e$__["ChevronDown"], {
                                size: 13,
                                className: "text-byg-muted"
                            }, void 0, false, {
                                fileName: "[project]/src/components/modules/bolsa/MesaDiariaTable.tsx",
                                lineNumber: 194,
                                columnNumber: 19
                            }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$right$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronRight$3e$__["ChevronRight"], {
                                size: 13,
                                className: "text-byg-muted"
                            }, void 0, false, {
                                fileName: "[project]/src/components/modules/bolsa/MesaDiariaTable.tsx",
                                lineNumber: 194,
                                columnNumber: 74
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "text-[12px] font-black text-byg-text",
                                children: g.comitenteNombre
                            }, void 0, false, {
                                fileName: "[project]/src/components/modules/bolsa/MesaDiariaTable.tsx",
                                lineNumber: 195,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "text-[10px] text-byg-muted font-medium",
                                children: [
                                    "# ",
                                    g.nroComitente
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/modules/bolsa/MesaDiariaTable.tsx",
                                lineNumber: 196,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "text-[10px] text-byg-muted font-medium",
                                children: [
                                    "(",
                                    g.ops.length,
                                    " op",
                                    g.ops.length !== 1 ? "s" : "",
                                    ")"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/modules/bolsa/MesaDiariaTable.tsx",
                                lineNumber: 197,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/modules/bolsa/MesaDiariaTable.tsx",
                        lineNumber: 193,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex items-center gap-4 text-[11px] font-mono tabular-nums",
                        children: [
                            g.totalResultadoARS !== 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: g.totalResultadoARS >= 0 ? "text-emerald-400" : "text-red-400",
                                children: [
                                    fmt(g.totalResultadoARS),
                                    " ARS"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/modules/bolsa/MesaDiariaTable.tsx",
                                lineNumber: 201,
                                columnNumber: 13
                            }, this),
                            g.totalResultadoUSD !== 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: g.totalResultadoUSD >= 0 ? "text-emerald-400" : "text-red-400",
                                children: [
                                    fmt(g.totalResultadoUSD),
                                    " USD"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/modules/bolsa/MesaDiariaTable.tsx",
                                lineNumber: 206,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/modules/bolsa/MesaDiariaTable.tsx",
                        lineNumber: 199,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/modules/bolsa/MesaDiariaTable.tsx",
                lineNumber: 188,
                columnNumber: 7
            }, this),
            open && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(OpsTable, {
                ops: g.ops,
                selectedIds: selectedIds,
                onToggle: onToggle
            }, void 0, false, {
                fileName: "[project]/src/components/modules/bolsa/MesaDiariaTable.tsx",
                lineNumber: 212,
                columnNumber: 16
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/modules/bolsa/MesaDiariaTable.tsx",
        lineNumber: 187,
        columnNumber: 5
    }, this);
}
_s1(ClienteGroup, "dVkDIfRb5RN4FjtonjBYYwpg89o=");
_c2 = ClienteGroup;
function MesaDiariaTable({ data }) {
    _s2();
    const [vista, setVista] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("todas");
    const [selectedIds, setSelectedIds] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(new Set());
    const [arbState, arbAction, arbPending] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useActionState"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f28$dashboard$292f$bolsa$2f$data$3a$2915f1__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$text$2f$javascript$3e$__["agruparOperacionesArbitraje"], null);
    const { propias, clientes, resumen } = data;
    const total = resumen.totalPropias + resumen.totalClientes;
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "MesaDiariaTable.useEffect": ()=>{
            if (arbState && "ok" in arbState && arbState.ok) {
                setSelectedIds(new Set());
            }
        }
    }["MesaDiariaTable.useEffect"], [
        arbState
    ]);
    function toggleId(id) {
        setSelectedIds((prev)=>{
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "flex flex-col gap-5",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "grid grid-cols-2 sm:grid-cols-5 gap-3",
                children: [
                    {
                        label: "Res. Mesa ARS",
                        value: fmt(resumen.resultadoMesaARS),
                        color: resumen.resultadoMesaARS >= 0 ? "text-emerald-400" : "text-red-400",
                        top: "border-t-emerald-500"
                    },
                    {
                        label: "Res. Mesa USD",
                        value: fmt(resumen.resultadoMesaUSD),
                        color: resumen.resultadoMesaUSD >= 0 ? "text-emerald-400" : "text-red-400",
                        top: "border-t-emerald-500"
                    },
                    {
                        label: "Propias",
                        value: String(resumen.totalPropias),
                        color: "text-byg-text",
                        top: "border-t-byg-border-2"
                    },
                    {
                        label: "Clientes",
                        value: String(resumen.totalClientes),
                        color: "text-byg-text",
                        top: "border-t-byg-border-2"
                    },
                    {
                        label: "Pend. revisión",
                        value: String(resumen.pendientesRevision),
                        color: resumen.pendientesRevision > 0 ? "text-amber-400" : "text-byg-muted",
                        top: resumen.pendientesRevision > 0 ? "border-t-amber-400" : "border-t-byg-border-2"
                    }
                ].map(({ label, value, color, top })=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: `bg-byg-surface rounded-xl border border-byg-border border-t-[3px] ${top} p-4`,
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-[10px] font-bold uppercase tracking-widest text-byg-muted mb-1",
                                children: label
                            }, void 0, false, {
                                fileName: "[project]/src/components/modules/bolsa/MesaDiariaTable.tsx",
                                lineNumber: 251,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: `text-2xl font-black tabular-nums font-mono tracking-tight ${color}`,
                                children: value
                            }, void 0, false, {
                                fileName: "[project]/src/components/modules/bolsa/MesaDiariaTable.tsx",
                                lineNumber: 252,
                                columnNumber: 13
                            }, this)
                        ]
                    }, label, true, {
                        fileName: "[project]/src/components/modules/bolsa/MesaDiariaTable.tsx",
                        lineNumber: 250,
                        columnNumber: 11
                    }, this))
            }, void 0, false, {
                fileName: "[project]/src/components/modules/bolsa/MesaDiariaTable.tsx",
                lineNumber: 242,
                columnNumber: 7
            }, this),
            total > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex items-center justify-between gap-3 flex-wrap",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex items-center gap-2",
                        children: [
                            "todas",
                            "propias",
                            "clientes"
                        ].map((v)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                type: "button",
                                onClick: ()=>setVista(v),
                                className: `text-[10px] font-black px-3 py-1.5 rounded-lg uppercase tracking-widest transition-colors ${vista === v ? "bg-byg-accent text-white" : "bg-byg-surface border border-byg-border text-byg-muted hover:text-byg-text"}`,
                                children: v === "todas" ? `Todas (${total})` : v === "propias" ? `Propias (${resumen.totalPropias})` : `Clientes (${resumen.totalClientes})`
                            }, v, false, {
                                fileName: "[project]/src/components/modules/bolsa/MesaDiariaTable.tsx",
                                lineNumber: 262,
                                columnNumber: 15
                            }, this))
                    }, void 0, false, {
                        fileName: "[project]/src/components/modules/bolsa/MesaDiariaTable.tsx",
                        lineNumber: 260,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex items-center gap-2",
                        children: [
                            arbState && "ok" in arbState && arbState.ok && selectedIds.size === 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "text-[11px] font-semibold text-violet-400",
                                children: [
                                    "Grupo ARB ",
                                    arbState.grupoId,
                                    " creado"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/modules/bolsa/MesaDiariaTable.tsx",
                                lineNumber: 279,
                                columnNumber: 15
                            }, this),
                            arbState && "error" in arbState && arbState.error && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "text-[11px] font-semibold text-red-400",
                                children: arbState.error
                            }, void 0, false, {
                                fileName: "[project]/src/components/modules/bolsa/MesaDiariaTable.tsx",
                                lineNumber: 284,
                                columnNumber: 15
                            }, this),
                            selectedIds.size >= 2 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("form", {
                                action: arbAction,
                                className: "flex items-center gap-2",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                        type: "hidden",
                                        name: "operationIds",
                                        value: Array.from(selectedIds).join(",")
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/modules/bolsa/MesaDiariaTable.tsx",
                                        lineNumber: 288,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "text-[10px] text-byg-muted font-medium",
                                        children: [
                                            selectedIds.size,
                                            " selec."
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/components/modules/bolsa/MesaDiariaTable.tsx",
                                        lineNumber: 289,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        type: "submit",
                                        disabled: arbPending,
                                        className: "inline-flex items-center gap-1.5 text-[10px] font-black px-3 py-1.5 rounded-lg bg-violet-600 text-white hover:bg-violet-500 disabled:opacity-50 transition-colors uppercase tracking-widest shadow-sm shadow-violet-600/20",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$link$2d$2$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Link2$3e$__["Link2"], {
                                                size: 11
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/modules/bolsa/MesaDiariaTable.tsx",
                                                lineNumber: 295,
                                                columnNumber: 19
                                            }, this),
                                            arbPending ? "Agrupando…" : "Agrupar arbitraje"
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/components/modules/bolsa/MesaDiariaTable.tsx",
                                        lineNumber: 290,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/modules/bolsa/MesaDiariaTable.tsx",
                                lineNumber: 287,
                                columnNumber: 15
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/modules/bolsa/MesaDiariaTable.tsx",
                        lineNumber: 277,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/modules/bolsa/MesaDiariaTable.tsx",
                lineNumber: 259,
                columnNumber: 9
            }, this),
            total === 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "bg-byg-surface rounded-2xl border border-byg-border px-6 py-12 text-center",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                    className: "text-sm text-byg-muted italic",
                    children: "Sin operaciones para esta fecha."
                }, void 0, false, {
                    fileName: "[project]/src/components/modules/bolsa/MesaDiariaTable.tsx",
                    lineNumber: 307,
                    columnNumber: 11
                }, this)
            }, void 0, false, {
                fileName: "[project]/src/components/modules/bolsa/MesaDiariaTable.tsx",
                lineNumber: 306,
                columnNumber: 9
            }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex flex-col gap-3",
                children: [
                    (vista === "todas" || vista === "propias") && propias.map((g)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(PropiaGroup, {
                            g: g,
                            selectedIds: selectedIds,
                            onToggle: toggleId
                        }, g.carteraId, false, {
                            fileName: "[project]/src/components/modules/bolsa/MesaDiariaTable.tsx",
                            lineNumber: 312,
                            columnNumber: 13
                        }, this)),
                    (vista === "todas" || vista === "clientes") && clientes.map((g)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(ClienteGroup, {
                            g: g,
                            selectedIds: selectedIds,
                            onToggle: toggleId
                        }, g.comitenteId, false, {
                            fileName: "[project]/src/components/modules/bolsa/MesaDiariaTable.tsx",
                            lineNumber: 315,
                            columnNumber: 13
                        }, this))
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/modules/bolsa/MesaDiariaTable.tsx",
                lineNumber: 310,
                columnNumber: 9
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/modules/bolsa/MesaDiariaTable.tsx",
        lineNumber: 240,
        columnNumber: 5
    }, this);
}
_s2(MesaDiariaTable, "ESOZL+i1lwle6rHekd8MJw7MaBU=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useActionState"]
    ];
});
_c3 = MesaDiariaTable;
var _c, _c1, _c2, _c3;
__turbopack_context__.k.register(_c, "OpsTable");
__turbopack_context__.k.register(_c1, "PropiaGroup");
__turbopack_context__.k.register(_c2, "ClienteGroup");
__turbopack_context__.k.register(_c3, "MesaDiariaTable");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/src/components/modules/bolsa/BolsaTabla.tsx [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname, k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
__turbopack_context__.s({
    "BolsaTabla": (()=>BolsaTabla)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/client/app-dir/link.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$search$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Search$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/search.js [app-client] (ecmascript) <export default as Search>");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
;
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
const ESTADO_STYLE = {
    PENDIENTE_CONCERTACION: "bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/20",
    CONCERTADA: "bg-byg-accent/10 text-byg-accent ring-1 ring-byg-accent/20",
    LIQUIDADA: "bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20",
    ANULADA: "bg-byg-surface-2 text-byg-muted"
};
const ESTADO_LABEL = {
    PENDIENTE_CONCERTACION: "Pendiente",
    CONCERTADA: "Concertada",
    LIQUIDADA: "Liquidada",
    ANULADA: "Anulada"
};
const ALL_ESTADOS = [
    "PENDIENTE_CONCERTACION",
    "CONCERTADA",
    "LIQUIDADA",
    "ANULADA"
];
const ALL_TIPOS = [
    "COMPRA_BONO",
    "VENTA_BONO",
    "COMPRA_ACCION",
    "VENTA_ACCION",
    "COMPRA_CEDEAR",
    "VENTA_CEDEAR",
    "CAUCION_COLOCADORA",
    "CAUCION_TOMADORA",
    "FUTURO",
    "OPCION_CALL",
    "OPCION_PUT",
    "MEP",
    "SENEBI"
];
function fmtDate(iso) {
    try {
        return new Date(iso).toLocaleDateString("es-AR", {
            day: "2-digit",
            month: "2-digit",
            year: "2-digit"
        });
    } catch  {
        return "—";
    }
}
function fmt(n) {
    return n.toLocaleString("es-AR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}
function BolsaTabla({ rows }) {
    _s();
    const [q, setQ] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("");
    const [estadoFil, setEstadoFil] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("ALL");
    const [tipoFil, setTipoFil] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("ALL");
    const filtered = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "BolsaTabla.useMemo[filtered]": ()=>{
            const ql = q.trim().toLowerCase();
            return rows.filter({
                "BolsaTabla.useMemo[filtered]": (r)=>{
                    if (estadoFil !== "ALL" && r.estado !== estadoFil) return false;
                    if (tipoFil !== "ALL" && r.tipoOperacion !== tipoFil) return false;
                    if (ql && !r.ticker.toLowerCase().includes(ql) && !r.sujeto.toLowerCase().includes(ql) && !(r.operador ?? "").toLowerCase().includes(ql)) return false;
                    return true;
                }
            }["BolsaTabla.useMemo[filtered]"]);
        }
    }["BolsaTabla.useMemo[filtered]"], [
        rows,
        q,
        estadoFil,
        tipoFil
    ]);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "flex flex-col gap-4",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex flex-wrap items-center gap-3",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "relative",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$search$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Search$3e$__["Search"], {
                                size: 13,
                                className: "absolute left-3 top-1/2 -translate-y-1/2 text-byg-muted"
                            }, void 0, false, {
                                fileName: "[project]/src/components/modules/bolsa/BolsaTabla.tsx",
                                lineNumber: 90,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                type: "text",
                                placeholder: "Ticker, cliente…",
                                value: q,
                                onChange: (e)=>setQ(e.target.value),
                                className: "pl-8 pr-3 py-1.5 text-[12px] border border-byg-border rounded-lg bg-byg-bg text-byg-text focus:outline-none focus:ring-1 focus:ring-byg-accent/40 w-48 placeholder:text-byg-muted/50"
                            }, void 0, false, {
                                fileName: "[project]/src/components/modules/bolsa/BolsaTabla.tsx",
                                lineNumber: 91,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/modules/bolsa/BolsaTabla.tsx",
                        lineNumber: 89,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex items-center gap-1",
                        children: [
                            "ALL",
                            ...ALL_ESTADOS
                        ].map((e)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                onClick: ()=>setEstadoFil(e),
                                className: `text-[10px] font-black px-2.5 py-1 rounded-md uppercase tracking-wide transition-colors ${estadoFil === e ? e === "ALL" ? "bg-byg-text text-byg-bg" : ESTADO_STYLE[e] : "bg-byg-surface-2 text-byg-muted hover:bg-byg-border border border-byg-border"}`,
                                children: e === "ALL" ? "Todos" : ESTADO_LABEL[e]
                            }, e, false, {
                                fileName: "[project]/src/components/modules/bolsa/BolsaTabla.tsx",
                                lineNumber: 102,
                                columnNumber: 13
                            }, this))
                    }, void 0, false, {
                        fileName: "[project]/src/components/modules/bolsa/BolsaTabla.tsx",
                        lineNumber: 100,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                        value: tipoFil,
                        onChange: (e)=>setTipoFil(e.target.value),
                        className: "text-[11px] border border-byg-border rounded-lg px-2 py-1.5 bg-byg-bg text-byg-text focus:outline-none focus:ring-1 focus:ring-byg-accent/40",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                value: "ALL",
                                children: "Todos los tipos"
                            }, void 0, false, {
                                fileName: "[project]/src/components/modules/bolsa/BolsaTabla.tsx",
                                lineNumber: 123,
                                columnNumber: 11
                            }, this),
                            ALL_TIPOS.map((t)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                    value: t,
                                    children: TIPO_LABEL[t]
                                }, t, false, {
                                    fileName: "[project]/src/components/modules/bolsa/BolsaTabla.tsx",
                                    lineNumber: 125,
                                    columnNumber: 13
                                }, this))
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/modules/bolsa/BolsaTabla.tsx",
                        lineNumber: 118,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "ml-auto text-[11px] text-byg-muted font-medium tabular-nums",
                        children: [
                            filtered.length,
                            " / ",
                            rows.length
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/modules/bolsa/BolsaTabla.tsx",
                        lineNumber: 129,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/modules/bolsa/BolsaTabla.tsx",
                lineNumber: 88,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "bg-byg-surface rounded-2xl border border-byg-border overflow-hidden",
                children: filtered.length === 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "px-6 py-10 text-center",
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "text-sm text-byg-muted italic",
                        children: "Sin operaciones con esos filtros."
                    }, void 0, false, {
                        fileName: "[project]/src/components/modules/bolsa/BolsaTabla.tsx",
                        lineNumber: 138,
                        columnNumber: 13
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/src/components/modules/bolsa/BolsaTabla.tsx",
                    lineNumber: 137,
                    columnNumber: 11
                }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "overflow-x-auto",
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("table", {
                        className: "w-full text-left border-collapse min-w-[900px]",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("thead", {
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                                    className: "border-b border-byg-border bg-byg-bg",
                                    children: [
                                        "Fecha",
                                        "Sujeto",
                                        "Tipo",
                                        "Ticker",
                                        "Cantidad",
                                        "Precio",
                                        "Mon.",
                                        "Estado",
                                        "Operador",
                                        ""
                                    ].map((h)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                            className: "px-4 py-3 text-[10px] font-black uppercase text-byg-muted tracking-[0.15em] whitespace-nowrap",
                                            children: h
                                        }, h, false, {
                                            fileName: "[project]/src/components/modules/bolsa/BolsaTabla.tsx",
                                            lineNumber: 146,
                                            columnNumber: 21
                                        }, this))
                                }, void 0, false, {
                                    fileName: "[project]/src/components/modules/bolsa/BolsaTabla.tsx",
                                    lineNumber: 144,
                                    columnNumber: 17
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/src/components/modules/bolsa/BolsaTabla.tsx",
                                lineNumber: 143,
                                columnNumber: 15
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tbody", {
                                className: "divide-y divide-byg-border/40",
                                children: filtered.map((r)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                                        className: `hover:bg-byg-surface-2 transition-colors ${r.anulada ? "opacity-40" : ""}`,
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                className: "px-4 py-3 text-[11px] text-byg-muted whitespace-nowrap font-mono",
                                                children: fmtDate(r.fechaCarga)
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/modules/bolsa/BolsaTabla.tsx",
                                                lineNumber: 158,
                                                columnNumber: 21
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                className: "px-4 py-3 text-[12px] font-semibold text-byg-text max-w-[140px] truncate",
                                                children: r.sujeto
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/modules/bolsa/BolsaTabla.tsx",
                                                lineNumber: 161,
                                                columnNumber: 21
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                className: "px-4 py-3 text-[11px] text-byg-muted whitespace-nowrap",
                                                children: TIPO_LABEL[r.tipoOperacion] ?? r.tipoOperacion
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/modules/bolsa/BolsaTabla.tsx",
                                                lineNumber: 164,
                                                columnNumber: 21
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                className: "px-4 py-3",
                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    className: "text-[12px] font-black text-byg-text tracking-tight",
                                                    children: r.ticker
                                                }, void 0, false, {
                                                    fileName: "[project]/src/components/modules/bolsa/BolsaTabla.tsx",
                                                    lineNumber: 168,
                                                    columnNumber: 23
                                                }, this)
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/modules/bolsa/BolsaTabla.tsx",
                                                lineNumber: 167,
                                                columnNumber: 21
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                className: "px-4 py-3 text-[12px] text-right tabular-nums font-mono text-byg-text whitespace-nowrap",
                                                children: fmt(r.cantidad)
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/modules/bolsa/BolsaTabla.tsx",
                                                lineNumber: 170,
                                                columnNumber: 21
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                className: "px-4 py-3 text-[12px] text-right tabular-nums font-mono text-byg-text whitespace-nowrap",
                                                children: fmt(r.precio)
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/modules/bolsa/BolsaTabla.tsx",
                                                lineNumber: 173,
                                                columnNumber: 21
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                className: "px-4 py-3 text-[11px] text-byg-muted",
                                                children: r.moneda
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/modules/bolsa/BolsaTabla.tsx",
                                                lineNumber: 176,
                                                columnNumber: 21
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                className: "px-4 py-3 whitespace-nowrap",
                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    className: `text-[9px] font-black px-2 py-1 rounded-md uppercase tracking-widest ${ESTADO_STYLE[r.estado] ?? "bg-byg-surface-2 text-byg-muted"}`,
                                                    children: ESTADO_LABEL[r.estado] ?? r.estado
                                                }, void 0, false, {
                                                    fileName: "[project]/src/components/modules/bolsa/BolsaTabla.tsx",
                                                    lineNumber: 178,
                                                    columnNumber: 23
                                                }, this)
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/modules/bolsa/BolsaTabla.tsx",
                                                lineNumber: 177,
                                                columnNumber: 21
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                className: "px-4 py-3 text-[11px] text-byg-muted whitespace-nowrap",
                                                children: r.operador
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/modules/bolsa/BolsaTabla.tsx",
                                                lineNumber: 182,
                                                columnNumber: 21
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                className: "px-4 py-3",
                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                                    href: `/bolsa/${r.id}`,
                                                    className: "inline-flex items-center text-[10px] font-black px-2.5 py-1 rounded-lg bg-byg-accent text-white hover:bg-blue-500 transition-colors uppercase tracking-widest shadow-sm shadow-blue-600/20",
                                                    children: "Ver →"
                                                }, void 0, false, {
                                                    fileName: "[project]/src/components/modules/bolsa/BolsaTabla.tsx",
                                                    lineNumber: 186,
                                                    columnNumber: 23
                                                }, this)
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/modules/bolsa/BolsaTabla.tsx",
                                                lineNumber: 185,
                                                columnNumber: 21
                                            }, this)
                                        ]
                                    }, r.id, true, {
                                        fileName: "[project]/src/components/modules/bolsa/BolsaTabla.tsx",
                                        lineNumber: 154,
                                        columnNumber: 19
                                    }, this))
                            }, void 0, false, {
                                fileName: "[project]/src/components/modules/bolsa/BolsaTabla.tsx",
                                lineNumber: 152,
                                columnNumber: 15
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/modules/bolsa/BolsaTabla.tsx",
                        lineNumber: 142,
                        columnNumber: 13
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/src/components/modules/bolsa/BolsaTabla.tsx",
                    lineNumber: 141,
                    columnNumber: 11
                }, this)
            }, void 0, false, {
                fileName: "[project]/src/components/modules/bolsa/BolsaTabla.tsx",
                lineNumber: 135,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/modules/bolsa/BolsaTabla.tsx",
        lineNumber: 86,
        columnNumber: 5
    }, this);
}
_s(BolsaTabla, "xjeV1oimaYHsmeElbGOAHAoPcUk=");
_c = BolsaTabla;
var _c;
__turbopack_context__.k.register(_c, "BolsaTabla");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/src/components/modules/bolsa/TabsNav.tsx [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname, k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
__turbopack_context__.s({
    "TabsNav": (()=>TabsNav)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/navigation.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$layout$2d$grid$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__LayoutGrid$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/layout-grid.js [app-client] (ecmascript) <export default as LayoutGrid>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$history$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__History$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/history.js [app-client] (ecmascript) <export default as History>");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
function TabsNav({ fecha, tab }) {
    _s();
    const router = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRouter"])();
    function goMesa(newFecha) {
        router.push(`/bolsa?tab=mesa&fecha=${newFecha}`);
    }
    function goHistorial() {
        router.push("/bolsa?tab=historial");
    }
    const isMesa = tab !== "historial";
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "flex items-center gap-3 flex-wrap",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex rounded-xl overflow-hidden border border-byg-border text-[11px] font-black uppercase tracking-widest",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        type: "button",
                        onClick: ()=>goMesa(fecha),
                        className: `flex items-center gap-1.5 px-4 py-2 transition-colors ${isMesa ? "bg-byg-accent text-white" : "bg-byg-surface text-byg-muted hover:bg-byg-surface-2"}`,
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$layout$2d$grid$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__LayoutGrid$3e$__["LayoutGrid"], {
                                size: 12
                            }, void 0, false, {
                                fileName: "[project]/src/components/modules/bolsa/TabsNav.tsx",
                                lineNumber: 34,
                                columnNumber: 11
                            }, this),
                            "Mesa diaria"
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/modules/bolsa/TabsNav.tsx",
                        lineNumber: 25,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        type: "button",
                        onClick: goHistorial,
                        className: `flex items-center gap-1.5 px-4 py-2 transition-colors ${!isMesa ? "bg-byg-accent text-white" : "bg-byg-surface text-byg-muted hover:bg-byg-surface-2"}`,
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$history$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__History$3e$__["History"], {
                                size: 12
                            }, void 0, false, {
                                fileName: "[project]/src/components/modules/bolsa/TabsNav.tsx",
                                lineNumber: 46,
                                columnNumber: 11
                            }, this),
                            "Historial"
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/modules/bolsa/TabsNav.tsx",
                        lineNumber: 37,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/modules/bolsa/TabsNav.tsx",
                lineNumber: 24,
                columnNumber: 7
            }, this),
            isMesa && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                type: "date",
                value: fecha,
                onChange: (e)=>e.target.value && goMesa(e.target.value),
                className: "px-3 py-1.5 text-[12px] bg-byg-bg border border-byg-border rounded-lg text-byg-text focus:outline-none focus:ring-1 focus:ring-byg-accent/40"
            }, void 0, false, {
                fileName: "[project]/src/components/modules/bolsa/TabsNav.tsx",
                lineNumber: 53,
                columnNumber: 9
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/modules/bolsa/TabsNav.tsx",
        lineNumber: 22,
        columnNumber: 5
    }, this);
}
_s(TabsNav, "fN7XvhJ+p5oE6+Xlo0NJmXpxjC8=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRouter"]
    ];
});
_c = TabsNav;
var _c;
__turbopack_context__.k.register(_c, "TabsNav");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
}]);

//# sourceMappingURL=src_4a5eb143._.js.map