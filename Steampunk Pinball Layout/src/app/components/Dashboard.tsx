import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { KPICard } from './KPICard';
import { RevenueChart } from './RevenueChart';
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

function calcRentDeduction(agreement: Agreement | null, gross: number): number {
  if (!agreement) return 0;
  if (agreement.type === 'flat_fee') return agreement.flat_fee_amount ?? 0;
  if (agreement.type === 'percentage') return gross * (agreement.percentage_rate ?? 0);
  const base = agreement.flat_fee_amount ?? 0;
  const threshold = agreement.revenue_threshold ?? 0;
  const pct = gross > threshold ? (gross - threshold) * (agreement.percentage_rate ?? 0) : 0;
  return base + pct;
}

function sumMachineRevenue(rows: any[]): number {
  return rows.reduce((s, r) => s + (r.coin ?? 0) + (r.bill_drop ?? 0) + (r.card ?? 0) + (r.phone_tap ?? 0), 0);
}

function sumField(rows: any[], field = 'amount'): number {
  return rows.reduce((s, r) => s + (r[field] ?? 0), 0);
}

// Build 6-month chart series
function buildChartSeries() {
  const now = new Date();
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = d.toLocaleDateString('en-US', { month: 'short' });
    return { key, label };
  });
}

export function Dashboard() {
  const [loading, setLoading] = useState(true);

  // KPI state
  const [grossCurrentMonth, setGrossCurrentMonth] = useState(0);
  const [grossYtd, setGrossYtd] = useState(0);
  const [netCurrentMonth, setNetCurrentMonth] = useState(0);
  const [netYtd, setNetYtd] = useState(0);
  const [expCurrentMonth, setExpCurrentMonth] = useState(0);
  const [expYtd, setExpYtd] = useState(0);

  // Chart state
  const [grossChartData, setGrossChartData] = useState<{ month: string; value: number }[]>([]);
  const [expChartData, setExpChartData] = useState<{ month: string; value: number }[]>([]);
  const [profitChartData, setProfitChartData] = useState<{ month: string; value: number }[]>([]);

  // Sub-component state
  const [alerts, setAlerts] = useState<MaintenanceAlertItem[]>([]);
  const [loans, setLoans] = useState<LoanSummaryItem[]>([]);

  useEffect(() => {
    async function fetchAll() {
      setLoading(true);
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth();
      const pad = (n: number) => String(n).padStart(2, '0');

      const ytdStart = `${year}-01-01`;
      const monthStart = `${year}-${pad(month + 1)}-01`;
      const today = now.toISOString().split('T')[0];

      // Six-month window for charts
      const chartMonths = buildChartSeries();
      const chartStart = chartMonths[0].key + '-01';

      const [
        mrYtd, nmrYtd, expYtd,
        mrChart, nmrChart, expChart,
        agreeRes,
        machinesRes, itemsRes, logsRes,
        loansRes,
      ] = await Promise.all([
        // YTD revenue & expenses
        supabase.from('machine_revenue').select('collection_date,coin,bill_drop,card,phone_tap').gte('collection_date', ytdStart).lte('collection_date', today),
        supabase.from('non_machine_revenue').select('date,amount').gte('date', ytdStart).lte('date', today),
        supabase.from('expenses').select('date,amount').gte('date', ytdStart).lte('date', today),
        // Chart data (6 months)
        supabase.from('machine_revenue').select('collection_date,coin,bill_drop,card,phone_tap').gte('collection_date', chartStart).lte('collection_date', today),
        supabase.from('non_machine_revenue').select('date,amount').gte('date', chartStart).lte('date', today),
        supabase.from('expenses').select('date,amount').gte('date', chartStart).lte('date', today),
        // Active rent agreement
        supabase.from('rent_commission_agreements').select('type,flat_fee_amount,percentage_rate,revenue_threshold').is('end_date', null).maybeSingle(),
        // Maintenance alert data
        supabase.from('machines').select('id,name').eq('is_archived', false).in('status', ['Active', 'Out of Service']),
        supabase.from('maintenance_items').select('id,machine_id,name,interval_days'),
        supabase.from('maintenance_logs').select('machine_id,maintenance_item_id,date_performed').order('date_performed', { ascending: false }),
        // Loans
        supabase.from('loans').select('*'),
      ]);

      const agreement = agreeRes.data as Agreement | null;

      // ── KPI calculations ──────────────────────────────────────────────────
      const mrYtdRows = mrYtd.data ?? [];
      const nmrYtdRows = nmrYtd.data ?? [];
      const expYtdRows = expYtd.data ?? [];

      const grossYtdVal = sumMachineRevenue(mrYtdRows) + sumField(nmrYtdRows);
      const expYtdVal = sumField(expYtdRows);
      const rentYtd = calcRentDeduction(agreement, grossYtdVal);

      const mrMonthRows = mrYtdRows.filter((r: any) => r.collection_date >= monthStart);
      const nmrMonthRows = nmrYtdRows.filter((r: any) => r.date >= monthStart);
      const expMonthRows = expYtdRows.filter((r: any) => r.date >= monthStart);

      const grossMonthVal = sumMachineRevenue(mrMonthRows) + sumField(nmrMonthRows);
      const expMonthVal = sumField(expMonthRows);
      const rentMonth = calcRentDeduction(agreement, grossMonthVal);

      setGrossCurrentMonth(grossMonthVal);
      setGrossYtd(grossYtdVal);
      setExpCurrentMonth(expMonthVal);
      setExpYtd(expYtdVal);
      setNetCurrentMonth(grossMonthVal - rentMonth);
      setNetYtd(grossYtdVal - rentYtd);

      // ── Chart series ──────────────────────────────────────────────────────
      const mrChartRows = mrChart.data ?? [];
      const nmrChartRows = nmrChart.data ?? [];
      const expChartRows = expChart.data ?? [];

      const grossSeries = chartMonths.map(({ key, label }) => {
        const mr = sumMachineRevenue(mrChartRows.filter((r: any) => r.collection_date.startsWith(key)));
        const nmr = sumField(nmrChartRows.filter((r: any) => r.date.startsWith(key)));
        return { month: label, value: mr + nmr };
      });

      const expSeries = chartMonths.map(({ key, label }) => ({
        month: label,
        value: sumField(expChartRows.filter((r: any) => r.date.startsWith(key))),
      }));

      const profitSeries = chartMonths.map(({ key, label }, i) => {
        const gross = grossSeries[i].value;
        const rent = calcRentDeduction(agreement, gross);
        return { month: label, value: gross - rent - expSeries[i].value };
      });

      setGrossChartData(grossSeries);
      setExpChartData(expSeries);
      setProfitChartData(profitSeries);

      // ── Maintenance alerts ────────────────────────────────────────────────
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
        alertItems.push({
          id: item.id,
          machineName: machineMap[item.machine_id] ?? 'Unknown',
          maintenanceItem: item.name,
          dueDate,
          status: dueMs < todayMs ? 'overdue' : 'due-soon',
        });
      }
      // Sort overdue first, then by due date
      alertItems.sort((a, b) => {
        if (a.status !== b.status) return a.status === 'overdue' ? -1 : 1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      });
      setAlerts(alertItems);

      // ── Loans ─────────────────────────────────────────────────────────────
      const loanData = (loansRes.data ?? []) as Loan[];
      const loanSummaries: LoanSummaryItem[] = loanData.map(loan => {
        const s = calcLoanStatus(loan);
        return { id: loan.id, name: loan.name, remainingBalance: s.remainingBalance, totalPaid: s.totalPaid };
      });
      setLoans(loanSummaries);

      setLoading(false);
    }

    fetchAll();
  }, []);

  const netProfit = netCurrentMonth - expCurrentMonth;
  const netProfitYtd = netYtd - expYtd;

  return (
    <div className="p-8 space-y-8">
      <div>
        <h2 className="text-3xl mb-2 tracking-wide" style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-heading)' }}>
          Dashboard
        </h2>
        <p className="text-sm tracking-wider opacity-70" style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-secondary)' }}>
          FINANCIAL OVERVIEW & OPERATIONAL STATUS
        </p>
      </div>

      <div className="grid grid-cols-4 gap-6">
        <KPICard title="Total Gross Revenue" currentMonth={grossCurrentMonth} yearToDate={grossYtd} />
        <KPICard title="Net Revenue" currentMonth={netCurrentMonth} yearToDate={netYtd} />
        <KPICard title="Total Expenses" currentMonth={expCurrentMonth} yearToDate={expYtd} />
        <KPICard title="Net Profit" currentMonth={netProfit} yearToDate={netProfitYtd} isProfit />
      </div>

      <div className="grid grid-cols-3 gap-6">
        <RevenueChart title="Gross Revenue" data={grossChartData} lineColor="var(--copper-base)" />
        <RevenueChart title="Expenses" data={expChartData} lineColor="var(--steel-light)" />
        <RevenueChart title="Net Profit" data={profitChartData} lineColor="var(--patina-base)" />
      </div>

      <div className="grid grid-cols-2 gap-6">
        <MaintenanceAlerts alerts={alerts} loading={loading} />
        <LoansSummary loans={loans} loading={loading} />
      </div>
    </div>
  );
}
