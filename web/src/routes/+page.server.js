import { superuserPb } from '$lib/server/pocketbase.js';
import { loadUserTrips } from '$lib/server/dashboard.js';

// Signed in → dashboard of your trips. Logged out → marketing landing.
/** @type {import('./$types').PageServerLoad} */
export async function load({ locals }) {
  if (!locals.user) return { trips: null };
  const pb = await superuserPb();
  const trips = await loadUserTrips(pb, locals.user.id);
  return { trips };
}
