/// <reference path="../pb_data/types.d.ts" />

// A free-text note on a location idea — lets the suggester add context
// ("2-hr drive · dog-friendly · $$") alongside the optional link. Superuser-
// locked like the rest of planning; written via the /plan endpoint.

migrate(
  (app) => {
    const ideas = app.findCollectionByNameOrId('location_ideas');
    ideas.fields.add(new Field({ name: 'note', type: 'text', max: 500 }));
    app.save(ideas);
  },
  (app) => {
    const ideas = app.findCollectionByNameOrId('location_ideas');
    ideas.fields.removeByName('note');
    app.save(ideas);
  }
);
