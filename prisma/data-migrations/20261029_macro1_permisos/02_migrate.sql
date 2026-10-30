-- MACRO 1 — Migración de overrides de permisos por ESTADO EFECTIVO (R4, sin cambio de schema).
--
-- Garantía: para cada target y cada clave canónica, permiso efectivo POST ≤ PRE
-- (STATE C ⊆ STATE B). PRE se calcula con la MISMA resolución que el código
-- nuevo usa sobre datos viejos (pg_temp.macro1_eff = effectivePermission de
-- src/lib/auth/permission-registry.ts): revocación legacy (puente) → false;
-- override canónico vigente; default del rol; implicación histórica
-- (cambio:operar implícito exige caja:operar_oficina efectiva).
--
-- Para cada target y clave k del conjunto M (claves de la política ∪ claves
-- canónicas del puente legacy ∪ claves con implicación):
--   target(k) = PRE(k) AND política(k)          (la política nunca amplía)
--   se MATERIALIZA override permanente = target(k) si k está en la política,
--   si k tiene implicación, o si target(k) = false.
-- Recién después se borran las filas LEGACY del target. Se verifica dentro de
-- la transacción: POST(k) = target(k) en M y POST ≤ PRE en TODAS las claves;
-- si no, ABORTA. Ningún otro usuario se toca.
--
-- Cada cambio queda en "_macro1_perm_log" (rollback exacto), la foto previa en
-- "_macro1_perm_snapshot" y el resultado esperado en "_macro1_expected"
-- (post-check).
--
-- ABORTA (ROLLBACK total) si: ya fue aplicada; quedan placeholders; un target
-- no coincide exactamente (id + email, SOCIO, activo); hay overrides temporales
-- de un target sobre claves de M, legacy o implicadas; existe cualquier clave no
-- canónica fuera de LEGACY de targets; falla PRECHECK TRANSITION MONOTONICITY
-- (override vigente concedido=true, de un no-ADMIN, sobre una clave nueva o
-- remapeada: ver bloque MONOTONIC).
--
-- ANTES DE CORRER: reemplazar los 4 placeholders del bloque TARGETS con los
-- valores que muestra 01_precheck.sql. No commitear el archivo completado.

BEGIN;

CREATE TEMP TABLE macro1_target (etiqueta text PRIMARY KEY, user_id text NOT NULL, email text NOT NULL) ON COMMIT DROP;
INSERT INTO macro1_target (etiqueta, user_id, email) VALUES
-- TARGETS:BEGIN
  ('FRANCISCO', '__FRANCISCO_USER_ID__', '__FRANCISCO_EMAIL__'),
  ('AUGUSTO',   '__AUGUSTO_USER_ID__',   '__AUGUSTO_EMAIL__')
-- TARGETS:END
;

CREATE TEMP TABLE macro1_policy (etiqueta text, modulo text, accion text, concedido boolean, PRIMARY KEY (etiqueta, modulo, accion)) ON COMMIT DROP;
INSERT INTO macro1_policy (etiqueta, modulo, accion, concedido) VALUES
-- POLICY:BEGIN
('FRANCISCO', 'caja', 'operar_oficina', false),
('FRANCISCO', 'caja', 'operar_trenque', false),
('FRANCISCO', 'caja', 'editar_movimiento', false),
('FRANCISCO', 'caja', 'eliminar_movimiento', false),
('FRANCISCO', 'caja', 'transferir', false),
('FRANCISCO', 'cambio', 'operar', false),
('FRANCISCO', 'cc', 'crear_movimiento', false),
('FRANCISCO', 'cc', 'intereses', false),
('FRANCISCO', 'cc', 'eliminar_movimiento', false),
('FRANCISCO', 'pf', 'crear', false),
('FRANCISCO', 'pf', 'editar', false),
('FRANCISCO', 'clientes', 'crear', false),
('FRANCISCO', 'clientes', 'editar', false),
('FRANCISCO', 'clientes', 'eliminar', false),
('FRANCISCO', 'recordatorios', 'leer', false),
('AUGUSTO', 'caja', 'operar_oficina', false),
('AUGUSTO', 'caja', 'operar_trenque', true),
('AUGUSTO', 'caja', 'transferir', false),
('AUGUSTO', 'cambio', 'operar', true),
('AUGUSTO', 'bolsa', 'concertar', false),
('AUGUSTO', 'bolsa', 'anular', false),
('AUGUSTO', 'operativa', 'crear', false),
('AUGUSTO', 'operativa', 'eliminar', false),
('AUGUSTO', 'saldos', 'editar', false),
('AUGUSTO', 'clientes', 'eliminar', false)
-- POLICY:END
;

