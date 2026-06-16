import { NextResponse, type NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma, Role, UserStatus } from "@cleci/db";
import { safeEqual } from "@/server/security";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const bodySchema = z.object({
  email: z.string().email().optional(),
  password: z.string().min(8).optional(),
  name: z.string().max(120).optional(),
});

/**
 * Bootstrap do administrador inicial — uso ÚNICO no primeiro deploy.
 * Protegido por BOOTSTRAP_TOKEN (header x-bootstrap-token). Recusa se já existir
 * um ADMIN. Após criar o admin, remova a variável BOOTSTRAP_TOKEN do ambiente.
 */
export async function POST(req: NextRequest) {
  const expected = process.env.BOOTSTRAP_TOKEN;
  const provided = req.headers.get("x-bootstrap-token");
  if (!expected || !provided || !safeEqual(provided, expected)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // Só funciona enquanto não houver nenhum ADMIN (uso único).
  const adminExists = await prisma.user.count({ where: { role: Role.ADMIN } });
  if (adminExists > 0) {
    return NextResponse.json({ error: "admin já existe" }, { status: 409 });
  }

  const json = await req.json().catch(() => ({}));
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "dados inválidos", issues: parsed.error.issues }, { status: 422 });
  }

  const email = parsed.data.email ?? process.env.SEED_ADMIN_EMAIL;
  const password = parsed.data.password ?? process.env.SEED_ADMIN_PASSWORD;
  const name = parsed.data.name ?? "Administrador Cleci";
  if (!email || !password || password.length < 8) {
    return NextResponse.json(
      { error: "informe email e password (mín. 8 caracteres) no corpo ou via SEED_ADMIN_*" },
      { status: 422 },
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.$transaction([
    prisma.user.create({
      data: {
        email,
        name,
        role: Role.ADMIN,
        status: UserStatus.ATIVO,
        passwordHash,
        emailVerified: new Date(),
      },
    }),
    prisma.commissionConfig.upsert({
      where: { singletonKey: "global" },
      update: {},
      create: { singletonKey: "global", defaultRateBps: 1000, cookieDurationDays: 30 },
    }),
  ]);

  return NextResponse.json({ ok: true, email });
}
