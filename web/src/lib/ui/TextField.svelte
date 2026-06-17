<script>
  /**
   * Friendly rounded text field with optional emoji prefix and focus ring.
   * Extra props (name, placeholder, required, maxlength, value, oninput…) are
   * forwarded to the <input>.
   * @type {{
   *   label?: string,
   *   prefix?: string | null,
   *   hint?: string,
   *   value?: string,
   *   [key: string]: any
   * }}
   */
  let { label, prefix = null, hint, value = $bindable(''), ...rest } = $props();
</script>

<label class="block">
  {#if label}
    <span class="mb-[7px] block font-display text-sm font-semibold text-cocoa-900">{label}</span>
  {/if}
  <span
    class="flex items-center gap-2.5 rounded-md border-2 border-sand-300 bg-white px-3.5 transition
      focus-within:border-coral-400 focus-within:ring-4 focus-within:ring-coral-200"
  >
    {#if prefix}<span class="text-lg">{prefix}</span>{/if}
    <input
      bind:value
      class="flex-1 border-none bg-transparent py-[13px] font-body text-base font-bold text-cocoa-900 outline-none placeholder:text-cocoa-300"
      {...rest}
    />
  </span>
  {#if hint}
    <span class="mt-1.5 block font-body text-[12.5px] font-semibold text-cocoa-500">{hint}</span>
  {/if}
</label>
