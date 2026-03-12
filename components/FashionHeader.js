import React, { useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  Easing,
} from "react-native-reanimated";
import { useProfile, useProfileMenu } from '@/contexts/ProfileContext';
import { useAuth } from '@/contexts/AuthContext';
import authService from '@/services/authApi';
import ProfileMenuModal from '@/components/profile/ProfileMenuModal';
import { profileMenuSections } from '@/data/profileData';

const FashionHeader = () => {
  const router = useRouter();
  const { user, isModalVisible, showModal, hideModal } = useProfile();
  const { handleMenuItemPress } = useProfileMenu();
  const { state: authState } = useAuth();
  const [userPoints, setUserPoints] = React.useState(0);

  // Animations
  const fadeAnim = useSharedValue(0);
  const slideAnim = useSharedValue(-50);
  const scaleBadge = useSharedValue(0.8);

  useEffect(() => {
    fadeAnim.value = withTiming(1, {
      duration: 800,
      easing: Easing.out(Easing.cubic),
    });
    slideAnim.value = withSpring(0, { damping: 15, stiffness: 100 });
    scaleBadge.value = withSpring(1, {
      damping: 5,
      stiffness: 200,
      mass: 0.8,
    });
  }, []);

  // Load user points and statistics
  React.useEffect(() => {
    if (authState.user) {
      loadUserStatistics();
    }
  }, [authState.user]);

  const loadUserStatistics = async () => {
    try {
      const response = await authService.getUserStatistics();
      if (response.success && response.data) {
        const stats = response.data;
        const shopPoints = Math.floor((stats.orders?.totalSpent || 0) / 10);
        const referralPoints = (stats.user?.totalReferrals || 0) * 200;
        const videoPoints = (stats.videos?.totalCreated || 0) * 100;
        const totalLoyaltyPoints = shopPoints + referralPoints + videoPoints;

        // Sync loyalty points with wallet
        try {
          const walletApi = (await import('@/services/walletApi')).default;
          const walletResponse = await walletApi.getBalance();

          if (walletResponse.success && walletResponse.data) {
            const wasilCoin = walletResponse.data.coins.find((c) => c.type === 'wasil');
            const actualWalletCoins = wasilCoin?.amount || 0;

            if (totalLoyaltyPoints > actualWalletCoins) {
              const difference = totalLoyaltyPoints - actualWalletCoins;
              const creditResponse = await walletApi.creditLoyaltyPoints({
                amount: difference,
                source: {
                  type: 'loyalty_sync',
                  description: 'Syncing loyalty points to wallet',
                  metadata: {
                    shopPoints,
                    referralPoints,
                    videoPoints,
                    totalCalculated: totalLoyaltyPoints,
                    previousWalletBalance: actualWalletCoins
                  }
                }
              });

              if (creditResponse.success && creditResponse.data) {
                setUserPoints(creditResponse.data.balance.available);
              } else {
                setUserPoints(totalLoyaltyPoints);
              }
            } else {
              setUserPoints(actualWalletCoins);
            }
          } else {
            setUserPoints(totalLoyaltyPoints);
          }
        } catch (walletError) {
          setUserPoints(totalLoyaltyPoints);
        }
      } else {
        const loyaltyPoints = authState.user?.wallet?.totalEarned || authState.user?.wallet?.balance || 0;
        setUserPoints(loyaltyPoints);
      }
    } catch (error) {
      const loyaltyPoints = authState.user?.wallet?.totalEarned || authState.user?.wallet?.balance || 0;
      setUserPoints(loyaltyPoints);
    }
  };

  const animatedHeaderStyle = useAnimatedStyle(() => ({
    opacity: fadeAnim.value,
    transform: [{ translateY: slideAnim.value }],
  }));

  const animatedBadgeStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleBadge.value }],
  }));

  return (
    <View style={styles.wrapper}>
      <LinearGradient
        colors={["#00C06A", "#00996B", "#0B2240"]}
        style={styles.container}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Decorative Pattern Overlay */}
        <View style={styles.patternOverlay} />

        <Animated.View style={[styles.contentWrapper, animatedHeaderStyle]}>
          {/* Top Navigation Row */}
          <View style={styles.topRow}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backButton}
              accessibilityLabel="Go back"
              accessibilityRole="button"
              accessibilityHint="Double tap to return to previous screen"
            >
              <Ionicons name="chevron-back" size={24} color="white" />
            </TouchableOpacity>

            <View style={styles.centerTitle}>
              <Ionicons name="sparkles" size={18} color="#FFD700" style={styles.titleIcon} />
              <Text style={styles.title}>Fashion</Text>
              <Ionicons name="sparkles" size={18} color="#FFD700" style={styles.titleIcon} />
            </View>

            <View style={styles.rightIcons}>
              {/* Coins */}
              <TouchableOpacity
                style={styles.coinContainer}
                onPress={() => router.push('/CoinPage')}
                accessibilityLabel={`Coin balance: ${userPoints} coins`}
                accessibilityRole="button"
                accessibilityHint="Double tap to view coin details"
              >
                <LinearGradient
                  colors={["rgba(255, 255, 255, 0.3)", "rgba(255, 255, 255, 0.15)"]}
                  style={styles.coinGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Ionicons name="star" size={18} color="#FFD700" />
                  <Text style={styles.coinNumber}>{userPoints}</Text>
                </LinearGradient>
              </TouchableOpacity>

              {/* Cart */}
              <TouchableOpacity
                style={styles.cartButton}
                onPress={() => router.push('/CartPage')}
                accessibilityLabel="Open cart"
                accessibilityRole="button"
                accessibilityHint="Double tap to view shopping cart"
              >
                <LinearGradient
                  colors={["rgba(255, 255, 255, 0.25)", "rgba(255, 255, 255, 0.1)"]}
                  style={styles.cartGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Ionicons name="bag-handle-outline" size={22} color="white" />
                </LinearGradient>
              </TouchableOpacity>

              {/* Profile */}
              <TouchableOpacity
                style={styles.profileWrapper}
                onPress={() => {
                  if (authState.isAuthenticated && authState.user) {
                    showModal();
                  }
                }}
                activeOpacity={0.7}
                accessibilityLabel="Open profile menu"
                accessibilityRole="button"
                accessibilityHint="Double tap to open profile and settings menu"
              >
                <LinearGradient
                  colors={["#FFC857", "#FF9F1C", "#00C06A"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.profileGradient}
                >
                  <Text style={styles.profileText}>
                    {user?.initials ||
                     (authState.user?.profile?.firstName ? authState.user.profile.firstName.charAt(0).toUpperCase() :
                      (authState.isAuthenticated ? 'U' : '?')
                     )}
                  </Text>
                </LinearGradient>
                <View style={styles.profileRing} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Sale Section */}
          <View style={styles.saleContent}>
            <View style={styles.saleTextContainer}>
              <Text style={styles.salePreTitle}>✨ Special Offer ✨</Text>
              <Text style={styles.saleTitle}>Wedding Glam</Text>
              <Text style={styles.saleTitleSecond}>in a Flash</Text>

              <Animated.View style={[styles.discountBadge, animatedBadgeStyle]}>
                <LinearGradient
                  colors={["#FFD700", "#FFA500"]}
                  style={styles.badgeGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <View style={styles.badgeContent}>
                    <Text style={styles.uptoText}>UPTO</Text>
                    <Text style={styles.discountText}>50%</Text>
                    <Text style={styles.offText}>OFF</Text>
                  </View>
                  <View style={styles.badgeShine} />
                </LinearGradient>
              </Animated.View>

              <View style={styles.saleTagContainer}>
                <LinearGradient
                  colors={["rgba(255, 255, 255, 0.3)", "rgba(255, 255, 255, 0.1)"]}
                  style={styles.saleTag}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Text style={styles.saleTagText}>LIMITED TIME</Text>
                </LinearGradient>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Bottom Wave Decoration */}
        <View style={styles.bottomWave} />
      </LinearGradient>

      {/* Profile Menu Modal */}
      {user && (
        <ProfileMenuModal
          visible={isModalVisible}
          onClose={hideModal}
          user={user}
          menuSections={profileMenuSections}
          onMenuItemPress={handleMenuItemPress}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: "relative",
  },
  container: {
    paddingTop: 50,
    paddingBottom: 24,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    overflow: "visible",
    position: "relative",
  },
  patternOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    opacity: 0.3,
  },
  contentWrapper: {
    position: "relative",
    zIndex: 1,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  centerTitle: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    marginHorizontal: 10,
  },
  titleIcon: {
    marginHorizontal: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: "white",
    letterSpacing: 1.5,
    textShadowColor: "rgba(0, 0, 0, 0.2)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  rightIcons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  coinContainer: {
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#FFC857",
    shadowOpacity: 0.4,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 5,
  },
  coinGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  coinNumber: {
    fontSize: 14,
    fontWeight: "700",
    color: "white",
    marginLeft: 6,
    textShadowColor: "rgba(0, 0, 0, 0.2)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  cartButton: {
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  cartGradient: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.25)",
  },
  profileWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#FFC857",
    shadowOpacity: 0.5,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 6,
    position: "relative",
  },
  profileGradient: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  profileRing: {
    position: "absolute",
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.4)",
  },
  profileText: {
    fontSize: 16,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: 0.5,
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  saleContent: {
    alignItems: "center",
    marginTop: 20,
    paddingHorizontal: 10,
  },
  saleTextContainer: {
    alignItems: "center",
    width: "100%",
  },
  salePreTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FFD700",
    letterSpacing: 1,
    marginBottom: 10,
    textShadowColor: "rgba(0, 0, 0, 0.2)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  saleTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: "white",
    textAlign: "center",
    letterSpacing: 0.5,
    lineHeight: 32,
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  saleTitleSecond: {
    fontSize: 26,
    fontWeight: "800",
    color: "white",
    textAlign: "center",
    letterSpacing: 0.5,
    lineHeight: 32,
    marginBottom: 14,
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  discountBadge: {
    borderRadius: 30,
    overflow: "hidden",
    shadowColor: "#FFC857",
    shadowOpacity: 0.6,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
    marginBottom: 10,
  },
  badgeGradient: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    position: "relative",
  },
  badgeContent: {
    alignItems: "center",
    zIndex: 1,
  },
  badgeShine: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    opacity: 0.5,
  },
  uptoText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#0B2240",
    letterSpacing: 1.5,
  },
  discountText: {
    fontSize: 32,
    fontWeight: "900",
    color: "#0B2240",
    lineHeight: 36,
    textShadowColor: "rgba(255, 255, 255, 0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  offText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#0B2240",
    letterSpacing: 1.5,
  },
  saleTagContainer: {
    marginTop: 8,
    marginBottom: 4,
  },
  saleTag: {
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  saleTagText: {
    fontSize: 10,
    fontWeight: "700",
    color: "white",
    letterSpacing: 1.2,
    textShadowColor: "rgba(0, 0, 0, 0.2)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  bottomWave: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 15,
    backgroundColor: "#f5f5f5",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
});

export default FashionHeader;
