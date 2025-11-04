import type { Transaction } from "./Transaction"

export interface PaymentData {
  success: boolean
  transaction?: Transaction
  message?: string
}

