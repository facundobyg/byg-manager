-- MACRO 1 — ROLLBACK EXACTO: revierte ÚNICAMENTE los cambios registrados en
-- "_macro1_perm_log", en orden inverso. Nunca toca otros overrides.
--
-- Solo procede si CADA fila afectada sigue EXACTAMENTE en el estado que dejó
-- la migración (id, userId, permisoId, concedido, temporal, fechaExpiracion,
-- notas, createdAt). Si alguna cambió después (p. ej. un ADMIN la editó),
-- ABORTA sin tocar nada (revisión manual). Restaura exactamente el estado previo.
--
-- Orden respecto del código: ver README.md (rollback de DATOS antes que el de
-- código; nunca código viejo + overrides nuevos).

BEGIN;

DO $$
DECLARE r record; n int;
BEGIN
  IF to_regclass('public."_macro1_perm_log"') IS NULL THEN
    RAISE EXCEPTION 'MACRO1 rollback: no existe _macro1_perm_log (¿migración no aplicada?)';
  END IF;

  -- Mismo lock que la app (withTargetUserLock): serializa con ediciones concurrentes.
  PERFORM 1 FROM "User" WHERE id IN (SELECT user_id FROM "_macro1_targets") ORDER BY id FOR UPDATE;

  FOR r IN SELECT * FROM "_macro1_perm_log" ORDER BY seq DESC LOOP
    IF r.op = 'INSERT' THEN
      -- estado post-migración esperado: exactamente la fila insertada
      DELETE FROM "UserPermiso"
      WHERE id = r.row_id AND "userId" = r.user_id AND "permisoId" = r.permiso_id
        AND concedido = r.new_concedido AND temporal = false AND "fechaExpiracion" IS NULL
        AND notas IS NOT DISTINCT FROM r.new_notas AND "createdAt" = r.new_created;
      GET DIAGNOSTICS n = ROW_COUNT;
      IF n <> 1 THEN RAISE EXCEPTION 'MACRO1 rollback: override insertado % (%) cambió o no existe', r.row_id, r.clave; END IF;

    ELSIF r.op = 'UPDATE' THEN
      -- la migración solo cambió `concedido`; el resto debe seguir igual al previo
      UPDATE "UserPermiso"
      SET concedido = r.prev_concedido
      WHERE id = r.row_id AND "userId" = r.user_id AND "permisoId" = r.permiso_id
        AND concedido = r.new_concedido AND temporal = r.prev_temporal
        AND "fechaExpiracion" IS NOT DISTINCT FROM r.prev_fecha
        AND notas IS NOT DISTINCT FROM r.prev_notas AND "createdAt" = r.prev_created;
      GET DIAGNOSTICS n = ROW_COUNT;
      IF n <> 1 THEN RAISE EXCEPTION 'MACRO1 rollback: override actualizado % (%) cambió o no existe', r.row_id, r.clave; END IF;

    ELSIF r.op = 'DELETE' THEN
      -- estado post-migración esperado: la fila no existe (ni otra para el mismo par)
      IF EXISTS (SELECT 1 FROM "UserPermiso" WHERE id = r.row_id OR ("userId" = r.user_id AND "permisoId" = r.permiso_id)) THEN
        RAISE EXCEPTION 'MACRO1 rollback: no se puede restaurar % (%): ya existe un override', r.row_id, r.clave;
      END IF;
      INSERT INTO "UserPermiso" (id, "userId", "permisoId", concedido, temporal, "fechaExpiracion", notas, "createdAt")
      VALUES (r.row_id, r.user_id, r.permiso_id, r.prev_concedido, r.prev_temporal, r.prev_fecha, r.prev_notas, r.prev_created);
    END IF;
  END LOOP;
END $$;

-- Verificación ACOTADA: cada fila del log volvió EXACTAMENTE a su estado previo
-- (o, si fue insertada, ya no existe). Cambios posteriores no relacionados se respetan.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM "_macro1_perm_log" l WHERE l.op = 'INSERT'
      AND EXISTS (SELECT 1 FROM "UserPermiso" up WHERE up.id = l.row_id)
  ) OR EXISTS (
    SELECT 1 FROM "_macro1_perm_log" l WHERE l.op IN ('UPDATE', 'DELETE')
      AND NOT EXISTS (SELECT 1 FROM "UserPermiso" up WHERE up.id = l.row_id AND up."userId" = l.user_id
                      AND up."permisoId" = l.permiso_id AND up.concedido = l.prev_concedido
                      AND up.temporal = l.prev_temporal AND up."fechaExpiracion" IS NOT DISTINCT FROM l.prev_fecha
                      AND up.notas IS NOT DISTINCT FROM l.prev_notas AND up."createdAt" = l.prev_created)
  ) THEN
    RAISE EXCEPTION 'MACRO1 rollback: el estado de las filas migradas no volvió al previo';
  END IF;
END $$;

DROP TABLE "_macro1_perm_log";
DROP TABLE "_macro1_perm_snapshot";
DROP TABLE "_macro1_targets";
DROP TABLE IF EXISTS "_macro1_expected";

COMMIT;
