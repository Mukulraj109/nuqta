import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ChallengeTipsProps {
  action: string;
  difficulty?: string;
}

const getTipsForAction = (action: string, difficulty?: string): string[] => {
  const tips: Record<string, string[]> = {
    visit_stores: [
      '💡 Visit featured stores for bonus rewards',
      '⭐ Check store ratings to find the best ones',
      '📍 Use location filter to find nearby stores',
      '🎯 Combine with other challenges for extra coins',
    ],
    upload_bills: [
      '📸 Upload bills within 24 hours for bonus points',
      '✨ Ensure bill is clear and readable',
      '💰 Higher bill amounts = more cashback',
      '🔍 Double-check store and amount before submitting',
    ],
    refer_friends: [
      '🎁 Share your unique referral code',
      '📱 Send invites via WhatsApp for best results',
      '💫 Both you and your friend earn rewards',
      '🏆 Refer more friends for tier bonuses',
    ],
    review_count: [
      '⭐ Write detailed reviews for better engagement',
      '📸 Add photos to your reviews for extra visibility',
      '💬 Be honest and helpful to other users',
      '🎯 Review recent purchases first',
    ],
    order_count: [
      '🛍️ Shop during sale periods for extra savings',
      '💳 Use available vouchers before ordering',
      '📦 Track your orders for completion',
      '⚡ Repeat orders count towards challenges',
    ],
    share_deals: [
      '🎉 Share deals you\'ve actually tried',
      '👥 Post in active communities for more reach',
      '🔗 Use deep links for accurate tracking',
      '💬 Add your personal recommendation',
    ],
    explore_categories: [
      '🔍 Browse trending categories first',
      '🎯 Save favorite categories for quick access',
      '📊 Check "What\'s New" sections regularly',
      '✨ Discover hidden gems in niche categories',
    ],
    add_favorites: [
      '⭐ Favorite stores you visit frequently',
      '🔔 Get notified about special offers',
      '🎁 Access exclusive deals for favorite stores',
      '💝 Build your personalized shopping list',
    ],
    login_streak: [
      '📅 Set a daily reminder to open the app',
      '🌅 Log in at the same time each day',
      '🎯 Check daily challenges after logging in',
      '🔥 Maintain your streak for multiplier bonuses',
    ],
    purchase_amount: [
      '💰 Combine multiple items in one order',
      '🎫 Use cashback vouchers to increase savings',
      '⏰ Watch for flash sales and discounts',
      '📈 Track your progress towards the goal',
    ],
  };

  const baseTips = tips[action] || [
    '🎯 Complete this challenge to earn rewards',
    '⏰ Check the deadline to avoid missing out',
    '💪 Stay consistent for best results',
    '🌟 Every step counts towards your goal',
  ];

  // Add difficulty-specific tips
  if (difficulty === 'hard') {
    baseTips.unshift('🔥 Hard challenge = Big rewards! Take your time.');
  } else if (difficulty === 'easy') {
    baseTips.unshift('⚡ Quick win! Complete this for easy coins.');
  }

  return baseTips.slice(0, 3); // Return top 3 tips
};

export default function ChallengeTips({ action, difficulty }: ChallengeTipsProps) {
  const tips = getTipsForAction(action, difficulty);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="bulb" size={20} color="#F59E0B" />
        <Text style={styles.title}>Pro Tips</Text>
      </View>
      <View style={styles.tipsContainer}>
        {tips.map((tip, index) => (
          <View key={index} style={styles.tipItem}>
            <View style={styles.tipBullet}>
              <View style={styles.tipDot} />
            </View>
            <Text style={styles.tipText}>{tip}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFBEB',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FDE68A',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 1,
      },
      web: {
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
      },
    }),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#92400E',
  },
  tipsContainer: {
    gap: 12,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  tipBullet: {
    paddingTop: 6,
  },
  tipDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#F59E0B',
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: '#78350F',
    lineHeight: 20,
  },
});
