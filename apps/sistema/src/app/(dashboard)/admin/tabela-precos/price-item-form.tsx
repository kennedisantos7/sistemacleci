"use client";

import { useActionState, useState } from "react";
import {
  createPriceItemAction,
  updatePriceItemAction,
  type PriceItemFormState,
} from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UNIT_LABEL, type BudgetUnit } from "@/lib/budget-math";

const initial: PriceItemFormState = {};

const UNITS: BudgetUnit[] = ["M2", "UNIDADE", "PACOTE", "MILHEIRO"];

const AJUDA_UNIDADE: Record<BudgetUnit, string> = {
  M2: "cobra por área (largura × comprimento)",
  UNIDADE: "cobra por peça",
  PACOTE: "cobra por pacote fechado",
  MILHEIRO: "cobra a cada mil peças",
};

export type PriceItemDefaults = {
  id?: string;
  code?: string;
  description?: string;
  unit?: BudgetUnit;
  priceCents?: number;
  prices?: Array<{ unit: BudgetUnit; priceCents: number }>;
  group?: string | null;
  active?: boolean;
};

const centavosParaTexto = (c: number) => (c ? (c / 100).toFixed(2).replace(".", ",") : "");

type LinhaPreco = { unit: BudgetUnit; valor: string };

function linhasIniciais(defaults?: PriceItemDefaults): LinhaPreco[] {
  if (defaults?.prices?.length) {
    return defaults.prices.map((p) => ({ unit: p.unit, valor: centavosParaTexto(p.priceCents) }));
  }
  // Cadastro novo (ou produto sem linhas): começa com a unidade principal.
  return [
    { unit: defaults?.unit ?? "UNIDADE", valor: centavosParaTexto(defaults?.priceCents ?? 0) },
  ];
}

