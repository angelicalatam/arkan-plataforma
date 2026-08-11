import { Package } from "lucide-react";
import { ModulePlaceholder } from "@/components/ui/ModulePlaceholder";

export default function MaterialesPage() {
  return (
    <ModulePlaceholder
      title="Materiales"
      description="Control de materiales por obra: solicitudes, entregas y estados."
      icon={Package}
      phase="Fase 6 · Compras y materiales"
    />
  );
}
