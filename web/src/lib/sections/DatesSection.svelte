<script>
  import { Card } from '@walaware/design';
  import SectionHeader from '$lib/ui/SectionHeader.svelte';
  import { fmtDateRange, tripLength } from '$lib/format.js';

  /**
   * Trip dates at a glance. The day-by-day plan (and any votable options) now
   * lives in the Itinerary section — this card just states the range + length.
   *
   * @type {{
   *   trip: any,
   *   onHide?: (() => void) | null,
   *   collapsed?: boolean,
   *   onToggle?: (() => void) | null,
   *   isPast?: boolean
   * }}
   */
  let { trip, onHide = null, collapsed = false, onToggle = null, isPast = false } = $props();

  const range = $derived(fmtDateRange(trip.start_date, trip.end_date));
  const len = $derived(tripLength(trip.start_date, trip.end_date));
</script>

<SectionHeader emoji="📅" title={isPast ? 'When' : 'Dates'} {onHide} {collapsed} {onToggle} />
<Card>
  <div class="flex items-baseline gap-2.5">
    <span class="font-display text-[20px] font-bold text-text-strong">{range || 'Dates TBD'}</span>
    {#if len.nights > 0}
      <span class="font-body text-[13px] font-extrabold text-text-muted">{len.nights} night{len.nights === 1 ? '' : 's'}</span>
    {/if}
  </div>
</Card>
