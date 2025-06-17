import { useCallback, useEffect, useRef } from 'react';
import { useStreamingAvatarContext } from './context';

export const useSpeechFilter = () => {
  const { avatarRef } = useStreamingAvatarContext();
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const SILENCE_THRESHOLD = 1000; // 1 second of silence to consider speech ended

  const handleUserStart = useCallback(() => {
    // Clear any existing silence timer when user starts talking
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  }, []);

  const handleUserStop = useCallback(() => {
    // Start a timer when user stops talking
    silenceTimerRef.current = setTimeout(() => {
      if (avatarRef.current) {
        // This will trigger the end of the current speech segment
        avatarRef.current.stopListening();
      }
    }, SILENCE_THRESHOLD);
  }, [avatarRef]);

  useEffect(() => {
    const avatar = avatarRef.current;
    if (!avatar) return;

    avatar.on('USER_START', handleUserStart);
    avatar.on('USER_STOP', handleUserStop);

    return () => {
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
      }
      avatar.off('USER_START', handleUserStart);
      avatar.off('USER_STOP', handleUserStop);
    };
  }, [avatarRef, handleUserStart, handleUserStop]);

  return {
    handleUserStart,
    handleUserStop
  };
}; 