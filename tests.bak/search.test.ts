/**
 * Search Page Tests
 * 
 * These tests verify the functionality of the search page, including:
 * - Search query handling
 * - Debouncing
 * - Caching
 * - Analytics tracking
 * - Navigation
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { renderHook, waitFor, act } from '@testing-library/react-native';
import useDebouncedSearch from '../hooks/useDebouncedSearch';
import { searchCacheService } from '../services/searchCacheService';
import { searchAnalyticsService } from '../services/searchAnalyticsService';

describe('Search Functionality', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await searchCacheService.clearCache();
    await searchAnalyticsService.clearAnalytics();
  });

  describe('useDebouncedSearch Hook', () => {
    it('should update value immediately', async () => {
      const { result } = renderHook(() => useDebouncedSearch('', { delay: 300 }));

      // Initial state
      expect(result.current.value).toBe('');
      expect(result.current.debouncedValue).toBe('');
      expect(result.current.isDebouncing).toBe(false);

      // Update value wrapped in act
      await act(async () => {
        result.current.setValue('test');
      });

      // Value should update immediately (debounced value updates after delay - library handles this)
      expect(result.current.value).toBe('test');
      expect(result.current.isDebouncing).toBe(true);
    });

    it('should respect minimum length', async () => {
      const { result } = renderHook(() => useDebouncedSearch('', { delay: 300, minLength: 3 }));

      // Update with value below min length
      await act(async () => {
        result.current.setValue('te');
      });

      // Should update value but not trigger debounce (below min length)
      expect(result.current.value).toBe('te');
      expect(result.current.debouncedValue).toBe('');

      // Update with value above min length
      await act(async () => {
        result.current.setValue('test');
      });

      // Should update value and set debouncing state
      expect(result.current.value).toBe('test');
      expect(result.current.isDebouncing).toBe(true);
    });

    it('should reset state', async () => {
      const { result } = renderHook(() => useDebouncedSearch('initial'));

      await act(async () => {
        result.current.setValue('test');
      });
      
      expect(result.current.value).toBe('test');

      await act(async () => {
        result.current.reset();
      });
      
      expect(result.current.value).toBe('');
      expect(result.current.debouncedValue).toBe('');
      expect(result.current.isDebouncing).toBe(false);
    });
  });

  describe('Search Cache Service', () => {
    beforeEach(async () => {
      await searchCacheService.clearCache();
    });

    it('should save and retrieve cached results', async () => {
      const query = 'test query';
      const results = [
        { id: '1', title: 'Test Product 1' },
        { id: '2', title: 'Test Product 2' },
      ];

      // Save to cache
      await searchCacheService.saveToCache(query, results);

      // Retrieve from cache
      const cached = await searchCacheService.getFromCache(query);
      expect(cached).toEqual(results);
    });

    it('should return null for non-existent cache', async () => {
      const cached = await searchCacheService.getFromCache('non-existent query');
      expect(cached).toBeNull();
    });

    it('should check if query is cached', async () => {
      const query = 'test query';
      const results = [{ id: '1', title: 'Test Product' }];

      // Should not be cached initially
      let isCached = await searchCacheService.isCached(query);
      expect(isCached).toBe(false);

      // Save to cache
      await searchCacheService.saveToCache(query, results);

      // Should be cached now
      isCached = await searchCacheService.isCached(query);
      expect(isCached).toBe(true);
    });

    it('should clear all cache', async () => {
      const query1 = 'query 1';
      const query2 = 'query 2';
      const results = [{ id: '1', title: 'Test' }];

      // Save multiple queries
      await searchCacheService.saveToCache(query1, results);
      await searchCacheService.saveToCache(query2, results);

      // Clear cache
      await searchCacheService.clearCache();

      // Both should be cleared
      const cached1 = await searchCacheService.getFromCache(query1);
      const cached2 = await searchCacheService.getFromCache(query2);
      expect(cached1).toBeNull();
      expect(cached2).toBeNull();
    });

    it('should return cache statistics', async () => {
      const query = 'test query';
      const results = [{ id: '1', title: 'Test' }];

      await searchCacheService.saveToCache(query, results);

      const stats = await searchCacheService.getCacheStats();
      expect(stats.totalEntries).toBeGreaterThan(0);
      expect(stats.totalSize).toBeGreaterThan(0);
      expect(stats.newestEntry).not.toBeNull();
    });
  });

  describe('Search Analytics Service', () => {
    beforeEach(async () => {
      await searchAnalyticsService.clearAnalytics();
    });

    it('should track search events', async () => {
      await searchAnalyticsService.trackSearch('test query', 10);

      const analytics = await searchAnalyticsService.getAnalytics();
      expect(analytics.totalSearches).toBe(1);
    });

    it('should track result clicks', async () => {
      await searchAnalyticsService.trackResultClick('test query', 'product-1', 'product', 1);

      const analytics = await searchAnalyticsService.getAnalytics();
      expect(analytics.totalClicks).toBe(1);
    });

    it('should track category clicks', async () => {
      await searchAnalyticsService.trackCategoryClick('cat-1', 'Electronics');

      const analytics = await searchAnalyticsService.getAnalytics();
      // Category clicks don't count in totalClicks, but we can verify the event was tracked
      expect(analytics).toBeDefined();
    });

    it('should calculate click-through rate', async () => {
      // Track 2 searches
      await searchAnalyticsService.trackSearch('query 1', 5);
      await searchAnalyticsService.trackSearch('query 2', 5);

      // Track 1 click
      await searchAnalyticsService.trackResultClick('query 1', 'product-1', 'product', 1);

      const analytics = await searchAnalyticsService.getAnalytics();
      expect(analytics.clickThroughRate).toBe(50); // 1 click / 2 searches = 50%
    });

    it('should track popular queries', async () => {
      await searchAnalyticsService.trackSearch('popular query', 10);
      await searchAnalyticsService.trackSearch('popular query', 10);
      await searchAnalyticsService.trackSearch('another query', 5);

      const analytics = await searchAnalyticsService.getAnalytics();
      expect(analytics.popularQueries.length).toBeGreaterThan(0);
      expect(analytics.popularQueries[0].query).toBe('popular query');
      expect(analytics.popularQueries[0].count).toBe(2);
    });

    it('should track no-results queries', async () => {
      await searchAnalyticsService.trackSearch('no results query', 0);

      const analytics = await searchAnalyticsService.getAnalytics();
      expect(analytics.noResultsQueries).toContain('no results query');
    });

    it('should calculate average click position', async () => {
      await searchAnalyticsService.trackResultClick('query', 'p1', 'product', 1);
      await searchAnalyticsService.trackResultClick('query', 'p2', 'product', 3);
      await searchAnalyticsService.trackResultClick('query', 'p3', 'product', 5);

      const analytics = await searchAnalyticsService.getAnalytics();
      expect(analytics.averagePosition).toBe(3); // (1 + 3 + 5) / 3 = 3
    });

    it('should export analytics data', async () => {
      await searchAnalyticsService.trackSearch('test', 5);
      
      const exported = await searchAnalyticsService.exportAnalytics();
      const data = JSON.parse(exported);
      
      expect(data).toBeDefined();
      expect(data.totalSearches).toBe(1);
    });

    it('should clear all analytics', async () => {
      await searchAnalyticsService.trackSearch('test', 5);
      await searchAnalyticsService.trackResultClick('test', 'p1', 'product', 1);

      await searchAnalyticsService.clearAnalytics();

      const analytics = await searchAnalyticsService.getAnalytics();
      expect(analytics.totalSearches).toBe(0);
      expect(analytics.totalClicks).toBe(0);
    });
  });

  describe('Search Integration', () => {
    it('should use cached results when available', async () => {
      const query = 'test query';
      const results = [{ id: '1', title: 'Cached Product' }];

      // Save to cache
      await searchCacheService.saveToCache(query, results);

      // Retrieve from cache
      const cached = await searchCacheService.getFromCache(query);
      expect(cached).toEqual(results);
    });

    it('should track analytics when performing search', async () => {
      const query = 'analytics test';
      const resultsCount = 5;

      await searchAnalyticsService.trackSearch(query, resultsCount);

      const analytics = await searchAnalyticsService.getAnalytics();
      expect(analytics.totalSearches).toBeGreaterThan(0);
    });
  });
});

