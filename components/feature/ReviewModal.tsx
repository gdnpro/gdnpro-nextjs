"use client"

import { supabaseBrowser } from "@/utils/supabase/client"
import { useState, useEffect } from "react"

const supabase = supabaseBrowser()

interface ReviewModalProps {
  isOpen: boolean
  onClose: () => void
  project: {
    id: string
    title: string
    reviewee?: {
      id: string
      full_name: string
      avatar_url?: string
    }
    reviewee_type?: "client" | "freelancer"
  }
  onReviewSubmitted: () => void
}

interface Ratings {
  overall: number
  communication: number
  quality: number
  timeliness: number
}

export default function ReviewModal({
  isOpen,
  onClose,
  project,
  onReviewSubmitted,
}: ReviewModalProps) {
  const [ratings, setRatings] = useState<Ratings>({
    overall: 5,
    communication: 5,
    quality: 5,
    timeliness: 5,
  })
  const [reviewText, setReviewText] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setRatings({
        overall: 5,
        communication: 5,
        quality: 5,
        timeliness: 5,
      })
      setReviewText("")
      setError("")
    }
  }, [isOpen])

  const handleRatingChange = (category: keyof Ratings, value: number) => {
    setRatings((prev) => ({
      ...prev,
      [category]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!project.reviewee) {
      setError("Error: No se pudo identificar a quién reseñar")
      return
    }

    setSubmitting(true)
    setError("")

    try {
      const session = await supabase.auth.getSession()
      if (!session.data.session?.access_token) {
        throw new Error("No hay sesión activa")
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
            action: "create-review",
            projectId: project.id,
            revieweeId: project.reviewee.id,
            ratings,
            reviewText: reviewText.trim(),
          }),
        }
      )

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Error ${response.status}: ${errorText}`)
      }

      const data = await response.json()

      if (data.success) {
        onReviewSubmitted()
        onClose()

        window.toast({
          title: "Reseña enviada correctamente",
          type: "success",
          location: "bottom-center",
          dismissible: true,
          icon: true,
        })
      } else {
        throw new Error(data.error || "Error al crear reseña")
      }
    } catch (error: any) {
      console.error("❌ Error creando reseña:", error)
      setError(error.message || "Error al enviar la reseña")
    } finally {
      setSubmitting(false)
    }
  }

  const renderStars = (
    category: keyof Ratings,
    label: string,
    description: string
  ) => {
    return (
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-gray-700">{label}</label>
          <span className="text-sm text-gray-500">{ratings[category]}/5</span>
        </div>
        <p className="text-xs text-gray-500 mb-3">{description}</p>
        <div className="flex items-center space-x-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => handleRatingChange(category, star)}
              className={`w-8 h-8 flex items-center justify-center cursor-pointer transition-colors ${
                star <= ratings[category] ? "text-yellow-400" : "text-gray-300"
              }`}
            >
              <i className="ri-star-fill text-xl"></i>
            </button>
          ))}
        </div>
      </div>
    )
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Calificar Experiencia
              </h2>
              <p className="text-gray-600 mt-1">Proyecto: {project.title}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 cursor-pointer p-1"
            >
              <i className="ri-close-line text-2xl"></i>
            </button>
          </div>

          {/* Reviewee Info */}
          {project.reviewee && (
            <div className="flex items-center mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                {project.reviewee.avatar_url ? (
                  <img
                    src={project.reviewee.avatar_url}
                    alt={project.reviewee.full_name}
                    className="w-12 h-12 rounded-full object-cover object-top"
                  />
                ) : (
                  <i className="ri-user-line text-primary text-xl"></i>
                )}
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">
                  {project.reviewee.full_name}
                </h3>
                <p className="text-gray-600 text-sm">
                  {project.reviewee_type === "freelancer"
                    ? "Freelancer"
                    : "Cliente"}
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
              <div className="flex items-center">
                <i className="ri-error-warning-line mr-2"></i>
                <span>{error}</span>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Rating Categories */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Calificaciones
              </h3>

              {renderStars(
                "overall",
                "Calificación General",
                "Tu experiencia general con este proyecto"
              )}
              {renderStars(
                "communication",
                "Comunicación",
                "Qué tan clara y efectiva fue la comunicación"
              )}
              {renderStars(
                "quality",
                "Calidad del Trabajo",
                "Nivel de calidad del trabajo entregado"
              )}
              {renderStars(
                "timeliness",
                "Puntualidad",
                "Cumplimiento de fechas y entregas a tiempo"
              )}
            </div>

            {/* Review Text */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Comentario (Opcional)
              </label>
              <textarea
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                placeholder="Comparte tu experiencia trabajando en este proyecto..."
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm"
                maxLength={500}
              />
              <p className="text-xs text-gray-500 mt-1">
                {reviewText.length}/500 caracteres
              </p>
            </div>

            {/* Buttons */}
            <div className="flex gap-4">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="flex-1 border border-gray-300 text-gray-700 hover:bg-gray-50 py-3 rounded-lg font-medium text-sm transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 bg-primary hover:bg-cyan-700 text-white py-3 rounded-lg font-medium text-sm transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Enviando...
                  </>
                ) : (
                  <>
                    <i className="ri-star-line mr-2"></i>
                    Enviar Reseña
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Info */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-start">
              <i className="ri-information-line text-primary mr-2 mt-0.5"></i>
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">
                  Información sobre las reseñas
                </p>
                <ul className="text-xs space-y-1">
                  <li>• Las reseñas son públicas y ayudan a otros usuarios</li>
                  <li>• Solo puedes reseñar proyectos completados</li>
                  <li>
                    • Puedes editar tu reseña durante las primeras 24 horas
                  </li>
                  <li>• Sé honesto y constructivo en tus comentarios</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
