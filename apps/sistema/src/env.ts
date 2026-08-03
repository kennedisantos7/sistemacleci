import { z } from "zod";

// Validação das variáveis de ambiente no boot — falha rápido se faltar algo.
const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  DIRECT_URL: z.string().url().optional(),
  AUTH_SECRET: z.string().min(16, "AUTH_SECRET muito curto"),
  NEXTAUTH_URL: z.string().url().optional(),
  MP_ACCESS_TOKEN: z.string().optional(),
  MP_WEBHOOK_SECRET: z.string().optional(),
  ATTRIBUTION_COOKIE_DAYS: z.coerce.number().int().positive().default(30),
  SITE_URL: z.string().url().default("http://localhost:3000"),
  SISTEMA_URL: z.string().url().default("http://localhost:3001"),
  INGEST_API_KEY: z.string().min(16).optional(),
  // Login com Google (OAuth). Opcional: sem as duas variáveis o provider não
  // é registrado e a tela de login mostra só o formulário de e-mail/senha.
  AUTH_GOOGLE_ID: z.string().optional(),
  AUTH_GOOGLE_SECRET: z.string().optional(),
  // Envio de e-mail (confirmação de cadastro) via Resend. Opcional: sem a
  // chave, o link de confirmação é registrado no log do servidor e a tela
  // avisa que o e-mail não pôde ser enviado — o cadastro não quebra.
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().default("Cleci Personaliza <nao-responda@cleci.com.br>"),
  // Armazenamento de imagens (S3-compatível / Cloudflare R2). Opcional:
  // sem isso, o upload responde erro claro em vez de quebrar o boot.
  S3_ENDPOINT: z.string().url().optional(),
  S3_REGION: z.string().default("auto"),
  S3_BUCKET: z.string().optional(),
  S3_ACCESS_KEY_ID: z.string().optional(),
  S3_SECRET_ACCESS_KEY: z.string().optional(),
  S3_PUBLIC_URL: z.string().url().optional(),
});

const raw = {
  DATABASE_URL: process.env.DATABASE_URL,
  DIRECT_URL: process.env.DIRECT_URL,
  AUTH_SECRET: process.env.AUTH_SECRET,
  NEXTAUTH_URL: process.env.NEXTAUTH_URL,
  MP_ACCESS_TOKEN: process.env.MP_ACCESS_TOKEN,
  MP_WEBHOOK_SECRET: process.env.MP_WEBHOOK_SECRET,
  ATTRIBUTION_COOKIE_DAYS: process.env.ATTRIBUTION_COOKIE_DAYS,
  SITE_URL: process.env.SITE_URL,
  SISTEMA_URL: process.env.SISTEMA_URL,
  INGEST_API_KEY: process.env.INGEST_API_KEY,
  AUTH_GOOGLE_ID: process.env.AUTH_GOOGLE_ID,
  AUTH_GOOGLE_SECRET: process.env.AUTH_GOOGLE_SECRET,
  RESEND_API_KEY: process.env.RESEND_API_KEY,
  EMAIL_FROM: process.env.EMAIL_FROM,
  S3_ENDPOINT: process.env.S3_ENDPOINT,
  S3_REGION: process.env.S3_REGION,
  S3_BUCKET: process.env.S3_BUCKET,
  S3_ACCESS_KEY_ID: process.env.S3_ACCESS_KEY_ID,
  S3_SECRET_ACCESS_KEY: process.env.S3_SECRET_ACCESS_KEY,
  S3_PUBLIC_URL: process.env.S3_PUBLIC_URL,
};

type Env = z.infer<typeof envSchema>;

function loadEnv(): Env {
  const parsed = envSchema.safeParse(raw);
  if (parsed.success) return parsed.data;

  // Durante o build (next build coleta as rotas) nem toda variável de runtime
  // existe. Não validamos aqui — a validação real ocorre no runtime do container.
  if (process.env.DOCKER_BUILD === "1" || process.env.SKIP_ENV_VALIDATION === "1") {
    return raw as unknown as Env;
  }

  console.error("❌ Variáveis de ambiente inválidas:", parsed.error.flatten().fieldErrors);
  throw new Error("Variáveis de ambiente inválidas. Verifique o .env / Coolify.");
}

export const env = loadEnv();
