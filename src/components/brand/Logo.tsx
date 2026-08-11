type LogoProps = {
  /** Muestra el texto "ARKAN" junto al símbolo. */
  showText?: boolean;
  /** Variante de color del texto (claro para fondos oscuros). */
  variant?: "light" | "dark";
  className?: string;
};

/**
 * Logo de ARKAN Reformas: símbolo (tejado + "A") + texto.
 * Identidad propia, no imita ninguna marca existente.
 */
export function Logo({ showText = true, variant = "light", className = "" }: LogoProps) {
  const textColor = variant === "light" ? "text-white" : "text-ink-900";
  const subColor = variant === "light" ? "text-ink-400" : "text-ink-500";

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 shadow-sm">
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
          <path d="M12 3 3 10h2v9h5v-6h4v6h5v-9h2z" fill="white" />
        </svg>
      </div>
      {showText && (
        <div className="leading-none">
          <div className={`text-lg font-bold tracking-tight ${textColor}`}>ARKAN</div>
          <div className={`text-[10px] font-medium uppercase tracking-[0.18em] ${subColor}`}>
            Reformas
          </div>
        </div>
      )}
    </div>
  );
}
