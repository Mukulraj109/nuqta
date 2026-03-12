import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useColorScheme as useSystemColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  colors,
  darkColors,
  gradients,
  darkGradients,
  shadows,
  darkShadows,
  glass,
  darkGlass,
} from '@/constants/theme';

export type ThemeMode = 'system' | 'light' | 'dark';

interface ThemeContextValue {
  themeMode: ThemeMode;
  isDark: boolean;
  colors: typeof colors;
  gradients: typeof gradients;
  shadows: typeof shadows;
  glass: typeof glass;
  setThemeMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
}

const THEME_STORAGE_KEY = '@nuqta_theme_mode';

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useSystemColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(THEME_STORAGE_KEY).then((stored) => {
      if (stored === 'light' || stored === 'dark' || stored === 'system') {
        setThemeModeState(stored);
      }
      setLoaded(true);
    }).catch(() => setLoaded(true));
  }, []);

  const setThemeMode = useCallback((mode: ThemeMode) => {
    setThemeModeState(mode);
    AsyncStorage.setItem(THEME_STORAGE_KEY, mode).catch(() => {});
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeMode(themeMode === 'dark' ? 'light' : themeMode === 'light' ? 'dark' : 'dark');
  }, [themeMode, setThemeMode]);

  const isDark = themeMode === 'system' ? systemScheme === 'dark' : themeMode === 'dark';

  const value = useMemo<ThemeContextValue>(() => ({
    themeMode,
    isDark,
    colors: isDark ? darkColors : colors,
    gradients: isDark ? darkGradients : gradients,
    shadows: isDark ? darkShadows : shadows,
    glass: isDark ? darkGlass : glass,
    setThemeMode,
    toggleTheme,
  }), [themeMode, isDark, setThemeMode, toggleTheme]);

  if (!loaded) return null;

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    // Fallback for components outside the provider (e.g., during tests)
    return {
      themeMode: 'light',
      isDark: false,
      colors,
      gradients,
      shadows,
      glass,
      setThemeMode: () => {},
      toggleTheme: () => {},
    };
  }
  return ctx;
}

export default ThemeContext;
