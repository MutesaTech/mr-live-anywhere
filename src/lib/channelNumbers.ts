import { allChannels } from './channelCatalog';
import radiosData from '@/data/radios.json';

/**
 * Stable, unique channel numbers.
 *
 * Numbers are derived once at module load from a hash of each channel's id, so
 * they are deterministic (never regenerated on render), stable across reloads,
 * and never collide. TV occupies the 100–599 band and radio the 700–899 band,
 * which keeps every number in the app unique and realistic.
 */

/** FNV-1a string hash → a stable 32-bit number for an id. */
const hashId = (id: string): number => {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
};

/** Assign every id a unique number in [min, max], resolved deterministically. */
const buildNumberMap = (ids: string[], min: number, max: number): Map<string, number> => {
  const used = new Set<number>();
  const map = new Map<string, number>();
  for (const id of [...new Set(ids)].sort()) {
    let n = min + (hashId(id) % (max - min + 1));
    while (used.has(n)) n = n >= max ? min : n + 1;
    used.add(n);
    map.set(id, n);
  }
  return map;
};

const TV_MIN = 100;
const TV_MAX = 599;
const RADIO_MIN = 700;
const RADIO_MAX = 899;

const tvNumbers = buildNumberMap(allChannels.map((c) => c.id), TV_MIN, TV_MAX);
const radioNumbers = buildNumberMap(
  radiosData.map((r) => String(r.id)),
  RADIO_MIN,
  RADIO_MAX
);

/** Stable, unique channel number for a TV channel id. */
export const getTvChannelNumber = (id: string): number =>
  tvNumbers.get(id) ?? TV_MIN + (hashId(id) % (TV_MAX - TV_MIN + 1));

/** Stable, unique channel number for a radio station id. */
export const getRadioChannelNumber = (id: string): number =>
  radioNumbers.get(id) ?? RADIO_MIN + (hashId(id) % (RADIO_MAX - RADIO_MIN + 1));

/** Polished label used across cards: 204 → "CH 204". */
export const formatChannelNumber = (n: number): string => `CH ${n}`;
