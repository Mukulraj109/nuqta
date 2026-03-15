import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { InteractionManager } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BRAND } from '@/constants/brand';
import { useWalletContext } from '@/contexts/WalletContext';
import { useRegion } from '@/contexts/RegionContext';
import streakApi from '@/services/streakApi';
import leaderboardApi from '@/services/leaderboardApi';
import { challengesApi } from '@/services/challengesApi';
import { achievementApi } from '@/services/achievementApi';
import creatorsApi, { Creator, CreatorPick } from '@/services/creatorsApi';
import gameApi, { AvailableGame } from '@/services/gameApi';
import tournamentApi, { LiveTournament } from '@/services/tournamentApi';
import { formatTimeLeft } from '@/types/playandearn.types';
import gamificationApi, { BonusOpportunity } from '@/services/gamificationApi';
import bonusZoneApi, { BonusZoneCampaign } from '@/services/bonusZoneApi';
import socialImpactApi from '@/services/socialImpactApi';
import specialProgramApi, { ProgramListItem, SpecialProgramSlug } from '@/services/specialProgramApi';
import eventsApiService from '@/services/eventsApi';
import quickActionsApi, { QuickAction } from '@/services/quickActionsApi';
import valueCardsApi, { ValueCard } from '@/services/valueCardsApi';
import apiClient from '@/services/apiClient';
import { colors } from '@/constants/theme';

// ─── Exported types ───

export interface DisplayAchievement {
  id: string;
  title: string;
  icon: string;
  unlocked: boolean;
  coins: number;
  progress?: number;
}

export interface DisplayChallenge {
  id: string;
  title: string;
  progress: number;
  reward: number;
  icon: string;
  timeLeft: string;
  isJoined: boolean;
}

// ─── Exported constants ───

export const GAME_COLORS: [string, string][] = [
  [colors.brand.purple, colors.brand.purpleMedium],
  [colors.brand.pink, '#F472B6'],
  [colors.warningScale[400], colors.warningScale[400]],
  [colors.successScale[400], colors.successScale[400]],
  [colors.infoScale[400], colors.infoScale[400]],
  [colors.error, colors.errorScale[400]],
];

export const IconMap: { [key: string]: keyof typeof Ionicons.glyphMap } = {
  'zap': 'flash',
  'shopping-bag': 'bag',
  'qr-code': 'qr-code',
  'share': 'share-social',
  'star': 'star',
  'users': 'people',
  'calendar': 'calendar',
  'lock': 'lock-closed',
  'heart': 'heart',
  'camera': 'camera',
  'message': 'chatbubble',
  'target': 'locate',
  'award': 'ribbon',
  'flame': 'flame',
  'clock': 'time',
  'chevron-right': 'chevron-forward',
  'check-circle': 'checkmark-circle',
  'sparkles': 'sparkles',
  'store': 'storefront',
  'upload': 'cloud-upload',
  'party': 'happy',
  'graduation': 'school',
  'briefcase': 'briefcase',
  'crown': 'diamond',
  'map-pin': 'location',
  'thumbs-up': 'thumbs-up',
  'video': 'videocam',
  'arrow-right': 'arrow-forward',
  'ticket': 'ticket',
  'gamepad': 'game-controller',
  'trophy': 'trophy',
  'coins': 'cash',
};

// ─── Helpers (not exported, used internally) ───

function getEmojiForChallenge(action?: string): string {
  switch (action) {
    case 'visit_stores': return '\u{1F3EA}';
    case 'upload_bills': return '\u{1F4C4}';
    case 'refer_friends': return '\u{1F465}';
    case 'spend_amount': return '\u{1F4B3}';
    case 'order_count': return '\u{1F6D2}';
    case 'review_count': return '\u2B50';
    case 'login_streak': return '\u{1F525}';
    case 'share_deals': return '\u{1F4E4}';
    default: return '\u{1F3AF}';
  }
}

function getEmojiForAchievement(type?: string): string {
  if (!type) return '\u{1F3C6}';
  if (type.includes('ORDER') || type.includes('PURCHASE')) return '\u{1F3AF}';
  if (type.includes('STREAK')) return '\u{1F525}';
  if (type.includes('SOCIAL') || type.includes('REFERRAL')) return '\u{1F98B}';
  if (type.includes('REVIEW')) return '\u2B50';
  if (type.includes('SPENT')) return '\u{1F4B0}';
  if (type.includes('BILL')) return '\u{1F4F7}';
  return '\u{1F3AA}';
}

