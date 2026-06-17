<script>
  import { invalidateAll } from '$app/navigation';
  import { tripAction } from '$lib/tripClient.js';
  import Card from '$lib/ui/Card.svelte';
  import CardHeader from '$lib/ui/CardHeader.svelte';
  import Checkbox from '$lib/ui/Checkbox.svelte';
  import Button from '$lib/ui/Button.svelte';

  /**
   * @type {{
   *   shareToken: string,
   *   packing: Array<any>,
   *   currentParticipantId: string | null
   * }}
   */
  let { shareToken, packing, currentParticipantId } = $props();

  const shared = $derived(packing.filter((p) => p.is_shared));
  const mine = $derived(
    currentParticipantId ? packing.filter((p) => !p.is_shared && p.participant === currentParticipantId) : []
  );

  let busy = $state('');
  let addingShared = $state(false);
  let addingMine = $state(false);
  let sharedLabel = $state('');
  let mineLabel = $state('');

  /** @param {any} item */
  async function toggle(item) {
    if (busy) return;
    busy = item.id;
    try {
      await tripAction(shareToken, { op: 'pack_toggle', itemId: item.id });
      await invalidateAll();
    } catch (_) {
      /* reconciled */
    } finally {
      busy = '';
    }
  }

  /** @param {boolean} isShared */
  async function add(isShared) {
    const label = (isShared ? sharedLabel : mineLabel).trim();
    if (!label) return;
    busy = 'add';
    try {
      await tripAction(shareToken, {
        op: 'pack_add',
        label,
        isShared,
        participantId: currentParticipantId
      });
      if (isShared) {
        sharedLabel = '';
        addingShared = false;
      } else {
        mineLabel = '';
        addingMine = false;
      }
      await invalidateAll();
    } catch (_) {
      /* reconciled */
    } finally {
      busy = '';
    }
  }
</script>

{#snippet row(/** @type {any} */ item)}
  <button
    type="button"
    disabled={busy === item.id}
    onclick={() => toggle(item)}
    class="flex w-full items-center gap-3 py-2 text-left disabled:opacity-60"
  >
    <Checkbox checked={item.checked} />
    <span class="font-body font-bold text-cocoa-900" class:line-through={item.checked} class:text-cocoa-500={item.checked}>
      {item.label}
    </span>
    {#if item.from_gear}
      <span class="ml-auto font-body text-[11px] font-extrabold text-coral-600">bringing</span>
    {/if}
  </button>
{/snippet}

{#snippet addInput(/** @type {boolean} */ isShared)}
  <div class="mt-2 flex gap-2">
    <input
      value={isShared ? sharedLabel : mineLabel}
      oninput={(e) => {
        const v = /** @type {HTMLInputElement} */ (e.currentTarget).value;
        if (isShared) sharedLabel = v;
        else mineLabel = v;
      }}
      placeholder="Add an item"
      maxlength="200"
      onkeydown={(e) => e.key === 'Enter' && add(isShared)}
      class="flex-1 rounded-md border-2 border-sand-300 bg-white px-3 py-2 font-body text-[15px] font-bold text-cocoa-900 outline-none focus:border-coral-400"
    />
    <Button variant="primary" size="sm" disabled={busy === 'add'} onclick={() => add(isShared)}>Add</Button>
  </div>
{/snippet}

<Card>
  <CardHeader icon="🧳" iconBg="var(--color-leaf-200)" title="What to pack" />

  <div class="mb-1 flex items-center justify-between">
    <p class="font-body text-[11px] font-extrabold uppercase tracking-wide text-cocoa-500">Shared</p>
    {#if currentParticipantId}
      <button type="button" onclick={() => (addingShared = !addingShared)} class="font-body text-[12px] font-extrabold text-coral-600 hover:underline">＋ add</button>
    {/if}
  </div>
  {#if shared.length}
    {#each shared as p}{@render row(p)}{/each}
  {:else}
    <p class="py-1 font-body text-[13px] font-bold text-cocoa-500">Nothing shared yet.</p>
  {/if}
  {#if addingShared}{@render addInput(true)}{/if}

  {#if currentParticipantId}
    <div class="mb-1 mt-4 flex items-center justify-between">
      <p class="font-body text-[11px] font-extrabold uppercase tracking-wide text-cocoa-500">My list</p>
      <button type="button" onclick={() => (addingMine = !addingMine)} class="font-body text-[12px] font-extrabold text-coral-600 hover:underline">＋ add</button>
    </div>
    {#if mine.length}
      {#each mine as p}{@render row(p)}{/each}
    {:else}
      <p class="py-1 font-body text-[13px] font-bold text-cocoa-500">Add what you personally need to pack.</p>
    {/if}
    {#if addingMine}{@render addInput(false)}{/if}
  {/if}
</Card>
