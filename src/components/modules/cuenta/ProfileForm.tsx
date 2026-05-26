"use client";

import { useActionState, useRef, useState } from "react";
import { updateOwnProfile } from "@/app/(dashboard)/configuracion/mi-cuenta/actions";
import { UserAvatar } from "./UserAvatar";

const ROLE_LABEL: Record<string, string> = {
  ADMIN:    "Administrador",
  SOCIO:    "Socio",
  EMPLEADO: "Empleado",
  CLIENTE:  "Cliente",
};

const MAX_BYTES    = 500 * 1024; // 500 KB
const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp"] as const;
type AllowedMime   = typeof ALLOWED_MIME[number];

export function ProfileForm({
  user,
}: {
  user: {
    name: string;
    email: string;
    role: string;
    image: string | null;
    phone: string | null;
    cargo: string | null;
    ubicacion: string | null;
  };
}) {
  const [state, formAction, pending] = useActionState(updateOwnProfile, null);
  const [imageData, setImageData]     = useState<string | null>(user.image);
  const [namePreview, setNamePreview] = useState(user.name);
  const [fileError, setFileError]     = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    setFileError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_MIME.includes(file.type as AllowedMime)) {
      setFileError("Formato no permitido. Usá JPG, PNG o WebP.");
      e.target.value = "";
      return;
    }
    if (file.size > MAX_BYTES) {
      setFileError(`Archivo muy grande (${(file.size / 1024).toFixed(0)} KB). Máximo 500 KB.`);
      e.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => setImageData(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  function handleRemove() {
    setImageData(null);
    if (fileRef.current) fileRef.current.value = "";
    setFileError(null);
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 max-w-lg">
      {state?.ok && (
        <div className="mb-4 rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm font-semibold text-emerald-700">
          Perfil actualizado correctamente.
        </div>
      )}
      {state?.error && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-2 text-sm text-red-600 font-medium">
          {state.error}
        </div>
      )}

      <form action={formAction} className="flex flex-col gap-4">
        {/* dataURL enviado al server action via hidden field */}
        <input type="hidden" name="image" value={imageData ?? ""} />

        {/* Avatar */}
        <div className="flex items-center gap-5">
          <div className="h-20 w-20 shrink-0 rounded-full overflow-hidden bg-byg-accent/10 border border-slate-200 flex items-center justify-center">
            <UserAvatar image={imageData} name={namePreview} iconSize={28} />
          </div>
          <div className="flex flex-col gap-2">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              Foto de perfil
            </p>
            <div className="flex items-center gap-2">
              <label
                htmlFor="avatar-file"
                className="cursor-pointer rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-200 transition-colors"
              >
                {imageData ? "Cambiar foto" : "Subir foto"}
              </label>
              {imageData && (
                <button
                  type="button"
                  onClick={handleRemove}
                  className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-100 transition-colors"
                >
                  Quitar
                </button>
              )}
            </div>
            <p className="text-[10px] text-slate-400">JPG, PNG o WebP · máx. 500 KB</p>
            {fileError && (
              <p className="text-xs font-medium text-red-600">{fileError}</p>
            )}
          </div>
        </div>

        {/* Input file oculto */}
        <input
          ref={fileRef}
          id="avatar-file"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFile}
          className="hidden"
        />

        {/* Nombre */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            Nombre visible
          </label>
          <input
            type="text"
            name="name"
            defaultValue={user.name}
            required
            onChange={(e) => setNamePreview(e.target.value)}
            className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Email — solo lectura */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            Email <span className="text-slate-300 normal-case font-medium">(solo lectura)</span>
          </label>
          <input
            type="email"
            value={user.email}
            readOnly
            className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2.5 text-sm text-slate-400 cursor-not-allowed"
          />
        </div>

        {/* Rol — solo lectura */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            Rol <span className="text-slate-300 normal-case font-medium">(solo lectura)</span>
          </label>
          <input
            type="text"
            value={ROLE_LABEL[user.role] ?? user.role}
            readOnly
            className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2.5 text-sm text-slate-400 cursor-not-allowed"
          />
        </div>

        {/* Teléfono */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            Teléfono <span className="text-slate-300 normal-case font-medium">(opcional)</span>
          </label>
          <input
            type="tel"
            name="phone"
            defaultValue={user.phone ?? ""}
            placeholder="+54 9 11 ..."
            className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Cargo */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            Cargo / Posición <span className="text-slate-300 normal-case font-medium">(opcional)</span>
          </label>
          <input
            type="text"
            name="cargo"
            defaultValue={user.cargo ?? ""}
            placeholder="Ej: Asesor financiero"
            className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Sede */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            Sede / Ubicación <span className="text-slate-300 normal-case font-medium">(opcional)</span>
          </label>
          <input
            type="text"
            name="ubicacion"
            defaultValue={user.ubicacion ?? ""}
            placeholder="Ej: Trenque Lauquen"
            className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <button
          type="submit"
          disabled={pending}
          className="self-start rounded-lg bg-slate-900 px-5 py-2 text-xs font-black uppercase tracking-widest text-white transition-opacity hover:opacity-80 disabled:opacity-50"
        >
          {pending ? "Guardando…" : "Guardar perfil"}
        </button>
      </form>
    </div>
  );
}
