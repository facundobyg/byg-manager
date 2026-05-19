import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const emails = [
    "facundo.byg@gmail.com",
    "francisco.byg@gmail.com",
    "augusto.byg@gmail.com"
  ];

  const users = await prisma.user.findMany({
    where: {
      email: { in: emails }
    },
    select: {
      email: true,
      name: true,
      role: true,
      activo: true,
      passwordHash: true
    }
  });

  console.log("USERS_FOUND:" + JSON.stringify(users.map(u => ({
    email: u.email,
    name: u.name,
    role: u.role,
    activo: u.activo,
    hasPasswordHash: !!u.passwordHash
  }))));
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
