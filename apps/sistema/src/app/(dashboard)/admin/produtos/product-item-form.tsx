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
  imageUrl?: string | null;
  categoryId?: string | null;
  subcategoryId?: string | null;
  /** Já está publicado na vitrine? */
  noSite?: boolean;
  /** Id da vitrine, para o atalho dos detalhes de site. */
  siteProductId?: string | null;
  active?: boolean;
};

export type CategoriaOpcao = {
  id: string;
  name: string;
  subcategories: Array<{ id: string; name: string }>;
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

export function PriceItemForm({
  defaults,
  categorias = [],
}: {
  defaults?: PriceItemDefaults;
  /** Categorias do site com seus subtipos, na ordem do menu. */
  categorias?: CategoriaOpcao[];
}) {
  const isEdit = Boolean(defaults?.id);
  const [state, action, pending] = useActionState(
    isEdit ? updatePriceItemAction : createPriceItemAction,
    initial,
  );

  const [linhas, setLinhas] = useState<LinhaPreco[]>(() => linhasIniciais(defaults));
  const [principal, setPrincipal] = useState<BudgetUnit>(
    () => defaults?.unit ?? linhasIniciais(defaults)[0]!.unit,
  );

  // Categoria e foto ficam no estado porque a chave "Subir no site" depende
  // das duas: sem elas o site não monta o card, então o aviso tem de aparecer
  // enquanto se digita, não só depois de salvar.
  const [categoryId, setCategoryId] = useState(defaults?.categoryId ?? "");
  const [subcategoryId, setSubcategoryId] = useState(defaults?.subcategoryId ?? "");
  const [imageUrl, setImageUrl] = useState(defaults?.imageUrl ?? "");
  const [noSite, setNoSite] = useState(defaults?.noSite ?? false);

  const subtipos = categorias.find((c) => c.id === categoryId)?.subcategories ?? [];
  const faltaParaSite = [!imageUrl.trim() && "a foto", !categoryId && "a categoria"].filter(
    (v): v is string => Boolean(v),
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
        <label htmlFor="pi-category" className="text-sm font-medium">
          Categoria
        </label>
        <select
          id="pi-category"
          name="categoryId"
          value={categoryId}
          onChange={(e) => {
            setCategoryId(e.target.value);
            setSubcategoryId(""); // subtipo da categoria anterior não vale mais
          }}
          className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
        >
          <option value="">Sem categoria</option>
          {categorias.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        {categorias.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            Nenhuma categoria cadastrada no site ainda.
          </p>
        ) : null}
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

      {/* Subtipo só faz sentido depois da categoria — e só se ela tiver algum. */}
      {subtipos.length > 0 ? (
        <div className="space-y-1">
          <label htmlFor="pi-subcategory" className="text-sm font-medium">
            Subtipo
          </label>
          <select
            id="pi-subcategory"
            name="subcategoryId"
            value={subcategoryId}
            onChange={(e) => setSubcategoryId(e.target.value)}
            className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
          >
            <option value="">Sem subtipo</option>
            {subtipos.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      ) : (
        <input type="hidden" name="subcategoryId" value="" />
      )}

      {/* --- Foto ------------------------------------------------------- */}
      <div className="space-y-1 sm:col-span-2">
        <label htmlFor="pi-image" className="text-sm font-medium">
          Foto do produto
        </label>
        <div className="flex items-start gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl.trim() || "/logo-cleci-icone.png"}
            alt=""
            className="h-16 w-16 shrink-0 rounded-md border border-border bg-muted object-contain p-1"
          />
          <div className="min-w-0 flex-1 space-y-1">
            <Input
              id="pi-image"
              name="imageUrl"
              type="url"
              inputMode="url"
              placeholder="https://..."
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Cole o link da imagem. Ela aparece na busca do orçamento e sai no PDF do
              orçamento e do pedido.
            </p>
          </div>
        </div>
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

      {/* --- Vitrine do site --------------------------------------------- */}
      <fieldset className="space-y-3 rounded-lg border border-border p-4 sm:col-span-2">
        <legend className="px-1 text-sm font-medium">Site</legend>

        <label className="flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            name="noSite"
            checked={noSite}
            onChange={(e) => setNoSite(e.target.checked)}
            disabled={faltaParaSite.length > 0 && !noSite}
            className="mt-0.5 h-4 w-4"
          />
          <span>
            <span className="font-medium">Subir no site</span>
            <span className="block text-xs text-muted-foreground">
              Publica este produto na vitrine, na categoria escolhida acima.
            </span>
          </span>
        </label>

        {faltaParaSite.length > 0 ? (
          <p className="text-xs text-amber-700">
            Para subir no site, preencha {faltaParaSite.join(" e ")}.
          </p>
        ) : null}

        {/* Galeria, bordas, linhas e selo são só da vitrine e ficam na tela
            dela — trazer tudo para cá dobraria o tamanho deste formulário. */}
        {noSite && defaults?.siteProductId ? (
          <a
            href={`/admin/produtos/site/${defaults.siteProductId}/editar`}
            className="inline-block text-sm text-primary hover:underline"
          >
            Editar detalhes do site (galeria, tamanhos, bordas, linhas) →
          </a>
        ) : null}
        {noSite && !defaults?.siteProductId ? (
          <p className="text-xs text-muted-foreground">
            Depois de salvar, o atalho para galeria, tamanhos e linhas aparece aqui.
          </p>
        ) : null}
      </fieldset>

      {state.error ? <p className="text-sm text-red-600 sm:col-span-2">{state.error}</p> : null}

      <div className="sm:col-span-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Salvando..." : isEdit ? "Salvar alterações" : "Adicionar produto"}
        </Button>
      </div>
    </form>
  );
}
