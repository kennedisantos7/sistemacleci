import type { Page } from "@playwright/test";
import { test, expect } from "./support/test";
import { arquivoDeSessao, senhaDeTeste } from "./support/roles";
import { ESPERA_SERVIDOR, aceitarConfirmacao } from "./support/fixtures";

/**
 * Suíte I — administração de usuários.
 *
 * REGRA: todo teste aqui opera SOMENTE em contas que ele mesmo criou. Bloquear
 * ou apagar uma conta do seed (teste-vendedor@, teste-afiliado@…) derrubaria as
 * outras suítes, que dependem delas para logar.
 */

/** Cria um login pelo painel e devolve o e-mail usado. */
async function criarLogin(
  page: Page,
  papel: "Vendedor" | "Afiliado",
  senha = "senha-provisoria-123",
): Promise<string> {
  const email = `descartavel-${Date.now()}-${Math.floor(Math.random() * 1000)}@cleci.com.br`;

  await page.goto("/admin/usuarios");
  await page.getByLabel("Nome").fill("Conta Descartável E2E");
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha provisória").fill(senha);
  await page.getByLabel("Papel").selectOption({ label: papel });
  await page.getByRole("button", { name: "Criar login" }).click();

  // Espera a confirmação, não `getByText(email)`: o e-mail aparece na mensagem
  // de sucesso E na lista, e os dois juntos estouram o strict mode.
  await expect(page.getByText(`Login criado para ${email}`)).toBeVisible({
    timeout: ESPERA_SERVIDOR,
  });
  return email;
}

/**
 * A "linha" de um usuário. Não é `<tr>`: a lista é feita de divs. Pegamos a
 * div mais interna que contém o e-mail E o select de papel — assim as ações
 * (Bloquear, Resetar, Excluir) ficam garantidamente restritas àquela conta.
 */
function linhaDe(page: Page, email: string) {
  return page
    .locator("div")
    .filter({ hasText: email })
    .filter({ has: page.locator("select[name='role']") })
    .last();
}

/** Remove a conta ao final, para o painel não virar um depósito de lixo. */
async function excluirLogin(page: Page, email: string) {
  await page.goto("/admin/usuarios");
  aceitarConfirmacao(page);
  await linhaDe(page, email).getByRole("button", { name: "Excluir" }).click();
  await expect(linhaDe(page, email)).toHaveCount(0, { timeout: ESPERA_SERVIDOR });
}

test.describe("Criação de login @escrita", () => {
  test.use({ storageState: arquivoDeSessao("admin") });

  test("cria um vendedor e ele aparece na lista", async ({ page }) => {
    const email = await criarLogin(page, "Vendedor");

    await expect(linhaDe(page, email).getByText("Vendedor").first()).toBeVisible();

    await excluirLogin(page, email);
  });

  test("e-mail repetido é recusado", async ({ page }) => {
    const email = await criarLogin(page, "Afiliado");

    await page.getByLabel("Nome").fill("Duplicado");
    await page.getByLabel("E-mail").fill(email);
    await page.getByLabel("Senha provisória").fill("outra-senha-123");
    await page.getByRole("button", { name: "Criar login" }).click();

    await expect(page.getByText(/já existe|em uso|cadastrad/i).first()).toBeVisible({
      timeout: ESPERA_SERVIDOR,
    });

    await excluirLogin(page, email);
  });

  test("senha curta é recusada", async ({ page }) => {
    await page.goto("/admin/usuarios");
    await page.getByLabel("Nome").fill("Senha Curta");
    await page.getByLabel("E-mail").fill(`curta-${Date.now()}@cleci.com.br`);
    await page.getByLabel("Senha provisória").fill("1234");
    await page.getByLabel("Papel").selectOption({ label: "Afiliado" });
    await page.getByRole("button", { name: "Criar login" }).click();

    await expect(page.getByText(/8 caracteres|muito curta/i).first()).toBeVisible({
      timeout: ESPERA_SERVIDOR,
    });
  });
});

test.describe("Papéis oferecidos ao admin @rbac @escrita", () => {
  test.use({ storageState: arquivoDeSessao("admin") });

  test("o admin pode criar qualquer papel", async ({ page }) => {
    await page.goto("/admin/usuarios");

    const opcoes = await page.locator("#cu-role option").allTextContents();

    expect(opcoes).toEqual(
      expect.arrayContaining([
        "Vendedor",
        "Afiliado",
        "Gerente",
        "Desenvolvedor",
        "Admin",
      ]),
    );
  });
});

test.describe("Conta do desenvolvedor é intocável pelo admin @rbac @escrita", () => {
  test.use({ storageState: arquivoDeSessao("admin") });

  test("o admin não vê ações na linha do desenvolvedor", async ({ page }) => {
    await page.goto("/admin/usuarios");

    // Linha do dev: a div mais interna que contém o e-mail dele. Não dá para
    // usar `linhaDe`, que exige o select de papel — é justamente o que some.
    const linha = page
      .locator("div")
      .filter({ hasText: "teste-dev@cleci.com.br" })
      .last();

    await expect(linha.getByText("(conta do desenvolvedor)")).toBeVisible({
      timeout: ESPERA_SERVIDOR,
    });
    await expect(linha.getByRole("button", { name: "Excluir" })).toHaveCount(0);
    await expect(linha.getByRole("button", { name: "Bloquear" })).toHaveCount(0);
    await expect(linha.locator("select[name='role']")).toHaveCount(0);
  });
});

