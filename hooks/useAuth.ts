'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    console.log('useAuth: Setting up auth listener');

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const newUser = session?.user ?? null;
      console.log('useAuth: Auth state changed:', newUser?.id || 'No user');
      
      // Only update state if user actually changed
      setUser(currentUser => {
        if (currentUser?.id !== newUser?.id) {
          return newUser;
        }
        return currentUser;
      });
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Sign in with Google
  const signInWithGoogle = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
      console.log('Google sign-in initiated');
      return data;
    } catch (err) {
      console.error('Google sign-in error:', err);
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Sign in with Email/Password
  const signInWithEmail = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      console.log('Email sign-in successful:', data.user?.id);
      return data.user;
    } catch (err) {
      console.error('Email sign-in error:', err);
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Sign up with Email/Password
  const signUpWithEmail = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });
      if (error) throw error;
      console.log('Email sign-up successful:', data.user?.id);
      return data.user;
    } catch (err) {
      console.error('Email sign-up error:', err);
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Sign out
  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      console.log('Sign-out successful');
    } catch (err) {
      console.error('Sign-out error:', err);
      setError(err as Error);
      throw err;
    }
  };

  return {
    user,
    loading,
    error,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    signOut,
  };
}
