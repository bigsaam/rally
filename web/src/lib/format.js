/**
 * Format an ISO/PB date string as e.g. "Fri, Jul 17". Returns '' on empty.
 * @param {string | null | undefined} value
 */
export function fmtDate(value) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC'
  });
}

/**
 * Full weekday, e.g. "Friday". Returns '' on empty.
 * @param {string | null | undefined} value
 */
export function fmtWeekday(value) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', { weekday: 'long', timeZone: 'UTC' });
}

/**
 * "Jun 19" — month + day, no weekday. Returns '' on empty.
 * @param {string | null | undefined} value
 */
export function fmtMonthDay(value) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
}

/** Trip-type → emoji tile (the sticky header + trip-card glyph). Mirrors the
 * type picker in PlanningView; falls back to the compass. */
const TRIP_EMOJI = {
  camping: '🏕️',
  backpacking: '🎒',
  road_trip: '🚗',
  cabin: '🛖',
  ski: '⛷️',
  beach: '🏖️',
  city: '🏙️',
  festival: '🎪',
  other: '🧭'
};

/**
 * Emoji for a trip type (default 🧭).
 * @param {string | null | undefined} type
 */
export function tripEmoji(type) {
  return (type && TRIP_EMOJI[/** @type {keyof typeof TRIP_EMOJI} */ (type)]) || '🧭';
}

/**
 * Whole-day count for an inclusive date range (e.g. Fri–Sun = 3 days, 2 nights).
 * @param {string | null | undefined} start
 * @param {string | null | undefined} end
 * @returns {{ days: number, nights: number }}
 */
export function tripLength(start, end) {
  if (!start) return { days: 0, nights: 0 };
  const s = new Date(start);
  const e = end ? new Date(end) : s;
  if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) return { days: 0, nights: 0 };
  const ms = Date.UTC(e.getUTCFullYear(), e.getUTCMonth(), e.getUTCDate()) -
    Date.UTC(s.getUTCFullYear(), s.getUTCMonth(), s.getUTCDate());
  const nights = Math.max(0, Math.round(ms / 86400000));
  return { days: nights + 1, nights };
}

/**
 * Inclusive list of days in a trip, as `{ iso, weekday, monthDay }` rows for the
 * Dates module day-plan. Capped to avoid runaway ranges.
 * @param {string | null | undefined} start
 * @param {string | null | undefined} end
 */
export function tripDays(start, end) {
  if (!start) return [];
  const s = new Date(start);
  const e = end ? new Date(end) : s;
  if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) return [];
  /** @type {Array<{ iso: string, weekday: string, monthDay: string }>} */
  const out = [];
  const cur = new Date(Date.UTC(s.getUTCFullYear(), s.getUTCMonth(), s.getUTCDate()));
  const last = Date.UTC(e.getUTCFullYear(), e.getUTCMonth(), e.getUTCDate());
  for (let i = 0; i < 60 && cur.getTime() <= last; i++) {
    const iso = cur.toISOString();
    out.push({ iso, weekday: fmtWeekday(iso), monthDay: fmtMonthDay(iso) });
    cur.setUTCDate(cur.getUTCDate() + 1);
  }
  return out;
}

/**
 * "Jul 17 – 19, 2026" style range for the trip header.
 * @param {string | null | undefined} start
 * @param {string | null | undefined} end
 */
export function fmtDateRange(start, end) {
  const s = start ? new Date(start) : null;
  const e = end ? new Date(end) : null;
  /** @type {Intl.DateTimeFormatOptions} */
  const opts = { month: 'short', day: 'numeric', timeZone: 'UTC' };
  if (s && e) {
    const sameMonth =
      s.getUTCMonth() === e.getUTCMonth() && s.getUTCFullYear() === e.getUTCFullYear();
    const left = s.toLocaleDateString('en-US', opts);
    const right = sameMonth
      ? e.toLocaleDateString('en-US', { day: 'numeric', timeZone: 'UTC' })
      : e.toLocaleDateString('en-US', opts);
    return `${left} – ${right}, ${e.getUTCFullYear()}`;
  }
  if (s) return s.toLocaleDateString('en-US', { ...opts, year: 'numeric' });
  return '';
}
