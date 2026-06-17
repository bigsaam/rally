<script>
  /**
   * RSVP-style segmented control — rounded inset track, active segment lifts
   * onto a white pill.
   * @type {{
   *   options: Array<{ value: string, label: string }>,
   *   value?: string | null,
   *   onChange?: (v: string) => void
   * }}
   */
  let { options = [], value = null, onChange = () => {} } = $props();
</script>

<div role="tablist" class="flex gap-1 rounded-full bg-sand-200 p-1">
  {#each options as opt}
    <button
      type="button"
      role="tab"
      aria-selected={opt.value === value}
      onclick={() => onChange(opt.value)}
      class="flex-1 rounded-full px-2 py-[9px] font-display text-sm font-semibold transition-colors duration-200
        {opt.value === value
          ? 'bg-white text-cocoa-900 shadow-soft'
          : 'bg-transparent text-cocoa-500'}"
    >
      {opt.label}
    </button>
  {/each}
</div>
