import { CalendarDays } from "lucide-react";
import { ModulePlaceholder } from "@/components/ui/ModulePlaceholder";

export default function CalendarioPage() {
  return (
    <ModulePlaceholder
      title="Calendario"
      description="Visitas, inicios y fines de obra, tareas, entregas y vencimientos."
      icon={CalendarDays}
      phase="Fase 10 · Dashboards y reportes"
    />
  );
}