test.describe("Papéis oferecidos ao gerente @rbac @escrita", () => {
  test.use({ storageState: arquivoDeSessao("gerente") });

  test("o gerente só cria contas operacionais", async ({ page }) => {
    await page.goto("/admin/usuarios");

    const opcoes = await page.locator("#cu-role option").allTextContents();

    expect(opcoes).toEqual(expect.arrayContaining(["Vendedor", "Afiliado"]));
    expect(opcoes).not.toContain("Admin");
    expect(opcoes).not.toContain("Desenvolvedor");
    expect(opcoes).not.toContain("Gerente");
  });
});

test.describe("Ciclo de vida da conta @escrita", () => {
  test.use({ storageState: arquivoDeSessao("admin") });

  test("bloquear e desbloquear alterna os botões", async ({ page }) => {
    const email = await criarLogin(page, "Vendedor");

    aceitarConfirmacao(page);
    await linhaDe(page, email).getByRole("button", { name: "Bloquear" }).click();
    await expect(linhaDe(page, email).getByRole("button", { name: "Desbloquear" })).toBeVisible({
      timeout: ESPERA_SERVIDOR,
    });

    await linhaDe(page, email).getByRole("button", { name: "Desbloquear" }).click();
    await expect(linhaDe(page, email).getByRole("button", { name: "Bloquear" })).toBeVisible({
      timeout: ESPERA_SERVIDOR,
    });

    await excluirLogin(page, email);
  });

  test("trocar o papel muda o que a conta é", async ({ page }) => {
    const email = await criarLogin(page, "Afiliado");

    await linhaDe(page, email).locator("select[name='role']").selectOption("VENDEDOR_FIXO");
    await linhaDe(page, email).getByRole("button", { name: "Papel" }).click();

    await expect(linhaDe(page, email).locator("select[name='role']")).toHaveValue(
      "VENDEDOR_FIXO",
      { timeout: ESPERA_SERVIDOR },
    );

    await excluirLogin(page, email);
  });

  test("excluir tira a conta da lista", async ({ page }) => {
    const email = await criarLogin(page, "Afiliado");

    await excluirLogin(page, email);

    await expect(page.getByText(email)).toHaveCount(0);
  });
});

test.describe("Reset de senha @escrita", () => {
  test.use({ storageState: arquivoDeSessao("admin") });

  test("a conta entra com a senha nova depois do reset", async ({ page, browser }) => {
    const email = await criarLogin(page, "Vendedor");
    const senhaNova = `nova-senha-${Date.now()}`;

    await linhaDe(page, email).getByPlaceholder("nova senha").fill(senhaNova);
    // "Resetar" também passa por window.confirm — sem aceitar, o clique não
    // submete nada e o teste "passaria" testando o oposto.
    aceitarConfirmacao(page);
    await linhaDe(page, email).getByRole("button", { name: "Resetar" }).click();
    // Espera a confirmação verde do próprio formulário, não um sleep fixo.
    await expect(linhaDe(page, email).locator("p.text-green-700")).toBeVisible({
      timeout: ESPERA_SERVIDOR,
    });

    // Contexto limpo EXPLÍCITO: browser.newContext() herda o storageState do
    // test.use e nasceria logado como admin.
    const novo = await browser.newContext({ storageState: { cookies: [], origins: [] } });
    const p = await novo.newPage();
    await p.goto("/login");
    await p.getByLabel("E-mail").fill(email);
    await p.getByLabel("Senha").fill(senhaNova);
    await p.getByRole("button", { name: "Entrar", exact: true }).click();

    await expect(p).toHaveURL(/\/vendedor$/, { timeout: ESPERA_SERVIDOR });
    await novo.close();

    await excluirLogin(page, email);
  });

  test("a senha antiga deixa de valer", async ({ page, browser }) => {
    const senhaAntiga = `antiga-${Date.now()}`;
    const email = await criarLogin(page, "Vendedor", senhaAntiga);

    await linhaDe(page, email).getByPlaceholder("nova senha").fill(`trocada-${Date.now()}`);
    // "Resetar" também passa por window.confirm — sem aceitar, o clique não
    // submete nada e o teste "passaria" testando o oposto.
    aceitarConfirmacao(page);
    await linhaDe(page, email).getByRole("button", { name: "Resetar" }).click();
    // Espera a confirmação verde do próprio formulário, não um sleep fixo.
    await expect(linhaDe(page, email).locator("p.text-green-700")).toBeVisible({
      timeout: ESPERA_SERVIDOR,
    });

    const novo = await browser.newContext({ storageState: { cookies: [], origins: [] } });
    const p = await novo.newPage();
    await p.goto("/login");
    await p.getByLabel("E-mail").fill(email);
    await p.getByLabel("Senha").fill(senhaAntiga);
    await p.getByRole("button", { name: "Entrar", exact: true }).click();

    await expect(p.getByText(/E-mail ou senha inválidos/i)).toBeVisible({
      timeout: ESPERA_SERVIDOR,
    });
    await novo.close();

    await excluirLogin(page, email);
  });
});

/** Sanidade: as contas do seed continuam de pé depois de tudo acima. */
test.describe("Contas do seed intactas @escrita", () => {
  test.use({ storageState: arquivoDeSessao("admin") });

  test("as contas de teste seguem listadas e ativas", async ({ page }) => {
    await page.goto("/admin/usuarios");

    for (const email of [
      "teste-vendedor@cleci.com.br",
      "teste-afiliado@cleci.com.br",
    ]) {
      await expect(linhaDe(page, email)).toHaveCount(1);
      await expect(linhaDe(page, email).getByRole("button", { name: "Bloquear" })).toBeVisible();
    }
    void senhaDeTeste();
  });
});
