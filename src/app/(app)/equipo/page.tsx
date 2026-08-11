import { Users } from "lucide-react";
import { ModulePlaceholder } from "@/components/ui/ModulePlaceholder";

export default function EquipoPage() {
  return (
    <ModulePlaceholder
      title="Equipo"
      description="Operarios y colaboradores, coste/hora y registro de horas por partida."
      icon={Users}
      phase="Fase 7 · Equipo y horas"
    />
  );
}
