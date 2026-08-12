import { test, expect } from "@playwright/test";

/**
 * Ponto único de importação de `test`/`expect` para a suíte.
 *
 * Hoje é um repasse puro do Playwright — de propósito. Fica registrado o que
 * NÃO deu certo, para ninguém tentar de novo:
 *
 * Já houve aqui um override de `page.goto` para esperar `domcontentloaded` em
 * vez de `load`, motivado por alguns `goto` que estouravam o tempo em dev com
 * a tela já renderizada. O efeito colateral foi muito pior: `domcontentloaded`
 * dispara ANTES da hidratação do React, e os testes passavam a digitar num
 * formulário ainda "morto" — o total do orçamento ficava em R$ 0,00 e o botão
 * "Adicionar item" não respondia. 35 testes caíram de uma vez.
 *
 * O `load` do Playwright é o padrão certo aqui. Aqueles timeouts vinham de
 * concorrência demais sobre o túnel SSH e sumiram ao baixar para 2 workers
 * (ver `workers` em playwright.config.ts).
 */
export { test, expect };
