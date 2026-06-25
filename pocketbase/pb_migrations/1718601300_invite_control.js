/// <reference path="../pb_data/types.d.ts" />

// Invite control (organizer-set, on the trip):
// - join_policy: 'instant' (anyone with the link joins) | 'approval'
//   (link-joiners land as pending until an organizer approves them).
// - invite_visibility: 'everyone' | 'organizers' — who sees the invite-link
//   affordance (organizers always do).
// - participants.status: 'active' | 'pending' — pending = a link-join awaiting
//   approval; they can't see or act on the trip until approved.
//
// Empty values read as the permissive defaults (instant / everyone / active) in
// app code, so existing trips and members are unaffected.

migrate(
  (app) => {
    const trips = app.findCollectionByNameOrId('trips');
    trips.fields.add(new Field({ name: 'join_policy', type: 'select', maxSelect: 1, values: ['instant', 'approval'] }));
    trips.fields.add(new Field({ name: 'invite_visibility', type: 'select', maxSelect: 1, values: ['everyone', 'organizers'] }));
    app.save(trips);

    const participants = app.findCollectionByNameOrId('participants');
    participants.fields.add(new Field({ name: 'status', type: 'select', maxSelect: 1, values: ['active', 'pending'] }));
    app.save(participants);
  },
  (app) => {
    const trips = app.findCollectionByNameOrId('trips');
    trips.fields.removeByName('join_policy');
    trips.fields.removeByName('invite_visibility');
    app.save(trips);

    const participants = app.findCollectionByNameOrId('participants');
    participants.fields.removeByName('status');
    app.save(participants);
  }
);
