import { useCallback, useEffect, useState } from 'react';
import {
  getAllPlaylists,
  putPlaylist,
  deletePlaylist as deletePlaylistStore,
  type Playlist,
} from '@/lib/playlistStorage';
import { parseM3U, looksLikeM3U } from '@/lib/m3u';

export type ImportError =
  | 'invalid-name'
  | 'invalid-url'
  | 'network'
  | 'not-playlist'
  | 'empty'
  | 'storage'
  | 'duplicate';

export type ImportResult =
  | { status: 'ok'; count: number; playlist: Playlist }
  | { status: 'error'; error: ImportError; existing?: Playlist };

const isValidUrl = (url: string): boolean => {
  try {
    const u = new URL(url);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
};

const fetchText = async (url: string): Promise<string> => {
  const controller = new AbortController();
  const t = window.setTimeout(() => controller.abort(), 25_000);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.text();
  } finally {
    window.clearTimeout(t);
  }
};

const buildPlaylist = (
  name: string,
  category: string,
  sourceType: Playlist['sourceType'],
  sourceUrl: string | null,
  sourceLabel: string | undefined,
  channels: Playlist['channels']
): Playlist => {
  const now = Date.now();
  return {
    id: `pl-${now}-${Math.random().toString(36).slice(2, 8)}`,
    name,
    category,
    sourceType,
    sourceUrl,
    sourceLabel,
    channels,
    createdAt: now,
    updatedAt: now,
  };
};

export const usePlaylists = () => {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    getAllPlaylists()
      .then((list) => {
        if (mounted) {
          setPlaylists(list);
          setReady(true);
        }
      })
      .catch(() => {
        if (mounted) setReady(true);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const persist = useCallback(async (playlist: Playlist) => {
    await putPlaylist(playlist);
    setPlaylists((prev) => {
      const idx = prev.findIndex((p) => p.id === playlist.id);
      if (idx === -1) return [playlist, ...prev];
      const next = [...prev];
      next[idx] = playlist;
      return next;
    });
  }, []);

  const importFromUrl = useCallback(
    async (
      name: string,
      url: string,
      category: string,
      source?: { sourceType: 'public' | 'url'; sourceLabel?: string }
    ): Promise<ImportResult> => {
      const trimmedName = name.trim();
      const trimmedUrl = url.trim();
      if (!trimmedName || trimmedName.length > 60) return { status: 'error', error: 'invalid-name' };
      if (!isValidUrl(trimmedUrl)) return { status: 'error', error: 'invalid-url' };

      const existing = playlists.find((p) => p.sourceUrl === trimmedUrl);
      if (existing) return { status: 'error', error: 'duplicate', existing };

      let text: string;
      try {
        text = await fetchText(trimmedUrl);
      } catch {
        return { status: 'error', error: 'network' };
      }
      if (!looksLikeM3U(text)) return { status: 'error', error: 'not-playlist' };

      const channels = parseM3U(text);
      if (channels.length === 0) return { status: 'error', error: 'empty' };

      const playlist = buildPlaylist(
        trimmedName,
        category,
        source?.sourceType ?? 'url',
        trimmedUrl,
        source?.sourceLabel,
        channels
      );
      try {
        await persist(playlist);
      } catch {
        return { status: 'error', error: 'storage' };
      }
      return { status: 'ok', count: channels.length, playlist };
    },
    [playlists, persist]
  );

  const importFromFile = useCallback(
    async (name: string, file: File, category: string): Promise<ImportResult> => {
      const trimmedName = name.trim();
      if (!trimmedName || trimmedName.length > 60) return { status: 'error', error: 'invalid-name' };
      if (!/\.(m3u8?|m3u3)$/i.test(file.name)) return { status: 'error', error: 'not-playlist' };

      let text: string;
      try {
        text = await file.text();
      } catch {
        return { status: 'error', error: 'network' };
      }
      if (!looksLikeM3U(text)) return { status: 'error', error: 'not-playlist' };

      const channels = parseM3U(text);
      if (channels.length === 0) return { status: 'error', error: 'empty' };

      const playlist = buildPlaylist(trimmedName, category, 'file', null, undefined, channels);
      try {
        await persist(playlist);
      } catch {
        return { status: 'error', error: 'storage' };
      }
      return { status: 'ok', count: channels.length, playlist };
    },
    [persist]
  );

  /** Refetch a URL-based playlist and update its channels; keeps name/category. */
  const refreshPlaylist = useCallback(
    async (id: string): Promise<{ ok: boolean; count?: number }> => {
      const existing = playlists.find((p) => p.id === id);
      if (!existing || !existing.sourceUrl) return { ok: false };
      try {
        const text = await fetchText(existing.sourceUrl);
        if (!looksLikeM3U(text)) return { ok: false };
        const channels = parseM3U(text);
        if (channels.length === 0) return { ok: false };
        await persist({ ...existing, channels, updatedAt: Date.now() });
        return { ok: true, count: channels.length };
      } catch {
        return { ok: false };
      }
    },
    [playlists, persist]
  );

  const deletePlaylist = useCallback(async (id: string) => {
    try {
      await deletePlaylistStore(id);
    } catch {
      // best-effort — remove from local state regardless
    }
    setPlaylists((prev) => prev.filter((p) => p.id !== id));
  }, []);

  return { playlists, ready, importFromUrl, importFromFile, refreshPlaylist, deletePlaylist };
};
