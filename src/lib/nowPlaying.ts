/**
 * Deterministic "now playing" titles for the Home screen.
 *
 * The app has no EPG feed, so titles are derived from each channel's id +
 * category and a 30-minute time slot. That makes them look live (they change
 * over time) while staying stable across renders and for every viewer — no
 * flicker, no randomness, no hard-coded per-render values.
 */

const SLOT_MS = 30 * 60 * 1000;

/** djb2-style string hash — small, fast, deterministic. */
const hash = (input: string): number => {
  let h = 5381;
  for (let i = 0; i < input.length; i++) {
    h = (h * 33) ^ input.charCodeAt(i);
  }
  return Math.abs(h);
};

interface ShowPool {
  [category: string]: string[];
}

const TV_SHOWS: ShowPool = {
  sports: [
    'Premier League Live',
    'Champions League Tonight',
    'Matchday Live',
    'Grand Prix Qualifying',
    'Boxing Night Live',
    'NBA Courtside',
    'Rugby Highlights',
  ],
  news: [
    'World News Tonight',
    'The Daily Briefing',
    'Market Watch Live',
    'Global Report',
    'Breaking News Now',
    'Politics Today',
  ],
  entertainment: [
    'The Late Show',
    'Prime Time Special',
    'Celebrity Buzz',
    'The Big Interview',
    'Award Season Live',
  ],
  movies: [
    'Blockbuster Night',
    'Cinema Classics',
    'Action Hour',
    'Family Movie Time',
    'Thriller Premiere',
  ],
  music: ['Top 40 Countdown', 'Live Sessions', 'Retro Hits', 'Urban Vibes', 'Classic Rock Hour'],
  kids: ['Cartoon Club', 'Kids Corner', 'Animated Adventures', 'Junior Science Lab'],
  documentary: ['Wild Planet', 'History Uncovered', 'True Stories', 'Frontline Report'],
  cars: ['Top Gear Live', 'Motor Show', 'Racing Circuit', 'Auto Review'],
  religious: ['Evening Worship', 'Faith Today', 'Sunday Service'],
  'tv shows': ['The Evening Serial', 'Reality Check', 'Soap Hour', 'Comedy Central'],
};

const TV_FALLBACK = ['Live Now', 'On Air Now', 'Prime Time'];

const RADIO_SHOWS: ShowPool = {
  music: [
    'Morning Drive Show',
    'The Hitlist',
    'Urban Grooves',
    'Throwback Thursday',
    'Late Night Mix',
    'Top 40 Countdown',
  ],
  news: ['News Hour', 'The Briefing', 'World Update', 'Morning Headlines'],
  entertainment: ['Celebrity Corner', 'The Entertainment Desk', 'Showbiz Tonight'],
  sport: ['Sportsline', 'Matchday Live', 'The Football Show', 'Sports Breakfast'],
};

const RADIO_FALLBACK = ['The Morning Show', 'Midday Mix', 'Drive Time', 'Evening Session'];

const pick = (pool: string[], seed: string): string => {
  const list = pool.length ? pool : TV_FALLBACK;
  return list[hash(seed) % list.length];
};

/** Show currently "on air" for a TV channel. */
export const tvNowPlaying = (id: string, category: string, now = Date.now()): string => {
  const slot = Math.floor(now / SLOT_MS);
  return pick(TV_SHOWS[category] ?? TV_FALLBACK, `${id}:${slot}`);
};

/** Track/show currently "on air" for a radio station. */
export const radioNowPlaying = (id: string, category: string, now = Date.now()): string => {
  const slot = Math.floor(now / SLOT_MS);
  return pick(RADIO_SHOWS[category] ?? RADIO_FALLBACK, `${id}:${slot}`);
};

const RADIO_HOSTS: ShowPool = {
  music: ['Alex Carter', 'Maya Stone', 'DJ Kai', 'Nadia Brooks', 'Tunde Ade'],
  news: ['James Reed', 'Sofia Mendez', 'Daniel Kim', 'Grace Okafor'],
  entertainment: ['Leo Martins', 'Chloe Bennett', 'Ravi Shah'],
  sport: ['Sam Whitmore', 'Elena Rossi', 'Marcus Cole'],
};

const HOST_FALLBACK = ['Alex Carter', 'Maya Stone', 'Nadia Brooks'];

/** Deterministic host/track presenter for a radio station. */
export const radioHost = (id: string, category: string): string => {
  const pool = RADIO_HOSTS[category] ?? HOST_FALLBACK;
  return pool[hash(id) % pool.length];
};

/** Stable pseudo-progress (24–92%) per channel — used for the Continue Watching bar. */
export const watchProgress = (id: string): number => 24 + (hash(`${id}:progress`) % 69);