CREATE TEMP TABLE macro1_legacy (modulo text, accion text, PRIMARY KEY (modulo, accion)) ON COMMIT DROP;
INSERT INTO macro1_legacy (modulo, accion) VALUES
-- LEGACY:BEGIN
('caja', 'crear'), ('caja', 'editar'), ('caja', 'eliminar'), ('caja', 'escribir'),
('mov_diarios', 'crear'), ('mov_diarios', 'editar'), ('mov_diarios', 'eliminar'), ('mov_diarios', 'escribir')
-- LEGACY:END
;

-- Puente legacy → canónicas (= LEGACY_REVOCATION_BRIDGE, validado por test).
CREATE TEMP TABLE macro1_bridge (legacy text, canon text, PRIMARY KEY (legacy, canon)) ON COMMIT DROP;
INSERT INTO macro1_bridge (legacy, canon) VALUES
-- BRIDGE:BEGIN
('caja:crear', 'caja:operar_oficina'), ('caja:crear', 'caja:operar_trenque'), ('caja:crear', 'caja:editar_movimiento'), ('caja:crear', 'caja:eliminar_movimiento'), ('caja:crear', 'caja:transferir'),
('caja:editar', 'caja:operar_oficina'), ('caja:editar', 'caja:operar_trenque'), ('caja:editar', 'caja:editar_movimiento'), ('caja:editar', 'caja:eliminar_movimiento'), ('caja:editar', 'caja:transferir'),
('caja:eliminar', 'caja:operar_oficina'), ('caja:eliminar', 'caja:operar_trenque'), ('caja:eliminar', 'caja:editar_movimiento'), ('caja:eliminar', 'caja:eliminar_movimiento'), ('caja:eliminar', 'caja:transferir'),
('caja:escribir', 'caja:operar_oficina'), ('caja:escribir', 'caja:operar_trenque'), ('caja:escribir', 'caja:editar_movimiento'), ('caja:escribir', 'caja:eliminar_movimiento'), ('caja:escribir', 'caja:transferir'),
('mov_diarios:crear', 'cambio:operar'), ('mov_diarios:editar', 'cambio:operar'), ('mov_diarios:eliminar', 'cambio:operar'), ('mov_diarios:escribir', 'cambio:operar')
-- BRIDGE:END
;

-- Claves con implicación histórica (= REQUIERE_OFICINA_SI_IMPLICITO).
CREATE TEMP TABLE macro1_implica (clave text PRIMARY KEY) ON COMMIT DROP;
INSERT INTO macro1_implica (clave) VALUES
-- IMPLICA:BEGIN
  ('cambio:operar')
-- IMPLICA:END
;

-- Claves cuyo grant EXPLÍCITO es alternativa a caja:operar_oficina
-- (= EXPLICIT_ALTERNATIVE_KEYS; confirmar pendientes de Trenque). Un true
-- explícito sobre ellas solo se materializa si PRE ya tenía esa capacidad.
CREATE TEMP TABLE macro1_alt_explicit (clave text PRIMARY KEY) ON COMMIT DROP;
INSERT INTO macro1_alt_explicit (clave) VALUES
-- ALT_EXPLICIT:BEGIN
  ('caja:operar_trenque')
-- ALT_EXPLICIT:END
;

-- Defaults del rol SOCIO (= registro; adminOnly excluidas). Los targets son SOCIO.
CREATE TEMP TABLE macro1_socio_default (clave text PRIMARY KEY) ON COMMIT DROP;
INSERT INTO macro1_socio_default (clave) VALUES
-- SOCIO_DEFAULT:BEGIN
  ('bolsa:crear'),('bolsa:concertar'),('bolsa:anular'),('bolsa:transferir_custodia'),
  ('holdings:comprar'),('holdings:vender'),('holdings:editar'),('holdings:eliminar'),
  ('comitentes:editar'),('saldos:editar'),
  ('caja:operar_oficina'),('caja:operar_trenque'),('caja:editar_movimiento'),('caja:eliminar_movimiento'),('caja:transferir'),
  ('cambio:operar'),('operativa:crear'),('operativa:eliminar'),
  ('clientes:crear'),('clientes:editar'),('clientes:eliminar'),
  ('cc:crear_movimiento'),('cc:intereses'),('cc:eliminar_movimiento'),
  ('pf:crear'),('pf:editar'),('comisiones:gestionar'),
  ('posicion:leer'),('patrimonio:leer'),('analisis:leer'),('caja:leer'),('mov_diarios:leer'),('rulos:leer'),
  ('div_intereses:leer'),('largo_plazo:leer'),('historial:leer'),('clientes:leer'),('cuentas_corrientes:leer'),
  ('plazos_fijos:leer'),('recordatorios:leer'),('activos:leer'),('carteras:leer'),('banco_industrial:leer'),
  ('bolsa:leer'),('operaciones_rulo:leer')
