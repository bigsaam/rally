<script>
  import TripView from '$lib/TripView.svelte';

  /** @type {{ data: import('./$types').PageData }} */
  let { data } = $props();
</script>

<svelte:head><title>{data.trip.name} (owner) — Rally</title></svelte:head>

<TripView {data} ownerMode={true} />
