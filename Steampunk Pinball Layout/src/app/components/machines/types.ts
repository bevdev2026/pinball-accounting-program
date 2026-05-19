export type MachineStatus = 'Active' | 'Out of Service' | 'Retired'

export type Machine = {
  id: string
  location_id: string
  name: string
  purchase_price: number | null
  date_acquired: string | null
  status: MachineStatus
  is_archived: boolean
  archived_at: string | null
  created_at: string
  updated_at: string
}

export type MaintenanceItem = {
  id: string
  machine_id: string
  name: string
  interval_days: number
  created_at: string
  updated_at: string
}

export type MaintenanceLog = {
  id: string
  machine_id: string
  maintenance_item_id: string
  date_performed: string
  cost: number | null
  notes: string | null
  expense_id: string | null
  created_at: string
  updated_at: string
}
