import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import './Layout.css';

const navGroups = [
  {
    label: 'Overview',
    items: [
      { key: 'dashboard', label: 'Dashboard', icon: '📊' },
    ],
  },
  {
    label: 'Operations',
    items: [
      { key: 'fleet', label: 'Fleet', icon: '🚛' },
      { key: 'drivers', label: 'Drivers', icon: '👤' },
      { key: 'trips', label: 'Trips', icon: '🗺️' },
    ],
  },
  {
    label: 'Management',
    items: [
      { key: 'maintenance', label: 'Maintenance', icon: '🔧' },
      { key: 'fuel', label: 'Fuel & Expenses', icon: '⛽' },
    ],
  },
  {
    label: 'Insights',
    items: [
      { key: 'analytics', label: 'Analytics', icon: '📈' },
      { key: 'settings', label: 'Settings', icon: '⚙️' },
    ],
  },
];

const pageTitles = {
  dashboard: 'Dashboard',
  fleet: 'Vehicle Registry',
  drivers: 'Driver Management',
  trips: 'Trip Management',
  maintenance: 'Maintenance',
  fuel: 'Fuel & Expenses',
  analytics: 'Reports & Analytics',
  settings: 'Settings',
};

const Layout = ({ children, activePage, onNavigate }) => {
  const { user, logout, hasAccess } = useAuth();
  const { notifications, clearNotification } = useData();
  const [showNotificationsDropdown, setShowNotificationsDropdown] = React.useState(false);
  const [activeToasts, setActiveToasts] = React.useState([]);

  // Trigger temporary toasts when new notifications are added
  React.useEffect(() => {
    if (notifications.length > 0) {
      const latest = notifications[0];
      const exists = activeToasts.some(t => t.id === latest.id);
      if (!exists) {
        setActiveToasts(prev => [...prev, latest]);
        setTimeout(() => {
          setActiveToasts(prev => prev.filter(t => t.id !== latest.id));
        }, 4500);
      }
    }
  }, [notifications, activeToasts]);

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase()
    : '?';

  return (
    <div className="layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="sidebar-brand-name">TransitOps</div>
          <div className="sidebar-brand-sub">Transport Operations</div>
        </div>

        <nav className="sidebar-nav">
          {navGroups.map((group, gi) => (
            <div className="nav-group" key={gi}>
              <div className="nav-group-label">{group.label}</div>
              {group.items.map((item) => {
                const allowed = hasAccess(item.key);
                return (
                  <button
                    key={item.key}
                    className={`nav-link ${activePage === item.key ? 'active' : ''} ${!allowed ? 'disabled' : ''}`}
                    onClick={() => allowed && onNavigate(item.key)}
                    title={!allowed ? `No access (${user?.role})` : ''}
                  >
                    <span className="nav-link-icon">{item.icon}</span>
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        {/* User section */}
        <div className="sidebar-user">
          <div className="sidebar-avatar">{initials}</div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">{user?.name || 'User'}</div>
            <div className="sidebar-user-role">{user?.role || 'Guest'}</div>
          </div>
          <button className="sidebar-logout-btn" onClick={logout} title="Logout">
            ⏻
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="main-content">
        <header className="topbar">
          <div className="topbar-left">
            <h1 className="topbar-page-title">{pageTitles[activePage] || 'TransitOps'}</h1>
          </div>
          <div className="topbar-right" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <input
              type="text"
              className="topbar-search"
              placeholder="Search..."
            />

            {/* Notification Bell Dropdown */}
            <div className="topbar-notification-wrapper" style={{ position: 'relative' }}>
              <button 
                className="topbar-bell-btn" 
                onClick={() => setShowNotificationsDropdown(!showNotificationsDropdown)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.2rem',
                  cursor: 'pointer',
                  padding: '0.4rem',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                  color: 'var(--text-secondary)',
                  transition: 'background-color 0.2s'
                }}
              >
                🔔
                {notifications.length > 0 && (
                  <span className="bell-badge" style={{
                    position: 'absolute',
                    top: '2px',
                    right: '2px',
                    backgroundColor: 'var(--danger)',
                    color: 'white',
                    fontSize: '0.6rem',
                    fontWeight: 700,
                    padding: '2px 5px',
                    borderRadius: '50%',
                    border: '1.5px solid var(--bg-primary)',
                    lineHeight: 1
                  }}>
                    {notifications.length}
                  </span>
                )}
              </button>

              {showNotificationsDropdown && (
                <div className="notifications-dropdown" style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  width: '320px',
                  backgroundColor: 'var(--bg-primary)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-lg)',
                  boxShadow: 'var(--shadow-lg)',
                  zIndex: 2000,
                  marginTop: '0.5rem',
                  padding: '0.75rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem',
                  maxHeight: '360px',
                  overflowY: 'auto'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', marginBottom: '0.25rem' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary)' }}>Compliance Alerts</span>
                    <button 
                      onClick={() => setShowNotificationsDropdown(false)}
                      style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.75rem', cursor: 'pointer' }}
                    >
                      Close
                    </button>
                  </div>
                  {notifications.length === 0 ? (
                    <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                      No active alerts or warnings.
                    </div>
                  ) : (
                    notifications.map(n => (
                      <div 
                        key={n.id} 
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.25rem',
                          padding: '0.625rem',
                          borderRadius: 'var(--radius-sm)',
                          backgroundColor: n.type === 'warning' ? 'var(--danger-light)' : n.type === 'success' ? 'var(--success-light)' : 'var(--info-light)',
                          borderLeft: `4px solid ${n.type === 'warning' ? 'var(--danger)' : n.type === 'success' ? 'var(--success)' : 'var(--info)'}`,
                          position: 'relative'
                        }}
                      >
                        <button 
                          onClick={() => clearNotification(n.id)}
                          style={{
                            position: 'absolute',
                            top: '4px',
                            right: '4px',
                            background: 'none',
                            border: 'none',
                            color: 'var(--text-muted)',
                            cursor: 'pointer',
                            fontSize: '0.75rem'
                          }}
                        >
                          ✕
                        </button>
                        <div style={{
                          fontSize: '0.8rem',
                          fontWeight: 500,
                          paddingRight: '1rem',
                          color: n.type === 'warning' ? 'var(--danger)' : n.type === 'success' ? 'var(--success)' : 'var(--primary)'
                        }}>
                          {n.message}
                        </div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                          {n.time}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </header>
        <div className="page-content">
          {children}
        </div>
      </div>

      {/* Floating Toast notifications in bottom-right */}
      <div className="toast-container" style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
        pointerEvents: 'none'
      }}>
        {activeToasts.map(toast => (
          <div 
            key={toast.id} 
            className="toast-card"
            style={{
              padding: '1rem 1.25rem',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--bg-primary)',
              boxShadow: 'var(--shadow-lg)',
              border: '1px solid var(--border)',
              borderLeft: `5px solid ${toast.type === 'warning' ? 'var(--danger)' : toast.type === 'success' ? 'var(--success)' : 'var(--info)'}`,
              minWidth: '280px',
              maxWidth: '360px',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.25rem',
              animation: 'toastIn 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275) both',
              pointerEvents: 'auto',
              position: 'relative'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <span style={{
                fontWeight: 700,
                fontSize: '0.85rem',
                color: toast.type === 'warning' ? 'var(--danger)' : toast.type === 'success' ? 'var(--success)' : 'var(--info)'
              }}>
                {toast.type === 'warning' ? '⚠️ Compliance Alert' : toast.type === 'success' ? '🚀 Success' : 'ℹ️ System Update'}
              </span>
              <button 
                onClick={() => setActiveToasts(prev => prev.filter(t => t.id !== toast.id))}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.8rem', padding: '2px' }}
              >
                ✕
              </button>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-primary)', margin: 0, fontWeight: 500 }}>
              {toast.message}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Layout;
