export interface Profile {
  id: string
  full_name: string
  email: string
  skills: string[]
  hourly_rate: number
  avatar_url?: string
  bio: string
  experience_years: number
  rating?: number
  completed_projects?: number
  availability: string
  created_at: string
  portfolio_items?: any[]
  reviews?: any[]
}