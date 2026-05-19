import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface RevenueChartProps {
  title: string;
  data: Array<{ month: string; value: number }>;
  lineColor?: string;
}

export function RevenueChart({ title, data, lineColor = 'var(--copper-base)' }: RevenueChartProps) {
  return (
    <div
      className="p-6 rounded-lg border"
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderColor: 'var(--copper-dark)',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <div className="flex items-center justify-between mb-6">
        <h3
          className="text-lg tracking-wide"
          style={{
            fontFamily: 'var(--font-heading)',
            color: 'var(--text-heading)',
          }}
        >
          {title}
        </h3>

        <select
          className="px-3 py-1 rounded text-xs tracking-wide border"
          style={{
            backgroundColor: 'var(--bg-elevated)',
            color: 'var(--text-secondary)',
            borderColor: 'var(--copper-dark)',
            fontFamily: 'var(--font-heading)',
          }}
        >
          <option>Last 30 Days</option>
          <option>Last 3 Months</option>
          <option>YTD</option>
          <option>Custom</option>
        </select>
      </div>

      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--copper-dark)" opacity={0.2} />
          <XAxis
            dataKey="month"
            stroke="var(--text-muted)"
            style={{ fontFamily: 'var(--font-mono)', fontSize: '11px' }}
          />
          <YAxis
            stroke="var(--text-muted)"
            style={{ fontFamily: 'var(--font-mono)', fontSize: '11px' }}
            tickFormatter={(value) => `$${value / 1000}k`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'var(--bg-elevated)',
              border: '1px solid var(--copper-dark)',
              borderRadius: 'var(--radius-sm)',
              fontFamily: 'var(--font-mono)',
              color: 'var(--text-primary)',
            }}
            formatter={(value: number) =>
              new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
              }).format(value)
            }
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke={lineColor}
            strokeWidth={2}
            dot={{ fill: lineColor, r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
