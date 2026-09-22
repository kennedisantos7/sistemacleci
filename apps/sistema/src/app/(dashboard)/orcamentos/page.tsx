import { DocumentList } from "../_documentos/document-list";

export const dynamic = "force-dynamic";

export default async function OrcamentosPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  return <DocumentList docType="ORCAMENTO" searchParams={searchParams} />;
}