-- SOCIO_DEFAULT:END
;

-- Claves NUEVAS o REMAPEADAS: un grant explícito previo (no-ADMIN) podría dar en
-- el código nuevo algo que el viejo no daba ⇒ FAIL CLOSED (revisión manual).
CREATE TEMP TABLE macro1_monotonic (clave text PRIMARY KEY) ON COMMIT DROP;
INSERT INTO macro1_monotonic (clave) VALUES
-- MONOTONIC:BEGIN
  ('cambio:operar'),('caja:operar_trenque'),('comitentes:editar'),('comisiones:gestionar'),
  ('cc:reconciliar'),('inmobiliarias:editar'),('usuarios:administrar'),('sistema:admin')
-- MONOTONIC:END
;

CREATE TEMP TABLE macro1_canon (clave text PRIMARY KEY) ON COMMIT DROP;
INSERT INTO macro1_canon (clave) VALUES
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
;

-- Permiso efectivo de un SOCIO no-ADMIN (espejo de effectivePermission).
CREATE FUNCTION pg_temp.macro1_eff(p_user text, p_clave text) RETURNS boolean
LANGUAGE plpgsql STABLE AS $f$
DECLARE ov boolean;
BEGIN
  IF EXISTS (
    SELECT 1 FROM "UserPermiso" up JOIN "Permiso" p ON p.id = up."permisoId"
    JOIN macro1_bridge b ON b.legacy = p.modulo || ':' || p.accion
    WHERE up."userId" = p_user AND b.canon = p_clave AND NOT up.concedido
      AND (NOT up.temporal OR up."fechaExpiracion" IS NULL OR up."fechaExpiracion" >= now())
  ) THEN RETURN false; END IF;

  SELECT up.concedido INTO ov FROM "UserPermiso" up JOIN "Permiso" p ON p.id = up."permisoId"
  WHERE up."userId" = p_user AND p.modulo || ':' || p.accion = p_clave
    AND (NOT up.temporal OR up."fechaExpiracion" IS NULL OR up."fechaExpiracion" >= now());
  IF ov IS NOT NULL THEN RETURN ov; END IF;

  IF NOT EXISTS (SELECT 1 FROM macro1_socio_default d WHERE d.clave = p_clave) THEN RETURN false; END IF;
  IF EXISTS (SELECT 1 FROM macro1_implica i WHERE i.clave = p_clave) THEN
    RETURN pg_temp.macro1_eff(p_user, 'caja:operar_oficina');
  END IF;
  RETURN true;
END $f$;

-- ── Lock de los usuarios target ANTES de validar (mismo protocolo que la app:
--    withTargetUserLock en permisos/actions.ts). Cualquier escritura concurrente
--    de permisos/rol sobre estos usuarios espera a que esta transacción termine.
SELECT id FROM "User" WHERE id IN (SELECT user_id FROM macro1_target) ORDER BY id FOR UPDATE;

