/**
 * OffersTabs Component
 *
 * Tab navigation for Offers, Cashback, Exclusive
 * ReZ brand styling with pill-style tabs
 */

import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useOffersTheme } from '@/contexts/OffersThemeContext';
import { OffersTabType } from '@/types/offers.types';
import { Spacing, BorderRadius, Typography, Colors, Shadows } from '@/constants/DesignSystem';

// New Color Palette
const PALETTE = {
  nileBlue: '#1a3a52',
  lightMustard: '#ffcd57',
  linen: '#faf1e0',
  lightPeach: '#ffd7b5',
  lavenderMist: '#dfebf7',
};

interface OffersTabsProps {
  activeTab: OffersTabType;
  onTabChange: (tab: OffersTabType) => void;
}

interface TabConfig {
  id: OffersTabType;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  activeIcon: keyof typeof Ionicons.glyphMap;
  color: string;
}

const tabs: TabConfig[] = [
  {
    id: 'offers',
    label: 'Offers',
    icon: 'pricetag-outline',
    activeIcon: 'pricetag',
    color: PALETTE.nileBlue,
  },
  {
    id: 'cashback',
    label: 'Cashback',
    icon: 'cash-outline',
    activeIcon: 'cash',
    color: PALETTE.lightMustard,
  },
  {
    id: 'exclusive',
    label: 'Exclusive',
    icon: 'star-outline',
    activeIcon: 'star',
    color: PALETTE.lightPeach,
  },
];

export const OffersTabs: React.FC<OffersTabsProps> = ({
  activeTab,
  onTabChange,
}) => {
  const { theme, isDark } = useOffersTheme();

  const styles = StyleSheet.create({
    container: {
      flexDirection: 'row',
      marginHorizontal: Spacing.base,
      marginTop: Spacing.sm,
      marginBottom: Spacing.md,
      backgroundColor: isDark ? theme.colors.background.secondary : PALETTE.lavenderMist,
      borderRadius: BorderRadius.lg,
      padding: 4,
    },
    tab: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 12,
      borderRadius: BorderRadius.md,
      gap: 6,
    },
    tabActive: {
      backgroundColor: isDark ? theme.colors.background.card : '#FFFFFF',
      ...Shadows.subtle,
    },
    iconContainer: {
      width: 22,
      height: 22,
      borderRadius: 6,
      alignItems: 'center',
      justifyContent: 'center',
    },
    label: {
      fontSize: 13,
      fontWeight: '600',
      letterSpacing: -0.2,
    },
    labelActive: {
      fontWeight: '700',
    },
  });

  return (
    <View style={styles.container}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <Pressable
            key={tab.id}
            style={[styles.tab, isActive && styles.tabActive]}
            onPress={() => onTabChange(tab.id)}
           
          >
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: isActive ? `${tab.color}15` : 'transparent' }
              ]}
            >
              <Ionicons
                name={isActive ? tab.activeIcon : tab.icon}
                size={16}
                color={isActive ? tab.color : theme.colors.text.tertiary}
              />
            </View>
            <Text
              style={[
                styles.label,
                { color: isActive ? tab.color : theme.colors.text.tertiary },
                isActive && styles.labelActive,
              ]}
            >
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
};

export default OffersTabs;
