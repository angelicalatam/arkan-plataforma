import { FolderOpen } from "lucide-react";
import { ModulePlaceholder } from "@/components/ui/ModulePlaceholder";

export default function DocumentosPage() {
  return (
    <ModulePlaceholder
      title="Documentos"
      description="Biblioteca documental por obra: contratos, planos, fotos, facturas y albaranes."
      icon={FolderOpen}
      phase="Fase 9 · Documentación"
    />
  );
}
