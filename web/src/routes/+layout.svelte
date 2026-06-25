<script>
  import '../app.css';
  import { AppShell, AppIcon, Wordmark } from '@walaware/design';
  import { page } from '$app/state';
  import { goto } from '$app/navigation';
  import { createShell } from '$lib/shell.svelte.js';
  import { displayName } from '$lib/displayName.js';

  /** @type {{ children: import('svelte').Snippet, data: import('./$types').LayoutData }} */
  let { children, data } = $props();

  const user = $derived(data.user);
  const path = $derived(page.url.pathname);
  // The trip currently in view, if any — settings is a per-trip surface.
  const tripToken = $derived(page.params.share_token ?? null);

  // Shell holder: an open trip publishes its section nav + title here (see
  // TripView), flipping the AppShell into contextual mode. Null = app level.
  const shell = createShell();
  const inTrip = $derived(shell.trip != null);

  // App-level destinations (design repo → docs/apps/tripwala.md): Trips is the
  // only live one; Calendar · Planner · Map are dimmed `soon` roadmap rows. Trips
  // stays active while a trip is open (it opens as a contextual section nav).
  const appNav = $derived([
    {
      key: 'trips',
      label: 'Trips',
      icon: '🧭',
      active: path === '/' || path === '/new' || tripToken != null,
      href: '/'
    },
    { key: 'calendar', label: 'Calendar', icon: '📅', soon: true },
    { key: 'planner', label: 'Planner', icon: '🗓️', soon: true },
    { key: 'map', label: 'Map', icon: '🗺️', soon: true }
  ]);

  // Contextual mode swaps the global destinations for the open trip's section
  // nav (in-page anchors, driven by scrollSpy) and adds a "← All trips" exit.
  const nav = $derived(shell.trip ? shell.trip.nav : appNav);
  const back = $derived(inTrip ? { label: 'All trips', onClick: () => goto('/') } : null);
  // In a trip we render our own top-bar identity (the ctxTitle snippet): the app
  // icon + wordmark crossfade to the trip's emoji + title + subtitle as the page
  // header scrolls under the bar. `data-trip` on <html> hides the kit's own
  // top-bar app icon so ours is the only one (the kit icon shows otherwise).
  $effect(() => {
    if (typeof document === 'undefined') return;
    document.documentElement.toggleAttribute('data-trip', inTrip);
    return () => document.documentElement.removeAttribute('data-trip');
  });

  // Always-available desktop sidebar (AppShell default): sidebar ≥ 920px, top-bar
  // + drawer below. The soon rows give the app-level sidebar real substance.
  const breakpoint = 920;

  // Sign-out is a POST action; the account button submits the hidden form below.
  /** @type {HTMLFormElement | undefined} */
  let logoutForm = $state();
  const account = $derived(
    user
      ? {
          name: displayName(user.name, user) || user.email,
          avatar: user.avatar || undefined, // resolved photo URL (Google CDN or /api/files/…); falls back to initial
          // The shell account avatar (sidebar + mobile top bar) opens the profile
          // editor — available everywhere, not just the dashboard.
          onProfile: () => goto('/profile'),
          onSignOut: () => logoutForm?.requestSubmit()
        }
      : null
  );

  // Settings live INLINE as the trip page's "Trip settings" section (a nav row in
  // contextual mode). The shell's separate Settings gear is only for the standalone
  // /settings route (planning trips not yet on the contextual shell). The account /
  // profile surface is reached via the avatar's onProfile, not this gear.
  const onSettings = $derived(
    !inTrip && tripToken ? () => goto(`/${tripToken}/settings`) : null
  );
  const settingsActive = $derived(path.endsWith('/settings'));
</script>

<!-- The mobile top-bar identity while a trip is open: two layers stacked in the
     same grid cell, crossfaded by opacity as the page header collapses. At the
     top it's the app icon + wordmark; scrolled, it's the trip's emoji + title +
     subtitle. Pure CSS opacity (reliable across the kit's snippet boundary). -->
{#snippet ctxTitle()}
  <span class="grid min-w-0 items-center">
    <span
      class="flex min-w-0 items-center gap-2 transition-opacity duration-200 [grid-area:1/1] {shell.collapsed
        ? 'pointer-events-none opacity-0'
        : 'opacity-100'}"
    >
      <AppIcon app="tripwala" size={26} />
      <Wordmark root="trip" size={20} />
    </span>
    <span
      class="flex min-w-0 items-center gap-2 transition-opacity duration-200 [grid-area:1/1] {shell.collapsed
        ? 'opacity-100'
        : 'pointer-events-none opacity-0'}"
    >
      <span
        class="grid h-7 w-7 flex-none place-items-center rounded-md text-[15px]"
        style="background: linear-gradient(135deg, var(--color-sand-200), var(--color-sand-300))"
      >{shell.trip?.emoji ?? '🧭'}</span>
      <span class="flex min-w-0 flex-col leading-tight">
        <span class="truncate font-display text-[14px] font-bold text-cocoa-900">{shell.trip?.title ?? ''}</span>
        {#if shell.trip?.subtitle}
          <span class="truncate font-body text-[10.5px] font-extrabold text-coral-600">{shell.trip.subtitle}</span>
        {/if}
      </span>
    </span>
  </span>
{/snippet}

{#if user}
  <AppShell
    app="tripwala"
    {nav}
    {account}
    {onSettings}
    {settingsActive}
    {back}
    title={inTrip ? ctxTitle : null}
    scrollSpy={inTrip}
    {breakpoint}
  >
    {@render children()}
  </AppShell>
  <form bind:this={logoutForm} method="POST" action="/logout" class="hidden"></form>
{:else}
  <!-- Logged-out / auth pages bring their own full-bleed chrome. -->
  {@render children()}
{/if}

<style>
  /* While a trip is open we render our own app icon inside the top-bar title
     slot (ctxTitle), so hide the AppShell's own top-bar app icon (the squircle
     [role="img"] that's a direct child of the top bar) to avoid two icons. */
  :global(html[data-trip] .wala-appshell .topbar > [role='img']) {
    display: none;
  }
</style>
