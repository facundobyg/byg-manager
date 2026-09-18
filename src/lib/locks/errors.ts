// A3.1.1 — jerarquía de errores del motor de OperationalLock.

export class LockKeyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LockKeyError";
  }
}

export class InvalidClientIdError extends Error {
  constructor(message = "ownerClientId inválido: se espera un UUID.") {
    super(message);
    this.name = "InvalidClientIdError";
  }
}

/** Una key del set solicitado está ocupada por otro owner con lease vigente. */
export class LockConflictError extends Error {
  readonly lockKey: string;
  constructor(lockKey: string) {
    super(`El recurso "${lockKey}" está en uso por otro usuario.`);
    this.name = "LockConflictError";
    this.lockKey = lockKey;
  }
}

/** requireOperationalLocks no pudo confirmar posesión vigente de una key. */
export class LockOwnershipError extends Error {
  readonly lockKey: string;
  constructor(lockKey: string) {
    super(`No se pudo confirmar la posesión del lock "${lockKey}" (expirado, liberado o tomado por otro usuario).`);
    this.name = "LockOwnershipError";
    this.lockKey = lockKey;
  }
}
