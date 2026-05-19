import { useState } from 'react';
import { Toaster } from 'sonner';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { MachinesView } from './components/machines/MachinesView';
import { RevenueView } from './components/revenue/RevenueView';
import { ExpensesView } from './components/expenses/ExpensesView';
import { RentView } from './components/rent/RentView';
import { LiabilitiesView } from './components/liabilities/LiabilitiesView';
import { ReportsView } from './components/reports/ReportsView';
import { DropboxView } from './components/dropbox/DropboxView';

export default function App() {
  const [activeView, setActiveView] = useState('dashboard');

  const renderView = () => {
    switch (activeView) {
      case 'dashboard':
        return <Dashboard />;
      case 'machines':
        return <MachinesView />;
      case 'revenue':
        return <RevenueView />;
      case 'expenses':
        return <ExpensesView />;
      case 'rent':
        return <RentView />;
      case 'liabilities':
        return <LiabilitiesView />;
      case 'reports':
        return <ReportsView />;
      case 'dropbox':
        return <DropboxView />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <>
      <div
        className="size-full flex"
        style={{ backgroundColor: 'var(--bg-primary)' }}
      >
        <Sidebar activeView={activeView} onNavigate={setActiveView} />
        <main className="flex-1 overflow-auto">
          {renderView()}
        </main>
      </div>
      <Toaster richColors position="bottom-right" />
    </>
  );
}
