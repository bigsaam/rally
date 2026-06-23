<script>
  import { enhance } from '$app/forms';
  import Button from '$lib/ui/Button.svelte';
  import TextField from '$lib/ui/TextField.svelte';
  import GoogleIcon from '$lib/ui/GoogleIcon.svelte';

  /** @type {{ data: import('./$types').PageData, form: import('./$types').ActionData }} */
  let { data, form } = $props();

  const next = $derived(data.next ?? '/');
  const googleHref = $derived(`/auth/google?next=${encodeURIComponent(next)}`);
  const signupHref = $derived(`/signup?next=${encodeURIComponent(next)}`);

  let submitting = $state(false);
</script>

<svelte:head><title>Sign in — Rally</title></svelte:head>

<main class="min-h-full bg-sand-100">
  <div class="mx-auto max-w-md px-4 py-12 sm:px-6">
    <div class="rounded-xl bg-white p-[22px] shadow-pop">
      <div class="text-center text-[40px] leading-none">🧭</div>
      <h1 class="mt-2 text-center font-display text-xl font-bold text-cocoa-900">Welcome back</h1>
      <p class="mt-1 text-center font-body text-[13px] font-bold text-cocoa-500">
        Sign in to see your trips and join the ones you're invited to.
      </p>

      {#if data.oauthError || form?.error}
        <p class="mt-4 rounded-md bg-berry-200 px-3 py-2 font-body text-sm font-bold text-berry-600">
          {form?.error ?? "Google sign-in didn't complete. Try again."}
        </p>
      {/if}

      <a
        href={googleHref}
        class="mt-5 flex w-full items-center justify-center gap-2.5 rounded-md border-2 border-sand-300 bg-white py-3 font-display text-sm font-semibold text-cocoa-900 transition hover:border-coral-400"
      >
        <GoogleIcon /> Continue with Google
      </a>

      <div class="my-4 flex items-center gap-3">
        <span class="h-px flex-1 bg-sand-300"></span>
        <span class="font-body text-xs font-bold text-cocoa-400">or</span>
        <span class="h-px flex-1 bg-sand-300"></span>
      </div>

      <form
        method="POST"
        use:enhance={() => {
          submitting = true;
          return async ({ update }) => {
            submitting = false;
            await update();
          };
        }}
        class="flex flex-col gap-3"
      >
        <input type="hidden" name="next" value={next} />
        <TextField
          prefix="✉️"
          name="email"
          type="email"
          placeholder="you@example.com"
          autocomplete="email"
          value={form?.email ?? ''}
        />
        <TextField prefix="🔑" name="password" type="password" placeholder="Password" autocomplete="current-password" />
        <Button variant="primary" size="lg" full type="submit" disabled={submitting}>
          {submitting ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>

      <p class="mt-4 text-center font-body text-[13px] font-bold text-cocoa-500">
        New here? <a href={signupHref} class="font-extrabold text-coral-600 hover:underline">Create an account</a>
      </p>
    </div>
  </div>
</main>
