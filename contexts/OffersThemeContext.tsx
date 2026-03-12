/**
 * Offers Theme Context
 *
 * Provides theme context for offers pages (Near U / Prive)
 */

import React, { createContext, useContext, useMemo, ReactNode } from 'react';
import {
  OffersTheme,
  OffersThemeMode,
  LightTheme,
  DarkTheme,
  getOffersTheme,
} from '@/constants/OffersTheme';

interface OffersThemeContextValue {
  theme: OffersTheme;
  mode: OffersThemeMode;
  isDark: boolean;
}

const OffersThemeContext = createContext<OffersThemeContextValue | undefined>(undefined);

interface OffersThemeProviderProps {
  children: ReactNode;
  mode: OffersThemeMode;
}

export const OffersThemeProvider: React.FC<OffersThemeProviderProps> = ({
  children,
  mode,
}) => {
  const theme = getOffersTheme(mode);

  const value = useMemo<OffersThemeContextValue>(() => ({
    theme,
    mode,
    isDark: mode === 'dark',
  }), [theme, mode]);

  return (
    <OffersThemeContext.Provider value={value}>
      {children}
    </OffersThemeContext.Provider>
  );
};

export const useOffersTheme = (): OffersThemeContextValue => {
  const context = useContext(OffersThemeContext);
  if (!context) {
    throw new Error('useOffersTheme must be used within an OffersThemeProvider');
  }
  return context;
};

// Convenience exports
export { LightTheme, DarkTheme };
export default OffersThemeContext;
