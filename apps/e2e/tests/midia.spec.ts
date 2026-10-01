import { test, expect } from "./support/test";

/**
 * Fotos e vídeos do catálogo moram no banco e o painel os serve em
 * /media/<id>.<ext>. Tudo `@smoke`: só lê. Segura contra produção.
 */
const PAINEL = process.env.BASE_URL ?? "http://localhost:3001";
const painelLocal = /localhost|127\.0\.0\.1/.test(PAINEL);
const SITE = process.env.SITE_URL ?? (painelLocal ? "http://localhost:3000" : "https://cleci.com.br");
const siteLocal = /localhost|127\.0\.0\.1/.test(SITE);

/** Endereço da primeira foto de produto que o site referencia. */
async function umaFotoDoBanco(request: import("@playwright/test").APIRequestContext): Promise<string> {
  const xml = await (await request.get(`${SITE}/sitemap.xml`)).text();
  const produto = xml.match(/<loc>([^<]*\/produto\/[^<]+)<\/loc>/)?.[1];
  expect(produto, "o sitemap deveria listar produtos").toBeTruthy();
  const html = await (await request.get(produto!)).text();
  const foto = html.match(/https?:\/\/[^"'\s]+\/media\/[a-z0-9]+\.webp/)?.[0];
  expect(foto, "a página do produto deveria ter foto servida do banco").toBeTruthy();
  return foto!;
}

test.describe("Mídia do catálogo @smoke", () => {
  test.describe.configure({ timeout: siteLocal ? 180_000 : 60_000 });
  test.use({ navigationTimeout: siteLocal ? 90_000 : 20_000 });

  test("foto do banco responde como WebP com cache longo", async ({ request }) => {
    const res = await request.get(await umaFotoDoBanco(request));

    expect(res.status()).toBe(200);
    expect(res.headers()["content-type"]).toBe("image/webp");
    expect(res.headers()["cache-control"]).toContain("immutable");
  });

  test("miniatura (?w=160) é bem menor que a foto", async ({ request }) => {
    const foto = await umaFotoDoBanco(request);
    const cheia = (await (await request.get(foto)).body()).length;
    const mini = (await (await request.get(`${foto}?w=160`)).body()).length;

    expect(mini).toBeLessThan(cheia);
  });

  test("arquivo inexistente devolve 404", async ({ request }) => {
    const res = await request.get(`${PAINEL}/media/naoexiste0000000000000000.webp`);
    expect(res.status()).toBe(404);
  });

  test("site não carrega nenhuma imagem de link externo", async ({ page }) => {
    // Regressão: até 2026-10 o catálogo, o menu e os banners vinham do imgur.
    const externas: string[] = [];
    page.on("request", (req) => {
      if (req.resourceType() === "image" && /imgur\.com/.test(req.url())) externas.push(req.url());
    });

    await page.goto(`${SITE}/`, { waitUntil: "domcontentloaded" });
    await page.mouse.wheel(0, 4000);
    await page.waitForTimeout(1500);

    expect(externas).toEqual([]);
  });
});
