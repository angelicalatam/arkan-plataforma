import { Users } from "lucide-react";
import { ModulePlaceholder } from "@/components/ui/ModulePlaceholder";

export default function ClientesPage() {
  return (
    <ModulePlaceholder
      title="Clientes"
      description="Base de datos de clientes con ficha completa e historial de cada uno."
      icon={Users}
      phase="Fase 2 · CRM"
    />
  );
}
