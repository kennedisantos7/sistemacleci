#!/usr/bin/env node
/**
 * Verificador das regras de segurança do SECURITY.md.
 *
 *   pnpm security:check
 *
 * Análise estática de texto: pega o PADRÃO errado, não a LÓGICA errada. Serve
 * para impedir regressão — não substitui revisão de código.
 *
 * Cada exceção mora numa allowlist aqui embaixo, com o motivo escrito. Exceção
 * sem justificativa é violação.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

// ---------------------------------------------------------------------------
// Allowlists — toda entrada precisa de motivo
// ---------------------------------------------------------------------------

/** Rotas sem guard de autorização, por desenho. */
const ROTAS_PUBLICAS = {
  "apps/sistema/src/app/api/auth/[...nextauth]/route.ts":
    "handler do Auth.js: é o próprio mecanismo de login",
  "apps/sistema/src/app/api/health/route.ts":
    "healthcheck do container; não expõe dado algum além de up/down",
  "apps/sistema/src/app/api/me/route.ts":
    "responde {loggedIn:false} sem sessão; CORS restrito a SITE_URL",
  "apps/site/src/app/api/checkout/route.ts":
    "checkout do site é público por natureza; o preço vem do catálogo, nunca da requisição",
  "apps/sistema/src/app/api/encerrar-sessao/route.ts":
    "só apaga o cookie de quem chamou; exigir sessão válida seria circular — existe justamente para sessão inválida",
};

/** Arquivos de Server Action sem requireUser, por desenho. */
const ACTIONS_PUBLICAS = {
  "apps/sistema/src/app/(public)/login/actions.ts": "login: quem chama ainda não tem sessão",
  "apps/sistema/src/app/(public)/cadastro/actions.ts":
    "auto-cadastro de afiliado; protegido por rate limit e nasce PENDENTE",
  "apps/sistema/src/app/(public)/verificar-email/actions.ts":
    "confirmação de e-mail por token; protegido por rate limit",
  "apps/sistema/src/app/(dashboard)/actions.ts":
    "apenas signOut — encerrar a própria sessão não exige autorização",
};

/** Variáveis NEXT_PUBLIC_ com palavra sensível no nome, mas comprovadamente públicas. */
const PUBLIC_ENV_OK = {};

/** Arquivos onde `requireUser()` sem papéis é correto: vale para qualquer logado. */
const QUALQUER_LOGADO = {
  "apps/sistema/src/server/actions/account.ts":
    "troca da própria senha: todo usuário autenticado pode, e a senha atual é exigida",
  "apps/sistema/src/app/(dashboard)/conta/page.tsx":
    "tela da própria conta: acessível a qualquer papel, mostra só os dados do próprio usuário",
};

// ---------------------------------------------------------------------------
// Utilidades
// ---------------------------------------------------------------------------

const IGNORAR = new Set(["node_modules", ".next", ".git", "dist", ".turbo", "coverage"]);
const EXTS = new Set([".ts", ".tsx", ".mjs", ".js"]);

function listarArquivos(dir, saida = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (IGNORAR.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) listarArquivos(full, saida);
    else if (EXTS.has(path.extname(entry.name))) saida.push(full);
  }
  return saida;
}

/** Caminho relativo à raiz, sempre com barra normal (comparável no Windows). */
function rel(file) {
  return path.relative(ROOT, file).split(path.sep).join("/");
}

/** Remove comentários e strings, para não acusar violação citada em comentário. */
function semComentarios(code) {
  return code.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
}

