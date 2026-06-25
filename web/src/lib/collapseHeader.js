// Svelte action: report when the trip header has scrolled up under the sticky
// top bar. Calls onChange(true) once the header is out of view past the top bar,
// onChange(false) when it's back. Drives the layout's title crossfade so the
// page can drop its second sticky header on mobile. Client-only (actions don't
// run on SSR); a no-op if IntersectionObserver is unavailable.

const TOPBAR = 64; // px reserved for the sticky top bar (approx its height)

/**
 * @param {HTMLElement} node
 * @param {(collapsed: boolean) => void} onChange
 */
export function collapseHeader(node, onChange) {
  let cb = onChange;
  if (typeof IntersectionObserver === 'undefined') return {};

  const io = new IntersectionObserver(
    ([entry]) => cb(!entry.isIntersecting),
    { rootMargin: `-${TOPBAR}px 0px 0px 0px`, threshold: 0 }
  );
  io.observe(node);

  return {
    update(/** @type {(collapsed: boolean) => void} */ next) {
      cb = next;
    },
    destroy() {
      io.disconnect();
      cb(false); // leaving the trip → uncollapse
    }
  };
}
