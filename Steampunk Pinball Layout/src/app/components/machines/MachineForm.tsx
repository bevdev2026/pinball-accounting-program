import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import type { Machine, MachineStatus } from './types'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '../ui/dialog'
import { Button } from '../ui/button'

interface Props {
  machine: Machine | null
  locationId: string
  onSave: () => void
  onClose: () => void
}

const STATUS_OPTIONS: MachineStatus[] = ['Active', 'Out of Service', 'Retired']

export function MachineForm({ machine, locationId, onSave, onClose }: Props) {
  const isEdit = machine !== null
  const [name, setName] = useState(machine?.name ?? '')
  const [purchasePrice, setPurchasePrice] = useState(machine?.purchase_price?.toString() ?? '')
  const [dateAcquired, setDateAcquired] = useState(machine?.date_acquired ?? '')
  const [status, setStatus] = useState<MachineStatus>(machine?.status ?? 'Active')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setName(machine?.name ?? '')
    setPurchasePrice(machine?.purchase_price?.toString() ?? '')
    setDateAcquired(machine?.date_acquired ?? '')
    setStatus(machine?.status ?? 'Active')
  }, [machine])

  async function handleSave() {
    if (!name.trim()) {
      toast.error('Machine name is required.')
      return
    }
    setSaving(true)
    const price = purchasePrice ? parseFloat(purchasePrice) : null

    if (isEdit) {
      const { error } = await supabase
        .from('machines')
        .update({ name: name.trim(), purchase_price: price, date_acquired: dateAcquired || null, status })
        .eq('id', machine!.id)
      if (error) { toast.error('Failed to update machine.'); setSaving(false); return }
      toast.success('Machine updated.')
    } else {
      const { error } = await supabase
        .from('machines')
        .insert({ location_id: locationId, name: name.trim(), purchase_price: price, date_acquired: dateAcquired || null, status })
      if (error) { toast.error('Failed to add machine.'); setSaving(false); return }
      toast.success('Machine added.')
    }

    onSave()
    onClose()
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

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent
        style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--copper-dark)' }}
        className="max-w-md"
      >
        <DialogHeader>
          <DialogTitle style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-heading)', letterSpacing: '0.1em' }}>
            {isEdit ? 'EDIT MACHINE' : 'ADD MACHINE'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div>
            <label style={labelStyle}>Machine Name *</label>
            <input
              style={inputStyle}
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Stern Godzilla"
              autoFocus
            />
          </div>

          <div>
            <label style={labelStyle}>Status</label>
            <select
              style={{ ...inputStyle, cursor: 'pointer' }}
              value={status}
              onChange={e => setStatus(e.target.value as MachineStatus)}
            >
              {STATUS_OPTIONS.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label style={labelStyle}>Purchase Price</label>
              <input
                style={inputStyle}
                type="number"
                min="0"
                step="0.01"
                value={purchasePrice}
                onChange={e => setPurchasePrice(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div>
              <label style={labelStyle}>Date Acquired</label>
              <input
                style={{ ...inputStyle, colorScheme: 'dark' }}
                type="date"
                value={dateAcquired}
                onChange={e => setDateAcquired(e.target.value)}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="ghost"
            onClick={onClose}
            disabled={saving}
            style={{ color: 'var(--text-muted)' }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            style={{ backgroundColor: 'var(--copper-base)', color: 'var(--text-heading)' }}
          >
            {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Machine'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
