<script>
  import { invalidateAll } from '$app/navigation';
  import { Avatar } from '@walaware/design';
  import { Chip } from '@walaware/design';
  import { Card } from '@walaware/design';
  import { Button } from '@walaware/design';
  import PlanDateSection from '$lib/sections/PlanDateSection.svelte';
  import PlanLocationSection from '$lib/sections/PlanLocationSection.svelte';
  import { planAction } from '$lib/planClient.js';

  /** @type {{ data: any }} */
  let { data } = $props();

  const trip = $derived(data.trip);
  const isOrganizer = $derived(data.isOrganizer);
  const participants = $derived(data.participants ?? []);

  const TYPES = [
    ['camping', '🏕️ Camping'], ['backpacking', '🎒 Backpacking'], ['road_trip', '🚗 Road trip'],
    ['cabin', '🛖 Cabin'], ['ski', '⛷️ Ski'], ['beach', '🏖️ Beach'], ['city', '🏙️ City'],
    ['festival', '🎪 Festival'], ['other', '🧭 Other']
  ];
  const typeLabel = $derived(TYPES.find(([v]) => v === trip.trip_type)?.[1] ?? '');

  // Suggest the most-popular proposed range to prefill the confirm form.
  const suggested = $derived(
    [...(data.dateOptions ?? [])].sort((a, b) => b.yes - a.yes || a.start_date.localeCompare(b.start_date))[0]
  );
  let cStart = $state('');
  let cEnd = $state('');
  let cLoc = $state('');
  let confirming = $state(false);
  let confirmErr = $state('');
  let showConfirm = $state(false);

  function openConfirm() {
    cStart = (suggested?.start_date ?? '').slice(0, 10);
    cEnd = (suggested?.end_date ?? suggested?.start_date ?? '').slice(0, 10);
    cLoc = trip.location ?? '';
    showConfirm = true;
  }

  async function confirmTrip() {
    if (!cStart || confirming) return;
    confirming = true;
    confirmErr = '';
    try {
      await planAction(trip.share_token, { op: 'confirm_trip', start: cStart, end: cEnd || cStart, location: cLoc });
      await invalidateAll(); // status → confirmed; page swaps to the full trip
    } catch (_) {
      confirmErr = 'Could not confirm — check the dates.';
      confirming = false;
    }
  }

  const inputClass =
    'w-full rounded-md border-2 border-sand-300 bg-white px-3 py-2.5 font-body text-sm font-bold text-cocoa-900 outline-none focus:border-coral-400';
</script>

<div class="min-h-full bg-sand-100 pb-10">
  <div class="mx-auto w-full max-w-3xl px-4 sm:px-6">
    <!-- Header -->
    <header class="px-2 pb-3 pt-5">
      <div class="flex flex-wrap items-center gap-2">
        <Chip tone="sun">🌱 In planning</Chip>
        {#if typeLabel}<Chip tone="neutral">{typeLabel}</Chip>{/if}
        {#if isOrganizer}
          <a
            href="/{trip.share_token}/settings"
            class="ml-auto inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-body text-[13px] font-bold text-cocoa-500 hover:bg-white hover:text-cocoa-900"
          >⚙️ Settings</a>
        {/if}
      </div>

      <h1 class="mt-2 font-display text-2xl font-bold leading-tight text-cocoa-900">{trip.name}</h1>

      {#if participants.length}
        <div class="mt-2 flex items-center gap-2">
          <div class="flex -space-x-1.5">
            {#each participants.slice(0, 6) as p (p.id)}
              <span class="inline-block rounded-full ring-2 ring-sand-100" title={p.display_name}><Avatar name={p.display_name} size={24} /></span>
            {/each}
          </div>
          <span class="font-body text-xs font-bold text-cocoa-500">{participants.length} interested</span>
        </div>
      {/if}

      {#if trip.description}
        <div class="mt-3 rounded-2xl bg-white p-3.5 font-body text-[13.5px] leading-relaxed text-cocoa-700 shadow-card [&_a]:font-extrabold [&_a]:text-coral-700 [&_a]:underline">
          {@html trip.description}
        </div>
      {/if}
    </header>

    <div class="flex flex-col gap-3.5">
      <PlanDateSection
        shareToken={trip.share_token}
        dateOptions={data.dateOptions ?? []}
        availability={data.availability}
        {isOrganizer}
      />
      <PlanLocationSection
        shareToken={trip.share_token}
        locations={data.locations ?? []}
        {isOrganizer}
        pickedLabel={trip.location ?? ''}
      />

      {#if isOrganizer}
        <Card>
          {#if !showConfirm}
            <div class="flex items-center justify-between gap-3">
              <div>
                <div class="font-display text-base font-semibold text-cocoa-900">Ready to lock it in?</div>
                <div class="font-body text-[13px] font-bold text-cocoa-500">Set the final dates and it becomes a real trip.</div>
              </div>
              <Button variant="primary" size="md" onclick={openConfirm}>Confirm trip ✅</Button>
            </div>
          {:else}
            <div class="font-display text-base font-semibold text-cocoa-900">Confirm the trip</div>
            <div class="mt-3 flex flex-wrap gap-2">
              <label class="flex flex-1 flex-col gap-1">
                <span class="font-body text-[11px] font-extrabold uppercase text-cocoa-500">Start</span>
                <input type="date" bind:value={cStart} class={inputClass} />
              </label>
              <label class="flex flex-1 flex-col gap-1">
                <span class="font-body text-[11px] font-extrabold uppercase text-cocoa-500">End</span>
                <input type="date" bind:value={cEnd} min={cStart} class={inputClass} />
              </label>
            </div>
            <label class="mt-2 block">
              <span class="font-body text-[11px] font-extrabold uppercase text-cocoa-500">Location</span>
              <input bind:value={cLoc} placeholder="Where to?" class="{inputClass} mt-1" />
            </label>
            {#if confirmErr}<p class="mt-2 font-body text-sm font-bold text-berry-600">{confirmErr}</p>{/if}
            <div class="mt-3 flex gap-2">
              <Button variant="primary" size="md" onclick={confirmTrip} disabled={!cStart || confirming}>
                {confirming ? 'Confirming…' : 'Lock it in 🎉'}
              </Button>
              <Button variant="ghost" size="md" onclick={() => (showConfirm = false)}>Cancel</Button>
            </div>
          {/if}
        </Card>
      {/if}
    </div>
  </div>
</div>
