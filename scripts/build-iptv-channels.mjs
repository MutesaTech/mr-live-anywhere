#!/usr/bin/env node
/**
 * MR LIVE — IPTV catalog builder (build/maintenance script, never runs in the app).
 *
 *   iptv-org API (channels/streams/logos/categories/countries/blocklist)
 *        -> match + enrich  -> dedupe -> blocklist filter -> health check
 *        -> src/data/iptv-channels.json
 *
 * iptv-org is an INDEX of publicly available stream links. This script only
 * references those URLs; it never downloads, rehosts, transcodes, or bypasses
 * DRM / geo-blocking / authentication. Source attribution is kept per channel.
 *
 * Usage:
 *   node scripts/build-iptv-channels.mjs                 # no network health check
 *   node scripts/build-iptv-channels.mjs --check         # HEAD/GET probe each stream
 *   node scripts/build-iptv-channels.mjs --countries=RW,UG,KE,TZ
 */
import { writeFile, readFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const API = 'https://iptv-org.github.io/api';

const args = process.argv.slice(2);
const flag = (name, fallback) => {
  const hit = args.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.split('=')[1] : fallback;
};
const COUNTRIES = flag('countries', 'RW,UG,KE,TZ').split(',').map((c) => c.trim().toUpperCase()).filter(Boolean);
const MAX_PER_COUNTRY = Number(flag('max', '80'));
const DO_CHECK = args.includes('--check');
const TEST_REGION = flag('region', process.env.TEST_REGION || 'unknown');

/** iptv-org category -> MR LIVE category (existing app vocabulary). */
const CATEGORY_MAP = {
  news: 'news', sports: 'sports', music: 'music', movies: 'entertainment',
  series: 'entertainment', entertainment: 'entertainment', general: 'entertainment',
  kids: 'kids', family: 'kids', religious: 'religious', education: 'education',
  documentary: 'documentary', lifestyle: 'entertainment', business: 'news',
  culture: 'entertainment', comedy: 'entertainment', travel: 'entertainment',
};

const getJson = async (url) => {
  const res = await fetch(url, { headers: { 'user-agent': 'mr-live-catalog-builder' } });
  if (!res.ok) throw new Error(`${url} -> ${res.status}`);
  return res.json();
};

const normalizeName = (name = '') =>
  name.replace(/\s+/g, ' ').replace(/\s*\((\d+p|SD|HD|FHD|UHD|4K)\)\s*/gi, ' ').trim();

const qualityOf = (stream) => {
  const q = String(stream.quality || '').toLowerCase();
  if (!q) return 'AUTO';
  const px = parseInt(q, 10);
  if (Number.isFinite(px)) return px >= 1080 ? 'FHD' : px >= 720 ? 'HD' : 'SD';
  return q.toUpperCase();
};

/** Head/GET probe. A pass only means "reachable from the test region right now". */
async function probe(url, timeoutMs = 8000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { method: 'GET', signal: ctrl.signal, headers: { 'user-agent': 'VLC/3.0.20' } });
    if (!res.ok) return false;
    const body = await res.text();
    return /#EXTM3U|#EXT-X-/.test(body) || (res.headers.get('content-type') || '').includes('video');
  } catch {
    return false;
  } finally {
    clearTimeout(t);
  }
}

async function mapLimit(items, limit, fn) {
  const out = new Array(items.length);
  let i = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (i < items.length) {
        const idx = i++;
        out[idx] = await fn(items[idx], idx);
      }
    }),
  );
  return out;
}

