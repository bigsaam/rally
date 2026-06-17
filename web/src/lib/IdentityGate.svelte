<script>
  import { onMount } from 'svelte';
  import { enhance } from '$app/forms';
  import { invalidateAll } from '$app/navigation';
  import Avatar from '$lib/ui/Avatar.svelte';
  import Button from '$lib/ui/Button.svelte';
  import TextField from '$lib/ui/TextField.svelte';
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
  let name = $state('');
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
    name = '';
  }
</script>

{#if resolved}
  {#if identity}
    <div class="mb-3.5 flex items-center justify-between rounded-md bg-white px-4 py-2.5 shadow-card">
      <span class="flex items-center gap-2.5">
        <Avatar name={identity.displayName} size={28} />
        <span class="font-body text-sm font-extrabold text-cocoa-900">
          You're in as {identity.displayName}
        </span>
      </span>
      <button type="button" onclick={leave} class="font-body text-[13px] font-extrabold text-coral-600 hover:underline">
        Not you?
      </button>
    </div>
  {:else}
    <div class="mb-3.5 rounded-xl bg-white p-[22px] shadow-pop">
      <div class="mb-4 flex items-center gap-3.5">
        <Avatar name={name || '?'} size={54} />
        <div>
          <div class="font-display text-lg font-semibold text-cocoa-900">Hey! Who's this? 👋</div>
          <div class="font-body text-[13px] font-bold text-cocoa-500">No account — just claim a name.</div>
        </div>
      </div>

      {#if mode === 'new'}
        <form
          method="POST"
          action="?/join"
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
          <TextField
            prefix="👋"
            name="display_name"
            placeholder="Your name"
            maxlength="80"
            autocomplete="off"
            bind:value={name}
          />
          <div class="mt-4">
            <Button variant="primary" size="lg" full type="submit" disabled={submitting || !name.trim()}>
              {submitting ? 'Joining…' : "I'm in! 🙌"}
            </Button>
          </div>
        </form>
      {:else}
        <div class="flex flex-col gap-3">
          <select
            bind:value={selectedExisting}
            class="w-full rounded-md border-2 border-sand-300 bg-white px-3.5 py-3 font-body text-base font-bold text-cocoa-900 outline-none focus:border-coral-400"
          >
            <option value="" disabled selected>Who are you?</option>
            {#each participants as p}
              <option value={p.id}>{p.display_name}</option>
            {/each}
          </select>
          <Button variant="primary" size="lg" full onclick={rejoin} disabled={!selectedExisting}>
            That's me!
          </Button>
        </div>
      {/if}

      {#if error || form?.joinError}
        <p class="mt-2 font-body text-sm font-bold text-berry-600">{error || form?.joinError}</p>
      {/if}

      {#if participants.length}
        <button
          type="button"
          onclick={() => (mode = mode === 'new' ? 'rejoin' : 'new')}
          class="mt-3 font-body text-[13px] font-extrabold text-coral-600 hover:underline"
        >
          {mode === 'new' ? 'Coming back? Rejoin as an existing name' : '← New name instead'}
        </button>
      {/if}
    </div>
  {/if}
{/if}
