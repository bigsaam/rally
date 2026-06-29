// Instance admin identity. tripwala has no admin role today (only per-trip
// organizer/guest), but app-wide config — the Immich connection — must be
// editable by exactly one person: whoever runs this instance.
//
// Convention: the admin is the FIRST user who signed up (the deployer sets up
// the instance, then invites friends). An optional ADMIN_EMAIL env var overrides
// that when you want to pin it explicitly (e.g. after inviting others first).

import { env } from '$env/dynamic/private';
import { superuserPb } from './pocketbase.js';

/** @typedef {{ id: string, email?: string } | null} MaybeUser */

/**
 * Is this user the instance admin?
 * @param {MaybeUser} user
 * @returns {Promise<boolean>}
 */
export async function isAdmin(user) {
  if (!user?.id) return false;
  const pinned = String(env.ADMIN_EMAIL || '').trim().toLowerCase();
  if (pinned) return String(user.email || '').toLowerCase() === pinned;
  return user.id === (await firstUserId());
}

/** Id of the earliest-created user, or null if there are none. */
async function firstUserId() {
  const pb = await superuserPb();
  const res = await pb.collection('users').getList(1, 1, { sort: 'created' });
  return res.items[0]?.id ?? null;
}
