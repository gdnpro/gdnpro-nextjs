export interface Transaction {
  id: string
  project_id?: string
  freelancer_id: string
  client_id: string
  amount: number
  currency: string
  status: "pending" | "paid" | "failed" | "refunded"
  payment_method?: string
  stripe_session_id?: string
  stripe_payment_intent_id?: string
  project_title?: string
  project_description?: string
  created_at: string
  updated_at?: string
  paid_at?: string
}
