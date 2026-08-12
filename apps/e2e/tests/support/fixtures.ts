import { expect, type Page } from "@playwright/test";

/**
 * Helpers compartilhados. Tudo aqui é caminho de UI real — nada de escrever
 * direto no banco, senão o teste deixa de provar que a tela funciona.
 */

/**
 * Server action + banco por túnel SSH passam bem dos 5s padrão. Use este
 * timeout nas asserções que esperam o servidor responder.
 */
export const ESPERA_SERVIDOR = 30_000;

/**
 * O menu aparece duas vezes no DOM (barra lateral do desktop e gaveta do
 * celular). Sem recortar o visível, todo getByRole de link do menu estoura
 * strict mode violation.
 */
export function menuLateral(page: Page) {
  return page.locator("aside:visible");
}

/** Aceita o próximo `window.confirm` (os botões críticos usam o popup nativo). */
export function aceitarConfirmacao(page: Page): void {
  page.once("dialog", (d) => void d.accept());
}

/** Recusa o próximo `window.confirm`. */
export function recusarConfirmacao(page: Page): void {
  page.once("dialog", (d) => void d.dismiss());
}

/** Cria um cliente pela tela e devolve o nome usado (único por execução). */
export async function criarCliente(page: Page, prefixo = "Cliente E2E"): Promise<string> {
  const nome = `${prefixo} ${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  await page.goto("/clientes/novo");
  await page.getByLabel("Razão social / Nome").fill(nome);
  await page.getByRole("button", { name: "Cadastrar cliente" }).click();

  // Sucesso leva para o detalhe do cliente recém-criado. O `(?!novo)` é
  // essencial: sem ele a própria /clientes/novo casa com o padrão e o helper
  // seguiria em frente achando que criou.
  await expect(page).toHaveURL(/\/clientes\/(?!novo)[^/]+$/, { timeout: ESPERA_SERVIDOR });
  return nome;
}

export type ItemOrcamento = {
  descricao: string;
  /** Base de cálculo, no formato da tela: "100,00". */
  valor: string;
  quantidade?: string;
  unidade?: "M²" | "Unidade" | "Pacote" | "Milheiro";
  larguraM?: string;
  comprimentoM?: string;
};

/** Preenche a linha `i` (1-based) da planilha de itens. */
export async function preencherItem(page: Page, i: number, item: ItemOrcamento): Promise<void> {
  await page.getByRole("textbox", { name: `Descrição do item ${i}` }).fill(item.descricao);
  await page.getByRole("textbox", { name: `Valor do item ${i}` }).fill(item.valor);

  if (item.unidade) {
    await page.getByLabel(`Unidade do item ${i}`).selectOption({ label: item.unidade });
  }
  if (item.larguraM) {
    await page.getByRole("textbox", { name: `Largura do item ${i}` }).fill(item.larguraM);
  }
  if (item.comprimentoM) {
    await page.getByRole("textbox", { name: `Comprimento do item ${i}` }).fill(item.comprimentoM);
  }
  if (item.quantidade) {
    await page.getByRole("textbox", { name: `Quantidade do item ${i}` }).fill(item.quantidade);
  }
}

/**
 * Cria um documento (orçamento ou pedido) pela tela e devolve a URL do detalhe.
 * Cria o cliente junto, para o teste não depender de nada preexistente.
 */
export async function criarDocumento(
  page: Page,
  opcoes: {
    tipo?: "orcamentos" | "pedidos";
    titulo?: string;
    itens?: ItemOrcamento[];
  } = {},
): Promise<{ url: string; titulo: string; cliente: string }> {
  const tipo = opcoes.tipo ?? "orcamentos";
  const titulo = opcoes.titulo ?? `Doc E2E ${Date.now()}`;
  const itens = opcoes.itens ?? [{ descricao: "Item padrão", valor: "100,00", quantidade: "1" }];

  const cliente = await criarCliente(page);

  await page.goto(`/${tipo}/novo`);
  await page.getByLabel("Cliente *").selectOption({ label: cliente });
  await page.getByLabel("Título (opcional)").fill(titulo);

  for (const [indice, item] of itens.entries()) {
    if (indice > 0) await page.getByRole("button", { name: "Adicionar item" }).click();
    await preencherItem(page, indice + 1, item);
  }

  const rotulo = tipo === "pedidos" ? "Criar pedido" : "Criar orçamento";
  await page.getByRole("button", { name: rotulo }).click();

  // `(?!novo)` de novo: sem isso, um formulário que não submeteu deixaria o
  // teste na /novo e o helper devolveria essa URL como se fosse o documento.
  await expect(page).toHaveURL(new RegExp(`/${tipo}/(?!novo)[^/]+$`), {
    timeout: ESPERA_SERVIDOR,
  });
  return { url: page.url(), titulo, cliente };
}

/** O valor exibido na linha "Total final" do formulário ou do detalhe. */
export async function totalFinal(page: Page): Promise<string> {
  const linha = page.getByText("Total final").locator("xpath=..");
  const texto = (await linha.innerText()).replace(/\s+/g, " ");
  return texto.replace("Total final ", "").trim();
}

/** Aciona um botão que pede confirmação e aceita o popup. */
export async function confirmarAcao(page: Page, rotulo: string | RegExp): Promise<void> {
  aceitarConfirmacao(page);
  await page.getByRole("button", { name: rotulo }).click();
}
