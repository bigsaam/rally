# Rally AI Features — Design

> Status: **design** (not yet built). Builds on `docs/api-layer.md` — AI helpers
> live in the service core, server-side only.

## Principles (from the product owner)

1. **Invisible.** No sparkles, no "✨ AI" badges, no "AI-powered" copy, no
   dedicated AI panel. AI just makes the app feel smart. A user should never
   know whether a result came from a model or a lookup table.
2. **Tasteful, not spammy.** A few high-value touches, not an assistant bolted
   onto every surface. AI augments existing actions; it never adds new ceremony.
3. **BYO token, self-hosted, cheap.** The operator supplies an OpenAI-compatible
   endpoint (DeepSeek, MiniMax, or any local server). Designed around small/cheap
   models — short prompts, tight token caps, heavy caching.
4. **Always optional.** With no key configured, **every AI feature degrades to a
   deterministic fallback** and the app is fully functional. AI is enrichment,
   never a dependency.
5. **Never blocking, never loud on failure.** The user action completes
   instantly with the fallback; AI enrichment arrives async and silently. On
   error/timeout we keep the fallback — we never surface "AI failed".

## Configuration (operator env, server-side only)

```
AI_BASE_URL=https://api.deepseek.com/v1     # or MiniMax / local
AI_API_KEY=sk-...                           # never sent to the browser
AI_MODEL=deepseek-chat                       # one cheap model is plenty
AI_ENABLED=auto                              # auto = on iff API key present
```

If `AI_API_KEY` is unset, `isAiEnabled()` returns false and all helpers return
their fallback. The key lives only in the SvelteKit server / service core — the
browser calls our endpoints, never the LLM directly.

## Where it lives

A `ai/` module in `@rally/core` (see `docs/api-layer.md`), wrapping an
OpenAI-compatible chat-completions client. Web app and MCP both reach it through
the service core, so there's one place for prompts, caching, and limits.

```
@rally/core/ai/
  client.ts      # OpenAI-compatible fetch wrapper, timeout, JSON-mode
  emoji.ts       # pickEmoji(name) → string   (fallback: gearEmoji map)
  suggest.ts     # suggestItems(section, trip) → string[]
  cache.ts       # normalized-name → result, persisted in a pb collection
```

## The features (v1 — small and high-value)

### 1. Auto-emoji for items (the flagship invisible touch)
When someone adds gear/packing/a meal, the leading emoji tile is chosen from the
item **name** (e.g. "2-burner stove" → 🔥, "bear canister" → 🐻). Today this is a
`category → emoji` lookup (`web/src/lib/avatar.js`); AI upgrades it to
name-aware. It just appears — no affordance, no label.
- **Fallback:** the existing deterministic map. AI off → map; AI on → model with
  map as the safety net on error/malformed output.
- **Cheap by design:** cache by normalized item name (same name never re-queried;
  shared across trips). Single-token-ish completion, temperature 0, JSON output
  `{ "emoji": "…" }` validated to one grapheme.
- **Non-blocking:** item is created immediately with the fallback emoji; the AI
  result patches the row when it returns (optimistic, realtime-friendly).

### 2. Starter suggestions on empty sections
An empty gear/packing/meals card already invites action ("be the first to grab
something!"). AI adds a quiet **"need ideas?"**-style row of tappable chips
seeded from the trip (type, dates, location) — e.g. for a 2-night camp:
"Tent · Stove · Headlamp · Bear canister". Each chip is just an **Add** action;
nothing announces it as AI.
- **Fallback:** a static per-section starter list keyed by trip type.
- One call per section, cached per (trip, section) for the trip's lifetime,
  refreshable.

### 3. (Later, optional) Light text help
- Tidy a trip description on create (one pass, user edits freely).
- Suggest a dish for a meal slot a person signed up for.
Both are opt-in micro-affordances, same invisibility rules.

## Cost & safety discipline

- **Cache first** — normalized-name emoji cache turns repeat items into zero
  calls; suggestion results cached per trip/section. (See the content-hash-cache
  pattern.)
- **Tight budgets** — low `max_tokens`, `temperature: 0` for deterministic tasks,
  JSON mode + strict parse, fallback on any deviation.
- **Rate limit** per trip/IP to stop a shared link from running up the operator's
  bill; log spend if the endpoint reports usage.
- **Privacy note for operators:** item text + trip basics are sent to the
  configured endpoint. Self-hosted + their own key = their call; documented in
  the README's AI section when built. No secrets or owner tokens are ever sent.

## Data model touch

- `gear_items` / `packing_items` / `meal_*` gain an optional `emoji` text field
  (nullable). Null → render the fallback. Populated by the auto-emoji helper.
- A small `ai_cache` collection: `key` (normalized name / section signature),
  `value` (json), `created` — so caching survives restarts and is shared.

## Build order (after the interactive MVP steps)

1. `ai/client.ts` + `isAiEnabled()` + config plumbing.
2. `emoji` field migration + `pickEmoji` with cache; wire into add-item flows
   (replaces the static map call site, keeps it as fallback).
3. Empty-section suggestions.
4. Expose the same helpers as MCP tools (`rally_suggest_items`, etc.) for the
   AI-management surface.
