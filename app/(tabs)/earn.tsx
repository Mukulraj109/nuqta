import { Redirect } from 'expo-router';

// Redirect to Play & Earn page synchronously — no spinner flash.
// Uses Redirect component instead of useEffect + router.replace to avoid:
// 1. The spinner flash on every tab tap
// 2. Navigation loop when pressing back
export default function EarnScreen() {
  return <Redirect href="/playandearn" />;
}
