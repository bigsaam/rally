<script>
  import Button from './Button.svelte';

  /**
   * Friendly empty state — tripwala never leaves a blank card. Big emoji, a warm
   * line, and a single optional action.
   * @type {{
   *   emoji?: string,
   *   title?: string,
   *   body?: string,
   *   action?: string,
   *   onAction?: (() => void) | null
   * }}
   */
  let {
    emoji = '🦗',
    title = "It's quiet in here…",
    body,
    action,
    onAction = null
  } = $props();
</script>

<div class="px-[18px] pb-6 pt-7 text-center">
  <div class="mb-3 text-[40px] leading-none">{emoji}</div>
  <div class="mb-1.5 font-display text-lg font-semibold text-cocoa-900">{title}</div>
  {#if body}
    <div class="mx-auto mb-4 max-w-[260px] font-body text-sm font-bold text-cocoa-500">{body}</div>
  {/if}
  {#if action && onAction}
    <Button variant="primary" size="md" onclick={onAction}>{action}</Button>
  {/if}
</div>
