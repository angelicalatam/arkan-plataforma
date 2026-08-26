import Link from "next/link";
import type { Route } from "next";
import { notFound } from "next/navigation";
import { ArrowLeft, Building2, HardHat, CalendarClock, MessageSquare } from "lucide-react";
import { getConversation } from "@/lib/conversations/queries";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatDateTime } from "@/lib/format";
import { AddNote } from "./AddNote";
import { NoteItem } from "./NoteItem";
import { ConversationActions } from "./ConversationActions";

export default async function ConversacionPage({
  params,
}: {
  params: Promise<{ id: string; convId: string }>;
}) {
  const { id: supplierId, convId } = await params;
  const conv = await getConversation(convId);
  if (!conv) notFound();

  const notes = conv.notes ?? [];

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href={`/proveedores/${supplierId}` as Route}
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-800"
      >
        <ArrowLeft className="h-4 w-4" />
        {conv.supplier?.name ?? "Proveedor"}
      </Link>

      {/* Cabecera */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-ink-900">{conv.subject}</h1>
            <Badge tone={conv.status === "abierta" ? "green" : "ink"}>
              {conv.status === "abierta" ? "Abierta" : "Cerrada"}
            </Badge>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink-500">
            {conv.supplier && (
              <span className="inline-flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5" />
                <Link
                  href={`/proveedores/${conv.supplier.id}` as Route}
                  className="text-brand-600 hover:text-brand-700"
                >
                  {conv.supplier.name}
                </Link>
              </span>
            )}
            {conv.project && (
              <span className="inline-flex items-center gap-1.5">
                <HardHat className="h-3.5 w-3.5" />
                <Link
                  href={`/obras/${conv.project.id}` as Route}
                  className="text-brand-600 hover:text-brand-700"
                >
                  {conv.project.name || "Obra"}
                </Link>
              </span>
            )}
            <span className="inline-flex items-center gap-1.5">
              <CalendarClock className="h-3.5 w-3.5" />
              Última actividad: {formatDateTime(conv.last_activity_at)}
            </span>
          </div>
        </div>
        <ConversationActions
          conversationId={conv.id}
          supplierId={supplierId}
          status={conv.status}
        />
      </div>

      {/* Historial de notas */}
      <Card>
        <CardHeader title={`Historial de notas (${notes.length})`} />
        <div className="border-b border-ink-100 p-4">
          <AddNote conversationId={conv.id} supplierId={supplierId} />
        </div>
        <div className="p-4">
          {notes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <MessageSquare className="h-8 w-8 text-ink-300" />
              <p className="mt-2 text-sm text-ink-400">
                Aún no hay notas. Añade la primera con “Añadir nota”.
              </p>
            </div>
          ) : (
            <ul className="space-y-5">
              {notes.map((n) => (
                <NoteItem key={n.id} note={n} conversationId={conv.id} supplierId={supplierId} />
              ))}
            </ul>
          )}
        </div>
      </Card>
    </div>
  );
}
