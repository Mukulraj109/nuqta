// Advanced video playback management hook
import { useState, useCallback, useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { UseVideoPlayback } from '@/types/playPage.types';

export function useVideoPlayback(): UseVideoPlayback {
  const [playingVideos, setPlayingVideos] = useState<Set<string>>(new Set());
  const appState = useRef(AppState.currentState);

  // Handle app state changes to pause videos when app goes to background
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        // App has come to the foreground - resume videos that were playing

      } else if (
        appState.current === 'active' &&
        nextAppState.match(/inactive|background/)
      ) {
        // App is going to background - pause all videos
        pauseAllVideos();
      }

      appState.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription?.remove();
    };
  }, []);

  const playVideo = useCallback((videoId: string) => {
    setPlayingVideos(prev => {
      const newSet = new Set(prev);
      newSet.add(videoId);
      return newSet;
    });
  }, []);

  const pauseVideo = useCallback((videoId: string) => {
    setPlayingVideos(prev => {
      const newSet = new Set(prev);
      newSet.delete(videoId);
      return newSet;
    });
  }, []);

  const pauseAllVideos = useCallback(() => {
    setPlayingVideos(new Set());
  }, []);

  const isVideoPlaying = useCallback((videoId: string) => {
    return playingVideos.has(videoId);
  }, [playingVideos]);

  return {
    playingVideos,
    playVideo,
    pauseVideo,
    pauseAllVideos,
    isVideoPlaying
  };
}