<script>
  import TripView from '$lib/TripView.svelte';
  import IdentityGate from '$lib/IdentityGate.svelte';

  /** @type {{ data: import('./$types').PageData, form: import('./$types').ActionData }} */
  let { data, form } = $props();

  /** @type {{ participantId: string, displayName: string } | null} */
  let identity = $state(null);
</script>

<svelte:head><title>{data.trip.name} — Rally</title></svelte:head>

<TripView {data} currentParticipantId={identity?.participantId ?? null}>
  {#snippet top()}
    <IdentityGate
      shareToken={data.trip.share_token}
      participants={data.participants}
      {form}
      bind:identity
    />
  {/snippet}
</TripView>
