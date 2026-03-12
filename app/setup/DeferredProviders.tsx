/**
 * DeferredProvider utility and all lazy-loaded context provider wrappers.
 * These providers are loaded after the initial render to speed up app startup.
 *
 * KEY DESIGN: Module-level provider cache prevents cascading remounts.
 *
 * Problem: 14 nested DeferredProviders load at staggered times. When an outer
 * provider loads, it switches from Fragment→Provider, causing React to remount
 * ALL inner providers. Each inner remount resets its delay timer, creating a
 * cascading chain that extends the loading window to ~20+ seconds of repeated
 * unmount/remount cycles — causing visible flickering.
 *
 * Solution: Once a provider component is loaded, it's cached at module scope.
 * When a DeferredProvider remounts (due to an outer provider loading), it
 * reads the cache in useState initializer. If cached, it renders the Provider
 * from the FIRST render — no Fragment→Provider switch, no remount of children,
 * no further cascade. This reduces ~20s of cascading remounts to ~2.5s.
 */
import React from 'react';

// ── Module-level cache: survives remounts from outer DeferredProviders ──
const _providerCache = new Map<string, React.ComponentType<{ children: React.ReactNode }>>();

function DeferredInner({ provider: Provider, children }: {
  provider: React.ComponentType<{ children: React.ReactNode }> | null;
  children: React.ReactNode;
}) {
  if (!Provider) return <>{children}</>;
  return <Provider>{children}</Provider>;
}

function DeferredProvider({
  load,
  children,
  delayMs = 0,
  cacheKey,
}: {
  load: () => Promise<React.ComponentType<{ children: React.ReactNode }>>;
  children: React.ReactNode;
  delayMs?: number;
  cacheKey: string;
}) {
  // Check module-level cache first — if this provider was loaded before an outer
  // provider caused a remount, use it immediately (no Fragment→Provider switch)
  const [Provider, setProvider] = React.useState<React.ComponentType<{ children: React.ReactNode }> | null>(
    () => _providerCache.get(cacheKey) || null
  );

  React.useEffect(() => {
    if (Provider) return; // Already loaded from cache

    let cancelled = false;
    const doLoad = () => {
      load().then(P => {
        if (!cancelled) {
          _providerCache.set(cacheKey, P);
          setProvider(() => P);
        }
      }).catch(() => { /* silently handle */ });
    };

    if (delayMs > 0) {
      const timer = setTimeout(doLoad, delayMs);
      return () => { cancelled = true; clearTimeout(timer); };
    }
    doLoad();
    return () => { cancelled = true; };
  }, []);

  return <DeferredInner provider={Provider}>{children}</DeferredInner>;
}

export const DeferredSocket: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <DeferredProvider cacheKey="socket" load={() => import('@/contexts/SocketContext').then(m => m.SocketProvider)} delayMs={2000}>
    {children}
  </DeferredProvider>
);

export const DeferredNotification: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <DeferredProvider cacheKey="notification" load={() => import('@/contexts/NotificationContext').then(m => m.NotificationProvider)} delayMs={500}>
    {children}
  </DeferredProvider>
);

export const DeferredSecurity: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <DeferredProvider cacheKey="security" load={() => import('@/contexts/SecurityContext').then(m => m.SecurityProvider)} delayMs={2000}>
    {children}
  </DeferredProvider>
);

export const DeferredWallet: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <DeferredProvider cacheKey="wallet" load={() => import('@/contexts/WalletContext').then(m => m.WalletProvider)}>
    {children}
  </DeferredProvider>
);

export const DeferredGamification: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <DeferredProvider cacheKey="gamification" load={() => import('@/contexts/GamificationContext').then(m => m.GamificationProvider)} delayMs={1500}>
    {children}
  </DeferredProvider>
);

export const DeferredWishlist: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <DeferredProvider cacheKey="wishlist" load={() => import('@/contexts/WishlistContext').then(m => m.WishlistProvider)} delayMs={2500}>
    {children}
  </DeferredProvider>
);

export const DeferredProfile: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <DeferredProvider cacheKey="profile" load={() => import('@/contexts/ProfileContext').then(m => m.ProfileProvider)} delayMs={2500}>
    {children}
  </DeferredProvider>
);

export const DeferredGreeting: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <DeferredProvider cacheKey="greeting" load={() => import('@/contexts/GreetingContext').then(m => m.GreetingProvider)} delayMs={1500}>
    {children}
  </DeferredProvider>
);

export const DeferredOffers: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <DeferredProvider cacheKey="offers" load={() => import('@/contexts/OffersContext').then(m => m.OffersProvider)} delayMs={1500}>
    {children}
  </DeferredProvider>
);

export const DeferredAppPreferences: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <DeferredProvider cacheKey="appPrefs" load={() => import('@/contexts/AppPreferencesContext').then(m => m.AppPreferencesProvider)} delayMs={2000}>
    {children}
  </DeferredProvider>
);

export const DeferredSubscription: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <DeferredProvider cacheKey="subscription" load={() => import('@/contexts/SubscriptionContext').then(m => m.SubscriptionProvider)} delayMs={500}>
    {children}
  </DeferredProvider>
);

export const DeferredCategory: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <DeferredProvider cacheKey="category" load={() => import('@/contexts/CategoryContext').then(m => m.CategoryProvider)} delayMs={500}>
    {children}
  </DeferredProvider>
);

export const DeferredRecommendation: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <DeferredProvider cacheKey="recommendation" load={() => import('@/contexts/RecommendationContext').then(m => m.RecommendationProvider)} delayMs={2000}>
    {children}
  </DeferredProvider>
);

export const DeferredCart: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <DeferredProvider cacheKey="cart" load={() => import('@/contexts/CartContext').then(m => m.CartProvider)} delayMs={500}>
    {children}
  </DeferredProvider>
);

export const DeferredOfflineQueue: React.FC<{
  children: React.ReactNode;
  autoSync?: boolean;
  onSyncComplete?: (result: any) => void;
  onSyncError?: (error: Error) => void;
}> = ({ children, autoSync, onSyncComplete, onSyncError }) => {
  // Use module-level cache to survive remounts from outer DeferredProviders
  const [Provider, setProvider] = React.useState<React.ComponentType<any> | null>(
    () => (_providerCache.get('offlineQueue') as React.ComponentType<any>) || null
  );

  React.useEffect(() => {
    if (Provider) return; // Already loaded from cache
    const timer = setTimeout(() => {
      import('@/contexts/OfflineQueueContext')
        .then(m => {
          _providerCache.set('offlineQueue', m.OfflineQueueProvider as any);
          setProvider(() => m.OfflineQueueProvider);
        })
        .catch(() => {});
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  if (!Provider) return <>{children}</>;
  return (
    <Provider autoSync={autoSync} onSyncComplete={onSyncComplete} onSyncError={onSyncError}>
      {children}
    </Provider>
  );
};
