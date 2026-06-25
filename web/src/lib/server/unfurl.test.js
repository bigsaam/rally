// Unit tests for the SSRF guard's pure, DNS-free core (isBlockedIp). This is the
// security-critical classification — exhaustively checking it here is far more
// valuable (and deterministic) than exercising the network path. Run with
// `pnpm test` (Node's built-in test runner; no extra deps).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isBlockedIp } from './unfurl.js';

test('blocks private / loopback / link-local / CGNAT / reserved IPv4', () => {
  const blocked = [
    '127.0.0.1', // loopback
    '127.255.255.254',
    '10.0.0.1', // private
    '10.255.255.255',
    '172.16.0.5', // private
    '172.31.255.255',
    '192.168.1.1', // private
    '169.254.169.254', // cloud metadata (link-local)
    '100.64.0.1', // CGNAT
    '0.0.0.0', // "this" network
    '255.255.255.255', // broadcast / reserved
    '192.0.2.1', // TEST-NET-1
    '198.18.0.1', // benchmarking
    '198.51.100.7', // TEST-NET-2
    '203.0.113.9', // TEST-NET-3
    '224.0.0.1', // multicast
    '240.0.0.1' // reserved
  ];
  for (const ip of blocked) assert.equal(isBlockedIp(ip), true, `should block ${ip}`);
});

test('blocks loopback / ULA / link-local / multicast / mapped IPv6', () => {
  const blocked = [
    '::1', // loopback
    '::', // unspecified
    'fc00::1', // unique-local
    'fd12:3456:789a::1', // unique-local
    'fe80::1', // link-local
    'ff02::1', // multicast
    '::ffff:127.0.0.1', // IPv4-mapped loopback
    '::ffff:10.0.0.1', // IPv4-mapped private
    '::ffff:169.254.169.254' // IPv4-mapped metadata
  ];
  for (const ip of blocked) assert.equal(isBlockedIp(ip), true, `should block ${ip}`);
});

test('allows public IPv4 and IPv6 addresses', () => {
  const allowed = [
    '8.8.8.8',
    '1.1.1.1',
    '93.184.216.34', // example.com
    '172.15.255.255', // just below the 172.16/12 private block
    '172.32.0.1', // just above the 172.16/12 private block
    '2606:4700:4700::1111', // Cloudflare DNS
    '2001:4860:4860::8888' // Google DNS
  ];
  for (const ip of allowed) assert.equal(isBlockedIp(ip), false, `should allow ${ip}`);
});

test('treats non-IP strings (hostnames, junk) as unsafe', () => {
  for (const s of ['example.com', 'localhost', 'not-an-ip', '', '999.999.999.999', '10.0.0'])
    assert.equal(isBlockedIp(s), true, `should reject ${JSON.stringify(s)}`);
});
