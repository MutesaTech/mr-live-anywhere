import { useMemo, useState } from 'react';
import {
  ArrowLeft,
  Check,
  ChevronDown,
  Clipboard,
  FolderOpen,
  Info,
  Link2,
  Loader2,
  Play,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  Trash2,
  Tv,
  Upload,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePlaylists, type ImportError } from '@/hooks/usePlaylists';
import {
  PUBLIC_PLAYLISTS,
  PUBLIC_SOURCE_NAME,
  PUBLIC_SOURCE_NOTICE,
} from '@/lib/publicPlaylists';
import type { Playlist } from '@/lib/playlistStorage';
import LazyImage from './LazyImage';
import CategoryIcon3D from './CategoryIcon3D';

export type PlaylistCategory = 'sports' | 'family' | 'movies';

export interface PlaylistChannelPlayable {
  id: string;
  name: string;
  logo: string;
  stream: string;
  category: string;
  language: string;
}

interface PlaylistsPageProps {
  /** Category that was tapped on Home — used as the default for the Add form. */
  category: PlaylistCategory;
  onBack: () => void;
  onPlayChannel: (channel: PlaylistChannelPlayable) => void;
}

const CATEGORIES: {
  key: PlaylistCategory;
  label: string;
  blurb: string;
}[] = [
  {
    key: 'sports',
    label: 'Sports',
    blurb: 'Create your sports playlist',
  },
  {
    key: 'family',
    label: 'Family',
    blurb: 'Create a playlist for everyone',
  },
  {
    key: 'movies',
    label: 'Movies',
    blurb: 'Build your movie-night playlist',
  },
];

const ERROR_TEXT: Record<ImportError, string> = {
  'invalid-name': 'Please enter a playlist name (max 60 characters).',
  'invalid-url': 'Please enter a valid http(s) playlist URL.',
  network: "Couldn't fetch the playlist. Check your internet connection and try again.",
  'not-playlist': 'That URL or file does not contain a valid M3U playlist.',
  empty: 'No channels found in that playlist.',
  storage: 'Could not save the playlist. Storage is unavailable or full.',
  duplicate: 'This playlist already exists.',
};

const PAGE_SIZE = 60;

/** Map a public playlist's category to its 3D icon slug (family → kids art). */
const iconSlugForCategory = (category: string): string => {
  switch (category) {
    case 'sports':
      return 'sports';
    case 'movies':
      return 'movies';
    case 'family':
      return 'kids';
    case 'entertainment':
      return 'entertainment';
    case 'news':
      return 'news';
    case 'music':
      return 'music';
    case 'rwanda':
    case 'africa':
      return 'international';
    default:
      return 'all';
  }
};

/** Default playlist name, e.g. "Playlist 19:04 15-Aug-2026". */
const defaultName = () => {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `Playlist ${pad(now.getHours())}:${pad(now.getMinutes())} ${now.getDate()}-${months[now.getMonth()]}-${now.getFullYear()}`;
};

