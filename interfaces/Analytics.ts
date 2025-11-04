import type { Project } from "./Project"
import type { Transaction } from "./Transaction"
import type { Review } from "./Review"

export interface AnalyticsMetrics {
  totalEarnings: number
  totalProjects: number
  completedProjects: number
  activeProjects: number
  averageRating: number
  totalReviews: number
  monthlyEarnings: number
  pendingEarnings: number
}

export interface MonthlyData {
  month: string
  earnings: number
  projects: number
}

export interface TopService {
  service: string
  earnings: number
  projects: number
}

export interface Analytics {
  metrics: AnalyticsMetrics
  monthlyData: MonthlyData[]
  topServices: TopService[]
  projects: Project[]
  transactions: Transaction[]
  reviews: Review[]
}

