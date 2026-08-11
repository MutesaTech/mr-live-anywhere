/**
 * Temporary runtime cache of stream URLs that failed to play on this device.
 * Failures expire — a stream is never permanently blacklisted client-side.
 */
const KEY = 'brokenStreams';
const TTL_MS = 6 * 60 * 60 * 1000; // 6 hours

type BrokenMap = Record<string, { failedAt: number }>;

const read = (): BrokenMap => {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as BrokenMap;
    const now = Date.now();
    const fresh: BrokenMap = {};
    for (const [url, entry] of Object.entries(parsed)) {
      if (entry && now - entry.failedAt < TTL_MS) fresh[url] = entry;
    }
    return fresh;
  } catch {
    return {};
  }
};

const write = (map: BrokenMap) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(map));
  } catch {
    /* storage full or unavailable — non-fatal */
  }
};

export const markStreamBroken = (url: string) => {
  const map = read();
  map[url] = { failedAt: Date.now() };
  write(map);
};

export const isStreamBroken = (url: string) => Boolean(read()[url]);

export const clearBrokenStream = (url: string) => {
  const map = read();
  delete map[url];
  write(map);
};

/** Playable candidates first: unknown-good before recently-failed, never empty. */
export const orderCandidates = (urls: string[]) => {
  const unique = [...new Set(urls.filter((u) => /^https?:\/\//i.test(u)))];
  const good = unique.filter((u) => !isStreamBroken(u));
  const bad = unique.filter((u) => isStreamBroken(u));
  return [...good, ...bad];
};
