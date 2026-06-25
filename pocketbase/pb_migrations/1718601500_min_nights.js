/// <reference path="../pb_data/types.d.ts" />

// Optional minimum trip length in NIGHTS (e.g. "at least 2 nights"). Organizers
// set it; proposing a date range and confirming the trip both enforce that the
// range spans at least this many nights. Empty/0 = no minimum (existing trips
// are unaffected). Nights = end_date − start_date in days.

migrate(
  (app) => {
    const trips = app.findCollectionByNameOrId('trips');
    trips.fields.add(new Field({ name: 'min_nights', type: 'number', onlyInt: true, min: 0 }));
    app.save(trips);
  },
  (app) => {
    const trips = app.findCollectionByNameOrId('trips');
    trips.fields.removeByName('min_nights');
    app.save(trips);
  }
);