// ─── Fallback data ───

function buildFallbackQuickEarnActions(currencySymbol: string): QuickAction[] {
  return [
    {
      _id: 'scan-pay',
      slug: 'scan-pay',
      icon: 'qr-code',
      title: 'Scan & Pay at Store',
      subtitle: `Up to 10% ${BRAND.COIN_NAME}`,
      iconColor: colors.lightMustard,
      deepLinkPath: '/pay-in-store',
      targetAchievementTypes: [],
      priority: 1,
    },
    {
      _id: 'upload-bill',
      slug: 'upload-bill',
      icon: 'cloud-upload',
      title: 'Upload Bill',
      subtitle: `Earn ${currencySymbol}50-${currencySymbol}200 Coins`,
      iconColor: colors.infoScale[400],
      deepLinkPath: '/bill-upload',
      targetAchievementTypes: [],
      priority: 2,
    },
    {
      _id: 'share-offer',
      slug: 'share-offer',
      icon: 'share-social',
      title: 'Share an Offer',
      subtitle: `Earn 20 ${BRAND.COIN_NAME}`,
      iconColor: colors.brand.purpleMedium,
      deepLinkPath: '/referral',
      targetAchievementTypes: [],
      priority: 3,
    },
    {
      _id: 'write-review',
      slug: 'write-review',
      icon: 'star',
      title: 'Write a Review',
      subtitle: 'Earn 25-100 Coins',
      iconColor: colors.warningScale[400],
      deepLinkPath: '/explore/review-earn',
      targetAchievementTypes: [],
      priority: 4,
    },
    {
      _id: 'refer-friend',
      slug: 'refer-friend',
      icon: 'people',
      title: 'Refer a Friend',
      subtitle: 'Earn 100 Coins',
      iconColor: colors.brand.pink,
      deepLinkPath: '/referral',
      targetAchievementTypes: [],
      priority: 5,
    },
    {
      _id: 'daily-checkin',
      slug: 'daily-checkin',
      icon: 'calendar',
      title: 'Daily Check-in',
      subtitle: 'Earn 10-500 Coins',
      iconColor: colors.tealGreen,
      deepLinkPath: '/explore/daily-checkin',
      targetAchievementTypes: [],
      priority: 6,
    },
  ] as QuickAction[];
}

const defaultShoppingMethods = [
  {
    id: 'online-shopping',
    icon: 'bag' as keyof typeof Ionicons.glyphMap,
    title: `Shop Online via ${BRAND.APP_NAME}`,
    description: 'Amazon, Flipkart, Myntra & more',
    reward: 'Up to 8% Cashback',
    extraReward: '+ Branded Coins',
    path: '/cash-store',
  },
  {
    id: 'offline-payment',
    icon: 'storefront' as keyof typeof Ionicons.glyphMap,
    title: 'Pay at Partner Stores',
    description: `Instant ${BRAND.COIN_NAME} on every purchase`,
    reward: 'Always Better Price',
    extraReward: '+ First visit bonus',
    path: '/pay-in-store',
  },
  {
    id: 'lock-price',
    icon: 'lock-closed' as keyof typeof Ionicons.glyphMap,
    title: 'Lock Price Deals',
    description: 'Lock with 10%, earn on both actions',
    reward: 'Double Earnings',
    extraReward: '+ Pickup bonus',
    path: '/lock-deals',
  },
];

export const socialActions = [
  { icon: 'share-social' as keyof typeof Ionicons.glyphMap, title: 'Share Store/Offer', coins: '20-50', description: 'Friends must view', path: '/earn/share' },
  { icon: 'thumbs-up' as keyof typeof Ionicons.glyphMap, title: 'Vote in Polls', coins: '10', description: 'Daily polls available', path: '/earn/polls' },
  { icon: 'chatbubble' as keyof typeof Ionicons.glyphMap, title: 'Comment on Offers', coins: '15', description: 'Quality comments', path: '/earn/offer-comments' },
  { icon: 'camera' as keyof typeof Ionicons.glyphMap, title: 'Upload Photos', coins: '25-100', description: 'Store/product photos', path: '/earn/photo-upload' },
  { icon: 'videocam' as keyof typeof Ionicons.glyphMap, title: 'Create Reels', coins: '50-200', description: 'UGC content rewards', path: '/social/reels' },
  { icon: 'heart' as keyof typeof Ionicons.glyphMap, title: 'Rate Events', coins: '20', description: 'After event attendance', path: '/events' },
];

