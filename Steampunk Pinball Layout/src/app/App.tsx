import { useState, useEffect } from 'react';
import { Toaster } from 'sonner';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { LocationsView } from './components/locations/LocationsView';
import { MachinesView } from './components/machines/MachinesView';
import { RevenueView } from './components/revenue/RevenueView';
import { ExpensesView } from './components/expenses/ExpensesView';
import { RentView } from './components/rent/RentView';
import { LiabilitiesView } from './components/liabilities/LiabilitiesView';
import { ReportsView } from './components/reports/ReportsView';
import { DropboxView } from './components/dropbox/DropboxView';
import { LocationProvider } from './context/LocationContext';

export default function App() {
  const [activeView, setActiveView] = useState('dashboard');
  const [isLight, setIsLight] = useState(() => localStorage.getItem('theme') === 'light');

  useEffect(() => {
    localStorage.setItem('theme', isLight ? 'light' : 'dark');
  }, [isLight]);

  const toggleTheme = () => setIsLight(prev => !prev);

  const renderView = () => {
    switch (activeView) {
      case 'locations':  return <LocationsView />;
      case 'machines':   return <MachinesView />;
      case 'revenue':    return <RevenueView />;
      case 'expenses':   return <ExpensesView />;
      case 'rent':       return <RentView />;
      case 'liabilities':return <LiabilitiesView />;
      case 'reports':    return <ReportsView />;
      case 'dropbox':    return <DropboxView />;
      default:           return null;
    }
  };

  return (
    <LocationProvider>
      <div
        className={`size-full flex${isLight ? ' light' : ''}`}
        style={{ backgroundColor: 'var(--bg-primary)' }}
      >
        <Sidebar activeView={activeView} onNavigate={setActiveView} />
        <main className="flex-1 overflow-auto">
          {activeView === 'dashboard'
            ? <Dashboard isLight={isLight} onToggleTheme={toggleTheme} />
            : renderView()}
        </main>
      </div>
      <Toaster richColors position="bottom-right" />
    </LocationProvider>
  );
}
