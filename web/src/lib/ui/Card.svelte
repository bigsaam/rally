<script>
  /**
   * Soft rounded surface — the building block of every Rally section.
   * @type {{ hero?: boolean, pad?: boolean, class?: string, children?: import('svelte').Snippet, [key: string]: any }}
   */
  let { hero = false, pad = true, class: klass = '', children, ...rest } = $props();
</script>

<div
  class="bg-white shadow-card {hero ? 'rounded-xl' : 'rounded-lg'} {pad ? 'p-[18px]' : ''} {klass}"
  {...rest}
>
  {@render children?.()}
</div>
