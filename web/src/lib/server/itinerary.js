// Pure shaping for the itinerary timeline (#18 + the contextual half of #17).
//
// Turns raw PocketBase rows (items, options, votes) into the serializable list the
// ItinerarySection renders: each item carries its options with vote tallies, the
// voter names, the viewer's single pick, and the locked-in winning option. Kept
// dependency-free so it's unit-testable without a DB (see itinerary.test.js); the
// async loads live in loadTrip.js.

/** @param {string|undefined|null} d a PB datetime → "YYYY-MM-DD" */
const dateOnly = (d) => String(d ?? '').slice(0, 10);

/**
 * @param {Array<any>} items   itinerary_items rows (carry trip, date, time, label, sort_order, created_by, picked_option)
 * @param {Array<any>} options itinerary_options rows (carry itinerary_item, label, url, sort_order, created_by)
 * @param {Array<any>} votes   itinerary_votes rows (carry itinerary_option, participant)
 * @param {Record<string,string>} nameById  participant id → display name
 * @param {string|null} myParticipantId     the viewer's participant (for `mine` / `myVote`)
 */
export function shapeItinerary(items, options, votes, nameById, myParticipantId) {
  // option id → its parent item id (so a vote can find its item for single-choice).
  /** @type {Record<string,string>} */
  const itemOfOption = {};
  for (const o of options) itemOfOption[o.id] = o.itinerary_item;

  // option id → { count, voters[], mine }
  /** @type {Record<string, { count: number, voters: string[], mine: boolean }>} */
  const tally = {};
  for (const o of options) tally[o.id] = { count: 0, voters: [], mine: false };
  // item id → the viewer's chosen option (single-choice per item).
  /** @type {Record<string,string>} */
  const myVoteByItem = {};
  for (const v of votes) {
    const t = tally[v.itinerary_option];
    if (!t) continue; // vote for a deleted option
    t.count++;
    t.voters.push(nameById[v.participant] ?? 'Someone');
    if (myParticipantId && v.participant === myParticipantId) {
      t.mine = true;
      const itemId = itemOfOption[v.itinerary_option];
      if (itemId) myVoteByItem[itemId] = v.itinerary_option;
    }
  }

  // options grouped under their item, in sort order.
  /** @type {Record<string, any[]>} */
  const optsByItem = {};
  for (const o of options) (optsByItem[o.itinerary_item] ??= []).push(o);
  for (const list of Object.values(optsByItem)) {
    list.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
  }

  const shaped = items.map((it) => ({
    id: it.id,
    date: dateOnly(it.date),
    time: it.time || '',
    label: it.label || '',
    sortOrder: it.sort_order ?? 0,
    createdBy: it.created_by || null,
    createdByName: it.created_by ? (nameById[it.created_by] ?? 'Someone') : null,
    pickedOption: it.picked_option || null,
    myVote: myVoteByItem[it.id] ?? null,
    options: (optsByItem[it.id] ?? []).map((o) => ({
      id: o.id,
      label: o.label || '',
      url: o.url || '',
      createdBy: o.created_by || null,
      votes: tally[o.id].count,
      voters: tally[o.id].voters,
      mine: tally[o.id].mine
    }))
  }));

  // Dated items first (chronological, then sort_order); undated "to decide" last.
  shaped.sort((a, b) => {
    if (!a.date && !b.date) return a.sortOrder - b.sortOrder;
    if (!a.date) return 1;
    if (!b.date) return -1;
    return a.date === b.date ? a.sortOrder - b.sortOrder : a.date < b.date ? -1 : 1;
  });
  return shaped;
}

export { dateOnly };
