/**
 * Seed das contas de teste E2E — uma por papel.
 *
 * Rodar: `pnpm db:seed:e2e` (exige TEST_PASSWORD no ambiente).
 *
 * Por que uma conta por papel: o núcleo do painel é o RBAC (src/lib/rbac.ts).
 * Seis papéis, cada um com menu, home e escopo de dados diferentes. Testar com
 * uma conta só deixa a maior fonte de bug do sistema sem cobertura.
 *
 * As contas nascem ATIVO e com emailVerified preenchido — sem os dois o login
 * é recusado (ver app/(public)/login/actions.ts). As duas últimas são a
 * exceção proposital: existem justamente para provar que NÃO logam.
 */
import { PrismaClient, Role, UserStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

/** Sufixo comum a todas as contas de teste — facilita achar e limpar depois. */
const DOMAIN = "@cleci.com.br";

type Conta = {
  email: string;
  name: string;
  role: Role;
  status?: UserStatus;
  /** null = e-mail não confirmado (conta que não deve conseguir logar). */
  verificado?: boolean;
  affiliateCode?: string;
  /** Por que a conta existe, para quem for ler a lista depois. */
  cobre: string;
};

const CONTAS: Conta[] = [
  {
    email: `teste-admin${DOMAIN}`,
    name: "Teste Admin",
    role: Role.ADMIN,
    cobre: "painel admin, usuários, produtos, tabela de preços, vendas, metas, saques",
  },
  {
    email: `teste-dev${DOMAIN}`,
    name: "Teste Desenvolvedor",
    role: Role.DESENVOLVEDOR,
    cobre: "tudo do admin + comissões + saque da própria parte",
  },
  {
    email: `teste-gerente${DOMAIN}`,
    name: "Teste Gerente",
    role: Role.GERENTE,
    cobre: "negativo: /admin/comissoes e /admin/saques devem barrar",
  },
  {
    email: `teste-vendedor${DOMAIN}`,
    name: "Teste Vendedor",
    role: Role.VENDEDOR_FIXO,
    cobre: "orçamento/pedido/cliente + escopo 'só os meus'",
  },
  {
    // Segundo vendedor: sem ele não dá para provar o isolamento de escopo —
    // que o vendedor A não enxerga o documento do vendedor B.
    email: `teste-vendedor2${DOMAIN}`,
    name: "Teste Vendedor 2",
    role: Role.VENDEDOR_FIXO,
    cobre: "par do teste-vendedor, para provar isolamento entre vendedores",
  },
  {
    email: `teste-afiliado${DOMAIN}`,
    name: "Teste Afiliado",
    role: Role.AFILIADO,
    // Código fixo: os testes de /go/<ref> e de venda manual com ref precisam
    // de um valor previsível.
    affiliateCode: "TESTE001",
    cobre: "links, saques; negativo: /orcamentos e /clientes barram",
  },
  {
    email: `teste-pendente${DOMAIN}`,
    name: "Teste Pendente",
    role: Role.AFILIADO,
    status: UserStatus.PENDENTE,
    verificado: false,
    cobre: "não loga: aguardando confirmação de e-mail e liberação do admin",
  },
  {
    email: `teste-bloqueado${DOMAIN}`,
    name: "Teste Bloqueado",
    role: Role.VENDEDOR_FIXO,
    status: UserStatus.BLOQUEADO,
    cobre: "não loga: conta bloqueada pelo admin",
  },
];

/**
 * Trava de segurança: este seed cria contas com senha conhecida. Num banco de
 * produção isso seria uma porta aberta.
 *
 * São duas checagens porque uma só não basta. O banco E2E é alcançado por túnel
 * SSH (`-L 5433:...`), então **produção também aparece como localhost** — olhar
 * só o host deixaria passar. Por isso o nome do banco tem que ser explícito.
 */
function conferirDestino(): void {
  const url = process.env.DATABASE_URL ?? "";
  const nome = url.split("/").pop()?.split("?")[0] ?? "";
  const noLocalhost = /@(localhost|127\.0\.0\.1|postgres|db)[:/]/.test(url);

  // Aceita o banco dedicado (qualquer host) ou o docker-compose local.
  const destinoOk = nome === "cleci_e2e" || (noLocalhost && nome === "cleci");

  if (!destinoOk && process.env.ALLOW_REMOTE_E2E_SEED !== "1") {
    console.error(
      `\n✗ Banco de destino "${nome}" não é um alvo de teste reconhecido.\n` +
        "  Esperado: cleci_e2e (dedicado) ou cleci em localhost (docker-compose).\n" +
        "  Este seed cria contas com senha conhecida — nunca rode em produção.\n",
    );
    process.exit(1);
  }
}

/**
 * Segunda trava, agora olhando o conteúdo: um banco de teste tem um punhado de
 * usuários. Se houver muita gente, é base real — para tudo, mesmo que o nome
 * tenha enganado a checagem acima.
 */
async function conferirQueEstaVazio(): Promise<void> {
  const usuarios = await prisma.user.count();
  const limite = CONTAS.length + 5; // as contas de teste + a folga do seed comum

  if (usuarios > limite && process.env.ALLOW_REMOTE_E2E_SEED !== "1") {
    console.error(
      `\n✗ O banco tem ${usuarios} usuários — mais do que um ambiente de teste teria.\n` +
        "  Parece base real. Abortado por segurança.\n",
    );
    process.exit(1);
  }
}

async function main() {
  conferirDestino();
  await conferirQueEstaVazio();

  const password = process.env.TEST_PASSWORD;
  if (!password || password.length < 8) {
    console.error(
      "\n✗ Defina TEST_PASSWORD (mín. 8 caracteres) antes de rodar.\n" +
        "  Ex.: apps/e2e/.env  →  TEST_PASSWORD=senha-de-teste-123\n",
    );
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, 12);

  for (const c of CONTAS) {
    const status = c.status ?? UserStatus.ATIVO;
    const emailVerified = c.verificado === false ? null : new Date();

    // upsert: rodar de novo não duplica nem quebra, só realinha o estado —
    // importante porque os próprios testes mexem em status de conta.
    const dados = {
      name: c.name,
      role: c.role,
      status,
      passwordHash,
      emailVerified,
      ...(c.affiliateCode ? { affiliateCode: c.affiliateCode } : {}),
    };

    await prisma.user.upsert({
      where: { email: c.email },
      update: dados,
      create: { email: c.email, ...dados },
    });

    const selo = status === UserStatus.ATIVO && emailVerified ? "loga" : "NÃO loga";
    console.log(`  ✓ ${c.email.padEnd(32)} ${c.role.padEnd(14)} (${selo}) — ${c.cobre}`);
  }

  console.log(`\n✓ ${CONTAS.length} contas de teste prontas. Senha: TEST_PASSWORD do ambiente.`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
