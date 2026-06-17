import { error, fail } from '@sveltejs/kit';
import { randomUUID } from 'node:crypto';
import { createServerPb } from '$lib/server/pocketbase.js';
import { loadTripByShareToken } from '$lib/server/loadTrip.js';

export async function load({ params }) {
  const data = await loadTripByShareToken(params.share_token);
  return data;
}

export const actions = {
  // Claim a name on this trip. Idempotent per browser: if a participant already
  // exists for (trip, client_id) we return it instead of creating a duplicate
  // (handles cleared identity-mapping but persisted client_id, and double-submit).
  join: async ({ request, params }) => {
    const fd = await request.formData();
    const display_name = String(fd.get('display_name') ?? '').trim();
    let client_id = String(fd.get('client_id') ?? '').trim();

    if (!display_name) return fail(400, { joinError: 'Enter a name to join.' });
    if (display_name.length > 80) return fail(400, { joinError: 'That name is too long.' });

    const pb = createServerPb();

    let trip;
    try {
      trip = await pb
        .collection('trips')
        .getFirstListItem(pb.filter('share_token = {:t}', { t: params.share_token }));
    } catch (/** @type {any} */ err) {
      if (err?.status === 404) throw error(404, 'Trip not found');
      throw error(502, 'Could not reach the trip backend');
    }

    // localStorage holds the client_id; fall back to a server id for no-JS so
    // the participant is still created (just won't be remembered on the device).
    if (!client_id) client_id = randomUUID();

    try {
      const existing = await pb
        .collection('participants')
        .getFirstListItem(pb.filter('trip = {:tr} && client_id = {:c}', { tr: trip.id, c: client_id }));
      return { joined: { id: existing.id, display_name: existing.display_name } };
    } catch (_) {
      // none yet — create below
    }

    try {
      const p = await pb
        .collection('participants')
        .create({ trip: trip.id, display_name, client_id });
      return { joined: { id: p.id, display_name: p.display_name } };
    } catch (/** @type {any} */ err) {
      return fail(502, { joinError: 'Could not join right now — please try again.' });
    }
  }
};
