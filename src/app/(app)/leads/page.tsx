import Link from "next/link";
import type { Route } from "next";
import { Plus, UserPlus } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { getStages, getCustomers } from "@/lib/crm/queries";
import { KanbanBoard } from "./KanbanBoard";

export default async function LeadsPage() {
  const [stages, customers] = await Promise.all([getStages(), getCustomers()]);

  return (
    <div>
      <PageHeader
        title="Leads · Pipeline"
        description="Arrastra las tarjetas para mover clientes entre etapas."
      >
        <Link
          href={"/clientes/nuevo" as Route}
          className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-700"
        >
          <Plus className="h-4 w-4" />
          Nuevo lead
        </Link>
      </PageHeader>

      {stages.length === 0 ? (
        <EmptyState
          icon={UserPlus}
          title="Aún no hay etapas configuradas"
          description="Ejecuta la migración de la Fase 2 en Supabase para crear las etapas del pipeline."
        />
      ) : (
        <KanbanBoard stages={stages} customers={customers} />
      )}
    </div>
  );
}
