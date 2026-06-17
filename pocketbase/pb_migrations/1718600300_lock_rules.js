/// <reference path="../pb_data/types.d.ts" />

// Step 9 — lock down the API. Set every collection rule to null (superuser-only),
// so the browser can no longer read or write PocketBase directly. All access now
// flows through the SvelteKit server (superuser-authenticated): reads via the
// page load(), writes via /[share_token]/actions, both scoped to the trip's
// token. This closes cross-trip read/write/enumeration on the public instance.

const COLLECTIONS = [
  'trips',
  'participants',
  'gear_items',
  'gear_claims',
  'meal_slots',
  'meal_signups',
  'packing_items'
];

migrate(
  (app) => {
    for (const name of COLLECTIONS) {
      const c = app.findCollectionByNameOrId(name);
      c.listRule = null;
      c.viewRule = null;
      c.createRule = null;
      c.updateRule = null;
      c.deleteRule = null;
      app.save(c);
    }
  },
  (app) => {
    // Down: restore the permissive scaffold rules ("" = public).
    for (const name of COLLECTIONS) {
      const c = app.findCollectionByNameOrId(name);
      c.listRule = '';
      c.viewRule = '';
      c.createRule = '';
      c.updateRule = '';
      c.deleteRule = name === 'trips' ? null : '';
      app.save(c);
    }
  }
);
