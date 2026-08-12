import {
  Phone,
  MessageCircle,
  Mail,
  Users,
  MapPin,
  StickyNote,
  type LucideIcon,
} from "lucide-react";
import type { Activity, ActivityType } from "@/lib/crm/types";
import { formatDateTime } from "@/lib/format";

const ICONS: Record<ActivityType, LucideIcon> = {
  llamada: Phone,
  whatsapp: MessageCircle,
  email: Mail,
  reunion: Users,
  visita: MapPin,
  nota: StickyNote,
};

const LABELS: Record<ActivityType, string> = {
  llamada: "Llamada",
  whatsapp: "WhatsApp",
  email: "Email",
  reunion: "Reunión",
  visita: "Visita",
  nota: "Nota",
};

export function ActivityTimeline({ activities }: { activities: Activity[] }) {
  if (activities.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-ink-400">
        Aún no hay actividades registradas.
      </p>
    );
  }

  return (
    <ul className="space-y-4">
      {activities.map((a) => {
        const Icon = ICONS[a.type] ?? StickyNote;
        return (
          <li key={a.id} className="flex gap-3">
            <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-ink-100 text-ink-600">
              <Icon className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-sm font-medium text-ink-900">
                  {a.subject || LABELS[a.type]}
                </span>
                <span className="shrink-0 text-xs text-ink-400">
                  {formatDateTime(a.created_at)}
                </span>
              </div>
              <span className="text-xs uppercase tracking-wide text-ink-400">
                {LABELS[a.type]}
              </span>
              {a.body && <p className="mt-1 text-sm text-ink-600">{a.body}</p>}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
