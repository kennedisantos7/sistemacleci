"use client";

import { useActionState, useMemo, useState } from "react";
import { X } from "lucide-react";
import { createProductAction, updateProductAction, type ProductFormState } from "./actions";
import { MainImageUpload, GalleryUpload } from "./image-upload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const initial: ProductFormState = {};

const SELECT_CLASS =
  "flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary";

export type CategoryOption = {
  id: string;
  name: string;
  subcategories: Array<{ id: string; name: string }>;
};

export type ProductDefaults = {
  id?: string;
  categoryId?: string;
  subcategoryId?: string | null;
  title?: string;
  description?: string | null;
  priceCents?: number | null;
  imageUrl?: string;
  gallery?: string[];
  sizes?: string[];
  codes?: string[];
  badge?: string | null;
  code?: string | null;
  active?: boolean;
};

/** Lista simples de strings (tamanhos, códigos) com add/remove. */
function StringListField({
  name,
  label,
  placeholder,
  defaultValues,
}: {
  name: string;
  label: string;
  placeholder: string;
  defaultValues?: string[];
}) {
  const [values, setValues] = useState<string[]>(defaultValues ?? []);
  const [draft, setDraft] = useState("");

  function add() {
    const v = draft.trim();
    if (!v) return;
    setValues((prev) => [...prev, v]);
    setDraft("");
  }

  return (
    <div className="space-y-1">
      <label className="text-sm font-medium">{label}</label>
      <input type="hidden" name={name} value={JSON.stringify(values)} />
      <div className="flex gap-2">
        <Input
          value={draft}
          placeholder={placeholder}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
        />
        <Button type="button" variant="outline" onClick={add}>
          Adicionar
        </Button>
      </div>
      {values.length > 0 ? (
        <div className="flex flex-wrap gap-2 pt-1">
          {values.map((v, i) => (
            <span
              key={`${v}-${i}`}
              className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs"
            >
              {v}
              <button
                type="button"
                onClick={() => setValues((prev) => prev.filter((_, idx) => idx !== i))}
                aria-label={`Remover ${v}`}
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function ProductForm({
  categories,
  defaults,
}: {
  categories: CategoryOption[];
  defaults?: ProductDefaults;
}) {
  const isEdit = Boolean(defaults?.id);
  const [state, action, pending] = useActionState(
    isEdit ? updateProductAction : createProductAction,
    initial,
  );

  const [categoryId, setCategoryId] = useState(defaults?.categoryId ?? "");
  const subOptions = useMemo(
    () => categories.find((c) => c.id === categoryId)?.subcategories ?? [],
    [categories, categoryId],
  );

  return (
    <form action={action} className="space-y-5">
      {isEdit ? <input type="hidden" name="productId" value={defaults!.id} /> : null}

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <label htmlFor="pf-cat" className="text-sm font-medium">
            Categoria *
          </label>
          <select
            id="pf-cat"
            name="categoryId"
            required
            className={SELECT_CLASS}
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
          >
            <option value="" disabled>
              Selecione...
            </option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label htmlFor="pf-sub" className="text-sm font-medium">
            Subtipo
          </label>
          <select
            id="pf-sub"
            name="subcategoryId"
            className={SELECT_CLASS}
            defaultValue={defaults?.subcategoryId ?? ""}
            disabled={subOptions.length === 0}
          >
            <option value="">— nenhum —</option>
            {subOptions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-1">
        <label htmlFor="pf-title" className="text-sm font-medium">
          Título *
        </label>
        <Input id="pf-title" name="title" required defaultValue={defaults?.title ?? ""} />
      </div>

      <div className="space-y-1">
        <label htmlFor="pf-desc" className="text-sm font-medium">
          Descrição
        </label>
        <Textarea id="pf-desc" name="description" defaultValue={defaults?.description ?? ""} />
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="space-y-1">
          <label htmlFor="pf-price" className="text-sm font-medium">
            Preço (R$)
          </label>
          <Input
            id="pf-price"
            name="price"
            inputMode="decimal"
            placeholder="opcional (ex.: 89,90)"
            defaultValue={defaults?.priceCents != null ? (defaults.priceCents / 100).toFixed(2).replace(".", ",") : ""}
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="pf-badge" className="text-sm font-medium">
            Selo (badge)
          </label>
          <Input id="pf-badge" name="badge" placeholder="ex.: Novo" defaultValue={defaults?.badge ?? ""} />
        </div>
        <div className="space-y-1">
          <label htmlFor="pf-code" className="text-sm font-medium">
            Código
          </label>
          <Input id="pf-code" name="code" defaultValue={defaults?.code ?? ""} />
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium">Imagem principal *</label>
        <MainImageUpload defaultUrl={defaults?.imageUrl} />
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium">Galeria (opcional)</label>
        <GalleryUpload defaultUrls={defaults?.gallery} />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <StringListField name="sizes" label="Tamanhos" placeholder="ex.: 40x60" defaultValues={defaults?.sizes} />
        <StringListField name="codes" label="Códigos por tamanho" placeholder="ex.: 1017" defaultValues={defaults?.codes} />
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="active" defaultChecked={defaults?.active ?? true} className="h-4 w-4 accent-primary" />
        Produto ativo (visível quando o site passar a ler do banco)
      </label>

      {state.error ? <p className="text-sm text-red-600">{state.error}</p> : null}

      <Button type="submit" disabled={pending}>
        {pending ? "Salvando..." : isEdit ? "Salvar alterações" : "Cadastrar produto"}
      </Button>
    </form>
  );
}
