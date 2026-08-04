-- Percentual de comissão do vendedor fixo. Pago fora da plataforma: não gera
-- Commission, serve para o painel do vendedor mostrar quanto ele tem a receber.
--
-- Default 0 de propósito. Com um percentual inventado o painel exibiria um
-- valor errado como se fosse acordado; com 0 ele diz "não configurada" até o
-- administrador definir a taxa.
ALTER TABLE "CommissionConfig" ADD COLUMN "vendedorFixoBps" INTEGER NOT NULL DEFAULT 0;
