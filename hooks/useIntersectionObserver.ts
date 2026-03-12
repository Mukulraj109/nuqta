/**
 * useIntersectionObserver Hook
 *
 * Cross-platform intersection observer for lazy loading
 * Features:
 * - Web: Native IntersectionObserver API
 * - Native: Scroll position tracking
 * - Configurable threshold and root margin
 * - Callback support
 */

import { useEffect, useState, useRef, RefObject } from 'react';
import { Platform, Animated } from 'react-native';

export interface IntersectionObserverOptions {
  threshold?: number | number[];
  rootMargin?: string;
  root?: Element | null;
  once?: boolean; // Only trigger once
  enabled?: boolean; // Enable/disable observer
}

export interface IntersectionObserverResult {
  isVisible: boolean;
  hasBeenVisible: boolean;
  entry?: IntersectionObserverEntry;
}

/**
 * Web-based Intersection Observer
 */
function useWebIntersectionObserver(
  ref: RefObject<any>,
  options: IntersectionObserverOptions = {}
): IntersectionObserverResult {
  const {
    threshold = 0,
    rootMargin = '0px',
    root = null,
    once = false,
    enabled = true,
  } = options;

  const [isVisible, setIsVisible] = useState(false);
  const [hasBeenVisible, setHasBeenVisible] = useState(false);
  const [entry, setEntry] = useState<IntersectionObserverEntry | undefined>();

  useEffect(() => {
    if (!enabled || Platform.OS !== 'web') return;

    const element = ref.current;
    if (!element || typeof IntersectionObserver === 'undefined') return;

    // Don't observe if already been visible and once=true
    if (once && hasBeenVisible) return;

    const observer = new IntersectionObserver(
      ([observerEntry]) => {
        const visible = observerEntry.isIntersecting;

        setIsVisible(visible);
        setEntry(observerEntry);

        if (visible) {
          setHasBeenVisible(true);
        }

        // Unobserve if once and now visible
        if (once && visible) {
          observer.unobserve(element);
        }
      },
      {
        threshold,
        rootMargin,
        root,
      }
    );

    observer.observe(element);

    return () => {
      if (element) {
        observer.unobserve(element);
      }
    };
  }, [ref, threshold, rootMargin, root, once, enabled, hasBeenVisible]);

  return { isVisible, hasBeenVisible, entry };
}

/**
 * Native-based Viewport Detection
 * Uses a simple timer approach - can be enhanced with scroll integration
 */
function useNativeViewportDetection(
  ref: RefObject<any>,
  options: IntersectionObserverOptions = {}
): IntersectionObserverResult {
  const { once = false, enabled = true } = options;

  const [isVisible, setIsVisible] = useState(false);
  const [hasBeenVisible, setHasBeenVisible] = useState(false);

  useEffect(() => {
    if (!enabled || Platform.OS === 'web') return;

    // Don't trigger if already been visible and once=true
    if (once && hasBeenVisible) return;

    // Simple timer-based approach
    // In production, you'd integrate with ScrollView's onScroll
    const timer = setTimeout(() => {
      setIsVisible(true);
      setHasBeenVisible(true);
    }, 100);

    return () => clearTimeout(timer);
  }, [enabled, once, hasBeenVisible]);

  return { isVisible, hasBeenVisible, entry: undefined };
}

/**
 * Main Hook - Cross-Platform
 */
export function useIntersectionObserver(
  ref: RefObject<any>,
  options: IntersectionObserverOptions = {}
): IntersectionObserverResult {
  if (Platform.OS === 'web') {
    return useWebIntersectionObserver(ref, options);
  } else {
    return useNativeViewportDetection(ref, options);
  }
}

/**
 * useViewportDetection Hook - Native Scroll-based
 * For use with ScrollView's onScroll event
 */
export interface ViewportDetectionOptions {
  sectionIndex: number;
  sectionHeight: number;
  viewportHeight: number;
  buffer?: number; // Buffer zone in pixels
  enabled?: boolean;
}

export function useViewportDetection(
  scrollY: Animated.Value,
  options: ViewportDetectionOptions
): boolean {
  const {
    sectionIndex,
    sectionHeight,
    viewportHeight,
    buffer = 100,
    enabled = true,
  } = options;

  const [isInViewport, setIsInViewport] = useState(false);
  const listenerIdRef = useRef<string>();

  useEffect(() => {
    if (!enabled || Platform.OS === 'web') return;

    const listener = scrollY.addListener(({ value }) => {
      const sectionOffset = sectionIndex * sectionHeight;
      const sectionStart = sectionOffset - buffer;
      const sectionEnd = sectionOffset + sectionHeight + buffer;

      const inView = value >= sectionStart && value <= sectionEnd + viewportHeight;

      setIsInViewport(inView);
    });

    listenerIdRef.current = listener;

    return () => {
      if (listenerIdRef.current) {
        scrollY.removeListener(listenerIdRef.current);
      }
    };
  }, [scrollY, sectionIndex, sectionHeight, viewportHeight, buffer, enabled]);

  return isInViewport;
}

/**
 * useLazyLoad Hook - Simplified lazy loading
 */
export function useLazyLoad(
  ref: RefObject<any>,
  options: IntersectionObserverOptions = {}
): boolean {
  const { isVisible, hasBeenVisible } = useIntersectionObserver(ref, {
    ...options,
    once: true, // Load once and keep loaded
  });

  return hasBeenVisible || isVisible;
}

/**
 * useInView Hook - Track element visibility
 */
export function useInView(
  ref: RefObject<any>,
  options: IntersectionObserverOptions = {}
): boolean {
  const { isVisible } = useIntersectionObserver(ref, options);
  return isVisible;
}

export default useIntersectionObserver;
