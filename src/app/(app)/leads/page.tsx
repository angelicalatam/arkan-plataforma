import { UserPlus } from "lucide-react";
import { ModulePlaceholder } from "@/components/ui/ModulePlaceholder";

export default function LeadsPage() {
  return (
    <ModulePlaceholder
      title="Leads"
      description="Captación y seguimiento de nuevos contactos comerciales (pipeline Kanban)."
      icon={UserPlus}
      phase="Fase 2 · CRM"
    />
  );
}
