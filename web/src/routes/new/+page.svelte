<script>
  import { enhance } from '$app/forms';
  import { page } from '$app/state';

  /** @type {{ form: any }} */
  let { form } = $props();

  const created = $derived(form?.created);
  const errors = $derived(form?.errors ?? {});
  const values = $derived(form?.values ?? {});

  const origin = $derived(page.url.origin);
  const shareUrl = $derived(created ? `${origin}/${created.share_token}` : '');
  const ownerUrl = $derived(
    created ? `${origin}/${created.share_token}/edit?owner=${created.owner_token}` : ''
  );

  let copied = $state('');
  /** @param {string} text @param {string} which */
  async function copy(text, which) {
    try {
      await navigator.clipboard.writeText(text);
      copied = which;
      setTimeout(() => (copied = ''), 1500);
    } catch (_) {
      copied = '';
    }
  }
</script>

<svelte:head><title>{created ? 'Trip created' : 'New trip'} — Rally</title></svelte:head>

<main class="mx-auto max-w-xl px-4 py-10 sm:px-6">
  <a href="/" class="text-sm font-medium text-rally-700 hover:underline">← Rally</a>

  {#if created}
    <!-- Success: share + owner links -->
    <div class="mt-4 rounded-2xl bg-white p-6 shadow-sm">
      <h1 class="text-2xl font-bold text-rally-900">“{created.name}” is live 🎉</h1>
      <p class="mt-1 text-stone-600">
        Send this link to your group — anyone with it can RSVP and join in.
        {#if created.mealSlots}<span>We added {created.mealSlots} meal slots from your dates.</span>{/if}
      </p>

      <label class="mt-5 block text-sm font-semibold text-stone-700" for="share">Share link</label>
      <div class="mt-1 flex gap-2">
        <input id="share" readonly value={shareUrl}
          class="flex-1 rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-sm" />
        <button type="button" onclick={() => copy(shareUrl, 'share')}
          class="shrink-0 rounded-lg bg-rally-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rally-700">
          {copied === 'share' ? 'Copied!' : 'Copy'}
        </button>
      </div>

      <label class="mt-4 block text-sm font-semibold text-stone-700" for="owner">
        Your private owner link
      </label>
      <p class="text-xs text-stone-500">Keep this — it's how you edit the trip later. Don't share it.</p>
      <div class="mt-1 flex gap-2">
        <input id="owner" readonly value={ownerUrl}
          class="flex-1 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm" />
        <button type="button" onclick={() => copy(ownerUrl, 'owner')}
          class="shrink-0 rounded-lg border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-50">
          {copied === 'owner' ? 'Copied!' : 'Copy'}
        </button>
      </div>

      <a href="/{created.share_token}"
        class="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-rally-600 px-5 py-3 font-semibold text-white hover:bg-rally-700">
        Open the trip →
      </a>
    </div>
  {:else}
    <!-- Create form -->
    <h1 class="mt-4 text-2xl font-bold tracking-tight text-rally-900">Plan a trip</h1>
    <p class="mt-1 text-stone-600">One link, everyone's in. No accounts needed.</p>

    {#if errors._form}
      <p class="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{errors._form}</p>
    {/if}

    <form method="POST" use:enhance class="mt-6 space-y-4">
      <div>
        <label class="block text-sm font-semibold text-stone-700" for="name">Trip name</label>
        <input id="name" name="name" required value={values.name ?? ''}
          placeholder="Mendocino Coast Camping"
          class="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 focus:border-rally-500 focus:outline-none focus:ring-1 focus:ring-rally-500" />
        {#if errors.name}<p class="mt-1 text-sm text-red-600">{errors.name}</p>{/if}
      </div>

      <div>
        <label class="block text-sm font-semibold text-stone-700" for="location">Location</label>
        <input id="location" name="location" value={values.location ?? ''}
          placeholder="Russian Gulch State Park, CA"
          class="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 focus:border-rally-500 focus:outline-none focus:ring-1 focus:ring-rally-500" />
        {#if errors.location}<p class="mt-1 text-sm text-red-600">{errors.location}</p>{/if}
      </div>

      <div class="flex gap-3">
        <div class="flex-1">
          <label class="block text-sm font-semibold text-stone-700" for="start_date">Start</label>
          <input id="start_date" name="start_date" type="date" value={values.start_date ?? ''}
            class="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 focus:border-rally-500 focus:outline-none focus:ring-1 focus:ring-rally-500" />
        </div>
        <div class="flex-1">
          <label class="block text-sm font-semibold text-stone-700" for="end_date">End</label>
          <input id="end_date" name="end_date" type="date" value={values.end_date ?? ''}
            class="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 focus:border-rally-500 focus:outline-none focus:ring-1 focus:ring-rally-500" />
          {#if errors.end_date}<p class="mt-1 text-sm text-red-600">{errors.end_date}</p>{/if}
        </div>
      </div>

      <div>
        <label class="block text-sm font-semibold text-stone-700" for="description">Description</label>
        <textarea id="description" name="description" rows="3"
          placeholder="What's the plan? What should people know?"
          class="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 focus:border-rally-500 focus:outline-none focus:ring-1 focus:ring-rally-500">{values.description ?? ''}</textarea>
        {#if errors.description}<p class="mt-1 text-sm text-red-600">{errors.description}</p>{/if}
      </div>

      <div>
        <label class="block text-sm font-semibold text-stone-700" for="expense_link">
          Expense-split link <span class="font-normal text-stone-400">(optional)</span>
        </label>
        <input id="expense_link" name="expense_link" inputmode="url" value={values.expense_link ?? ''}
          placeholder="https://spliit.app/..."
          class="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 focus:border-rally-500 focus:outline-none focus:ring-1 focus:ring-rally-500" />
        {#if errors.expense_link}<p class="mt-1 text-sm text-red-600">{errors.expense_link}</p>{/if}
      </div>

      <button type="submit"
        class="w-full rounded-xl bg-rally-600 px-5 py-3 font-semibold text-white shadow-sm hover:bg-rally-700">
        Create trip & get link
      </button>
    </form>
  {/if}
</main>
