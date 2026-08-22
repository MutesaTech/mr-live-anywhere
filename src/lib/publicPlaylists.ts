export interface PublicPlaylistSource {
  id: string;
  name: string;
  /** Category the source is associated with ('all' for the full index). */
  category: string;
  url: string;
  description: string;
  region?: string;
}

/**
 * Real, publicly available playlist endpoints from the iptv-org catalog.
 * These are public sources — the application does not own these streams and
 * only links to the provider's public playlists.
 */
export const PUBLIC_PLAYLISTS: PublicPlaylistSource[] = [
  {
    id: 'public-all',
    name: 'Public Channels',
    category: 'all',
    url: 'https://iptv-org.github.io/iptv/index.m3u',
    description: 'Public IPTV channels',
  },
  {
    id: 'public-sports',
    name: 'Sports',
    category: 'sports',
    url: 'https://iptv-org.github.io/iptv/categories/sports.m3u',
    description: 'Public sports IPTV channels',
  },
  {
    id: 'public-movies',
    name: 'Movies',
    category: 'movies',
    url: 'https://iptv-org.github.io/iptv/categories/movies.m3u',
    description: 'Public movie IPTV channels',
  },
  {
    id: 'public-family',
    name: 'Family',
    category: 'family',
    url: 'https://iptv-org.github.io/iptv/categories/family.m3u',
    description: 'Public family IPTV channels',
  },
  {
    id: 'public-entertainment',
    name: 'Entertainment',
    category: 'entertainment',
    url: 'https://iptv-org.github.io/iptv/categories/entertainment.m3u',
    description: 'Public entertainment IPTV channels',
  },
  {
    id: 'public-news',
    name: 'News',
    category: 'news',
    url: 'https://iptv-org.github.io/iptv/categories/news.m3u',
    description: 'Public news IPTV channels',
  },
  {
    id: 'public-music',
    name: 'Music',
    category: 'music',
    url: 'https://iptv-org.github.io/iptv/categories/music.m3u',
    description: 'Public music IPTV channels',
  },
  {
    id: 'public-rwanda',
    name: 'Rwanda',
    category: 'rwanda',
    url: 'https://iptv-org.github.io/iptv/countries/rw.m3u',
    description: 'Public Rwanda IPTV channels',
    region: 'Africa',
  },
  {
    id: 'public-africa',
    name: 'Africa',
    category: 'africa',
    url: 'https://iptv-org.github.io/iptv/regions/afr.m3u',
    description: 'Public African IPTV channels',
    region: 'Africa',
  },
];

export const PUBLIC_SOURCE_NAME = 'iptv-org';

export const PUBLIC_SOURCE_NOTICE =
  'This playlist contains publicly available IPTV stream links provided by the listed source. Availability may change.';

/** The public source matching a playlist page category (sports/family/movies), if any. */
export const publicSourceForCategory = (category: string): PublicPlaylistSource | undefined =>
  PUBLIC_PLAYLISTS.find((s) => s.category === category);
