<script>
  import { invalidateAll } from '$app/navigation';
  import { tripAction } from '$lib/tripClient.js';
  import { Card, Avatar, SegmentedControl, LeanMeter, Chip } from '@walaware/design';
  import SectionHeader from '$lib/ui/SectionHeader.svelte';

  // LeanMeter's `lean` prop is a 1|2|3 union; narrow the raw number to it.
  /** @param {number} n @returns {1 | 2 | 3} */
  const leanOf = (n) => (n >= 3 ? 3 : n <= 1 ? 1 : 2);

  /**
   * @type {{
   *   shareToken: string,
   *   participants: Array<{ id: string, display_name: string, rsvp_status: string | null, lean: number, avatar?: string }>,
   *   currentParticipantId: string | null,
   *   ownerMode?: boolean,
   *   onHide?: (() => void) | null
   * }}
   */
  let { shareToken, participants, currentParticipantId, ownerMode = false, onHide = null } = $props();

  /** @type {Record<string, string>} */
  const statusEmoji = { going: '🔥', maybe: '🤔', out: '💤' };
  const RSVP_OPTS = [
    { value: 'going', emoji: '🔥' },
    { value: 'maybe', emoji: '🤔' },
    { value: 'out', emoji: '💤' }
  ];
  const LEAN_OPTS = [
    { v: 1, label: 'Long shot' },
    { v: 2, label: '50 / 50' },
    { v: 3, label: 'Leaning yes' }
  ];
  const going = $derived(participants.filter((p) => p.rsvp_status === 'going').length);
  const maybe = $derived(participants.filter((p) => p.rsvp_status === 'maybe').length);
  const me = $derived(participants.find((p) => p.id === currentParticipantId) ?? null);

  let saving = $state(false);
  /** participant id currently being saved (owner edits) */
  let savingId = $state('');

  /** @param {string} status @param {string} [participantId] */
  async function setRsvp(status, participantId) {
    const id = participantId ?? currentParticipantId;
    if (!id || saving || savingId) return;
    if (participantId) savingId = participantId;
    else saving = true;
    try {
      await tripAction(shareToken, { op: 'rsvp', participantId: id, status });
      await invalidateAll();
    } catch (_) {
      // next load / poll will reconcile
    } finally {
      saving = false;
      savingId = '';
    }
  }

  /** @param {number} lean */
  async function setLean(lean) {
    if (!currentParticipantId || saving) return;
    saving = true;
    try {
      await tripAction(shareToken, { op: 'lean', participantId: currentParticipantId, lean });
      await invalidateAll();
    } catch (_) {
      /* reconciled */
    } finally {
      saving = false;
    }
  }
</script>

<SectionHeader emoji="🙌" title="Who's coming?" {onHide}>
  {#snippet action()}
    <Chip tone="leaf">{going} going</Chip>
    {#if maybe > 0}<Chip tone="sun">{maybe} maybe</Chip>{/if}
  {/snippet}
</SectionHeader>

<Card>
  <!-- Crew as avatar pills (the mock's roster). Owners get inline RSVP controls
       on each pill; everyone else sees the person's status glyph. -->
  <div class="mb-3.5 flex flex-wrap gap-2">
    {#each participants as p}
      <span
        class="flex items-center gap-1.5 rounded-full bg-sand-100 py-1 pl-1 pr-3"
        class:opacity-50={p.rsvp_status === 'out'}
      >
        <Avatar name={p.display_name} src={p.avatar} size={26} />
        <span class="font-body text-[13px] font-extrabold text-cocoa-900">
          {p.display_name}{#if p.id === currentParticipantId}<span class="font-bold text-cocoa-500"> (you)</span>{/if}
        </span>
        {#if ownerMode}
          <span class="ml-0.5 flex gap-0.5">
            {#each RSVP_OPTS as opt}
              <button
                type="button"
                disabled={savingId === p.id}
                aria-label="Set {p.display_name} {opt.value}"
                onclick={() => setRsvp(opt.value, p.id)}
                class="grid h-6 w-6 place-items-center rounded-full text-[12px] transition
                  {p.rsvp_status === opt.value ? 'bg-white shadow-soft' : 'opacity-35 hover:opacity-70'}"
              >
                {opt.emoji}
              </button>
            {/each}
          </span>
        {:else if p.rsvp_status === 'maybe'}
          <LeanMeter lean={leanOf(p.lean || 2)} showLabel={false} />
        {:else if p.rsvp_status}
          <span class="text-[13px]">{statusEmoji[p.rsvp_status]}</span>
        {/if}
      </span>
    {/each}
  </div>

  <div class="mb-1.5 font-body text-[12.5px] font-extrabold text-cocoa-500">
    {me ? 'Your answer' : 'Claim a name above to RSVP'}
  </div>
  <SegmentedControl
    options={[
      { value: 'going', label: 'Going' },
      { value: 'maybe', label: 'Maybe' },
      { value: 'out', label: "Can't" }
    ]}
    value={me?.rsvp_status ?? null}
    onChange={setRsvp}
  />

  {#if me?.rsvp_status === 'maybe'}
    <div class="mt-2.5 rounded-md bg-sun-200 px-3 py-2.5">
      <div class="mb-2 font-body text-[12px] font-extrabold text-sun-600">How likely, really? 🤔</div>
      <div class="flex gap-1.5">
        {#each LEAN_OPTS as o}
          <button
            type="button"
            disabled={saving}
            onclick={() => setLean(o.v)}
            class="flex-1 rounded-full px-1 py-1.5 font-display text-[12px] font-semibold transition
              {(me.lean || 2) === o.v ? 'bg-white text-cocoa-900 shadow-soft' : 'bg-white/50 text-cocoa-700 hover:bg-white/80'}"
          >
            {o.label}
          </button>
        {/each}
      </div>
    </div>
  {/if}
</Card>
