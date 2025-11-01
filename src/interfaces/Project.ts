import type { Proposal } from "@/interfaces/Proposal"

export interface Project {
  id: string
  title: string
  description: string
  proposals?: Proposal[]
  budget?: number
  budget_min?: number
  budget_max?: number
  project_type?: string
  required_skills?: string[]
  deadline?: string
  status?: string
  payment_status?: string
  duration?: string
  requirements?: string
  created_at: string
  started_at?: string
  completed_at?: string
  progress_percentage?: number
  total_milestones?: number
  completed_milestones?: number
  progress_notes?: string
  last_progress_update?: string
  total_deliverables?: number
  approved_deliverables?: number
  auto_release_enabled?: boolean
  client?: {
    id: string
    full_name: string
    email: string
    rating?: number
    avatar_url?: string
  }
  project_milestones?: Array<{
    id: string
    title: string
    description?: string
    due_date?: string
    status: string
    amount?: number
    created_at: string
  }>
  freelancer?: {
    full_name: string
    email: string
    rating: number
    skills: string[] 
  }
  _isFromTransaction?: boolean
  _transactionId?: string
}
