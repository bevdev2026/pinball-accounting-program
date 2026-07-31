import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import type { Expense, ExpenseCategory, ActiveMachine } from './types'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog'
import { Button } from '../ui/button'
import { useActiveLocation } from '../../context/LocationContext'

interface Props {
  expense: Expense | null
  categories: ExpenseCategory[]
  machines: ActiveMachine[]
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

export function ExpenseForm({ expense, categories, machines, onSave, onClose }: Props) {
  const isEdit = expense !== null
  const { locations } = useActiveLocation()
  const [date, setDate] = useState(expense?.date ?? new Date().toISOString().split('T')[0])
  const [locationId, setLocationId] = useState(expense?.location_id ?? '')
  const [categoryId, setCategoryId] = useState(expense?.category_id ?? categories[0]?.id ?? '')
  const [amount, setAmount] = useState(expense?.amount?.toString() ?? '')
  const [description, setDescription] = useState(expense?.description ?? '')
  const [machineId, setMachineId] = useState(expense?.machine_id ?? '')
  const [fileUrl, setFileUrl] = useState(expense?.file_url ?? '')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setDate(expense?.date ?? new Date().toISOString().split('T')[0])
    setLocationId(expense?.location_id ?? '')
    setCategoryId(expense?.category_id ?? categories[0]?.id ?? '')
    setAmount(expense?.amount?.toString() ?? '')
    setDescription(expense?.description ?? '')
    setMachineId(expense?.machine_id ?? '')
    setFileUrl(expense?.file_url ?? '')
  }, [expense, categories])

  async function handleSave() {
    if (!date) { toast.error('Date is required.'); return }
    if (!categoryId) { toast.error('Select a category.'); return }
    const amountVal = parseFloat(amount)
    if (!amount || isNaN(amountVal) || amountVal <= 0) { toast.error('Enter a valid amount.'); return }

    const payload = {
      location_id: locationId || null,
      date,
      category_id: categoryId,
      amount: amountVal,
      description: description.trim() || null,
      machine_id: machineId || null,
      file_url: fileUrl.trim() || null,
    }

    setSaving(true)
    if (isEdit) {
      const { error } = await supabase.from('expenses').update(payload).eq('id', expense!.id)
      if (error) { toast.error('Failed to update expense.'); setSaving(false); return }
      toast.success('Expense updated.')
    } else {
      const { error } = await supabase.from('expenses').insert({ ...payload, source: 'manual' })
      if (error) { toast.error('Failed to save expense.'); setSaving(false); return }
      toast.success('Expense saved.')
    }
    onSave()
    onClose()
  }

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--copper-dark)' }} className="max-w-lg">
        <DialogHeader>
          <DialogTitle style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-heading)', letterSpacing: '0.1em' }}>
            {isEdit ? 'EDIT EXPENSE' : 'ADD EXPENSE'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-1">
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
                  autoFocus={!isEdit}
                />
              </div>
            </div>
          </div>

          <div>
            <label style={labelStyle}>Location (optional)</label>
            <select style={{ ...inputStyle, cursor: 'pointer' }} value={locationId} onChange={e => setLocationId(e.target.value)}>
              <option value="">— No specific location (business-wide) —</option>
              {locations.map(loc => <option key={loc.id} value={loc.id}>{loc.name}</option>)}
            </select>
          </div>

          <div>
            <label style={labelStyle}>Category *</label>
            <select style={{ ...inputStyle, cursor: 'pointer' }} value={categoryId} onChange={e => setCategoryId(e.target.value)}>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div>
            <label style={labelStyle}>Description / Notes</label>
            <textarea
              style={{ ...inputStyle, minHeight: '72px', resize: 'vertical' }}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="What was this expense for?"
            />
          </div>

          <div>
            <label style={labelStyle}>Machine (optional)</label>
            <select style={{ ...inputStyle, cursor: 'pointer' }} value={machineId} onChange={e => setMachineId(e.target.value)}>
              <option value="">— No machine —</option>
              {machines.map(m => (
                <option key={m.id} value={m.id}>{m.name}{m.status !== 'Active' ? ` (${m.status})` : ''}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={labelStyle}>File Attachment URL (optional)</label>
            <input
              style={inputStyle}
              type="url"
              value={fileUrl}
              onChange={e => setFileUrl(e.target.value)}
              placeholder="Paste a file link — full picker available in Documents module"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={saving} style={{ color: 'var(--text-muted)' }}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving} style={{ backgroundColor: 'var(--copper-base)', color: 'var(--text-heading)' }}>
            {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Save Expense'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
