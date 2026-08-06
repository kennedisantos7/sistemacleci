/**
 * Importa a tabela de preços a partir da planilha de produtos exportada do
 * Google Sheets (`Orçamento_pedido/produtos.html`).
 *
 *   pnpm --filter @cleci/db seed:precos            # usa a planilha padrão
 *   pnpm --filter @cleci/db seed:precos -- --dry   # só mostra o que faria
 *   pnpm --filter @cleci/db seed:precos -- caminho/produtos.html
 *
 * Idempotente: faz upsert por `code`. Só o preço, a descrição e a unidade são
 * atualizados — `active`/`group`/`position` editados no painel são preservados.
 * A planilha continua sendo a fonte para reajustes: mudou lá, roda de novo.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { prisma, PriceUnit } from "../src/index.js";

const DEFAULT_SHEET = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../../Orçamento_pedido/produtos.html",
);

// --------------------------------------------------------------------------
// Parser do HTML da planilha
// --------------------------------------------------------------------------

const ENTITIES: Record<string, string> = {
  "&nbsp;": " ",
  "&amp;": "&",
  "&quot;": '"',
  "&#39;": "'",
  "&lt;": "<",
  "&gt;": ">",
};

function decode(html: string): string {
  return html
    .replace(/&(?:nbsp|amp|quot|#39|lt|gt);/g, (m) => ENTITIES[m] ?? m)
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number(code)))
    .replace(/​/g, "") // zero-width space: célula "vazia" do Sheets
    .replace(/\s+/g, " ")
    .trim();
}

/** Extrai as linhas da tabela preservando células vazias e colspan. */
function parseRows(html: string): string[][] {
  const body = html.replace(/<style[\s\S]*?<\/style>/g, "").replace(/<script[\s\S]*?<\/script>/g, "");
  const rows: string[][] = [];

  for (const [, trInner] of body.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)) {
    const cells: string[] = [];
    for (const cell of (trInner ?? "").matchAll(/<t([dh])([^>]*)>([\s\S]*?)<\/t\1>/g)) {
      const attrs = cell[2] ?? "";
      const text = decode((cell[3] ?? "").replace(/<[^>]+>/g, ""));
      cells.push(text);
      // colspan ocupa N colunas: repete vazios para não desalinhar as demais.
      const span = Number(/colspan="(\d+)"/.exec(attrs)?.[1] ?? 1);
      for (let i = 1; i < span; i++) cells.push("");
    }
    if (cells.length) rows.push(cells);
  }
  return rows;
}

/** "R$ 1.350,00" | "13.90" | "" -> centavos (null quando não há preço). */
export function parsePrice(raw: string): number | null {
  const cleaned = raw.replace(/R\$/gi, "").replace(/\s/g, "").trim();
  if (!cleaned) return null;

  // Com vírgula: formato BR (ponto = milhar). Sem vírgula: ponto é decimal.
  const normalized = cleaned.includes(",")
    ? cleaned.replace(/\./g, "").replace(",", ".")
    : cleaned;
  const value = Number(normalized);
  if (!Number.isFinite(value) || value < 0) return null;
  return Math.round(value * 100);
}

const UNIT_BY_LABEL: Record<string, PriceUnit> = {
  M2: PriceUnit.M2,
  "M²": PriceUnit.M2,
  UNIDADE: PriceUnit.UNIDADE,
  UN: PriceUnit.UNIDADE,
  PACOTE: PriceUnit.PACOTE,
  PCT: PriceUnit.PACOTE,
  MILHEIRO: PriceUnit.MILHEIRO,
};

export function parseUnit(raw: string): PriceUnit {
  return UNIT_BY_LABEL[raw.toUpperCase().trim()] ?? PriceUnit.UNIDADE;
}

/**
 * Forma normalizada usada na busca (sem acento, maiúsculas). Precisa ficar
 * idêntica a `normalizeSearch` em apps/sistema/src/server/services/price-items.ts
 * — os dois lados alimentam/consultam a mesma coluna `searchText`.
 */
export function normalizeSearch(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/\s+/g, " ")
    .trim();
}

