<script>
  /**
   * Campfire button — chunky, pill-shaped, with a 3D "lip" that compresses on
   * press. CSS :active drives the press (no JS handlers needed).
   * @type {{
   *   variant?: 'primary'|'secondary'|'accent'|'soft'|'ghost',
   *   size?: 'sm'|'md'|'lg',
   *   full?: boolean,
   *   disabled?: boolean,
   *   type?: 'button'|'submit'|'reset',
   *   href?: string | null,
   *   onclick?: (e: MouseEvent) => void,
   *   children?: import('svelte').Snippet,
   *   [key: string]: any
   * }}
   */
  let {
    variant = 'primary',
    size = 'md',
    full = false,
    disabled = false,
    type = 'button',
    href = null,
    onclick,
    children,
    ...rest
  } = $props();
</script>

{#if href && !disabled}
  <a {href} class="tripwala-btn {variant} {size}" class:full {onclick} {...rest}>
    {@render children?.()}
  </a>
{:else}
  <button {type} {disabled} class="tripwala-btn {variant} {size}" class:full {onclick} {...rest}>
    {@render children?.()}
  </button>
{/if}

<style>
  .tripwala-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    font-family: var(--font-display);
    font-weight: 600;
    line-height: 1.1;
    border: none;
    border-radius: 9999px;
    cursor: pointer;
    text-decoration: none;
    transform: translateY(0);
    box-shadow: 0 var(--lip) 0 var(--lip-color);
    transition:
      transform var(--dur-fast) var(--ease-out),
      box-shadow var(--dur-fast) var(--ease-out),
      filter var(--dur-fast);
  }
  .tripwala-btn:active:not(:disabled) {
    transform: translateY(var(--lip));
    box-shadow: 0 0 0 var(--lip-color);
  }
  .tripwala-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  .full {
    width: 100%;
  }

  .sm {
    --lip: 4px;
    font-size: 13px;
    padding: 8px 16px;
  }
  .md {
    --lip: 5px;
    font-size: 15px;
    padding: 12px 22px;
  }
  .lg {
    --lip: 6px;
    font-size: 17px;
    padding: 15px 28px;
  }

  .primary {
    --lip-color: var(--color-coral-600);
    background: var(--color-coral-500);
    color: #fff;
  }
  .secondary {
    --lip-color: var(--color-sun-600);
    background: var(--color-sun-400);
    color: var(--color-cocoa-900);
  }
  .accent {
    --lip-color: var(--color-berry-600);
    background: var(--color-berry-500);
    color: #fff;
  }
  .soft {
    --lip-color: var(--color-coral-300);
    background: var(--color-coral-200);
    color: var(--color-coral-700);
  }
  .ghost {
    --lip: 0px;
    --lip-color: transparent;
    background: transparent;
    color: var(--color-coral-700);
    border: 2px solid var(--color-coral-300);
    box-shadow: none;
  }
  .ghost:active:not(:disabled) {
    transform: translateY(0);
  }
</style>
