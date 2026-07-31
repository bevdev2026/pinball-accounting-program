import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { ActiveMachine } from './types'
import { MachineRevenueTab } from './MachineRevenueTab'
import { NonMachineRevenueTab } from './NonMachineRevenueTab'
import { useActiveLocation, ALL_LOCATIONS_ID } from '../../context/LocationContext'

type Tab = 'machine' | 'other'

export function RevenueView() {
  const { activeLocationId } = useActiveLocation()
  const showingAllLocations = activeLocationId === ALL_LOCATIONS_ID
  const [activeTab, setActiveTab] = useState<Tab>('machine')
  const [machines, setMachines] = useState<ActiveMachine[]>([])

  useEffect(() => {
    async function init() {
      if (!activeLocationId || showingAllLocations) { setMachines([]); return }
      const { data: m } = await supabase
        .from('machines')
        .select('id, name, status')
        .eq('location_id', activeLocationId)
        .eq('is_archived', false)
        .neq('status', 'Retired')
        .order('name')
      if (m) setMachines(m)
    }
    init()
  }, [activeLocationId])

  const tabStyle = (active: boolean): React.CSSProperties => ({
    padding: '8px 20px',
    fontFamily: 'var(--font-heading)',
    fontSize: '12px',
    letterSpacing: '0.12em',
    cursor: 'pointer',
    border: 'none',
    borderBottom: active ? '2px solid var(--copper-base)' : '2px solid transparent',
    backgroundColor: 'transparent',
    color: active ? 'var(--copper-bright)' : 'var(--text-muted)',
    transition: 'all 0.15s',
  })

  return (
    <div className="p-8 space-y-6">
      {/* Page header */}
      <div>
        <h2 className="text-3xl tracking-wide" style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-heading)' }}>
          Revenue
        </h2>
        <p className="text-sm tracking-wider opacity-70 mt-1" style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-secondary)' }}>
          MACHINE COLLECTIONS & OTHER REVENUE
        </p>
      </div>

      {/* Tab bar */}
      <div style={{ borderBottom: '1px solid var(--copper-dark)' }}>
        <button style={tabStyle(activeTab === 'machine')} onClick={() => setActiveTab('machine')}>
          MACHINE REVENUE
        </button>
        <button style={tabStyle(activeTab === 'other')} onClick={() => setActiveTab('other')}>
          OTHER REVENUE
        </button>
      </div>

      {/* Tab content */}
      {activeTab === 'machine' ? (
        showingAllLocations ? (
          <div className="p-8 text-center" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-body)', fontSize: '14px' }}>
            Select a specific location from the sidebar to view and manage Machine Revenue.
          </div>
        ) : (
          <MachineRevenueTab locationId={activeLocationId} machines={machines} />
        )
      ) : (
        <NonMachineRevenueTab />
      )}
    </div>
  )
}
