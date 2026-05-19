"use client";
import { useTransition } from "react";
import { useRouter } from "next/navigation";

export function VerComoSelector({
  users,
  currentPreviewId,
}: {
  users: { id: string; name: string }[];
  currentPreviewId: string | null;
}) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const userId = e.target.value;
    startTransition(async () => {
      await fetch("/api/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      router.refresh();
    });
  }

  return (
    <select
      onChange={handleChange}
      defaultValue={currentPreviewId ?? ""}
      disabled={pending}
      className="text-[11px] font-semibold rounded-lg border border-byg-border bg-byg-bg px-2 py-1 text-byg-text cursor-pointer disabled:opacity-50 hover:border-byg-border-2 transition-colors"
    >
      <option value="">Facu / Admin</option>
      {users.map((u) => (
        <option key={u.id} value={u.id}>
          {u.name}
        </option>
      ))}
    </select>
  );
}
