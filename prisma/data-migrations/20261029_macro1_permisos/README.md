# MACRO 1 — Migración de permisos + runbook de deploy (R4)

Sin cambio de schema. Migración por **estado efectivo**: para Francisco y Augusto
(identificados por `User.id` + email, verificados y bloqueados con `FOR UPDATE`
en la misma transacción) calcula el permiso efectivo PRE con la misma resolución
que el código nuevo sobre datos viejos (`pg_temp.macro1_eff` = `effectivePermission`:
puente legacy, override canónico, default de rol, implicación histórica) y
materializa `objetivo = PRE AND política` **antes** de borrar las claves LEGACY.
Verifica dentro de la transacción `POST = objetivo` y `POST ≤ PRE` en todas las
claves canónicas; si no, aborta. Ningún otro usuario se toca. Cada cambio queda en
`_macro1_perm_log`; el rollback revierte exactamente ese log y aborta si una fila
cambió después.

## Archivos
| Archivo | Tipo | Qué hace |
|---|---|---|
| `01_precheck.sql` | solo lectura | estado previo, targets, claves no canónicas, temporales, cajas tipo↔slug, 2FA y **bloque 8: PRECHECK TRANSITION MONOTONICITY** |
| `02_migrate.sql` | escritura, 1 transacción | completar TARGETS en una copia local; lock de los targets; precondiciones (incluye monotonicidad); materialización por estado efectivo; borrado legacy; verificación POST ≤ PRE |
| `03_postcheck.sql` | solo lectura | todas las filas `ok = true`; informa claves de la política recortadas por monotonicidad |
| `04_rollback.sql` | escritura, 1 transacción | revierte solo el log (8 columnas); aborta si algo cambió |

## Mapping de las 8 claves legacy (puente = migración)
| Legacy | Uso en código viejo (b49aa4d) | Restringe en B (puente) | Migración (por target) |
|---|---|---|---|
| `caja:crear` | ninguno (backend nunca la consultó) | operar_oficina, operar_trenque, editar_movimiento, eliminar_movimiento, transferir | materializa esas 5 en `false` si PRE=false; luego DELETE |
| `caja:editar` | ninguno | ídem | ídem |
| `caja:eliminar` | ninguno | ídem | ídem |
| `caja:escribir` | ninguno | ídem | ídem |
| `mov_diarios:crear` | ninguno | `cambio:operar` | materializa `cambio:operar=false` si PRE=false; luego DELETE |
| `mov_diarios:editar` | ninguno | `cambio:operar` | ídem |
| `mov_diarios:eliminar` | ninguno | `cambio:operar` | ídem |
| `mov_diarios:escribir` | solo `canWrite` de UI en páginas | `cambio:operar` | ídem |

Solo revocaciones (`concedido=false`) tienen efecto; un grant legacy se ignora (nunca amplía).

## Reglas de compatibilidad histórica (R4)
- `cambio:operar` sin override canónico propio exige `caja:operar_oficina` efectiva
  (en A toda la operatoria de cambio exigía oficina).
- Confirmar un pendiente exige `caja:operar_oficina` **u** override explícito
  `caja:operar_trenque=true` (en A confirmar exigía oficina siempre). La migración
  solo materializa ese grant explícito si PRE ya tenía la capacidad.
- `cancelarOperacionCambioPendiente` exige además `caja:eliminar_movimiento` (como A).
- Crear/actualizar productor: `sistema:admin` (en A: solo ADMIN).
- Todo lo demás: misma clave o más estricto (probado en `transition-monotonicity.test.ts`).

## Estados código ↔ datos
| Estado | Combinación | Resultado (probado en `src/lib/auth/transition-monotonicity.test.ts`) |
|---|---|---|
| A | código viejo + DB vieja | producción actual (incluye la escalada histórica a /permisos) |
| **B** | **código nuevo + DB vieja** | **B ⊆ A** por acción × caja × rol para toda combinación admitida por el precheck |
| C | código nuevo + DB migrada | **C ⊆ B** (espejo TS de la migración, 4 políticas); datos reales: C = política exacta |
| D | código viejo + DB migrada | D ⊆ A (no objetivo) |

