import { useCallback, useEffect, useState } from 'react';

/**
 * Light / dark theme management.
 *
 * The theme is persisted in localStorage ('theme' = 'light' | 'dark') and
 * applied by toggling the `dark` class on <html> — the same mechanism the
 * Tailwind `darkMode: ['class']` config expects, so every token-based
 * component adapts automatically.
 *
 * Default is light (the warm white/red palette). Dark mode keeps the
 * original premium dark streaming palette.
 */

export type Theme = 'light' | 'dark';

const THEME_KEY = 'theme';

const getInitialTheme = (): Theme => {
  try {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored === 'light' || stored === 'dark') return stored;
  } catch {
    /* storage unavailable — fall through to default */
  }
  return 'light';
};

export const useTheme = () => {
  const [theme, setThemeState] = useState<Theme>(getInitialTheme);

  // Apply the theme class to <html> whenever it changes.
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', theme === 'dark');
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {
      /* non-fatal */
    }
  }, [theme]);

  const setTheme = useCallback((t: Theme) => setThemeState(t), []);
  const toggleTheme = useCallback(
    () => setThemeState((t) => (t === 'dark' ? 'light' : 'dark')),
    []
  );

  return { theme, setTheme, toggleTheme };
};
