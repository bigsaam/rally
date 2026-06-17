// Auto-generate meal slots from a trip's date range. Per the data model, slots
// are generated at creation and can be edited later (build-sequence step 6).
// Breakfast / Lunch / Dinner for each day, inclusive of both endpoints.

const MEALS = ['Breakfast', 'Lunch', 'Dinner'];

/**
 * PocketBase stores dates as "YYYY-MM-DD 00:00:00.000Z".
 * @param {Date} d
 */
function toPbDate(d) {
  return `${d.toISOString().slice(0, 10)} 00:00:00.000Z`;
}

/**
 * @param {string | null | undefined} startDate  "YYYY-MM-DD"
 * @param {string | null | undefined} endDate    "YYYY-MM-DD"
 * @returns {Array<{ label: string, date: string, sort_order: number }>}
 */
export function generateSlotsFromDates(startDate, endDate) {
  if (!startDate) return [];
  const start = new Date(`${startDate}T00:00:00Z`);
  const end = endDate ? new Date(`${endDate}T00:00:00Z`) : start;
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) {
    return [];
  }

  // Guard against an accidentally huge range producing thousands of rows.
  const MAX_DAYS = 60;
  const slots = [];
  let order = 0;
  const cursor = new Date(start);
  for (let day = 0; day <= MAX_DAYS && cursor <= end; day++) {
    const weekday = cursor.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' });
    for (const meal of MEALS) {
      slots.push({ label: `${weekday} ${meal}`, date: toPbDate(cursor), sort_order: order++ });
    }
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return slots;
}
