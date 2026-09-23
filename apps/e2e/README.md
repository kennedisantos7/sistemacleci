# @cleci/e2e — testes end-to-end (Playwright)

Suíte E2E do **painel** (`apps/sistema`). O plano completo de testes está em
[PLANO-TESTES-E2E.md](../../PLANO-TESTES-E2E.md), na raiz do monorepo.

## Rodar

O banco de teste é o **`cleci_e2e`**, um banco separado dentro do Postgres que
já roda na VPS. Não há porta pública: o acesso é por túnel SSH. Deixe o túnel
aberto num terminal enquanto roda a suíte:

```bash
ssh -N -L 5433:172.16.1.7:5432 root@179.198.98.168
```

Em outro terminal:

```bash
cp apps/e2e/.env.example apps/e2e/.env   # preencha TEST_PASSWORD e o DATABASE_URL
pnpm db:seed:e2e                         # contas de teste (idempotente)
pnpm test:e2e                            # o config sobe o sistema na 3001 sozinho
```

Só a fatia segura, contra produção (leitura pura, dispensa banco e túnel):

```bash
BASE_URL=https://painel.cleci.com.br pnpm test:e2e:smoke
```

> Se preferir banco local em vez do túnel, `docker compose up -d` +
> `pnpm db:migrate` + `pnpm db:seed` também servem — basta apontar a
> `DATABASE_URL` do `apps/e2e/.env` para `localhost:5432/cleci`.

Outros comandos, de dentro de `apps/e2e/`:

| Comando | O que faz |
| --- | --- |
| `pnpm test:headed` | roda vendo o browser |
| `pnpm test:ui` | modo interativo do Playwright |
| `pnpm test -- --debug` | inspector passo a passo |
| `pnpm report` | abre o último relatório HTML |

## ⚠️ Produção é só leitura

Rode contra `painel.cleci.com.br` **apenas** os testes marcados `@smoke`. O sistema
não apaga orçamento enviado/aceito, venda, nem devolve numeração de documento —
a fatia `@escrita` sujaria o banco real da empresa de forma irreversível.

## Contas de teste

`pnpm db:seed:e2e` cria uma conta por papel (o RBAC é o núcleo do painel, e uma
conta só não cobre). Todas com a senha de `TEST_PASSWORD`:

| Conta | Papel | |
| --- | --- | --- |
| `teste-admin@cleci.com.br` | ADMIN | painel admin completo |
| `teste-dev@cleci.com.br` | DESENVOLVEDOR | + comissões e saque próprio |
| `teste-gerente@cleci.com.br` | GERENTE | negativo: comissões/saques barram |
| `teste-vendedor@cleci.com.br` | VENDEDOR_FIXO | escopo "só os meus" |
| `teste-vendedor2@cleci.com.br` | VENDEDOR_FIXO | par, prova o isolamento entre vendedores |
| `teste-afiliado@cleci.com.br` | AFILIADO | links e saques; ref fixo `TESTE001` |
| `teste-pendente@cleci.com.br` | AFILIADO | **não loga** — aguardando aprovação do admin |
| `teste-bloqueado@cleci.com.br` | VENDEDOR_FIXO | **não loga** — conta bloqueada |

O seed tem trava: recusa rodar se a `DATABASE_URL` não parecer local (são contas
com senha conhecida — em produção seria uma porta aberta).

### Usar uma sessão num spec

`tests/auth.setup.ts` loga uma vez por papel e grava
`playwright/.auth/<papel>.json`. No spec, escolha o papel com `test.use`:

```ts
import { test, expect } from "@playwright/test";
import { arquivoDeSessao } from "./support/roles";

test.use({ storageState: arquivoDeSessao("vendedor") });

test("vendedor vê só os próprios orçamentos @rbac", async ({ page }) => {
  await page.goto("/orcamentos");
  await expect(page.getByText("Suas propostas")).toBeVisible();
});
```

Sem `test.use`, o teste roda **deslogado** — é o que a suíte de login usa.

## Convenções

- `@smoke` — leitura pura, seguro em qualquer ambiente.
- `@escrita` — cria dado; só no ambiente local.
- `@rbac` — testes de permissão por papel.
- Testes idempotentes: dados únicos com `Date.now()` e contagem **relativa**
  (`antes + 1`), nunca absoluta.
- Locators por `getByRole`/`getByLabel`, vindos do DOM real — nunca deduzidos do
  código-fonte.

## Estado

