<script>
  import { onMount } from 'svelte';
  import { enhance } from '$app/forms';
  import { invalidateAll } from '$app/navigation';
  import Avatar from '$lib/ui/Avatar.svelte';
  import Button from '$lib/ui/Button.svelte';
  import TextField from '$lib/ui/TextField.svelte';
  import { getTripIdentity, setTripIdentity, clearTripIdentity } from '$lib/identity.js';

  /**
   * @type {{
   *   shareToken: string,
   *   form?: any,
   *   identity?: { participantId: string, displayName: string } | null
   * }}
   */
  let { shareToken, form = null, identity = $bindable(null) } = $props();

  let resolved = $state(false);
  let name = $state('');
  let error = $state('');
  let submitting = $state(false);

  onMount(() => {
    identity = getTripIdentity(shareToken);
    resolved = true;
  });

  function leave() {
    clearTripIdentity(shareToken);
    identity = null;
    name = '';
    error = '';
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
          <div class="font-body text-[13px] font-bold text-cocoa-500">
            No account — just type your name. Been here before? Use the same name to hop back in.
          </div>
        </div>
      </div>

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
            {submitting ? 'Joining…' : "Join the trip 🙌"}
          </Button>
        </div>
      </form>

      {#if error || form?.joinError}
        <p class="mt-2 font-body text-sm font-bold text-berry-600">{error || form?.joinError}</p>
      {/if}
    </div>
  {/if}
{/if}
