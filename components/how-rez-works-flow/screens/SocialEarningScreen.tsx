import React, { useEffect } from 'react';
import { BRAND } from '@/constants/brand';
import { View, Text, StyleSheet, Platform, Pressable } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withDelay,
    FadeInUp,
} from 'react-native-reanimated';
import FlowScreenLayout from '../shared/FlowScreenLayout';
import ActionBtn from '../shared/ActionBtn';
import { NavigationAction, BackAction } from '../types';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface Props {
    onNavigate: NavigationAction;
    onBack: BackAction;
}

const earningOptions = [
    {
        icon: 'camera',
        title: 'Upload Bill',
        subtitle: 'Earn coins on any purchase',
        coins: '+20',
        colors: ['#FEF3C7', '#FDE68A'] as [string, string],
        iconColor: '#F59E0B',
    },
    {
        icon: 'star',
        title: 'Write Review',
        subtitle: 'Share your experience',
        coins: '+15',
        colors: ['#FCE7F3', '#FBCFE8'] as [string, string],
        iconColor: '#EC4899',
    },
    {
        icon: 'share-social',
        title: 'Share with Friends',
        subtitle: 'Invite & earn together',
        coins: '+50',
        colors: ['#DBEAFE', '#BFDBFE'] as [string, string],
        iconColor: '#3B82F6',
    },
];

const SocialEarningScreen: React.FC<Props> = ({ onNavigate, onBack }) => {
    return (
        <FlowScreenLayout
            title="Want to earn more?"
            subtitle={`Extra ways to boost your ${BRAND.COIN_NAME}`}
            onBack={onBack}
            footer={<ActionBtn title="Earn Extra Coins" onPress={() => onNavigate('TRUST')} />}
        >
            <View style={styles.container}>
                {/* Header illustration */}
                <Animated.View
                    entering={FadeInUp.delay(100).springify()}
                    style={styles.headerIllustration}
                >
                    <LinearGradient
                        colors={['#1a3a52', '#ffcd57']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.coinStack}
                    >
                        <Ionicons name="layers" size={32} color="#FFFFFF" />
                        <View style={styles.plusBadge}>
                            <Text style={styles.plusText}>+</Text>
                        </View>
                    </LinearGradient>
                </Animated.View>

                {/* Earning Options */}
                <View style={styles.optionsContainer}>
                    {earningOptions.map((option, index) => (
                        <Animated.View
                            key={index}
                            entering={FadeInUp.delay(200 + index * 100).springify()}
                        >
                            <Pressable
                                style={styles.optionCard}
                               
                            >
                                <LinearGradient
                                    colors={option.colors}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                    style={styles.optionGradient}
                                >
                                    <View style={styles.optionContent}>
                                        <View style={[styles.iconCircle, { backgroundColor: 'rgba(255,255,255,0.9)' }]}>
                                            <Ionicons name={option.icon as any} size={26} color={option.iconColor} />
                                        </View>
                                        <View style={styles.optionText}>
                                            <Text style={styles.optionTitle}>{option.title}</Text>
                                            <Text style={styles.optionSubtitle}>{option.subtitle}</Text>
                                        </View>
                                        <View style={styles.coinsTag}>
                                            <Ionicons name="layers" size={14} color="#1a3a52" />
                                            <Text style={styles.coinsText}>{option.coins}</Text>
                                        </View>
                                    </View>
                                </LinearGradient>
                            </Pressable>
                        </Animated.View>
                    ))}
                </View>

                {/* Bonus tip */}
                <Animated.View
                    entering={FadeInUp.delay(600).springify()}
                    style={styles.tipCard}
                >
                    <Ionicons name="bulb" size={20} color="#F59E0B" />
                    <Text style={styles.tipText}>
                        The more you engage, the faster you unlock tier benefits!
                    </Text>
                </Animated.View>
            </View>
        </FlowScreenLayout>
    );
};

const styles = StyleSheet.create({
    container: {
        marginTop: 16,
    },
    headerIllustration: {
        alignItems: 'center',
        marginBottom: 28,
    },
    coinStack: {
        width: 80,
        height: 80,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
        ...Platform.select({
            ios: {
                shadowColor: '#1a3a52',
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.3,
                shadowRadius: 16,
            },
            android: {
                elevation: 8,
            },
        }),
    },
    plusBadge: {
        position: 'absolute',
        top: -8,
        right: -8,
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: '#faf1e0',
    },
    plusText: {
        fontSize: 20,
        fontWeight: '900',
        color: '#1a3a52',
    },
    optionsContainer: {
        gap: 16,
    },
    optionCard: {
        borderRadius: 20,
        overflow: 'hidden',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.08,
                shadowRadius: 12,
            },
            android: {
                elevation: 4,
            },
        }),
    },
    optionGradient: {
        borderRadius: 20,
        padding: 20,
    },
    optionContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconCircle: {
        width: 52,
        height: 52,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    optionText: {
        flex: 1,
    },
    optionTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 4,
    },
    optionSubtitle: {
        fontSize: 14,
        color: '#6B7280',
    },
    coinsTag: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#faf1e0',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 12,
    },
    coinsText: {
        fontSize: 15,
        fontWeight: '800',
        color: '#1a3a52',
    },
    tipCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: '#FFFBEB',
        padding: 16,
        borderRadius: 16,
        marginTop: 24,
        borderWidth: 1,
        borderColor: '#FEF3C7',
    },
    tipText: {
        flex: 1,
        fontSize: 14,
        color: '#92400E',
        lineHeight: 20,
    },
});

export default SocialEarningScreen;
