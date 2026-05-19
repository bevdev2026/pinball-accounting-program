import { useState, useEffect, useCallback } from 'react'
import { Plus, Eye, Pencil } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Machine, MachineStatus } from './types'
import { MachineDetail } from './MachineDetail'
import { MachineForm } from './MachineForm'
import { Button } from '../ui/button'

type StatusFilter = 'All' | MachineStatus | 'Archived'
const FILTER_TABS: StatusFilter[] = ['All', 'Active', 'Out of Service', 'Retired', 'Archived']

function StatusBadge({ status }: { status: MachineStatus }) {
  const map: Record<MachineStatus, { bg: string; color: string }> = {
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

function formatCurrency(v: number | null): string {
  if (v === null) return '—'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(v)
}

function formatDate(d: string | null): string {
  if (!d) return '—'
  return new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function MachinesView() {
  const [machines, setMachines] = useState<Machine[]>([])
  const [locationId, setLocationId] = useState('')
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('All')
  const [selectedMachineId, setSelectedMachineId] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editMachine, setEditMachine] = useState<Machine | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    const [{ data: loc }, { data: m }] = await Promise.all([
      supabase.from('locations').select('id').single(),
      supabase.from('machines').select('*').order('name'),
    ])
    if (loc) setLocationId(loc.id)
    if (m) setMachines(m)
    setLoading(false)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const filtered = machines.filter(m => {
    if (statusFilter === 'Archived') return m.is_archived
    if (statusFilter === 'All') return !m.is_archived
    return !m.is_archived && m.status === statusFilter
  })

  if (selectedMachineId) {
    return (
      <MachineDetail
        machineId={selectedMachineId}
        locationId={locationId}
        onBack={() => { setSelectedMachineId(null); fetchData() }}
        onArchived={() => { setSelectedMachineId(null); fetchData() }}
      />
    )
  }

  const tabStyle = (active: boolean): React.CSSProperties => ({
    padding: '6px 14px',
    borderRadius: 'var(--radius-sm)',
    fontFamily: 'var(--font-heading)',
    fontSize: '11px',
    letterSpacing: '0.12em',
    cursor: 'pointer',
    border: 'none',
    backgroundColor: active ? 'var(--copper-dark)' : 'transparent',
    color: active ? 'var(--copper-bright)' : 'var(--text-muted)',
    transition: 'all 0.15s',
  })

  const colHeader: React.CSSProperties = {
    fontFamily: 'var(--font-heading)',
    fontSize: '10px',
    letterSpacing: '0.12em',
    color: 'var(--text-muted)',
    padding: '10px 16px',
  }

  return (
    <div className="p-8 space-y-6">
      {/* Page header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-3xl tracking-wide" style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-heading)' }}>
            Machines
          </h2>
          <p className="text-sm tracking-wider opacity-70 mt-1" style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-secondary)' }}>
            MACHINE INVENTORY & MAINTENANCE
          </p>
        </div>
        <Button
          onClick={() => setShowAddForm(true)}
          style={{ backgroundColor: 'var(--copper-base)', color: 'var(--text-heading)' }}
        >
          <Plus size={16} />
          Add Machine
        </Button>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-1" style={{ backgroundColor: 'var(--bg-surface)', padding: '4px', borderRadius: 'var(--radius-md)', border: '1px solid var(--copper-dark)', display: 'inline-flex' }}>
        {FILTER_TABS.map(tab => (
          <button key={tab} style={tabStyle(statusFilter === tab)} onClick={() => setStatusFilter(tab)}>
            {tab.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Table */}
      <div style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--copper-dark)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
        {/* Column headers */}
        <div className="grid" style={{ gridTemplateColumns: '1fr 140px 120px 140px 100px', borderBottom: '1px solid var(--copper-dark)' }}>
          <div style={colHeader}>NAME</div>
          <div style={colHeader}>STATUS</div>
          <div style={colHeader}>PURCHASE PRICE</div>
          <div style={colHeader}>DATE ACQUIRED</div>
          <div style={colHeader} />
        </div>

        {loading ? (
          <div className="p-8 text-center" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-heading)', fontSize: '13px', letterSpacing: '0.1em' }}>
            LOADING…
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-body)', fontSize: '14px' }}>
            {statusFilter === 'Archived'
              ? 'No archived machines.'
              : statusFilter === 'All'
              ? 'No machines yet. Add your first machine to get started.'
              : `No ${statusFilter} machines.`}
          </div>
        ) : (
          filtered.map((machine, i) => (
            <div
              key={machine.id}
              className="grid items-center"
              style={{
                gridTemplateColumns: '1fr 140px 120px 140px 100px',
                borderBottom: i < filtered.length - 1 ? '1px solid rgba(107,46,18,0.25)' : 'none',
                padding: '0',
              }}
            >
              <div style={{ padding: '14px 16px', fontFamily: 'var(--font-body)', color: 'var(--text-primary)', fontSize: '15px' }}>
                {machine.name}
                {machine.is_archived && (
                  <span style={{ marginLeft: '8px', fontFamily: 'var(--font-heading)', fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '0.1em' }}>
                    ARCHIVED
                  </span>
                )}
              </div>
              <div style={{ padding: '14px 16px' }}>
                <StatusBadge status={machine.status} />
              </div>
              <div style={{ padding: '14px 16px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', fontSize: '14px' }}>
                {formatCurrency(machine.purchase_price)}
              </div>
              <div style={{ padding: '14px 16px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', fontSize: '14px' }}>
                {formatDate(machine.date_acquired)}
              </div>
              <div style={{ padding: '14px 16px' }} className="flex gap-1 justify-end">
                {!machine.is_archived && (
                  <>
                    <button
                      onClick={() => setSelectedMachineId(machine.id)}
                      title="View Details"
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--copper-base)', padding: '5px' }}
                    >
                      <Eye size={15} />
                    </button>
                    <button
                      onClick={() => setEditMachine(machine)}
                      title="Edit"
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '5px' }}
                    >
                      <Pencil size={15} />
                    </button>
                  </>
                )}
                {machine.is_archived && (
                  <button
                    onClick={() => setSelectedMachineId(machine.id)}
                    title="View Details"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '5px' }}
                  >
                    <Eye size={15} />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Summary count */}
      {!loading && filtered.length > 0 && (
        <div style={{ fontFamily: 'var(--font-heading)', fontSize: '11px', letterSpacing: '0.1em', color: 'var(--text-muted)' }}>
          {filtered.length} {filtered.length === 1 ? 'MACHINE' : 'MACHINES'}
        </div>
      )}

      {/* Add machine form */}
      {showAddForm && (
        <MachineForm
          machine={null}
          locationId={locationId}
          onSave={fetchData}
          onClose={() => setShowAddForm(false)}
        />
      )}

      {/* Edit machine form */}
      {editMachine && (
        <MachineForm
          machine={editMachine}
          locationId={locationId}
          onSave={fetchData}
          onClose={() => setEditMachine(null)}
        />
      )}
    </div>
  )
}
