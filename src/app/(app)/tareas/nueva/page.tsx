import Link from "next/link";
import type { Route } from "next";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { getEmployeeOptions } from "@/lib/team/queries";
import { getProjectOptions } from "@/lib/projects/queries";
import { TaskForm } from "../TaskForm";

export default async function NuevaTareaPage() {
  const [employees, projects] = await Promise.all([getEmployeeOptions(), getProjectOptions()]);

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href={"/tareas" as Route}
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-800"
      >
        <ArrowLeft className="h-4 w-4" />
        Tareas
      </Link>
      <PageHeader title="Nueva tarea" description="Crea una tarea con prioridad, fecha y responsable." />
      <TaskForm employees={employees.map((e) => ({ id: e.id, name: e.name }))} projects={projects} />
    </div>
  );
}
