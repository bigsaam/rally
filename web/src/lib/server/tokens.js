import { randomBytes } from 'node:crypto';

// URL-safe random tokens. base64url yields chars in [A-Za-z0-9_-], matching the
// `share_token` / `owner_token` field pattern, and the lengths sit inside the
// schema's 10..64 bound. The token IS the capability, so entropy matters:
// 18 bytes ≈ 144 bits (share), 24 bytes ≈ 192 bits (owner).

/** Participant share token (in the public URL). */
export function generateShareToken() {
  return randomBytes(18).toString('base64url'); // 24 chars
}

/** Owner/edit token (held only by the creator). Longer for extra margin. */
export function generateOwnerToken() {
  return randomBytes(24).toString('base64url'); // 32 chars
}
