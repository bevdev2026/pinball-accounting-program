import type { Loan } from './types'
import type { ScheduleRow } from './calcLoanStatus'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog'

interface Props {
  loan: Loan
  schedule: ScheduleRow[]
  onClose: () => void
}

function fmt(v: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(v)
}

function fmtDate(d: Date) {
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const colHeader: React.CSSProperties = {
  fontFamily: 'var(--font-heading)',
  fontSize: '9px',
  letterSpacing: '0.12em',
  color: 'var(--text-muted)',
  padding: '8px 10px',
  position: 'sticky' as const,
  top: 0,
  backgroundColor: 'var(--bg-elevated)',
  borderBottom: '1px solid var(--copper-dark)',
  zIndex: 1,
}

const STATUS_STYLE: Record<ScheduleRow['status'], React.CSSProperties> = {
  paid: { opacity: 0.45 },
  next: { backgroundColor: 'rgba(139,90,43,0.12)' },
  upcoming: {},
}

export function AmortizationSchedule({ loan, schedule, onClose }: Props) {
  const totalInterest = schedule.reduce((s, r) => s + r.interest, 0)
  const totalPrincipal = schedule.reduce((s, r) => s + r.principal, 0)
  const totalPaid = schedule.reduce((s, r) => s + r.amount, 0)
  const paidRows = schedule.filter(r => r.status === 'paid')
  const nextRow = schedule.find(r => r.status === 'next')
  const interestPaid = paidRows.reduce((s, r) => s + r.interest, 0)
  const principalPaid = paidRows.reduce((s, r) => s + r.principal, 0)

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent
        style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--copper-dark)', maxWidth: '780px', width: '95vw' }}
      >
        <DialogHeader>
          <DialogTitle style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-heading)', letterSpacing: '0.08em' }}>
            AMORTIZATION SCHEDULE — {loan.name.toUpperCase()}
          </DialogTitle>
        </DialogHeader>

        {/* Summary strip */}
        <div
          className="grid grid-cols-3 gap-px"
          style={{ backgroundColor: 'var(--copper-dark)', border: '1px solid var(--copper-dark)', borderRadius: 'var(--radius-sm)', overflow: 'hidden', marginBottom: '4px' }}
        >
          {[
            { label: 'TOTAL PAYMENTS', value: fmt(totalPaid) },
            { label: 'TOTAL INTEREST', value: fmt(totalInterest), accent: 'var(--destructive)' },
            { label: 'TOTAL PRINCIPAL', value: fmt(totalPrincipal), accent: 'var(--patina-light)' },
          ].map(({ label, value, accent }) => (
            <div key={label} style={{ backgroundColor: 'var(--bg-elevated)', padding: '10px 14px' }}>
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: '9px', letterSpacing: '0.12em', color: 'var(--text-muted)' }}>{label}</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '15px', color: accent ?? 'var(--text-heading)', marginTop: '3px', fontWeight: 'bold' }}>{value}</div>
            </div>
          ))}
        </div>

        {/* Paid-to-date strip */}
        {paidRows.length > 0 && (
          <div
            className="flex gap-6 items-center"
            style={{ backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--copper-dark)', borderRadius: 'var(--radius-sm)', padding: '8px 14px', marginBottom: '4px' }}
          >
            <span style={{ fontFamily: 'var(--font-heading)', fontSize: '9px', letterSpacing: '0.12em', color: 'var(--text-muted)' }}>
              PAID TO DATE ({paidRows.length} payments)
            </span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--destructive)' }}>
              Interest: {fmt(interestPaid)}
            </span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--patina-light)' }}>
              Principal: {fmt(principalPaid)}
            </span>
          </div>
        )}

        {/* Next payment callout */}
        {nextRow && (
          <div
            style={{
              backgroundColor: 'rgba(139,90,43,0.1)',
              border: '1px solid var(--copper-base)',
              borderRadius: 'var(--radius-sm)',
              padding: '10px 14px',
              marginBottom: '4px',
              display: 'flex',
              alignItems: 'center',
              gap: '24px',
            }}
          >
            <span style={{ fontFamily: 'var(--font-heading)', fontSize: '9px', letterSpacing: '0.12em', color: 'var(--copper-bright)' }}>
              NEXT PAYMENT — #{nextRow.paymentNum} — {fmtDate(nextRow.date)}
            </span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', color: 'var(--text-heading)' }}>
              Total: {fmt(nextRow.amount)}
            </span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', color: 'var(--destructive)' }}>
              Interest: <strong>{fmt(nextRow.interest)}</strong>
            </span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', color: 'var(--patina-light)' }}>
              Principal: <strong>{fmt(nextRow.principal)}</strong>
            </span>
          </div>
        )}

        {/* Schedule table */}
        <div style={{ maxHeight: '380px', overflowY: 'auto', border: '1px solid var(--copper-dark)', borderRadius: 'var(--radius-sm)' }}>
          {/* Header */}
          <div className="grid" style={{ gridTemplateColumns: '52px 120px 110px 110px 110px 120px 64px' }}>
            <div style={colHeader}>#</div>
            <div style={colHeader}>DATE</div>
            <div style={colHeader}>PAYMENT</div>
            <div style={colHeader}>INTEREST</div>
            <div style={colHeader}>PRINCIPAL</div>
            <div style={colHeader}>BALANCE</div>
            <div style={colHeader}>STATUS</div>
          </div>

          {/* Rows */}
          {schedule.map((row, i) => {
            const isLast = i === schedule.length - 1
            return (
              <div
                key={row.paymentNum}
                className="grid items-center"
                style={{
                  gridTemplateColumns: '52px 120px 110px 110px 110px 120px 64px',
                  borderBottom: isLast ? 'none' : '1px solid rgba(107,46,18,0.2)',
                  ...STATUS_STYLE[row.status],
                }}
              >
                <div style={{ padding: '7px 10px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', fontSize: '12px' }}>
                  {row.paymentNum}
                </div>
                <div style={{ padding: '7px 10px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', fontSize: '12px' }}>
                  {fmtDate(row.date)}
                </div>
                <div style={{ padding: '7px 10px', fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', fontSize: '13px' }}>
                  {fmt(row.amount)}
                </div>
                <div style={{ padding: '7px 10px', fontFamily: 'var(--font-mono)', color: row.status !== 'paid' ? 'var(--destructive)' : 'var(--text-muted)', fontSize: '13px', fontWeight: row.status === 'next' ? 'bold' : 'normal' }}>
                  {fmt(row.interest)}
                </div>
                <div style={{ padding: '7px 10px', fontFamily: 'var(--font-mono)', color: row.status !== 'paid' ? 'var(--patina-light)' : 'var(--text-muted)', fontSize: '13px', fontWeight: row.status === 'next' ? 'bold' : 'normal' }}>
                  {fmt(row.principal)}
                </div>
                <div style={{ padding: '7px 10px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', fontSize: '13px' }}>
                  {fmt(row.balance)}
                </div>
                <div style={{ padding: '7px 10px' }}>
                  {row.status === 'paid' && (
                    <span style={{ fontFamily: 'var(--font-heading)', fontSize: '8px', letterSpacing: '0.1em', color: 'var(--text-muted)' }}>PAID</span>
                  )}
                  {row.status === 'next' && (
                    <span style={{ fontFamily: 'var(--font-heading)', fontSize: '8px', letterSpacing: '0.1em', color: 'var(--copper-bright)', backgroundColor: 'rgba(139,90,43,0.2)', padding: '2px 5px', borderRadius: '999px', border: '1px solid var(--copper-dark)' }}>NEXT</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        <div style={{ fontFamily: 'var(--font-heading)', fontSize: '10px', letterSpacing: '0.08em', color: 'var(--text-muted)', opacity: 0.65, marginTop: '2px' }}>
          {schedule.length} payments total · Use the interest amount for each payment to record it as an expense
        </div>
      </DialogContent>
    </Dialog>
  )
}
