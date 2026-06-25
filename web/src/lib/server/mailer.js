// Outbound email via SMTP (nodemailer). Provider-agnostic — works with a Gmail
// App Password, Brevo, or any SMTP relay by setting env. Read at RUNTIME via
// $env/dynamic/private so the homelab can supply creds through compose without a
// rebuild. When unset, email invites are simply disabled (the UI hides the field
// and the action refuses), so the app runs fine with no mail config.
//
//   SMTP_HOST   e.g. smtp.gmail.com
//   SMTP_PORT   587 (STARTTLS) or 465 (implicit TLS); default 587
//   SMTP_USER   the SMTP username (your Gmail address)
//   SMTP_PASS   the SMTP password (a Gmail App Password — needs 2FA)
//   SMTP_FROM   optional "Name <addr>"; defaults to "tripwala <SMTP_USER>"

import nodemailer from 'nodemailer';
import { env } from '$env/dynamic/private';

/** Whether outbound email is configured (host + creds present). */
export function isMailConfigured() {
  return Boolean(env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS);
}

/** @type {import('nodemailer').Transporter | null} */
let cached = null;
function transport() {
  if (!cached) {
    const port = Number(env.SMTP_PORT || 587);
    cached = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port,
      secure: port === 465, // 465 = implicit TLS; 587 = STARTTLS
      auth: { user: env.SMTP_USER, pass: env.SMTP_PASS }
    });
  }
  return cached;
}

/** @param {string} s */
const esc = (s) =>
  String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/**
 * Send a trip invite email. The body is fixed (trip name + inviter + link) — no
 * free-form, user-injected content, to keep the endpoint from being a spam relay.
 *
 * @param {{ to: string, tripName: string, inviterName: string, inviteUrl: string }} o
 */
export async function sendInviteEmail({ to, tripName, inviterName, inviteUrl }) {
  if (!isMailConfigured()) throw new Error('Email is not configured');
  const from = env.SMTP_FROM || `tripwala <${env.SMTP_USER}>`;
  const subject = `${inviterName} invited you to ${tripName} on tripwala`;

  const text =
    `${inviterName} invited you to join "${tripName}" on tripwala.\n\n` +
    `Open the trip to join:\n${inviteUrl}\n\n` +
    `tripwala — one link, everyone's in.`;

  const html = `<!doctype html><html><body style="margin:0;background:#FBF6F0;padding:24px;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#3A2D28">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
    <table role="presentation" width="100%" style="max-width:480px;background:#fff;border-radius:16px;padding:28px" cellpadding="0" cellspacing="0">
      <tr><td style="font-size:13px;font-weight:800;letter-spacing:.04em;text-transform:uppercase;color:#FF7A59">You're invited 🎒</td></tr>
      <tr><td style="font-size:24px;font-weight:800;padding-top:6px">${esc(tripName)}</td></tr>
      <tr><td style="font-size:15px;font-weight:600;color:#6B5B52;padding-top:8px"><b>${esc(inviterName)}</b> invited you to join this trip on tripwala.</td></tr>
      <tr><td style="padding-top:20px">
        <a href="${esc(inviteUrl)}" style="display:inline-block;background:#FF7A59;color:#fff;font-weight:700;font-size:16px;text-decoration:none;padding:13px 26px;border-radius:999px">Join the trip →</a>
      </td></tr>
      <tr><td style="font-size:12px;font-weight:600;color:#9A8B82;padding-top:18px">Or paste this link in your browser:<br><span style="color:#6B5B52">${esc(inviteUrl)}</span></td></tr>
    </table>
    <div style="font-size:12px;font-weight:700;color:#9A8B82;padding-top:14px">tripwala — one link, everyone's in.</div>
  </td></tr></table>
</body></html>`;

  await transport().sendMail({ from, to, subject, text, html });
}
