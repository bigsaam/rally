/// <reference path="../pb_data/types.d.ts" />

// Trip-page modules that match the Claude Design mock 1:1:
//
// - expenses: in-app shared-cost tracking. Each row = who paid for what + amount;
//   the app splits equally across members and computes a minimal settle-up.
// - itinerary_items: an optional per-day plan label (the Dates module's day plan),
//   editable by organizers.
// - participants.notify: per-member "trip notifications" preference (the Trip
//   settings toggle). Default on.
//
// All collections stay superuser-only (locked rules): the browser never touches
// PocketBase — reads via load(), writes via the /actions endpoint.

migrate(
  (app) => {
    const tripsId = app.findCollectionByNameOrId('trips').id;
    const partsId = app.findCollectionByNameOrId('participants').id;

    const rel = (name, collectionId, required, cascade) => ({
      name,
      type: 'relation',
      required,
      collectionId,
      maxSelect: 1,
      cascadeDelete: cascade
    });
    const created = { name: 'created', type: 'autodate', onCreate: true, onUpdate: false };
    const locked = {
      listRule: null,
      viewRule: null,
      createRule: null,
      updateRule: null,
      deleteRule: null
    };

    const expenses = new Collection({
      type: 'base',
      name: 'expenses',
      fields: [
        rel('trip', tripsId, true, true),
        rel('paid_by', partsId, false, false), // payer; null if the payer left
        { name: 'title', type: 'text', required: true, max: 200 },
        { name: 'amount', type: 'number', required: true, min: 0 },
        created
      ],
      indexes: ['CREATE INDEX idx_expenses_trip ON expenses (trip)'],
      ...locked
    });
    app.save(expenses);

    const itinerary = new Collection({
      type: 'base',
      name: 'itinerary_items',
      fields: [
        rel('trip', tripsId, true, true),
        { name: 'date', type: 'date', required: true },
        { name: 'label', type: 'text', required: true, max: 200 },
        { name: 'sort_order', type: 'number', onlyInt: true },
        created
      ],
      indexes: ['CREATE INDEX idx_itinerary_trip ON itinerary_items (trip)'],
      ...locked
    });
    app.save(itinerary);

    const parts = app.findCollectionByNameOrId('participants');
    parts.fields.add(new Field({ name: 'notify', type: 'bool', required: false }));
    app.save(parts);
  },
  (app) => {
    for (const n of ['expenses', 'itinerary_items']) {
      try {
        app.delete(app.findCollectionByNameOrId(n));
      } catch (_) {
        // already gone
      }
    }
    const parts = app.findCollectionByNameOrId('participants');
    parts.fields.removeByName('notify');
    app.save(parts);
  }
);
