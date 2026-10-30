-- MACRO 1 — PRE-CHECK (SOLO LECTURA). Correr en el ambiente destino ANTES de
-- completar y ejecutar 02_migrate.sql. Revisar cada bloque.

-- 1. Migración no aplicada todavía (debe dar ok = true).
SELECT 'migración no aplicada' AS chequeo, to_regclass('public."_macro1_perm_log"') IS NULL AS ok;

-- 2. Identificar los targets: copiar id y email EXACTOS de Francisco y Augusto
--    al bloque TARGETS de 02_migrate.sql. Ambos deben ser SOCIO y activos.
SELECT id, email, name, role, activo, "twoFactorEnabled"
FROM "User" ORDER BY role, name;

-- 3. Overrides actuales de todos los usuarios (para comparar con el post-check).
SELECT u.email, p.modulo || ':' || p.accion AS clave, up.concedido, up.temporal, up."fechaExpiracion", up.notas
FROM "UserPermiso" up JOIN "User" u ON u.id = up."userId" JOIN "Permiso" p ON p.id = up."permisoId"
ORDER BY u.email, clave;

-- 4. Overrides con claves NO canónicas (vocabulario viejo). La migración solo
--    elimina las claves LEGACY conocidas de los targets; si aparece cualquier
--    otra clave no canónica (de cualquier usuario), 02_migrate.sql ABORTA.
WITH canon(clave) AS (VALUES
-- CANON:BEGIN
  ('bolsa:crear'),('bolsa:concertar'),('bolsa:anular'),('bolsa:transferir_custodia'),
  ('holdings:comprar'),('holdings:vender'),('holdings:editar'),('holdings:eliminar'),
  ('comitentes:editar'),('saldos:editar'),
  ('caja:operar_oficina'),('caja:operar_trenque'),('caja:editar_movimiento'),('caja:eliminar_movimiento'),('caja:transferir'),
  ('cambio:operar'),('operativa:crear'),('operativa:eliminar'),
  ('clientes:crear'),('clientes:editar'),('clientes:eliminar'),
  ('cc:crear_movimiento'),('cc:intereses'),('cc:eliminar_movimiento'),('cc:reconciliar'),
  ('pf:crear'),('pf:editar'),('comisiones:gestionar'),
  ('configuracion:editar'),('configuracion:cajas'),('mes:editar'),('inmobiliarias:editar'),
  ('posicion:leer'),('patrimonio:leer'),('analisis:leer'),('caja:leer'),('mov_diarios:leer'),('rulos:leer'),
  ('div_intereses:leer'),('largo_plazo:leer'),('historial:leer'),('clientes:leer'),('cuentas_corrientes:leer'),
  ('plazos_fijos:leer'),('recordatorios:leer'),('activos:leer'),('carteras:leer'),('banco_industrial:leer'),
  ('bolsa:leer'),('operaciones_rulo:leer'),('configuracion:leer'),('auditoria:leer'),('usuarios:leer'),('backups:leer')
-- CANON:END
)
SELECT u.email, p.modulo || ':' || p.accion AS clave_no_canonica, up.concedido, up.temporal
FROM "UserPermiso" up JOIN "User" u ON u.id = up."userId" JOIN "Permiso" p ON p.id = up."permisoId"
WHERE p.modulo || ':' || p.accion NOT IN (SELECT clave FROM canon)
ORDER BY u.email, clave_no_canonica;

-- 5. Overrides temporales: si alguno cae sobre una clave que la política cambia
--    para un target, 02_migrate.sql ABORTA (revisión manual).
SELECT u.email, p.modulo || ':' || p.accion AS clave, up.concedido, up."fechaExpiracion"
FROM "UserPermiso" up JOIN "User" u ON u.id = up."userId" JOIN "Permiso" p ON p.id = up."permisoId"
WHERE up.temporal;

-- 6. Scope de caja (código nuevo: Caja.tipo). Toda caja activa debe tener tipo
--    con regla, y la clasificación por tipo debe coincidir con la vieja por slug
--    (slug contiene 'trenque' ⇔ SUCURSAL_OPERATIVA). Filas con ok=false: revisar.
SELECT slug, label, tipo, activa,
       CASE tipo WHEN 'SUCURSAL_OPERATIVA' THEN 'TRENQUE'
                 WHEN 'CENTRAL_CONTABLE' THEN 'OFICINA'
                 WHEN 'CAJA_SEGURIDAD' THEN 'OFICINA'
                 WHEN 'BANCO' THEN 'OFICINA' END AS scope_nuevo,
       (slug LIKE '%trenque%') = (tipo = 'SUCURSAL_OPERATIVA') AS ok
FROM "Caja" ORDER BY activa DESC, slug;

-- 7. Usuarios con rol que exige 2FA y sin 2FA: quedarán sin poder operar.
SELECT email, name, role FROM "User" WHERE activo AND role IN ('ADMIN','SOCIO','EMPLEADO') AND NOT "twoFactorEnabled";

