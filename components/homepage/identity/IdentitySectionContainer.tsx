import React, { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
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

export default function IdentitySectionContainer() {
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

  // Hydrate identity from backend on login
  useEffect(() => {
    if (authLoading || !isAuthenticated) return;

    identityApi.fetchIdentityFromProfile().then((data) => {
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
      identityApi.getCampusLeaderboard(instituteName).then(setLeaderboardData).catch(() => {});
    } else if (segment === 'verified_employee' && companyName) {
      identityApi.getCompanyLeaderboard(companyName).then(setLeaderboardData).catch(() => {});
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
          nearbyDealsCount={leaderboardData?.studentCount || 0}
          onSeeLeaderboard={() => router.push('/leaderboard/campus' as any)}
          onSeeDeals={() => router.push('/offers/student' as any)}
        />
        {leaderboardData && leaderboardData.leaderboard.length > 0 && (
          <CampusSavingsBoard
            institutionName={instituteName || 'Your Campus'}
            leaderboard={leaderboardData.leaderboard}
            totalSaved={leaderboardData.totalSaved}
            studentCount={leaderboardData.studentCount || 0}
            currentUserRank={leaderboardData.currentUserRank}
            currentUserId={(user as any)?._id || (user as any)?.id}
            onSeeAll={() => router.push('/leaderboard/campus' as any)}
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
          nearbyDealsCount={leaderboardData?.employeeCount || 0}
          onSeeLeaderboard={() => router.push('/leaderboard/company' as any)}
          onSeeDeals={() => router.push('/offers/corporate' as any)}
        />
        {leaderboardData && leaderboardData.leaderboard.length > 0 && (
          <CampusSavingsBoard
            institutionName={companyName || 'Your Company'}
            leaderboard={leaderboardData.leaderboard}
            totalSaved={leaderboardData.totalSaved}
            studentCount={leaderboardData.employeeCount || 0}
            currentUserRank={leaderboardData.currentUserRank}
            currentUserId={(user as any)?._id || (user as any)?.id}
            onSeeAll={() => router.push('/leaderboard/company' as any)}
          />
        )}
      </>
    );
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
        onVerify={() => router.push('/onboarding/identity-select' as any)}
        onDismiss={() => {
          dismissVerificationPrompt();
          analyticsService.track(IdentityAnalyticsEvents.VERIFY_PROMPT_DISMISSED);
        }}
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
        onRefer={() => router.push('/refer-institute' as any)}
        onExplore={() => {}}
        onDismiss={() => {
          dismissInstituteReferral();
          analyticsService.track(IdentityAnalyticsEvents.INSTITUTE_BANNER_DISMISSED);
        }}
      />
    );
  }

  // View E: All dismissed or no match → render nothing
  return null;
}
