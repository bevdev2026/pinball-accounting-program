import type { Loan, LoanStatus } from './types'

export interface ScheduleRow {
  paymentNum: number
  date: Date
  amount: number     // total payment (interest + principal)
  interest: number
  principal: number
  balance: number    // remaining balance AFTER this payment
  status: 'paid' | 'next' | 'upcoming'
}

const COMPOUNDING_PER_YEAR = { daily: 365, weekly: 52, monthly: 12 } as const
const PAYMENTS_PER_YEAR = { weekly: 52, biweekly: 26, monthly: 12 } as const
const INTERVAL_DAYS = { weekly: 7, biweekly: 14, monthly: 0 } as const

function paymentDate(startDate: Date, i: number, frequency: Loan['payment_frequency']): Date {
  if (frequency === 'monthly') {
    const d = new Date(startDate)
    d.setMonth(d.getMonth() + i + 1)
    return d
  }
  const days = INTERVAL_DAYS[frequency]
  return new Date(startDate.getTime() + (i + 1) * days * 86_400_000)
}

export function calcPaymentAmount(loan: Pick<Loan, 'principal_amount' | 'interest_rate' | 'compounding_interval' | 'loan_term_months' | 'payment_frequency'>): number {
  const { principal_amount, interest_rate, compounding_interval, loan_term_months, payment_frequency } = loan
  const compPerYear = COMPOUNDING_PER_YEAR[compounding_interval]
  const pmtPerYear = PAYMENTS_PER_YEAR[payment_frequency]

  // Effective annual rate, then convert to per-payment rate
  const ear = Math.pow(1 + interest_rate / compPerYear, compPerYear) - 1
  const r = Math.pow(1 + ear, 1 / pmtPerYear) - 1
  const n = Math.round(loan_term_months * pmtPerYear / 12)

  if (r === 0 || n === 0) return principal_amount / Math.max(n, 1)
  return principal_amount * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1)
}

export function calcAmortizationSchedule(loan: Loan): ScheduleRow[] {
  const { interest_rate, compounding_interval, loan_term_months, payment_frequency, start_date, principal_amount } = loan
  const compPerYear = COMPOUNDING_PER_YEAR[compounding_interval]
  const pmtPerYear = PAYMENTS_PER_YEAR[payment_frequency]
  const ear = Math.pow(1 + interest_rate / compPerYear, compPerYear) - 1
  const r = Math.pow(1 + ear, 1 / pmtPerYear) - 1
  const n = Math.round(loan_term_months * pmtPerYear / 12)
  const pmt = calcPaymentAmount(loan)

  const startDate = new Date(start_date + 'T00:00:00')
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  let balance = principal_amount
  let nextAssigned = false
  const rows: ScheduleRow[] = []

  for (let i = 0; i < n; i++) {
    const date = paymentDate(startDate, i, payment_frequency)
    const interest = balance * r
    const principal = Math.min(pmt - interest, balance)
    const amount = interest + principal
    balance = Math.max(0, balance - principal)

    let status: ScheduleRow['status']
    if (date <= today) {
      status = 'paid'
    } else if (!nextAssigned) {
      status = 'next'
      nextAssigned = true
    } else {
      status = 'upcoming'
    }

    rows.push({ paymentNum: i + 1, date, amount, interest, principal, balance, status })
    if (balance < 0.005) break
  }

  return rows
}

export function calcLoanStatus(loan: Loan): LoanStatus {
  const { principal_amount, interest_rate, compounding_interval, loan_term_months, payment_frequency, start_date } = loan
  const compPerYear = COMPOUNDING_PER_YEAR[compounding_interval]
  const pmtPerYear = PAYMENTS_PER_YEAR[payment_frequency]

  const ear = Math.pow(1 + interest_rate / compPerYear, compPerYear) - 1
  const r = Math.pow(1 + ear, 1 / pmtPerYear) - 1
  const n = Math.round(loan_term_months * pmtPerYear / 12)
  const pmt = calcPaymentAmount(loan)

  const startDate = new Date(start_date + 'T00:00:00')
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  let balance = principal_amount
  let totalPaid = 0
  let paymentsMade = 0

  for (let i = 0; i < n; i++) {
    if (paymentDate(startDate, i, payment_frequency) > today) break

    const interest = balance * r
    const principal = Math.min(pmt - interest, balance)
    const actual = interest + principal

    totalPaid += actual
    balance = Math.max(0, balance - principal)
    paymentsMade++

    if (balance < 0.005) { balance = 0; break }
  }

  return {
    remainingBalance: balance,
    totalPaid,
    paymentAmount: pmt,
    paymentsMade,
    paymentsTotal: n,
    paymentsRemaining: n - paymentsMade,
    isFullyPaid: balance < 0.005,
  }
}
