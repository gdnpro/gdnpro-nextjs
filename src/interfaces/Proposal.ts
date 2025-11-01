export interface Proposal {
  id: string
  project_id: string
  status: string
  proposed_budget: number
  delivery_time: number
  message: string
  created_at: string
  freelancer_id: string
  freelancer?: {
    full_name: string
    rating: string
    hourly_rate: string
    skills: string[]
  }
  project: {
    id: string
    title: string
    description: string
    budget_min: number
    budget_max: number
    project_type: string
    required_skills: string[]
    deadline?: string
    status: string
    created_at: string
    client?: {
      id: string
      full_name: string
      email: string
      rating?: number
      avatar_url?: string
    }
    // Agregado para progreso
    progress_percentage?: number
  }
}
