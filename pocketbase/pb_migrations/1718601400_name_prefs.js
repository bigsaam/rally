/// <reference path="../pb_data/types.d.ts" />

// Per-user name display prefs (shown across every trip):
// - nickname: an explicit name to show instead of the account name (optional).
// - show_last_name: when true, show the full account name; default (false) shows
//   first name only. The app shows FIRST NAMES by default.
// Both empty/false read as the defaults, so existing users are unaffected.

migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('users');
    users.fields.add(new Field({ name: 'nickname', type: 'text', max: 100 }));
    users.fields.add(new Field({ name: 'show_last_name', type: 'bool' }));
    app.save(users);
  },
  (app) => {
    const users = app.findCollectionByNameOrId('users');
    users.fields.removeByName('nickname');
    users.fields.removeByName('show_last_name');
    app.save(users);
  }
);
