import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { StockStatus } from '@/types/product-variants.types';

/**
 * StockBadge Component
 *
 * Visual indicator for product stock status
 * Shows different colors and icons based on availability
 */
interface StockBadgeProps {
  status: StockStatus;
  quantity?: number;
  showIcon?: boolean;
  size?: 'small' | 'medium' | 'large';
  style?: any;
}

export const StockBadge: React.FC<StockBadgeProps> = ({
  status,
  quantity,
  showIcon = true,
  size = 'medium',
  style,
}) => {
  /**
   * Get badge configuration based on stock status
   */
  const getBadgeConfig = () => {
    switch (status) {
      case 'in_stock':
        return {
          icon: 'checkmark-circle',
          iconColor: '#10B981',
          backgroundColor: '#D1FAE5',
          textColor: '#065F46',
          label: 'In Stock',
        };
      case 'low_stock':
        return {
          icon: 'warning',
          iconColor: '#F59E0B',
          backgroundColor: '#FEF3C7',
          textColor: '#92400E',
          label: quantity ? `Only ${quantity} left` : 'Low Stock',
        };
      case 'out_of_stock':
        return {
          icon: 'close-circle',
          iconColor: '#EF4444',
          backgroundColor: '#FEE2E2',
          textColor: '#991B1B',
          label: 'Out of Stock',
        };
      case 'preorder':
        return {
          icon: 'time',
          iconColor: '#8B5CF6',
          backgroundColor: '#EDE9FE',
          textColor: '#5B21B6',
          label: 'Pre-order',
        };
      default:
        return {
          icon: 'help-circle',
          iconColor: '#6B7280',
          backgroundColor: '#F3F4F6',
          textColor: '#374151',
          label: 'Unknown',
        };
    }
  };

  const config = getBadgeConfig();

  // Size configurations
  const sizeConfig = {
    small: {
      containerPadding: { paddingHorizontal: 8, paddingVertical: 4 },
      iconSize: 12,
      fontSize: 11,
      borderRadius: 6,
      gap: 4,
    },
    medium: {
      containerPadding: { paddingHorizontal: 10, paddingVertical: 6 },
      iconSize: 14,
      fontSize: 13,
      borderRadius: 8,
      gap: 6,
    },
    large: {
      containerPadding: { paddingHorizontal: 12, paddingVertical: 8 },
      iconSize: 16,
      fontSize: 14,
      borderRadius: 10,
      gap: 8,
    },
  };

  const currentSize = sizeConfig[size];

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: config.backgroundColor,
          ...currentSize.containerPadding,
          borderRadius: currentSize.borderRadius,
          gap: currentSize.gap,
        },
        style,
      ]}
      accessibilityRole="text"
      accessibilityLabel={`Stock status: ${config.label}`}
    >
      {showIcon && (
        <Ionicons
          name={config.icon as any}
          size={currentSize.iconSize}
          color={config.iconColor}
        />
      )}
      <ThemedText
        style={[
          styles.text,
          {
            color: config.textColor,
            fontSize: currentSize.fontSize,
          },
        ]}
      >
        {config.label}
      </ThemedText>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  text: {
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});

export default StockBadge;
