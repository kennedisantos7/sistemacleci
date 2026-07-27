# Deploy no Coolify

Produção roda em **VPS Hostinger KVM 2** (2 vCPU / 8 GB RAM / 100 GB NVMe,
São Paulo), Ubuntu 24.04 LTS, com **Coolify 4.1.2** autogerenciado (template
1-clique da Hostinger). A migração vinda da AWS EC2 está em
[MIGRACAO-HOSTINGER.md](MIGRACAO-HOSTINGER.md).

## Mapa da instalação

| O que | Onde |
| --- | --- |
| Painel Coolify | `https://coolify.cleci.com.br` |
| Site público | `https://cleci.com.br` + `https://www.cleci.com.br` |
| Painéis + API | `https://painel.cleci.com.br` |
| DNS | zona do `cleci.com.br` no **hPanel da Hostinger** |
| IP do servidor | `179.198.98.168` |

Os **3 recursos** ficam no mesmo projeto e ambiente do Coolify
(`Cleci` > `production`) — é isso que os coloca na mesma rede Docker e permite
que as apps alcancem o banco pelo hostname interno, sem publicar porta nenhuma.

| Recurso | UUID (= nome do container) | Porta interna |
| --- | --- | --- |
| PostgreSQL 18 | `xlv82jl2b89aeqr2te4bhvn8` | 5432 |
| `cleci-sistema` (painel) | `m85azr0juhaz2aq3mm13d4ho` | 3001 |
| `cleci-site` | `nt71sabsy3760sbkze2w9uc1` | 3000 |

> Os UUIDs são a forma confiável de identificar recursos: o Coolify gera nomes
> aleatórios (`wandering-wallaby-…`, `colorful-cottonmouth-…`) que não indicam o
> que o recurso é.

## 0. Firewall — leia antes de expor qualquer porta

⚠️ **O `ufw` NÃO protege portas publicadas por containers.** Tráfego para porta
publicada pelo Docker é tratado na cadeia `FORWARD`/`DOCKER` do iptables, que
passa longe do `INPUT` onde o `ufw` atua. Isso foi verificado neste servidor:
com as regras removidas do `ufw`, as portas continuaram abertas.

Bloqueios de serviço dockerizado vão na cadeia **`DOCKER-USER`** (reservada pelo
Docker para regras do operador, avaliada antes das dele):

```bash
iptables -I DOCKER-USER -p tcp --dport PORTA -j DROP
netfilter-persistent save          # iptables-persistent já instalado
```

Estado atual:

| Camada | Regras |
| --- | --- |
| `ufw` | permite **22, 80, 443**; nega o resto (protege serviços do host, na prática o SSH) |
| `DOCKER-USER` | `DROP` em **8080** (dashboard Traefik), **8000** (painel Coolify), **6001:6002** (websocket) |

**Valide sempre de fora, nunca pelo `ufw status`:**

```powershell
Test-NetConnection 179.198.98.168 -Port 8000   # deve dar False
```

> **Rota de fuga.** Se o DNS do `coolify.cleci.com.br` quebrar, o painel fica
> inacessível. Recupere pelo **Terminal do hPanel** (funciona sem SSH e sem DNS):
> `iptables -D DOCKER-USER -p tcp --dport 8000 -j DROP && ufw allow 8000/tcp`

## 1. Banco de dados

**PostgreSQL 18** (`postgres:18-alpine`) no Coolify. Configuração:

- **Initial Database**: `cleci` — só vale no primeiro boot. Depois disso, criar o
  database exige `CREATE DATABASE cleci;` pela aba *Terminal*.
- **Ports Mappings**: **vazio**. Preencher publica o banco para fora.
- **Make it publicly available**: **desmarcado**.

`DATABASE_URL` e `DIRECT_URL` recebem **a mesma URL interna**, na porta 5432:

```
postgresql://postgres:SENHA@xlv82jl2b89aeqr2te4bhvn8:5432/cleci
```

