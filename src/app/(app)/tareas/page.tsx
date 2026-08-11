import { SquareCheckBig } from "lucide-react";
import { ModulePlaceholder } from "@/components/ui/ModulePlaceholder";

export default function TareasPage() {
  return (
    <ModulePlaceholder
      title="Tareas"
      description="Tareas asociadas a clientes, obras o partidas. Vistas lista, Kanban y calendario."
      icon={SquareCheckBig}
      phase="Fase 9 · Operaciones"
    />
  );
}