-- ── Precondiciones (cualquier falla → excepción → ROLLBACK total) ───────────
DO $$
DECLARE r record; n int;
BEGIN
  IF to_regclass('public."_macro1_perm_log"') IS NOT NULL THEN
    RAISE EXCEPTION 'MACRO1: la migración ya fue aplicada (_macro1_perm_log existe)';
  END IF;

  IF EXISTS (SELECT 1 FROM macro1_target WHERE user_id LIKE '\_\_%' OR email LIKE '\_\_%') THEN
    RAISE EXCEPTION 'MACRO1: completar los placeholders del bloque TARGETS';
  END IF;

  IF (SELECT count(DISTINCT user_id) FROM macro1_target) <> 2 THEN
    RAISE EXCEPTION 'MACRO1: los dos targets deben ser usuarios distintos';
  END IF;

  FOR r IN SELECT * FROM macro1_target LOOP
    SELECT count(*) INTO n FROM "User"
    WHERE id = r.user_id AND lower(email) = lower(r.email) AND role = 'SOCIO' AND activo;
    IF n <> 1 THEN
      RAISE EXCEPTION 'MACRO1: target % (%) no coincide con un SOCIO activo por id + email', r.etiqueta, r.email;
    END IF;
  END LOOP;

  -- Temporales de un target sobre claves que la migración evalúa o materializa:
  -- su vencimiento cambiaría PRE después de materializar (revisión manual).
  IF EXISTS (
    SELECT 1 FROM "UserPermiso" up JOIN "Permiso" p ON p.id = up."permisoId"
    WHERE up.temporal AND up."userId" IN (SELECT user_id FROM macro1_target)
      AND p.modulo || ':' || p.accion IN (
        SELECT modulo || ':' || accion FROM macro1_policy
        UNION SELECT legacy FROM macro1_bridge UNION SELECT canon FROM macro1_bridge
        UNION SELECT clave FROM macro1_implica UNION SELECT 'caja:operar_oficina')
  ) THEN
    RAISE EXCEPTION 'MACRO1: hay overrides TEMPORALES de un target sobre claves evaluadas (revisión manual)';
  END IF;

  IF EXISTS (
    SELECT 1 FROM "UserPermiso" up JOIN "Permiso" p ON p.id = up."permisoId"
    WHERE p.modulo || ':' || p.accion NOT IN (SELECT clave FROM macro1_canon)
      AND NOT (up."userId" IN (SELECT user_id FROM macro1_target)
               AND (p.modulo, p.accion) IN (SELECT modulo, accion FROM macro1_legacy))
  ) THEN
    RAISE EXCEPTION 'MACRO1: existen overrides no canónicos fuera de LEGACY/targets (ver 01_precheck bloque 4)';
  END IF;

  -- PRECHECK TRANSITION MONOTONICITY (mismo criterio que 01_precheck bloque 8).
  IF EXISTS (
    SELECT 1 FROM "UserPermiso" up JOIN "Permiso" p ON p.id = up."permisoId" JOIN "User" u ON u.id = up."userId"
    WHERE u.role <> 'ADMIN' AND up.concedido
      AND (NOT up.temporal OR up."fechaExpiracion" IS NULL OR up."fechaExpiracion" >= now())
      AND p.modulo || ':' || p.accion IN (SELECT clave FROM macro1_monotonic)
  ) THEN
    RAISE EXCEPTION 'MACRO1: PRECHECK TRANSITION MONOTONICITY = FAIL (grant explícito sobre clave nueva/remapeada)';
  END IF;
END $$;

-- ── Estado efectivo PRE y objetivo ──────────────────────────────────────────
CREATE TEMP TABLE macro1_eval ON COMMIT DROP AS
SELECT t.etiqueta, t.user_id, c.clave,
       pg_temp.macro1_eff(t.user_id, c.clave) AS b_eff,
       pol.concedido AS politica,
       (c.clave IN (SELECT modulo || ':' || accion FROM macro1_policy WHERE etiqueta = t.etiqueta)
        OR c.clave IN (SELECT canon FROM macro1_bridge)
        OR c.clave IN (SELECT clave FROM macro1_implica)) AS en_m
FROM macro1_target t CROSS JOIN macro1_canon c
LEFT JOIN macro1_policy pol ON pol.etiqueta = t.etiqueta AND pol.modulo || ':' || pol.accion = c.clave;

ALTER TABLE macro1_eval ADD COLUMN objetivo boolean, ADD COLUMN explicito_ok boolean, ADD COLUMN materializar boolean;
UPDATE macro1_eval SET
  objetivo = CASE WHEN en_m THEN b_eff AND coalesce(politica, true) ELSE b_eff END;
-- explícito true permitido: clave común, o PRE ya tenía la capacidad alternativa
-- (oficina efectiva, o grant explícito vigente de la misma clave sin legacy).
UPDATE macro1_eval e SET
  explicito_ok = e.clave NOT IN (SELECT clave FROM macro1_alt_explicit)
    OR pg_temp.macro1_eff(e.user_id, 'caja:operar_oficina')
    OR (e.b_eff AND EXISTS (
          SELECT 1 FROM "UserPermiso" up JOIN "Permiso" p ON p.id = up."permisoId"
          WHERE up."userId" = e.user_id AND p.modulo || ':' || p.accion = e.clave AND up.concedido
            AND (NOT up.temporal OR up."fechaExpiracion" IS NULL OR up."fechaExpiracion" >= now())));