> **Sem PgBouncer.** O Coolify 4.1.2 não oferece pooling nativo no recurso
> PostgreSQL, e a produção nunca o usou. Com **uma réplica de cada app**, o
> Prisma abre ~5–9 conexões por app, contra o limite padrão de 100 do Postgres —
> folga larga. Pooling só passa a ser necessário ao escalar para múltiplas
> réplicas ou execução serverless; aí, subir o PgBouncer como recurso separado
> (referência no [docker-compose.yml](docker-compose.yml) local) e acrescentar
> `?pgbouncer=true` **apenas** na `DATABASE_URL`.

### Acesso ao banco de produção

Não exponha a porta. Execute por dentro do servidor, via SSH:

```bash
docker exec xlv82jl2b89aeqr2te4bhvn8 psql -U postgres -d cleci -c '\dt'
```

Para consultas com aspas (o Prisma usa identificadores case-sensitive como
`"User"`), passe o SQL por **stdin** e evite o inferno de escaping:

```powershell
'SELECT email, role FROM "User";' | ssh root@179.198.98.168 `
  'docker exec -i xlv82jl2b89aeqr2te4bhvn8 psql -U postgres -d cleci'
```

> Túnel SSH (`ssh -N -L 5433:IP_DO_CONTAINER:5432`) também funciona, mas se
> mostrou frágil na prática. Rodar por dentro do servidor é mais confiável.

## 2. API do Coolify (automação)

O painel expõe uma API REST usada para ler/alterar variáveis, domínios e
disparar deploys sem passar pela interface.

- **Base**: `https://coolify.cleci.com.br/api/v1`
- **Auth**: header `Authorization: Bearer <token>`
- **Token**: criado em **Keys & Tokens → API Tokens**; guardado **fora do
  repositório**, em `%USERPROFILE%\.coolify-token`

Endpoints usados com frequência:

```powershell
$tok  = (Get-Content "$env:USERPROFILE\.coolify-token" -Raw).Trim()
$h    = @{ Authorization = "Bearer $tok"; 'Content-Type' = 'application/json' }
$base = "https://coolify.cleci.com.br/api/v1"

# listar apps (nome, uuid, fqdn)
Invoke-RestMethod "$base/applications" -Headers $h

# ler variáveis de uma app
Invoke-RestMethod "$base/applications/<uuid>/envs" -Headers $h

# alterar/criar variável (PATCH por chave)
$b = @{ key='SITE_URL'; value='https://cleci.com.br'
        is_buildtime=$true; is_runtime=$true } | ConvertTo-Json
Invoke-RestMethod "$base/applications/<uuid>/envs" -Method Patch -Headers $h -Body $b

# alterar domínios
$b = @{ domains='https://cleci.com.br,https://www.cleci.com.br' } | ConvertTo-Json
Invoke-RestMethod "$base/applications/<uuid>" -Method Patch -Headers $h -Body $b

# restart (aplica variáveis de runtime) / deploy (rebuild)
Invoke-RestMethod "$base/applications/<uuid>/restart" -Method Post -Headers $h
Invoke-RestMethod "$base/deploy?uuid=<uuid>&force=true" -Headers $h

# acompanhar
Invoke-RestMethod "$base/deployments/<deployment_uuid>" -Headers $h
```

Dois detalhes que já custaram tempo:

- **`GET /envs` retorna produção e preview misturados.** Filtre por
  `is_preview -eq $false`; as entradas com `is_preview=true` são de *Preview
  Deployments* e não afetam produção.
- **O campo do flag de build é `is_buildtime`**, não `is_build_time`. Ler o nome
  errado devolve vazio e faz parecer que a variável não é de build.
- **Não existe** `GET /settings` — configurações da instância (o campo **URL**
  do painel) só pela interface, em *Settings → Configuration → General*.

## 3. Serviço `cleci-sistema` (painel)

- **Build**: Dockerfile `apps/sistema/Dockerfile`, contexto = raiz do repo.
- **Porta**: 3001. **Healthcheck** embutido (`/api/health` → `{"status":"ok","db":"up"}`).
- **Domínio**: `https://painel.cleci.com.br`
- **Migrations**: o entrypoint roda `prisma migrate deploy` no start
  (desative com `RUN_MIGRATIONS=0` para rodar manualmente).

Variáveis de ambiente **em produção hoje**:

