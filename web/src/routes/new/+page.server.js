import { fail, redirect } from '@sveltejs/kit';
import { superuserPb } from '$lib/server/pocketbase.js';
import { generateOwnerToken } from '$lib/server/tokens.js';
import { generateSlug } from '$lib/server/slug.js';
import { generateSlotsFromDates } from '$lib/server/mealSlots.js';
import { joinTrip } from '$lib/server/membership.js';
import { immichConfigured, createTripAlbum } from '$lib/server/immich.js';

const MAX = { name: 200, location: 300, description: 5000 };

/** @param {string} v */
const clean = (v) => v.trim();

export async function load({ locals }) {
  // Must be signed in to plan a trip.
  if (!locals.user) throw redirect(303, '/login?next=/new');
  // Only offer the Immich album opt-in when the instance has Immich configured.
  return { immichEnabled: await immichConfigured() };
}

export const actions = {
  default: async ({ request, locals }) => {
    if (!locals.user) throw redirect(303, '/login?next=/new');
    const form = await request.formData();
    const name = clean(String(form.get('name') ?? ''));
    const location = clean(String(form.get('location') ?? ''));
    const start_date = clean(String(form.get('start_date') ?? ''));
    const end_date = clean(String(form.get('end_date') ?? ''));
    const description = clean(String(form.get('description') ?? ''));
    const expense_link = clean(String(form.get('expense_link') ?? ''));
    let status = clean(String(form.get('status') ?? 'confirmed'));
    if (!['planning', 'confirmed', 'completed'].includes(status)) status = 'confirmed';
    const trip_type = clean(String(form.get('trip_type') ?? ''));
    const create_album = Boolean(form.get('create_album'));

    // Boundary validation — fail fast with field-level messages.
    /** @type {Record<string, string>} */
    const errors = {};
    const values = { name, location, start_date, end_date, description, expense_link, status, trip_type };

    if (!name) errors.name = 'Give your trip a name.';
    else if (name.length > MAX.name) errors.name = `Keep it under ${MAX.name} characters.`;
    if (location.length > MAX.location) errors.location = `Keep it under ${MAX.location} characters.`;
    if (description.length > MAX.description) errors.description = `That description is too long.`;
    if (start_date && end_date && end_date < start_date) {
      errors.end_date = 'End date cannot be before the start date.';
    }
    if (expense_link && !/^https?:\/\/.+/i.test(expense_link)) {
      errors.expense_link = 'Enter a full URL starting with http(s)://';
    }

    if (Object.keys(errors).length) return fail(400, { errors, values });

    const pb = await superuserPb();
    const owner_token = generateOwnerToken();

    /** @param {string} d */
    const toPb = (d) => (d ? `${d} 00:00:00.000Z` : '');

    const base = {
      name,
      location,
      start_date: toPb(start_date),
      end_date: toPb(end_date),
      description: description ? `<p>${escapeHtml(description)}</p>` : '',
      expense_link,
      owner_token,
      created_by: locals.user.id,
      status,
      trip_type
    };

    // Friendly slug (<trip-word>-<word>-<word>-<word>). Three random words
    // (~19 bits) so an invite link isn't trivially guessable. The token must be
    // unique — on the rare collision, retry with progressively more words.
    let trip;
    let share_token = '';
    for (let attempt = 0; attempt < 6 && !trip; attempt++) {
      share_token = generateSlug(name, attempt + 1);
      try {
        trip = await pb.collection('trips').create({ ...base, share_token });
      } catch (/** @type {any} */ err) {
        const isCollision = err?.status === 400 || err?.response?.data?.share_token;
        if (isCollision && attempt < 5) continue;
        return fail(502, {
          errors: { _form: 'Could not create the trip — please try again.' },
          values
        });
      }
    }
    if (!trip) {
      return fail(502, { errors: { _form: 'Could not create the trip — please try again.' }, values });
    }

    // The creator is automatically an organizer member.
    try {
      await joinTrip(pb, trip, locals.user);
    } catch (_) {
      // non-fatal; they can claim via the owner link if this hiccups
    }

    // Best-effort: auto-generate meal slots from the date range. A failure here
    // must not lose the trip the user just created, so it is non-fatal.
    const slots = generateSlotsFromDates(start_date, end_date);
    if (slots.length) {
      try {
        await Promise.all(
          slots.map((s) => pb.collection('meal_slots').create({ trip: trip.id, ...s }))
        );
      } catch (_) {
        // slots can be regenerated/edited later; ignore
      }
    }

    // Opt-in: create a shared Immich album for the trip. Best-effort — a failure
    // (Immich down, misconfigured) must never lose the trip; the user can create
    // or link an album later from trip settings.
    let albumCreated = false;
    if (create_album && (await immichConfigured())) {
      try {
        const { albumId, albumUrl } = await createTripAlbum(/** @type {any} */ (trip));
        await pb.collection('trips').update(trip.id, { immich_album_id: albumId, immich_album_url: albumUrl });
        albumCreated = true;
      } catch (_) {
        // non-fatal; surfaced as albumCreated:false so the UI can hint
      }
    }

    return {
      created: {
        name: trip.name,
        share_token,
        owner_token,
        mealSlots: slots.length,
        albumRequested: create_album,
        albumCreated
      }
    };
  }
};

/** @param {string} s */
function escapeHtml(s) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br>');
}
