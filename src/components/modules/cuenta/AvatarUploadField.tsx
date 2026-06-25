"use client";

import { useId, useRef, useState } from "react";
import { UserAvatar } from "./UserAvatar";

const MAX_BYTES    = 500 * 1024; // 500 KB
const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp"] as const;
type AllowedMime    = typeof ALLOWED_MIME[number];

type Size = "sm" | "lg";

const SIZE_CLASSES: Record<Size, { wrapper: string; icon: number }> = {
  lg: { wrapper: "h-20 w-20", icon: 28 },
  sm: { wrapper: "h-12 w-12", icon: 18 },
};

export function AvatarUploadField({
  name,
  value,
  onChange,
  previewName,
  size = "lg",
}: {
  name: string;
  value: string | null;
  onChange: (value: string | null) => void;
  previewName?: string | null;
  size?: Size;
}) {
  const [fileError, setFileError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const inputId = useId();
  const { wrapper, icon } = SIZE_CLASSES[size];

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
    reader.onload = (ev) => onChange(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  function handleRemove() {
    onChange(null);
    if (fileRef.current) fileRef.current.value = "";
    setFileError(null);
  }

  return (
    <div className="flex items-center gap-5">
      <input type="hidden" name={name} value={value ?? ""} />

      <div className={`${wrapper} shrink-0 rounded-full overflow-hidden bg-byg-accent/10 border border-slate-200 flex items-center justify-center`}>
        <UserAvatar image={value} name={previewName} iconSize={icon} />
      </div>
      <div className="flex flex-col gap-2">
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
          Foto de perfil
        </p>
        <div className="flex items-center gap-2">
          <label
            htmlFor={inputId}
            className="cursor-pointer rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-200 transition-colors"
          >
            {value ? "Cambiar foto" : "Subir foto"}
          </label>
          {value && (
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

      <input
        ref={fileRef}
        id={inputId}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFile}
        className="hidden"
      />
    </div>
  );
}
