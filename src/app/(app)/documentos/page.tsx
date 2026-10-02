import { PageHeader } from "@/components/ui/PageHeader";
import { getDocuments } from "@/lib/documents/queries";
import { getProjectOptions } from "@/lib/projects/queries";
import { DocumentsLibrary } from "./DocumentsLibrary";

export default async function DocumentosPage() {
  const [documents, projects] = await Promise.all([getDocuments(), getProjectOptions()]);

  return (
    <div>
      <PageHeader
        title="Documentos"
        description="Biblioteca documental: contratos, planos, licencias, seguros… por obra o generales."
      />
      <DocumentsLibrary documents={documents} projects={projects} />
    </div>
  );
}
