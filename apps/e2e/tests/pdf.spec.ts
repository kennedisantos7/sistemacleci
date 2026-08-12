import type { Browser } from "@playwright/test";
import { test, expect } from "./support/test";
import { arquivoDeSessao } from "./support/roles";
import { ESPERA_SERVIDOR, confirmarAcao, criarDocumento } from "./support/fixtures";

/**
 * Suíte G — geração de PDF.
 *
 * A rota responde com `Content-Disposition: attachment`, então o arquivo baixa
 * direto (não abre aba). É por isso que o link do detalhe não usa
 * target="_blank" — no celular só deixava uma aba em branco.
 */
test.use({ storageState: arquivoDeSessao("admin") });

/** Extrai o id do documento a partir da URL do detalhe. */
function idDaUrl(url: string): string {
  return url.split("/").pop()!;
}

test.describe("Download do PDF @escrita", () => {
  test("a rota responde um PDF como anexo", async ({ page }) => {
    const { url } = await criarDocumento(page);

    const resposta = await page.request.get(`/api/orcamentos/${idDaUrl(url)}/pdf`);

    expect(resposta.status()).toBe(200);
    expect(resposta.headers()["content-type"]).toContain("application/pdf");
    expect(resposta.headers()["content-disposition"]).toContain("attachment");

    // Assinatura de arquivo PDF: os quatro primeiros bytes são "%PDF".
    const corpo = await resposta.body();
    expect(corpo.subarray(0, 4).toString()).toBe("%PDF");
  });

  test("clicar em Baixar PDF dispara o download", async ({ page }) => {
    await criarDocumento(page);

    const [download] = await Promise.all([
      page.waitForEvent("download", { timeout: ESPERA_SERVIDOR }),
      page.getByRole("link", { name: "Baixar PDF" }).click(),
    ]);

    expect(download.suggestedFilename()).toMatch(/\.pdf$/);
  });

  test("o PDF do pedido é mais completo que o do orçamento", async ({ page }) => {
    // Mesmo documento antes e depois de virar pedido: o do pedido sai com dados
    // da empresa, cláusulas e assinatura, então é maior.
    const { url } = await criarDocumento(page);
    const id = idDaUrl(url);

    const orcamento = await (await page.request.get(`/api/orcamentos/${id}/pdf`)).body();

    await confirmarAcao(page, "Converter em pedido");
    await expect(page).toHaveURL(/\/pedidos\/[^/]+$/, { timeout: ESPERA_SERVIDOR });

    const pedido = await (await page.request.get(`/api/orcamentos/${id}/pdf`)).body();

    expect(pedido.length).toBeGreaterThan(orcamento.length);
  });
});

test.describe("Acesso ao PDF @rbac @escrita", () => {
  test("sem sessão a rota não entrega o arquivo", async ({ page, browser }) => {
    const { url } = await criarDocumento(page);

    // `storageState` vazio EXPLÍCITO: browser.newContext() herda as opções do
    // test.use, então sem isto o contexto "anônimo" nasceria logado como admin
    // e o teste passaria a provar o contrário do que promete.
    const anonimo = await browser.newContext({ storageState: { cookies: [], origins: [] } });
    const resposta = await anonimo.request.get(
      new URL(`/api/orcamentos/${idDaUrl(url)}/pdf`, page.url()).toString(),
      { maxRedirects: 0 },
    );

    // Rota protegida não devolve 401: o middleware redireciona para o login.
    expect(resposta.status()).toBe(307);
    expect(resposta.headers()["location"]).toContain("/login");
    await anonimo.close();
  });

  test("vendedor não baixa o PDF de documento de outro vendedor", async ({
    page,
    browser,
  }: {
    page: import("@playwright/test").Page;
    browser: Browser;
  }) => {
    const { url } = await criarDocumento(page); // criado pelo admin

    const outro = await browser.newContext({ storageState: arquivoDeSessao("vendedor") });
    const resposta = await outro.request.get(
      new URL(`/api/orcamentos/${idDaUrl(url)}/pdf`, page.url()).toString(),
      { maxRedirects: 0 },
    );

    // Documento de outro vendedor simplesmente não existe para ele.
    expect(resposta.status()).toBe(404);
    await outro.close();
  });
});
