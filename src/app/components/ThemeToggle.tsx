'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useRef, useState } from 'react';

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const { setTheme, resolvedTheme, theme } = useTheme();
  const transitionTimeout = useRef<number | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="w-9 h-9 rounded-lg bg-gray-200 dark:bg-dark-elevated animate-pulse" />
    );
  }

  const isDark = resolvedTheme === 'dark';

  const toggleTheme = () => {
    const newTheme = isDark ? 'light' : 'dark';
    console.log('Toggling theme from', theme, 'resolvedTheme:', resolvedTheme, 'to', newTheme);

    // Let every element fade between palettes (see .theme-transition in globals.css),
    // then drop the class so normal hover/focus timings come back.
    const root = document.documentElement;
    root.classList.add('theme-transition');
    if (transitionTimeout.current !== null) {
      window.clearTimeout(transitionTimeout.current);
    }
    transitionTimeout.current = window.setTimeout(() => {
      root.classList.remove('theme-transition');
      transitionTimeout.current = null;
    }, 350);

    setTheme(newTheme);
  };

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-lg bg-gray-100 dark:bg-dark-surface hover:bg-gray-200 dark:hover:bg-dark-elevated transition-colors border border-gray-200 dark:border-dark-border"
      aria-label="Toggle theme"
      type="button"
    >
      {isDark ? (
        <Sun className="h-5 w-5 text-yellow-500" />
      ) : (
        <Moon className="h-5 w-5 text-gray-700 dark:text-dark-secondary" />
      )}
    </button>
  );
}
