/// <reference path="../pb_data/types.d.ts" />

// Dietary restrictions (#3): a free-text note per participant ("vegetarian",
// "no nuts", "gluten-free") that surfaces in the Meals section so whoever's
// cooking can plan around it. Empty = none (back-compat). Superuser-locked like
// the rest; written via the /actions endpoint (each member sets their own).

migrate(
  (app) => {
    const participants = app.findCollectionByNameOrId('participants');
    participants.fields.add(new Field({ name: 'dietary', type: 'text', max: 200 }));
    app.save(participants);
  },
  (app) => {
    const participants = app.findCollectionByNameOrId('participants');
    participants.fields.removeByName('dietary');
    app.save(participants);
  }
);
