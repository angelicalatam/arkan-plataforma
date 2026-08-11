import { HardHat } from "lucide-react";
import { ModulePlaceholder } from "@/components/ui/ModulePlaceholder";

export default function ObrasPage() {
  return (
    <ModulePlaceholder
      title="Obras"
      description="Gestión integral de obras: avance, costes reales, rentabilidad y equipo."
      icon={HardHat}
      phase="Fase 5 · Obras"
    />
  );
}
