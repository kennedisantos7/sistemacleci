"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { searchPriceItemsAction } from "./actions";
import { Input } from "@/components/ui/input";
import { formatCents } from "@/lib/money";
import { UNIT_LABEL, type BudgetUnit } from "@/lib/budget-math";

export type PriceOption = { unit: BudgetUnit; priceCents: number };

export type ProductOption = {
  id: string;
  code: string;
  description: string;
  unit: BudgetUnit;
  priceCents: number;
  /** Todas as unidades de venda do produto, com o valor de cada uma. */
  prices: PriceOption[];
};

/** Cada unidade do produto vira uma opção clicável na lista. */
type Escolha = { option: ProductOption; price: PriceOption };

function achatar(options: ProductOption[]): Escolha[] {
  return options.flatMap((option) => {
    const precos = option.prices.length
      ? option.prices
      : [{ unit: option.unit, priceCents: option.priceCents }];
    // Unidade principal primeiro — é a que a equipe usa na maioria das vezes.
    const ordenados = [...precos].sort((a, b) =>
      a.unit === option.unit ? -1 : b.unit === option.unit ? 1 : 0,
    );
    return ordenados.map((price) => ({ option, price }));
  });
}

/**
 * Busca um produto da tabela de preços por código ou nome. Ao escolher, a linha
 * do orçamento recebe código, descrição, unidade e valor.
 */
