import type { LucideIcon } from "lucide-react";
import { PageHeader } from "./PageHeader";
import { EmptyState } from "./EmptyState";

type ModulePlaceholderProps = {
  title: string;
  description: string;
  icon: LucideIcon;
  phase: string;
};

/**
 * Página temporal para módulos aún no desarrollados.
 * Indica en qué fase del proyecto se construirá.
 */
export function ModulePlaceholder({ title, description, icon, phase }: ModulePlaceholderProps) {
  return (
    <div>
      <PageHeader title={title} description={description} />
      <EmptyState
        icon={icon}
        title="Este módulo se construirá pronto"
        description={`Forma parte de la ${phase}. La estructura de navegación ya está lista; el contenido llegará al desarrollar esa fase.`}
      >
        <span className="inline-flex items-center rounded-full bg-ink-100 px-3 py-1 text-xs font-medium text-ink-600">
          {phase}
        </span>
      </EmptyState>
    </div>
  );
}
