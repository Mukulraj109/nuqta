import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface StockIndicatorProps {
  stock: number;
  lowStockThreshold?: number;
}

export default function StockIndicator({ stock, lowStockThreshold = 10 }: StockIndicatorProps) {
  const getStockStatus = () => {
    if (stock === 0) {
      return {
        text: 'Out of Stock',
        color: '#dc2626',
        bgColor: '#fee2e2',
        dotColor: '#dc2626',
      };
    } else if (stock <= lowStockThreshold) {
      return {
        text: `Only ${stock} left in stock!`,
        color: '#d97706',
        bgColor: '#fef3c7',
        dotColor: '#f59e0b',
      };
    } else {
      return {
        text: 'In Stock',
        color: '#15803d',
        bgColor: '#dcfce7',
        dotColor: '#16a34a',
      };
    }
  };

  const status = getStockStatus();

  return (
    <View style={[styles.container, { backgroundColor: status.bgColor }]}>
      <View style={[styles.dot, { backgroundColor: status.dotColor }]} />
      <Text style={[styles.text, { color: status.color }]}>{status.text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginHorizontal: 16,
    marginVertical: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  text: {
    fontSize: 13,
    fontWeight: '600',
  },
});
