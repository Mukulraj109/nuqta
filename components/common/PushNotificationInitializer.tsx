import { usePushNotifications } from '@/hooks/usePushNotifications';

/**
 * Invisible component that initializes push notifications.
 * Lazy-loaded to defer importing expo-notifications + expo-device
 * until after the homepage has rendered.
 */
const PushNotificationInitializer = () => {
  usePushNotifications();
  return null;
};

export default PushNotificationInitializer;
