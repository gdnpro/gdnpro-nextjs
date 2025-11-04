"use client"

import { useEffect, useState } from "react"
import { supabaseBrowser } from "@/utils/supabase/client"

const supabase = supabaseBrowser()

interface Review {
  id: string
  project_id?: string
  reviewer_id: string
  reviewee_id: string
  reviewer_type: string
  reviewee_type: string
  overall_rating: number
  communication_rating: number
  quality_rating: number
  timeliness_rating: number
  review_text: string
  is_public: boolean
  created_at: string
  reviewer_name?: string
  reviewer_avatar?: string
  project_title?: string
}

interface ReviewsDisplayPublicProps {
  freelancerId: string
}

export function ReviewsDisplayPublic({
  freelancerId,
}: ReviewsDisplayPublicProps) {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [showAllReviews, setShowAllReviews] = useState(false)

  const [averageRatings, setAverageRatings] = useState({
    overall: 0,
    communication: 0,
    quality: 0,
    timeliness: 0,
  })

  useEffect(() => {
    loadPublicReviews(freelancerId)
  }, [freelancerId])

  const loadPublicReviews = async (id: string) => {
    try {
      setLoading(true)
      // Obtener reseñas públicas
      const { data: reviewsData, error: reviewsError } = await supabase
        .from("reviews")
        .select("*")
        .eq("reviewee_id", id)
        .eq("reviewee_type", "freelancer")
        .eq("is_public", true)
        .order("created_at", { ascending: false })

      if (reviewsError) throw reviewsError

      // Obtener info de los reviewers
      const reviewerIds = reviewsData?.map((r: Review) => r.reviewer_id) || []
      const { data: reviewersData } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url")
        .in("id", reviewerIds)

      // Mapear nombre y avatar a cada reseña
      const reviewsWithReviewer =
        reviewsData?.map((r: Review) => {
          const reviewer = reviewersData?.find((p: { id: string; full_name: string; avatar_url?: string }) => p.id === r.reviewer_id)
          return {
            ...r,
            reviewer_name: reviewer?.full_name || "Usuario",
            reviewer_avatar: reviewer?.avatar_url || null,
          }
        }) || []

      setReviews(reviewsWithReviewer)
      calculateAverageRatings(reviewsWithReviewer)
    } catch (err) {
      console.error("Error cargando reseñas públicas:", err)
      setReviews([])
      setAverageRatings({
        overall: 0,
        communication: 0,
        quality: 0,
        timeliness: 0,
      })
    } finally {
      setLoading(false)
    }
  }

  const calculateAverageRatings = (reviews: Review[]) => {
    if (!reviews.length) return
    const total = reviews.length

    const sumOverall = reviews.reduce(
      (acc, r) => acc + (r.overall_rating || 0),
      0
    )
    const sumCommunication = reviews.reduce(
      (acc, r) => acc + (r.communication_rating || 0),
      0
    )
    const sumQuality = reviews.reduce(
      (acc, r) => acc + (r.quality_rating || 0),
      0
    )
    const sumTimeliness = reviews.reduce(
      (acc, r) => acc + (r.timeliness_rating || 0),
      0
    )

    setAverageRatings({
      overall: parseFloat((sumOverall / total).toFixed(1)),
      communication: parseFloat((sumCommunication / total).toFixed(1)),
      quality: parseFloat((sumQuality / total).toFixed(1)),
      timeliness: parseFloat((sumTimeliness / total).toFixed(1)),
    })
  }

  const renderStars = (rating: number, size: "sm" | "md" | "lg" = "md") => {
    const sizeClass =
      size === "sm" ? "text-sm" : size === "lg" ? "text-xl" : "text-base"

    return (
      <div className={`flex items-center ${sizeClass}`}>
        {[1, 2, 3, 4, 5].map((star) => (
          <i
            key={star}
            className={`ri-star-fill mr-0.5 ${
              star <= Math.round(rating) ? "text-yellow-400" : "text-gray-300"
            }`}
          ></i>
        ))}
        <span className="ml-1 text-gray-600 font-medium">
          {rating.toFixed(1)}
        </span>
      </div>
    )
  }

  const displayedReviews = showAllReviews ? reviews : reviews.slice(0, 3)

  if (loading) return <p>Cargando reseñas...</p>
  if (!reviews.length)
    return <p className="text-gray-500">Aún no hay reseñas públicas.</p>

  return (
    <div className="space-y-6">
      {/* Estadísticas generales */}
      <div className="bg-blue-50 rounded-xl p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">
          Resumen de Calificaciones
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-white rounded-lg">
            <div className="text-2xl font-bold text-primary">
              {averageRatings.overall}
            </div>
            <div className="text-sm text-gray-600">General</div>
            {renderStars(averageRatings.overall)}
          </div>
          <div className="text-center p-4 bg-white rounded-lg">
            <div className="text-2xl font-bold text-primary">
              {averageRatings.communication}
            </div>
            <div className="text-sm text-gray-600">Comunicación</div>
            {renderStars(averageRatings.communication, "sm")}
          </div>
          <div className="text-center p-4 bg-white rounded-lg">
            <div className="text-2xl font-bold text-primary">
              {averageRatings.quality}
            </div>
            <div className="text-sm text-gray-600">Calidad</div>
            {renderStars(averageRatings.quality, "sm")}
          </div>
          <div className="text-center p-4 bg-white rounded-lg">
            <div className="text-2xl font-bold text-primary">
              {averageRatings.timeliness}
            </div>
            <div className="text-sm text-gray-600">Puntualidad</div>
            {renderStars(averageRatings.timeliness, "sm")}
          </div>
        </div>
      </div>

      {/* Lista de reseñas */}
      {displayedReviews.map((r) => (
        <div
          key={r.id}
          className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center">
              {r.reviewer_avatar ? (
                <img
                  src={r.reviewer_avatar}
                  alt={r.reviewer_name}
                  className="w-12 h-12 rounded-full object-cover object-top mr-4"
                />
              ) : (
                <div className="w-12 h-12 bg-gray-300 rounded-full mr-4 flex items-center justify-center text-white text-lg font-bold">
                  {r.reviewer_name?.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <h4 className="font-semibold text-gray-900">
                  {r.reviewer_name}
                </h4>
                {r.project_title && (
                  <p className="text-sm text-gray-600">
                    Proyecto: {r.project_title}
                  </p>
                )}
                <p className="text-xs text-gray-500">
                  {new Date(r.created_at).toLocaleDateString("es-ES", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
            </div>
            <div>{renderStars(r.overall_rating, "lg")}</div>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-4 text-sm text-center">
            <div>
              <div className="text-gray-600">Comunicación</div>
              <div className="font-medium text-gray-900">
                {r.communication_rating}/5
              </div>
            </div>
            <div>
              <div className="text-gray-600">Calidad</div>
              <div className="font-medium text-gray-900">
                {r.quality_rating}/5
              </div>
            </div>
            <div>
              <div className="text-gray-600">Puntualidad</div>
              <div className="font-medium text-gray-900">
                {r.timeliness_rating}/5
              </div>
            </div>
          </div>

          {r.review_text && (
            <div className="bg-gray-50 rounded-lg p-4 text-gray-700">
              "{r.review_text}"
            </div>
          )}
        </div>
      ))}

      {reviews.length > 3 && (
        <button
          onClick={() => setShowAllReviews(!showAllReviews)}
          className="text-primary hover:text-cyan-700 font-medium text-sm"
        >
          {showAllReviews ? "Ver menos" : `Ver todas (${reviews.length})`}
        </button>
      )}
    </div>
  )
}
