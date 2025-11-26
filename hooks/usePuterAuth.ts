'use client';

import { useState, useEffect, useCallback } from 'react';

interface PuterUser {
  username?: string;
  email?: string;
  uuid?: string;
}

interface UsePuterAuthReturn {
  isSignedIn: boolean;
  isLoading: boolean;
  user: PuterUser | null;
  error: string | null;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  checkAuth: () => Promise<boolean>;
}

/**
 * Hook for managing Puter authentication
 * Puter provides free AI models - users need to sign in to puter.com to use them
 */
export function usePuterAuth(): UsePuterAuthReturn {
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<PuterUser | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Check if Puter SDK is available
  const isPuterAvailable = useCallback(() => {
    return typeof window !== 'undefined' && window.puter && window.puter.auth;
  }, []);

  // Check authentication status
  const checkAuth = useCallback(async (): Promise<boolean> => {
    if (!isPuterAvailable()) {
      console.log('[Puter Auth] SDK not available yet');
      return false;
    }

    try {
      const signedIn = await window.puter.auth.isSignedIn();
      setIsSignedIn(signedIn);

      if (signedIn) {
        try {
          const puterUser = await window.puter.auth.getUser();
          setUser(puterUser);
          console.log('[Puter Auth] User signed in:', puterUser?.username || puterUser?.email);
        } catch (e) {
          console.log('[Puter Auth] Could not get user details');
        }
      } else {
        setUser(null);
      }

      return signedIn;
    } catch (err) {
      console.error('[Puter Auth] Error checking auth:', err);
      setError('Failed to check Puter authentication');
      return false;
    }
  }, [isPuterAvailable]);

  // Sign in to Puter
  const signIn = useCallback(async () => {
    if (!isPuterAvailable()) {
      setError('Puter SDK not loaded. Please refresh the page.');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      console.log('[Puter Auth] Initiating sign in...');
      await window.puter.auth.signIn();

      // Check auth status after sign in
      const signedIn = await checkAuth();

      if (signedIn) {
        console.log('[Puter Auth] Sign in successful!');
      }
    } catch (err: any) {
      console.error('[Puter Auth] Sign in error:', err);
      // User might have cancelled the sign in
      if (err?.message?.includes('cancelled') || err?.message?.includes('closed')) {
        setError('Sign in was cancelled');
      } else {
        setError(err?.message || 'Failed to sign in to Puter');
      }
    } finally {
      setIsLoading(false);
    }
  }, [isPuterAvailable, checkAuth]);

  // Sign out from Puter (note: Puter SDK might not have signOut)
  const signOut = useCallback(async () => {
    // Puter doesn't have a direct signOut - user manages this on puter.com
    setIsSignedIn(false);
    setUser(null);
    console.log('[Puter Auth] User signed out (local state cleared)');
  }, []);

  // Initial auth check when SDK loads
  useEffect(() => {
    let mounted = true;
    let retryCount = 0;
    const maxRetries = 10;
    const retryDelay = 500;

    const checkPuterAuth = async () => {
      if (!mounted) return;

      if (isPuterAvailable()) {
        setIsLoading(true);
        await checkAuth();
        if (mounted) {
          setIsLoading(false);
        }
      } else if (retryCount < maxRetries) {
        retryCount++;
        console.log(`[Puter Auth] SDK not ready, retry ${retryCount}/${maxRetries}...`);
        setTimeout(checkPuterAuth, retryDelay);
      } else {
        if (mounted) {
          setIsLoading(false);
          console.log('[Puter Auth] SDK not loaded after retries');
        }
      }
    };

    checkPuterAuth();

    return () => {
      mounted = false;
    };
  }, [isPuterAvailable, checkAuth]);

  return {
    isSignedIn,
    isLoading,
    user,
    error,
    signIn,
    signOut,
    checkAuth,
  };
}
