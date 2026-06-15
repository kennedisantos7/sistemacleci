import { listUserLinks, buildShareUrl } from "@/server/services/links";
import { toggleLinkAction } from "@/server/actions/links";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LinkCreateForm } from "./link-create-form";
import { CopyButton } from "./copy-button";

export async function LinksPanel({ userId }: { userId: string }) {
  const links = await listUserLinks(userId);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Gerar novo link</CardTitle>
          <CardDescription>
            Compartilhe o link curto. O clique é contado e a venda é atribuída a você por cookie.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LinkCreateForm />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Meus links ({links.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {links.length === 0 ? (
            <p className="text-sm text-muted-foreground">Você ainda não tem links.</p>
          ) : (
            <div className="divide-y divide-border">
              {links.map((link) => {
                const shareUrl = buildShareUrl(link.ref);
                return (
                  <div
                    key={link.id}
                    className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-mono text-sm">{shareUrl}</p>
                      <p className="text-xs text-muted-foreground">
                        {link.slug ?? "/ (home)"} · {link.clicks} cliques · {link._count.sales}{" "}
                        vendas · {link.active ? "ativo" : "inativo"}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <CopyButton value={shareUrl} />
                      <form action={toggleLinkAction}>
                        <input type="hidden" name="linkId" value={link.id} />
                        <input type="hidden" name="active" value={String(!link.active)} />
                        <Button type="submit" variant={link.active ? "ghost" : "outline"} size="sm">
                          {link.active ? "Desativar" : "Ativar"}
                        </Button>
                      </form>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
