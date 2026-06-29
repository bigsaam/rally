import { redirect, fail } from '@sveltejs/kit';
import { isAdmin } from '$lib/server/admin.js';
import { loadImmichConfigForAdmin, saveImmichConfig } from '$lib/server/appSettings.js';

// Instance settings, editable only by the instance admin (see admin.js for who
// that is). Today: the Immich connection. The API key is write-only from here —
// the page never receives it, only whether one is set.

export async function load({ locals }) {
  if (!locals.user) throw redirect(303, '/login?next=/admin');
  if (!(await isAdmin(locals.user))) throw redirect(303, '/');
  return { immich: await loadImmichConfigForAdmin() };
}

export const actions = {
  default: async ({ request, locals }) => {
    if (!locals.user || !(await isAdmin(locals.user))) return fail(403, { error: 'Not allowed' });
    const form = await request.formData();
    const url = String(form.get('immich_url') ?? '').trim();
    const apiKey = String(form.get('immich_api_key') ?? '');
    const clearKey = Boolean(form.get('clear_key'));
    if (url && !/^https?:\/\/.+/i.test(url)) {
      return fail(400, { error: 'Enter a full URL starting with http(s)://', immich: await loadImmichConfigForAdmin() });
    }
    try {
      await saveImmichConfig({ url, apiKey, clearKey });
    } catch (/** @type {any} */ e) {
      return fail(502, { error: 'Could not save settings — please try again.', immich: await loadImmichConfigForAdmin() });
    }
    return { saved: true, immich: await loadImmichConfigForAdmin() };
  }
};
