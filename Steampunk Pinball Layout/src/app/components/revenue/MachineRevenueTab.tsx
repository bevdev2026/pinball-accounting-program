import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { MachineRevenue, ActiveMachine } from './types'
import { MachineRevenueForm } from './MachineRevenueForm'
import { Button } from '../ui/button'

interface Props {
  locationId: string
  machines: ActiveMachine[]
}

function formatDate(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatPeriod(start: string, end: string) {
  const s = new Date(start + 'T00:00:00')
  const e = new Date(end + 'T00:00:00')
  const sameYear = s.getFullYear() === e.getFullYear()
  const sameMonth = sameYear && s.getMonth() === e.getMonth()
  const fmt = (d: Date, showYear: boolean) =>
    d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', ...(showYear ? { year: 'numeric' } : {}) })
  if (sameMonth) return `${fmt(s, false)} – ${e.getDate()}, ${s.getFullYear()}`
  return `${fmt(s, !sameYear)} – ${fmt(e, true)}`
}

function formatMoney(v: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(v)
}

const colHeader: React.CSSProperties = {
  fontFamily: 'var(--font-heading)',
  fontSize: '10px',
  letterSpacing: '0.12em',
  color: 'var(--text-muted)',
  padding: '10px 12px',
}

export function MachineRevenueTab({ locationId, machines }: Props) {
  const [entries, setEntries] = useState<MachineRevenue[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editEntry, setEditEntry] = useState<MachineRevenue | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const fetchEntries = useCallback(async () => {
    if (!locationId) { setEntries([]); setLoading(false); return }
    setLoading(true)
    const { data } = await supabase
      .from('machine_revenue')
      .select('*, machines(name)')
      .eq('location_id', locationId)
      .order('collection_date', { ascending: false })
    if (data) setEntries(data)
    setLoading(false)
  }, [locationId])

  useEffect(() => { fetchEntries() }, [fetchEntries])

  async function handleDelete(id: string) {
    setDeleting(true)
    const { error } = await supabase.from('machine_revenue').delete().eq('id', id)
    if (error) { toast.error('Failed to delete entry.') } else { toast.success('Entry deleted.'); fetchEntries() }
    setConfirmDelete(null)
    setDeleting(false)
  }

  // Summary total
  const grandTotal = entries.reduce((sum, e) => sum + e.amount, 0)

  return (
    <div className="space-y-4">
      {/* Totals bar */}
      {entries.length > 0 && (
        <div
          className="p-4 rounded-lg flex items-center justify-between"
          style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--copper-dark)' }}
        >
          <div>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: '10px', letterSpacing: '0.12em', color: 'var(--text-muted)' }}>TOTAL MACHINE REVENUE</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '22px', color: 'var(--gold-base)', marginTop: '4px', fontWeight: 'bold' }}>
              {formatMoney(grandTotal)}
            </div>
          </div>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: '11px', color: 'var(--text-muted)', letterSpacing: '0.1em' }}>
            {entries.length} {entries.length === 1 ? 'ENTRY' : 'ENTRIES'}
          </div>
        </div>
      )}

      {/* Header row */}
      <div className="flex justify-end">
        <Button onClick={() => { setEditEntry(null); setShowForm(true) }} style={{ backgroundColor: 'var(--copper-base)', color: 'var(--text-heading)' }}>
          <Plus size={15} />
          Add Entry
        </Button>
      </div>

      {/* Table */}
      <div style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--copper-dark)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
        <div className="grid" style={{ gridTemplateColumns: '160px 120px 180px 110px 72px', borderBottom: '1px solid var(--copper-dark)' }}>
          <div style={colHeader}>MACHINE</div>
          <div style={colHeader}>COLL. DATE</div>
          <div style={colHeader}>PERIOD</div>
          <div style={colHeader}>AMOUNT</div>
          <div style={colHeader} />
        </div>

        {loading ? (
          <div className="p-8 text-center" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-heading)', fontSize: '12px', letterSpacing: '0.1em' }}>LOADING…</div>
        ) : entries.length === 0 ? (
          <div className="p-8 text-center" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-body)', fontSize: '14px' }}>
            No machine revenue entries yet. Add your first collection.
          </div>
        ) : (
          entries.map((entry, i) => {
            const isLast = i === entries.length - 1
            return (
              <div
                key={entry.id}
                className="grid items-center"
                style={{ gridTemplateColumns: '160px 120px 180px 110px 72px', borderBottom: isLast ? 'none' : '1px solid rgba(107,46,18,0.25)' }}
              >
                <div style={{ padding: '12px', fontFamily: 'var(--font-body)', color: 'var(--text-primary)', fontSize: '14px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {entry.machines?.name ?? '—'}
                </div>
                <div style={{ padding: '12px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', fontSize: '13px' }}>
                  {formatDate(entry.collection_date)}
                </div>
                <div style={{ padding: '12px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', fontSize: '12px' }}>
                  {formatPeriod(entry.collection_period_start, entry.collection_period_end)}
                </div>
                <div style={{ padding: '12px', fontFamily: 'var(--font-mono)', color: 'var(--text-heading)', fontSize: '14px', fontWeight: 'bold' }}>
                  {formatMoney(entry.amount)}
                </div>
                <div style={{ padding: '12px' }} className="flex gap-1 items-center justify-end">
                  {confirmDelete === entry.id ? (
                    <div className="flex items-center gap-1">
                      <span style={{ fontFamily: 'var(--font-heading)', fontSize: '10px', color: 'var(--destructive)', letterSpacing: '0.05em' }}>DELETE?</span>
                      <button onClick={() => handleDelete(entry.id)} disabled={deleting} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--destructive)', fontFamily: 'var(--font-heading)', fontSize: '11px', padding: '2px 4px' }}>YES</button>
                      <button onClick={() => setConfirmDelete(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontFamily: 'var(--font-heading)', fontSize: '11px', padding: '2px 4px' }}>NO</button>
                    </div>
                  ) : (
                    <>
                      <button onClick={() => { setEditEntry(entry); setShowForm(true) }} title="Edit" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px' }}>
                        <Pencil size={13} />
                      </button>
                      <button onClick={() => setConfirmDelete(entry.id)} title="Delete" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--destructive)', opacity: 0.7, padding: '4px' }}>
                        <Trash2 size={13} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>

      {showForm && (
        <MachineRevenueForm
          entry={editEntry}
          machines={machines}
          locationId={locationId}
          onSave={fetchEntries}
          onClose={() => { setShowForm(false); setEditEntry(null) }}
        />
      )}
    </div>
  )
}
