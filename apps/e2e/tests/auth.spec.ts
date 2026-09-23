import { test, expect } from "./support/test";
import { PAPEIS, CONTAS, CONTAS_BLOQUEADAS, arquivoDeSessao, senhaDeTeste } from "./support/roles";
import { ESPERA_SERVIDOR, menuLateral } from "./support/fixtures";

/**
 * Suíte A — autenticação e sessão.
 *
 * Seletores conferidos no DOM real de /login. O `exact: true` no botão não é
 * capricho: "Entrar com Google" também casa com "Entrar" (o `name` do
 * getByRole compara por substring) e sem ele dá strict mode violation.
 */
const botaoEntrar = { name: "Entrar", exact: true } as const;

// ---------------------------------------------------------------- deslogado
test.describe("Login — tela e validação @smoke", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
  });

  test("mostra os campos de acesso", async ({ page }) => {
    await expect(page).toHaveTitle(/Sistema Cleci/);
    await expect(page.getByLabel("E-mail")).toBeVisible();
    await expect(page.getByLabel("Senha")).toBeVisible();
    await expect(page.getByRole("button", botaoEntrar)).toBeVisible();
  });

  test("e-mail e senha são obrigatórios", async ({ page }) => {
    await page.getByRole("button", botaoEntrar).click();

    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByLabel("E-mail")).toHaveJSProperty("validity.valueMissing", true);
  });

  test("credencial inválida mostra erro e mantém na tela de login", async ({ page }) => {
    // E-mail único por execução: o login tem rate limit de 5 tentativas por
    // minuto por IP+e-mail, e não queremos travar uma conta de verdade.
    await page.getByLabel("E-mail").fill(`nao-existe-${Date.now()}@cleci.com.br`);
    await page.getByLabel("Senha").fill("senha-errada-de-proposito");
    await page.getByRole("button", botaoEntrar).click();

    await expect(page.getByText(/E-mail ou senha inválidos/i)).toBeVisible({
      timeout: ESPERA_SERVIDOR,
    });
    await expect(page).toHaveURL(/\/login/);
  });

  test("rota protegida sem sessão volta para o login guardando o destino", async ({ page }) => {
    await page.goto("/orcamentos");

    await expect(page).toHaveURL(/\/login\?callbackUrl=.*orcamentos/);
    await expect(page.getByRole("button", botaoEntrar)).toBeVisible();
  });
});

// ------------------------------------------------- login real, por papel
test.describe("Login por papel @escrita", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  for (const papel of PAPEIS) {
    const conta = CONTAS[papel];

    test(`${papel} entra e cai na home do papel (${conta.home})`, async ({ page }) => {
      await page.goto("/login");
      await page.getByLabel("E-mail").fill(conta.email);
      await page.getByLabel("Senha").fill(senhaDeTeste());
      await page.getByRole("button", botaoEntrar).click();

      // bcrypt de 12 rounds + banco por túnel: bem mais que os 5s padrão.
      await expect(page).toHaveURL(new RegExp(`${conta.home}$`), { timeout: ESPERA_SERVIDOR });
      await expect(menuLateral(page)).toBeVisible();
    });
  }

  test("conta aguardando aprovação do admin não entra @escrita", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("E-mail").fill(CONTAS_BLOQUEADAS.pendente);
    await page.getByLabel("Senha").fill(senhaDeTeste());
    await page.getByRole("button", botaoEntrar).click();

    await expect(page.getByText(/E-mail ou senha inválidos/i)).toBeVisible({
      timeout: ESPERA_SERVIDOR,
    });
    await expect(page).toHaveURL(/\/login/);
  });

  test("conta bloqueada não entra @escrita", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("E-mail").fill(CONTAS_BLOQUEADAS.bloqueado);
    await page.getByLabel("Senha").fill(senhaDeTeste());
    await page.getByRole("button", botaoEntrar).click();

    await expect(page.getByText(/E-mail ou senha inválidos/i)).toBeVisible({
      timeout: ESPERA_SERVIDOR,
    });
    await expect(page).toHaveURL(/\/login/);
  });
});

// ------------------------------------------------------------ já logado
test.describe("Sessão ativa @escrita", () => {
  test.use({ storageState: arquivoDeSessao("admin") });

  test("quem já está logado não vê a tela de login", async ({ page }) => {
    await page.goto("/login");
    await expect(page).toHaveURL(/\/admin$/, { timeout: ESPERA_SERVIDOR });
  });

  test("sair encerra a sessão e a rota protegida volta a pedir login", async ({ page }) => {
    await page.goto("/admin");
    await menuLateral(page).getByRole("button", { name: "Sair" }).click();

    await expect(page).toHaveURL(/\/login/, { timeout: ESPERA_SERVIDOR });

    await page.goto("/orcamentos");
    await expect(page).toHaveURL(/\/login/);
  });
});
