/// <reference path="../pb_data/types.d.ts" />

// Co-organizer invites by email (#16). An organizer can invite someone to
// co-run a trip by email — when an account with that email joins, they land as
// an organizer (and skip approval), instead of the organizer having to hand out
// the secret owner-token link.
//
// One pending invite per (trip, email). The row is consumed (deleted) on join.
// CRUD is superuser-only — the browser never touches PocketBase directly; the
// server reads/writes invites via the superuser client.

migrate(
  (app) => {
    const usersId = app.findCollectionByNameOrId('users').id;
    const invites = new Collection({
      type: 'base',
      name: 'invites',
      fields: [
        {
          name: 'trip',
          type: 'relation',
          required: true,
          collectionId: app.findCollectionByNameOrId('trips').id,
          maxSelect: 1,
          cascadeDelete: true
        },
        { name: 'email', type: 'text', required: true, max: 254 },
        { name: 'role', type: 'select', maxSelect: 1, values: ['organizer', 'guest'] },
        {
          name: 'invited_by',
          type: 'relation',
          required: false,
          collectionId: usersId,
          maxSelect: 1,
          cascadeDelete: false
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false }
      ],
      indexes: [
        'CREATE INDEX idx_invites_trip ON invites (trip)',
        'CREATE UNIQUE INDEX idx_invites_trip_email ON invites (trip, email)'
      ],
      listRule: null,
      viewRule: null,
      createRule: null,
      updateRule: null,
      deleteRule: null
    });
    app.save(invites);
  },
  (app) => {
    try {
      app.delete(app.findCollectionByNameOrId('invites'));
    } catch (_) {
      // already gone
    }
  }
);
