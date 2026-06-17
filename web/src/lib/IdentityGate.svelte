<script>
  import { onMount } from 'svelte';
  import { enhance } from '$app/forms';
  import { invalidateAll } from '$app/navigation';
  import {
    getClientId,
    getTripIdentity,
    setTripIdentity,
    clearTripIdentity
  } from '$lib/identity.js';

  /**
   * @type {{
   *   shareToken: string,
   *   participants: Array<{ id: string, display_name: string }>,
   *   form?: any,
   *   identity?: { participantId: string, displayName: string } | null
   * }}
   */
  let { shareToken, participants, form = null, identity = $bindable(null) } = $props();

  let resolved = $state(false);
  let clientId = $state('');
  let mode = $state('new'); // 'new' | 'rejoin'
  let selectedExisting = $state('');
  let error = $state('');
  let submitting = $state(false);

  onMount(() => {
    clientId = getClientId();
    identity = getTripIdentity(shareToken);
    resolved = true;
  });

  function rejoin() {
    const p = participants.find((x) => x.id === selectedExisting);
    if (!p) return;
    setTripIdentity(shareToken, { participantId: p.id, displayName: p.display_name });
    identity = { participantId: p.id, displayName: p.display_name };
  }

  function leave() {
    clearTripIdentity(shareToken);
    identity = null;
    mode = 'new';
    selectedExisting = '';
  }
</script>

{#if resolved}
  {#if identity}
    <div class="mb-4 flex items-center justify-between rounded-xl bg-rally-50 px-4 py-2.5 text-sm">
      <span class="text-rally-900">
        You're in as <span class="font-semibold">{identity.displayName}</span>
      </span>
      <button type="button" onclick={leave} class="font-medium text-rally-700 hover:underline">
        Not you?
      </button>
    </div>
  {:else}
    <div class="mb-4 rounded-2xl bg-white p-5 shadow-sm">
      <h2 class="text-lg font-bold text-rally-900">Join this trip</h2>
      <p class="mt-0.5 text-sm text-stone-500">Pick a name so the group knows who's who. No account needed.</p>

      {#if mode === 'new'}
        <form
          method="POST"
          action="?/join"
          class="mt-3 flex gap-2"
          use:enhance={() => {
            submitting = true;
            error = '';
            return async ({ result }) => {
              submitting = false;
              if (result.type === 'success' && result.data?.joined) {
                const j = /** @type {{ id: string, display_name: string }} */ (result.data.joined);
                setTripIdentity(shareToken, { participantId: j.id, displayName: j.display_name });
                identity = { participantId: j.id, displayName: j.display_name };
                await invalidateAll();
              } else if (result.type === 'failure') {
                error = /** @type {any} */ (result.data)?.joinError ?? 'Could not join.';
              } else {
                error = 'Could not join.';
              }
            };
          }}
        >
          <input type="hidden" name="client_id" value={clientId} />
          <input
            name="display_name"
            required
            maxlength="80"
            placeholder="What should we call you?"
            autocomplete="off"
            class="flex-1 rounded-lg border border-stone-300 px-3 py-2 focus:border-rally-500 focus:outline-none focus:ring-1 focus:ring-rally-500"
          />
          <button
            type="submit"
            disabled={submitting}
            class="shrink-0 rounded-lg bg-rally-600 px-4 py-2 font-semibold text-white hover:bg-rally-700 disabled:opacity-60"
          >
            {submitting ? '…' : "I'm in"}
          </button>
        </form>
      {:else}
        <div class="mt-3 flex gap-2">
          <select
            bind:value={selectedExisting}
            class="flex-1 rounded-lg border border-stone-300 px-3 py-2 focus:border-rally-500 focus:outline-none focus:ring-1 focus:ring-rally-500"
          >
            <option value="" disabled selected>Who are you?</option>
            {#each participants as p}
              <option value={p.id}>{p.display_name}</option>
            {/each}
          </select>
          <button
            type="button"
            onclick={rejoin}
            disabled={!selectedExisting}
            class="shrink-0 rounded-lg bg-rally-600 px-4 py-2 font-semibold text-white hover:bg-rally-700 disabled:opacity-60"
          >
            That's me
          </button>
        </div>
      {/if}

      {#if error || form?.joinError}
        <p class="mt-2 text-sm text-red-600">{error || form?.joinError}</p>
      {/if}

      {#if participants.length}
        <button
          type="button"
          onclick={() => (mode = mode === 'new' ? 'rejoin' : 'new')}
          class="mt-3 text-sm font-medium text-rally-700 hover:underline"
        >
          {mode === 'new' ? 'Coming back? Rejoin as an existing name' : '← New name instead'}
        </button>
      {/if}
    </div>
  {/if}
{/if}
