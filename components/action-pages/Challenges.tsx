/**
 * 30-Day Fitness Challenge Page
 * /MainCategory/fitness-sports/challenges
 * Shows fitness challenges users can join to earn rewards
 */

import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, Pressable, ScrollView,
  RefreshControl, ActivityIndicator, Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { platformAlertSimple, platformAlertConfirm } from '@/utils/platformAlert';
import { SafeAreaView } from 'react-native-safe-area-context';
import apiClient from '@/services/apiClient';
import { colors } from '@/constants/theme';
import { useIsMounted } from '@/hooks/useIsMounted';

const COLORS = {
  orange: colors.brand.orange,
  orangeDark: colors.brand.orangeDark,
  orangeLight: colors.tint.orange,
  primaryGold: colors.warningScale[400],
  textPrimary: colors.neutral[900],
  textSecondary: colors.neutral[500],
  white: colors.background.primary,
  background: colors.tint.warmGray,
  border: colors.neutral[200],
  green: colors.brand.greenDark,
  red: colors.error,
};

interface Challenge {
  id: string;
  title: string;
  description: string;
  icon: string;
  duration: string;
  reward: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  participants: number;
  gradient: [string, string];
  tasks: string[];
}

const CHALLENGES: Challenge[] = [
  {
    id: '30-day-gym',
    title: '30-Day Gym Challenge',
    description: 'Visit the gym every day for 30 days. Earn 500 bonus coins!',
    icon: '\uD83C\uDFCB\uFE0F',
    duration: '30 days',
    reward: 500,
    difficulty: 'Hard',
    participants: 1247,
    gradient: [colors.error, colors.error],
    tasks: ['Visit gym daily', 'Log each workout', 'Complete 30 check-ins'],
  },
  {
    id: '7-day-yoga',
    title: '7-Day Yoga Streak',
    description: 'Practice yoga for 7 consecutive days. Perfect for beginners!',
    icon: '\uD83E\uDDD8',
    duration: '7 days',
    reward: 150,
    difficulty: 'Easy',
    participants: 3456,
    gradient: [colors.brand.purpleLight, colors.brand.purple],
    tasks: ['Attend a yoga class', 'Practice at least 30 min', 'Complete 7 sessions'],
  },
  {
    id: 'try-5-workouts',
    title: 'Try 5 Different Workouts',
    description: 'Explore different fitness activities. Try 5 unique workout types!',
    icon: '\uD83D\uDD25',
    duration: '14 days',
    reward: 250,
    difficulty: 'Medium',
    participants: 2189,
    gradient: [colors.brand.orange, colors.brand.orangeDark],
    tasks: ['Try 5 different workout types', 'Rate each experience', 'Share your journey'],
  },
  {
    id: 'swimming-10',
    title: '10 Swimming Sessions',
    description: 'Complete 10 swimming sessions this month for water fitness!',
    icon: '\uD83C\uDFCA',
    duration: '30 days',
    reward: 300,
    difficulty: 'Medium',
    participants: 892,
    gradient: [colors.infoScale[400], colors.brand.blue],
    tasks: ['Swim at least 30 min per session', 'Complete 10 sessions', 'Track your progress'],
  },
  {
    id: 'morning-warrior',
    title: 'Morning Warrior',
    description: 'Work out before 8 AM for 14 days straight. Early bird gets the gains!',
    icon: '\uD83C\uDF05',
    duration: '14 days',
    reward: 350,
    difficulty: 'Hard',
    participants: 1567,
    gradient: [colors.warningScale[400], colors.warningScale[700]],
    tasks: ['Check in before 8:00 AM', 'Complete a workout', '14 consecutive mornings'],
  },
];

const getDifficultyColor = (difficulty: Challenge['difficulty']): string => {
  switch (difficulty) {
    case 'Easy': return COLORS.green;
    case 'Medium': return COLORS.orange;
    case 'Hard': return COLORS.red;
    default: return COLORS.textSecondary;
  }
};

const formatParticipants = (count: number): string => {
  if (count >= 1000) return `${(count / 1000).toFixed(1)}k`;
  return count.toString();
};

