import { useState, useEffect } from 'react'
import { Printer, X } from 'lucide-react'
import type { CommissionPayment } from './types'
import type { Location } from '../locations/types'
import { getAgreementDescriptionForPeriod } from './calcPayout'

interface Props {
  payment: CommissionPayment
  location: Location
  onClose: () => void
}

function formatMoney(v: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(v)
}

function formatPeriodLabel(periodMonth: string) {
  return new Date(periodMonth + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

function formatToday() {
  return new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

// All values below the static header come straight from the passed-in
// commission_payments row and location record — no recalculation of the
// payout happens here, only formatting/display of already-stored figures.
export function CommissionLetterModal({ payment, location, onClose }: Props) {
  const [agreementText, setAgreementText] = useState('Loading…')

  useEffect(() => {
    let cancelled = false
    getAgreementDescriptionForPeriod(payment.location_id, payment.period_month).then(text => {
      if (!cancelled) setAgreementText(text)
    })
    return () => { cancelled = true }
  }, [payment])

  return (
    <div
      className="commission-letter-backdrop"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.6)',
        zIndex: 1000,
        display: 'flex',
        justifyContent: 'center',
        overflowY: 'auto',
        padding: '40px 20px',
      }}
    >
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .commission-letter, .commission-letter * { visibility: visible; }
          .commission-letter { position: absolute; top: 0; left: 0; width: 100%; box-shadow: none !important; }
          .no-print { display: none !important; }
          @page { margin: 1in; }
        }
      `}</style>

      <div
        style={{
          backgroundColor: '#ffffff',
          color: '#000000',
          width: '8.5in',
          maxWidth: '100%',
          minHeight: '11in',
          padding: '1in',
          boxShadow: '0 4px 24px rgba(0,0,0,0.35)',
          position: 'relative',
        }}
      >
        <div className="no-print" style={{ position: 'absolute', top: '16px', right: '16px', display: 'flex', gap: '8px' }}>
          <button
            onClick={() => window.print()}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', backgroundColor: '#222', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '13px' }}
          >
            <Printer size={14} />
            Print
          </button>
          <button
            onClick={onClose}
            title="Close"
            style={{ display: 'flex', alignItems: 'center', padding: '8px 10px', backgroundColor: '#eee', color: '#222', border: '1px solid #ccc', borderRadius: '4px', cursor: 'pointer' }}
          >
            <X size={14} />
          </button>
        </div>

        <div className="commission-letter" style={{ fontFamily: 'Georgia, "Times New Roman", serif', fontSize: '14px', lineHeight: 1.6, color: '#000000' }}>
          <div style={{ marginBottom: '36px' }}>
            <div style={{ fontWeight: 'bold', fontSize: '17px' }}>Triangle Coin Operations</div>
            <div>825 Ivy Meadow Lane, Durham, North Carolina 27707</div>
            <div>(706) 505-3925</div>
          </div>

          <div style={{ marginBottom: '28px' }}>{formatToday()}</div>

          <div style={{ marginBottom: '28px' }}>
            <div>{location.name}</div>
            {location.address && <div>{location.address}</div>}
          </div>

          <div style={{ marginBottom: '20px' }}>
            Re: Commission payout for {formatPeriodLabel(payment.period_month)}
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', margin: '28px 0' }}>
            <tbody>
              <tr>
                <td style={{ padding: '10px 0', borderBottom: '1px solid #000' }}>Period Collected</td>
                <td style={{ padding: '10px 0', borderBottom: '1px solid #000', textAlign: 'right' }}>{formatPeriodLabel(payment.period_month)}</td>
              </tr>
              <tr>
                <td style={{ padding: '10px 0', borderBottom: '1px solid #000' }}>Total Revenue Collected</td>
                <td style={{ padding: '10px 0', borderBottom: '1px solid #000', textAlign: 'right' }}>{formatMoney(payment.gross_revenue)}</td>
              </tr>
              <tr>
                <td style={{ padding: '10px 0', borderBottom: '1px solid #000' }}>Agreement Terms</td>
                <td style={{ padding: '10px 0', borderBottom: '1px solid #000', textAlign: 'right' }}>{agreementText}</td>
              </tr>
              <tr>
                <td style={{ padding: '14px 0', fontWeight: 'bold', fontSize: '16px' }}>Payout Total Owed</td>
                <td style={{ padding: '14px 0', textAlign: 'right', fontWeight: 'bold', fontSize: '16px' }}>{formatMoney(payment.commission_amount)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
