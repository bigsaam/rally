<script>
  import '../app.css';
  import { page } from '$app/state';
  import Avatar from '$lib/ui/Avatar.svelte';

  /** @type {{ children: import('svelte').Snippet, data: import('./$types').LayoutData }} */
  let { children, data } = $props();

  const user = $derived(data.user);
  // Preserve where you are so signing in returns you to the same page.
  const loginHref = $derived(`/login?next=${encodeURIComponent(page.url.pathname + page.url.search)}`);
</script>

<div class="flex min-h-screen flex-col bg-sand-100">
  <header class="flex items-center justify-between border-b border-sand-300 bg-sand-100/90 px-4 py-2 backdrop-blur sm:px-6">
    <a href="/" class="font-display text-base font-bold text-cocoa-900">🧭 Rally</a>
    {#if user}
      <div class="flex items-center gap-2.5">
        <Avatar name={user.name || user.email} size={26} />
        <span class="hidden font-body text-[13px] font-extrabold text-cocoa-700 sm:inline">
          {user.name || user.email}
        </span>
        <form method="POST" action="/logout">
          <button type="submit" class="font-body text-[13px] font-extrabold text-coral-600 hover:underline">
            Sign out
          </button>
        </form>
      </div>
    {:else}
      <a href={loginHref} class="font-body text-[13px] font-extrabold text-coral-600 hover:underline">Sign in</a>
    {/if}
  </header>

  <div class="flex-1">
    {@render children()}
  </div>
</div>
