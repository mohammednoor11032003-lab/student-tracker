export type TransactionType = 'earn' | 'spend' | 'adjustment'

export interface BankTransaction {
  id: string
  student_id: string
  amount: number
  type: TransactionType
  description: string
  reference_id?: string | null
  created_by?: string | null
  created_at: string
}

export interface StudentBankSummary {
  student_id: string
  student_name: string
  total_earned: number
  total_spent: number
  current_balance: number
  transactions: BankTransaction[]
}

export interface BankApiResponse {
  success: boolean
  summary?: StudentBankSummary
  summaries?: StudentBankSummary[]
  transaction?: BankTransaction
  error?: string
}
