'use client';

import { useTheme as useNextTheme } from 'next-themes';
import { useEffect, useState } from 'react';

/**
 * Enhanced useTheme hook with hospital PMS specific features
 */
export function useTheme() {
  const { theme, setTheme, systemTheme, themes } = useNextTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Get the actual theme (resolving 'system' to actual theme)
  const resolvedTheme = theme === 'system' ? systemTheme : theme;

  // Check if dark mode is active
  const isDark = resolvedTheme === 'dark';

  // Toggle between light and dark
  const toggleTheme = () => {
    setTheme(isDark ? 'light' : 'dark');
  };

  // Cycle through all available themes
  const cycleTheme = () => {
    const currentIndex = themes.indexOf(theme || 'system');
    const nextIndex = (currentIndex + 1) % themes.length;
    setTheme(themes[nextIndex]);
  };

  return {
    theme: mounted ? theme : undefined,
    setTheme,
    resolvedTheme: mounted ? resolvedTheme : undefined,
    isDark: mounted ? isDark : false,
    toggleTheme,
    cycleTheme,
    themes,
    mounted,
  };
}