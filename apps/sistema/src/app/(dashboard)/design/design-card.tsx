import Image from "next/image";
import { DESIGN_STATUS_LABEL, DESIGN_STATUS_STYLE } from "@/lib/design-flow";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { DesignPanel } from "@/server/services/design";
import { ArtUpload } from "./art-upload";
import {
  RequestDesignForm,
  CancelDesignButton,
  ClaimDesignButton,
  DeliverDesignForm,
  RequestRevisionForm,
  ApproveArtButton,
} from "./design-buttons";

function Bloco({ titulo, texto }: { titulo: string; texto: string | null }) {
  if (!texto) return null;
  return (
    <div className="rounded-md bg-muted p-3">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{titulo}</p>
      <p className="whitespace-pre-wrap text-sm">{texto}</p>
    </div>
  );
}

/**
 * Cartão da arte dentro do orçamento. Serve aos dois lados: o vendedor envia,
 * revisa e aprova; o design assume, anexa e entrega. Cada um só vê os botões
 * que a máquina de estados liberou (`panel.acoes`).
 */
export function DesignCard({ budgetId, panel }: { budgetId: string; panel: DesignPanel }) {
  const { designStatus, arts, acoes } = panel;
  const atual = arts.find((a) => a.current) ?? arts[0];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center gap-2">
          Arte
          {designStatus ? (
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${DESIGN_STATUS_STYLE[designStatus]}`}
            >
              {DESIGN_STATUS_LABEL[designStatus]}
            </span>
          ) : (
            <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
              Sem arte
            </span>
          )}
        </CardTitle>
        <CardDescription>
          {designStatus === null
            ? "Enviar para o design é opcional — o orçamento segue normalmente sem isso."
            : panel.designer
              ? `Com ${panel.designer.name ?? panel.designer.email}.`
              : "Ainda não assumido por ninguém."}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <Bloco titulo="Briefing do vendedor" texto={panel.designBrief} />
        <Bloco titulo="Recado do design" texto={panel.designerNote} />

        {/* Arte atual em moldura quadrada — o mesmo enquadramento do PDF. */}
        {atual ? (
          <div className="space-y-2">
            <div className="relative aspect-square w-full max-w-xs overflow-hidden rounded-lg border border-border bg-muted">
              <Image
                src={`/api/design/${budgetId}/arte/${atual.id}`}
                alt={`Arte versão ${atual.version}`}
                fill
                sizes="320px"
                className="object-contain"
                // A imagem vem do nosso servidor, já autenticada; o otimizador
                // do Next não consegue buscá-la (a rota exige sessão).
                unoptimized
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Versão {atual.version}
              {atual.widthPx && atual.heightPx ? ` · ${atual.widthPx}×${atual.heightPx}px` : ""} ·{" "}
              {(atual.sizeBytes / 1024).toFixed(0)} KB ·{" "}
              {atual.createdAt.toLocaleDateString("pt-BR")}
              {atual.uploadedBy ? ` · ${atual.uploadedBy.name ?? atual.uploadedBy.email}` : ""}
            </p>

            {arts.length > 1 ? (
              <details className="text-xs">
                <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                  Versões anteriores ({arts.length - 1})
                </summary>
                <div className="mt-2 flex flex-wrap gap-2">
                  {arts
                    .filter((a) => a.id !== atual.id)
                    .map((a) => (
                      <a
                        key={a.id}
                        href={`/api/design/${budgetId}/arte/${a.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="relative block h-20 w-20 overflow-hidden rounded border border-border bg-muted"
                        title={`Versão ${a.version} — ${a.createdAt.toLocaleDateString("pt-BR")}`}
                      >
                        <Image
                          src={`/api/design/${budgetId}/arte/${a.id}`}
                          alt={`Versão ${a.version}`}
                          fill
                          sizes="80px"
                          className="object-contain"
                          unoptimized
                        />
                      </a>
                    ))}
                </div>
              </details>
            ) : null}
          </div>
        ) : null}

        {/* Ações — cada papel vê só o que pode fazer agora. */}
        <div className="flex flex-col gap-4 border-t border-border pt-4">
          {acoes.solicitar ? <RequestDesignForm budgetId={budgetId} /> : null}
          {acoes.cancelar ? <CancelDesignButton budgetId={budgetId} /> : null}
          {acoes.assumir ? <ClaimDesignButton budgetId={budgetId} /> : null}
          {acoes.anexar ? <ArtUpload budgetId={budgetId} /> : null}
          {acoes.anexar ? (
            <DeliverDesignForm budgetId={budgetId} habilitado={acoes.entregar} />
          ) : null}
          {acoes.aprovar ? <ApproveArtButton budgetId={budgetId} /> : null}
          {acoes.revisar ? <RequestRevisionForm budgetId={budgetId} /> : null}
        </div>
      </CardContent>
    </Card>
  );
}
