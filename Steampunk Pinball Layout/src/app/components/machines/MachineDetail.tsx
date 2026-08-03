import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { ChevronLeft, Pencil, Archive, Plus, Trash2, Upload } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Machine, MaintenanceItem, MaintenanceLog, MachineDepreciationPeriod } from './types'
import { MachineForm } from './MachineForm'
import { MaintenanceItemForm } from './MaintenanceItemForm'
import { MaintenanceLogForm } from './MaintenanceLogForm'
import { ensureDepreciationPeriods, calcAccumulatedDepreciation, calcBookValue } from './calcDepreciation'
import { Button } from '../ui/button'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '../ui/dialog'

interface Props {
  machineId: string
  locationId: string
  onBack: () => void
  onArchived: () => void
}

type MaintenanceStatus = 'overdue' | 'due_soon' | 'ok' | 'no_history'

function getNextDate(lastPerformed: string | null, intervalDays: number): Date | null {
  if (!lastPerformed) return null
  const last = new Date(lastPerformed + 'T00:00:00')
  return new Date(last.getTime() + intervalDays * 86_400_000)
}

function getMaintenanceStatus(nextDate: Date | null): MaintenanceStatus {
  if (!nextDate) return 'no_history'
  const diffDays = Math.floor((nextDate.getTime() - Date.now()) / 86_400_000)
  if (diffDays < 0) return 'overdue'
  if (diffDays <= 14) return 'due_soon'
  return 'ok'
}

