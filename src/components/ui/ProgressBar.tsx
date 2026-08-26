export function ProgressBar({
  value,
  className = "",
}: {
  value: number;
  className?: string;
}) {
  const pct = Math.max(0, Math.min(100, Math.round(value)));
  const color = pct >= 100 ? "bg-green-500" : pct > 0 ? "bg-brand-500" : "bg-ink-300";
  return (
    <div className={`h-2 w-full overflow-hidden rounded-full bg-ink-100 ${className}`}>
      <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
    </div>
  );
}
