import { fail } from '@sveltejs/kit';
import { superuserPb } from '$lib/server/pocketbase.js';
import { generateOwnerToken } from '$lib/server/tokens.js';
import { generateSlug } from '$lib/server/slug.js';
import { generateSlotsFromDates } from '$lib/server/mealSlots.js';

const MAX = { name: 200, location: 300, description: 5000 };

/** @param {string} v */
const clean = (v) => v.trim();

export const actions = {
  default: async ({ request }) => {
    const form = await request.formData();
    const name = clean(String(form.get('name') ?? ''));
    const location = clean(String(form.get('location') ?? ''));
    const start_date = clean(String(form.get('start_date') ?? ''));
    const end_date = clean(String(form.get('end_date') ?? ''));
    const description = clean(String(form.get('description') ?? ''));
    const expense_link = clean(String(form.get('expense_link') ?? ''));

    // Boundary validation — fail fast with field-level messages.
    /** @type {Record<string, string>} */
    const errors = {};
    const values = { name, location, start_date, end_date, description, expense_link };

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
      owner_token
    };

    // Friendly slug (<trip-word>-<word>-<word>). The share token must be unique;
    // on the rare collision, retry with progressively more random words.
    let trip;
    let share_token = '';
    for (let attempt = 0; attempt < 6 && !trip; attempt++) {
      share_token = generateSlug(name, attempt);
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

    return {
      created: {
        name: trip.name,
        share_token,
        owner_token,
        mealSlots: slots.length
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
