<script>
  /**
   * Section card header: emoji tile + friendly title + optional action.
   * @type {{
   *   icon?: string,
   *   iconBg?: string,
   *   title: string,
   *   action?: import('svelte').Snippet
   * }}
   */
  let { icon, iconBg = 'var(--color-sand-200)', title, action } = $props();
</script>

<div class="mb-3.5 flex items-center gap-2.5">
  {#if icon != null}
    <span
      class="grid h-8 w-8 flex-none place-items-center rounded-md text-base"
      style="background: {iconBg}"
    >
      {icon}
    </span>
  {/if}
  <span class="font-display text-[17px] font-semibold text-cocoa-900">{title}</span>
  {#if action}
    <span class="ml-auto">{@render action()}</span>
  {/if}
</div>
