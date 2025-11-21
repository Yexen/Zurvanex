'use client';

interface SettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Settings({ isOpen, onClose }: SettingsProps) {
  if (!isOpen) return null;

  return (
    <div
      className="search-modal-overlay"
      onClick={onClose}
      style={{ zIndex: 1001 }}
    >
      <div
        className="search-modal"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '600px' }}
      >
        <div className="search-modal-header">
          <h3 className="search-modal-title">Settings</h3>
          <button
            className="search-modal-close"
            onClick={onClose}
            aria-label="Close settings"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div style={{ padding: '20px' }}>
          <div style={{ marginBottom: '24px' }}>
            <h4 style={{ color: 'var(--gray-med)', fontWeight: 600, marginBottom: '12px' }}>
              General Settings
            </h4>
            <p style={{ color: 'var(--gray-light)', fontSize: '14px' }}>
              Settings panel - More options coming soon!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
