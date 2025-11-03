export interface Freelancer {
  id: string
  full_name: string
  bio: string
  hourly_rate: number
  rating: number
  total_reviews: number
  skills: string[]
  location: string
  avatar_url?: string
  completed_projects: number
  response_time: string
  languages: string[]
  availability: string
  user_type: string
  experience_years: number
  email: string
  user_id: string
}
