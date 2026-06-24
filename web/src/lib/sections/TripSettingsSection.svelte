<script>
  import { goto, invalidateAll } from '$app/navigation';
  import { tripAction } from '$lib/tripClient.js';
  import { Card, Button } from '@walaware/design';
  import SectionHeader from '$lib/ui/SectionHeader.svelte';

  /**
   * @type {{
   *   shareToken: string,
   *   ownerMode?: boolean,
   *   settingsHref: string,
   *   me?: { name: string, notify?: boolean } | null
   * }}
   */
  let { shareToken, ownerMode = false, settingsHref, me = null } = $props();

  let busy = $state(false);

  async function toggleNotify() {
    if (busy) return;
    busy = true;
    try {
      await tripAction(shareToken, { op: 'notify_toggle' });
      await invalidateAll();
    } catch (_) {
      /* reconciled */
    } finally {
      busy = false;
    }
  }

  async function leave() {
    if (busy) return;
    if (!confirm('Leave this trip? You can re-join later from the invite link.')) return;
    busy = true;
    try {
      await tripAction(shareToken, { op: 'leave_trip' });
      await goto('/'); // no longer a member → back to your trips
    } catch (_) {
      busy = false;
    }
  }

  const notifyOn = $derived(me?.notify !== false);
</script>

<SectionHeader emoji="⚙️" title="Trip settings" />
<Card>
  {#if me}
    <!-- Trip notifications -->
    <div class="flex items-center gap-3 py-3.5">
      <span class="w-6 text-center text-[18px]">🔔</span>
      <div class="min-w-0 flex-1">
        <div class="font-body text-[14.5px] font-extrabold text-text-strong">Trip notifications</div>
        <div class="font-body text-[12.5px] font-bold text-text-muted">Claims, RSVPs and meal updates</div>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={notifyOn}
        aria-label="Trip notifications"
        disabled={busy}
        onclick={toggleNotify}
        class="flex h-7 w-12 shrink-0 items-center rounded-full p-[3px] transition-colors {notifyOn ? 'justify-end bg-[var(--color-primary)]' : 'justify-start bg-sand-300'}"
      >
        <span class="block h-[22px] w-[22px] rounded-full bg-white shadow-soft"></span>
      </button>
    </div>
  {/if}

  {#if ownerMode}
    <div class="flex items-center justify-between gap-3 border-t border-sand-200 py-3.5">
      <div class="flex items-center gap-3">
        <span class="w-6 text-center text-[18px]">✏️</span>
        <div>
          <div class="font-body text-[14.5px] font-extrabold text-text-strong">Edit trip details</div>
          <div class="font-body text-[12.5px] font-bold text-text-muted">Dates, location, description, lists</div>
        </div>
      </div>
      <Button href={settingsHref} variant="soft" size="sm">Open</Button>
    </div>
  {/if}

  {#if me}
    <div class="flex items-center justify-between gap-3 border-t border-sand-200 py-3.5">
      <div class="flex items-center gap-3">
        <span class="w-6 text-center text-[18px]">🚪</span>
        <div>
          <div class="font-body text-[14.5px] font-extrabold text-text-strong">Leave this trip</div>
          <div class="font-body text-[12.5px] font-bold text-text-muted">You'll stop getting updates</div>
        </div>
      </div>
      <Button variant="ghost" size="sm" disabled={busy} onclick={leave}>Leave</Button>
    </div>
  {/if}
</Card>
