import { supabase } from '@/lib/supabase'
import type { Machine, MachineDepreciationPeriod } from './types'

// Expenses filed under this category are capital expenditures (e.g. machine
// purchases) — they're kept in the expense ledger for record-keeping but
// excluded from P&L operating-expense totals, since the asset's cost is
// recognized instead via monthly depreciation.
export const CAPEX_CATEGORY_NAME = 'Payments & Capital Expenditures'

const pad = (n: number) => String(n).padStart(2, '0')

function monthKey(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-01`
}

export function calcMonthlyDepreciation(machine: Pick<Machine, 'purchase_price' | 'date_acquired' | 'salvage_value' | 'useful_life_years'>): number {
  if (!machine.purchase_price || !machine.date_acquired || machine.useful_life_years <= 0) return 0
  const depreciable = machine.purchase_price - (machine.salvage_value ?? 0)
  if (depreciable <= 0) return 0
  return depreciable / machine.useful_life_years / 12
}

// Month-start dates from the purchase month through useful_life_years * 12
// months later, capped at the current month — depreciation never runs ahead
// of today and never runs longer than the asset's useful life.
export function depreciationMonthRange(machine: Pick<Machine, 'date_acquired' | 'useful_life_years'>): Date[] {
  if (!machine.date_acquired) return []
  const start = new Date(machine.date_acquired + 'T00:00:00')
  const startMonth = new Date(start.getFullYear(), start.getMonth(), 1)
  const totalMonths = Math.round(machine.useful_life_years * 12)
  const now = new Date()
  const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const months: Date[] = []
  for (let i = 0; i < totalMonths; i++) {
    const m = new Date(startMonth.getFullYear(), startMonth.getMonth() + i, 1)
    if (m > currentMonth) break
    months.push(m)
  }
  return months
}

export function calcAccumulatedDepreciation(periods: Pick<MachineDepreciationPeriod, 'amount'>[]): number {
  return periods.reduce((sum, p) => sum + (p.amount ?? 0), 0)
}

export function calcBookValue(machine: Pick<Machine, 'purchase_price' | 'salvage_value'>, accumulatedDepreciation: number): number {
  if (!machine.purchase_price) return 0
  return Math.max(machine.salvage_value ?? 0, machine.purchase_price - accumulatedDepreciation)
}

// Idempotent: computes each machine's depreciation schedule and upserts any
// months that don't already exist (or re-syncs their amount if the machine's
// cost/life/salvage was edited since). Safe to call from any screen that
// needs current depreciation figures.
export async function ensureDepreciationPeriods(machines: Machine[]): Promise<void> {
  const rows: { machine_id: string; period_month: string; amount: number }[] = []
  for (const machine of machines) {
    if (machine.is_archived) continue
    const amount = Math.round(calcMonthlyDepreciation(machine) * 100) / 100
    if (amount <= 0) continue
    for (const m of depreciationMonthRange(machine)) {
      rows.push({ machine_id: machine.id, period_month: monthKey(m), amount })
    }
  }
  if (rows.length === 0) return
  await supabase.from('machine_depreciation_periods').upsert(rows, { onConflict: 'machine_id,period_month' })
}

export async function ensureAllDepreciationPeriods(): Promise<void> {
  const { data } = await supabase.from('machines').select('*').eq('is_archived', false)
  if (data) await ensureDepreciationPeriods(data as Machine[])
}

export async function sumDepreciationForRange(fromMonth: string, toMonth: string): Promise<number> {
  const { data } = await supabase
    .from('machine_depreciation_periods')
    .select('amount')
    .gte('period_month', fromMonth)
    .lte('period_month', toMonth)
  return (data ?? []).reduce((s, r) => s + (r.amount ?? 0), 0)
}

export async function getCapexCategoryId(): Promise<string | null> {
  const { data } = await supabase.from('expense_categories').select('id').eq('name', CAPEX_CATEGORY_NAME).maybeSingle()
  return data?.id ?? null
}
