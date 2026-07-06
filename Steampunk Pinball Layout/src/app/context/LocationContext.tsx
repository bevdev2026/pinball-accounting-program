import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
import type { Location } from '../components/locations/types'

interface LocationContextValue {
  locations: Location[]
  activeLocationId: string
  setActiveLocationId: (id: string) => void
  refetchLocations: () => Promise<void>
  loading: boolean
}

const LocationContext = createContext<LocationContextValue | null>(null)

const STORAGE_KEY = 'activeLocationId'
export const ALL_LOCATIONS_ID = 'all'

export function LocationProvider({ children }: { children: ReactNode }) {
  const [locations, setLocations] = useState<Location[]>([])
  const [activeLocationId, setActiveLocationIdState] = useState(() => localStorage.getItem(STORAGE_KEY) ?? ALL_LOCATIONS_ID)
  const [loading, setLoading] = useState(true)

  const fetchLocations = useCallback(async () => {
    const { data } = await supabase.from('locations').select('*').order('name')
    if (data) {
      setLocations(data)
      setActiveLocationIdState(current => {
        if (current === ALL_LOCATIONS_ID || data.some(l => l.id === current)) return current
        return ALL_LOCATIONS_ID
      })
    }
    setLoading(false)
  }, [])

  useEffect(() => { fetchLocations() }, [fetchLocations])

  const setActiveLocationId = useCallback((id: string) => {
    setActiveLocationIdState(id)
    localStorage.setItem(STORAGE_KEY, id)
  }, [])

  return (
    <LocationContext.Provider value={{ locations, activeLocationId, setActiveLocationId, refetchLocations: fetchLocations, loading }}>
      {children}
    </LocationContext.Provider>
  )
}

export function useActiveLocation() {
  const ctx = useContext(LocationContext)
  if (!ctx) throw new Error('useActiveLocation must be used within a LocationProvider')
  return ctx
}
