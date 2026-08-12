import { test, expect } from "./support/test";
import { arquivoDeSessao } from "./support/roles";
import {
  ESPERA_SERVIDOR,
  aceitarConfirmacao,
  criarCliente,
  criarDocumento,
} from "./support/fixtures";

/**
 * Suíte C — clientes.
 *
 * Rótulos conferidos na tela: o campo do nome é "Razão social / Nome *" (não
 * "Nome"), a lista se chama "Clientes e empresas" e a busca é um input `q`.
 */
test.use({ storageState: arquivoDeSessao("admin") });

test.describe("Cadastro @escrita", () => {
  test("cria cliente só com o obrigatório", async ({ page }) => {
    const nome = await criarCliente(page);

    await expect(page.getByRole("heading", { name: nome })).toBeVisible();
    await expect(page.getByRole("link", { name: "Editar ficha" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Novo orçamento" })).toBeVisible();
  });

  test("cria cliente com a ficha completa", async ({ page }) => {
    const nome = `Cliente Completo ${Date.now()}`;

    await page.goto("/clientes/novo");
    await page.getByLabel("Razão social / Nome").fill(nome);
    await page.getByLabel("Nome fantasia").fill("Loja do Centro");
    await page.getByLabel("CPF/CNPJ").fill("12345678000199");
    await page.getByLabel("Contato").fill("Carlos");
    await page.getByLabel("E-mail").fill("contato@exemplo.com.br");
    await page.getByLabel("Telefone").fill("6333334444");
    await page.getByLabel("WhatsApp").fill("63999998888");
    await page.getByLabel("Endereço").fill("Av. Central, 100");
    await page.getByLabel("Cidade").fill("Gurupi");
    await page.getByLabel("Estado").fill("TO");
    await page.getByLabel("CEP").fill("77400000");
    await page.getByRole("button", { name: "Cadastrar cliente" }).click();

    await expect(page).toHaveURL(/\/clientes\/(?!novo)[^/]+$/, { timeout: ESPERA_SERVIDOR });
    await expect(page.getByText("Loja do Centro").first()).toBeVisible();
    await expect(page.getByText("Carlos").first()).toBeVisible();
    await expect(page.getByText("Gurupi").first()).toBeVisible();
  });

  test("sem o nome o cadastro não é enviado", async ({ page }) => {
    await page.goto("/clientes/novo");
    await page.getByRole("button", { name: "Cadastrar cliente" }).click();

    await expect(page).toHaveURL(/\/clientes\/novo$/);
    await expect(page.getByLabel("Razão social / Nome")).toHaveJSProperty(
      "validity.valueMissing",
      true,
    );
  });
});

test.describe("Edição e busca @escrita", () => {
  test("editar a ficha reflete no detalhe", async ({ page }) => {
    await criarCliente(page);
    const fantasia = `Fantasia ${Date.now()}`;

    await page.getByRole("link", { name: "Editar ficha" }).click();
    await expect(page.getByRole("heading", { name: "Editar cliente" })).toBeVisible({
      timeout: ESPERA_SERVIDOR,
    });

    await page.getByLabel("Nome fantasia").fill(fantasia);
    await page.getByRole("button", { name: "Salvar alterações" }).click();

    await expect(page).toHaveURL(/\/clientes\/(?!novo)[^/]+$/, { timeout: ESPERA_SERVIDOR });
    await expect(page.getByText(fantasia).first()).toBeVisible();
  });

  test("a busca encontra o cliente pelo nome", async ({ page }) => {
    const nome = await criarCliente(page);

    await page.goto("/clientes");
    await expect(page.getByRole("heading", { name: "Clientes e empresas" })).toBeVisible();

    await page.getByPlaceholder("Buscar por nome, empresa ou CPF/CNPJ").fill(nome);
    await page.keyboard.press("Enter");

    await expect(page.getByText(nome)).toHaveCount(1, { timeout: ESPERA_SERVIDOR });
  });

  test("a busca por texto inexistente não traz nada", async ({ page }) => {
    await page.goto("/clientes");

    await page.getByPlaceholder("Buscar por nome, empresa ou CPF/CNPJ").fill(`zzz${Date.now()}`);
    await page.keyboard.press("Enter");

    // Asserção no estado vazio, e não em "zero links": a tela tem links para
    // /clientes/... que não são resultado de busca.
    await expect(page.getByText("Nenhuma empresa encontrada")).toBeVisible({
      timeout: ESPERA_SERVIDOR,
    });
  });
});

test.describe("Atividades @escrita", () => {
  test("registrar atividade entra no histórico", async ({ page }) => {
    await criarCliente(page);
    const nota = `Liguei para o cliente ${Date.now()}`;

    await page.getByLabel("Tipo").selectOption({ label: "Ligação" });
    await page.locator("textarea[name='note']").fill(nota);
    await page.getByRole("button", { name: "Registrar atividade" }).click();

    await expect(page.getByText(nota)).toBeVisible({ timeout: ESPERA_SERVIDOR });
  });
});

test.describe("Exclusão @escrita", () => {
  test("cliente sem documento pode ser excluído", async ({ page }) => {
    const nome = await criarCliente(page);

    await page.getByRole("link", { name: "Editar ficha" }).click();
    await expect(page.getByRole("button", { name: "Excluir cliente" })).toBeVisible({
      timeout: ESPERA_SERVIDOR,
    });

    aceitarConfirmacao(page);
    await page.getByRole("button", { name: "Excluir cliente" }).click();

    await expect(page).toHaveURL(/\/clientes$/, { timeout: ESPERA_SERVIDOR });
    await expect(page.getByText(nome)).toHaveCount(0);
  });

  test("cliente com orçamento vinculado não é excluído", async ({ page }) => {
    const { cliente } = await criarDocumento(page);

    await page.goto("/clientes");
    await page.getByPlaceholder("Buscar por nome, empresa ou CPF/CNPJ").fill(cliente);
    await page.keyboard.press("Enter");
    await page.getByText(cliente).click();

    await expect(page).toHaveURL(/\/clientes\/(?!novo)[^/]+$/, { timeout: ESPERA_SERVIDOR });
    await page.getByRole("link", { name: "Editar ficha" }).click();

    // A tela avisa ANTES de tentar: a "Zona de risco" já explica o bloqueio.
    await expect(
      page.getByText("Clientes com orçamentos registrados não podem ser excluídos."),
    ).toBeVisible({ timeout: ESPERA_SERVIDOR });

    aceitarConfirmacao(page);
    await page.getByRole("button", { name: "Excluir cliente" }).click();

    // E de fato não exclui: continua na ficha e o cliente segue existindo.
    await expect(page).toHaveURL(/\/editar$/);
    await page.goto("/clientes");
    await page.getByPlaceholder("Buscar por nome, empresa ou CPF/CNPJ").fill(cliente);
    await page.keyboard.press("Enter");
    await expect(page.getByText(cliente)).toHaveCount(1, { timeout: ESPERA_SERVIDOR });
  });
});
