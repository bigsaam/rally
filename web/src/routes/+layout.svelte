<script>
  import '../app.css';
  import { page } from '$app/state';
  import Avatar from '$lib/ui/Avatar.svelte';

  /** @type {{ children: import('svelte').Snippet, data: import('./$types').LayoutData }} */
  let { children, data } = $props();

  const user = $derived(data.user);
  // Preserve where you are so signing in returns you to the same page.
  const loginHref = $derived(`/login?next=${encodeURIComponent(page.url.pathname + page.url.search)}`);
  // Don't show a "Sign in" link when we're already on an auth page.
  const onAuthPage = $derived(page.url.pathname === '/login' || page.url.pathname === '/signup');
</script>

<div class="flex min-h-screen flex-col bg-sand-100">
  <header class="border-b border-sand-300 bg-sand-100/80 backdrop-blur">
    <div class="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-2.5 sm:px-6">
      <a href="/" class="flex items-center gap-1.5 font-display text-base font-bold text-cocoa-900">
        <span aria-hidden="true">🧭</span> Rally
      </a>
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
      {:else if !onAuthPage}
        <a href={loginHref} class="font-body text-[13px] font-extrabold text-coral-600 hover:underline">Sign in</a>
      {/if}
    </div>
  </header>

  <div class="flex flex-1 flex-col">
    {@render children()}
  </div>
</div>
