interface Loan {
  id: string;
  name: string;
  remainingBalance: number;
  totalPaid: number;
}

const mockLoans: Loan[] = [
  {
    id: '1',
    name: 'Machine Purchase Loan',
    remainingBalance: 15000,
    totalPaid: 8500,
  },
  {
    id: '2',
    name: 'Equipment Financing',
    remainingBalance: 5200,
    totalPaid: 12300,
  },
  {
    id: '3',
    name: 'Expansion Capital',
    remainingBalance: 28000,
    totalPaid: 4000,
  },
];

export function LoansSummary() {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

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
        Loans Summary
      </h3>

      <div className="space-y-4">
        {mockLoans.map((loan) => (
          <div key={loan.id}>
            <div
              className="font-semibold mb-2"
              style={{
                fontFamily: 'var(--font-heading)',
                color: 'var(--text-heading)',
              }}
            >
              {loan.name}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <div
                  className="text-xs mb-1 tracking-wider"
                  style={{
                    fontFamily: 'var(--font-heading)',
                    color: 'var(--text-muted)',
                  }}
                >
                  REMAINING
                </div>
                <div
                  className="text-xl"
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 'var(--font-weight-bold)',
                    color: 'var(--steel-light)',
                  }}
                >
                  {formatCurrency(loan.remainingBalance)}
                </div>
              </div>

              <div>
                <div
                  className="text-xs mb-1 tracking-wider"
                  style={{
                    fontFamily: 'var(--font-heading)',
                    color: 'var(--text-muted)',
                  }}
                >
                  PAID
                </div>
                <div
                  className="text-xl"
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 'var(--font-weight-bold)',
                    color: 'var(--patina-base)',
                  }}
                >
                  {formatCurrency(loan.totalPaid)}
                </div>
              </div>
            </div>

            {loan !== mockLoans[mockLoans.length - 1] && (
              <div
                className="h-px mt-4"
                style={{
                  backgroundColor: 'var(--copper-dark)',
                  opacity: 0.3,
                }}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
