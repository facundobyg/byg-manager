import { signOut } from "@/auth";
import { LogOut, User } from "lucide-react";
import { VerComoSelector } from "./VerComoSelector";
import { CommandPaletteTrigger } from "./CommandPaletteTrigger";
import { ThemeToggle } from "./ThemeToggle";
import { NotificationsDropdown } from "./NotificationsDropdown";
import type { AppNotification } from "@/lib/data/notifications";

export function Topbar({
  userName,
  userRole,
  isAdmin,
  previewUsers,
  currentPreviewId,
  notifications = [],
}: {
  userName?: string | null;
  userRole?: string | null;
  isAdmin?: boolean;
  previewUsers?: { id: string; name: string }[];
  currentPreviewId?: string | null;
  notifications?: AppNotification[];
}) {
  return (
    <header className="sticky top-0 z-10 flex h-16 flex-row items-center justify-between border-b border-byg-border bg-byg-sidebar/95 backdrop-blur-[12px] px-6">
      <div className="flex-1">
        {isAdmin && previewUsers && previewUsers.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-byg-muted whitespace-nowrap">
              Ver como
            </span>
            <VerComoSelector
              users={previewUsers}
              currentPreviewId={currentPreviewId ?? null}
            />
          </div>
        )}
      </div>

      <div className="flex-1 flex justify-center">
        <CommandPaletteTrigger />
      </div>

      <div className="flex-1 flex flex-row items-center justify-end gap-4">
        <div className="flex flex-col text-right">
          <span className="text-sm font-semibold text-byg-text">{userName}</span>
          <span className="text-xs font-medium text-byg-muted">{userRole}</span>
        </div>

        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-byg-accent/10 text-byg-accent">
          <User size={18} />
        </div>

        <NotificationsDropdown notifications={notifications} />
        <ThemeToggle />

        <div className="mx-1 h-8 w-px bg-byg-border"></div>

        <form action={async () => {
          "use server"
          await signOut({ redirectTo: '/login' });
        }}>
          <button
            type="submit"
            title="Cerrar sesión"
            className="rounded-lg p-2 text-byg-muted transition-colors hover:bg-red-500/10 hover:text-red-400 cursor-pointer"
          >
            <LogOut size={20} />
          </button>
        </form>
      </div>
    </header>
  );
}
