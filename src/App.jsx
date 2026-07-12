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
import FuelExpenses from './pages/FuelExpenses/FuelExpenses';
import Analytics from './pages/Analytics/Analytics';
import Settings from './pages/Settings/Settings';

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
        return <FuelExpenses />;
      case 'analytics':
        return <Analytics />;
      case 'settings':
        return <Settings />;
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