```
NODE_ENV=production
DATABASE_URL=postgresql://postgres:SENHA@xlv82jl2b89aeqr2te4bhvn8:5432/cleci
DIRECT_URL=postgresql://postgres:SENHA@xlv82jl2b89aeqr2te4bhvn8:5432/cleci
AUTH_SECRET=<openssl rand -base64 32>
NEXTAUTH_URL=https://painel.cleci.com.br
SITE_URL=https://cleci.com.br
SISTEMA_URL=https://painel.cleci.com.br
INGEST_API_KEY=<chave aleatória forte>
```

> **`MP_ACCESS_TOKEN` e `MP_WEBHOOK_SECRET` NÃO estão configurados.** O checkout
> via Mercado Pago está inativo: os produtos seguem pelo fluxo de orçamento via
> WhatsApp. Para ativar, veja a seção 6.

> **`S3_*` NÃO estão configuradas.** O botão de enviar arquivo nem aparece no
> cadastro de produtos; o cadastro **por link** (imagem e vídeo) funciona
> normalmente. Veja a seção 7.

## 4. Serviço `cleci-site`

Site público em **Next.js (Node standalone)**.

- **Build**: Dockerfile `apps/site/Dockerfile`, contexto = raiz do repo.
- **Porta**: 3000. **Healthcheck** embutido (GET `/`).
- **Domínios**: `https://cleci.com.br,https://www.cleci.com.br` (os dois no mesmo
  recurso, separados por vírgula). `SITE_URL` aponta para a versão canônica, sem
  `www` — e deve ser **idêntico** ao `SITE_URL` do painel, senão os links de
  afiliado saem inconsistentes.

```
NODE_ENV=production
SITE_URL=https://cleci.com.br
SISTEMA_URL=https://painel.cleci.com.br
INGEST_API_KEY=<a MESMA chave do sistema>
NEXT_PUBLIC_SISTEMA_URL=https://painel.cleci.com.br     ← build variable
```

### ⚠️ Variáveis `NEXT_PUBLIC_*` exigem rebuild, não restart

Elas são **compiladas dentro do JavaScript** que vai para o navegador. Marcar
`is_buildtime` não basta: se a variável foi adicionada **depois** do último
build, o bundle em produção continua com o valor antigo.

