export type Expense = {
  id: string
  location_id: string | null
  date: string
  category_id: string
  amount: number
  description: string | null
  machine_id: string | null
  file_url: string | null
  source: 'manual' | 'maintenance_log' | 'bank_import'
  maintenance_log_id: string | null
  created_at: string
  updated_at: string
  expense_categories?: { name: string }
  machines?: { name: string } | null
  locations?: { name: string } | null
}

export type ExpenseCategory = {
  id: string
  name: string
  is_default: boolean
  created_at: string
}

export type ActiveMachine = {
  id: string
  name: string
  status: string
}
