/// <reference path="../pb_data/types.d.ts" />

// Link a packing item back to the gear claim that created it. When someone
// claims gear ("I'll bring the tent"), we auto-add a personal packing item so
// they remember to actually pack it; `from_gear` lets us find & remove it if
// they release the claim, and prevents duplicates. cascadeDelete: deleting the
// gear item removes its auto-added packing rows.

migrate(
  (app) => {
    const packing = app.findCollectionByNameOrId('packing_items');
    const gear = app.findCollectionByNameOrId('gear_items');
    packing.fields.add(
      new Field({
        name: 'from_gear',
        type: 'relation',
        required: false,
        collectionId: gear.id,
        maxSelect: 1,
        cascadeDelete: true
      })
    );
    app.save(packing);
  },
  (app) => {
    const packing = app.findCollectionByNameOrId('packing_items');
    packing.fields.removeByName('from_gear');
    app.save(packing);
  }
);
