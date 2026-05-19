import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { Plus, Trash2, TableProperties } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Loan } from './types'
import { calcLoanStatus, calcAmortizationSchedule } from './calcLoanStatus'
import type { ScheduleRow } from './calcLoanStatus'
import { LoanForm } from './LoanForm'
import { AmortizationSchedule } from './AmortizationSchedule'
import { Button } from '../ui/button'

function formatMoney(v: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(v)
}

function formatDate(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const FREQ_LABEL: Record<string, string> = { weekly: '/week', biweekly: '/bi-week', monthly: '/month' }
const COMP_LABEL: Record<string, string> = { daily: 'Daily', weekly: 'Weekly', monthly: 'Monthly' }

export function LiabilitiesView() {
  const [loans, setLoans] = useState<Loan[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [scheduleData, setScheduleData] = useState<{ loan: Loan; rows: ScheduleRow[] } | null>(null)

  const fetchLoans = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase.from('loans').select('*').order('created_at', { ascending: false })
    if (data) setLoans(data as Loan[])
    setLoading(false)
  }, [])

  useEffect(() => { fetchLoans() }, [fetchLoans])

  async function handleDelete(id: string) {
    setDeleting(true)
    const { error } = await supabase.from('loans').delete().eq('id', id)
    if (error) { toast.error('Failed to delete loan.') } else { toast.success('Loan removed.'); fetchLoans() }
    setConfirmDelete(null)
    setDeleting(false)
  }

  // Summary totals
  const activeLoanStatuses = loans.map(l => ({ loan: l, status: calcLoanStatus(l) }))
  const totalRemaining = activeLoanStatuses.reduce((sum, { status }) => sum + status.remainingBalance, 0)
  const totalPaidAll = activeLoanStatuses.reduce((sum, { status }) => sum + status.totalPaid, 0)

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-3xl tracking-wide" style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-heading)' }}>
            Liabilities
          </h2>
          <p className="text-sm tracking-wider opacity-70 mt-1" style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-secondary)' }}>
            STARTUP LOANS & FINANCING
          </p>
        </div>
        <Button
          onClick={() => setShowForm(true)}
          style={{ backgroundColor: 'var(--copper-base)', color: 'var(--text-heading)' }}
        >
          <Plus size={15} />
          Add Loan
        </Button>
      </div>

      {/* Summary bar */}
      {!loading && loans.length > 1 && (
        <div
          className="p-4 rounded-lg"
          style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--copper-dark)' }}
        >
          <div className="flex gap-10">
            <div>
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: '10px', letterSpacing: '0.12em', color: 'var(--text-muted)' }}>TOTAL REMAINING</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '22px', color: 'var(--destructive)', marginTop: '4px', fontWeight: 'bold' }}>
                {formatMoney(totalRemaining)}
              </div>
            </div>
            <div style={{ borderLeft: '1px solid var(--copper-dark)', paddingLeft: '32px' }}>
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: '10px', letterSpacing: '0.12em', color: 'var(--text-muted)' }}>TOTAL PAID TO DATE</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '22px', color: 'var(--patina-light)', marginTop: '4px', fontWeight: 'bold' }}>
                {formatMoney(totalPaidAll)}
              </div>
            </div>
            <div style={{ borderLeft: '1px solid var(--copper-dark)', paddingLeft: '32px' }}>
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: '10px', letterSpacing: '0.12em', color: 'var(--text-muted)' }}>ACTIVE LOANS</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '22px', color: 'var(--text-heading)', marginTop: '4px', fontWeight: 'bold' }}>
                {loans.filter(l => !calcLoanStatus(l).isFullyPaid).length}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Loan cards */}
      {loading ? (
        <div className="p-8 text-center" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-heading)', fontSize: '12px', letterSpacing: '0.1em' }}>LOADING…</div>
      ) : loans.length === 0 ? (
        <div
          style={{
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--copper-dark)',
            borderRadius: 'var(--radius-md)',
            padding: '48px',
            textAlign: 'center',
          }}
        >
          <div style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'var(--text-muted)' }}>
            No loans recorded. Add your first loan to begin tracking liabilities.
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {activeLoanStatuses.map(({ loan, status }) => {
            const pctPaid = loan.principal_amount > 0
              ? Math.min(1, (loan.principal_amount - status.remainingBalance) / loan.principal_amount)
              : 0
            const isDeleting = confirmDelete === loan.id

            return (
              <div
                key={loan.id}
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  border: `1px solid ${status.isFullyPaid ? 'var(--patina-light)' : 'var(--copper-dark)'}`,
                  borderRadius: 'var(--radius-md)',
                  padding: '20px 24px',
                  opacity: status.isFullyPaid ? 0.75 : 1,
                }}
              >
                {/* Card header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '16px', letterSpacing: '0.05em', color: 'var(--text-heading)' }}>
                      {loan.name}
                    </h3>
                    <span style={{
                      fontFamily: 'var(--font-heading)',
                      fontSize: '9px',
                      letterSpacing: '0.12em',
                      padding: '2px 8px',
                      borderRadius: '999px',
                      backgroundColor: status.isFullyPaid ? 'rgba(88,166,134,0.15)' : 'rgba(139,90,43,0.15)',
                      color: status.isFullyPaid ? 'var(--patina-light)' : 'var(--copper-bright)',
                      border: `1px solid ${status.isFullyPaid ? 'var(--patina-light)' : 'var(--copper-dark)'}`,
                    }}>
                      {status.isFullyPaid ? 'PAID OFF' : 'ACTIVE'}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setScheduleData({ loan, rows: calcAmortizationSchedule(loan) })}
                      title="View amortization schedule"
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px', display: 'flex', alignItems: 'center', gap: '4px', fontFamily: 'var(--font-heading)', fontSize: '10px', letterSpacing: '0.1em' }}
                    >
                      <TableProperties size={13} />
                      Schedule
                    </button>
                    <div style={{ width: '1px', height: '16px', backgroundColor: 'var(--copper-dark)', opacity: 0.5 }} />
                    {isDeleting ? (
                      <div className="flex items-center gap-1">
                        <span style={{ fontFamily: 'var(--font-heading)', fontSize: '10px', color: 'var(--destructive)', letterSpacing: '0.05em' }}>DELETE?</span>
                        <button onClick={() => handleDelete(loan.id)} disabled={deleting} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--destructive)', fontFamily: 'var(--font-heading)', fontSize: '11px', padding: '2px 5px' }}>Y</button>
                        <button onClick={() => setConfirmDelete(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontFamily: 'var(--font-heading)', fontSize: '11px', padding: '2px 5px' }}>N</button>
                      </div>
                    ) : (
                      <button onClick={() => setConfirmDelete(loan.id)} title="Delete loan" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--destructive)', opacity: 0.6, padding: '4px' }}>
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Key figures */}
                <div className="flex gap-10 mb-4">
                  <div>
                    <div style={{ fontFamily: 'var(--font-heading)', fontSize: '10px', letterSpacing: '0.12em', color: 'var(--text-muted)' }}>REMAINING BALANCE</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '26px', color: status.isFullyPaid ? 'var(--patina-light)' : 'var(--destructive)', marginTop: '4px', fontWeight: 'bold' }}>
                      {formatMoney(status.remainingBalance)}
                    </div>
                  </div>
                  <div style={{ borderLeft: '1px solid var(--copper-dark)', paddingLeft: '32px' }}>
                    <div style={{ fontFamily: 'var(--font-heading)', fontSize: '10px', letterSpacing: '0.12em', color: 'var(--text-muted)' }}>TOTAL PAID</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '26px', color: 'var(--patina-light)', marginTop: '4px', fontWeight: 'bold' }}>
                      {formatMoney(status.totalPaid)}
                    </div>
                  </div>
                  <div style={{ borderLeft: '1px solid var(--copper-dark)', paddingLeft: '32px' }}>
                    <div style={{ fontFamily: 'var(--font-heading)', fontSize: '10px', letterSpacing: '0.12em', color: 'var(--text-muted)' }}>PAYMENT</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '20px', color: 'var(--text-heading)', marginTop: '4px' }}>
                      {formatMoney(status.paymentAmount)}<span style={{ fontSize: '12px', color: 'var(--text-muted)', marginLeft: '3px' }}>{FREQ_LABEL[loan.payment_frequency]}</span>
                    </div>
                  </div>
                </div>

                {/* Progress bar */}
                <div style={{ height: '4px', backgroundColor: 'var(--bg-elevated)', borderRadius: '999px', marginBottom: '14px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${pctPaid * 100}%`, backgroundColor: status.isFullyPaid ? 'var(--patina-light)' : 'var(--copper-base)', borderRadius: '999px', transition: 'width 0.3s' }} />
                </div>

                {/* Loan details row */}
                <div className="flex gap-6 flex-wrap">
                  {[
                    { label: 'PRINCIPAL', value: formatMoney(loan.principal_amount) },
                    { label: 'RATE', value: `${(loan.interest_rate * 100).toFixed(2)}% APR` },
                    { label: 'COMPOUNDING', value: COMP_LABEL[loan.compounding_interval] },
                    { label: 'TERM', value: `${loan.loan_term_months} months` },
                    { label: 'STARTED', value: formatDate(loan.start_date) },
                    { label: 'PAYMENTS', value: `${status.paymentsMade} of ${status.paymentsTotal}` },
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <div style={{ fontFamily: 'var(--font-heading)', fontSize: '9px', letterSpacing: '0.12em', color: 'var(--text-muted)' }}>{label}</div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>{value}</div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showForm && (
        <LoanForm onSave={fetchLoans} onClose={() => setShowForm(false)} />
      )}

      {scheduleData && (
        <AmortizationSchedule
          loan={scheduleData.loan}
          schedule={scheduleData.rows}
          onClose={() => setScheduleData(null)}
        />
      )}
    </div>
  )
}
