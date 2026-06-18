<script>
  import { invalidateAll } from '$app/navigation';
  import { tripAction } from '$lib/tripClient.js';
  import Card from '$lib/ui/Card.svelte';
  import CardHeader from '$lib/ui/CardHeader.svelte';
  import Button from '$lib/ui/Button.svelte';
  import { fmtDate } from '$lib/format.js';

  /**
   * @type {{
   *   shareToken: string,
   *   meals: Array<any>,
   *   currentParticipantId: string | null
   * }}
   */
  let { shareToken, meals, currentParticipantId } = $props();

  let busy = $state('');

  function mySignup(/** @type {any} */ m) {
    return m.signups.find((/** @type {any} */ s) => s.participant === currentParticipantId) ?? null;
  }

  /** @param {any} m */
  async function signUp(m) {
    if (!currentParticipantId || busy) return;
    busy = m.id;
    try {
      await tripAction(shareToken, { op: 'meal_signup', mealSlotId: m.id, participantId: currentParticipantId });
      await invalidateAll();
    } catch (_) {
      /* reconciled */
    } finally {
      busy = '';
    }
  }

  /** @param {any} m */
  async function cancel(m) {
    const mine = mySignup(m);
    if (!mine || busy) return;
    busy = m.id;
    try {
      await tripAction(shareToken, { op: 'meal_cancel', mealSlotId: m.id, participantId: currentParticipantId });
      await invalidateAll();
    } catch (_) {
      /* reconciled */
    } finally {
      busy = '';
    }
  }

  /** @param {string} signupId @param {string} note */
  async function saveNote(signupId, note) {
    try {
      await tripAction(shareToken, { op: 'meal_note', signupId, note });
      await invalidateAll();
    } catch (_) {
      /* reconciled */
    }
  }
</script>

<Card>
  <CardHeader icon="🍳" iconBg="var(--color-berry-200)" title="What's for food?" />
  {#each meals as m, i}
    {@const mine = mySignup(m)}
    <div class="flex flex-col gap-1 py-2.5 {i !== 0 ? 'border-t border-sand-200' : ''}">
      <div class="flex items-center justify-between gap-2">
        <span class="font-body text-sm font-extrabold text-cocoa-900">{m.label}</span>
        <span class="ml-auto font-body text-xs font-bold text-cocoa-500">{fmtDate(m.date)}</span>
        {#if currentParticipantId}
          {#if mine}
            <button
              type="button"
              disabled={busy === m.id}
              onclick={() => cancel(m)}
              class="rounded-full px-2.5 py-1 font-display text-[12px] font-semibold text-cocoa-500 hover:text-coral-600"
            >
              Drop
            </button>
          {:else}
            <Button variant="secondary" size="sm" disabled={busy === m.id} onclick={() => signUp(m)}>
              {busy === m.id ? '…' : m.signups.length ? 'Help too' : "I'll help"}
            </Button>
          {/if}
        {/if}
      </div>
      {#if m.signups.length}
        {#each m.signups as s}
          <span class="font-body text-[13px] font-bold text-cocoa-700">
            {s.participantName}{#if s.dish_note} — {s.dish_note}{/if}
          </span>
        {/each}
      {:else}
        <span class="font-body text-[13px] font-bold text-cocoa-500">Nobody's on it yet — pitch in!</span>
      {/if}
      {#if mine}
        <input
          value={mine.dish_note ?? ''}
          placeholder="What are you making? (optional)"
          maxlength="300"
          onblur={(e) => saveNote(mine.id, /** @type {HTMLInputElement} */ (e.currentTarget).value)}
          class="mt-1 w-full rounded-md border-2 border-sand-300 bg-white px-3 py-1.5 font-body text-[13px] font-bold text-cocoa-900 outline-none focus:border-coral-400"
        />
      {/if}
    </div>
  {/each}
</Card>
