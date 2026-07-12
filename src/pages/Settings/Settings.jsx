import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import './Settings.css';

const Settings = () => {
  const { user, logout } = useAuth();
  const { vehicles, drivers, trips, maintenance, fuelLogs, expenses } = useData();

  // Toggle preferences (saved locally for demo)
  const [autoSeed, setAutoSeed] = useState(true);
  const [showNotifications, setShowNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [compactView, setCompactView] = useState(false);

  // Confirm Reset State
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Data stats
  const stats = useMemo(() => ({
    vehicles: vehicles.length,
    drivers: drivers.length,
    trips: trips.length,
    maintenance: maintenance.length,
    fuelLogs: fuelLogs.length,
    expenses: expenses.length,
  }), [vehicles, drivers, trips, maintenance, fuelLogs, expenses]);

  const totalRecords = Object.values(stats).reduce((sum, val) => sum + val, 0);

  // Estimate storage usage
  const storageUsed = useMemo(() => {
    let total = 0;
    for (let key in localStorage) {
      if (key.startsWith('transitops_')) {
        total += (localStorage.getItem(key) || '').length;
      }
    }
    return (total / 1024).toFixed(1); // KB
  }, []);

  const handleResetData = () => {
    // Clear all transitops_ keys from localStorage
    const keysToRemove = [];
    for (let key in localStorage) {
      if (key.startsWith('transitops_')) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
    setShowResetConfirm(false);
    // Logout and reload to re-seed data
    logout();
    window.location.reload();
  };

  const handleExportAllData = () => {
    const allData = {};
    for (let key in localStorage) {
      if (key.startsWith('transitops_')) {
        try {
          allData[key] = JSON.parse(localStorage.getItem(key));
        } catch {
          allData[key] = localStorage.getItem(key);
        }
      }
    }

    const blob = new Blob([JSON.stringify(allData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `TransitOps_Backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const userInitials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  return (
    <div className="settings-page">
      {/* Profile Section */}
      <div className="settings-section">
        <h3 className="settings-section-title">
          <span className="settings-section-title-icon">👤</span>
          Profile
        </h3>
        <div className="profile-card">
          <div className="profile-avatar">{userInitials}</div>
          <div className="profile-info">
            <span className="profile-name">{user?.name || 'User'}</span>
            <span className="profile-role">{user?.role || 'Unknown'}</span>
            <span className="profile-email">{user?.email || ''}</span>
          </div>
        </div>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          Role-based access is enforced. To change your role, log out and sign in with a different account.
        </p>
      </div>

      {/* Preferences Section */}
      <div className="settings-section">
        <h3 className="settings-section-title">
          <span className="settings-section-title-icon">⚙️</span>
          Preferences
        </h3>

        <div className="settings-toggle-row">
          <div className="toggle-label-group">
            <span className="toggle-label">Auto-Seed Demo Data</span>
            <span className="toggle-description">Populate the database with sample vehicles, drivers, and trips on first load.</span>
          </div>
          <label className="toggle-switch">
            <input type="checkbox" checked={autoSeed} onChange={() => setAutoSeed(!autoSeed)} />
            <span className="toggle-slider" />
          </label>
        </div>

        <div className="settings-toggle-row">
          <div className="toggle-label-group">
            <span className="toggle-label">Show Notifications</span>
            <span className="toggle-description">Display toast notifications for status changes and validation errors.</span>
          </div>
          <label className="toggle-switch">
            <input type="checkbox" checked={showNotifications} onChange={() => setShowNotifications(!showNotifications)} />
            <span className="toggle-slider" />
          </label>
        </div>

        <div className="settings-toggle-row">
          <div className="toggle-label-group">
            <span className="toggle-label">Dark Mode</span>
            <span className="toggle-description">Switch to a dark color scheme (coming soon).</span>
          </div>
          <label className="toggle-switch">
            <input type="checkbox" checked={darkMode} onChange={() => setDarkMode(!darkMode)} />
            <span className="toggle-slider" />
          </label>
        </div>

        <div className="settings-toggle-row">
          <div className="toggle-label-group">
            <span className="toggle-label">Compact Table View</span>
            <span className="toggle-description">Reduce table row padding for denser data display.</span>
          </div>
          <label className="toggle-switch">
            <input type="checkbox" checked={compactView} onChange={() => setCompactView(!compactView)} />
            <span className="toggle-slider" />
          </label>
        </div>
      </div>

      {/* Data Management Section */}
      <div className="settings-section">
        <h3 className="settings-section-title">
          <span className="settings-section-title-icon">💾</span>
          Data Management
        </h3>

        <div className="data-stat">
          Total Records: <strong>{totalRecords}</strong> &nbsp;|&nbsp;
          Storage Used: <strong>{storageUsed} KB</strong>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', margin: '0.75rem 0' }}>
          <div className="data-stat">🚛 Vehicles: <strong>{stats.vehicles}</strong></div>
          <div className="data-stat">👤 Drivers: <strong>{stats.drivers}</strong></div>
          <div className="data-stat">🗺️ Trips: <strong>{stats.trips}</strong></div>
          <div className="data-stat">🔧 Maintenance: <strong>{stats.maintenance}</strong></div>
          <div className="data-stat">⛽ Fuel Logs: <strong>{stats.fuelLogs}</strong></div>
          <div className="data-stat">💸 Expenses: <strong>{stats.expenses}</strong></div>
        </div>

        <div className="data-actions">
          <button className="btn btn-primary btn-sm" onClick={handleExportAllData}>
            📥 Export All Data (JSON)
          </button>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="settings-section danger-zone">
        <h3 className="settings-section-title">
          <span className="settings-section-title-icon">🚨</span>
          Danger Zone
        </h3>

        <p className="danger-description">
          Resetting the database will permanently delete all vehicles, drivers, trips, maintenance logs, fuel logs, and expenses.
          The application will reload with fresh demo seed data.
        </p>

        {!showResetConfirm ? (
          <button className="btn btn-danger" onClick={() => setShowResetConfirm(true)}>
            Reset All Data
          </button>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--danger)' }}>Are you sure?</span>
            <button className="btn btn-danger btn-sm" onClick={handleResetData}>
              Yes, Reset Everything
            </button>
            <button className="btn btn-outline btn-sm" onClick={() => setShowResetConfirm(false)}>
              Cancel
            </button>
          </div>
        )}
      </div>

      {/* About Section */}
      <div className="settings-section">
        <h3 className="settings-section-title">
          <span className="settings-section-title-icon">ℹ️</span>
          About TransitOps
        </h3>

        <div className="about-grid">
          <div className="about-item">
            <span className="about-item-label">Version</span>
            <span className="about-item-value">1.0.0</span>
          </div>
          <div className="about-item">
            <span className="about-item-label">Stack</span>
            <span className="about-item-value">React + Vite</span>
          </div>
          <div className="about-item">
            <span className="about-item-label">Storage</span>
            <span className="about-item-value">localStorage</span>
          </div>
          <div className="about-item">
            <span className="about-item-label">Auth</span>
            <span className="about-item-value">RBAC (4 Roles)</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
