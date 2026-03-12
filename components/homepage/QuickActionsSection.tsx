import React, { memo, useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  Platform,
  Text,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

// Color themes for each action - Nuqta palette
const ACTION_THEMES = {
  voucher: {
    iconBg: '#faf1e0',      // Linen
    iconColor: '#1a3a52',    // Nile Blue
    descBg: '#faf1e0',
    descColor: '#1a3a52',
  },
  wallet: {
    iconBg: '#dfebf7',      // Lavender Mist
    iconColor: '#1a3a52',    // Nile Blue
    descBg: '#dfebf7',
    descColor: '#1a3a52',
  },
  offers: {
    iconBg: '#ffd7b5',      // Light Peach
    iconColor: '#1a3a52',    // Nile Blue
    descBg: '#ffd7b5',
    descColor: '#1a3a52',
  },
  store: {
    iconBg: '#ffcd57',      // Light Mustard
    iconColor: '#1a3a52',    // Nile blue
    descBg: '#ffcd57',
    descColor: '#1a3a52',
  },
};

interface QuickActionsSectionProps {
  voucherCount?: number;
  walletBalance?: number;
  newOffersCount?: number;
}

interface QuickActionItem {
  id: 'voucher' | 'wallet' | 'offers' | 'store';
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  route: string;
  description: string;
}

const QUICK_ACTIONS: QuickActionItem[] = [
  {
    id: 'voucher',
    title: 'Voucher',
    icon: 'ticket-outline',
    route: '/my-vouchers',
    description: 'Use & save',
  },
  {
    id: 'wallet',
    title: 'Wallet',
    icon: 'wallet-outline',
    route: '/wallet-screen',
    description: 'Your rewards',
  },
  {
    id: 'offers',
    title: 'Offers',
    icon: 'pricetag-outline',
    route: '/offers',
    description: 'Extra savings',
  },
  {
    id: 'store',
    title: 'Store',
    icon: 'storefront-outline',
    route: '/Store',
    description: 'Nearby',
  },
];

function QuickActionsSection({
  voucherCount = 0,
  walletBalance = 0,
  newOffersCount = 0,
}: QuickActionsSectionProps) {
  const router = useRouter();

  const handlePress = useCallback((route: string) => {
    router.push(route as any);
  }, [router]);

  const renderValue = (actionId: string) => {
    const greyBg = '#F3F4F6';
    const greyText = '#6B7280';

    switch (actionId) {
      case 'voucher':
        return (
          <View style={[styles.valuePill, { backgroundColor: greyBg }]}>
            <Text style={[styles.valueNumber, { color: greyText }]}>{voucherCount}</Text>
            <Text style={[styles.valueLabel, { color: greyText }]}>New</Text>
          </View>
        );
      case 'wallet':
        return (
          <View style={[styles.valuePill, styles.walletPill, { backgroundColor: greyBg }]}>
            <Text style={[styles.valueText, { color: greyText }]}>Load</Text>
            <View style={[styles.plusButton, { backgroundColor: greyText }]}>
              <Ionicons name="add" size={10} color="#FFFFFF" />
            </View>
          </View>
        );
      case 'offers':
        return (
          <View style={[styles.valuePill, { backgroundColor: greyBg }]}>
            <Text style={[styles.valueNumber, { color: greyText }]}>{newOffersCount}</Text>
            <Text style={[styles.valueLabel, { color: greyText }]}>New</Text>
          </View>
        );
      case 'store':
        return (
          <View style={[styles.valuePill, { backgroundColor: greyBg }]}>
            <Text style={[styles.valueText, { color: greyText }]}>Explore</Text>
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.actionsRow}>
        {QUICK_ACTIONS.map((action) => {
          const theme = ACTION_THEMES[action.id];
          return (
            <Pressable
              key={action.id}
              style={styles.actionItem}
              onPress={() => handlePress(action.route)}

            >
              <View style={[styles.iconContainer, { backgroundColor: theme.iconBg }]}>
                <Ionicons name={action.icon} size={22} color={theme.iconColor} />
              </View>
              <Text style={styles.actionTitle}>{action.title}</Text>
              {renderValue(action.id)}
              <View style={[styles.descriptionPill, { backgroundColor: theme.descBg }]}>
                <Text style={[styles.actionDescription, { color: theme.descColor }]}>
                  {action.description}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export default memo(QuickActionsSection);

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 14,
    backgroundColor: '#FFFFFF',
    marginTop: -4,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'stretch',
    gap: 8,
  },
  actionItem: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 2,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  actionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1a3a52',
    textAlign: 'center',
    marginBottom: 4,
  },
  valuePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginBottom: 4,
  },
  valueNumber: {
    fontSize: 12,
    fontWeight: '700',
  },
  valueLabel: {
    fontSize: 10,
    fontWeight: '600',
  },
  valueText: {
    fontSize: 11,
    fontWeight: '600',
  },
  walletPill: {
    paddingRight: 4,
  },
  plusButton: {
    width: 16,
    height: 16,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  descriptionPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginTop: 2,
  },
  actionDescription: {
    fontSize: 9,
    fontWeight: '500',
    textAlign: 'center',
  },
});
