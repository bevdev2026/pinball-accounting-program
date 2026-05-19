import { KPICard } from './KPICard';
import { RevenueChart } from './RevenueChart';
import { MaintenanceAlerts } from './MaintenanceAlerts';
import { LoansSummary } from './LoansSummary';

const grossRevenueData = [
  { month: 'Jan', value: 12400 },
  { month: 'Feb', value: 13800 },
  { month: 'Mar', value: 11200 },
  { month: 'Apr', value: 15600 },
  { month: 'May', value: 14200 },
];

const expensesData = [
  { month: 'Jan', value: 4200 },
  { month: 'Feb', value: 3800 },
  { month: 'Mar', value: 4500 },
  { month: 'Apr', value: 3900 },
  { month: 'May', value: 4100 },
];

const netProfitData = [
  { month: 'Jan', value: 8200 },
  { month: 'Feb', value: 10000 },
  { month: 'Mar', value: 6700 },
  { month: 'Apr', value: 11700 },
  { month: 'May', value: 10100 },
];

export function Dashboard() {
  return (
    <div className="p-8 space-y-8">
      <div>
        <h2
          className="text-3xl mb-2 tracking-wide"
          style={{
            fontFamily: 'var(--font-heading)',
            color: 'var(--text-heading)',
          }}
        >
          Dashboard
        </h2>
        <p
          className="text-sm tracking-wider opacity-70"
          style={{
            fontFamily: 'var(--font-heading)',
            color: 'var(--text-secondary)',
          }}
        >
          FINANCIAL OVERVIEW & OPERATIONAL STATUS
        </p>
      </div>

      <div className="grid grid-cols-4 gap-6">
        <KPICard title="Total Gross Revenue" currentMonth={14200} yearToDate={67200} />
        <KPICard title="Net Revenue" currentMonth={12800} yearToDate={60400} />
        <KPICard title="Total Expenses" currentMonth={4100} yearToDate={20500} />
        <KPICard title="Net Profit" currentMonth={8700} yearToDate={39900} isProfit />
      </div>

      <div className="grid grid-cols-3 gap-6">
        <RevenueChart title="Gross Revenue" data={grossRevenueData} lineColor="var(--copper-base)" />
        <RevenueChart title="Expenses" data={expensesData} lineColor="var(--steel-light)" />
        <RevenueChart title="Net Profit" data={netProfitData} lineColor="var(--patina-base)" />
      </div>

      <div className="grid grid-cols-2 gap-6">
        <MaintenanceAlerts />
        <LoansSummary />
      </div>
    </div>
  );
}