export function PriceItemForm({ defaults }: { defaults?: PriceItemDefaults }) {
  const isEdit = Boolean(defaults?.id);
  const [state, action, pending] = useActionState(
    isEdit ? updatePriceItemAction : createPriceItemAction,
    initial,
  );

  const [linhas, setLinhas] = useState<LinhaPreco[]>(() => linhasIniciais(defaults));
  const [principal, setPrincipal] = useState<BudgetUnit>(
    () => defaults?.unit ?? linhasIniciais(defaults)[0]!.unit,
  );

  const usadas = new Set(linhas.map((l) => l.unit));
  const disponiveis = UNITS.filter((u) => !usadas.has(u));

  function alterar(index: number, patch: Partial<LinhaPreco>) {
    setLinhas((atual) => atual.map((l, i) => (i === index ? { ...l, ...patch } : l)));
  }

  function remover(index: number) {
    const removida = linhas[index]!;
    const restantes = linhas.filter((_, i) => i !== index);
    setLinhas(restantes);
    // A principal não pode ficar apontando para uma unidade que saiu.
    if (removida.unit === principal && restantes[0]) setPrincipal(restantes[0].unit);
  }

  function adicionar() {
    const proxima = disponiveis[0];
    if (proxima) setLinhas((atual) => [...atual, { unit: proxima, valor: "" }]);
  }

  return (
    <form action={action} className="grid gap-3 sm:grid-cols-2">
      {isEdit ? <input type="hidden" name="priceItemId" value={defaults!.id} /> : null}

      {/* O servidor lê os preços daqui; os campos visíveis só alimentam este JSON. */}
      <input
        type="hidden"
        name="pricesJson"
        value={JSON.stringify(linhas.map((l) => ({ unit: l.unit, valor: l.valor })))}
      />
      <input type="hidden" name="unit" value={principal} />

      <div className="space-y-1">
        <label htmlFor="pi-code" className="text-sm font-medium">
          Código *
        </label>
        <Input id="pi-code" name="code" required defaultValue={defaults?.code ?? ""} />
      </div>
      <div className="space-y-1">
        <label htmlFor="pi-group" className="text-sm font-medium">
          Grupo
        </label>
        <Input
          id="pi-group"
          name="group"
          placeholder="ex.: Tapetes"
          defaultValue={defaults?.group ?? ""}
        />
      </div>
      <div className="space-y-1 sm:col-span-2">
        <label htmlFor="pi-description" className="text-sm font-medium">
          Descrição *
        </label>
        <Input
          id="pi-description"
          name="description"
          required
          defaultValue={defaults?.description ?? ""}
        />
      </div>

      {/* --- Valores por unidade de venda --- */}
      <fieldset className="space-y-3 rounded-lg border border-border p-4 sm:col-span-2">
        <legend className="px-1 text-sm font-medium">Valores de venda *</legend>
        <p className="text-xs text-muted-foreground">
          O mesmo produto pode ser vendido por m², pacote, unidade ou milheiro, com valor
          diferente em cada uma. Marque qual vem pré-selecionada no orçamento — o vendedor pode
          trocar na hora de montar.
        </p>

        <div className="space-y-2">
          {linhas.map((linha, i) => (
            <div key={linha.unit} className="flex flex-wrap items-end gap-2">
              <label className="flex items-center gap-2 text-xs sm:w-24">
                <input
                  type="radio"
                  name="principalVisual"
                  checked={principal === linha.unit}
                  onChange={() => setPrincipal(linha.unit)}
                  aria-label={`Usar ${UNIT_LABEL[linha.unit]} como unidade principal`}
                  className="h-4 w-4"
                />
                <span className={principal === linha.unit ? "font-medium" : ""}>Principal</span>
              </label>

              <div className="min-w-0 flex-1 space-y-1 sm:max-w-[12rem]">
                <span className="block text-xs text-muted-foreground">Unidade</span>
                <select
                  value={linha.unit}
                  onChange={(e) => {
                    const nova = e.target.value as BudgetUnit;
                    if (principal === linha.unit) setPrincipal(nova);
                    alterar(i, { unit: nova });
                  }}
                  className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
                >
                  {/* Só as unidades livres, mais a própria: a unique no banco
                      não deixa o mesmo produto ter duas linhas por m². */}
                  {[linha.unit, ...disponiveis].map((u) => (
                    <option key={u} value={u}>
                      {UNIT_LABEL[u]}
                    </option>
                  ))}
                </select>
              </div>

              <div className="min-w-0 flex-1 space-y-1 sm:max-w-[10rem]">
                <span className="block text-xs text-muted-foreground">Valor (R$)</span>
                <Input
                  inputMode="decimal"
                  placeholder="0,00"
                  value={linha.valor}
                  onChange={(e) => alterar(i, { valor: e.target.value })}
                  aria-label={`Valor por ${UNIT_LABEL[linha.unit]}`}
                />
              </div>

              <span className="hidden text-xs text-muted-foreground sm:block sm:flex-1">
                {AJUDA_UNIDADE[linha.unit]}
              </span>

              {linhas.length > 1 ? (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => remover(i)}
                  aria-label={`Remover o valor por ${UNIT_LABEL[linha.unit]}`}
                >
                  Remover
                </Button>
              ) : null}
            </div>
          ))}
        </div>

        {disponiveis.length > 0 ? (
          <Button type="button" size="sm" variant="outline" onClick={adicionar}>
            + Adicionar unidade
          </Button>
        ) : (
          <p className="text-xs text-muted-foreground">Todas as unidades já têm valor.</p>
        )}

        <p className="text-xs text-muted-foreground">
          Deixe 0 para &quot;preço a definir&quot; — o vendedor digita no orçamento.
        </p>
      </fieldset>

      <label className="flex items-center gap-2 text-sm sm:col-span-2">
        <input
          type="checkbox"
          name="active"
          defaultChecked={defaults?.active ?? true}
          className="h-4 w-4"
        />
        Ativo (aparece na busca do orçamento)
      </label>

      {state.error ? <p className="text-sm text-red-600 sm:col-span-2">{state.error}</p> : null}

      <div className="sm:col-span-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Salvando..." : isEdit ? "Salvar alterações" : "Adicionar produto"}
        </Button>
      </div>
    </form>
  );
}