UPDATE macro1_eval SET
  materializar = en_m AND (politica IS NOT NULL OR clave IN (SELECT clave FROM macro1_implica) OR NOT objetivo)
                 AND (NOT objetivo OR explicito_ok);

-- ── Persistencia para post-check y rollback ─────────────────────────────────
CREATE TABLE "_macro1_targets" AS SELECT etiqueta, user_id, email FROM macro1_target;

CREATE TABLE "_macro1_expected" AS
SELECT etiqueta, user_id, clave, b_eff, politica, objetivo, explicito_ok, materializar FROM macro1_eval;

CREATE TABLE "_macro1_perm_snapshot" AS
SELECT up.id, up."userId", up."permisoId", up.concedido, up.temporal, up."fechaExpiracion", up.notas, up."createdAt",
       p.modulo || ':' || p.accion AS clave, now() AS snapshot_at
FROM "UserPermiso" up JOIN "Permiso" p ON p.id = up."permisoId";

CREATE TABLE "_macro1_perm_log" (
  seq            serial PRIMARY KEY,
  op             text NOT NULL CHECK (op IN ('INSERT', 'UPDATE', 'DELETE')),
  row_id         text NOT NULL,
  user_id        text NOT NULL,
  permiso_id     text NOT NULL,
  clave          text NOT NULL,
  prev_concedido boolean,
  prev_temporal  boolean,
  prev_fecha     timestamp(3),
  prev_notas     text,
  prev_created   timestamp(3),
  new_concedido  boolean,
  new_notas      text,
  new_created    timestamp(3),
  at             timestamptz NOT NULL DEFAULT now()
);

-- ── Filas Permiso para las claves a materializar (idempotente) ──────────────
INSERT INTO "Permiso" (id, modulo, accion)
SELECT gen_random_uuid()::text, split_part(e.clave, ':', 1), split_part(e.clave, ':', 2)
FROM (SELECT DISTINCT clave FROM macro1_eval WHERE materializar) e
ON CONFLICT (modulo, accion) DO NOTHING;

-- ── a1) UPDATE: override existente con valor distinto del objetivo ──────────
WITH cambios AS (
  SELECT up.id, up."userId", up."permisoId", e.clave,
         up.concedido AS prev, up.temporal, up."fechaExpiracion", up.notas, up."createdAt", e.objetivo AS nuevo
  FROM macro1_eval e
  JOIN "Permiso" p ON p.modulo || ':' || p.accion = e.clave
  JOIN "UserPermiso" up ON up."userId" = e.user_id AND up."permisoId" = p.id
  WHERE e.materializar AND up.concedido <> e.objetivo
), logged AS (
  INSERT INTO "_macro1_perm_log" (op, row_id, user_id, permiso_id, clave, prev_concedido, prev_temporal, prev_fecha, prev_notas, prev_created, new_concedido)
  SELECT 'UPDATE', id, "userId", "permisoId", clave, prev, temporal, "fechaExpiracion", notas, "createdAt", nuevo FROM cambios
  RETURNING row_id
)
UPDATE "UserPermiso" up SET concedido = c.nuevo
FROM cambios c WHERE up.id = c.id;

-- ── a2) INSERT: clave a materializar sin override para el target ────────────
WITH faltan AS (
  SELECT gen_random_uuid()::text AS id, e.user_id, p.id AS permiso_id, e.clave, e.objetivo AS concedido
  FROM macro1_eval e
  JOIN "Permiso" p ON p.modulo || ':' || p.accion = e.clave
  WHERE e.materializar
    AND NOT EXISTS (SELECT 1 FROM "UserPermiso" up WHERE up."userId" = e.user_id AND up."permisoId" = p.id)
), logged AS (
  INSERT INTO "_macro1_perm_log" (op, row_id, user_id, permiso_id, clave, new_concedido, new_notas, new_created)
  SELECT 'INSERT', id, user_id, permiso_id, clave, concedido, 'MACRO1 estado efectivo materializado', now() FROM faltan
  RETURNING row_id
)
INSERT INTO "UserPermiso" (id, "userId", "permisoId", concedido, temporal, "fechaExpiracion", notas, "createdAt")
SELECT id, user_id, permiso_id, concedido, false, NULL, 'MACRO1 estado efectivo materializado', now() FROM faltan;

