/// <reference path="../pb_data/types.d.ts" />

// "Maybe" confidence (the design's LeanMeter): 1 = long shot, 2 = 50/50,
// 3 = leaning yes. Null/0 when the person isn't a Maybe. Optional int.

migrate(
  (app) => {
    const c = app.findCollectionByNameOrId('participants');
    c.fields.add(new Field({ name: 'lean', type: 'number', required: false, onlyInt: true }));
    app.save(c);
  },
  (app) => {
    const c = app.findCollectionByNameOrId('participants');
    c.fields.removeByName('lean');
    app.save(c);
  }
);
