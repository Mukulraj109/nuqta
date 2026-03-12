/**
 * StickySearchHeader Component
 *
 * A sticky search bar with glass/blur effect that appears when scrolling
 * Includes the category tab bar below it
 */

import React, { useState, useEffect, useCallback, useMemo, memo, useRef } from 'react';
import {
  View,
  TextInput,
  Pressable,
  StyleSheet,
  Platform,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CategoryTabBar from './CategoryTabBar';

interface StickySearchHeaderProps {
  /** Current scroll position for animation */
  scrollY: Animated.Value;
  /** Threshold to show sticky header */
  showThreshold?: number;
  /** Callback when search is pressed */
  onSearchPress?: () => void;
  /** Currently selected category */
  selectedCategory?: string;
  /** Callback when category changes */
  onCategoryChange?: (categoryId: string) => void;
}

// Memoized header content component to prevent re-renders
const HeaderContentComponent = memo<{
  paddingTop: number;
  onSearchPress: () => void;
  selectedCategory?: string;
  onCategoryChange?: (categoryId: string) => void;
}>(({ paddingTop, onSearchPress, selectedCategory, onCategoryChange }) => {
  return (
    <View style={[styles.headerContent, { paddingTop }]}>
      {/* Search Bar */}
      <Pressable
        style={styles.searchContainer}
        onPress={onSearchPress}
       
        accessibilityLabel="Search bar"
        accessibilityRole="search"
      >
        <Ionicons name="search" size={18} color="#666" style={styles.searchIcon} />
        <TextInput
          style={[styles.searchInput, { pointerEvents: 'none' }]}
          placeholder="Search for stores, products..."
          placeholderTextColor="#999"
          editable={false}
        />
      </Pressable>

      {/* Category Tab Bar */}
      <CategoryTabBar
        selectedCategory={selectedCategory}
        onCategorySelect={onCategoryChange}
        isSticky={false}
        style={styles.categoryBar}
      />
    </View>
  );
});

const StickySearchHeader: React.FC<StickySearchHeaderProps> = ({
  scrollY,
  showThreshold = 200,
  onSearchPress,
  selectedCategory,
  onCategoryChange,
}) => {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Use state to track visibility for pointer events
  const [isVisible, setIsVisible] = React.useState(false);
  const isVisibleRef = useRef(false);
  const containerRef = useRef<View>(null);

  // Listen to scroll position to toggle pointer events
  // Only call setState when visibility actually changes to avoid re-renders on every scroll frame
  useEffect(() => {
    const listenerId = scrollY.addListener(({ value }) => {
      const shouldBeVisible = value >= showThreshold;
      if (shouldBeVisible !== isVisibleRef.current) {
        isVisibleRef.current = shouldBeVisible;
        setIsVisible(shouldBeVisible);
      }
      // Also update directly for web
      if (Platform.OS === 'web' && containerRef.current) {
        (containerRef.current as any).style.pointerEvents = shouldBeVisible ? 'auto' : 'none';
      }
    });
    return () => scrollY.removeListener(listenerId);
  }, [scrollY, showThreshold]);

  // Memoize animated values to prevent recreation
  const headerOpacity = useMemo(
    () =>
      scrollY.interpolate({
        inputRange: [showThreshold - 50, showThreshold],
        outputRange: [0, 1],
        extrapolate: 'clamp',
      }),
    [scrollY, showThreshold]
  );

  const headerTranslateY = useMemo(
    () =>
      scrollY.interpolate({
        inputRange: [showThreshold - 50, showThreshold],
        outputRange: [-20, 0],
        extrapolate: 'clamp',
      }),
    [scrollY, showThreshold]
  );

  // Memoize handlers to prevent recreation
  const handleSearchPress = useCallback(() => {
    if (onSearchPress) {
      onSearchPress();
    } else {
      if (Platform.OS === 'ios') {
        setTimeout(() => router.push('/search'), 50);
      } else {
        router.push('/search');
      }
    }
  }, [onSearchPress, router]);

  // Calculate padding top
  const paddingTop = insets.top + 8;

  // Don't render anything when not visible to avoid blocking touches
  if (!isVisible) {
    return null;
  }

  // Native platforms with blur
  if (Platform.OS !== 'web') {
    return (
      <Animated.View
        style={[
          styles.container,
          {
            opacity: headerOpacity,
            transform: [{ translateY: headerTranslateY }],
            pointerEvents: 'box-none',
          },
        ]}
      >
        <BlurView
          intensity={90}
          tint="light"
          style={[styles.blurContainer, { pointerEvents: 'auto' }]}
        >
          <HeaderContentComponent
            paddingTop={paddingTop}
            onSearchPress={handleSearchPress}
            selectedCategory={selectedCategory}
            onCategoryChange={onCategoryChange}
          />
        </BlurView>
      </Animated.View>
    );
  }

  // Web version with CSS backdrop-filter
  return (
    <Animated.View
      ref={containerRef as any}
      style={[
        styles.container,
        styles.webContainer,
        {
          opacity: headerOpacity,
          transform: [{ translateY: headerTranslateY }],
          pointerEvents: 'box-none',
        },
      ]}
    >
      <View style={[styles.contentWrapper, { pointerEvents: 'auto' }]}>
        <HeaderContentComponent
          paddingTop={paddingTop}
          onSearchPress={handleSearchPress}
          selectedCategory={selectedCategory}
          onCategoryChange={onCategoryChange}
        />
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  blurContainer: {
    overflow: 'hidden',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 205, 87, 0.1)',
  },
  webContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 205, 87, 0.1)',
    ...Platform.select({
      web: {
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        boxShadow: '0 4px 20px rgba(26, 58, 82, 0.08)',
      } as any,
    }),
  },
  headerContent: {
    paddingBottom: 0,
  },
  contentWrapper: {
    // Wrapper to contain pointer events within the actual content
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(247, 250, 252, 0.9)',
    marginHorizontal: 16,
    marginBottom: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 205, 87, 0.15)',
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#1a3a52',
    fontFamily: Platform.select({
      ios: 'Inter-Regular',
      android: 'Inter-Regular',
      default: undefined,
    }),
  },
  categoryBar: {
    backgroundColor: 'transparent',
    borderBottomWidth: 0,
  },
});

// Memoize component to prevent unnecessary re-renders
export default memo(StickySearchHeader, (prevProps, nextProps) => {
  // Only re-render if props actually change
  return (
    prevProps.showThreshold === nextProps.showThreshold &&
    prevProps.selectedCategory === nextProps.selectedCategory &&
    prevProps.onSearchPress === nextProps.onSearchPress &&
    prevProps.onCategoryChange === nextProps.onCategoryChange
  );
});

export { StickySearchHeader };
