export interface LoanSummaryItem {
  id: string;
  name: string;
  remainingBalance: number;
  totalPaid: number;
}

interface Props {
  loans: LoanSummaryItem[];
  loading: boolean;
}

const fmt = (v: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(v);

export function LoansSummary({ loans, loading }: Props) {
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
        Loans Summary
      </h3>

      {loading ? (
        <div style={{ fontFamily: 'var(--font-heading)', fontSize: '11px', letterSpacing: '0.1em', color: 'var(--text-muted)' }}>LOADING…</div>
      ) : loans.length === 0 ? (
        <div style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--text-muted)', opacity: 0.7 }}>
          No active loans recorded.
        </div>
      ) : (
        <div className="space-y-4">
          {loans.map((loan, i) => (
            <div key={loan.id}>
              <div
                className="font-semibold mb-2"
                style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-heading)' }}
              >
                {loan.name}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs mb-1 tracking-wider" style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-muted)' }}>
                    REMAINING
                  </div>
                  <div className="text-xl" style={{ fontFamily: 'var(--font-mono)', fontWeight: 'bold', color: 'var(--steel-light)' }}>
                    {fmt(loan.remainingBalance)}
                  </div>
                </div>
                <div>
                  <div className="text-xs mb-1 tracking-wider" style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-muted)' }}>
                    PAID
                  </div>
                  <div className="text-xl" style={{ fontFamily: 'var(--font-mono)', fontWeight: 'bold', color: 'var(--patina-base)' }}>
                    {fmt(loan.totalPaid)}
                  </div>
                </div>
              </div>

              {i < loans.length - 1 && (
                <div className="h-px mt-4" style={{ backgroundColor: 'var(--copper-dark)', opacity: 0.3 }} />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
