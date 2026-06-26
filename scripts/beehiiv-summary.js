#!/usr/bin/env node

/*
 * Read-only Beehiiv health check for PaidProperly.
 *
 * Auth order:
 * 1. BEEHIIV_API_KEY env var
 * 2. macOS Keychain service "Beehiiv - Paid Properly API"
 *
 * This intentionally reports aggregate subscriber data only.
 */

const { execFileSync } = require('node:child_process');

const PUBLICATION_ID = process.env.BEEHIIV_PUBLICATION_ID || 'pub_ca5f2aba-b34f-4702-945d-21539c96460a';
const API_BASE = 'https://api.beehiiv.com/v2';
const KEYCHAIN_SERVICE = 'Beehiiv - Paid Properly API';
const KEYCHAIN_ACCOUNT = 'alphaxasset@gmail.com';

function getApiKey() {
  if (process.env.BEEHIIV_API_KEY) return process.env.BEEHIIV_API_KEY;

  try {
    return execFileSync('security', [
      'find-generic-password',
      '-a',
      KEYCHAIN_ACCOUNT,
      '-s',
      KEYCHAIN_SERVICE,
      '-w',
    ], { encoding: 'utf8' }).trim();
  } catch {
    throw new Error(`Missing Beehiiv API key. Set BEEHIIV_API_KEY or store it in Keychain as "${KEYCHAIN_SERVICE}".`);
  }
}

async function beehiiv(path, apiKey) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
  });
  const body = await response.json();
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}: ${JSON.stringify(body)}`);
  }
  return body;
}

function increment(map, key) {
  const cleanKey = key || '(blank)';
  map.set(cleanKey, (map.get(cleanKey) || 0) + 1);
}

function top(map, limit = 10) {
  return [...map.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([key, count]) => ({ key, count }));
}

async function listSubscriptions(apiKey) {
  const subscriptions = [];
  let cursor = '';

  for (let page = 0; page < 100; page += 1) {
    const params = new URLSearchParams({ limit: '100' });
    if (cursor) params.set('cursor', cursor);

    const payload = await beehiiv(`/publications/${PUBLICATION_ID}/subscriptions?${params}`, apiKey);
    subscriptions.push(...(payload.data || []));

    if (!payload.has_more || !payload.next_cursor) break;
    cursor = payload.next_cursor;
  }

  return subscriptions;
}

async function main() {
  const apiKey = getApiKey();
  const [publicationPayload, fieldsPayload, postsPayload, subscriptions] = await Promise.all([
    beehiiv(`/publications/${PUBLICATION_ID}`, apiKey),
    beehiiv(`/publications/${PUBLICATION_ID}/custom_fields?limit=100`, apiKey),
    beehiiv(`/publications/${PUBLICATION_ID}/posts?limit=10`, apiKey),
    listSubscriptions(apiKey),
  ]);

  const byStatus = new Map();
  const bySource = new Map();
  const byChannel = new Map();
  const byReferringHost = new Map();
  const createdTimes = [];

  subscriptions.forEach((subscription) => {
    increment(byStatus, subscription.status);
    increment(bySource, subscription.utm_source);
    increment(byChannel, subscription.utm_channel);

    if (subscription.created) createdTimes.push(subscription.created);

    if (subscription.referring_site) {
      try {
        increment(byReferringHost, new URL(subscription.referring_site).hostname);
      } catch {
        increment(byReferringHost, '(invalid url)');
      }
    } else {
      increment(byReferringHost, '(blank)');
    }
  });

  createdTimes.sort((a, b) => a - b);

  const summary = {
    publication: publicationPayload.data,
    subscriber_count: subscriptions.length,
    subscriber_statuses: Object.fromEntries(byStatus),
    top_sources: top(bySource),
    top_channels: top(byChannel),
    top_referring_hosts: top(byReferringHost),
    first_subscriber_at: createdTimes[0] ? new Date(createdTimes[0] * 1000).toISOString() : null,
    latest_subscriber_at: createdTimes.at(-1) ? new Date(createdTimes.at(-1) * 1000).toISOString() : null,
    post_count_returned: postsPayload.data?.length || 0,
    custom_fields: (fieldsPayload.data || []).map((field) => ({
      display: field.display,
      kind: field.kind,
      id: field.id,
    })),
  };

  console.log(JSON.stringify(summary, null, 2));
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
