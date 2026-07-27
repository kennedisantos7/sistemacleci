# Migração AWS EC2 → Hostinger VPS

Registro da migração da plataforma Cleci da AWS EC2 para o **VPS Hostinger KVM 2**
(2 vCPU / 8 GB / 100 GB NVMe, São Paulo, Ubuntu 24.04 + Coolify 4.1.2),
executada em **27/07/2026**.

Para operar a plataforma no dia a dia, use o [DEPLOY.md](DEPLOY.md). Este
documento existe para (a) registrar o que foi decidido e por quê, e (b) servir de
base para as ondas 2–5, que ainda não aconteceram.

---

## Status: Onda 1 concluída

| Item | Resultado |
| --- | --- |
| Servidor novo | ✅ `179.198.98.168`, Coolify em `https://coolify.cleci.com.br` |
| Site | ✅ `https://cleci.com.br` + `https://www.cleci.com.br` |
| Painel | ✅ `https://painel.cleci.com.br`, `/api/health` → `{"status":"ok","db":"up"}` |
| Banco | ✅ PostgreSQL 18, database `cleci` |
| Dados | ⚠️ **recomeçados do zero** — ver "Decisão: não restaurar" |
| DNS | ✅ migrado (zona no hPanel da Hostinger) |
| Firewall | ✅ só 22/80/443; painel e Traefik bloqueados em `DOCKER-USER` |
| Backup | ❌ **não configurado** — maior risco em aberto |
| EC2 | 🟡 **no ar**, hospedando os outros 4 projetos |

---

## ⚠️ A EC2 é compartilhada — migração total em ondas

A instância EC2 **não hospedava apenas a Cleci**. O `docker ps` encontrou ~20
containers de cerca de 5 projetos, com 4 bancos PostgreSQL distintos.

| Onda | Projeto | Containers | Risco | Estado |
| --- | --- | --- | --- | --- |
| 1 | **Cleci** | 2 apps + pg18 | baixo | ✅ **concluída** |
| 2 | commit `d268628a` (2 apps) | `u10und…`, `z58c00…` | a levantar | pendente |
| 3 | commit `c35ee7b0` (2 apps) | `okrwz…`, `xtji77…` | a levantar | pendente |
| 4 | bancos `q11aio…` (pg16) e `xs1ibp…` | 2 containers | a levantar | pendente |
| 5 | **Evolution API** | 5 containers (api, web, worker, redis, pgvector) | 🔴 **alto** | pendente |

**A EC2 só é desligada depois da última onda validada.** Terminá-la agora derruba
os outros quatro projetos.

### Volumes com dados (inventário de 27/07/2026)

| Volume | Pertence a | Onda |
| --- | --- | --- |
| `postgres-data-u54vdx0p8dj0e3s7hrqkv6v6` | **Cleci (banco antigo)** | 1 — **preservar**, ver abaixo |
| `postgres-data-q11aioa9o3parqwignad7iii` | projeto pg16 | 4 |
| `postgres-data-xs1ibpakusjh4fqepqxr5mii` | projeto sem tag | 4 |
| `s6vs1quq…_evolution-instances` | Evolution — **sessões WhatsApp** | 5 |
| `s6vs1quq…_pgdata` | Evolution (pgvector) | 5 |
| `s6vs1quq…_redisdata` | Evolution (Redis) | 5 |
| `coolify-db`, `coolify-redis` | painel Coolify antigo | não migram |

Disco da EC2: **28 GB de 48 GB**. RAM: os ~20 containers somam **~1,2 GB** numa
instância de 3,8 GB — o KVM 2 tem 7,8 GB, então **tudo cabe num servidor único**.
Não é preciso segundo VPS nem upgrade de plano. O gargalo do KVM 2 não é RAM de
runtime e sim **pico de build** (daí os 2 GB de swap); evite builds simultâneos
de projetos diferentes.

### Por que o Evolution API fica por último