export type ParsedPriceItem = {
  code: string;
  description: string;
  unit: PriceUnit;
  priceCents: number;
  searchText: string;
  position: number;
};

/**
 * Lê o HTML e devolve os produtos. Layout da planilha (a 1ª coluna do export é
 * o número da linha do Sheets): [nº] [código] [descrição] [tipo] [valor].
 */
export function parseSheet(html: string): { items: ParsedPriceItem[]; skipped: string[] } {
  const items: ParsedPriceItem[] = [];
  const skipped: string[] = [];
  const seen = new Set<string>();

  for (const cells of parseRows(html)) {
    const [, code, description, unit, price] = cells.map((c) => c ?? "");
    if (!code || !/^\d+$/.test(code)) continue; // cabeçalho, separador, coluna A/B/C...
    if (!description) {
      skipped.push(`${code}: sem descrição`);
      continue;
    }
    if (seen.has(code)) {
      skipped.push(`${code}: código repetido na planilha (mantido o primeiro)`);
      continue;
    }

    const priceCents = parsePrice(price ?? "");
    if (priceCents === null) {
      // Item sem preço na planilha (ex.: "INSTALAÇÃO DE PISO DE PNEU").
      // Entra com 0 — o vendedor digita o valor no orçamento.
      skipped.push(`${code} ${description}: sem preço na planilha (importado com R$ 0,00)`);
    }

    seen.add(code);
    items.push({
      code,
      description,
      unit: parseUnit(unit ?? ""),
      priceCents: priceCents ?? 0,
      searchText: normalizeSearch(description),
      position: items.length,
    });
  }

  return { items, skipped };
}

// --------------------------------------------------------------------------
// Importação
// --------------------------------------------------------------------------

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry");
  const sheetPath = args.find((a) => !a.startsWith("--")) ?? DEFAULT_SHEET;

  if (!fs.existsSync(sheetPath)) {
    throw new Error(`Planilha não encontrada: ${sheetPath}`);
  }

  const { items, skipped } = parseSheet(fs.readFileSync(sheetPath, "utf8"));
  if (items.length === 0) {
    throw new Error("Nenhum produto encontrado na planilha — o layout mudou?");
  }

  console.log(`Planilha: ${sheetPath}`);
  console.log(`Produtos encontrados: ${items.length}`);
  const byUnit = items.reduce<Record<string, number>>((acc, it) => {
    acc[it.unit] = (acc[it.unit] ?? 0) + 1;
    return acc;
  }, {});
  console.log(`Por unidade: ${JSON.stringify(byUnit)}`);
  if (skipped.length) {
    console.log(`\nAvisos (${skipped.length}):`);
    for (const warn of skipped) console.log(`  - ${warn}`);
  }

  if (dryRun) {
    console.log("\n--dry: nada foi gravado. Amostra:");
    for (const it of items.slice(0, 10)) {
      console.log(`  ${it.code}  ${it.description}  [${it.unit}]  ${it.priceCents / 100}`);
    }
    return;
  }

  let created = 0;
  let updated = 0;
  for (const it of items) {
    const existing = await prisma.priceItem.findUnique({
      where: { code: it.code },
      select: { id: true },
    });
    const saved = await prisma.priceItem.upsert({
      where: { code: it.code },
      // Não sobrescreve active/group/position ajustados no painel.
      update: {
        description: it.description,
        unit: it.unit,
        priceCents: it.priceCents,
        searchText: it.searchText,
      },
      create: it,
      select: { id: true },
    });

    // A planilha traz uma unidade por produto. Garante a linha de preço dessa
    // unidade sem tocar nas outras que o admin tenha cadastrado no painel —
    // preços por pacote/m² adicionados à mão sobrevivem ao seed.
    await prisma.priceItemPrice.upsert({
      where: { priceItemId_unit: { priceItemId: saved.id, unit: it.unit } },
      update: { priceCents: it.priceCents },
      create: { priceItemId: saved.id, unit: it.unit, priceCents: it.priceCents, position: 0 },
    });

    if (existing) updated++;
    else created++;
  }

  console.log(`\nOK — ${created} criados, ${updated} atualizados.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
