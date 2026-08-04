# Regras de segurança — Sistema Cleci

Estas seis regras são **obrigatórias**. Não são recomendação: a maioria é
verificada automaticamente por `pnpm security:check`, que roda no CI e quebra o
build quando violada.

Toda exceção precisa estar declarada explicitamente numa allowlist em
[`scripts/security-check.mjs`](scripts/security-check.mjs), com o motivo escrito.
Exceção sem justificativa é violação.

---

## 1. Nunca acessar o banco direto do frontend

Nenhum arquivo marcado com `"use client"` pode importar `@cleci/db`, `@prisma/client`
ou qualquer módulo de `@/server/*`.

O acesso ao banco acontece **só** em Server Components, Server Actions e Route
Handlers. O caminho do dado até a tela é sempre:

```
Client Component → Server Action / Route Handler → service (@/server/services) → Prisma
```

**Por quê:** o bundle do cliente é público. Qualquer import que chegue nele vira
código legível por qualquer visitante — junto com a string de conexão que ele
carregar. Além disso, consulta feita no cliente é consulta sem dono: não passa
por verificação de papel.

**Como fazer certo:** o client component importa a Server Action (`./actions`) e
chama como função. A action valida sessão, valida entrada e chama o service.

---

## 2. Toda rota exige autorização customizada

Cada `route.ts` precisa de um destes guards, escolhido conforme quem chama:

| Guard | Quando usar |
|---|---|
| `requireUser([...papéis])` | rota usada por gente logada no painel |
| `safeEqual` + header secreto | máquina-a-máquina (ingestão de vendas, bootstrap) |
| validação de assinatura | webhook de gateway (Mercado Pago) |

Cada Server Action (`"use server"`) começa com `requireUser([...])`. Sem exceção
silenciosa: se a action é pública (login, cadastro), o arquivo tem que constar na
allowlist do verificador.

**Por quê:** o middleware protege rotas de página por prefixo, mas **não** protege
Server Actions nem Route Handlers — eles são endpoints HTTP que qualquer um pode
chamar direto, com `curl`, sem passar pela tela. Autorização só na UI é enfeite.

**Defesa em profundidade:** o guard na action é a segunda camada. A primeira é o
`ROUTE_ROLES` em [`lib/rbac.ts`](apps/sistema/src/lib/rbac.ts). As duas existem
porque uma delas vai falhar algum dia.

---

## 3. Toda entrada do usuário é validada por schema

Todo dado que vem de fora — `FormData`, corpo de requisição, query string,
parâmetro de rota, payload de webhook — passa por um schema Zod antes de ser
usado.

**Nunca confie no cliente para valores calculados.** O servidor recalcula:

- totais de orçamento são recalculados em `buildBudgetData`, mesmo o formulário
  já mandando o total pronto
- o código do produto no item vem da tabela de preços pelo `id`, não do que o
  formulário enviou
- comissão usa a taxa do `CommissionConfig`, nunca uma taxa vinda da requisição

**Por quê:** o formulário é território do atacante. Ele controla cada byte que
sai do navegador — inclusive campos ocultos e valores "read-only" na tela.

---

## 4. Sem secrets no cliente

Só variáveis `NEXT_PUBLIC_*` chegam ao navegador, e **nenhuma delas** pode conter
segredo. Nomes com `SECRET`, `TOKEN`, `PASSWORD`, `API_KEY` ou `CREDENTIAL` são
proibidos com esse prefixo.

Toda variável de ambiente é lida através de [`env.ts`](apps/sistema/src/env.ts),
que valida com Zod no boot — falha cedo e alto em vez de dar `undefined` no meio
de uma requisição.

**Por quê:** `NEXT_PUBLIC_` é literalmente substituído no bundle em build time.
Colocar um segredo ali é publicá-lo.

---

## 5. Sem concatenar SQL

`$queryRawUnsafe` e `$executeRawUnsafe` são proibidos.

O acesso normal é pelo client tipado do Prisma. Quando SQL cru for inevitável, use
**template tag** — `` prisma.$queryRaw`SELECT ... WHERE id = ${id}` `` — que
parametriza de verdade. Interpolar string dentro do template não vale.

**Por quê:** SQL montado com concatenação é injeção esperando acontecer. As
variantes `Unsafe` existem justamente porque não parametrizam nada.

---

## 6. Sem permissões amplas por padrão

O padrão é **negar**. Permissão é concedida de forma explícita e estreita:

- `requireUser()` sem lista de papéis é proibido em código do painel — sempre
  declare quais papéis podem
- prefira o grupo mais restrito de [`rbac.ts`](apps/sistema/src/lib/rbac.ts):
  `FULL_ACCESS_ROLES` < `STAFF_ROLES` < `BUDGET_ROLES`
- consulta sempre escopada por dono: vendedor enxerga só os próprios orçamentos
  e clientes, filtrado **no service** (`scopeWhere`), não na tela
- papel novo entra sem acesso a nada até ser adicionado a um grupo

**Por quê:** permissão ampla "temporária" nunca é temporária, e o erro só aparece
quando alguém abusa dela. Além disso, filtrar por dono na query evita o clássico
IDOR — trocar o id na URL e ler o dado de outro vendedor.

---

## Rodando as verificações

```bash
pnpm security:check   # as 6 regras acima
pnpm typecheck        # tipos
pnpm test             # testes
```

O CI ([`.github/workflows/ci.yml`](.github/workflows/ci.yml)) roda os três a cada
push e pull request na `main`. Falhou, não entra na `main` — e como o deploy do
Coolify observa a `main`, não vai para produção.

Para conferir que o verificador ainda morde, crie um arquivo com `"use client"`
importando `@cleci/db` e rode `pnpm security:check`: tem que sair com erro.

## O que este verificador NÃO cobre

Ele é análise estática de texto — pega o padrão errado, não a lógica errada.
Continuam sendo responsabilidade de quem revisa:

- se o papel exigido numa action é o **correto** (ele só checa que existe algum)
- se o `scopeWhere` foi aplicado na consulta certa
- rate limiting, CSRF, e a lógica de negócio em si
- segredo commitado por engano (use `git diff` antes do commit)
