import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withRepeat,
    withSequence,
    withTiming,
    FadeInUp,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import FlowScreenLayout from '../../shared/FlowScreenLayout';
import ActionBtn from '../../shared/ActionBtn';
import { NavigationAction, BackAction } from '../../types';
import { Ionicons } from '@expo/vector-icons';
import { useRegion } from '@/contexts/RegionContext';
import { BRAND } from '@/constants/brand';

interface Props {
    onNavigate: NavigationAction;
    onBack: BackAction;
}

const coins = [
    {
        name: BRAND.COIN_NAME,
        desc: 'Usable everywhere',
        amount: '250',
        icon: 'layers',
        color: '#1a3a52',
        gradient: ['#faf1e0', '#ffd7b5'] as [string, string],
    },
    {
        name: 'Brand Coins',
        desc: 'Never expire',
        amount: '150',
        icon: 'diamond',
        color: '#7C3AED',
        gradient: ['#EDE9FE', '#DDD6FE'] as [string, string],
    },
    {
        name: 'Promo Coins',
        desc: 'Limited time offers',
        amount: '50',
        icon: 'flash',
        color: '#F59E0B',
        gradient: ['#FEF3C7', '#FDE68A'] as [string, string],
    },
];

const WalletOverviewScreen: React.FC<Props> = ({ onNavigate, onBack }) => {
    const { getCurrencySymbol } = useRegion();
    const currencySymbol = getCurrencySymbol();
    const walletScale = useSharedValue(0);

    useEffect(() => {
        walletScale.value = withSequence(
            withSpring(1.1, { damping: 8 }),
            withSpring(1, { damping: 12 })
        );
    }, []);

    const walletStyle = useAnimatedStyle(() => ({
        transform: [{ scale: walletScale.value }],
    }));

    return (
        <FlowScreenLayout
            title={`Your ${BRAND.APP_NAME} Wallet`}
            subtitle="All your rewards in one place"
            onBack={onBack}
            footer={<ActionBtn title="See How to Use" onPress={() => onNavigate('D2')} />}
            headerAccent="#F59E0B"
        >
            <View style={styles.container}>
                {/* Wallet hero */}
                <Animated.View style={[styles.walletHero, walletStyle]}>
                    <LinearGradient
                        colors={['#1F2937', '#374151']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.walletGradient}
                    >
                        <View style={styles.walletHeader}>
                            <View style={styles.walletIcon}>
                                <Ionicons name="wallet" size={24} color="#F59E0B" />
                            </View>
                            <Text style={styles.walletLabel}>TOTAL BALANCE</Text>
                        </View>
                        <Text style={styles.walletAmount}>450 Coins</Text>
                        <Text style={styles.walletValue}>Worth ~{currencySymbol}450</Text>
                        <View style={styles.walletChip}>
                            <Ionicons name="trending-up" size={14} color="#ffcd57" />
                            <Text style={styles.chipText}>+85 this month</Text>
                        </View>
                    </LinearGradient>
                </Animated.View>

                {/* Coin types */}
                <View style={styles.coinsSection}>
                    <Text style={styles.sectionTitle}>Your Coins Breakdown</Text>
                    {coins.map((coin, index) => (
                        <Animated.View
                            key={index}
                            entering={FadeInUp.delay(200 + index * 100).springify()}
                        >
                            <LinearGradient
                                colors={coin.gradient}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={styles.coinCard}
                            >
                                <View style={styles.coinIcon}>
                                    <Ionicons name={coin.icon as any} size={24} color={coin.color} />
                                </View>
                                <View style={styles.coinInfo}>
                                    <Text style={[styles.coinName, { color: coin.color }]}>{coin.name}</Text>
                                    <Text style={styles.coinDesc}>{coin.desc}</Text>
                                </View>
                                <View style={styles.coinAmountContainer}>
                                    <Text style={[styles.coinAmount, { color: coin.color }]}>{coin.amount}</Text>
                                    <Text style={styles.coinUnit}>coins</Text>
                                </View>
                            </LinearGradient>
                        </Animated.View>
                    ))}
                </View>

                {/* Info tip */}
                <Animated.View
                    entering={FadeInUp.delay(600).springify()}
                    style={styles.infoTip}
                >
                    <Ionicons name="information-circle" size={20} color="#3B82F6" />
                    <Text style={styles.infoText}>
                        {`1 ${BRAND.COIN_SINGLE} = ${currencySymbol}1. Use them anywhere in the ${BRAND.APP_NAME} network!`}
                    </Text>
                </Animated.View>
            </View>
        </FlowScreenLayout>
    );
};

const styles = StyleSheet.create({
    container: {
        gap: 20,
    },
    walletHero: {
        borderRadius: 24,
        overflow: 'hidden',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 12 },
                shadowOpacity: 0.2,
                shadowRadius: 20,
            },
            android: {
                elevation: 12,
            },
        }),
    },
    walletGradient: {
        padding: 24,
        borderRadius: 24,
    },
    walletHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    walletIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: 'rgba(245, 158, 11, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    walletLabel: {
        fontSize: 12,
        fontWeight: '700',
        color: '#9CA3AF',
        letterSpacing: 1.5,
    },
    walletAmount: {
        fontSize: 42,
        fontWeight: '900',
        color: '#FFFFFF',
        marginBottom: 4,
    },
    walletValue: {
        fontSize: 16,
        color: '#9CA3AF',
        marginBottom: 16,
    },
    walletChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: 'rgba(255, 205, 87, 0.15)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        alignSelf: 'flex-start',
    },
    chipText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#ffcd57',
    },
    coinsSection: {
        gap: 12,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#6B7280',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 4,
    },
    coinCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.8)',
    },
    coinIcon: {
        width: 48,
        height: 48,
        borderRadius: 14,
        backgroundColor: 'rgba(255,255,255,0.8)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
    },
    coinInfo: {
        flex: 1,
    },
    coinName: {
        fontSize: 17,
        fontWeight: '700',
        marginBottom: 2,
    },
    coinDesc: {
        fontSize: 13,
        color: '#6B7280',
    },
    coinAmountContainer: {
        alignItems: 'flex-end',
    },
    coinAmount: {
        fontSize: 24,
        fontWeight: '800',
    },
    coinUnit: {
        fontSize: 11,
        color: '#6B7280',
        fontWeight: '600',
    },
    infoTip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        backgroundColor: '#EFF6FF',
        padding: 14,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#DBEAFE',
    },
    infoText: {
        flex: 1,
        fontSize: 14,
        color: '#1D4ED8',
        lineHeight: 20,
    },
});

export default React.memo(WalletOverviewScreen);
