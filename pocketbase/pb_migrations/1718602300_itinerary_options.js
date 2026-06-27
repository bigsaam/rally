/// <reference path="../pb_data/types.d.ts" />

// Itinerary timeline with votable options (#18 + the contextual half of #17).
//
// An itinerary_item is a plan line ("Dinner", "Hike to the falls"). Any item can
// carry suggested OPTIONS that members VOTE on — so "where do we eat Saturday?"
// is a dinner item with two options, not a bespoke poll section. An UNDATED item
// is a free-form group decision ("Movie tonight?"), the generic-poll home. The
// winning option can be locked in via picked_option.
//
// itinerary_items already exists ({ trip, date, label, sort_order }); here we add
// time/created_by/picked_option, relax date to optional, and add the two new
// collections. CRUD stays superuser-only (locked rules): the browser never
// touches PocketBase — reads via loadTrip, writes via the /actions endpoint.

migrate(
  (app) => {
    const itemsId = app.findCollectionByNameOrId('itinerary_items').id;
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

    // Suggested choices for an item (e.g. two restaurants). Deleting the item
    // cascades these away; deleting an option cascades its votes.
    const options = new Collection({
      type: 'base',
      name: 'itinerary_options',
      fields: [
        rel('itinerary_item', itemsId, true, true),
        { name: 'label', type: 'text', required: true, max: 200 },
        { name: 'url', type: 'text', max: 500 },
        rel('created_by', partsId, false, false),
        { name: 'sort_order', type: 'number', onlyInt: true },
        created
      ],
      indexes: ['CREATE INDEX idx_itin_options_item ON itinerary_options (itinerary_item)'],
      ...locked
    });
    app.save(options);

    // One vote per (option, participant); single-choice-per-item is enforced in
    // the actions endpoint (deleting prior votes on the same item before adding).
    const votes = new Collection({
      type: 'base',
      name: 'itinerary_votes',
      fields: [
        rel('itinerary_option', options.id, true, true),
        rel('participant', partsId, true, false),
        created
      ],
      indexes: ['CREATE INDEX idx_itin_votes_option ON itinerary_votes (itinerary_option)'],
      ...locked
    });
    app.save(votes);

    // Extend itinerary_items: a time label, who added it, and the locked-in
    // winning option. Relax `date` so undated decisions ("To decide") are allowed.
    const items = app.findCollectionByNameOrId('itinerary_items');
    items.fields.add(new Field({ name: 'time', type: 'text', max: 40 }));
    items.fields.add(new Field(rel('created_by', partsId, false, false)));
    items.fields.add(new Field(rel('picked_option', options.id, false, false)));
    const dateField = items.fields.getByName('date');
    if (dateField) dateField.required = false;
    app.save(items);
  },
  (app) => {
    for (const n of ['itinerary_votes', 'itinerary_options']) {
      try {
        app.delete(app.findCollectionByNameOrId(n));
      } catch (_) {
        // already gone
      }
    }
    try {
      const items = app.findCollectionByNameOrId('itinerary_items');
      items.fields.removeByName('time');
      items.fields.removeByName('created_by');
      items.fields.removeByName('picked_option');
      const dateField = items.fields.getByName('date');
      if (dateField) dateField.required = true;
      app.save(items);
    } catch (_) {
      // collection gone
    }
  }
);
