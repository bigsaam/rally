<script>
  import { Chip } from '@walaware/design';
  import { fmtDateRange } from '$lib/format.js';

  /**
   * @type {{
   *   trip: {
   *     name: string, slug: string, location?: string,
   *     start_date?: string, end_date?: string,
   *     role?: string, status?: string, going?: number, maybe?: number, members?: number
   *   }
   * }}
   */
  let { trip } = $props();

  const planning = $derived(trip.status === 'planning');
</script>

<a
  href="/{trip.slug}"
  class="block rounded-2xl bg-white p-4 shadow-card transition hover:-translate-y-0.5 hover:shadow-pop"
>
  <div class="flex items-start justify-between gap-2">
    <h3 class="font-display text-lg font-bold leading-tight text-cocoa-900">{trip.name}</h3>
    {#if trip.role === 'organizer'}
      <span class="shrink-0 rounded-full bg-sun-200 px-2 py-0.5 font-body text-[11px] font-extrabold text-sun-600">
        ✨ organizer
      </span>
    {/if}
  </div>

  {#if trip.start_date || trip.location}
    <div class="mt-0.5 font-body text-[13px] font-extrabold text-coral-600">
      {#if trip.start_date}{fmtDateRange(trip.start_date, trip.end_date)}{/if}{#if trip.start_date && trip.location} · {/if}{trip.location}
    </div>
  {/if}

  <div class="mt-2.5 flex flex-wrap gap-1.5">
    {#if planning}
      <Chip tone="sun">🌱 Planning</Chip>
      <Chip tone="berry">👥 {trip.members ?? 0} interested</Chip>
    {:else}
      <Chip tone="coral">🎉 {trip.going ?? 0} going</Chip>
      {#if (trip.maybe ?? 0) > 0}<Chip tone="sun">🤔 {trip.maybe} maybe</Chip>{/if}
      <Chip tone="berry">👥 {trip.members ?? 0} in</Chip>
    {/if}
  </div>
</a>
