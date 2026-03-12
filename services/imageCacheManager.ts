/**
 * Image Cache Manager
 *
 * Persistent image cache management with:
 * - AsyncStorage-based persistent cache
 * - Cache expiration (7-day default)
 * - LRU (Least Recently Used) eviction
 * - Cache size limits
 * - Offline support
 * - Cache statistics
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';

/**
 * Cache entry interface
 */
interface CacheEntry {
  uri: string;
  localPath?: string;
  timestamp: number;
  lastAccessed: number;
  size?: number;
  expiresAt: number;
  hits: number;
}

/**
 * Cache configuration
 */
interface CacheConfig {
  maxAge: number;          // Max age in milliseconds (default: 7 days)
  maxSize: number;         // Max cache size in bytes (default: 100MB)
  maxEntries: number;      // Max number of entries (default: 500)
}

const CACHE_PREFIX = '@image_cache:';
const CACHE_INDEX_KEY = '@image_cache_index';
const DEFAULT_CONFIG: CacheConfig = {
  maxAge: 7 * 24 * 60 * 60 * 1000,  // 7 days
  maxSize: 100 * 1024 * 1024,        // 100MB
  maxEntries: 500,
};

/**
 * Image Cache Manager Class
 */
class ImageCacheManager {
  private config: CacheConfig;
  private cacheIndex: Map<string, CacheEntry> = new Map();
  private initialized = false;
  private cacheDir: string;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.cacheDir = `${FileSystem.cacheDirectory}images/`;
  }

  /**
   * Initialize cache manager
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Create cache directory
      const dirInfo = await FileSystem.getInfoAsync(this.cacheDir);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(this.cacheDir, { intermediates: true });
      }

      // Load cache index
      await this.loadCacheIndex();

      // Clean expired entries
      await this.cleanExpired();

      this.initialized = true;
    } catch (_error) {
      this.initialized = true; // Continue anyway
    }
  }

  /**
   * Load cache index from storage
   */
  private async loadCacheIndex(): Promise<void> {
    try {
      const indexData = await AsyncStorage.getItem(CACHE_INDEX_KEY);
      if (indexData) {
        const entries: Array<[string, CacheEntry]> = JSON.parse(indexData);
        this.cacheIndex = new Map(entries);
      }
    } catch (_error) {
      // silently handle
    }
  }

  /**
   * Save cache index to storage
   */
  private async saveCacheIndex(): Promise<void> {
    try {
      const entries = Array.from(this.cacheIndex.entries());
      await AsyncStorage.setItem(CACHE_INDEX_KEY, JSON.stringify(entries));
    } catch (_error) {
      // silently handle
    }
  }

  /**
   * Get cached image URI
   */
  async get(uri: string): Promise<string | null> {
    if (!this.initialized) {
      await this.initialize();
    }

    const entry = this.cacheIndex.get(uri);
    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      await this.remove(uri);
      return null;
    }

    // Update access stats
    entry.lastAccessed = Date.now();
    entry.hits++;
    this.cacheIndex.set(uri, entry);

    // Return local path if available
    if (entry.localPath) {
      const fileInfo = await FileSystem.getInfoAsync(entry.localPath);
      if (fileInfo.exists) {
        return entry.localPath;
      }
    }

    return null;
  }

  /**
   * Add image to cache
   */
  async set(uri: string, imageData?: string): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      // Check cache size limits
      if (this.cacheIndex.size >= this.config.maxEntries) {
        await this.evictLRU();
      }

      // Generate local filename
      const filename = this.generateFilename(uri);
      const localPath = `${this.cacheDir}${filename}`;

      let size: number | undefined;

      // Download and save image if data not provided
      if (imageData) {
        await FileSystem.writeAsStringAsync(localPath, imageData, {
          encoding: FileSystem.EncodingType.Base64,
        });
      } else if (Platform.OS !== 'web') {
        // Download image
        const downloadResult = await FileSystem.downloadAsync(uri, localPath);
        const fileInfo = await FileSystem.getInfoAsync(localPath);
        size = fileInfo.exists && 'size' in fileInfo ? fileInfo.size : undefined;
      }

      // Create cache entry
      const now = Date.now();
      const entry: CacheEntry = {
        uri,
        localPath,
        timestamp: now,
        lastAccessed: now,
        expiresAt: now + this.config.maxAge,
        hits: 0,
        size,
      };

      this.cacheIndex.set(uri, entry);
      await this.saveCacheIndex();

    } catch (_error) {
      // silently handle
    }
  }

  /**
   * Remove image from cache
   */
  async remove(uri: string): Promise<void> {
    const entry = this.cacheIndex.get(uri);
    if (!entry) return;

    // Delete file
    if (entry.localPath) {
      try {
        await FileSystem.deleteAsync(entry.localPath, { idempotent: true });
      } catch (_error) {
        // silently handle
      }
    }

    // Remove from index
    this.cacheIndex.delete(uri);
    await this.saveCacheIndex();
  }

  /**
   * Clean expired entries
   */
  private async cleanExpired(): Promise<void> {
    const now = Date.now();
    const expiredUris: string[] = [];

    this.cacheIndex.forEach((entry, uri) => {
      if (now > entry.expiresAt) {
        expiredUris.push(uri);
      }
    });

    for (const uri of expiredUris) {
      await this.remove(uri);
    }

  }

  /**
   * Evict least recently used entry
   */
  private async evictLRU(): Promise<void> {
    let oldestEntry: { uri: string; lastAccessed: number } | null = null;

    this.cacheIndex.forEach((entry, uri) => {
      if (!oldestEntry || entry.lastAccessed < oldestEntry.lastAccessed) {
        oldestEntry = { uri, lastAccessed: entry.lastAccessed };
      }
    });

    if (oldestEntry) {
      await this.remove(oldestEntry.uri);
    }
  }

  /**
   * Clear all cache
   */
  async clear(): Promise<void> {
    try {
      // Delete cache directory
      await FileSystem.deleteAsync(this.cacheDir, { idempotent: true });

      // Recreate directory
      await FileSystem.makeDirectoryAsync(this.cacheDir, { intermediates: true });

      // Clear index
      this.cacheIndex.clear();
      await AsyncStorage.removeItem(CACHE_INDEX_KEY);

    } catch (_error) {
      // silently handle
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<{
    entryCount: number;
    totalSize: number;
    oldestEntry: Date | null;
    newestEntry: Date | null;
    totalHits: number;
    avgHitsPerEntry: number;
  }> {
    let totalSize = 0;
    let oldestTimestamp = Infinity;
    let newestTimestamp = 0;
    let totalHits = 0;

    this.cacheIndex.forEach(entry => {
      totalSize += entry.size || 0;
      totalHits += entry.hits;

      if (entry.timestamp < oldestTimestamp) {
        oldestTimestamp = entry.timestamp;
      }
      if (entry.timestamp > newestTimestamp) {
        newestTimestamp = entry.timestamp;
      }
    });

    return {
      entryCount: this.cacheIndex.size,
      totalSize,
      oldestEntry: oldestTimestamp !== Infinity ? new Date(oldestTimestamp) : null,
      newestEntry: newestTimestamp !== 0 ? new Date(newestTimestamp) : null,
      totalHits,
      avgHitsPerEntry: this.cacheIndex.size > 0 ? totalHits / this.cacheIndex.size : 0,
    };
  }

  /**
   * Generate filename from URI
   */
  private generateFilename(uri: string): string {
    // Simple hash function
    let hash = 0;
    for (let i = 0; i < uri.length; i++) {
      const char = uri.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }

    const extension = uri.split('.').pop()?.split('?')[0] || 'jpg';
    return `${Math.abs(hash)}.${extension}`;
  }

  /**
   * Preload images into cache
   */
  async preloadImages(uris: string[]): Promise<void> {
    // Cap preloading to prevent memory overload
    const MAX_PRELOAD = 20;
    const limitedUris = uris.slice(0, MAX_PRELOAD);

    // Batch in groups of 5 to avoid overwhelming the network
    for (let i = 0; i < limitedUris.length; i += 5) {
      const batch = limitedUris.slice(i, i + 5);
      await Promise.allSettled(batch.map(uri => this.set(uri)));
    }
  }

  /**
   * Check if URI is cached
   */
  isCached(uri: string): boolean {
    const entry = this.cacheIndex.get(uri);
    if (!entry) return false;

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      return false;
    }

    return true;
  }
}

// Singleton pattern using globalThis to persist across SSR module re-evaluations
const IMAGE_CACHE_MANAGER_KEY = '__rezImageCacheManager__';

function getImageCacheManager(): ImageCacheManager {
  if (typeof globalThis !== 'undefined') {
    if (!(globalThis as any)[IMAGE_CACHE_MANAGER_KEY]) {
      (globalThis as any)[IMAGE_CACHE_MANAGER_KEY] = new ImageCacheManager();
    }
    return (globalThis as any)[IMAGE_CACHE_MANAGER_KEY];
  }
  return new ImageCacheManager();
}

// Export singleton instance
export default getImageCacheManager();
