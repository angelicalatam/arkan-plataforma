import { Star } from "lucide-react";

export function StarRating({
  value,
  size = 16,
}: {
  value: number | null | undefined;
  size?: number;
}) {
  const v = value ?? 0;
  return (
    <span className="inline-flex items-center gap-0.5" title={v ? `${v} de 5` : "Sin valorar"}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          style={{ width: size, height: size }}
          className={i <= Math.round(v) ? "fill-amber-400 text-amber-400" : "text-ink-300"}
        />
      ))}
    </span>
  );
}
