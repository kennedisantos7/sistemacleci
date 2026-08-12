import { defineConfig, devices } from "@playwright/test";
import "dotenv/config";

/**
 * Alvo dos testes: o painel do Sistema Cleci.
 *
 * Padrão é o ambiente LOCAL (`pnpm dev` sobe o sistema na 3001). Para apontar
 * para outro ambiente, defina BASE_URL:
 *
 *   BASE_URL=https://painel.cleci.com.br pnpm test:smoke
 *
 * ⚠️ Contra produção, rode SÓ a fatia @smoke (leitura pura). O sistema não
 * apaga orçamento enviado/aceito, venda, nem devolve numeração de documento —
 * a suíte @escrita sujaria o banco real da empresa.
 */
const BASE_URL = process.env.BASE_URL ?? "http://localhost:3001";

/** Só sobe o app local quando o alvo é a própria máquina. */
const isLocal = BASE_URL.includes("localhost") || BASE_URL.includes("127.0.0.1");

/**
 * Há contas de teste disponíveis? Sem TEST_PASSWORD não dá para logar, então o
 * projeto `setup` sai do caminho e sobra só a fatia @smoke (deslogada).
 */
const comContas = Boolean(process.env.TEST_PASSWORD);

export default defineConfig({
  testDir: "./tests",
  // Timeout curto vai nos limites abaixo, não no `timeout` global do teste:
  // o global cobre navegação + todas as asserções somadas e derruba teste bom.
  // O timeout do teste inteiro. O padrão do Playwright (30s) não cobre um teste
  // que encadeia quatro server actions (criar → enviar → aceitar → finalizar)
  // com o banco atrás do túnel: passavam em série e falhavam com 4 workers.
  // Continua sendo um teto, não um limite curto — os limites curtos são os de
  // baixo, por ação e por asserção.
  timeout: isLocal ? 120_000 : 30_000,
  // 5s contra um ambiente buildado; no local o banco responde por túnel SSH e
  // o Next serve em dev, então a folga evita reprovar teste bom. Quem espera
  // server action usa ESPERA_SERVIDOR (support/fixtures.ts).
  expect: { timeout: isLocal ? 10_000 : 5_000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  // 2 no local, não o padrão (nº de núcleos): o banco de teste é alcançado por
  // um único túnel SSH e, com 4 workers, ele chegou a derrubar a conexão no
  // meio da execução ("Can't reach database server at localhost:5433").
  workers: process.env.CI ? 1 : 2,
  reporter: process.env.CI ? [["html"], ["list"]] : "html",

  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    // Mesmo critério do navigationTimeout: em dev o Next ainda está hidratando
    // a página quando o clique chega, e 5s reprovava teste bom por "element is
    // not stable". Contra ambiente buildado, 5s continua valendo.
    actionTimeout: isLocal ? 15_000 : 5_000,
    // Contra um ambiente já buildado, 5s é de sobra. Em dev local o Next
    // compila a rota na PRIMEIRA visita (a de /login chega a passar de 20s), e
    // 5s aqui reprovava teste bom logo no page.goto.
    navigationTimeout: isLocal ? 30_000 : 5_000,
    locale: "pt-BR",
    timezoneId: "America/Araguaina",
  },

  projects: comContas
    ? [
        // Loga uma vez por papel e grava playwright/.auth/<papel>.json.
        { name: "setup", testMatch: /.*\.setup\.ts/ },
        {
          name: "chromium",
          use: { ...devices["Desktop Chrome"] },
          dependencies: ["setup"],
        },
      ]
    : // Sem contas de teste só dá para rodar a fatia @smoke (deslogada) —
      // é o caso de apontar para produção. Pular o setup evita falhar em bloco
      // por um login que nem deveria acontecer ali.
      [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],

  // Sobe o sistema sozinho no ambiente local. Contra um ambiente remoto não há
  // servidor para subir.
  webServer: isLocal
    ? {
        command: "pnpm --filter @cleci/sistema dev",
        url: `${BASE_URL}/login`,
        cwd: "../..",
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      }
    : undefined,
});
