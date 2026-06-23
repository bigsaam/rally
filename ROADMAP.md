# 🧭 Rally — Roadmap

Where Rally is headed. This is a living document; each item links to a tracking
[issue](https://github.com/bigsaam/rally/issues?q=is%3Aissue+label%3Aroadmap),
grouped into [milestones](https://github.com/bigsaam/rally/milestones). Ideas and
discussion live in
[Discussions](https://github.com/bigsaam/rally/discussions).

> Rally is a [heavily AI-developed](./AI_POLICY.md) codebase built under human
> direction. The roadmap is human-owned — these are the things we *want* to
> build, roughly in order. Order and scope will shift (e.g. accounts landed
> ahead of the v1–v3 polish once we decided privacy needed real identity).

## Shipped

- One invite link per trip; **accounts** (Google OAuth2 + email/password) — sign
  in to join, and only invited members see the details (non-members get a teaser)
- **Membership + roles** — organizer / guest; creator is auto-organizer;
  membership-gated, server-mediated writes
- **Participant claim/merge** — sign in and claim your pre-auth name (no dupes)
- **Multi-trip dashboard** — your trips bucketed Happening now / Upcoming / Past
  with counts, organizer badges, and a "no trips yet" empty state
- Adopt-by-name identity, RSVP with a "maybe" lean, collision-safe gear claims,
  per-day Meals (owner + helpers), Packing, batch-add
- 3-word invite slugs (~19 bits) + in-memory rate limiting
- Locked-down API (browser never touches PocketBase), "Campfire" design system,
  responsive desktop/mobile

---

## v1 · Quick Wins & Polish

- [x] ~~#1 Trip secret / passphrase invite~~ — dropped; superseded by accounts
- [ ] [#2 Weather forecast + countdown](https://github.com/bigsaam/rally/issues/2)
- [ ] [#3 Dietary restrictions (feeds Meals)](https://github.com/bigsaam/rally/issues/3)
- [ ] [#4 Emergency info card](https://github.com/bigsaam/rally/issues/4)
- [ ] [#5 Clone / template trips](https://github.com/bigsaam/rally/issues/5)
- [ ] [#6 Add / remove meal slot control](https://github.com/bigsaam/rally/issues/6)
- [x] [#7 3-word slugs + rate limiting](https://github.com/bigsaam/rally/issues/7) ✅

## v2 · Organizer & Post-Trip

- [x] [#8 Visible organizer role + co-organizers](https://github.com/bigsaam/rally/issues/8) ✅
- [ ] [#9 Post-trip view (auto-switch after end date)](https://github.com/bigsaam/rally/issues/9)
- [ ] [#10 Trip "Wrapped" recap](https://github.com/bigsaam/rally/issues/10)
- [ ] [#11 Check-in / "I've arrived" status](https://github.com/bigsaam/rally/issues/11)

## v3 · Maps & Location

- [ ] [#12 Proper map support for all trip types](https://github.com/bigsaam/rally/issues/12) *(epic)*
- [ ] [#13 Live friend location ("Find My"-style)](https://github.com/bigsaam/rally/issues/13) *(epic · needs native)*

## v4 · Identity & Multi-Trip

- [x] [#14 Auth / identity system](https://github.com/bigsaam/rally/issues/14) ✅ *(keystone)*
- [x] [#15 Trip dashboard (past / current / upcoming + stats)](https://github.com/bigsaam/rally/issues/15) ✅
- [ ] [#16 Invite a co-organizer by account](https://github.com/bigsaam/rally/issues/16)

## v5 · Collaboration

- [ ] [#17 Polls / voting](https://github.com/bigsaam/rally/issues/17)
- [ ] [#18 Itinerary timeline](https://github.com/bigsaam/rally/issues/18)
- [ ] [#19 Lightweight chat / comments](https://github.com/bigsaam/rally/issues/19)
- [ ] [#20 Web push notifications](https://github.com/bigsaam/rally/issues/20)

## v6 · Media & Integrations

- [ ] [#21 Immich auto-album](https://github.com/bigsaam/rally/issues/21)
- [ ] [#22 Shared photo wall](https://github.com/bigsaam/rally/issues/22)
- [ ] [#23 Collaborative playlist](https://github.com/bigsaam/rally/issues/23)

## Future · Backlog

- [ ] [#24 Expenses — native split / settle-up](https://github.com/bigsaam/rally/issues/24) *(epic)*
- [ ] [#25 Carpooling / convoy sub-groups](https://github.com/bigsaam/rally/issues/25)
- [ ] [#26 Native app — PWA → iOS/Android (Capacitor)](https://github.com/bigsaam/rally/issues/26) *(epic · needs native)*
- [ ] [#27 AI features — invisible, BYO-token](https://github.com/bigsaam/rally/issues/27)
- [ ] [#28 MCP / API layer](https://github.com/bigsaam/rally/issues/28) *(epic)*
- [ ] [#29 Activities section vs gear](https://github.com/bigsaam/rally/issues/29)
- [ ] [#30 Friend graph — invite-by-friend](https://github.com/bigsaam/rally/issues/30) *(optional)*

---

## Notes

- **Accounts are the foundation** ([#14](https://github.com/bigsaam/rally/issues/14),
  shipped) — they unlocked the dashboard ([#15](https://github.com/bigsaam/rally/issues/15)),
  co-organizing, and gating private content to invited members. Casual attendees
  still just open the link and sign in.
- **Native unlocks location.** Live friend location
  ([#13](https://github.com/bigsaam/rally/issues/13)) needs the native/PWA app
  ([#26](https://github.com/bigsaam/rally/issues/26)) for reliable background
  location.

Want to suggest or upvote something? Open a
[Discussion](https://github.com/bigsaam/rally/discussions) or an
[issue](https://github.com/bigsaam/rally/issues/new).
