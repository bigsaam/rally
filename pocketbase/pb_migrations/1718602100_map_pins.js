/// <reference path="../pb_data/types.d.ts" />

// Trip map pins (#12) — a first-class map for any trip type. Members drop pins
// (campsite, meetup, parking, trailhead, gas, …) with a label + optional note.
// Coordinates are plain lat/lng numbers; the map UI is Leaflet + OpenStreetMap.
//
// CRUD is superuser-only — the browser never touches PocketBase directly; pins
// are read in loadTrip and written through the trip actions endpoint.

migrate(
  (app) => {
    const tripsId = app.findCollectionByNameOrId('trips').id;
    const partsId = app.findCollectionByNameOrId('participants').id;

    const pins = new Collection({
      type: 'base',
      name: 'map_pins',
      fields: [
        {
          name: 'trip',
          type: 'relation',
          required: true,
          collectionId: tripsId,
          maxSelect: 1,
          cascadeDelete: true
        },
        { name: 'label', type: 'text', required: true, max: 200 },
        {
          name: 'category',
          type: 'select',
          maxSelect: 1,
          values: [
            'campsite',
            'lodging',
            'meetup',
            'parking',
            'trailhead',
            'gas',
            'food',
            'water',
            'viewpoint',
            'other'
          ]
        },
        { name: 'lat', type: 'number', required: true },
        { name: 'lng', type: 'number', required: true },
        { name: 'note', type: 'text', max: 500 },
        {
          name: 'created_by',
          type: 'relation',
          required: false,
          collectionId: partsId,
          maxSelect: 1,
          cascadeDelete: false
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false }
      ],
      indexes: ['CREATE INDEX idx_map_pins_trip ON map_pins (trip)'],
      listRule: null,
      viewRule: null,
      createRule: null,
      updateRule: null,
      deleteRule: null
    });
    app.save(pins);
  },
  (app) => {
    try {
      app.delete(app.findCollectionByNameOrId('map_pins'));
    } catch (_) {
      // already gone
    }
  }
);
