import { DocumentList } from "../_documentos/document-list";

export const dynamic = "force-dynamic";

export default async function PedidosPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  return <DocumentList docType="PEDIDO" searchParams={searchParams} />;
}
