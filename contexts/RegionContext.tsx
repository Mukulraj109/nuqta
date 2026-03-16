/**
 * Region Context — now backed by Zustand (regionStore).
 *
 * The RegionProvider is no longer needed in the tree. All hooks read from the
 * Zustand store which initializes at module load time and sets apiClient region
 * headers, eventsApi/eventReviewApi/category/homepage currency getters.
 *
 * RegionProvider is kept as a passthrough for backwards compat during migration.
 */
import React, { ReactNode } from 'react';
import {
  useRegionStore,
  getCurrentRegion as _getCurrentRegion,
  setOnRegionChangeCallback as _setOnRegionChangeCallback,
} from '@/stores/regionStore';
import type { RegionId, RegionConfig } from '@/stores/regionStore';

// Re-export types and utilities
export type { RegionId, RegionConfig };
export const getCurrentRegion = _getCurrentRegion;
export const setOnRegionChangeCallback = _setOnRegionChangeCallback;

// ── Context type kept for backwards compat with type imports ──

interface RegionState {
  currentRegion: RegionId;
  regionConfig: RegionConfig | null;
  availableRegions: RegionConfig[];
  isLoading: boolean;
  isDetecting: boolean;
  error: string | null;
  isInitialized: boolean;
}

interface RegionContextType {
  state: RegionState;
  setRegion: (regionId: RegionId, skipCartClear?: boolean) => Promise<void>;
  detectRegion: () => Promise<RegionId>;
  getRegionHeader: () => Record<string, string>;
  clearError: () => void;
  formatPrice: (amount: number) => string;
  getCurrency: () => string;
  getCurrencySymbol: () => string;
  getLocale: () => string;
  // Convenience accessors (used by some consumers)
  currentRegion: RegionId;
  currency: string;
}

/**
 * RegionProvider — now a passthrough. Kept for backwards compatibility.
 */
export function RegionProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

/**
 * Hook to use region — reads from Zustand store.
 * Works with or without RegionProvider in the tree.
 */
export function useRegion(): RegionContextType {
  const store = useRegionStore();
  return store;
}

/**
 * Hook for just the current region (safe version — returns default if store not ready)
 */
export function useCurrentRegion(): RegionId {
  return useRegionStore((s) => s.state.currentRegion);
}

/**
 * Hook for region config
 */
export function useRegionConfig(): RegionConfig | null {
  return useRegionStore((s) => s.state.regionConfig);
}

/**
 * Hook for currency formatting
 */
export function useRegionCurrency() {
  const { formatPrice, getCurrency, getCurrencySymbol } = useRegionStore();
  return { formatPrice, currency: getCurrency(), currencySymbol: getCurrencySymbol() };
}

export default {};
