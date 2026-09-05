import { PageHeader } from "@/components/ui/PageHeader";
import { EmployeeForm } from "../EmployeeForm";

export default function NuevoMiembroPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Nuevo miembro del equipo" description="Da de alta un operario o colaborador." />
      <EmployeeForm />
    </div>
  );
}
