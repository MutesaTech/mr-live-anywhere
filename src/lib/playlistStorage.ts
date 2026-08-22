import type { M3UChannel } from './m3u';

export interface Playlist {
  id: string;
  name: string;
  /** Category the playlist was created under (sports / family / movies / …). */
  category: string;
  sourceType: 'public' | 'url' | 'file';
  /** Original source URL (null for uploaded files). */
  sourceUrl: string | null;
  /** Attribution label, e.g. "iptv-org". */
  sourceLabel?: string;
  channels: M3UChannel[];
  createdAt: number;
  updatedAt: number;
}

const DB_NAME = 'beemo-playlists';
const DB_VERSION = 1;
const STORE = 'playlists';
const LS_KEY = 'beemo-playlists-ls';
const LS_MAX_BYTES = 4_000_000; // keep well under the ~5MB localStorage limit

let dbPromise: Promise<IDBDatabase | null> | null = null;

const openDb = (): Promise<IDBDatabase | null> => {
  if (dbPromise) return dbPromise;
  if (typeof indexedDB === 'undefined') {
    dbPromise = Promise.resolve(null);
    return dbPromise;
  }
  dbPromise = new Promise((resolve) => {
    try {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE)) {
          db.createObjectStore(STORE, { keyPath: 'id' });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
  return dbPromise;
};

const runTx = <T>(mode: IDBTransactionMode, fn: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> =>
  openDb().then((db) => {
    if (!db) throw new Error('indexeddb-unavailable');
    return new Promise<T>((resolve, reject) => {
      try {
        const tx = db.transaction(STORE, mode);
        const req = fn(tx.objectStore(STORE));
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      } catch (e) {
        reject(e);
      }
    });
  });

/* ------------------------- localStorage fallback ------------------------- */

const lsLoad = (): Playlist[] => {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? (JSON.parse(raw) as Playlist[]) : [];
  } catch {
    return [];
  }
};

const lsSave = (list: Playlist[]): boolean => {
  try {
    const raw = JSON.stringify(list);
    if (raw.length > LS_MAX_BYTES) return false;
    localStorage.setItem(LS_KEY, raw);
    return true;
  } catch {
    return false;
  }
};

const sortByUpdated = (list: Playlist[]) =>
  [...list].sort((a, b) => b.updatedAt - a.updatedAt);

/* ------------------------------ public API ------------------------------ */

export const getAllPlaylists = async (): Promise<Playlist[]> => {
  try {
    const list = await runTx('readonly', (store) => store.getAll() as IDBRequest<Playlist[]>);
    return sortByUpdated(list);
  } catch {
    return sortByUpdated(lsLoad());
  }
};

export const putPlaylist = async (playlist: Playlist): Promise<void> => {
  try {
    await runTx('readwrite', (store) => store.put(playlist));
    return;
  } catch {
    // Fall back to localStorage — if that fails (too large / full), throw so
    // the caller can surface a friendly message; the app keeps working.
    const list = lsLoad();
    const idx = list.findIndex((p) => p.id === playlist.id);
    if (idx === -1) list.push(playlist);
    else list[idx] = playlist;
    if (!lsSave(list)) throw new Error('storage-unavailable');
  }
};

export const deletePlaylist = async (id: string): Promise<void> => {
  try {
    await runTx('readwrite', (store) => store.delete(id));
    return;
  } catch {
    lsSave(lsLoad().filter((p) => p.id !== id));
  }
};
