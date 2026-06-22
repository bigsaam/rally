<script>
  import { enhance } from '$app/forms';
  import { invalidateAll } from '$app/navigation';

  /**
   * @type {{ orphans: Array<{ id: string, display_name: string }>, form?: any }}
   */
  let { orphans, form = null } = $props();

  let claiming = $state('');
  let dismissed = $state(false);
</script>

{#if !dismissed}
  <div class="mb-3.5 rounded-xl bg-sun-200 p-4 shadow-card">
    <div class="flex items-start justify-between gap-2">
      <p class="font-body text-[13px] font-extrabold text-sun-600">
        Were you already on this trip under another name? Claim it to merge your stuff.
      </p>
      <button
        type="button"
        onclick={() => (dismissed = true)}
        class="shrink-0 font-body text-[13px] font-extrabold text-cocoa-500 hover:underline"
      >
        Dismiss
      </button>
    </div>
    <div class="mt-2.5 flex flex-wrap gap-2">
      {#each orphans as o (o.id)}
        <form
          method="POST"
          action="?/claim"
          use:enhance={() => {
            claiming = o.id;
            return async ({ result }) => {
              claiming = '';
              if (result.type === 'success') await invalidateAll();
            };
          }}
        >
          <input type="hidden" name="participantId" value={o.id} />
          <button
            type="submit"
            disabled={claiming !== ''}
            class="rounded-full border-2 border-white bg-white px-3 py-1.5 font-body text-[13px] font-extrabold text-cocoa-700 transition hover:border-coral-400 disabled:opacity-50"
          >
            {claiming === o.id ? 'Claiming…' : `I'm ${o.display_name}`}
          </button>
        </form>
      {/each}
    </div>
    {#if form?.claimError}
      <p class="mt-2 font-body text-sm font-bold text-berry-600">{form.claimError}</p>
    {/if}
  </div>
{/if}