Hipótesis de la prueba = condiciones del bloque 8 del precheck (FAIL CLOSED):
sin grants vigentes de no-ADMIN en claves nuevas/remapeadas (`TRANSITION_MONOTONIC_KEYS`),
sin claves no canónicas fuera del puente, sin temporales de SOCIO/EMPLEADO en claves
de caja/cambio/legacy, cajas con scope tipo = slug.

## Garantía de la ventana
"Cero mutaciones CONCURRENTES de identidad/permisos de los usuarios target
durante la migración": misma fila bloqueada (`FOR UPDATE`) que `withTargetUserLock`.
No se promete "cero escrituras globales" (el cron Data912 no toca User/UserPermiso/roles).

## Deployment Protection (verificado 2026-10-29, solo lectura)
URLs generadas de deployments anteriores, de rama y del proyecto: **302 →
vercel.com/sso-api**. Solo `byg-manager.vercel.app` es público. Estado: **PROTEGIDO**.

## RUNBOOK DE PRODUCCIÓN R4 (no ejecutado)

### 0. Prerequisitos
1. ~~Francisco activa 2FA en producción.~~ **Reemplazado (2026-11-04):** el 2FA es obligatorio solo para ADMIN; para SOCIO / EMPLEADO (Francisco, Augusto) es voluntario y su estado ON/OFF no bloquea el cutover ni la Beta. El bloque 7 del precheck es informativo: solo un ADMIN sin 2FA queda sin poder operar.
2. Repetir el chequeo de Deployment Protection.
3. Neon: branch/snapshot de producción como respaldo.
4. `01_precheck.sql` en producción. **PRECHECK TRANSITION MONOTONICITY = PASS (bloque 8)
   es condición para desplegar.** Si da `false`: NO desplegar; revisar `detalle`.
   Además: bloque 1 `ok`; bloque 6 todas `ok`; bloque 7 vacío (o aceptado).
5. Copiar `02_migrate.sql` a un archivo LOCAL (no commitear) y completar TARGETS.

### 1. Deploy de código (A → B)
1. Commit Macro 1 → push a `main` ⇒ deploy automático. Esperar **Ready**; `x-vercel-id: gru1::gru1::…`.

### 2. Smoke B
- Facundo: login 2FA, /permisos.
- Francisco: caja y cambio rechazados (puente), bolsa OK.
- Augusto: Trenque OK, cambio OK, Caja Oficina OK (todavía sin revocación: es A).

### 3. Migración (B → C)
1. Esperar ≥ 5 min desde Ready (drain).
2. Re-ejecutar el bloque 8 del precheck: **PRECHECK TRANSITION MONOTONICITY = PASS**.
3. Ejecutar el `02_migrate.sql` completado. Si aborta: no se escribió nada; leer el mensaje.

### 4. Post-check + smoke C
- `03_postcheck.sql`: todas `ok = true`; "recortadas: ninguna" esperado con datos reales
  (si lista claves, la política quedó recortada por monotonicidad: revisar antes de seguir).
- Facundo: /permisos, una acción de configuración, "ver como" Francisco → guardado rechazado.
- Francisco: caja / cambio / CC / PF rechazados; bolsa crear OK.
- Augusto: Caja Oficina rechazada; Trenque (crear, confirmar), cambio en Trenque, CC y PF OK.

### 5. Rollback
- **Datos (C → B)**: `04_rollback.sql`. Seguro con el código nuevo activo.
- **Código (B → A)**: último recurso (Instant Rollback al deployment anterior o
  `git revert` + push). Reinstala la escalada histórica del código viejo.
- Orden: datos primero, código después (C → B → A).

## Estado
- TEST V5 (`br-flat-fire-acp039j3`), 2026-10-30, versión R4:
  rollback R3 → huella original (6 col `a8b96…`, 8 col `23c02…`) → precheck 8 PASS →
  **artificial** `caja:escribir=false` en Augusto (`4eeb07…`) → migrate R4
  (`DELETE=9 INSERT=12`; Augusto: 5 claves de caja + cambio materializadas en false,
  recortadas trenque/cambio de la política) → segunda corrida abortó → postcheck ok →
  rollback → `4eeb07…` exacta → artificial borrada → `23c02…` exacta →
  migrate R4 real (`DELETE=8 INSERT=10`, recortadas: ninguna) → postcheck ok →
  estado final `b7413…` (32 filas).
- Producción: **NO aplicada.**
