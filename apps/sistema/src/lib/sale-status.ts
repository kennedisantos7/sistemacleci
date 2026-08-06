import type { SaleStatus } from "@cleci/db";

/**
 * Rótulos da venda. Como no orçamento, o valor no banco continua PAGO — só o
 * texto na tela virou "Finalizada", que é como a equipe fala (venda fechada e
 * entregue, não necessariamente um pagamento registrado aqui dentro).
 *
 * A concordância é no feminino porque o sujeito é "a venda", igual ao que já
 * aparecia no orçamento ("Venda vinculada: Finalizada").
 */
export const SALE_STATUS_LABEL: Record<SaleStatus, string> = {
  PENDENTE: "Pendente",
  PAGO: "Finalizada",
  RECUSADO: "Recusada",
  REEMBOLSADO: "Reembolsada",
};

export const SALE_STATUS_STYLE: Record<SaleStatus, string> = {
  PENDENTE: "bg-amber-100 text-amber-800",
  PAGO: "bg-green-100 text-green-800",
  RECUSADO: "bg-red-100 text-red-800",
  REEMBOLSADO: "bg-zinc-200 text-zinc-700",
};
