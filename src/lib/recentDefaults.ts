/**
 * Curated channels used to seed "Recently Watched" / "Recently Played Radio"
 * for users with no history yet. Drawn from real channels already in the
 * catalog so the section looks populated and production-ready on first launch.
 *
 * These act purely as the initial populated state — as soon as the user starts
 * watching/playing real content, their actual history replaces them.
 */
export const DEFAULT_TV_CHANNEL_IDS: string[] = ['2', '12', '53', '31', '3'];

export const DEFAULT_RADIO_CHANNEL_IDS: string[] = ['r1', 'r3', 'r12', 'r5', 'r6'];
