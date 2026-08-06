import { signOut } from "@/auth";

/** Avisos que a tela de login sabe exibir. */
const MOTIVOS = new Set(["sessao-invalida", "bloqueada", "pendente"]);

/**
 * Apaga o cookie de sessão e devolve o usuário ao login.
 *
 * Existe porque a sessão é um JWT de 30 dias: quando o servidor descobre que o
 * token descreve um usuário que não existe mais (ou que foi bloqueado), não
 * basta redirecionar para /login — o cookie continuaria válido e o middleware
 * devolveria a pessoa para a home, em laço. Aqui a sessão é de fato encerrada.
 */
export async function GET(request: Request) {
  const pedido = new URL(request.url).searchParams.get("erro") ?? "";
  const motivo = MOTIVOS.has(pedido) ? pedido : "sessao-invalida";

  // signOut lança o redirect depois de limpar o cookie.
  await signOut({ redirectTo: `/login?erro=${motivo}` });
}
