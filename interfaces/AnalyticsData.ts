export interface AnalyticsData {
  metrics: {
    totalEarnings: number
    totalProjects: number
    completedProjects: number
    activeProjects: number
    averageRating: number
    totalReviews: number
    monthlyEarnings: number
    pendingEarnings: number
  }
  monthlyData: Array<{
    month: string
    earnings: number
    projects: number
  }>
  topServices: Array<{
    service: string
    earnings: number
    projects: number
  }>
}

export interface Recommendation {
  type: string
  title: string
  description: string
  action?: string
}