Ele mantém **sessões de WhatsApp**, e mensagens recebidas durante a janela se
perdem — trate como manutenção anunciada, não como corte transparente. A boa
notícia: as sessões estão em volume Docker (`…_evolution-instances`), então dá
para migrá-las copiando o volume, sem reconectar cada número por QR code.

### Inventário obrigatório antes das ondas 2–5

Para cada projeto: (a) repositório e config de build, (b) variáveis de ambiente,
(c) domínios, (d) **volumes com dados**, (e) bancos e seus nomes reais.

O item (d) é o que diferencia essas ondas da Onda 1: a Cleci não tinha volume
algum. Projetos com upload em disco ou Redis persistente exigem:

```bash
docker run --rm -v <volume>:/data -v $PWD:/backup alpine \
  tar czf /backup/<volume>.tgz /data
```

> Bancos migram por `pg_dump`/`pg_restore`, **não** por cópia de volume: copiar o
> diretório de dados só funciona entre versões idênticas de Postgres e é frágil.
> Volumes de arquivos (sessões do Evolution) migram por cópia mesmo.

---

## 🚨 Decisão: não restaurar os dados antigos

**Por decisão do responsável, o banco não foi restaurado.** O ambiente novo
começou vazio e foi repovoado pelos seeds.

O que foi recriado (vem do código, não de backup):

- 7 categorias, 29 subtipos, **66 produtos** (`seed:catalog`)
- `CommissionConfig` global (10%, cookie 30 dias)
- 1 admin: `contato@cleci.com.br`

**O que NÃO voltou:** usuários (afiliados/vendedores), vendas, comissões,
orçamentos, clientes, saques e logs de auditoria.

> ### Esses dados ainda existem — mas só enquanto a EC2 existir
>
> Estão no volume **`postgres-data-u54vdx0p8dj0e3s7hrqkv6v6`** da EC2. Enquanto
> ele não for apagado, a recuperação é possível a qualquer momento:
>
> ```bash
> # na EC2 — SEM o -t, que corrompe dump binário
> docker exec u54vdx0p8dj0e3s7hrqkv6v6 \
>   pg_dump -Fc -U postgres -d cleci > /home/ubuntu/cleci.dump
> ```
>
> **Não apague esse volume nem termine a instância** antes de decidir
> definitivamente que o histórico é descartável.
>
> Mesma advertência para as **imagens dos produtos**: as URLs estão gravadas no
> banco e apontam para um bucket externo. Se for AWS S3, o bucket precisa
> continuar vivo mesmo depois de a EC2 morrer.

---

## Cronologia e correções

O que a documentação anterior afirmava e o que a produção realmente tinha. Cada
divergência custou tempo — o padrão é claro: **verifique na fonte em execução,
não no documento.**

| Assunto | Documentado (errado) | Real | Como foi descoberto |
| --- | --- | --- | --- |
| Domínios | `clecipersonalizados.com.br` | `cleci.com.br`, `www`, `painel.` | painel do Coolify antigo |
| Postgres | 16 | **18** | `printenv DATABASE_URL` da app |
| Container do banco | `q11aio…` (pg16) | `u54vdx…` (pg18) | idem — o `q11aio…` é de outro projeto |
| PgBouncer | "fundamental, habilite" | **nunca existiu** | a URL sempre apontou para a 5432 |
| Mercado Pago | variáveis obrigatórias | **não configurado** | ausentes no painel |
| Storage S3 | configurado | **não configurado** | idem |

> **Método que funcionou:** identificar recursos pela **variável de ambiente da
> app em execução** (`docker exec <app> printenv DATABASE_URL`), nunca por dedução
> a partir de nome de container ou tag de imagem. Foi assim que se descobriu o
> banco certo — e que a versão era 18, o que teria feito o `pg_restore` falhar.

### Erros operacionais e o que aprender deles

