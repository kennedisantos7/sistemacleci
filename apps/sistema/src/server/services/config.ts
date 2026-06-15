import { prisma } from "@cleci/db";

const DEFAULTS = { defaultRateBps: 1000, cookieDurationDays: 30 };

/** Retorna a configuração global (cria com defaults se ainda não existir). */
export async function getConfig() {
  const existing = await prisma.commissionConfig.findUnique({
    where: { singletonKey: "global" },
  });
  if (existing) return existing;

  return prisma.commissionConfig.create({
    data: { singletonKey: "global", ...DEFAULTS },
  });
}

export async function updateConfig(input: {
  defaultRateBps: number;
  cookieDurationDays: number;
}) {
  return prisma.commissionConfig.upsert({
    where: { singletonKey: "global" },
    update: input,
    create: { singletonKey: "global", ...input },
  });
}
