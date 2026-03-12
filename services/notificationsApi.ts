// Notifications API Service
// Handles push notifications, in-app notifications, and user preferences

import apiClient, { ApiResponse } from './apiClient';

export interface Notification {
  id: string;
  userId: string;
  type: 'order' | 'product' | 'store' | 'video' | 'project' | 'promotion' | 'system' | 'social';
  category: 'info' | 'success' | 'warning' | 'error' | 'update';
  title: string;
  message: string;
  data?: Record<string, any>;
  icon?: string;
  image?: string;
  actions?: Array<{
    id: string;
    title: string;
    url?: string;
    action?: string;
  }>;
  read: boolean;
  readAt?: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  scheduled?: boolean;
  scheduledFor?: string;
  expiresAt?: string;
  metadata: {
    source: 'app' | 'web' | 'email' | 'push' | 'sms';
    channel: string;
    campaign?: string;
    tags: string[];
  };
  createdAt: string;
  updatedAt: string;
}

export interface NotificationPreferences {
  id: string;
  userId: string;
  channels: {
    push: boolean;
    email: boolean;
    sms: boolean;
    inApp: boolean;
  };
  categories: {
    orders: {
      enabled: boolean;
      channels: ('push' | 'email' | 'sms' | 'inApp')[];
    };
    products: {
      enabled: boolean;
      channels: ('push' | 'email' | 'sms' | 'inApp')[];
    };
    stores: {
      enabled: boolean;
      channels: ('push' | 'email' | 'sms' | 'inApp')[];
    };
    videos: {
      enabled: boolean;
      channels: ('push' | 'email' | 'sms' | 'inApp')[];
    };
    projects: {
      enabled: boolean;
      channels: ('push' | 'email' | 'sms' | 'inApp')[];
    };
    promotions: {
      enabled: boolean;
      channels: ('push' | 'email' | 'sms' | 'inApp')[];
    };
    system: {
      enabled: boolean;
      channels: ('push' | 'email' | 'sms' | 'inApp')[];
    };
    social: {
      enabled: boolean;
      channels: ('push' | 'email' | 'sms' | 'inApp')[];
    };
  };
  schedule: {
    quietHours: {
      enabled: boolean;
      start: string; // HH:MM format
      end: string;   // HH:MM format
      timezone: string;
    };
    weekends: {
      enabled: boolean;
      days: ('saturday' | 'sunday')[];
    };
  };
  frequency: {
    digest: 'none' | 'daily' | 'weekly' | 'monthly';
    maxPerDay: number;
    groupSimilar: boolean;
  };
  createdAt: string;
  updatedAt: string;
}

export interface NotificationsQuery {
  page?: number;
  limit?: number;
  type?: Notification['type'];
  category?: Notification['category'];
  read?: boolean;
  priority?: Notification['priority'];
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  sort?: 'newest' | 'oldest' | 'priority' | 'unread_first';
}

export interface NotificationsResponse {
  notifications: Notification[];
  pagination: {
    current: number;
    pages: number;
    total: number;
    limit: number;
  };
  summary: {
    total: number;
    unread: number;
    byType: Record<Notification['type'], number>;
    byPriority: Record<Notification['priority'], number>;
  };
}

export interface PushSubscription {
  id: string;
  userId: string;
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  device: {
    type: 'web' | 'mobile';
    platform: string;
    browser?: string;
    version?: string;
  };
  active: boolean;
  lastUsed: string;
  createdAt: string;
}

export interface NotificationTemplate {
  id: string;
  name: string;
  type: Notification['type'];
  category: Notification['category'];
  title: string;
  message: string;
  variables: string[];
  channels: ('push' | 'email' | 'sms' | 'inApp')[];
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

class NotificationsService {
  // Get user notifications with filtering and pagination
  async getNotifications(query: NotificationsQuery = {}): Promise<ApiResponse<NotificationsResponse>> {
    return apiClient.get('/notifications', query);
  }

  // Get single notification by ID
  async getNotificationById(notificationId: string): Promise<ApiResponse<Notification>> {
    return apiClient.get(`/notifications/${notificationId}`);
  }

  // Mark notification as read
  async markAsRead(notificationId: string): Promise<ApiResponse<{ message: string }>> {
    return apiClient.patch(`/notifications/${notificationId}/read`);
  }

  // Mark all notifications as read
  async markAllAsRead(): Promise<ApiResponse<{ message: string; count: number }>> {
    return apiClient.patch('/notifications/read-all');
  }

  // Mark notification as unread
  async markAsUnread(notificationId: string): Promise<ApiResponse<{ message: string }>> {
    return apiClient.patch(`/notifications/${notificationId}/unread`);
  }

  // Delete notification
  async deleteNotification(notificationId: string): Promise<ApiResponse<{ message: string }>> {
    return apiClient.delete(`/notifications/${notificationId}`);
  }

  // Delete multiple notifications
  async deleteNotifications(notificationIds: string[]): Promise<ApiResponse<{
    message: string;
    deleted: number;
  }>> {
    return apiClient.post('/notifications/bulk-delete', {
      ids: notificationIds
    });
  }

  // Clear all notifications
  async clearAllNotifications(): Promise<ApiResponse<{ message: string; count: number }>> {
    return apiClient.delete('/notifications/clear-all');
  }

  // Get notification preferences
  async getNotificationPreferences(): Promise<ApiResponse<NotificationPreferences>> {
    return apiClient.get('/notifications/preferences');
  }

  // Update notification preferences
  async updateNotificationPreferences(
    preferences: Partial<NotificationPreferences>
  ): Promise<ApiResponse<NotificationPreferences>> {
    return apiClient.patch('/notifications/preferences', preferences);
  }

