import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
  InteractionManager,
  Platform,
} from 'react-native';
import CachedImage from '@/components/ui/CachedImage';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, Stack, useFocusEffect } from 'expo-router';
import LearnMaximiseSection from '../components/earn/LearnMaximiseSection';
import { BRAND } from '@/constants/brand';
const NUQTA_COIN = BRAND.COIN_IMAGE;
import { SkeletonBox, SkeletonCard, SkeletonGameCard } from '@/components/earn/SkeletonLoader';
import { useWalletContext } from '@/contexts/WalletContext';
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
import BonusZoneCard from '@/components/earn/BonusZoneCard';
import socialImpactApi from '@/services/socialImpactApi';
import specialProgramApi, { ProgramListItem } from '@/services/specialProgramApi';
import eventsApiService from '@/services/eventsApi';
import quickActionsApi, { QuickAction } from '@/services/quickActionsApi';
import valueCardsApi, { ValueCard } from '@/services/valueCardsApi';
import { useRegion } from '@/contexts/RegionContext';
import { Colors, Spacing, BorderRadius, Shadows, Typography } from '@/constants/DesignSystem';
import apiClient from '@/services/apiClient';
import { ProgramDetailModal } from '@/components/earn/ProgramDetailModal';
import { SpecialProgramSlug } from '@/services/specialProgramApi';

const { width } = Dimensions.get('window');

// Game card color palette
const GAME_COLORS: [string, string][] = [
  ['#7C3AED', '#A855F7'], // purple
  ['#EC4899', '#F472B6'], // pink
  ['#F59E0B', '#FBBF24'], // amber
  ['#10B981', '#34D399'], // emerald
  ['#3B82F6', '#60A5FA'], // blue
  ['#EF4444', '#F87171'], // red
];

