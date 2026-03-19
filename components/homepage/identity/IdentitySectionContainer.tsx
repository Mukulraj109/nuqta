import React, { useCallback, useEffect, useState } from 'react';
import { View, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { useUserIdentityStore } from '@/stores/userIdentityStore';
import { useAuthUser, useIsAuthenticated } from '@/stores';
import { useAuth } from '@/contexts/AuthContext';
import StudentIdentityBanner from './StudentIdentityBanner';
import CorporateIdentityBanner from './CorporateIdentityBanner';
import VerificationPromptBanner from './VerificationPromptBanner';
import InstituteNotOnboardedBanner from './InstituteNotOnboardedBanner';
import CampusSavingsBoard from './CampusSavingsBoard';
import * as identityApi from '@/services/identityApi';
import analyticsService, { IdentityAnalyticsEvents } from '@/services/analyticsService';
import { useIsMounted } from '@/hooks/useIsMounted';

function IdentitySectionContainer() {
  const router = useRouter();
  const user = useAuthUser();
  const isAuthenticated = useIsAuthenticated();
  // Guard: wait for auth to be ready before making API calls
  let authLoading = false;
  try {
    const auth = useAuth();
    authLoading = auth?.loading ?? false;
  } catch {
    // useAuth may not be available in all contexts
  }

  const {
    segment,
    featureLevel,
    verificationSegment,
    instituteStatus,
    statedIdentity,
    instituteName,
    companyName,
    hasSkippedVerificationPrompt,
    hasSkippedInstituteReferral,
    _hydrated,
    dismissVerificationPrompt,
    dismissInstituteReferral,
    hydrateFromBackend,
  } = useUserIdentityStore();

  const [leaderboardData, setLeaderboardData] = useState<any>(null);
  const isMounted = useIsMounted();

  // Memoized navigation callbacks
  const handleSeeCampusLeaderboard = useCallback(() => router.push('/leaderboard/campus' as any), [router]);
  const handleSeeStudentDeals = useCallback(() => router.push('/offers/student' as any), [router]);
  const handleSeeCompanyLeaderboard = useCallback(() => router.push('/leaderboard/company' as any), [router]);
  const handleSeeCorporateDeals = useCallback(() => router.push('/offers/corporate' as any), [router]);
  const handleVerify = useCallback(() => router.push('/onboarding/identity-select' as any), [router]);
  const handleRefer = useCallback(() => router.push('/refer-institute' as any), [router]);
  const handleExplore = useCallback(() => {}, []);
  const handleDismissVerification = useCallback(() => {
    dismissVerificationPrompt();
    analyticsService.track(IdentityAnalyticsEvents.VERIFY_PROMPT_DISMISSED);
  }, [dismissVerificationPrompt]);
  const handleDismissInstitute = useCallback(() => {
    dismissInstituteReferral();
    analyticsService.track(IdentityAnalyticsEvents.INSTITUTE_BANNER_DISMISSED);
  }, [dismissInstituteReferral]);

  // Hydrate identity from backend on login
  useEffect(() => {
    if (authLoading || !isAuthenticated) return;

    identityApi.fetchIdentityFromProfile().then((data) => {
      if (!isMounted()) return;
      if (data) {
        hydrateFromBackend(data);
      }
    }).catch(() => {});
  }, [isAuthenticated, authLoading]);

  // Fetch leaderboard data for verified users
  useEffect(() => {
    if (authLoading || !isAuthenticated) return;
    if (featureLevel < 2) return;

    if (segment === 'verified_student' && instituteName) {
      identityApi.getCampusLeaderboard(instituteName).then((data) => { if (isMounted()) setLeaderboardData(data); }).catch(() => {});
    } else if (segment === 'verified_employee' && companyName) {
      identityApi.getCompanyLeaderboard(companyName).then((data) => { if (isMounted()) setLeaderboardData(data); }).catch(() => {});
    }
  }, [isAuthenticated, authLoading, segment, featureLevel, instituteName, companyName]);

  // No identity set or general user → render nothing
  if (!statedIdentity || statedIdentity === 'general') {
    return null;
  }

  // View A: Verified Student
  if (segment === 'verified_student' && featureLevel >= 2) {
    return (
      <>
        <StudentIdentityBanner
          institutionName={instituteName || 'Your Campus'}
          monthlySaved={leaderboardData?.totalSaved || 0}
          onSeeLeaderboard={handleSeeCampusLeaderboard}
          onSeeDeals={handleSeeStudentDeals}
        />
        {leaderboardData && leaderboardData.leaderboard.length > 0 && (
          <CampusSavingsBoard
            institutionName={instituteName || 'Your Campus'}
            leaderboard={leaderboardData.leaderboard}
            totalSaved={leaderboardData.totalSaved}
            studentCount={leaderboardData.studentCount || 0}
            currentUserRank={leaderboardData.currentUserRank}
            currentUserId={(user as any)?._id || (user as any)?.id}
            onSeeAll={handleSeeCampusLeaderboard}
          />
        )}
      </>
    );
  }

  // View B: Verified Employee
  if (segment === 'verified_employee' && featureLevel >= 2) {
    return (
      <>
        <CorporateIdentityBanner
          companyName={companyName || 'Your Company'}
          monthlySaved={leaderboardData?.totalSaved || 0}
          onSeeLeaderboard={handleSeeCompanyLeaderboard}
          onSeeDeals={handleSeeCorporateDeals}
        />
        {leaderboardData && leaderboardData.leaderboard.length > 0 && (
          <CampusSavingsBoard
            institutionName={companyName || 'Your Company'}
            leaderboard={leaderboardData.leaderboard}
            totalSaved={leaderboardData.totalSaved}
            studentCount={leaderboardData.employeeCount || 0}
            currentUserRank={leaderboardData.currentUserRank}
            currentUserId={(user as any)?._id || (user as any)?.id}
            onSeeAll={handleSeeCompanyLeaderboard}
          />
        )}
      </>
    );
  }

  // View B2: Provisional — submitted but awaiting full verification
  // Must be checked before C2 so provisional users see review status, not the segment banner
  if (verificationSegment === 'provisional' && featureLevel >= 1) {
    return (
      <View style={{
        margin: 16,
        backgroundColor: '#fff7ed',
        borderRadius: 16,
        padding: 16,
        borderLeftWidth: 4,
        borderLeftColor: '#FF9F1C',
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
          <ThemedText style={{ fontSize: 12, fontWeight: '600', color: '#9a3412' }}>
            Provisional Access Active
          </ThemedText>
        </View>
        <ThemedText style={{ fontSize: 14, fontWeight: '700', color: '#1a3a52', marginBottom: 4 }}>
          Your verification is under review
        </ThemedText>
        <ThemedText style={{ fontSize: 13, color: '#6b7280', marginBottom: 12 }}>
          You have access to 30+ deals right now.
          Full unlock arrives within 2-4 hours.
        </ThemedText>
        <Pressable
          onPress={handleSeeStudentDeals}
          style={{
            backgroundColor: '#FF9F1C',
            paddingVertical: 10,
            borderRadius: 10,
            alignItems: 'center',
          }}
        >
          <ThemedText style={{ fontSize: 14, fontWeight: '700', color: '#fff' }}>
            See Available Deals
          </ThemedText>
        </Pressable>
      </View>
    );
  }

  // View C2: Other verified segments (defence, healthcare, teacher, etc.)
  if (featureLevel >= 2 &&
      segment !== 'normal' &&
      segment !== 'verified_student' &&
      segment !== 'verified_employee') {

    const segmentConfig: Record<string, { label: string; dealsRoute: string }> = {
      verified_defence:      { label: 'Defence Verified',     dealsRoute: '/offers/zones/defence' },
      verified_healthcare:   { label: 'Healthcare Verified',  dealsRoute: '/offers/zones/healthcare' },
      verified_teacher:      { label: 'Teacher Verified',     dealsRoute: '/offers/zones/teacher' },
      verified_government:   { label: 'Government Verified',  dealsRoute: '/offers/zones/government' },
      verified_senior:       { label: 'Senior Citizen',       dealsRoute: '/offers/zones/senior' },
      verified_differentlyAbled: { label: 'Verified Member',  dealsRoute: '/offers/zones/differently-abled' },
    };

    const cfg = segmentConfig[segment];
    if (cfg) {
      return (
        <View style={{
          margin: 16,
          backgroundColor: '#f0fdf4',
          borderRadius: 16,
          padding: 16,
          borderLeftWidth: 4,
          borderLeftColor: '#2ECC71',
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <ThemedText style={{ fontSize: 12, fontWeight: '600', color: '#166534' }}>
              {cfg.label}
            </ThemedText>
          </View>
          <ThemedText style={{ fontSize: 14, fontWeight: '700', color: '#1a3a52', marginBottom: 12 }}>
            Your exclusive deals are unlocked
          </ThemedText>
          <Pressable
            onPress={() => router.push(cfg.dealsRoute as any)}
            style={{
              backgroundColor: '#2ECC71',
              paddingVertical: 10,
              borderRadius: 10,
              alignItems: 'center',
            }}
          >
            <ThemedText style={{ fontSize: 14, fontWeight: '700', color: '#fff' }}>
              See My Deals
            </ThemedText>
          </Pressable>
        </View>
      );
    }
  }

  // View C: College on REZ but not verified
  if (
    featureLevel === 1 &&
    instituteStatus === 'onboarded' &&
    !hasSkippedVerificationPrompt &&
    statedIdentity !== 'general'
  ) {
    return (
      <VerificationPromptBanner
        onVerify={handleVerify}
        onDismiss={handleDismissVerification}
      />
    );
  }

  // View D: College not on REZ
  if (
    featureLevel === 1 &&
    instituteStatus === 'not_available' &&
    !hasSkippedInstituteReferral &&
    statedIdentity !== 'general'
  ) {
    return (
      <InstituteNotOnboardedBanner
        onRefer={handleRefer}
        onExplore={handleExplore}
        onDismiss={handleDismissInstitute}
      />
    );
  }

  // View E: All dismissed or no match → render nothing
  return null;
}

export default React.memo(IdentitySectionContainer);
