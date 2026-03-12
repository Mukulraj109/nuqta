/**
 * Optimized Analytics Service
 * High-performance analytics with batching, debouncing, and offline queue
 *
 * Features:
 * - Event batching (send every 5 seconds or 10 events)
 * - Debounced tracking calls
 * - Queue and flush pattern
 * - Offline queue support
 * - Priority-based sending
 * - Minimal performance overhead
 */

// Dev-only logger to prevent string accumulation in production
const devLog = {
  log: __DEV__ ? console.log.bind(console) : () => {},
  warn: __DEV__ ? console.warn.bind(console) : () => {},
  error: __DEV__ ? console.error.bind(console) : () => {},
};

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import NetInfo from '@react-native-community/netinfo';

// ============================================================================
// Types
// ============================================================================

export type EventPriority = 'high' | 'normal' | 'low';

export interface AnalyticsEvent {
  name: string;
  properties: Record<string, any>;
  timestamp: Date;
  priority: EventPriority;
  sessionId: string;
  userId?: string;
}

export interface BatchedEvents {
  events: AnalyticsEvent[];
  batchId: string;
  timestamp: Date;
}

export interface AnalyticsConfig {
  flushInterval?: number; // milliseconds
  maxQueueSize?: number; // number of events
  maxBatchSize?: number; // number of events per batch
  debounceTime?: number; // milliseconds
  enableOfflineQueue?: boolean;
  enableBatching?: boolean;
}

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_CONFIG: Required<AnalyticsConfig> = {
  flushInterval: 5000, // 5 seconds
  maxQueueSize: 50,
  maxBatchSize: 20,
  debounceTime: 300, // 300ms
  enableOfflineQueue: true,
  enableBatching: true,
};

const STORAGE_KEY = 'analytics_queue';
const OFFLINE_QUEUE_KEY = 'analytics_offline_queue';

// ============================================================================
// Optimized Analytics Service Class
// ============================================================================

class OptimizedAnalyticsService {
  private eventQueue: AnalyticsEvent[] = [];
  private offlineQueue: AnalyticsEvent[] = [];
  private config: Required<AnalyticsConfig>;
  private sessionId: string;
  private userId?: string;
  private flushTimer?: NodeJS.Timeout;
  private isOnline: boolean = true;
  private isEnabled: boolean = true;
  private isFlushing: boolean = false;

  // Debounced methods cache
  private debouncedMethods: Map<string, (...args: any[]) => void> = new Map();

  // Statistics
  private stats = {
    totalEvents: 0,
    batchesSent: 0,
    offlineEvents: 0,
    failedBatches: 0,
    avgBatchSize: 0,
  };

  // NetInfo unsubscribe function
  private netInfoUnsubscribe: (() => void) | null = null;

