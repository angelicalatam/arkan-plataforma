import Link from "next/link";
import type { Route } from "next";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Pencil,
  User,
  MapPin,
  Wallet,
  Coins,
  TrendingUp,
  Percent,
  MessageSquare,
  Building2,
  ChevronRight,
  Plus,
} from "lucide-react";
import { getProject } from "@/lib/projects/queries";
import { getProjectConversations } from "@/lib/conversations/queries";
import { getProjectOperations } from "@/lib/operations/queries";
import { OperationsTable } from "@/components/operations/OperationsTable";
import { getProjectPurchases } from "@/lib/purchases/queries";
import { purchaseTotals, purchasesCost, purchaseStatusInfo } from "@/lib/purchases/types";
import { getProjectTimeEntries } from "@/lib/team/queries";
import { getEmployeeOptions } from "@/lib/team/queries";
import { ProjectLabor } from "./ProjectLabor";
import {
  projectStatusInfo,
  projectEconomics,
  projectProgress,
  type ProjectItem,
} from "@/lib/projects/types";
import { Badge } from "@/components/ui/Badge";
import { StatCard } from "@/components/ui/StatCard";
import { Card, CardHeader } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/format";
import { ProjectStatusSelect } from "./ProjectStatusSelect";
import { ProjectItemProgress } from "./ProjectItemProgress";
import { DeleteProjectButton } from "./DeleteProjectButton";

