import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export type Topico = { id: string; titulo: string };

/** Índice clicável no topo do manual. */
export function Indice({ topicos }: { topicos: Topico[] }) {
  return (
    <nav aria-label="Tópicos do manual" className="rounded-lg border border-border bg-muted/30 p-4">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Neste manual
      </p>
      <ol className="grid gap-x-6 gap-y-1.5 text-sm sm:grid-cols-2">
        {topicos.map((t, i) => (
          <li key={t.id}>
            <a href={`#${t.id}`} className="text-primary hover:underline">
              {i + 1}. {t.titulo}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function Secao({
  id,
  titulo,
  icone: Icone,
  children,
}: {
  id: string;
  titulo: string;
  icone: LucideIcon;
  children: ReactNode;
}) {
  return (
    <Card id={id} className="scroll-mt-20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Icone className="h-5 w-5 shrink-0 text-primary" aria-hidden />
          {titulo}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm leading-relaxed">{children}</CardContent>
    </Card>
  );
}

/** Passo a passo numerado. */
export function Passos({ children }: { children: ReactNode }) {
  return <ol className="list-decimal space-y-2 pl-5 marker:font-semibold marker:text-primary">{children}</ol>;
}

/** Nome de botão, menu ou campo exatamente como aparece na tela. */
export function Tela({ children }: { children: ReactNode }) {
  return (
    <span className="whitespace-nowrap rounded border border-border bg-muted/60 px-1.5 py-0.5 font-medium text-foreground">
      {children}
    </span>
  );
}

/** Algo que, se ignorado, custa dinheiro ou trabalho. */
export function Importante({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-amber-900">
      <strong>Importante:</strong> {children}
    </div>
  );
}

/** Atalho ou boa prática. */
export function Dica({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-md border border-border bg-muted/40 px-4 py-3 text-muted-foreground">
      <strong className="text-foreground">Dica:</strong> {children}
    </div>
  );
}

/** Tabela de duas colunas: termo e explicação. */
export function Glossario({ itens }: { itens: Array<[ReactNode, ReactNode]> }) {
  return (
    <dl className="divide-y divide-border rounded-md border border-border">
      {itens.map(([termo, explicacao], i) => (
        <div key={i} className="grid gap-1 px-4 py-2.5 sm:grid-cols-[11rem_1fr] sm:gap-4">
          <dt className="font-medium text-foreground">{termo}</dt>
          <dd className="text-muted-foreground">{explicacao}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Pergunta frequente, recolhível — sem JavaScript, pelo <details> nativo. */
export function Pergunta({ pergunta, children }: { pergunta: string; children: ReactNode }) {
  return (
    <details className="group rounded-md border border-border px-4 py-3 open:bg-muted/20">
      <summary className="cursor-pointer list-none font-medium text-foreground marker:hidden">
        <span className="mr-2 inline-block text-primary transition-transform group-open:rotate-90">›</span>
        {pergunta}
      </summary>
      <div className="mt-2 space-y-2 pl-5 text-muted-foreground">{children}</div>
    </details>
  );
}
