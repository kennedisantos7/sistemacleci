"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, Plus, Trash2, X } from "lucide-react";
import { SingleImagePicker } from "./image-upload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export type VariantValue = {
  name: string;
  image?: string | null;
  description?: string | null;
  sizes: string[];
  codes: string[];
};

/** Lista de tags (tamanhos / códigos) de uma linha. */
function TagList({
  label,
  placeholder,
  values,
  onChange,
}: {
  label: string;
  placeholder: string;
  values: string[];
  onChange: (next: string[]) => void;
}) {
  const [draft, setDraft] = useState("");

  function add() {
    const v = draft.trim();
    if (!v) return;
    onChange([...values, v]);
    setDraft("");
  }

  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
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
                onClick={() => onChange(values.filter((_, idx) => idx !== i))}
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

/**
 * Linhas/versões do produto (ex.: sacola de papel Premium, Popular,
 * Plastificada). Cada linha tem suas próprias medidas, códigos, descrição e
 * imagem — o cliente escolhe a linha na página do produto.
 * Serializado no hidden input `variants` (JSON).
 */
export function VariantsField({
  defaultValues,
  uploadEnabled = false,
}: {
  defaultValues?: VariantValue[];
  uploadEnabled?: boolean;
}) {
  const [variants, setVariants] = useState<VariantValue[]>(defaultValues ?? []);

  function patch(index: number, changes: Partial<VariantValue>) {
    setVariants((prev) => prev.map((v, i) => (i === index ? { ...v, ...changes } : v)));
  }

  function move(index: number, delta: number) {
    setVariants((prev) => {
      const target = index + delta;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      const moved = next.splice(index, 1)[0]!;
      next.splice(target, 0, moved);
      return next;
    });
  }

  return (
    <div className="space-y-3">
      <input type="hidden" name="variants" value={JSON.stringify(variants)} />

      {variants.map((variant, i) => (
        <div key={i} className="space-y-3 rounded-md border border-border p-3">
          <div className="flex items-center gap-2">
            <Input
              value={variant.name}
              placeholder="Nome da linha (ex.: LINHA PREMIUM)"
              onChange={(e) => patch(i, { name: e.target.value })}
            />
            <button
              type="button"
              onClick={() => move(i, -1)}
              disabled={i === 0}
              className="rounded border border-border p-1.5 text-muted-foreground disabled:opacity-30"
              aria-label="Mover linha para cima"
            >
              <ArrowUp className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => move(i, 1)}
              disabled={i === variants.length - 1}
              className="rounded border border-border p-1.5 text-muted-foreground disabled:opacity-30"
              aria-label="Mover linha para baixo"
            >
              <ArrowDown className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setVariants((prev) => prev.filter((_, idx) => idx !== i))}
              className="rounded border border-border p-1.5 text-red-600"
              aria-label="Remover linha"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>

          <Textarea
            value={variant.description ?? ""}
            placeholder="Descrição desta linha (opcional — usa a do produto se vazio)"
            onChange={(e) => patch(i, { description: e.target.value })}
          />

          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">
              Imagem da linha (opcional)
            </label>
            <SingleImagePicker
              size="sm"
              uploadEnabled={uploadEnabled}
              value={variant.image ?? ""}
              onChange={(url) => patch(i, { image: url })}
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <TagList
              label="Medidas desta linha"
              placeholder="ex.: 13x13x7"
              values={variant.sizes}
              onChange={(sizes) => patch(i, { sizes })}
            />
            <TagList
              label="Códigos por medida"
              placeholder="ex.: 4013"
              values={variant.codes}
              onChange={(codes) => patch(i, { codes })}
            />
          </div>
        </div>
      ))}

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() =>
          setVariants((prev) => [...prev, { name: "", description: "", image: "", sizes: [], codes: [] }])
        }
      >
        <Plus className="h-4 w-4" />
        Adicionar linha
      </Button>

      <p className="text-xs text-muted-foreground">
        Sem linhas cadastradas, o produto usa as medidas e códigos gerais acima. Com linhas, o cliente
        escolhe a linha primeiro e vê só as medidas dela.
      </p>
    </div>
  );
}
