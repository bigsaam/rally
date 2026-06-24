/// <reference path="../pb_data/types.d.ts" />

// Per-trip section visibility. Organizers can hide a module (Dates, Gear, …) for
// EVERYONE on the trip and restore it later. Stored as a JSON array of section
// keys on the trip; empty/absent = nothing hidden. Superuser-only like the rest;
// the browser toggles via the /actions endpoint.

migrate(
  (app) => {
    const trips = app.findCollectionByNameOrId('trips');
    trips.fields.add(new Field({ name: 'hidden_sections', type: 'json', maxSize: 2000 }));
    app.save(trips);
  },
  (app) => {
    const trips = app.findCollectionByNameOrId('trips');
    trips.fields.removeByName('hidden_sections');
    app.save(trips);
  }
);
