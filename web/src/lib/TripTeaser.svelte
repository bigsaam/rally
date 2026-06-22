<script>
  import { enhance } from '$app/forms';
  import { invalidateAll } from '$app/navigation';
  import Button from '$lib/ui/Button.svelte';
  import { fmtDateRange } from '$lib/format.js';

  /**
   * @type {{
   *   trip: { name: string, location?: string, start_date?: string, end_date?: string, descriptionPreview?: string, share_token: string },
   *   mode: 'signin' | 'join',
   *   form?: any
   * }}
   */
  let { trip, mode, form = null } = $props();

  const loginHref = $derived(`/login?next=${encodeURIComponent('/' + trip.share_token)}`);
  let joining = $state(false);
</script>

<main class="min-h-full bg-sand-100">
  <div class="mx-auto max-w-md px-4 py-12 sm:px-6">
    <a href="/" class="font-body text-[13px] font-extrabold text-coral-600 hover:underline">← Rally</a>

    <div class="mt-6 rounded-xl bg-white p-[22px] text-center shadow-pop">
      <div class="text-[40px] leading-none">🧭</div>
      <p class="mt-2 font-body text-[13px] font-extrabold uppercase tracking-wide text-coral-600">
        You're invited
      </p>
      <h1 class="mt-1 font-display text-2xl font-bold text-cocoa-900">{trip.name}</h1>

      {#if trip.start_date || trip.location}
        <div class="mt-1 font-body text-sm font-extrabold text-cocoa-500">
          {#if trip.start_date}{fmtDateRange(trip.start_date, trip.end_date)}{/if}{#if trip.start_date && trip.location} · {/if}{trip.location}
        </div>
      {/if}

      {#if trip.descriptionPreview}
        <p class="mt-4 font-body text-[13.5px] leading-relaxed text-cocoa-700">{trip.descriptionPreview}</p>
      {/if}

      <div class="mt-6">
        {#if mode === 'signin'}
          <Button href={loginHref} variant="primary" size="lg" full>Sign in to join →</Button>
          <p class="mt-3 font-body text-xs font-bold text-cocoa-500">
            Rally uses accounts so only invited guests see the details — photos, who's coming, and more.
          </p>
        {:else}
          <form
            method="POST"
            action="?/join"
            use:enhance={() => {
              joining = true;
              return async ({ result }) => {
                joining = false;
                if (result.type === 'success') await invalidateAll();
              };
            }}
          >
            <Button variant="primary" size="lg" full type="submit" disabled={joining}>
              {joining ? 'Joining…' : 'Join this trip 🙌'}
            </Button>
          </form>
          {#if form?.joinError}
            <p class="mt-2 font-body text-sm font-bold text-berry-600">{form.joinError}</p>
          {/if}
        {/if}
      </div>
    </div>
  </div>
</main>
