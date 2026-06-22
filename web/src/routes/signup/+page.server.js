import { fail, redirect } from '@sveltejs/kit';
import { superuserPb } from '$lib/server/pocketbase.js';
import { safeNext } from '$lib/server/authFlow.js';

export function load({ locals, url }) {
  const next = safeNext(url.searchParams.get('next'));
  if (locals.user) throw redirect(303, next);
  return { next };
}

export const actions = {
  default: async ({ request, locals }) => {
    const fd = await request.formData();
    const name = String(fd.get('name') ?? '').trim();
    const email = String(fd.get('email') ?? '').trim();
    const password = String(fd.get('password') ?? '');
    const next = safeNext(fd.get('next'));

    /** @type {Record<string,string>} */
    const values = { name, email };
    if (!name) return fail(400, { values, error: 'What should we call you?' });
    if (!email) return fail(400, { values, error: 'Enter your email.' });
    if (password.length < 8) return fail(400, { values, error: 'Use at least 8 characters for your password.' });

    // Users are created via the superuser client (the users collection's
    // createRule is superuser-only). No SMTP is configured, so accounts are
    // marked verified on creation — fine for this app's threat model.
    try {
      const su = await superuserPb();
      await su.collection('users').create({
        name,
        email,
        password,
        passwordConfirm: password,
        verified: true
      });
    } catch (/** @type {any} */ e) {
      const taken = e?.response?.data?.email;
      return fail(400, {
        values,
        error: taken ? 'That email is already registered — try signing in.' : 'Could not create your account.'
      });
    }

    try {
      await locals.pb.collection('users').authWithPassword(email, password);
    } catch (/** @type {any} */ e) {
      // Account exists; let them sign in explicitly.
      throw redirect(303, `/login?next=${encodeURIComponent(next)}`);
    }

    throw redirect(303, next);
  }
};
