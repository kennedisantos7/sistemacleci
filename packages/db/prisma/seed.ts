import { PrismaClient, Role, UserStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // 1) Configuração global (singleton)
  await prisma.commissionConfig.upsert({
    where: { singletonKey: "global" },
    update: {},
    create: {
      singletonKey: "global",
      defaultRateBps: 1000, // 10%
      cookieDurationDays: 30,
    },
  });
  console.log("✓ CommissionConfig global garantida");

  // 2) Admin inicial
  const email = process.env.SEED_ADMIN_EMAIL ?? "admin@clecipersonalizados.com.br";
  const password = process.env.SEED_ADMIN_PASSWORD ?? "trocar-no-primeiro-acesso";
  const passwordHash = await bcrypt.hash(password, 12);

  const admin = await prisma.user.upsert({
    where: { email },
    update: { role: Role.ADMIN, status: UserStatus.ATIVO },
    create: {
      email,
      name: "Administrador Cleci",
      role: Role.ADMIN,
      status: UserStatus.ATIVO,
      passwordHash,
      emailVerified: new Date(),
    },
  });
  console.log(`✓ Admin pronto: ${admin.email}`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
