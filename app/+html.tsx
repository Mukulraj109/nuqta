import { ScrollViewStyleReset } from 'expo-router/html';

/**
 * HTML Document customization for web platform
 * Minimal reset to avoid interfering with React Native Web
 */
export default function Root({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />

        {/* SEO & Social sharing meta tags */}
        <title>Rez - Earn, Save & Shop Smarter</title>
        <meta name="description" content="Rez is your all-in-one rewards and shopping platform. Earn coins, discover deals, and shop from local stores." />
        <meta property="og:title" content="Rez - Earn, Save & Shop Smarter" />
        <meta property="og:description" content="Discover deals, earn rewards, and shop from local stores with Rez." />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="/assets/og-image.png" />
        <meta property="og:url" content="https://www.rezapp.com" />
        <meta property="og:site_name" content="Rez" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Rez - Earn, Save & Shop Smarter" />
        <meta name="twitter:description" content="Discover deals, earn rewards, and shop from local stores with Rez." />
        <meta name="twitter:image" content="/assets/og-image.png" />
        <meta name="theme-color" content="#7C3AED" />

        {/* Minimal reset - only body margin */}
        <style dangerouslySetInnerHTML={{ __html: `
          body {
            margin: 0;
            padding: 0;
          }
        `}} />

        {/* Expo's ScrollView reset for web */}
        <ScrollViewStyleReset />
      </head>
      <body>{children}</body>
    </html>
  );
}
