export type MachineStatus = 'Active' | 'Out of Service' | 'Retired'
export type CompoundingInterval = 'daily' | 'weekly' | 'monthly'
export type PaymentFrequency = 'weekly' | 'biweekly' | 'monthly'
export type RentCommissionType = 'flat_fee' | 'percentage' | 'combination'
export type ExpenseSource = 'manual' | 'maintenance_log' | 'bank_import'
export type RevenueSource = 'manual' | 'bank_import'

export interface Database {
  public: {
    Tables: {
      locations: {
        Row: {
          id: string
          name: string
          address: string | null
          main_contact: string | null
          contact_email: string | null
          phone_number: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          address?: string | null
          main_contact?: string | null
          contact_email?: string | null
          phone_number?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          address?: string | null
          main_contact?: string | null
          contact_email?: string | null
          phone_number?: string | null
          created_at?: string
        }
      }
      machines: {
        Row: {
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
        Insert: {
          id?: string
          location_id: string
          name: string
          purchase_price?: number | null
          date_acquired?: string | null
          status?: MachineStatus
          is_archived?: boolean
          archived_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          location_id?: string
          name?: string
          purchase_price?: number | null
          date_acquired?: string | null
          status?: MachineStatus
          is_archived?: boolean
          archived_at?: string | null
          updated_at?: string
        }
      }
      maintenance_items: {
        Row: {
          id: string
          machine_id: string
          name: string
          interval_days: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          machine_id: string
          name: string
          interval_days: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          machine_id?: string
          name?: string
          interval_days?: number
          updated_at?: string
        }
      }
      maintenance_logs: {
        Row: {
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
        Insert: {
          id?: string
          machine_id: string
          maintenance_item_id: string
          date_performed: string
          cost?: number | null
          notes?: string | null
          expense_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          machine_id?: string
          maintenance_item_id?: string
          date_performed?: string
          cost?: number | null
          notes?: string | null
          expense_id?: string | null
          updated_at?: string
        }
      }
      revenue_categories: {
        Row: {
          id: string
          name: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
        }
      }
      machine_revenue: {
        Row: {
          id: string
          machine_id: string
          location_id: string
          collection_date: string
          collection_period_start: string
          collection_period_end: string
          amount: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          machine_id: string
          location_id: string
          collection_date: string
          collection_period_start: string
          collection_period_end: string
          amount?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          machine_id?: string
          location_id?: string
          collection_date?: string
          collection_period_start?: string
          collection_period_end?: string
          amount?: number
          updated_at?: string
        }
      }
      non_machine_revenue: {
        Row: {
          id: string
          location_id: string | null
          date: string
          category_id: string
          amount: number
          notes: string | null
          source: RevenueSource
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          location_id?: string | null
          date: string
          category_id: string
          amount: number
          notes?: string | null
          source?: RevenueSource
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          location_id?: string | null
          date?: string
          category_id?: string
          amount?: number
          notes?: string | null
          source?: RevenueSource
          updated_at?: string
        }
      }
      expense_categories: {
        Row: {
          id: string
          name: string
          is_default: boolean
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          is_default?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          is_default?: boolean
        }
      }
      expenses: {
        Row: {
          id: string
          location_id: string | null
          date: string
          category_id: string
          amount: number
          description: string | null
          machine_id: string | null
          file_url: string | null
          source: ExpenseSource
          maintenance_log_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          location_id?: string | null
          date: string
          category_id: string
          amount: number
          description?: string | null
          machine_id?: string | null
          file_url?: string | null
          source?: ExpenseSource
          maintenance_log_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          location_id?: string | null
          date?: string
          category_id?: string
          amount?: number
          description?: string | null
          machine_id?: string | null
          file_url?: string | null
          source?: ExpenseSource
          maintenance_log_id?: string | null
          updated_at?: string
        }
      }
      rent_commission_agreements: {
        Row: {
          id: string
          location_id: string
          type: RentCommissionType
          flat_fee_amount: number | null
          percentage_rate: number | null
          revenue_threshold: number | null
          effective_date: string
          end_date: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          location_id: string
          type: RentCommissionType
          flat_fee_amount?: number | null
          percentage_rate?: number | null
          revenue_threshold?: number | null
          effective_date: string
          end_date?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          location_id?: string
          type?: RentCommissionType
          flat_fee_amount?: number | null
          percentage_rate?: number | null
          revenue_threshold?: number | null
          effective_date?: string
          end_date?: string | null
          notes?: string | null
          updated_at?: string
        }
      }
      loans: {
        Row: {
          id: string
          name: string
          principal_amount: number
          interest_rate: number
          compounding_interval: CompoundingInterval
          loan_term_months: number
          payment_frequency: PaymentFrequency
          start_date: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          principal_amount: number
          interest_rate: number
          compounding_interval: CompoundingInterval
          loan_term_months: number
          payment_frequency: PaymentFrequency
          start_date: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          principal_amount?: number
          interest_rate?: number
          compounding_interval?: CompoundingInterval
          loan_term_months?: number
          payment_frequency?: PaymentFrequency
          start_date?: string
          is_active?: boolean
          updated_at?: string
        }
      }
      files: {
        Row: {
          id: string
          name: string
          storage_path: string
          file_type: string | null
          size_bytes: number | null
          machine_id: string | null
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          storage_path: string
          file_type?: string | null
          size_bytes?: number | null
          machine_id?: string | null
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          storage_path?: string
          file_type?: string | null
          size_bytes?: number | null
          machine_id?: string | null
          description?: string | null
          updated_at?: string
        }
      }
    }
  }
}
