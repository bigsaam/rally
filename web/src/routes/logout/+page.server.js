import { redirect } from '@sveltejs/kit';

// Clearing the per-request client's auth makes the hooks layer serialize an
// empty pb_auth cookie on the way out, signing the user out.
export const actions = {
  default: async ({ locals }) => {
    locals.pb.authStore.clear();
    locals.user = null;
    throw redirect(303, '/');
  }
};
