import React, { createContext, useContext, useState, useEffect, useLayoutEffect, ReactNode } from 'react';

export type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const THEME_STORAGE_KEY = 'lubpy_theme';

/**
 * Determine initial theme:
 * 1. Check localStorage for persisted user choice ('light' | 'dark')
 * 2. If not present in localStorage, detect user system color scheme preferences using window.matchMedia
 * 3. Default to 'dark' (existing workspace colors)
 */
export function getInitialTheme(): Theme {
  if (typeof window === 'undefined') return 'dark';

  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === 'light' || saved === 'dark') {
      return saved;
    }
  } catch {
    // Continue if localStorage is inaccessible
  }

  // Automatically detect user system color scheme preferences using window.matchMedia
  try {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
      return 'light';
    }
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
  } catch {
    // Continue on matchMedia error
  }

  return 'dark';
}

/**
 * Immediately updates document.documentElement class list, data-theme, and style.colorScheme
 */
export function applyThemeToDocument(theme: Theme) {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;
  if (theme === 'light') {
    root.classList.remove('dark');
    root.classList.add('light');
    root.setAttribute('data-theme', 'light');
    root.style.colorScheme = 'light';
  } else {
    root.classList.remove('light');
    root.classList.add('dark');
    root.setAttribute('data-theme', 'dark');
    root.style.colorScheme = 'dark';
  }
}

// Immediate synchronous execution on module load to guarantee zero delay / no FOUC
if (typeof window !== 'undefined') {
  const initialTheme = getInitialTheme();
  applyThemeToDocument(initialTheme);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => getInitialTheme());

  // Immediately apply theme to document.documentElement on mount and before paint
  useLayoutEffect(() => {
    applyThemeToDocument(theme);
  }, [theme]);

  // Synchronize and listen for system color scheme changes if no value is present in localStorage
  useEffect(() => {
    applyThemeToDocument(theme);

    if (typeof window !== 'undefined' && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: light)');
      const handleSystemThemeChange = (e: MediaQueryListEvent) => {
        try {
          const hasManualPreference = localStorage.getItem(THEME_STORAGE_KEY);
          if (!hasManualPreference) {
            const systemTheme: Theme = e.matches ? 'light' : 'dark';
            setThemeState(systemTheme);
            applyThemeToDocument(systemTheme);
          }
        } catch {
          // Ignore error
        }
      };

      if (mediaQuery.addEventListener) {
        mediaQuery.addEventListener('change', handleSystemThemeChange);
        return () => mediaQuery.removeEventListener('change', handleSystemThemeChange);
      } else if (mediaQuery.addListener) {
        mediaQuery.addListener(handleSystemThemeChange);
        return () => mediaQuery.removeListener(handleSystemThemeChange);
      }
    }
  }, [theme]);

  const toggleTheme = () => {
    setThemeState((prevTheme) => {
      const nextTheme: Theme = prevTheme === 'dark' ? 'light' : 'dark';
      try {
        localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
      } catch {
        // Ignore localStorage error
      }
      applyThemeToDocument(nextTheme);
      return nextTheme;
    });
  };

  const setTheme = (newTheme: Theme) => {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, newTheme);
    } catch {
      // Ignore localStorage error
    }
    applyThemeToDocument(newTheme);
    setThemeState(newTheme);
  };

  const value: ThemeContextType = {
    theme,
    toggleTheme,
    setTheme,
    isDark: theme === 'dark',
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
