export interface Review {
  id: string
  overall_rating: number
  communication_rating: number
  quality_rating: number
  timeliness_rating: number
  review_text: string
  created_at: string
  reviewer: {
    id: string
    full_name: string
    avatar_url?: string
  }
  project: {
    title: string
    created_at: string
  }
}

export interface ReviewStats {
  totalReviews: number
  averageRating: number
  averageCommunication: number
  averageQuality: number
  averageTimeliness: number
  ratingDistribution: { [key: number]: number }
}

export interface ReviewsDisplayProps {
  userId?: string
  userType: "freelancer" | "client"
  showStats?: boolean
}