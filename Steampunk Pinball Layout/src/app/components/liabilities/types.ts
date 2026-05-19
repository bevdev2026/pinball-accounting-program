export type CompoundingInterval = 'daily' | 'weekly' | 'monthly'
export type PaymentFrequency = 'weekly' | 'biweekly' | 'monthly'

export interface Loan {
  id: string
  name: string
  principal_amount: number
  interest_rate: number        // annual, stored as decimal e.g. 0.05 = 5%
  compounding_interval: CompoundingInterval
  loan_term_months: number
  payment_frequency: PaymentFrequency
  start_date: string
  is_active: boolean
  created_at: string
}

export interface LoanStatus {
  remainingBalance: number
  totalPaid: number
  paymentAmount: number
  paymentsMade: number
  paymentsTotal: number
  paymentsRemaining: number
  isFullyPaid: boolean
}
