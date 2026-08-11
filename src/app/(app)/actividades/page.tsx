import { Activity } from "lucide-react";
import { ModulePlaceholder } from "@/components/ui/ModulePlaceholder";

export default function ActividadesPage() {
  return (
    <ModulePlaceholder
      title="Actividades"
      description="Registro de llamadas, WhatsApp, emails, visitas y notas por cliente."
      icon={Activity}
      phase="Fase 2 · CRM"
    />
  );
}
