(globalThis.TURBOPACK = globalThis.TURBOPACK || []).push([typeof document === "object" ? document.currentScript : undefined, {

"[project]/src/app/(dashboard)/bolsa/data:f63862 [app-client] (ecmascript) <text/javascript>": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname, k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
/* __next_internal_action_entry_do_not_use__ [{"60af330acff09f27046538c72d5de4c2db61ff0417":"crearOperacionBolsa"},"src/app/(dashboard)/bolsa/actions.ts",""] */ __turbopack_context__.s({
    "crearOperacionBolsa": (()=>crearOperacionBolsa)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$client$2d$wrapper$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/build/webpack/loaders/next-flight-loader/action-client-wrapper.js [app-client] (ecmascript)");
"use turbopack no side effects";
;
var crearOperacionBolsa = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$client$2d$wrapper$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createServerReference"])("60af330acff09f27046538c72d5de4c2db61ff0417", __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$client$2d$wrapper$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["callServer"], void 0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$client$2d$wrapper$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["findSourceMapURL"], "crearOperacionBolsa"); //# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4vYWN0aW9ucy50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJcInVzZSBzZXJ2ZXJcIjtcblxuaW1wb3J0IHsgYXV0aCB9IGZyb20gXCJAL2F1dGhcIjtcbmltcG9ydCB7IHByaXNtYSB9IGZyb20gXCJAL2xpYi9wcmlzbWFcIjtcbmltcG9ydCB7IHJldmFsaWRhdGVQYXRoIH0gZnJvbSBcIm5leHQvY2FjaGVcIjtcbmltcG9ydCB7IHJlYWRPbmx5UHJldmlldyB9IGZyb20gXCJAL2xpYi9jb25maWdcIjtcbmltcG9ydCB0eXBlIHsgVGlwb09wQm9sc2EsIE1lcmNhZG9Cb2xzYSwgTW9uZWRhIH0gZnJvbSBcIkBwcmlzbWEvY2xpZW50XCI7XG5cbmNvbnN0IFZFTlRBX1RJUE9TID0gbmV3IFNldDxzdHJpbmc+KFtcIlZFTlRBX0JPTk9cIiwgXCJWRU5UQV9BQ0NJT05cIiwgXCJWRU5UQV9DRURFQVJcIiwgXCJDQVVDSU9OX0NPTE9DQURPUkFcIl0pO1xuXG5mdW5jdGlvbiB0b04odjogRm9ybURhdGFFbnRyeVZhbHVlIHwgbnVsbCk6IG51bWJlciB8IG51bGwge1xuICBpZiAoIXYpIHJldHVybiBudWxsO1xuICBjb25zdCBuID0gcGFyc2VGbG9hdCh2IGFzIHN0cmluZyk7XG4gIHJldHVybiBpc05hTihuKSA/IG51bGwgOiBuO1xufVxuXG4vLyDilIDilIAgQ1JFQVIg4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSAXG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBjcmVhck9wZXJhY2lvbkJvbHNhKHByZXZTdGF0ZTogdW5rbm93biwgZm9ybURhdGE6IEZvcm1EYXRhKSB7XG4gIGlmIChyZWFkT25seVByZXZpZXcpIHJldHVybiB7IGVycm9yOiBcIk1vZG8gbGVjdHVyYSBhY3Rpdm9cIiB9O1xuXG4gIGNvbnN0IHNlc3Npb24gPSBhd2FpdCBhdXRoKCk7XG4gIGNvbnN0IHVzZXJJZCA9IHNlc3Npb24/LnVzZXI/LmlkIGFzIHN0cmluZyB8IHVuZGVmaW5lZDtcbiAgaWYgKCF1c2VySWQpIHJldHVybiB7IGVycm9yOiBcIlNpbiBzZXNpw7NuIGFjdGl2YVwiIH07XG5cbiAgY29uc3Qgc3VqZXRvVGlwbyAgICA9IGZvcm1EYXRhLmdldChcInN1amV0b1RpcG9cIikgYXMgc3RyaW5nO1xuICBjb25zdCBjb21pdGVudGVJZCAgID0gKGZvcm1EYXRhLmdldChcImNvbWl0ZW50ZUlkXCIpIGFzIHN0cmluZykgfHwgbnVsbDtcbiAgY29uc3QgY2FydGVyYUlkICAgICA9IChmb3JtRGF0YS5nZXQoXCJjYXJ0ZXJhSWRcIikgYXMgc3RyaW5nKSB8fCBudWxsO1xuICBjb25zdCB0aXBvUmF3ICAgICAgID0gZm9ybURhdGEuZ2V0KFwidGlwb09wZXJhY2lvblwiKSBhcyBzdHJpbmc7XG4gIGNvbnN0IHRpY2tlciAgICAgICAgPSAoZm9ybURhdGEuZ2V0KFwidGlja2VyXCIpIGFzIHN0cmluZyk/LnRyaW0oKS50b1VwcGVyQ2FzZSgpO1xuICBjb25zdCBjYW50aWRhZFJhdyAgID0gZm9ybURhdGEuZ2V0KFwiY2FudGlkYWRcIikgYXMgc3RyaW5nO1xuICBjb25zdCBwcmVjaW9SYXcgICAgID0gZm9ybURhdGEuZ2V0KFwicHJlY2lvXCIpIGFzIHN0cmluZztcbiAgY29uc3QgbW9uZWRhICAgICAgICA9IGZvcm1EYXRhLmdldChcIm1vbmVkYVwiKSBhcyBzdHJpbmc7XG4gIGNvbnN0IG1lcmNhZG8gICAgICAgPSBmb3JtRGF0YS5nZXQoXCJtZXJjYWRvXCIpIGFzIHN0cmluZztcbiAgY29uc3Qgb2JzZXJ2YWNpb25lcyA9IChmb3JtRGF0YS5nZXQoXCJvYnNlcnZhY2lvbmVzXCIpIGFzIHN0cmluZyk/LnRyaW0oKSB8fCBudWxsO1xuXG4gIGlmICghdGlwb1JhdyB8fCAhdGlja2VyIHx8ICFjYW50aWRhZFJhdyB8fCAhcHJlY2lvUmF3IHx8ICFtb25lZGEgfHwgIW1lcmNhZG8pXG4gICAgcmV0dXJuIHsgZXJyb3I6IFwiRmFsdGFuIGNhbXBvcyBvYmxpZ2F0b3Jpb3NcIiB9O1xuICBpZiAoc3VqZXRvVGlwbyA9PT0gXCJjb21pdGVudGVcIiAmJiAhY29taXRlbnRlSWQpXG4gICAgcmV0dXJuIHsgZXJyb3I6IFwiU2VsZWNjaW9uYXIgY29taXRlbnRlXCIgfTtcbiAgaWYgKHN1amV0b1RpcG8gPT09IFwiY2FydGVyYVwiICYmICFjYXJ0ZXJhSWQpXG4gICAgcmV0dXJuIHsgZXJyb3I6IFwiU2VsZWNjaW9uYXIgY2FydGVyYVwiIH07XG5cbiAgY29uc3QgY2FudGlkYWQgPSBwYXJzZUZsb2F0KGNhbnRpZGFkUmF3KTtcbiAgY29uc3QgcHJlY2lvICAgPSBwYXJzZUZsb2F0KHByZWNpb1Jhdyk7XG4gIGlmIChpc05hTihjYW50aWRhZCkgfHwgY2FudGlkYWQgPD0gMCkgcmV0dXJuIHsgZXJyb3I6IFwiQ2FudGlkYWQgaW52w6FsaWRhXCIgfTtcbiAgaWYgKGlzTmFOKHByZWNpbykgICB8fCBwcmVjaW8gICA8PSAwKSByZXR1cm4geyBlcnJvcjogXCJQcmVjaW8gaW52w6FsaWRvXCIgfTtcblxuICB0cnkge1xuICAgIGNvbnN0IG5vdyA9IG5ldyBEYXRlKCk7XG4gICAgY29uc3QgaWQgID0gY3J5cHRvLnJhbmRvbVVVSUQoKTtcblxuICAgIGF3YWl0IHByaXNtYS4kdHJhbnNhY3Rpb24oYXN5bmMgKHR4KSA9PiB7XG4gICAgICBhd2FpdCB0eC5vcGVyYWNpb25Cb2xzYS5jcmVhdGUoe1xuICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgaWQsXG4gICAgICAgICAgY29taXRlbnRlSWQ6ICAgICBzdWpldG9UaXBvID09PSBcImNvbWl0ZW50ZVwiID8gY29taXRlbnRlSWQgOiBudWxsLFxuICAgICAgICAgIGNhcnRlcmFJZDogICAgICAgc3VqZXRvVGlwbyA9PT0gXCJjYXJ0ZXJhXCIgPyBjYXJ0ZXJhSWQgOiBudWxsLFxuICAgICAgICAgIHRpcG9PcGVyYWNpb246ICAgdGlwb1JhdyBhcyBUaXBvT3BCb2xzYSxcbiAgICAgICAgICB0aWNrZXIsXG4gICAgICAgICAgY2FudGlkYWQsXG4gICAgICAgICAgcHJlY2lvLFxuICAgICAgICAgIG1vbmVkYTogICAgICAgICAgbW9uZWRhICBhcyBNb25lZGEsXG4gICAgICAgICAgbWVyY2FkbzogICAgICAgICBtZXJjYWRvIGFzIE1lcmNhZG9Cb2xzYSxcbiAgICAgICAgICBvYnNlcnZhY2lvbmVzLFxuICAgICAgICAgIG9wZXJhZG9yQ2FyZ2FJZDogdXNlcklkLFxuICAgICAgICAgIGVzdGFkbzogICAgICAgICAgXCJQRU5ESUVOVEVfQ09OQ0VSVEFDSU9OXCIsXG4gICAgICAgICAgdXBkYXRlZEF0OiAgICAgICBub3csXG4gICAgICAgIH0sXG4gICAgICB9KTtcbiAgICAgIGF3YWl0IHR4Lm9wZXJhY2lvbkJvbHNhTG9nLmNyZWF0ZSh7XG4gICAgICAgIGRhdGE6IHtcbiAgICAgICAgICBpZDogICAgICAgICAgY3J5cHRvLnJhbmRvbVVVSUQoKSxcbiAgICAgICAgICBvcGVyYWNpb25JZDogaWQsXG4gICAgICAgICAgdXNlcklkLFxuICAgICAgICAgIGFjY2lvbjogICAgICBcIkNBUkdBXCIsXG4gICAgICAgICAgZXN0YWRvTnVldm86IFwiUEVORElFTlRFX0NPTkNFUlRBQ0lPTlwiLFxuICAgICAgICAgIHNuYXBzaG90OiAgICB7IHRpY2tlciwgY2FudGlkYWQsIHByZWNpbywgbW9uZWRhLCBtZXJjYWRvLCB0aXBvT3BlcmFjaW9uOiB0aXBvUmF3IH0sXG4gICAgICAgIH0sXG4gICAgICB9KTtcbiAgICB9KTtcblxuICAgIHJldmFsaWRhdGVQYXRoKFwiL2JvbHNhXCIpO1xuICAgIHJldHVybiB7IG9rOiB0cnVlIGFzIGNvbnN0LCBpZCB9O1xuICB9IGNhdGNoIChlOiB1bmtub3duKSB7XG4gICAgcmV0dXJuIHsgZXJyb3I6IChlIGFzIEVycm9yKS5tZXNzYWdlIHx8IFwiRXJyb3IgYWwgY3JlYXIgb3BlcmFjacOzblwiIH07XG4gIH1cbn1cblxuLy8g4pSA4pSAIENPTkNFUlRBUiDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIBcblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGNvbmNlcnRhck9wZXJhY2lvbihwcmV2U3RhdGU6IHVua25vd24sIGZvcm1EYXRhOiBGb3JtRGF0YSkge1xuICBpZiAocmVhZE9ubHlQcmV2aWV3KSByZXR1cm4geyBlcnJvcjogXCJNb2RvIGxlY3R1cmEgYWN0aXZvXCIgfTtcblxuICBjb25zdCBzZXNzaW9uID0gYXdhaXQgYXV0aCgpO1xuICBjb25zdCB1c2VySWQgID0gc2Vzc2lvbj8udXNlcj8uaWQgYXMgc3RyaW5nIHwgdW5kZWZpbmVkO1xuICBpZiAoIXVzZXJJZCkgcmV0dXJuIHsgZXJyb3I6IFwiU2luIHNlc2nDs24gYWN0aXZhXCIgfTtcblxuICBjb25zdCBvcGVyYWNpb25JZCA9IGZvcm1EYXRhLmdldChcIm9wZXJhY2lvbklkXCIpIGFzIHN0cmluZztcbiAgaWYgKCFvcGVyYWNpb25JZCkgcmV0dXJuIHsgZXJyb3I6IFwiSUQgb3BlcmFjacOzbiByZXF1ZXJpZG9cIiB9O1xuXG4gIGNvbnN0IG9wID0gYXdhaXQgcHJpc21hLm9wZXJhY2lvbkJvbHNhLmZpbmRVbmlxdWUoeyB3aGVyZTogeyBpZDogb3BlcmFjaW9uSWQgfSB9KTtcbiAgaWYgKCFvcCkgcmV0dXJuIHsgZXJyb3I6IFwiT3BlcmFjacOzbiBubyBlbmNvbnRyYWRhXCIgfTtcbiAgaWYgKG9wLmVzdGFkbyA9PT0gXCJBTlVMQURBXCIpICAgcmV0dXJuIHsgZXJyb3I6IFwiT3BlcmFjacOzbiBhbnVsYWRhLCBubyBtb2RpZmljYWJsZVwiIH07XG4gIGlmIChvcC5lc3RhZG8gPT09IFwiTElRVUlEQURBXCIpIHJldHVybiB7IGVycm9yOiBcIk9wZXJhY2nDs24gbGlxdWlkYWRhLCBubyBtb2RpZmljYWJsZVwiIH07XG5cbiAgY29uc3QgbnJvQm9sZXRvICAgICAgICAgPSAoZm9ybURhdGEuZ2V0KFwibnJvQm9sZXRvXCIpICAgYXMgc3RyaW5nKT8udHJpbSgpIHx8IG51bGw7XG4gIGNvbnN0IGFseWMgICAgICAgICAgICAgID0gKGZvcm1EYXRhLmdldChcImFseWNcIikgICAgICAgICBhcyBzdHJpbmcpPy50cmltKCkgfHwgbnVsbDtcbiAgY29uc3QgZmVjaGFDb25jZXJ0UmF3ICAgPSBmb3JtRGF0YS5nZXQoXCJmZWNoYUNvbmNlcnRhY2lvblwiKSAgYXMgc3RyaW5nIHwgbnVsbDtcbiAgY29uc3QgZmVjaGFMaXF1aWRSYXcgICAgPSBmb3JtRGF0YS5nZXQoXCJmZWNoYUxpcXVpZGFjaW9uXCIpICAgYXMgc3RyaW5nIHwgbnVsbDtcbiAgY29uc3QgY29taXNpb25QY3QgICAgICAgPSB0b04oZm9ybURhdGEuZ2V0KFwiY29taXNpb25QY3RcIikpO1xuICBjb25zdCBjb21pc2lvbkZpamEgICAgICA9IHRvTihmb3JtRGF0YS5nZXQoXCJjb21pc2lvbkZpamFcIikpO1xuICBjb25zdCBkZXJlY2hvc01lcmNhZG8gICA9IHRvTihmb3JtRGF0YS5nZXQoXCJkZXJlY2hvc01lcmNhZG9cIikpO1xuICBjb25zdCBnYXN0b3MgICAgICAgICAgICA9IHRvTihmb3JtRGF0YS5nZXQoXCJnYXN0b3NcIikpO1xuICBjb25zdCBpbXB1ZXN0b3MgICAgICAgICA9IHRvTihmb3JtRGF0YS5nZXQoXCJpbXB1ZXN0b3NcIikpO1xuICBjb25zdCB0Y01lcERpYSAgICAgICAgICA9IHRvTihmb3JtRGF0YS5nZXQoXCJ0Y01lcERpYVwiKSk7XG4gIGNvbnN0IGNvbWlzaW9uVVNEICAgICAgID0gdG9OKGZvcm1EYXRhLmdldChcImNvbWlzaW9uVVNEXCIpKTtcbiAgY29uc3Qgc2VuZWJpQnJ1dG8gICAgICAgPSB0b04oZm9ybURhdGEuZ2V0KFwic2VuZWJpQnJ1dG9cIikpO1xuICBjb25zdCBkaWFzQ2F1Y2lvblJhdyAgICA9IGZvcm1EYXRhLmdldChcImRpYXNDYXVjaW9uXCIpIGFzIHN0cmluZyB8IG51bGw7XG4gIGNvbnN0IGRpYXNDYXVjaW9uICAgICAgID0gZGlhc0NhdWNpb25SYXcgPyBwYXJzZUludChkaWFzQ2F1Y2lvblJhdykgOiBudWxsO1xuICBjb25zdCB0YXNhQ2F1Y2lvbiAgICAgICA9IHRvTihmb3JtRGF0YS5nZXQoXCJ0YXNhQ2F1Y2lvblwiKSk7XG5cbiAgLy8gQ2FsY3VsYXRpb25zXG4gIGNvbnN0IGNhbnRpZGFkICAgID0gTnVtYmVyKG9wLmNhbnRpZGFkKTtcbiAgY29uc3QgcHJlY2lvICAgICAgPSBOdW1iZXIob3AucHJlY2lvKTtcbiAgY29uc3QgdmFsb3JCcnV0byAgPSBjYW50aWRhZCAqIHByZWNpbztcbiAgY29uc3QgY29zdG9SZWFsICAgPSAoY29taXNpb25GaWphID8/IDApXG4gICAgKyB2YWxvckJydXRvICogKChjb21pc2lvblBjdCA/PyAwKSAvIDEwMClcbiAgICArIChkZXJlY2hvc01lcmNhZG8gPz8gMClcbiAgICArIChnYXN0b3MgPz8gMClcbiAgICArIChpbXB1ZXN0b3MgPz8gMCk7XG4gIGNvbnN0IGVzVmVudGEgICAgICAgICA9IFZFTlRBX1RJUE9TLmhhcyhvcC50aXBvT3BlcmFjaW9uIGFzIHN0cmluZyk7XG4gIGNvbnN0IG5ldG9MaXF1aWRhZG8gICA9IGVzVmVudGEgPyB2YWxvckJydXRvIC0gY29zdG9SZWFsIDogdmFsb3JCcnV0byArIGNvc3RvUmVhbDtcbiAgY29uc3QgcHJlY2lvUHJvbWVkaW9SZWFsID0gIWVzVmVudGEgJiYgY2FudGlkYWQgPiAwID8gbmV0b0xpcXVpZGFkbyAvIGNhbnRpZGFkIDogbnVsbDtcblxuICB0cnkge1xuICAgIGNvbnN0IG5vdyA9IG5ldyBEYXRlKCk7XG4gICAgYXdhaXQgcHJpc21hLiR0cmFuc2FjdGlvbihhc3luYyAodHgpID0+IHtcbiAgICAgIGF3YWl0IHR4Lm9wZXJhY2lvbkJvbHNhLnVwZGF0ZSh7XG4gICAgICAgIHdoZXJlOiB7IGlkOiBvcGVyYWNpb25JZCB9LFxuICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgZXN0YWRvOiAgICAgICAgICAgXCJDT05DRVJUQURBXCIsXG4gICAgICAgICAgb3BlcmFkb3JDaWVycmVJZDogdXNlcklkLFxuICAgICAgICAgIG5yb0JvbGV0byxcbiAgICAgICAgICBhbHljLFxuICAgICAgICAgIGZlY2hhQ29uY2VydGFjaW9uOiAgZmVjaGFDb25jZXJ0UmF3ICA/IG5ldyBEYXRlKGZlY2hhQ29uY2VydFJhdykgIDogbnVsbCxcbiAgICAgICAgICBmZWNoYUxpcXVpZGFjaW9uOiAgIGZlY2hhTGlxdWlkUmF3ICAgPyBuZXcgRGF0ZShmZWNoYUxpcXVpZFJhdykgICA6IG51bGwsXG4gICAgICAgICAgY29taXNpb25QY3QsXG4gICAgICAgICAgY29taXNpb25GaWphLFxuICAgICAgICAgIGRlcmVjaG9zTWVyY2FkbyxcbiAgICAgICAgICBnYXN0b3MsXG4gICAgICAgICAgaW1wdWVzdG9zLFxuICAgICAgICAgIHRjTWVwRGlhLFxuICAgICAgICAgIGNvbWlzaW9uVVNELFxuICAgICAgICAgIHNlbmViaUJydXRvLFxuICAgICAgICAgIGRpYXNDYXVjaW9uOiAgICAgICAgaXNOYU4oZGlhc0NhdWNpb24gYXMgbnVtYmVyKSA/IG51bGwgOiBkaWFzQ2F1Y2lvbixcbiAgICAgICAgICB0YXNhQ2F1Y2lvbixcbiAgICAgICAgICBjb3N0b1JlYWwsXG4gICAgICAgICAgbmV0b0xpcXVpZGFkbyxcbiAgICAgICAgICBwcmVjaW9Qcm9tZWRpb1JlYWwsXG4gICAgICAgICAgdXBkYXRlZEF0OiAgICAgICAgICBub3csXG4gICAgICAgIH0sXG4gICAgICB9KTtcbiAgICAgIGF3YWl0IHR4Lm9wZXJhY2lvbkJvbHNhTG9nLmNyZWF0ZSh7XG4gICAgICAgIGRhdGE6IHtcbiAgICAgICAgICBpZDogICAgICAgICAgICBjcnlwdG8ucmFuZG9tVVVJRCgpLFxuICAgICAgICAgIG9wZXJhY2lvbklkLFxuICAgICAgICAgIHVzZXJJZCxcbiAgICAgICAgICBhY2Npb246ICAgICAgICBcIkNPTkNFUlRBQ0lPTlwiLFxuICAgICAgICAgIGVzdGFkb0FudGVyaW9yOiBvcC5lc3RhZG8sXG4gICAgICAgICAgZXN0YWRvTnVldm86ICAgXCJDT05DRVJUQURBXCIsXG4gICAgICAgICAgc25hcHNob3Q6ICAgICAgeyBucm9Cb2xldG8sIGFseWMsIGNvc3RvUmVhbCwgbmV0b0xpcXVpZGFkbywgcHJlY2lvUHJvbWVkaW9SZWFsIH0sXG4gICAgICAgIH0sXG4gICAgICB9KTtcbiAgICB9KTtcblxuICAgIHJldmFsaWRhdGVQYXRoKFwiL2JvbHNhXCIpO1xuICAgIHJldmFsaWRhdGVQYXRoKGAvYm9sc2EvJHtvcGVyYWNpb25JZH1gKTtcbiAgICByZXR1cm4geyBvazogdHJ1ZSBhcyBjb25zdCB9O1xuICB9IGNhdGNoIChlOiB1bmtub3duKSB7XG4gICAgcmV0dXJuIHsgZXJyb3I6IChlIGFzIEVycm9yKS5tZXNzYWdlIHx8IFwiRXJyb3IgYWwgY29uY2VydGFyIG9wZXJhY2nDs25cIiB9O1xuICB9XG59XG5cbi8vIOKUgOKUgCBDUkVBUiAoTWVzYSBEaWFyaWEpIOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgFxuXG5jb25zdCBDQVVDSU9OX1RJUE9TID0gbmV3IFNldDxzdHJpbmc+KFtcIkNBVUNJT05fQ09MT0NBRE9SQVwiLCBcIkNBVUNJT05fVE9NQURPUkFcIl0pO1xuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gY3JlYXJPcE1lc2FEaWFyaWEoX3ByZXZTdGF0ZTogdW5rbm93biwgZm9ybURhdGE6IEZvcm1EYXRhKSB7XG4gIGlmIChyZWFkT25seVByZXZpZXcpIHJldHVybiB7IGVycm9yOiBcIk1vZG8gbGVjdHVyYSBhY3Rpdm9cIiB9O1xuXG4gIGNvbnN0IHNlc3Npb24gPSBhd2FpdCBhdXRoKCk7XG4gIGNvbnN0IHVzZXJJZCAgPSBzZXNzaW9uPy51c2VyPy5pZCBhcyBzdHJpbmcgfCB1bmRlZmluZWQ7XG4gIGlmICghdXNlcklkKSByZXR1cm4geyBlcnJvcjogXCJTaW4gc2VzacOzbiBhY3RpdmFcIiB9O1xuXG4gIGNvbnN0IHN1amV0b1RpcG8gICAgPSBmb3JtRGF0YS5nZXQoXCJzdWpldG9UaXBvXCIpIGFzIHN0cmluZztcbiAgY29uc3QgY29taXRlbnRlSWQgICA9IChmb3JtRGF0YS5nZXQoXCJjb21pdGVudGVJZFwiKSBhcyBzdHJpbmcpIHx8IG51bGw7XG4gIGNvbnN0IGNhcnRlcmFJZCAgICAgPSAoZm9ybURhdGEuZ2V0KFwiY2FydGVyYUlkXCIpICAgYXMgc3RyaW5nKSB8fCBudWxsO1xuICBjb25zdCB0aXBvUmF3ICAgICAgID0gZm9ybURhdGEuZ2V0KFwidGlwb09wZXJhY2lvblwiKSBhcyBzdHJpbmc7XG4gIGNvbnN0IHRpY2tlclJhdyAgICAgPSAoKGZvcm1EYXRhLmdldChcInRpY2tlclwiKSBhcyBzdHJpbmcpIHx8IFwiXCIpLnRyaW0oKS50b1VwcGVyQ2FzZSgpO1xuICBjb25zdCBjYW50aWRhZFJhdyAgID0gZm9ybURhdGEuZ2V0KFwiY2FudGlkYWRcIikgIGFzIHN0cmluZztcbiAgY29uc3QgcHJlY2lvUmF3ICAgICA9IGZvcm1EYXRhLmdldChcInByZWNpb1wiKSAgICBhcyBzdHJpbmc7XG4gIGNvbnN0IG1vbmVkYSAgICAgICAgPSBmb3JtRGF0YS5nZXQoXCJtb25lZGFcIikgICAgYXMgc3RyaW5nO1xuICBjb25zdCBtZXJjYWRvICAgICAgID0gZm9ybURhdGEuZ2V0KFwibWVyY2Fkb1wiKSAgIGFzIHN0cmluZztcbiAgY29uc3QgZmVjaGFPcFJhdyAgICA9IGZvcm1EYXRhLmdldChcImZlY2hhT3BlcmF0aXZhXCIpIGFzIHN0cmluZztcbiAgY29uc3Qgb2JzZXJ2YWNpb25lcyA9ICgoZm9ybURhdGEuZ2V0KFwib2JzZXJ2YWNpb25lc1wiKSBhcyBzdHJpbmcpIHx8IFwiXCIpLnRyaW0oKSB8fCBudWxsO1xuXG4gIGNvbnN0IHJlc3VsdGFkb0JydXRvID0gdG9OKGZvcm1EYXRhLmdldChcInJlc3VsdGFkb0JydXRvXCIpKTtcbiAgY29uc3QgcmVzdWx0YWRvTmV0byAgPSB0b04oZm9ybURhdGEuZ2V0KFwicmVzdWx0YWRvTmV0b1wiKSk7XG4gIGNvbnN0IHRjTWVwRGlhICAgICAgID0gdG9OKGZvcm1EYXRhLmdldChcInRjTWVwRGlhXCIpKTtcbiAgY29uc3QgdGFzYUNhdWNpb24gICAgPSB0b04oZm9ybURhdGEuZ2V0KFwidGFzYUNhdWNpb25cIikpO1xuICBjb25zdCBkaWFzUmF3ICAgICAgICA9IGZvcm1EYXRhLmdldChcImRpYXNDYXVjaW9uXCIpIGFzIHN0cmluZyB8IG51bGw7XG4gIGNvbnN0IGRpYXNDYXVjaW9uICAgID0gZGlhc1JhdyA/IHBhcnNlSW50KGRpYXNSYXcpIDogbnVsbDtcblxuICBpZiAoIXRpcG9SYXcgfHwgIWNhbnRpZGFkUmF3IHx8ICFwcmVjaW9SYXcgfHwgIW1vbmVkYSB8fCAhbWVyY2FkbylcbiAgICByZXR1cm4geyBlcnJvcjogXCJGYWx0YW4gY2FtcG9zIG9ibGlnYXRvcmlvc1wiIH07XG4gIGlmIChzdWpldG9UaXBvID09PSBcImNvbWl0ZW50ZVwiICYmICFjb21pdGVudGVJZClcbiAgICByZXR1cm4geyBlcnJvcjogXCJTZWxlY2Npb25hciBjb21pdGVudGVcIiB9O1xuICBpZiAoc3VqZXRvVGlwbyA9PT0gXCJjYXJ0ZXJhXCIgJiYgIWNhcnRlcmFJZClcbiAgICByZXR1cm4geyBlcnJvcjogXCJTZWxlY2Npb25hciBjYXJ0ZXJhXCIgfTtcblxuICBjb25zdCB0aWNrZXIgPSB0aWNrZXJSYXcgfHwgKENBVUNJT05fVElQT1MuaGFzKHRpcG9SYXcpID8gXCJDQVVDSU9OXCIgOiBcIlwiKTtcbiAgaWYgKCF0aWNrZXIpIHJldHVybiB7IGVycm9yOiBcIlRpY2tlciByZXF1ZXJpZG8gcGFyYSBlc3RlIHRpcG8gZGUgb3BlcmFjacOzblwiIH07XG5cbiAgY29uc3QgY2FudGlkYWQgPSBwYXJzZUZsb2F0KGNhbnRpZGFkUmF3KTtcbiAgY29uc3QgcHJlY2lvICAgPSBwYXJzZUZsb2F0KHByZWNpb1Jhdyk7XG4gIGlmIChpc05hTihjYW50aWRhZCkgfHwgY2FudGlkYWQgPD0gMCkgcmV0dXJuIHsgZXJyb3I6IFwiQ2FudGlkYWQgaW52w6FsaWRhXCIgfTtcbiAgaWYgKGlzTmFOKHByZWNpbykgICB8fCBwcmVjaW8gICA8PSAwKSByZXR1cm4geyBlcnJvcjogXCJQcmVjaW8gaW52w6FsaWRvXCIgfTtcblxuICBjb25zdCBmZWNoYU9wZXJhdGl2YSA9IGZlY2hhT3BSYXcgPyBuZXcgRGF0ZShmZWNoYU9wUmF3ICsgXCJUMDA6MDA6MDAuMDAwWlwiKSA6IG51bGw7XG5cbiAgdHJ5IHtcbiAgICBjb25zdCBub3cgPSBuZXcgRGF0ZSgpO1xuICAgIGNvbnN0IGlkICA9IGNyeXB0by5yYW5kb21VVUlEKCk7XG5cbiAgICBhd2FpdCBwcmlzbWEuJHRyYW5zYWN0aW9uKGFzeW5jICh0eCkgPT4ge1xuICAgICAgYXdhaXQgdHgub3BlcmFjaW9uQm9sc2EuY3JlYXRlKHtcbiAgICAgICAgZGF0YToge1xuICAgICAgICAgIGlkLFxuICAgICAgICAgIGNvbWl0ZW50ZUlkOiAgICAgc3VqZXRvVGlwbyA9PT0gXCJjb21pdGVudGVcIiA/IGNvbWl0ZW50ZUlkIDogbnVsbCxcbiAgICAgICAgICBjYXJ0ZXJhSWQ6ICAgICAgIHN1amV0b1RpcG8gPT09IFwiY2FydGVyYVwiICAgPyBjYXJ0ZXJhSWQgICA6IG51bGwsXG4gICAgICAgICAgdGlwb09wZXJhY2lvbjogICB0aXBvUmF3IGFzIFRpcG9PcEJvbHNhLFxuICAgICAgICAgIHRpY2tlcixcbiAgICAgICAgICBjYW50aWRhZCxcbiAgICAgICAgICBwcmVjaW8sXG4gICAgICAgICAgbW9uZWRhOiAgICAgICAgICBtb25lZGEgIGFzIE1vbmVkYSxcbiAgICAgICAgICBtZXJjYWRvOiAgICAgICAgIG1lcmNhZG8gYXMgTWVyY2Fkb0JvbHNhLFxuICAgICAgICAgIG9ic2VydmFjaW9uZXMsXG4gICAgICAgICAgb3BlcmFkb3JDYXJnYUlkOiB1c2VySWQsXG4gICAgICAgICAgZXN0YWRvOiAgICAgICAgICBcIlBFTkRJRU5URV9DT05DRVJUQUNJT05cIixcbiAgICAgICAgICBmZWNoYU9wZXJhdGl2YSxcbiAgICAgICAgICByZXN1bHRhZG9CcnV0byxcbiAgICAgICAgICByZXN1bHRhZG9OZXRvLFxuICAgICAgICAgIHRjTWVwRGlhLFxuICAgICAgICAgIHRhc2FDYXVjaW9uLFxuICAgICAgICAgIGRpYXNDYXVjaW9uOiAgICAgZGlhc0NhdWNpb24gIT09IG51bGwgJiYgIWlzTmFOKGRpYXNDYXVjaW9uKSA/IGRpYXNDYXVjaW9uIDogbnVsbCxcbiAgICAgICAgICB1cGRhdGVkQXQ6ICAgICAgIG5vdyxcbiAgICAgICAgfSxcbiAgICAgIH0pO1xuICAgICAgYXdhaXQgdHgub3BlcmFjaW9uQm9sc2FMb2cuY3JlYXRlKHtcbiAgICAgICAgZGF0YToge1xuICAgICAgICAgIGlkOiAgICAgICAgICBjcnlwdG8ucmFuZG9tVVVJRCgpLFxuICAgICAgICAgIG9wZXJhY2lvbklkOiBpZCxcbiAgICAgICAgICB1c2VySWQsXG4gICAgICAgICAgYWNjaW9uOiAgICAgIFwiQ0FSR0FcIixcbiAgICAgICAgICBlc3RhZG9OdWV2bzogXCJQRU5ESUVOVEVfQ09OQ0VSVEFDSU9OXCIsXG4gICAgICAgICAgc25hcHNob3Q6ICAgIHsgdGlja2VyLCBjYW50aWRhZCwgcHJlY2lvLCBtb25lZGEsIG1lcmNhZG8sIHRpcG9PcGVyYWNpb246IHRpcG9SYXcsIHJlc3VsdGFkb0JydXRvLCByZXN1bHRhZG9OZXRvIH0sXG4gICAgICAgIH0sXG4gICAgICB9KTtcbiAgICB9KTtcblxuICAgIHJldmFsaWRhdGVQYXRoKFwiL2JvbHNhXCIpO1xuICAgIHJldHVybiB7IG9rOiB0cnVlIGFzIGNvbnN0LCBpZCB9O1xuICB9IGNhdGNoIChlOiB1bmtub3duKSB7XG4gICAgcmV0dXJuIHsgZXJyb3I6IChlIGFzIEVycm9yKS5tZXNzYWdlIHx8IFwiRXJyb3IgYWwgY3JlYXIgb3BlcmFjacOzblwiIH07XG4gIH1cbn1cblxuLy8g4pSA4pSAIEFOVUxBUiDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIBcblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGFudWxhck9wZXJhY2lvbihwcmV2U3RhdGU6IHVua25vd24sIGZvcm1EYXRhOiBGb3JtRGF0YSkge1xuICBpZiAocmVhZE9ubHlQcmV2aWV3KSByZXR1cm4geyBlcnJvcjogXCJNb2RvIGxlY3R1cmEgYWN0aXZvXCIgfTtcblxuICBjb25zdCBzZXNzaW9uID0gYXdhaXQgYXV0aCgpO1xuICBjb25zdCB1c2VySWQgID0gc2Vzc2lvbj8udXNlcj8uaWQgYXMgc3RyaW5nIHwgdW5kZWZpbmVkO1xuICBpZiAoIXVzZXJJZCkgcmV0dXJuIHsgZXJyb3I6IFwiU2luIHNlc2nDs24gYWN0aXZhXCIgfTtcblxuICBjb25zdCBvcGVyYWNpb25JZCAgICAgID0gZm9ybURhdGEuZ2V0KFwib3BlcmFjaW9uSWRcIikgICAgICBhcyBzdHJpbmc7XG4gIGNvbnN0IG1vdGl2b0FudWxhY2lvbiAgPSAoZm9ybURhdGEuZ2V0KFwibW90aXZvQW51bGFjaW9uXCIpIGFzIHN0cmluZyk/LnRyaW0oKTtcblxuICBpZiAoIW9wZXJhY2lvbklkKSAgICAgcmV0dXJuIHsgZXJyb3I6IFwiSUQgb3BlcmFjacOzbiByZXF1ZXJpZG9cIiB9O1xuICBpZiAoIW1vdGl2b0FudWxhY2lvbikgcmV0dXJuIHsgZXJyb3I6IFwiRWwgbW90aXZvIGRlIGFudWxhY2nDs24gZXMgb2JsaWdhdG9yaW9cIiB9O1xuXG4gIGNvbnN0IG9wID0gYXdhaXQgcHJpc21hLm9wZXJhY2lvbkJvbHNhLmZpbmRVbmlxdWUoeyB3aGVyZTogeyBpZDogb3BlcmFjaW9uSWQgfSB9KTtcbiAgaWYgKCFvcCkgICAgICAgIHJldHVybiB7IGVycm9yOiBcIk9wZXJhY2nDs24gbm8gZW5jb250cmFkYVwiIH07XG4gIGlmIChvcC5hbnVsYWRhKSByZXR1cm4geyBlcnJvcjogXCJPcGVyYWNpw7NuIHlhIGFudWxhZGFcIiB9O1xuXG4gIHRyeSB7XG4gICAgY29uc3Qgbm93ID0gbmV3IERhdGUoKTtcbiAgICBhd2FpdCBwcmlzbWEuJHRyYW5zYWN0aW9uKGFzeW5jICh0eCkgPT4ge1xuICAgICAgYXdhaXQgdHgub3BlcmFjaW9uQm9sc2EudXBkYXRlKHtcbiAgICAgICAgd2hlcmU6IHsgaWQ6IG9wZXJhY2lvbklkIH0sXG4gICAgICAgIGRhdGE6IHsgZXN0YWRvOiBcIkFOVUxBREFcIiwgYW51bGFkYTogdHJ1ZSwgbW90aXZvQW51bGFjaW9uLCB1cGRhdGVkQXQ6IG5vdyB9LFxuICAgICAgfSk7XG4gICAgICBhd2FpdCB0eC5vcGVyYWNpb25Cb2xzYUxvZy5jcmVhdGUoe1xuICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgaWQ6ICAgICAgICAgICAgY3J5cHRvLnJhbmRvbVVVSUQoKSxcbiAgICAgICAgICBvcGVyYWNpb25JZCxcbiAgICAgICAgICB1c2VySWQsXG4gICAgICAgICAgYWNjaW9uOiAgICAgICAgXCJBTlVMQUNJT05cIixcbiAgICAgICAgICBlc3RhZG9BbnRlcmlvcjogb3AuZXN0YWRvLFxuICAgICAgICAgIGVzdGFkb051ZXZvOiAgIFwiQU5VTEFEQVwiLFxuICAgICAgICAgIHNuYXBzaG90OiAgICAgIHsgbW90aXZvQW51bGFjaW9uIH0sXG4gICAgICAgIH0sXG4gICAgICB9KTtcbiAgICB9KTtcblxuICAgIHJldmFsaWRhdGVQYXRoKFwiL2JvbHNhXCIpO1xuICAgIHJldmFsaWRhdGVQYXRoKGAvYm9sc2EvJHtvcGVyYWNpb25JZH1gKTtcbiAgICByZXR1cm4geyBvazogdHJ1ZSBhcyBjb25zdCB9O1xuICB9IGNhdGNoIChlOiB1bmtub3duKSB7XG4gICAgcmV0dXJuIHsgZXJyb3I6IChlIGFzIEVycm9yKS5tZXNzYWdlIHx8IFwiRXJyb3IgYWwgYW51bGFyIG9wZXJhY2nDs25cIiB9O1xuICB9XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6ImlUQWtCc0IifQ==
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/src/components/modules/bolsa/NuevaOpForm.tsx [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname, k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
__turbopack_context__.s({
    "NuevaOpForm": (()=>NuevaOpForm)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f28$dashboard$292f$bolsa$2f$data$3a$f63862__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$text$2f$javascript$3e$__ = __turbopack_context__.i("[project]/src/app/(dashboard)/bolsa/data:f63862 [app-client] (ecmascript) <text/javascript>");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
const TIPOS = [
    {
        value: "COMPRA_BONO",
        label: "Compra Bono"
    },
    {
        value: "VENTA_BONO",
        label: "Venta Bono"
    },
    {
        value: "COMPRA_ACCION",
        label: "Compra Acción"
    },
    {
        value: "VENTA_ACCION",
        label: "Venta Acción"
    },
    {
        value: "COMPRA_CEDEAR",
        label: "Compra CEDEAR"
    },
    {
        value: "VENTA_CEDEAR",
        label: "Venta CEDEAR"
    },
    {
        value: "CAUCION_COLOCADORA",
        label: "Caución Colocadora"
    },
    {
        value: "CAUCION_TOMADORA",
        label: "Caución Tomadora"
    },
    {
        value: "FUTURO",
        label: "Futuro"
    },
    {
        value: "OPCION_CALL",
        label: "Opción Call"
    },
    {
        value: "OPCION_PUT",
        label: "Opción Put"
    },
    {
        value: "MEP",
        label: "MEP"
    },
    {
        value: "SENEBI",
        label: "SENEBI"
    }
];
const MONEDAS = [
    "ARS",
    "USD",
    "EUR",
    "BRL"
];
const MERCADOS = [
    {
        value: "BYMA",
        label: "BYMA"
    },
    {
        value: "MAE",
        label: "MAE"
    },
    {
        value: "SENEBI_OTC",
        label: "SENEBI OTC"
    },
    {
        value: "MATBA_ROFEX",
        label: "MATBA-ROFEX"
    },
    {
        value: "OTC",
        label: "OTC"
    }
];
const INPUT_CLS = "w-full px-3 py-2 text-[12px] border border-byg-border rounded-lg bg-byg-bg focus:outline-none focus:ring-1 focus:ring-byg-accent/40 text-byg-text [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none";
const LABEL_CLS = "block text-[10px] font-black uppercase tracking-widest text-byg-muted mb-1";
function NuevaOpForm({ comitentes, carteras, tickers }) {
    _s();
    const [sujetoTipo, setSujetoTipo] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("comitente");
    const [state, action, pending] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useActionState"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f28$dashboard$292f$bolsa$2f$data$3a$f63862__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$text$2f$javascript$3e$__["crearOperacionBolsa"], null);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "NuevaOpForm.useEffect": ()=>{
            if (state && "ok" in state && state.ok && state.id) {
                window.location.href = `/bolsa/${state.id}`;
            }
        }
    }["NuevaOpForm.useEffect"], [
        state
    ]);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "bg-byg-surface rounded-2xl border border-byg-border p-6",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                className: "text-[11px] font-black uppercase tracking-widest text-byg-muted mb-5",
                children: "Nueva Operación"
            }, void 0, false, {
                fileName: "[project]/src/components/modules/bolsa/NuevaOpForm.tsx",
                lineNumber: 55,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("form", {
                action: action,
                className: "flex flex-col gap-4",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: LABEL_CLS,
                                children: "Cuenta"
                            }, void 0, false, {
                                fileName: "[project]/src/components/modules/bolsa/NuevaOpForm.tsx",
                                lineNumber: 62,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex gap-3",
                                children: [
                                    "comitente",
                                    "cartera"
                                ].map((t)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                        className: "flex items-center gap-1.5 cursor-pointer",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                type: "radio",
                                                name: "sujetoTipo",
                                                value: t,
                                                checked: sujetoTipo === t,
                                                onChange: ()=>setSujetoTipo(t),
                                                className: "accent-blue-600"
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/modules/bolsa/NuevaOpForm.tsx",
                                                lineNumber: 66,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "text-[12px] font-semibold text-byg-text capitalize",
                                                children: t === "comitente" ? "Comitente" : "Cartera Propia"
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/modules/bolsa/NuevaOpForm.tsx",
                                                lineNumber: 74,
                                                columnNumber: 17
                                            }, this)
                                        ]
                                    }, t, true, {
                                        fileName: "[project]/src/components/modules/bolsa/NuevaOpForm.tsx",
                                        lineNumber: 65,
                                        columnNumber: 15
                                    }, this))
                            }, void 0, false, {
                                fileName: "[project]/src/components/modules/bolsa/NuevaOpForm.tsx",
                                lineNumber: 63,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/modules/bolsa/NuevaOpForm.tsx",
                        lineNumber: 61,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                className: LABEL_CLS,
                                children: sujetoTipo === "comitente" ? "Comitente / Cuenta de Inversión" : "Cartera"
                            }, void 0, false, {
                                fileName: "[project]/src/components/modules/bolsa/NuevaOpForm.tsx",
                                lineNumber: 84,
                                columnNumber: 11
                            }, this),
                            sujetoTipo === "comitente" ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                name: "comitenteId",
                                required: true,
                                className: INPUT_CLS,
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                        value: "",
                                        children: "— Seleccionar comitente —"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/modules/bolsa/NuevaOpForm.tsx",
                                        lineNumber: 89,
                                        columnNumber: 15
                                    }, this),
                                    comitentes.map((c)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                            value: c.id,
                                            children: c.nombre
                                        }, c.id, false, {
                                            fileName: "[project]/src/components/modules/bolsa/NuevaOpForm.tsx",
                                            lineNumber: 91,
                                            columnNumber: 17
                                        }, this))
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/modules/bolsa/NuevaOpForm.tsx",
                                lineNumber: 88,
                                columnNumber: 13
                            }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                name: "carteraId",
                                required: true,
                                className: INPUT_CLS,
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                        value: "",
                                        children: "— Seleccionar cartera —"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/modules/bolsa/NuevaOpForm.tsx",
                                        lineNumber: 96,
                                        columnNumber: 15
                                    }, this),
                                    carteras.map((c)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                            value: c.id,
                                            children: c.nombre
                                        }, c.id, false, {
                                            fileName: "[project]/src/components/modules/bolsa/NuevaOpForm.tsx",
                                            lineNumber: 98,
                                            columnNumber: 17
                                        }, this))
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/modules/bolsa/NuevaOpForm.tsx",
                                lineNumber: 95,
                                columnNumber: 13
                            }, this),
                            sujetoTipo === "comitente" ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                type: "hidden",
                                name: "carteraId",
                                value: ""
                            }, void 0, false, {
                                fileName: "[project]/src/components/modules/bolsa/NuevaOpForm.tsx",
                                lineNumber: 104,
                                columnNumber: 15
                            }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                type: "hidden",
                                name: "comitenteId",
                                value: ""
                            }, void 0, false, {
                                fileName: "[project]/src/components/modules/bolsa/NuevaOpForm.tsx",
                                lineNumber: 105,
                                columnNumber: 15
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/modules/bolsa/NuevaOpForm.tsx",
                        lineNumber: 83,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "grid grid-cols-2 gap-3",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                        className: LABEL_CLS,
                                        children: "Tipo Operación"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/modules/bolsa/NuevaOpForm.tsx",
                                        lineNumber: 111,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                        name: "tipoOperacion",
                                        required: true,
                                        className: INPUT_CLS,
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                value: "",
                                                children: "— Tipo —"
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/modules/bolsa/NuevaOpForm.tsx",
                                                lineNumber: 113,
                                                columnNumber: 15
                                            }, this),
                                            TIPOS.map((t)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                    value: t.value,
                                                    children: t.label
                                                }, t.value, false, {
                                                    fileName: "[project]/src/components/modules/bolsa/NuevaOpForm.tsx",
                                                    lineNumber: 115,
                                                    columnNumber: 17
                                                }, this))
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/components/modules/bolsa/NuevaOpForm.tsx",
                                        lineNumber: 112,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/modules/bolsa/NuevaOpForm.tsx",
                                lineNumber: 110,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                        className: LABEL_CLS,
                                        children: "Ticker"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/modules/bolsa/NuevaOpForm.tsx",
                                        lineNumber: 120,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                        type: "text",
                                        name: "ticker",
                                        list: "ticker-datalist",
                                        required: true,
                                        placeholder: "AL30, GGAL…",
                                        className: INPUT_CLS,
                                        style: {
                                            textTransform: "uppercase"
                                        }
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/modules/bolsa/NuevaOpForm.tsx",
                                        lineNumber: 121,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("datalist", {
                                        id: "ticker-datalist",
                                        children: tickers.map((t)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                value: t
                                            }, t, false, {
                                                fileName: "[project]/src/components/modules/bolsa/NuevaOpForm.tsx",
                                                lineNumber: 131,
                                                columnNumber: 35
                                            }, this))
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/modules/bolsa/NuevaOpForm.tsx",
                                        lineNumber: 130,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/modules/bolsa/NuevaOpForm.tsx",
                                lineNumber: 119,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/modules/bolsa/NuevaOpForm.tsx",
                        lineNumber: 109,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "grid grid-cols-2 gap-3",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                        className: LABEL_CLS,
                                        children: "Cantidad"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/modules/bolsa/NuevaOpForm.tsx",
                                        lineNumber: 139,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                        type: "number",
                                        name: "cantidad",
                                        required: true,
                                        min: "0",
                                        step: "any",
                                        placeholder: "0",
                                        className: INPUT_CLS
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/modules/bolsa/NuevaOpForm.tsx",
                                        lineNumber: 140,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/modules/bolsa/NuevaOpForm.tsx",
                                lineNumber: 138,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                        className: LABEL_CLS,
                                        children: "Precio"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/modules/bolsa/NuevaOpForm.tsx",
                                        lineNumber: 151,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                        type: "number",
                                        name: "precio",
                                        required: true,
                                        min: "0",
                                        step: "any",
                                        placeholder: "0.00",
                                        className: INPUT_CLS
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/modules/bolsa/NuevaOpForm.tsx",
                                        lineNumber: 152,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/modules/bolsa/NuevaOpForm.tsx",
                                lineNumber: 150,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/modules/bolsa/NuevaOpForm.tsx",
                        lineNumber: 137,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "grid grid-cols-2 gap-3",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                        className: LABEL_CLS,
                                        children: "Moneda"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/modules/bolsa/NuevaOpForm.tsx",
                                        lineNumber: 167,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                        name: "moneda",
                                        required: true,
                                        className: INPUT_CLS,
                                        children: MONEDAS.map((m)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                value: m,
                                                children: m
                                            }, m, false, {
                                                fileName: "[project]/src/components/modules/bolsa/NuevaOpForm.tsx",
                                                lineNumber: 169,
                                                columnNumber: 35
                                            }, this))
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/modules/bolsa/NuevaOpForm.tsx",
                                        lineNumber: 168,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/modules/bolsa/NuevaOpForm.tsx",
                                lineNumber: 166,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                        className: LABEL_CLS,
                                        children: "Mercado"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/modules/bolsa/NuevaOpForm.tsx",
                                        lineNumber: 173,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                        name: "mercado",
                                        required: true,
                                        className: INPUT_CLS,
                                        children: MERCADOS.map((m)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                value: m.value,
                                                children: m.label
                                            }, m.value, false, {
                                                fileName: "[project]/src/components/modules/bolsa/NuevaOpForm.tsx",
                                                lineNumber: 176,
                                                columnNumber: 17
                                            }, this))
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/modules/bolsa/NuevaOpForm.tsx",
                                        lineNumber: 174,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/modules/bolsa/NuevaOpForm.tsx",
                                lineNumber: 172,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/modules/bolsa/NuevaOpForm.tsx",
                        lineNumber: 165,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                className: LABEL_CLS,
                                children: "Observaciones (opcional)"
                            }, void 0, false, {
                                fileName: "[project]/src/components/modules/bolsa/NuevaOpForm.tsx",
                                lineNumber: 184,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("textarea", {
                                name: "observaciones",
                                rows: 2,
                                placeholder: "Notas internas…",
                                className: `${INPUT_CLS} resize-none`
                            }, void 0, false, {
                                fileName: "[project]/src/components/modules/bolsa/NuevaOpForm.tsx",
                                lineNumber: 185,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/modules/bolsa/NuevaOpForm.tsx",
                        lineNumber: 183,
                        columnNumber: 9
                    }, this),
                    state && "error" in state && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "text-[11px] text-rose-400 font-semibold",
                        children: state.error
                    }, void 0, false, {
                        fileName: "[project]/src/components/modules/bolsa/NuevaOpForm.tsx",
                        lineNumber: 194,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex items-center justify-end gap-2 pt-1",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                href: "/bolsa",
                                className: "text-[11px] font-bold px-3 py-2 rounded-lg bg-byg-surface-2 text-byg-muted hover:bg-byg-border border border-byg-border transition-colors",
                                children: "Cancelar"
                            }, void 0, false, {
                                fileName: "[project]/src/components/modules/bolsa/NuevaOpForm.tsx",
                                lineNumber: 198,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                type: "submit",
                                disabled: pending,
                                className: "inline-flex items-center gap-1.5 text-[11px] font-black px-4 py-2 rounded-lg bg-byg-accent text-white hover:bg-blue-500 transition-colors uppercase tracking-widest disabled:opacity-50 shadow-sm shadow-blue-600/20",
                                children: pending ? "Cargando…" : "Cargar Operación →"
                            }, void 0, false, {
                                fileName: "[project]/src/components/modules/bolsa/NuevaOpForm.tsx",
                                lineNumber: 204,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/modules/bolsa/NuevaOpForm.tsx",
                        lineNumber: 197,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/modules/bolsa/NuevaOpForm.tsx",
                lineNumber: 59,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/modules/bolsa/NuevaOpForm.tsx",
        lineNumber: 54,
        columnNumber: 5
    }, this);
}
_s(NuevaOpForm, "NM0V7mUot4xJQa/UDKD+NX+fTIs=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useActionState"]
    ];
});
_c = NuevaOpForm;
var _c;
__turbopack_context__.k.register(_c, "NuevaOpForm");
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
}]);

//# sourceMappingURL=_c1f25a26._.js.map