/// <reference path="../pb_data/types.d.ts" />

// Import + media plumbing for batch-importing past trips (e.g. from Notion) and
// referencing a live photo album instead of duplicating images.
//
// trips gains:
//   - hero_image        a single cover picture for the trip. Same shape/thumbs as
//                       location_ideas.image, so the OG/preview code can fall back
//                       to it for imported trips that have no location voting. Left
//                       blank on import; set later (manually or via Immich backfill).
//   - immich_album_url  share-link to the trip's album in Immich. The album stays
//                       live in Immich (shared with attendees) and is embedded, not
//                       duplicated. Empty = no album.
//   - import_source     where this trip came from ('notion', etc.); '' = native.
//   - external_id       the source's stable id (e.g. Notion page id). Together with
//                       import_source this makes re-running an importer idempotent —
//                       a unique partial index keys the upsert, while leaving native
//                       trips (external_id = '') unconstrained.
//
// Empty values everywhere = back-compat. Superuser-locked like the rest of trips.

migrate(
  (app) => {
    const trips = app.findCollectionByNameOrId('trips');
    trips.fields.add(
      new Field({
        name: 'hero_image',
        type: 'file',
        maxSelect: 1,
        maxSize: 5242880, // 5 MB
        mimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
        thumbs: ['416x224', '1000x0']
      })
    );
    trips.fields.add(new Field({ name: 'immich_album_url', type: 'url' }));
    trips.fields.add(new Field({ name: 'import_source', type: 'text', max: 50 }));
    trips.fields.add(new Field({ name: 'external_id', type: 'text', max: 200 }));
    // Idempotent imports: at most one trip per source id, but native trips
    // (external_id = '') are exempt so they don't collide on the empty string.
    trips.indexes = [
      ...trips.indexes,
      "CREATE UNIQUE INDEX idx_trips_import_external ON trips (import_source, external_id) WHERE external_id != ''"
    ];
    app.save(trips);
  },
  (app) => {
    const trips = app.findCollectionByNameOrId('trips');
    trips.indexes = trips.indexes.filter((i) => !i.includes('idx_trips_import_external'));
    for (const n of ['hero_image', 'immich_album_url', 'import_source', 'external_id']) {
      trips.fields.removeByName(n);
    }
    app.save(trips);
  }
);
