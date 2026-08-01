import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import type { MachineRevenue, ActiveMachine } from './types'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog'
import { Button } from '../ui/button'

interface Props {
  entry: MachineRevenue | null
  machines: ActiveMachine[]
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

function AmountField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <div style={{ position: 'relative' }}>
        <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '14px' }}>$</span>
        <input
          style={{ ...inputStyle, paddingLeft: '24px', fontFamily: 'var(--font-mono)' }}
          type="number"
          min="0"
          step="0.01"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder="0.00"
        />
      </div>
    </div>
  )
}

export function MachineRevenueForm({ entry, machines, locationId, onSave, onClose }: Props) {
  const isEdit = entry !== null
  const [machineId, setMachineId] = useState(entry?.machine_id ?? machines[0]?.id ?? '')
  const [collectionDate, setCollectionDate] = useState(entry?.collection_date ?? '')
  const [periodStart, setPeriodStart] = useState(entry?.collection_period_start ?? '')
  const [periodEnd, setPeriodEnd] = useState(entry?.collection_period_end ?? '')
  const [amount, setAmount] = useState(entry?.amount?.toString() ?? '0')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setMachineId(entry?.machine_id ?? machines[0]?.id ?? '')
    setCollectionDate(entry?.collection_date ?? '')
    setPeriodStart(entry?.collection_period_start ?? '')
    setPeriodEnd(entry?.collection_period_end ?? '')
    setAmount(entry?.amount?.toString() ?? '0')
  }, [entry, machines])

  async function handleSave() {
    if (!machineId) { toast.error('Select a machine.'); return }
    if (!collectionDate) { toast.error('Collection date is required.'); return }
    if (!periodStart || !periodEnd) { toast.error('Collection period (start and end) is required.'); return }
    if (new Date(periodEnd) < new Date(periodStart)) { toast.error('Period end must be on or after period start.'); return }

    const payload = {
      machine_id: machineId,
      location_id: locationId,
      collection_date: collectionDate,
      collection_period_start: periodStart,
      collection_period_end: periodEnd,
      amount: parseFloat(amount) || 0,
    }

    setSaving(true)
    if (isEdit) {
      const { error } = await supabase.from('machine_revenue').update(payload).eq('id', entry!.id)
      if (error) {
        toast.error(error.code === '23505' ? 'An entry for this machine on that date already exists.' : 'Failed to update entry.')
        setSaving(false)
        return
      }
      toast.success('Revenue entry updated.')
    } else {
      const { error } = await supabase.from('machine_revenue').insert(payload)
      if (error) {
        toast.error(error.code === '23505' ? 'An entry for this machine on that date already exists.' : 'Failed to save entry.')
        setSaving(false)
        return
      }
      toast.success('Revenue entry saved.')
    }

    onSave()
    onClose()
  }

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent
        style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--copper-dark)' }}
        className="max-w-lg"
      >
        <DialogHeader>
          <DialogTitle style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-heading)', letterSpacing: '0.1em' }}>
            {isEdit ? 'EDIT REVENUE ENTRY' : 'ADD REVENUE ENTRY'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-1">
          {machines.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-body)', fontSize: '14px' }}>
              No active machines available. Add a machine first.
            </p>
          ) : (
            <>
              <div>
                <label style={labelStyle}>Machine *</label>
                <select style={{ ...inputStyle, cursor: 'pointer' }} value={machineId} onChange={e => setMachineId(e.target.value)}>
                  {machines.map(m => (
                    <option key={m.id} value={m.id}>{m.name}{m.status !== 'Active' ? ` (${m.status})` : ''}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={labelStyle}>Collection Date *</label>
                <input style={{ ...inputStyle, colorScheme: 'dark' }} type="date" value={collectionDate} onChange={e => setCollectionDate(e.target.value)} />
              </div>

              <div>
                <label style={labelStyle}>Collection Period *</label>
                <div className="flex items-center gap-2">
                  <input style={{ ...inputStyle, colorScheme: 'dark', flex: 1 }} type="date" value={periodStart} onChange={e => setPeriodStart(e.target.value)} />
                  <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-heading)', fontSize: '11px', whiteSpace: 'nowrap' }}>TO</span>
                  <input style={{ ...inputStyle, colorScheme: 'dark', flex: 1 }} type="date" value={periodEnd} onChange={e => setPeriodEnd(e.target.value)} />
                </div>
              </div>

              <div>
                <AmountField label="Amount Collected *" value={amount} onChange={setAmount} />
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={saving} style={{ color: 'var(--text-muted)' }}>Cancel</Button>
          {machines.length > 0 && (
            <Button onClick={handleSave} disabled={saving} style={{ backgroundColor: 'var(--copper-base)', color: 'var(--text-heading)' }}>
              {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Save Entry'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