function formatDate(d: string | null): string {
  if (!d) return '—'
  return new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatCurrency(v: number | null): string {
  if (v === null) return '—'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(v)
}

function formatInterval(days: number): string {
  if (days % 30 === 0) return `Every ${days / 30} mo`
  if (days % 7 === 0) return `Every ${days / 7} wk`
  return `Every ${days}d`
}

function StatusBadge({ status }: { status: Machine['status'] }) {
  const map = {
    Active: { bg: 'var(--patina-dark)', color: 'var(--patina-light)' },
    'Out of Service': { bg: '#4A3A10', color: 'var(--gold-mid)' },
    Retired: { bg: 'var(--steel-dark)', color: 'var(--steel-light)' },
  }
  const c = map[status]
  return (
    <span
      className="px-2 py-1 rounded text-xs tracking-wider"
      style={{ backgroundColor: c.bg, color: c.color, fontFamily: 'var(--font-heading)' }}
    >
      {status.toUpperCase()}
    </span>
  )
}

function MaintenancePill({ status }: { status: MaintenanceStatus }) {
  const map = {
    overdue: { bg: '#4A1010', color: '#FF6B6B', label: 'OVERDUE' },
    due_soon: { bg: '#4A3A10', color: 'var(--gold-mid)', label: 'DUE SOON' },
    ok: { bg: 'var(--patina-dark)', color: 'var(--patina-light)', label: 'OK' },
    no_history: { bg: 'var(--bg-elevated)', color: 'var(--text-muted)', label: 'NO HISTORY' },
  }
  const c = map[status]
  return (
    <span
      className="px-2 py-1 rounded text-xs tracking-wider"
      style={{ backgroundColor: c.bg, color: c.color, fontFamily: 'var(--font-heading)' }}
    >
      {c.label}
    </span>
  )
}

const cardStyle: React.CSSProperties = {
  backgroundColor: 'var(--bg-surface)',
  border: '1px solid var(--copper-dark)',
  borderRadius: 'var(--radius-md)',
  boxShadow: 'var(--shadow-sm)',
}

const sectionHeadingStyle: React.CSSProperties = {
  fontFamily: 'var(--font-heading)',
  color: 'var(--text-heading)',
  fontSize: '13px',
  letterSpacing: '0.15em',
  textTransform: 'uppercase' as const,
}

export function MachineDetail({ machineId, locationId, onBack, onArchived }: Props) {
  const [machine, setMachine] = useState<Machine | null>(null)
  const [items, setItems] = useState<MaintenanceItem[]>([])
  const [logs, setLogs] = useState<MaintenanceLog[]>([])
  const [depreciationPeriods, setDepreciationPeriods] = useState<MachineDepreciationPeriod[]>([])
  const [loading, setLoading] = useState(true)

  const [showEditForm, setShowEditForm] = useState(false)
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false)
  const [showItemForm, setShowItemForm] = useState(false)
  const [editItem, setEditItem] = useState<MaintenanceItem | null>(null)
  const [showLogForm, setShowLogForm] = useState(false)
  const [archiving, setArchiving] = useState(false)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    const [{ data: m }, { data: i }, { data: l }] = await Promise.all([
      supabase.from('machines').select('*').eq('id', machineId).single(),
      supabase.from('maintenance_items').select('*').eq('machine_id', machineId).order('name'),
      supabase.from('maintenance_logs').select('*').eq('machine_id', machineId).order('date_performed', { ascending: false }),
    ])
    if (m) setMachine(m)
    if (i) setItems(i)
    if (l) setLogs(l)

    if (m) {
      await ensureDepreciationPeriods([m])
      const { data: dep } = await supabase
        .from('machine_depreciation_periods')
        .select('*')
        .eq('machine_id', machineId)
      if (dep) setDepreciationPeriods(dep)
    }

    setLoading(false)
  }, [machineId])

  useEffect(() => { fetchAll() }, [fetchAll])

  async function handleArchive() {
    setArchiving(true)
    const { error } = await supabase
      .from('machines')
      .update({ is_archived: true, archived_at: new Date().toISOString() })
      .eq('id', machineId)
    if (error) { toast.error('Failed to archive machine.'); setArchiving(false); return }
    toast.success('Machine archived.')
    onArchived()
  }

  async function handleDeleteItem(itemId: string) {
    const { error } = await supabase.from('maintenance_items').delete().eq('id', itemId)
    if (error) { toast.error('Failed to delete item.'); return }
    toast.success('Maintenance item removed.')
    fetchAll()
  }

  function getLastLog(itemId: string): MaintenanceLog | undefined {
    return logs.filter(l => l.maintenance_item_id === itemId)[0]
  }

  const accumulatedDepreciation = calcAccumulatedDepreciation(depreciationPeriods)
  const bookValue = machine ? calcBookValue(machine, accumulatedDepreciation) : 0

  if (loading) {
    return (
      <div className="p-8" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-heading)' }}>
        Loading…
      </div>
    )
  }

  if (!machine) {
    return (
      <div className="p-8" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-heading)' }}>
        Machine not found.
      </div>
    )
  }

  return (
    <div className="p-8 space-y-6">
      {/* Back nav */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 transition-opacity hover:opacity-80"
        style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-heading)', fontSize: '12px', letterSpacing: '0.15em', background: 'none', border: 'none', cursor: 'pointer' }}
      >
        <ChevronLeft size={14} />
        MACHINES
      </button>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-heading)', fontSize: '28px', letterSpacing: '0.05em', margin: 0 }}>
            {machine.name}
          </h2>
          <div className="mt-2">
            <StatusBadge status={machine.status} />
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowEditForm(true)}
            style={{ borderColor: 'var(--copper-dark)', color: 'var(--text-secondary)' }}
          >
            <Pencil size={14} />
            Edit
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowArchiveConfirm(true)}
            style={{ borderColor: 'var(--copper-dark)', color: 'var(--text-muted)' }}
          >
            <Archive size={14} />
            Archive
          </Button>
        </div>
      </div>

      {/* Machine info card */}
      <div className="p-5 flex items-start justify-between" style={cardStyle}>
        <div className="flex gap-10 flex-wrap">
          <div>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: '10px', letterSpacing: '0.15em', color: 'var(--text-muted)', textTransform: 'uppercase' as const }}>
              Purchase Price
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-heading)', fontSize: '20px', marginTop: '4px' }}>
              {formatCurrency(machine.purchase_price)}
            </div>
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: '10px', letterSpacing: '0.15em', color: 'var(--text-muted)', textTransform: 'uppercase' as const }}>
              Date Acquired
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-heading)', fontSize: '20px', marginTop: '4px' }}>
              {formatDate(machine.date_acquired)}
            </div>
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: '10px', letterSpacing: '0.15em', color: 'var(--text-muted)', textTransform: 'uppercase' as const }}>
              Useful Life
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-heading)', fontSize: '20px', marginTop: '4px' }}>
              {machine.useful_life_years} yrs
            </div>
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: '10px', letterSpacing: '0.15em', color: 'var(--text-muted)', textTransform: 'uppercase' as const }}>
              Salvage Value
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-heading)', fontSize: '20px', marginTop: '4px' }}>
              {formatCurrency(machine.salvage_value)}
            </div>
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: '10px', letterSpacing: '0.15em', color: 'var(--text-muted)', textTransform: 'uppercase' as const }}>
              Accumulated Depreciation
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', fontSize: '20px', marginTop: '4px' }}>
              {formatCurrency(accumulatedDepreciation)}
            </div>
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: '10px', letterSpacing: '0.15em', color: 'var(--text-muted)', textTransform: 'uppercase' as const }}>
              Book Value
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--gold-base)', fontSize: '20px', marginTop: '4px', fontWeight: 'bold' }}>
              {formatCurrency(bookValue)}
            </div>
          </div>
        </div>
        <Button
          size="sm"
          variant="outline"
          style={{ borderColor: 'var(--copper-dark)', color: 'var(--text-muted)' }}
          title="File upload coming soon"
        >
          <Upload size={14} />
          Upload Documentation
        </Button>
      </div>

      {/* Maintenance Schedule */}
      <div style={cardStyle} className="overflow-hidden">
        <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--copper-dark)' }}>
          <span style={sectionHeadingStyle}>Maintenance Schedule</span>
          <Button
            size="sm"
            onClick={() => { setEditItem(null); setShowItemForm(true) }}
            style={{ backgroundColor: 'var(--copper-base)', color: 'var(--text-heading)', fontSize: '11px' }}
          >
            <Plus size={13} />
            Add Item
          </Button>
        </div>

        {items.length === 0 ? (
          <div className="px-5 py-6 text-center" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-body)', fontSize: '14px' }}>
            No maintenance items defined. Add items to track upcoming service.
          </div>
        ) : (
          <div>
            {/* Column headers */}
            <div
              className="grid px-5 py-2"
              style={{ gridTemplateColumns: '1fr 100px 140px 90px 64px', gap: '8px', borderBottom: '1px solid rgba(107,46,18,0.3)', fontFamily: 'var(--font-heading)', fontSize: '10px', letterSpacing: '0.12em', color: 'var(--text-muted)' }}
            >
              <span>ITEM</span>
              <span>INTERVAL</span>
              <span>NEXT DUE</span>
              <span>STATUS</span>
              <span />
            </div>
            {items.map(item => {
              const lastLog = getLastLog(item.id)
              const nextDate = getNextDate(lastLog?.date_performed ?? null, item.interval_days)
              const mStatus = getMaintenanceStatus(nextDate)
              return (
                <div
                  key={item.id}
                  className="grid px-5 py-3 items-center"
                  style={{ gridTemplateColumns: '1fr 100px 140px 90px 64px', gap: '8px', borderBottom: '1px solid rgba(107,46,18,0.2)' }}
                >
                  <span style={{ fontFamily: 'var(--font-body)', color: 'var(--text-primary)', fontSize: '14px' }}>{item.name}</span>
                  <span style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-muted)', fontSize: '12px' }}>{formatInterval(item.interval_days)}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', fontSize: '13px' }}>
                    {nextDate ? nextDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                  </span>
                  <MaintenancePill status={mStatus} />
                  <div className="flex gap-1 justify-end">
                    <button
                      onClick={() => { setEditItem(item); setShowItemForm(true) }}
                      title="Edit"
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px' }}
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      onClick={() => handleDeleteItem(item.id)}
                      title="Delete"
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--destructive)', padding: '4px', opacity: 0.7 }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Maintenance Log */}
      <div style={cardStyle} className="overflow-hidden">
        <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--copper-dark)' }}>
          <span style={sectionHeadingStyle}>Maintenance Log</span>
          <Button
            size="sm"
            onClick={() => setShowLogForm(true)}
            style={{ backgroundColor: 'var(--copper-base)', color: 'var(--text-heading)', fontSize: '11px' }}
          >
            <Plus size={13} />
            Log Entry
          </Button>
        </div>

        {logs.length === 0 ? (
          <div className="px-5 py-6 text-center" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-body)', fontSize: '14px' }}>
            No maintenance history yet.
          </div>
        ) : (
          <div>
            <div
              className="grid px-5 py-2"
              style={{ gridTemplateColumns: '120px 1fr 90px 1fr', gap: '8px', borderBottom: '1px solid rgba(107,46,18,0.3)', fontFamily: 'var(--font-heading)', fontSize: '10px', letterSpacing: '0.12em', color: 'var(--text-muted)' }}
            >
              <span>DATE</span>
              <span>ITEM</span>
              <span>COST</span>
              <span>NOTES</span>
            </div>
            {logs.map(log => {
              const item = items.find(i => i.id === log.maintenance_item_id)
              return (
                <div
                  key={log.id}
                  className="grid px-5 py-3 items-start"
                  style={{ gridTemplateColumns: '120px 1fr 90px 1fr', gap: '8px', borderBottom: '1px solid rgba(107,46,18,0.2)' }}
                >
                  <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', fontSize: '13px' }}>{formatDate(log.date_performed)}</span>
                  <span style={{ fontFamily: 'var(--font-body)', color: 'var(--text-primary)', fontSize: '14px' }}>{item?.name ?? '—'}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', color: log.cost ? 'var(--text-heading)' : 'var(--text-muted)', fontSize: '13px' }}>{formatCurrency(log.cost)}</span>
                  <span style={{ fontFamily: 'var(--font-body)', color: 'var(--text-muted)', fontSize: '13px' }}>{log.notes ?? '—'}</span>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Modals */}
      {showEditForm && (
        <MachineForm
          machine={machine}
          onSave={fetchAll}
          onClose={() => setShowEditForm(false)}
        />
      )}

      {showItemForm && (
        <MaintenanceItemForm
          machineId={machineId}
          item={editItem}
          onSave={fetchAll}
          onClose={() => { setShowItemForm(false); setEditItem(null) }}
        />
      )}

      {showLogForm && (
        <MaintenanceLogForm
          machineId={machineId}
          machineName={machine.name}
          locationId={locationId}
          maintenanceItems={items}
          onSave={fetchAll}
          onClose={() => setShowLogForm(false)}
        />
      )}

      {/* Archive confirmation */}
      <Dialog open={showArchiveConfirm} onOpenChange={(open) => { if (!open) setShowArchiveConfirm(false) }}>
        <DialogContent style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--copper-dark)' }} className="max-w-sm">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-heading)', letterSpacing: '0.1em' }}>
              ARCHIVE MACHINE?
            </DialogTitle>
          </DialogHeader>
          <p style={{ fontFamily: 'var(--font-body)', color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.6 }}>
            <strong style={{ color: 'var(--text-heading)' }}>{machine.name}</strong> will be removed from all active views. All revenue, expense, and maintenance history will be fully preserved. You can view archived machines from the Machines list.
          </p>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowArchiveConfirm(false)} style={{ color: 'var(--text-muted)' }}>
              Cancel
            </Button>
            <Button
              onClick={handleArchive}
              disabled={archiving}
              style={{ backgroundColor: 'var(--destructive)', color: '#fff' }}
            >
              {archiving ? 'Archiving…' : 'Archive'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
