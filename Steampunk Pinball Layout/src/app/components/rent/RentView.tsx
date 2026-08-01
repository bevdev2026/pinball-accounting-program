import { useState, useEffect, useCallback } from 'react'
import { Plus, Pencil } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Agreement } from './types'
import { RentAgreementForm } from './RentAgreementForm'
import { useLocationMonthRevenue } from './calcPayout'
import { Button } from '../ui/button'
import { useActiveLocation, ALL_LOCATIONS_ID } from '../../context/LocationContext'

function formatDate(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatMoney(v: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(v)
}

function formatRate(v: number) {
  return (v * 100).toFixed(2).replace(/\.?0+$/, '') + '%'
}

function describeAgreement(a: Agreement) {
  if (a.type === 'flat_fee') {
    return `${formatMoney(a.flat_fee_amount!)} flat fee per collection period`
  }
  if (a.type === 'percentage') {
    return `${formatRate(a.percentage_rate!)} of gross revenue`
  }
  // combination
  const parts = [`${formatMoney(a.flat_fee_amount!)} flat fee`]
  if (a.revenue_threshold != null) {
    parts.push(`+ ${formatRate(a.percentage_rate!)} of gross revenue above ${formatMoney(a.revenue_threshold)}`)
  } else {
    parts.push(`+ ${formatRate(a.percentage_rate!)} of gross revenue`)
  }
  return parts.join(' ')
}

const TYPE_LABEL: Record<string, string> = {
  flat_fee: 'FLAT FEE',
  percentage: 'PERCENTAGE',
  combination: 'COMBINATION',
}

const TYPE_COLOR: Record<string, string> = {
  flat_fee: 'var(--gold-base)',
  percentage: 'var(--steel-light)',
  combination: 'var(--patina-light)',
}

const colHeader: React.CSSProperties = {
  fontFamily: 'var(--font-heading)',
  fontSize: '10px',
  letterSpacing: '0.12em',
  color: 'var(--text-muted)',
  padding: '10px 12px',
}

export function RentView() {
  const { activeLocationId } = useActiveLocation()
  const showingAllLocations = activeLocationId === ALL_LOCATIONS_ID
  const [agreements, setAgreements] = useState<Agreement[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const payout = useLocationMonthRevenue(showingAllLocations ? '' : activeLocationId)
  const monthLabel = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }).toUpperCase()

  const fetchAgreements = useCallback(async () => {
    if (!activeLocationId || showingAllLocations) { setAgreements([]); setLoading(false); return }
    setLoading(true)
    const { data } = await supabase
      .from('rent_commission_agreements')
      .select('*')
      .eq('location_id', activeLocationId)
      .order('effective_date', { ascending: false })
    if (data) setAgreements(data as Agreement[])
    setLoading(false)
  }, [activeLocationId, showingAllLocations])

  useEffect(() => { fetchAgreements() }, [fetchAgreements])

  const activeAgreement = agreements.find(a => !a.end_date) ?? null
  const historyAgreements = agreements.filter(a => a.end_date !== null)

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-3xl tracking-wide" style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-heading)' }}>
            Rent & Commission
          </h2>
          <p className="text-sm tracking-wider opacity-70 mt-1" style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-secondary)' }}>
            CONTRA REVENUE — DEDUCTED FROM GROSS
          </p>
        </div>
        {!showingAllLocations && (
          <Button
            onClick={() => setShowForm(true)}
            style={{ backgroundColor: 'var(--copper-base)', color: 'var(--text-heading)' }}
          >
            {activeAgreement ? <Pencil size={15} /> : <Plus size={15} />}
            {activeAgreement ? 'Update Agreement' : 'Set Agreement'}
          </Button>
        )}
      </div>

      {showingAllLocations ? (
        <div className="p-8 text-center" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-body)', fontSize: '14px' }}>
          Select a specific location from the sidebar to view and manage Rent & Commission.
        </div>
      ) : (
        <>
      {/* Active agreement card */}
      <div
        style={{
          backgroundColor: 'var(--bg-surface)',
          border: `1px solid ${activeAgreement ? 'var(--copper-base)' : 'var(--copper-dark)'}`,
          borderRadius: 'var(--radius-md)',
          padding: '20px 24px',
        }}
      >
        {loading ? (
          <div style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-heading)', fontSize: '12px', letterSpacing: '0.1em' }}>LOADING…</div>
        ) : activeAgreement ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span style={{ fontFamily: 'var(--font-heading)', fontSize: '9px', letterSpacing: '0.15em', color: 'var(--bg-void)', backgroundColor: TYPE_COLOR[activeAgreement.type], padding: '3px 8px', borderRadius: '999px', fontWeight: 'bold' }}>
                {TYPE_LABEL[activeAgreement.type]}
              </span>
              <span style={{ fontFamily: 'var(--font-heading)', fontSize: '9px', letterSpacing: '0.15em', color: 'var(--patina-light)', backgroundColor: 'rgba(88,166,134,0.15)', border: '1px solid var(--patina-light)', padding: '3px 8px', borderRadius: '999px', opacity: 0.9 }}>
                ACTIVE
              </span>
            </div>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: '18px', color: 'var(--text-heading)', fontWeight: 500 }}>
              {describeAgreement(activeAgreement)}
            </div>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: '11px', letterSpacing: '0.1em', color: 'var(--text-muted)' }}>
              EFFECTIVE {formatDate(activeAgreement.effective_date)}
            </div>
            {activeAgreement.notes && (
              <div style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--text-secondary)', opacity: 0.8 }}>
                {activeAgreement.notes}
              </div>
            )}

            <div style={{ borderTop: '1px solid var(--copper-dark)', paddingTop: '14px', marginTop: '4px' }}>
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: '10px', letterSpacing: '0.12em', color: 'var(--text-muted)', marginBottom: '10px' }}>
                {monthLabel} PAYOUT (MONTH-TO-DATE)
              </div>
              {payout.loading ? (
                <div style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-heading)', fontSize: '11px', letterSpacing: '0.08em' }}>CALCULATING…</div>
              ) : (
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <div style={{ fontFamily: 'var(--font-heading)', fontSize: '9px', letterSpacing: '0.1em', color: 'var(--text-muted)' }}>GROSS REVENUE</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '18px', color: 'var(--text-heading)', marginTop: '3px' }}>{formatMoney(payout.gross)}</div>
                  </div>
                  <div>
                    <div style={{ fontFamily: 'var(--font-heading)', fontSize: '9px', letterSpacing: '0.1em', color: 'var(--text-muted)' }}>COMMISSION OWED</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '18px', color: 'var(--destructive)', marginTop: '3px' }}>-{formatMoney(payout.commission)}</div>
                  </div>
                  <div>
                    <div style={{ fontFamily: 'var(--font-heading)', fontSize: '9px', letterSpacing: '0.1em', color: 'var(--text-muted)' }}>NET TO VENUE</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '18px', color: 'var(--gold-base)', fontWeight: 'bold', marginTop: '3px' }}>{formatMoney(payout.net)}</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: '12px', letterSpacing: '0.12em', color: 'var(--text-muted)' }}>
              NO ACTIVE AGREEMENT
            </div>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--text-muted)', opacity: 0.7 }}>
              Set your venue agreement to begin calculating net revenue.
            </div>
          </div>
        )}
      </div>

      {/* Agreement history */}
      {!loading && agreements.length > 0 && (
        <div>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: '11px', letterSpacing: '0.15em', color: 'var(--text-muted)', marginBottom: '10px' }}>
            AGREEMENT HISTORY
          </div>
          <div style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--copper-dark)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
            <div className="grid" style={{ gridTemplateColumns: '130px 130px 130px 1fr', borderBottom: '1px solid var(--copper-dark)' }}>
              <div style={colHeader}>EFFECTIVE</div>
              <div style={colHeader}>ENDED</div>
              <div style={colHeader}>TYPE</div>
              <div style={colHeader}>TERMS</div>
            </div>
            {agreements.map((a, i) => {
              const isLast = i === agreements.length - 1
              return (
                <div
                  key={a.id}
                  className="grid items-center"
                  style={{ gridTemplateColumns: '130px 130px 130px 1fr', borderBottom: isLast ? 'none' : '1px solid rgba(107,46,18,0.25)' }}
                >
                  <div style={{ padding: '12px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', fontSize: '13px' }}>
                    {formatDate(a.effective_date)}
                  </div>
                  <div style={{ padding: '12px' }}>
                    {a.end_date ? (
                      <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', fontSize: '13px' }}>
                        {formatDate(a.end_date)}
                      </span>
                    ) : (
                      <span style={{ fontFamily: 'var(--font-heading)', fontSize: '9px', letterSpacing: '0.12em', color: 'var(--patina-light)', backgroundColor: 'rgba(88,166,134,0.12)', border: '1px solid var(--patina-light)', padding: '3px 7px', borderRadius: '999px' }}>
                        CURRENT
                      </span>
                    )}
                  </div>
                  <div style={{ padding: '12px' }}>
                    <span style={{ fontFamily: 'var(--font-heading)', fontSize: '9px', letterSpacing: '0.1em', color: 'var(--bg-void)', backgroundColor: TYPE_COLOR[a.type], padding: '2px 7px', borderRadius: '999px' }}>
                      {TYPE_LABEL[a.type]}
                    </span>
                  </div>
                  <div style={{ padding: '12px', fontFamily: 'var(--font-body)', color: 'var(--text-muted)', fontSize: '13px' }}>
                    {describeAgreement(a)}
                    {a.notes && (
                      <span style={{ marginLeft: '8px', opacity: 0.6, fontStyle: 'italic' }}>— {a.notes}</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: '11px', letterSpacing: '0.1em', color: 'var(--text-muted)', marginTop: '10px' }}>
            {historyAgreements.length} PAST {historyAgreements.length === 1 ? 'AGREEMENT' : 'AGREEMENTS'}
          </div>
        </div>
      )}
        </>
      )}

      {showForm && (
        <RentAgreementForm
          activeAgreement={activeAgreement}
          locationId={activeLocationId}
          onSave={fetchAgreements}
          onClose={() => setShowForm(false)}
        />
      )}
    </div>
  )
}