function ehClientComponent(code) {
  // A diretiva precisa estar no topo do arquivo para valer.
  return /^\s*(?:["']use client["'])/m.test(code.slice(0, 500));
}

function ehServerActions(code) {
  return /^\s*(?:["']use server["'])/m.test(code.slice(0, 500));
}

const violacoes = [];
function violar(regra, arquivo, linha, mensagem) {
  violacoes.push({ regra, arquivo, linha, mensagem });
}

function numeroDaLinha(code, index) {
  return code.slice(0, index).split("\n").length;
}

// ---------------------------------------------------------------------------
// Regras
// ---------------------------------------------------------------------------

const arquivos = [
  ...listarArquivos(path.join(ROOT, "apps")),
  ...listarArquivos(path.join(ROOT, "packages")),
];

for (const file of arquivos) {
  const caminho = rel(file);
  const bruto = fs.readFileSync(file, "utf8");
  const code = semComentarios(bruto);

  // --- Regra 1 e 4: nada de banco nem segredo no cliente -------------------
  if (ehClientComponent(bruto)) {
    // `@/server/actions/*` são módulos "use server": o client component importa
    // a Server Action e a chama como função — é justamente o padrão correto.
    // Todo o resto de `@/server/*` (services, session, email, storage) roda só
    // no servidor e não pode entrar no bundle.
    const importsProibidos = [
      { re: /from\s+["']@cleci\/db["']/, o: "@cleci/db" },
      { re: /from\s+["']@prisma\/client["']/, o: "@prisma/client" },
      { re: /from\s+["']@\/server\/(?!actions\/)/, o: "@/server/* (fora de actions)" },
      { re: /from\s+["']bcryptjs["']/, o: "bcryptjs" },
    ];
    for (const { re, o } of importsProibidos) {
      const m = re.exec(code);
      if (m) {
        violar(
          "1. Nunca acessar o banco direto do frontend",
          caminho,
          numeroDaLinha(code, m.index),
          `client component importa "${o}" — mova o acesso para uma Server Action`,
        );
      }
    }

    // process.env no cliente: só NEXT_PUBLIC_ é permitido.
    for (const m of code.matchAll(/process\.env\.([A-Z0-9_]+)/g)) {
      const nome = m[1];
      if (!nome.startsWith("NEXT_PUBLIC_") && nome !== "NODE_ENV") {
        violar(
          "4. Sem secrets no cliente",
          caminho,
          numeroDaLinha(code, m.index),
          `client component lê process.env.${nome} — só NEXT_PUBLIC_* chega ao navegador`,
        );
      }
    }
  }

  // --- Regra 4: nome de variável pública não pode soar a segredo -----------
  for (const m of code.matchAll(/NEXT_PUBLIC_([A-Z0-9_]+)/g)) {
    const nome = `NEXT_PUBLIC_${m[1]}`;
    if (nome in PUBLIC_ENV_OK) continue;
    if (/SECRET|TOKEN|PASSWORD|API_KEY|CREDENTIAL|PRIVATE/.test(m[1])) {
      violar(
        "4. Sem secrets no cliente",
        caminho,
        numeroDaLinha(code, m.index),
        `${nome} tem nome de segredo e NEXT_PUBLIC_ vai para o bundle público`,
      );
    }
  }

  // --- Regra 5: sem concatenar SQL ----------------------------------------
  for (const m of code.matchAll(/\$(?:query|execute)RawUnsafe/g)) {
    violar(
      "5. Sem concatenar SQL",
      caminho,
      numeroDaLinha(code, m.index),
      "use a template tag $queryRaw`...` que parametriza, nunca a variante Unsafe",
    );
  }
  // Template tag com concatenação explícita anula a parametrização.
  for (const m of code.matchAll(/\$(?:query|execute)Raw`[^`]*`\s*\+/g)) {
    violar(
      "5. Sem concatenar SQL",
      caminho,
      numeroDaLinha(code, m.index),
      "concatenação em cima do template tag anula a parametrização",
    );
  }

  // --- Regra 2: toda rota exige autorização --------------------------------
  if (/\/app\/api\/.*\/route\.(ts|tsx)$/.test(caminho)) {
    const temGuard =
      /requireUser\s*\(/.test(code) ||
      /safeEqual\s*\(/.test(code) ||
      /isValidIngestKey\s*\(/.test(code) || // wrapper de safeEqual em security.ts
      /WebhookSignatureValidator|validateSignature/.test(code);
    if (!temGuard && !(caminho in ROTAS_PUBLICAS)) {
      violar(
        "2. Toda rota exige autorização",
        caminho,
        1,
        "route handler sem guard — use requireUser/safeEqual/assinatura, ou declare em ROTAS_PUBLICAS com motivo",
      );
    }
  }

  // --- Regra 2: toda Server Action valida sessão ---------------------------
  if (ehServerActions(bruto) && !(caminho in ACTIONS_PUBLICAS)) {
    if (!/requireUser\s*\(/.test(code)) {
      violar(
        "2. Toda rota exige autorização",
        caminho,
        1,
        "arquivo de Server Actions sem requireUser — actions são endpoints HTTP chamáveis direto",
      );
    }
  }

  // --- Regra 6: sem permissões amplas por padrão ---------------------------
  // requireUser() sem argumento aceita QUALQUER papel autenticado.
  for (const m of code.matchAll(/requireUser\s*\(\s*\)/g)) {
    // A própria definição do helper não conta; o resto precisa declarar papéis
    // ou constar em QUALQUER_LOGADO com motivo.
    if (!caminho.endsWith("/server/session.ts") && !(caminho in QUALQUER_LOGADO)) {
      violar(
        "6. Sem permissões amplas por padrão",
        caminho,
        numeroDaLinha(code, m.index),
        "requireUser() sem lista de papéis aceita qualquer usuário logado — declare os papéis ou justifique em QUALQUER_LOGADO",
      );
    }
  }

  // --- Regra 3: entrada validada por schema --------------------------------
  // Route handler que lê o corpo precisa passar por Zod.
  // Só corpo JSON: upload multipart carrega binário, cuja validação é de tipo
  // MIME e tamanho (feita em server/storage.ts), não de schema Zod.
  if (/\/app\/api\/.*\/route\.(ts|tsx)$/.test(caminho)) {
    const leJson = /\breq\.json\(\)|\brequest\.json\(\)/.test(code);
    const validaSchema = /safeParse|\.parse\(/.test(code);
    if (leJson && !validaSchema) {
      violar(
        "3. Toda entrada validada por schema",
        caminho,
        1,
        "handler lê corpo JSON sem validar com Zod",
      );
    }
  }
}

// ---------------------------------------------------------------------------
// Allowlists obsoletas: entrada que aponta para arquivo inexistente vira ruído
// ---------------------------------------------------------------------------
for (const [caminho, motivo] of Object.entries({
  ...ROTAS_PUBLICAS,
  ...ACTIONS_PUBLICAS,
  ...QUALQUER_LOGADO,
})) {
  if (!fs.existsSync(path.join(ROOT, caminho))) {
    violar(
      "allowlist obsoleta",
      caminho,
      1,
      `arquivo não existe mais; remova a exceção ("${motivo}") de scripts/security-check.mjs`,
    );
  }
}

// ---------------------------------------------------------------------------
// Relatório
// ---------------------------------------------------------------------------

const totalArquivos = arquivos.length;

if (violacoes.length === 0) {
  console.log(`✅ security:check — ${totalArquivos} arquivos, nenhuma violação.`);
  console.log("   Regras em SECURITY.md.");
  process.exit(0);
}

console.error(`❌ security:check — ${violacoes.length} violação(ões) em ${totalArquivos} arquivos:\n`);

const porRegra = new Map();
for (const v of violacoes) {
  if (!porRegra.has(v.regra)) porRegra.set(v.regra, []);
  porRegra.get(v.regra).push(v);
}

for (const [regra, lista] of porRegra) {
  console.error(`  ${regra}`);
  for (const v of lista) {
    console.error(`    ${v.arquivo}:${v.linha}`);
    console.error(`      ${v.mensagem}`);
  }
  console.error("");
}

console.error("Regras e justificativas: SECURITY.md");
process.exit(1);
