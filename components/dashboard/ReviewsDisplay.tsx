"use client"

import { supabaseBrowser } from "@/utils/supabase/client"
import type { Review, ReviewsDisplayProps, ReviewStats } from "@/interfaces/Review"
import { useState, useEffect } from "react"

const supabase = supabaseBrowser()

export function ReviewsDisplay({ userId, showStats = true }: ReviewsDisplayProps) {
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
        },
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
        },
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
    const sizeClass = size === "sm" ? "text-sm" : size === "lg" ? "text-xl" : "text-base"

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
        <span className="ml-1 font-medium text-gray-600">{rating.toFixed(1)}</span>
      </div>
    )
  }

  const displayedReviews = showAllReviews ? reviews : reviews.slice(0, 3)

  // Mostrar mensaje si userId no es válido
  if (!userId || userId === "undefined" || userId.trim() === "") {
    return (
      <div className="rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 text-yellow-800">
        <div className="flex items-center">
          <i className="ri-alert-line mr-2"></i>
          <span>No se puede cargar las reseñas: ID de usuario no válido</span>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="border-primary h-6 w-6 animate-spin rounded-full border-b-2"></div>
        <span className="ml-2 text-gray-600">Cargando reseñas...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-600">
        <div className="flex items-center">
          <i className="ri-error-warning-line mr-2"></i>
          <span>{error}</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Statistics */}
      {showStats && stats && stats.totalReviews > 0 && (
        <div className="rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 p-4 sm:p-6">
          <div className="mb-4 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="text-base font-bold text-gray-900 sm:text-xl">Resumen de Calificaciones</h3>
            <div className="text-left sm:text-right">
              <div className="text-2xl font-bold text-primary sm:text-3xl">
                {stats.averageRating.toFixed(1)}
              </div>
              <div className="text-xs text-gray-600 sm:text-sm">
                de {stats.totalReviews} reseña
                {stats.totalReviews !== 1 ? "s" : ""}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-6">
            <div className="text-center">
              <div className="mb-1 text-xl font-bold text-gray-900 sm:text-2xl">
                {stats.averageCommunication.toFixed(1)}
              </div>
              <div className="mb-2 text-xs text-gray-600 sm:text-sm">Comunicación</div>
              {renderStars(stats.averageCommunication, "sm")}
            </div>
            <div className="text-center">
              <div className="mb-1 text-xl font-bold text-gray-900 sm:text-2xl">
                {stats.averageQuality.toFixed(1)}
              </div>
              <div className="mb-2 text-xs text-gray-600 sm:text-sm">Calidad</div>
              {renderStars(stats.averageQuality, "sm")}
            </div>
            <div className="text-center">
              <div className="mb-1 text-xl font-bold text-gray-900 sm:text-2xl">
                {stats.averageTimeliness.toFixed(1)}
              </div>
              <div className="mb-2 text-xs text-gray-600 sm:text-sm">Puntualidad</div>
              {renderStars(stats.averageTimeliness, "sm")}
            </div>
          </div>

          {/* Rating Distribution */}
          <div className="mt-4 sm:mt-6">
            <h4 className="mb-3 text-xs font-medium text-gray-700 sm:text-sm">
              Distribución de Calificaciones
            </h4>
            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map((rating) => (
                <div key={rating} className="flex items-center gap-2">
                  <span className="w-4 text-xs text-gray-600 sm:w-3 sm:text-sm">{rating}</span>
                  <i className="ri-star-fill text-xs text-yellow-400 sm:text-sm"></i>
                  <div className="h-2 flex-1 rounded-full bg-gray-200 sm:mr-3">
                    <div
                      className="h-2 rounded-full bg-primary transition-all duration-500"
                      style={{
                        width: `${stats.totalReviews > 0 ? (stats.ratingDistribution[rating] / stats.totalReviews) * 100 : 0}%`,
                      }}
                    ></div>
                  </div>
                  <span className="w-6 text-xs text-gray-600 sm:w-8 sm:text-sm">
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
        <div className="mb-4 flex flex-col gap-2 sm:mb-6 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-base font-bold text-gray-900 sm:text-xl">
            Reseñas {reviews.length > 0 && `(${reviews.length})`}
          </h3>
          {reviews.length > 3 && (
            <button
              onClick={() => setShowAllReviews(!showAllReviews)}
              className="w-fit cursor-pointer text-xs font-medium text-primary hover:text-cyan-700 sm:text-sm"
            >
              {showAllReviews ? "Ver menos" : `Ver todas (${reviews.length})`}
            </button>
          )}
        </div>

        {reviews.length === 0 ? (
          <div className="rounded-lg bg-gray-50 py-8 text-center sm:py-12">
            <i className="ri-star-line mb-3 text-3xl text-gray-400 sm:mb-4 sm:text-4xl"></i>
            <h3 className="mb-2 text-base font-medium text-gray-900 sm:text-lg">Sin reseñas aún</h3>
            <p className="text-sm text-gray-600 sm:text-base">Las reseñas de proyectos completados aparecerán aquí.</p>
          </div>
        ) : (
          <div className="space-y-4 sm:space-y-6">
            {displayedReviews.map((review) => (
              <div
                key={review.id}
                className="rounded-lg border border-gray-200 bg-white p-4 transition-shadow hover:shadow-md sm:p-6"
              >
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 sm:h-12 sm:w-12">
                      {review.reviewer.avatar_url ? (
                        <img
                          src={review.reviewer.avatar_url}
                          alt={review.reviewer.full_name}
                          className="h-10 w-10 rounded-full object-cover object-top sm:h-12 sm:w-12"
                        />
                      ) : (
                        <i className="ri-user-line text-base text-gray-600 sm:text-xl"></i>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm font-semibold text-gray-900 sm:text-base">{review.reviewer.full_name}</h4>
                      <p className="mt-1 truncate text-xs text-gray-600 sm:text-sm">Proyecto: {review.project.title}</p>
                      <p className="mt-1 text-xs text-gray-500">
                        {new Date(review.created_at).toLocaleDateString("es-ES", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="sm:text-right">{renderStars(review.overall_rating, "sm")}</div>
                </div>

                {/* Detailed Ratings */}
                <div className="mb-4 grid grid-cols-3 gap-2 text-xs sm:gap-4 sm:text-sm">
                  <div className="text-center">
                    <div className="text-gray-600">Comunicación</div>
                    <div className="font-medium text-gray-900">{review.communication_rating}/5</div>
                  </div>
                  <div className="text-center">
                    <div className="text-gray-600">Calidad</div>
                    <div className="font-medium text-gray-900">{review.quality_rating}/5</div>
                  </div>
                  <div className="text-center">
                    <div className="text-gray-600">Puntualidad</div>
                    <div className="font-medium text-gray-900">{review.timeliness_rating}/5</div>
                  </div>
                </div>

                {/* Review Text */}
                {review.review_text && (
                  <div className="rounded-lg bg-gray-50 p-3 sm:p-4">
                    <p className="text-sm leading-relaxed text-gray-700 sm:text-base">"{review.review_text}"</p>
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
