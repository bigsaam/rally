<script>
  // Trip-dates weather forecast, fetched client-side from Open-Meteo (free, no
  // key, CORS-enabled — so no server load, no SSRF surface, no schema). We only
  // fetch when the trip has a location and starts inside the ~16-day forecast
  // horizon; otherwise the card renders nothing. All failures are silent.
  import { fmtWeekday, fmtMonthDay } from '$lib/format.js';

  /** @type {{ location?: string, startDate?: string, endDate?: string }} */
  let { location = '', startDate = '', endDate = '' } = $props();

  /** @type {'idle'|'loading'|'ready'} */
  let phase = $state('idle');
  /** @type {Array<{ date: string, code: number, tmax: number, tmin: number }>} */
  let days = $state([]);
  let place = $state('');

  // WMO weather code → [emoji, label]. Grouped to the buckets that matter.
  /** @type {Record<number, [string, string]>} */
  const WMO = {
    0: ['☀️', 'Clear'], 1: ['🌤️', 'Mostly clear'], 2: ['⛅', 'Partly cloudy'], 3: ['☁️', 'Overcast'],
    45: ['🌫️', 'Fog'], 48: ['🌫️', 'Fog'],
    51: ['🌦️', 'Drizzle'], 53: ['🌦️', 'Drizzle'], 55: ['🌦️', 'Drizzle'],
    56: ['🌧️', 'Freezing drizzle'], 57: ['🌧️', 'Freezing drizzle'],
    61: ['🌧️', 'Rain'], 63: ['🌧️', 'Rain'], 65: ['🌧️', 'Heavy rain'],
    66: ['🌧️', 'Freezing rain'], 67: ['🌧️', 'Freezing rain'],
    71: ['🌨️', 'Snow'], 73: ['🌨️', 'Snow'], 75: ['❄️', 'Heavy snow'], 77: ['🌨️', 'Snow grains'],
    80: ['🌦️', 'Showers'], 81: ['🌦️', 'Showers'], 82: ['⛈️', 'Violent showers'],
    85: ['🌨️', 'Snow showers'], 86: ['❄️', 'Snow showers'],
    95: ['⛈️', 'Thunderstorm'], 96: ['⛈️', 'Thunderstorm'], 99: ['⛈️', 'Thunderstorm']
  };
  const wmo = (/** @type {number} */ c) => WMO[c] ?? ['🌡️', ''];

  /** True if `start` is within the forecast horizon (and not long past). */
  function inWindow(/** @type {string} */ start) {
    if (!start) return false;
    const s = new Date(start);
    if (Number.isNaN(s.getTime())) return false;
    const now = new Date();
    const delta =
      (Date.UTC(s.getUTCFullYear(), s.getUTCMonth(), s.getUTCDate()) -
        Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())) /
      86400000;
    return delta >= -1 && delta <= 15;
  }

  $effect(() => {
    const loc = (location || '').trim();
    const start = startDate || '';
    const end = endDate || start;
    if (!loc || !inWindow(start)) {
      phase = 'idle';
      return;
    }
    let cancelled = false;
    phase = 'loading';
    // Open-Meteo's gazetteer matches place names, not "Place, ST" strings — so
    // try the full location, then fall back to the part before the first comma
    // ("Yosemite Valley, CA" → "Yosemite Valley").
    /** @param {string} name */
    const geocode = async (name) => {
      const res = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?count=1&language=en&format=json&name=${encodeURIComponent(name)}`
      ).then((r) => r.json());
      return res?.results?.[0] ?? null;
    };
    (async () => {
      try {
        const head = loc.split(',')[0].trim();
        const hit = (await geocode(loc)) || (head && head !== loc ? await geocode(head) : null);
        if (!hit) {
          if (!cancelled) phase = 'idle';
          return;
        }
        const sd = start.slice(0, 10);
        const ed = (end || start).slice(0, 10);
        const fc = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${hit.latitude}&longitude=${hit.longitude}` +
            `&daily=weather_code,temperature_2m_max,temperature_2m_min&temperature_unit=fahrenheit` +
            `&timezone=auto&start_date=${sd}&end_date=${ed}`
        ).then((r) => r.json());
        const t = fc?.daily?.time ?? [];
        const rows = t.map((/** @type {string} */ date, /** @type {number} */ i) => ({
          date,
          code: fc.daily.weather_code[i],
          tmax: Math.round(fc.daily.temperature_2m_max[i]),
          tmin: Math.round(fc.daily.temperature_2m_min[i])
        }));
        if (!cancelled) {
          days = rows;
          place = [hit.name, hit.admin1, hit.country_code].filter(Boolean).slice(0, 2).join(', ');
          phase = rows.length ? 'ready' : 'idle';
        }
      } catch (_) {
        if (!cancelled) phase = 'idle';
      }
    })();
    return () => {
      cancelled = true;
    };
  });
</script>

{#if phase === 'ready'}
  <div class="mt-4 rounded-2xl bg-sky-100 p-3" style="background: var(--color-sand-100)">
    <div class="mb-2 flex items-center gap-1.5">
      <span class="font-body text-[12px] font-extrabold text-cocoa-500">🌤️ Forecast{#if place} · {place}{/if}</span>
    </div>
    <div class="-mx-1 flex gap-2 overflow-x-auto px-1 [scrollbar-width:thin]">
      {#each days as d (d.date)}
        {@const w = wmo(d.code)}
        <div class="flex w-[68px] flex-none flex-col items-center rounded-xl bg-white px-1 py-2 text-center">
          <span class="font-body text-[11px] font-extrabold text-cocoa-500">{fmtWeekday(d.date).slice(0, 3)}</span>
          <span class="my-0.5 text-2xl" title={w[1]}>{w[0]}</span>
          <span class="font-display text-[13px] font-bold text-cocoa-900">{d.tmax}°</span>
          <span class="font-body text-[11px] font-bold text-cocoa-400">{d.tmin}°</span>
        </div>
      {/each}
    </div>
  </div>
{/if}
