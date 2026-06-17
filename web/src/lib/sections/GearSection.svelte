<script>
  import { invalidateAll } from '$app/navigation';
  import { pb } from '$lib/pocketbase.js';
  import { gearEmoji } from '$lib/avatar.js';
  import Card from '$lib/ui/Card.svelte';
  import CardHeader from '$lib/ui/CardHeader.svelte';
  import Avatar from '$lib/ui/Avatar.svelte';
  import Button from '$lib/ui/Button.svelte';
  import EmptyState from '$lib/ui/EmptyState.svelte';

  /**
   * @type {{
   *   tripId: string,
   *   gear: Array<any>,
   *   currentParticipantId: string | null
   * }}
   */
  let { tripId, gear, currentParticipantId } = $props();

  const open = $derived(gear.filter((g) => g.remaining > 0).length);

  let busy = $state('');
  let adding = $state(false);
  let newName = $state('');

  /** find my claim on an item, if any */
  function myClaim(/** @type {any} */ g) {
    return g.claims.find((/** @type {any} */ c) => c.participant === currentParticipantId) ?? null;
  }

  /** @param {any} g */
  async function claim(g) {
    if (!currentParticipantId || busy) return;
    busy = g.id;
    try {
      await pb()
        .collection('gear_claims')
        .create({ gear_item: g.id, participant: currentParticipantId, qty_claimed: Math.max(1, g.remaining) });
      await invalidateAll();
    } catch (_) {
      /* reconciled on next load */
    } finally {
      busy = '';
    }
  }

  /** @param {any} g */
  async function release(g) {
    const mine = myClaim(g);
    if (!mine || busy) return;
    busy = g.id;
    try {
      await pb().collection('gear_claims').delete(mine.id);
      await invalidateAll();
    } catch (_) {
      /* reconciled */
    } finally {
      busy = '';
    }
  }

  async function addItem() {
    const name = newName.trim();
    if (!name) return;
    busy = 'add';
    try {
      const data = { trip: tripId, name, qty_needed: 1 };
      if (currentParticipantId) Object.assign(data, { created_by: currentParticipantId });
      await pb().collection('gear_items').create(data);
      newName = '';
      adding = false;
      await invalidateAll();
    } catch (_) {
      /* reconciled */
    } finally {
      busy = '';
    }
  }
</script>

<Card>
  <CardHeader icon="🎒" iconBg="var(--color-sun-200)" title="Who's bringing what?">
    {#snippet action()}
      <button
        type="button"
        aria-label="Add gear"
        onclick={() => (adding = !adding)}
        class="grid h-8 w-8 place-items-center rounded-full bg-sun-200 text-lg text-sun-600 transition active:scale-90"
      >
        ＋
      </button>
    {/snippet}
  </CardHeader>

  {#if gear.length === 0 && !adding}
    <EmptyState emoji="🦗" title="Nothing on the list yet" body="Add the first thing someone needs to bring." action="Add gear" onAction={() => (adding = true)} />
  {:else}
    {#each gear as g, i}
      {@const mine = myClaim(g)}
      <div class="flex items-center gap-3 py-2.5 {i !== 0 ? 'border-t border-sand-200' : ''}">
        <span
          class="grid h-10 w-10 flex-none place-items-center rounded-md text-[19px]"
          style="background: {g.remaining === 0 ? 'var(--color-coral-200)' : 'var(--color-sun-200)'}"
        >
          {gearEmoji(g.category)}
        </span>
        <span class="min-w-0 flex-1">
          <span class="block font-body text-[15px] font-extrabold text-cocoa-900">
            {g.qty_needed > 1 ? `${g.name} ×${g.qty_needed}` : g.name}
          </span>
          <span class="block font-body text-[12.5px] font-bold text-cocoa-500">
            {g.claims.length
              ? `${g.claims.map((/** @type {any} */ c) => c.participantName).join(' & ')} ${g.claims.length === 1 ? "'s got it" : 'have it'}`
              : 'up for grabs!'}
          </span>
        </span>
        {#if mine}
          <button
            type="button"
            disabled={busy === g.id}
            onclick={() => release(g)}
            class="flex-none rounded-full px-3 py-1.5 font-display text-[13px] font-semibold text-cocoa-500 hover:text-coral-600"
          >
            Release
          </button>
        {:else if g.remaining > 0 && currentParticipantId}
          <Button variant="secondary" size="sm" disabled={busy === g.id} onclick={() => claim(g)}>
            {busy === g.id ? '…' : "I'll bring it"}
          </Button>
        {:else if g.claims.length}
          <Avatar name={g.claims[0].participantName} size={28} />
        {/if}
      </div>
    {/each}
  {/if}

  {#if adding}
    <div class="mt-2 flex gap-2">
      <input
        bind:value={newName}
        placeholder="Add gear (e.g. Tent)"
        maxlength="200"
        onkeydown={(e) => e.key === 'Enter' && addItem()}
        class="flex-1 rounded-md border-2 border-sand-300 bg-white px-3 py-2 font-body text-[15px] font-bold text-cocoa-900 outline-none focus:border-coral-400"
      />
      <Button variant="primary" size="sm" disabled={busy === 'add' || !newName.trim()} onclick={addItem}>Add</Button>
    </div>
  {/if}

  {#if gear.length > 0}
    <div class="mt-2.5 text-center font-body text-xs font-extrabold text-cocoa-500">
      {open === 0 ? '🎉 All covered!' : `${open} still open`}
    </div>
  {/if}
</Card>
