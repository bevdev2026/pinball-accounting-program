interface KPICardProps {
  title: string;
  currentMonth: number;
  yearToDate: number;
  isProfit?: boolean;
}

export function KPICard({ title, currentMonth, yearToDate, isProfit = false }: KPICardProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getValueColor = (value: number) => {
    if (!isProfit) return 'var(--text-heading)';
    return value >= 0 ? 'var(--patina-light)' : 'var(--destructive)';
  };

  return (
    <div
      className="p-6 rounded-lg border"
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderColor: 'var(--copper-dark)',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <h4
        className="text-xs mb-6 tracking-wider opacity-80"
        style={{
          fontFamily: 'var(--font-heading)',
          color: 'var(--text-secondary)',
        }}
      >
        {title}
      </h4>

      <div className="space-y-4">
        <div>
          <div
            className="text-xs mb-1 tracking-wider"
            style={{
              fontFamily: 'var(--font-heading)',
              color: 'var(--text-muted)',
            }}
          >
            CURRENT MONTH
          </div>
          <div
            className="text-3xl"
            style={{
              fontFamily: 'var(--font-mono)',
              fontWeight: 'var(--font-weight-bold)',
              color: getValueColor(currentMonth),
              textShadow: '0 1px 2px rgba(0,0,0,0.3)',
            }}
          >
            {formatCurrency(currentMonth)}
          </div>
        </div>

        <div
          className="h-px"
          style={{
            backgroundColor: 'var(--copper-dark)',
            opacity: 0.3,
          }}
        />

        <div>
          <div
            className="text-xs mb-1 tracking-wider"
            style={{
              fontFamily: 'var(--font-heading)',
              color: 'var(--text-muted)',
            }}
          >
            YEAR TO DATE
          </div>
          <div
            className="text-2xl"
            style={{
              fontFamily: 'var(--font-mono)',
              fontWeight: 'var(--font-weight-bold)',
              color: getValueColor(yearToDate),
              opacity: 0.9,
            }}
          >
            {formatCurrency(yearToDate)}
          </div>
        </div>
      </div>
    </div>
  );
}
