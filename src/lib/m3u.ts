export interface M3UChannel {
  name: string;
  streamUrl: string;
  tvgId?: string;
  tvgName?: string;
  tvgLogo?: string;
  groupTitle?: string;
  language?: string;
}

/**
 * Robust M3U/M3U8 playlist parser.
 *
 * Supports `#EXTM3U`, `#EXTINF` (with `tvg-*`, `group-title`, and `language`
 * attributes) and bare stream URLs. No metadata is required — a channel is
 * kept as long as it has a name and a stream URL. Malformed entries are
 * skipped; valid ones continue to be processed.
 */
export const parseM3U = (content: string): M3UChannel[] => {
  const lines = content.split(/\r?\n/);
  const channels: M3UChannel[] = [];
  let pending: Partial<M3UChannel> | null = null;

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;

    if (line.startsWith('#EXTM3U')) continue;

    if (line.startsWith('#EXTINF')) {
      const attrs: Record<string, string> = {};
      const attrRe = /([\w-]+)="([^"]*)"/g;
      let m: RegExpExecArray | null;
      while ((m = attrRe.exec(line)) !== null) {
        if (m[1] && m[2] !== undefined) attrs[m[1].toLowerCase()] = m[2];
      }
      const commaIdx = line.lastIndexOf(',');
      const displayName = commaIdx !== -1 ? line.slice(commaIdx + 1).trim() : '';
      pending = {
        name: displayName || attrs['tvg-name'] || 'Untitled',
        tvgId: attrs['tvg-id'] || undefined,
        tvgName: attrs['tvg-name'] || undefined,
        tvgLogo: attrs['tvg-logo'] || undefined,
        groupTitle: attrs['group-title'] || undefined,
        language: attrs['language'] || attrs['tvg-language'] || undefined,
      };
      continue;
    }

    if (line.startsWith('#')) continue; // other metadata / comments

    // A URL line — attach to the pending entry (if any) and keep the channel.
    if (pending) {
      const p = pending;
      channels.push({
        name: p.name || 'Untitled',
        streamUrl: line,
        ...(p.tvgId ? { tvgId: p.tvgId } : {}),
        ...(p.tvgName ? { tvgName: p.tvgName } : {}),
        ...(p.tvgLogo ? { tvgLogo: p.tvgLogo } : {}),
        ...(p.groupTitle ? { groupTitle: p.groupTitle } : {}),
        ...(p.language ? { language: p.language } : {}),
      });
      pending = null;
    }
  }

  return channels;
};

/** Quick sanity check — must look like an M3U playlist. */
export const looksLikeM3U = (content: string): boolean =>
  /#EXTM3U|#EXTINF/i.test(content.slice(0, 4096));