**Domínio no campo errado.** O `https://coolify.cleci.com.br` foi colado em
*Projects → aplicação → Domains* em vez de *Settings → Configuration → General →
URL*, substituindo os domínios do site. Como o Coolify ainda não tinha aplicado
("The latest configuration has not been applied"), o site não caiu. Revertido via
API. **`Domains` na aplicação ≠ `URL` da instância.**

**`www` perdido na recriação.** Os recursos foram criados manualmente no painel
novo e o `www.cleci.com.br` ficou de fora, devolvendo **503** (o DNS apontava
para o servidor, mas o Traefik não tinha rota). Não estava em nenhum checklist —
foi encontrado por varredura dos endpoints.

**Terminal web corrompendo comandos.** O terminal do hPanel não trata *bracketed
paste*: blocos colados chegaram com `^[[200~` e sem quebras de linha, gerando
erros enganosos (`apt: command not found`). Use SSH de verdade, ou digite.

**Segredos em canal de chat.** A senha do Postgres (antiga e nova) foi colada em
texto puro mais de uma vez. Ambas precisam ser rotacionadas. Para inventariar
variáveis, leia pelo painel ou pela API filtrando os valores sensíveis.

---

## Ambiente e ferramental preparados

- **Node.js 24.18.0 LTS** + **pnpm 9.15.0** instalados na máquina de trabalho
  (não havia Node; `pnpm` não existia). `Set-ExecutionPolicy -Scope CurrentUser
  RemoteSigned` foi necessário para o `pnpm.ps1` rodar.
- **Chave SSH** `id_ed25519` autorizada no VPS. Como tem passphrase, exige
  `ssh-agent` (`Set-Service ssh-agent -StartupType Automatic; ssh-add`) —
  serviço vem **desabilitado** no Windows.
  ⚠️ O **Git Bash não conversa com o agente do Windows**; use PowerShell para SSH.
- **Token da API do Coolify** em `%USERPROFILE%\.coolify-token` (fora do repo).
  Uso documentado na seção 2 do [DEPLOY.md](DEPLOY.md).

---

## Pendências

Em ordem de urgência:

1. 🔴 **Backup automático do Postgres** — recurso Postgres → aba *Backups*,
   destino S3 externo (Cloudflare R2). Hoje **não existe backup nenhum**, e o
   histórico antigo não foi migrado: perder este volume significa recomeçar do
   zero pela segunda vez. **Teste um restore** antes de considerar pronto.
2. 🔴 **Rotacionar a senha do Postgres** e **trocar a senha do admin** — ambas
   circularam em canal de chat.
3. 🟡 **Decidir sobre o histórico antigo** — recuperar da EC2 ou descartar
   conscientemente. Enquanto não decidir, preserve o volume.
4. 🟡 **Conferir o `AUTH_SECRET`** — se não foi copiado do ambiente antigo, todas
   as sessões antigas estão inválidas (irrelevante agora, já que os usuários
   também não vieram).
5. 🟢 Mercado Pago e upload de imagens — seções 6 e 7 do [DEPLOY.md](DEPLOY.md).
6. 🟢 Limpar as variáveis de *Preview Deployment* (`painel-novo…`, `novo…`) se
   deploy de PR não for usado.
7. 🟢 **Ondas 2–5** — os outros quatro projetos.

## Riscos conhecidos

| Risco | Mitigação |
| --- | --- |
| **Sem backup do banco** | pendência nº 1 — é o risco dominante hoje |
| Perder o histórico antigo | não apagar o volume `postgres-data-u54vdx…` da EC2 |
| Derrubar outro projeto da EC2 | nunca terminar a instância; conferir UUID antes de apagar recurso |
| Dumpar o banco errado (4 Postgres na EC2) | validar com `psql -l` e com o `printenv` da app |
| `ufw` dando falsa sensação de segurança | usar `DOCKER-USER`; validar de fora com `Test-NetConnection` |
| Perder acesso ao painel se o DNS quebrar | rota de fuga pelo Terminal do hPanel (seção 0 do DEPLOY.md) |
| Imagens dos produtos sumirem | manter o bucket vivo; URLs estão gravadas no banco |
