import { DocumentNew } from "../../_documentos/document-new";

export const dynamic = "force-dynamic";

export default async function NovoPedidoPage({
  searchParams,
}: {
  searchParams: Promise<{ cliente?: string }>;
}) {
  return <DocumentNew docType="PEDIDO" searchParams={searchParams} />;
}
