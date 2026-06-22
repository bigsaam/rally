<script>
  import Button from '$lib/ui/Button.svelte';
  const demoToken = 'demo-rally-weekend';
</script>

<svelte:head><title>Rally — one link, everyone's in</title></svelte:head>

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
    <Button href="/{demoToken}" variant="ghost" size="lg" full>See the demo →</Button>
  </div>
</main>
