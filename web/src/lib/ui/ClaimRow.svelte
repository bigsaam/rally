<script>
  import Avatar from './Avatar.svelte';
  import Button from './Button.svelte';

  /**
   * The signature gear/task row: emoji tile, item, and either a "claimed by"
   * avatar or a grab button. `onClaim` is optional — omit it (read-only) and the
   * row simply shows status without an action.
   * @type {{
   *   emoji?: string,
   *   emojiBg?: string,
   *   name: string,
   *   note?: string,
   *   claimedBy?: string | null,
   *   claimColor?: string | null,
   *   claimLabel?: string,
   *   divider?: boolean,
   *   onClaim?: (() => void) | null
   * }}
   */
  let {
    emoji = '🎒',
    emojiBg = 'var(--color-sand-200)',
    name,
    note = 'up for grabs!',
    claimedBy = null,
    claimColor = null,
    claimLabel = 'Grab it',
    divider = true,
    onClaim = null
  } = $props();
</script>

<div class="flex items-center gap-3 py-2.5 {divider ? 'border-t border-sand-200' : ''}">
  <span
    class="grid h-10 w-10 flex-none place-items-center rounded-md text-[19px]"
    style="background: {emojiBg}"
  >
    {emoji}
  </span>
  <span class="min-w-0 flex-1">
    <span class="block font-body text-[15px] font-extrabold text-cocoa-900">{name}</span>
    {#if note || claimedBy}
      <span class="block font-body text-[12.5px] font-bold text-cocoa-500">
        {claimedBy ? `${claimedBy}'s got it` : note}
      </span>
    {/if}
  </span>
  {#if claimedBy}
    <Avatar name={claimedBy} color={claimColor} size={28} />
  {:else if onClaim}
    <Button variant="secondary" size="sm" onclick={onClaim}>{claimLabel}</Button>
  {/if}
</div>
