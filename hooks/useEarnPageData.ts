import { useState, useEffect, useCallback } from 'react';
import { EarnPageState, EarnPageActions, Notification, Project } from '@/types/earnPage.types';
import earningProjectsApi from '@/services/earningProjectsApi';
import { platformAlertSimple } from '@/utils/platformAlert';
import { useEarningsSocket } from './useEarningsSocket';
import earningsNotificationService from '@/services/earningsNotificationService';
import { useAuthUser } from '@/stores/selectors';

const devLog = {
  log: __DEV__ ? console.log.bind(console) : () => {},
  warn: __DEV__ ? console.warn.bind(console) : () => {},
  error: __DEV__ ? console.error.bind(console) : () => {},
};

const initialState: EarnPageState = {
  notifications: [],
  projectStatus: {
    completeNow: 0,
    inReview: 0,
    completed: 0,
  },
  earnings: {
    totalEarned: 0,
    breakdown: {
      projects: 0,
      referrals: 0,
      shareAndEarn: 0,
      spin: 0,
    },
    currency: '₹',
  },
  recentProjects: [],
  categories: [],
  referralData: {
    totalReferrals: 0,
    totalEarningsFromReferrals: 0,
    pendingReferrals: 0,
    referralBonus: 0,
    referralLink: '',
  },
  walletInfo: {
    balance: 0,
    pendingBalance: 0,
    totalWithdrawn: 0,
  },
  loading: false,
  error: null,
  lastUpdated: '',
};

