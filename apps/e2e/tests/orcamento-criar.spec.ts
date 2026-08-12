import { test, expect } from "./support/test";
import { arquivoDeSessao } from "./support/roles";
import {
  ESPERA_SERVIDOR,
  criarCliente,
  criarDocumento,
  preencherItem,
  totalFinal,
} from "./support/fixtures";

/**
 * Suíte D — criação e cálculo do orçamento. É o núcleo financeiro: valores em
 * centavos, percentuais em bps. Os totais são recalculados no cliente, sem
 * navegação, então dá para conferir cada passo sem salvar.
 *
 * Todos os testes criam o próprio cliente e usam título com Date.now(): nenhum
 * depende de dado preexistente nem do que outro teste deixou.
 */
test.use({ storageState: arquivoDeSessao("admin") });

test.describe("Cálculo no formulário @escrita", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/orcamentos/novo");
    await expect(page.getByLabel("Cliente *")).toBeVisible({ timeout: ESPERA_SERVIDOR });
  });

  test("total começa zerado e reage ao primeiro item", async ({ page }) => {
    expect(await totalFinal(page)).toBe("R$ 0,00");

    await preencherItem(page, 1, {
      descricao: "Banner lona",
      valor: "100,00",
      quantidade: "3",
      unidade: "Unidade",
    });

    expect(await totalFinal(page)).toBe("R$ 300,00");
  });

  test("quantidade fracionária multiplica certo", async ({ page }) => {
    await preencherItem(page, 1, {
      descricao: "Adesivo",
      valor: "80,00",
      quantidade: "2,5",
      unidade: "Unidade",
    });

    expect(await totalFinal(page)).toBe("R$ 200,00");
  });

  test("item em M² calcula pela área (largura × comprimento)", async ({ page }) => {
    await preencherItem(page, 1, {
      descricao: "Fachada em ACM",
      valor: "50,00",
      unidade: "M²",
      larguraM: "3",
      comprimentoM: "2",
      quantidade: "1",
    });

    // 3 m × 2 m = 6 m² a R$ 50,00 = R$ 300,00
    expect(await totalFinal(page)).toBe("R$ 300,00");
  });

  test("três itens somam no total", async ({ page }) => {
    await preencherItem(page, 1, { descricao: "Item A", valor: "100,00", quantidade: "1", unidade: "Unidade" });
    await page.getByRole("button", { name: "Adicionar item" }).click();
    await preencherItem(page, 2, { descricao: "Item B", valor: "250,00", quantidade: "2", unidade: "Unidade" });
    await page.getByRole("button", { name: "Adicionar item" }).click();
    await preencherItem(page, 3, { descricao: "Item C", valor: "30,50", quantidade: "1", unidade: "Unidade" });

    // 100 + 500 + 30,50
    expect(await totalFinal(page)).toBe("R$ 630,50");
  });

  test("remover um item recalcula o total", async ({ page }) => {
    await preencherItem(page, 1, { descricao: "Fica", valor: "100,00", quantidade: "1", unidade: "Unidade" });
    await page.getByRole("button", { name: "Adicionar item" }).click();
    await preencherItem(page, 2, { descricao: "Sai", valor: "400,00", quantidade: "1", unidade: "Unidade" });
    expect(await totalFinal(page)).toBe("R$ 500,00");

    await page.getByRole("button", { name: "Remover item 2" }).click();

    expect(await totalFinal(page)).toBe("R$ 100,00");
  });

  test("desconto em reais subtrai do total", async ({ page }) => {
    await preencherItem(page, 1, { descricao: "Item", valor: "500,00", quantidade: "1", unidade: "Unidade" });

    await page.getByRole("textbox", { name: "Desconto em reais" }).fill("50,00");

    expect(await totalFinal(page)).toBe("R$ 450,00");
  });

  test("desconto em porcentagem aplica o percentual", async ({ page }) => {
    await preencherItem(page, 1, { descricao: "Item", valor: "500,00", quantidade: "1", unidade: "Unidade" });

    // O par R$ / % são botões com aria-label próprio; o campo de valor troca
    // de rótulo junto (vira "Desconto em porcentagem").
    await page.getByRole("button", { name: "Desconto em porcentagem" }).click();
    await page.getByRole("textbox", { name: "Desconto em porcentagem" }).fill("10");

    expect(await totalFinal(page)).toBe("R$ 450,00");
  });

  test("adicional, frete e imposto somam ao total", async ({ page }) => {
    await preencherItem(page, 1, { descricao: "Item", valor: "1000,00", quantidade: "1", unidade: "Unidade" });

    await page.getByRole("textbox", { name: "Adicional em reais" }).fill("100,00");
    await page.getByRole("textbox", { name: "Frete em reais" }).fill("50,00");
    await page.getByRole("textbox", { name: "Imposto em reais" }).fill("25,00");

    expect(await totalFinal(page)).toBe("R$ 1.175,00");
  });

  test("desconto em % combinado com frete bate o total", async ({ page }) => {
    await preencherItem(page, 1, { descricao: "Item", valor: "1000,00", quantidade: "1", unidade: "Unidade" });

    await page.getByRole("button", { name: "Desconto em porcentagem" }).click();
    await page.getByRole("textbox", { name: "Desconto em porcentagem" }).fill("15");
    await page.getByRole("textbox", { name: "Frete em reais" }).fill("80,00");

    // 1000 − 150 + 80
    expect(await totalFinal(page)).toBe("R$ 930,00");
  });

  test("zerar o desconto devolve o total cheio", async ({ page }) => {
    await preencherItem(page, 1, { descricao: "Item", valor: "200,00", quantidade: "1", unidade: "Unidade" });
    await page.getByRole("textbox", { name: "Desconto em reais" }).fill("50,00");
    expect(await totalFinal(page)).toBe("R$ 150,00");

    await page.getByRole("textbox", { name: "Desconto em reais" }).fill("0");

    expect(await totalFinal(page)).toBe("R$ 200,00");
  });
});

