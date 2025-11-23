'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useUserPreferences } from '@/hooks/useUserPreferences';

interface SettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Settings({ isOpen, onClose }: SettingsProps) {
  const { user } = useAuth();
  const { preferences, loading, updateNickname, updateBio, updateNotificationSettings, updatePrivacySettings } = useUserPreferences(user?.id || null);
  
  const [activeTab, setActiveTab] = useState('profile');
  const [formData, setFormData] = useState({
    nickname: '',
    bio: '',
    notifications: {
      email: true,
      push: true,
      mentions: true,
    },
    privacy: {
      profile_visible: true,
      activity_visible: false,
    },
  });
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  // Update form data when preferences load
  useEffect(() => {
    if (preferences) {
      setFormData({
        nickname: preferences.nickname || '',
        bio: preferences.bio || '',
        notifications: preferences.notifications,
        privacy: preferences.privacy_settings,
      });
    }
  }, [preferences]);

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);
    setSaveStatus(null);

    try {
      await Promise.all([
        updateNickname(formData.nickname),
        updateBio(formData.bio),
        updateNotificationSettings(formData.notifications),
        updatePrivacySettings(formData.privacy),
      ]);
      
      setSaveStatus('Settings saved successfully!');
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
      setSaveStatus('Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  const tabs = [
    { id: 'profile', label: 'Profile', icon: '👤' },
    { id: 'notifications', label: 'Notifications', icon: '🔔' },
    { id: 'privacy', label: 'Privacy', icon: '🔒' },
  ];

  return (
    <div
      className="search-modal-overlay"
      onClick={onClose}
      style={{ zIndex: 1001 }}
    >
      <div
        className="search-modal"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '700px', maxHeight: '80vh' }}
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

        <div style={{ display: 'flex', height: '500px' }}>
          {/* Sidebar */}
          <div style={{ 
            width: '200px', 
            background: 'var(--darker-bg)', 
            borderRight: '1px solid rgba(255, 255, 255, 0.1)',
            padding: '20px 0'
          }}>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  width: '100%',
                  padding: '12px 20px',
                  background: activeTab === tab.id ? 'var(--teal-med)' : 'transparent',
                  color: activeTab === tab.id ? 'white' : 'var(--gray-med)',
                  border: 'none',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  fontSize: '14px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  if (activeTab !== tab.id) {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeTab !== tab.id) {
                    e.currentTarget.style.background = 'transparent';
                  }
                }}
              >
                <span style={{ fontSize: '16px' }}>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div style={{ flex: 1, padding: '20px', overflow: 'auto' }}>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <div style={{ color: 'var(--gray-med)' }}>Loading preferences...</div>
              </div>
            ) : (
              <>
                {activeTab === 'profile' && (
                  <div>
                    <h4 style={{ color: 'var(--gray-light)', fontSize: '18px', marginBottom: '20px', fontWeight: '600' }}>
                      Profile Information
                    </h4>
                    
                    <div style={{ marginBottom: '24px' }}>
                      <label style={{ 
                        display: 'block', 
                        color: 'var(--gray-med)', 
                        marginBottom: '8px', 
                        fontSize: '14px',
                        fontWeight: '500'
                      }}>
                        Email
                      </label>
                      <input
                        type="email"
                        value={user?.email || ''}
                        disabled
                        style={{
                          width: '100%',
                          padding: '12px',
                          background: 'var(--darker-bg)',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          borderRadius: '8px',
                          color: 'var(--gray-light)',
                          fontSize: '14px',
                          opacity: 0.6,
                        }}
                      />
                    </div>

                    <div style={{ marginBottom: '24px' }}>
                      <label style={{ 
                        display: 'block', 
                        color: 'var(--gray-med)', 
                        marginBottom: '8px', 
                        fontSize: '14px',
                        fontWeight: '500'
                      }}>
                        Nickname
                      </label>
                      <input
                        type="text"
                        value={formData.nickname}
                        onChange={(e) => setFormData(prev => ({ ...prev, nickname: e.target.value }))}
                        placeholder="How would you like to be called?"
                        maxLength={50}
                        style={{
                          width: '100%',
                          padding: '12px',
                          background: 'var(--bg-dark)',
                          border: '1px solid rgba(255, 255, 255, 0.2)',
                          borderRadius: '8px',
                          color: 'var(--gray-light)',
                          fontSize: '14px',
                          transition: 'border-color 0.2s',
                        }}
                        onFocus={(e) => e.currentTarget.style.borderColor = 'var(--teal-bright)'}
                        onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)'}
                      />
                      <div style={{ 
                        fontSize: '12px', 
                        color: 'var(--gray-dark)', 
                        marginTop: '4px' 
                      }}>
                        {formData.nickname.length}/50 characters
                      </div>
                    </div>

                    <div style={{ marginBottom: '24px' }}>
                      <label style={{ 
                        display: 'block', 
                        color: 'var(--gray-med)', 
                        marginBottom: '8px', 
                        fontSize: '14px',
                        fontWeight: '500'
                      }}>
                        Bio
                      </label>
                      <textarea
                        value={formData.bio}
                        onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                        placeholder="Tell us about yourself..."
                        maxLength={500}
                        rows={4}
                        style={{
                          width: '100%',
                          padding: '12px',
                          background: 'var(--bg-dark)',
                          border: '1px solid rgba(255, 255, 255, 0.2)',
                          borderRadius: '8px',
                          color: 'var(--gray-light)',
                          fontSize: '14px',
                          resize: 'vertical',
                          minHeight: '80px',
                          transition: 'border-color 0.2s',
                        }}
                        onFocus={(e) => e.currentTarget.style.borderColor = 'var(--teal-bright)'}
                        onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)'}
                      />
                      <div style={{ 
                        fontSize: '12px', 
                        color: 'var(--gray-dark)', 
                        marginTop: '4px' 
                      }}>
                        {formData.bio.length}/500 characters
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'notifications' && (
                  <div>
                    <h4 style={{ color: 'var(--gray-light)', fontSize: '18px', marginBottom: '20px', fontWeight: '600' }}>
                      Notification Preferences
                    </h4>
                    
                    {[
                      { key: 'email', label: 'Email Notifications', description: 'Receive updates via email' },
                      { key: 'push', label: 'Push Notifications', description: 'Browser push notifications' },
                      { key: 'mentions', label: 'Mention Notifications', description: 'When someone mentions you' },
                    ].map((item) => (
                      <div key={item.key} style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        padding: '16px 0',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
                      }}>
                        <div>
                          <div style={{ color: 'var(--gray-light)', fontSize: '14px', fontWeight: '500' }}>
                            {item.label}
                          </div>
                          <div style={{ color: 'var(--gray-dark)', fontSize: '12px' }}>
                            {item.description}
                          </div>
                        </div>
                        <label style={{ position: 'relative', display: 'inline-block', width: '44px', height: '24px' }}>
                          <input
                            type="checkbox"
                            checked={formData.notifications[item.key as keyof typeof formData.notifications]}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              notifications: {
                                ...prev.notifications,
                                [item.key]: e.target.checked
                              }
                            }))}
                            style={{ opacity: 0, width: 0, height: 0 }}
                          />
                          <span style={{
                            position: 'absolute',
                            cursor: 'pointer',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backgroundColor: formData.notifications[item.key as keyof typeof formData.notifications] 
                              ? 'var(--teal-bright)' 
                              : 'var(--gray-dark)',
                            transition: 'all 0.2s',
                            borderRadius: '24px',
                          }}>
                            <span style={{
                              position: 'absolute',
                              content: '',
                              height: '18px',
                              width: '18px',
                              left: formData.notifications[item.key as keyof typeof formData.notifications] ? '23px' : '3px',
                              bottom: '3px',
                              backgroundColor: 'white',
                              transition: 'all 0.2s',
                              borderRadius: '50%',
                            }} />
                          </span>
                        </label>
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === 'privacy' && (
                  <div>
                    <h4 style={{ color: 'var(--gray-light)', fontSize: '18px', marginBottom: '20px', fontWeight: '600' }}>
                      Privacy Settings
                    </h4>
                    
                    {[
                      { key: 'profile_visible', label: 'Public Profile', description: 'Make your profile visible to others' },
                      { key: 'activity_visible', label: 'Activity Status', description: 'Show when you\'re active' },
                    ].map((item) => (
                      <div key={item.key} style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        padding: '16px 0',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
                      }}>
                        <div>
                          <div style={{ color: 'var(--gray-light)', fontSize: '14px', fontWeight: '500' }}>
                            {item.label}
                          </div>
                          <div style={{ color: 'var(--gray-dark)', fontSize: '12px' }}>
                            {item.description}
                          </div>
                        </div>
                        <label style={{ position: 'relative', display: 'inline-block', width: '44px', height: '24px' }}>
                          <input
                            type="checkbox"
                            checked={formData.privacy[item.key as keyof typeof formData.privacy]}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              privacy: {
                                ...prev.privacy,
                                [item.key]: e.target.checked
                              }
                            }))}
                            style={{ opacity: 0, width: 0, height: 0 }}
                          />
                          <span style={{
                            position: 'absolute',
                            cursor: 'pointer',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backgroundColor: formData.privacy[item.key as keyof typeof formData.privacy] 
                              ? 'var(--teal-bright)' 
                              : 'var(--gray-dark)',
                            transition: 'all 0.2s',
                            borderRadius: '24px',
                          }}>
                            <span style={{
                              position: 'absolute',
                              content: '',
                              height: '18px',
                              width: '18px',
                              left: formData.privacy[item.key as keyof typeof formData.privacy] ? '23px' : '3px',
                              bottom: '3px',
                              backgroundColor: 'white',
                              transition: 'all 0.2s',
                              borderRadius: '50%',
                            }} />
                          </span>
                        </label>
                      </div>
                    ))}
                  </div>
                )}

                {/* Save Button */}
                <div style={{ 
                  marginTop: '32px', 
                  paddingTop: '20px', 
                  borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  {saveStatus && (
                    <div style={{ 
                      fontSize: '14px',
                      color: saveStatus.includes('Failed') ? '#ef4444' : 'var(--teal-bright)',
                    }}>
                      {saveStatus}
                    </div>
                  )}
                  <div style={{ marginLeft: 'auto' }}>
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      style={{
                        padding: '12px 24px',
                        background: saving ? 'var(--gray-dark)' : 'var(--teal-bright)',
                        color: saving ? 'var(--gray-med)' : '#000',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontWeight: '600',
                        cursor: saving ? 'not-allowed' : 'pointer',
                        transition: 'all 0.2s',
                      }}
                    >
                      {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
