<script>
  /**
   * Section header that sits ABOVE its Card (the 2026-06-23 design cleanup —
   * docs/apps/tripwala.md → "Layout conventions"). Emoji (17px) + h2 (display
   * 600, 18px) + optional muted subtitle, with an optional right-aligned action
   * (chips, an add button) via the `action` snippet.
   *
   * @type {{
   *   emoji: string,
   *   title: string,
   *   subtitle?: string,
   *   action?: import('svelte').Snippet
   * }}
   */
  let { emoji, title, subtitle = '', action } = $props();
</script>

<div class="mb-2.5 flex items-center gap-2.5 px-1">
  <span class="text-[17px] leading-none">{emoji}</span>
  <h2 class="font-display text-[18px] font-semibold leading-tight text-cocoa-900">{title}</h2>
  {#if subtitle}
    <span class="font-body text-[13px] font-bold text-cocoa-500">{subtitle}</span>
  {/if}
  {#if action}
    <span class="ml-auto flex items-center gap-2">{@render action()}</span>
  {/if}
</div>