Sintoma real observado: o botão "Entrar" do site apontava para
`http://localhost:3001` — o fallback de
[Header.tsx:95](apps/site/src/components/layout/Header.tsx#L95) — porque
`NEXT_PUBLIC_SISTEMA_URL` existia e estava correta, mas o container fora
construído antes dela. **Restart não resolve; só `deploy` (rebuild).**

Verificação objetiva, no HTML servido:

```powershell
(Invoke-WebRequest https://cleci.com.br -UseBasicParsing).Content -match 'localhost:3001'
# deve dar False
```

`NEXT_PUBLIC_ATTRIBUTION_COOKIE_DAYS` não precisa ser declarada: o
[Dockerfile](apps/site/Dockerfile#L17) já traz `ARG ...=30` e
[attribution.ts:11](apps/site/src/lib/attribution.ts#L11) tem o mesmo fallback,
batendo com o `cookieDurationDays=30` semeado. Se mudar em Admin › Comissões,
declare a variável **como build** e refaça o deploy.

## 5. Seeds — como rodar contra a produção

O container standalone não tem `tsx`, nem os fontes `apps/site/src/data/*.ts`,
nem o workspace do pnpm. **Rode num container Node temporário na rede do
Postgres** — dispensa túnel e a senha do banco nunca sai do servidor:

```bash
PG=xlv82jl2b89aeqr2te4bhvn8
PW=$(docker exec $PG printenv POSTGRES_PASSWORD)
URL="postgresql://postgres:$PW@127.0.0.1:5432/cleci"
docker run --rm --network container:$PG \
  -e DATABASE_URL="$URL" -e DIRECT_URL="$URL" \
  -e SEED_ADMIN_EMAIL='contato@cleci.com.br' \
  -e SEED_ADMIN_PASSWORD='<senha forte>' \
  node:20 bash -c '
    set -e
    corepack enable
    git clone --depth 1 https://github.com/kennedisantos7/sistemacleci.git /app
    cd /app
    pnpm install --frozen-lockfile --silent
    pnpm db:generate
    pnpm db:seed
    pnpm --filter @cleci/db seed:catalog
  '
```

`--network container:$PG` compartilha o namespace de rede do Postgres, então o
host é `127.0.0.1:5432`. Se escrever o script num arquivo a partir do Windows,
converta CRLF→LF (`$s -replace "\`r\`n","\`n"`) ou o bash falha com `$'\r'`.

| Script | O que faz | Idempotente |
| --- | --- | --- |
| `pnpm db:seed` | `CommissionConfig` global (10%, cookie 30d) + admin inicial | sim (upsert) |
| `pnpm --filter @cleci/db seed:catalog` | 7 categorias, 29 subtipos, 66 produtos | sim |

> O catálogo vem do **código** (`apps/site/src/data/*.ts`), não de backup. Por
> isso é sempre reconstruível. Já usuários, vendas e comissões **não são** —
> esses só existem no banco.

## 6. Ativar o Mercado Pago (hoje inativo)

1. Painel de desenvolvedores do MP → Suas integrações → aplicação → Webhooks
2. Endpoint: `https://painel.cleci.com.br/api/webhooks/mercadopago`, evento `payment`
3. Copiar a "Assinatura secreta" para `MP_WEBHOOK_SECRET`
4. Adicionar `MP_ACCESS_TOKEN` e `MP_WEBHOOK_SECRET` ao `cleci-sistema` (runtime)
   e **restart**

## 7. Ativar upload de imagens e vídeos (hoje inativo)

Bucket S3-compatível (Cloudflare R2 recomendado — egress zero). No
`cleci-sistema`, runtime: `S3_ENDPOINT`, `S3_REGION` (`auto` no R2), `S3_BUCKET`,
`S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_PUBLIC_URL`.

Enquanto essas variáveis não existirem, o formulário de produto **esconde os
botões de enviar arquivo** e trabalha só com link (imagem e vídeo). Assim que
forem configuradas e o serviço reiniciar, os botões voltam sozinhos — aceitando
imagem até 5 MB e vídeo até 30 MB (MP4, WEBM ou MOV).

> ⚠️ As URLs das imagens ficam **gravadas no banco**. Se um dia migrar de bucket,
> é preciso copiar os objetos **e** reescrever as URLs — não basta trocar as
> variáveis.

## 8. Integração site → sistema (checkout)

O botão **Comprar agora** (produtos com `priceCents`) chama a rota server-side
`POST /api/checkout` do **site**, que lê o cookie `cleci_ref` e repassa para
`POST /api/sales/ingest` do **sistema** com `x-api-key: <INGEST_API_KEY>` e
`createCheckout: true`. O sistema cria a venda (atribuída ao afiliado), gera a
Preference do Mercado Pago e devolve a `checkoutUrl`.

- A chave **nunca** vai para o bundle do navegador (fica na route do site).
- Mantenha `INGEST_API_KEY` idêntica nos dois serviços.
- Produtos sem `priceCents` seguem apenas com orçamento via WhatsApp.
- **Depende do Mercado Pago configurado** (seção 6). Sem isso, só WhatsApp.

## Checklist de produção

- [x] `DATABASE_URL`/`DIRECT_URL` na 5432 direta, banco sem porta publicada
- [x] Domínios e HTTPS: site (+`www`), painel e Coolify, todos com Let's Encrypt
- [x] `SITE_URL` idêntico nos dois serviços (`https://cleci.com.br`)
- [x] `NEXT_PUBLIC_SISTEMA_URL` como build variable **e** com rebuild aplicado
- [x] Painel Coolify em HTTPS, portas 8000/6001-6002/8080 bloqueadas em `DOCKER-USER`
- [x] Seed do admin e do catálogo executados
- [ ] **Backup automático do Postgres** (aba *Backups* do recurso) — hoje **não existe**
- [ ] Senha do admin trocada (a inicial foi exposta em canal de chat)
- [ ] Senha do Postgres rotacionada (idem)
- [ ] `AUTH_SECRET` conferido: forte e único
- [ ] Mercado Pago configurado e webhook testado (simulador → 200)
- [ ] Upload de imagens (`S3_*`) configurado
- [ ] Rate limit do ingest: para múltiplas réplicas, migrar de memória para Redis