function ChallengesPage() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [joinedChallenges, setJoinedChallenges] = useState<Set<string>>(new Set());
  const isMounted = useIsMounted();

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    // Static data - simulate refresh
    if (!isMounted()) return;
    await new Promise(resolve => setTimeout(resolve, 800));
    setRefreshing(false);
  }, []);

  const handleJoinChallenge = (challenge: Challenge) => {
    if (joinedChallenges.has(challenge.id)) {
      platformAlertSimple('Already Joined', `You're already part of the ${challenge.title}. Keep going!`);
      return;
    }

    platformAlertConfirm(
      'Challenge Joined!',
      `You've joined the ${challenge.title}! Complete the tasks to earn ${challenge.reward} bonus coins.`,
      () => {
        setJoinedChallenges(prev => new Set(prev).add(challenge.id));
      },
      'Let\'s Go!'
    );
  };

  const featuredChallenge = CHALLENGES[0];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Fitness Challenges</Text>
          <Text style={styles.headerSubtitle}>Push your limits, earn rewards</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.orange]} />
        }
      >
        {/* Featured Challenge */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Featured Challenge</Text>
          <Pressable
            style={styles.featuredCard}
           
            onPress={() => handleJoinChallenge(featuredChallenge)}
          >
            <LinearGradient
              colors={featuredChallenge.gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.featuredGradient}
            >
              <View style={styles.featuredContent}>
                <Text style={styles.featuredIcon}>{featuredChallenge.icon}</Text>
                <Text style={styles.featuredTitle}>{featuredChallenge.title}</Text>
                <Text style={styles.featuredDescription}>{featuredChallenge.description}</Text>

                <View style={styles.featuredMeta}>
                  <View style={styles.featuredMetaItem}>
                    <Ionicons name="time-outline" size={16} color="rgba(255,255,255,0.9)" />
                    <Text style={styles.featuredMetaText}>{featuredChallenge.duration}</Text>
                  </View>
                  <View style={styles.featuredMetaItem}>
                    <Ionicons name="people-outline" size={16} color="rgba(255,255,255,0.9)" />
                    <Text style={styles.featuredMetaText}>
                      {formatParticipants(featuredChallenge.participants)} joined
                    </Text>
                  </View>
                  <View style={styles.featuredMetaItem}>
                    <Ionicons name="trophy-outline" size={16} color="rgba(255,255,255,0.9)" />
                    <Text style={styles.featuredMetaText}>{featuredChallenge.reward} coins</Text>
                  </View>
                </View>

                <View style={styles.featuredTasks}>
                  {featuredChallenge.tasks.map((task, index) => (
                    <View key={index} style={styles.featuredTaskRow}>
                      <Ionicons name="checkmark-circle-outline" size={14} color="rgba(255,255,255,0.8)" />
                      <Text style={styles.featuredTaskText}>{task}</Text>
                    </View>
                  ))}
                </View>

                <View style={styles.featuredBtnWrap}>
                  <View style={styles.featuredBtn}>
                    <Text style={styles.featuredBtnText}>
                      {joinedChallenges.has(featuredChallenge.id) ? 'Joined!' : 'Join Challenge'}
                    </Text>
                  </View>
                </View>
              </View>
            </LinearGradient>
          </Pressable>
        </View>

        {/* All Challenges */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>All Challenges</Text>

          {CHALLENGES.map((challenge) => (
            <View key={challenge.id} style={styles.challengeCard}>
              {/* Gradient accent strip on left */}
              <LinearGradient
                colors={challenge.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={styles.challengeStrip}
              />

              <View style={styles.challengeBody}>
                {/* Top row: icon + info */}
                <View style={styles.challengeTop}>
                  <Text style={styles.challengeIcon}>{challenge.icon}</Text>
                  <View style={styles.challengeInfo}>
                    <Text style={styles.challengeTitle}>{challenge.title}</Text>
                    <Text style={styles.challengeDesc} numberOfLines={2}>
                      {challenge.description}
                    </Text>
                  </View>
                </View>

                {/* Meta row: difficulty, duration, reward, participants */}
                <View style={styles.challengeMeta}>
                  <View
                    style={[
                      styles.difficultyBadge,
                      { backgroundColor: getDifficultyColor(challenge.difficulty) + '18' },
                    ]}
                  >
                    <Text
                      style={[
                        styles.difficultyText,
                        { color: getDifficultyColor(challenge.difficulty) },
                      ]}
                    >
                      {challenge.difficulty}
                    </Text>
                  </View>

                  <View style={styles.metaItem}>
                    <Ionicons name="time-outline" size={13} color={COLORS.textSecondary} />
                    <Text style={styles.metaText}>{challenge.duration}</Text>
                  </View>

                  <View style={styles.metaItem}>
                    <Ionicons name="trophy-outline" size={13} color={COLORS.primaryGold} />
                    <Text style={styles.metaText}>{challenge.reward}</Text>
                  </View>

                  <View style={styles.metaItem}>
                    <Ionicons name="people-outline" size={13} color={COLORS.textSecondary} />
                    <Text style={styles.metaText}>{formatParticipants(challenge.participants)}</Text>
                  </View>
                </View>

                {/* Tasks */}
                <View style={styles.tasksList}>
                  {challenge.tasks.map((task, index) => (
                    <View key={index} style={styles.taskRow}>
                      <Ionicons name="checkmark-circle-outline" size={13} color={COLORS.textSecondary} />
                      <Text style={styles.taskText}>{task}</Text>
                    </View>
                  ))}
                </View>

                {/* Join button */}
                <Pressable
                  style={styles.joinBtnWrap}
                 
                  onPress={() => handleJoinChallenge(challenge)}
                >
                  <LinearGradient
                    colors={
                      joinedChallenges.has(challenge.id)
                        ? [colors.neutral[400], colors.neutral[500]]
                        : [COLORS.orange, COLORS.orangeDark]
                    }
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.joinBtn}
                  >
                    <Ionicons
                      name={joinedChallenges.has(challenge.id) ? 'checkmark-circle' : 'flash'}
                      size={16}
                      color={COLORS.white}
                    />
                    <Text style={styles.joinBtnText}>
                      {joinedChallenges.has(challenge.id) ? 'Joined' : 'Join Challenge'}
                    </Text>
                  </LinearGradient>
                </Pressable>
              </View>
            </View>
          ))}
        </View>

        {/* Bottom note */}
        <View style={styles.bottomNote}>
          <Ionicons name="information-circle-outline" size={16} color={COLORS.textSecondary} />
          <Text style={styles.bottomNoteText}>
            Complete challenges to earn bonus coins. Coins are awarded when you reach the target.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: 12,
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  headerSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  section: {
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 14,
  },

  // Featured challenge card
  featuredCard: {
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  featuredGradient: {
    borderRadius: 20,
  },
  featuredContent: {
    padding: 24,
  },
  featuredIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  featuredTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.white,
    marginBottom: 6,
  },
  featuredDescription: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    lineHeight: 20,
    marginBottom: 16,
  },
  featuredMeta: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  featuredMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  featuredMetaText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '500',
  },
  featuredTasks: {
    marginBottom: 20,
    gap: 6,
  },
  featuredTaskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  featuredTaskText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
  },
  featuredBtnWrap: {
    alignItems: 'flex-start',
  },
  featuredBtn: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  featuredBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.white,
  },

  // Challenge card
  challengeCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 14,
    flexDirection: 'row',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  challengeStrip: {
    width: 5,
  },
  challengeBody: {
    flex: 1,
    padding: 14,
  },
  challengeTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 10,
  },
  challengeIcon: {
    fontSize: 36,
  },
  challengeInfo: {
    flex: 1,
  },
  challengeTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 3,
  },
  challengeDesc: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  challengeMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
    flexWrap: 'wrap',
  },
  difficultyBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  difficultyText: {
    fontSize: 11,
    fontWeight: '700',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  tasksList: {
    marginBottom: 12,
    gap: 4,
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  taskText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 17,
  },
  joinBtnWrap: {
    alignSelf: 'flex-start',
  },
  joinBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 20,
  },
  joinBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.white,
  },

  // Bottom note
  bottomNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    margin: 16,
    padding: 14,
    backgroundColor: COLORS.orangeLight,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.orange + '30',
  },
  bottomNoteText: {
    flex: 1,
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
});

export default React.memo(ChallengesPage);
