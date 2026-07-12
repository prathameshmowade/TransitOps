import React from 'react';
import { useAuth } from '../../context/AuthContext';
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
          <div className="topbar-right">
            <input
              type="text"
              className="topbar-search"
              placeholder="Search..."
            />
          </div>
        </header>
        <div className="page-content">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Layout;
