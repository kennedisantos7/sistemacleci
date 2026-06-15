import { requireUser } from "@/server/session";
import { LinksPanel } from "@/components/links/links-panel";

export const dynamic = "force-dynamic";

export default async function AfiliadoLinksPage() {
  const user = await requireUser(["AFILIADO"]);
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Meus links de afiliado</h1>
        <p className="text-muted-foreground">Gere e acompanhe seus links de divulgação.</p>
      </header>
      <LinksPanel userId={user.id} />
    </div>
  );
}
