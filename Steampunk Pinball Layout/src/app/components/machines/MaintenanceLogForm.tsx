import { useState } from 'react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import type { MaintenanceItem } from './types'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '../ui/dialog'
import { Button } from '../ui/button'

interface Props {
  machineId: string
  machineName: string
  locationId: string
  maintenanceItems: MaintenanceItem[]
  onSave: () => void
  onClose: () => void
}

export function MaintenanceLogForm({ machineId, machineName, locationId, maintenanceItems, onSave, onClose }: Props) {
  const [selectedItemId, setSelectedItemId] = useState(maintenanceItems[0]?.id ?? '')
  const [datePerformed, setDatePerformed] = useState(new Date().toISOString().split('T')[0])
  const [cost, setCost] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    if (!selectedItemId) { toast.error('Select a maintenance item.'); return }
    if (!datePerformed) { toast.error('Date performed is required.'); return }
    setSaving(true)

    const costValue = cost ? parseFloat(cost) : null
    const selectedItem = maintenanceItems.find(i => i.id === selectedItemId)

    // 1. Insert maintenance log
    const { data: logData, error: logError } = await supabase
      .from('maintenance_logs')
      .insert({
        machine_id: machineId,
        maintenance_item_id: selectedItemId,
        date_performed: datePerformed,
        cost: costValue,
        notes: notes.trim() || null,
      })
      .select('id')
      .single()

    if (logError || !logData) {
      toast.error('Failed to save maintenance log.')
      setSaving(false)
      return
    }

    // 2. If cost entered, auto-create expense entry
    if (costValue && costValue > 0) {
      const { data: catData } = await supabase
        .from('expense_categories')
        .select('id')
        .eq('name', 'Maintenance & Repair')
        .single()

      if (catData) {
        const description = `${selectedItem?.name ?? 'Maintenance'} — ${machineName}`
        const { data: expData } = await supabase
          .from('expenses')
          .insert({
            location_id: locationId,
            date: datePerformed,
            category_id: catData.id,
            amount: costValue,
            description,
            machine_id: machineId,
            source: 'maintenance_log',
            maintenance_log_id: logData.id,
          })
          .select('id')
          .single()

        // 3. Link expense back to maintenance log
        if (expData) {
          await supabase
            .from('maintenance_logs')
            .update({ expense_id: expData.id })
            .eq('id', logData.id)
        }
      }
    }

    toast.success('Maintenance logged.' + (costValue ? ' Expense entry auto-created.' : ''))
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
            LOG MAINTENANCE
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {maintenanceItems.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-body)', fontSize: '14px' }}>
              No maintenance items defined for this machine. Add items first.
            </p>
          ) : (
            <>
              <div>
                <label style={labelStyle}>Maintenance Item *</label>
                <select
                  style={{ ...inputStyle, cursor: 'pointer' }}
                  value={selectedItemId}
                  onChange={e => setSelectedItemId(e.target.value)}
                >
                  {maintenanceItems.map(item => (
                    <option key={item.id} value={item.id}>{item.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={labelStyle}>Date Performed *</label>
                <input
                  style={{ ...inputStyle, colorScheme: 'dark' }}
                  type="date"
                  value={datePerformed}
                  onChange={e => setDatePerformed(e.target.value)}
                />
              </div>

              <div>
                <label style={labelStyle}>Cost (optional)</label>
                <input
                  style={inputStyle}
                  type="number"
                  min="0"
                  step="0.01"
                  value={cost}
                  onChange={e => setCost(e.target.value)}
                  placeholder="0.00"
                />
                {cost && parseFloat(cost) > 0 && (
                  <p style={{ marginTop: '4px', fontSize: '11px', color: 'var(--patina-light)', fontFamily: 'var(--font-heading)', letterSpacing: '0.05em' }}>
                    An expense entry will be auto-created in Maintenance & Repair.
                  </p>
                )}
              </div>

              <div>
                <label style={labelStyle}>Notes (optional)</label>
                <textarea
                  style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }}
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Any observations or details…"
                />
              </div>
            </>
          )}
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
          {maintenanceItems.length > 0 && (
            <Button
              onClick={handleSave}
              disabled={saving}
              style={{ backgroundColor: 'var(--copper-base)', color: 'var(--text-heading)' }}
            >
              {saving ? 'Saving…' : 'Log Entry'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
