type Tone = "brand" | "ink" | "green" | "amber" | "red" | "blue";

const toneStyles: Record<Tone, string> = {
  brand: "bg-brand-50 text-brand-700 ring-brand-200",
  ink: "bg-ink-100 text-ink-700 ring-ink-200",
  green: "bg-green-50 text-green-700 ring-green-200",
  amber: "bg-amber-50 text-amber-700 ring-amber-200",
  red: "bg-red-50 text-red-700 ring-red-200",
  blue: "bg-blue-50 text-blue-700 ring-blue-200",
};

export function Badge({
  children,
  tone = "ink",
}: {
  children: React.ReactNode;
  tone?: Tone;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${toneStyles[tone]}`}
    >
      {children}
    </span>
  );
}

/** Normaliza el color guardado en crm_stages a un tono válido del Badge. */
export function stageTone(color: string | null | undefined): Tone {
  const valid: Tone[] = ["brand", "ink", "green", "amber", "red", "blue"];
  return (valid as string[]).includes(color ?? "") ? (color as Tone) : "ink";
}
