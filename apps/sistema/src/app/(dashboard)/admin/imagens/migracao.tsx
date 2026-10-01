"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DatabaseZap, Loader2, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type Falha = { url: string; motivo: string };

async function chamar<T>(body: object): Promise<T> {
  const res = await fetch("/api/admin/media/import", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error("O servidor recusou o pedido. Atualize a página e tente de novo.");
  return (await res.json()) as T;
}

/** Botões que trazem os links externos para o banco e preenchem as fotos da tabela. */
export function Migracao({ linksExternos, casaveis }: { linksExternos: number; casaveis: number }) {
  const router = useRouter();
  const [importando, setImportando] = useState(false);
  const [feitos, setFeitos] = useState(0);
  const [falhas, setFalhas] = useState<Falha[]>([]);
  const [casando, setCasando] = useState(false);
  const [mensagem, setMensagem] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  async function importar() {
    setImportando(true);
    setErro(null);
    setMensagem(null);
    const falharam: Falha[] = [];
    let total = 0;
    try {
      // Lotes pequenos: cada chamada baixa alguns arquivos e já troca as
      // referências, então parar no meio não deixa nada pela metade.
      for (;;) {
        const r = await chamar<{ importados: unknown[]; falhas: Falha[]; restantes: number }>({
          acao: "importar",
          ignorar: falharam.map((f) => f.url),
        });
        total += r.importados.length;
        falharam.push(...r.falhas);
        setFeitos(total);
        setFalhas([...falharam]);
        if (r.restantes === 0) break;
      }
      setMensagem(`${total} arquivo${total === 1 ? "" : "s"} trazido${total === 1 ? "" : "s"} para o banco.`);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Falha na importação.");
    } finally {
      setImportando(false);
      router.refresh();
    }
  }

  async function casar() {
    setCasando(true);
    setErro(null);
    setMensagem(null);
    try {
      const r = await chamar<{ casados: unknown[] }>({ acao: "casar-codigos" });
      setMensagem(`${r.casados.length} ite${r.casados.length === 1 ? "m ganhou" : "ns ganharam"} foto pelo código.`);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Falha ao preencher as fotos.");
    } finally {
      setCasando(false);
      router.refresh();
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <Button type="button" onClick={importar} disabled={importando || linksExternos === 0}>
          {importando ? <Loader2 className="h-4 w-4 animate-spin" /> : <DatabaseZap className="h-4 w-4" />}
          {importando
            ? `Trazendo... ${feitos} de ${linksExternos}`
            : linksExternos === 0
              ? "Nenhum link externo"
              : `Trazer ${linksExternos} arquivo${linksExternos === 1 ? "" : "s"} externo${linksExternos === 1 ? "" : "s"} para o banco`}
        </Button>
        <Button type="button" variant="outline" onClick={casar} disabled={casando || casaveis === 0}>
          {casando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
          {casaveis === 0
            ? "Nenhum item para casar pelo código"
            : `Preencher a foto de ${casaveis} ite${casaveis === 1 ? "m" : "ns"} pelo código`}
        </Button>
      </div>

      {mensagem ? <p className="text-sm text-green-700">{mensagem}</p> : null}
      {erro ? <p className="text-sm text-red-600">{erro}</p> : null}
      {falhas.length > 0 ? (
        <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
          <p className="font-medium">
            {falhas.length} link{falhas.length === 1 ? "" : "s"} não {falhas.length === 1 ? "pôde" : "puderam"} ser
            trazido{falhas.length === 1 ? "" : "s"} — continua{falhas.length === 1 ? "" : "m"} como link externo:
          </p>
          <ul className="mt-1 space-y-0.5 text-xs">
            {falhas.map((f) => (
              <li key={f.url} className="break-all">
                {f.url} — {f.motivo}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
