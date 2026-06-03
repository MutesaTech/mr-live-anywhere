import {
  Trophy,
  Newspaper,
  Music2,
  Baby,
  Film,
  Globe,
  Tv,
  Sparkles,
  Radio,
  MonitorPlay,
  BookOpen,
  Mic2,
  type LucideIcon,
} from 'lucide-react';

export interface CategoryTheme {
  label: string;
  icon: LucideIcon;
  // tailwind gradient classes for the active pill / card
  gradient: string;
  // soft halo/glow color (used in shadows + hover)
  glow: string;
  // motion style when active or hovered
  motion: string;
}

const DEFAULT: CategoryTheme = {
  label: 'All',
  icon: Sparkles,
  gradient: 'from-primary via-primary to-accent',
  glow: 'shadow-[0_0_24px_hsl(217_91%_60%/0.45)]',
  motion: 'hover:scale-[1.04]',
};

const THEMES: Record<string, CategoryTheme> = {
  all:       { ...DEFAULT, label: 'All', icon: Sparkles },
  sports:    { label: 'Sports',    icon: Trophy,      gradient: 'from-orange-500 via-red-500 to-pink-500',     glow: 'shadow-[0_0_28px_hsl(14_90%_55%/0.55)]',  motion: 'hover:scale-[1.06] hover:-translate-y-0.5' },
  news:      { label: 'News',      icon: Newspaper,   gradient: 'from-slate-500 via-slate-700 to-zinc-900',    glow: 'shadow-[0_0_24px_hsl(220_15%_40%/0.45)]', motion: 'hover:scale-[1.02]' },
  music:     { label: 'Music',     icon: Music2,      gradient: 'from-fuchsia-500 via-purple-500 to-indigo-500', glow: 'shadow-[0_0_30px_hsl(290_85%_60%/0.55)] animate-pulse-dot', motion: 'hover:scale-[1.05]' },
  kids:      { label: 'Kids',      icon: Baby,        gradient: 'from-yellow-400 via-lime-400 to-emerald-400', glow: 'shadow-[0_0_26px_hsl(60_90%_55%/0.45)]',  motion: 'hover:rotate-[-2deg] hover:scale-[1.06]' },
  movies:    { label: 'Movies',    icon: Film,        gradient: 'from-amber-400 via-rose-500 to-red-600',      glow: 'shadow-[0_0_28px_hsl(0_85%_55%/0.55)]',   motion: 'hover:scale-[1.04]' },
  international: { label: 'International', icon: Globe, gradient: 'from-cyan-400 via-blue-500 to-indigo-600',   glow: 'shadow-[0_0_28px_hsl(210_90%_60%/0.45)]', motion: 'hover:scale-[1.04]' },
  entertainment: { label: 'Entertainment', icon: Sparkles, gradient: 'from-pink-500 via-rose-400 to-amber-300', glow: 'shadow-[0_0_30px_hsl(330_90%_60%/0.55)]', motion: 'hover:scale-[1.05]' },
  documentary:   { label: 'Documentary',   icon: BookOpen, gradient: 'from-emerald-500 via-teal-500 to-cyan-600', glow: 'shadow-[0_0_24px_hsl(170_80%_45%/0.45)]', motion: 'hover:scale-[1.03]' },
  general:   { label: 'General',   icon: Tv,          gradient: 'from-blue-500 via-indigo-500 to-violet-500',  glow: 'shadow-[0_0_24px_hsl(230_85%_60%/0.45)]', motion: 'hover:scale-[1.04]' },
  religious: { label: 'Religious', icon: BookOpen,    gradient: 'from-amber-300 via-yellow-500 to-orange-600', glow: 'shadow-[0_0_24px_hsl(40_90%_55%/0.45)]',  motion: 'hover:scale-[1.03]' },
  talk:      { label: 'Talk',      icon: Mic2,        gradient: 'from-teal-400 via-cyan-500 to-sky-600',       glow: 'shadow-[0_0_24px_hsl(195_85%_55%/0.45)]', motion: 'hover:scale-[1.04]' },
  radio:     { label: 'Radio',     icon: Radio,       gradient: 'from-rose-400 via-pink-500 to-fuchsia-600',   glow: 'shadow-[0_0_26px_hsl(330_85%_60%/0.45)]', motion: 'hover:scale-[1.04]' },
  live:      { label: 'Live',      icon: MonitorPlay, gradient: 'from-red-500 via-rose-600 to-pink-700',       glow: 'shadow-[0_0_28px_hsl(350_90%_55%/0.55)]', motion: 'hover:scale-[1.05]' },
};

export const getCategoryTheme = (key: string): CategoryTheme => {
  if (!key) return DEFAULT;
  const k = key.toLowerCase().trim();
  return THEMES[k] ?? {
    ...DEFAULT,
    label: key.charAt(0).toUpperCase() + key.slice(1),
  };
};