# Contributing to tripwala

Thanks for wanting to help! tripwala is a small, friendly codebase and we'd love
your contributions — bug fixes, features, docs, or just ideas.

## Ground rules

- **Be kind.** See the [Code of Conduct](./CODE_OF_CONDUCT.md).
- **AI-assisted work is welcome.** tripwala is itself heavily AI-developed (see the
  [AI policy](./AI_POLICY.md)). Use whatever tools you like — but *you* own your
  PR: understand it, test it, and review it before submitting.
- **Keep the no-account principle.** tripwala's whole point is *one link, no
  mandatory logins*. Features should preserve that — don't add required signups.
- **Mobile-first.** Most people open trip links on a phone. Design for that, let
  it scale up.
- **Small, focused PRs.** One concern per PR. A clear title and a short "why".

## Getting set up

You need [Node 22+](https://nodejs.org), [pnpm](https://pnpm.io), and the
[PocketBase](https://pocketbase.io) binary (or Docker).

```bash
# 1. Backend — PocketBase (migrations + a seed trip auto-apply on first serve)
cd pocketbase
# download the pinned binary (see README), then:
./pocketbase serve --http=127.0.0.1:8090
# create a local superuser the dev server authenticates as:
./pocketbase superuser upsert admin@tripwala.local tripwalaadmin123

# 2. Frontend — SvelteKit
cd ../web
pnpm install
pnpm dev    # http://localhost:5173/demo-tripwala-weekend
```

Or run the whole stack with `docker compose up --build` (see the README).

## Before you open a PR

```bash
cd web
pnpm check    # svelte-check / type check — must be clean
pnpm build    # must succeed
```

- Match the surrounding code style (Prettier-formatted, JSDoc types in `.js`,
  Svelte 5 runes).
- Touching data? Add a PocketBase migration in `pocketbase/pb_migrations/` rather
  than editing the DB by hand — migrations are the source of truth.
- Touching writes? They go through the server (`/[share_token]/actions`), never
  the browser→PocketBase directly. See the **Security model** in the README.

## Architecture in one breath

SvelteKit (Svelte 5 + Tailwind v4) talks to PocketBase. The browser never hits
PocketBase directly — reads come through the page `load()`, writes through a
single server endpoint that scopes everything to the trip's share token. The
visual language is the **Campfire** design system (`web/src/lib/ui/`).

## Reporting bugs / requesting features

Open an issue using the templates. For bugs, include steps to reproduce and what
you expected. For features, tell us the *use case* — tripwala grows from real trips.
