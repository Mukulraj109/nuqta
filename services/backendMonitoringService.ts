/**
 * Backend Monitoring Service
 * Tracks backend and API performance metrics
 *
 * Features:
 * - API response times
 * - Database query performance
 * - Cache hit rates
 * - Error rates
 * - Server health checks
 * - Performance degradation alerts
 */

// Dev-only logger to prevent string accumulation in production
const devLog = {
  log: __DEV__ ? console.log.bind(console) : () => {},
  warn: __DEV__ ? console.warn.bind(console) : () => {},
  error: __DEV__ ? console.error.bind(console) : () => {},
};

import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from '@/services/apiClient';

// ============================================================================
// Types
// ============================================================================

export interface APIResponseMetric {
  endpoint: string;
  method: string;
  duration: number;
  statusCode: number;
  success: boolean;
  timestamp: Date;
}

export interface DatabaseQueryMetric {
  collection: string;
  operation: string;
  duration: number;
  recordCount?: number;
  timestamp: Date;
}

export interface CacheOperationMetric {
  operation: 'hit' | 'miss' | 'set' | 'delete';
  key: string;
  timestamp: Date;
}

export interface BackendHealth {
  status: 'healthy' | 'degraded' | 'down';
  apiLatency: number;
  dbLatency: number;
  cacheHitRate: number;
  errorRate: number;
  uptime: number;
  timestamp: Date;
}

export interface PerformanceAlert {
  type: 'api_slow' | 'db_slow' | 'cache_low' | 'error_high' | 'timeout';
  message: string;
  severity: 'warning' | 'critical';
  metric: number;
  threshold: number;
  timestamp: Date;
}

// ============================================================================
// Constants
// ============================================================================

const STORAGE_KEY = 'backend_monitoring';
const MAX_STORED_METRICS = 1000;

// Performance thresholds
const THRESHOLDS = {
  apiLatency: 2000, // 2 seconds
  apiLatencyCritical: 5000, // 5 seconds
  dbLatency: 1000, // 1 second
  dbLatencyCritical: 3000, // 3 seconds
  cacheHitRate: 70, // 70%
  cacheHitRateCritical: 50, // 50%
  errorRate: 5, // 5%
  errorRateCritical: 10, // 10%
};

// ============================================================================
// Backend Monitoring Service Class
// ============================================================================

class BackendMonitoringService {
  private apiMetrics: APIResponseMetric[] = [];
  private dbMetrics: DatabaseQueryMetric[] = [];
  private cacheMetrics: CacheOperationMetric[] = [];
  private alerts: PerformanceAlert[] = [];
  private isEnabled = __DEV__;
  private healthCheckInterval?: NodeJS.Timeout;
  private saveDebounceTimer: NodeJS.Timeout | null = null;

  constructor() {
    // Initialization deferred to setEnabled() or first use
    // to avoid AsyncStorage reads + health check loops during app startup
  }

  /**
   * Initialize service (lazy — called on first enable)
   */
  private async init(): Promise<void> {
    if (this.initialized) return;
    this.initialized = true;
    await this.loadMetrics();
  }

  private initialized = false;

  /**
   * Enable/disable monitoring
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;

    if (enabled) {
      this.init().then(() => this.startHealthChecks()).catch(() => {});
    } else {
      this.stopHealthChecks();
    }

    devLog.log(`[BackendMonitoring] ${enabled ? 'Enabled' : 'Disabled'}`);
  }

  // ============================================================================
  // API Monitoring
  // ============================================================================

  /**
   * Track API response
   */
  trackAPIResponse(
    endpoint: string,
    duration: number,
    statusCode: number,
    method: string = 'GET'
  ): void {
    if (!this.isEnabled) return;

    const success = statusCode >= 200 && statusCode < 400;

    const metric: APIResponseMetric = {
      endpoint,
      method,
      duration,
      statusCode,
      success,
      timestamp: new Date(),
    };

    this.apiMetrics.push(metric);
    this.limitArraySize(this.apiMetrics, MAX_STORED_METRICS);

    // Check for slow API
    if (duration > THRESHOLDS.apiLatencyCritical) {
      this.createAlert({
        type: 'api_slow',
        message: `Critical: API ${method} ${endpoint} took ${duration}ms`,
        severity: 'critical',
        metric: duration,
        threshold: THRESHOLDS.apiLatencyCritical,
        timestamp: new Date(),
      });
    } else if (duration > THRESHOLDS.apiLatency) {
      this.createAlert({
        type: 'api_slow',
        message: `Warning: API ${method} ${endpoint} took ${duration}ms`,
        severity: 'warning',
        metric: duration,
        threshold: THRESHOLDS.apiLatency,
        timestamp: new Date(),
      });
    }

    this.saveMetrics();
  }

