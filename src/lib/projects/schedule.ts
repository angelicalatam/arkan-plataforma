/**
 * Reparto automático del cronograma de una obra.
 *
 * Reparte las partidas, en orden, a lo largo de la ventana de la obra
 * (fecha de inicio → fecha de fin), dando a cada una una duración
 * proporcional a su peso (importe). Si una partida tiene fechas guardadas
 * a mano, se respetan esas (auto = false).
 */

export type ScheduleItemInput = {
  id: string;
  weight: number; // importe de la partida (para repartir la duración)
  planned_start: string | null;
  planned_end: string | null;
};

export type ScheduleSlot = {
  start: string; // YYYY-MM-DD
  end: string; // YYYY-MM-DD
  auto: boolean; // true = calculada automáticamente; false = fijada a mano
};

const DAY = 86400000;

export function toMs(d: string): number {
  const [y, m, dd] = d.split("-").map(Number);
  return Date.UTC(y, (m || 1) - 1, dd || 1);
}

export function fromMs(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

export function daysBetween(a: string, b: string): number {
  return Math.round((toMs(b) - toMs(a)) / DAY);
}

/** Devuelve un mapa id → { start, end, auto } para todas las partidas. */
export function computeSchedule(
  items: ScheduleItemInput[],
  windowStart: string,
  windowEnd: string,
): Map<string, ScheduleSlot> {
  const result = new Map<string, ScheduleSlot>();
  const startMs = toMs(windowStart);
  const endMs = toMs(windowEnd);
  const spanDays = Math.max(1, Math.round((endMs - startMs) / DAY));

  const totalWeight = items.reduce((s, it) => s + Math.max(0, Number(it.weight) || 0), 0);
  const useEqual = totalWeight <= 0;
  const effTotal = useEqual ? items.length || 1 : totalWeight;

  let cum = 0;
  for (const it of items) {
    const w = useEqual ? 1 : Math.max(0, Number(it.weight) || 0);
    const startFrac = cum / effTotal;
    cum += w;
    const endFrac = cum / effTotal;

    if (it.planned_start && it.planned_end) {
      result.set(it.id, { start: it.planned_start, end: it.planned_end, auto: false });
      continue;
    }

    const s = startMs + Math.round(startFrac * spanDays) * DAY;
    let e = startMs + Math.round(endFrac * spanDays) * DAY;
    if (e < s) e = s; // al menos un día
    result.set(it.id, {
      start: it.planned_start ?? fromMs(s),
      end: it.planned_end ?? fromMs(e),
      auto: !(it.planned_start && it.planned_end),
    });
  }
  return result;
}

/** Posición y ancho (%) de una barra dentro de la ventana de la obra. */
export function barPosition(
  start: string,
  end: string,
  windowStart: string,
  windowEnd: string,
): { left: number; width: number } {
  const s = toMs(windowStart);
  const e = toMs(windowEnd);
  const span = Math.max(1, e - s);
  const left = Math.max(0, Math.min(100, ((toMs(start) - s) / span) * 100));
  const rawWidth = ((toMs(end) - toMs(start)) / span) * 100;
  const width = Math.max(1.5, Math.min(100 - left, rawWidth));
  return { left, width };
}

/**
 * Avance previsto a día de hoy según el cronograma (ponderado por importe):
 * para cada partida, qué fracción de su duración ha transcurrido.
 */
export function expectedProgress(
  items: { weight: number; slot: ScheduleSlot }[],
  today: string,
): number {
  let weight = 0;
  let acc = 0;
  const t = toMs(today);
  for (const { weight: w0, slot } of items) {
    const w = Math.max(0, Number(w0) || 0) || 1;
    const s = toMs(slot.start);
    const e = toMs(slot.end);
    const frac = e <= s ? (t >= e ? 1 : 0) : Math.max(0, Math.min(1, (t - s) / (e - s)));
    weight += w;
    acc += w * frac * 100;
  }
  return weight > 0 ? acc / weight : 0;
}
