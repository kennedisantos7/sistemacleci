import type { Browser } from "@playwright/test";
import { test, expect } from "./support/test";
import { CONTAS, arquivoDeSessao, type Papel } from "./support/roles";
import { ESPERA_SERVIDOR, criarDocumento, menuLateral } from "./support/fixtures";

/**
 * Suíte B — controle de acesso por papel.
 *
 * A matriz abaixo foi levantada navegando com cada sessão real, não deduzida do
 * código. Rota barrada não devolve 403: o middleware redireciona para a home do
 * papel (ver o callback `authorized` em auth.config.ts).
 *
 * Uma descoberta da exploração: a rota de comissões é só do DESENVOLVEDOR.
 * O admin também é barrado ali — as taxas do programa são fixas para ele.
 */

/** Rotas testadas em todos os papéis. */
const ROTAS = [
  "/admin",
  "/admin/usuarios",
  "/admin/comissoes",
  "/admin/saques",
  "/admin/vendedores",
  "/admin/produtos",
  "/orcamentos",
  "/pedidos",
  "/clientes",
  "/vendedor",
  "/afiliado/saques",
] as const;

type Rota = (typeof ROTAS)[number];

/** Para cada papel, as rotas que ele PODE abrir. O resto cai na home dele. */
const PERMITIDAS: Record<Papel, Rota[]> = {
  admin: [
    "/admin", "/admin/usuarios", "/admin/saques", "/admin/vendedores",
    "/admin/produtos", "/orcamentos", "/pedidos", "/clientes",
  ],
  dev: ROTAS.filter((r) => r !== "/vendedor") as Rota[],
  gerente: ["/admin", "/admin/usuarios", "/admin/vendedores", "/orcamentos", "/pedidos", "/clientes"],
  vendedor: ["/orcamentos", "/pedidos", "/clientes", "/vendedor"],
  vendedor2: ["/orcamentos", "/pedidos", "/clientes", "/vendedor"],
  afiliado: ["/afiliado/saques"],
};

/** Itens do menu lateral de cada papel, na ordem em que aparecem. */
const MENU: Record<Papel, string[]> = {
  admin: [
    "/admin", "/admin/usuarios", "/admin/produtos", "/orcamentos", "/pedidos",
    "/clientes", "/admin/vendas", "/admin/vendedores", "/admin/metas", "/admin/saques",
  ],
  dev: [
    "/admin", "/admin/usuarios", "/admin/produtos", "/orcamentos", "/pedidos",
    "/clientes", "/admin/vendas", "/admin/vendedores", "/admin/metas", "/admin/saques",
    "/admin/comissoes", "/afiliado/saques",
  ],
  // Produtos saiu do menu do gerente: o cadastro carrega preço.
  gerente: [
    "/admin", "/admin/usuarios", "/orcamentos", "/pedidos",
    "/clientes", "/admin/vendas", "/admin/vendedores", "/admin/metas",
  ],
  vendedor: ["/vendedor", "/orcamentos", "/pedidos", "/clientes", "/vendedor/links"],
  vendedor2: ["/vendedor", "/orcamentos", "/pedidos", "/clientes", "/vendedor/links"],
  afiliado: ["/afiliado", "/afiliado/links", "/afiliado/saques"],
};

for (const papel of Object.keys(MENU) as Papel[]) {
  test.describe(`Acesso do papel ${papel} @rbac @escrita`, () => {
    test.use({ storageState: arquivoDeSessao(papel) });

    test(`menu lateral mostra só o que o ${papel} usa`, async ({ page }) => {
      await page.goto(CONTAS[papel].home);

      // O menu existe duas vezes no DOM (barra do desktop + gaveta do celular);
      // `menuLateral` recorta o visível para não dar strict mode violation.
      const hrefs = await menuLateral(page)
        .locator("nav a")
        .evaluateAll((links) => links.map((l) => l.getAttribute("href")));

      expect(hrefs).toEqual(MENU[papel]);
    });

    for (const rota of ROTAS) {
      const permitida = PERMITIDAS[papel].includes(rota);
      const titulo = permitida
        ? `abre ${rota}`
        : `é barrado em ${rota} e volta para ${CONTAS[papel].home}`;

      test(titulo, async ({ page }) => {
        await page.goto(rota);

        if (permitida) {
          await expect(page).toHaveURL(new RegExp(`${rota}$`), { timeout: ESPERA_SERVIDOR });
        } else {
          await expect(page).toHaveURL(new RegExp(`${CONTAS[papel].home}$`), {
            timeout: ESPERA_SERVIDOR,
          });
        }
      });
    }
  });
}

/**
 * Escopo de dados: os dois vendedores enxergam mundos separados. Este é o teste
 * que o par teste-vendedor/teste-vendedor2 existe para permitir.
 */
test.describe("Escopo entre vendedores @rbac @escrita", () => {
  async function paginaDe(browser: Browser, papel: Papel) {
    const contexto = await browser.newContext({ storageState: arquivoDeSessao(papel) });
    return { contexto, page: await contexto.newPage() };
  }

  test("vendedor não abre o orçamento de outro vendedor", async ({ browser }) => {
    const a = await paginaDe(browser, "vendedor");
    const { url } = await criarDocumento(a.page, { titulo: `Escopo ${Date.now()}` });
    await a.contexto.close();

    const b = await paginaDe(browser, "vendedor2");
    await b.page.goto(url);
    // Documento de outro vendedor não existe para este: 404 do Next.
    await expect(b.page.getByText(/404|não encontrad|not found/i).first()).toBeVisible({
      timeout: ESPERA_SERVIDOR,
    });
    await b.contexto.close();
  });

  test("a lista do vendedor fala em 'suas propostas'; a do admin, na equipe", async ({ browser }) => {
    const v = await paginaDe(browser, "vendedor");
    await v.page.goto("/orcamentos");
    await expect(v.page.getByText("Suas propostas", { exact: false })).toBeVisible({
      timeout: ESPERA_SERVIDOR,
    });
    await v.contexto.close();

    const a = await paginaDe(browser, "admin");
    await a.page.goto("/orcamentos");
    await expect(a.page.getByText("Propostas de toda a equipe", { exact: false })).toBeVisible({
      timeout: ESPERA_SERVIDOR,
    });
    await a.contexto.close();
  });
});
