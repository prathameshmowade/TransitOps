import React from 'react';
import './Layout.css';

const navItems = [
  { key: 'dashboard', label: 'Dashboard', icon: '📊' },
  { key: 'fleet', label: 'Fleet', icon: '🚛' },
  { key: 'drivers', label: 'Drivers', icon: '👤' },
  { key: 'trips', label: 'Trips', icon: '🗺️' },
  { key: 'maintenance', label: 'Maintenance', icon: '🔧' },
  { key: 'fuel', label: 'Fuel & Expenses', icon: '⛽' },
  { key: 'analytics', label: 'Analytics', icon: '📈' },
  { key: 'settings', label: 'Settings', icon: '⚙️' },
];

const Layout = ({ children, activePage, onNavigate, user, onLogout }) => {
  return (
    <div className="layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <h1>TransitOps</h1>
        </div>
        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <button
              key={item.key}
              className={`sidebar-link ${activePage === item.key ? 'active' : ''}`}
              onClick={() => onNavigate(item.key)}
            >
              <span className="sidebar-link-icon">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <div className="main-content">
        <header className="topbar">
          <input
            type="text"
            className="topbar-search"
            placeholder="Search..."
          />
          <div className="topbar-right">
            <span className="topbar-range">Range: ₹</span>
            <button className="topbar-user-btn" onClick={onLogout}>
              {user?.role || 'User'} ✦
            </button>
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
