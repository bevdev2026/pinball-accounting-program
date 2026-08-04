import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { Agreement } from './types'

type AgreementTerms = Pick<Agreement, 'type' | 'flat_fee_amount' | 'percentage_rate' | 'revenue_threshold'>

export function calcRentDeduction(agreement: AgreementTerms | null, gross: number): number {
  if (!agreement) return 0
  if (agreement.type === 'flat_fee') return agreement.flat_fee_amount ?? 0
  if (agreement.type === 'percentage') return gross * (agreement.percentage_rate ?? 0)
  const base = agreement.flat_fee_amount ?? 0
  const threshold = agreement.revenue_threshold ?? 0
  return base + (gross > threshold ? (gross - threshold) * (agreement.percentage_rate ?? 0) : 0)
}

export function describeAgreementShort(agreement: AgreementTerms | null): string {
  if (!agreement) return 'No agreement'
  if (agreement.type === 'flat_fee') return `$${(agreement.flat_fee_amount ?? 0).toFixed(0)} flat`
  if (agreement.type === 'percentage') return `${((agreement.percentage_rate ?? 0) * 100).toFixed(1)}% of gross`
  return `$${(agreement.flat_fee_amount ?? 0).toFixed(0)} + ${((agreement.percentage_rate ?? 0) * 100).toFixed(1)}%`
}

function formatMoneyPlain(v: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(v)
}

function formatRate(v: number) {
  return (v * 100).toFixed(2).replace(/\.?0+$/, '') + '%'
}

// Full plain-language description of an agreement's terms, e.g. "$750 flat
// fee + 20% of gross revenue above $2,500" — used both on the Commission
// page and on generated payout letters.
export function describeAgreement(agreement: AgreementTerms | null): string {
  if (!agreement) return 'No agreement on file for this period'
  if (agreement.type === 'flat_fee') {
    return `${formatMoneyPlain(agreement.flat_fee_amount ?? 0)} flat fee per collection period`
  }
  if (agreement.type === 'percentage') {
    return `${formatRate(agreement.percentage_rate ?? 0)} of gross revenue`
  }
  const parts = [`${formatMoneyPlain(agreement.flat_fee_amount ?? 0)} flat fee`]
  if (agreement.revenue_threshold != null) {
    parts.push(`+ ${formatRate(agreement.percentage_rate ?? 0)} of gross revenue above ${formatMoneyPlain(agreement.revenue_threshold)}`)
  } else {
    parts.push(`+ ${formatRate(agreement.percentage_rate ?? 0)} of gross revenue`)
  }
  return parts.join(' ')
}

type RevenueRow = { location_id: string | null; amount: number }

// Groups revenue rows by location, applies each location's own agreement, and
// sums the results — so a combined gross/net across locations always reflects
// each location's own commission terms rather than one global rate.
export function sumNetByLocation(
  mrRows: RevenueRow[],
  nmrRows: RevenueRow[],
  agreementsByLocation: Map<string, AgreementTerms>
): { gross: number; net: number } {
  const grossByLocation = new Map<string, number>()
  for (const r of [...mrRows, ...nmrRows]) {
    const key = r.location_id ?? ''
    grossByLocation.set(key, (grossByLocation.get(key) ?? 0) + (r.amount ?? 0))
  }

  let gross = 0
  let net = 0
  for (const [locationId, locGross] of grossByLocation) {
    gross += locGross
    const agreement = locationId ? agreementsByLocation.get(locationId) ?? null : null
    net += locGross - calcRentDeduction(agreement, locGross)
  }
  return { gross, net }
}

function currentMonthBounds() {
  const now = new Date()
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
  const today = now.toISOString().split('T')[0]
  return { monthStart, today }
}

export interface LocationMonthRevenue {
  gross: number
  commission: number
  net: number
  agreement: Agreement | null
  loading: boolean
}

// Current-month gross/commission/net for a single location, used by the
// Commission and Revenue pages (both already scoped to one location at a time).
export function useLocationMonthRevenue(locationId: string): LocationMonthRevenue {
  const [gross, setGross] = useState(0)
  const [agreement, setAgreement] = useState<Agreement | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    if (!locationId) { setGross(0); setAgreement(null); setLoading(false); return }
    setLoading(true)
    const { monthStart, today } = currentMonthBounds()
    const [mrRes, nmrRes, agreeRes] = await Promise.all([
      supabase.from('machine_revenue').select('amount').eq('location_id', locationId).gte('collection_date', monthStart).lte('collection_date', today),
      supabase.from('non_machine_revenue').select('amount').eq('location_id', locationId).gte('date', monthStart).lte('date', today),
      supabase.from('rent_commission_agreements').select('*').eq('location_id', locationId).is('end_date', null).maybeSingle(),
    ])
    const mr = (mrRes.data ?? []).reduce((s, r) => s + (r.amount ?? 0), 0)
    const nmr = (nmrRes.data ?? []).reduce((s, r) => s + (r.amount ?? 0), 0)
    setGross(mr + nmr)
    setAgreement((agreeRes.data as Agreement | null) ?? null)
    setLoading(false)
  }, [locationId])

  useEffect(() => { fetchData() }, [fetchData])

  const commission = calcRentDeduction(agreement, gross)
  return { gross, commission, net: gross - commission, agreement, loading }
}

