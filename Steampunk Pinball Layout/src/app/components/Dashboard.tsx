import { useState, useEffect, useRef } from 'react';
import { Sun, Moon } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { KPICard } from './KPICard';
import { RevenueChart } from './RevenueChart';
import type { ChartRange } from './RevenueChart';
import { MaintenanceAlerts } from './MaintenanceAlerts';
import type { MaintenanceAlertItem } from './MaintenanceAlerts';
import { LoansSummary } from './LoansSummary';
import type { LoanSummaryItem } from './LoansSummary';
import { calcLoanStatus } from './liabilities/calcLoanStatus';
import type { Loan } from './liabilities/types';

interface Agreement {
  type: 'flat_fee' | 'percentage' | 'combination';
  flat_fee_amount: number | null;
  percentage_rate: number | null;
  revenue_threshold: number | null;
}

type ChartPoint = { label: string; value: number };

// ── Pure helpers ──────────────────────────────────────────────────────────────

const pad = (n: number) => String(n).padStart(2, '0');

function calcRentDeduction(agreement: Agreement | null, gross: number): number {
  if (!agreement) return 0;
  if (agreement.type === 'flat_fee') return agreement.flat_fee_amount ?? 0;
  if (agreement.type === 'percentage') return gross * (agreement.percentage_rate ?? 0);
  const base = agreement.flat_fee_amount ?? 0;
  const threshold = agreement.revenue_threshold ?? 0;
  return base + (gross > threshold ? (gross - threshold) * (agreement.percentage_rate ?? 0) : 0);
}

function sumMR(rows: any[]): number {
  return rows.reduce((s, r) => s + (r.coin ?? 0) + (r.bill_drop ?? 0) + (r.card ?? 0) + (r.phone_tap ?? 0), 0);
}

function sumAmt(rows: any[]): number {
  return rows.reduce((s, r) => s + (r.amount ?? 0), 0);
}

// Build a range's series definition: array of { key, label } where key is used to filter
type GroupBy = 'day' | 'month';

function buildSeries(range: ChartRange, customFrom: string, customTo: string): { key: string; label: string; groupBy: GroupBy } [] {
  const now = new Date();
  const today = now.toISOString().split('T')[0];

  if (range === 'last_30') {
    return Array.from({ length: 30 }, (_, i) => {
      const d = new Date(now.getTime() - (29 - i) * 86_400_000);
      return { key: d.toISOString().split('T')[0], label: `${d.getMonth() + 1}/${d.getDate()}`, groupBy: 'day' as GroupBy };
    });
  }

  if (range === 'last_3_months') {
    return Array.from({ length: 3 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (2 - i), 1);
      return { key: `${d.getFullYear()}-${pad(d.getMonth() + 1)}`, label: d.toLocaleDateString('en-US', { month: 'short' }), groupBy: 'month' as GroupBy };
    });
  }

  if (range === 'ytd') {
    return Array.from({ length: now.getMonth() + 1 }, (_, i) => {
      const d = new Date(now.getFullYear(), i, 1);
      return { key: `${d.getFullYear()}-${pad(d.getMonth() + 1)}`, label: d.toLocaleDateString('en-US', { month: 'short' }), groupBy: 'month' as GroupBy };
    });
  }

  // custom
  if (!customFrom) return [];
  const to = customTo || today;
  const result: ReturnType<typeof buildSeries> = [];
  const cur = new Date(customFrom.replace(/-/g, '/'));
  const end = new Date(to.replace(/-/g, '/'));
  cur.setDate(1);
  while (cur <= end) {
    result.push({ key: `${cur.getFullYear()}-${pad(cur.getMonth() + 1)}`, label: cur.toLocaleDateString('en-US', { month: 'short' }), groupBy: 'month' });
    cur.setMonth(cur.getMonth() + 1);
  }
  return result;
}

