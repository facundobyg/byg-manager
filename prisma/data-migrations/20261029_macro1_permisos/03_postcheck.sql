-- MACRO 1 — POST-CHECK (SOLO LECTURA). Todas las filas deben dar ok = true.
-- Usa las tablas persistidas por 02_migrate.sql (_macro1_targets, _macro1_expected,
-- _macro1_perm_snapshot, _macro1_perm_log). POST ≤ PRE y POST = objetivo ya se
-- verificaron dentro de la transacción de 02_migrate.sql con la resolución completa;
-- acá se re-verifica sobre las filas persistidas.

WITH pol(etiqueta, clave, concedido) AS (VALUES
-- POLICY:BEGIN
('FRANCISCO', 'caja:operar_oficina', false),
('FRANCISCO', 'caja:operar_trenque', false),
('FRANCISCO', 'caja:editar_movimiento', false),
('FRANCISCO', 'caja:eliminar_movimiento', false),
('FRANCISCO', 'caja:transferir', false),
('FRANCISCO', 'cambio:operar', false),
('FRANCISCO', 'cc:crear_movimiento', false),
('FRANCISCO', 'cc:intereses', false),
('FRANCISCO', 'cc:eliminar_movimiento', false),
('FRANCISCO', 'pf:crear', false),
('FRANCISCO', 'pf:editar', false),
('FRANCISCO', 'clientes:crear', false),
('FRANCISCO', 'clientes:editar', false),
('FRANCISCO', 'clientes:eliminar', false),
('FRANCISCO', 'recordatorios:leer', false),
('AUGUSTO', 'caja:operar_oficina', false),
('AUGUSTO', 'caja:operar_trenque', true),
('AUGUSTO', 'caja:transferir', false),
('AUGUSTO', 'cambio:operar', true),
('AUGUSTO', 'bolsa:concertar', false),
('AUGUSTO', 'bolsa:anular', false),
('AUGUSTO', 'operativa:crear', false),
('AUGUSTO', 'operativa:eliminar', false),
('AUGUSTO', 'saldos:editar', false),
('AUGUSTO', 'clientes:eliminar', false)
-- POLICY:END
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
actual AS (
  SELECT up.*, p.modulo || ':' || p.accion AS clave
  FROM "UserPermiso" up JOIN "Permiso" p ON p.id = up."permisoId"
)
SELECT 'objetivo nunca amplía: objetivo ≤ PRE y objetivo ≤ política; sin grant alternativo nuevo' AS chequeo,
       NOT EXISTS (SELECT 1 FROM "_macro1_expected" e WHERE (e.objetivo AND NOT e.b_eff) OR (e.objetivo AND e.politica = false)
                   OR (e.materializar AND e.objetivo AND NOT e.explicito_ok)) AS ok
UNION ALL
SELECT 'cada clave materializada: 1 override permanente con el objetivo exacto',
       NOT EXISTS (
         SELECT 1 FROM "_macro1_expected" e WHERE e.materializar
           AND (SELECT count(*) FROM actual a WHERE a."userId" = e.user_id AND a.clave = e.clave
                AND a.concedido = e.objetivo AND NOT a.temporal AND a."fechaExpiracion" IS NULL) <> 1)
UNION ALL
SELECT 'claves de la política evaluadas en _macro1_expected',
       NOT EXISTS (SELECT 1 FROM pol JOIN "_macro1_targets" t ON t.etiqueta = pol.etiqueta
                   WHERE NOT EXISTS (SELECT 1 FROM "_macro1_expected" e WHERE e.user_id = t.user_id AND e.clave = pol.clave
                                     AND e.politica = pol.concedido))
UNION ALL
SELECT 'claves de la política recortadas por monotonicidad (PRE=false, política=true): ' ||
       coalesce((SELECT string_agg(etiqueta || ' ' || clave, ', ' ORDER BY etiqueta, clave) FROM "_macro1_expected"
                 WHERE politica AND NOT objetivo), 'ninguna'), true
UNION ALL
SELECT 'targets sin overrides no canónicos', NOT EXISTS (
  SELECT 1 FROM actual a JOIN "_macro1_targets" t ON t.user_id = a."userId" WHERE a.clave NOT IN (SELECT clave FROM canon))
UNION ALL
SELECT 'ningún override no canónico en toda la tabla', NOT EXISTS (SELECT 1 FROM actual a WHERE a.clave NOT IN (SELECT clave FROM canon))
UNION ALL
SELECT 'ningún override sobre claves adminOnly', NOT EXISTS (
  SELECT 1 FROM actual a WHERE a.clave IN ('usuarios:administrar', 'sistema:admin'))
UNION ALL
SELECT 'filas fuera del log: idénticas a la foto previa', NOT EXISTS (
  SELECT 1 FROM "_macro1_perm_snapshot" s
  WHERE s.id NOT IN (SELECT row_id FROM "_macro1_perm_log")
    AND NOT EXISTS (SELECT 1 FROM "UserPermiso" up WHERE up.id = s.id AND up."userId" = s."userId"
                    AND up."permisoId" = s."permisoId" AND up.concedido = s.concedido AND up.temporal = s.temporal
                    AND up."fechaExpiracion" IS NOT DISTINCT FROM s."fechaExpiracion"
                    AND up.notas IS NOT DISTINCT FROM s.notas AND up."createdAt" = s."createdAt"))
UNION ALL
SELECT 'filas del log en su estado post-migración exacto', NOT EXISTS (
  SELECT 1 FROM "_macro1_perm_log" l WHERE
    (l.op = 'INSERT' AND NOT EXISTS (SELECT 1 FROM "UserPermiso" up WHERE up.id = l.row_id AND up."userId" = l.user_id
       AND up."permisoId" = l.permiso_id AND up.concedido = l.new_concedido AND NOT up.temporal AND up."fechaExpiracion" IS NULL
       AND up.notas IS NOT DISTINCT FROM l.new_notas AND up."createdAt" = l.new_created))
 OR (l.op = 'UPDATE' AND NOT EXISTS (SELECT 1 FROM "UserPermiso" up WHERE up.id = l.row_id AND up."userId" = l.user_id
       AND up."permisoId" = l.permiso_id AND up.concedido = l.new_concedido AND up.temporal = l.prev_temporal
       AND up."fechaExpiracion" IS NOT DISTINCT FROM l.prev_fecha AND up.notas IS NOT DISTINCT FROM l.prev_notas
       AND up."createdAt" = l.prev_created))
 OR (l.op = 'DELETE' AND EXISTS (SELECT 1 FROM "UserPermiso" up WHERE up.id = l.row_id OR (up."userId" = l.user_id AND up."permisoId" = l.permiso_id))))
UNION ALL
SELECT 'toda fila nueva fue insertada por la migración', NOT EXISTS (
  SELECT 1 FROM "UserPermiso" up
  WHERE up.id NOT IN (SELECT id FROM "_macro1_perm_snapshot")
    AND up.id NOT IN (SELECT row_id FROM "_macro1_perm_log" WHERE op = 'INSERT'))
UNION ALL
SELECT 'resumen log: ' || coalesce((SELECT string_agg(op || '=' || n, ' ') FROM (SELECT op, count(*) n FROM "_macro1_perm_log" GROUP BY op ORDER BY op) x), 'sin cambios'), true;
