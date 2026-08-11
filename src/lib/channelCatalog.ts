import curated from '@/data/channels.json';
import iptv from '@/data/iptv-channels.json';
import { orderCandidates } from './brokenStreams';

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
  name: String(c.name || '').trim(),
  logo: c.logo,
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

/** Curated channels always win; IPTV entries only fill gaps. Never emits empty streams. */
export const allChannels: Channel[] = (() => {
  const list: Channel[] = [];
  const seenNames = new Set<string>();
  const seenUrls = new Set<string>();

  for (const raw of [...(curated as any[]), ...((iptv as any).channels as any[])]) {
    const ch = normalize(raw);
    const nameKey = ch.name.toLowerCase();
    if (!ch.name || !ch.logo || ch.streams!.length === 0) continue;
    if (seenNames.has(nameKey)) continue;
    ch.streams = ch.streams!.filter((s) => !seenUrls.has(s.url));
    if (ch.streams.length === 0) continue;
    ch.streams.forEach((s) => seenUrls.add(s.url));
    ch.stream = ch.streams[0].url;
    seenNames.add(nameKey);
    list.push(ch);
  }
  return list;
})();

/** Ordered playable URLs for a channel, de-prioritising recently failed streams. */
export const streamCandidates = (channel: Channel): string[] => {
  const usable = (channel.streams ?? []).filter((s) => !s.requiresHeaders).map((s) => s.url);
  const fallback = usable.length ? usable : (channel.streams ?? []).map((s) => s.url);
  return orderCandidates(fallback.length ? fallback : [channel.stream]);
};

export const iptvCatalogMeta = {
  generatedAt: (iptv as any).generatedAt as string,
  source: (iptv as any).source as string,
  notice: (iptv as any).notice as string,
  testRegion: (iptv as any).testRegion as string | null,
};
