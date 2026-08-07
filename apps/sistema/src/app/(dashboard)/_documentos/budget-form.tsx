"use client";

import { useActionState, useMemo, useRef, useState } from "react";
import { PackageSearch, Plus, Trash2, X } from "lucide-react";
import { createBudgetAction, updateBudgetAction, type BudgetFormState } from "./actions";
import { ProductSearch, type ProductOption, type PriceOption } from "./product-search";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  formatCents,
  formatDecimal,
  parseReaisToCentsAllowZero,
  parseQuantity,
  parseMeters,
  parsePercentToBps,
} from "@/lib/money";
import {
  calcItem,
  calcTotals,
  UNIT_LABEL,
  type BudgetUnit,
  type AdjustmentKind,
} from "@/lib/budget-math";
import { FORMAS_PAGAMENTO, PRAZOS_ENTREGA, CIDADES_TOCANTINS } from "@/lib/budget-options";

const initial: BudgetFormState = {};

const UNITS: BudgetUnit[] = ["M2", "UNIDADE", "PACOTE", "MILHEIRO"];

const SELECT_CLASS =
  "flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary";

/**
 * Colunas da "planilha" no desktop (xl+). Abaixo disso cada item vira um card
 * de 2 colunas. Usada no cabeçalho e nas linhas — precisam bater exatamente.
 */
const GRID_COLS =
  "xl:grid-cols-[200px_minmax(0,1fr)_100px_100px_70px_70px_62px_100px_62px_104px_36px]";

/** Rótulo acima do campo no celular; no desktop o cabeçalho da tabela já rotula. */
function Field({
  label,
  className = "",
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <span className="mb-1 block text-xs text-muted-foreground xl:hidden">{label}</span>
      {children}
    </div>
  );
}

/** Valor calculado: caixa tracejada no celular, texto puro no desktop. */
function Computed({
  children,
  align = "left",
  strong = false,
}: {
  children: React.ReactNode;
  align?: "left" | "right";
  strong?: boolean;
}) {
  return (
    <div
      className={`flex h-10 items-center rounded-md border border-dashed border-border bg-muted/40 px-2 text-sm tabular-nums xl:h-auto xl:rounded-none xl:border-0 xl:bg-transparent xl:px-0 ${
        align === "right" ? "justify-end xl:justify-end" : ""
      } ${strong ? "font-semibold" : ""}`}
    >
      {children}
    </div>
  );
}

type ItemRow = {
  key: string;
  priceItemId: string | null;
  code: string | null;
  description: string;
  unit: BudgetUnit;
  width: string; // texto digitado ("1,5")
  length: string;
  unitPrice: string; // reais ("380,00")
  quantity: string;
  /**
   * Tabela de preços do produto vinculado, por unidade. Guardada na linha para
   * que trocar a unidade já traga o valor certo, sem ir ao servidor de novo.
   * Vazia em item avulso ou em orçamento aberto para edição (o preço gravado é
   * o que vale; o vendedor rebusca o produto se quiser outra unidade).
   */
  prices: PriceOption[];
};

type AdjustmentRow = { mode: AdjustmentKind; value: string };

export type BudgetDefaults = {
  id?: string;
  clientId?: string;
  docType?: "ORCAMENTO" | "PEDIDO";
  title?: string | null;
  note?: string | null;
  validUntil?: string | null; // "YYYY-MM-DD"
  paymentTerms?: string | null;
  deliveryForecast?: string | null;
  deliveryCity?: string | null;
  items?: Array<{
    priceItemId: string | null;
    code: string | null;
    description: string;
    unit: BudgetUnit;
    widthM: number | null;
    lengthM: number | null;
    quantity: number;
    unitPriceCents: number;
  }>;
  adjustments?: Record<
    "discount" | "surcharge" | "freight" | "tax",
    { mode: AdjustmentKind; input: number }
  >;
};

export type ClientOption = {
  id: string;
  name: string;
  companyName: string | null;
};

function centsToInput(cents: number): string {
  return (cents / 100).toFixed(2).replace(".", ",");
}

function numberToInput(value: number | null): string {
  return value == null ? "" : String(value).replace(".", ",");
}

