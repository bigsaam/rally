// Surface the signed-in user to every page so the layout (and any page) can
// render auth state without each load() re-deriving it.
/** @type {import('./$types').LayoutServerLoad} */
export function load({ locals }) {
  return { user: locals.user };
}
