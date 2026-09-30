import { test, expect } from "./support/test";
import type { BrowserContext, Locator, Page } from "@playwright/test";

/**
 * Suíte N (parte) — atribuição de afiliado, ponta a ponta. Tudo `@smoke`: só lê,
 * nunca grava. Segura contra produção.
 *
 * O caminho da comissão tem três pernas, e cada uma é testada aqui:
 *  1. painel: /go/<ref> conta o clique e manda para o site com ?ref=;
 *  2. site: ?ref= vira o cookie first-party `cleci_ref` (30 dias, last-touch);
 *  3. site: o ref sai na mensagem do WhatsApp — é dela que o admin copia o
 *     código ao lançar a venda manual.
 *
 * O site é outro app. `SITE_URL` aponta para ele; sem isso, segue o alvo do
 * painel (local → :3000, remoto → cleci.com.br).
 */
const PAINEL = process.env.BASE_URL ?? "http://localhost:3001";
const painelLocal = /localhost|127\.0\.0\.1/.test(PAINEL);
const SITE = process.env.SITE_URL ?? (painelLocal ? "http://localhost:3000" : "https://cleci.com.br");
const siteLocal = /localhost|127\.0\.0\.1/.test(SITE);

/** Código de formato válido que não pertence a ninguém. */
const REF = "TesteRef9";

/** Extrai o código do `(ref: XXXX)` que o site anexa à mensagem do WhatsApp. */
function refDaMensagem(href: string | null): string | null {
  const texto = new URLSearchParams((href ?? "").split("?")[1] ?? "").get("text") ?? "";
  return texto.match(/ref: ([0-9A-Za-z]+)/)?.[1] ?? null;
}

/**
 * Abre uma página do site e espera a HIDRATAÇÃO, não o `load`. O `load` espera
 * os vídeos do carrossel e às vezes passa de 20s em produção; antes da
 * hidratação, por outro lado, o clique cai num link sem handler. O sinal é o
 * GET /api/me, que o site só dispara de dentro de um efeito do React.
 */
async function abrirSite(page: Page, caminho: string): Promise<void> {
  await Promise.all([
    page.waitForRequest(/\/api\/me/),
    page.goto(`${SITE}${caminho}`, { waitUntil: "domcontentloaded" }),
  ]);
}

/** Nunca abre o WhatsApp de verdade: a aba que o clique abre é abortada. */
async function bloquearWhatsApp(context: BrowserContext): Promise<void> {
  await context.route(/wa\.me|whatsapp\.com/, (r) => r.abort());
}

/**
 * Clica e lê o href DEPOIS do clique. É o que importa: o site regrava o link no
 * clique, porque o href do render sai sem o ref (no servidor não há cookie).
 */
async function hrefDepoisDoClique(page: Page, link: Locator): Promise<string | null> {
  await link.scrollIntoViewIfNeeded();
  await Promise.all([page.waitForEvent("popup").catch(() => null), link.click()]);
  return link.getAttribute("href");
}

/** Um produto real, tirado do sitemap — sem id fixo que envelhece. */
async function umProduto(request: import("@playwright/test").APIRequestContext): Promise<string> {
  const xml = await (await request.get(`${SITE}/sitemap.xml`)).text();
  const caminho = xml.match(/<loc>[^<]*?(\/produto\/[^<]+)<\/loc>/)?.[1];
  expect(caminho, "o sitemap deveria listar ao menos um produto").toBeTruthy();
  return caminho!;
}

// ------------------------------------------------------------------ painel
test.describe("Afiliação — painel @smoke", () => {
  test("/go com ref inexistente vai para o site sem atribuir", async ({ request }) => {
    const res = await request.get(`${PAINEL}/go/NaoExiste${Date.now()}`, { maxRedirects: 0 });

    expect(res.status()).toBe(302);
    const destino = new URL(res.headers()["location"]!);
    expect(destino.host).not.toBe(new URL(PAINEL).host);
    expect(destino.searchParams.has("ref")).toBe(false);
  });

  test("/api/me sem sessão responde deslogado, com CORS restrito", async ({ request }) => {
    const res = await request.get(`${PAINEL}/api/me`);

    expect(res.status()).toBe(200);
    expect(await res.json()).toEqual({ loggedIn: false });
    // Com credenciais, "*" seria rejeitado pelo navegador — e seria um furo.
    const origem = res.headers()["access-control-allow-origin"];
    expect(origem).toBeTruthy();
    expect(origem).not.toBe("*");
    expect(res.headers()["access-control-allow-credentials"]).toBe("true");
  });

  test("ingestão de venda recusa chamada sem a chave da API", async ({ request }) => {
    const semChave = await request.post(`${PAINEL}/api/sales/ingest`, {
      data: { amountCents: 100, ref: REF },
    });
    expect(semChave.status()).toBe(401);

    const chaveErrada = await request.post(`${PAINEL}/api/sales/ingest`, {
      headers: { "x-api-key": "chave-errada-de-proposito-0000000000" },
      data: { amountCents: 100, ref: REF },
    });
    expect(chaveErrada.status()).toBe(401);
  });

  test("webhook do Mercado Pago recusa notificação sem assinatura", async ({ request }) => {
    const res = await request.post(`${PAINEL}/api/webhooks/mercadopago`, {
      data: { type: "payment", data: { id: "123" } },
    });
    // 401 com o gateway configurado; 500 sem o segredo. Nunca 2xx.
    expect(res.status()).toBeGreaterThanOrEqual(400);
  });
});

