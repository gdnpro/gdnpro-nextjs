import type { Deliverable } from "./Deliverable"
import type { Milestone } from "./Milestone"

export interface ProjectDetails {
  id: string
  title: string
  description: string
  status: string
  progress_percentage: number
  total_milestones: number
  completed_milestones: number
  client: {
    id: string
    full_name: string
    email: string
    avatar_url?: string
    rating?: number
  }
  freelancer: {
    id: string
    full_name: string
    email: string
    avatar_url?: string
    rating?: number
  }
  milestones: Milestone[]
  deliverables: Deliverable[]
  created_at: string
  completed_at: string | null
}
