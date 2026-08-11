import type { LucideIcon } from "lucide-react";

type Tone = "brand" | "ink" | "green" | "amber" | "red" | "blue";

const toneStyles: Record<Tone, { bg: string; text: string }> = {
  brand: { bg: "bg-brand-50", text: "text-brand-600" },
  ink: { bg: "bg-ink-100", text: "text-ink-600" },
  green: { bg: "bg-green-50", text: "text-green-600" },
  amber: { bg: "bg-amber-50", text: "text-amber-600" },
  red: { bg: "bg-red-50", text: "text-red-600" },
  blue: { bg: "bg-blue-50", text: "text-blue-600" },
};

type StatCardProps = {
  label: string;
  value: string | number;
  icon: LucideIcon;
  hint?: string;
  tone?: Tone;
};

export function StatCard({ label, value, icon: Icon, hint, tone = "ink" }: StatCardProps) {
  const style = toneStyles[tone];
  return (
    <div className="rounded-xl border border-ink-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-ink-500">{label}</p>
          <p className="mt-1.5 text-2xl font-bold tracking-tight text-ink-900">{value}</p>
          {hint && <p className="mt-1 text-xs text-ink-400">{hint}</p>}
        </div>
        <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg ${style.bg}`}>
          <Icon className={`h-5 w-5 ${style.text}`} />
        </div>
      </div>
    </div>
  );
}
