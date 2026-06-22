<script>
  import Button from '$lib/ui/Button.svelte';
  import TripCard from '$lib/TripCard.svelte';

  /** @type {{ data: import('./$types').PageData }} */
  let { data } = $props();

  const trips = $derived(data.trips);
  const total = $derived(
    trips ? trips.current.length + trips.upcoming.length + trips.past.length : 0
  );
</script>

<svelte:head><title>Rally — one link, everyone's in</title></svelte:head>

{#if data.user}
  <!-- Dashboard -->
  <main class="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
    <div class="flex items-center justify-between">
      <h1 class="font-display text-[27px] font-bold tracking-tight text-cocoa-900">Your trips</h1>
      <Button href="/new" variant="primary" size="md">Plan a trip 🎒</Button>
    </div>

    {#if total === 0}
      <div class="mt-8 rounded-2xl bg-white p-8 text-center shadow-card">
        <div class="text-[44px] leading-none">🧭</div>
        <h2 class="mt-2 font-display text-xl font-bold text-cocoa-900">No trips planned yet</h2>
        <p class="mx-auto mt-1 max-w-sm font-body font-bold text-cocoa-500">
          Plan one and share the link, or open an invite someone sent you — it'll show up here.
        </p>
        <div class="mt-5"><Button href="/new" variant="primary" size="lg">Plan your first trip 🎒</Button></div>
      </div>
    {:else if trips}
      {#each [{ items: trips.current, label: 'Happening now' }, { items: trips.upcoming, label: 'Upcoming' }, { items: trips.past, label: 'Past' }] as section}
        {#if section.items.length}
          <section class="mt-7">
            <h2 class="mb-2.5 font-display text-sm font-extrabold uppercase tracking-wide text-cocoa-500">
              {section.label}
            </h2>
            <div class="flex flex-col gap-3 sm:grid sm:grid-cols-2">
              {#each section.items as trip (trip.id)}
                <TripCard {trip} />
              {/each}
            </div>
          </section>
        {/if}
      {/each}
    {/if}
  </main>
{:else}
  <!-- Marketing landing -->
  <main
    class="flex min-h-full flex-col justify-center gap-8 px-6 py-16"
    style="margin-inline: auto; max-width: var(--screen-max); background: linear-gradient(180deg, var(--color-sand-100), var(--color-sand-200));"
  >
    <div class="text-center">
      <div class="text-[56px] leading-none">🧭</div>
      <h1 class="mt-3 font-display text-[44px] font-bold tracking-tight text-cocoa-900">Rally</h1>
      <p class="mt-2 font-body text-lg font-bold text-cocoa-700">
        One link where the group gathers. Plan a trip, drop it in the group chat, and
        everyone signs in to join — RSVP, grab gear, sign up for food. Private to the
        people you invite.
      </p>
    </div>

    <div class="flex flex-col gap-3">
      <Button href="/new" variant="primary" size="lg" full>Plan a trip 🎒</Button>
      <Button href="/login" variant="ghost" size="lg" full>Sign in →</Button>
    </div>
  </main>
{/if}
