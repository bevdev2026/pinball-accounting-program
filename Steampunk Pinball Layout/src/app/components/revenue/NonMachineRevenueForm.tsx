import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import type { NonMachineRevenue, RevenueCategory } from './types'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog'
import { Button } from '../ui/button'

interface Props {
  entry: NonMachineRevenue | null
  categories: RevenueCategory[]
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

export function NonMachineRevenueForm({ entry, categories, locationId, onSave, onClose }: Props) {
  const isEdit = entry !== null
  const [categoryId, setCategoryId] = useState(entry?.category_id ?? categories[0]?.id ?? '')
  const [date, setDate] = useState(entry?.date ?? new Date().toISOString().split('T')[0])
  const [amount, setAmount] = useState(entry?.amount?.toString() ?? '')
  const [notes, setNotes] = useState(entry?.notes ?? '')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setCategoryId(entry?.category_id ?? categories[0]?.id ?? '')
    setDate(entry?.date ?? new Date().toISOString().split('T')[0])
    setAmount(entry?.amount?.toString() ?? '')
    setNotes(entry?.notes ?? '')
  }, [entry, categories])

  async function handleSave() {
    if (!categoryId) { toast.error('Select a category.'); return }
    if (!date) { toast.error('Date is required.'); return }
    const amountVal = parseFloat(amount)
    if (!amount || isNaN(amountVal) || amountVal <= 0) { toast.error('Enter a valid amount.'); return }

    const payload = {
      location_id: locationId,
      date,
      category_id: categoryId,
      amount: amountVal,
      notes: notes.trim() || null,
    }

    setSaving(true)
    if (isEdit) {
      const { error } = await supabase.from('non_machine_revenue').update(payload).eq('id', entry!.id)
      if (error) { toast.error('Failed to update entry.'); setSaving(false); return }
      toast.success('Entry updated.')
    } else {
      const { error } = await supabase.from('non_machine_revenue').insert(payload)
      if (error) { toast.error('Failed to save entry.'); setSaving(false); return }
      toast.success('Entry saved.')
    }

    onSave()
    onClose()
  }

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--copper-dark)' }} className="max-w-md">
        <DialogHeader>
          <DialogTitle style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-heading)', letterSpacing: '0.1em' }}>
            {isEdit ? 'EDIT REVENUE ENTRY' : 'ADD REVENUE ENTRY'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-1">
          {categories.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-body)', fontSize: '14px' }}>
              No categories defined. Add a category first using "Manage Categories".
            </p>
          ) : (
            <>
              <div>
                <label style={labelStyle}>Category *</label>
                <select style={{ ...inputStyle, cursor: 'pointer' }} value={categoryId} onChange={e => setCategoryId(e.target.value)}>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label style={labelStyle}>Date *</label>
                  <input style={{ ...inputStyle, colorScheme: 'dark' }} type="date" value={date} onChange={e => setDate(e.target.value)} />
                </div>
                <div>
                  <label style={labelStyle}>Amount *</label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '14px' }}>$</span>
                    <input
                      style={{ ...inputStyle, paddingLeft: '24px', fontFamily: 'var(--font-mono)' }}
                      type="number"
                      min="0"
                      step="0.01"
                      value={amount}
                      onChange={e => setAmount(e.target.value)}
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label style={labelStyle}>Notes (optional)</label>
                <textarea
                  style={{ ...inputStyle, minHeight: '72px', resize: 'vertical' }}
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Any details…"
                />
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={saving} style={{ color: 'var(--text-muted)' }}>Cancel</Button>
          {categories.length > 0 && (
            <Button onClick={handleSave} disabled={saving} style={{ backgroundColor: 'var(--copper-base)', color: 'var(--text-heading)' }}>
              {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Save Entry'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
