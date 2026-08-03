import NextAuth from "next-auth";
import type { Adapter } from "next-auth/adapters";
import type { Provider } from "next-auth/providers";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma, UserStatus } from "@cleci/db";
import { env } from "@/env";
import { authConfig } from "@/auth.config";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

/** Google só entra na lista se as credenciais existirem no ambiente. */
export const isGoogleEnabled = Boolean(env.AUTH_GOOGLE_ID && env.AUTH_GOOGLE_SECRET);

const providers: Provider[] = [
  Credentials({
    credentials: {
      email: { label: "E-mail", type: "email" },
      password: { label: "Senha", type: "password" },
    },
    async authorize(raw) {
      const parsed = credentialsSchema.safeParse(raw);
      if (!parsed.success) return null;

      const { email, password } = parsed.data;
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user || !user.passwordHash) return null;

      // Dois portões independentes:
      //  1. e-mail confirmado (prova de posse do endereço)
      //  2. conta ATIVA (aprovação do administrador)
      // Contas anteriores a esta funcionalidade foram marcadas como
      // verificadas na migração, então nada legado é barrado aqui.
      if (!user.emailVerified) return null;
      if (user.status !== UserStatus.ATIVO) return null;

      const ok = await bcrypt.compare(password, user.passwordHash);
      if (!ok) return null;

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
      };
    },
  }),
];

if (isGoogleEnabled) {
  providers.push(
    Google({
      clientId: env.AUTH_GOOGLE_ID!,
      clientSecret: env.AUTH_GOOGLE_SECRET!,
      // Vincula o login Google a uma conta de e-mail/senha já existente com o
      // mesmo endereço. É seguro AQUI porque só aceitamos e-mails que o próprio
      // Google confirmou (checado em `signIn`); o risco que dá nome a
      // "dangerous" é o de provedores que devolvem e-mail não verificado.
      allowDangerousEmailAccountLinking: true,
    }),
  );
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  // PrismaAdapter usa o tipo base de User; nossos campos role/status são
  // resolvidos no callback authorize/jwt. O cast alinha as assinaturas.
  adapter: PrismaAdapter(prisma) as Adapter,
  providers,
  callbacks: {
    ...authConfig.callbacks,
    /**
     * Guard de entrada. O `authorize` do Credentials já barra o que precisa;
     * aqui tratamos o OAuth, onde o adapter cria a conta automaticamente.
     */
    async signIn({ user, account, profile }) {
      if (account?.provider !== "google") return true;

      // Nunca aceitar e-mail que o Google não confirmou — é a premissa do
      // account linking configurado acima.
      if (profile && profile.email_verified === false) return false;

      const email = user.email;
      if (!email) return false;

      const existing = await prisma.user.findUnique({
        where: { email },
        select: { id: true, status: true, emailVerified: true },
      });

      // Primeiro acesso pelo Google: a conta ainda não existe. Barramos aqui
      // em vez de deixar o adapter criá-la — cadastro de afiliado passa pelo
      // formulário, que coleta o aceite da política de privacidade.
      if (!existing) return "/login?erro=sem-conta";

      if (existing.status !== UserStatus.ATIVO) {
        return `/login?erro=${existing.status === UserStatus.BLOQUEADO ? "bloqueada" : "pendente"}`;
      }

      // Login pelo Google prova a posse do e-mail: confirma quem ainda não era.
      if (!existing.emailVerified) {
        await prisma.user.update({
          where: { id: existing.id },
          data: { emailVerified: new Date() },
        });
      }

      return true;
    },
  },
});
