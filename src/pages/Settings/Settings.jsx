import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import './Settings.css';

// RBAC permissions matrix matching the mockup
const rbacMatrix = [
  {
    role: 'Fleet Manager',
    fleet: 'full',
    dashboard: 'full',
    drivers: 'none',
    trips: 'none',
    fuelMaint: 'none',
    analytics: 'full',
  },
  {
    role: 'Dispatcher',
    fleet: 'view',
    dashboard: 'none',
    drivers: 'none',
    trips: 'full',
    fuelMaint: 'none',
    analytics: 'none',
  },
  {
    role: 'Safety Officer',
    fleet: 'none',
    dashboard: 'full',
    drivers: 'full',
    trips: 'view',
    fuelMaint: 'none',
    analytics: 'none',
  },
  {
    role: 'Financial Analyst',
    fleet: 'view',
    dashboard: 'none',
    drivers: 'none',
    trips: 'none',
    fuelMaint: 'full',
    analytics: 'full',
  },
];

const renderAccess = (level) => {
  if (level === 'full') return <span className="rbac-check">✓</span>;
  if (level === 'view') return <span className="rbac-view">view</span>;
  return <span className="rbac-dash">—</span>;
};

const Settings = () => {
  const { user, logout } = useAuth();
  const { vehicles, drivers, trips, maintenance, fuelLogs, expenses } = useData();

  // General settings form
  const [depotName, setDepotName] = useState('Gandhinagar Depot GTJ');
  const [currency, setCurrency] = useState('INR (Rs)');
  const [distanceUnit, setDistanceUnit] = useState('Kilometers');
  const [saved, setSaved] = useState(false);

  // Dark mode - read from localStorage on mount
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('transitops_theme') === 'dark';
  });

  // Apply theme on mount and when toggled
  React.useEffect(() => {
    if (darkMode) {
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('transitops_theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
      localStorage.setItem('transitops_theme', 'light');
    }
  }, [darkMode]);

  // Delete confirm
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

  const storageUsed = useMemo(() => {
    let total = 0;
    for (let key in localStorage) {
      if (key.startsWith('transitops_')) {
        total += (localStorage.getItem(key) || '').length;
      }
    }
    return (total / 1024).toFixed(1);
  }, []);

  const handleSaveGeneral = (e) => {
    e.preventDefault();
    // Save to localStorage
    localStorage.setItem('transitops_settings', JSON.stringify({
      depotName, currency, distanceUnit,
    }));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleResetData = () => {
    const keysToRemove = [];
    for (let key in localStorage) {
      if (key.startsWith('transitops_')) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
    setShowResetConfirm(false);
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
      {/* Left Column: General Settings */}
      <div className="settings-general-panel">
        <h3 className="settings-section-title">General</h3>

        <form onSubmit={handleSaveGeneral}>
          <div className="form-group">
            <label className="form-label">Depot Name</label>
            <input
              type="text"
              className="form-input"
              value={depotName}
              onChange={(e) => setDepotName(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Currency</label>
            <input
              type="text"
              className="form-input"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Distance Unit</label>
            <input
              type="text"
              className="form-input"
              value={distanceUnit}
              onChange={(e) => setDistanceUnit(e.target.value)}
            />
          </div>

          {/* Dark Mode Toggle */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '1rem 0', marginTop: '0.5rem', borderTop: '1px solid var(--border)',
          }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                {darkMode ? '🌙' : '☀️'} Dark Mode
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Switch between light and dark theme
              </div>
            </div>
            <label className="toggle-switch">
              <input type="checkbox" checked={darkMode} onChange={() => setDarkMode(!darkMode)} />
              <span className="toggle-slider" />
            </label>
          </div>

          <button type="submit" className="btn-save-settings">
            Save Changes
          </button>

          {saved && (
            <div className="save-success-msg">
              ✓ Settings saved successfully
            </div>
          )}
        </form>
      </div>

      {/* Right Column: RBAC Table */}
      <div className="settings-rbac-section">
        <h3 className="settings-section-title">Role-Based Access (RBAC)</h3>

        <div className="rbac-table-wrapper">
          <table className="rbac-table">
            <thead>
              <tr>
                <th>Role</th>
                <th>Fleet</th>
                <th>Dashboard</th>
                <th>Drivers</th>
                <th>Trips</th>
                <th>Fuel/Maint</th>
                <th>Analytics</th>
              </tr>
            </thead>
            <tbody>
              {rbacMatrix.map((row) => (
                <tr key={row.role} style={user?.role === row.role ? { backgroundColor: 'var(--primary-light)' } : {}}>
                  <td>{row.role}</td>
                  <td>{renderAccess(row.fleet)}</td>
                  <td>{renderAccess(row.dashboard)}</td>
                  <td>{renderAccess(row.drivers)}</td>
                  <td>{renderAccess(row.trips)}</td>
                  <td>{renderAccess(row.fuelMaint)}</td>
                  <td>{renderAccess(row.analytics)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bottom Sections */}
      <div className="settings-extra-sections">
        {/* Profile */}
        <div className="settings-section-card">
          <h3 className="settings-section-title">👤 Profile</h3>
          <div className="profile-card">
            <div className="profile-avatar">{userInitials}</div>
            <div className="profile-info">
              <span className="profile-name">{user?.name || 'User'}</span>
              <span className="profile-role">{user?.role || 'Unknown'}</span>
              <span className="profile-email">{user?.email || ''}</span>
            </div>
          </div>

          <h4 className="settings-section-title" style={{ marginTop: '1.25rem' }}>💾 Data Management</h4>
          <div className="data-stat">
            Total Records: <strong>{totalRecords}</strong> &nbsp;|&nbsp;
            Storage: <strong>{storageUsed} KB</strong>
          </div>
          <div className="data-stat-grid">
            <div className="data-stat">🚛 Vehicles: <strong>{stats.vehicles}</strong></div>
            <div className="data-stat">👤 Drivers: <strong>{stats.drivers}</strong></div>
            <div className="data-stat">🗺️ Trips: <strong>{stats.trips}</strong></div>
            <div className="data-stat">🔧 Maint: <strong>{stats.maintenance}</strong></div>
            <div className="data-stat">⛽ Fuel: <strong>{stats.fuelLogs}</strong></div>
            <div className="data-stat">💸 Expenses: <strong>{stats.expenses}</strong></div>
          </div>
          <button className="btn btn-primary btn-sm" onClick={handleExportAllData} style={{ marginTop: '0.5rem' }}>
            📥 Export All Data (JSON)
          </button>
        </div>

        {/* Danger Zone */}
        <div className="settings-section-card danger-zone">
          <h3 className="settings-section-title">🚨 Danger Zone</h3>
          <p className="danger-description">
            Resetting the database will permanently delete all vehicles, drivers, trips, maintenance logs, fuel logs, and expenses.
            The app will reload with fresh demo seed data.
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
      </div>
    </div>
  );
};

export default Settings;
