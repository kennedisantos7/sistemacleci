"use client";

import { useActionState, useMemo, useRef, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { createBudgetAction, updateBudgetAction, type BudgetFormState } from "./actions";
import { ProductSearch, type ProductOption } from "./product-search";
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

const initial: BudgetFormState = {};

const UNITS: BudgetUnit[] = ["M2", "UNIDADE", "PACOTE", "MILHEIRO"];

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
}: {
  clients: ClientOption[];
  defaults?: BudgetDefaults;
}) {
  const isEdit = Boolean(defaults?.id);
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

  function updateItem(key: string, patch: Partial<ItemRow>) {
    setItems((rows) => rows.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  }

  /** Produto escolhido na busca: preenche a linha inteira. */
  function applyProduct(key: string, option: ProductOption) {
    updateItem(key, {
      priceItemId: option.id,
      code: option.code,
      description: option.description,
      unit: option.unit,
      // Produto sem preço na tabela: campo fica em branco para o vendedor digitar.
      unitPrice: option.priceCents > 0 ? centsToInput(option.priceCents) : "",
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

    for (const [label, input] of [
      ["Desconto", adjustmentInputs.discount.input],
      ["Adicional", adjustmentInputs.surcharge.input],
      ["Frete", adjustmentInputs.freight.input],
      ["Imposto", adjustmentInputs.tax.input],
    ] as const) {
      if (input == null) {
        setLocalError(`${label}: valor inválido.`);
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
        <div className="space-y-1">
          <label htmlFor="bf-doctype" className="text-sm font-medium">
            Documento
          </label>
          <select
            id="bf-doctype"
            name="docType"
            defaultValue={defaults?.docType ?? "ORCAMENTO"}
            className="flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <option value="ORCAMENTO">Orçamento</option>
            <option value="PEDIDO">Pedido</option>
          </select>
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
            Condição de pagamento
          </label>
          <Input
            id="bf-payment"
            name="paymentTerms"
            placeholder="ex.: Pix"
            defaultValue={defaults?.paymentTerms ?? ""}
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="bf-forecast" className="text-sm font-medium">
            Previsão de entrega
          </label>
          <Input
            id="bf-forecast"
            name="deliveryForecast"
            placeholder="ex.: 15 dias"
            defaultValue={defaults?.deliveryForecast ?? ""}
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="bf-city" className="text-sm font-medium">
            Cidade de entrega
          </label>
          <Input
            id="bf-city"
            name="deliveryCity"
            placeholder="ex.: Gurupi"
            defaultValue={defaults?.deliveryCity ?? ""}
          />
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

      {/* Itens */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Itens
          </h2>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setItems((r) => [...r, newRow()])}
          >
            <Plus className="h-4 w-4" /> Adicionar item
          </Button>
        </div>

        {/* Cabeçalho da "planilha" — só no desktop; no mobile cada item é um card. */}
        <div className="hidden gap-2 px-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground xl:grid xl:grid-cols-[130px_minmax(0,1fr)_110px_110px_76px_76px_66px_104px_66px_104px_32px]">
          <span>Código</span>
          <span>Descrição</span>
          <span>Valor</span>
          <span>Unidade</span>
          <span>La.</span>
          <span>Com.</span>
          <span>M²</span>
          <span className="text-right">Parcial</span>
          <span>Qtd</span>
          <span className="text-right">Total</span>
          <span />
        </div>

        <div className="space-y-3 xl:space-y-0">
          {items.map((row, i) => {
            const result = lineResults[i];
            const isArea = row.unit === "M2";
            return (
              <div
                key={row.key}
                className="rounded-lg border border-border bg-card p-3 xl:rounded-none xl:border-0 xl:border-b xl:bg-transparent xl:p-0"
              >
                <div className="grid gap-2 xl:grid-cols-[130px_minmax(0,1fr)_110px_110px_76px_76px_66px_104px_66px_104px_32px] xl:items-center xl:px-3 xl:py-1.5">
                  <div>
                    <span className="mb-1 block text-xs text-muted-foreground xl:hidden">
                      Produto
                    </span>
                    <ProductSearch
                      label={`item ${i + 1}`}
                      value={row.code ? { code: row.code, description: row.description } : null}
                      onSelect={(option) => applyProduct(row.key, option)}
                      onClear={() => updateItem(row.key, { priceItemId: null, code: null })}
                    />
                  </div>

                  <div>
                    <span className="mb-1 block text-xs text-muted-foreground xl:hidden">
                      Descrição
                    </span>
                    <Textarea
                      aria-label={`Descrição do item ${i + 1}`}
                      placeholder="Busque um produto ou descreva o item"
                      value={row.description}
                      onChange={(e) => updateItem(row.key, { description: e.target.value })}
                      className="min-h-[40px]"
                      rows={1}
                    />
                  </div>

                  <div>
                    <span className="mb-1 block text-xs text-muted-foreground xl:hidden">
                      Valor {isArea ? "(R$/m²)" : "(R$)"}
                    </span>
                    <Input
                      aria-label={`Valor do item ${i + 1}`}
                      placeholder="0,00"
                      inputMode="decimal"
                      value={row.unitPrice}
                      onChange={(e) => updateItem(row.key, { unitPrice: e.target.value })}
                    />
                  </div>

                  <div>
                    <span className="mb-1 block text-xs text-muted-foreground xl:hidden">
                      Unidade
                    </span>
                    <select
                      aria-label={`Unidade do item ${i + 1}`}
                      value={row.unit}
                      onChange={(e) => updateItem(row.key, { unit: e.target.value as BudgetUnit })}
                      className="flex h-10 w-full rounded-md border border-border bg-background px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    >
                      {UNITS.map((u) => (
                        <option key={u} value={u}>
                          {UNIT_LABEL[u]}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <span className="mb-1 block text-xs text-muted-foreground xl:hidden">
                      Largura (m)
                    </span>
                    <Input
                      aria-label={`Largura do item ${i + 1}`}
                      placeholder="—"
                      inputMode="decimal"
                      disabled={!isArea}
                      value={isArea ? row.width : ""}
                      onChange={(e) => updateItem(row.key, { width: e.target.value })}
                    />
                  </div>

                  <div>
                    <span className="mb-1 block text-xs text-muted-foreground xl:hidden">
                      Comprimento (m)
                    </span>
                    <Input
                      aria-label={`Comprimento do item ${i + 1}`}
                      placeholder="—"
                      inputMode="decimal"
                      disabled={!isArea}
                      value={isArea ? row.length : ""}
                      onChange={(e) => updateItem(row.key, { length: e.target.value })}
                    />
                  </div>

                  <div className="flex items-center gap-1 text-sm tabular-nums">
                    <span className="text-xs text-muted-foreground xl:hidden">M²:</span>
                    {result?.areaM2 != null ? formatDecimal(result.areaM2, 4) : "—"}
                  </div>

                  <div className="flex items-center gap-1 text-sm tabular-nums xl:justify-end">
                    <span className="text-xs text-muted-foreground xl:hidden">Valor parcial:</span>
                    {result ? formatCents(result.partialCents) : "—"}
                  </div>

                  <div>
                    <span className="mb-1 block text-xs text-muted-foreground xl:hidden">Qtd</span>
                    <Input
                      aria-label={`Quantidade do item ${i + 1}`}
                      placeholder="Qtd"
                      inputMode="decimal"
                      value={row.quantity}
                      onChange={(e) => updateItem(row.key, { quantity: e.target.value })}
                    />
                  </div>

                  <div className="flex items-center gap-1 text-sm font-semibold tabular-nums xl:justify-end">
                    <span className="text-xs font-normal text-muted-foreground xl:hidden">
                      Total:
                    </span>
                    {result ? formatCents(result.totalCents) : "—"}
                  </div>

                  <div className="flex justify-end">
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

      {/* Totais */}
      <div className="ml-auto w-full max-w-lg space-y-2 rounded-lg border border-border bg-muted/30 p-4">
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
        {pending ? "Salvando..." : isEdit ? "Salvar alterações" : "Criar orçamento"}
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
  return (
    <div className="flex items-center justify-between gap-2">
      <label htmlFor={`adj-${id}`} className="text-sm">
        {label}
      </label>
      <div className="flex items-center gap-1">
        <div className="flex overflow-hidden rounded-md border border-border">
          {(["VALOR", "PERCENTUAL"] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              aria-pressed={row.mode === mode}
              aria-label={`${label} em ${mode === "VALOR" ? "reais" : "porcentagem"}`}
              onClick={() => onChange({ ...row, mode })}
              className={`px-2 py-1 text-xs font-medium ${
                row.mode === mode
                  ? "bg-primary text-primary-foreground"
                  : "bg-background text-muted-foreground hover:bg-muted"
              }`}
            >
              {mode === "VALOR" ? "R$" : "%"}
            </button>
          ))}
        </div>
        <Input
          id={`adj-${id}`}
          aria-label={`${label} em ${isPercent ? "porcentagem" : "reais"}`}
          className="h-8 w-24 text-right"
          inputMode="decimal"
          placeholder="0"
          value={row.value}
          onChange={(e) => onChange({ ...row, value: e.target.value })}
        />
        <span className="w-24 text-right text-sm tabular-nums text-muted-foreground">
          {formatCents(resolvedCents)}
        </span>
      </div>
    </div>
  );
}
