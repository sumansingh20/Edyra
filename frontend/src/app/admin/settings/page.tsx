'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import LMSLayout from '@/components/layouts/LMSLayout';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';

interface SystemSettings {
  siteName: string;
  siteDescription: string;
  maintenanceMode: boolean;
  maintenanceMessage: string;
  sessionTimeout: number;
  maxLoginAttempts: number;
  lockoutDuration: number;
  enforceIPBinding: boolean;
  enforceBrowserBinding: boolean;
  defaultBatchSize: number;
  defaultExamDuration: number;
  defaultMaxViolations: number;
  autoSubmitOnViolation: boolean;
  emergencyFreeze: boolean;
  dobLoginEnabled: boolean;
  dobFormat: string;
  allowExamWindowOnly: boolean;
}

export default function SystemSettingsPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [settings, setSettings] = useState<SystemSettings>({
    siteName: 'ProctoredExam',
    siteDescription: 'Secure Proctored Examination System',
    maintenanceMode: false,
    maintenanceMessage: 'System is under maintenance. Please try again later.',
    sessionTimeout: 3600,
    maxLoginAttempts: 5,
    lockoutDuration: 7200,
    enforceIPBinding: true,
    enforceBrowserBinding: true,
    defaultBatchSize: 500,
    defaultExamDuration: 180,
    defaultMaxViolations: 3,
    autoSubmitOnViolation: true,
    emergencyFreeze: false,
    dobLoginEnabled: true,
    dobFormat: 'DDMMYYYY',
    allowExamWindowOnly: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [activeTab, setActiveTab] = useState('general');

  useEffect(() => {
    if (!isAuthenticated) { router.push('/login'); return; }
    if (user?.role !== 'admin') { router.push('/my'); return; }
    fetchSettings();
  }, [isAuthenticated, user, router]);

  const fetchSettings = async () => {
    try {
      const response = await api.get('/admin/settings');
      if (response.data.data?.settings) {
        setSettings(prev => ({ ...prev, ...response.data.data.settings }));
      }
    } catch {
      console.warn('Using default settings');
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    setMessage({ type: '', text: '' });
    try {
      await api.put('/admin/settings', settings);
      setMessage({ type: 'success', text: 'Settings saved successfully.' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to save settings.' });
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: keyof SystemSettings, value: any) => {
    setSettings(prev => ({ ...prev, [field]: value }));
    setMessage({ type: '', text: '' });
  };

  const tabs = [
    { id: 'general', label: 'General' },
    { id: 'security', label: 'Security' },
    { id: 'exam', label: 'Examination' },
    { id: 'authentication', label: 'Authentication' },
  ];

  if (loading) {
    return (
      <LMSLayout pageTitle="System Settings">
        <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>Loading settings...</div>
      </LMSLayout>
    );
  }

  return (
    <LMSLayout
      pageTitle="System Settings"
      breadcrumbs={[
        { label: 'Admin', href: '/admin/dashboard' },
        { label: 'Configuration' },
        { label: 'System Settings' },
      ]}
    >
      {/* Warning Banner */}
      <div className="lms-alert lms-alert-warning" style={{ marginBottom: 16 }}>
        <strong>Caution:</strong> Changes to system settings affect all users. Ensure proper testing before modifying production settings.
      </div>

      {/* Message */}
      {message.text && (
        <div className={`lms-alert lms-alert-${message.type}`} style={{ marginBottom: 16 }}>
          {message.text}
        </div>
      )}

      {/* Tabs */}
      <div className="lms-tabs" style={{ marginBottom: 20 }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`lms-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* General Settings */}
      {activeTab === 'general' && (
        <div className="lms-card" style={{ marginBottom: 20 }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)' }}>
            <h3 style={{ fontWeight: 600, color: 'var(--primary)' }}>General Settings</h3>
          </div>
          <div style={{ padding: 20 }}>
            <div className="lms-form-group" style={{ marginBottom: 20 }}>
              <label className="lms-label">Site Name</label>
              <input type="text" className="lms-input" style={{ width: 350 }} value={settings.siteName} onChange={(e) => handleChange('siteName', e.target.value)} placeholder="Enter site name" />
              <div className="lms-form-hint">Displayed in header and browser title</div>
            </div>
            <div className="lms-form-group" style={{ marginBottom: 20 }}>
              <label className="lms-label">Site Description</label>
              <input type="text" className="lms-input" style={{ width: 350 }} value={settings.siteDescription} onChange={(e) => handleChange('siteDescription', e.target.value)} placeholder="Enter site description" />
              <div className="lms-form-hint">Short description for login page</div>
            </div>
            <div className="lms-form-group" style={{ marginBottom: 20 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input type="checkbox" checked={settings.maintenanceMode} onChange={(e) => handleChange('maintenanceMode', e.target.checked)} />
                <span>Enable maintenance mode (blocks all student access)</span>
              </label>
            </div>
            <div className="lms-form-group">
              <label className="lms-label">Maintenance Message</label>
              <textarea className="lms-textarea" style={{ width: 350 }} value={settings.maintenanceMessage} onChange={(e) => handleChange('maintenanceMessage', e.target.value)} rows={3} placeholder="Enter maintenance message" />
            </div>
          </div>
        </div>
      )}

      {/* Security Settings */}
      {activeTab === 'security' && (
        <div className="lms-card" style={{ marginBottom: 20 }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)' }}>
            <h3 style={{ fontWeight: 600, color: 'var(--primary)' }}>Security Settings</h3>
          </div>
          <div style={{ padding: 20 }}>
            <div className="lms-form-group" style={{ marginBottom: 20 }}>
              <label className="lms-label">Session Timeout</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input type="number" className="lms-input" style={{ width: 120 }} value={settings.sessionTimeout} onChange={(e) => handleChange('sessionTimeout', parseInt(e.target.value))} min={300} max={86400} />
                <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>seconds</span>
              </div>
              <div className="lms-form-hint">Auto logout after inactivity (300-86400 seconds)</div>
            </div>
            <div className="lms-form-group" style={{ marginBottom: 20 }}>
              <label className="lms-label">Max Login Attempts</label>
              <input type="number" className="lms-input" style={{ width: 100 }} value={settings.maxLoginAttempts} onChange={(e) => handleChange('maxLoginAttempts', parseInt(e.target.value))} min={3} max={10} />
              <div className="lms-form-hint">Account locked after this many failed attempts</div>
            </div>
            <div className="lms-form-group" style={{ marginBottom: 20 }}>
              <label className="lms-label">Lockout Duration</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input type="number" className="lms-input" style={{ width: 120 }} value={settings.lockoutDuration} onChange={(e) => handleChange('lockoutDuration', parseInt(e.target.value))} min={300} max={86400} />
                <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>seconds</span>
              </div>
              <div className="lms-form-hint">Duration of account lockout</div>
            </div>
            <div className="lms-form-group" style={{ marginBottom: 20 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input type="checkbox" checked={settings.enforceIPBinding} onChange={(e) => handleChange('enforceIPBinding', e.target.checked)} />
                <span>Bind exam sessions to IP address</span>
              </label>
              <div className="lms-form-hint">Session terminated if IP changes during exam</div>
            </div>
            <div className="lms-form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input type="checkbox" checked={settings.enforceBrowserBinding} onChange={(e) => handleChange('enforceBrowserBinding', e.target.checked)} />
                <span>Bind exam sessions to browser fingerprint</span>
              </label>
              <div className="lms-form-hint">Prevents session hijacking</div>
            </div>
          </div>
        </div>
      )}

      {/* Examination Settings */}
      {activeTab === 'exam' && (
        <div className="lms-card" style={{ marginBottom: 20 }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)' }}>
            <h3 style={{ fontWeight: 600, color: 'var(--primary)' }}>Examination Settings</h3>
          </div>
          <div style={{ padding: 20 }}>
            <div className="lms-form-group" style={{ marginBottom: 20 }}>
              <label className="lms-label">Default Batch Size</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input type="number" className="lms-input" style={{ width: 120 }} value={settings.defaultBatchSize} onChange={(e) => handleChange('defaultBatchSize', parseInt(e.target.value))} min={10} max={1000} />
                <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>students</span>
              </div>
              <div className="lms-form-hint">Maximum students per batch (10-1000)</div>
            </div>
            <div className="lms-form-group" style={{ marginBottom: 20 }}>
              <label className="lms-label">Default Exam Duration</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input type="number" className="lms-input" style={{ width: 120 }} value={settings.defaultExamDuration} onChange={(e) => handleChange('defaultExamDuration', parseInt(e.target.value))} min={10} max={480} />
                <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>minutes</span>
              </div>
              <div className="lms-form-hint">Default duration for new exams</div>
            </div>
            <div className="lms-form-group" style={{ marginBottom: 20 }}>
              <label className="lms-label">Default Max Violations</label>
              <input type="number" className="lms-input" style={{ width: 100 }} value={settings.defaultMaxViolations} onChange={(e) => handleChange('defaultMaxViolations', parseInt(e.target.value))} min={1} max={10} />
              <div className="lms-form-hint">Violations allowed before auto-termination</div>
            </div>
            <div className="lms-form-group" style={{ marginBottom: 20 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input type="checkbox" checked={settings.autoSubmitOnViolation} onChange={(e) => handleChange('autoSubmitOnViolation', e.target.checked)} />
                <span>Automatically submit exam when max violations reached</span>
              </label>
            </div>
            <div className="lms-form-group">
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, cursor: 'pointer' }}>
                <input type="checkbox" checked={settings.emergencyFreeze} onChange={(e) => handleChange('emergencyFreeze', e.target.checked)} style={{ marginTop: 3 }} />
                <span>
                  <strong style={{ color: 'var(--error)' }}>ACTIVATE EMERGENCY FREEZE</strong><br />
                  <small style={{ color: 'var(--text-muted)' }}>
                    Freezes ALL exam operations. No exams can be started, published, or modified. Active sessions continue but no new actions allowed.
                  </small>
                </span>
              </label>
              {settings.emergencyFreeze && (
                <div className="lms-alert lms-alert-warning" style={{ marginTop: 10, padding: '8px 12px', fontSize: 12 }}>
                  <strong>Warning:</strong> Emergency freeze is ACTIVE. All exam operations are blocked.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Authentication Settings */}
      {activeTab === 'authentication' && (
        <div className="lms-card" style={{ marginBottom: 20 }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)' }}>
            <h3 style={{ fontWeight: 600, color: 'var(--primary)' }}>Student Authentication Settings</h3>
          </div>
          <div style={{ padding: 20 }}>
            <div className="lms-alert lms-alert-info" style={{ marginBottom: 20 }}>
              <strong>DOB-Based Login:</strong> Students authenticate using their Date of Birth instead of a password. This is standard for government examinations.
            </div>
            <div className="lms-form-group" style={{ marginBottom: 20 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input type="checkbox" checked={settings.dobLoginEnabled} onChange={(e) => handleChange('dobLoginEnabled', e.target.checked)} />
                <span>Enable DOB-based authentication for students</span>
              </label>
            </div>
            <div className="lms-form-group" style={{ marginBottom: 20 }}>
              <label className="lms-label">DOB Format</label>
              <select className="lms-select" style={{ width: 250 }} value={settings.dobFormat} onChange={(e) => handleChange('dobFormat', e.target.value)}>
                <option value="DDMMYYYY">DDMMYYYY (e.g., 15081990)</option>
                <option value="DD-MM-YYYY">DD-MM-YYYY (e.g., 15-08-1990)</option>
                <option value="DD/MM/YYYY">DD/MM/YYYY (e.g., 15/08/1990)</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD (e.g., 1990-08-15)</option>
              </select>
              <div className="lms-form-hint">Format students must use when logging in</div>
            </div>
            <div className="lms-form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input type="checkbox" checked={settings.allowExamWindowOnly} onChange={(e) => handleChange('allowExamWindowOnly', e.target.checked)} />
                <span>Allow student login only during assigned exam window</span>
              </label>
              <div className="lms-form-hint">Students cannot login before or after their scheduled exam</div>
            </div>
          </div>
        </div>
      )}

      {/* Save Button */}
      <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
        <button className="lms-btn lms-btn-primary" onClick={saveSettings} disabled={saving}>
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </LMSLayout>
  );
}