export function useEarnPageData() {
  const [state, setState] = useState<EarnPageState>(initialState);
  const user = useAuthUser();
  const { 
    onEarningsUpdate, 
    onProjectStatusUpdate, 
    onBalanceUpdate, 
    onNewTransaction,
    onEarningsNotification 
  } = useEarningsSocket();

  // Load initial data
  const loadData = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      // Fetch all data in parallel for better performance
      // Use Promise.allSettled to handle partial failures gracefully
      const [
        projectsResult,
        earningsResult,
        statsResult,
        notificationsResult,
        categoriesResult,
        referralResult
      ] = await Promise.allSettled([
        earningProjectsApi.getProjects({ status: 'active', limit: 10 }),
        earningProjectsApi.getUserEarnings(),
        earningProjectsApi.getProjectStats(),
        earningProjectsApi.getNotifications({ unreadOnly: false, limit: 5 }),
        earningProjectsApi.getCategories(),
        earningProjectsApi.getReferralInfo()
      ]);

      // Extract responses from settled promises
      const projectsResponse = projectsResult.status === 'fulfilled' ? projectsResult.value : null;
      const earningsResponse = earningsResult.status === 'fulfilled' ? earningsResult.value : null;
      const statsResponse = statsResult.status === 'fulfilled' ? statsResult.value : null;
      const notificationsResponse = notificationsResult.status === 'fulfilled' ? notificationsResult.value : null;
      const categoriesResponse = categoriesResult.status === 'fulfilled' ? categoriesResult.value : null;
      const referralResponse = referralResult.status === 'fulfilled' ? referralResult.value : null;

      // Log any failures
      if (projectsResult.status === 'rejected') {
        devLog.error('[EARN PAGE] Failed to load projects:', projectsResult.reason);
      }
      if (earningsResult.status === 'rejected') {
        devLog.error('[EARN PAGE] Failed to load earnings:', earningsResult.reason);
      }
      if (statsResult.status === 'rejected') {
        devLog.error('[EARN PAGE] Failed to load project stats:', statsResult.reason);
      }
      if (notificationsResult.status === 'rejected') {
        devLog.error('[EARN PAGE] Failed to load notifications:', notificationsResult.reason);
      }
      if (categoriesResult.status === 'rejected') {
        devLog.error('[EARN PAGE] Failed to load categories:', categoriesResult.reason);
      }
      if (referralResult.status === 'rejected') {
        devLog.error('[EARN PAGE] Failed to load referral info:', referralResult.reason);
      }

      // Get user ID for frontend filtering (as a fallback to backend filtering)
      const userId = user?.id || (user as any)?._id || null;

      // Transform API data to match component expectations
      // Apply frontend filtering to hide projects where user has pending/under_review submissions
      devLog.log(`🔍 [FRONTEND FILTER] Filtering projects. User ID: ${userId}, Total projects: ${projectsResponse?.data?.projects?.length || 0}`);
      
      const transformedProjects: Project[] = (projectsResponse?.data?.projects || [])
        .filter((p: any) => {
          // If no user ID, show all projects
          if (!userId) {
            return true;
          }
          
          // Check if project has submissions array
          if (!p.submissions || !Array.isArray(p.submissions) || p.submissions.length === 0) {
            return true; // Show projects without submissions
          }
          
          // Check if user has a submission with status 'pending' or 'under_review'
          const userSubmission = p.submissions.find((sub: any) => {
            // Handle both ObjectId and string formats
            const subUserId = sub.user?.toString ? sub.user.toString() : String(sub.user || '');
            const userIdStr = String(userId);
            const matches = subUserId === userIdStr && 
                           (sub.status === 'pending' || sub.status === 'under_review');
            
            if (matches) {
              devLog.log(`🚫 [FRONTEND FILTER] Filtering out project ${p._id} (${p.title}): user has ${sub.status} submission (sub.user: ${subUserId}, userId: ${userIdStr})`);
            }
            
            return matches;
          });
          
          // Filter out if user has a pending or under_review submission
          if (userSubmission) {
            return false;
          }
          
          return true;
        })
        .map((p: any) => ({
          id: p._id,
          title: p.title,
          description: p.description,
          payment: p.payment,
          duration: p.duration,
          status: (p.status === 'expired' ? 'available' : p.status) as 'available' | 'in_progress' | 'in_review' | 'completed',
          category: p.category,
          difficulty: p.difficulty,
          requirements: p.requirements || [],
          createdAt: p.createdAt
        }));

      const transformedNotifications: Notification[] = notificationsResponse?.data?.map(n => ({
        id: n._id,
        title: n.title,
        description: n.description,
        type: n.type,
        isRead: n.isRead,
        createdAt: n.createdAt,
        priority: n.priority
      })) || [];

      setState(prev => ({
        ...prev,
        notifications: transformedNotifications,
        projectStatus: statsResponse?.data || {
          completeNow: 0,
          inReview: 0,
          completed: 0
        },
        earnings: earningsResponse?.data ? {
          totalEarned: earningsResponse.data.totalEarned,
          breakdown: {
            ...earningsResponse.data.breakdown,
            spin: (earningsResponse.data.breakdown as any).spin || 0,
          },
          currency: earningsResponse.data.currency
        } : prev.earnings,
        recentProjects: transformedProjects,
        categories: categoriesResponse?.data?.map(c => ({
          id: c._id,
          name: c.name,
          slug: c.slug,
          description: c.description,
          icon: c.icon,
          color: c.color as any,
          projectCount: c.projectCount,
          averagePayment: c.averagePayment,
          isActive: c.isActive !== undefined ? c.isActive : true
        })) || [],
        referralData: referralResponse?.data ? {
          totalReferrals: referralResponse.data.totalReferrals,
          totalEarningsFromReferrals: referralResponse.data.totalEarningsFromReferrals,
          pendingReferrals: referralResponse.data.pendingReferrals,
          referralBonus: referralResponse.data.referralBonus,
          referralLink: referralResponse.data.referralLink
        } : prev.referralData,
        walletInfo: earningsResponse?.data ? {
          balance: earningsResponse.data.availableBalance,
          pendingBalance: earningsResponse.data.pendingEarnings,
          totalWithdrawn: 0 // This would come from a separate API
        } : prev.walletInfo,
        loading: false,
        lastUpdated: new Date().toISOString()
      }));
    } catch (error) {
      devLog.error('[EARN PAGE] Error loading data:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to load data',
      }));
    }
  }, [user]);

  // Refresh all data
  const refreshData = useCallback(async () => {
    await loadData();
  }, [loadData]);

  // Mark notification as read
  const markNotificationAsReadAction = useCallback(async (notificationId: string) => {
    try {
      const response = await earningProjectsApi.markNotificationAsRead(notificationId);

      if (response.success) {
        setState(prev => ({
          ...prev,
          notifications: prev.notifications.map(notification =>
            notification.id === notificationId
              ? { ...notification, isRead: true }
              : notification
          ),
        }));
      }
    } catch (error) {
      devLog.error('Failed to mark notification as read:', error);
    }
  }, []);

  // Start a project
  const startProjectAction = useCallback(async (projectId: string): Promise<boolean> => {
    // Validate projectId is a valid MongoDB ObjectId (24 hex characters)
    if (!projectId || !/^[0-9a-fA-F]{24}$/.test(projectId)) {
      devLog.error('[EARN PAGE] Invalid project ID format:', projectId);
      platformAlertSimple('Error', 'Invalid project ID. Please try again.');
      return false;
    }

    try {
      const response = await earningProjectsApi.startProject(projectId);

      if (response.success) {
        setState(prev => ({
          ...prev,
          recentProjects: prev.recentProjects.map(project =>
            project.id === projectId
              ? { ...project, status: 'in_progress' }
              : project
          ),
          projectStatus: {
            ...prev.projectStatus,
            completeNow: prev.projectStatus.completeNow + 1,
          },
        }));
        return true;
      }
      return false;
    } catch (error) {
      devLog.error('Failed to start project:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to start project. Please try again.';
      platformAlertSimple('Error', errorMessage);
      return false;
    }
  }, []);

  // Complete a project
  const completeProjectAction = useCallback(async (projectId: string): Promise<boolean> => {
    try {
      const project = state.recentProjects.find(p => p.id === projectId);
      if (!project) return false;

      // Simulate project completion
      setState(prev => ({
        ...prev,
        recentProjects: prev.recentProjects.map(p =>
          p.id === projectId
            ? { ...p, status: 'in_review' }
            : p
        ),
        projectStatus: {
          ...prev.projectStatus,
          completeNow: prev.projectStatus.completeNow - 1,
          inReview: prev.projectStatus.inReview + 1,
        },
        earnings: {
          ...prev.earnings,
          totalEarned: prev.earnings.totalEarned + project.payment,
          breakdown: {
            ...prev.earnings.breakdown,
            projects: prev.earnings.breakdown.projects + project.payment,
          },
        },
        walletInfo: {
          ...prev.walletInfo,
          pendingBalance: prev.walletInfo.pendingBalance + project.payment,
        },
      }));

      return true;
    } catch (error) {
      devLog.error('Failed to complete project:', error);
      return false;
    }
  }, [state.recentProjects]);

  // Share referral link
  const shareReferralLinkAction = useCallback(async (): Promise<string> => {
    try {
      const response = await earningProjectsApi.getReferralInfo();
      if (response.success && response.data) {
        return response.data.referralLink;
      }
      return '';
    } catch (error) {
      devLog.error('Failed to get referral link:', error);
      return '';
    }
  }, []);

  // Withdraw earnings
  const withdrawEarnings = useCallback(async (amount: number): Promise<boolean> => {
    try {
      if (amount > state.walletInfo.balance) {
        throw new Error('Insufficient balance');
      }

      // Simulate withdrawal
      setState(prev => ({
        ...prev,
        walletInfo: {
          ...prev.walletInfo,
          balance: prev.walletInfo.balance - amount,
          totalWithdrawn: prev.walletInfo.totalWithdrawn + amount,
          lastTransaction: {
            id: `tx_${Date.now()}`,
            amount: -amount,
            type: 'withdrawn',
            date: new Date().toISOString(),
            description: 'Withdrawal to bank account',
          },
        },
      }));

      return true;
    } catch (error) {
      devLog.error('Failed to withdraw earnings:', error);
      return false;
    }
  }, [state.walletInfo.balance]);

  // Load more projects
  const loadMoreProjects = useCallback(async () => {
    try {
      const response = await earningProjectsApi.getProjects({
        status: 'active',
        page: Math.floor(state.recentProjects.length / 5) + 1,
        limit: 5
      });

      if (response.success && response.data) {
        // Get user ID for frontend filtering
        const userId = user?.id || (user as any)?._id || null;

        // Apply frontend filtering to hide projects where user has pending/under_review submissions
        const transformedProjects: Project[] = (response.data.projects || [])
          .filter((p: any) => {
            // If no user ID, show all projects
            if (!userId || !p.submissions || !Array.isArray(p.submissions) || p.submissions.length === 0) {
              return true;
            }
            
            // Check if user has a submission with status 'pending' or 'under_review'
            const userSubmission = p.submissions.find((sub: any) => {
              // Handle both ObjectId and string formats
              const subUserId = sub.user?.toString ? sub.user.toString() : String(sub.user || '');
              const userIdStr = String(userId);
              const matches = subUserId === userIdStr && 
                             (sub.status === 'pending' || sub.status === 'under_review');
              
              if (matches) {
                devLog.log(`🚫 [FRONTEND FILTER] Filtering out project ${p._id} in loadMore: user has ${sub.status} submission`);
              }
              
              return matches;
            });
            
            // Filter out if user has a pending or under_review submission
            return !userSubmission;
          })
          .map((p: any) => ({
            id: p._id,
            title: p.title,
            description: p.description,
            payment: p.payment,
            duration: p.duration,
            status: (p.status === 'expired' ? 'available' : p.status) as 'available' | 'in_progress' | 'in_review' | 'completed',
            category: p.category,
            difficulty: p.difficulty,
            requirements: p.requirements || [],
            createdAt: p.createdAt
          }));

        setState(prev => ({
          ...prev,
          recentProjects: [...prev.recentProjects, ...transformedProjects],
        }));
      }
    } catch (error) {
      devLog.error('Failed to load more projects:', error);
    }
  }, [state.recentProjects.length, user]);

  // Filter projects by category
  const filterProjectsByCategory = useCallback((categoryId: string) => {
    setState(prev => ({
      ...prev,
      recentProjects: prev.recentProjects.filter(project => 
        project.category === categoryId
      ),
    }));
  }, []);

  // Search projects
  const searchProjects = useCallback((query: string) => {
    if (!query.trim()) {
      // Reset to all projects if empty search
      loadData();
      return;
    }

    setState(prev => ({
      ...prev,
      recentProjects: prev.recentProjects.filter(project =>
        project.title.toLowerCase().includes(query.toLowerCase()) ||
        project.description.toLowerCase().includes(query.toLowerCase())
      ),
    }));
  }, [loadData]);

  // Actions object
  const actions: EarnPageActions = {
    refreshData,
    markNotificationAsRead: markNotificationAsReadAction,
    startProject: startProjectAction,
    completeProject: completeProjectAction,
    shareReferralLink: shareReferralLinkAction,
    withdrawEarnings,
    loadMoreProjects,
    filterProjectsByCategory,
    searchProjects,
  };

  // Load data on mount
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Subscribe to real-time earnings updates
  useEffect(() => {
    // Use refs to track latest state values to avoid stale closure issues
    const earningsRef = { current: state.earnings };
    earningsRef.current = state.earnings;

    const unsubscribeEarnings = onEarningsUpdate((data) => {
      devLog.log('📊 [EARNINGS SOCKET] Earnings update received:', data);

      // Calculate the difference in earnings using ref to get latest value
      const prevTotal = earningsRef.current.totalEarned;
      const newTotal = data.earnings.totalEarned;
      const earningsDiff = newTotal - prevTotal;

      // Show notification if earnings increased
      if (earningsDiff > 0) {
        // Determine source from breakdown changes
        const breakdown = data.earnings.breakdown;
        let source = 'earnings';
        if (breakdown.projects > (earningsRef.current.breakdown?.projects || 0)) {
          source = 'Projects';
        } else if (breakdown.referrals > (earningsRef.current.breakdown?.referrals || 0)) {
          source = 'Referrals';
        } else if (breakdown.shareAndEarn > (earningsRef.current.breakdown?.shareAndEarn || 0)) {
          source = 'Share & Earn';
        } else if (breakdown.spin > (earningsRef.current.breakdown?.spin || 0)) {
          source = 'Spin & Win';
        }

        earningsNotificationService.showEarningsNotification(earningsDiff, source);
      }

      setState(prev => ({
        ...prev,
        earnings: {
          totalEarned: data.earnings.totalEarned,
          breakdown: data.earnings.breakdown,
          currency: prev.earnings.currency
        }
      }));
    });

    const unsubscribeProjectStatus = onProjectStatusUpdate((data) => {
      devLog.log('📊 [EARNINGS SOCKET] Project status update received:', data);
      setState(prev => ({
        ...prev,
        projectStatus: data.status
      }));
    });

    const unsubscribeBalance = onBalanceUpdate((data) => {
      devLog.log('💰 [EARNINGS SOCKET] Balance update received:', data);
      setState(prev => ({
        ...prev,
        walletInfo: {
          ...prev.walletInfo,
          balance: data.balance,
          pendingBalance: data.pendingBalance
        }
      }));
    });

    const unsubscribeTransaction = onNewTransaction((data) => {
      devLog.log('💸 [EARNINGS SOCKET] New transaction received:', data);
      // Reload data to get updated earnings
      loadData();
    });

    const unsubscribeNotification = onEarningsNotification((data) => {
      devLog.log('🔔 [EARNINGS SOCKET] Earnings notification received:', data);

      const notification = data.notification;

      // Show push notification based on type
      if (notification.type === 'project_approved') {
        earningsNotificationService.showProjectApprovedNotification(
          notification.title,
          notification.data?.amount || 0
        );
      } else if (notification.type === 'project_rejected') {
        earningsNotificationService.showProjectRejectedNotification(
          notification.title,
          notification.data?.reason
        );
      } else if (notification.type === 'withdrawal') {
        earningsNotificationService.showWithdrawalNotification(
          notification.data?.amount || 0,
          notification.data?.status || 'pending'
        );
      } else if (notification.type === 'milestone') {
        earningsNotificationService.showMilestoneNotification(
          notification.data?.milestone || '',
          notification.data?.reward || 0
        );
      }

      // Add notification to state
      setState(prev => ({
        ...prev,
        notifications: [notification, ...prev.notifications].slice(0, 10) // Keep latest 10
      }));
    });

    // Cleanup function to prevent memory leaks
    return () => {
      if (unsubscribeEarnings) unsubscribeEarnings();
      if (unsubscribeProjectStatus) unsubscribeProjectStatus();
      if (unsubscribeBalance) unsubscribeBalance();
      if (unsubscribeTransaction) unsubscribeTransaction();
      if (unsubscribeNotification) unsubscribeNotification();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only setup subscriptions once on mount

  return {
    state,
    actions,
  };
}

// Helper hooks for specific data
export function useNotifications() {
  const { state, actions } = useEarnPageData();
  
  return {
    notifications: state.notifications,
    unreadCount: state.notifications.filter(n => !n.isRead).length,
    markAsRead: actions.markNotificationAsRead,
  };
}

export function useProjects() {
  const { state, actions } = useEarnPageData();
  
  return {
    projects: state.recentProjects,
    projectStatus: state.projectStatus,
    startProject: actions.startProject,
    completeProject: actions.completeProject,
    loadMore: actions.loadMoreProjects,
    filter: actions.filterProjectsByCategory,
    search: actions.searchProjects,
  };
}

export function useEarnings() {
  const { state, actions } = useEarnPageData();
  
  return {
    earnings: state.earnings,
    walletInfo: state.walletInfo,
    withdraw: actions.withdrawEarnings,
  };
}

export function useReferrals() {
  const { state, actions } = useEarnPageData();
  
  return {
    referralData: state.referralData,
    shareLink: actions.shareReferralLink,
  };
}