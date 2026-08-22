import { useSyncExternalStore } from 'react';

/**
 * Persistent per-channel user overrides (rename / delete / report), stored in
 * localStorage. A tiny pub/sub store keeps every list in sync when a channel is
 * renamed, deleted, or reported — rename/delete propagate app-wide via
 * applyChannelOverrides without replacing the existing static catalog.
 */

export interface ChannelReportEntry {
  reason: string;
  details?: string;
  at: number;
}

const NAMES_KEY = 'beemoChannelNames';
const HIDDEN_KEY = 'beemoHiddenChannels';
const REPORTS_KEY = 'beemoChannelReports';

let names: Record<string, string> = load(NAMES_KEY, {});
let hidden: string[] = load(HIDDEN_KEY, []);
let reports: Record<string, ChannelReportEntry[]> = load(REPORTS_KEY, {});
let version = 0;
const listeners = new Set<() => void>();

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function save(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage full or unavailable — non-fatal */
  }
}

function emit() {
  version += 1;
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

function getSnapshot() {
  return version;
}

/** Re-renders the caller whenever any channel override changes. */
export const useChannelOverridesVersion = () => useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

/** Custom display name for a channel, falling back to the catalog name. */
export const getChannelName = (id: string, fallback: string) => names[id]?.trim() || fallback;

export const isChannelHidden = (id: string) => hidden.includes(id);

export const renameChannel = (id: string, name: string) => {
  names = { ...names, [id]: name.trim() };
  save(NAMES_KEY, names);
  emit();
};

export const deleteChannel = (id: string) => {
  if (hidden.includes(id)) return;
  hidden = [...hidden, id];
  save(HIDDEN_KEY, hidden);
  emit();
};

export const reportChannel = (id: string, reason: string, details?: string) => {
  reports = {
    ...reports,
    [id]: [...(reports[id] ?? []), { reason, details: details?.trim() || undefined, at: Date.now() }],
  };
  save(REPORTS_KEY, reports);
  emit();
};

export const getChannelReports = (id: string): ChannelReportEntry[] => reports[id] ?? [];

/**
 * Filter out deleted channels and apply custom names. Any component that
 * renders the catalog can pass its result straight through — deleted channels
 * disappear everywhere, renames show everywhere.
 */
export const applyChannelOverrides = <T extends { id: string; name: string }>(channels: T[]): T[] =>
  channels
    .filter((c) => !isChannelHidden(c.id))
    .map((c) => ({ ...c, name: getChannelName(c.id, c.name) }));
