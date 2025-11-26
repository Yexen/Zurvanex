'use client';

import { usePuterAuth } from '@/hooks/usePuterAuth';

interface PuterLoginButtonProps {
  variant?: 'full' | 'compact' | 'icon';
  className?: string;
  onSignIn?: () => void;
}

/**
 * Button to sign in to Puter for free AI models
 */
export default function PuterLoginButton({
  variant = 'full',
  className = '',
  onSignIn,
}: PuterLoginButtonProps) {
  const { isSignedIn, isLoading, user, error, signIn } = usePuterAuth();

  const handleClick = async () => {
    if (!isSignedIn) {
      await signIn();
      onSignIn?.();
    }
  };

  // Puter cloud icon
  const PuterIcon = () => (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M19.35 10.04C18.67 6.59 15.64 4 12 4C9.11 4 6.6 5.64 5.35 8.04C2.34 8.36 0 10.91 0 14C0 17.31 2.69 20 6 20H19C21.76 20 24 17.76 24 15C24 12.36 21.95 10.22 19.35 10.04Z"
        fill="currentColor"
      />
    </svg>
  );

  // Loading state
  if (isLoading) {
    return (
      <button
        disabled
        className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${className}`}
        style={{
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          color: 'var(--gray-light)',
          cursor: 'not-allowed',
          opacity: 0.6,
        }}
      >
        <div
          className="w-4 h-4 border-2 rounded-full animate-spin"
          style={{
            borderColor: 'transparent',
            borderTopColor: 'var(--teal-bright)',
          }}
        />
        {variant !== 'icon' && <span>Checking...</span>}
      </button>
    );
  }

  // Signed in state
  if (isSignedIn) {
    return (
      <div
        className={`flex items-center gap-2 px-3 py-2 rounded-lg ${className}`}
        style={{
          background: 'rgba(114, 212, 204, 0.1)',
          border: '1px solid rgba(114, 212, 204, 0.3)',
          color: 'var(--teal-bright)',
        }}
      >
        <PuterIcon />
        {variant === 'full' && (
          <div className="flex flex-col">
            <span className="text-sm font-medium">Puter Connected</span>
            {user?.username && (
              <span
                className="text-xs"
                style={{ color: 'var(--gray-light)' }}
              >
                {user.username}
              </span>
            )}
          </div>
        )}
        {variant === 'compact' && (
          <span className="text-sm">Connected</span>
        )}
      </div>
    );
  }

  // Not signed in - show login button
  return (
    <button
      onClick={handleClick}
      className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all hover:scale-[1.02] ${className}`}
      style={{
        background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
        border: 'none',
        color: 'white',
        cursor: 'pointer',
        boxShadow: '0 2px 8px rgba(99, 102, 241, 0.3)',
      }}
      title="Sign in to Puter for free AI models (GPT-4o, Claude, Gemini, etc.)"
    >
      <PuterIcon />
      {variant === 'full' && (
        <div className="flex flex-col items-start">
          <span className="text-sm font-medium">Connect Puter</span>
          <span className="text-xs opacity-80">Free AI models</span>
        </div>
      )}
      {variant === 'compact' && (
        <span className="text-sm font-medium">Connect Puter</span>
      )}
      {error && variant === 'full' && (
        <span className="text-xs text-red-300 ml-2">{error}</span>
      )}
    </button>
  );
}

/**
 * Inline Puter status indicator for model selector
 */
export function PuterStatusIndicator() {
  const { isSignedIn, isLoading, signIn } = usePuterAuth();

  if (isLoading) {
    return (
      <span
        className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded"
        style={{
          background: 'rgba(255, 255, 255, 0.05)',
          color: 'var(--gray-light)',
        }}
      >
        <div
          className="w-2 h-2 border border-t-transparent rounded-full animate-spin"
          style={{ borderColor: 'var(--gray-light)' }}
        />
        Checking...
      </span>
    );
  }

  if (isSignedIn) {
    return (
      <span
        className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded"
        style={{
          background: 'rgba(114, 212, 204, 0.1)',
          color: 'var(--teal-bright)',
        }}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
        Puter Active
      </span>
    );
  }

  return (
    <button
      onClick={signIn}
      className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded transition-all hover:opacity-80"
      style={{
        background: 'rgba(99, 102, 241, 0.2)',
        color: '#a5b4fc',
        border: 'none',
        cursor: 'pointer',
      }}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
      Connect Puter
    </button>
  );
}
