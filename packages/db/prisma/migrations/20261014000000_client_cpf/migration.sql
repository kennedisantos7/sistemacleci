-- CPF e CNPJ em campos separados no cadastro do cliente. "document" passa a
-- guardar só o CNPJ; o que já estava salvo com 11 dígitos (CPF) muda de coluna.

-- AlterTable
ALTER TABLE "Client" ADD COLUMN "cpf" TEXT;

UPDATE "Client"
SET "cpf" = "document", "document" = NULL
WHERE length(regexp_replace("document", '\D', '', 'g')) = 11;
