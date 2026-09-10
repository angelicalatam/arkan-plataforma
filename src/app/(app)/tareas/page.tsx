import Link from "next/link";
import type { Route } from "next";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { getTasks } from "@/lib/tasks/queries";
import { getEmployeeOptions } from "@/lib/team/queries";
import { getProjectOptions } from "@/lib/projects/queries";
import { TasksClient } from "./TasksClient";

export default async function TareasPage() {
  const [tasks, employees, projects] = await Promise.all([
    getTasks(),
    getEmployeeOptions(),
    getProjectOptions(),
  ]);

  return (
    <div>
      <PageHeader title="Tareas" description="Organiza el trabajo con prioridades, fechas y responsables.">
        <Link
          href={"/tareas/nueva" as Route}
          className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-700"
        >
          <Plus className="h-4 w-4" />
          Nueva tarea
        </Link>
      </PageHeader>

      <TasksClient
        tasks={tasks}
        employees={employees.map((e) => ({ id: e.id, name: e.name }))}
        projects={projects}
      />
    </div>
  );
}
