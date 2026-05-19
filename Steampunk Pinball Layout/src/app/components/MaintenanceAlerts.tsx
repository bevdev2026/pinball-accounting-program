import { AlertTriangle, Clock } from 'lucide-react';

export interface MaintenanceAlertItem {
  id: string;
  machineName: string;
  maintenanceItem: string;
  dueDate: string;
  status: 'overdue' | 'due-soon';
}

interface Props {
  alerts: MaintenanceAlertItem[];
  loading: boolean;
}

export function MaintenanceAlerts({ alerts, loading }: Props) {
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
        style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-heading)' }}
      >
        Maintenance Alerts
      </h3>

      {loading ? (
        <div style={{ fontFamily: 'var(--font-heading)', fontSize: '11px', letterSpacing: '0.1em', color: 'var(--text-muted)' }}>LOADING…</div>
      ) : alerts.length === 0 ? (
        <div style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--text-muted)', opacity: 0.7 }}>
          No overdue or upcoming maintenance items.
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map((alert) => (
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
                    style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-heading)' }}
                  >
                    {alert.machineName}
                  </div>
                  <div
                    className="text-sm mb-2"
                    style={{ fontFamily: 'var(--font-body)', color: 'var(--text-secondary)' }}
                  >
                    {alert.maintenanceItem}
                  </div>
                  <div
                    className="text-xs flex items-center gap-1"
                    style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}
                  >
                    <Clock size={12} />
                    {alert.dueDate}
                  </div>
                </div>

                <div
                  className="px-3 py-1 rounded-full text-xs tracking-wide"
                  style={{
                    backgroundColor: alert.status === 'overdue' ? 'rgba(212,24,61,0.2)' : 'rgba(200,165,52,0.2)',
                    color: alert.status === 'overdue' ? 'var(--destructive)' : 'var(--gold-base)',
                    fontFamily: 'var(--font-heading)',
                  }}
                >
                  {alert.status === 'overdue' ? (
                    <span className="flex items-center gap-1"><AlertTriangle size={12} />OVERDUE</span>
                  ) : (
                    'DUE SOON'
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
