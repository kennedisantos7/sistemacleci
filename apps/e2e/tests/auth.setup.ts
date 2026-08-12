import { test as setup, expect } from "./support/test";
import { PAPEIS, CONTAS, arquivoDeSessao, senhaDeTeste } from "./support/roles";

/**
 * Loga UMA vez por papel e grava a sessão em playwright/.auth/<papel>.json.
 * Os specs reusam o arquivo via `test.use({ storageState })` — muito mais
 * rápido e menos frágil do que refazer o login em cada teste.
 *
 * Roda como projeto `setup`, do qual o projeto `chromium` depende.
 */
for (const papel of PAPEIS) {
  const conta = CONTAS[papel];

  setup(`autentica ${papel}`, async ({ page }) => {
    await page.goto("/login");

    await page.getByLabel("E-mail").fill(conta.email);
    await page.getByLabel("Senha").fill(senhaDeTeste());
    // `exact`: "Entrar com Google" também casa com "Entrar" (o name do
    // getByRole compara por substring) e dá strict mode violation sem isso.
    await page.getByRole("button", { name: "Entrar", exact: true }).click();

    // Prova de que logou: o sistema leva cada papel para a própria home
    // (ROLE_HOME). Se a credencial falhar, continuamos em /login e isto quebra
    // aqui, e não espalhado por toda a suíte.
    // Timeout generoso só aqui: o login faz bcrypt de 12 rounds e, no ambiente
    // de teste, o banco responde por túnel SSH. Passa bem dos 5s padrão.
    await expect(page).toHaveURL(new RegExp(`${conta.home}$`), { timeout: 30_000 });

    await page.context().storageState({ path: arquivoDeSessao(papel) });
  });
}
