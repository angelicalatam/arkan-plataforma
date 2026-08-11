import { Settings } from "lucide-react";
import { ModulePlaceholder } from "@/components/ui/ModulePlaceholder";

export default function ConfiguracionPage() {
  return (
    <ModulePlaceholder
      title="Configuración"
      description="Usuarios y roles, etapas del CRM, etiquetas y ajustes de la empresa."
      icon={Settings}
      phase="Fase 1 · Base del sistema"
    />
  );
}
