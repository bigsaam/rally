import { error } from '@sveltejs/kit';
import { createServerPb } from '$lib/server/pocketbase.js';
import { loadTripByShareToken } from '$lib/server/loadTrip.js';

export async function load({ params, url }) {
  const ownerToken = url.searchParams.get('owner') ?? '';

  // Verify the owner token before granting owner mode. The token is the
  // capability; a missing/wrong token is a 403, not a redirect, so it is clear
  // the link is what's wrong. (Collection-rule hardening is step 9.)
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

  if (!ownerToken || ownerToken !== trip.owner_token) {
    throw error(403, 'That owner link is invalid for this trip.');
  }

  const data = await loadTripByShareToken(params.share_token);
  return { ...data, ownerMode: true };
}
