import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { Plus, Pencil, Trash2, Settings, Landmark } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { NonMachineRevenue, RevenueCategory } from './types'
import { NonMachineRevenueForm } from './NonMachineRevenueForm'
import { CategoryManager } from './CategoryManager'
import { Button } from '../ui/button'

function formatDate(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
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

export function NonMachineRevenueTab() {
  const [entries, setEntries] = useState<NonMachineRevenue[]>([])
  const [categories, setCategories] = useState<RevenueCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editEntry, setEditEntry] = useState<NonMachineRevenue | null>(null)
  const [showCatManager, setShowCatManager] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const fetchCategories = useCallback(async () => {
    const { data } = await supabase.from('revenue_categories').select('*').order('name')
    if (data) setCategories(data)
  }, [])

  const fetchEntries = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('non_machine_revenue')
      .select('*, revenue_categories(name), locations(name)')
      .order('date', { ascending: false })
    if (data) setEntries(data)
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchCategories()
    fetchEntries()
  }, [fetchCategories, fetchEntries])

  async function handleDelete(id: string) {
    setDeleting(true)
    const { error } = await supabase.from('non_machine_revenue').delete().eq('id', id)
    if (error) { toast.error('Failed to delete entry.') } else { toast.success('Entry deleted.'); fetchEntries() }
    setConfirmDelete(null)
    setDeleting(false)
  }

  const grandTotal = entries.reduce((sum, e) => sum + e.amount, 0)

  return (
    <div className="space-y-4">
      {/* Totals bar */}
      {entries.length > 0 && (
        <div className="p-4 rounded-lg flex items-center justify-between" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--copper-dark)' }}>
          <div>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: '10px', letterSpacing: '0.12em', color: 'var(--text-muted)' }}>TOTAL OTHER REVENUE</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '22px', color: 'var(--gold-base)', marginTop: '4px', fontWeight: 'bold' }}>
              {formatMoney(grandTotal)}
            </div>
          </div>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: '11px', color: 'var(--text-muted)', letterSpacing: '0.1em' }}>
            {entries.length} {entries.length === 1 ? 'ENTRY' : 'ENTRIES'}
          </div>
        </div>
      )}

      {/* Actions row */}
      <div className="flex justify-end gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowCatManager(true)}
          style={{ borderColor: 'var(--copper-dark)', color: 'var(--text-muted)' }}
        >
          <Settings size={13} />
          Manage Categories
        </Button>
        <Button onClick={() => { setEditEntry(null); setShowForm(true) }} style={{ backgroundColor: 'var(--copper-base)', color: 'var(--text-heading)' }}>
          <Plus size={15} />
          Add Entry
        </Button>
      </div>

      {/* Table */}
      <div style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--copper-dark)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
        <div className="grid" style={{ gridTemplateColumns: '130px 130px 160px 120px 1fr 64px', borderBottom: '1px solid var(--copper-dark)' }}>
          <div style={colHeader}>DATE</div>
          <div style={colHeader}>LOCATION</div>
          <div style={colHeader}>CATEGORY</div>
          <div style={colHeader}>AMOUNT</div>
          <div style={colHeader}>NOTES</div>
          <div style={colHeader} />
        </div>

        {loading ? (
          <div className="p-8 text-center" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-heading)', fontSize: '12px', letterSpacing: '0.1em' }}>LOADING…</div>
        ) : entries.length === 0 ? (
          <div className="p-8 text-center" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-body)', fontSize: '14px' }}>
            No other revenue entries yet.
          </div>
        ) : (
          entries.map((entry, i) => {
            const isLast = i === entries.length - 1
            return (
              <div
                key={entry.id}
                className="grid items-center"
                style={{ gridTemplateColumns: '130px 130px 160px 120px 1fr 64px', borderBottom: isLast ? 'none' : '1px solid rgba(107,46,18,0.25)' }}
              >
                <div style={{ padding: '12px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', fontSize: '13px' }}>
                  {formatDate(entry.date)}
                </div>
                <div style={{ padding: '12px', fontFamily: 'var(--font-body)', color: 'var(--text-muted)', fontSize: '13px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {entry.locations?.name ?? '—'}
                </div>
                <div style={{ padding: '12px', fontFamily: 'var(--font-body)', color: 'var(--text-primary)', fontSize: '14px' }}>
                  {entry.revenue_categories?.name ?? '—'}
                </div>
                <div style={{ padding: '12px', fontFamily: 'var(--font-mono)', color: 'var(--text-heading)', fontSize: '14px', fontWeight: 'bold' }}>
                  {formatMoney(entry.amount)}
                </div>
                <div className="flex items-center gap-2" style={{ padding: '12px', fontFamily: 'var(--font-body)', color: 'var(--text-muted)', fontSize: '13px', overflow: 'hidden' }}>
                  {entry.source === 'bank_import' && (
                    <span title="Imported from bank CSV" style={{ flexShrink: 0 }}>
                      <Landmark size={12} style={{ color: 'var(--steel-light)', opacity: 0.8 }} />
                    </span>
                  )}
                  <span style={{ textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden' }}>{entry.notes ?? '—'}</span>
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
        <NonMachineRevenueForm
          entry={editEntry}
          categories={categories}
          onSave={fetchEntries}
          onClose={() => { setShowForm(false); setEditEntry(null) }}
        />
      )}

      {showCatManager && (
        <CategoryManager
          categories={categories}
          onUpdate={fetchCategories}
          onClose={() => setShowCatManager(false)}
        />
      )}
    </div>
  )
}
