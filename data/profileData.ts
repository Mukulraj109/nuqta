// Profile System Mock Data
// Dummy data for profile menu, user information, and related components

import { BRAND } from '@/constants/brand';
import {
  User,
  ProfileMenuItem,
  ProfileMenuSection,
  ProfileIconGridItem,
  ProfileMenuListItem,
  PROFILE_COLORS 
} from '@/types/profile.types';

// Mock User Data
export const mockUser: User = {
  id: 'user_123',
  name: 'Sarah Johnson',
  email: 'sarah.johnson@example.com',
  avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
  initials: 'SJ',
  phone: '+1 234 567 8900',
  joinDate: '2024-01-15T10:30:00Z',
  isVerified: true,
  preferences: {
    notifications: {
      push: true,
      email: true,
      sms: false,
      orderUpdates: true,
      promotions: false,
      reminders: true,
    },
    privacy: {
      profileVisible: true,
      showActivity: false,
      allowMessaging: true,
      dataSharing: false,
    },
    display: {
      theme: 'auto',
      language: 'en',
      currency: 'USD',
      timezone: 'America/New_York',
    },
  },
};

// Profile Menu Items (as shown in screenshot 1)
export const profileMenuSections: ProfileMenuSection[] = [
  {
    id: 'main_menu',
    items: [
      {
        id: 'wallet',
        title: 'Wallet',
        icon: 'wallet-outline',
        route: '/wallet-screen',
        isEnabled: true,
        showArrow: true,
      },
      {
        id: 'track_orders',
        title: 'Track Orders',
        icon: 'location-outline',
        route: '/tracking',
        isEnabled: true,
        showArrow: true,
      },
      {
        id: 'offers',
        title: 'Offers',
        icon: 'pricetag-outline',
        route: '/offers',
        badge: 'NEW',
        isEnabled: true,
        showArrow: true,
      },
      {
        id: 'store',
        title: 'Store',
        icon: 'storefront-outline',
        route: '/store',
        isEnabled: true,
        showArrow: true,
      },
      {
        id: 'order_trx',
        title: 'Order Trx',
        icon: 'receipt-outline',
        route: '/order-history',
        isEnabled: true,
        showArrow: true,
      },
      {
        id: 'bookings',
        title: 'My Bookings',
        icon: 'calendar-outline',
        route: '/my-bookings',
        isEnabled: true,
        showArrow: true,
      },
      {
        id: 'my_events',
        title: 'My Events',
        icon: 'ticket-outline',
        route: '/my-events',
        isEnabled: true,
        showArrow: true,
      },
      {
        id: 'account',
        title: 'Account',
        icon: 'person-outline',
        route: '/account',
        isEnabled: true,
        showArrow: true,
      },
      {
        id: 'profile',
        title: 'Profile',
        icon: 'person-circle-outline',
        route: '/profile',
        isEnabled: true,
        showArrow: true,
        dividerAfter: true,
      },
    ],
  },
  {
    id: 'premium_section',
    items: [
      {
        id: 'subscription',
        title: 'Premium Membership',
        icon: 'diamond-outline',
        route: '/subscription/plans',
        badge: 'NEW',
        description: 'Upgrade for 2x cashback & exclusive benefits',
        isEnabled: true,
        showArrow: true,
      },
      {
        id: 'bill-upload',
        title: 'Upload Bill',
        icon: 'document-text-outline',
        route: '/bill-upload',
        badge: 'NEW',
        description: 'Earn cashback from offline purchases',
        isEnabled: true,
        showArrow: true,
      },
      {
        id: 'referrals',
        title: 'Refer & Earn',
        icon: 'gift-outline',
        route: '/referral',
        description: 'Share with friends, earn rewards',
        isEnabled: true,
        showArrow: true,
      },
      {
        id: 'games',
        title: 'Games',
        icon: 'game-controller-outline',
        route: '/games',
        description: 'Play games and earn rewards',
        isEnabled: false,
        showArrow: true,
      },
      {
        id: 'tasks',
        title: 'Tasks',
        icon: 'flag-outline',
        route: '/challenges',
        description: 'Complete tasks and earn coins',
        isEnabled: false,
        showArrow: true,
      },
      {
        id: 'vouchers',
        title: 'My Vouchers',
        icon: 'ticket-outline',
        route: '/my-vouchers',
        description: 'View and redeem your vouchers',
        isEnabled: true,
        showArrow: true,
      },
      {
        id: 'reviews',
        title: 'My Reviews',
        icon: 'star-outline',
        route: '/my-reviews',
        description: 'View your submitted reviews',
        isEnabled: true,
        showArrow: true,
      },
      {
        id: 'badges',
        title: 'Badges',
        icon: 'trophy-outline',
        route: '/profile/achievements',
        description: 'View your achievements',
        isEnabled: true,
        showArrow: true,
        dividerAfter: true,
      },
    ],
  },
  {
    id: 'support_section',
    items: [
      {
        id: 'change_password',
        title: 'Change Password',
        icon: 'key-outline',
        route: '/account/change-password',
        isEnabled: true,
        showArrow: true,
      },
      {
        id: 'help_support',
        title: 'Help & Support',
        icon: 'help-circle-outline',
        route: '/support',
        description: 'Get help and contact support',
        isEnabled: true,
        showArrow: true,
      },
      {
        id: 'feedback',
        title: 'Give Feedback',
        icon: 'chatbox-outline',
        route: '/support/feedback',
        description: 'Share your thoughts with us',
        isEnabled: true,
        showArrow: true,
        dividerAfter: true,
      },
    ],
  },
  {
    id: 'legal_section',
    items: [
      {
        id: 'about',
        title: `About ${BRAND.APP_NAME}`,
        icon: 'information-circle-outline',
        route: '/legal/about',
        isEnabled: true,
        showArrow: true,
      },
      {
        id: 'terms',
        title: 'Terms & Conditions',
        icon: 'document-text-outline',
        route: '/legal/terms',
        isEnabled: true,
        showArrow: true,
      },
      {
        id: 'privacy',
        title: 'Privacy Policy',
        icon: 'shield-checkmark-outline',
        route: '/legal/privacy',
        isEnabled: true,
        showArrow: true,
      },
      {
        id: 'refund_policy',
        title: 'Refund Policy',
        icon: 'refresh-circle-outline',
        route: '/legal/refund-policy',
        isEnabled: true,
        showArrow: true,
      },
    ],
  },
];

