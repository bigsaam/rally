<script>
  import { invalidateAll } from '$app/navigation';
  import { tripAction } from '$lib/tripClient.js';
  import { Card, Button, EmptyState, Tooltip } from '@walaware/design';
  import SectionHeader from '$lib/ui/SectionHeader.svelte';
  import { tripDays, fmtWeekday, fmtMonthDay, fmtDateRange, tripLength } from '$lib/format.js';

  /**
   * @typedef {{ id: string, label: string, url: string, createdBy: string|null, votes: number, voters: string[], mine: boolean }} ItinOption
   * @typedef {{ id: string, date: string, time: string, label: string, createdBy: string|null, createdByName: string|null, pickedOption: string|null, myVote: string|null, options: ItinOption[] }} ItinItem
   */

  /**
   * @type {{
   *   shareToken: string,
   *   itineraryItems: ItinItem[],
   *   trip: { start_date?: string, end_date?: string },
   *   currentParticipantId: string | null,
   *   ownerMode?: boolean,
   *   onHide?: (() => void) | null,
   *   collapsed?: boolean,
   *   onToggle?: (() => void) | null
   * }}
   */
  let {
    shareToken,
    itineraryItems,
    trip,
    currentParticipantId,
    ownerMode = false,
    onHide = null,
    collapsed = false,
    onToggle = null
  } = $props();

  const range = $derived(fmtDateRange(trip.start_date, trip.end_date));
  const len = $derived(tripLength(trip.start_date, trip.end_date));
  const canVote = $derived(!!currentParticipantId);
  /** Creator of the item or an organizer may edit / remove / pick. */
  const canManage = (/** @type {ItinItem} */ it) => ownerMode || (!!currentParticipantId && it.createdBy === currentParticipantId);
  /** Suggester of an option or an organizer may remove it. */
  const canDropOption = (/** @type {ItinItem} */ it, /** @type {ItinOption} */ o) =>
    ownerMode || (!!currentParticipantId && (o.createdBy === currentParticipantId || it.createdBy === currentParticipantId));

  // Group items under the trip's days, plus a trailing "To decide" bucket for
  // undated decisions (the generic-poll home). Dated items outside the trip range
  // still get their own day group so nothing is hidden.
  const days = $derived(tripDays(trip.start_date, trip.end_date));
  const itemsByDate = $derived.by(() => {
    /** @type {Record<string, ItinItem[]>} */
    const m = {};
    for (const it of itineraryItems) if (it.date) (m[it.date] ??= []).push(it);
    return m;
  });
  const undated = $derived(itineraryItems.filter((it) => !it.date));
  /** @param {string} key YYYY-MM-DD */
  const keyLabel = (key) => `${fmtWeekday(`${key}T00:00:00.000Z`)} ${fmtMonthDay(`${key}T00:00:00.000Z`)}`;
  const groups = $derived.by(() => {
    const rangeKeys = days.map((d) => d.iso.slice(0, 10));
    const inRange = new Set(rangeKeys);
    const extra = [...new Set(itineraryItems.filter((it) => it.date && !inRange.has(it.date)).map((it) => it.date))].sort();
    return [...rangeKeys, ...extra].map((key) => ({ key, label: keyLabel(key), items: itemsByDate[key] ?? [] }));
  });
  const total = $derived(itineraryItems.length);

  let busy = $state(false);

  // One open "add item" form at a time, keyed by day ('' = the To-decide bucket).
  /** @type {string | null} */
  let addKey = $state(null);
  let niLabel = $state('');
  let niTime = $state('');
  // One open "suggest option" editor at a time, keyed by item id.
  let optFor = $state('');
  let oLabel = $state('');
  let oUrl = $state('');
  // One open item editor at a time.
  let editId = $state('');
  let eLabel = $state('');
  let eTime = $state('');

  /** @param {Record<string, unknown>} body */
  async function run(body) {
    if (busy) return;
    busy = true;
    try {
      await tripAction(shareToken, body);
      await invalidateAll();
    } catch (_) {
      await invalidateAll(); // reconcile on next load
    } finally {
      busy = false;
    }
  }

  /** @param {string|null} key the day to add to ('' = undated) */
  function openAdd(key) {
    addKey = key;
    niLabel = '';
    niTime = '';
  }
  async function submitAdd() {
    if (!niLabel.trim() || addKey === null) return;
    const date = addKey || undefined;
    await run({ op: 'itin_item_add', label: niLabel.trim(), time: niTime.trim(), date });
    addKey = null;
  }

  /** @param {ItinItem} it */
  function openEdit(it) {
    editId = it.id;
    eLabel = it.label;
    eTime = it.time;
  }
  async function submitEdit() {
    if (!eLabel.trim()) return;
    const id = editId;
    await run({ op: 'itin_item_update', itemId: id, label: eLabel.trim(), time: eTime.trim() });
    editId = '';
  }

  /** @param {string} itemId */
  function openOption(itemId) {
    optFor = itemId;
    oLabel = '';
    oUrl = '';
  }
  async function submitOption() {
    if (!oLabel.trim() || !optFor) return;
    const id = optFor;
    await run({ op: 'itin_option_add', itemId: id, label: oLabel.trim(), url: oUrl.trim() });
    optFor = '';
  }

  /** @param {string} optionId */
  const vote = (optionId) => run({ op: 'itin_vote', optionId });
  /** @param {string} optionId */
  const dropOption = (optionId) => run({ op: 'itin_option_remove', optionId });
  /** @param {string} itemId */
  const removeItem = (itemId) => run({ op: 'itin_item_remove', itemId });
  /** @param {string} itemId @param {string} optionId  '' clears the pick */
  const pick = (itemId, optionId) => run({ op: 'itin_pick', itemId, optionId });