test.describe("Validação do formulário @escrita", () => {
  test("sem cliente o formulário não é enviado", async ({ page }) => {
    await page.goto("/orcamentos/novo");
    await preencherItem(page, 1, { descricao: "Item", valor: "10,00", quantidade: "1", unidade: "Unidade" });

    await page.getByRole("button", { name: "Criar orçamento" }).click();

    await expect(page).toHaveURL(/\/orcamentos\/novo$/);
    await expect(page.getByLabel("Cliente *")).toHaveJSProperty("validity.valueMissing", true);
  });

  test("título acima de 160 caracteres é recusado", async ({ page }) => {
    const cliente = await criarCliente(page);
    await page.goto("/orcamentos/novo");

    await page.getByLabel("Cliente *").selectOption({ label: cliente });
    await page.getByLabel("Título (opcional)").fill("T".repeat(161));
    await preencherItem(page, 1, { descricao: "Item", valor: "10,00", quantidade: "1", unidade: "Unidade" });

    await page.getByRole("button", { name: "Criar orçamento" }).click();

    await expect(page.getByText("Título muito longo.")).toBeVisible({ timeout: ESPERA_SERVIDOR });
    await expect(page).toHaveURL(/\/orcamentos\/novo$/);
  });
});

test.describe("Documento salvo @escrita", () => {
  test("orçamento nasce como rascunho com os dados digitados", async ({ page }) => {
    const titulo = `Fachada E2E ${Date.now()}`;
    const { cliente } = await criarDocumento(page, {
      titulo,
      itens: [
        { descricao: "Banner 3x2", valor: "50,00", unidade: "M²", larguraM: "3", comprimentoM: "2", quantidade: "1" },
        { descricao: "Adesivo recorte", valor: "120,00", quantidade: "2", unidade: "Unidade" },
      ],
    });

    await expect(page.getByRole("heading", { name: new RegExp(titulo) })).toBeVisible();
    await expect(page.getByText("Rascunho").first()).toBeVisible();
    await expect(page.getByText(cliente).first()).toBeVisible();

    await expect(page.getByRole("cell", { name: "Banner 3x2" })).toBeVisible();
    await expect(page.getByRole("cell", { name: "Adesivo recorte" })).toBeVisible();

    // 6 m² × R$ 50,00 = 300 ; 2 × R$ 120,00 = 240
    expect(await totalFinal(page)).toBe("R$ 540,00");
  });

  test("o novo orçamento aparece na lista, uma única vez", async ({ page }) => {
    const titulo = `Lista E2E ${Date.now()}`;
    await criarDocumento(page, { titulo });

    await page.goto("/orcamentos");

    // Âncora no título único, e não em contagem de lista. Dois motivos: os
    // testes rodam em paralelo contra o mesmo servidor, e a lista tem teto de
    // 50 documentos (`take: 50` em listBudgetsForActor) — passado esse ponto,
    // qualquer comparação de contagem para de fazer sentido.
    await expect(page.getByText(titulo)).toHaveCount(1, { timeout: ESPERA_SERVIDOR });
  });
});
