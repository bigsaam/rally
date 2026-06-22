import { json, error } from '@sveltejs/kit';
import { superuserPb } from '$lib/server/pocketbase.js';
import { getMembership } from '$lib/server/membership.js';

// All trip mutations funnel through here. PocketBase collection rules are locked
// to superuser-only, so the browser cannot write directly — it POSTs an op to
// this endpoint, which (1) resolves the trip from the URL's share_token,
// (2) requires the signed-in user to be a MEMBER of that trip, and (3) verifies
// every target row belongs to that trip before acting.
//
// Identity is now authenticated: the acting participant is derived from the
// signed-in user's membership, not trusted from the client. A member acts as
// themselves; only organizers may act on another participant (e.g. setting
// someone else's RSVP).

export async function POST({ params, request, locals }) {
  if (!locals.user) throw error(401, 'Sign in to make changes');

  const pb = await superuserPb();

  /** @type {any} */
  let trip;
  try {
    trip = await pb
      .collection('trips')
      .getFirstListItem(pb.filter('share_token = {:t}', { t: params.share_token }));
  } catch (/** @type {any} */ e) {
    throw error(404, 'Trip not found');
  }

  const me = /** @type {any} */ (await getMembership(pb, trip.id, locals.user.id));
  if (!me) throw error(403, 'Join this trip before making changes');
  const isOrganizer = me.role === 'organizer';

  const body = await request.json().catch(() => ({}));
  const op = String(body.op ?? '');

  /** Fetch a row and assert it belongs to this trip (via its `trip` field). */
  async function inTrip(/** @type {string} */ coll, /** @type {string} */ id) {
    const rec = await pb.collection(coll).getOne(id);
    if (rec.trip !== trip.id) throw error(403, 'That item is not part of this trip');
    return rec;
  }

  /**
   * The participant an op acts on. Defaults to the signed-in member; an explicit
   * different participant is allowed only for organizers (e.g. owner-set RSVP).
   */
  async function targetParticipant() {
    if (body.participantId && body.participantId !== me.id) {
      if (!isOrganizer) throw error(403, 'Only organizers can change other people');
      return inTrip('participants', body.participantId);
    }
    return me;
  }

  /** @param {string} coll @param {string} filter */
  async function firstOrNull(coll, filter) {
    const res = await pb.collection(coll).getList(1, 1, { filter });
    return res.items[0] ?? null;
  }

  try {
    switch (op) {
      case 'rsvp': {
        const p = await targetParticipant();
        /** @type {Record<string, unknown>} */
        const data = { rsvp_status: body.status };
        // Lean only applies to "maybe": default to 50/50 on first maybe, clear otherwise.
        if (body.status === 'maybe') {
          if (!p.lean) data.lean = 2;
        } else {
          data.lean = null;
        }
        await pb.collection('participants').update(p.id, data);
        break;
      }

      // Set how flaky a "maybe" is (1 long shot · 2 fifty-fifty · 3 leaning yes).
      case 'lean': {
        const p = await targetParticipant();
        const lean = Math.max(1, Math.min(3, Number(body.lean) || 2));
        await pb.collection('participants').update(p.id, { lean, rsvp_status: 'maybe' });
        break;
      }

      case 'gear_add': {
        // Accept one (`name`) or many (`names`), e.g. a pasted list.
        const raw = Array.isArray(body.names) ? body.names : [body.name];
        const names = raw.map((/** @type {any} */ n) => String(n ?? '').trim().slice(0, 200)).filter(Boolean).slice(0, 50);
        if (!names.length) throw error(400, 'Name required');
        for (const name of names) {
          await pb.collection('gear_items').create({ trip: trip.id, name, qty_needed: 1, created_by: me.id });
        }
        break;
      }

      case 'claim': {
        const g = await inTrip('gear_items', body.gearItemId);
        const claims = await pb
          .collection('gear_claims')
          .getFullList({ filter: pb.filter('gear_item = {:g}', { g: g.id }) });
        const claimed = claims.reduce((s, c) => s + (c.qty_claimed || 1), 0);
        const remaining = Math.max(1, (g.qty_needed || 1) - claimed);
        await pb
          .collection('gear_claims')
          .create({ gear_item: g.id, participant: me.id, qty_claimed: remaining });
        // Auto-add to claimer's packing list (dedupe-guarded).
        const existing = await firstOrNull(
          'packing_items',
          pb.filter('from_gear = {:g} && participant = {:p}', { g: g.id, p: me.id })
        );
        if (!existing) {
          await pb.collection('packing_items').create({
            trip: trip.id,
            participant: me.id,
            label: g.name,
            is_shared: false,
            checked: false,
            from_gear: g.id
          });
        }
        break;
      }

      case 'release': {
        const g = await inTrip('gear_items', body.gearItemId);
        const mine = await firstOrNull(
          'gear_claims',
          pb.filter('gear_item = {:g} && participant = {:p}', { g: g.id, p: me.id })
        );
        if (mine) await pb.collection('gear_claims').delete(mine.id);
        const linked = await firstOrNull(
          'packing_items',
          pb.filter('from_gear = {:g} && participant = {:p}', { g: g.id, p: me.id })
        );
        if (linked) await pb.collection('packing_items').delete(linked.id);
        break;
      }

      // Become the owner of a meal nobody's taken yet (optionally with a dish).
      case 'meal_take': {
        const slot = await inTrip('meal_slots', body.mealSlotId);
        const owner = await firstOrNull(
          'meal_signups',
          pb.filter('meal_slot = {:s} && is_owner = true', { s: slot.id })
        );
        if (owner) break; // already owned — no-op
        const existing = await firstOrNull(
          'meal_signups',
          pb.filter('meal_slot = {:s} && participant = {:p}', { s: slot.id, p: me.id })
        );
        const dish = String(body.dish ?? '').slice(0, 300);
        if (existing) {
          await pb.collection('meal_signups').update(existing.id, { is_owner: true, dish_note: dish });
        } else {
          await pb
            .collection('meal_signups')
            .create({ meal_slot: slot.id, participant: me.id, is_owner: true, dish_note: dish });
        }
        break;
      }

      // Join an already-owned meal as a helper.
      case 'meal_help': {
        const slot = await inTrip('meal_slots', body.mealSlotId);
        const existing = await firstOrNull(
          'meal_signups',
          pb.filter('meal_slot = {:s} && participant = {:p}', { s: slot.id, p: me.id })
        );
        if (!existing) {
          await pb
            .collection('meal_signups')
            .create({ meal_slot: slot.id, participant: me.id, is_owner: false, dish_note: '' });
        }
        break;
      }

      // Owner sets the dish (what's being made).
      case 'meal_dish': {
        const slot = await inTrip('meal_slots', body.mealSlotId);
        const mine = await firstOrNull(
          'meal_signups',
          pb.filter('meal_slot = {:s} && participant = {:p}', { s: slot.id, p: me.id })
        );
        if (mine && mine.is_owner) {
          await pb
            .collection('meal_signups')
            .update(mine.id, { dish_note: String(body.dish ?? '').slice(0, 300) });
        }
        break;
      }

      // Leave a meal. If the owner leaves, the meal resets (everyone removed).
      case 'meal_drop': {
        const slot = await inTrip('meal_slots', body.mealSlotId);
        const mine = await firstOrNull(
          'meal_signups',
          pb.filter('meal_slot = {:s} && participant = {:p}', { s: slot.id, p: me.id })
        );
        if (!mine) break;
        if (mine.is_owner) {
          const all = await pb
            .collection('meal_signups')
            .getFullList({ filter: pb.filter('meal_slot = {:s}', { s: slot.id }) });
          for (const su of all) await pb.collection('meal_signups').delete(su.id);
        } else {
          await pb.collection('meal_signups').delete(mine.id);
        }
        break;
      }

      case 'pack_toggle': {
        const item = await inTrip('packing_items', body.itemId);
        // Anyone can tick a shared item; a personal item only by its owner (or an organizer).
        if (!item.is_shared && item.participant && item.participant !== me.id && !isOrganizer) {
          throw error(403, "That's someone else's packing item");
        }
        await pb.collection('packing_items').update(item.id, { checked: !item.checked });
        break;
      }

      case 'pack_add': {
        // Accept one (`label`) or many (`labels`), e.g. a pasted list.
        const raw = Array.isArray(body.labels) ? body.labels : [body.label];
        const labels = raw.map((/** @type {any} */ l) => String(l ?? '').trim().slice(0, 200)).filter(Boolean).slice(0, 50);
        if (!labels.length) throw error(400, 'Label required');
        const isShared = !!body.isShared;
        for (const label of labels) {
          await pb.collection('packing_items').create({
            trip: trip.id,
            label,
            is_shared: isShared,
            checked: false,
            participant: isShared ? null : me.id
          });
        }
        break;
      }

      default:
        throw error(400, 'Unknown action');
    }
  } catch (/** @type {any} */ e) {
    if (e?.status) throw e;
    throw error(500, 'Action failed');
  }

  return json({ ok: true });
}