</script>

<SectionHeader emoji="🗓️" title="Itinerary" subtitle={total ? `${total} planned` : ''} {onHide} {collapsed} {onToggle} />
<Card>
  <!-- The trip dates lead the plan (no separate Dates section). -->
  <div class="mb-3 flex items-baseline gap-2.5">
    <span class="font-display text-[20px] font-bold text-text-strong">{range || 'Dates TBD'}</span>
    {#if len.nights > 0}
      <span class="font-body text-[13px] font-extrabold text-text-muted">{len.nights} night{len.nights === 1 ? '' : 's'}</span>
    {/if}
  </div>

  {#if !days.length && !total}
    <EmptyState
      emoji="🗓️"
      title="No plan yet"
      body="Set the trip dates to build a day-by-day plan, or add a decision for the group to vote on."
    />
  {/if}

  <div class="flex flex-col gap-4">
    {#each groups as g (g.key)}
      {@render dayGroup(g.key, g.label, g.items)}
    {/each}

    <!-- Undated decisions: the generic-poll bucket. Always offer it so the group
         can vote on anything that isn't pinned to a day. -->
    {@render dayGroup('', 'To decide', undated, true)}
  </div>
</Card>

{#snippet dayGroup(/** @type {string} */ key, /** @type {string} */ label, /** @type {ItinItem[]} */ items, /** @type {boolean} */ decisions = false)}
  {#if items.length || canVote}
    <div>
      <div class="mb-1.5 flex items-center gap-2 px-1">
        <span class="font-display text-[13px] font-bold {decisions ? 'text-berry-600' : 'text-coral-600'}">
          {decisions ? '🗳️ ' : ''}{label}
        </span>
        <span class="h-px flex-1 bg-sand-200"></span>
      </div>

      <div class="flex flex-col gap-2">
        {#each items as it (it.id)}
          {@render itemRow(it)}
        {/each}

        {#if canVote}
          {#if addKey === key}
            <div class="flex flex-col gap-2 rounded-lg bg-sand-100 p-2.5 sm:flex-row">
              {#if !decisions}
                <input
                  bind:value={niTime}
                  placeholder="6pm"
                  maxlength="40"
                  class="rounded-md border-2 border-sand-300 bg-white px-2.5 py-2 font-body text-[14px] font-bold text-cocoa-900 outline-none focus:border-coral-400 sm:w-20"
                />
              {/if}
              <input
                bind:value={niLabel}
                placeholder={decisions ? 'What should the group decide?' : 'Add a plan…'}
                maxlength="200"
                onkeydown={(e) => e.key === 'Enter' && submitAdd()}
                class="flex-1 rounded-md border-2 border-sand-300 bg-white px-3 py-2 font-body text-[14px] font-bold text-cocoa-900 outline-none focus:border-coral-400"
              />
              <div class="flex gap-2">
                <Button variant="soft" size="sm" onclick={submitAdd} disabled={busy || !niLabel.trim()}>Add</Button>
                <Button variant="ghost" size="sm" onclick={() => (addKey = null)} disabled={busy}>Cancel</Button>
              </div>
            </div>
          {:else}
            <button
              type="button"
              onclick={() => openAdd(key)}
              class="rounded-lg border-2 border-dashed border-sand-300 py-1.5 font-body text-[13px] font-extrabold text-cocoa-500 transition hover:border-coral-300 hover:text-coral-600"
            >＋ {decisions ? 'Add a decision' : 'Add to this day'}</button>
          {/if}
        {/if}
      </div>
    </div>
  {/if}
{/snippet}

{#snippet itemRow(/** @type {ItinItem} */ it)}
  <div class="rounded-xl border-2 border-sand-200 bg-white p-3">
    {#if editId === it.id}
      <div class="flex flex-col gap-2 sm:flex-row">
        <input
          bind:value={eTime}
          placeholder="6pm"
          maxlength="40"
          class="rounded-md border-2 border-sand-300 bg-white px-2.5 py-1.5 font-body text-[14px] font-bold text-cocoa-900 outline-none focus:border-coral-400 sm:w-20"
        />
        <input
          bind:value={eLabel}
          maxlength="200"
          onkeydown={(e) => e.key === 'Enter' && submitEdit()}
          class="flex-1 rounded-md border-2 border-sand-300 bg-white px-3 py-1.5 font-body text-[14px] font-bold text-cocoa-900 outline-none focus:border-coral-400"
        />
        <div class="flex gap-2">
          <Button variant="soft" size="sm" onclick={submitEdit} disabled={busy || !eLabel.trim()}>Save</Button>
          <Button variant="ghost" size="sm" onclick={() => (editId = '')} disabled={busy}>Cancel</Button>
        </div>
      </div>
    {:else}
      <div class="group flex items-start gap-2">
        {#if it.time}
          <span class="mt-0.5 flex-none rounded-full bg-sand-200 px-2 py-0.5 font-body text-[12px] font-extrabold text-cocoa-600">{it.time}</span>
        {/if}
        <span class="min-w-0 flex-1 font-body text-[15px] font-extrabold text-cocoa-900">{it.label}</span>
        {#if canManage(it)}
          <span class="flex flex-none items-center gap-1 opacity-0 transition group-hover:opacity-100">
            <button type="button" aria-label="Edit" onclick={() => openEdit(it)} class="rounded-full px-1.5 font-body text-[12px] font-bold text-cocoa-400 hover:text-coral-600">Edit</button>
            <button type="button" aria-label="Remove" onclick={() => removeItem(it.id)} disabled={busy} class="rounded-full px-1.5 font-body text-[12px] font-bold text-cocoa-400 hover:text-berry-600">Remove</button>
          </span>
        {/if}
      </div>
    {/if}

    <!-- Options + voting. Tap an option to cast (or clear) your single vote. -->
    {#if it.options.length}
      <div class="mt-2.5 flex flex-col gap-1.5">
        {#each it.options as o (o.id)}
          {@const picked = it.pickedOption === o.id}
          <div class="flex items-center gap-1.5">
            <button
              type="button"
              onclick={() => canVote && vote(o.id)}
              disabled={busy || !canVote}
              aria-pressed={o.mine}
              class="flex min-w-0 flex-1 items-center gap-2 rounded-lg border-2 px-2.5 py-1.5 text-left transition {o.mine ? 'border-coral-400 bg-coral-200' : 'border-sand-200 bg-white'} {canVote ? 'hover:border-coral-300' : ''} {picked ? 'ring-2 ring-leaf-300' : ''}"
            >
              <span class="grid h-6 min-w-6 flex-none place-items-center rounded-full px-1.5 font-display text-[12px] font-bold {o.mine ? 'bg-coral-500 text-white' : 'bg-sand-200 text-cocoa-600'}">{o.votes}</span>
              <span class="min-w-0 flex-1 truncate font-body text-[14px] font-bold text-cocoa-900">{o.label}</span>
              {#if picked}
                <span class="flex-none rounded-full bg-leaf-200 px-1.5 py-0.5 font-body text-[10px] font-extrabold text-leaf-600">✓ Plan</span>
              {/if}
            </button>
            {#if o.url}
              <a href={o.url} target="_blank" rel="noopener" aria-label="Open link" class="flex-none rounded-full px-1.5 font-body text-[13px] font-extrabold text-coral-600">↗</a>
            {/if}
            {#if canManage(it)}
              <button
                type="button"
                onclick={() => pick(it.id, picked ? '' : o.id)}
                disabled={busy}
                title={picked ? 'Unpick' : 'Lock this in as the plan'}
                class="flex-none rounded-full px-1.5 font-body text-[12px] font-extrabold {picked ? 'text-leaf-600' : 'text-cocoa-400 hover:text-leaf-600'}"
              >{picked ? '✓' : 'Pick'}</button>
            {/if}
            {#if canDropOption(it, o)}
              <button type="button" aria-label="Remove option" onclick={() => dropOption(o.id)} disabled={busy} class="flex-none rounded-full px-1 font-body text-[13px] font-bold text-cocoa-300 hover:text-berry-600">✕</button>
            {/if}
          </div>
        {/each}
      </div>
    {/if}

    <!-- Suggest an option (any member). Two+ options turn an item into a vote. -->
    {#if canVote}
      {#if optFor === it.id}
        <div class="mt-2 flex flex-col gap-2 sm:flex-row">
          <input
            bind:value={oLabel}
            placeholder="Suggest an option…"
            maxlength="200"
            onkeydown={(e) => e.key === 'Enter' && submitOption()}
            class="flex-1 rounded-md border-2 border-sand-300 bg-white px-3 py-1.5 font-body text-[14px] font-bold text-cocoa-900 outline-none focus:border-coral-400"
          />
          <input
            bind:value={oUrl}
            placeholder="Link (optional)"
            class="rounded-md border-2 border-sand-300 bg-white px-3 py-1.5 font-body text-[14px] font-bold text-cocoa-900 outline-none focus:border-coral-400 sm:w-40"
          />
          <div class="flex gap-2">
            <Button variant="soft" size="sm" onclick={submitOption} disabled={busy || !oLabel.trim()}>Add</Button>
            <Button variant="ghost" size="sm" onclick={() => (optFor = '')} disabled={busy}>Cancel</Button>
          </div>
        </div>
      {:else}
        <Tooltip label="Suggest an option people can vote on" placement="top">
          <button
            type="button"
            onclick={() => openOption(it.id)}
            class="mt-2 font-body text-[13px] font-extrabold text-coral-600 hover:underline"
          >＋ {it.options.length ? 'Another option' : 'Suggest options to vote on'}</button>
        </Tooltip>
      {/if}
    {/if}

    {#if it.createdByName && !it.options.length}
      <p class="mt-1.5 font-body text-[12px] font-bold text-cocoa-400">added by {it.createdByName}</p>
    {/if}
  </div>
{/snippet}
