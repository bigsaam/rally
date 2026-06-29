// App-wide settings, stored as a single superuser-locked `app_settings` row and
// edited by the instance admin in the UI. Today this is just the Immich
// connection. Env vars (IMMICH_URL / IMMICH_API_KEY) act as a fallback/seed so a
// deployer CAN pre-configure without it being required — but the DB row, when
// set, wins. The browser never reads this collection; only the server does, and
// the admin UI masks the API key.

import { env } from '$env/dynamic/private';
import { superuserPb } from './pocketbase.js';

/** Fetch (or lazily create) the singleton app_settings record. */
async function settingsRecord() {
  const pb = await superuserPb();
  try {
    return await pb.collection('app_settings').getFirstListItem(
      pb.filter('singleton = {:s}', { s: 'app' })
    );
  } catch {
    // The migration seeds one row, but self-heal if it's somehow missing.
    return await pb.collection('app_settings').create({ singleton: 'app', immich_url: '', immich_api_key: '' });
  }
}

const stripSlash = (/** @type {string} */ u) => String(u || '').trim().replace(/\/+$/, '');

/**
 * Resolved Immich config: DB row first, env fallback. `configured` means we have
 * both a base URL and an API key to talk to Immich.
 * @returns {Promise<{ url: string, apiKey: string, configured: boolean, source: 'db'|'env'|'none' }>}
 */
export async function loadImmichConfig() {
  const rec = await settingsRecord();
  const dbUrl = stripSlash(rec.immich_url);
  const dbKey = String(rec.immich_api_key || '').trim();
  const url = dbUrl || stripSlash(env.IMMICH_URL || '');
  const apiKey = dbKey || String(env.IMMICH_API_KEY || '').trim();
  const source = dbUrl || dbKey ? 'db' : url || apiKey ? 'env' : 'none';
  return { url, apiKey, configured: Boolean(url && apiKey), source };
}

/**
 * What the admin settings UI should show: the URL (safe to display) and whether
 * a key is set — but never the key itself.
 * @returns {Promise<{ url: string, hasKey: boolean, source: 'db'|'env'|'none' }>}
 */
export async function loadImmichConfigForAdmin() {
  const rec = await settingsRecord();
  const cfg = await loadImmichConfig();
  return {
    url: rec.immich_url || (cfg.source === 'env' ? cfg.url : ''),
    hasKey: cfg.configured,
    source: cfg.source
  };
}

/**
 * Persist Immich config from the admin form. A blank apiKey means "leave the
 * stored key unchanged" (the form never round-trips the secret); pass
 * `clearKey: true` to explicitly remove it.
 * @param {{ url?: string, apiKey?: string, clearKey?: boolean }} input
 */
export async function saveImmichConfig({ url, apiKey, clearKey } = {}) {
  const pb = await superuserPb();
  const rec = await settingsRecord();
  /** @type {Record<string,string>} */
  const data = { immich_url: stripSlash(url || '') };
  if (clearKey) data.immich_api_key = '';
  else if (apiKey && apiKey.trim()) data.immich_api_key = apiKey.trim();
  return await pb.collection('app_settings').update(rec.id, data);
}
