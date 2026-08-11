import { Receipt } from "lucide-react";
import { ModulePlaceholder } from "@/components/ui/ModulePlaceholder";

export default function FacturacionPage() {
  return (
    <ModulePlaceholder
      title="Facturación"
      description="Facturas, anticipos, cobros y saldos pendientes por cliente y obra."
      icon={Receipt}
      phase="Fase 9 · Facturación"
    />
  );
}