-- 8. PRECHECK TRANSITION MONOTONICITY (FAIL CLOSED). Debe dar ok = true ANTES
--    del deploy de código (A → B) y otra vez ANTES de 02_migrate.sql (B → C).
--    Hipótesis bajo las que está probado B ⊆ A y C ⊆ B
--    (src/lib/auth/transition-monotonicity.test.ts):
--    a) ningún no-ADMIN tiene override vigente concedido=true sobre una clave
--       NUEVA o REMAPEADA (el código viejo no la consultaba: un grant ahí daría
--       en B algo que A no daba);
--    b) ninguna clave no canónica fuera de las 8 LEGACY del puente;
--    c) ningún override temporal de SOCIO/EMPLEADO sobre claves de caja, cambio
--       o legacy (su vencimiento cambiaría el estado que materializa la migración);
--    d) toda caja clasifica igual por tipo (código nuevo) que por slug (viejo).
--    Si da false: NO desplegar ni migrar; revisar las filas listadas en `detalle`.
WITH monotonic(clave) AS (VALUES
-- MONOTONIC:BEGIN
  ('cambio:operar'),('caja:operar_trenque'),('comitentes:editar'),('comisiones:gestionar'),
  ('cc:reconciliar'),('inmobiliarias:editar'),('usuarios:administrar'),('sistema:admin')
-- MONOTONIC:END
),
legacy(clave) AS (VALUES
  ('caja:crear'),('caja:editar'),('caja:eliminar'),('caja:escribir'),
  ('mov_diarios:crear'),('mov_diarios:editar'),('mov_diarios:eliminar'),('mov_diarios:escribir')
),
evaluadas(clave) AS (VALUES
  ('caja:operar_oficina'),('caja:operar_trenque'),('caja:editar_movimiento'),('caja:eliminar_movimiento'),
  ('caja:transferir'),('cambio:operar')
),
canon(clave) AS (VALUES
-- CANON:BEGIN
  ('bolsa:crear'),('bolsa:concertar'),('bolsa:anular'),('bolsa:transferir_custodia'),
  ('holdings:comprar'),('holdings:vender'),('holdings:editar'),('holdings:eliminar'),
  ('comitentes:editar'),('saldos:editar'),
  ('caja:operar_oficina'),('caja:operar_trenque'),('caja:editar_movimiento'),('caja:eliminar_movimiento'),('caja:transferir'),
  ('cambio:operar'),('operativa:crear'),('operativa:eliminar'),
  ('clientes:crear'),('clientes:editar'),('clientes:eliminar'),
  ('cc:crear_movimiento'),('cc:intereses'),('cc:eliminar_movimiento'),('cc:reconciliar'),
  ('pf:crear'),('pf:editar'),('comisiones:gestionar'),
  ('configuracion:editar'),('configuracion:cajas'),('mes:editar'),('inmobiliarias:editar'),
  ('posicion:leer'),('patrimonio:leer'),('analisis:leer'),('caja:leer'),('mov_diarios:leer'),('rulos:leer'),
  ('div_intereses:leer'),('largo_plazo:leer'),('historial:leer'),('clientes:leer'),('cuentas_corrientes:leer'),
  ('plazos_fijos:leer'),('recordatorios:leer'),('activos:leer'),('carteras:leer'),('banco_industrial:leer'),
  ('bolsa:leer'),('operaciones_rulo:leer'),('configuracion:leer'),('auditoria:leer'),('usuarios:leer'),('backups:leer')
-- CANON:END
),
filas AS (
  SELECT u.email, u.role::text AS role, p.modulo || ':' || p.accion AS clave, up.concedido, up.temporal, up."fechaExpiracion"
  FROM "UserPermiso" up JOIN "User" u ON u.id = up."userId" JOIN "Permiso" p ON p.id = up."permisoId"
),
fallas AS (
  SELECT 'a) grant en clave nueva/remapeada: ' || email || ' ' || clave AS motivo FROM filas
  WHERE role <> 'ADMIN' AND concedido AND clave IN (SELECT clave FROM monotonic)
    AND (NOT temporal OR "fechaExpiracion" IS NULL OR "fechaExpiracion" >= now())
  UNION ALL
  SELECT 'b) clave no canónica fuera del puente: ' || email || ' ' || clave FROM filas
  WHERE clave NOT IN (SELECT clave FROM canon) AND clave NOT IN (SELECT clave FROM legacy)
  UNION ALL
  SELECT 'c) temporal sobre clave evaluada: ' || email || ' ' || clave FROM filas
  WHERE temporal AND role IN ('SOCIO', 'EMPLEADO')
    AND (clave IN (SELECT clave FROM evaluadas) OR clave IN (SELECT clave FROM legacy))
  UNION ALL
  SELECT 'd) caja con scope distinto por tipo y por slug: ' || slug FROM "Caja"
  WHERE (slug LIKE '%trenque%') IS DISTINCT FROM (tipo = 'SUCURSAL_OPERATIVA')
     OR tipo NOT IN ('SUCURSAL_OPERATIVA', 'CENTRAL_CONTABLE', 'CAJA_SEGURIDAD', 'BANCO')
)
SELECT 'PRECHECK TRANSITION MONOTONICITY' AS chequeo,
       NOT EXISTS (SELECT 1 FROM fallas) AS ok,
       coalesce((SELECT string_agg(motivo, ' | ') FROM fallas), 'PASS') AS detalle;
