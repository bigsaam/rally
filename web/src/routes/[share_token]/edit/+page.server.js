import { error, redirect } from '@sveltejs/kit';
import { superuserPb } from '$lib/server/pocketbase.js';
import { joinTrip } from '$lib/server/membership.js';

// Legacy owner link → account claim. Pre-auth trips were edited via
// `/<slug>/edit?owner=<token>`. Now that link lets whoever holds it *claim the
// trip to their account* (becoming an organizer) — a migration path and a way
// to add co-organizers. After claiming, everything happens on the normal trip
// page, where organizer powers are unlocked by role.
export async function load({ params, url, locals }) {
  const ownerToken = url.searchParams.get('owner') ?? '';

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

  if (!ownerToken || ownerToken !== trip.owner_token) {
    throw error(403, 'That owner link is invalid for this trip.');
  }

  // Need an account to claim — bounce through login, then return here.
  if (!locals.user) {
    const back = `/${params.share_token}/edit?owner=${encodeURIComponent(ownerToken)}`;
    throw redirect(303, `/login?next=${encodeURIComponent(back)}`);
  }

  // First claimer becomes the creator; anyone with the owner link becomes an
  // organizer (supports co-organizers).
  if (!trip.created_by) {
    await pb.collection('trips').update(trip.id, { created_by: locals.user.id });
    trip.created_by = locals.user.id;
  }
  const m = await joinTrip(pb, trip, locals.user);
  if (m.role !== 'organizer') {
    await pb.collection('participants').update(m.id, { role: 'organizer' });
  }

  throw redirect(303, `/${params.share_token}`);
}
