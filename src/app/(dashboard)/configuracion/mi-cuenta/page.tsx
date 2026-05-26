import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { ProfileForm } from "@/components/modules/cuenta/ProfileForm";
import { ChangePasswordForm } from "@/components/modules/cuenta/ChangePasswordForm";

export default async function MiCuentaPage() {
  const session = await auth() as { user?: { id?: string } } | null;
  if (!session?.user?.id) redirect("/login");

  const user = await prisma.user.findUnique({
    where:  { id: session.user.id },
    select: {
      name:              true,
      email:             true,
      role:              true,
      image:             true,
      phone:             true,
      cargo:             true,
      ubicacion:         true,
      mustChangePassword: true,
    },
  });
  if (!user) redirect("/login");

  return (
    <div className="flex flex-col gap-8">
      <header>
        <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em]">Cuenta</p>
        <h1 className="text-4xl font-black text-slate-900 tracking-tight">Mi cuenta</h1>
        <p className="text-sm text-slate-400 font-medium mt-1">{user.name} · {user.email}</p>
      </header>

      <section className="flex flex-col gap-3">
        <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Perfil</h2>
        <ProfileForm
          user={{
            name:      user.name,
            email:     user.email,
            role:      user.role,
            image:     user.image,
            phone:     user.phone,
            cargo:     user.cargo,
            ubicacion: user.ubicacion,
          }}
        />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Contraseña</h2>
        <ChangePasswordForm mustChangePassword={user.mustChangePassword} />
      </section>
    </div>
  );
}
