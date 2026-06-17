<script>
  // Landing placeholder. The create-trip flow is build-sequence step 2.
  const demoToken = 'demo-rally-weekend';
</script>

<svelte:head><title>Rally — one link, everyone's in</title></svelte:head>

<main class="mx-auto flex min-h-full max-w-xl flex-col justify-center gap-8 px-6 py-16">
  <div>
    <h1 class="text-4xl font-bold tracking-tight text-rally-900">Rally</h1>
    <p class="mt-3 text-lg text-stone-600">
      One link where the group gathers. Plan a trip, share it, and everyone RSVPs,
      claims gear, and signs up for meals — no accounts, no friction.
    </p>
  </div>

  <div class="flex flex-col gap-3 sm:flex-row">
    <a
      href="/new"
      class="inline-flex flex-1 items-center justify-center rounded-xl bg-rally-600 px-5 py-3 font-semibold text-white shadow-sm transition hover:bg-rally-700"
    >
      Plan a trip
    </a>
    <a
      href="/{demoToken}"
      class="inline-flex flex-1 items-center justify-center rounded-xl border border-stone-300 px-5 py-3 font-semibold text-stone-700 transition hover:bg-stone-100"
    >
      See the demo →
    </a>
  </div>
</main>
