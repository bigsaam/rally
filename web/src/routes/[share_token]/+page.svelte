<script>
  import TripView from '$lib/TripView.svelte';
  import TripTeaser from '$lib/TripTeaser.svelte';
  import ClaimBanner from '$lib/ClaimBanner.svelte';
  import PlanningView from '$lib/PlanningView.svelte';

  /** @type {{ data: import('./$types').PageData, form: import('./$types').ActionData }} */
  let { data, form } = $props();
</script>

<svelte:head><title>{data.trip?.name ?? 'tripwala'} — tripwala</title></svelte:head>

{#if data.teaser}
  <TripTeaser trip={data.trip} mode="signin" />
{:else if data.invite}
  <TripTeaser trip={data.trip} mode="join" orphans={data.orphans ?? []} {form} />
{:else if data.planning}
  <PlanningView {data} />
{:else}
  <TripView
    {data}
    currentParticipantId={data.membership?.participantId ?? null}
    ownerMode={data.isOrganizer ?? false}
  >
    {#snippet top()}
      {#if (data.orphans ?? []).length}
        <ClaimBanner orphans={data.orphans ?? []} {form} />
      {/if}
    {/snippet}
  </TripView>
{/if}
