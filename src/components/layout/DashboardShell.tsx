"use client";

import { ReactNode } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { CommandPaletteRoot } from "@/components/layout/CommandPaletteRoot";

type CarteraLink = { nombre: string; slug: string };
type CuentaInversionLink = { id: string; nombre: string };

export function DashboardShell({
  children,
  carteras,
  cuentasInversion,
  allowedPermissions,
}: {
  children: ReactNode;
  carteras: CarteraLink[];
  cuentasInversion: CuentaInversionLink[];
  allowedPermissions: string[] | null;
}) {
  return (
    <div className="flex min-h-screen bg-byg-bg">
      <Sidebar
        carteras={carteras}
        cuentasInversion={cuentasInversion}
        allowedPermissions={allowedPermissions}
      />
      <div className="ml-64 flex min-w-0 flex-1 flex-col">
        {children}
      </div>
      <CommandPaletteRoot allowedPermissions={allowedPermissions} />
    </div>
  );
}
