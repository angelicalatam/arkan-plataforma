import { TriangleAlert } from "lucide-react";
import { ModulePlaceholder } from "@/components/ui/ModulePlaceholder";

export default function IncidenciasPage() {
  return (
    <ModulePlaceholder
      title="Incidencias"
      description="Registro y seguimiento de incidencias de obra con fotos y acciones correctivas."
      icon={TriangleAlert}
      phase="Fase 9 · Operaciones"
    />
  );
}
