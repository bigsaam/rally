import { json, error } from '@sveltejs/kit';
import { superuserPb } from '$lib/server/pocketbase.js';
import { getMembership } from '$lib/server/membership.js';

// All planning-phase writes funnel through here (mirrors /actions): resolve the
// trip from the URL, require the signed-in user to be a member, and derive the
// acting participant from their membership. Owner-only ops check the role.

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
/** PB date fields want a datetime; store day-granular values at UTC midnight. */
const toPb = (/** @type {string} */ d) => (DATE_RE.test(d) ? `${d} 00:00:00.000Z` : '');

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
  const ownerOnly = () => {
    if (!isOrganizer) throw error(403, 'Organizers only');
  };

  const body = await request.json().catch(() => ({}));
  const op = String(body.op ?? '');

  /** Fetch a row and assert it belongs to this trip (direct `trip` relation). */
  async function inTrip(/** @type {string} */ coll, /** @type {string} */ id) {
    const rec = await pb.collection(coll).getOne(id);
    if (rec.trip !== trip.id) throw error(403, 'That item is not part of this trip');
    return rec;
  }
  /** @param {string} coll @param {string} filter */
  async function firstOrNull(coll, filter) {
    const res = await pb.collection(coll).getList(1, 1, { filter });
    return res.items[0] ?? null;
  }

  try {
    switch (op) {
      case 'set_type': {
        ownerOnly();
        const t = String(body.tripType ?? '');
        await pb.collection('trips').update(trip.id, { trip_type: t });
        break;
      }

      case 'set_status': {
        ownerOnly();
        const s = String(body.status ?? '');
        if (!['planning', 'confirmed', 'completed'].includes(s)) throw error(400, 'Bad status');
        await pb.collection('trips').update(trip.id, { status: s });
        break;
      }

      case 'propose_date': {
        ownerOnly();
        const start = String(body.start ?? '');
        const end = String(body.end ?? start);
        if (!DATE_RE.test(start)) throw error(400, 'Need a start date');
        if (end && !DATE_RE.test(end)) throw error(400, 'Bad end date');
        if (end && end < start) throw error(400, 'End is before start');
        const count = (await pb.collection('date_options').getList(1, 1, { filter: pb.filter('trip = {:t}', { t: trip.id }) })).totalItems;
        await pb.collection('date_options').create({
          trip: trip.id,
          start_date: toPb(start),
          end_date: end ? toPb(end) : '',
          sort_order: count
        });
        break;
      }

      case 'remove_date': {
        ownerOnly();
        const o = await inTrip('date_options', body.optionId);
        await pb.collection('date_options').delete(o.id);
        break;
      }

      case 'vote_date': {
        const o = await inTrip('date_options', body.optionId);
        const vote = String(body.vote ?? '');
        const mine = await firstOrNull(
          'date_votes',
          pb.filter('date_option = {:o} && participant = {:p}', { o: o.id, p: me.id })
        );
        if (!vote) {
          if (mine) await pb.collection('date_votes').delete(mine.id);
        } else if (['yes', 'maybe', 'no'].includes(vote)) {
          if (mine) await pb.collection('date_votes').update(mine.id, { vote });
          else await pb.collection('date_votes').create({ date_option: o.id, participant: me.id, vote });
        }
        break;
      }

      case 'set_availability': {
        const raw = Array.isArray(body.dates) ? body.dates : [];
        const dates = [...new Set(raw.map((/** @type {any} */ d) => String(d)).filter((/** @type {string} */ d) => DATE_RE.test(d)))].slice(0, 366);
        await pb.collection('participants').update(me.id, { available_dates: dates });
        break;
      }

      case 'add_location': {
        const label = String(body.label ?? '').trim().slice(0, 200);
        if (!label) throw error(400, 'Name the place');
        const url = String(body.url ?? '').trim();
        if (url && !/^https?:\/\/.+/i.test(url)) throw error(400, 'Links need http(s)://');
        await pb.collection('location_ideas').create({
          trip: trip.id,
          participant: me.id,
          label,
          url: url.slice(0, 500)
        });
        break;
      }

      case 'remove_location': {
        const idea = await inTrip('location_ideas', body.ideaId);
        if (idea.participant !== me.id && !isOrganizer) throw error(403, "That's not your idea");
        await pb.collection('location_ideas').delete(idea.id);
        break;
      }

      case 'vote_location': {
        const idea = await inTrip('location_ideas', body.ideaId);
        const mine = await firstOrNull(
          'location_votes',
          pb.filter('location_idea = {:i} && participant = {:p}', { i: idea.id, p: me.id })
        );
        if (mine) await pb.collection('location_votes').delete(mine.id);
        else await pb.collection('location_votes').create({ location_idea: idea.id, participant: me.id });
        break;
      }

      case 'pick_location': {
        ownerOnly();
        const idea = await inTrip('location_ideas', body.ideaId);
        await pb.collection('trips').update(trip.id, { location: idea.label });
        break;
      }

      // Lock it in: set final dates (+ optional location) and flip to confirmed.
      case 'confirm_trip': {
        ownerOnly();
        const start = String(body.start ?? '');
        const end = String(body.end ?? start);
        if (!DATE_RE.test(start)) throw error(400, 'Pick a start date to confirm');
        if (end && !DATE_RE.test(end)) throw error(400, 'Bad end date');
        if (end && end < start) throw error(400, 'End is before start');
        /** @type {Record<string, unknown>} */
        const data = { start_date: toPb(start), end_date: end ? toPb(end) : '', status: 'confirmed' };
        const loc = String(body.location ?? '').trim();
        if (loc) data.location = loc.slice(0, 300);
        await pb.collection('trips').update(trip.id, data);
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
