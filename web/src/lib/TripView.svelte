<script>
  import { onMount } from 'svelte';
  import { invalidateAll } from '$app/navigation';
  import { pb } from '$lib/pocketbase.js';
  import Chip from '$lib/ui/Chip.svelte';
  import PeopleSection from '$lib/sections/PeopleSection.svelte';
  import GearSection from '$lib/sections/GearSection.svelte';
  import MealsSection from '$lib/sections/MealsSection.svelte';
  import PackingSection from '$lib/sections/PackingSection.svelte';
  import { fmtDateRange } from '$lib/format.js';

  /**
   * @type {{
   *   data: any,
   *   ownerMode?: boolean,
   *   currentParticipantId?: string | null,
   *   top?: import('svelte').Snippet
   * }}
   */
  let { data, ownerMode = false, currentParticipantId = null, top } = $props();

  const trip = $derived(data.trip);
  const participants = $derived(data.participants);
  const gear = $derived(data.gear);
  const meals = $derived(data.meals);

  const going = $derived(participants.filter((/** @type {any} */ p) => p.rsvp_status === 'going').length);
  const maybe = $derived(participants.filter((/** @type {any} */ p) => p.rsvp_status === 'maybe').length);
  const openGear = $derived(gear.filter((/** @type {any} */ g) => g.remaining > 0).length);

  // Realtime: when anyone changes the trip's data, refetch so the page feels
  // live. Debounced so a burst of changes coalesces into one refresh. Realtime
  // is an enhancement — writes still persist and a manual reload works if the
  // subscription can't connect.
  onMount(() => {
    /** @type {ReturnType<typeof setTimeout> | undefined} */
    let timer;
    const refresh = () => {
      clearTimeout(timer);
      timer = setTimeout(() => invalidateAll(), 120);
    };
    /** @type {Array<() => void>} */
    const unsubs = [];
    const cols = ['participants', 'gear_items', 'gear_claims', 'meal_signups', 'packing_items'];
    (async () => {
      try {
        const client = pb();
        for (const c of cols) {
          unsubs.push(await client.collection(c).subscribe('*', refresh));
        }
      } catch (_) {
        /* realtime unavailable — manual reload still works */
      }
    })();
    return () => {
      unsubs.forEach((u) => {
        try {
          u();
        } catch (_) {
          /* noop */
        }
      });
      clearTimeout(timer);
    };
  });
</script>

<div class="min-h-full bg-sand-100 pb-10">
  <div class="mx-auto w-full max-w-3xl px-4 sm:px-6">
    {#if ownerMode}
      <div class="mt-4 rounded-md bg-sun-200 px-4 py-2.5 text-sm font-bold text-sun-600">
        ✨ Owner mode — you can edit everything here. Keep this link private.
      </div>
    {/if}

    <!-- Trip header -->
    <header class="px-2 pb-4 pt-6 text-center">
      <h1 class="font-display text-[27px] font-bold leading-[1.05] text-cocoa-900">{trip.name}</h1>
      <div class="mt-1 font-body text-sm font-extrabold text-coral-600">
        {#if trip.start_date}{fmtDateRange(trip.start_date, trip.end_date)}{/if}{#if trip.start_date && trip.location} · {/if}{trip.location}
      </div>
      <div class="mt-3 flex flex-wrap justify-center gap-1.5">
        <Chip tone="coral">🎉 {going} going</Chip>
        {#if maybe > 0}<Chip tone="sun">🤔 {maybe} maybe</Chip>{/if}
        <Chip tone="berry">🎒 {openGear} open</Chip>
      </div>
      {#if trip.expense_link}
        <a
          href={trip.expense_link}
          target="_blank"
          rel="noopener"
          class="mt-3 inline-block font-body text-[13px] font-extrabold text-cocoa-500 underline underline-offset-2"
        >
          💸 Split expenses ↗
        </a>
      {/if}
    </header>

    {#if top}{@render top()}{/if}

    <div class="flex flex-col gap-3.5 md:grid md:grid-cols-2 md:items-start">
      <PeopleSection {participants} {currentParticipantId} />
      <GearSection tripId={trip.id} {gear} {currentParticipantId} />
      <MealsSection {meals} {currentParticipantId} />
      <PackingSection tripId={trip.id} packing={data.packing} {currentParticipantId} />
    </div>

    {#if !currentParticipantId}
      <p class="mt-5 px-4 text-center font-body text-xs font-bold text-cocoa-500">
        Claim a name above to RSVP, grab gear, and sign up for food.
      </p>
    {/if}
  </div>
</div>
