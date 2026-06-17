<script>
  import { colorFor, initialOf } from '$lib/avatar.js';

  /**
   * Friendly round initial chip. With no accounts, the colored initial is a
   * person's whole identity; color is derived from the name unless overridden.
   * @type {{ name?: string, color?: string | null, size?: number, ring?: boolean, emoji?: string | null }}
   */
  let { name = '?', color = null, size = 36, ring = false, emoji = null } = $props();
</script>

<span
  title={name}
  class="inline-grid flex-none select-none place-items-center rounded-full font-display font-semibold leading-none text-white"
  style="
    width: {size}px;
    height: {size}px;
    font-size: {Math.round(size * 0.42)}px;
    background: {color ?? colorFor(name)};
    {ring ? 'border: 2.5px solid #fff; box-shadow: 0 0 0 1px rgba(58,45,40,.06);' : ''}
  "
>
  {emoji ?? initialOf(name)}
</span>
