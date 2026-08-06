import { redirect } from "next/navigation";
import { prisma, UserStatus, type Role } from "@cleci/db";
import { auth } from "@/auth";

export type SessionUser = {
  id: string;
  role: Role;
  email: string;
  name?: string | null;
};

/** Motivo pelo qual a sessão foi encerrada — vira aviso na tela de login. */
type MotivoSaida = "sessao-invalida" | "bloqueada" | "pendente";

function encerrarSessao(motivo: MotivoSaida): never {
  // Redireciona para a rota que APAGA o cookie. Mandar direto para /login
  // criaria laço infinito: o middleware vê um token ainda válido e devolve o
  // usuário para a home, que chama esta função de novo.
  redirect(`/api/encerrar-sessao?erro=${motivo}`);
}

/**
 * Garante que há sessão ativa e (opcionalmente) que a role está autorizada.
 * Use em Server Components e Server Actions — o middleware já protege as rotas,
 * mas as actions precisam revalidar no servidor (defesa em profundidade).
 *
 * A sessão é JWT: id, papel e situação são gravados no token no momento do
 * login e o token vale 30 dias. Sem conferir no banco a cada requisição:
 *  - conta excluída continuaria "logada" e estouraria em violação de chave
 *    estrangeira na primeira gravação (foi o bug do Budget_vendedorId_fkey);
 *  - conta bloqueada continuaria entrando até o token expirar;
 *  - quem fosse rebaixado manteria o papel antigo pelo mesmo prazo.
 * O custo é uma consulta enxuta por requisição protegida — barata perto de
 * confiar em um token que pode estar descrevendo um usuário que não existe.
 */
export async function requireUser(allowed?: Role[]): Promise<SessionUser> {
  const session = await auth();
  const tokenUser = session?.user;
  if (!tokenUser?.id) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: tokenUser.id },
    select: { id: true, email: true, name: true, role: true, status: true },
  });

  if (!user) encerrarSessao("sessao-invalida");
  if (user.status === UserStatus.BLOQUEADO) encerrarSessao("bloqueada");
  if (user.status !== UserStatus.ATIVO) encerrarSessao("pendente");

  // Papel vem do banco, não do token: rebaixar alguém passa a valer na hora.
  if (allowed && !allowed.includes(user.role)) redirect("/");

  return { id: user.id, role: user.role, email: user.email, name: user.name };
}
