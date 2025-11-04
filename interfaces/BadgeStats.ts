export interface BadgeStats {
  totalProjects: number
  completedProjects: number
  totalEarnings: number
  averageRating: number
  totalReviews: number
  responseTime?: number
  onTimeDelivery?: number
  projectsCompleted?: number // Alias for completedProjects
  totalRevenue?: number // Alias for totalEarnings
  daysActive?: number
}

