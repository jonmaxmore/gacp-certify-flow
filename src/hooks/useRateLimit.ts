import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface RateLimitState {
  isBlocked: boolean;
  attemptsRemaining: number;
  resetTime?: Date;
}

export const useRateLimit = () => {
  const [rateLimitState, setRateLimitState] = useState<RateLimitState>({
    isBlocked: false,
    attemptsRemaining: 5,
  });

  const checkRateLimit = async (
    action: string,
    maxAttempts: number = 5,
    windowMinutes: number = 15
  ): Promise<boolean> => {
    try {
      // Use IP address or user ID as identifier
      const identifier = await getUserIdentifier();
      
      const { data, error } = await supabase.rpc('check_rate_limit', {
        identifier_val: identifier,
        action_type_val: action,
        max_attempts: maxAttempts,
        window_minutes: windowMinutes
      });

      if (error) {
        console.error('Rate limit check failed:', error);
        // Allow operation on error to avoid blocking legitimate users
        return true;
      }

      const isAllowed = data as boolean;
      
      if (!isAllowed) {
        setRateLimitState({
          isBlocked: true,
          attemptsRemaining: 0,
          resetTime: new Date(Date.now() + windowMinutes * 60 * 1000)
        });
      }

      return isAllowed;
    } catch (error) {
      console.error('Rate limit error:', error);
      // Allow operation on error
      return true;
    }
  };

  const getUserIdentifier = async (): Promise<string> => {
    // Try to get user ID first, fallback to session identifier
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      return user.id;
    }
    
    // For anonymous users, use a session-based identifier
    let sessionId = localStorage.getItem('session_identifier');
    if (!sessionId) {
      sessionId = 'anon_' + Math.random().toString(36).substring(2, 15);
      localStorage.setItem('session_identifier', sessionId);
    }
    return sessionId;
  };

  return {
    rateLimitState,
    checkRateLimit,
  };
};