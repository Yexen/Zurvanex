'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { debugGoogleAuth } from '@/lib/authDebug';
import { useI18n } from '@/lib/i18n';

export default function Login() {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail } = useAuth();
  const { t } = useI18n();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    try {
      setError(null);
      setLoading(true);
      await signInWithGoogle();
      router.push('/');
    } catch (err: any) {
      setError(err.message || 'Failed to sign in with Google');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      setError(t('auth.errors.enterEmailPassword'));
      return;
    }

    try {
      setError(null);
      setLoading(true);

      if (isSignUp) {
        await signUpWithEmail(email, password);
      } else {
        await signInWithEmail(email, password);
      }

      router.push('/');
    } catch (err: any) {
      const errorMessage = err.code === 'auth/user-not-found'
        ? t('auth.errors.noAccount')
        : err.code === 'auth/wrong-password'
        ? t('auth.errors.wrongPassword')
        : err.code === 'auth/email-already-in-use'
        ? t('auth.errors.emailInUse')
        : err.code === 'auth/weak-password'
        ? t('auth.errors.weakPassword')
        : err.message || t('auth.errors.authFailed');

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-dark)' }}>
      <div className="w-full max-w-md p-8 rounded-2xl" style={{
        background: 'var(--darker-bg)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
      }}>
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <img src="/Logo.png" alt="Zurvânex Logo" className="w-20 h-20 mx-auto mb-4" />
          <h1 className="text-3xl font-bold" style={{ color: 'var(--gray-med)' }}>
            Zurvânex
          </h1>
          <p className="text-sm mt-2" style={{ color: 'var(--gray-light)' }}>
            {isSignUp ? t('auth.createAccount') : t('auth.signInToContinue')}
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 rounded-lg" style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#f87171'
          }}>
            {error}
          </div>
        )}

        {/* Google Sign In */}
        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full py-3 px-4 rounded-lg font-medium transition-all mb-4 flex items-center justify-center gap-3"
          style={{
            background: 'white',
            color: '#1f1f1f',
            border: 'none',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1
          }}
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          {t('auth.continueWithGoogle')}
        </button>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)' }} />
          </div>
          <div className="relative flex justify-center text-sm">
            <span style={{ background: 'var(--darker-bg)', padding: '0 12px', color: 'var(--gray-light)' }}>
              OR
            </span>
          </div>
        </div>

        {/* Email/Password Form */}
        <form onSubmit={handleEmailAuth} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-2" style={{ color: 'var(--gray-med)' }}>
              {t('auth.email')}
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              className="w-full px-4 py-3 rounded-lg"
              style={{
                background: 'var(--bg-dark)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: 'var(--gray-med)',
                outline: 'none'
              }}
              placeholder={t('auth.emailPlaceholder')}
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-2" style={{ color: 'var(--gray-med)' }}>
              {t('auth.password')}
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              className="w-full px-4 py-3 rounded-lg"
              style={{
                background: 'var(--bg-dark)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: 'var(--gray-med)',
                outline: 'none'
              }}
              placeholder={t('auth.passwordPlaceholder')}
              required
              minLength={6}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-lg font-medium transition-all"
            style={{
              background: loading ? 'rgba(114, 212, 204, 0.5)' : 'var(--teal-bright)',
              color: '#1f1f1f',
              border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? t('common.loading') : isSignUp ? t('auth.signUp') : t('auth.signIn')}
          </button>
        </form>

        {/* Toggle Sign Up / Sign In */}
        <div className="mt-6 text-center">
          <button
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError(null);
            }}
            disabled={loading}
            className="text-sm transition-colors"
            style={{
              color: 'var(--teal-bright)',
              background: 'none',
              border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              textDecoration: 'underline'
            }}
          >
            {isSignUp ? t('auth.haveAccount') : t('auth.noAccount')}
          </button>
        </div>

        {/* Debug Google OAuth */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-4 text-center">
            <button
              onClick={debugGoogleAuth}
              className="text-xs px-3 py-1 rounded transition-colors"
              style={{
                color: 'var(--gray-light)',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              🔍 Debug Google OAuth
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
