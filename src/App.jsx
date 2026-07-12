import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import Login from './pages/Login/Login';
import Layout from './components/Layout/Layout';
import Dashboard from './pages/Dashboard/Dashboard';
import Fleet from './pages/Fleet/Fleet';
import Drivers from './pages/Drivers/Drivers';
import Trips from './pages/Trips/Trips';
import Maintenance from './pages/Maintenance/Maintenance';

function AppContent() {
  const { user } = useAuth();
  const [activePage, setActivePage] = useState('dashboard');

  if (!user) {
    return <Login />;
  }

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard':
        return <Dashboard />;
      case 'fleet':
        return <Fleet />;
      case 'drivers':
        return <Drivers />;
      case 'trips':
        return <Trips />;
      case 'maintenance':
        return <Maintenance />;
      case 'fuel':
        return <PlaceholderPage title="Fuel & Expenses" icon="⛽" description="Fuel and expense tracking coming soon — provide the screenshot!" />;
      case 'analytics':
        return <PlaceholderPage title="Reports & Analytics" icon="📈" description="Charts and analytics coming soon — provide the screenshot!" />;
      case 'settings':
        return <PlaceholderPage title="Settings" icon="⚙️" description="Settings page coming soon!" />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <Layout activePage={activePage} onNavigate={setActivePage}>
      {renderPage()}
    </Layout>
  );
}

function PlaceholderPage({ title, icon, description }) {
  return (
    <div className="empty-state" style={{ marginTop: '4rem' }}>
      <div className="empty-state-icon" style={{ fontSize: '3rem' }}>{icon}</div>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>{title}</h2>
      <div className="empty-state-text">{description}</div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <AppContent />
      </DataProvider>
    </AuthProvider>
  );
}

export default App;
