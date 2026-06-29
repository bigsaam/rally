<script>
  import { enhance } from '$app/forms';
  import { Card, Button } from '@walaware/design';

  /** @type {{ data: { immich: { url: string, hasKey: boolean, source: string } }, form: any }} */
  let { data, form } = $props();

  const immich = $derived(form?.immich ?? data.immich);
  const saved = $derived(Boolean(form?.saved));
  const error = $derived(form?.error ?? '');

  const inputClass =
    'w-full rounded-md border-2 border-sand-300 bg-white px-3.5 py-3 font-body text-base font-bold text-cocoa-900 outline-none transition focus:border-coral-400 focus:ring-4 focus:ring-coral-200 placeholder:text-cocoa-300';
  const labelClass = 'mb-[7px] block font-display text-sm font-semibold text-cocoa-900';
</script>

<svelte:head><title>Instance settings — tripwala</title></svelte:head>

<div class="min-h-full">
  <div class="mx-auto max-w-xl">
    <h1 class="mt-4 font-display text-[27px] font-bold tracking-tight text-cocoa-900">Instance settings ⚙️</h1>
    <p class="mt-1 font-body font-bold text-cocoa-500">Only you (the instance admin) can see this. Connect your Immich so trips can create shared photo albums.</p>

    {#if error}
      <p class="mt-4 rounded-md bg-berry-200 px-3 py-2 font-body text-sm font-bold text-berry-600">{error}</p>
    {/if}
    {#if saved}
      <p class="mt-4 rounded-md bg-leaf-200 px-3 py-2 font-body text-sm font-bold text-leaf-700">Saved ✓</p>
    {/if}

    <Card class="mt-5">
      <div class="mb-3 flex items-center gap-2">
        <span class="text-[18px]">📷</span>
        <h2 class="font-display text-lg font-bold text-cocoa-900">Immich</h2>
        <span class="ml-auto rounded-full px-2.5 py-0.5 font-body text-[12px] font-extrabold {immich.hasKey ? 'bg-leaf-200 text-leaf-700' : 'bg-sand-200 text-cocoa-500'}">
          {immich.hasKey ? 'Connected' : 'Not connected'}
        </span>
      </div>

      <form method="POST" use:enhance class="flex flex-col gap-4">
        <div>
          <label class={labelClass} for="immich_url">Instance URL</label>
          <input id="immich_url" name="immich_url" inputmode="url" value={immich.url} placeholder="https://photos.example or http://192.168.1.10:2283" class={inputClass} />
          <p class="mt-1 font-body text-xs font-bold text-cocoa-500">A local/private address is fine — this is your own server.</p>
        </div>

        <div>
          <label class={labelClass} for="immich_api_key">API key</label>
          <input id="immich_api_key" name="immich_api_key" type="password" autocomplete="off" placeholder={immich.hasKey ? '•••••••• (leave blank to keep)' : 'Paste your Immich API key'} class={inputClass} />
          <p class="mt-1 font-body text-xs font-bold text-cocoa-500">Create one in Immich → Account Settings → API Keys. Stored server-side; never shown again.</p>
          {#if immich.hasKey}
            <label class="mt-2 flex items-center gap-2 font-body text-[13px] font-bold text-cocoa-600">
              <input type="checkbox" name="clear_key" value="1" class="h-4 w-4 accent-coral-400" /> Remove the saved key
            </label>
          {/if}
          {#if immich.source === 'env'}
            <p class="mt-1 font-body text-xs font-bold text-cocoa-500">Currently using values from the environment. Saving here overrides them.</p>
          {/if}
        </div>

        <Button variant="primary" size="lg" full type="submit">Save</Button>
      </form>
    </Card>
  </div>
</div>
