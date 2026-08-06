import channelPlaceholder from '@/assets/channel-placeholder.jpg';

/** Global fallback artwork used whenever a channel/radio image is missing or fails to load. */
export const DEFAULT_MEDIA_IMAGE = channelPlaceholder;

const MIN_VIEWERS = 100_000;
const MAX_VIEWERS = 100_000_000;

/** Clamp an audience number strictly between 100K and 100M. */
export function clampViewers(n: number) {
  if (!Number.isFinite(n)) return MIN_VIEWERS;
  return Math.min(MAX_VIEWERS, Math.max(MIN_VIEWERS, Math.round(n)));
}

/** Format an audience number as compact notation: 250K, 1.5M, 100M. */
export function formatViewers(n: number) {
  const v = clampViewers(n);
  if (v >= 1_000_000) {
    const m = v / 1_000_000;
    return `${m >= 10 ? Math.round(m) : parseFloat(m.toFixed(1))}M`;
  }
  const k = v / 1_000;
  return `${k >= 100 ? Math.round(k) : parseFloat(k.toFixed(1))}K`;
}

/** Random starting audience within the allowed range. */
export function randomViewers() {
  return clampViewers(MIN_VIEWERS + Math.floor(Math.random() * 4_900_000));
}
