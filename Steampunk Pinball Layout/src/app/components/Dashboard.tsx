import { useState, useEffect, useRef, useCallback } from 'react';
import { Sun, Moon, Upload } from 'lucide-react';
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
import { BankImportModal } from './BankImportModal';
import { Button } from './ui/button';
import { useActiveLocation } from '../context/LocationContext';
import type { ExpenseCategory } from './expenses/types';
import type { RevenueCategory } from './revenue/types';
import type { Agreement } from './rent/types';
import { sumNetByLocation, calcRentDeduction, describeAgreementShort } from './rent/calcPayout';

type ChartPoint = { label: string; value: number };
type LocationBreakdownRow = { id: string; name: string; agreementLabel: string; gross: number; commission: number; net: number };

// ── Pure helpers ──────────────────────────────────────────────────────────────

const pad = (n: number) => String(n).padStart(2, '0');

function sumAmt(rows: any[]): number {
  return rows.reduce((s, r) => s + (r.amount ?? 0), 0);
}

function formatMoney(v: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(v);
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
  agreementsByLocation: Map<string, Agreement>
): { gross: ChartPoint[]; exp: ChartPoint[]; profit: ChartPoint[] } {
  if (series.length === 0) return { gross: [], exp: [], profit: [] };

  const groupBy = series[0].groupBy;
  const match = (row: any, dateField: string, key: string) =>
    groupBy === 'day' ? row[dateField] === key : (row[dateField] ?? '').startsWith(key);

  const gross: ChartPoint[] = [];
  const profit: ChartPoint[] = [];
  for (const { key, label } of series) {
    const bucketMr = mrRows.filter(r => match(r, 'collection_date', key));
    const bucketNmr = nmrRows.filter(r => match(r, 'date', key));
    const { gross: bucketGross, net: bucketNet } = sumNetByLocation(bucketMr, bucketNmr, agreementsByLocation);
    const bucketExp = sumAmt(expRows.filter(r => match(r, 'date', key)));
    gross.push({ label, value: bucketGross });
    profit.push({ label, value: bucketNet - bucketExp });
  }

  const exp = series.map(({ key, label }) => ({
    label,
    value: sumAmt(expRows.filter(r => match(r, 'date', key))),
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
  const [locationBreakdown, setLocationBreakdown] = useState<LocationBreakdownRow[]>([]);
  const agreementsRef = useRef<Map<string, Agreement>>(new Map());

  // Bank CSV import
  const { locations } = useActiveLocation();
  const [showImport, setShowImport] = useState(false);
  const [expenseCategories, setExpenseCategories] = useState<ExpenseCategory[]>([]);
  const [revenueCategories, setRevenueCategories] = useState<RevenueCategory[]>([]);

  useEffect(() => {
    async function fetchImportCategories() {
      const [expCatRes, revCatRes] = await Promise.all([
        supabase.from('expense_categories').select('*').order('name'),
        supabase.from('revenue_categories').select('*').order('name'),
      ]);
      if (expCatRes.data) setExpenseCategories(expCatRes.data);
      if (revCatRes.data) setRevenueCategories(revCatRes.data);
    }
    fetchImportCategories();
  }, []);

  // ── KPI, maintenance, loans ────────────────────────────────────────────
  const fetchKpiAndMeta = useCallback(async () => {
      setKpiLoading(true);
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth();
      const ytdStart = `${year}-01-01`;
      const monthStart = `${year}-${pad(month + 1)}-01`;
      const today = now.toISOString().split('T')[0];

      const [mrYtd, nmrYtd, expYtdRes, agreeRes, machinesRes, itemsRes, logsRes, loansRes] = await Promise.all([
        supabase.from('machine_revenue').select('collection_date,amount,location_id').gte('collection_date', ytdStart).lte('collection_date', today),
        supabase.from('non_machine_revenue').select('date,amount,location_id').gte('date', ytdStart).lte('date', today),
        supabase.from('expenses').select('date,amount').gte('date', ytdStart).lte('date', today),
        supabase.from('rent_commission_agreements').select('*').is('end_date', null),
        supabase.from('machines').select('id,name').eq('is_archived', false).in('status', ['Active', 'Out of Service']),
        supabase.from('maintenance_items').select('id,machine_id,name,interval_days'),
        supabase.from('maintenance_logs').select('machine_id,maintenance_item_id,date_performed').order('date_performed', { ascending: false }),
        supabase.from('loans').select('*'),
      ]);

      const agreementsByLocation = new Map<string, Agreement>(
        ((agreeRes.data ?? []) as Agreement[]).map(a => [a.location_id, a])
      );
      agreementsRef.current = agreementsByLocation;

      // KPI
      const mrRows = mrYtd.data ?? [];
      const nmrRows = nmrYtd.data ?? [];
      const expRows = expYtdRes.data ?? [];
      const monthMrRows = mrRows.filter((r: any) => r.collection_date >= monthStart);
      const monthNmrRows = nmrRows.filter((r: any) => r.date >= monthStart);

      const eYtd = sumAmt(expRows);
      const eMonth = sumAmt(expRows.filter((r: any) => r.date >= monthStart));

      const { gross: gYtd, net: nYtd } = sumNetByLocation(mrRows, nmrRows, agreementsByLocation);
      const { gross: gMonth, net: nMonth } = sumNetByLocation(monthMrRows, monthNmrRows, agreementsByLocation);

      setGrossYtd(gYtd);
      setGrossMonth(gMonth);
      setExpYtd(eYtd);
      setExpMonth(eMonth);
      setNetYtd(nYtd);
      setNetMonth(nMonth);

      // Per-location breakdown (current month)
      setLocationBreakdown(locations.map(loc => {
        const locGross = sumAmt(monthMrRows.filter((r: any) => r.location_id === loc.id))
          + sumAmt(monthNmrRows.filter((r: any) => r.location_id === loc.id));
        const agreement = agreementsByLocation.get(loc.id) ?? null;
        const commission = calcRentDeduction(agreement, locGross);
        return { id: loc.id, name: loc.name, agreementLabel: describeAgreementShort(agreement), gross: locGross, commission, net: locGross - commission };
      }));

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
  }, [locations]);

  useEffect(() => { fetchKpiAndMeta(); }, [fetchKpiAndMeta]);

  // ── Chart data: re-runs when range or custom dates change ────────────────
  const fetchChartData = useCallback(async () => {
    // Skip custom range until both dates are set
    if (chartRange === 'custom' && !customFrom) return;

    setChartLoading(true);

    const series = buildSeries(chartRange, customFrom, customTo);
    if (series.length === 0) { setChartLoading(false); return; }

    const fromDate = series[0].key + (series[0].groupBy === 'day' ? '' : '-01');
    const now = new Date();
    const toDate = chartRange === 'custom' && customTo ? customTo : now.toISOString().split('T')[0];

    const [mrRes, nmrRes, expRes] = await Promise.all([
      supabase.from('machine_revenue').select('collection_date,amount,location_id').gte('collection_date', fromDate).lte('collection_date', toDate),
      supabase.from('non_machine_revenue').select('date,amount,location_id').gte('date', fromDate).lte('date', toDate),
      supabase.from('expenses').select('date,amount').gte('date', fromDate).lte('date', toDate),
    ]);

    const { gross, exp, profit } = computeChartData(series, mrRes.data ?? [], nmrRes.data ?? [], expRes.data ?? [], agreementsRef.current);
    setGrossChart(gross);
    setExpChart(exp);
    setProfitChart(profit);
    setChartLoading(false);
  }, [chartRange, customFrom, customTo]);

  useEffect(() => { fetchChartData(); }, [fetchChartData]);

  function handleImportSaved() {
    fetchKpiAndMeta();
    fetchChartData();
  }

  const netProfit = netMonth - expMonth;
  const netProfitYtd = netYtd - expYtd;
  const monthLabel = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }).toUpperCase();

  const colHeader: React.CSSProperties = {
    fontFamily: 'var(--font-heading)',
    fontSize: '10px',
    letterSpacing: '0.12em',
    color: 'var(--text-muted)',
    padding: '10px 12px',
  };

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
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowImport(true)}
            style={{ borderColor: 'var(--copper-dark)', color: 'var(--text-muted)' }}
          >
            <Upload size={13} />
            Import Bank CSV
          </Button>
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

      {!kpiLoading && locationBreakdown.length > 0 && (
        <div>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: '11px', letterSpacing: '0.15em', color: 'var(--text-muted)', marginBottom: '10px' }}>
            LOCATION BREAKDOWN — {monthLabel}
          </div>
          <div style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--copper-dark)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
            <div className="grid" style={{ gridTemplateColumns: '1fr 160px 140px 140px 140px', borderBottom: '1px solid var(--copper-dark)' }}>
              <div style={colHeader}>LOCATION</div>
              <div style={colHeader}>AGREEMENT</div>
              <div style={colHeader}>GROSS (MTD)</div>
              <div style={colHeader}>COMMISSION</div>
              <div style={colHeader}>NET (MTD)</div>
            </div>
            {locationBreakdown.map((row, i) => (
              <div
                key={row.id}
                className="grid items-center"
                style={{ gridTemplateColumns: '1fr 160px 140px 140px 140px', borderBottom: i === locationBreakdown.length - 1 ? 'none' : '1px solid rgba(107,46,18,0.25)' }}
              >
                <div style={{ padding: '12px', fontFamily: 'var(--font-body)', color: 'var(--text-primary)', fontSize: '14px' }}>{row.name}</div>
                <div style={{ padding: '12px', fontFamily: 'var(--font-body)', color: 'var(--text-muted)', fontSize: '13px' }}>{row.agreementLabel}</div>
                <div style={{ padding: '12px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', fontSize: '13px' }}>{formatMoney(row.gross)}</div>
                <div style={{ padding: '12px', fontFamily: 'var(--font-mono)', color: row.commission > 0 ? 'var(--destructive)' : 'var(--text-muted)', fontSize: '13px' }}>
                  {row.commission > 0 ? `-${formatMoney(row.commission)}` : '—'}
                </div>
                <div style={{ padding: '12px', fontFamily: 'var(--font-mono)', color: 'var(--gold-base)', fontSize: '14px', fontWeight: 'bold' }}>{formatMoney(row.net)}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-6">
        <MaintenanceAlerts alerts={alerts} loading={kpiLoading} />
        <LoansSummary loans={loans} loading={kpiLoading} />
      </div>

      {showImport && (
        <BankImportModal
          expenseCategories={expenseCategories}
          revenueCategories={revenueCategories}
          locations={locations}
          onSaved={handleImportSaved}
          onClose={() => setShowImport(false)}
        />
      )}
    </div>
  );
}
