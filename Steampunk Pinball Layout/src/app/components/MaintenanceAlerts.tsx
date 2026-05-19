import { AlertTriangle, Clock } from 'lucide-react';

interface MaintenanceAlert {
  id: string;
  machineName: string;
  maintenanceItem: string;
  dueDate: string;
  status: 'overdue' | 'due-soon';
}

const mockAlerts: MaintenanceAlert[] = [
  {
    id: '1',
    machineName: 'Black Knight 3000',
    maintenanceItem: 'Flipper Rubber Replacement',
    dueDate: 'May 10, 2026',
    status: 'overdue',
  },
  {
    id: '2',
    machineName: 'Medieval Madness',
    maintenanceItem: 'Playfield Cleaning',
    dueDate: 'May 20, 2026',
    status: 'due-soon',
  },
  {
    id: '3',
    machineName: 'Attack from Mars',
    maintenanceItem: 'LED Inspection',
    dueDate: 'May 25, 2026',
    status: 'due-soon',
  },
];

export function MaintenanceAlerts() {
  return (
    <div
      className="p-6 rounded-lg border h-full"
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderColor: 'var(--copper-dark)',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <h3
        className="text-lg mb-4 tracking-wide"
        style={{
          fontFamily: 'var(--font-heading)',
          color: 'var(--text-heading)',
        }}
      >
        Maintenance Alerts
      </h3>

      <div className="space-y-3">
        {mockAlerts.map((alert) => (
          <div
            key={alert.id}
            className="p-4 rounded border-l-4"
            style={{
              backgroundColor: 'var(--bg-elevated)',
              borderLeftColor: alert.status === 'overdue' ? 'var(--destructive)' : 'var(--gold-base)',
            }}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div
                  className="font-semibold mb-1"
                  style={{
                    fontFamily: 'var(--font-heading)',
                    color: 'var(--text-heading)',
                  }}
                >
                  {alert.machineName}
                </div>
                <div
                  className="text-sm mb-2"
                  style={{
                    fontFamily: 'var(--font-body)',
                    color: 'var(--text-secondary)',
                  }}
                >
                  {alert.maintenanceItem}
                </div>
                <div
                  className="text-xs flex items-center gap-1"
                  style={{
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--text-muted)',
                  }}
                >
                  <Clock size={12} />
                  {alert.dueDate}
                </div>
              </div>

              <div
                className="px-3 py-1 rounded-full text-xs tracking-wide"
                style={{
                  backgroundColor: alert.status === 'overdue' ? 'rgba(212, 24, 61, 0.2)' : 'rgba(200, 165, 52, 0.2)',
                  color: alert.status === 'overdue' ? 'var(--destructive)' : 'var(--gold-base)',
                  fontFamily: 'var(--font-heading)',
                  fontWeight: 'var(--font-weight-semibold)',
                }}
              >
                {alert.status === 'overdue' ? (
                  <span className="flex items-center gap-1">
                    <AlertTriangle size={12} />
                    OVERDUE
                  </span>
                ) : (
                  'DUE SOON'
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
