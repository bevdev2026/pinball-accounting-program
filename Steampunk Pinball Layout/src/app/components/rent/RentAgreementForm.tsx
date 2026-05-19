import { useState } from 'react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import type { Agreement, RentCommissionType } from './types'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog'
import { Button } from '../ui/button'

interface Props {
  activeAgreement: Agreement | null
  locationId: string
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

const TYPE_OPTIONS: { value: RentCommissionType; label: string; description: string }[] = [
  { value: 'flat_fee', label: 'Flat Fee', description: 'Fixed amount per period' },
  { value: 'percentage', label: 'Percentage', description: '% of gross revenue' },
  { value: 'combination', label: 'Combination', description: 'Flat fee + % above threshold' },
]

export function RentAgreementForm({ activeAgreement, locationId, onSave, onClose }: Props) {
  const [type, setType] = useState<RentCommissionType>('flat_fee')
  const [effectiveDate, setEffectiveDate] = useState(new Date().toISOString().split('T')[0])
  const [flatFee, setFlatFee] = useState('')
  const [rate, setRate] = useState('')
  const [threshold, setThreshold] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    if (!effectiveDate) { toast.error('Effective date is required.'); return }

    if ((type === 'flat_fee' || type === 'combination') && (!flatFee || isNaN(parseFloat(flatFee)) || parseFloat(flatFee) < 0)) {
      toast.error('Enter a valid flat fee amount.'); return
    }
    if ((type === 'percentage' || type === 'combination') && (!rate || isNaN(parseFloat(rate)) || parseFloat(rate) <= 0 || parseFloat(rate) > 100)) {
      toast.error('Enter a valid percentage rate (0–100).'); return
    }
    if (type === 'combination' && (!threshold || isNaN(parseFloat(threshold)) || parseFloat(threshold) < 0)) {
      toast.error('Enter a valid revenue threshold.'); return
    }

    if (activeAgreement) {
      if (effectiveDate <= activeAgreement.effective_date) {
        toast.error('Effective date must be after the current agreement\'s effective date.')
        return
      }
    }

    setSaving(true)
    try {
      // Close the current active agreement
      if (activeAgreement) {
        const endDate = new Date(effectiveDate)
        endDate.setDate(endDate.getDate() - 1)
        const { error: closeErr } = await supabase
          .from('rent_commission_agreements')
          .update({ end_date: endDate.toISOString().split('T')[0] })
          .eq('id', activeAgreement.id)
        if (closeErr) { toast.error('Failed to update previous agreement.'); setSaving(false); return }
      }

      const payload = {
        location_id: locationId,
        type,
        flat_fee_amount: type !== 'percentage' ? parseFloat(flatFee) : null,
        percentage_rate: type !== 'flat_fee' ? parseFloat(rate) / 100 : null,
        revenue_threshold: type === 'combination' ? parseFloat(threshold) : null,
        effective_date: effectiveDate,
        end_date: null,
        notes: notes.trim() || null,
      }

      const { error } = await supabase.from('rent_commission_agreements').insert(payload)
      if (error) { toast.error('Failed to save agreement.'); setSaving(false); return }

      toast.success('Agreement saved.')
      onSave()
      onClose()
    } catch {
      toast.error('An unexpected error occurred.')
      setSaving(false)
    }
  }

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--copper-dark)' }} className="max-w-lg">
        <DialogHeader>
          <DialogTitle style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-heading)', letterSpacing: '0.1em' }}>
            {activeAgreement ? 'UPDATE AGREEMENT' : 'SET AGREEMENT'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-1">
          {/* Type selector */}
          <div>
            <label style={labelStyle}>Agreement Type *</label>
            <div className="grid grid-cols-3 gap-2">
              {TYPE_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setType(opt.value)}
                  style={{
                    padding: '10px 8px',
                    borderRadius: 'var(--radius-sm)',
                    border: `1px solid ${type === opt.value ? 'var(--copper-base)' : 'var(--copper-dark)'}`,
                    backgroundColor: type === opt.value ? 'rgba(139,90,43,0.15)' : 'var(--bg-elevated)',
                    cursor: 'pointer',
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontFamily: 'var(--font-heading)', fontSize: '11px', letterSpacing: '0.1em', color: type === opt.value ? 'var(--copper-bright)' : 'var(--text-muted)' }}>
                    {opt.label.toUpperCase()}
                  </div>
                  <div style={{ fontFamily: 'var(--font-body)', fontSize: '11px', color: 'var(--text-muted)', marginTop: '3px', opacity: 0.7 }}>
                    {opt.description}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Effective date */}
          <div>
            <label style={labelStyle}>Effective Date *</label>
            <input
              style={{ ...inputStyle, colorScheme: 'dark' }}
              type="date"
              value={effectiveDate}
              onChange={e => setEffectiveDate(e.target.value)}
            />
            {activeAgreement && (
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: '10px', letterSpacing: '0.08em', color: 'var(--text-muted)', marginTop: '5px', opacity: 0.7 }}>
                Must be after {new Date(activeAgreement.effective_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </div>
            )}
          </div>

          {/* Amount fields */}
          <div className="grid grid-cols-2 gap-4">
            {(type === 'flat_fee' || type === 'combination') && (
              <div>
                <label style={labelStyle}>Flat Fee Amount *</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '14px' }}>$</span>
                  <input
                    style={{ ...inputStyle, paddingLeft: '24px', fontFamily: 'var(--font-mono)' }}
                    type="number"
                    min="0"
                    step="0.01"
                    value={flatFee}
                    onChange={e => setFlatFee(e.target.value)}
                    placeholder="0.00"
                    autoFocus
                  />
                </div>
              </div>
            )}

            {(type === 'percentage' || type === 'combination') && (
              <div>
                <label style={labelStyle}>Percentage Rate *</label>
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
                    autoFocus={type === 'percentage'}
                  />
                  <span style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '14px' }}>%</span>
                </div>
              </div>
            )}
          </div>

          {type === 'combination' && (
            <div>
              <label style={labelStyle}>Revenue Threshold * <span style={{ opacity: 0.6, textTransform: 'none', letterSpacing: 0 }}>— % applies to gross above this amount</span></label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '14px' }}>$</span>
                <input
                  style={{ ...inputStyle, paddingLeft: '24px', fontFamily: 'var(--font-mono)' }}
                  type="number"
                  min="0"
                  step="0.01"
                  value={threshold}
                  onChange={e => setThreshold(e.target.value)}
                  placeholder="0.00"
                />
              </div>
            </div>
          )}

          <div>
            <label style={labelStyle}>Notes (optional)</label>
            <textarea
              style={{ ...inputStyle, minHeight: '64px', resize: 'vertical' }}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Any additional terms or context…"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={saving} style={{ color: 'var(--text-muted)' }}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving} style={{ backgroundColor: 'var(--copper-base)', color: 'var(--text-heading)' }}>
            {saving ? 'Saving…' : 'Save Agreement'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
