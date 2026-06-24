<script>
  import { Avatar, Card, Button } from '@walaware/design';
  import { enhance } from '$app/forms';

  /** @type {{ data: import('./$types').PageData, form: import('./$types').ActionData }} */
  let { data, form } = $props();

  let busy = $state(false);
  let fileName = $state('');
</script>

<svelte:head><title>Your profile — tripwala</title></svelte:head>

<div class="mx-auto max-w-md">
  <h1 class="mb-5 font-display text-[24px] font-bold tracking-tight text-text-strong">Your profile</h1>

  <Card>
    <div class="flex items-center gap-4">
      <Avatar name={data.name} src={data.avatar} size={72} />
      <div class="min-w-0">
        <div class="truncate font-display text-[17px] font-bold text-text-strong">{data.name}</div>
        <div class="truncate font-body text-[13px] font-bold text-text-muted">{data.email}</div>
      </div>
    </div>

    <div class="mt-4 border-t border-sand-200 pt-4">
      <div class="mb-2 font-display text-[15px] font-bold text-text-strong">Profile photo</div>

      {#if form?.error}
        <p class="mb-2.5 rounded-md bg-berry-200 px-3 py-2 font-body text-sm font-bold text-berry-600">{form.error}</p>
      {/if}

      <form
        method="POST"
        action="?/upload"
        enctype="multipart/form-data"
        use:enhance={() => {
          busy = true;
          return async ({ update }) => {
            await update();
            busy = false;
            fileName = '';
          };
        }}
        class="flex flex-col gap-2.5"
      >
        <label
          class="flex cursor-pointer items-center gap-3 rounded-xl border-2 border-dashed border-sand-300 px-3 py-3 transition hover:border-coral-300"
        >
          <span class="text-[20px]">📷</span>
          <span class="min-w-0 flex-1 truncate font-body text-[14px] font-bold {fileName ? 'text-cocoa-900' : 'text-cocoa-500'}">
            {fileName || 'Choose an image — JPG or PNG, under 5 MB'}
          </span>
          <input
            type="file"
            name="photo"
            accept="image/*"
            class="hidden"
            onchange={(e) => (fileName = e.currentTarget.files?.[0]?.name ?? '')}
          />
        </label>

        <div class="flex gap-2">
          <Button type="submit" variant="primary" size="md" disabled={busy || !fileName}>
            {busy ? 'Saving…' : 'Save photo'}
          </Button>
          {#if data.avatar}
            <Button type="submit" variant="ghost" size="md" formaction="?/remove" disabled={busy}>Remove</Button>
          {/if}
        </div>
      </form>

      <p class="mt-2.5 font-body text-[12px] font-bold text-cocoa-400">
        Your photo shows on the trips you join. Signing in with Google sets it automatically; upload here to override it.
      </p>
    </div>
  </Card>
</div>
