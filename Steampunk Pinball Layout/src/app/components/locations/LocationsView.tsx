import { useState } from 'react'
import { Plus, Pencil } from 'lucide-react'
import { useActiveLocation } from '../../context/LocationContext'
import type { Location } from './types'
import { LocationForm } from './LocationForm'
import { Button } from '../ui/button'

const colHeader: React.CSSProperties = {
  fontFamily: 'var(--font-heading)',
  fontSize: '10px',
  letterSpacing: '0.12em',
  color: 'var(--text-muted)',
  padding: '10px 16px',
}

export function LocationsView() {
  const { locations, loading, refetchLocations } = useActiveLocation()
  const [showAddForm, setShowAddForm] = useState(false)
  const [editLocation, setEditLocation] = useState<Location | null>(null)

  return (
    <div className="p-8 space-y-6">
      {/* Page header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-3xl tracking-wide" style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-heading)' }}>
            Locations
          </h2>
          <p className="text-sm tracking-wider opacity-70 mt-1" style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-secondary)' }}>
            VENUES & CONTACT INFORMATION
          </p>
        </div>
        <Button
          onClick={() => setShowAddForm(true)}
          style={{ backgroundColor: 'var(--copper-base)', color: 'var(--text-heading)' }}
        >
          <Plus size={16} />
          Add Location
        </Button>
      </div>

      {/* Table */}
      <div style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--copper-dark)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
        {/* Column headers */}
        <div className="grid" style={{ gridTemplateColumns: '1fr 1.5fr 1fr 1fr 1fr 60px', borderBottom: '1px solid var(--copper-dark)' }}>
          <div style={colHeader}>NAME</div>
          <div style={colHeader}>ADDRESS</div>
          <div style={colHeader}>MAIN CONTACT</div>
          <div style={colHeader}>EMAIL</div>
          <div style={colHeader}>PHONE</div>
          <div style={colHeader} />
        </div>

        {loading ? (
          <div className="p-8 text-center" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-heading)', fontSize: '13px', letterSpacing: '0.1em' }}>
            LOADING…
          </div>
        ) : locations.length === 0 ? (
          <div className="p-8 text-center" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-body)', fontSize: '14px' }}>
            No locations yet. Add your first location to get started.
          </div>
        ) : (
          locations.map((location, i) => (
            <div
              key={location.id}
              className="grid items-center"
              style={{
                gridTemplateColumns: '1fr 1.5fr 1fr 1fr 1fr 60px',
                borderBottom: i < locations.length - 1 ? '1px solid rgba(107,46,18,0.25)' : 'none',
              }}
            >
              <div style={{ padding: '14px 16px', fontFamily: 'var(--font-body)', color: 'var(--text-primary)', fontSize: '15px' }}>
                {location.name}
              </div>
              <div style={{ padding: '14px 16px', fontFamily: 'var(--font-body)', color: 'var(--text-secondary)', fontSize: '14px' }}>
                {location.address ?? '—'}
              </div>
              <div style={{ padding: '14px 16px', fontFamily: 'var(--font-body)', color: 'var(--text-secondary)', fontSize: '14px' }}>
                {location.main_contact ?? '—'}
              </div>
              <div style={{ padding: '14px 16px', fontFamily: 'var(--font-body)', color: 'var(--text-secondary)', fontSize: '14px' }}>
                {location.contact_email ?? '—'}
              </div>
              <div style={{ padding: '14px 16px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', fontSize: '14px' }}>
                {location.phone_number ?? '—'}
              </div>
              <div style={{ padding: '14px 16px' }} className="flex justify-end">
                <button
                  onClick={() => setEditLocation(location)}
                  title="Edit"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '5px' }}
                >
                  <Pencil size={15} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Summary count */}
      {!loading && locations.length > 0 && (
        <div style={{ fontFamily: 'var(--font-heading)', fontSize: '11px', letterSpacing: '0.1em', color: 'var(--text-muted)' }}>
          {locations.length} {locations.length === 1 ? 'LOCATION' : 'LOCATIONS'}
        </div>
      )}

      {/* Add location form */}
      {showAddForm && (
        <LocationForm
          location={null}
          onSave={refetchLocations}
          onClose={() => setShowAddForm(false)}
        />
      )}

      {/* Edit location form */}
      {editLocation && (
        <LocationForm
          location={editLocation}
          onSave={refetchLocations}
          onClose={() => setEditLocation(null)}
        />
      )}
    </div>
  )
}
