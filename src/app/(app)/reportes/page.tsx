import { ChartColumn } from "lucide-react";
import { ModulePlaceholder } from "@/components/ui/ModulePlaceholder";

export default function ReportesPage() {
  return (
    <ModulePlaceholder
      title="Reportes"
      description="Informes de ventas, obras, rentabilidad y costes, exportables a Excel y PDF."
      icon={ChartColumn}
      phase="Fase 10 · Dashboards y reportes"
    />
  );
}
