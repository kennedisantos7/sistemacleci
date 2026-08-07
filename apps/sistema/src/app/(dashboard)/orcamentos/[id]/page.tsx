import { DocumentDetail } from "../../_documentos/document-detail";

export const dynamic = "force-dynamic";

export default async function OrcamentoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <DocumentDetail id={id} section="ORCAMENTO" />;
}
