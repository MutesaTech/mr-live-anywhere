import type { HistoryRecord } from '@/hooks/useRecents';
import { getCategoryTheme } from './categoryThemes';

/**
 * Local recommendation engine. Pure and deterministic for a given history, so
 * results are stable across renders and only change when real activity changes.
 * The interface is deliberately small so a future backend recommendation API
 * can replace `buildRecommendations` without touching the UI.
 */

export interface RecommendationRow {
  title: string;
  ids: string[];
}

export interface Recommendations {
  /** "Recommended For You" — TV channel ids, category-affinity driven. */
  recommendedForYou: string[];
  /** "Because You Watched <X>" — contextual TV row, or null when not meaningful. */
  becauseTv: RecommendationRow | null;
  /** "Because You Listened to <X>" — contextual radio row, or null. */
  becauseRadio: RecommendationRow | null;
}

interface CatalogItem {
  id: string;
  name: string;
  category: string;
}

/** Popular channels used to seed recommendations before enough activity exists. */
const TV_POPULAR_IDS = ['1', '36', '44', '26', '12', '20', '55', '60', '40', '15'];

/** Deterministic FNV-1a hash used purely as a stable tie-break. */
const stableHash = (id: string): number => {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
};

const byId = <T extends { id: string }>(items: T[]): Map<string, T> =>
  new Map(items.map((item) => [item.id, item]));

export function buildRecommendations(input: {
  tvHistory: HistoryRecord[];
  radioHistory: HistoryRecord[];
  channels: CatalogItem[];
  radios: CatalogItem[];
  /** Extra ids to never recommend (e.g. channels already shown on Home). */
  excludeIds?: string[];
}): Recommendations {
  const { tvHistory, radioHistory, channels, radios, excludeIds } = input;

  const tvById = byId(channels);
  const radioById = byId(radios);
  const excludeBase = new Set<string>([
    ...tvHistory.map((r) => r.id),
    ...radioHistory.map((r) => r.id),
    ...(excludeIds ?? []),
  ]);

  // Category affinity — weighted by recency (decays over a week) and frequency.
  const now = Date.now();
  const WEEK = 7 * 24 * 3600 * 1000;
  const catScore = new Map<string, number>();
  tvHistory.forEach((rec) => {
    const ch = tvById.get(rec.id);
    if (!ch) return;
    const recency = Math.max(0, 1 - Math.max(0, now - rec.watchedAt) / WEEK);
    const weight = 1 + recency * 3 + Math.min(rec.count, 10);
    catScore.set(ch.category, (catScore.get(ch.category) ?? 0) + weight);
  });

  // --- Because You Watched <X> (from the most recent TV watch) ---
  let becauseTv: RecommendationRow | null = null;
  const tvSourceRec = tvHistory[0];
  if (tvSourceRec) {
    const src = tvById.get(tvSourceRec.id);
    if (src) {
      const related = channels
        .filter((c) => c.category === src.category && c.id !== src.id && !excludeBase.has(c.id))
        .sort(
          (a, b) =>
            (catScore.get(b.category) ?? 0) - (catScore.get(a.category) ?? 0) ||
            stableHash(a.id) - stableHash(b.id)
        )
        .slice(0, 10)
        .map((c) => c.id);
      if (related.length >= 2) {
        const others = channels.filter(
          (c) => c.category === src.category && c.id !== src.id
        ).length;
        const title =
          others >= 5
            ? `Because You Watched ${getCategoryTheme(src.category).label}`
            : `Because You Watched ${src.name}`;
        becauseTv = { title, ids: related };
      }
    }
  }

  // --- Because You Listened to <X> (from the most recent radio play) ---
  let becauseRadio: RecommendationRow | null = null;
  const radioSourceRec = radioHistory[0];
  if (radioSourceRec) {
    const src = radioById.get(radioSourceRec.id);
    if (src) {
      const related = radios
        .filter((r) => r.category === src.category && r.id !== src.id && !excludeBase.has(r.id))
        .sort((a, b) => stableHash(a.id) - stableHash(b.id))
        .slice(0, 6)
        .map((r) => r.id);
      if (related.length >= 2) {
        becauseRadio = { title: `Because You Listened to ${src.name}`, ids: related };
      }
    }
  }

  // Don't repeat channels across recommendation rows.
  const used = new Set(excludeBase);
  becauseTv?.ids.forEach((id) => used.add(id));
  becauseRadio?.ids.forEach((id) => used.add(id));

  // --- Recommended For You ---
  const hasActivity = tvHistory.length > 0 || radioHistory.length > 0;
  const recommendedForYou: string[] = [];

  if (hasActivity) {
    const ranked = channels
      .filter((c) => !used.has(c.id))
      .map((c) => ({ id: c.id, score: catScore.get(c.category) ?? 0 }))
      .sort((a, b) => b.score - a.score || stableHash(a.id) - stableHash(b.id))
      .slice(0, 10)
      .map((c) => c.id);
    recommendedForYou.push(...ranked);
  }

  // Pad with popular channels whenever there isn't enough personalised content.
  if (recommendedForYou.length < 10) {
    for (const id of TV_POPULAR_IDS) {
      if (recommendedForYou.length >= 10) break;
      if (!used.has(id) && !recommendedForYou.includes(id) && tvById.has(id)) {
        recommendedForYou.push(id);
      }
    }
  }

  return { recommendedForYou, becauseTv, becauseRadio };
}
