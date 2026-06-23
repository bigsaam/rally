<script>
  /**
   * Small rounded pill for counts, tags, status summaries.
   * @type {{ tone?: 'neutral'|'coral'|'sun'|'berry'|'leaf', children?: import('svelte').Snippet }}
   */
  let { tone = 'neutral', children } = $props();

  const tones = {
    neutral: 'bg-white text-cocoa-700 border-sand-300',
    coral: 'bg-coral-200 text-coral-700 border-coral-200',
    sun: 'bg-sun-200 text-cocoa-900 border-sun-300',
    berry: 'bg-berry-200 text-berry-600 border-berry-200',
    leaf: 'bg-leaf-200 text-leaf-600 border-leaf-200'
  };
</script>

<span
  class="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border-2 px-3 py-[5px] font-body text-[11.5px] font-bold {tones[tone] ?? tones.neutral}"
>
  {@render children?.()}
</span>
