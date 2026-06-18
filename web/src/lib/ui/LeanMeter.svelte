<script>
  /**
   * How flaky a "Maybe" is — three dots fill by confidence so the host can read
   * the room at a glance. Ported from the design system's LeanMeter.
   * @type {{ lean?: number, showLabel?: boolean }}
   */
  let { lean = 2, showLabel = true } = $props();

  /** @type {Record<number, { dots: number, color: string, label: string }>} */
  const LEVELS = {
    1: { dots: 1, color: 'var(--color-berry-500)', label: 'Long shot' },
    2: { dots: 2, color: 'var(--color-sun-500)', label: '50 / 50' },
    3: { dots: 3, color: 'var(--color-leaf-500)', label: 'Leaning yes' }
  };
  const l = $derived(LEVELS[lean] ?? LEVELS[2]);
</script>

<span class="inline-flex items-center gap-1.5">
  <span class="inline-flex gap-[3px]">
    {#each [1, 2, 3] as i}
      <span
        class="h-[7px] w-[7px] rounded-full"
        style="background: {i <= l.dots ? l.color : 'var(--color-sand-300)'}"
      ></span>
    {/each}
  </span>
  {#if showLabel}
    <span class="font-body text-[11.5px] font-extrabold" style="color: {l.color}">{l.label}</span>
  {/if}
</span>