// Profile Page Icon Grid (as shown in screenshot 4)
export const profileIconGridItems: ProfileIconGridItem[] = [
  {
    id: 'product',
    title: 'Product',
    icon: 'cube-outline',
    color: PROFILE_COLORS.white,
    backgroundColor: PROFILE_COLORS.primary,
    route: '/products',
    count: 0,
  },
  {
    id: 'service',
    title: 'Service',
    icon: 'construct-outline',
    color: PROFILE_COLORS.white,
    backgroundColor: '#ffcd57',
    route: '/services',
    count: 0,
  },
  {
    id: 'voucher',
    title: 'Voucher',
    icon: 'ticket-outline',
    color: PROFILE_COLORS.white,
    backgroundColor: '#F59E0B',
    route: '/vouchers',
    count: 0,
  },
  {
    id: 'earns',
    title: 'Earns',
    icon: 'diamond-outline',
    color: PROFILE_COLORS.white,
    backgroundColor: '#EC4899',
    route: '/earnings',
    count: 0,
  },
];

// Profile Page Menu List (as shown in screenshot 4)
export const profileMenuListItems: ProfileMenuListItem[] = [
  {
    id: 'categories',
    title: 'Categories',
    icon: 'grid-outline',
    route: '/categories',
    description: 'Browse all product and service categories',
    showArrow: true,
  },
  {
    id: 'play_and_earn',
    title: 'Play & Earn',
    icon: 'game-controller-outline',
    route: '/(tabs)/play',
    description: 'Play games and earn rewards',
    showArrow: true,
  },
  {
    id: 'order_transaction_history',
    title: 'Order/Transaction History',
    icon: 'time-outline',
    route: '/history',
    description: 'View all your past orders and transactions',
    showArrow: true,
  },
  {
    id: 'bookings',
    title: 'My Bookings',
    icon: 'calendar-outline',
    route: '/BookingsPage',
    description: 'View all your event bookings',
    showArrow: true,
  },
  {
    id: 'my_visits',
    title: 'My Store Visits',
    icon: 'storefront-outline',
    route: '/my-visits',
    description: 'View your scheduled and past store visits',
    showArrow: true,
  },
  {
    id: 'incomplete_transaction',
    title: 'Incomplete Transaction',
    icon: 'warning-outline',
    route: '/incomplete',
    badge: '2',
    showArrow: true,
  },
  {
    id: 'home_delivery',
    title: 'Home Delivery',
    icon: 'home-outline',
    route: '/delivery',
    showArrow: true,
  },
  {
    id: 'group_buy',
    title: 'Group Buy',
    icon: 'people-outline',
    route: '/group-buy',
    isNew: true,
    showArrow: true,
  },
  {
    id: 'order_tracking',
    title: 'Order Tracking',
    icon: 'location-outline',
    route: '/tracking',
    showArrow: true,
  },
  {
    id: 'nuqtacoin',
    title: BRAND.COIN_NAME,
    icon: 'diamond',
    route: '/wallet',
    showArrow: true,
  },
  {
    id: 'store_promo_coins',
    title: 'Store Promo Coins',
    icon: 'diamond',
    route: '/profile/store-promo-coins',
    description: 'View your store-specific promo coins',
    isNew: true,
    showArrow: true,
  },
  {
    id: 'review',
    title: 'Review',
    icon: 'star-outline',
    route: '/reviews',
    showArrow: true,
  },
  {
    id: 'social_media',
    title: 'Social media',
    icon: 'share-social-outline',
    route: '/social',
    showArrow: true,
  },
  {
    id: 'achievements',
    title: 'Achievements & Badges',
    icon: 'trophy-outline',
    route: '/profile/achievements',
    description: 'View your unlocked achievements and progress',
    showArrow: true,
  },
  {
    id: 'bill_upload',
    title: 'Bill Upload',
    icon: 'document-text-outline',
    route: '/bill-upload',
    description: 'Upload offline bills to earn cashback',
    isNew: true,
    showArrow: true,
  },
  {
    id: 'subscription',
    title: 'Premium Membership',
    icon: 'diamond-outline',
    route: '/subscription/plans',
    description: 'Unlock exclusive benefits and rewards',
    isNew: true,
    showArrow: true,
  },
  {
    id: 'saved_addresses',
    title: 'Saved Addresses',
    icon: 'location-outline',
    route: '/account/addresses',
    description: 'Manage your delivery addresses',
    showArrow: true,
  },
  {
    id: 'notification_preferences',
    title: 'Notification Preferences',
    icon: 'notifications-outline',
    route: '/account/notifications',
    description: 'Control what alerts you receive',
    showArrow: true,
  },
];

