import { requireUser } from "@/server/session";
import { LinksPanel } from "@/components/links/links-panel";

export const dynamic = "force-dynamic";

export default async function VendedorLinksPage() {
  const user = await requireUser(["VENDEDOR_FIXO"]);
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Meus links de venda</h1>
        <p className="text-muted-foreground">Gere links parametrizados para acompanhar conversão.</p>
      </header>
      <LinksPanel userId={user.id} />
    </div>
  );
}
