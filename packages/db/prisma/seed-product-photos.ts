/**
 * Aplica as fotos dos produtos por código.
 *
 *   pnpm --filter @cleci/db seed:fotos          # aplica
 *   pnpm --filter @cleci/db seed:fotos -- --dry # só mostra o que faria
 *
 * Idempotente: rodar duas vezes não muda nada na segunda. Só mexe em
 * `imageUrl` — preço, descrição, categoria e publicação no site ficam como
 * estão.
 *
 * Sobre os links: o Imgur tem DUAS formas de URL e só uma serve. A de página
 * (`imgur.com/AbCdEfG`) devolve HTML, e a imagem apareceria quebrada no site e
 * vazia no PDF; a do arquivo é `i.imgur.com/AbCdEfG.png`. As URLs abaixo já
 * estão na forma do arquivo — é a mesma conversão que `suggestFix()` sugere no
 * painel quando alguém cola a de página.
 */
import { prisma, PriceUnit } from "../src/index.js";

type Foto = {
  code: string;
  url: string;
  /**
   * Dados para CRIAR o produto quando o código ainda não existe. Sem isto o
   * script não inventa cadastro: pula e avisa, porque descrição e preço errados
   * saem no orçamento do cliente.
   */
  criar?: { description: string; unit: PriceUnit; priceCents: number };
};

const FOTOS: Foto[] = [
  { code: "4021", url: "https://i.imgur.com/3mmZpy2.png" },
  { code: "4023", url: "https://i.imgur.com/xPwzKZ9.png" },
  { code: "4026", url: "https://i.imgur.com/wfCJ8wK.png" },
  { code: "4028", url: "https://i.imgur.com/uyh5dal.png" },
  { code: "4038", url: "https://i.imgur.com/KmG9yiW.png" },
  { code: "4039", url: "https://i.imgur.com/O4ktLSx.png" },
  { code: "4040", url: "https://i.imgur.com/VgIewo3.png" },
  {
    code: "4044",
    url: "https://i.imgur.com/JHBm3tB.png",
    // Existe no banco, mas NÃO na planilha `produtos.html` — ela está atrasada
    // em relação ao cadastro. Os dados abaixo são cópia do que está gravado,
    // só para o caso de rodar contra um banco recém-semeado pela planilha.
    criar: {
      description: "SACOLA PAPEL BRANCO 13X10X3,5",
      unit: PriceUnit.UNIDADE,
      priceCents: 320,
    },
  },
  { code: "4054", url: "https://i.imgur.com/LKtOsNB.png" },
  { code: "4003", url: "https://i.imgur.com/L2aEc48.png" },
  { code: "4013", url: "https://i.imgur.com/tGF8APl.png" },
];

/** Mesma normalização de `normalizeSearch` no app: sem acento, em maiúsculas. */
function normalizeSearch(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toUpperCase()
    .replace(/\s+/g, " ")
    .trim();
}

async function main() {
  const dry = process.argv.includes("--dry");
  if (dry) console.log("MODO SECO — nada será gravado.\n");

  let atualizados = 0;
  let criados = 0;
  let iguais = 0;
  const pulados: string[] = [];

  for (const foto of FOTOS) {
    const existente = await prisma.priceItem.findUnique({
      where: { code: foto.code },
      select: { id: true, description: true, imageUrl: true },
    });

    if (existente) {
      if (existente.imageUrl === foto.url) {
        iguais++;
        console.log(`= ${foto.code}  já está com esta foto`);
        continue;
      }
      const antes = existente.imageUrl ? "troca a foto" : "ganha foto";
      console.log(`~ ${foto.code}  ${antes} — ${existente.description}`);
      if (!dry) {
        await prisma.priceItem.update({
          where: { id: existente.id },
          data: { imageUrl: foto.url },
        });
      }
      atualizados++;
      continue;
    }

    if (!foto.criar) {
      pulados.push(foto.code);
      console.log(`! ${foto.code}  não existe e não tenho descrição/preço para criar`);
      continue;
    }

    console.log(`+ ${foto.code}  cria — ${foto.criar.description}`);
    if (!dry) {
      const ultimo = await prisma.priceItem.findFirst({
        orderBy: { position: "desc" },
        select: { position: true },
      });
      await prisma.priceItem.create({
        data: {
          code: foto.code,
          description: foto.criar.description,
          unit: foto.criar.unit,
          priceCents: foto.criar.priceCents,
          searchText: normalizeSearch(foto.criar.description),
          imageUrl: foto.url,
          active: true,
          position: (ultimo?.position ?? 0) + 1,
          // Espelho da unidade principal: sem esta linha o produto aparece na
          // busca do orçamento sem nenhuma unidade para escolher.
          prices: {
            create: [{ unit: foto.criar.unit, priceCents: foto.criar.priceCents, position: 0 }],
          },
        },
      });
    }
    criados++;
  }

  console.log(
    `\nOK — ${atualizados} com foto nova, ${criados} criados, ${iguais} já estavam certos.`,
  );
  if (pulados.length > 0) {
    console.log(`Pulados (cadastre antes): ${pulados.join(", ")}`);
  }
  if (criados > 0) {
    console.log("Atenção: produto criado entra com preço a definir — ajuste em Produtos.");
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
