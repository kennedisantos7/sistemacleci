/**
 * Traduz um erro em mensagem para o usuário.
 *
 * Os services lançam `Error` com texto já escrito para quem está na tela
 * ("Cliente inválido.", "Só rascunhos podem ser excluídos."). Esses passam
 * direto. Qualquer outra coisa — falha do Prisma, bug nosso — vira o texto
 * genérico e o erro real vai para o log do servidor.
 *
 * O motivo é concreto: uma violação de chave estrangeira despejava o comando
 * `prisma.budget.create()` inteiro na tela do vendedor, expondo nomes de
 * tabelas e colunas e sem dizer nada de útil para quem estava tentando salvar.
 */
export function mensagemDoErro(err: unknown, fallback: string): string {
  if (!(err instanceof Error)) {
    console.error("[erro nao-Error]", err);
    return fallback;
  }

  // Erros do Prisma se identificam pelo nome da classe; os nossos são frases
  // curtas de uma linha só. As duas guardas cobrem também exceções de terceiros
  // que ninguém previu aqui.
  const interno =
    err.name.startsWith("PrismaClient") ||
    err.message.includes("\n") ||
    err.message.length > 200;

  if (interno) {
    console.error("[erro interno]", err);
    return fallback;
  }

  return err.message;
}