// Profile Statistics (for display)
export const profileStats = {
  totalOrders: 127,
  totalSpent: 4250.00,
  totalSaved: 320.50,
  loyaltyPoints: 1875,
  referrals: 8,
  reviewsGiven: 45,
  wishlistItems: 23,
  favoriteStores: 12,
};

// Recent Activity (for profile page)
export const recentActivity = [
  {
    id: 'activity_1',
    type: 'ORDER',
    title: 'Order delivered successfully',
    description: 'Fashion items from Trendy Store',
    amount: 129.99,
    date: '2025-08-18T14:30:00Z',
    icon: 'checkmark-circle',
    color: '#ffcd57',
  },
  {
    id: 'activity_2',
    type: 'CASHBACK',
    title: 'Cashback earned',
    description: 'From your recent purchase',
    amount: 12.50,
    date: '2025-08-18T14:35:00Z',
    icon: 'cash',
    color: '#F59E0B',
  },
  {
    id: 'activity_3',
    type: 'REVIEW',
    title: 'Review submitted',
    description: 'Thank you for your feedback!',
    date: '2025-08-17T16:20:00Z',
    icon: 'star',
    color: '#EC4899',
  },
];

// Achievement Badges
export const achievementBadges = [
  {
    id: 'badge_1',
    title: 'Frequent Buyer',
    description: 'Made 50+ purchases',
    icon: 'medal',
    color: '#F59E0B',
    unlocked: true,
    unlockedDate: '2025-07-15T10:00:00Z',
  },
  {
    id: 'badge_2',
    title: 'Review Master',
    description: 'Written 25+ reviews',
    icon: 'star',
    color: '#EC4899',
    unlocked: true,
    unlockedDate: '2025-08-01T12:00:00Z',
  },
  {
    id: 'badge_3',
    title: 'Early Bird',
    description: 'Joined in the first month',
    icon: 'time',
    color: '#ffcd57',
    unlocked: true,
    unlockedDate: '2024-01-15T10:30:00Z',
  },
  {
    id: 'badge_4',
    title: 'Big Spender',
    description: 'Spend $5000+ in a year',
    icon: 'diamond',
    color: '#8B5CF6',
    unlocked: false,
    progress: 85, // 85% towards goal
  },
];

// Quick Actions (for profile header)
export const quickActions = [
  {
    id: 'scan_qr',
    title: 'Scan QR',
    icon: 'qr-code-outline',
    action: 'SCAN_QR',
  },
  {
    id: 'share_profile',
    title: 'Share',
    icon: 'share-outline',
    action: 'SHARE_PROFILE',
  },
  {
    id: 'notifications',
    title: 'Notifications',
    icon: 'notifications-outline',
    action: 'OPEN_NOTIFICATIONS',
    badge: 3,
  },
  {
    id: 'favorites',
    title: 'Favorites',
    icon: 'heart-outline',
    action: 'OPEN_FAVORITES',
  },
];

// API Mock Functions
export const fetchUserProfile = async (userId: string): Promise<User> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  return mockUser;
};

export const updateUserProfile = async (userId: string, updates: Partial<User>): Promise<User> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 800));
  
  // In real app, this would update the user on the server
  return { ...mockUser, ...updates };
};

export const fetchProfileStats = async (userId: string) => {
  await new Promise(resolve => setTimeout(resolve, 300));
  return profileStats;
};

export const fetchRecentActivity = async (userId: string) => {
  await new Promise(resolve => setTimeout(resolve, 400));
  return recentActivity;
};

export const fetchAchievements = async (userId: string) => {
  await new Promise(resolve => setTimeout(resolve, 200));
  return achievementBadges;
};

// Helper functions
export const getUserInitials = (name: string): string => {
  return name
    .split(' ')
    .map(part => part.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

export const formatJoinDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};