function newRow(partial?: Partial<ItemRow>): ItemRow {
  return {
    key: crypto.randomUUID(),
    priceItemId: null,
    code: null,
    description: "",
    unit: "UNIDADE",
    width: "",
    length: "",
    unitPrice: "",
    quantity: "1",
    prices: [],
    ...partial,
  };
}

/** Converte o ajuste gravado (centavos ou bps) para o texto do campo. */
function adjustmentToRow(adj?: { mode: AdjustmentKind; input: number }): AdjustmentRow {
  if (!adj || adj.input === 0) return { mode: adj?.mode ?? "VALOR", value: "" };
  return {
    mode: adj.mode,
    value:
      adj.mode === "PERCENTUAL"
        ? String(adj.input / 100).replace(".", ",")
        : centsToInput(adj.input),
  };
}

export function BudgetForm({
  clients,
  defaults,
  canManagePriceItems = false,
}: {
  clients: ClientOption[];
  defaults?: BudgetDefaults;
  /** Staff vê o atalho para cadastrar produto que falta na tabela de preços. */
  canManagePriceItems?: boolean;
}) {
  const isEdit = Boolean(defaults?.id);
  const docType = defaults?.docType ?? "ORCAMENTO";
  const ehPedido = docType === "PEDIDO";
  const [state, action, pending] = useActionState(
    isEdit ? updateBudgetAction : createBudgetAction,
    initial,
  );
  const formRef = useRef<HTMLFormElement>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  const [items, setItems] = useState<ItemRow[]>(() =>
    defaults?.items?.length
      ? defaults.items.map((it) =>
          newRow({
            priceItemId: it.priceItemId,
            code: it.code,
            description: it.description,
            unit: it.unit,
            width: numberToInput(it.widthM),
            length: numberToInput(it.lengthM),
            unitPrice: centsToInput(it.unitPriceCents),
            quantity: String(it.quantity).replace(".", ","),
          }),
        )
      : [newRow()],
  );

  const [discount, setDiscount] = useState(() => adjustmentToRow(defaults?.adjustments?.discount));
  const [surcharge, setSurcharge] = useState(() =>
    adjustmentToRow(defaults?.adjustments?.surcharge),
  );
  const [freight, setFreight] = useState(() => adjustmentToRow(defaults?.adjustments?.freight));
  const [tax, setTax] = useState(() => adjustmentToRow(defaults?.adjustments?.tax));

  // Valores gravados quando estes campos eram texto livre. Viram uma opção
  // extra no select para que abrir a edição não apague o que já existia.
  const legadoPagamento =
    defaults?.paymentTerms && !FORMAS_PAGAMENTO.includes(defaults.paymentTerms as never)
      ? defaults.paymentTerms
      : null;
  const legadoPrazo =
    defaults?.deliveryForecast && !PRAZOS_ENTREGA.includes(defaults.deliveryForecast)
      ? defaults.deliveryForecast
      : null;

  function updateItem(key: string, patch: Partial<ItemRow>) {
    setItems((rows) => rows.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  }

  /** Produto escolhido na busca: preenche a linha inteira.
   *  `escolhido` é a unidade que o vendedor clicou. */
  function applyProduct(key: string, option: ProductOption, escolhido: PriceOption) {
    updateItem(key, {
      priceItemId: option.id,
      code: option.code,
      description: option.description,
      unit: escolhido.unit,
      // Produto sem preço na tabela: campo fica em branco para o vendedor digitar.
      unitPrice: escolhido.priceCents > 0 ? centsToInput(escolhido.priceCents) : "",
      prices: option.prices,
    });
  }

  /**
   * Trocar a unidade na linha: se o produto tiver valor cadastrado para a nova
   * unidade, o preço acompanha. Sem valor para ela, o campo é mantido — apagar
   * o que o vendedor digitou seria pior do que deixar um número a revisar.
   */
  function changeUnit(row: ItemRow, unit: BudgetUnit) {
    const tabelado = row.prices.find((p) => p.unit === unit);
    updateItem(row.key, {
      unit,
      ...(tabelado
        ? { unitPrice: tabelado.priceCents > 0 ? centsToInput(tabelado.priceCents) : "" }
        : {}),
    });
  }

  // Itens convertidos (null/undefined = campo inválido ou incompleto).
  const parsedItems = useMemo(
    () =>
      items.map((r) => {
        // Fora do m² as medidas são ignoradas — inclusive um texto antigo que
        // tenha sobrado no campo depois de trocar a unidade.
        const isArea = r.unit === "M2";
        return {
          priceItemId: r.priceItemId,
          description: r.description.trim(),
          unit: r.unit,
          widthM: isArea ? parseMeters(r.width) : null,
          lengthM: isArea ? parseMeters(r.length) : null,
          quantity: parseQuantity(r.quantity),
          unitPriceCents: parseReaisToCentsAllowZero(r.unitPrice),
        };
      }),
    [items],
  );

  // Prévia por linha com o mesmo motor que roda no servidor.
  const lineResults = useMemo(
    () =>
      parsedItems.map((it) => {
        if (it.quantity == null || it.unitPriceCents == null) return null;
        return calcItem({
          unit: it.unit,
          unitPriceCents: it.unitPriceCents,
          quantity: it.quantity,
          widthM: typeof it.widthM === "number" ? it.widthM : null,
          lengthM: typeof it.lengthM === "number" ? it.lengthM : null,
        });
      }),
    [parsedItems],
  );

  const adjustmentInputs = useMemo(() => {
    const toInput = (row: AdjustmentRow): number | null => {
      if (!row.value.trim()) return 0;
      return row.mode === "PERCENTUAL"
        ? parsePercentToBps(row.value)
        : parseReaisToCentsAllowZero(row.value);
    };
    return {
      discount: { mode: discount.mode, input: toInput(discount) },
      surcharge: { mode: surcharge.mode, input: toInput(surcharge) },
      freight: { mode: freight.mode, input: toInput(freight) },
      tax: { mode: tax.mode, input: toInput(tax) },
    };
  }, [discount, surcharge, freight, tax]);

  const totals = useMemo(
    () =>
      calcTotals(
        lineResults.filter((r): r is NonNullable<typeof r> => r !== null),
        {
          discount: {
            mode: adjustmentInputs.discount.mode,
            input: adjustmentInputs.discount.input ?? 0,
          },
          surcharge: {
            mode: adjustmentInputs.surcharge.mode,
            input: adjustmentInputs.surcharge.input ?? 0,
          },
          freight: {
            mode: adjustmentInputs.freight.mode,
            input: adjustmentInputs.freight.input ?? 0,
          },
          tax: { mode: adjustmentInputs.tax.mode, input: adjustmentInputs.tax.input ?? 0 },
        },
      ),
    [lineResults, adjustmentInputs],
  );

  // JSON enviado ao servidor (a validação de verdade acontece lá, com Zod).
  const itemsJson = useMemo(
    () =>
      JSON.stringify(
        parsedItems.map((it) => ({
          priceItemId: it.priceItemId,
          description: it.description,
          unit: it.unit,
          widthM: typeof it.widthM === "number" ? it.widthM : null,
          lengthM: typeof it.lengthM === "number" ? it.lengthM : null,
          quantity: it.quantity,
          unitPriceCents: it.unitPriceCents,
        })),
      ),
    [parsedItems],
  );

  const adjustmentsJson = useMemo(
    () =>
      JSON.stringify({
        discount: {
          mode: adjustmentInputs.discount.mode,
          input: adjustmentInputs.discount.input ?? 0,
        },
        surcharge: {
          mode: adjustmentInputs.surcharge.mode,
          input: adjustmentInputs.surcharge.input ?? 0,
        },
        freight: { mode: adjustmentInputs.freight.mode, input: adjustmentInputs.freight.input ?? 0 },
        tax: { mode: adjustmentInputs.tax.mode, input: adjustmentInputs.tax.input ?? 0 },
      }),
    [adjustmentInputs],
  );

  function validate(): boolean {
    for (let i = 0; i < parsedItems.length; i++) {
      const it = parsedItems[i];
      if (!it) continue;
      const label = `Item ${i + 1}`;
      if (!it.description) {
        setLocalError(`${label}: escolha um produto ou descreva o item.`);
        return false;
      }
      if (it.unitPriceCents == null) {
        setLocalError(`${label}: valor inválido (use o formato 123,45).`);
        return false;
      }
      if (it.quantity == null) {
        setLocalError(`${label}: quantidade inválida.`);
        return false;
      }
      if (it.widthM === undefined || it.lengthM === undefined) {
        setLocalError(`${label}: largura/comprimento inválidos.`);
        return false;
      }
      if (it.unit === "M2" && (!it.widthM || !it.lengthM)) {
        setLocalError(`${label}: informe largura e comprimento (item cobrado por m²).`);
        return false;
      }
    }

    for (const [label, adj] of [
      ["Desconto", adjustmentInputs.discount],
      ["Adicional", adjustmentInputs.surcharge],
      ["Frete", adjustmentInputs.freight],
      ["Imposto", adjustmentInputs.tax],
    ] as const) {
      if (adj.input == null) {
        // Diz o que fazer, não só que está errado — o motivo mais comum é
        // percentual acima de 100.
        setLocalError(
          adj.mode === "PERCENTUAL"
            ? `${label}: informe um percentual de 0 a 100 (ex.: 12,5) ou deixe em branco.`
            : `${label}: valor inválido (use o formato 1.234,56) ou deixe em branco.`,
        );
        return false;
      }
    }

    setLocalError(null);
    return true;
  }

  function handleSubmit() {
    if (validate()) formRef.current?.requestSubmit();
  }

  return (
    <form
      ref={formRef}
      action={action}
      // Guarda também o submit via tecla Enter dentro dos campos.
      onSubmit={(e) => {
        if (!validate()) e.preventDefault();
      }}
      className="space-y-6"
    >
      {isEdit ? <input type="hidden" name="budgetId" value={defaults!.id} /> : null}
      <input type="hidden" name="itemsJson" value={itemsJson} />
      <input type="hidden" name="adjustmentsJson" value={adjustmentsJson} />

      {/* Cabeçalho */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {/* O tipo vem da seção (/orcamentos ou /pedidos), não de um select: são
            documentos diferentes, com listas separadas. O caminho entre eles é
            o botão "Converter em pedido", de mão única — e o servidor recusa o
            rebaixamento de qualquer jeito. */}
        <div className="space-y-1">
          <p className="text-sm font-medium">Documento</p>
          <input type="hidden" name="docType" value={docType} />
          <div className="flex h-10 items-center rounded-md border border-border bg-muted px-3 text-sm">
            {ehPedido ? "Pedido" : "Orçamento"}
          </div>
          <p className="text-xs text-muted-foreground">
            {ehPedido
              ? "Sai completo, com dados da empresa, cláusulas e assinatura. Um pedido não volta a ser orçamento."
              : "Sai enxuto, focado no valor do serviço. Pode virar pedido depois."}
          </p>
        </div>
        <div className="space-y-1 sm:col-span-2 lg:col-span-1">
          <label htmlFor="bf-client" className="text-sm font-medium">
            Cliente *
          </label>
          <select
            id="bf-client"
            name="clientId"
            required
            defaultValue={defaults?.clientId ?? ""}
            className="flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <option value="" disabled>
              Selecione...
            </option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
                {c.companyName ? ` — ${c.companyName}` : ""}
              </option>
            ))}
          </select>
          <p className="text-xs text-muted-foreground">
            Não achou?{" "}
            <a href="/clientes/novo" className="text-primary hover:underline">
              Cadastrar cliente
            </a>
          </p>
        </div>
        <div className="space-y-1">
          <label htmlFor="bf-payment" className="text-sm font-medium">
            Forma de pagamento
          </label>
          <select
            id="bf-payment"
            name="paymentTerms"
            defaultValue={defaults?.paymentTerms ?? ""}
            className={SELECT_CLASS}
          >
            <option value="">Selecione...</option>
            {FORMAS_PAGAMENTO.map((forma) => (
              <option key={forma} value={forma}>
                {forma}
              </option>
            ))}
            {/* Orçamento antigo pode ter texto livre; mantemos como opção para
                não apagar o dado só por abrir a tela de edição. */}
            {legadoPagamento ? <option value={legadoPagamento}>{legadoPagamento}</option> : null}
          </select>
        </div>
        <div className="space-y-1">
          <label htmlFor="bf-forecast" className="text-sm font-medium">
            Prazo de entrega
          </label>
          <select
            id="bf-forecast"
            name="deliveryForecast"
            defaultValue={defaults?.deliveryForecast ?? ""}
            className={SELECT_CLASS}
          >
            <option value="">Selecione...</option>
            {PRAZOS_ENTREGA.map((prazo) => (
              <option key={prazo} value={prazo}>
                {prazo}
              </option>
            ))}
            {legadoPrazo ? <option value={legadoPrazo}>{legadoPrazo}</option> : null}
          </select>
        </div>
        <div className="space-y-1">
          <label htmlFor="bf-city" className="text-sm font-medium">
            Cidade de entrega
          </label>
          {/* Campo com sugestões (não select fechado): as 139 cidades do TO
              cobrem o caso comum, mas entrega fora do estado continua possível. */}
          <Input
            id="bf-city"
            name="deliveryCity"
            list="cidades-to"
            placeholder="ex.: Gurupi"
            autoComplete="off"
            defaultValue={defaults?.deliveryCity ?? ""}
          />
          <datalist id="cidades-to">
            {CIDADES_TOCANTINS.map((cidade) => (
              <option key={cidade} value={cidade} />
            ))}
          </datalist>
        </div>
        <div className="space-y-1">
          <label htmlFor="bf-valid" className="text-sm font-medium">
            Válido até
          </label>
          <Input
            id="bf-valid"
            name="validUntil"
            type="date"
            defaultValue={defaults?.validUntil ?? ""}
          />
        </div>
        <div className="space-y-1 sm:col-span-2">
          <label htmlFor="bf-title" className="text-sm font-medium">
            Título (opcional)
          </label>
          <Input
            id="bf-title"
            name="title"
            placeholder='ex.: "Fachada Loja Centro"'
            defaultValue={defaults?.title ?? ""}
          />
        </div>
      </div>

      {/* Itens — o coração da tela: card destacado com a busca de produto. */}
      {/* Sem overflow-hidden aqui: ele cortava a lista de resultados da busca
          de produto, que é posicionada de forma absoluta. O arredondamento do
          topo do cabeçalho é feito nele mesmo. */}
      <section className="rounded-xl border-2 border-primary/20 bg-card">
        <header className="flex flex-col gap-3 rounded-t-[10px] border-b border-border bg-primary/5 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-base font-bold">
              <PackageSearch className="h-5 w-5 text-primary" />
              Produtos do {ehPedido ? "pedido" : "orçamento"}
            </h2>
            <p className="text-xs text-muted-foreground">
              Busque pelo código ou pelo nome — valor, unidade e cálculo vêm preenchidos.
            </p>
          </div>
          <Button
            type="button"
            className="w-full sm:w-auto"
            onClick={() => setItems((r) => [...r, newRow()])}
          >
            <Plus className="h-4 w-4" /> Adicionar item
          </Button>
        </header>

        <div className="p-3 sm:p-4">
          {/* Cabeçalho da "planilha" — só no desktop; no mobile cada item vira card. */}
          <div className={`hidden gap-2 px-3 pb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground xl:grid ${GRID_COLS}`}>
            <span>Produto</span>
            <span>Descrição</span>
            <span>Base cálc.</span>
            <span>Unidade</span>
            <span>La.</span>
            <span>Com.</span>
            <span>M²</span>
            <span className="text-right">Valor unit.</span>
            <span>Qtd</span>
            <span className="text-right">Total</span>
            <span />
          </div>

          <div className="space-y-3 xl:space-y-0">
            {items.map((row, i) => {
              const result = lineResults[i];
              const isArea = row.unit === "M2";
              // Fora do m², largura/comprimento só ocupam espaço no celular.
              const areaOnly = isArea ? "" : "hidden xl:block";
              return (
                <div
                  key={row.key}
                  className="rounded-lg border border-border bg-background p-3 xl:rounded-none xl:border-0 xl:border-b xl:bg-transparent xl:p-0"
                >
                  {/* Cabeçalho do card (mobile): número do item + remover */}
                  <div className="mb-2 flex items-center justify-between xl:hidden">
                    <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                      Item {i + 1}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      aria-label={`Remover item ${i + 1}`}
                      disabled={items.length === 1}
                      onClick={() => setItems((rows) => rows.filter((r) => r.key !== row.key))}
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>

                  <div className={`grid grid-cols-2 gap-2 xl:items-center xl:px-3 xl:py-1.5 ${GRID_COLS}`}>
                    <Field label="Produto" className="col-span-2 xl:col-span-1">
                      <ProductSearch
                        label={`item ${i + 1}`}
                        value={row.code ? { code: row.code, description: row.description } : null}
                        onSelect={(option, preco) => applyProduct(row.key, option, preco)}
                        onClear={() => updateItem(row.key, { priceItemId: null, code: null, prices: [] })}
                        canManagePriceItems={canManagePriceItems}
                      />
                    </Field>

                    <Field label="Descrição" className="col-span-2 xl:col-span-1">
                      <Textarea
                        aria-label={`Descrição do item ${i + 1}`}
                        placeholder="Busque um produto ou descreva o item"
                        value={row.description}
                        onChange={(e) => updateItem(row.key, { description: e.target.value })}
                        className="min-h-[40px]"
                        rows={1}
                      />
                    </Field>

                    <Field label={isArea ? "Base de cálculo (R$/m²)" : "Base de cálculo (R$)"}>
                      <Input
                        aria-label={`Valor do item ${i + 1}`}
                        placeholder="0,00"
                        inputMode="decimal"
                        value={row.unitPrice}
                        onChange={(e) => updateItem(row.key, { unitPrice: e.target.value })}
                      />
                    </Field>

                    <Field label="Unidade">
                      <select
                        aria-label={`Unidade do item ${i + 1}`}
                        value={row.unit}
                        onChange={(e) => changeUnit(row, e.target.value as BudgetUnit)}
                        className="flex h-10 w-full rounded-md border border-border bg-background px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      >
                        {UNITS.map((u) => (
                          <option key={u} value={u}>
                            {UNIT_LABEL[u]}
                          </option>
                        ))}
                      </select>
                    </Field>

                    <Field label="Largura (m)" className={areaOnly}>
                      <Input
                        aria-label={`Largura do item ${i + 1}`}
                        placeholder="—"
                        inputMode="decimal"
                        disabled={!isArea}
                        value={isArea ? row.width : ""}
                        onChange={(e) => updateItem(row.key, { width: e.target.value })}
                      />
                    </Field>

                    <Field label="Compr. (m)" className={areaOnly}>
                      <Input
                        aria-label={`Comprimento do item ${i + 1}`}
                        placeholder="—"
                        inputMode="decimal"
                        disabled={!isArea}
                        value={isArea ? row.length : ""}
                        onChange={(e) => updateItem(row.key, { length: e.target.value })}
                      />
                    </Field>

                    <Field label="M²" className={areaOnly}>
                      <Computed>
                        {result?.areaM2 != null ? formatDecimal(result.areaM2, 4) : "—"}
                      </Computed>
                    </Field>

                    <Field label="Valor unitário">
                      <Computed align="right">
                        {result ? formatCents(result.partialCents) : "—"}
                      </Computed>
                    </Field>

                    <Field label="Qtd">
                      <Input
                        aria-label={`Quantidade do item ${i + 1}`}
                        placeholder="Qtd"
                        inputMode="decimal"
                        value={row.quantity}
                        onChange={(e) => updateItem(row.key, { quantity: e.target.value })}
                      />
                    </Field>

                    {/* No celular o total fecha o card ocupando a linha toda. */}
                    <Field label="Total" className="col-span-2 xl:col-span-1">
                      <Computed align="right" strong>
                        {result ? formatCents(result.totalCents) : "—"}
                      </Computed>
                    </Field>

                    {/* Remover — no mobile já está no cabeçalho do card. */}
                    <div className="hidden justify-end xl:flex">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        aria-label={`Remover item ${i + 1}`}
                        disabled={items.length === 1}
                        onClick={() => setItems((rows) => rows.filter((r) => r.key !== row.key))}
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Totais */}
      <div className="ml-auto w-full max-w-lg space-y-3 rounded-lg border border-border bg-muted/30 p-4 sm:space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Valor total do pedido</span>
          <span className="text-sm font-semibold tabular-nums">
            {formatCents(totals.subtotalCents)}
          </span>
        </div>

        <AdjustmentField
          id="discount"
          label="Desconto"
          row={discount}
          onChange={setDiscount}
          resolvedCents={totals.discountCents}
        />
        <AdjustmentField
          id="surcharge"
          label="Adicional"
          row={surcharge}
          onChange={setSurcharge}
          resolvedCents={totals.surchargeCents}
        />
        <AdjustmentField
          id="freight"
          label="Frete"
          row={freight}
          onChange={setFreight}
          resolvedCents={totals.freightCents}
        />
        <AdjustmentField
          id="tax"
          label="Imposto"
          row={tax}
          onChange={setTax}
          resolvedCents={totals.taxCents}
        />

        <div className="flex items-center justify-between border-t border-border pt-3">
          <span className="font-semibold">Total final</span>
          <span className="text-xl font-bold tabular-nums">{formatCents(totals.totalCents)}</span>
        </div>
      </div>

      {/* Observações */}
      <div className="space-y-1">
        <label htmlFor="bf-note" className="text-sm font-medium">
          Observações (aparecem no PDF)
        </label>
        <Textarea
          id="bf-note"
          name="note"
          placeholder="ex.: Frete grátis! Prazo de entrega de 15 dias."
          defaultValue={defaults?.note ?? ""}
        />
      </div>

      {localError ? <p className="text-sm text-red-600">{localError}</p> : null}
      {state.error ? <p className="text-sm text-red-600">{state.error}</p> : null}

      <Button type="button" disabled={pending} onClick={handleSubmit}>
        {pending
          ? "Salvando..."
          : isEdit
            ? "Salvar alterações"
            : `Criar ${ehPedido ? "pedido" : "orçamento"}`}
      </Button>
    </form>
  );
}

/** Linha do rodapé com alternância R$ / %. O % incide sobre o total do pedido. */
function AdjustmentField({
  id,
  label,
  row,
  onChange,
  resolvedCents,
}: {
  id: string;
  label: string;
  row: AdjustmentRow;
  onChange: (row: AdjustmentRow) => void;
  resolvedCents: number;
}) {
  const isPercent = row.mode === "PERCENTUAL";
  const preenchido = row.value.trim() !== "";

  // No celular a linha única espremia o campo a uns 30px: não dava para ler o
  // que estava digitado nem posicionar o cursor para apagar. Aqui vira duas
  // linhas (rótulo + valor em cima, controles embaixo) e só volta a ser uma
  // linha a partir de sm, onde há largura de sobra.
  return (
    <div className="space-y-1.5 sm:flex sm:items-center sm:gap-2 sm:space-y-0">
      <div className="flex items-center justify-between gap-2 sm:contents">
        <label
          htmlFor={`adj-${id}`}
          className="text-sm font-medium sm:w-24 sm:shrink-0 sm:font-normal"
        >
          {label}
        </label>
        <span className="text-sm font-medium tabular-nums text-muted-foreground sm:order-last sm:w-24 sm:shrink-0 sm:text-right sm:font-normal">
          {formatCents(resolvedCents)}
        </span>
      </div>

      <div className="flex items-center gap-2 sm:min-w-0 sm:flex-1">
        <div className="flex shrink-0 overflow-hidden rounded-md border border-border">
          {(["VALOR", "PERCENTUAL"] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              aria-pressed={row.mode === mode}
              aria-label={`${label} em ${mode === "VALOR" ? "reais" : "porcentagem"}`}
              onClick={() => onChange({ ...row, mode })}
              className={`px-3 py-2 text-xs font-medium sm:px-2 sm:py-1 ${
                row.mode === mode
                  ? "bg-primary text-primary-foreground"
                  : "bg-background text-muted-foreground hover:bg-muted"
              }`}
            >
              {mode === "VALOR" ? "R$" : "%"}
            </button>
          ))}
        </div>

        <div className="relative min-w-0 flex-1">
          <Input
            id={`adj-${id}`}
            aria-label={`${label} em ${isPercent ? "porcentagem" : "reais"}`}
            className="h-10 w-full pr-9 text-right sm:h-8"
            inputMode="decimal"
            placeholder="0"
            value={row.value}
            onChange={(e) => onChange({ ...row, value: e.target.value })}
          />
          {/* Limpar em um toque: no celular apagar dígito a dígito num campo
              estreito era o que travava a remoção do desconto. */}
          {preenchido ? (
            <button
              type="button"
              onClick={() => onChange({ ...row, value: "" })}
              aria-label={`Remover ${label.toLowerCase()}`}
              title={`Remover ${label.toLowerCase()}`}
              className="absolute right-1 top-1/2 -translate-y-1/2 rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground sm:p-1"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
