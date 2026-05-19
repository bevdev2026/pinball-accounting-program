import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export type ChartRange = 'last_30' | 'last_3_months' | 'ytd' | 'custom';

interface RevenueChartProps {
  title: string;
  data: Array<{ label: string; value: number }>;
  lineColor?: string;
  timeRange: ChartRange;
  onTimeRangeChange: (range: ChartRange) => void;
}

const RANGE_OPTIONS: { value: ChartRange; label: string }[] = [
  { value: 'last_30', label: 'Last 30 Days' },
  { value: 'last_3_months', label: 'Last 3 Months' },
  { value: 'ytd', label: 'YTD' },
  { value: 'custom', label: 'Custom' },
];

export function RevenueChart({ title, data, lineColor = 'var(--copper-base)', timeRange, onTimeRangeChange }: RevenueChartProps) {
  // For dense daily data show roughly every 5th label; otherwise show all
  const xAxisInterval = data.length > 10 ? Math.floor(data.length / 6) : 0;

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
          style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-heading)' }}
        >
          {title}
        </h3>

        <select
          value={timeRange}
          onChange={e => onTimeRangeChange(e.target.value as ChartRange)}
          className="px-3 py-1 rounded text-xs tracking-wide border"
          style={{
            backgroundColor: 'var(--bg-elevated)',
            color: 'var(--text-secondary)',
            borderColor: 'var(--copper-dark)',
            fontFamily: 'var(--font-heading)',
            outline: 'none',
            cursor: 'pointer',
          }}
        >
          {RANGE_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {data.length === 0 ? (
        <div
          style={{
            height: 200,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'var(--font-heading)',
            fontSize: '11px',
            letterSpacing: '0.1em',
            color: 'var(--text-muted)',
          }}
        >
          NO DATA FOR THIS PERIOD
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--copper-dark)" opacity={0.2} />
            <XAxis
              dataKey="label"
              stroke="var(--text-muted)"
              style={{ fontFamily: 'var(--font-mono)', fontSize: '11px' }}
              interval={xAxisInterval}
              tick={{ fontSize: 10 }}
            />
            <YAxis
              stroke="var(--text-muted)"
              style={{ fontFamily: 'var(--font-mono)', fontSize: '11px' }}
              tickFormatter={(value) => `$${value >= 1000 ? (value / 1000).toFixed(1) + 'k' : value}`}
              width={52}
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
                new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)
              }
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke={lineColor}
              strokeWidth={2}
              dot={{ fill: lineColor, r: 3 }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
