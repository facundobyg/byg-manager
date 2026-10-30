// MACRO 1 — R2-02. Refresco del JWT en `trigger === "update"`.
//
// NextAuth permite que el CLIENTE dispare un update de sesión con un payload
// arbitrario (session.update({...})). Por eso NINGÚN dato de seguridad del
// token (2FA, rol, activo) puede salir de ese payload: en un update se relee
// el estado real desde DB. Si el usuario no existe o está inactivo, se
// invalida la sesión (null).

export interface TokenSecuritySource {
  role: string;
  activo: boolean;
  twoFactorEnabled: boolean;
}

export async function refreshTokenOnUpdate<T extends Record<string, unknown>>(
  token: T,
  loadUser: (id: string) => Promise<TokenSecuritySource | null>,
): Promise<T | null> {
  const id = typeof token.id === "string" ? token.id : "";
  if (!id) return null;
  const user = await loadUser(id);
  if (!user || !user.activo) return null;
  return { ...token, role: user.role, twoFactorEnabled: user.twoFactorEnabled };
}
