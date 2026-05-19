import { useState, useMemo } from 'react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import type { CompoundingInterval, PaymentFrequency } from './types'
import { calcPaymentAmount } from './calcLoanStatus'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog'
import { Button } from '../ui/button'

interface Props {
  onSave: () => void
  onClose: () => void
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 12px',
  backgroundColor: 'var(--bg-elevated)',
  border: '1px solid var(--copper-dark)',
  borderRadius: 'var(--radius-sm)',
  color: 'var(--text-primary)',
  fontFamily: 'var(--font-body)',
  fontSize: '15px',
  outline: 'none',
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  marginBottom: '6px',
  fontSize: '11px',
  letterSpacing: '0.15em',
  textTransform: 'uppercase' as const,
  fontFamily: 'var(--font-heading)',
  color: 'var(--text-muted)',
}

function formatMoney(v: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(v)
}

export function LoanForm({ onSave, onClose }: Props) {
  const [name, setName] = useState('')
  const [principal, setPrincipal] = useState('')
  const [rate, setRate] = useState('')
  const [compounding, setCompounding] = useState<CompoundingInterval>('monthly')
  const [termMonths, setTermMonths] = useState('')
  const [frequency, setFrequency] = useState<PaymentFrequency>('monthly')
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0])
  const [saving, setSaving] = useState(false)

  const calculatedPayment = useMemo(() => {
    const p = parseFloat(principal)
    const r = parseFloat(rate)
    const t = parseInt(termMonths)
    if (!p || p <= 0 || isNaN(r) || r < 0 || !t || t <= 0) return null
    return calcPaymentAmount({
      principal_amount: p,
      interest_rate: r / 100,
      compounding_interval: compounding,
      loan_term_months: t,
      payment_frequency: frequency,
    })
  }, [principal, rate, compounding, termMonths, frequency])

  async function handleSave() {
    if (!name.trim()) { toast.error('Loan name is required.'); return }
    const p = parseFloat(principal)
    if (!principal || isNaN(p) || p <= 0) { toast.error('Enter a valid principal amount.'); return }
    const r = parseFloat(rate)
    if (rate === '' || isNaN(r) || r < 0) { toast.error('Enter a valid interest rate.'); return }
    const t = parseInt(termMonths)
    if (!termMonths || isNaN(t) || t <= 0) { toast.error('Enter a valid loan term.'); return }
    if (!startDate) { toast.error('Start date is required.'); return }

    setSaving(true)
    const { error } = await supabase.from('loans').insert({
      name: name.trim(),
      principal_amount: p,
      interest_rate: r / 100,
      compounding_interval: compounding,
      loan_term_months: t,
      payment_frequency: frequency,
      start_date: startDate,
      is_active: true,
    })
    if (error) {
      toast.error('Failed to save loan.')
      setSaving(false)
      return
    }
    toast.success('Loan added.')
    onSave()
    onClose()
  }

  const freqLabel = frequency === 'weekly' ? '/week' : frequency === 'biweekly' ? '/bi-week' : '/month'

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--copper-dark)' }} className="max-w-lg">
        <DialogHeader>
          <DialogTitle style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-heading)', letterSpacing: '0.1em' }}>
            ADD LOAN
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-1">
          <div>
            <label style={labelStyle}>Loan Name *</label>
            <input
              style={inputStyle}
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Equipment Loan — First National"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label style={labelStyle}>Principal Amount *</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '14px' }}>$</span>
                <input
                  style={{ ...inputStyle, paddingLeft: '24px', fontFamily: 'var(--font-mono)' }}
                  type="number"
                  min="0"
                  step="0.01"
                  value={principal}
                  onChange={e => setPrincipal(e.target.value)}
                  placeholder="0.00"
                />
              </div>
            </div>
            <div>
              <label style={labelStyle}>Annual Interest Rate *</label>
              <div style={{ position: 'relative' }}>
                <input
                  style={{ ...inputStyle, paddingRight: '28px', fontFamily: 'var(--font-mono)' }}
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={rate}
                  onChange={e => setRate(e.target.value)}
                  placeholder="0.00"
                />
                <span style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '14px' }}>%</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label style={labelStyle}>Compounding Interval *</label>
              <select
                style={{ ...inputStyle, cursor: 'pointer' }}
                value={compounding}
                onChange={e => setCompounding(e.target.value as CompoundingInterval)}
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Payment Frequency *</label>
              <select
                style={{ ...inputStyle, cursor: 'pointer' }}
                value={frequency}
                onChange={e => setFrequency(e.target.value as PaymentFrequency)}
              >
                <option value="weekly">Weekly</option>
                <option value="biweekly">Bi-Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label style={labelStyle}>Loan Term *</label>
              <div style={{ position: 'relative' }}>
                <input
                  style={{ ...inputStyle, paddingRight: '64px', fontFamily: 'var(--font-mono)' }}
                  type="number"
                  min="1"
                  step="1"
                  value={termMonths}
                  onChange={e => setTermMonths(e.target.value)}
                  placeholder="36"
                />
                <span style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontFamily: 'var(--font-heading)', fontSize: '10px', letterSpacing: '0.1em' }}>MONTHS</span>
              </div>
            </div>
            <div>
              <label style={labelStyle}>Start Date *</label>
              <input
                style={{ ...inputStyle, colorScheme: 'dark' }}
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
              />
            </div>
          </div>

          {/* Calculated payment preview */}
          {calculatedPayment !== null && (
            <div
              style={{
                backgroundColor: 'var(--bg-elevated)',
                border: '1px solid var(--copper-dark)',
                borderRadius: 'var(--radius-sm)',
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <span style={{ fontFamily: 'var(--font-heading)', fontSize: '11px', letterSpacing: '0.12em', color: 'var(--text-muted)' }}>
                CALCULATED PAYMENT
              </span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '18px', color: 'var(--gold-base)', fontWeight: 'bold' }}>
                {formatMoney(calculatedPayment)}<span style={{ fontSize: '12px', color: 'var(--text-muted)', marginLeft: '4px' }}>{freqLabel}</span>
              </span>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={saving} style={{ color: 'var(--text-muted)' }}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving} style={{ backgroundColor: 'var(--copper-base)', color: 'var(--text-heading)' }}>
            {saving ? 'Saving…' : 'Add Loan'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
