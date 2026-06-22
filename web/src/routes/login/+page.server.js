import { fail, redirect } from '@sveltejs/kit';
import { safeNext } from '$lib/server/authFlow.js';

export function load({ locals, url }) {
  const next = safeNext(url.searchParams.get('next'));
  if (locals.user) throw redirect(303, next);
  return { next, oauthError: url.searchParams.get('error') === 'oauth' };
}

export const actions = {
  default: async ({ request, locals }) => {
    const fd = await request.formData();
    const email = String(fd.get('email') ?? '').trim();
    const password = String(fd.get('password') ?? '');
    const next = safeNext(fd.get('next'));

    if (!email || !password) {
      return fail(400, { email, error: 'Enter your email and password.' });
    }

    try {
      await locals.pb.collection('users').authWithPassword(email, password);
    } catch (/** @type {any} */ e) {
      return fail(400, { email, error: 'Wrong email or password.' });
    }

    throw redirect(303, next);
  }
};
