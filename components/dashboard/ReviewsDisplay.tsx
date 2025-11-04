"use client"

import { supabaseBrowser } from "@/utils/supabase/client"
import type {
  Review,
  ReviewsDisplayProps,
  ReviewStats,
} from "@/interfaces/Review"
import { useState, useEffect } from "react"

const supabase = supabaseBrowser()

export function ReviewsDisplay({
  userId,
  showStats = true,
}: ReviewsDisplayProps) {
  const [reviews, setReviews] = useState<Review[]>([])
  const [stats, setStats] = useState<ReviewStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [showAllReviews, setShowAllReviews] = useState(false)

  useEffect(() => {
    // Verificar que userId sea válido antes de cargar
    if (userId && userId !== "undefined" && userId.trim() !== "") {
      loadReviews()
      if (showStats) {
        loadStats()
      }
    } else {
      setLoading(false)
      setError("ID de usuario no válido")
    }
  }, [userId])

  const loadReviews = async () => {
    try {
      // Validación adicional del userId
      if (!userId || userId === "undefined" || userId.trim() === "") {
        console.error("❌ userId no válido:", userId)
        setError("ID de usuario no válido")
        setLoading(false)
        return
      }

      const session = await supabase.auth.getSession()
      if (!session.data.session?.access_token) {
        setLoading(false)
        return
      }

      const response = await fetch(
        "https://kdmdhhhppizzlhvauofe.supabase.co/functions/v1/reviews-handler",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.data.session.access_token}`,
          },
          body: JSON.stringify({
            action: "get-reviews",
            revieweeId: userId,
          }),
        }
      )

      if (!response.ok) {
        const errorText = await response.text()
        console.error("❌ Error response:", errorText)
        throw new Error(`Error ${response.status}: ${errorText}`)
      }

      const data = await response.json()

      if (data.success) {
        setReviews(data.reviews || [])
      } else {
        throw new Error(data.error || "Error al cargar reseñas")
      }
    } catch (error: unknown) {
      console.error("❌ Error cargando reseñas:", error)
      const errorMessage = error instanceof Error ? error.message : "Unknown error"
      setError(errorMessage || "Error al cargar reseñas")
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      // Validación adicional del userId
      if (!userId || userId === "undefined" || userId.trim() === "") {
        return
      }

      const session = await supabase.auth.getSession()
      if (!session.data.session?.access_token) {
        return
      }

      const response = await fetch(
        "https://kdmdhhhppizzlhvauofe.supabase.co/functions/v1/reviews-handler",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.data.session.access_token}`,
          },
          body: JSON.stringify({
            action: "get-user-stats",
            revieweeId: userId,
          }),
        }
      )

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setStats(data.stats)
        }
      }
    } catch (error) {
      console.error("❌ Error cargando estadísticas:", error)
    }
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

  // Mostrar mensaje si userId no es válido
  if (!userId || userId === "undefined" || userId.trim() === "") {
    return (
      <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg">
        <div className="flex items-center">
          <i className="ri-alert-line mr-2"></i>
          <span>No se puede cargar las reseñas: ID de usuario no válido</span>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
        <span className="ml-2 text-gray-600">Cargando reseñas...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
        <div className="flex items-center">
          <i className="ri-error-warning-line mr-2"></i>
          <span>{error}</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Statistics */}
      {showStats && stats && stats.totalReviews > 0 && (
        <div className="bg-linear-to-r from-blue-50 to-indigo-50 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900">
              Resumen de Calificaciones
            </h3>
            <div className="text-right">
              <div className="text-3xl font-bold text-primary">
                {stats.averageRating.toFixed(1)}
              </div>
              <div className="text-sm text-gray-600">
                de {stats.totalReviews} reseña
                {stats.totalReviews !== 1 ? "s" : ""}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 mb-1">
                {stats.averageCommunication.toFixed(1)}
              </div>
              <div className="text-sm text-gray-600">Comunicación</div>
              {renderStars(stats.averageCommunication, "sm")}
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 mb-1">
                {stats.averageQuality.toFixed(1)}
              </div>
              <div className="text-sm text-gray-600">Calidad</div>
              {renderStars(stats.averageQuality, "sm")}
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 mb-1">
                {stats.averageTimeliness.toFixed(1)}
              </div>
              <div className="text-sm text-gray-600">Puntualidad</div>
              {renderStars(stats.averageTimeliness, "sm")}
            </div>
          </div>

          {/* Rating Distribution */}
          <div className="mt-6">
            <h4 className="text-sm font-medium text-gray-700 mb-3">
              Distribución de Calificaciones
            </h4>
            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map((rating) => (
                <div key={rating} className="flex items-center">
                  <span className="text-sm text-gray-600 w-3">{rating}</span>
                  <i className="ri-star-fill text-yellow-400 text-sm mx-2"></i>
                  <div className="flex-1 bg-gray-200 rounded-full h-2 mr-3">
                    <div
                      className="bg-primary h-2 rounded-full transition-all duration-500"
                      style={{
                        width: `${stats.totalReviews > 0 ? (stats.ratingDistribution[rating] / stats.totalReviews) * 100 : 0}%`,
                      }}
                    ></div>
                  </div>
                  <span className="text-sm text-gray-600 w-8">
                    {stats.ratingDistribution[rating]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Reviews List */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900">
            Reseñas {reviews.length > 0 && `(${reviews.length})`}
          </h3>
          {reviews.length > 3 && (
            <button
              onClick={() => setShowAllReviews(!showAllReviews)}
              className="text-primary hover:text-cyan-700 font-medium text-sm cursor-pointer"
            >
              {showAllReviews ? "Ver menos" : `Ver todas (${reviews.length})`}
            </button>
          )}
        </div>

        {reviews.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <i className="ri-star-line text-4xl text-gray-400 mb-4"></i>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Sin reseñas aún
            </h3>
            <p className="text-gray-600">
              Las reseñas de proyectos completados aparecerán aquí.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {displayedReviews.map((review) => (
              <div
                key={review.id}
                className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mr-4">
                      {review.reviewer.avatar_url ? (
                        <img
                          src={review.reviewer.avatar_url}
                          alt={review.reviewer.full_name}
                          className="w-12 h-12 rounded-full object-cover object-top"
                        />
                      ) : (
                        <i className="ri-user-line text-gray-600 text-xl"></i>
                      )}
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">
                        {review.reviewer.full_name}
                      </h4>
                      <p className="text-sm text-gray-600">
                        Proyecto: {review.project.title}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(review.created_at).toLocaleDateString(
                          "es-ES",
                          {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          }
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    {renderStars(review.overall_rating)}
                  </div>
                </div>

                {/* Detailed Ratings */}
                <div className="grid grid-cols-3 gap-4 mb-4 text-sm">
                  <div className="text-center">
                    <div className="text-gray-600">Comunicación</div>
                    <div className="font-medium text-gray-900">
                      {review.communication_rating}/5
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-gray-600">Calidad</div>
                    <div className="font-medium text-gray-900">
                      {review.quality_rating}/5
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-gray-600">Puntualidad</div>
                    <div className="font-medium text-gray-900">
                      {review.timeliness_rating}/5
                    </div>
                  </div>
                </div>

                {/* Review Text */}
                {review.review_text && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-700 leading-relaxed">
                      "{review.review_text}"
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
