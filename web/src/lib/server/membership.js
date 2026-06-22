// Membership = a participant row linked to a signed-in user. This is the access
// control primitive for the auth model: you can see/act on a trip only if you
// have a membership; organizer-only powers check `role`.

/**
 * The signed-in user's membership for a trip, or null if they're not a member.
 *
 * @param {import('pocketbase').default} pb superuser client
 * @param {string} tripId
 * @param {string | null | undefined} userId
 */
export async function getMembership(pb, tripId, userId) {
  if (!userId) return null;
  const res = await pb
    .collection('participants')
    .getList(1, 1, { filter: pb.filter('trip = {:t} && user = {:u}', { t: tripId, u: userId }) });
  return res.items[0] ?? null;
}

/**
 * Make the user a member of the trip. If a legacy name-only participant matches
 * their name, adopt it (links account → existing RSVP/claims); otherwise create
 * a fresh participant. The trip creator becomes an organizer.
 *
 * @param {import('pocketbase').default} pb superuser client
 * @param {{ id: string, created_by?: string }} trip
 * @param {{ id: string, name: string, email?: string }} user
 */
export async function joinTrip(pb, trip, user) {
  const existing = await getMembership(pb, trip.id, user.id);
  if (existing) return existing;

  const role = trip.created_by === user.id ? 'organizer' : 'guest';

  // Adopt an unclaimed participant with the same name, so signing in links to
  // the work already done under that name (helps migrate pre-auth trips).
  const name = (user.name || '').trim();
  if (name) {
    const all = await pb
      .collection('participants')
      .getFullList({ filter: pb.filter('trip = {:t}', { t: trip.id }) });
    const orphan = all.find(
      (p) => !p.user && p.display_name.trim().toLowerCase() === name.toLowerCase()
    );
    if (orphan) {
      return pb.collection('participants').update(orphan.id, { user: user.id, role });
    }
  }

  const { randomUUID } = await import('node:crypto');
  return pb.collection('participants').create({
    trip: trip.id,
    user: user.id,
    display_name: name || user.email || 'Guest',
    role,
    client_id: randomUUID()
  });
}

/**
 * Unclaimed (no-account) participants on a trip — candidates someone signing in
 * can claim as "that's me" to avoid a duplicate.
 *
 * @param {import('pocketbase').default} pb superuser client
 * @param {string} tripId
 * @returns {Promise<Array<{ id: string, display_name: string }>>}
 */
export async function listOrphans(pb, tripId) {
  const all = await pb
    .collection('participants')
    .getFullList({ filter: pb.filter('trip = {:t}', { t: tripId }), sort: 'display_name' });
  return all.filter((p) => !p.user).map((p) => ({ id: p.id, display_name: p.display_name }));
}

/**
 * Claim an existing name-only participant as the signed-in user. If the user
 * already has a (freshly auto-created) membership, merge it in: move their
 * gear/meal/packing rows onto the claimed participant, then delete the dup.
 * Throws if the target isn't an unclaimed participant of this trip.
 *
 * @param {import('pocketbase').default} pb superuser client
 * @param {{ id: string, created_by?: string }} trip
 * @param {{ id: string }} user
 * @param {string} orphanId
 */
export async function claimParticipant(pb, trip, user, orphanId) {
  const orphan = await pb.collection('participants').getOne(orphanId);
  if (orphan.trip !== trip.id) throw new Error('Not part of this trip');
  if (orphan.user) throw new Error('That person is already claimed');

  const me = await getMembership(pb, trip.id, user.id);
  const role =
    trip.created_by === user.id || (me && me.role === 'organizer')
      ? 'organizer'
      : orphan.role || 'guest';

  if (me && me.id !== orphan.id) {
    // Move the dup's contributions onto the claimed participant, then remove it.
    for (const coll of ['gear_claims', 'meal_signups', 'packing_items']) {
      const rows = await pb
        .collection(coll)
        .getFullList({ filter: pb.filter('participant = {:p}', { p: me.id }) });
      for (const r of rows) await pb.collection(coll).update(r.id, { participant: orphan.id });
    }
    await pb.collection('participants').update(orphan.id, { user: user.id, role });
    await pb.collection('participants').delete(me.id);
  } else {
    await pb.collection('participants').update(orphan.id, { user: user.id, role });
  }
  return orphan.id;
}
