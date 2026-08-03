import { useState } from 'react'
import { toast } from 'sonner'
import { Download } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { calcLoanStatus } from '../liabilities/calcLoanStatus'
import type { Loan } from '../liabilities/types'
import { sumNetByLocation } from '../rent/calcPayout'
import type { Agreement } from '../rent/types'
import { ensureAllDepreciationPeriods, getCapexCategoryId } from '../machines/calcDepreciation'
import { Button } from '../ui/button'

// ── CSV helpers ────────────────────────────────────────────────────────────────

function esc(v: string | number | null | undefined): string {
  const s = v == null ? '' : String(v)
  return `"${s.replace(/"/g, '""')}"`
}

function buildCsv(headers: string[], rows: (string | number | null | undefined)[][]): string {
  return [headers.map(esc).join(','), ...rows.map(r => r.map(esc).join(','))].join('\r\n')
}

function downloadCsv(filename: string, csv: string) {
  const blob = new Blob(['﻿' + csv, ''], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

function fmt(v: number | null | undefined) {
  if (v == null) return ''
  return v.toFixed(2)
}

function slug() {
  return new Date().toISOString().slice(0, 10)
}

// ── Date range presets ─────────────────────────────────────────────────────────

type Preset = 'this_month' | 'last_month' | 'last_3_months' | 'this_year' | 'all_time' | 'custom'

function getPresetRange(p: Preset): { from: string; to: string } {
  const now = new Date()
  const y = now.getFullYear()
  const m = now.getMonth()
  const pad = (n: number) => String(n).padStart(2, '0')
  const ymd = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

  if (p === 'this_month') {
    return { from: `${y}-${pad(m + 1)}-01`, to: ymd(now) }
  }
  if (p === 'last_month') {
    const first = new Date(y, m - 1, 1)
    const last = new Date(y, m, 0)
    return { from: ymd(first), to: ymd(last) }
  }
  if (p === 'last_3_months') {
    const first = new Date(y, m - 2, 1)
    return { from: ymd(first), to: ymd(now) }
  }
  if (p === 'this_year') {
    return { from: `${y}-01-01`, to: ymd(now) }
  }
  return { from: '', to: '' } // all_time / custom
}

// ── Main component ─────────────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  padding: '7px 10px',
  backgroundColor: 'var(--bg-elevated)',
  border: '1px solid var(--copper-dark)',
  borderRadius: 'var(--radius-sm)',
  color: 'var(--text-primary)',
  fontFamily: 'var(--font-mono)',
  fontSize: '13px',
  outline: 'none',
  colorScheme: 'dark',
}

const PRESETS: { label: string; value: Preset }[] = [
  { label: 'This Month', value: 'this_month' },
  { label: 'Last Month', value: 'last_month' },
  { label: 'Last 3 Months', value: 'last_3_months' },
  { label: 'This Year', value: 'this_year' },
  { label: 'All Time', value: 'all_time' },
]

export function ReportsView() {
  const initial = getPresetRange('this_month')
  const [preset, setPreset] = useState<Preset>('this_month')
  const [from, setFrom] = useState(initial.from)
  const [to, setTo] = useState(initial.to)
  const [busy, setBusy] = useState<string | null>(null)

  function selectPreset(p: Preset) {
    setPreset(p)
    if (p !== 'custom') {
      const r = getPresetRange(p)
      setFrom(r.from)
      setTo(r.to)
    }
  }

  function applyDateFilter<Q extends { gte: (col: string, v: string) => Q; lte: (col: string, v: string) => Q }>(
    query: Q,
    col: string
  ): Q {
    let q = query
    if (from) q = q.gte(col, from)
    if (to) q = q.lte(col, to)
    return q
  }

  // ── Exporters ──────────────────────────────────────────────────────────────

  async function exportMachineRevenue() {
    setBusy('machine_revenue')
    try {
      let q = supabase
        .from('machine_revenue')
        .select('*, machines(name)')
        .order('collection_date', { ascending: false })
      q = applyDateFilter(q as any, 'collection_date') as typeof q
      const { data, error } = await q
      if (error || !data) { toast.error('Failed to fetch machine revenue.'); return }

      const headers = ['Machine', 'Collection Date', 'Period Start', 'Period End', 'Amount']
      const rows = data.map((r: any) => [
        r.machines?.name ?? '',
        r.collection_date,
        r.collection_period_start,
        r.collection_period_end,
        fmt(r.amount),
      ])
      downloadCsv(`machine-revenue-${slug()}.csv`, buildCsv(headers, rows))
      toast.success(`Exported ${rows.length} rows.`)
    } finally {
      setBusy(null)
    }
  }

  async function exportNonMachineRevenue() {
    setBusy('non_machine_revenue')
    try {
      let q = supabase
        .from('non_machine_revenue')
        .select('*, revenue_categories(name)')
        .order('date', { ascending: false })
      q = applyDateFilter(q as any, 'date') as typeof q
      const { data, error } = await q
      if (error || !data) { toast.error('Failed to fetch non-machine revenue.'); return }

      const headers = ['Date', 'Category', 'Amount', 'Notes']
      const rows = data.map((r: any) => [r.date, r.revenue_categories?.name ?? '', fmt(r.amount), r.notes ?? ''])
      downloadCsv(`other-revenue-${slug()}.csv`, buildCsv(headers, rows))
      toast.success(`Exported ${rows.length} rows.`)
    } finally {
      setBusy(null)
    }
  }

  async function exportExpenses() {
    setBusy('expenses')
    try {
      let q = supabase
        .from('expenses')
        .select('*, expense_categories(name), machines(name)')
        .order('date', { ascending: false })
      q = applyDateFilter(q as any, 'date') as typeof q
      const { data, error } = await q
      if (error || !data) { toast.error('Failed to fetch expenses.'); return }

      const headers = ['Date', 'Category', 'Amount', 'Description', 'Machine', 'Source', 'File URL']
      const rows = data.map((r: any) => [
        r.date,
        r.expense_categories?.name ?? '',
        fmt(r.amount),
        r.description ?? '',
        r.machines?.name ?? '',
        r.source,
        r.file_url ?? '',
      ])
      downloadCsv(`expenses-${slug()}.csv`, buildCsv(headers, rows))
      toast.success(`Exported ${rows.length} rows.`)
    } finally {
      setBusy(null)
    }
  }

  async function exportMaintenanceLog() {
    setBusy('maintenance_log')
    try {
      let q = supabase
        .from('maintenance_logs')
        .select('*, maintenance_items(name), machines(name)')
        .order('date_performed', { ascending: false })
      q = applyDateFilter(q as any, 'date_performed') as typeof q
      const { data, error } = await q
      if (error || !data) { toast.error('Failed to fetch maintenance log.'); return }

      const headers = ['Machine', 'Maintenance Item', 'Date Performed', 'Cost', 'Notes']
      const rows = data.map((r: any) => [
        r.machines?.name ?? '',
        r.maintenance_items?.name ?? '',
        r.date_performed,
        r.cost != null ? fmt(r.cost) : '',
        r.notes ?? '',
      ])
      downloadCsv(`maintenance-log-${slug()}.csv`, buildCsv(headers, rows))
      toast.success(`Exported ${rows.length} rows.`)
    } finally {
      setBusy(null)
    }
  }

  async function exportLoans() {
    setBusy('loans')
    try {
      const { data, error } = await supabase.from('loans').select('*').order('created_at')
      if (error || !data) { toast.error('Failed to fetch loans.'); return }

      const FREQ = { weekly: 'Weekly', biweekly: 'Bi-Weekly', monthly: 'Monthly' } as Record<string, string>
      const COMP = { daily: 'Daily', weekly: 'Weekly', monthly: 'Monthly' } as Record<string, string>

      const headers = ['Loan Name', 'Principal', 'Rate (APR)', 'Compounding', 'Term (months)', 'Payment Freq', 'Start Date', 'Payment Amount', 'Payments Made', 'Payments Total', 'Total Paid', 'Remaining Balance', 'Status']
      const rows = (data as Loan[]).map(loan => {
        const s = calcLoanStatus(loan)
        return [
          loan.name,
          fmt(loan.principal_amount),
          `${(loan.interest_rate * 100).toFixed(2)}%`,
          COMP[loan.compounding_interval],
          String(loan.loan_term_months),
          FREQ[loan.payment_frequency],
          loan.start_date,
          fmt(s.paymentAmount),
          String(s.paymentsMade),
          String(s.paymentsTotal),
          fmt(s.totalPaid),
          fmt(s.remainingBalance),
          s.isFullyPaid ? 'Paid Off' : 'Active',
        ]
      })
      downloadCsv(`loans-${slug()}.csv`, buildCsv(headers, rows))
      toast.success(`Exported ${rows.length} loan(s).`)
    } finally {
      setBusy(null)
    }
  }

  async function exportPnL() {
    setBusy('pnl')
    try {
      await ensureAllDepreciationPeriods()
      const capexCategoryId = await getCapexCategoryId()

      // Fetch all revenue and expenses for the period
      const [mrQ, nmrQ, expQ, depQ, agreeQ] = await Promise.all([
        applyDateFilter(
          supabase.from('machine_revenue').select('amount,location_id') as any,
          'collection_date'
        ).then((r: any) => r),
        applyDateFilter(
          supabase.from('non_machine_revenue').select('amount,location_id') as any,
          'date'
        ).then((r: any) => r),
        applyDateFilter(
          supabase.from('expenses').select('amount,category_id') as any,
          'date'
        ).then((r: any) => r),
        applyDateFilter(
          supabase.from('machine_depreciation_periods').select('amount') as any,
          'period_month'
        ).then((r: any) => r),
        supabase
          .from('rent_commission_agreements')
          .select('*')
          .is('end_date', null)
          .then((r: any) => r),
      ])

      const machineRevenue = (mrQ.data ?? []).reduce(
        (sum: number, r: any) => sum + (r.amount ?? 0), 0
      )
      const otherRevenue = (nmrQ.data ?? []).reduce((sum: number, r: any) => sum + (r.amount ?? 0), 0)
      const grossRevenue = machineRevenue + otherRevenue

      // Capital expenditures (machine purchases) are excluded from operating
      // expenses — their cost is recognized instead via depreciation below.
      const operatingExpenses = (expQ.data ?? [])
        .filter((r: any) => r.category_id !== capexCategoryId)
        .reduce((sum: number, r: any) => sum + (r.amount ?? 0), 0)
      const depreciation = (depQ.data ?? []).reduce((sum: number, r: any) => sum + (r.amount ?? 0), 0)
      const totalExpenses = operatingExpenses + depreciation

      // Rent & commission is calculated per location, using each location's own
      // active agreement, then summed — a single global rate no longer applies
      // now that each location can carry its own agreement.
      const agreementsByLocation = new Map<string, Agreement>(
        ((agreeQ.data ?? []) as Agreement[]).map(a => [a.location_id, a])
      )
      const { net: netRevenue } = sumNetByLocation(mrQ.data ?? [], nmrQ.data ?? [], agreementsByLocation)
      const rentDeduction = grossRevenue - netRevenue
      const rentNote = agreementsByLocation.size > 0
        ? `Per-location agreements (${agreementsByLocation.size} active)`
        : 'No active agreements'

      const netProfit = netRevenue - totalExpenses

      const periodLabel = from && to ? `${from} to ${to}` : from ? `from ${from}` : to ? `to ${to}` : 'All Time'

      const headers = ['Metric', 'Amount', 'Notes']
      const rows: (string | number)[][] = [
        ['Period', periodLabel, ''],
        ['', '', ''],
        ['Machine Revenue', fmt(machineRevenue), ''],
        ['Other Revenue', fmt(otherRevenue), ''],
        ['Gross Revenue', fmt(grossRevenue), ''],
        ['Rent & Commission', `-${fmt(rentDeduction)}`, rentNote],
        ['Net Revenue', fmt(netRevenue), ''],
        ['', '', ''],
        ['Operating Expenses', `-${fmt(operatingExpenses)}`, 'Excludes capital expenditures'],
        ['Depreciation', `-${fmt(depreciation)}`, 'Straight-line, machine purchases'],
        ['Total Expenses', `-${fmt(totalExpenses)}`, ''],
        ['', '', ''],
        ['Net Profit', fmt(netProfit), netProfit >= 0 ? '' : 'Loss'],
      ]
      downloadCsv(`pnl-${slug()}.csv`, buildCsv(headers, rows))
      toast.success('P&L exported.')
    } finally {
      setBusy(null)
    }
  }

  // ── UI ────────────────────────────────────────────────────────────────────

  const exports: { key: string; title: string; desc: string; handler: () => Promise<void> }[] = [
    { key: 'machine_revenue', title: 'Machine Revenue', desc: 'All collections by machine and collection period', handler: exportMachineRevenue },
    { key: 'non_machine_revenue', title: 'Other Revenue', desc: 'Non-machine revenue by category (tournaments, merchandise, etc.)', handler: exportNonMachineRevenue },
    { key: 'expenses', title: 'Expenses', desc: 'All expenses by category and machine, with source and file attachment flags', handler: exportExpenses },
    { key: 'maintenance_log', title: 'Maintenance Log', desc: 'Full service history by machine, item, date, and cost', handler: exportMaintenanceLog },
    { key: 'loans', title: 'Loan Summary', desc: 'All loans with calculated balances, payments made, and remaining amounts', handler: exportLoans },
    { key: 'pnl', title: 'P&L Summary', desc: 'Gross revenue, rent deduction, net revenue, expenses, and net profit', handler: exportPnL },
  ]

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl tracking-wide" style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-heading)' }}>
          Reports
        </h2>
        <p className="text-sm tracking-wider opacity-70 mt-1" style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-secondary)' }}>
          CSV EXPORTS FOR ALL MODULES
        </p>
      </div>

      {/* Date range */}
      <div
        style={{
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--copper-dark)',
          borderRadius: 'var(--radius-md)',
          padding: '16px 20px',
        }}
      >
        <div style={{ fontFamily: 'var(--font-heading)', fontSize: '10px', letterSpacing: '0.15em', color: 'var(--text-muted)', marginBottom: '12px' }}>
          DATE RANGE — applies to all exports below
        </div>
        {/* Presets */}
        <div className="flex gap-1 flex-wrap mb-3">
          {PRESETS.map(p => (
            <button
              key={p.value}
              onClick={() => selectPreset(p.value)}
              style={{
                padding: '5px 12px',
                borderRadius: 'var(--radius-sm)',
                fontFamily: 'var(--font-heading)',
                fontSize: '10px',
                letterSpacing: '0.1em',
                cursor: 'pointer',
                border: 'none',
                backgroundColor: preset === p.value ? 'var(--copper-dark)' : 'var(--bg-elevated)',
                color: preset === p.value ? 'var(--copper-bright)' : 'var(--text-muted)',
              }}
            >
              {p.label.toUpperCase()}
            </button>
          ))}
          <button
            onClick={() => setPreset('custom')}
            style={{
              padding: '5px 12px',
              borderRadius: 'var(--radius-sm)',
              fontFamily: 'var(--font-heading)',
              fontSize: '10px',
              letterSpacing: '0.1em',
              cursor: 'pointer',
              border: 'none',
              backgroundColor: preset === 'custom' ? 'var(--copper-dark)' : 'var(--bg-elevated)',
              color: preset === 'custom' ? 'var(--copper-bright)' : 'var(--text-muted)',
            }}
          >
            CUSTOM
          </button>
        </div>
        {/* Date inputs */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span style={{ fontFamily: 'var(--font-heading)', fontSize: '10px', letterSpacing: '0.1em', color: 'var(--text-muted)' }}>FROM</span>
            <input
              style={inputStyle}
              type="date"
              value={from}
              onChange={e => { setFrom(e.target.value); setPreset('custom') }}
            />
          </div>
          <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-heading)', fontSize: '12px' }}>—</span>
          <div className="flex items-center gap-2">
            <span style={{ fontFamily: 'var(--font-heading)', fontSize: '10px', letterSpacing: '0.1em', color: 'var(--text-muted)' }}>TO</span>
            <input
              style={inputStyle}
              type="date"
              value={to}
              onChange={e => { setTo(e.target.value); setPreset('custom') }}
            />
          </div>
          {preset === 'all_time' && (
            <span style={{ fontFamily: 'var(--font-heading)', fontSize: '10px', letterSpacing: '0.1em', color: 'var(--patina-light)', opacity: 0.8 }}>
              — no date filter applied
            </span>
          )}
        </div>
      </div>

      {/* Export cards */}
      <div className="space-y-3">
        {exports.map(({ key, title, desc, handler }) => (
          <div
            key={key}
            className="flex items-center justify-between"
            style={{
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--copper-dark)',
              borderRadius: 'var(--radius-md)',
              padding: '16px 20px',
            }}
          >
            <div>
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: '13px', letterSpacing: '0.08em', color: 'var(--text-heading)', marginBottom: '4px' }}>
                {title}
              </div>
              <div style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--text-muted)', opacity: 0.8 }}>
                {desc}
              </div>
            </div>
            <Button
              onClick={handler}
              disabled={busy !== null}
              variant="outline"
              size="sm"
              style={{
                borderColor: 'var(--copper-dark)',
                color: busy === key ? 'var(--text-muted)' : 'var(--copper-bright)',
                flexShrink: 0,
                marginLeft: '24px',
              }}
            >
              <Download size={13} />
              {busy === key ? 'Exporting…' : 'Export CSV'}
            </Button>
          </div>
        ))}
      </div>
    </div>
  )
}