| Fase | Suíte | Arquivo | Testes |
| --- | --- | --- | --- |
| — | setup — login por papel | [tests/auth.setup.ts](tests/auth.setup.ts) | 6 |
| 1 | A — autenticação e sessão | [tests/auth.spec.ts](tests/auth.spec.ts) | 14 |
| 1 | B — RBAC (matriz papel × rota) | [tests/rbac.spec.ts](tests/rbac.spec.ts) | 74 |
| 1 | D — criação e cálculo do orçamento | [tests/orcamento-criar.spec.ts](tests/orcamento-criar.spec.ts) | 14 |
| 1 | E — trilha de status e conversão | [tests/orcamento-status.spec.ts](tests/orcamento-status.spec.ts) | 12 |
| 2 | C — clientes | [tests/clientes.spec.ts](tests/clientes.spec.ts) | 9 |
| 2 | G — PDF | [tests/pdf.spec.ts](tests/pdf.spec.ts) | 5 |
| 2 | I — administração de usuários | [tests/admin-usuarios.spec.ts](tests/admin-usuarios.spec.ts) | 12 |

**146 testes.** Fases 3 e 4 do
[PLANO-TESTES-E2E.md](../../PLANO-TESTES-E2E.md) ainda não foram escritas.

### Por que existe um `test` próprio

Importe `test`/`expect` de [tests/support/test.ts](tests/support/test.ts). Hoje é
um repasse puro do Playwright — o arquivo existe para registrar uma tentativa
que deu errado: trocar o `waitUntil` padrão do `page.goto` de `load` para
`domcontentloaded`. Parece inofensivo e derruba 35 testes, porque
`domcontentloaded` dispara **antes da hidratação do React** e a suíte passa a
digitar num formulário morto (total em R$ 0,00, "Adicionar item" sem efeito).

## Armadilhas já encontradas

- **`getByRole("button", { name: "Entrar" })` é ambíguo.** O `name` casa por
  substring e "Entrar com Google" também contém "Entrar" — use `exact: true`.
- **Rate limit no login:** 5 tentativas por minuto por IP+e-mail. Teste de
  credencial inválida deve usar e-mail único (`Date.now()`), para não travar uma
  conta real.
- **Rota protegida** não dá 401: redireciona para
  `/login?callbackUrl=<destino>` com status 200.
- **Botões de confirmação** (aceitar/converter/excluir) usam `window.confirm` —
  trate com `page.on("dialog", ...)` antes do clique (`confirmarAcao` no
  `support/fixtures.ts` já faz isso).
- **O menu aparece duas vezes no DOM** (barra do desktop + gaveta do celular).
  Qualquer `getByRole("link")` de item de menu estoura strict mode violation
  sem recortar o visível — use `menuLateral(page)`.
- **Cuidado com regex de URL que termina em `[^/]+$`:** `/clientes/novo` casa
  com `/clientes/<id>` e `/orcamentos/novo` casa com `/orcamentos/<id>`. Sem o
  `(?!novo)` os helpers davam por criado o que nunca foi salvo.
- **Contagem absoluta de lista é corrida.** Os testes rodam em paralelo contra
  o mesmo servidor; ancore no título único (`toHaveCount(1)`), não em
  `antes + 1`.
- **"Finalizada"** casa tanto com o selo quanto com "· finalizada em
  10/08/2026" — use `exact: true`.
- **A rota de comissões é só do DESENVOLVEDOR.** O admin também é barrado ali.
- **`browser.newContext()` herda o `storageState` do `test.use`.** Um contexto
  "anônimo" criado sem argumentos nasce logado — passe
  `{ storageState: { cookies: [], origins: [] } }` explicitamente, senão o teste
  prova o contrário do que promete.
- **"Resetar" senha também usa `window.confirm`**, além dos botões do documento.
  Sem aceitar o diálogo, o clique não submete nada e o teste passa por engano.
- **Upload de arte termina com `router.refresh()`**, que remonta o card. Espere a
  nova "Versão N" aparecer antes de clicar em "Entregar" — senão o submit se
  perde no meio da re-renderização.
- **A lista de documentos tem teto de 50** (`take: 50` em `listBudgetsForActor`).
  Qualquer asserção de contagem de lista deixa de valer depois disso.
- **A lista de usuários não é `<table>`.** Cada conta é uma `div`; recorte pela
  div que contém o e-mail *e* o `select[name=role]`.
- **O e-mail de um login recém-criado aparece duas vezes** (mensagem de sucesso
  + lista). Espere pela mensagem `Login criado para <e-mail>`.

## Fragilidade conhecida do ambiente

O banco vem por um único túnel SSH. Com 4 workers ele chegou a derrubar a
conexão no meio da execução (`Can't reach database server at localhost:5433`),
o que reprova testes bons em pontos aleatórios. Por isso `workers: 2` no local.
Se aparecer esse erro, confira se o túnel ainda está de pé e reabra.