export function ProductSearch({
  value,
  onSelect,
  onClear,
  label,
  canManagePriceItems = false,
}: {
  /** Produto já vinculado à linha (null = item avulso). */
  value: { code: string | null; description: string } | null;
  onSelect: (option: ProductOption, price: PriceOption) => void;
  onClear: () => void;
  label: string;
  /** Staff vê o atalho para cadastrar o produto que não existe na tabela. */
  canManagePriceItems?: boolean;
}) {
  const listId = useId();
  const [query, setQuery] = useState("");
  const [options, setOptions] = useState<ProductOption[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const boxRef = useRef<HTMLDivElement>(null);

  // Busca com debounce; a resposta fora de ordem é descartada.
  useEffect(() => {
    const term = query.trim();
    if (!open || term.length < 2) {
      setOptions([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    const timer = setTimeout(() => {
      searchPriceItemsAction(term)
        .then((found) => {
          if (cancelled) return;
          setOptions(found as ProductOption[]);
          setHighlight(0);
        })
        .catch(() => {
          if (!cancelled) setOptions([]);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, open]);

  /**
   * A lista NÃO fecha ao clicar fora. Fechava, e qualquer toque para rolar a
   * tela ou tocar em outro campo derrubava o resultado no meio da escolha —
   * especialmente no celular, onde o dedo encosta em qualquer lugar.
   *
   * Ela sai quando: um produto é escolhido, o texto é apagado, o vendedor
   * aperta Esc ou clica no X da própria lista.
   *
   * A única exceção é abrir a busca de OUTRO item: duas listas empilhadas na
   * tela não ajudam ninguém, então a anterior se fecha.
   */
  useEffect(() => {
    if (!open) return;
    function onFocusIn(event: FocusEvent) {
      const alvo = event.target as HTMLElement | null;
      if (!alvo || boxRef.current?.contains(alvo)) return;
      if (alvo.getAttribute("role") === "combobox") setOpen(false);
    }
    document.addEventListener("focusin", onFocusIn);
    return () => document.removeEventListener("focusin", onFocusIn);
  }, [open]);

  // Uma entrada por (produto, unidade): escolher "por m²" ou "por pacote" é um
  // clique só, sem passo intermediário de selecionar a unidade depois.
  const escolhas = achatar(options);

  function choose(escolha: Escolha) {
    onSelect(escolha.option, escolha.price);
    setQuery("");
    setOptions([]);
    setOpen(false);
  }

  // Produto já escolhido: mostra código E nome. Só o código obrigava o vendedor
  // a decorar a numeração para saber o que tinha posto na linha.
  if (value?.code) {
    return (
      <div
        className="flex min-h-10 items-start gap-2 rounded-md border border-primary/40 bg-primary/5 px-2.5 py-1.5"
        title={`${value.code} — ${value.description}`}
      >
        <span className="min-w-0 flex-1">
          <span className="block font-mono text-xs font-semibold text-primary">{value.code}</span>
          {value.description ? (
            // line-clamp-2: nome comprido não estica a linha da planilha.
            <span className="block text-xs leading-snug text-foreground line-clamp-2">
              {value.description}
            </span>
          ) : null}
        </span>
        <button
          type="button"
          onClick={onClear}
          aria-label={`Trocar o produto do ${label}`}
          title="Trocar produto"
          className="shrink-0 rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div ref={boxRef} className="relative">
      <div className="relative">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-label={`Buscar produto para o ${label}`}
          placeholder="Buscar por código ou nome..."
          className="pl-9"
          value={query}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onKeyDown={(e) => {
            if (!open || escolhas.length === 0) return;
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setHighlight((h) => (h + 1) % escolhas.length);
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setHighlight((h) => (h - 1 + escolhas.length) % escolhas.length);
            } else if (e.key === "Enter") {
              // Não deixa o Enter enviar o formulário enquanto a lista está aberta.
              e.preventDefault();
              const escolha = escolhas[highlight];
              if (escolha) choose(escolha);
            } else if (e.key === "Escape") {
              setOpen(false);
            }
          }}
        />
      </div>

      {open && query.trim().length >= 2 ? (
        // bg-card (não bg-popover): o tema deste projeto define apenas
        // background/card/muted/primary/secondary. "popover" não existe aqui,
        // e classe inexistente vira fundo transparente — a lista ficava
        // ilegível por cima do que estivesse atrás dela.
        <div className="absolute z-30 mt-1 w-[min(34rem,calc(100vw-3rem))] overflow-hidden rounded-md border border-border bg-card text-card-foreground shadow-xl">
          {/* Como a lista não fecha mais sozinha, precisa de uma saída visível. */}
          <div className="flex items-center justify-between gap-2 border-b border-border bg-muted/40 px-2 py-1.5">
            <span className="text-xs text-muted-foreground">
              {escolhas.length > 0
                ? `${escolhas.length} opç${escolhas.length === 1 ? "ão" : "ões"} — toque para escolher`
                : "Resultado da busca"}
            </span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Fechar a lista de produtos"
              title="Fechar"
              className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <ul id={listId} role="listbox" className="max-h-72 overflow-auto p-1">
          {loading && options.length === 0 ? (
            <li className="px-2 py-3 text-sm text-muted-foreground">Buscando...</li>
          ) : options.length === 0 ? (
            <li className="space-y-1 px-2 py-3 text-sm text-muted-foreground">
              <p>Nenhum produto encontrado com esse código ou nome.</p>
              <p>Você pode digitar a descrição e o valor à mão neste item.</p>
              {canManagePriceItems ? (
                <a
                  href="/admin/tabela-precos/novo"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block pt-1 font-medium text-primary hover:underline"
                >
                  Cadastrar produto na tabela de preços →
                </a>
              ) : null}
            </li>
          ) : (
            escolhas.map(({ option, price }, index) => {
              // A descrição só se repete na primeira unidade do produto; nas
              // seguintes fica recuada, para a lista não virar um paredão.
              const primeira = index === 0 || escolhas[index - 1]!.option.id !== option.id;
              return (
                <li
                  key={`${option.id}-${price.unit}`}
                  role="option"
                  aria-selected={index === highlight}
                >
                  <button
                    type="button"
                    onMouseEnter={() => setHighlight(index)}
                    onClick={() => choose({ option, price })}
                    className={`flex w-full items-start gap-2 rounded px-2 py-1.5 text-left text-sm ${
                      index === highlight ? "bg-primary/10" : ""
                    }`}
                  >
                    <span className="w-10 shrink-0 font-mono text-xs text-muted-foreground">
                      {primeira ? option.code : ""}
                    </span>
                    <span className="min-w-0 flex-1">
                      {primeira ? (
                        <span className="block truncate">{option.description}</span>
                      ) : null}
                      <span className="block text-xs text-muted-foreground">
                        {UNIT_LABEL[price.unit]} ·{" "}
                        {price.priceCents > 0 ? (
                          <>
                            {formatCents(price.priceCents)}
                            {price.unit === "M2" ? "/m²" : ""}
                          </>
                        ) : (
                          <span className="text-amber-600">preço a definir</span>
                        )}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })
          )}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
