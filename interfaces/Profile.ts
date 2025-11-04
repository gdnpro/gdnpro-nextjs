import type { PortfolioItem } from "./PortfolioItem"
import type { Review } from "./Review"

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
  portfolio_items?: PortfolioItem[]
  reviews?: Review[]
  user_type?: "freelancer" | "client" | "admin"
  user_id?: string
  location?: string
  role?: string
  total_reviews?: number
}