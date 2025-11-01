export interface Milestone {
  id: string
  title: string
  description: string
  amount: number
  status: "pending" | "in_progress" | "completed" | "approved"
  due_date: string | null
  completed_at: string | null
  approved_at: string | null
  created_at: string
}
