import type { Page } from "@playwright/test";
import { test, expect } from "./support/test";
import { arquivoDeSessao } from "./support/roles";
import {
  ESPERA_SERVIDOR,
  confirmarAcao,
  criarDocumento,
  recusarConfirmacao,
} from "./support/fixtures";

/**
 * Suíte E — trilha de status do orçamento e conversão em pedido.
 *
 * As ações críticas (enviar, aceitar, recusar, converter, excluir) passam por
 * `window.confirm` — ver components/confirm-submit-button.tsx. Sem tratar o
 * diálogo, o clique não faz nada e o teste falha sem explicar por quê.
 *
 * Atenção ao rótulo do status: o banco grava ENVIADO, mas a tela mostra
 * "Pendente" (lib/budget-status.ts). Aqui vale o que aparece para o usuário.
 */
test.use({ storageState: arquivoDeSessao("admin") });

/** Selo de status no cabeçalho do documento. */
function selo(page: Page, texto: string) {
  return page.getByText(texto, { exact: true }).first();
}

test.describe("Rascunho @escrita", () => {
  test("mostra as ações de rascunho", async ({ page }) => {
    await criarDocumento(page);

    await expect(selo(page, "Rascunho")).toBeVisible();
    await expect(page.getByRole("link", { name: "Editar" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Marcar como enviado" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Excluir rascunho" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Baixar PDF" })).toBeVisible();
  });

  test("editar um rascunho grava a alteração", async ({ page }) => {
    const { url } = await criarDocumento(page);
    const novoTitulo = `Editado ${Date.now()}`;

    await page.getByRole("link", { name: "Editar" }).click();
    await expect(page).toHaveURL(/\/editar$/, { timeout: ESPERA_SERVIDOR });

    await page.getByLabel("Título (opcional)").fill(novoTitulo);
    await page.getByRole("button", { name: /Salvar|Atualizar/ }).click();

    await expect(page).toHaveURL(url, { timeout: ESPERA_SERVIDOR });
    await expect(page.getByRole("heading", { name: new RegExp(novoTitulo) })).toBeVisible();
  });

  test("excluir rascunho tira o documento da lista", async ({ page }) => {
    const { titulo } = await criarDocumento(page);

    await confirmarAcao(page, "Excluir rascunho");

    await expect(page).toHaveURL(/\/orcamentos$/, { timeout: ESPERA_SERVIDOR });
    await expect(page.getByText(titulo)).toHaveCount(0);
  });
});

test.describe("Enviar e responder @escrita", () => {
  test("marcar como enviado vira Pendente e tranca a edição", async ({ page }) => {
    const { url } = await criarDocumento(page);

    await confirmarAcao(page, "Marcar como enviado");

    await expect(selo(page, "Pendente")).toBeVisible({ timeout: ESPERA_SERVIDOR });
    await expect(page.getByRole("link", { name: "Editar" })).toHaveCount(0);

    // Nem pela URL direta.
    await page.goto(`${url}/editar`);
    await expect(page.getByText(/não pode ser editad|Rascunho/i).first()).toBeVisible({
      timeout: ESPERA_SERVIDOR,
    });
  });

  test("voltar para rascunho devolve o botão Editar", async ({ page }) => {
    await criarDocumento(page);
    await confirmarAcao(page, "Marcar como enviado");
    await expect(selo(page, "Pendente")).toBeVisible({ timeout: ESPERA_SERVIDOR });

    await page.getByRole("button", { name: "Voltar para rascunho" }).click();

    await expect(selo(page, "Rascunho")).toBeVisible({ timeout: ESPERA_SERVIDOR });
    await expect(page.getByRole("link", { name: "Editar" })).toBeVisible();
  });

  test("cliente aceitou cria a venda vinculada", async ({ page }) => {
    await criarDocumento(page);
    await confirmarAcao(page, "Marcar como enviado");
    await expect(selo(page, "Pendente")).toBeVisible({ timeout: ESPERA_SERVIDOR });

    await confirmarAcao(page, "Cliente aceitou");

    await expect(selo(page, "Aceito")).toBeVisible({ timeout: ESPERA_SERVIDOR });
    await expect(page.getByText("Venda vinculada:")).toBeVisible();
    await expect(page.getByRole("button", { name: "Marcar venda como finalizada" })).toBeVisible();
  });

  test("finalizar a venda registra a data", async ({ page }) => {
    await criarDocumento(page);
    await confirmarAcao(page, "Marcar como enviado");
    await expect(selo(page, "Pendente")).toBeVisible({ timeout: ESPERA_SERVIDOR });
    await confirmarAcao(page, "Cliente aceitou");
    await expect(selo(page, "Aceito")).toBeVisible({ timeout: ESPERA_SERVIDOR });

    await confirmarAcao(page, "Marcar venda como finalizada");

    // `exact`: o selo "Finalizada" e o texto "· finalizada em 10/08/2026"
    // casam com o mesmo termo e disputam o strict mode.
    await expect(page.getByText("Finalizada", { exact: true })).toBeVisible({
      timeout: ESPERA_SERVIDOR,
    });
    await expect(page.getByText(/finalizada em/)).toBeVisible();
  });

  test("cliente recusou não cria venda", async ({ page }) => {
    await criarDocumento(page);
    await confirmarAcao(page, "Marcar como enviado");
    await expect(selo(page, "Pendente")).toBeVisible({ timeout: ESPERA_SERVIDOR });

    await confirmarAcao(page, "Cliente recusou");

    await expect(selo(page, "Recusado")).toBeVisible({ timeout: ESPERA_SERVIDOR });
    await expect(page.getByText("Venda vinculada:")).toHaveCount(0);
  });
});

test.describe("Conversão em pedido @escrita", () => {
  test("cancelar a confirmação não converte", async ({ page }) => {
    const { url } = await criarDocumento(page);

    recusarConfirmacao(page);
    await page.getByRole("button", { name: "Converter em pedido" }).click();

    await expect(page).toHaveURL(url);
    await expect(page.getByRole("button", { name: "Converter em pedido" })).toBeVisible();
  });

  test("converter move o documento de orçamentos para pedidos", async ({ page }) => {
    const { url, titulo } = await criarDocumento(page);

    await confirmarAcao(page, "Converter em pedido");

    await expect(page).toHaveURL(/\/pedidos\/[^/]+$/, { timeout: ESPERA_SERVIDOR });
    await expect(page.getByRole("heading", { name: /^Pedido #/ })).toBeVisible();
    // Mão única: o botão de converter não volta.
    await expect(page.getByRole("button", { name: "Converter em pedido" })).toHaveCount(0);

    // A URL antiga redireciona para a seção certa em vez de dar 404.
    await page.goto(url);
    await expect(page).toHaveURL(/\/pedidos\/[^/]+$/, { timeout: ESPERA_SERVIDOR });

    // Some da lista de orçamentos, entra na de pedidos.
    await page.goto("/orcamentos");
    await expect(page.getByText(titulo)).toHaveCount(0);
    await page.goto("/pedidos");
    await expect(page.getByText(titulo)).toHaveCount(1, { timeout: ESPERA_SERVIDOR });
  });
});

test.describe("Filtros da lista @escrita", () => {
  test("o filtro Rascunhos mostra o documento recém-criado", async ({ page }) => {
    const { titulo } = await criarDocumento(page);

    await page.goto("/orcamentos?status=RASCUNHO");

    await expect(page.getByText(titulo)).toHaveCount(1, { timeout: ESPERA_SERVIDOR });
    await expect(page.getByRole("heading", { name: /^Rascunho \(/ })).toBeVisible();
  });

  test("o filtro Aceitos não lista um rascunho", async ({ page }) => {
    const { titulo } = await criarDocumento(page);

    await page.goto("/orcamentos?status=ACEITO");

    await expect(page.getByText(titulo)).toHaveCount(0);
  });
});
