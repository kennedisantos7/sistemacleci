import { DocumentEdit } from "../../../_documentos/document-edit";

export const dynamic = "force-dynamic";

export default async function EditarPedidoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <DocumentEdit id={id} section="PEDIDO" />;
}
