/// <reference path="../pb_data/types.d.ts" />

// Planning phase (#31): a first-class stage for trips that are still an idea.
//
// - trips.status: planning | confirmed | completed (owner picks the stage;
//   existing trips have no value and are treated as confirmed by the app).
// - trips.trip_type: the kind of trip (sets the planning vibe).
// - date_options / date_votes: owner-proposed candidate date ranges that members
//   vote yes/maybe/no on. Free-pick availability reuses participants.available_dates.
// - location_ideas / location_votes: member-suggested locations + upvotes.
//
// All new collections are superuser-only (like the rest): the browser never
// touches PocketBase — reads via load(), writes via the /plan endpoint.

migrate(
  (app) => {
    const trips = app.findCollectionByNameOrId('trips');
    trips.fields.add(
      new Field({
        name: 'status',
        type: 'select',
        maxSelect: 1,
        values: ['planning', 'confirmed', 'completed']
      })
    );
    trips.fields.add(
      new Field({
        name: 'trip_type',
        type: 'select',
        maxSelect: 1,
        values: ['camping', 'backpacking', 'road_trip', 'cabin', 'ski', 'beach', 'city', 'festival', 'other']
      })
    );
    app.save(trips);

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

    const dateOptions = new Collection({
      type: 'base',
      name: 'date_options',
      fields: [
        rel('trip', tripsId, true, true),
        { name: 'start_date', type: 'date', required: true },
        { name: 'end_date', type: 'date' },
        { name: 'sort_order', type: 'number', onlyInt: true },
        created
      ],
      indexes: ['CREATE INDEX idx_date_options_trip ON date_options (trip)'],
      ...locked
    });
    app.save(dateOptions);
    const dateOptId = app.findCollectionByNameOrId('date_options').id;

    const dateVotes = new Collection({
      type: 'base',
      name: 'date_votes',
      fields: [
        rel('date_option', dateOptId, true, true),
        rel('participant', partsId, true, true),
        { name: 'vote', type: 'select', maxSelect: 1, values: ['yes', 'maybe', 'no'] },
        created
      ],
      indexes: [
        'CREATE INDEX idx_date_votes_option ON date_votes (date_option)',
        'CREATE UNIQUE INDEX idx_date_votes_unique ON date_votes (date_option, participant)'
      ],
      ...locked
    });
    app.save(dateVotes);

    const locationIdeas = new Collection({
      type: 'base',
      name: 'location_ideas',
      fields: [
        rel('trip', tripsId, true, true),
        rel('participant', partsId, false, false), // suggester
        { name: 'label', type: 'text', required: true, max: 200 },
        { name: 'url', type: 'url' },
        created
      ],
      indexes: ['CREATE INDEX idx_location_ideas_trip ON location_ideas (trip)'],
      ...locked
    });
    app.save(locationIdeas);
    const locId = app.findCollectionByNameOrId('location_ideas').id;

    const locationVotes = new Collection({
      type: 'base',
      name: 'location_votes',
      fields: [
        rel('location_idea', locId, true, true),
        rel('participant', partsId, true, true),
        created
      ],
      indexes: [
        'CREATE INDEX idx_location_votes_idea ON location_votes (location_idea)',
        'CREATE UNIQUE INDEX idx_location_votes_unique ON location_votes (location_idea, participant)'
      ],
      ...locked
    });
    app.save(locationVotes);
  },
  (app) => {
    for (const n of ['location_votes', 'location_ideas', 'date_votes', 'date_options']) {
      try {
        app.delete(app.findCollectionByNameOrId(n));
      } catch (_) {
        // already gone
      }
    }
    const trips = app.findCollectionByNameOrId('trips');
    trips.fields.removeByName('status');
    trips.fields.removeByName('trip_type');
    app.save(trips);
  }
);
