import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import type { MaintenanceItem } from './types'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '../ui/dialog'
import { Button } from '../ui/button'

interface Props {
  machineId: string
  item: MaintenanceItem | null
  onSave: () => void
  onClose: () => void
}

type IntervalUnit = 'days' | 'weeks' | 'months'

function daysToUnit(days: number): { value: number; unit: IntervalUnit } {
  if (days % 30 === 0) return { value: days / 30, unit: 'months' }
  if (days % 7 === 0) return { value: days / 7, unit: 'weeks' }
  return { value: days, unit: 'days' }
}

function unitToDays(value: number, unit: IntervalUnit): number {
  if (unit === 'months') return value * 30
  if (unit === 'weeks') return value * 7
  return value
}

export function MaintenanceItemForm({ machineId, item, onSave, onClose }: Props) {
  const isEdit = item !== null
  const parsed = item ? daysToUnit(item.interval_days) : { value: 3, unit: 'months' as IntervalUnit }
  const [name, setName] = useState(item?.name ?? '')
  const [intervalValue, setIntervalValue] = useState(parsed.value.toString())
  const [intervalUnit, setIntervalUnit] = useState<IntervalUnit>(parsed.unit)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const p = item ? daysToUnit(item.interval_days) : { value: 3, unit: 'months' as IntervalUnit }
    setName(item?.name ?? '')
    setIntervalValue(p.value.toString())
    setIntervalUnit(p.unit)
  }, [item])

  async function handleSave() {
    if (!name.trim()) { toast.error('Item name is required.'); return }
    const val = parseInt(intervalValue)
    if (!val || val < 1) { toast.error('Interval must be at least 1.'); return }
    const days = unitToDays(val, intervalUnit)
    setSaving(true)

    if (isEdit) {
      const { error } = await supabase
        .from('maintenance_items')
        .update({ name: name.trim(), interval_days: days })
        .eq('id', item!.id)
      if (error) { toast.error('Failed to update item.'); setSaving(false); return }
      toast.success('Maintenance item updated.')
    } else {
      const { error } = await supabase
        .from('maintenance_items')
        .insert({ machine_id: machineId, name: name.trim(), interval_days: days })
      if (error) { toast.error('Failed to add item.'); setSaving(false); return }
      toast.success('Maintenance item added.')
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
            {isEdit ? 'EDIT MAINTENANCE ITEM' : 'ADD MAINTENANCE ITEM'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div>
            <label style={labelStyle}>Item Name *</label>
            <input
              style={inputStyle}
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Rubber Replacement"
              autoFocus
            />
          </div>

          <div>
            <label style={labelStyle}>Reminder Interval</label>
            <div className="flex gap-2">
              <input
                style={{ ...inputStyle, width: '80px', flexShrink: 0 }}
                type="number"
                min="1"
                value={intervalValue}
                onChange={e => setIntervalValue(e.target.value)}
              />
              <select
                style={{ ...inputStyle, flex: 1, cursor: 'pointer' }}
                value={intervalUnit}
                onChange={e => setIntervalUnit(e.target.value as IntervalUnit)}
              >
                <option value="days">Days</option>
                <option value="weeks">Weeks</option>
                <option value="months">Months</option>
              </select>
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
            {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Item'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
