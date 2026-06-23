<script>
  import { enhance } from '$app/forms';
  import Button from '$lib/ui/Button.svelte';
  import TextField from '$lib/ui/TextField.svelte';
  import GoogleIcon from '$lib/ui/GoogleIcon.svelte';

  /** @type {{ data: import('./$types').PageData, form: import('./$types').ActionData }} */
  let { data, form } = $props();

  const next = $derived(data.next ?? '/');
  const googleHref = $derived(`/auth/google?next=${encodeURIComponent(next)}`);
  const loginHref = $derived(`/login?next=${encodeURIComponent(next)}`);
  const values = $derived(form?.values ?? {});

  let submitting = $state(false);
</script>

<svelte:head><title>Create account — Rally</title></svelte:head>

<main class="min-h-full bg-sand-100">
  <div class="mx-auto max-w-md px-4 py-12 sm:px-6">
    <div class="rounded-xl bg-white p-[22px] shadow-pop">
      <div class="text-center text-[40px] leading-none">🧭</div>
      <h1 class="mt-2 text-center font-display text-xl font-bold text-cocoa-900">Create your account</h1>
      <p class="mt-1 text-center font-body text-[13px] font-bold text-cocoa-500">
        One account for all your trips — plan them and join the ones you're invited to.
      </p>

      {#if form?.error}
        <p class="mt-4 rounded-md bg-berry-200 px-3 py-2 font-body text-sm font-bold text-berry-600">{form.error}</p>
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
        <TextField prefix="👋" name="name" placeholder="Your name" autocomplete="name" value={values.name ?? ''} />
        <TextField
          prefix="✉️"
          name="email"
          type="email"
          placeholder="you@example.com"
          autocomplete="email"
          value={values.email ?? ''}
        />
        <TextField prefix="🔑" name="password" type="password" placeholder="Password (8+ characters)" autocomplete="new-password" />
        <Button variant="primary" size="lg" full type="submit" disabled={submitting}>
          {submitting ? 'Creating…' : 'Create account'}
        </Button>
      </form>

      <p class="mt-4 text-center font-body text-[13px] font-bold text-cocoa-500">
        Already have one? <a href={loginHref} class="font-extrabold text-coral-600 hover:underline">Sign in</a>
      </p>
    </div>
  </div>
</main>
