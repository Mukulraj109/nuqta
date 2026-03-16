/**
 * Lazy Section Component
 *
 * Loads section content only when visible in the viewport.
 * - Web: IntersectionObserver
 * - Native: onLayout + scrollY comparison
 *
 * Performance: Each section registers a scroll listener that self-removes
 * once visible (sections are keepMounted by default, so they never need
 * to re-check). This keeps active listeners to a minimum during scroll.
 */

import React, { ReactNode, useRef, useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, Animated, Platform, Dimensions, ViewStyle, LayoutChangeEvent } from 'react-native';
const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface LazySectionProps {
  sectionId: string;
  renderSection: () => ReactNode;
  height?: number;
  threshold?: number;
  rootMargin?: number;
  onVisible?: () => void;
  unloadWhenOffscreen?: boolean;
  keepMounted?: boolean;
  style?: ViewStyle;
  placeholder?: ReactNode;
  /** Parent ScrollView's scroll position (Animated.Value) - required for native viewport detection */
  scrollY?: Animated.Value;
}

/**
 * Web implementation using IntersectionObserver
 */
function useLazySectionWeb(
  ref: React.RefObject<View>,
  threshold: number,
  rootMargin: number,
  onVisible?: () => void,
): boolean {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (Platform.OS !== 'web') return;

    const element = ref.current as any;
    if (!element || typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (onVisible) onVisible();
          // Disconnect after first visibility — section stays mounted
          observer.disconnect();
        }
      },
      {
        threshold,
        rootMargin: `${rootMargin}px`,
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [ref, threshold, rootMargin, onVisible]);

  return isVisible;
}

/**
 * Native implementation using onLayout position + scrollY.
 * Listener self-removes once the section becomes visible.
 */
function useLazySectionNative(
  sectionY: number | null,
  scrollY: Animated.Value | undefined,
  rootMargin: number,
  onVisible?: () => void,
): boolean {
  const [isVisible, setIsVisible] = useState(false);
  const visibleRef = useRef(false);
  const listenerIdRef = useRef<string | null>(null);
  const onVisibleRef = useRef(onVisible);
  onVisibleRef.current = onVisible;

  useEffect(() => {
    if (Platform.OS === 'web' || visibleRef.current) return;

    // If no scrollY provided, fall back to showing immediately
    if (!scrollY || sectionY === null) {
      const timer = setTimeout(() => {
        if (!visibleRef.current) {
          visibleRef.current = true;
          setIsVisible(true);
          if (onVisibleRef.current) onVisibleRef.current();
        }
      }, 100);
      return () => clearTimeout(timer);
    }

    // Listen to scroll position — self-removes once visible
    const listenerId = scrollY.addListener(({ value: scrollOffset }) => {
      const viewportBottom = scrollOffset + SCREEN_HEIGHT + rootMargin;
      const viewportTop = scrollOffset - rootMargin;
      const visible = sectionY < viewportBottom && sectionY > viewportTop - SCREEN_HEIGHT;

      if (visible && !visibleRef.current) {
        visibleRef.current = true;
        setIsVisible(true);
        if (onVisibleRef.current) onVisibleRef.current();
        // Self-remove: section is keepMounted, no need to track further
        if (listenerIdRef.current) {
          scrollY.removeListener(listenerIdRef.current);
          listenerIdRef.current = null;
        }
      }
    });
    listenerIdRef.current = listenerId;

    return () => {
      if (listenerIdRef.current) {
        scrollY.removeListener(listenerIdRef.current);
        listenerIdRef.current = null;
      }
    };
  }, [scrollY, sectionY, rootMargin]);

  return isVisible;
}

/**
 * LazySection Component
 */
const LazySection: React.FC<LazySectionProps> = ({
  sectionId,
  renderSection,
  height = 400,
  threshold = 0.1,
  rootMargin = Platform.OS === 'web' ? 300 : 600,
  onVisible,
  unloadWhenOffscreen = false,
  keepMounted = true,
  style,
  placeholder,
  scrollY,
}) => {
  const ref = useRef<View>(null);
  const [hasLoaded, setHasLoaded] = useState(false);
  const sectionYRef = useRef<number | null>(null);
  const [sectionY, setSectionY] = useState<number | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Measure section position on layout — use measureInWindow for absolute position
  // Only measure once (subsequent layouts don't change content position)
  const handleLayout = useCallback((_event: LayoutChangeEvent) => {
    if (Platform.OS !== 'web' && sectionYRef.current === null) {
      ref.current?.measureInWindow((_x, y) => {
        if (y !== undefined && sectionYRef.current === null) {
          sectionYRef.current = y;
          setSectionY(y);
        }
      });
    }
  }, []);

  // Use appropriate hook based on platform
  const isVisible = Platform.OS === 'web'
    ? useLazySectionWeb(ref, threshold, rootMargin, onVisible)
    : useLazySectionNative(sectionY, scrollY, rootMargin, onVisible);

  // Track if section has ever been loaded — fade in content
  // Note: fadeAnim is stored in a ref so it's stable; no cleanup needed
  // (stopping the animation in cleanup caused a race condition where
  // setHasLoaded triggered re-render → cleanup killed the animation at ~0 opacity)
  useEffect(() => {
    if (isVisible && !hasLoaded) {
      setHasLoaded(true);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [isVisible, hasLoaded, fadeAnim]);

  const shouldRenderContent = hasLoaded && (keepMounted || isVisible || !unloadWhenOffscreen);

  return (
    <View
      ref={ref}
      onLayout={handleLayout}
      style={[styles.container, style, { minHeight: shouldRenderContent ? undefined : height }]}
      accessible={true}
      accessibilityLabel={`${sectionId} section`}
      accessibilityRole="summary"
    >
      {!shouldRenderContent && (
        placeholder || <View style={[styles.placeholder, { height }]} />
      )}

      {shouldRenderContent && (
        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
          {renderSection()}
        </Animated.View>
      )}
    </View>
  );
};

export default React.memo(LazySection, (prev, next) => {
  return (
    prev.sectionId === next.sectionId &&
    prev.height === next.height &&
    prev.threshold === next.threshold &&
    prev.keepMounted === next.keepMounted &&
    prev.scrollY === next.scrollY
  );
});

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    overflow: 'hidden',
  },
  content: {
    flex: 1,
  },
  placeholder: {
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
