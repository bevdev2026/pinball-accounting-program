import { useState } from 'react';
import { Toaster } from 'sonner';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { MachinesView } from './components/machines/MachinesView';
import { RevenueView } from './components/revenue/RevenueView';

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
        return <PlaceholderView title="Expenses" />;
      case 'rent':
        return <PlaceholderView title="Rent & Commission" />;
      case 'liabilities':
        return <PlaceholderView title="Liabilities" />;
      case 'reports':
        return <PlaceholderView title="Reports" />;
      case 'dropbox':
        return <PlaceholderView title="Dropbox" />;
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

function PlaceholderView({ title }: { title: string }) {
  return (
    <div className="p-8">
      <h2
        className="text-3xl mb-2 tracking-wide"
        style={{
          fontFamily: 'var(--font-heading)',
          color: 'var(--text-heading)',
        }}
      >
        {title}
      </h2>
      <p
        className="text-sm tracking-wider opacity-70"
        style={{
          fontFamily: 'var(--font-heading)',
          color: 'var(--text-secondary)',
        }}
      >
        This view is under construction
      </p>
    </div>
  );
}