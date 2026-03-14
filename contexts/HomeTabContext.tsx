/**
 * HomeTabContext
 *
 * Provides shared state for the active tab (near-u, mall, cash, prive)
 * Used by BottomNavigation and HomeTabSection components.
 *
 * Tab configurations:
 * - near-u (default): Rewards Near You - local offers, everyday savings
 * - mall: Nuqta Mall - curated brands, premium shopping
 * - cash: Cash Store - cashback focus, money-back deals
 * - prive: Privé - exclusive, reputation-based access (6-pillar system)
 *
 * Features:
 * - AsyncStorage persistence for last used tab
 * - Privé eligibility integration
 * - Backward compatibility with old 3-tab API
 */

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  useMemo,
  ReactNode,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { TabId } from '@/components/homepage/HomeTabSection';

// Storage key
const TAB_STORAGE_KEY = '@rez_active_tab';

// Legacy type alias for backward compatibility
export type HomeTabId = 'rez' | 'rez-mall' | 'cash-store';

// Tab mapping for backward compatibility
const TAB_TO_LEGACY: Record<TabId, HomeTabId> = {
  'near-u': 'rez',
  'mall': 'rez-mall',
  'cash': 'cash-store',
  'prive': 'rez', // Privé defaults to rez for bottom nav
};

const LEGACY_TO_TAB: Record<HomeTabId, TabId> = {
  'rez': 'near-u',
  'rez-mall': 'mall',
  'cash-store': 'cash',
};

// Privé eligibility interface
interface PriveEligibility {
  isEligible: boolean;
  score: number;
  tier: 'none' | 'entry' | 'signature' | 'elite';
  pillars: any[];
  trustScore: number;
  hasSeenGlowThisSession: boolean;
}

const DEFAULT_PRIVE_ELIGIBILITY: PriveEligibility = {
  isEligible: false,
  score: 0,
  tier: 'none',
  pillars: [],
  trustScore: 0,
  hasSeenGlowThisSession: false,
};

interface HomeTabContextType {
  // New 4-tab API
  activeTab: TabId;
  setActiveTab: (tab: TabId) => void;
  isLoaded: boolean;
  isTransitioning: boolean;

  // Privé eligibility
  priveEligibility: PriveEligibility;
  isPriveEligible: boolean;
  refreshPriveEligibility: () => Promise<void>;
  markPriveGlowSeen: () => void;

  // Tab-specific flags (new API)
  isNearUActive: boolean;
  isMallActive: boolean;
  isCashActive: boolean;
  isPriveActive: boolean;

  // Legacy API (backward compatibility)
  activeHomeTab: HomeTabId;
  setActiveHomeTab: (tab: HomeTabId) => void;
  isRezMallActive: boolean;
  isCashStoreActive: boolean;

  // Scroll to top functionality
  scrollToTop: () => void;
  registerScrollToTop: (callback: () => void) => void;
}

const HomeTabContext = createContext<HomeTabContextType | undefined>(undefined);

interface HomeTabProviderProps {
  children: ReactNode;
}

