import React, { useState } from 'react';
import {
  User,
  Lock,
  Sliders,
  LogOut,
  CheckCircle,
  AlertCircle,
  Shield,
  Bell,
  Save
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const Settings = () => {
  const { user, updateUser, logout } = useAuth();

  // Profile edit state
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [profileMsg, setProfileMsg] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);

  // Password change state
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passMsg, setPassMsg] = useState(null);
  const [passLoading, setPassLoading] = useState(false);

  // Application Preferences state (persisted locally)
  const [prefs, setPrefs] = useState(() => {
    const saved = localStorage.getItem('gradelytics_prefs');
    return saved ? JSON.parse(saved) : {
      enableRiskAlerts: true,
      defaultCourse: 'BCA',
      defaultSemester: 5,
      passingThreshold: 40,
    };
  });
  const [prefSaved, setPrefSaved] = useState(false);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileMsg(null);
    try {
      setProfileLoading(true);
      const res = await api.put('/auth/profile', { full_name: fullName });
      if (res.data.success) {
        updateUser(res.data.user);
        setProfileMsg({ type: 'success', text: 'Profile name updated successfully!' });
      }
    } catch (err) {
      setProfileMsg({ type: 'error', text: err.response?.data?.message || 'Failed to update profile.' });
    } finally {
      setProfileLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPassMsg(null);

    if (newPassword.length < 6) {
      setPassMsg({ type: 'error', text: 'New password must be at least 6 characters.' });
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setPassMsg({ type: 'error', text: 'New passwords do not match.' });
      return;
    }

    try {
      setPassLoading(true);
      const res = await api.put('/auth/change-password', {
        old_password: oldPassword,
        new_password: newPassword,
      });
      if (res.data.success) {
        setPassMsg({ type: 'success', text: 'Password changed successfully!' });
        setOldPassword('');
        setNewPassword('');
        setConfirmNewPassword('');
      }
    } catch (err) {
      setPassMsg({ type: 'error', text: err.response?.data?.message || 'Password update failed.' });
    } finally {
      setPassLoading(false);
    }
  };

  const handleSavePreferences = (e) => {
    e.preventDefault();
    localStorage.setItem('gradelytics_prefs', JSON.stringify(prefs));
    setPrefSaved(true);
    setTimeout(() => setPrefSaved(false), 2500);
  };

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <div>
          <h2 className="page-title">Application Settings</h2>
          <p className="page-subtitle">
            Manage your educator profile, security credentials, and cohort evaluation thresholds.
          </p>
        </div>
      </div>

      <div className="grid-2">
        {/* Left Column: Profile & Security */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Edit Profile */}
          <div className="card">
            <div className="card-header">
              <div>
                <h3 className="card-title">Educator Profile</h3>
                <p className="card-subtitle">Personal academic credentials</p>
              </div>
              <User size={20} color="#2563EB" />
            </div>

            {profileMsg && (
              <div
                style={{
                  padding: '10px 14px',
                  borderRadius: '6px',
                  fontSize: '13px',
                  marginBottom: '16px',
                  backgroundColor: profileMsg.type === 'success' ? '#ECFDF5' : '#FEF2F2',
                  color: profileMsg.type === 'success' ? '#065F46' : '#991B1B',
                  border: profileMsg.type === 'success' ? '1px solid #A7F3D0' : '1px solid #FECACA',
                }}
              >
                {profileMsg.text}
              </div>
            )}

            <form onSubmit={handleUpdateProfile}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  className="form-input"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Email Address (Read Only)</label>
                <input
                  type="email"
                  className="form-input"
                  disabled
                  value={user?.email || ''}
                  style={{ backgroundColor: '#F8FAFC', color: '#64748B' }}
                />
              </div>

              <button type="submit" className="btn btn-primary btn-sm" disabled={profileLoading}>
                <Save size={14} />
                <span>{profileLoading ? 'Saving...' : 'Save Profile Changes'}</span>
              </button>
            </form>
          </div>

          {/* Change Password */}
          <div className="card">
            <div className="card-header">
              <div>
                <h3 className="card-title">Security & Password</h3>
                <p className="card-subtitle">Update your account authentication password</p>
              </div>
              <Lock size={20} color="#0284C7" />
            </div>

            {passMsg && (
              <div
                style={{
                  padding: '10px 14px',
                  borderRadius: '6px',
                  fontSize: '13px',
                  marginBottom: '16px',
                  backgroundColor: passMsg.type === 'success' ? '#ECFDF5' : '#FEF2F2',
                  color: passMsg.type === 'success' ? '#065F46' : '#991B1B',
                  border: passMsg.type === 'success' ? '1px solid #A7F3D0' : '1px solid #FECACA',
                }}
              >
                {passMsg.text}
              </div>
            )}

            <form onSubmit={handleChangePassword}>
              <div className="form-group">
                <label className="form-label">Current Password</label>
                <input
                  type="password"
                  className="form-input"
                  required
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                />
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">New Password</label>
                  <input
                    type="password"
                    className="form-input"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Confirm New Password</label>
                  <input
                    type="password"
                    className="form-input"
                    required
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                  />
                </div>
              </div>

              <button type="submit" className="btn btn-primary btn-sm" disabled={passLoading}>
                <Shield size={14} />
                <span>{passLoading ? 'Updating...' : 'Update Password'}</span>
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Preferences & Sign out */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Application Preferences */}
          <div className="card">
            <div className="card-header">
              <div>
                <h3 className="card-title">Academic Preferences</h3>
                <p className="card-subtitle">Default values for prediction forms & alerts</p>
              </div>
              <Sliders size={20} color="#10B981" />
            </div>

            {prefSaved && (
              <div
                style={{
                  padding: '10px 14px',
                  borderRadius: '6px',
                  fontSize: '13px',
                  marginBottom: '16px',
                  backgroundColor: '#ECFDF5',
                  color: '#065F46',
                  border: '1px solid #A7F3D0',
                }}
              >
                Preferences saved successfully!
              </div>
            )}

            <form onSubmit={handleSavePreferences}>
              <div className="form-group">
                <label className="form-label">Default Department Course</label>
                <input
                  type="text"
                  className="form-input"
                  value={prefs.defaultCourse}
                  onChange={(e) => setPrefs({ ...prefs, defaultCourse: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Default Semester</label>
                <select
                  className="form-select"
                  value={prefs.defaultSemester}
                  onChange={(e) => setPrefs({ ...prefs, defaultSemester: parseInt(e.target.value) })}
                >
                  {[1, 2, 3, 4, 5, 6].map((s) => (
                    <option key={s} value={s}>Semester {s}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Passing Marks Threshold (%)</label>
                <input
                  type="number"
                  className="form-input"
                  value={prefs.passingThreshold}
                  onChange={(e) => setPrefs({ ...prefs, passingThreshold: parseInt(e.target.value) })}
                />
                <span className="form-helper">Scores below this trigger "Needs Improvement" (At Risk)</span>
              </div>

              <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '12px' }}>
                <input
                  type="checkbox"
                  id="riskCheck"
                  checked={prefs.enableRiskAlerts}
                  onChange={(e) => setPrefs({ ...prefs, enableRiskAlerts: e.target.checked })}
                  style={{ width: '16px', height: '16px' }}
                />
                <label htmlFor="riskCheck" style={{ fontSize: '13px', color: '#172554', fontWeight: 500, cursor: 'pointer' }}>
                  Highlight low-attendance (&lt;65%) and high-risk students on Dashboard
                </label>
              </div>

              <button type="submit" className="btn btn-primary btn-sm">
                <Save size={14} />
                <span>Save Academic Preferences</span>
              </button>
            </form>
          </div>

          {/* Session & Sign Out */}
          <div className="card" style={{ borderColor: '#FCA5A5', backgroundColor: '#FEF2F2' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#991B1B' }}>Sign Out of Session</h3>
            <p style={{ fontSize: '13px', color: '#7F1D1D', marginTop: '4px', lineHeight: 1.5 }}>
              Terminate your active session on this device. You will need to log back in to manage students or run ML predictions.
            </p>
            <button
              onClick={logout}
              className="btn btn-danger btn-sm"
              style={{ marginTop: '16px' }}
            >
              <LogOut size={14} />
              <span>Log Out Immediately</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