  constructor(config?: AnalyticsConfig) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.sessionId = this.generateSessionId();
    this.init();
  }

  /**
   * Initialize service
   */
  private async init(): Promise<void> {
    // Load offline queue
    await this.loadOfflineQueue();

    // Setup network listener
    this.setupNetworkListener();

    // Start auto-flush
    if (this.config.enableBatching) {
      this.startAutoFlush();
    }

    devLog.log('[Analytics] Optimized service initialized');
  }

  /**
   * Setup network status listener
   */
  private setupNetworkListener(): void {
    // Cleanup existing listener before adding new one
    if (this.netInfoUnsubscribe) {
      this.netInfoUnsubscribe();
      this.netInfoUnsubscribe = null;
    }

    this.netInfoUnsubscribe = NetInfo.addEventListener(state => {
      const wasOffline = !this.isOnline;
      this.isOnline = state.isConnected || false;

      // If we just came online, flush offline queue
      if (wasOffline && this.isOnline && this.offlineQueue.length > 0) {
        devLog.log('[Analytics] Network restored, flushing offline queue');
        this.flushOfflineQueue();
      }
    });
  }

  /**
   * Generate session ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Set user ID
   */
  setUserId(userId: string): void {
    this.userId = userId;
  }

  /**
   * Set enabled state
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    devLog.log(`[Analytics] ${enabled ? 'Enabled' : 'Disabled'}`);
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<AnalyticsConfig>): void {
    this.config = { ...this.config, ...config };

    // Restart auto-flush if interval changed
    if (config.flushInterval && this.flushTimer) {
      this.stopAutoFlush();
      this.startAutoFlush();
    }
  }

  // ============================================================================
  // Event Tracking Methods
  // ============================================================================

  /**
   * Track event (batched)
   */
  track(
    name: string,
    properties?: Record<string, any>,
    priority: EventPriority = 'normal'
  ): void {
    if (!this.isEnabled) return;

    const event: AnalyticsEvent = {
      name,
      properties: properties || {},
      timestamp: new Date(),
      priority,
      sessionId: this.sessionId,
      userId: this.userId,
    };

    // Add to queue
    this.eventQueue.push(event);
    this.stats.totalEvents++;

    // Log in dev mode
    if (__DEV__) {
      devLog.log(`[Analytics] Event tracked: ${name}`, properties);
    }

    // Flush immediately if high priority or queue is full
    if (priority === 'high' || this.eventQueue.length >= this.config.maxQueueSize) {
      this.flush();
    }
  }

  /**
   * Track page view (debounced)
   */
  trackPageView = this.createDebouncedMethod(
    'trackPageView',
    (route: string, properties?: Record<string, any>) => {
      this.track('page_view', { route, ...properties }, 'normal');
    }
  );

  /**
   * Track user action (debounced)
   */
  trackUserAction = this.createDebouncedMethod(
    'trackUserAction',
    (action: string, data?: any) => {
      this.track('user_action', { action, ...data }, 'normal');
    }
  );

  /**
   * Track screen interaction (debounced)
   */
  trackInteraction = this.createDebouncedMethod(
    'trackInteraction',
    (element: string, data?: any) => {
      this.track('interaction', { element, ...data }, 'low');
    }
  );

  /**
   * Track conversion (immediate, high priority)
   */
  trackConversion(
    eventName: string,
    value: number,
    properties?: Record<string, any>
  ): void {
    this.track(
      'conversion',
      { eventName, value, ...properties },
      'high'
    );
  }

  /**
   * Track error (immediate, high priority)
   */
  trackError(
    error: Error,
    context?: Record<string, any>
  ): void {
    this.track(
      'error',
      {
        message: error.message,
        stack: error.stack,
        ...context,
      },
      'high'
    );
  }

  /**
   * Track performance metric
   */
  trackPerformance(
    metric: string,
    value: number,
    unit: string = 'ms'
  ): void {
    this.track('performance', { metric, value, unit }, 'low');
  }

  // ============================================================================
  // Batching & Flushing Methods
  // ============================================================================

  /**
   * Flush event queue
   */
  async flush(): Promise<void> {
    if (this.eventQueue.length === 0 || this.isFlushing) return;

    this.isFlushing = true;

    try {
      // If offline, add to offline queue
      if (!this.isOnline && this.config.enableOfflineQueue) {
        this.addToOfflineQueue();
        return;
      }

      // Split queue into batches
      const batches = this.createBatches();

      // Send batches
      await Promise.all(batches.map(batch => this.sendBatch(batch)));

      // Clear queue
      this.eventQueue = [];

      // Update stats
      this.stats.batchesSent += batches.length;
      this.stats.avgBatchSize = batches.length > 0
        ? batches.reduce((sum, b) => sum + b.events.length, 0) / batches.length
        : 0;

    } catch (error) {
      devLog.error('[Analytics] Flush failed:', error);
      this.stats.failedBatches++;

      // Add failed events to offline queue
      if (this.config.enableOfflineQueue) {
        this.addToOfflineQueue();
      }
    } finally {
      this.isFlushing = false;
    }
  }

  /**
   * Create batches from queue
   */
  private createBatches(): BatchedEvents[] {
    const batches: BatchedEvents[] = [];
    const events = [...this.eventQueue];

    // Sort by priority
    events.sort((a, b) => {
      const priorities: Record<EventPriority, number> = {
        high: 3,
        normal: 2,
        low: 1,
      };
      return priorities[b.priority] - priorities[a.priority];
    });

    // Split into batches
    for (let i = 0; i < events.length; i += this.config.maxBatchSize) {
      const batchEvents = events.slice(i, i + this.config.maxBatchSize);
      batches.push({
        events: batchEvents,
        batchId: this.generateBatchId(),
        timestamp: new Date(),
      });
    }

    return batches;
  }

  /**
   * Send batch to analytics backend
   */
  private async sendBatch(batch: BatchedEvents): Promise<void> {
    try {
      // TODO: Replace with actual analytics API call
      // Example:
      // await analyticsAPI.sendBatch(batch);

      // Simulated API call
      if (__DEV__) {
        devLog.log(
          `[Analytics] Batch sent: ${batch.events.length} events (ID: ${batch.batchId})`
        );
      }

      // Simulate network delay in dev mode
      if (__DEV__) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    } catch (error) {
      devLog.error('[Analytics] Failed to send batch:', error);
      throw error;
    }
  }

  /**
   * Generate batch ID
   */
  private generateBatchId(): string {
    return `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Start auto-flush timer
   */
  private startAutoFlush(): void {
    // Clear existing timer to prevent stacking
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = undefined;
    }

    this.flushTimer = setInterval(() => {
      if (this.eventQueue.length > 0) {
        this.flush();
      }
    }, this.config.flushInterval);
  }

  /**
   * Stop auto-flush timer
   */
  private stopAutoFlush(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = undefined;
    }
  }

  // ============================================================================
  // Offline Queue Methods
  // ============================================================================

  private static readonly MAX_OFFLINE_QUEUE = 500;

  /**
   * Add current queue to offline queue
   */
  private addToOfflineQueue(): void {
    this.offlineQueue.push(...this.eventQueue);
    this.eventQueue = [];

    // Cap offline queue size to prevent unbounded growth
    if (this.offlineQueue.length > OptimizedAnalyticsService.MAX_OFFLINE_QUEUE) {
      this.offlineQueue = this.offlineQueue.slice(-OptimizedAnalyticsService.MAX_OFFLINE_QUEUE);
    }
    this.stats.offlineEvents += this.eventQueue.length;
    this.saveOfflineQueue();

    devLog.log(`[Analytics] Added ${this.eventQueue.length} events to offline queue`);
  }

  /**
   * Flush offline queue
   */
  private async flushOfflineQueue(): Promise<void> {
    if (this.offlineQueue.length === 0) return;

    devLog.log(`[Analytics] Flushing ${this.offlineQueue.length} offline events`);

    // Move offline events to main queue
    this.eventQueue.push(...this.offlineQueue);
    this.offlineQueue = [];

    // Flush
    await this.flush();

    // Clear offline storage
    await AsyncStorage.removeItem(OFFLINE_QUEUE_KEY);
  }

  /**
   * Save offline queue to storage
   */
  private async saveOfflineQueue(): Promise<void> {
    try {
      await AsyncStorage.setItem(
        OFFLINE_QUEUE_KEY,
        JSON.stringify(this.offlineQueue)
      );
    } catch (error) {
      devLog.error('[Analytics] Failed to save offline queue:', error);
    }
  }

  /**
   * Load offline queue from storage
   */
  private async loadOfflineQueue(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
      if (stored) {
        this.offlineQueue = JSON.parse(stored).map((e: any) => ({
          ...e,
          timestamp: new Date(e.timestamp),
        }));

        devLog.log(`[Analytics] Loaded ${this.offlineQueue.length} offline events`);

        // Flush if online
        if (this.isOnline) {
          this.flushOfflineQueue();
        }
      }
    } catch (error) {
      devLog.error('[Analytics] Failed to load offline queue:', error);
    }
  }

  // ============================================================================
  // Debouncing Methods
  // ============================================================================

  /**
   * Create debounced method
   */
  private createDebouncedMethod<T extends (...args: any[]) => void>(
    key: string,
    fn: T
  ): T {
    if (this.debouncedMethods.has(key)) {
      return this.debouncedMethods.get(key) as T;
    }

    let timeoutId: NodeJS.Timeout;

    const debounced = ((...args: any[]) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        fn(...args);
      }, this.config.debounceTime);
    }) as T;

    this.debouncedMethods.set(key, debounced);
    return debounced;
  }

  // ============================================================================
  // Statistics & Reporting Methods
  // ============================================================================

  /**
   * Get statistics
   */
  getStats(): {
    totalEvents: number;
    queuedEvents: number;
    offlineEvents: number;
    batchesSent: number;
    failedBatches: number;
    avgBatchSize: number;
    successRate: number;
  } {
    const successRate = this.stats.batchesSent > 0
      ? ((this.stats.batchesSent - this.stats.failedBatches) / this.stats.batchesSent) * 100
      : 100;

    return {
      ...this.stats,
      queuedEvents: this.eventQueue.length,
      offlineEvents: this.offlineQueue.length,
      successRate,
    };
  }

  /**
   * Print statistics
   */
  printStats(): void {
    const stats = this.getStats();

    devLog.log('\n========================================');
    devLog.log('    ANALYTICS STATISTICS');
    devLog.log('========================================\n');
    devLog.log(`Total Events Tracked: ${stats.totalEvents}`);
    devLog.log(`Queued Events: ${stats.queuedEvents}`);
    devLog.log(`Offline Events: ${stats.offlineEvents}`);
    devLog.log(`Batches Sent: ${stats.batchesSent}`);
    devLog.log(`Failed Batches: ${stats.failedBatches}`);
    devLog.log(`Average Batch Size: ${stats.avgBatchSize.toFixed(1)}`);
    devLog.log(`Success Rate: ${stats.successRate.toFixed(1)}%\n`);
    devLog.log('========================================\n');
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.stats = {
      totalEvents: 0,
      batchesSent: 0,
      offlineEvents: 0,
      failedBatches: 0,
      avgBatchSize: 0,
    };
  }

  /**
   * Clear all queues
   */
  async clearQueues(): Promise<void> {
    this.eventQueue = [];
    this.offlineQueue = [];
    await AsyncStorage.removeItem(OFFLINE_QUEUE_KEY);
    devLog.log('[Analytics] All queues cleared');
  }

  /**
   * Cleanup on app close
   */
  async cleanup(): Promise<void> {
    // Stop auto-flush
    this.stopAutoFlush();

    // Cleanup network listener
    if (this.netInfoUnsubscribe) {
      this.netInfoUnsubscribe();
      this.netInfoUnsubscribe = null;
    }

    // Flush remaining events
    await this.flush();

    devLog.log('[Analytics] Cleanup complete');
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

// Singleton pattern using globalThis to persist across SSR module re-evaluations
const OPTIMIZED_ANALYTICS_SERVICE_KEY = '__rezOptimizedAnalyticsService__';

function getOptimizedAnalyticsService(): OptimizedAnalyticsService {
  if (typeof globalThis !== 'undefined') {
    if (!(globalThis as any)[OPTIMIZED_ANALYTICS_SERVICE_KEY]) {
      (globalThis as any)[OPTIMIZED_ANALYTICS_SERVICE_KEY] = new OptimizedAnalyticsService();
    }
    return (globalThis as any)[OPTIMIZED_ANALYTICS_SERVICE_KEY];
  }
  return new OptimizedAnalyticsService();
}

export const optimizedAnalyticsService = getOptimizedAnalyticsService();
export default optimizedAnalyticsService;