export const HomeTabProvider: React.FC<HomeTabProviderProps> = ({ children }) => {
  // State
  const [activeTab, setActiveTabState] = useState<TabId>('near-u');
  const [isLoaded, setIsLoaded] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [priveEligibility, setPriveEligibility] = useState<PriveEligibility>(DEFAULT_PRIVE_ELIGIBILITY);
  const [hasSeenGlow, setHasSeenGlow] = useState(false);

  // Scroll to top callback ref
  const scrollToTopCallbackRef = React.useRef<(() => void) | null>(null);

  // Load persisted tab on mount — localStorage first on web (sync, instant)
  useEffect(() => {
    const validTabs = ['near-u', 'mall', 'cash', 'prive'];

    // On web, read synchronously from localStorage (avoids async flash)
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
      try {
        const storedTab = window.localStorage.getItem(TAB_STORAGE_KEY);
        if (storedTab && validTabs.includes(storedTab)) {
          setActiveTabState(storedTab as TabId);
        }
      } catch {}
      setIsLoaded(true);
      return;
    }

    // Native: async read from AsyncStorage
    AsyncStorage.getItem(TAB_STORAGE_KEY).then(storedTab => {
      if (storedTab && validTabs.includes(storedTab)) {
        setActiveTabState(storedTab as TabId);
      }
    }).catch(() => {}).finally(() => setIsLoaded(true));
  }, []);

  const transitionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Set active tab with persistence
  const setActiveTab = useCallback(
    async (tab: TabId) => {
      setIsTransitioning(true);
      setActiveTabState(tab);

      // Fire-and-forget: persist tab choice
      try {
        if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem(TAB_STORAGE_KEY, tab);
        }
        AsyncStorage.setItem(TAB_STORAGE_KEY, tab).catch(() => {});
      } catch (_error) {
        // silently handle storage errors
      }

      // End transition after animation duration
      if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current);
      transitionTimerRef.current = setTimeout(() => {
        setIsTransitioning(false);
      }, 250);
    },
    []
  );

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current);
    };
  }, []);

  // Refresh Privé eligibility (placeholder - integrate with backend)
  const refreshPriveEligibility = useCallback(async () => {
    // TODO: Fetch from backend API /api/prive/eligibility
  }, []);

  // Mark Privé glow as seen
  const markPriveGlowSeen = useCallback(() => {
    setHasSeenGlow(true);
    setPriveEligibility(prev => ({
      ...prev,
      hasSeenGlowThisSession: true,
    }));
  }, []);

  // Legacy setter (maps to new API)
  const setActiveHomeTab = useCallback(
    (tab: HomeTabId) => {
      const newTab = LEGACY_TO_TAB[tab] || 'near-u';
      setActiveTab(newTab);
    },
    [setActiveTab]
  );

  // Scroll to top functionality
  const registerScrollToTop = useCallback((callback: () => void) => {
    scrollToTopCallbackRef.current = callback;
  }, []);

  const scrollToTop = useCallback(() => {
    if (scrollToTopCallbackRef.current) {
      scrollToTopCallbackRef.current();
    }
  }, []);

  // Memoize priveEligibility object to avoid new reference each render
  const memoizedPriveEligibility = useMemo(() => ({
    ...priveEligibility,
    hasSeenGlowThisSession: hasSeenGlow,
  }), [priveEligibility, hasSeenGlow]);

  const contextValue: HomeTabContextType = useMemo(() => ({
    // New API
    activeTab,
    setActiveTab,
    isLoaded,
    isTransitioning,

    // Privé
    priveEligibility: memoizedPriveEligibility,
    isPriveEligible: memoizedPriveEligibility.isEligible,
    refreshPriveEligibility,
    markPriveGlowSeen,

    // Tab flags (derived from activeTab — computed inside useMemo to reduce deps)
    isNearUActive: activeTab === 'near-u',
    isMallActive: activeTab === 'mall',
    isCashActive: activeTab === 'cash',
    isPriveActive: activeTab === 'prive',

    // Legacy API (derived from activeTab — computed inside useMemo to reduce deps)
    activeHomeTab: TAB_TO_LEGACY[activeTab],
    setActiveHomeTab,
    isRezMallActive: activeTab === 'mall',
    isCashStoreActive: activeTab === 'cash',

    // Scroll to top
    scrollToTop,
    registerScrollToTop,
  }), [
    activeTab, setActiveTab, isLoaded, isTransitioning,
    memoizedPriveEligibility, refreshPriveEligibility, markPriveGlowSeen,
    setActiveHomeTab, scrollToTop, registerScrollToTop,
  ]);

  return (
    <HomeTabContext.Provider value={contextValue}>
      {children}
    </HomeTabContext.Provider>
  );
};

/**
 * Hook to access tab context
 */
export const useHomeTab = (): HomeTabContextType => {
  const context = useContext(HomeTabContext);
  if (!context) {
    throw new Error('useHomeTab must be used within a HomeTabProvider');
  }
  return context;
};

export default HomeTabContext;
