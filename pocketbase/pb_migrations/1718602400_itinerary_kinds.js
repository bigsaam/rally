/// <reference path="../pb_data/types.d.ts" />

// Itinerary v2 — "fixed" vs "flexible" entries (replaces the option/pick model).
//
// An itinerary_item now has a `kind`:
//   - fixed:    a confirmed schedule entry (check-in 3pm, check-out 11am). Not
//               votable — just a labelled time on the day.
//   - flexible: an optional suggestion the crew upvotes directly ("Beach day?").
//               One vote per person, toggled.
//
// This drops the per-item options layer (itinerary_options + the option-based
// votes + picked_option) in favour of voting on the item itself. The feature is
// freshly shipped and its data is disposable, so this migration is destructive on
// those two collections. CRUD stays superuser-only (locked rules).

migrate(
  (app) => {
    const itemsId = app.findCollectionByNameOrId('itinerary_items').id;
    const partsId = app.findCollectionByNameOrId('participants').id;

    // 1) On itinerary_items: drop picked_option (it references itinerary_options,
    //    so it must go before that collection can be deleted) and add `kind`.
    const items = app.findCollectionByNameOrId('itinerary_items');
    items.fields.removeByName('picked_option');
    items.fields.add(
      new Field({ name: 'kind', type: 'select', maxSelect: 1, values: ['fixed', 'flexible'] })
    );
    app.save(items);

    // 2) Remove the old option-based collections.
    for (const n of ['itinerary_votes', 'itinerary_options']) {
      try {
        app.delete(app.findCollectionByNameOrId(n));
      } catch (_) {
        // already gone
      }
    }

    // 3) Recreate itinerary_votes voting on the ITEM (one row per item+participant).
    const votes = new Collection({
      type: 'base',
      name: 'itinerary_votes',
      fields: [
        { name: 'itinerary_item', type: 'relation', required: true, collectionId: itemsId, maxSelect: 1, cascadeDelete: true },
        { name: 'participant', type: 'relation', required: true, collectionId: partsId, maxSelect: 1, cascadeDelete: false },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false }
      ],
      indexes: ['CREATE INDEX idx_itin_votes_item ON itinerary_votes (itinerary_item)'],
      listRule: null,
      viewRule: null,
      createRule: null,
      updateRule: null,
      deleteRule: null
    });
    app.save(votes);
  },
  (app) => {
    const itemsId = app.findCollectionByNameOrId('itinerary_items').id;
    const partsId = app.findCollectionByNameOrId('participants').id;
    const locked = { listRule: null, viewRule: null, createRule: null, updateRule: null, deleteRule: null };

    // Recreate itinerary_options + option-based votes, drop kind, restore picked_option.
    try {
      app.delete(app.findCollectionByNameOrId('itinerary_votes'));
    } catch (_) {
      // gone
    }
    const options = new Collection({
      type: 'base',
      name: 'itinerary_options',
      fields: [
        { name: 'itinerary_item', type: 'relation', required: true, collectionId: itemsId, maxSelect: 1, cascadeDelete: true },
        { name: 'label', type: 'text', required: true, max: 200 },
        { name: 'url', type: 'text', max: 500 },
        { name: 'created_by', type: 'relation', required: false, collectionId: partsId, maxSelect: 1, cascadeDelete: false },
        { name: 'sort_order', type: 'number', onlyInt: true },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false }
      ],
      indexes: ['CREATE INDEX idx_itin_options_item ON itinerary_options (itinerary_item)'],
      ...locked
    });
    app.save(options);

    const votes = new Collection({
      type: 'base',
      name: 'itinerary_votes',
      fields: [
        { name: 'itinerary_option', type: 'relation', required: true, collectionId: options.id, maxSelect: 1, cascadeDelete: true },
        { name: 'participant', type: 'relation', required: true, collectionId: partsId, maxSelect: 1, cascadeDelete: false },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false }
      ],
      indexes: ['CREATE INDEX idx_itin_votes_option ON itinerary_votes (itinerary_option)'],
      ...locked
    });
    app.save(votes);

    const items = app.findCollectionByNameOrId('itinerary_items');
    items.fields.removeByName('kind');
    items.fields.add(new Field({ name: 'picked_option', type: 'relation', required: false, collectionId: options.id, maxSelect: 1, cascadeDelete: false }));
    app.save(items);
  }
);
