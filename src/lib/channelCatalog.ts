import curated from '@/data/channels.json';
import iptv from '@/data/iptv-channels.json';
import blocklist from '@/data/blocklist.json';
import { orderCandidates } from './brokenStreams';

/**
 * Known-broken streams / channels from blocklist.json — filtered out of the
 * catalog so dead IPTV feeds never reach the player or the cards.
 */
const BLOCKED_STREAMS = new Set<string>(
  (blocklist as { streams?: string[] }).streams ?? []
);
const BLOCKED_CHANNEL_IDS = new Set<string>(
  (blocklist as { channelIds?: string[] }).channelIds ?? []
);

const isBlocked = (c: { id: string; streams?: { url: string }[]; stream?: string }) =>
  BLOCKED_CHANNEL_IDS.has(c.id) ||
  [c.stream, ...(c.streams ?? []).map((s) => s.url)].some((u) => u && BLOCKED_STREAMS.has(u));

export interface StreamSource {
  url: string;
  quality?: string;
  label?: string | null;
  /** Needs a referrer / user-agent a browser player cannot set — not universally playable. */
  requiresHeaders?: boolean;
}

export interface Channel {
  id: string;
  name: string;
  logo: string;
  /** Primary stream — kept for backwards compatibility with the existing player. */
  stream: string;
  streams?: StreamSource[];
  category: string;
  language: string;
  country?: string;
  source?: string;
}

const normalize = (c: any): Channel => ({
  id: String(c.id),
  name: String(c.name || c.title || 'Unknown Channel').trim(),
  logo: c.logo || '',
  stream: c.stream || (c.streams?.[0]?.url ?? ''),
  streams: Array.isArray(c.streams) && c.streams.length
    ? c.streams
    : c.stream
      ? [{ url: c.stream, quality: 'AUTO' }]
      : [],
  category: (c.category || 'entertainment').toLowerCase().trim(),
  language: (c.language || 'unknown').trim(),
  country: c.country,
  source: c.source || 'curated',
});

const dedupeStreams = (streams: StreamSource[]): StreamSource[] => {
  const seen = new Set<string>();
  const out: StreamSource[] = [];
  for (const s of streams) {
    if (!s.url || seen.has(s.url)) continue;
    seen.add(s.url);
    out.push(s);
  }
  return out;
};

/**
 * Curated channels always win; IPTV entries only fill gaps. Every valid record
 * from the JSON is kept: same-named IPTV stations are merged into the curated
 * channel as fallback stream candidates (never discarded), and a channel is
 * never dropped just because another channel happens to share a stream URL.
 */
export const allChannels: Channel[] = (() => {
  const list: Channel[] = [];
  const byName = new Map<string, Channel>();

  for (const raw of [...(curated as any[]), ...((iptv as any).channels as any[])]) {
    const ch = normalize(raw);
    const nameKey = ch.name.toLowerCase();
    // Keep every record that has a usable identity — missing logo/streams must
    // NOT discard a channel. Cards render a placeholder logo and an
    // Offline/Unavailable status for stream-less channels instead.
    if (!ch.id || ch.id === 'undefined' || !ch.name) continue;
    // Skip known-broken channels / streams from blocklist.json entirely.
    if (isBlocked(ch)) continue;

    const existing = byName.get(nameKey);
    if (existing) {
      // Same-named station from the gap-fill list: merge its streams in as
      // fallback candidates so no playable URL from the JSON is ever lost.
      existing.streams = dedupeStreams([...(existing.streams ?? []), ...(ch.streams ?? [])]);
      existing.stream = existing.streams[0]?.url ?? existing.stream;
      continue;
    }

    ch.streams = dedupeStreams(ch.streams);
    ch.stream = ch.streams[0]?.url ?? ch.stream;
    byName.set(nameKey, ch);
    list.push(ch);
  }
  return list;
})();

/** Ordered playable URLs for a channel, de-prioritising recently failed streams. */
export const streamCandidates = (channel: Channel): string[] => {
  const usable = (channel.streams ?? [])
    .filter((s) => !s.requiresHeaders && !BLOCKED_STREAMS.has(s.url))
    .map((s) => s.url)
    .filter(Boolean);
  const fallback = usable.length ? usable : (channel.streams ?? []).map((s) => s.url).filter((u) => u && !BLOCKED_STREAMS.has(u));
  const primary = channel.stream ? [channel.stream] : [];
  return orderCandidates(fallback.length ? fallback : primary);
};

export const iptvCatalogMeta = {
  generatedAt: (iptv as any).generatedAt as string,
  source: (iptv as any).source as string,
  notice: (iptv as any).notice as string,
  testRegion: (iptv as any).testRegion as string | null,
};