  /**
   * Get API latency stats
   */
  getAPILatencyStats(endpoint?: string): {
    avgLatency: number;
    minLatency: number;
    maxLatency: number;
    p95Latency: number;
    successRate: number;
    totalRequests: number;
  } {
    const filtered = endpoint
      ? this.apiMetrics.filter(m => m.endpoint === endpoint)
      : this.apiMetrics;

    if (filtered.length === 0) {
      return {
        avgLatency: 0,
        minLatency: 0,
        maxLatency: 0,
        p95Latency: 0,
        successRate: 100,
        totalRequests: 0,
      };
    }

    const durations = filtered.map(m => m.duration).sort((a, b) => a - b);
    const successCount = filtered.filter(m => m.success).length;

    return {
      avgLatency: durations.reduce((sum, d) => sum + d, 0) / durations.length,
      minLatency: durations[0],
      maxLatency: durations[durations.length - 1],
      p95Latency: durations[Math.floor(durations.length * 0.95)],
      successRate: (successCount / filtered.length) * 100,
      totalRequests: filtered.length,
    };
  }

  // ============================================================================
  // Database Monitoring
  // ============================================================================

  /**
   * Track database query
   */
  trackDatabaseQuery(
    collection: string,
    operation: string,
    duration: number,
    recordCount?: number
  ): void {
    if (!this.isEnabled) return;

    const metric: DatabaseQueryMetric = {
      collection,
      operation,
      duration,
      recordCount,
      timestamp: new Date(),
    };

    this.dbMetrics.push(metric);
    this.limitArraySize(this.dbMetrics, MAX_STORED_METRICS);

    // Check for slow queries
    if (duration > THRESHOLDS.dbLatencyCritical) {
      this.createAlert({
        type: 'db_slow',
        message: `Critical: DB query ${operation} on ${collection} took ${duration}ms`,
        severity: 'critical',
        metric: duration,
        threshold: THRESHOLDS.dbLatencyCritical,
        timestamp: new Date(),
      });
    } else if (duration > THRESHOLDS.dbLatency) {
      this.createAlert({
        type: 'db_slow',
        message: `Warning: DB query ${operation} on ${collection} took ${duration}ms`,
        severity: 'warning',
        metric: duration,
        threshold: THRESHOLDS.dbLatency,
        timestamp: new Date(),
      });
    }

    this.saveMetrics();
  }

  /**
   * Get database query stats
   */
  getDatabaseQueryStats(collection?: string): {
    avgLatency: number;
    slowQueries: number;
    totalQueries: number;
    byOperation: Record<string, number>;
  } {
    const filtered = collection
      ? this.dbMetrics.filter(m => m.collection === collection)
      : this.dbMetrics;

    if (filtered.length === 0) {
      return {
        avgLatency: 0,
        slowQueries: 0,
        totalQueries: 0,
        byOperation: {},
      };
    }

    const byOperation: Record<string, number> = {};
    filtered.forEach(m => {
      byOperation[m.operation] = (byOperation[m.operation] || 0) + 1;
    });

    return {
      avgLatency: filtered.reduce((sum, m) => sum + m.duration, 0) / filtered.length,
      slowQueries: filtered.filter(m => m.duration > THRESHOLDS.dbLatency).length,
      totalQueries: filtered.length,
      byOperation,
    };
  }

  // ============================================================================
  // Cache Monitoring
  // ============================================================================

  /**
   * Track cache operation
   */
  trackCacheOperation(operation: 'hit' | 'miss' | 'set' | 'delete', key: string): void {
    if (!this.isEnabled) return;

    const metric: CacheOperationMetric = {
      operation,
      key,
      timestamp: new Date(),
    };

    this.cacheMetrics.push(metric);
    this.limitArraySize(this.cacheMetrics, MAX_STORED_METRICS);

    // Check cache hit rate periodically
    if (this.cacheMetrics.length % 100 === 0) {
      const hitRate = this.getCacheHitRate();

      if (hitRate < THRESHOLDS.cacheHitRateCritical) {
        this.createAlert({
          type: 'cache_low',
          message: `Critical: Cache hit rate is ${hitRate.toFixed(1)}%`,
          severity: 'critical',
          metric: hitRate,
          threshold: THRESHOLDS.cacheHitRateCritical,
          timestamp: new Date(),
        });
      } else if (hitRate < THRESHOLDS.cacheHitRate) {
        this.createAlert({
          type: 'cache_low',
          message: `Warning: Cache hit rate is ${hitRate.toFixed(1)}%`,
          severity: 'warning',
          metric: hitRate,
          threshold: THRESHOLDS.cacheHitRate,
          timestamp: new Date(),
        });
      }
    }

    this.saveMetrics();
  }

