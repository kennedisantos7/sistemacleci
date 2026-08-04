import { prisma } from "@cleci/db";

const DEFAULTS = {
  defaultRateBps: 1000,
  cookieDurationDays: 30,
  afiliadoVendaBps: 800, // 8% — venda fechada no gateway
  afiliadoIndicacaoBps: 300, // 3% — apenas indicação (WhatsApp)
  desenvolvedorBps: 1000, // 10% — participação do desenvolvedor (relatório)
  vendedorFixoBps: 0, // definido pelo admin; 0 = ainda não combinado
};

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

export type ConfigInput = {
  cookieDurationDays: number;
  afiliadoVendaBps: number;
  afiliadoIndicacaoBps: number;
  desenvolvedorBps: number;
  vendedorFixoBps: number;
};

export async function updateConfig(input: ConfigInput) {
  return prisma.commissionConfig.upsert({
    where: { singletonKey: "global" },
    update: input,
    create: { singletonKey: "global", defaultRateBps: DEFAULTS.defaultRateBps, ...input },
  });
}
