-- Remove a confirmação de e-mail do cadastro. Quem se cadastra passa a existir
-- no sistema na hora e aguarda apenas a aprovação do admin (User.status).
--
-- A coluna "User"."emailVerified" NÃO é removida: faz parte do schema esperado
-- pelo adapter do Auth.js. Ela simplesmente deixa de ser lida ou escrita.
--
-- A tabela abaixo guardava só tokens de confirmação pendentes — dado efêmero,
-- sem valor histórico depois que o fluxo deixa de existir.

-- DropTable
DROP TABLE IF EXISTS "EmailVerificationToken";
