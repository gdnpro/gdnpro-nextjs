export interface Deliverable {
  id: string
  milestone_id: string
  title: string
  description: string
  file_url: string | null
  file_name: string | null
  file_size: number | null
  status: "pending" | "submitted" | "approved" | "revision_requested"
  submitted_at: string | null
  approved_at: string | null
  feedback: string | null
  created_at: string
}
