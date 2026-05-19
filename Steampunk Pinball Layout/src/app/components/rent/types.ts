export type RentCommissionType = 'flat_fee' | 'percentage' | 'combination'

export interface Agreement {
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
}
