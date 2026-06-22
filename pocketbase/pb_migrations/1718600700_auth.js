/// <reference path="../pb_data/types.d.ts" />

// Auth pivot (#14): real accounts replace the no-account / owner-token model.
//
// - Creates the `users` auth collection (email/password + Google OAuth2).
// - Adds `trips.created_by` and `participants.{user, role}` so `participants`
//   becomes the membership table (a member = a participant linked to a user,
//   with role organizer|guest). Gear/meals/packing → participant relations are
//   unchanged.
//
// Google client id/secret come from env (1Password-injected in prod) so they're
// never committed; the provider is only enabled when both are present. Data is
// still read/written server-side via the superuser client, so the users
// collection's CRUD rules stay superuser-only — only `authRule` is opened so
// records can actually sign in.

migrate(
  (app) => {
    const clientId = $os.getenv('GOOGLE_OAUTH_CLIENT_ID');
    const clientSecret = $os.getenv('GOOGLE_OAUTH_CLIENT_SECRET');
    const googleEnabled = !!(clientId && clientSecret);

    let users = null;
    try {
      users = app.findCollectionByNameOrId('users');
    } catch (_) {
      users = null;
    }
    if (!users) {
      users = new Collection({
        type: 'auth',
        name: 'users',
        fields: [
          { name: 'name', type: 'text', max: 200 },
          { name: 'avatar', type: 'url', max: 500 }
        ]
      });
    }

    users.passwordAuth = { enabled: true, identityFields: ['email'] };
    users.oauth2 = {
      enabled: googleEnabled,
      providers: googleEnabled ? [{ name: 'google', clientId, clientSecret }] : [],
      mappedFields: { name: 'name', avatarURL: 'avatar' }
    };
    // Anyone with valid credentials may authenticate; CRUD stays superuser-only.
    users.authRule = '';
    users.listRule = null;
    users.viewRule = null;
    users.createRule = null;
    users.updateRule = null;
    users.deleteRule = null;
    app.save(users);

    const usersId = app.findCollectionByNameOrId('users').id;

    const trips = app.findCollectionByNameOrId('trips');
    trips.fields.add(
      new Field({
        name: 'created_by',
        type: 'relation',
        required: false,
        collectionId: usersId,
        maxSelect: 1,
        cascadeDelete: false
      })
    );
    app.save(trips);

    const participants = app.findCollectionByNameOrId('participants');
    participants.fields.add(
      new Field({
        name: 'user',
        type: 'relation',
        required: false,
        collectionId: usersId,
        maxSelect: 1,
        cascadeDelete: false
      })
    );
    participants.fields.add(
      new Field({ name: 'role', type: 'select', maxSelect: 1, values: ['organizer', 'guest'] })
    );
    // Non-unique index for lookups by user. Uniqueness (one membership per user
    // per trip) is enforced in the join action — a DB unique index can't be used
    // because PocketBase stores unfilled relations as "" (not NULL), so legacy /
    // not-yet-linked rows would collide on (trip, "").
    participants.indexes = [
      ...participants.indexes,
      'CREATE INDEX idx_participants_trip_user ON participants (trip, user)'
    ];
    app.save(participants);
  },
  (app) => {
    const participants = app.findCollectionByNameOrId('participants');
    participants.indexes = participants.indexes.filter(
      (i) => !i.includes('idx_participants_trip_user')
    );
    participants.fields.removeByName('user');
    participants.fields.removeByName('role');
    app.save(participants);

    const trips = app.findCollectionByNameOrId('trips');
    trips.fields.removeByName('created_by');
    app.save(trips);

    try {
      app.delete(app.findCollectionByNameOrId('users'));
    } catch (_) {
      // already gone
    }
  }
);