// -------------------------------------------------------------------- site
test.describe("Afiliação — site @smoke", () => {
  // O timeout de navegação do config segue o PAINEL. O site tem carrossel com
  // vídeo, e em dev compila a rota na primeira visita: os 5s não bastam.
  test.use({
    viewport: { width: 1366, height: 900 },
    navigationTimeout: siteLocal ? 90_000 : 20_000,
    actionTimeout: siteLocal ? 15_000 : 10_000,
  });
  test.describe.configure({ timeout: siteLocal ? 180_000 : 60_000 });

  const cookieRef = async (context: BrowserContext) =>
    (await context.cookies()).find((c) => c.name === "cleci_ref");

  test("?ref= grava o cookie de atribuição por 30 dias", async ({ page, context }) => {
    await abrirSite(page, `/?ref=${REF}`);

    await expect.poll(async () => (await cookieRef(context))?.value).toBe(REF);
    const cookie = (await cookieRef(context))!;
    const dias = (cookie.expires - Date.now() / 1000) / 86_400;
    expect(dias).toBeGreaterThan(29);
    expect(dias).toBeLessThanOrEqual(30);
    expect(cookie.sameSite).toBe("Lax");
  });

  test("ref com formato inválido não substitui o válido", async ({ page, context }) => {
    await abrirSite(page, `/?ref=${REF}`);
    await expect.poll(async () => (await cookieRef(context))?.value).toBe(REF);

    await abrirSite(page, `/?ref=${encodeURIComponent("<script>")}`);
    await page.waitForTimeout(1_000); // folga para o efeito que grava o cookie

    expect((await cookieRef(context))?.value).toBe(REF);
  });

  test("o ref mais recente vence (last-touch)", async ({ page, context }) => {
    await abrirSite(page, "/?ref=PrimeiroRef1");
    await expect.poll(async () => (await cookieRef(context))?.value).toBe("PrimeiroRef1");

    await abrirSite(page, `/?ref=${REF}`);
    await expect.poll(async () => (await cookieRef(context))?.value).toBe(REF);
  });

  test("cliente que chega pelo link do produto leva o ref ao WhatsApp", async ({
    page,
    context,
    request,
  }) => {
    // Regressão: este é o link que o afiliado copia. O href saía do servidor sem
    // o ref e a hidratação o mantinha — a indicação se perdia em 100% dos casos.
    await bloquearWhatsApp(context);
    await abrirSite(page, `${await umProduto(request)}?ref=${REF}`);

    const botao = page.locator('a:has-text("Solicitar Orçamento"):visible').first();
    expect(refDaMensagem(await hrefDepoisDoClique(page, botao))).toBe(REF);
  });

  test("botão de contato do cabeçalho leva o ref ao WhatsApp", async ({ page, context }) => {
    // O link principal do painel manda o cliente para a HOME; sem o ref aqui,
    // quem chama pelo cabeçalho não era atribuído.
    await bloquearWhatsApp(context);
    await abrirSite(page, `/?ref=${REF}`);

    const botao = page.getByRole("link", { name: "Atendimento pelo WhatsApp" }).first();
    expect(refDaMensagem(await hrefDepoisDoClique(page, botao))).toBe(REF);
  });

  test("sem afiliado, o contato abre a conversa em branco", async ({ page, context }) => {
    await bloquearWhatsApp(context);
    await abrirSite(page, "/");

    const botao = page.getByRole("link", { name: "Atendimento pelo WhatsApp" }).first();
    expect(await hrefDepoisDoClique(page, botao)).not.toContain("text=");
  });

  test("sem sessão no painel, ?aff= não liga o modo afiliado", async ({ page, request }) => {
    // O modo afiliado é amarrado à sessão do painel (AccountAffiliateSync): o
    // ?aff= sozinho é apagado assim que /api/me responde "deslogado". Por isso o
    // afiliado precisa usar o mesmo navegador em que está logado no painel.
    await abrirSite(page, `/?aff=${REF}`);
    await abrirSite(page, await umProduto(request));

    await expect(page.getByText("Modo afiliado — copie e envie")).toHaveCount(0);
    await expect
      .poll(() => page.evaluate(() => localStorage.getItem("cleci_aff")))
      .toBeNull();
  });
});
