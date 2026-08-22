import { useEffect, useMemo, useState } from 'react';
import FeaturedImages from './FeaturedImages';
import TikCleanAdCard from './TikCleanAdCard';
import QuickCategories from './QuickCategories';
import HorizontalRail from './HorizontalRail';
import HomeSkeleton from './HomeSkeleton';
import { ContinueTvCard, ContinueRadioCard } from './ContinueCards';
import { cn } from '@/lib/utils';
import type { HistoryRecord } from '@/hooks/useRecents';
import { DEFAULT_TV_CHANNEL_IDS, DEFAULT_RADIO_CHANNEL_IDS } from '@/lib/recentDefaults';
import { getCategoryTheme, sortCategoryKeys } from '@/lib/categoryThemes';

interface Channel {
  id: string;
  name: string;
  logo: string;
  stream: string;
  category: string;
  language: string;
}

interface Radio {
  id: string;
  name: string;
  logo: string;
  stream: string;
  category: string;
  language: string;
}

interface HomePageProps {
  channels: Channel[];
  radios: Radio[];
  recentTv: HistoryRecord[];
  recentRadio: HistoryRecord[];
  onSelectChannel: (id: string) => void;
  onSelectRadio: (id: string) => void;
  reducedAnimations?: boolean;
  onQuickSelect?: (target: { type: 'section' | 'category'; value: string }) => void;
  /** Opens the full Categories grid page (all categories). */
  onOpenCategories?: () => void;
  /** Opens a playlist page from the Featured promo slides. */
  onOpenCategoryPlaylist?: (category: 'sports' | 'family' | 'movies') => void;
}

/**
 * Resolve which history records to show in a "Continue" rail: real history
 * takes priority, and a curated set fills the rail until the user has history,
 * so the section never appears empty. Stale/broken ids are filtered out.
 */
const resolveHistory = (
  history: HistoryRecord[],
  catalog: { id: string }[],
  defaults: string[]
): HistoryRecord[] => {
  const real = history.filter((r) => catalog.some((item) => item.id === r.id));
  const source = real.length > 0 ? real : defaults.map((id) => ({ id, watchedAt: 0, count: 0 }));
  return source.filter((r) => catalog.some((item) => item.id === r.id)).slice(0, 5);
};

const HomePage = ({
  channels,
  radios,
  recentTv,
  recentRadio,
  onSelectChannel,
  onSelectRadio,
  reducedAnimations = false,
  onQuickSelect,
  onOpenCategories,
  onOpenCategoryPlaylist,
}: HomePageProps) => {
  // Short hydration phase so the skeleton → content transition feels smooth.
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    const t = window.setTimeout(() => setHydrated(true), 400);
    return () => window.clearTimeout(t);
  }, []);

  const continueTv = useMemo(
    () => resolveHistory(recentTv, channels, DEFAULT_TV_CHANNEL_IDS),
    [recentTv, channels]
  );
  const continueRadio = useMemo(
    () => resolveHistory(recentRadio, radios, DEFAULT_RADIO_CHANNEL_IDS),
    [recentRadio, radios]
  );

  const continueTvChannels = useMemo(
    () =>
      continueTv
        .map((rec) => channels.find((c) => c.id === rec.id))
        .filter((c): c is Channel => Boolean(c)),
    [continueTv, channels]
  );

  const continueRadioStations = useMemo(
    () =>
      continueRadio
        .map((rec) => radios.find((r) => r.id === rec.id))
        .filter((r): r is Radio => Boolean(r)),
    [continueRadio, radios]
  );

  // Data-driven category preview: every category that actually contains TV
  // channels, normalized + ordered. New categories appear automatically.
  const homeCategories = useMemo(() => {
    const seen = new Map<string, string>();
    channels.forEach((c) => {
      const key = (c.category || '').trim().toLowerCase();
      if (!key || seen.has(key)) return;
      seen.set(key, getCategoryTheme(key).label);
    });
    return sortCategoryKeys([...seen.keys()]).map((key) => ({ key, label: seen.get(key) ?? key }));
  }, [channels]);

  const animationClass = reducedAnimations ? '' : 'animate-page-enter';

  if (!hydrated) return <HomeSkeleton />;

  return (
    <div className={cn('space-y-8', animationClass)}>
      {/* 1. Featured Images — one large playlist promo slide at a time, auto-rotating showcase at the top */}
      <FeaturedImages onOpenCategoryPlaylist={onOpenCategoryPlaylist} />

      {/* 2. Explore Categories — directly below the featured showcase */}
      {onQuickSelect && (
        <QuickCategories
          categories={homeCategories}
          onSelect={onQuickSelect}
          onSeeMore={onOpenCategories ?? (() => {})}
        />
      )}

      {/* 3. Continue Watching (TV) */}
      <section className="space-y-3">
        <HorizontalRail title="Continue Watching" itemWidthClass="w-[180px] sm:w-[200px] md:w-[230px]">
          {continueTvChannels.map((channel) => (
            <ContinueTvCard
              key={channel.id}
              channel={channel}
              onClick={() => onSelectChannel(channel.id)}
            />
          ))}
        </HorizontalRail>
      </section>

      {/* 4. Continue Listening (Radio) */}
      <section className="space-y-3">
        <HorizontalRail title="Continue Listening" itemWidthClass="w-[240px] sm:w-[260px] md:w-[290px]">
          {continueRadioStations.map((radio) => (
            <ContinueRadioCard
              key={radio.id}
              radio={radio}
              onClick={() => onSelectRadio(radio.id)}
            />
          ))}
        </HorizontalRail>
      </section>

      {/* 5. TikClean promo — compact sponsored banner, replaces the old second Featured section */}
      <section aria-label="TikClean promotion" className="mx-[7px] sm:mx-0">
        <TikCleanAdCard />
      </section>
    </div>
  );
};

export default HomePage;
