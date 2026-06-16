import { prisma } from "@cleci/db";
import { generateRefCode } from "./ref";

/**
 * Garante que o usuário tem um código pessoal de afiliação único.
 * Idempotente e seguro contra corrida (updateMany condicional + retry).
 */
export async function ensureAffiliateCode(userId: string): Promise<string> {
  const existing = await prisma.user.findUnique({
    where: { id: userId },
    select: { affiliateCode: true },
  });
  if (existing?.affiliateCode) return existing.affiliateCode;

  for (let attempt = 0; attempt < 6; attempt++) {
    const code = generateRefCode(8);
    try {
      const res = await prisma.user.updateMany({
        where: { id: userId, affiliateCode: null },
        data: { affiliateCode: code },
      });
      if (res.count === 1) return code;

      // count 0 → outro request já gerou; relê e retorna.
      const again = await prisma.user.findUnique({
        where: { id: userId },
        select: { affiliateCode: true },
      });
      if (again?.affiliateCode) return again.affiliateCode;
    } catch {
      // colisão de unique → tenta outro código
    }
  }
  throw new Error("Não foi possível gerar o código de afiliação.");
}
