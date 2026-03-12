import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, Animated, Platform } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ProjectStatus } from '@/types/earnPage.types';
import { EARN_COLORS } from '@/constants/EarnPageColors';
import ProjectStatusCard from './ProjectStatusCard';
import SkeletonLoader from '@/components/common/SkeletonLoader';

interface ProjectDashboardProps {
  projectStatus: ProjectStatus;
  onStatusPress: (status: string) => void;
  loading?: boolean;
}

export default function ProjectDashboard({ 
  projectStatus, 
  onStatusPress,
  loading = false
}: ProjectDashboardProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View 
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      {/* Header */}
      <Animated.View 
        style={[
          styles.header,
          {
            opacity: fadeAnim,
            transform: [
              {
                translateY: fadeAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [10, 0],
                }),
              },
            ],
          },
        ]}
      >
        <View style={styles.titleContainer}>
          <ThemedText style={styles.title}>
            Project completion
          </ThemedText>
          <View style={styles.titleUnderline} />
        </View>
      </Animated.View>
      
      {/* Status Cards */}
      {loading ? (
        <View style={styles.statusCards}>
          {[1, 2, 3].map((i) => (
            <View key={i} style={styles.skeletonCard}>
              <SkeletonLoader width="100%" height={85} borderRadius={12} />
            </View>
          ))}
        </View>
      ) : (
        <View style={styles.statusCards}>
          <ProjectStatusCard
            label="Complete now"
            count={projectStatus.completeNow}
            color="#00C06A"
            gradient={['#00C06A', '#00A85C', '#00796B']}
            onPress={() => onStatusPress('complete-now')}
            delay={0}
          />
          
          <ProjectStatusCard
            label="In review"
            count={projectStatus.inReview}
            color="#F59E0B"
            gradient={['#F59E0B', '#D97706', '#B45309']}
            onPress={() => onStatusPress('in-review')}
            delay={100}
          />
          
          <ProjectStatusCard
            label="Completed"
            count={projectStatus.completed}
            color="#10B981"
            gradient={['#10B981', '#059669', '#047857']}
            onPress={() => onStatusPress('completed')}
            delay={200}
          />
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
    marginLeft: 20,
    marginRight: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 22,
    paddingVertical: 20,
    paddingLeft: 16,
    paddingRight: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 200, 87, 0.2)',
    ...Platform.select({
      ios: {
        shadowColor: '#FFC857',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      },
      web: {
        boxShadow: '0 6px 16px rgba(255, 200, 87, 0.2)',
      },
    }),
  },
  header: {
    marginBottom: 16,
  },
  titleContainer: {
    marginBottom: 6,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1F2937',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  titleUnderline: {
    width: 45,
    height: 4,
    backgroundColor: '#FFC857',
    borderRadius: 2,
  },
  statusCards: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'stretch',
    gap: 6,
    width: '100%',
    paddingRight: 0,
  },
  skeletonCard: {
    flex: 1,
  },
});
