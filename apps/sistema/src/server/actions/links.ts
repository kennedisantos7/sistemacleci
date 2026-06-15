"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/server/session";
import { createAffiliateLink, setLinkActive } from "@/server/services/links";
import { ROLE_HOME } from "@/lib/rbac";

const createSchema = z.object({
  slug: z.string().max(200).optional(),
  utmSource: z.string().max(100).optional(),
  utmMedium: z.string().max(100).optional(),
  utmCampaign: z.string().max(100).optional(),
});

export type LinkFormState = { error?: string; success?: boolean };

export async function createLinkAction(
  _prev: LinkFormState,
  formData: FormData,
): Promise<LinkFormState> {
  // Apenas afiliados e vendedores geram links.
  const user = await requireUser(["AFILIADO", "VENDEDOR_FIXO"]);

  const parsed = createSchema.safeParse({
    slug: formData.get("slug") || undefined,
    utmSource: formData.get("utmSource") || undefined,
    utmMedium: formData.get("utmMedium") || undefined,
    utmCampaign: formData.get("utmCampaign") || undefined,
  });
  if (!parsed.success) return { error: "Dados inválidos." };

  try {
    await createAffiliateLink({ userId: user.id, ...parsed.data });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Erro ao criar link." };
  }

  revalidatePath(`${ROLE_HOME[user.role]}/links`);
  return { success: true };
}

export async function toggleLinkAction(formData: FormData): Promise<void> {
  const user = await requireUser(["AFILIADO", "VENDEDOR_FIXO"]);
  const linkId = String(formData.get("linkId") ?? "");
  const active = String(formData.get("active") ?? "") === "true";
  if (!linkId) return;

  await setLinkActive(user.id, linkId, active);
  revalidatePath(`${ROLE_HOME[user.role]}/links`);
}
