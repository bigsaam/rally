/// <reference path="../pb_data/types.d.ts" />

// App-wide settings + Immich album wiring (#21).
//
// tripwala is meant to be self-hosted and shared with friends: the person who
// deploys it is the "admin" and points it at THEIR Immich. So the Immich
// connection is an instance-level setting the admin edits in the UI — not a
// hard env requirement. We model it as a singleton `app_settings` record:
//   - immich_url      base URL of the Immich instance (e.g. https://photos.example)
//   - immich_api_key  Immich API key (server-only; collection is superuser-locked
//                     so the browser never reads it — the admin UI masks it)
//   - singleton       constant 'app', uniquely indexed, so there's exactly one row
// The server falls back to IMMICH_URL / IMMICH_API_KEY env vars when a field is
// empty, so a deployer can pre-seed via env without it being mandatory.
//
// trips gains:
//   - immich_album_id  the Immich album's id, needed to rename it when the trip
//                      is renamed/retyped (the share link in immich_album_url is
//                      for embedding; the id drives the API). Empty = no album.
//
// All superuser-locked like the rest of the schema.

migrate(
  (app) => {
    const settings = new Collection({
      type: 'base',
      name: 'app_settings',
      fields: [
        { name: 'singleton', type: 'text', required: true, max: 20 },
        { name: 'immich_url', type: 'text', max: 300 },
        { name: 'immich_api_key', type: 'text', max: 300 },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true }
      ],
      indexes: ['CREATE UNIQUE INDEX idx_app_settings_singleton ON app_settings (singleton)'],
      listRule: null,
      viewRule: null,
      createRule: null,
      updateRule: null,
      deleteRule: null
    });
    app.save(settings);

    // Seed the one row so the loader always finds it.
    const row = new Record(app.findCollectionByNameOrId('app_settings'));
    row.set('singleton', 'app');
    row.set('immich_url', '');
    row.set('immich_api_key', '');
    app.save(row);

    const trips = app.findCollectionByNameOrId('trips');
    trips.fields.add(new Field({ name: 'immich_album_id', type: 'text', max: 200 }));
    app.save(trips);
  },
  (app) => {
    const trips = app.findCollectionByNameOrId('trips');
    trips.fields.removeByName('immich_album_id');
    app.save(trips);
    try {
      app.delete(app.findCollectionByNameOrId('app_settings'));
    } catch (_) {
      // already gone
    }
  }
);
