import { error, fail, redirect } from '@sveltejs/kit';
import { superuserPb } from '$lib/server/pocketbase.js';
import { loadTripByShareToken } from '$lib/server/loadTrip.js';
import { getMembership, joinTrip, listOrphans, claimParticipant } from '$lib/server/membership.js';
import { tripTeaser } from '$lib/server/teaser.js';

/**
 * Resolve a trip row by share token, or throw the right HTTP error.
 * @param {any} pb superuser client
 * @param {string} shareToken
 */
async function fetchTrip(pb, shareToken) {
  try {
    return await pb
      .collection('trips')
      .getFirstListItem(pb.filter('share_token = {:t}', { t: shareToken }));
  } catch (/** @type {any} */ err) {
    if (err?.status === 404) throw error(404, 'Trip not found');
    throw error(502, 'Could not reach the trip backend');
  }
}

export async function load({ params, locals }) {
  const pb = await superuserPb();
  const trip = await fetchTrip(pb, params.share_token);

  // Not signed in → public teaser only (name + short description).
  if (!locals.user) {
    return { teaser: true, trip: tripTeaser(trip) };
  }

  // Signed in but not a member → invite screen (one tap to join, or claim an
  // existing name-only entry so signing in doesn't create a duplicate).
  const membership = await getMembership(pb, trip.id, locals.user.id);
  if (!membership) {
    return { invite: true, trip: tripTeaser(trip), orphans: await listOrphans(pb, trip.id) };
  }

  // Member → full trip. Surface any unclaimed entries so a member who came in
  // under a fresh account can still merge into their pre-auth name.
  const data = await loadTripByShareToken(params.share_token);
  return {
    ...data,
    membership: { participantId: membership.id, role: membership.role || 'guest' },
    isOrganizer: membership.role === 'organizer',
    orphans: await listOrphans(pb, trip.id)
  };
}

export const actions = {
  // Become a member of this trip. Requires being signed in; the invite link is
  // the capability to join.
  join: async ({ params, locals }) => {
    if (!locals.user) {
      throw redirect(303, `/login?next=${encodeURIComponent('/' + params.share_token)}`);
    }
    const pb = await superuserPb();
    const trip = await fetchTrip(pb, params.share_token);
    try {
      await joinTrip(pb, trip, locals.user);
    } catch (/** @type {any} */ e) {
      return fail(502, { joinError: 'Could not join right now — please try again.' });
    }
    return { joined: true };
  },

  // Claim an existing name-only participant as yourself (merges any dup).
  claim: async ({ request, params, locals }) => {
    if (!locals.user) {
      throw redirect(303, `/login?next=${encodeURIComponent('/' + params.share_token)}`);
    }
    const fd = await request.formData();
    const orphanId = String(fd.get('participantId') ?? '');
    if (!orphanId) return fail(400, { claimError: 'Pick who you are.' });

    const pb = await superuserPb();
    const trip = await fetchTrip(pb, params.share_token);
    try {
      await claimParticipant(pb, trip, locals.user, orphanId);
    } catch (/** @type {any} */ e) {
      return fail(400, { claimError: e?.message || 'Could not claim that name.' });
    }
    return { claimed: true };
  }
};