const PlaylistsPage = ({ category, onBack, onPlayChannel }: PlaylistsPageProps) => {
  const { playlists, ready, importFromUrl, importFromFile, refreshPlaylist, deletePlaylist } =
    usePlaylists();

  // list / detail navigation
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = selectedId ? (playlists.find((p) => p.id === selectedId) ?? null) : null;

  // add-playlist panel
  const [showAdd, setShowAdd] = useState(false);
  const [addMode, setAddMode] = useState<'url' | 'file'>('url');
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [playlistCategory, setPlaylistCategory] = useState<PlaylistCategory>(category);
  const [importing, setImporting] = useState(false);
  const [importingSource, setImportingSource] = useState<string | null>(null);
  const [refreshingId, setRefreshingId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [openCategories, setOpenCategories] = useState<Record<PlaylistCategory, boolean>>({
    sports: true,
    family: false,
    movies: false,
  });
  const [notice, setNotice] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [duplicate, setDuplicate] = useState<Playlist | null>(null);
  // "Find Playlist URL" — public source picker
  const [pickerOpen, setPickerOpen] = useState(false);

  // detail view state
  const [query, setQuery] = useState('');
  const [group, setGroup] = useState('all');
  const [visible, setVisible] = useState(PAGE_SIZE);

  const myPlaylists = useMemo(
    () => playlists.filter((p) => CATEGORIES.some((c) => c.key === p.category)),
    [playlists]
  );

  const playlistsByCategory = useMemo(() => {
    const map = new Map<PlaylistCategory, Playlist[]>();
    CATEGORIES.forEach((c) => map.set(c.key, []));
    myPlaylists.forEach((p) => {
      const list = map.get(p.category as PlaylistCategory);
      if (list) list.push(p);
    });
    return map;
  }, [myPlaylists]);

  // Public sources — the current category's matching source first, then the rest.
  const publicSources = useMemo(() => {
    return [...PUBLIC_PLAYLISTS].sort((a, b) => {
      const am = a.category === playlistCategory ? 0 : 1;
      const bm = b.category === playlistCategory ? 0 : 1;
      return am - bm || a.name.localeCompare(b.name);
    });
  }, [playlistCategory]);

  const openPlaylist = (id: string) => {
    setSelectedId(id);
    setQuery('');
    setGroup('all');
    setVisible(PAGE_SIZE);
  };

  const openAdd = (cat: PlaylistCategory) => {
    setPlaylistCategory(cat);
    setName(defaultName());
    setUrl('');
    setAddMode('url');
    setNotice(null);
    setDuplicate(null);
    setShowAdd(true);
  };

  const closeAdd = () => {
    setShowAdd(false);
    setName('');
    setUrl('');
    setNotice(null);
  };

  const flash = (type: 'success' | 'error' | 'info', text: string) => setNotice({ type, text });

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) setUrl(text.trim());
    } catch {
      flash('error', 'Could not read the clipboard. Paste the URL manually.');
    }
  };

  const handleImportUrl = async () => {
    if (importing) return;
    setImporting(true);
    setNotice(null);
    setDuplicate(null);
    const res = await importFromUrl(name, url, playlistCategory);
    setImporting(false);
    if (res.status === 'error') {
      if (res.error === 'duplicate' && res.existing) {
        setDuplicate(res.existing);
        flash('info', 'This playlist already exists.');
      } else {
        flash('error', ERROR_TEXT[res.error]);
      }
      return;
    }
    flash('success', `Playlist imported — ${res.count} channels found.`);
    closeAdd();
    openPlaylist(res.playlist.id);
  };

  const handleImportFile = async (file: File) => {
    if (importing || !file) return;
    setImporting(true);
    setNotice(null);
    setDuplicate(null);
    const res = await importFromFile(name, file, playlistCategory);
    setImporting(false);
    if (res.status === 'error') {
      flash('error', ERROR_TEXT[res.error]);
      return;
    }
    flash('success', `Playlist imported — ${res.count} channels found.`);
    closeAdd();
    openPlaylist(res.playlist.id);
  };

  const handleAddPublic = async (sourceId: string) => {
    const source = PUBLIC_PLAYLISTS.find((s) => s.id === sourceId);
    if (!source || importingSource) return;
    setImportingSource(sourceId);
    setNotice(null);
    setDuplicate(null);
    const res = await importFromUrl(source.name, source.url, playlistCategory, {
      sourceType: 'public',
      sourceLabel: PUBLIC_SOURCE_NAME,
    });
    setImportingSource(null);
    if (res.status === 'error') {
      if (res.error === 'duplicate' && res.existing) {
        setDuplicate(res.existing);
        flash('info', 'This playlist already exists.');
      } else {
        flash('error', ERROR_TEXT[res.error]);
      }
      return;
    }
    flash('success', `Playlist imported — ${res.count} channels found.`);
    openPlaylist(res.playlist.id);
  };

  const handleRefresh = async (id: string) => {
    setRefreshingId(id);
    const res = await refreshPlaylist(id);
    setRefreshingId(null);
    if (res.ok) flash('success', `Playlist refreshed — ${res.count} channels.`);
    else flash('error', "Couldn't refresh playlist. Showing the last saved version.");
  };

  const handleUpdateDuplicate = async () => {
    if (!duplicate) return;
    const res = await refreshPlaylist(duplicate.id);
    if (res.ok) flash('success', `Playlist updated — ${res.count} channels.`);
    else flash('error', "Couldn't refresh playlist. Showing the last saved version.");
    openPlaylist(duplicate.id);
    setDuplicate(null);
  };

  const pickPublic = (sourceId: string) => {
    const source = PUBLIC_PLAYLISTS.find((s) => s.id === sourceId);
    if (source) {
      setUrl(source.url);
      setName(source.name);
    }
    setPickerOpen(false);
  };

  /* ------------------------- detail view data ------------------------- */

  const groups = useMemo(() => {
    if (!selected) return [] as string[];
    const set = new Set<string>();
    selected.channels.forEach((c) => {
      if (c.groupTitle && c.groupTitle.trim()) set.add(c.groupTitle.trim());
    });
    return [...set].sort((a, b) => a.localeCompare(b));
  }, [selected]);

  const filteredChannels = useMemo(() => {
    if (!selected) return [];
    const q = query.trim().toLowerCase();
    return selected.channels.filter((c) => {
      if (group !== 'all' && c.groupTitle?.trim() !== group) return false;
      if (!q) return true;
      return (
        c.name.toLowerCase().includes(q) ||
        (c.tvgName || '').toLowerCase().includes(q) ||
        (c.groupTitle || '').toLowerCase().includes(q)
      );
    });
  }, [selected, query, group]);

  const visibleChannels = filteredChannels.slice(0, visible);

  const playChannel = (index: number) => {
    if (!selected) return;
    const ch = filteredChannels[index];
    if (!ch) return;
    onPlayChannel({
      id: `${selected.id}-${index}-${ch.streamUrl.slice(-12)}`,
      name: ch.name,
      logo: ch.tvgLogo || '',
      stream: ch.streamUrl,
      category: selected.category,
      language: ch.language || 'English',
    });
  };

  return (
    <div className="relative flex h-[calc(100dvh-4rem)] flex-col animate-page-enter">
      {/* ===== Top bar — this page owns its header ===== */}
      <div className="shrink-0 border-b border-border/60 bg-card/90 backdrop-blur-xl">
        <div className="h-0.5 w-full bg-gradient-to-r from-primary via-accent to-primary opacity-80" />
        <div className="flex items-center gap-2.5 px-4 py-3">
          <button
            type="button"
            onClick={selected ? () => setSelectedId(null) : onBack}
            aria-label={selected ? 'Back to playlists' : 'Back'}
            title={selected ? 'Back to playlists' : 'Back'}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted/60 hover:bg-muted border border-border/70 text-muted-foreground hover:text-foreground transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="min-w-0 flex-1">
            {selected ? (
              <>
                <h1 className="truncate text-base sm:text-lg font-bold tracking-tight leading-tight">
                  {selected.name}
                </h1>
                <p className="truncate text-[11px] text-muted-foreground">
                  {filteredChannels.length} channels
                  {selected.sourceLabel && ` · Source: ${selected.sourceLabel}`}
                </p>
              </>
            ) : (
              <>
                <h1 className="text-base sm:text-lg font-bold tracking-tight leading-tight">
                  Playlists
                </h1>
                <p className="truncate text-[11px] text-muted-foreground">
                  Import and manage IPTV playlists
                </p>
              </>
            )}
          </div>
          {selected?.sourceUrl && (
            <button
              type="button"
              onClick={() => handleRefresh(selected.id)}
              disabled={refreshingId === selected.id}
              aria-label="Refresh playlist"
              title="Refresh playlist"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted/60 hover:bg-muted border border-border/70 text-muted-foreground hover:text-foreground transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <RefreshCw className={cn('h-4 w-4', refreshingId === selected.id && 'animate-spin')} />
            </button>
          )}
        </div>
      </div>

      {/* ===== Scrollable content ===== */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        {selected ? (
          /* ------------------------- PLAYLIST DETAIL ------------------------- */
          <div className="space-y-4 p-4">
            {/* Local search */}
            <div className="flex h-11 items-center gap-2 rounded-xl border border-border bg-muted/50 px-3 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary">
              <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setVisible(PAGE_SIZE);
                }}
                placeholder="Search channels..."
                className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
              />
            </div>

            {/* Groups — only when the playlist actually has group-title metadata */}
            {groups.length > 0 && (
              <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-4 px-4 pb-0.5">
                {['all', ...groups].map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => {
                      setGroup(g);
                      setVisible(PAGE_SIZE);
                    }}
                    aria-pressed={group === g}
                    className={cn(
                      'shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition-all',
                      group === g
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground hover:text-foreground'
                    )}
                  >
                    {g === 'all' ? 'All Channels' : g}
                  </button>
                ))}
              </div>
            )}

            {/* Channel list — incremental rendering keeps long playlists fast */}
            <div className="flex flex-col gap-2">
              {visibleChannels.map((ch, i) => (
                <button
                  key={`${ch.streamUrl}-${i}`}
                  type="button"
                  onClick={() => playChannel(i)}
                  className="group flex w-full items-center gap-3 rounded-xl border border-border bg-card p-2.5 text-left transition-all hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  {ch.tvgLogo ? (
                    <LazyImage
                      src={ch.tvgLogo}
                      alt={ch.name}
                      className="h-10 w-10 shrink-0 rounded-lg bg-muted"
                    />
                  ) : (
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                      <Tv className="h-4 w-4" />
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-semibold text-foreground">{ch.name}</p>
                    {ch.groupTitle && (
                      <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                        {ch.groupTitle}
                      </p>
                    )}
                  </div>
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/90 text-primary-foreground transition-transform group-hover:scale-105">
                    <Play className="h-3.5 w-3.5 ml-0.5" />
                  </span>
                </button>
              ))}

              {filteredChannels.length === 0 && (
                <div className="rounded-2xl border border-dashed border-border py-12 text-center">
                  <p className="text-sm text-muted-foreground">No channels found</p>
                </div>
              )}

              {visible < filteredChannels.length && (
                <button
                  type="button"
                  onClick={() => setVisible((v) => v + PAGE_SIZE)}
                  className="mx-auto rounded-xl border border-border bg-card px-5 py-2.5 text-xs font-semibold text-foreground transition-colors hover:bg-muted/60"
                >
                  Show more ({filteredChannels.length - visible} remaining)
                </button>
              )}
            </div>
          </div>
        ) : (
          /* ------------------------- PLAYLIST LIST ------------------------- */
          <div className="space-y-6 p-4">
            {/* Notices */}
            {notice && (
              <div
                className={cn(
                  'rounded-xl border px-3.5 py-2.5 text-xs font-medium',
                  notice.type === 'success' && 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
                  notice.type === 'error' && 'border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400',
                  notice.type === 'info' && 'border-border bg-muted text-foreground'
                )}
              >
                {notice.text}
              </div>
            )}

            {/* Duplicate — offer open / update instead of silently duplicating */}
            {duplicate && (
              <div className="rounded-xl border border-border bg-muted px-3.5 py-3">
                <p className="text-xs font-semibold text-foreground">This playlist already exists.</p>
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      openPlaylist(duplicate.id);
                      setDuplicate(null);
                    }}
                    className="rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted"
                  >
                    Open Playlist
                  </button>
                  <button
                    type="button"
                    onClick={handleUpdateDuplicate}
                    className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground"
                  >
                    Update Playlist
                  </button>
                </div>
              </div>
            )}

            {/* ===== All categories — Sports / Family / Movies as dropdowns ===== */}
            {CATEGORIES.map((cat) => {
              const list = playlistsByCategory.get(cat.key) ?? [];
              const isOpen = openCategories[cat.key];
              return (
                <section key={cat.key} className="space-y-2">
                  {/* Dropdown header — dark 3D card, no accent marker */}
                  <div className="flex items-center justify-between rounded-2xl bg-slate-900/80 border border-slate-800/80 shadow-md">
                    <button
                      type="button"
                      onClick={() => setOpenCategories((prev) => ({ ...prev, [cat.key]: !prev[cat.key] }))}
                      aria-expanded={isOpen}
                      className="flex min-w-0 flex-1 items-center gap-3 p-4 text-left transition-colors hover:bg-slate-800/40 rounded-l-2xl"
                    >
                      <div className="min-w-0">
                        <h2 className="text-sm font-semibold text-slate-100">
                          {cat.label} Playlists
                        </h2>
                        <p className="truncate text-xs text-slate-400">
                          {list.length > 0
                            ? `${list.length} playlist${list.length > 1 ? 's' : ''} saved`
                            : 'No playlists yet — add one to get started'}
                        </p>
                      </div>
                    </button>
                    <div className="flex shrink-0 items-center gap-1 pr-3">
                      <button
                        type="button"
                        onClick={() => openAdd(cat.key)}
                        className="inline-flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-medium bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-600 hover:text-white transition-all"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Add
                      </button>
                      <button
                        type="button"
                        onClick={() => setOpenCategories((prev) => ({ ...prev, [cat.key]: !prev[cat.key] }))}
                        aria-label={isOpen ? `Collapse ${cat.label} playlists` : `Expand ${cat.label} playlists`}
                        className="rounded-lg p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                      >
                        <ChevronDown
                          className={cn(
                            'h-4 w-4 transition-transform duration-300',
                            isOpen && 'rotate-180'
                          )}
                        />
                      </button>
                    </div>
                  </div>

                  {!isOpen ? null : !ready ? (
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                      {[0, 1].map((i) => (
                        <div key={i} className="h-24 animate-pulse rounded-2xl bg-muted" />
                      ))}
                    </div>
                  ) : list.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-900/40 p-6 flex flex-col items-center justify-center text-center">
                      <FolderOpen className="mx-auto h-7 w-7 text-slate-500" />
                      <p className="text-xs text-slate-400 mt-2 font-medium">
                        No {cat.label.toLowerCase()} playlists yet. Add one to get started.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                      {list.map((pl) => (
                        <div
                          key={pl.id}
                          role="button"
                          tabIndex={0}
                          onClick={() => openPlaylist(pl.id)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              openPlaylist(pl.id);
                            }
                          }}
                          className="group cursor-pointer rounded-2xl border border-border bg-card p-3.5 transition-all hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <h3 className="truncate text-sm font-bold text-foreground">{pl.name}</h3>
                              <p className="mt-0.5 text-[11px] text-muted-foreground">
                                {pl.channels.length} channels
                              </p>
                            </div>
                            <div
                              className="flex shrink-0 items-center gap-0.5"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {pl.sourceUrl && (
                                <button
                                  type="button"
                                  onClick={() => handleRefresh(pl.id)}
                                  disabled={refreshingId === pl.id}
                                  aria-label="Refresh playlist"
                                  title="Refresh playlist"
                                  className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
                                >
                                  <RefreshCw
                                    className={cn('h-3.5 w-3.5', refreshingId === pl.id && 'animate-spin')}
                                  />
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => {
                                  if (confirmDelete === pl.id) {
                                    deletePlaylist(pl.id);
                                    setConfirmDelete(null);
                                  } else {
                                    setConfirmDelete(pl.id);
                                  }
                                }}
                                aria-label="Delete playlist"
                                title={confirmDelete === pl.id ? 'Confirm delete' : 'Delete playlist'}
                                className={cn(
                                  'flex h-7 w-7 items-center justify-center rounded-lg hover:bg-muted',
                                  confirmDelete === pl.id ? 'text-red-500' : 'text-muted-foreground hover:text-foreground'
                                )}
                              >
                                {confirmDelete === pl.id ? (
                                  <Check className="h-3.5 w-3.5" />
                                ) : (
                                  <Trash2 className="h-3.5 w-3.5" />
                                )}
                              </button>
                            </div>
                          </div>
                          <div className="mt-2.5 flex items-center gap-1.5">
                            <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
                              {pl.sourceType === 'public'
                                ? 'Public Source'
                                : pl.sourceType === 'url'
                                  ? 'From URL'
                                  : 'Uploaded'}
                            </span>
                            {pl.sourceLabel && (
                              <span className="truncate text-[10px] text-muted-foreground/70">
                                Source: {pl.sourceLabel}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              );
            })}

            {/* Popular Public Playlists — real iptv-org endpoints */}
            <section className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-base sm:text-lg font-bold tracking-tight">
                  Popular Public Playlists
                </h2>
                <span
                  title={PUBLIC_SOURCE_NOTICE}
                  aria-label="About public playlists"
                  className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground"
                >
                  <Info className="h-3.5 w-3.5" />
                </span>
              </div>
              <div className="flex flex-col gap-2">
                {publicSources.map((source) => (
                  <div
                    key={source.id}
                    className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 transition-colors hover:bg-muted/40"
                  >
                    {/* 3D category icon — matches the playlist's category */}
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-muted/70">
                      <CategoryIcon3D slug={iconSlugForCategory(source.category)} className="h-8 w-8" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate text-sm font-bold text-foreground">{source.name}</h3>
                      <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                        {source.description} · Source: {PUBLIC_SOURCE_NAME}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleAddPublic(source.id)}
                      disabled={importingSource === source.id}
                      className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground transition-all hover:bg-primary-dark active:scale-95 disabled:opacity-60"
                    >
                      {importingSource === source.id ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          Importing playlist...
                        </>
                      ) : (
                        <>
                          <Plus className="h-3.5 w-3.5" />
                          Add
                        </>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </section>

            {/* Add Playlist — opens the reference-style panel */}
            <button
              type="button"
              onClick={() => openAdd(playlistCategory)}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-card py-4 text-sm font-semibold text-foreground transition-colors hover:bg-muted/50"
            >
              <Plus className="h-4 w-4" />
              Add Playlist
            </button>
          </div>
        )}
      </div>

      {/* ===== Add Playlist panel — reference layout ===== */}
      {showAdd && (
        <div className="absolute inset-0 z-40 flex flex-col bg-background">
          {/* Panel header */}
          <div className="flex shrink-0 items-center gap-3 border-b border-border/60 px-4 py-3.5">
            <button
              type="button"
              onClick={closeAdd}
              aria-label="Close"
              title="Close"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted/60 hover:bg-muted border border-border/70 text-muted-foreground hover:text-foreground transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <X className="h-4 w-4" />
            </button>
            <h2 className="text-base sm:text-lg font-bold tracking-tight">Add your playlist</h2>
          </div>

          {/* Tabs — Import link / Upload file */}
          <div className="flex shrink-0 gap-6 border-b border-border/60 px-5 pt-1">
            {([
              { mode: 'url', label: 'Import link' },
              { mode: 'file', label: 'Upload file' },
            ] as const).map((t) => (
              <button
                key={t.mode}
                type="button"
                onClick={() => setAddMode(t.mode)}
                aria-pressed={addMode === t.mode}
                className={cn(
                  'relative pb-2.5 pt-3 text-sm font-semibold transition-colors',
                  addMode === t.mode ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {t.label}
                <span
                  className={cn(
                    'absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-primary transition-opacity',
                    addMode === t.mode ? 'opacity-100' : 'opacity-0'
                  )}
                />
              </button>
            ))}
          </div>

          {/* Panel body */}
          <div className="flex-1 min-h-0 overflow-y-auto p-5">
            {addMode === 'url' ? (
              <>
                {/* Section: URL */}
                <div>
                  <label htmlFor="pl-url" className="block text-sm font-bold text-foreground">
                    IPTV Playlist URL
                  </label>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Type or paste your playlist URL.
                  </p>
                  <div className="mt-2 flex items-center gap-2 rounded-xl border border-border bg-muted/30 px-3 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary">
                    <input
                      id="pl-url"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      placeholder="https://example.com/playlist.m3u"
                      inputMode="url"
                      className="h-11 w-full min-w-0 flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
                    />
                    <button
                      type="button"
                      onClick={handlePaste}
                      className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-primary/10 px-2.5 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary/15"
                    >
                      <Clipboard className="h-3.5 w-3.5" />
                      Paste
                    </button>
                  </div>
                </div>

                {/* Section: Name */}
                <div className="mt-5">
                  <label htmlFor="pl-name" className="block text-sm font-bold text-foreground">
                    Playlist Name
                  </label>
                  <input
                    id="pl-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    maxLength={60}
                    placeholder="My Playlist"
                    className="mt-2 h-11 w-full rounded-xl border border-border bg-muted/30 px-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                </div>

                {/* Section: Category */}
                <div className="mt-5">
                  <p className="text-sm font-bold text-foreground">Category</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">Which section should this playlist live in?</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {CATEGORIES.map((c) => (
                      <button
                        key={c.key}
                        type="button"
                        onClick={() => setPlaylistCategory(c.key)}
                        aria-pressed={playlistCategory === c.key}
                        className={cn(
                          'rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors',
                          playlistCategory === c.key
                            ? 'border-primary bg-primary text-primary-foreground'
                            : 'border-border bg-card text-muted-foreground hover:text-foreground'
                        )}
                      >
                        {c.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Action buttons */}
                <div className="mt-6 grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => flash('info', 'AI suggestions are coming soon.')}
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-primary/40 bg-card px-3 py-2.5 text-xs font-semibold text-primary transition-colors hover:bg-primary/5"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    Ask AI
                  </button>
                  <button
                    type="button"
                    onClick={() => setPickerOpen(true)}
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-primary/40 bg-card px-3 py-2.5 text-xs font-semibold text-primary transition-colors hover:bg-primary/5"
                  >
                    <Link2 className="h-3.5 w-3.5" />
                    Find Playlist URL
                  </button>
                </div>
              </>
            ) : (
              <>
                {/* File upload */}
                <div>
                  <p className="text-sm font-bold text-foreground">Playlist File</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Choose a .m3u / .m3u3 file from your device.
                  </p>
                  <label className="mt-2 flex h-32 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-muted/30 text-center transition-colors hover:bg-muted/50">
                    <Upload className="h-6 w-6 text-muted-foreground" />
                    <span className="text-xs font-medium text-muted-foreground">
                      Tap to choose a playlist file
                    </span>
                    <input
                      type="file"
                      accept=".m3u,.m3u3,.m3u8"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) void handleImportFile(f);
                      }}
                    />
                  </label>
                </div>

                {/* Section: Name */}
                <div className="mt-5">
                  <label htmlFor="pl-name-file" className="block text-sm font-bold text-foreground">
                    Playlist Name
                  </label>
                  <input
                    id="pl-name-file"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    maxLength={60}
                    placeholder="My Playlist"
                    className="mt-2 h-11 w-full rounded-xl border border-border bg-muted/30 px-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                </div>

                {/* Section: Category */}
                <div className="mt-5">
                  <p className="text-sm font-bold text-foreground">Category</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {CATEGORIES.map((c) => (
                      <button
                        key={c.key}
                        type="button"
                        onClick={() => setPlaylistCategory(c.key)}
                        aria-pressed={playlistCategory === c.key}
                        className={cn(
                          'rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors',
                          playlistCategory === c.key
                            ? 'border-primary bg-primary text-primary-foreground'
                            : 'border-border bg-card text-muted-foreground hover:text-foreground'
                        )}
                      >
                        {c.label}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Notice inside the panel */}
            {notice && (
              <div
                className={cn(
                  'mt-5 rounded-xl border px-3.5 py-2.5 text-xs font-medium',
                  notice.type === 'success' && 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
                  notice.type === 'error' && 'border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400',
                  notice.type === 'info' && 'border-border bg-muted text-foreground'
                )}
              >
                {notice.text}
              </div>
            )}

            {/* Duplicate inside the panel */}
            {duplicate && (
              <div className="mt-5 rounded-xl border border-border bg-muted px-3.5 py-3">
                <p className="text-xs font-semibold text-foreground">This playlist already exists.</p>
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      openPlaylist(duplicate.id);
                      setDuplicate(null);
                      closeAdd();
                    }}
                    className="rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted"
                  >
                    Open Playlist
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      void handleUpdateDuplicate();
                      closeAdd();
                    }}
                    className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground"
                  >
                    Update Playlist
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Bottom CTA — disabled until valid */}
          <div className="shrink-0 border-t border-border/60 p-4 pb-6">
            <button
              type="button"
              onClick={handleImportUrl}
              disabled={
                importing ||
                addMode === 'file' ||
                !name.trim() ||
                (addMode === 'url' && !url.trim())
              }
              className={cn(
                'flex w-full items-center justify-center gap-1.5 rounded-xl px-4 py-3.5 text-sm font-bold transition-all',
                importing || addMode === 'file' || !name.trim() || (addMode === 'url' && !url.trim())
                  ? 'bg-muted text-muted-foreground'
                  : 'bg-primary text-primary-foreground hover:bg-primary-dark active:scale-[0.99]'
              )}
            >
              {importing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Importing...
                </>
              ) : (
                'Add'
              )}
            </button>
          </div>
        </div>
      )}

      {/* ===== Find Playlist URL — public source picker ===== */}
      {pickerOpen && (
        <div
          className="absolute inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center"
          onClick={() => setPickerOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex max-h-[70dvh] w-full flex-col rounded-t-2xl border border-border bg-background sm:max-w-md sm:rounded-2xl"
          >
            <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
              <h3 className="text-sm font-bold">Choose a public playlist</h3>
              <button
                type="button"
                onClick={() => setPickerOpen(false)}
                aria-label="Close"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto p-3">
              <div className="grid grid-cols-1 gap-2">
                {publicSources.map((source) => (
                  <button
                    key={source.id}
                    type="button"
                    onClick={() => pickPublic(source.id)}
                    className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card p-3 text-left transition-colors hover:bg-muted/60"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground">{source.name}</p>
                      <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{source.url}</p>
                    </div>
                    <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {source.category}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlaylistsPage;
