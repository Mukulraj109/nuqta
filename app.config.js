// Dynamic Expo config — imports brand constants for easy rebranding
// Deployment-specific identifiers (slug, bundleIdentifier, package, merchantIdentifier)
// are left hardcoded — they require manual store/infra changes to rebrand.

const fs = require('fs');
const path = require('path');

const BRAND_NAME = 'Rez';

// Firebase plugin requires google-services.json (Android) / GoogleService-Info.plist (iOS).
// Skip plugin when missing to prevent instant crash on app launch.
const hasFirebaseAndroid = fs.existsSync(path.join(__dirname, 'google-services.json'));
const hasFirebaseIos = fs.existsSync(path.join(__dirname, 'GoogleService-Info.plist'));
const hasFirebaseConfig = hasFirebaseAndroid || hasFirebaseIos;

module.exports = {
  expo: {
    name: BRAND_NAME,
    slug: 'nuqta', // App store identifier — manual change only
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/images/icon.png',
    scheme: 'nuqta', // Deep link scheme — manual change only
    userInterfaceStyle: 'automatic',
    newArchEnabled: false,
    notification: {
      vapidPublicKey:
        'BKJ7f1ZYHKG3ttcLtHvgpfdQBRqf2uPGhPpGcqx7zDK6Pf6sbaPd7Koev-x-FiazRezdzFquFW3pZuEX1T8zqCk',
      serviceWorkerPath: '/expo-service-worker.js',
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.nuqta.app', // App Store identifier — manual change only
      buildNumber: '1',
      infoPlist: {
        NSCameraUsageDescription: `${BRAND_NAME} needs camera access to scan QR codes for store payments`,
        NSLocationWhenInUseUsageDescription: `${BRAND_NAME} needs your location to show nearby stores and offers`,
        NSPhotoLibraryUsageDescription: `${BRAND_NAME} needs photo access to upload profile pictures and bills`,
        NSLocationAlwaysAndWhenInUseUsageDescription: `${BRAND_NAME} needs your location to show nearby stores and offers`,
      },
    },
    android: {
      googleServicesFile: './google-services.json',
      adaptiveIcon: {
        foregroundImage: './assets/images/adaptive-icon.png',
        backgroundColor: '#1a3a52',
      },
      edgeToEdgeEnabled: false,
      package: 'com.nuqta.app', // Play Store identifier — manual change only
      versionCode: 1,
      permissions: [
        'android.permission.CAMERA',
        'android.permission.ACCESS_FINE_LOCATION',
        'android.permission.ACCESS_COARSE_LOCATION',
        'android.permission.READ_EXTERNAL_STORAGE',
        'android.permission.WRITE_EXTERNAL_STORAGE',
        'android.permission.VIBRATE',
        'android.permission.RECEIVE_BOOT_COMPLETED',
        'android.permission.RECORD_AUDIO',
        'android.permission.POST_NOTIFICATIONS',
      ],
    },
    web: {
      bundler: 'metro',
      output: 'static',
      favicon: './assets/images/favicon.png',
    },
    plugins: [
      'expo-router',
      [
        'expo-splash-screen',
        {
          image: './assets/images/splash-icon.png',
          imageWidth: 200,
          resizeMode: 'contain',
          backgroundColor: '#1a3a52',
        },
      ],
      [
        'expo-camera',
        {
          cameraPermission: `Allow ${BRAND_NAME} to use your camera for QR code scanning`,
        },
      ],
      [
        'expo-location',
        {
          locationAlwaysAndWhenInUsePermission: `Allow ${BRAND_NAME} to use your location to find nearby stores and offers`,
        },
      ],
      // expo-notifications requires Firebase/FCM on Android — skip when google-services.json missing
      ...(hasFirebaseConfig
        ? [
            [
              'expo-notifications',
              {
                color: '#1a3a52',
              },
            ],
          ]
        : []),
      [
        'expo-image-picker',
        {
          photosPermission: `Allow ${BRAND_NAME} to access your photos for profile pictures and bill uploads`,
        },
      ],
      [
        '@stripe/stripe-react-native',
        {
          merchantIdentifier: 'merchant.com.nuqta.app', // Stripe config — manual change only
          enableGooglePay: true,
        },
      ],
      // Firebase plugin — only apply when google-services.json exists (prevents Android crash)
      ...(hasFirebaseConfig
        ? [
            [
              '@react-native-firebase/app',
              {
                android: { googleServicesFile: './google-services.json' },
                ios: { googleServicesFile: './GoogleService-Info.plist' },
              },
            ],
          ]
        : []),
    ],
    experiments: {
      typedRoutes: true,
    },
    extra: {
      eas: {
        projectId: '58b80355-a254-4d4a-80ce-d2bc3272b144',
      },
      router: {
        origin: false,
      },
    },
  },
};
