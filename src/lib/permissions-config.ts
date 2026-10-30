import { PERMISSIONS, OVERRIDABLE_KEYS, type PermissionKey as RegistryKey } from "@/lib/auth/permission-registry";

// Claves que la UI de /permisos permite otorgar/revocar por usuario. Derivado
// del registro canónico — no mantener una lista aparte.
export const PERMISSION_KEYS = PERMISSIONS
  .filter((p) => OVERRIDABLE_KEYS.includes(p.key))
  .map((p) => ({ key: p.key, label: p.label }));

export type PermissionKey = RegistryKey;