  /**
   * Get cache hit rate
   */
  getCacheHitRate(): number {
    const relevantOps = this.cacheMetrics.filter(
      m => m.operation === 'hit' || m.operation === 'miss'
    );

    if (relevantOps.length === 0) return 0;

    const hits = relevantOps.filter(m => m.operation === 'hit').length;
    return (hits / relevantOps.length) * 100;
  }

  // ============================================================================
  // Health Checks
  // ============================================================================

  /**
   * Start periodic health checks
   */
  private startHealthChecks(): void {
    // Clear existing interval before starting new one
    this.stopHealthChecks();

    // Run health check every minute
    this.healthCheckInterval = setInterval(() => {
      this.performHealthCheck();
    }, 60000);

    // Run initial check
    this.performHealthCheck();
  }

  /**
   * Stop health checks
   */
  private stopHealthChecks(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = undefined;
    }
  }

  /**
   * Perform health check
   */
  private async performHealthCheck(): Promise<void> {
    try {
      const health = await this.getBackendHealth();

      devLog.log(`[BackendMonitoring] Health check: ${health.status}`);

      // Log degraded or down status
      if (health.status !== 'healthy') {
        devLog.warn('[BackendMonitoring] Backend health is degraded:', health);
      }
    } catch (error) {
      devLog.error('[BackendMonitoring] Health check failed:', error);
    }
  }

  /**
   * Get backend health status
   */
  async getBackendHealth(): Promise<BackendHealth> {
    const now = Date.now();

    // Calculate metrics from last hour
    const oneHourAgo = now - 60 * 60 * 1000;
    const recentAPIMetrics = this.apiMetrics.filter(
      m => m.timestamp.getTime() > oneHourAgo
    );
    const recentDBMetrics = this.dbMetrics.filter(
      m => m.timestamp.getTime() > oneHourAgo
    );

    // API latency
    const apiLatency = recentAPIMetrics.length > 0
      ? recentAPIMetrics.reduce((sum, m) => sum + m.duration, 0) / recentAPIMetrics.length
      : 0;

    // DB latency
    const dbLatency = recentDBMetrics.length > 0
      ? recentDBMetrics.reduce((sum, m) => sum + m.duration, 0) / recentDBMetrics.length
      : 0;

    // Cache hit rate
    const cacheHitRate = this.getCacheHitRate();

    // Error rate
    const totalRequests = recentAPIMetrics.length;
    const failedRequests = recentAPIMetrics.filter(m => !m.success).length;
    const errorRate = totalRequests > 0
      ? (failedRequests / totalRequests) * 100
      : 0;

    // Determine health status
    let status: BackendHealth['status'] = 'healthy';

    if (
      apiLatency > THRESHOLDS.apiLatencyCritical ||
      dbLatency > THRESHOLDS.dbLatencyCritical ||
      errorRate > THRESHOLDS.errorRateCritical
    ) {
      status = 'down';
    } else if (
      apiLatency > THRESHOLDS.apiLatency ||
      dbLatency > THRESHOLDS.dbLatency ||
      cacheHitRate < THRESHOLDS.cacheHitRate ||
      errorRate > THRESHOLDS.errorRate
    ) {
      status = 'degraded';
    }

    return {
      status,
      apiLatency,
      dbLatency,
      cacheHitRate,
      errorRate,
      uptime: 99.9, // TODO: Calculate from actual uptime data
      timestamp: new Date(),
    };
  }

  /**
   * Check performance thresholds
   */
  checkPerformanceThresholds(): {
    alerts: PerformanceAlert[];
  } {
    // Return recent alerts (last hour)
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    const recentAlerts = this.alerts.filter(
      a => a.timestamp.getTime() > oneHourAgo
    );

    return { alerts: recentAlerts };
  }

  // ============================================================================
  // Alert Management
  // ============================================================================

  /**
   * Create performance alert
   */
  private createAlert(alert: PerformanceAlert): void {
    this.alerts.push(alert);

    // Keep only last 100 alerts
    if (this.alerts.length > 100) {
      this.alerts.shift();
    }

    // Log alert
    const emoji = alert.severity === 'critical' ? '🔥' : '⚠️';
    devLog.warn(`${emoji} [BackendMonitoring] ${alert.message}`);

    this.saveMetrics();
  }

  /**
   * Get recent alerts
   */
  getRecentAlerts(count: number = 10): PerformanceAlert[] {
    return this.alerts.slice(-count).reverse();
  }

  /**
   * Clear alerts
   */
  clearAlerts(): void {
    this.alerts = [];
    this.saveMetrics();
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  /**
   * Limit array size
   */
  private limitArraySize<T>(array: T[], maxSize: number): void {
    while (array.length > maxSize) {
      array.shift();
    }
  }

  /**
   * Save metrics to storage
   */
  private saveMetrics(): void {
    // Debounce saves to avoid excessive AsyncStorage writes
    if (this.saveDebounceTimer) clearTimeout(this.saveDebounceTimer);
    this.saveDebounceTimer = setTimeout(async () => {
      try {
        const data = {
          apiMetrics: this.apiMetrics.slice(-MAX_STORED_METRICS),
          dbMetrics: this.dbMetrics.slice(-MAX_STORED_METRICS),
          cacheMetrics: this.cacheMetrics.slice(-MAX_STORED_METRICS),
          alerts: this.alerts.slice(-100),
        };

        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      } catch (error) {
        devLog.error('[BackendMonitoring] Failed to save metrics:', error);
      }
    }, 5000);
  }

  /**
   * Load metrics from storage
   */
  private async loadMetrics(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);

        this.apiMetrics = (data.apiMetrics || []).map((m: any) => ({
          ...m,
          timestamp: new Date(m.timestamp),
        }));

        this.dbMetrics = (data.dbMetrics || []).map((m: any) => ({
          ...m,
          timestamp: new Date(m.timestamp),
        }));

        this.cacheMetrics = (data.cacheMetrics || []).map((m: any) => ({
          ...m,
          timestamp: new Date(m.timestamp),
        }));

        this.alerts = (data.alerts || []).map((a: any) => ({
          ...a,
          timestamp: new Date(a.timestamp),
        }));

        devLog.log('[BackendMonitoring] Loaded stored metrics');
      }
    } catch (error) {
      devLog.error('[BackendMonitoring] Failed to load metrics:', error);
    }
  }

  /**
   * Clear all metrics
   */
  async clearMetrics(): Promise<void> {
    this.apiMetrics = [];
    this.dbMetrics = [];
    this.cacheMetrics = [];
    this.alerts = [];

    await AsyncStorage.removeItem(STORAGE_KEY);
    devLog.log('[BackendMonitoring] All metrics cleared');
  }

  /**
   * Export metrics as JSON
   */
  exportMetrics(): string {
    return JSON.stringify({
      apiMetrics: this.apiMetrics,
      dbMetrics: this.dbMetrics,
      cacheMetrics: this.cacheMetrics,
      alerts: this.alerts,
    }, null, 2);
  }

  /**
   * Print monitoring report
   */
  async printReport(): Promise<void> {
    const health = await this.getBackendHealth();
    const apiStats = this.getAPILatencyStats();
    const dbStats = this.getDatabaseQueryStats();
    const alerts = this.getRecentAlerts(5);

    devLog.log('\n========================================');
    devLog.log('    BACKEND MONITORING REPORT');
    devLog.log('========================================\n');

    devLog.log(`Status: ${health.status.toUpperCase()}\n`);

    devLog.log('Performance Metrics:');
    devLog.log(`  API Latency: ${health.apiLatency.toFixed(0)}ms (avg)`);
    devLog.log(`  API P95: ${apiStats.p95Latency.toFixed(0)}ms`);
    devLog.log(`  DB Latency: ${health.dbLatency.toFixed(0)}ms (avg)`);
    devLog.log(`  Cache Hit Rate: ${health.cacheHitRate.toFixed(1)}%`);
    devLog.log(`  Error Rate: ${health.errorRate.toFixed(1)}%\n`);

    devLog.log('API Stats:');
    devLog.log(`  Total Requests: ${apiStats.totalRequests}`);
    devLog.log(`  Success Rate: ${apiStats.successRate.toFixed(1)}%\n`);

    devLog.log('Database Stats:');
    devLog.log(`  Total Queries: ${dbStats.totalQueries}`);
    devLog.log(`  Slow Queries: ${dbStats.slowQueries}\n`);

    if (alerts.length > 0) {
      devLog.log('Recent Alerts:');
      alerts.forEach((alert, index) => {
        const emoji = alert.severity === 'critical' ? '🔥' : '⚠️';
        devLog.log(`  ${index + 1}. ${emoji} ${alert.message}`);
      });
      devLog.log('');
    }

    devLog.log('========================================\n');
  }

  /**
   * Destroy service and cleanup resources
   */
  destroy(): void {
    this.stopHealthChecks();
    this.isEnabled = false;
    devLog.log('[BackendMonitoring] Service destroyed');
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

export const backendMonitoringService = new BackendMonitoringService();
export default backendMonitoringService;
