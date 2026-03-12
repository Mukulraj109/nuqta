import React from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SearchHistoryItem } from '@/services/searchHistoryService';

interface RecentSearchesProps {
  searches: SearchHistoryItem[];
  onSearchPress: (query: string) => void;
  onRemoveSearch: (id: string) => void;
  onClearAll: () => void;
}

export default function RecentSearches({
  searches,
  onSearchPress,
  onRemoveSearch,
  onClearAll,
}: RecentSearchesProps) {
  if (searches.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="time-outline" size={18} color="#1a3a52" />
          <Text style={styles.title}>Recent Searches</Text>
        </View>
        <Pressable onPress={onClearAll}>
          <Text style={styles.clearText}>Clear All</Text>
        </Pressable>
      </View>

      {/* Search Items */}
      <View style={styles.itemsContainer}>
        {searches.map((search) => (
          <Pressable
            key={search.id}
            style={styles.searchItem}
            onPress={() => onSearchPress(search.query)}
          >
            <View style={styles.searchLeft}>
              <Ionicons name="search-outline" size={16} color="#1a3a52" />
              <Text style={styles.searchQuery}>{search.query}</Text>
              {search.resultCount > 0 && (
                <Text style={styles.resultCount}>({search.resultCount})</Text>
              )}
            </View>
            <Pressable
              onPress={() => onRemoveSearch(search.id)}
              hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
            >
              <Ionicons name="close-outline" size={18} color="#9CA3AF" />
            </Pressable>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1a3a52',
  },
  clearText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1a3a52',
  },
  itemsContainer: {
    gap: 8,
  },
  searchItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
  },
  searchLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  searchQuery: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '500',
    flex: 1,
  },
  resultCount: {
    fontSize: 12,
    color: '#9CA3AF',
  },
});

