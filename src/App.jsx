import React, { useState } from 'react';
import Login from './pages/Login/Login';
import Layout from './components/Layout/Layout';
import Dashboard from './pages/Dashboard/Dashboard';

function App() {
  const [user, setUser] = useState(null);
  const [activePage, setActivePage] = useState('dashboard');

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    setUser(null);
    setActivePage('dashboard');
  };

  const handleNavigate = (page) => {
    setActivePage(page);
  };

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard':
        return <Dashboard />;
      case 'fleet':
        return <div style={{ padding: '2rem', color: '#6b7280' }}>Fleet page coming soon...</div>;
      case 'drivers':
        return <div style={{ padding: '2rem', color: '#6b7280' }}>Drivers page coming soon...</div>;
      case 'trips':
        return <div style={{ padding: '2rem', color: '#6b7280' }}>Trips page coming soon...</div>;
      case 'maintenance':
        return <div style={{ padding: '2rem', color: '#6b7280' }}>Maintenance page coming soon...</div>;
      case 'fuel':
        return <div style={{ padding: '2rem', color: '#6b7280' }}>Fuel & Expenses page coming soon...</div>;
      case 'analytics':
        return <div style={{ padding: '2rem', color: '#6b7280' }}>Analytics page coming soon...</div>;
      case 'settings':
        return <div style={{ padding: '2rem', color: '#6b7280' }}>Settings page coming soon...</div>;
      default:
        return <Dashboard />;
    }
  };

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <Layout
      activePage={activePage}
      onNavigate={handleNavigate}
      user={user}
      onLogout={handleLogout}
    >
      {renderPage()}
    </Layout>
  );
}

export default App;
