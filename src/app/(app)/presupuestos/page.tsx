import { FileText } from "lucide-react";
import { ModulePlaceholder } from "@/components/ui/ModulePlaceholder";

export default function PresupuestosPage() {
  return (
    <ModulePlaceholder
      title="Presupuestos"
      description="Presupuestos por capítulos y partidas, con costes, márgenes y estados."
      icon={FileText}
      phase="Fase 3 · Presupuestos"
    />
  );
}