export const specialPrograms = [
  {
    id: 'student',
    icon: 'school' as keyof typeof Ionicons.glyphMap,
    title: 'Student Zone',
    badge: '\u{1F393}',
    rewards: ['Student of the Month', 'Event participation', 'Campus ambassador'],
    earnings: 'Up to 5,000 coins/month',
    path: '/offers/zones/student',
  },
  {
    id: 'corporate',
    icon: 'briefcase' as keyof typeof Ionicons.glyphMap,
    title: 'Corporate Perks',
    badge: '\u{1F9D1}\u200D\u{1F4BC}',
    rewards: ['Employee of the Month', 'Corporate events', 'Exclusive BNPL'],
    earnings: 'Up to 3,000 coins/month',
    path: '/offers/zones/corporate',
  },
  {
    id: 'prive',
    icon: 'diamond' as keyof typeof Ionicons.glyphMap,
    title: BRAND.PRIVE_NAME,
    badge: '\u{1F451}',
    rewards: ['Premium campaigns', 'High multipliers', 'Brand collaborations'],
    earnings: 'Unlimited potential',
    path: '/prive',
  },
];

// ─── The hook ───

export function usePlayAndEarnData() {
  const router = useRouter();
  const { getCurrencySymbol, state: regionState } = useRegion();
  const currencySymbol = getCurrencySymbol();

  const replaceCurrencySymbol = useCallback((value: string): string => {
    if (!value) return value;
    return value
      .replace(/\u20B9/g, currencySymbol)
      .replace(/AED\s*/g, currencySymbol)
      .replace(/\u062F\.\u0625\s*/g, currencySymbol);
  }, [currencySymbol]);

  const { rezBalance: rezCoins, walletData, brandedCoins: brandedCoinsFromCtx, refreshWallet, savingsInsights } = useWalletContext();
  const totalBrandedCoins = useMemo(() => brandedCoinsFromCtx?.reduce((sum: number, c: any) => sum + (c.amount || 0), 0) || 0, [brandedCoinsFromCtx]);
  const totalPromoCoins = useMemo(() => walletData?.coins?.find(c => c.type === 'promo')?.amount || 0, [walletData?.coins]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [hasCheckedInToday, setHasCheckedInToday] = useState(false);
  const monthlyEarnings = savingsInsights?.thisMonth || 0;
  const fetchingRef = useRef(false);
  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => { isMountedRef.current = false; };
  }, []);

  const [achievements, setAchievements] = useState<DisplayAchievement[]>([]);
  const [challenges, setChallenges] = useState<DisplayChallenge[]>([]);
  const [myRank, setMyRank] = useState<number | null>(null);
  const [featuredCreators, setFeaturedCreators] = useState<Creator[]>([]);
  const [trendingPicks, setTrendingPicks] = useState<CreatorPick[]>([]);
  const [likedPicks, setLikedPicks] = useState<Set<string>>(new Set());
  const [bonusCampaigns, setBonusCampaigns] = useState<BonusZoneCampaign[]>([]);
  const [socialImpactPreview, setSocialImpactPreview] = useState<Array<{ icon: string; label: string; coins: number }>>([]);
  const [allGames, setAllGames] = useState<AvailableGame[]>([]);
  const [tournaments, setTournaments] = useState<LiveTournament[]>([]);
  const [creatorStatus, setCreatorStatus] = useState<'none' | 'pending' | 'approved' | 'rejected'>('none');
  const [apiShoppingMethods, setApiShoppingMethods] = useState<any[] | null>(null);
  const [apiSpecialPrograms, setApiSpecialPrograms] = useState<ProgramListItem[]>([]);
  const [specialProgramsLoaded, setSpecialProgramsLoaded] = useState(false);
  const [selectedProgramSlug, setSelectedProgramSlug] = useState<SpecialProgramSlug | null>(null);
  const [eventCategories, setEventCategories] = useState<any[]>([]);
  const [eventRewardConfig, setEventRewardConfig] = useState<any>(null);
  const [quickActions, setQuickActions] = useState<QuickAction[]>([]);
  const [valueCards, setValueCards] = useState<ValueCard[]>([]);
  const [bonusOpportunities, setBonusOpportunities] = useState<BonusOpportunity[]>([]);
  const [streakBonusMilestones, setStreakBonusMilestones] = useState<{ day: number; coins: number; completed: boolean; special?: boolean }[]>([
    { day: 3, coins: 50, completed: false },
    { day: 7, coins: 200, completed: false },
    { day: 14, coins: 500, completed: false },
    { day: 30, coins: 2000, completed: false, special: true },
    { day: 60, coins: 5000, completed: false, special: true },
    { day: 100, coins: 10000, completed: false, special: true },
  ]);

  // Fetch data from APIs
  const fetchData = useCallback(async (isRefresh = false) => {
    if (fetchingRef.current && !isRefresh) return;
    fetchingRef.current = true;

    try {
      if (!isMountedRef.current) return;
      if (!isRefresh) setLoading(true);

      const [
        ,
        streakResponse,
        unifiedChallengesResponse,
        achievementsResponse,
        leaderboardResponse,
        creatorsResponse,
        trendingPicksResponse,
        bonusResponse,
        gamesResponse,
        tournamentsResponse,
        streakBonusesResponse,
        shoppingMethodsResponse,
        specialProgramsResponse,
        eventCategoriesResponse,
        eventRewardConfigResponse,
      ] = await Promise.all([
        refreshWallet().catch(() => {}),
        streakApi.getStreakStatus('login'),
        challengesApi.getUnifiedChallenges({ limit: 6, visibility: 'play_and_earn' }).catch(() => ({ success: false, data: null })),
        achievementApi.getAchievementProgress(),
        leaderboardApi.getLeaderboard({ type: 'spending', period: 'weekly' }),
        creatorsApi.getFeaturedCreators(4),
        creatorsApi.getTrendingPicks(6),
        bonusZoneApi.getBonusCampaigns(regionState?.currentRegion).catch(() => ({ success: false, data: null })),
        gameApi.getAvailableGames(),
        tournamentApi.getLiveTournaments(5),
        streakApi.getStreakBonuses(),
        apiClient.get('/play-earn/shopping-methods').catch(() => null),
        specialProgramApi.listPrograms().catch(() => ({ success: false })),
        eventsApiService.getCategories(true).catch(() => []),
        eventsApiService.getGlobalRewardConfig().catch(() => null),
      ]);

      if (!isMountedRef.current) return;

      // Fetch shared data via batch endpoint
      apiClient.get<{ quickActions: any[]; valueCards: any[]; shoppingMethods: any[] }>('/play-earn/batch').then(res => {
        if (res.success && res.data) {
          if (res.data.quickActions?.length) setQuickActions(res.data.quickActions);
          if (res.data.valueCards?.length) setValueCards(res.data.valueCards);
        }
      }).catch(() => {
        quickActionsApi.getPersonalized().then(r => { if (r.success && r.data) setQuickActions(r.data); }).catch(() => {});
        valueCardsApi.getAll().then(r => { if (r.success && r.data) setValueCards(r.data); }).catch(() => {});
      });
      gamificationApi.getBonusOpportunities().then(res => {
        if (res.success && res.data?.opportunities) setBonusOpportunities(res.data.opportunities);
      }).catch(() => {});

      // Streak data
      if (streakResponse.success && streakResponse.data) {
        setCurrentStreak(streakResponse.data.current || 0);
        setHasCheckedInToday(!!streakResponse.data.hasCheckedInToday);
      }

      // Challenges
      if (unifiedChallengesResponse.success && unifiedChallengesResponse.data?.challenges) {
        const mappedChallenges: DisplayChallenge[] = unifiedChallengesResponse.data.challenges.map((item: any) => ({
          id: item.challenge._id,
          title: item.challenge.title,
          progress: item.target > 0 ? Math.round((item.progress / item.target) * 100) : 0,
          reward: item.challenge.rewards?.coins || 0,
          icon: getEmojiForChallenge(item.challenge.requirements?.action),
          timeLeft: challengesApi.getTimeRemaining(item.challenge.endDate),
          isJoined: item.userState !== 'available',
        }));
        setChallenges(mappedChallenges);
      }

      // Achievements
      if (achievementsResponse.success && achievementsResponse.data?.achievements) {
        const mappedAchievements = achievementsResponse.data.achievements.slice(0, 4).map((a: any) => ({
          id: a.id,
          title: a.title,
          icon: getEmojiForAchievement(a.type),
          unlocked: a.unlocked,
          coins: a.targetValue || 100,
          progress: a.unlocked ? 100 : a.progress,
        }));
        setAchievements(mappedAchievements);
      }

      // Leaderboard rank
      if (leaderboardResponse.success && leaderboardResponse.data) {
        setMyRank(leaderboardResponse.data?.myRank?.rank || null);
      }

      // Featured Creators
      if (creatorsResponse.success && creatorsResponse.data?.creators) {
        setFeaturedCreators(creatorsResponse.data.creators);
      }

      // Trending Picks
      if (trendingPicksResponse.success && trendingPicksResponse.data?.picks) {
        setTrendingPicks(trendingPicksResponse.data.picks);
      }

      // Bonus Zone Campaigns
      if (bonusResponse.success && bonusResponse.data?.campaigns) {
        setBonusCampaigns(bonusResponse.data.campaigns);
      }

      // Available Games
      if (gamesResponse.success && gamesResponse.data?.games) {
        setAllGames(gamesResponse.data.games);
      }

      // Live Tournaments
      if (tournamentsResponse.success && tournamentsResponse.data?.tournaments) {
        const liveTournaments = tournamentsResponse.data.tournaments
          .map((t: LiveTournament) => {
            const dateToUse = t.status === 'active' ? t.endDate : t.startDate;
            if (!dateToUse) return t;
            const { formatted } = formatTimeLeft(dateToUse);
            return {
              ...t,
              endsIn: t.status === 'active' ? formatted : t.endsIn,
              startsIn: t.status === 'upcoming' ? formatted : t.startsIn,
            };
          })
          .filter((t: LiveTournament) => {
            if (t.status === 'active' && t.endDate) {
              return formatTimeLeft(t.endDate).formatted !== 'Ended';
            }
            return true;
          });
        setTournaments(liveTournaments);
      }

      // Streak Bonuses
      const bonusesArray = Array.isArray(streakBonusesResponse.data)
        ? streakBonusesResponse.data
        : (streakBonusesResponse.data as any)?.bonuses || [];
      if (streakBonusesResponse.success && bonusesArray.length > 0) {
        const streak = streakResponse?.data?.current || 0;
        const mapped = bonusesArray.map((b: any) => ({
          day: b.days || b.day,
          coins: b.reward || b.coins,
          completed: b.achieved || streak >= (b.days || b.day),
          special: (b.days || b.day) >= 30,
        }));
        setStreakBonusMilestones(mapped);
      }

      // Shopping methods
      if (shoppingMethodsResponse?.data?.shoppingMethods) {
        setApiShoppingMethods(shoppingMethodsResponse.data.shoppingMethods);
      }

      // Special Programs
      if (specialProgramsResponse?.success && specialProgramsResponse?.data) {
        const programs = Array.isArray(specialProgramsResponse.data)
          ? specialProgramsResponse.data
          : [];
        setApiSpecialPrograms(programs);
        setSpecialProgramsLoaded(true);
      }

      // Event categories & reward config
      if (eventCategoriesResponse && eventCategoriesResponse.length > 0) {
        setEventCategories(eventCategoriesResponse);
      }
      if (eventRewardConfigResponse) {
        setEventRewardConfig(eventRewardConfigResponse);
      }

      if (!isMountedRef.current) return;

      // Social Impact preview (non-blocking)
      try {
        const siResponse = await socialImpactApi.getEvents({ eventStatus: 'upcoming', limit: 4 });
        if (siResponse.success && siResponse.data) {
          const events = Array.isArray(siResponse.data) ? siResponse.data : (siResponse.data as any)?.events || [];
          if (events.length > 0) {
            const emojiMap: Record<string, string> = {
              'blood-donation': '\u{1FA78}', 'tree-plantation': '\u{1F333}', 'beach-cleanup': '\u{1F3D6}\uFE0F',
              'digital-literacy': '\u{1F4BB}', 'food-drive': '\u{1F372}', 'health-camp': '\u{1F3E5}',
              'skill-training': '\u{1F393}', 'women-empowerment': '\u{1F469}', 'education': '\u{1F4DA}',
              'environment': '\u{1F30D}',
            };
            setSocialImpactPreview(events.slice(0, 4).map((e: any) => ({
              icon: emojiMap[e.eventType || ''] || '\u2728',
              label: e.name?.length > 18 ? e.name.slice(0, 16) + '...' : e.name || 'Event',
              coins: e.rewards?.rezCoins || 0,
            })));
          }
        }
      } catch {
        // Keep fallback
      }

      // Check creator status (non-blocking)
      try {
        const profileRes = await creatorsApi.getMyCreatorProfile();
        if (profileRes.success && profileRes.data) {
          setCreatorStatus(profileRes.data?.status || 'approved');
        }
      } catch {
        // Not a creator
      }
    } catch {
      // silently handle
    } finally {
      setLoading(false);
      if (isRefresh) setRefreshing(false);
      fetchingRef.current = false;
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Refresh data when navigating back
  const isFirstFocus = useRef(true);
  useFocusEffect(
    useCallback(() => {
      if (isFirstFocus.current) {
        isFirstFocus.current = false;
        return;
      }
      fetchData(true);
    }, [fetchData])
  );

  // Pull to refresh
  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData(true);
  }, [fetchData]);

  // Lazy loading: delay below-fold sections
  const [belowFoldReady, setBelowFoldReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const markReady = () => { if (!cancelled) setBelowFoldReady(true); };

    const timeout = setTimeout(markReady, 500);
    const handle = InteractionManager.runAfterInteractions(markReady);

    return () => {
      cancelled = true;
      clearTimeout(timeout);
      handle.cancel();
    };
  }, []);

  // Live countdown timer for tournaments
  useEffect(() => {
    if (tournaments.length === 0) return;
    const interval = setInterval(() => {
      setTournaments(prev => prev.map(t => {
        const dateToUse = t.status === 'active' ? t.endDate : t.startDate;
        if (!dateToUse) return t;
        const { formatted } = formatTimeLeft(dateToUse);
        return {
          ...t,
          endsIn: t.status === 'active' ? formatted : t.endsIn,
          startsIn: t.status === 'upcoming' ? formatted : t.startsIn,
        };
      }).filter(t => {
        if (t.status === 'active' && t.endDate) {
          const { formatted } = formatTimeLeft(t.endDate);
          return formatted !== 'Ended';
        }
        return true;
      }));
    }, 60000);
    return () => clearInterval(interval);
  }, [tournaments.length]);

  // Computed values
  const fallbackQuickEarnActions = useMemo(() => buildFallbackQuickEarnActions(currencySymbol), [currencySymbol]);
  const resolvedQuickActions = quickActions.length > 0 ? quickActions : fallbackQuickEarnActions;

  const shoppingMethods = apiShoppingMethods
    ? apiShoppingMethods.map(m => ({
        ...m,
        icon: (m.icon || 'bag') as keyof typeof Ionicons.glyphMap,
      }))
    : defaultShoppingMethods;

  // Navigation
  const navigateTo = useCallback((path: string) => {
    router.push(path as any);
  }, [router]);

  // Toggle like on a trending pick with optimistic UI
  const handlePickLike = useCallback(async (pickId: string) => {
    const wasLiked = likedPicks.has(pickId);
    setLikedPicks(prev => {
      const next = new Set(prev);
      if (wasLiked) next.delete(pickId);
      else next.add(pickId);
      return next;
    });
    const response = await creatorsApi.togglePickLike(pickId);
    if (!response.success) {
      setLikedPicks(prev => {
        const next = new Set(prev);
        if (wasLiked) next.add(pickId);
        else next.delete(pickId);
        return next;
      });
    }
  }, [likedPicks]);

  // Refresh special programs after status change
  const refreshSpecialPrograms = useCallback(async () => {
    try {
      const resp = await specialProgramApi.listPrograms();
      if (resp?.success && resp?.data && Array.isArray(resp.data) && resp.data.length > 0) {
        setApiSpecialPrograms(resp.data);
      }
    } catch {}
  }, []);

  return {
    // Loading state
    loading,
    refreshing,
    handleRefresh,
    belowFoldReady,

    // Wallet data
    rezCoins,
    totalBrandedCoins,
    totalPromoCoins,
    currencySymbol,
    monthlyEarnings,

    // Games
    allGames,

    // Challenges & achievements
    challenges,
    achievements,
    myRank,

    // Creators
    featuredCreators,
    trendingPicks,
    likedPicks,
    creatorStatus,
    handlePickLike,

    // Quick earn
    resolvedQuickActions,

    // Daily streak
    currentStreak,
    hasCheckedInToday,
    streakBonusMilestones,

    // Shopping
    shoppingMethods,

    // Social
    socialActions,
    socialImpactPreview,

    // Special programs
    specialPrograms,
    apiSpecialPrograms,
    specialProgramsLoaded,
    selectedProgramSlug,
    setSelectedProgramSlug,
    refreshSpecialPrograms,

    // Events
    eventCategories,
    eventRewardConfig,

    // Bonus
    bonusCampaigns,
    bonusOpportunities,
    replaceCurrencySymbol,

    // Tournaments
    tournaments,

    // Value cards
    valueCards,

    // Navigation
    navigateTo,
  };
}