async function main() {
  console.log(`Building IPTV catalog for: ${COUNTRIES.join(', ')}`);
  const [channels, streams, logos, orgBlocklist, localBlocklist] = await Promise.all([
    getJson(`${API}/channels.json`),
    getJson(`${API}/streams.json`),
    getJson(`${API}/logos.json`).catch(() => []),
    getJson(`${API}/blocklist.json`).catch(() => []),
    readFile(resolve(ROOT, 'data/blocklist.json'), 'utf8').then(JSON.parse).catch(() => ({ urls: [], channels: [] })),
  ]);

  const blockedChannels = new Set([
    ...orgBlocklist.map((b) => b.channel),
    ...(localBlocklist.channels || []),
  ]);
  const blockedUrls = new Set(localBlocklist.urls || []);

  const logoByChannel = new Map();
  for (const l of logos) if (l.channel && !logoByChannel.has(l.channel)) logoByChannel.set(l.channel, l.url);

  // Group streams by channel id, dedupe URLs.
  const streamsByChannel = new Map();
  const seenUrls = new Set();
  for (const s of streams) {
    if (!s.channel || !s.url) continue;
    if (blockedUrls.has(s.url) || seenUrls.has(s.url)) continue;
    if (!/^https?:\/\//i.test(s.url)) continue;
    seenUrls.add(s.url);
    const list = streamsByChannel.get(s.channel) || [];
    list.push(s);
    streamsByChannel.set(s.channel, list);
  }

  const out = [];
  for (const country of COUNTRIES) {
    const pool = channels.filter(
      (c) => c.country === country && !c.closed && !c.replaced_by && !blockedChannels.has(c.id) && streamsByChannel.has(c.id),
    );
    let added = 0;
    for (const c of pool) {
      if (added >= MAX_PER_COUNTRY) break;
      const raw = streamsByChannel.get(c.id) || [];
      const candidates = raw
        .map((s) => ({
          url: s.url,
          quality: qualityOf(s),
          label: s.label || null,
          feed: s.feed || null,
          // Streams needing custom headers can't be played by a browser HLS player.
          requiresHeaders: Boolean(s.referrer || s.user_agent),
          referrer: s.referrer || null,
          userAgent: s.user_agent || null,
        }))
        // Playable-first ordering: no custom headers, then higher quality.
        .sort((a, b) => Number(a.requiresHeaders) - Number(b.requiresHeaders) ||
          ['FHD', 'HD', 'AUTO', 'SD'].indexOf(a.quality) - ['FHD', 'HD', 'AUTO', 'SD'].indexOf(b.quality));

      const playable = candidates.filter((s) => !s.requiresHeaders);
      if (playable.length === 0) continue; // never emit a channel with no usable stream

      const category = CATEGORY_MAP[(c.categories || [])[0]] || 'entertainment';
      const logo = logoByChannel.get(c.id) || c.logo || null;
      if (!logo) continue;

      out.push({
        id: `iptv-${c.id}`,
        name: normalizeName(c.name),
        logo,
        category,
        language: (c.languages || [])[0] || 'unknown',
        country: c.country,
        categories: c.categories || [],
        source: 'iptv-org',
        // Backwards compatible with the existing single-stream schema.
        stream: playable[0].url,
        streams: candidates,
      });
      added++;
    }
    console.log(`  ${country}: ${added} channels`);
  }

  // Global dedupe by normalized name.
  const byName = new Map();
  for (const ch of out) {
    const key = `${ch.country}:${ch.name.toLowerCase()}`;
    if (!byName.has(key)) byName.set(key, ch);
  }
  let result = [...byName.values()];

  if (DO_CHECK) {
    console.log('Probing streams (results are valid only for the test region)...');
    for (const ch of result) {
      const usable = ch.streams.filter((s) => !s.requiresHeaders);
      const alive = await mapLimit(usable, 8, async (s) => ((await probe(s.url)) ? s : null));
      const ok = alive.filter(Boolean);
      ch.streams = ok.length ? [...ok, ...ch.streams.filter((s) => s.requiresHeaders)] : ch.streams;
      ch.verified = ok.length > 0;
      ch.verifiedRegion = TEST_REGION;
      if (ok.length) ch.stream = ok[0].url;
    }
    result = result.filter((ch) => ch.verified !== false);
  }

  const payload = {
    generatedAt: new Date().toISOString(),
    source: 'https://github.com/iptv-org/api',
    notice: 'Stream URLs are indexed from the public iptv-org project. Availability is not guaranteed and may be geo-restricted.',
    testRegion: DO_CHECK ? TEST_REGION : null,
    countries: COUNTRIES,
    channels: result,
  };

  const target = resolve(ROOT, 'src/data/iptv-channels.json');
  const next = JSON.stringify(payload, null, 2) + '\n';
  const prev = await readFile(target, 'utf8').catch(() => '');
  const strip = (s) => s.replace(/"generatedAt": "[^"]*",\n/, '');
  if (strip(prev) === strip(next)) {
    console.log('No catalog changes — file left untouched.');
    return;
  }
  await writeFile(target, next);
  console.log(`Wrote ${result.length} channels -> src/data/iptv-channels.json`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
