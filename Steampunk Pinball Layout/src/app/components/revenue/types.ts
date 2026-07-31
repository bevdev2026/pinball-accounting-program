export type MachineRevenue = {
  id: string
  machine_id: string
  location_id: string
  collection_date: string
  collection_period_start: string
  collection_period_end: string
  coin: number
  bill_drop: number
  card: number
  phone_tap: number
  created_at: string
  updated_at: string
  machines?: { name: string }
}

export type NonMachineRevenue = {
  id: string
  location_id: string | null
  date: string
  category_id: string
  amount: number
  notes: string | null
  source: 'manual' | 'bank_import'
  created_at: string
  updated_at: string
  revenue_categories?: { name: string }
  locations?: { name: string } | null
}

export type RevenueCategory = {
  id: string
  name: string
  created_at: string
}

export type ActiveMachine = {
  id: string
  name: string
  status: string
}
