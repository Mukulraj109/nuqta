import React, { useEffect, useMemo } from 'react';
import { View } from 'react-native';
import UGCGrid from '@/components/UGCGrid';
import { UGCContent } from '@/types/reviews';
import { useUGCInteractions } from '@/hooks/useUGCInteractions';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'expo-router';

interface UGCGridWithInteractionsProps {
  ugcContent: UGCContent[];
  onContentPress?: (content: UGCContent) => void;
}

/**
 * UGCGrid with integrated like and bookmark functionality
 * Handles authentication, optimistic updates, and backend synchronization
 */
export default function UGCGridWithInteractions({
  ugcContent,
  onContentPress,
}: UGCGridWithInteractionsProps) {
  const { state: authState } = useAuth();
  const router = useRouter();
  const {
    toggleLike,
    toggleBookmark,
    isLiked,
    isBookmarked,
    getLikeCount,
    initializeState,
  } = useUGCInteractions();

  // Initialize interaction state when content changes
  useEffect(() => {
    initializeState(ugcContent);
  }, [ugcContent, initializeState]);

  // Merge local interaction state with UGC content
  const enrichedContent = useMemo(() => {
    return ugcContent.map((item) => ({
      ...item,
      isLiked: isLiked(item.id),
      isBookmarked: isBookmarked(item.id),
      likes: getLikeCount(item.id),
    }));
  }, [ugcContent, isLiked, isBookmarked, getLikeCount]);

  const handleLikeContent = (contentId: string) => {
    if (!authState.isAuthenticated) {
      // Redirect to sign-in
      router.push('/sign-in');
      return;
    }
    toggleLike(contentId);
  };

  const handleBookmarkContent = (contentId: string) => {
    if (!authState.isAuthenticated) {
      // Redirect to sign-in
      router.push('/sign-in');
      return;
    }
    toggleBookmark(contentId);
  };

  return (
    <View>
      <UGCGrid
        ugcContent={enrichedContent}
        onContentPress={onContentPress}
        onLikeContent={handleLikeContent}
        onBookmarkContent={handleBookmarkContent}
      />
    </View>
  );
}
