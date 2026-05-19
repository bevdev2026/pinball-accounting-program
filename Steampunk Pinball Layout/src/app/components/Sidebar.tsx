import { LayoutDashboard, Gamepad2, TrendingUp, Receipt, Percent, FileText, Folder, AlertCircle } from 'lucide-react';

interface SidebarProps {
  activeView: string;
  onNavigate: (view: string) => void;
}

const navigationItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'machines', label: 'Machines', icon: Gamepad2 },
  { id: 'revenue', label: 'Revenue', icon: TrendingUp },
  { id: 'expenses', label: 'Expenses', icon: Receipt },
  { id: 'rent', label: 'Rent & Commission', icon: Percent },
  { id: 'liabilities', label: 'Liabilities', icon: AlertCircle },
  { id: 'reports', label: 'Reports', icon: FileText },
  { id: 'dropbox', label: 'Documents', icon: Folder },
];

export function Sidebar({ activeView, onNavigate }: SidebarProps) {
  return (
    <aside
      className="w-64 h-screen flex flex-col border-r"
      style={{
        backgroundColor: 'var(--sidebar)',
        borderColor: 'var(--sidebar-border)',
      }}
    >
      <div className="p-8 border-b" style={{ borderColor: 'var(--sidebar-border)' }}>
        <h1
          className="text-2xl tracking-widest"
          style={{
            fontFamily: 'var(--font-display)',
            color: 'var(--gold-base)',
            textShadow: '0 2px 4px rgba(0,0,0,0.5)',
          }}
        >
          PINBALL
        </h1>
        <p
          className="text-xs mt-1 tracking-wider"
          style={{
            fontFamily: 'var(--font-heading)',
            color: 'var(--text-muted)',
          }}
        >
          ACCOUNTING SYSTEM
        </p>
      </div>

      <nav className="flex-1 p-4">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className="w-full flex items-center gap-3 px-4 py-3 mb-1 rounded transition-all duration-200"
              style={{
                backgroundColor: isActive ? 'var(--sidebar-accent)' : 'transparent',
                color: isActive ? 'var(--copper-bright)' : 'var(--sidebar-foreground)',
                borderLeft: isActive ? '3px solid var(--copper-base)' : '3px solid transparent',
              }}
            >
              <Icon size={18} />
              <span
                className="text-sm tracking-wide"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>

      <div
        className="p-4 border-t text-xs"
        style={{
          borderColor: 'var(--sidebar-border)',
          color: 'var(--text-muted)',
          fontFamily: 'var(--font-mono)',
        }}
      >
        <div>System v1.0.0</div>
        <div className="mt-1 opacity-70">VUK Industries</div>
      </div>
    </aside>
  );
}