-- ── b) DELETE: claves LEGACY de los targets (ya materializadas arriba) ──────
WITH borrar AS (
  SELECT up.*, p.modulo || ':' || p.accion AS clave
  FROM "UserPermiso" up JOIN "Permiso" p ON p.id = up."permisoId"
  JOIN macro1_target t ON t.user_id = up."userId"
  JOIN macro1_legacy l ON l.modulo = p.modulo AND l.accion = p.accion
), logged AS (
  INSERT INTO "_macro1_perm_log" (op, row_id, user_id, permiso_id, clave, prev_concedido, prev_temporal, prev_fecha, prev_notas, prev_created)
  SELECT 'DELETE', id, "userId", "permisoId", clave, concedido, temporal, "fechaExpiracion", notas, "createdAt" FROM borrar
  RETURNING row_id
)
DELETE FROM "UserPermiso" up USING borrar b WHERE up.id = b.id;

-- ── Verificación final dentro de la transacción ─────────────────────────────
DO $$
DECLARE r record;
BEGIN
  -- POST ≤ PRE en TODA clave canónica, y POST = objetivo
  FOR r IN SELECT * FROM macro1_eval LOOP
    IF pg_temp.macro1_eff(r.user_id, r.clave) IS DISTINCT FROM r.objetivo THEN
      RAISE EXCEPTION 'MACRO1: % % efectivo POST distinto del objetivo', r.etiqueta, r.clave;
    END IF;
    IF r.objetivo AND NOT r.b_eff THEN
      RAISE EXCEPTION 'MACRO1: % % ampliaría acceso (POST > PRE)', r.etiqueta, r.clave;
    END IF;
  END LOOP;

  -- cada clave materializada: exactamente 1 override permanente con el objetivo
  IF EXISTS (
    SELECT 1 FROM macro1_eval e
    WHERE e.materializar AND (SELECT count(*) FROM "UserPermiso" up JOIN "Permiso" p ON p.id = up."permisoId"
           WHERE up."userId" = e.user_id AND p.modulo || ':' || p.accion = e.clave
             AND up.concedido = e.objetivo AND NOT up.temporal AND up."fechaExpiracion" IS NULL) <> 1
  ) THEN RAISE EXCEPTION 'MACRO1: estado final materializado incorrecto'; END IF;

  -- capacidad alternativa (confirmar Trenque sin oficina): POST ≤ PRE
  IF EXISTS (
    SELECT 1 FROM macro1_eval e
    JOIN "Permiso" p ON p.modulo || ':' || p.accion = e.clave
    JOIN "UserPermiso" up ON up."userId" = e.user_id AND up."permisoId" = p.id
    WHERE e.clave IN (SELECT clave FROM macro1_alt_explicit) AND NOT e.explicito_ok AND up.concedido
  ) THEN RAISE EXCEPTION 'MACRO1: grant explícito alternativo sin capacidad previa'; END IF;

  -- ninguna fila legacy queda en los targets
  IF EXISTS (
    SELECT 1 FROM "UserPermiso" up JOIN "Permiso" p ON p.id = up."permisoId"
    JOIN macro1_legacy l ON l.modulo = p.modulo AND l.accion = p.accion
    WHERE up."userId" IN (SELECT user_id FROM macro1_target)
  ) THEN RAISE EXCEPTION 'MACRO1: quedan filas legacy en un target'; END IF;

  -- ninguna fila de la foto previa fuera del log fue alterada o borrada
  IF EXISTS (
    SELECT 1 FROM "_macro1_perm_snapshot" s
    WHERE s.id NOT IN (SELECT row_id FROM "_macro1_perm_log")
      AND NOT EXISTS (SELECT 1 FROM "UserPermiso" up WHERE up.id = s.id AND up."userId" = s."userId"
                      AND up."permisoId" = s."permisoId" AND up.concedido = s.concedido AND up.temporal = s.temporal
                      AND up."fechaExpiracion" IS NOT DISTINCT FROM s."fechaExpiracion"
                      AND up.notas IS NOT DISTINCT FROM s.notas AND up."createdAt" = s."createdAt")
  ) THEN RAISE EXCEPTION 'MACRO1: se alteró un override fuera del alcance'; END IF;
END $$;

COMMIT;
