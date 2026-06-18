import { error, fail } from '@sveltejs/kit';
import { randomUUID } from 'node:crypto';
import { superuserPb } from '$lib/server/pocketbase.js';
import { loadTripByShareToken } from '$lib/server/loadTrip.js';

export async function load({ params }) {
  const data = await loadTripByShareToken(params.share_token);
  return data;
}

export const actions = {
  // Claim a name on this trip. Name IS the identity: if someone with that name
  // (case-insensitive) is already on the trip, you become them; otherwise you're
  // added as a new participant. This makes the flow "just type your name" and
  // prevents accidental duplicates (typing a pre-seeded name links to it).
  join: async ({ request, params }) => {
    const fd = await request.formData();
    const display_name = String(fd.get('display_name') ?? '').trim();

    if (!display_name) return fail(400, { joinError: 'Enter a name to join.' });
    if (display_name.length > 80) return fail(400, { joinError: 'That name is too long.' });

    const pb = await superuserPb();

    let trip;
    try {
      trip = await pb
        .collection('trips')
        .getFirstListItem(pb.filter('share_token = {:t}', { t: params.share_token }));
    } catch (/** @type {any} */ err) {
      if (err?.status === 404) throw error(404, 'Trip not found');
      throw error(502, 'Could not reach the trip backend');
    }

    try {
      const all = await pb
        .collection('participants')
        .getFullList({ filter: pb.filter('trip = {:t}', { t: trip.id }) });
      const existing = all.find(
        (p) => p.display_name.trim().toLowerCase() === display_name.toLowerCase()
      );
      if (existing) {
        return { joined: { id: existing.id, display_name: existing.display_name } };
      }
      const p = await pb
        .collection('participants')
        .create({ trip: trip.id, display_name, client_id: randomUUID() });
      return { joined: { id: p.id, display_name: p.display_name } };
    } catch (/** @type {any} */ err) {
      return fail(502, { joinError: 'Could not join right now — please try again.' });
    }
  }
};