function computeChartData(
  series: ReturnType<typeof buildSeries>,
  mrRows: any[],
  nmrRows: any[],
  expRows: any[],
  agreement: Agreement | null
): { gross: ChartPoint[]; exp: ChartPoint[]; profit: ChartPoint[] } {
  if (series.length === 0) return { gross: [], exp: [], profit: [] };

  const groupBy = series[0].groupBy;
  const match = (row: any, dateField: string, key: string) =>
    groupBy === 'day' ? row[dateField] === key : (row[dateField] ?? '').startsWith(key);

  const gross = series.map(({ key, label }) => {
    const mr = sumMR(mrRows.filter(r => match(r, 'collection_date', key)));
    const nmr = sumAmt(nmrRows.filter(r => match(r, 'date', key)));
    return { label, value: mr + nmr };
  });

  const exp = series.map(({ key, label }) => ({
    label,
    value: sumAmt(expRows.filter(r => match(r, 'date', key))),
  }));

  const profit = series.map(({ label }, i) => ({
    label,
    value: gross[i].value - calcRentDeduction(agreement, gross[i].value) - exp[i].value,
  }));

  return { gross, exp, profit };
}

// ── Component ────────────────────────────────────────────────────────────────

export function Dashboard({ isLight, onToggleTheme }: { isLight: boolean; onToggleTheme: () => void }) {
  const inputStyle: React.CSSProperties = {
    padding: '6px 10px',
    backgroundColor: 'var(--bg-elevated)',
    border: '1px solid var(--copper-dark)',
    borderRadius: 'var(--radius-sm)',
    color: 'var(--text-primary)',
    fontFamily: 'var(--font-mono)',
    fontSize: '13px',
    outline: 'none',
    colorScheme: isLight ? 'light' : 'dark',
  };

  const [kpiLoading, setKpiLoading] = useState(true);
  const [chartLoading, setChartLoading] = useState(true);

  // KPI state
  const [grossMonth, setGrossMonth] = useState(0);
  const [grossYtd, setGrossYtd] = useState(0);
  const [netMonth, setNetMonth] = useState(0);
  const [netYtd, setNetYtd] = useState(0);
  const [expMonth, setExpMonth] = useState(0);
  const [expYtd, setExpYtd] = useState(0);

  // Chart state
  const [chartRange, setChartRange] = useState<ChartRange>('ytd');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [grossChart, setGrossChart] = useState<ChartPoint[]>([]);
  const [expChart, setExpChart] = useState<ChartPoint[]>([]);
  const [profitChart, setProfitChart] = useState<ChartPoint[]>([]);

  // Shared data
  const [alerts, setAlerts] = useState<MaintenanceAlertItem[]>([]);
  const [loans, setLoans] = useState<LoanSummaryItem[]>([]);
  const agreementRef = useRef<Agreement | null>(null);

  // ── Mount: KPI, maintenance, loans ──────────────────────────────────────
  useEffect(() => {
    async function fetchKpiAndMeta() {
      setKpiLoading(true);
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth();
      const ytdStart = `${year}-01-01`;
      const monthStart = `${year}-${pad(month + 1)}-01`;
      const today = now.toISOString().split('T')[0];

      const [mrYtd, nmrYtd, expYtdRes, agreeRes, machinesRes, itemsRes, logsRes, loansRes] = await Promise.all([
        supabase.from('machine_revenue').select('collection_date,coin,bill_drop,card,phone_tap').gte('collection_date', ytdStart).lte('collection_date', today),
        supabase.from('non_machine_revenue').select('date,amount').gte('date', ytdStart).lte('date', today),
        supabase.from('expenses').select('date,amount').gte('date', ytdStart).lte('date', today),
        supabase.from('rent_commission_agreements').select('type,flat_fee_amount,percentage_rate,revenue_threshold').is('end_date', null).maybeSingle(),
        supabase.from('machines').select('id,name').eq('is_archived', false).in('status', ['Active', 'Out of Service']),
        supabase.from('maintenance_items').select('id,machine_id,name,interval_days'),
        supabase.from('maintenance_logs').select('machine_id,maintenance_item_id,date_performed').order('date_performed', { ascending: false }),
        supabase.from('loans').select('*'),
      ]);

      const agreement = agreeRes.data as Agreement | null;
      agreementRef.current = agreement;

      // KPI
      const mrRows = mrYtd.data ?? [];
      const nmrRows = nmrYtd.data ?? [];
      const expRows = expYtdRes.data ?? [];

      const gYtd = sumMR(mrRows) + sumAmt(nmrRows);
      const eYtd = sumAmt(expRows);
      const gMonth = sumMR(mrRows.filter((r: any) => r.collection_date >= monthStart)) + sumAmt(nmrRows.filter((r: any) => r.date >= monthStart));
      const eMonth = sumAmt(expRows.filter((r: any) => r.date >= monthStart));

      setGrossYtd(gYtd);
      setGrossMonth(gMonth);
      setExpYtd(eYtd);
      setExpMonth(eMonth);
      setNetYtd(gYtd - calcRentDeduction(agreement, gYtd));
      setNetMonth(gMonth - calcRentDeduction(agreement, gMonth));

      // Maintenance alerts
      const activeMachines = machinesRes.data ?? [];
      const allItems = itemsRes.data ?? [];
      const allLogs = logsRes.data ?? [];
      const machineMap = Object.fromEntries(activeMachines.map((m: any) => [m.id, m.name]));
      const activeMachineIds = new Set(activeMachines.map((m: any) => m.id));
      const todayMs = new Date().setHours(0, 0, 0, 0);
      const soonMs = todayMs + 30 * 86_400_000;

      const alertItems: MaintenanceAlertItem[] = [];
      for (const item of allItems) {
        if (!activeMachineIds.has(item.machine_id)) continue;
        const latestLog = allLogs.find((l: any) => l.machine_id === item.machine_id && l.maintenance_item_id === item.id);
        if (!latestLog) continue;
        const dueMs = new Date(latestLog.date_performed + 'T00:00:00').getTime() + item.interval_days * 86_400_000;
        if (dueMs > soonMs) continue;
        const dueDate = new Date(dueMs).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        alertItems.push({ id: item.id, machineName: machineMap[item.machine_id] ?? 'Unknown', maintenanceItem: item.name, dueDate, status: dueMs < todayMs ? 'overdue' : 'due-soon' });
      }
      alertItems.sort((a, b) => (a.status !== b.status ? (a.status === 'overdue' ? -1 : 1) : new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()));
      setAlerts(alertItems);

      // Loans
      setLoans((loansRes.data ?? []).map((loan: Loan) => {
        const s = calcLoanStatus(loan);
        return { id: loan.id, name: loan.name, remainingBalance: s.remainingBalance, totalPaid: s.totalPaid };
      }));

      setKpiLoading(false);
    }

    fetchKpiAndMeta();
  }, []);

  // ── Chart data: re-runs when range or custom dates change ────────────────
  useEffect(() => {
    // Skip custom range until both dates are set
    if (chartRange === 'custom' && !customFrom) return;

    async function fetchChartData() {
      setChartLoading(true);

      const series = buildSeries(chartRange, customFrom, customTo);
      if (series.length === 0) { setChartLoading(false); return; }

      const fromDate = series[0].key + (series[0].groupBy === 'day' ? '' : '-01');
      const now = new Date();
      const toDate = chartRange === 'custom' && customTo ? customTo : now.toISOString().split('T')[0];

      const [mrRes, nmrRes, expRes] = await Promise.all([
        supabase.from('machine_revenue').select('collection_date,coin,bill_drop,card,phone_tap').gte('collection_date', fromDate).lte('collection_date', toDate),
        supabase.from('non_machine_revenue').select('date,amount').gte('date', fromDate).lte('date', toDate),
        supabase.from('expenses').select('date,amount').gte('date', fromDate).lte('date', toDate),
      ]);

      const { gross, exp, profit } = computeChartData(series, mrRes.data ?? [], nmrRes.data ?? [], expRes.data ?? [], agreementRef.current);
      setGrossChart(gross);
      setExpChart(exp);
      setProfitChart(profit);
      setChartLoading(false);
    }

    fetchChartData();
  }, [chartRange, customFrom, customTo]);

  const netProfit = netMonth - expMonth;
  const netProfitYtd = netYtd - expYtd;

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-3xl mb-2 tracking-wide" style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-heading)' }}>
            Dashboard
          </h2>
          <p className="text-sm tracking-wider opacity-70" style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-secondary)' }}>
            FINANCIAL OVERVIEW & OPERATIONAL STATUS
          </p>
        </div>
        <button
          onClick={onToggleTheme}
          title={isLight ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            backgroundColor: 'var(--bg-elevated)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--text-secondary)',
            fontFamily: 'var(--font-heading)',
            fontSize: '11px',
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            cursor: 'pointer',
          }}
        >
          {isLight ? <Moon size={14} /> : <Sun size={14} />}
          {isLight ? 'Dark Mode' : 'Light Mode'}
        </button>
      </div>

      <div className="grid grid-cols-4 gap-6">
        <KPICard title="Total Gross Revenue" currentMonth={grossMonth} yearToDate={grossYtd} />
        <KPICard title="Net Revenue" currentMonth={netMonth} yearToDate={netYtd} />
        <KPICard title="Total Expenses" currentMonth={expMonth} yearToDate={expYtd} />
        <KPICard title="Net Profit" currentMonth={netProfit} yearToDate={netProfitYtd} isProfit />
      </div>

      {/* Custom date inputs — only shown when Custom is selected */}
      {chartRange === 'custom' && (
        <div className="flex items-center gap-4">
          <span style={{ fontFamily: 'var(--font-heading)', fontSize: '10px', letterSpacing: '0.12em', color: 'var(--text-muted)' }}>CHART RANGE</span>
          <div className="flex items-center gap-2">
            <span style={{ fontFamily: 'var(--font-heading)', fontSize: '10px', letterSpacing: '0.1em', color: 'var(--text-muted)' }}>FROM</span>
            <input style={inputStyle} type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)} />
          </div>
          <span style={{ color: 'var(--text-muted)' }}>—</span>
          <div className="flex items-center gap-2">
            <span style={{ fontFamily: 'var(--font-heading)', fontSize: '10px', letterSpacing: '0.1em', color: 'var(--text-muted)' }}>TO</span>
            <input style={inputStyle} type="date" value={customTo} onChange={e => setCustomTo(e.target.value)} />
          </div>
          {!customFrom && (
            <span style={{ fontFamily: 'var(--font-heading)', fontSize: '10px', letterSpacing: '0.08em', color: 'var(--text-muted)', opacity: 0.6 }}>
              Select a start date to load chart data
            </span>
          )}
        </div>
      )}

      <div className="grid grid-cols-3 gap-6">
        <RevenueChart title="Gross Revenue" data={chartLoading ? [] : grossChart} lineColor="var(--copper-base)" timeRange={chartRange} onTimeRangeChange={setChartRange} />
        <RevenueChart title="Expenses" data={chartLoading ? [] : expChart} lineColor="var(--steel-light)" timeRange={chartRange} onTimeRangeChange={setChartRange} />
        <RevenueChart title="Net Profit" data={chartLoading ? [] : profitChart} lineColor="var(--patina-base)" timeRange={chartRange} onTimeRangeChange={setChartRange} />
      </div>

      <div className="grid grid-cols-2 gap-6">
        <MaintenanceAlerts alerts={alerts} loading={kpiLoading} />
        <LoansSummary loans={loans} loading={kpiLoading} />
      </div>
    </div>
  );
}