  // Subscribe to push notifications
  async subscribeToPush(subscription: {
    endpoint: string;
    keys: {
      p256dh: string;
      auth: string;
    };
    device?: {
      type: 'web' | 'mobile';
      platform: string;
      browser?: string;
      version?: string;
    };
  }): Promise<ApiResponse<PushSubscription>> {
    return apiClient.post('/notifications/push/subscribe', subscription);
  }

  // Unsubscribe from push notifications
  async unsubscribeFromPush(subscriptionId?: string): Promise<ApiResponse<{ message: string }>> {
    if (subscriptionId) {
      return apiClient.delete(`/notifications/push/subscribe/${subscriptionId}`);
    }
    return apiClient.delete('/notifications/push/subscribe');
  }

  // Get push subscriptions
  async getPushSubscriptions(): Promise<ApiResponse<PushSubscription[]>> {
    return apiClient.get('/notifications/push/subscriptions');
  }

  // Test push notification
  async testPushNotification(
    subscriptionId: string,
    message: string
  ): Promise<ApiResponse<{ message: string }>> {
    return apiClient.post(`/notifications/push/test/${subscriptionId}`, {
      message
    });
  }

  // Send notification (admin/system use)
  async sendNotification(notification: {
    userId?: string;
    userIds?: string[];
    type: Notification['type'];
    category: Notification['category'];
    title: string;
    message: string;
    data?: Record<string, any>;
    priority?: Notification['priority'];
    scheduledFor?: string;
    expiresAt?: string;
    channels?: ('push' | 'email' | 'sms' | 'inApp')[];
  }): Promise<ApiResponse<{
    notificationId: string;
    sent: number;
    failed: number;
  }>> {
    return apiClient.post('/notifications/send', notification);
  }

  // Get notification statistics
  async getNotificationStats(
    dateRange?: {
      from: string;
      to: string;
    }
  ): Promise<ApiResponse<{
    total: number;
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    byType: Record<Notification['type'], {
      sent: number;
      delivered: number;
      opened: number;
    }>;
    byChannel: Record<'push' | 'email' | 'sms' | 'inApp', {
      sent: number;
      delivered: number;
      opened: number;
    }>;
    engagement: {
      openRate: number;
      clickRate: number;
      unsubscribeRate: number;
    };
  }>> {
    return apiClient.get('/notifications/stats', dateRange);
  }

  // Get notification templates (admin use)
  async getNotificationTemplates(): Promise<ApiResponse<NotificationTemplate[]>> {
    return apiClient.get('/notifications/templates');
  }

  // Create notification template (admin use)
  async createNotificationTemplate(template: {
    name: string;
    type: Notification['type'];
    category: Notification['category'];
    title: string;
    message: string;
    variables?: string[];
    channels: ('push' | 'email' | 'sms' | 'inApp')[];
  }): Promise<ApiResponse<NotificationTemplate>> {
    return apiClient.post('/notifications/templates', template);
  }

  // Update notification template (admin use)
  async updateNotificationTemplate(
    templateId: string,
    updates: Partial<{
      name: string;
      title: string;
      message: string;
      variables: string[];
      channels: ('push' | 'email' | 'sms' | 'inApp')[];
      active: boolean;
    }>
  ): Promise<ApiResponse<NotificationTemplate>> {
    return apiClient.patch(`/notifications/templates/${templateId}`, updates);
  }

  // Send notification using template
  async sendFromTemplate(
    templateId: string,
    data: {
      userId?: string;
      userIds?: string[];
      variables?: Record<string, string>;
      scheduledFor?: string;
      priority?: Notification['priority'];
    }
  ): Promise<ApiResponse<{
    notificationId: string;
    sent: number;
    failed: number;
  }>> {
    return apiClient.post(`/notifications/templates/${templateId}/send`, data);
  }

  // Get unread notifications count
  async getUnreadCount(): Promise<ApiResponse<{
    total: number;
    byType: Record<Notification['type'], number>;
    byPriority: Record<Notification['priority'], number>;
  }>> {
    return apiClient.get('/notifications/unread-count');
  }

  // Snooze notification
  async snoozeNotification(
    notificationId: string,
    snoozeUntil: string
  ): Promise<ApiResponse<{ message: string }>> {
    return apiClient.patch(`/notifications/${notificationId}/snooze`, {
      snoozeUntil
    });
  }

  // Pin notification
  async pinNotification(notificationId: string): Promise<ApiResponse<{ message: string }>> {
    return apiClient.patch(`/notifications/${notificationId}/pin`);
  }

  // Unpin notification
  async unpinNotification(notificationId: string): Promise<ApiResponse<{ message: string }>> {
    return apiClient.patch(`/notifications/${notificationId}/unpin`);
  }

  // Get pinned notifications
  async getPinnedNotifications(): Promise<ApiResponse<Notification[]>> {
    return apiClient.get('/notifications/pinned');
  }

  // Archive notification
  async archiveNotification(notificationId: string): Promise<ApiResponse<{ message: string }>> {
    return apiClient.patch(`/notifications/${notificationId}/archive`);
  }

  // Get archived notifications
  async getArchivedNotifications(
    page: number = 1,
    limit: number = 20
  ): Promise<ApiResponse<NotificationsResponse>> {
    return apiClient.get('/notifications/archived', { page, limit });
  }

  // Restore archived notification
  async restoreNotification(notificationId: string): Promise<ApiResponse<{ message: string }>> {
    return apiClient.patch(`/notifications/${notificationId}/restore`);
  }
}

// Create singleton instance
const notificationsService = new NotificationsService();

export default notificationsService;