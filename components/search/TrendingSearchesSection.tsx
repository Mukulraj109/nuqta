import React from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TrendingSearch } from '@/services/searchDiscoveryApi';

interface TrendingSearchesSectionProps {
  searches: TrendingSearch[];
  onPress: (query: string) => void;
}

function TrendingSearchesSection({
  searches,
  onPress,
}: TrendingSearchesSectionProps) {
  if (!searches || searches.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="flame" size={20} color="#ffcd57" />
        <Text style={styles.headerText}>Trending on ReZ</Text>
      </View>

      <View style={styles.list}>
        {searches.map((search, index) => (
          <Pressable
            key={search._id || index}
            style={styles.item}
            onPress={() => onPress(search.query)}
           
          >
            <Ionicons name="trending-up-outline" size={18} color="#1a3a52" style={styles.itemIcon} />
            <Text style={styles.itemText} numberOfLines={1}>
              {search.query}
            </Text>
            <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 24,
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
    gap: 8,
  },
  headerText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a3a52',
  },
  list: {
    paddingHorizontal: 16,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(26, 58, 82, 0.08)',
  },
  itemIcon: {
    marginRight: 12,
  },
  itemText: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
});

export default React.memo(TrendingSearchesSection);
