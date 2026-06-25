<script>
  import { invalidateAll } from '$app/navigation';
  import { Card } from '@walaware/design';
  import { Button } from '@walaware/design';
  import { TextField } from '@walaware/design';
  import { EmptyState } from '@walaware/design';
  import SectionHeader from '$lib/ui/SectionHeader.svelte';
  import { planAction } from '$lib/planClient.js';

  /**
   * @type {{
   *   shareToken: string,
   *   locations: Array<{id:string,label:string,url:string,note:string,suggester:string,votes:number,mine:boolean}>,
   *   isOrganizer: boolean,
   *   pickedLabel: string
   * }}
   */
  let { shareToken, locations, isOrganizer, pickedLabel } = $props();

  // The add form stays collapsed until you tap "Add a place" — name, link and
  // note only take up space while you're actually adding one.
  let adding = $state(false);
  let label = $state('');
  let url = $state('');
  let note = $state('');
  let busy = $state(false);
  let error = $state('');

  function resetForm() {
    label = '';
    url = '';
    note = '';
    error = '';
  }

  async function add() {
    if (!label.trim() || busy) return;
    busy = true;
    error = '';
    try {
      await planAction(shareToken, { op: 'add_location', label, url, note });
      resetForm();
      adding = false;
      await invalidateAll();
    } catch (_) {
      error = 'Could not add that — check the link starts with http(s)://';
    } finally {
      busy = false;
    }
  }

  /** @param {string} ideaId */
  async function vote(ideaId) {
    try {
      await planAction(shareToken, { op: 'vote_location', ideaId });
      await invalidateAll();
    } catch (_) {
      await invalidateAll();
    }
  }

  /** @param {string} ideaId @param {string} op */
  async function ownerOp(ideaId, op) {
    try {
      await planAction(shareToken, { op, ideaId });
      await invalidateAll();
    } catch (_) {
      await invalidateAll();
    }
  }
</script>

<SectionHeader emoji="📍" title="Where should we go?" />
<Card>

  {#if locations.length}
    <div class="flex flex-col gap-2">
      {#each locations as loc (loc.id)}
        <div class="flex items-start gap-2.5 rounded-xl bg-sand-100 p-2.5">
          <button
            type="button"
            onclick={() => vote(loc.id)}
            class="flex w-12 flex-none flex-col items-center rounded-lg py-1 transition {loc.mine ? 'bg-coral-500 text-white' : 'bg-white text-cocoa-700'}"
            aria-label="upvote"
          >
            <span class="text-sm leading-none">▲</span>
            <span class="font-display text-sm font-bold">{loc.votes}</span>
          </button>
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-1.5">
              <span class="truncate font-display text-sm font-semibold text-cocoa-900">{loc.label}</span>
              {#if loc.label === pickedLabel}
                <span class="flex-none rounded-full bg-leaf-200 px-1.5 py-0.5 font-body text-[10px] font-extrabold text-leaf-600">picked</span>
              {/if}
            </div>
            {#if loc.note}
              <p class="mt-0.5 whitespace-pre-line break-words font-body text-xs font-bold text-cocoa-600">{loc.note}</p>
            {/if}
            {#if loc.url || loc.suggester}
              <div class="mt-0.5 flex flex-wrap items-center gap-x-1.5">
                {#if loc.url}
                  <a href={loc.url} target="_blank" rel="noopener" class="font-body text-xs font-extrabold text-coral-600 underline">link ↗</a>
                {/if}
                {#if loc.suggester}
                  <span class="font-body text-xs font-bold text-cocoa-400">{loc.url ? '· ' : ''}{loc.suggester}</span>
                {/if}
              </div>
            {/if}
          </div>
          {#if isOrganizer}
            <button type="button" onclick={() => ownerOp(loc.id, 'pick_location')} class="flex-none font-body text-xs font-extrabold text-leaf-600 hover:underline">Pick</button>
          {/if}
        </div>
      {/each}
    </div>
  {:else}
    <EmptyState emoji="🗺️" title="No ideas yet" body="Drop the first spot." />
  {/if}

  {#if adding}
    <div class="mt-3 flex flex-col gap-2 rounded-xl bg-sand-100 p-3">
      <!-- svelte-ignore a11y_autofocus -->
      <TextField prefix="📍" placeholder="Place name" maxlength={200} bind:value={label} autofocus />
      <TextField prefix="🔗" placeholder="Link (optional)" bind:value={url} />
      <TextField prefix="📝" placeholder="Note (optional) — drive time, vibe, cost…" maxlength={500} bind:value={note} />
      {#if error}<p class="font-body text-xs font-bold text-berry-600">{error}</p>{/if}
      <div class="flex gap-2">
        <Button variant="soft" size="sm" onclick={add} disabled={!label.trim() || busy}>{busy ? 'Adding…' : 'Add place'}</Button>
        <Button variant="ghost" size="sm" onclick={() => { resetForm(); adding = false; }} disabled={busy}>Cancel</Button>
      </div>
    </div>
  {:else}
    <button
      type="button"
      onclick={() => (adding = true)}
      class="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-sand-300 py-2.5 font-body text-[13px] font-extrabold text-cocoa-500 transition hover:border-coral-300 hover:text-coral-600"
    >➕ Add a place</button>
  {/if}
</Card>