// Icon mapping from lucide-react to Ionicons
const IconMap: { [key: string]: keyof typeof Ionicons.glyphMap } = {
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

// Achievement type for display
interface DisplayAchievement {
  id: string;
  title: string;
  icon: string;
  unlocked: boolean;
  coins: number;
  progress?: number;
}

// Challenge type for display
interface DisplayChallenge {
  id: string;
  title: string;
  progress: number;
  reward: number;
  icon: string;
  timeLeft: string;
  isJoined: boolean;
}

const PlayAndEarn = () => {
  const router = useRouter();
  const { getCurrencySymbol, state: regionState } = useRegion();
  const currencySymbol = getCurrencySymbol();

  // Helper to replace any currency symbol with region-specific one
  const replaceCurrencySymbol = (value: string): string => {
    if (!value) return value;
    return value
      .replace(/₹/g, currencySymbol)
      .replace(/AED\s*/g, currencySymbol)
      .replace(/د\.إ\s*/g, currencySymbol);
  };

  const { rezBalance: rezCoins, walletData, brandedCoins: brandedCoinsFromCtx, refreshWallet, savingsInsights } = useWalletContext();
  const totalBrandedCoins = brandedCoinsFromCtx?.reduce((sum: number, c: any) => sum + (c.amount || 0), 0) || 0;
  const totalPromoCoins = walletData?.coins?.find(c => c.type === 'promo')?.amount || 0;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [hasCheckedInToday, setHasCheckedInToday] = useState(false);
  const monthlyEarnings = savingsInsights?.thisMonth || 0;
  const fetchingRef = React.useRef(false); // Prevent duplicate API calls
  const isMountedRef = useRef(true);

  // Cleanup isMountedRef on unmount
  useEffect(() => {
    return () => { isMountedRef.current = false; };
  }, []);

  // API-driven data
  const [achievements, setAchievements] = useState<DisplayAchievement[]>([]);
  const [challenges, setChallenges] = useState<DisplayChallenge[]>([]);
  const [myRank, setMyRank] = useState<number | null>(null);

  // New API-driven data (formerly hardcoded)
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

  // Force white theme
  const isDark = false;

  // Fetch data from APIs
  const fetchData = useCallback(async (isRefresh = false) => {
    // Prevent duplicate concurrent API calls
    if (fetchingRef.current && !isRefresh) return;
    fetchingRef.current = true;

    try {
      if (!isMountedRef.current) return;
      if (!isRefresh) setLoading(true);

      // Parallel fetch for better performance
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

      // Fetch shared data via batch endpoint (reduces 3 API calls to 1)
      apiClient.get<{ quickActions: any[]; valueCards: any[]; shoppingMethods: any[] }>('/play-earn/batch').then(res => {
        if (res.success && res.data) {
          if (res.data.quickActions?.length) setQuickActions(res.data.quickActions);
          if (res.data.valueCards?.length) setValueCards(res.data.valueCards);
        }
      }).catch(() => {
        // Fallback to individual calls if batch fails
        quickActionsApi.getPersonalized().then(r => { if (r.success && r.data) setQuickActions(r.data); }).catch(() => {});
        valueCardsApi.getAll().then(r => { if (r.success && r.data) setValueCards(r.data); }).catch(() => {});
      });
      gamificationApi.getBonusOpportunities().then(res => {
        if (res.success && res.data?.opportunities) setBonusOpportunities(res.data.opportunities);
      }).catch(() => {});

      // Wallet data comes from WalletContext (refreshed above)

      // Streak data
      if (streakResponse.success && streakResponse.data) {
        setCurrentStreak(streakResponse.data.current || 0);
        setHasCheckedInToday(!!streakResponse.data.hasCheckedInToday);
      }

      // Challenges data - use unified endpoint (single source of truth)
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

      // Achievements data - take first 4
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

      // Available Games - single unified list
      if (gamesResponse.success && gamesResponse.data?.games) {
        setAllGames(gamesResponse.data.games);
      }

      // Live Tournaments - recalculate timers from real dates on arrival
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
            // Filter out tournaments that have already ended
            if (t.status === 'active' && t.endDate) {
              return formatTimeLeft(t.endDate).formatted !== 'Ended';
            }
            return true;
          });
        setTournaments(liveTournaments);
      }

      // Streak Bonuses (for Daily Rewards milestones)
      // streakApi.getStreakBonuses() returns data as the bonuses array directly
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

      // Shopping methods (API-driven, fallback to hardcoded)
      if (shoppingMethodsResponse?.data?.shoppingMethods) {
        setApiShoppingMethods(shoppingMethodsResponse.data.shoppingMethods);
      }

      // Special Programs (API-driven, fallback to hardcoded)
      if (specialProgramsResponse?.success && specialProgramsResponse?.data) {
        const programs = Array.isArray(specialProgramsResponse.data)
          ? specialProgramsResponse.data
          : [];
        setApiSpecialPrograms(programs);
        setSpecialProgramsLoaded(true);
      }

      // Event categories & reward config (dynamic entry card)
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
              'blood-donation': '🩸', 'tree-plantation': '🌳', 'beach-cleanup': '🏖️',
              'digital-literacy': '💻', 'food-drive': '🍲', 'health-camp': '🏥',
              'skill-training': '🎓', 'women-empowerment': '👩', 'education': '📚',
              'environment': '🌍',
            };
            setSocialImpactPreview(events.slice(0, 4).map((e: any) => ({
              icon: emojiMap[e.eventType || ''] || '✨',
              label: e.name?.length > 18 ? e.name.slice(0, 16) + '...' : e.name || 'Event',
              coins: e.rewards?.rezCoins || 0,
            })));
          }
        }
      } catch {
        // Keep fallback hardcoded values
      }

      // Check creator status (non-blocking)
      try {
        const profileRes = await creatorsApi.getMyCreatorProfile();
        if (profileRes.success && profileRes.data) {
          setCreatorStatus(profileRes.data?.status || 'approved');
        }
      } catch {
        // Not a creator - leave as 'none'
      }
    } catch (error) {
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

  // Refresh data when navigating back to this screen
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

  // Lazy loading: delay below-fold sections until after interactions complete
  // On web, InteractionManager.runAfterInteractions can hang indefinitely,
  // so we add a fallback timeout to guarantee rendering
  const [belowFoldReady, setBelowFoldReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const markReady = () => { if (!cancelled) setBelowFoldReady(true); };

    // Fallback: render after 500ms regardless (handles web + edge cases)
    const timeout = setTimeout(markReady, 500);

    // Native: render after animations complete (usually faster than timeout)
    const handle = InteractionManager.runAfterInteractions(markReady);

    return () => {
      cancelled = true;
      clearTimeout(timeout);
      handle.cancel();
    };
  }, []);

  // Live countdown timer for tournaments - recalculates every 60s from real dates
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
        // Remove tournaments whose time has ended
        if (t.status === 'active' && t.endDate) {
          const { formatted } = formatTimeLeft(t.endDate);
          return formatted !== 'Ended';
        }
        return true;
      }));
    }, 60000);
    return () => clearInterval(interval);
  }, [tournaments.length]);

  // Helper to get emoji for challenge type
  const getEmojiForChallenge = (action?: string): string => {
    switch (action) {
      case 'visit_stores': return '🏪';
      case 'upload_bills': return '📄';
      case 'refer_friends': return '👥';
      case 'spend_amount': return '💳';
      case 'order_count': return '🛒';
      case 'review_count': return '⭐';
      case 'login_streak': return '🔥';
      case 'share_deals': return '📤';
      default: return '🎯';
    }
  };

  // Helper to get emoji for achievement type
  const getEmojiForAchievement = (type?: string): string => {
    if (!type) return '🏆';
    if (type.includes('ORDER') || type.includes('PURCHASE')) return '🎯';
    if (type.includes('STREAK')) return '🔥';
    if (type.includes('SOCIAL') || type.includes('REFERRAL')) return '🦋';
    if (type.includes('REVIEW')) return '⭐';
    if (type.includes('SPENT')) return '💰';
    return '🎪';
  };

  // Featured Creators and Trending Picks are now fetched from API (see state variables above)

  // Quick Earn Actions - now API-driven via quickActions state
  // Fallback used only when API returns no data
  const fallbackQuickEarnActions = [
    {
      _id: 'scan-pay',
      slug: 'scan-pay',
      icon: 'qr-code',
      title: 'Scan & Pay at Store',
      subtitle: `Up to 10% ${BRAND.COIN_NAME}`,
      iconColor: '#ffcd57',
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
      iconColor: '#3B82F6',
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
      iconColor: '#A855F7',
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
      iconColor: '#F59E0B',
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
      iconColor: '#EC4899',
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
      iconColor: '#14B8A6',
      deepLinkPath: '/explore/daily-checkin',
      targetAchievementTypes: [],
      priority: 6,
    },
  ] as QuickAction[];

  const resolvedQuickActions = quickActions.length > 0 ? quickActions : fallbackQuickEarnActions;

  // Shopping & Payment Methods (API-driven with hardcoded fallback)
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

  // Use API data if available, otherwise fallback to defaults
  const shoppingMethods = apiShoppingMethods
    ? apiShoppingMethods.map(m => ({
        ...m,
        icon: (m.icon || 'bag') as keyof typeof Ionicons.glyphMap,
      }))
    : defaultShoppingMethods;

  // Social & Community Actions
  const socialActions = [
    { icon: 'share-social' as keyof typeof Ionicons.glyphMap, title: 'Share Store/Offer', coins: '20-50', description: 'Friends must view', path: '/earn/share' },
    { icon: 'thumbs-up' as keyof typeof Ionicons.glyphMap, title: 'Vote in Polls', coins: '10', description: 'Daily polls available', path: '/earn/polls' },
    { icon: 'chatbubble' as keyof typeof Ionicons.glyphMap, title: 'Comment on Offers', coins: '15', description: 'Quality comments', path: '/earn/offer-comments' },
    { icon: 'camera' as keyof typeof Ionicons.glyphMap, title: 'Upload Photos', coins: '25-100', description: 'Store/product photos', path: '/earn/photo-upload' },
    { icon: 'videocam' as keyof typeof Ionicons.glyphMap, title: 'Create Reels', coins: '50-200', description: 'UGC content rewards', path: '/social/reels' },
    { icon: 'heart' as keyof typeof Ionicons.glyphMap, title: 'Rate Events', coins: '20', description: 'After event attendance', path: '/events' },
  ];

  // Special Programs
  const specialPrograms = [
    {
      id: 'student',
      icon: 'school' as keyof typeof Ionicons.glyphMap,
      title: 'Student Zone',
      badge: '🎓',
      rewards: ['Student of the Month', 'Event participation', 'Campus ambassador'],
      earnings: 'Up to 5,000 coins/month',
      path: '/offers/zones/student',
    },
    {
      id: 'corporate',
      icon: 'briefcase' as keyof typeof Ionicons.glyphMap,
      title: 'Corporate Perks',
      badge: '🧑‍💼',
      rewards: ['Employee of the Month', 'Corporate events', 'Exclusive BNPL'],
      earnings: 'Up to 3,000 coins/month',
      path: '/offers/zones/corporate',
    },
    {
      id: 'prive',
      icon: 'diamond' as keyof typeof Ionicons.glyphMap,
      title: BRAND.PRIVE_NAME,
      badge: '👑',
      rewards: ['Premium campaigns', 'High multipliers', 'Brand collaborations'],
      earnings: 'Unlimited potential',
      path: '/prive',
    },
  ];

  // Bonus Opportunities, Daily Games, Tournaments, Mini Games are now fetched from API (see state variables above)
  // Achievements and Challenges are also from API (achievements and challenges state)

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
      // Revert on error
      setLikedPicks(prev => {
        const next = new Set(prev);
        if (wasLiked) next.add(pickId);
        else next.delete(pickId);
        return next;
      });
    }
  }, [likedPicks]);

  // Memoized wallet summary section
  const walletSummarySection = useMemo(() => (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>{'\u{1F4B0}'} Your Earnings</Text>

      {/* Wallet Summary Pills */}
      <View style={styles.walletGrid}>
        <View style={[styles.walletCard, { backgroundColor: '#FFF9E6', borderColor: '#80DFAD' }]}>
          <Text style={styles.walletLabel}>{BRAND.COIN_NAME}</Text>
          <Text style={[styles.walletValue, { color: '#00A85D' }]}>{rezCoins.toLocaleString()}</Text>
        </View>
        <View style={[styles.walletCard, { backgroundColor: '#FAF5FF', borderColor: '#E9D5FF' }]}>
          <Text style={styles.walletLabel}>Branded</Text>
          <Text style={[styles.walletValue, { color: '#9333EA' }]}>{totalBrandedCoins.toLocaleString()}</Text>
        </View>
        <View style={[styles.walletCard, { backgroundColor: '#FFFBEB', borderColor: '#FDE68A' }]}>
          <Text style={styles.walletLabel}>Promo</Text>
          <Text style={[styles.walletValue, { color: '#E6B34F' }]}>{totalPromoCoins.toLocaleString()}</Text>
        </View>
      </View>

      {/* This Month Earned */}
      <LinearGradient
        colors={['#FFF9E6', '#FFFBEB']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.monthlyCard}
      >
        <View>
          <Text style={styles.monthlyLabel}>This Month Earned</Text>
          <Text style={styles.monthlyValue}>{currencySymbol}{monthlyEarnings.toLocaleString()}</Text>
        </View>
        <View style={styles.monthlyButtons}>
          <Pressable style={styles.walletButton} onPress={() => navigateTo('/wallet')}>
            <Text style={styles.walletButtonText}>View Wallet</Text>
          </Pressable>
          <Pressable style={styles.howButton} onPress={() => navigateTo('/how-rez-works')}>
            <Text style={styles.howButtonText}>How Coins Work</Text>
          </Pressable>
        </View>
      </LinearGradient>
    </View>
  ), [rezCoins, totalBrandedCoins, totalPromoCoins, currencySymbol, monthlyEarnings, navigateTo]);

  // Memoized unified games section
  const gamesGridSection = useMemo(() => (
    <View style={styles.section}>
      <View style={styles.sectionHeaderWithLink}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={styles.gamesIconBg}>
            <Ionicons name="game-controller" size={18} color={Colors.text.inverse} />
          </View>
          <View>
            <Text style={styles.sectionTitle}>Games</Text>
            <Text style={styles.sectionSubtitle}>Play daily & earn coins</Text>
          </View>
        </View>
        <Pressable onPress={() => navigateTo('/games')}>
          <Text style={styles.viewAllLink}>{`View all \u2192`}</Text>
        </Pressable>
      </View>

      <View style={styles.gamesGrid}>
        {allGames.length > 0 ? allGames.map((game, idx) => {
          const colors = GAME_COLORS[idx % GAME_COLORS.length];
          const playsUsed = game.maxDaily > 0 ? game.maxDaily - game.playsRemaining : 0;
          const progressPct = game.maxDaily > 0 ? (playsUsed / game.maxDaily) * 100 : 0;
          const isExhausted = game.playsRemaining <= 0 && game.maxDaily > 0;

          return (
            <Pressable
              key={game.id}
              onPress={() => navigateTo(game.path)}
             
              style={styles.gameCardOuter}
            >
              <View style={[styles.gameCard, isExhausted && { opacity: 0.55 }]}>
                {/* Top row: Icon + Coin badge */}
                <View style={styles.gameHeader}>
                  <View style={[styles.gameIconCircle, { backgroundColor: `${colors[0]}15` }]}>
                    <Text style={styles.gameIcon}>{game.icon}</Text>
                  </View>
                  <View style={[styles.gameCoinsBadge, { backgroundColor: `${colors[0]}18` }]}>
                    <CachedImage source={NUQTA_COIN} style={{ width: 12, height: 12 }} />
                    <Text style={[styles.gameCoinsText, { color: colors[0] }]}>{game.reward}</Text>
                  </View>
                </View>

                {/* Title */}
                <Text style={styles.gameTitle} numberOfLines={1}>{game.title}</Text>

                {/* Plays progress bar */}
                <View style={styles.gamePlaysRow}>
                  <Text style={styles.gamePlaysLabel}>
                    {isExhausted ? 'Done for today' : `${game.playsRemaining} plays left`}
                  </Text>
                </View>
                <View style={styles.gameProgressBarBg}>
                  <View
                    style={[
                      styles.gameProgressBarFill,
                      {
                        width: `${Math.min(progressPct, 100)}%`,
                        backgroundColor: isExhausted ? '#9CA3AF' : colors[0],
                      },
                    ]}
                  />
                </View>

                {/* Today's earnings */}
                {game.todaysEarnings > 0 && (
                  <Text style={[styles.gameTodayEarnings, { color: colors[0] }]}>
                    +{game.todaysEarnings} earned today
                  </Text>
                )}
              </View>
            </Pressable>
          );
        }) : (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, width: '100%' }}>
            {[1, 2, 3, 4, 5, 6].map(i => (
              <View key={i} style={{ width: (width - 44) / 2, gap: Spacing.sm, padding: Spacing.base, backgroundColor: Colors.background.secondary, borderRadius: BorderRadius.lg }}>
                <SkeletonBox width={40} height={40} borderRadius={20} />
                <SkeletonBox width="80%" height={14} borderRadius={4} />
                <SkeletonBox width="100%" height={6} borderRadius={3} />
                <SkeletonBox width="60%" height={12} borderRadius={4} />
              </View>
            ))}
          </View>
        )}
      </View>
    </View>
  ), [allGames, navigateTo]);

  // Memoized challenges section
  const challengesSection = useMemo(() => (
    <View style={styles.section}>
      <View style={styles.sectionHeaderWithLink}>
        <View>
          <Text style={styles.sectionTitle}>Active Challenges</Text>
          <Text style={styles.sectionSubtitle}>Complete to earn bonus coins</Text>
        </View>
        <Pressable onPress={() => navigateTo('/missions')}>
          <Text style={styles.viewAllLink}>{`View all \u2192`}</Text>
        </Pressable>
      </View>

      {challenges.length === 0 && !loading && (
        <View style={styles.emptySection}>
          <Text style={styles.emptySectionText}>No active challenges. Check back soon!</Text>
        </View>
      )}

      {challenges.map((challenge) => (
        <Pressable
          key={challenge.id}
          style={styles.challengeCard}
          onPress={() => navigateTo(`/challenges/${challenge.id}`)}
        >
          <View style={styles.challengeHeader}>
            <View style={styles.challengeInfo}>
              <Text style={styles.challengeIcon}>{challenge.icon}</Text>
              <View>
                <Text style={styles.challengeTitle}>{challenge.title}</Text>
                <Text style={styles.challengeTime}>{challenge.timeLeft}</Text>
              </View>
            </View>
            <View style={styles.challengeReward}>
              <Text style={styles.challengeCoins}>+{challenge.reward} coins</Text>
              {challenge.isJoined ? (
                <Text style={styles.challengeProgress}>{challenge.progress}%</Text>
              ) : (
                <View style={{ backgroundColor: Colors.info, paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: BorderRadius.sm }}>
                  <Text style={{ color: Colors.text.inverse, fontSize: 11, fontWeight: '600' }}>Join</Text>
                </View>
              )}
            </View>
          </View>
          {challenge.isJoined && (
            <View style={styles.challengeProgressBar}>
              <View style={[styles.challengeProgressFill, { width: `${challenge.progress}%` }]} />
            </View>
          )}
        </Pressable>
      ))}
    </View>
  ), [challenges, loading, navigateTo]);

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.container}>
        <ScrollView
          style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[Colors.gold]}
            tintColor={Colors.gold}
          />
        }
      >
        {/* Header: Earnings Snapshot (memoized) */}
        {walletSummarySection}

        {/* Quick Earn Actions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="flash" size={24} color={Colors.warning} />
            <Text style={styles.sectionTitle}>Earn Now</Text>
          </View>

          <View style={styles.quickEarnGrid}>
            {resolvedQuickActions.map((action) => (
              <Pressable
                key={action._id}
                style={styles.quickEarnCard}
                onPress={() => navigateTo(action.deepLinkPath)}
              >
                <View style={[styles.iconContainer, { backgroundColor: `${action.iconColor}20` }]}>
                  <Ionicons name={(action.icon as keyof typeof Ionicons.glyphMap) || 'flash'} size={24} color={action.iconColor} />
                </View>
                <Text style={styles.quickEarnTitle}>{action.title}</Text>
                <Text style={styles.quickEarnReward}>{action.subtitle}</Text>
                {action.achievementProgress && (
                  <View style={{ marginTop: 4, width: '100%' }}>
                    <View style={{ height: 3, backgroundColor: Colors.border.default, borderRadius: 2, overflow: 'hidden' }}>
                      <View style={{ height: 3, backgroundColor: action.iconColor, borderRadius: 2, width: `${Math.min(action.achievementProgress.progress, 100)}%` }} />
                    </View>
                    <Text style={{ fontSize: 9, color: Colors.text.tertiary, marginTop: 2 }}>{action.achievementProgress.progress}%</Text>
                  </View>
                )}
              </Pressable>
            ))}
          </View>
        </View>

        {/* Earn from Social Media */}
        <Pressable
          style={styles.socialMediaBanner}
          onPress={() => navigateTo('/earn-from-social-media')}
         
        >
          <LinearGradient
            colors={['#EC4899', '#8B5CF6', '#7C3AED']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.socialMediaGradient}
          >
            <View style={styles.socialMediaLeft}>
              <View style={styles.socialMediaIconRow}>
                <View style={styles.socialMediaIcon}>
                  <Ionicons name="logo-instagram" size={18} color={Colors.text.inverse} />
                </View>
                <View style={[styles.socialMediaIcon, { marginLeft: -6 }]}>
                  <Ionicons name="logo-facebook" size={18} color={Colors.text.inverse} />
                </View>
                <View style={[styles.socialMediaIcon, { marginLeft: -6 }]}>
                  <Ionicons name="logo-youtube" size={18} color={Colors.text.inverse} />
                </View>
              </View>
              <Text style={styles.socialMediaTitle}>Earn from Social Media</Text>
              <Text style={styles.socialMediaSubtitle}>Share purchases & get 5% cashback</Text>
            </View>
            <View style={styles.socialMediaArrow}>
              <Ionicons name="arrow-forward" size={20} color="rgba(255,255,255,0.9)" />
            </View>
          </LinearGradient>
        </Pressable>

        {/* Creator Earnings Section */}
        <LinearGradient
          colors={['#FAF5FF', '#FDF2F8']}
          style={styles.creatorSection}
        >
          <View style={styles.creatorHeader}>
            <LinearGradient
              colors={['#A855F7', '#EC4899']}
              style={styles.creatorIcon}
            >
              <Ionicons name="sparkles" size={20} color={Colors.text.inverse} />
            </LinearGradient>
            <View style={styles.creatorHeaderText}>
              <Text style={styles.creatorTitle}>Become a Creator</Text>
              <Text style={styles.creatorSubtitle}>Earn by recommending products</Text>
            </View>
            <Pressable onPress={() => navigateTo('/creators')} style={styles.exploreLink}>
              <Text style={styles.exploreLinkText}>Explore</Text>
              <Ionicons name="arrow-forward" size={16} color="#A855F7" />
            </Pressable>
          </View>

          {/* Featured Creators */}
          <View style={styles.featuredCreatorsGrid}>
            {featuredCreators.length > 0 ? featuredCreators.slice(0, 2).map((creator) => (
              <Pressable
                key={creator.id}
                style={styles.creatorCard}
                onPress={() => navigateTo(`/creator/${creator.id}`)}
              >
                <View style={styles.creatorAvatarRow}>
                  <CachedImage
                    source={creator.avatar}
                    style={styles.creatorAvatar}
                    width={40}
                    height={40}
                  />
                  {creator.verified && (
                    <View style={styles.verifiedBadge}>
                      <Ionicons name="checkmark-circle" size={16} color={Colors.info} />
                    </View>
                  )}
                </View>
                <Text style={styles.creatorName}>{creator.name}</Text>
                <View style={styles.creatorStats}>
                  <Ionicons name="star" size={12} color={Colors.warning} />
                  <Text style={styles.creatorStatText}>{creator.rating}</Text>
                  <Text style={styles.creatorStatDivider}>•</Text>
                  <Text style={styles.creatorStatText}>{creator.totalPicks} picks</Text>
                </View>
              </Pressable>
            )) : (
              <View style={{ flexDirection: 'row', gap: 12, flex: 1 }}>
                <View style={{ flex: 1, alignItems: 'center', gap: 8, padding: 12 }}>
                  <SkeletonBox width={56} height={56} borderRadius={28} />
                  <SkeletonBox width={80} height={14} borderRadius={4} />
                  <SkeletonBox width={60} height={12} borderRadius={4} />
                </View>
                <View style={{ flex: 1, alignItems: 'center', gap: 8, padding: 12 }}>
                  <SkeletonBox width={56} height={56} borderRadius={28} />
                  <SkeletonBox width={80} height={14} borderRadius={4} />
                  <SkeletonBox width={60} height={12} borderRadius={4} />
                </View>
              </View>
            )}
          </View>

          {/* Trending Picks */}
          <View style={styles.trendingSection}>
            <Text style={styles.trendingTitle}>Trending Picks</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.trendingScroll}
            >
              {trendingPicks.length > 0 ? trendingPicks.map((pick) => (
                <Pressable
                  key={pick.id}
                  style={styles.pickCard}
                  onPress={() => navigateTo(`/picks/${pick.id}`)}
                >
                  <View style={styles.pickImageContainer}>
                    <CachedImage
                      source={pick.productImage}
                      style={styles.pickImage}
                      width={140}
                      height={140}
                    />
                    {pick.videoUrl && (
                      <View style={styles.pickVideoBadge}>
                        <Ionicons name="videocam" size={11} color={Colors.text.inverse} />
                      </View>
                    )}
                    <Pressable
                      style={styles.pickHeartButton}
                      onPress={(e) => {
                        e.stopPropagation();
                        handlePickLike(pick.id);
                      }}
                    >
                      <Ionicons
                        name={likedPicks.has(pick.id) ? 'heart' : 'heart-outline'}
                        size={16}
                        color={likedPicks.has(pick.id) ? Colors.error : Colors.text.primary}
                      />
                    </Pressable>
                    <View style={styles.pickTag}>
                      <Text style={styles.pickTagText}>{pick.tag}</Text>
                    </View>
                    <View style={styles.pickViewsBadge}>
                      <Ionicons name="trending-up" size={12} color="#EC4899" />
                      <Text style={styles.pickViewsText}>{(pick.views / 1000).toFixed(1)}k</Text>
                    </View>
                  </View>
                  <View style={styles.pickContent}>
                    <Text style={styles.pickTitle} numberOfLines={2}>{pick.title}</Text>
                    <View style={styles.pickPriceRow}>
                      <Text style={styles.pickPrice}>{currencySymbol}{pick.productPrice.toLocaleString()}</Text>
                      <Text style={styles.pickBrand}>{pick.productBrand}</Text>
                    </View>
                    <View style={styles.pickStatsRow}>
                      <Ionicons name="eye-outline" size={12} color={Colors.text.tertiary} />
                      <Text style={styles.pickStatText}>{(pick.views / 1000).toFixed(1)}k</Text>
                      <Text style={styles.pickStatDivider}>•</Text>
                      <Text style={styles.pickStatText}>{pick.purchases} sold</Text>
                    </View>
                  </View>
                </Pressable>
              )) : (
                <View style={{ flexDirection: 'row', gap: 12 }}>
                  {[1, 2, 3].map(i => (
                    <View key={i} style={{ width: 140, gap: 8 }}>
                      <SkeletonBox width={140} height={100} borderRadius={12} />
                      <SkeletonBox width={120} height={14} borderRadius={4} />
                      <SkeletonBox width={80} height={12} borderRadius={4} />
                    </View>
                  ))}
                </View>
              )}
            </ScrollView>
          </View>

          {creatorStatus === 'approved' ? (
            <Pressable
              style={styles.creatorCTA}
              onPress={() => navigateTo('/creator-dashboard')}
            >
              <LinearGradient
                colors={['#9333EA', '#7C3AED']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.creatorCTAGradient}
              >
                <CachedImage source={NUQTA_COIN} style={{ width: 22, height: 22, borderRadius: 11 }} />
                <Text style={styles.creatorCTAText}>Go to Creator Dashboard</Text>
              </LinearGradient>
            </Pressable>
          ) : creatorStatus === 'pending' ? (
            <View style={[styles.creatorCTA, { opacity: 0.7 }]}>
              <LinearGradient
                colors={['#D97706', '#F59E0B']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.creatorCTAGradient}
              >
                <Ionicons name="time" size={20} color={Colors.text.inverse} />
                <Text style={styles.creatorCTAText}>Application Under Review</Text>
              </LinearGradient>
            </View>
          ) : (
            <Pressable
              style={styles.creatorCTA}
              onPress={() => navigateTo('/creator-apply')}
            >
              <LinearGradient
                colors={['#A855F7', '#EC4899']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.creatorCTAGradient}
              >
                <CachedImage source={NUQTA_COIN} style={{ width: 22, height: 22, borderRadius: 11 }} />
                <Text style={styles.creatorCTAText}>Start Earning as Creator</Text>
              </LinearGradient>
            </Pressable>
          )}
        </LinearGradient>

        {/* Daily & Streak Earnings */}
        <View style={styles.section}>
          <LinearGradient
            colors={['#FFF7ED', '#FEF2F2']}
            style={styles.streakCard}
          >
            <View style={styles.streakHeader}>
              <View style={styles.streakIconContainer}>
                <Ionicons name="flame" size={28} color="#F97316" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.streakTitle}>Daily Rewards</Text>
                <Text style={styles.streakSubtitle}>
                  Current Streak: {currentStreak} day{currentStreak !== 1 ? 's' : ''}
                  {hasCheckedInToday ? ' ✓' : ' 🔥'}
                </Text>
              </View>
              {hasCheckedInToday && (
                <View style={{ backgroundColor: '#ECFDF5', paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs, borderRadius: BorderRadius.md }}>
                  <Text style={{ fontSize: 10, color: Colors.success, fontWeight: '600' }}>Done Today</Text>
                </View>
              )}
            </View>

            {/* Streak Progress — top 3 milestones to keep clean */}
            <View style={styles.streakMilestones}>
              {streakBonusMilestones.slice(0, 3).map((milestone) => (
                <View
                  key={milestone.day}
                  style={[
                    styles.milestoneItem,
                    milestone.completed && styles.milestoneCompleted,
                  ]}
                >
                  <Text style={styles.milestoneDay}>Day {milestone.day}</Text>
                  <Text style={[
                    styles.milestoneCoins,
                    milestone.completed && styles.milestoneCoinsCompleted,
                  ]}>
                    +{milestone.coins}
                  </Text>
                </View>
              ))}
            </View>
            <View style={[styles.streakMilestones, { marginTop: 0 }]}>
              {streakBonusMilestones.slice(3).map((milestone) => (
                <View
                  key={milestone.day}
                  style={[
                    styles.milestoneItem,
                    milestone.completed && styles.milestoneCompleted,
                  ]}
                >
                  <Text style={styles.milestoneDay}>Day {milestone.day}</Text>
                  <Text style={[
                    styles.milestoneCoins,
                    milestone.completed && styles.milestoneCoinsCompleted,
                  ]}>
                    {milestone.special ? '🎉 ' : ''}+{milestone.coins}
                  </Text>
                </View>
              ))}
            </View>

            <View style={styles.progressBarContainer}>
              <View style={[styles.progressBar, { width: `${Math.min((currentStreak / (streakBonusMilestones[streakBonusMilestones.length - 1]?.day || 100)) * 100, 100)}%` }]} />
            </View>

            <Pressable
              style={styles.checkinButton}
              onPress={() => navigateTo('/explore/daily-checkin')}
            >
              <LinearGradient
                colors={hasCheckedInToday ? ['#10B981', '#059669'] : ['#F97316', '#EF4444']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.checkinGradient}
              >
                <Ionicons name={hasCheckedInToday ? "checkmark-done-circle" : "checkmark-circle"} size={20} color={Colors.text.inverse} />
                <Text style={styles.checkinText}>
                  {hasCheckedInToday ? 'Checked In Today ✓' : 'Check in Today'}
                </Text>
              </LinearGradient>
            </Pressable>
          </LinearGradient>
        </View>

        {/* Shopping & Payment Earnings */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="bag" size={24} color="#A855F7" />
            <Text style={styles.sectionTitle}>Earn While Shopping</Text>
          </View>

          {shoppingMethods.map((method) => (
            <Pressable
              key={method.id}
              style={styles.shoppingCard}
              onPress={() => navigateTo(method.path)}
            >
              <View style={styles.shoppingIconContainer}>
                <Ionicons name={method.icon} size={28} color="#B45309" />
              </View>
              <View style={styles.shoppingContent}>
                <Text style={styles.shoppingTitle}>{method.title}</Text>
                <Text style={styles.shoppingDescription}>{method.description}</Text>
                <View style={styles.shoppingRewards}>
                  <Text style={styles.shoppingReward}>{method.reward}</Text>
                  <Text style={styles.shoppingExtra}>{method.extraReward}</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color={Colors.text.tertiary} />
            </Pressable>
          ))}

          {/* Special Highlight */}
          <LinearGradient
            colors={['#FFF9E6', '#F0FDFA']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.highlightCard}
          >
            <Ionicons name="locate" size={24} color="#B45309" />
            <Text style={styles.highlightText}>{`🎯 Pay via ${BRAND.APP_NAME} = Always Better Price`}</Text>
          </LinearGradient>
        </View>

        {/* Social & Community Earnings */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="people" size={24} color="#EC4899" />
            <Text style={styles.sectionTitle}>Share & Engage</Text>
            <Pressable
              style={{ marginLeft: 'auto', flexDirection: 'row', alignItems: 'center', gap: 4 }}
              onPress={() => navigateTo('/earn/my-submissions')}
            >
              <Text style={{ fontSize: 12, color: '#EC4899', fontWeight: '600' }}>My Submissions</Text>
              <Ionicons name="chevron-forward" size={14} color="#EC4899" />
            </Pressable>
          </View>

          <View style={styles.socialGrid}>
            {socialActions.map((action, idx) => (
              <Pressable
                key={idx}
                style={styles.socialCard}
                onPress={() => navigateTo(action.path)}
              >
                <Ionicons name={action.icon} size={24} color="#EC4899" />
                <Text style={styles.socialTitle}>{action.title}</Text>
                <Text style={styles.socialDescription}>{action.description}</Text>
                <Text style={styles.socialCoins}>+{action.coins} coins</Text>
              </Pressable>
            ))}
          </View>

          {/* Social Highlight */}
          <LinearGradient
            colors={['#FDF2F8', '#FAF5FF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.socialHighlight}
          >
            <Text style={styles.socialHighlightText}>
              {`👥 `}<Text style={styles.socialHighlightBold}>Friends redeemed your shared deal</Text>{` → +50 ${BRAND.COIN_NAME}`}
            </Text>
          </LinearGradient>
        </View>

        {/* Social Impact Section */}
        <View style={styles.section}>
          <Pressable
            style={styles.impactCard}
            onPress={() => navigateTo('/social-impact')}
          >
            <LinearGradient
              colors={['#faf1e0', '#EFF6FF', '#faf1e0']}
              style={styles.impactGradient}
            >
              <View style={styles.impactHeader}>
                <LinearGradient
                  colors={['#ffcd57', '#3B82F6']}
                  style={styles.impactIcon}
                >
                  <Ionicons name="heart" size={28} color={Colors.text.inverse} />
                </LinearGradient>
                <View style={styles.impactHeaderText}>
                  <View style={styles.impactTitleRow}>
                    <Text style={styles.impactTitle}>Social Impact</Text>
                    <View style={styles.impactBadge}>
                      <Text style={styles.impactBadgeText}>Powerful Differentiator</Text>
                    </View>
                  </View>
                  <Text style={styles.impactSubtitle}>Earn while making a difference</Text>
                </View>
                <Ionicons name="chevron-forward" size={24} color={Colors.text.tertiary} />
              </View>

              <View style={styles.impactActivities}>
                {(socialImpactPreview.length > 0 ? socialImpactPreview : [
                  { icon: '🩸', label: 'Blood Donation', coins: 200 },
                  { icon: '🌳', label: 'Tree Plantation', coins: 150 },
                  { icon: '🏖️', label: 'Beach Cleanup', coins: 120 },
                  { icon: '🍲', label: 'NGO Volunteer', coins: 100 },
                ]).map((activity, idx) => (
                  <View key={idx} style={styles.impactActivity}>
                    <Text style={styles.impactActivityIcon}>{activity.icon}</Text>
                    <Text style={styles.impactActivityLabel}>{activity.label}</Text>
                    <Text style={styles.impactActivityCoins}>+{activity.coins}</Text>
                  </View>
                ))}
              </View>

              <LinearGradient
                colors={['#faf1e0', '#DBEAFE']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.impactFooter}
              >
                <Text style={styles.impactFooterText}>
                  {`💰 Earn ${BRAND.COIN_NAME} + 🏪 Branded Coins from sponsors`}
                </Text>
              </LinearGradient>
            </LinearGradient>
          </Pressable>
        </View>

        {/* Special Programs */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="ribbon" size={24} color={Colors.warning} />
            <Text style={styles.sectionTitle}>Special Programs</Text>
          </View>

          {(specialProgramsLoaded && apiSpecialPrograms.length === 0) ? (
            <Text style={{ color: Colors.text.tertiary, textAlign: 'center', paddingVertical: Spacing.base }}>
              No programs available right now
            </Text>
          ) : (apiSpecialPrograms.length > 0
            ? apiSpecialPrograms.map((program) => (
              <Pressable
                key={program.slug}
                style={styles.programCard}
                onPress={() => setSelectedProgramSlug(program.slug)}
              >
                <View style={styles.programHeader}>
                  <View style={styles.programIconContainer}>
                    <Ionicons name={(program.icon || 'ribbon') as keyof typeof Ionicons.glyphMap} size={28} color={Colors.warning} />
                  </View>
                  <View style={styles.programContent}>
                    <View style={styles.programTitleRow}>
                      <Text style={styles.programTitle}>{program.name}</Text>
                      <Text style={styles.programBadge}>{program.badge}</Text>
                    </View>
                    <View style={styles.programRewards}>
                      {program.benefits.slice(0, 3).map((benefit, idx) => (
                        <View key={idx} style={styles.programRewardItem}>
                          <Ionicons name="checkmark-circle" size={12} color={Colors.gold} />
                          <Text style={styles.programRewardText}>{benefit.title}</Text>
                        </View>
                      ))}
                    </View>
                    <Text style={styles.programEarnings}>{program.earningsDisplayText}</Text>
                  </View>
                </View>
                <Pressable
                  style={[
                    styles.eligibilityButton,
                    program.userStatus === 'active_member' && styles.eligibilityButtonActive,
                    (program.userStatus === 'suspended' || program.userStatus === 'revoked') && styles.eligibilityButtonSuspended,
                  ]}
                  onPress={(e) => { e.stopPropagation(); setSelectedProgramSlug(program.slug); }}
                >
                  <Text style={[
                    styles.eligibilityText,
                    program.userStatus === 'active_member' && styles.eligibilityTextActive,
                    (program.userStatus === 'suspended' || program.userStatus === 'revoked') && styles.eligibilityTextSuspended,
                  ]}>
                    {program.userStatus === 'active_member' ? 'Active Member'
                      : program.userStatus === 'eligible' ? 'Activate Now'
                      : program.userStatus === 'pending_verification' ? 'Under Review'
                      : program.userStatus === 'suspended' ? 'Suspended'
                      : program.userStatus === 'revoked' ? 'Revoked'
                      : program.userStatus === 'expired' ? 'Expired'
                      : 'Check Eligibility'}
                  </Text>
                </Pressable>
              </Pressable>
            ))
            : specialPrograms.map((program) => (
              <Pressable
                key={program.id}
                style={styles.programCard}
                onPress={() => setSelectedProgramSlug(
                  program.id === 'student' ? 'student_zone'
                    : program.id === 'corporate' ? 'corporate_perks'
                    : 'nuqta_prive'
                )}
              >
                <View style={styles.programHeader}>
                  <View style={styles.programIconContainer}>
                    <Ionicons name={program.icon} size={28} color={Colors.warning} />
                  </View>
                  <View style={styles.programContent}>
                    <View style={styles.programTitleRow}>
                      <Text style={styles.programTitle}>{program.title}</Text>
                      <Text style={styles.programBadge}>{program.badge}</Text>
                    </View>
                    <View style={styles.programRewards}>
                      {program.rewards.map((reward, idx) => (
                        <View key={idx} style={styles.programRewardItem}>
                          <Ionicons name="checkmark-circle" size={12} color={Colors.gold} />
                          <Text style={styles.programRewardText}>{reward}</Text>
                        </View>
                      ))}
                    </View>
                    <Text style={styles.programEarnings}>{program.earnings}</Text>
                  </View>
                </View>
                <Pressable style={styles.eligibilityButton} onPress={(e) => {
                  e.stopPropagation();
                  setSelectedProgramSlug(
                    program.id === 'student' ? 'student_zone'
                      : program.id === 'corporate' ? 'corporate_perks'
                      : 'nuqta_prive'
                  );
                }}>
                  <Text style={styles.eligibilityText}>Check Eligibility</Text>
                </Pressable>
              </Pressable>
            ))
          )}
        </View>

        {/* Program Detail Modal */}
        <ProgramDetailModal
          visible={!!selectedProgramSlug}
          onClose={() => setSelectedProgramSlug(null)}
          programSlug={selectedProgramSlug}
          onStatusChange={async () => {
            try {
              const resp = await specialProgramApi.listPrograms();
              if (resp?.success && resp?.data && Array.isArray(resp.data) && resp.data.length > 0) {
                setApiSpecialPrograms(resp.data);
              }
            } catch {}
          }}
        />

        {/* Events & Offline Earnings — Dynamic from backend */}
        <View style={styles.section}>
          <Pressable
            style={styles.eventsCard}
            onPress={() => navigateTo('/events')}
          >
            <LinearGradient
              colors={['#FAF5FF', '#FDF2F8', '#FFF7ED']}
              style={styles.eventsGradient}
            >
              <View style={styles.eventsHeader}>
                <View style={styles.eventsIconContainer}>
                  <Ionicons name="ticket" size={28} color="#A855F7" />
                </View>
                <View style={styles.eventsHeaderText}>
                  <Text style={styles.eventsTitle}>Earn at Events</Text>
                  <Text style={styles.eventsSubtitle}>College fests, markets, concerts & more</Text>
                </View>
                <Ionicons name="chevron-forward" size={24} color={Colors.text.tertiary} />
              </View>

              <View style={styles.eventsTypes}>
                {(eventCategories.length > 0
                  ? eventCategories.slice(0, 4).map((cat: any) => ({
                      icon: cat.icon || '🎪',
                      label: cat.name,
                      slug: cat.slug,
                    }))
                  : [
                      { icon: '🎪', label: 'All Events', slug: '' },
                      { icon: '🎵', label: 'Music', slug: '' },
                      { icon: '🍔', label: 'Food', slug: '' },
                      { icon: '⚽', label: 'Sports', slug: '' },
                    ]
                ).map((type: any, idx: number) => (
                  <Pressable
                    key={idx}
                    style={styles.eventType}
                    onPress={(e) => {
                      e.stopPropagation();
                      navigateTo(type.slug ? `/events/${type.slug}` : '/events');
                    }}
                  >
                    <Text style={styles.eventTypeIcon}>{type.icon}</Text>
                    <Text style={styles.eventTypeLabel}>{type.label}</Text>
                  </Pressable>
                ))}
              </View>

              <View style={styles.eventsFooter}>
                <Text style={styles.eventsFooterText}>
                  {eventRewardConfig
                    ? `💰 Ways to earn: ${eventRewardConfig.rewards.map((r: any) => r.description).join(' • ')}`
                    : '💰 Ways to earn: Entry • Purchases • Sharing • Voting • Participation'}
                </Text>
              </View>
            </LinearGradient>
          </Pressable>
        </View>

        {/* Bonus & Limited-Time Earnings */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="happy" size={24} color="#F97316" />
            <Text style={styles.sectionTitle}>Bonus Zone</Text>
            {bonusCampaigns.length > 5 && (
              <Pressable onPress={() => navigateTo('/bonus-zone')} style={{ marginLeft: 'auto' }}>
                <Text style={{ fontSize: 13, color: '#F97316', fontWeight: '600' }}>View All</Text>
              </Pressable>
            )}
          </View>

          {bonusCampaigns.length > 0 ? bonusCampaigns.slice(0, 5).map((campaign) => (
            <BonusZoneCard
              key={campaign.slug}
              campaign={campaign}
              currencySymbol={currencySymbol}
            />
          )) : (
            <View style={styles.emptySection}>
              <Text style={styles.emptySectionText}>No active bonus campaigns right now. Check back soon for cashback boosts, bank offers &amp; more!</Text>
            </View>
          )}
        </View>

        {/* Bonus Opportunities (time-limited challenges, coin drops, etc.) */}
        {bonusOpportunities.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="flash" size={24} color={Colors.error} />
              <Text style={styles.sectionTitle}>Limited-Time Opportunities</Text>
            </View>
            {bonusOpportunities.map((opp) => (
              <Pressable
                key={opp.id}
                style={styles.bonusOppCard}
               
                onPress={() => opp.path && navigateTo(opp.path)}
              >
                <View style={styles.bonusOppRow}>
                  <Text style={styles.bonusOppIcon}>{opp.icon}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.bonusOppTitle}>{opp.title}</Text>
                    <Text style={styles.bonusOppDesc}>{opp.description}</Text>
                  </View>
                  <View style={styles.bonusOppRight}>
                    <Text style={styles.bonusOppReward}>{replaceCurrencySymbol(opp.reward)}</Text>
                    {opp.timeLeft ? (
                      <View style={[styles.bonusOppTimeBadge, opp.urgent && styles.bonusOppUrgent]}>
                        <Ionicons name="time" size={10} color={opp.urgent ? Colors.error : Colors.text.tertiary} />
                        <Text style={[styles.bonusOppTime, opp.urgent && { color: Colors.error }]}>{opp.timeLeft}</Text>
                      </View>
                    ) : null}
                  </View>
                </View>
              </Pressable>
            ))}
          </View>
        )}

        {/* Learn & Maximise Section */}
        <LearnMaximiseSection />

        {/* Daily Games Section (memoized) */}
        {gamesGridSection}

        {/* Active Challenges Section (memoized) */}
        {challengesSection}

        {/* Below-fold sections: lazy loaded after interactions complete */}
        {belowFoldReady ? (
          <>
            {/* Live Tournaments Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeaderWithLink}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <View style={styles.tournamentIconBg}>
                    <Ionicons name="trophy" size={18} color={Colors.text.inverse} />
                  </View>
                  <View>
                    <Text style={styles.sectionTitle}>Tournaments</Text>
                    <Text style={styles.sectionSubtitle}>Compete & win big prizes</Text>
                  </View>
                </View>
                {tournaments.length > 0 && (
                  <View style={styles.tournamentLiveBadge}>
                    <View style={styles.tournamentLiveDot} />
                    <Text style={styles.tournamentLiveText}>LIVE</Text>
                  </View>
                )}
              </View>

              {tournaments.length > 0 ? tournaments.map((tournament, idx) => {
                const isActive = tournament.status === 'active';
                const statusColors = isActive ? ['#059669', '#10B981'] : ['#2563EB', '#3B82F6'];

                return (
                  <Pressable
                    key={tournament.id}
                    onPress={() => navigateTo(tournament.path || `/playandearn/TournamentDetail?id=${tournament.id}`)}
                   
                    style={{ marginBottom: idx < tournaments.length - 1 ? 12 : 0 }}
                  >
                    <LinearGradient
                      colors={['#1a3a52', '#234B6B']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.tournamentCard}
                    >
                      {/* Status badge */}
                      <View style={[styles.tournamentStatusBadge, { backgroundColor: statusColors[0] }]}>
                        <Text style={styles.tournamentStatusText}>
                          {isActive ? 'LIVE' : 'UPCOMING'}
                        </Text>
                      </View>

                      {/* Top row: icon + title + participants */}
                      <View style={styles.tournamentTopRow}>
                        <Text style={styles.tournamentIcon}>{tournament.icon}</Text>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.tournamentTitle} numberOfLines={1}>{tournament.title}</Text>
                          <View style={styles.tournamentPlayersRow}>
                            <Ionicons name="people" size={14} color="rgba(255,255,255,0.7)" />
                            <Text style={styles.tournamentParticipants}>
                              {tournament.participants.toLocaleString()} players
                            </Text>
                          </View>
                        </View>
                      </View>

                      {/* Stats row */}
                      <View style={styles.tournamentStatsRow}>
                        <View style={styles.tournamentStatBox}>
                          <CachedImage source={NUQTA_COIN} style={{ width: 16, height: 16 }} />
                          <Text style={styles.tournamentStatBoxValue}>{tournament.prize}</Text>
                          <Text style={styles.tournamentStatBoxLabel}>Prize Pool</Text>
                        </View>
                        <View style={[styles.tournamentStatBox, styles.tournamentStatBoxMiddle]}>
                          <Ionicons name="medal" size={16} color="#FBBF24" />
                          <Text style={styles.tournamentStatBoxValue}>
                            {tournament.isParticipant && tournament.userRank ? `#${tournament.userRank}` : '--'}
                          </Text>
                          <Text style={styles.tournamentStatBoxLabel}>Your Rank</Text>
                        </View>
                        <View style={styles.tournamentStatBox}>
                          <Ionicons name="time" size={16} color={isActive ? '#F87171' : '#60A5FA'} />
                          <Text style={[styles.tournamentStatBoxValue, { color: isActive ? '#F87171' : '#60A5FA' }]}>
                            {tournament.endsIn || tournament.startsIn || '--'}
                          </Text>
                          <Text style={styles.tournamentStatBoxLabel}>
                            {isActive ? 'Ends In' : 'Starts In'}
                          </Text>
                        </View>
                      </View>

                      {/* CTA */}
                      <View style={styles.tournamentCTA}>
                        <Text style={styles.tournamentCTAText}>
                          {tournament.isParticipant ? 'View Tournament' : 'Join Now'}
                        </Text>
                        <Ionicons name="arrow-forward" size={16} color={Colors.nileBlue} />
                      </View>
                    </LinearGradient>
                  </Pressable>
                );
              }) : (
                <View style={styles.tournamentEmptyCard}>
                  <Ionicons name="trophy-outline" size={40} color="#CBD5E1" />
                  <Text style={styles.tournamentEmptyTitle}>No Active Tournaments</Text>
                  <Text style={styles.tournamentEmptyText}>New tournaments are announced regularly. Check back soon!</Text>
                </View>
              )}
            </View>

            {/* Mini Games section removed - merged into unified Games section above */}

            {/* Achievements Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeaderWithLink}>
                <View>
                  <Text style={styles.sectionTitle}>Achievements</Text>
                  <Text style={styles.sectionSubtitle}>Unlock badges & coins</Text>
                </View>
                <Pressable onPress={() => navigateTo('/badges')}>
                  <Text style={styles.viewAllLink}>{`View all \u2192`}</Text>
                </Pressable>
              </View>

              {achievements.length === 0 && !loading && (
                <View style={styles.emptySection}>
                  <Text style={styles.emptySectionText}>Complete activities to earn achievements!</Text>
                </View>
              )}

              <View style={styles.achievementsGrid}>
                {achievements.map((achievement) => (
                  <View
                    key={achievement.id}
                    style={[
                      styles.achievementCard,
                      achievement.unlocked && styles.achievementUnlocked,
                      !achievement.unlocked && styles.achievementLocked,
                    ]}
                  >
                    <View style={styles.achievementHeader}>
                      <Text style={styles.achievementIcon}>{achievement.icon}</Text>
                      {achievement.unlocked && <Text>{'\u2705'}</Text>}
                    </View>
                    <Text style={styles.achievementTitle}>{achievement.title}</Text>
                    <Text style={styles.achievementCoins}>+{achievement.coins} coins</Text>
                    {!achievement.unlocked && achievement.progress !== undefined && (
                      <View style={styles.achievementProgressContainer}>
                        <View style={styles.achievementProgressBar}>
                          <View style={[styles.achievementProgressFill, { width: `${achievement.progress}%` }]} />
                        </View>
                        <Text style={styles.achievementProgressText}>{achievement.progress}% complete</Text>
                      </View>
                    )}
                  </View>
                ))}
              </View>
            </View>

            {/* Leaderboard Preview */}
            <View style={styles.section}>
              <LinearGradient
                colors={['#EFF6FF', '#FAF5FF']}
                style={styles.leaderboardCard}
              >
                <Ionicons name="trophy" size={48} color={Colors.warning} />
                <Text style={styles.leaderboardTitle}>Weekly Leaderboard</Text>
                <Text style={styles.leaderboardText}>
                  {myRank
                    ? `You're ranked #${myRank} this week\nTop 100 win bonus coins!`
                    : 'Complete activities to rank!\nTop 100 win bonus coins!'}
                </Text>
                <Pressable
                  style={styles.leaderboardButton}
                  onPress={() => navigateTo('/playandearn/leaderboard')}
                >
                  <LinearGradient
                    colors={['#ffcd57', '#1a3a52']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.leaderboardButtonGradient}
                  >
                    <Text style={styles.leaderboardButtonText}>View Leaderboard</Text>
                  </LinearGradient>
                </Pressable>
              </LinearGradient>
            </View>

            {/* Why ReZ Pays More */}
            <View style={styles.section}>
              <View style={styles.whyRezCard}>
                <Text style={styles.whyRezTitle}>{`Why ${BRAND.APP_NAME} Pays You More`}</Text>
                <View style={styles.whyRezGrid}>
                  {(valueCards.length > 0 ? valueCards : [
                    { _id: 'f1', emoji: '\u{1F4B0}', title: 'Merchant-Funded', subtitle: 'Real savings, not\ndiscounts', sortOrder: 1 },
                    { _id: 'f2', emoji: '\u26A1', title: 'Instant Rewards', subtitle: 'No waiting periods', sortOrder: 2 },
                    { _id: 'f3', emoji: '\u{1F3AF}', title: 'Triple Stack', subtitle: 'Cashback + Coins +\nLoyalty', sortOrder: 3 },
                    { _id: 'f4', emoji: '\u{1F504}', title: 'High Frequency', subtitle: 'Earn daily,\neverywhere', sortOrder: 4 },
                  ] as ValueCard[]).map((card) => (
                    <Pressable
                      key={card._id}
                      style={styles.whyRezItem}
                      onPress={() => card.deepLinkPath && navigateTo(card.deepLinkPath)}
                     
                    >
                      <Text style={styles.whyRezEmoji}>{card.emoji}</Text>
                      <Text style={styles.whyRezItemTitle}>{card.title}</Text>
                      <Text style={styles.whyRezItemSubtitle}>{card.subtitle}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            </View>
          </>
        ) : (
          <View style={{ paddingVertical: 40, alignItems: 'center' }}>
            <ActivityIndicator size="small" color={Colors.nileBlue} />
          </View>
        )}

        {/* Bottom spacer */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Fixed Bottom CTA */}
      <View style={styles.bottomCTA}>
        <Pressable onPress={() => navigateTo('/playandearn/nearby-earn')}>
          <LinearGradient
            colors={['#ffcd57', '#14B8A6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.bottomCTAGradient}
          >
            <View style={styles.bottomCTAContent}>
              <Ionicons name="location" size={24} color={Colors.text.inverse} />
              <View>
                <Text style={styles.bottomCTATitle}>Find Ways to Earn Near Me</Text>
                <Text style={styles.bottomCTASubtitle}>Partner stores nearby</Text>
              </View>
            </View>
            <Ionicons name="arrow-forward" size={24} color={Colors.text.inverse} />
          </LinearGradient>
        </Pressable>
        </View>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing['4xl'],
    paddingBottom: Spacing.base,
    backgroundColor: Colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerTitle: {
    ...Typography.h2,
    color: Colors.nileBlue,
    marginBottom: Spacing.base,
    fontFamily: 'Poppins',
  },
  walletGrid: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  walletCard: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  walletLabel: {
    fontSize: 11,
    color: '#4A5568',
    marginBottom: Spacing.xs,
    fontWeight: '500',
  },
  walletValue: {
    ...Typography.h3,
    fontWeight: 'bold',
  },
  monthlyCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.base,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: '#80DFAD',
  },
  monthlyLabel: {
    ...Typography.bodySmall,
    color: Colors.text.tertiary,
    marginBottom: Spacing.xs,
  },
  monthlyValue: {
    ...Typography.h2,
    fontWeight: 'bold',
    color: Colors.nileBlue,
  },
  monthlyButtons: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  walletButton: {
    backgroundColor: Colors.gold,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
  walletButtonText: {
    ...Typography.bodySmall,
    color: Colors.nileBlue,
    fontWeight: '600',
  },
  howButton: {
    backgroundColor: '#EDF2F7',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
  howButtonText: {
    ...Typography.bodySmall,
    color: Colors.nileBlue,
    fontWeight: '600',
  },
  section: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.base,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.base,
  },
  sectionHeaderWithLink: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.base,
  },
  sectionTitle: {
    ...Typography.h3,
    color: Colors.nileBlue,
    fontFamily: 'Poppins',
  },
  sectionSubtitle: {
    fontSize: 11,
    color: '#4A5568',
    marginTop: Spacing.xs,
    marginBottom: Spacing.md,
  },
  viewAllLink: {
    ...Typography.bodySmall,
    color: Colors.gold,
  },
  quickEarnGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  quickEarnCard: {
    width: (width - 44) / 2,
    padding: Spacing.base,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.background.primary,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Shadows.medium,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  quickEarnTitle: {
    ...Typography.body,
    fontWeight: '600',
    color: Colors.nileBlue,
    marginBottom: Spacing.xs,
  },
  quickEarnReward: {
    fontSize: 11,
    color: '#00A85D',
    fontWeight: '500',
  },
  socialMediaBanner: {
    marginHorizontal: Spacing.base,
    marginBottom: Spacing.lg,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  socialMediaGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.base,
    paddingHorizontal: 18,
  },
  socialMediaLeft: {
    flex: 1,
  },
  socialMediaIconRow: {
    flexDirection: 'row',
    marginBottom: Spacing.sm,
  },
  socialMediaIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  socialMediaTitle: {
    ...Typography.bodyLarge,
    fontWeight: '800',
    color: Colors.text.inverse,
    marginBottom: 2,
  },
  socialMediaSubtitle: {
    ...Typography.bodySmall,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '500',
  },
  socialMediaArrow: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  creatorSection: {
    marginHorizontal: Spacing.base,
    marginVertical: Spacing.base,
    padding: Spacing.base,
    borderRadius: BorderRadius.lg,
  },
  creatorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.base,
  },
  creatorIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  creatorHeaderText: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  creatorTitle: {
    ...Typography.bodyLarge,
    fontWeight: 'bold',
    color: Colors.nileBlue,
  },
  creatorSubtitle: {
    ...Typography.bodySmall,
    color: Colors.text.tertiary,
  },
  exploreLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  exploreLinkText: {
    ...Typography.bodySmall,
    color: '#A855F7',
    fontWeight: '600',
  },
  creatorCTA: {
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  creatorCTAGradient: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
  },
  creatorCTAText: {
    ...Typography.body,
    color: Colors.text.inverse,
    fontWeight: '600',
  },
  featuredCreatorsGrid: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.base,
  },
  creatorCard: {
    flex: 1,
    padding: Spacing.base,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.background.primary,
    borderWidth: 1,
    borderColor: '#E9D5FF',
  },
  creatorAvatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  creatorAvatar: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.xl,
  },
  verifiedBadge: {
    marginLeft: Spacing.xs,
  },
  creatorName: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  creatorStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  creatorStatText: {
    fontSize: 11,
    color: Colors.text.tertiary,
  },
  creatorStatDivider: {
    fontSize: 11,
    color: Colors.text.tertiary,
  },
  trendingSection: {
    marginBottom: Spacing.base,
  },
  trendingTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: Spacing.md,
  },
  trendingScroll: {
    marginHorizontal: -Spacing.base,
    paddingHorizontal: Spacing.base,
  },
  pickCard: {
    width: 140,
    marginRight: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.background.primary,
    overflow: 'hidden',
    ...Shadows.medium,
  },
  pickImageContainer: {
    width: '100%',
    aspectRatio: 1,
    position: 'relative',
  },
  pickImage: {
    width: '100%',
    height: '100%',
    borderTopLeftRadius: BorderRadius.md,
    borderTopRightRadius: BorderRadius.md,
  },
  pickHeartButton: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickTag: {
    position: 'absolute',
    top: Spacing.sm,
    left: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  pickTagText: {
    ...Typography.overline,
    fontWeight: '600',
    color: Colors.text.inverse,
    textTransform: undefined,
    letterSpacing: undefined,
  },
  pickVideoBadge: {
    position: 'absolute',
    bottom: Spacing.sm,
    left: Spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 4,
    padding: 3,
  },
  pickViewsBadge: {
    position: 'absolute',
    bottom: Spacing.sm,
    right: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  pickViewsText: {
    ...Typography.overline,
    fontWeight: '600',
    color: Colors.text.primary,
    textTransform: undefined,
    letterSpacing: undefined,
  },
  pickContent: {
    padding: 10,
  },
  pickTitle: {
    ...Typography.bodySmall,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  pickPriceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    marginBottom: Spacing.xs,
  },
  pickPrice: {
    ...Typography.body,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  pickBrand: {
    fontSize: 10,
    color: Colors.text.tertiary,
  },
  pickStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  pickStatText: {
    fontSize: 10,
    color: Colors.text.tertiary,
  },
  pickStatDivider: {
    fontSize: 10,
    color: '#D1D5DB',
  },
  streakCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: '#FED7AA',
  },
  streakHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.base,
  },
  streakIconContainer: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.md,
    backgroundColor: 'rgba(249,115,22,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  streakTitle: {
    ...Typography.h4,
    fontWeight: 'bold',
    color: Colors.nileBlue,
  },
  streakSubtitle: {
    ...Typography.body,
    color: Colors.text.tertiary,
  },
  streakMilestones: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: Spacing.sm,
  },
  milestoneItem: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.background.primary,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  milestoneCompleted: {
    backgroundColor: '#FFF7ED',
    borderColor: '#FED7AA',
  },
  milestoneDay: {
    fontSize: 10,
    color: Colors.text.tertiary,
    marginBottom: Spacing.xs,
  },
  milestoneCoins: {
    ...Typography.body,
    fontWeight: 'bold',
    color: Colors.text.tertiary,
  },
  milestoneCoinsCompleted: {
    color: '#F97316',
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
    marginBottom: Spacing.base,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: '#F97316',
  },
  checkinButton: {
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  checkinGradient: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
  },
  checkinText: {
    ...Typography.body,
    color: Colors.text.inverse,
    fontWeight: '600',
  },
  shoppingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.base,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.background.primary,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: Spacing.md,
  },
  shoppingIconContainer: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.md,
    backgroundColor: 'rgba(0,192,106,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.base,
  },
  shoppingContent: {
    flex: 1,
  },
  shoppingTitle: {
    ...Typography.body,
    fontWeight: '600',
    color: Colors.nileBlue,
    marginBottom: Spacing.xs,
  },
  shoppingDescription: {
    ...Typography.bodySmall,
    color: Colors.text.tertiary,
    marginBottom: Spacing.sm,
  },
  shoppingRewards: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  shoppingReward: {
    ...Typography.body,
    fontWeight: 'bold',
    color: '#B45309',
  },
  shoppingExtra: {
    ...Typography.bodySmall,
    color: '#A855F7',
  },
  highlightCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.base,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: '#C0F0D9',
  },
  highlightText: {
    ...Typography.body,
    fontWeight: '600',
    color: Colors.nileBlue,
  },
  socialGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  socialCard: {
    width: (width - 44) / 2,
    padding: Spacing.base,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.background.primary,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  socialTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.nileBlue,
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
  },
  socialDescription: {
    fontSize: 11,
    color: Colors.text.tertiary,
    marginBottom: Spacing.sm,
  },
  socialCoins: {
    ...Typography.body,
    fontWeight: 'bold',
    color: '#EC4899',
  },
  socialHighlight: {
    padding: Spacing.base,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.base,
    borderWidth: 1,
    borderColor: '#FBCFE8',
  },
  socialHighlightText: {
    ...Typography.body,
    color: Colors.nileBlue,
    textAlign: 'center',
  },
  socialHighlightBold: {
    fontWeight: '600',
  },
  impactCard: {
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  impactGradient: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  impactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.base,
  },
  impactIcon: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  impactHeaderText: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  impactTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  impactTitle: {
    ...Typography.h4,
    fontWeight: 'bold',
    color: Colors.nileBlue,
  },
  impactBadge: {
    backgroundColor: 'rgba(255,205,87,0.2)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.md,
  },
  impactBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: Colors.gold,
  },
  impactSubtitle: {
    ...Typography.body,
    color: Colors.text.tertiary,
  },
  impactActivities: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.base,
  },
  impactActivity: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.background.primary,
    alignItems: 'center',
  },
  impactActivityIcon: {
    fontSize: 24,
    marginBottom: Spacing.xs,
  },
  impactActivityLabel: {
    fontSize: 10,
    color: Colors.text.tertiary,
    marginBottom: Spacing.xs,
    textAlign: 'center',
  },
  impactActivityCoins: {
    ...Typography.bodySmall,
    fontWeight: 'bold',
    color: Colors.gold,
  },
  impactFooter: {
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
  },
  impactFooterText: {
    ...Typography.body,
    color: Colors.nileBlue,
    textAlign: 'center',
  },
  programCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.background.primary,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: Spacing.md,
  },
  programHeader: {
    flexDirection: 'row',
    marginBottom: Spacing.md,
  },
  programIconContainer: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.md,
    backgroundColor: 'rgba(245,158,11,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.base,
  },
  programContent: {
    flex: 1,
  },
  programTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  programTitle: {
    ...Typography.bodyLarge,
    fontWeight: '600',
    color: Colors.nileBlue,
  },
  programBadge: {
    ...Typography.h3,
  },
  programRewards: {
    marginBottom: Spacing.sm,
  },
  programRewardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  programRewardText: {
    ...Typography.bodySmall,
    color: Colors.text.tertiary,
  },
  programEarnings: {
    ...Typography.body,
    fontWeight: 'bold',
    color: Colors.warning,
  },
  eligibilityButton: {
    backgroundColor: Colors.background.secondary,
    paddingVertical: 10,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
  },
  eligibilityButtonActive: {
    backgroundColor: '#ECFDF5',
  },
  eligibilityButtonSuspended: {
    backgroundColor: '#FEF2F2',
  },
  eligibilityText: {
    ...Typography.body,
    fontWeight: '600',
    color: Colors.nileBlue,
  },
  eligibilityTextActive: {
    color: Colors.success,
  },
  eligibilityTextSuspended: {
    color: '#DC2626',
  },
  eventsCard: {
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  eventsGradient: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: '#E9D5FF',
  },
  eventsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.base,
  },
  eventsIconContainer: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.md,
    backgroundColor: 'rgba(168,85,247,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  eventsHeaderText: {
    flex: 1,
  },
  eventsTitle: {
    ...Typography.h4,
    fontWeight: 'bold',
    color: Colors.nileBlue,
  },
  eventsSubtitle: {
    ...Typography.body,
    color: Colors.text.tertiary,
  },
  eventsTypes: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.base,
  },
  eventType: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.background.secondary,
    alignItems: 'center',
  },
  eventTypeIcon: {
    fontSize: 24,
    marginBottom: Spacing.xs,
  },
  eventTypeLabel: {
    fontSize: 10,
    color: Colors.text.tertiary,
  },
  eventsFooter: {
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.background.secondary,
  },
  eventsFooterText: {
    ...Typography.body,
    color: Colors.nileBlue,
  },
  bonusCard: {
    flexDirection: 'row',
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.background.primary,
    borderWidth: 1,
    borderColor: '#FED7AA',
    marginBottom: Spacing.md,
  },
  bonusIconContainer: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    backgroundColor: 'rgba(249,115,22,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.base,
  },
  bonusContent: {
    flex: 1,
  },
  bonusTitle: {
    ...Typography.body,
    fontWeight: '600',
    color: Colors.nileBlue,
    marginBottom: Spacing.xs,
  },
  bonusDescription: {
    ...Typography.bodySmall,
    color: Colors.text.tertiary,
    marginBottom: Spacing.sm,
  },
  bonusFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bonusReward: {
    ...Typography.body,
    fontWeight: 'bold',
    color: Colors.gold,
  },
  bonusTime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  bonusTimeText: {
    ...Typography.bodySmall,
    fontWeight: '600',
    color: '#F97316',
  },
  gamesIconBg: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: Colors.nileBlue,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gamesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  gameCardOuter: {
    width: (width - 42) / 2,
  },
  gameCard: {
    padding: 14,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.background.primary,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    ...Platform.select({
      ios: {
        shadowColor: Colors.nileBlue,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: { elevation: 2 },
      web: { boxShadow: '0px 2px 8px rgba(26,58,82,0.06)' },
    }),
  },
  gameHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  gameIconCircle: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gameIcon: {
    fontSize: 22,
  },
  gameCoinsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: 10,
  },
  gameCoinsText: {
    fontSize: 11,
    fontWeight: '700',
  },
  gameTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.nileBlue,
    marginBottom: 6,
  },
  gamePlaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  gamePlaysLabel: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
  },
  gameProgressBarBg: {
    height: 5,
    borderRadius: 3,
    backgroundColor: '#F1F5F9',
    overflow: 'hidden',
  },
  gameProgressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  gameTodayEarnings: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 6,
  },
  challengeCard: {
    padding: Spacing.base,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.background.secondary,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: Spacing.md,
  },
  challengeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  challengeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  challengeIcon: {
    fontSize: 24,
  },
  challengeTitle: {
    ...Typography.body,
    fontWeight: 'bold',
    color: Colors.nileBlue,
  },
  challengeTime: {
    ...Typography.bodySmall,
    color: Colors.text.tertiary,
  },
  challengeReward: {
    alignItems: 'flex-end',
  },
  challengeCoins: {
    ...Typography.bodySmall,
    fontWeight: 'bold',
    color: Colors.warning,
  },
  challengeProgress: {
    ...Typography.bodySmall,
    color: Colors.text.tertiary,
  },
  challengeProgressBar: {
    height: 6,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  challengeProgressFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: Colors.gold,
  },
  tournamentIconBg: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: Colors.warning,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tournamentLiveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 10,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
  },
  tournamentLiveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: Colors.error,
  },
  tournamentLiveText: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.error,
    letterSpacing: 0.5,
  },
  tournamentCard: {
    padding: Spacing.base,
    borderRadius: 18,
    overflow: 'hidden',
    position: 'relative',
  },
  tournamentStatusBadge: {
    position: 'absolute',
    top: Spacing.md,
    right: Spacing.md,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.sm,
  },
  tournamentStatusText: {
    fontSize: 9,
    fontWeight: '800',
    color: Colors.text.inverse,
    letterSpacing: 0.5,
  },
  tournamentTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: 14,
  },
  tournamentIcon: {
    fontSize: 32,
  },
  tournamentTitle: {
    ...Typography.bodyLarge,
    fontWeight: '700',
    color: Colors.text.inverse,
    marginBottom: 2,
  },
  tournamentPlayersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  tournamentParticipants: {
    ...Typography.bodySmall,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '500',
  },
  tournamentStatsRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: BorderRadius.md,
    padding: 10,
    marginBottom: Spacing.md,
  },
  tournamentStatBox: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing.xs,
  },
  tournamentStatBoxMiddle: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  tournamentStatBoxValue: {
    ...Typography.body,
    fontWeight: '700',
    color: Colors.text.inverse,
  },
  tournamentStatBoxLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '500',
  },
  tournamentCTA: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.gold,
    borderRadius: 10,
    paddingVertical: 10,
  },
  tournamentCTAText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.nileBlue,
  },
  tournamentEmptyCard: {
    alignItems: 'center',
    paddingVertical: Spacing['2xl'],
    paddingHorizontal: Spacing.lg,
    backgroundColor: '#F8FAFC',
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
  },
  tournamentEmptyTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 10,
    marginBottom: Spacing.xs,
  },
  tournamentEmptyText: {
    ...Typography.bodySmall,
    color: '#94A3B8',
    textAlign: 'center',
  },
  achievementsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  achievementCard: {
    width: (width - 44) / 2,
    padding: Spacing.base,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  achievementUnlocked: {
    backgroundColor: 'rgba(245,158,11,0.15)',
    borderColor: 'rgba(245,158,11,0.3)',
  },
  achievementLocked: {
    backgroundColor: Colors.background.secondary,
    borderColor: '#E2E8F0',
    opacity: 0.6,
  },
  achievementHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  achievementIcon: {
    fontSize: 32,
  },
  achievementTitle: {
    ...Typography.body,
    fontWeight: 'bold',
    color: Colors.nileBlue,
    marginBottom: Spacing.xs,
  },
  achievementCoins: {
    ...Typography.bodySmall,
    fontWeight: '600',
    color: Colors.warning,
  },
  achievementProgressContainer: {
    marginTop: Spacing.sm,
  },
  achievementProgressBar: {
    height: 4,
    backgroundColor: '#E2E8F0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  achievementProgressFill: {
    height: '100%',
    backgroundColor: Colors.gold,
    borderRadius: 2,
  },
  achievementProgressText: {
    fontSize: 10,
    color: Colors.text.tertiary,
    marginTop: Spacing.xs,
  },
  leaderboardCard: {
    padding: Spacing.xl,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    alignItems: 'center',
  },
  leaderboardTitle: {
    ...Typography.h4,
    fontWeight: 'bold',
    color: Colors.nileBlue,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  leaderboardText: {
    ...Typography.body,
    color: Colors.text.tertiary,
    textAlign: 'center',
    marginBottom: Spacing.base,
  },
  leaderboardButton: {
    borderRadius: BorderRadius['2xl'],
    overflow: 'hidden',
  },
  leaderboardButtonGradient: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
  },
  leaderboardButtonText: {
    ...Typography.body,
    fontWeight: '600',
    color: Colors.text.inverse,
  },
  whyRezCard: {
    padding: Spacing.base,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.border.default,
    backgroundColor: Colors.background.primary,
    ...Shadows.subtle,
  },
  whyRezTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: Colors.text.primary,
    textAlign: 'center',
    marginBottom: Spacing.base,
  },
  whyRezGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 10,
  },
  whyRezItem: {
    width: '48%',
    paddingVertical: Spacing.base,
    paddingHorizontal: 10,
    borderRadius: 14,
    backgroundColor: '#F5F3FF',
    alignItems: 'center',
    marginBottom: 2,
  },
  whyRezEmoji: {
    fontSize: 32,
    marginBottom: 10,
  },
  whyRezItemTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
    textAlign: 'center',
  },
  whyRezItemSubtitle: {
    fontSize: 11,
    color: Colors.text.tertiary,
    textAlign: 'center',
    lineHeight: 15,
  },
  bottomCTA: {
    position: 'absolute',
    bottom: 80,
    left: Spacing.base,
    right: Spacing.base,
  },
  bottomCTAGradient: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.base,
    borderRadius: BorderRadius.md,
  },
  bottomCTAContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  bottomCTATitle: {
    ...Typography.body,
    fontWeight: 'bold',
    color: Colors.text.inverse,
  },
  bottomCTASubtitle: {
    ...Typography.bodySmall,
    color: 'rgba(255,255,255,0.9)',
  },
  emptySection: {
    paddingVertical: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  emptySectionText: {
    ...Typography.body,
    color: Colors.text.tertiary,
    textAlign: 'center',
  },
  bonusOppCard: {
    backgroundColor: Colors.background.primary,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.background.secondary,
    ...Shadows.subtle,
  },
  bonusOppRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  bonusOppIcon: {
    fontSize: 24,
  },
  bonusOppTitle: {
    ...Typography.body,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 2,
  },
  bonusOppDesc: {
    ...Typography.bodySmall,
    color: Colors.text.tertiary,
  },
  bonusOppRight: {
    alignItems: 'flex-end',
    gap: Spacing.xs,
  },
  bonusOppReward: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.success,
  },
  bonusOppTimeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: Colors.background.secondary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  bonusOppUrgent: {
    backgroundColor: '#FEE2E2',
  },
  bonusOppTime: {
    fontSize: 10,
    color: Colors.text.tertiary,
    fontWeight: '600',
  },
});

export default PlayAndEarn;
