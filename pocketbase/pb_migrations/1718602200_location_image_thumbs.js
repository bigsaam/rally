/// <reference path="../pb_data/types.d.ts" />

// Serve right-sized location-card images instead of the full upload. PocketBase
// generates thumbnails on demand for sizes listed in a file field's `thumbs`,
// caches them, and returns the original for any size NOT listed (so this is
// back-compat — existing image URLs keep working). The web layer appends
// ?thumb=<size> for the two places these pictures render:
//   - 416x224  the small planning card (208x112 @2x, center-cropped)
//   - 1000x0   the confirmed-trip hero banner (full width, aspect preserved)
//
// Browsers then pull a few hundred KB instead of multi-MB originals.

migrate(
  (app) => {
    const ideas = app.findCollectionByNameOrId('location_ideas');
    const image = ideas.fields.getByName('image');
    image.thumbs = ['416x224', '1000x0'];
    app.save(ideas);
  },
  (app) => {
    const ideas = app.findCollectionByNameOrId('location_ideas');
    const image = ideas.fields.getByName('image');
    image.thumbs = [];
    app.save(ideas);
  }
);