export default async function ObraDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [project, conversations, operations, purchases, timeEntries, employeeOptions] =
    await Promise.all([
      getProject(id),
      getProjectConversations(id),
      getProjectOperations(id),
      getProjectPurchases(id),
      getProjectTimeEntries(id),
      getEmployeeOptions(),
    ]);
  if (!project) notFound();

  const materialCost = purchasesCost(purchases);
  const itemOptions = (project.chapters ?? [])
    .flatMap((c) => c.items ?? [])
    .map((it) => ({ id: it.id, code: it.code, description: it.description }));

  const chapters = project.chapters ?? [];
  const allItems = chapters.flatMap((c) => c.items ?? []);
  const eco = projectEconomics(allItems);
  const progress = projectProgress(allItems);
  const si = projectStatusInfo(project.status);

  return (
    <div className="mx-auto max-w-6xl">
      <Link
        href={"/obras" as Route}
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-800"
      >
        <ArrowLeft className="h-4 w-4" />
        Obras
      </Link>

      {/* Cabecera */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-ink-900">
              {project.code || "Obra"}
            </h1>
            <Badge tone={si.tone}>{si.label}</Badge>
          </div>
          {project.name && <p className="mt-1 text-ink-600">{project.name}</p>}
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink-500">
            {project.customer && (
              <span className="inline-flex items-center gap-1.5">
                <User className="h-3.5 w-3.5" />
                <Link
                  href={`/clientes/${project.customer.id}` as Route}
                  className="text-brand-600 hover:text-brand-700"
                >
                  {project.customer.name}
                </Link>
              </span>
            )}
            {project.address && (
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" />
                {project.address}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/obras/${project.id}/editar` as Route}
            className="inline-flex items-center gap-1.5 rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm font-medium text-ink-700 hover:bg-ink-50"
          >
            <Pencil className="h-4 w-4" />
            Editar datos
          </Link>
          <DeleteProjectButton id={project.id} code={project.code ?? "obra"} />
        </div>
      </div>

      {/* Indicadores */}
      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Contratado" value={formatCurrency(project.contract_value)} icon={Wallet} tone="brand" />
        <StatCard label="Coste estimado" value={formatCurrency(eco.cost)} icon={Coins} tone="ink" />
        <StatCard
          label="Margen estimado"
          value={formatCurrency(eco.marginEur)}
          hint={`${eco.marginPct.toFixed(1)}%`}
          icon={TrendingUp}
          tone="green"
        />
        <StatCard label="Avance" value={`${Math.round(progress)}%`} icon={Percent} tone="blue" />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Avance de obra */}
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader title="Avance de la obra" />
            <div className="border-b border-ink-100 p-4">
              <div className="flex items-center gap-3">
                <ProgressBar value={progress} className="flex-1" />
                <span className="text-sm font-semibold text-ink-800">{Math.round(progress)}%</span>
              </div>
            </div>

            {chapters.length === 0 ? (
              <p className="p-6 text-center text-sm text-ink-400">
                Esta obra no tiene partidas todavía.
              </p>
            ) : (
              chapters.map((ch) => {
                const items = (ch.items ?? []) as ProjectItem[];
                const chProg = projectProgress(items);
                return (
                  <div key={ch.id}>
                    <div className="flex items-center justify-between gap-3 bg-ink-50 px-4 py-2">
                      <span className="text-sm font-semibold text-ink-800">
                        {ch.code && <span className="mr-2 text-ink-400">{ch.code}</span>}
                        {ch.name}
                      </span>
                      <div className="flex w-40 items-center gap-2">
                        <ProgressBar value={chProg} className="flex-1" />
                        <span className="text-xs text-ink-500">{Math.round(chProg)}%</span>
                      </div>
                    </div>
                    {items.map((it) => (
                      <ProjectItemProgress key={it.id} projectId={project.id} item={it} />
                    ))}
                  </div>
                );
              })
            )}
          </Card>
        </div>

        {/* Lateral: estado + datos */}
        <div className="space-y-5">
          <Card>
            <div className="p-4">
              <ProjectStatusSelect projectId={project.id} status={project.status} />
            </div>
          </Card>

          <Card>
            <CardHeader title="Datos de la obra" />
            <dl className="space-y-3 p-4 text-sm">
              <Row label="Inicio previsto" value={formatDate(project.start_planned)} />
              <Row label="Fin previsto" value={formatDate(project.end_planned)} />
              <Row label="Inicio real" value={formatDate(project.start_real)} />
              <Row label="Fin real" value={formatDate(project.end_real)} />
            </dl>
            {project.notes && (
              <div className="border-t border-ink-100 p-4">
                <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-ink-400">
                  Notas
                </p>
                <p className="whitespace-pre-wrap text-sm text-ink-700">{project.notes}</p>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Mano de obra / Horas */}
      <div className="mt-5">
        <ProjectLabor
          projectId={project.id}
          entries={timeEntries}
          employees={employeeOptions}
          items={itemOptions}
        />
      </div>

      {/* Compras / Materiales */}
      <div className="mt-5">
        <Card>
          <CardHeader
            title="Compras / Materiales"
            action={
              <Link
                href={"/compras/nueva" as Route}
                className="inline-flex items-center gap-1.5 rounded-lg border border-ink-200 bg-white px-3 py-1.5 text-sm font-medium text-ink-700 hover:bg-ink-50"
              >
                <Plus className="h-4 w-4" /> Nueva compra
              </Link>
            }
          />
          <div className="border-b border-ink-100 px-4 py-2.5 text-sm text-ink-600">
            Coste real de materiales (compras):{" "}
            <strong className="text-ink-900">{formatCurrency(materialCost)}</strong>
          </div>
          {purchases.length === 0 ? (
            <p className="px-6 py-6 text-center text-sm text-ink-400">
              Sin compras registradas para esta obra.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-sm">
                <thead>
                  <tr className="border-b border-ink-100 text-left text-xs uppercase tracking-wider text-ink-500">
                    <th className="px-4 py-2 font-semibold">Material</th>
                    <th className="px-4 py-2 font-semibold">Proveedor</th>
                    <th className="px-4 py-2 text-right font-semibold">Total</th>
                    <th className="px-4 py-2 font-semibold">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {purchases.map((p) => {
                    const si = purchaseStatusInfo(p.status);
                    return (
                      <tr key={p.id} className="border-b border-ink-50 last:border-0 hover:bg-ink-50">
                        <td className="px-4 py-2">
                          <Link
                            href={`/compras/${p.id}/editar` as Route}
                            className="text-ink-800 hover:text-brand-700"
                          >
                            {p.material}
                          </Link>
                        </td>
                        <td className="px-4 py-2 text-ink-600">{p.supplier?.name || "—"}</td>
                        <td className="px-4 py-2 text-right font-medium text-ink-800">
                          {formatCurrency(purchaseTotals(p).total)}
                        </td>
                        <td className="px-4 py-2">
                          <Badge tone={si.tone}>{si.label}</Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      {/* Documentación de proveedores (operaciones documentales) */}
      <div className="mt-5">
        <Card>
          <CardHeader title="Documentación de proveedores" />
          <OperationsTable operations={operations} show="proveedor" />
        </Card>
      </div>

      {/* Conversaciones / Seguimiento con proveedores */}
      <div className="mt-5">
        <Card>
          <CardHeader title={`Conversaciones / Seguimiento (${conversations.length})`} />
          {conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-6 py-8 text-center">
              <MessageSquare className="h-8 w-8 text-ink-300" />
              <p className="mt-2 text-sm text-ink-400">
                No hay conversaciones vinculadas a esta obra. Créalas desde la ficha de un proveedor
                y selecciona esta obra.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-ink-100">
              {conversations.map((c) => (
                <li key={c.id}>
                  <Link
                    href={`/proveedores/${c.supplier_id}/conversaciones/${c.id}` as Route}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-ink-50"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium text-ink-900">{c.subject}</span>
                        {c.status === "cerrada" && <Badge tone="ink">Cerrada</Badge>}
                        {c.supplier && (
                          <span className="inline-flex items-center gap-1 text-xs text-ink-500">
                            <Building2 className="h-3 w-3" />
                            {c.supplier.name}
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-xs text-ink-400">
                        {c.notes_count ?? 0} nota{(c.notes_count ?? 0) === 1 ? "" : "s"} · Última
                        actividad: {formatDateTime(c.last_activity_at)}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 shrink-0 text-ink-300" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-ink-500">{label}</dt>
      <dd className="font-medium text-ink-800">{value}</dd>
    </div>
  );
}