const pad = (n: number) => String(n).padStart(2, '0')

function monthStartKey(d: Date) { return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-01` }
function monthEndKey(d: Date) {
  const end = new Date(d.getFullYear(), d.getMonth() + 1, 0)
  return `${end.getFullYear()}-${pad(end.getMonth() + 1)}-${pad(end.getDate())}`
}

function agreementActiveInMonth(agreements: Agreement[], monthStartStr: string, monthEndStr: string): Agreement | null {
  return agreements.find(a => a.effective_date <= monthEndStr && (!a.end_date || a.end_date >= monthStartStr)) ?? null
}

// Persists a frozen commission record for every completed month (never the
// current, still-in-progress month) that doesn't already have one. Existing
// rows are never touched — once a month is recorded, it stays fixed even if
// that month's revenue is edited afterward. Months with no active agreement
// are skipped (nothing was owed).
export async function ensureCommissionPeriods(): Promise<void> {
  const now = new Date()
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  const [locsRes, agreementsRes, existingRes, mrRes, nmrRes] = await Promise.all([
    supabase.from('locations').select('id'),
    supabase.from('rent_commission_agreements').select('*'),
    supabase.from('commission_payments').select('location_id,period_month'),
    supabase.from('machine_revenue').select('collection_date,amount,location_id'),
    supabase.from('non_machine_revenue').select('date,amount,location_id'),
  ])

  const existingKeys = new Set((existingRes.data ?? []).map((r: any) => `${r.location_id}|${r.period_month}`))
  const agreementsByLocation = new Map<string, Agreement[]>()
  for (const a of (agreementsRes.data ?? []) as Agreement[]) {
    const list = agreementsByLocation.get(a.location_id) ?? []
    list.push(a)
    agreementsByLocation.set(a.location_id, list)
  }

  const mrRows = mrRes.data ?? []
  const nmrRows = nmrRes.data ?? []

  const rows: { location_id: string; period_month: string; gross_revenue: number; commission_amount: number; net_revenue: number }[] = []

  for (const loc of (locsRes.data ?? []) as { id: string }[]) {
    const agreements = agreementsByLocation.get(loc.id) ?? []
    if (agreements.length === 0) continue

    const earliestEffective = agreements.reduce((min, a) => (a.effective_date < min ? a.effective_date : min), agreements[0].effective_date)
    const start = new Date(earliestEffective + 'T00:00:00')
    let cursor = new Date(start.getFullYear(), start.getMonth(), 1)

    while (cursor < currentMonthStart) {
      const mk = monthStartKey(cursor)
      const key = `${loc.id}|${mk}`
      if (!existingKeys.has(key)) {
        const mek = monthEndKey(cursor)
        const agreement = agreementActiveInMonth(agreements, mk, mek)
        if (agreement) {
          const monthPrefix = mk.slice(0, 7)
          const gross =
            mrRows.filter((r: any) => r.location_id === loc.id && (r.collection_date ?? '').startsWith(monthPrefix)).reduce((s: number, r: any) => s + (r.amount ?? 0), 0) +
            nmrRows.filter((r: any) => r.location_id === loc.id && (r.date ?? '').startsWith(monthPrefix)).reduce((s: number, r: any) => s + (r.amount ?? 0), 0)
          const commission = calcRentDeduction(agreement, gross)
          rows.push({ location_id: loc.id, period_month: mk, gross_revenue: gross, commission_amount: commission, net_revenue: gross - commission })
        }
      }
      cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1)
    }
  }

  if (rows.length === 0) return
  await supabase.from('commission_payments').upsert(rows, { onConflict: 'location_id,period_month', ignoreDuplicates: true })
}

// Finds whichever agreement was active during a given (already-recorded)
// commission period and returns its plain-language description — used to
// render agreement terms on a generated payout letter without storing a
// redundant copy on commission_payments itself.
export async function getAgreementDescriptionForPeriod(locationId: string, periodMonth: string): Promise<string> {
  const { data } = await supabase.from('rent_commission_agreements').select('*').eq('location_id', locationId)
  const agreements = (data ?? []) as Agreement[]
  const monthDate = new Date(periodMonth + 'T00:00:00')
  const monthEndStr = monthEndKey(monthDate)
  const agreement = agreementActiveInMonth(agreements, periodMonth, monthEndStr)
  return describeAgreement(agreement)
}

export async function setCommissionPaid(id: string, paid: boolean): Promise<{ error: unknown }> {
  const { error } = await supabase
    .from('commission_payments')
    .update({ paid, paid_date: paid ? new Date().toISOString().split('T')[0] : null })
    .eq('id', id)
  return { error }
}
