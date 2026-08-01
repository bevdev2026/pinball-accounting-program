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
