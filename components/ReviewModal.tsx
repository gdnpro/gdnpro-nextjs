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

  // Handle body overflow when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }

    return () => {
      document.body.style.overflow = ""
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
        },
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
    } catch (error: unknown) {
      console.error("❌ Error creando reseña:", error)
      const errorMessage = error instanceof Error ? error.message : "Unknown error"
      setError(errorMessage || "Error al enviar la reseña")
    } finally {
      setSubmitting(false)
    }
  }

  const renderStars = (category: keyof Ratings, label: string, description: string) => {
    return (
      <div className="mb-6 rounded-2xl border border-gray-200 bg-gradient-to-br from-gray-50 to-white p-6 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <label className="text-sm font-semibold text-gray-900">{label}</label>
          <span className="rounded-full bg-gradient-to-r from-cyan-500 to-teal-500 px-3 py-1 text-xs font-bold text-white shadow-md">
            {ratings[category]}/5
          </span>
        </div>
        <p className="mb-4 text-xs text-gray-600">{description}</p>
        <div className="flex items-center gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => handleRatingChange(category, star)}
              className={`group flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl transition-all ${
                star <= ratings[category]
                  ? "scale-110 bg-gradient-to-br from-cyan-400 to-teal-500 text-white shadow-lg shadow-cyan-500/30"
                  : "bg-gray-100 text-gray-300 hover:scale-105 hover:bg-gray-200"
              }`}
            >
              <i className="ri-star-fill text-xl transition-transform group-hover:scale-125"></i>
            </button>
          ))}
        </div>
      </div>
    )
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-black/60 via-black/50 to-black/60 p-4 backdrop-blur-md">
      <div className="animate-in fade-in zoom-in-95 max-h-[92vh] w-full max-w-3xl overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-black/5 duration-300">
        {/* Modern Header with Gradient */}
        <div className="relative overflow-hidden bg-gradient-to-r from-cyan-600 via-cyan-500 to-teal-500 p-8 text-white">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIyIi8+PC9nPjwvZz48L3N2Zz4=')] opacity-20"></div>
          <div className="relative z-10 flex items-start justify-between">
            <div className="flex-1 pr-4">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 ring-1 ring-white/30 backdrop-blur-sm">
                  <i className="ri-star-line text-2xl"></i>
                </div>
                <div>
                  <h2 className="text-3xl leading-tight font-bold sm:text-4xl">
                    Calificar Experiencia
                  </h2>
                      <p className="mt-2 text-sm text-cyan-100">Proyecto: {project.title}</p>
                </div>
              </div>
              {/* Reviewee Info */}
              {project.reviewee && (
                <div className="mt-4 flex items-center gap-3 rounded-xl bg-white/10 p-3 ring-1 ring-white/20 backdrop-blur-sm">
                  <div className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white/20 ring-2 ring-white/30">
                    {project.reviewee.avatar_url ? (
                      <img
                        src={project.reviewee.avatar_url}
                        alt={project.reviewee.full_name}
                        className="h-full w-full object-cover object-top"
                      />
                    ) : (
                      <i className="ri-user-3-line text-xl text-white"></i>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate font-semibold text-white">
                      {project.reviewee.full_name}
                    </h3>
                    <p className="text-xs text-cyan-100">
                      {project.reviewee_type === "freelancer" ? "Freelancer" : "Cliente"}
                    </p>
                  </div>
                </div>
              )}
            </div>
            <button
              onClick={onClose}
              className="group flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/20 backdrop-blur-sm transition-all hover:scale-110 hover:bg-white/20"
              aria-label="Cerrar"
            >
              <i className="ri-close-line text-xl transition-transform group-hover:rotate-90"></i>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-8" style={{ maxHeight: "calc(92vh - 200px)" }}>
          {error && (
            <div className="mb-6 rounded-xl border border-red-200 bg-gradient-to-r from-red-50 to-red-100 px-4 py-3 text-red-600 shadow-sm">
              <div className="flex items-center gap-2">
                <i className="ri-error-warning-line text-lg"></i>
                <span className="font-medium">{error}</span>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Rating Categories */}
            <div>
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-teal-500 text-white shadow-lg">
                  <i className="ri-star-fill text-lg"></i>
                </div>
                <h3 className="text-xl font-bold text-gray-900">Calificaciones</h3>
              </div>

              {renderStars(
                "overall",
                "Calificación General",
                "Tu experiencia general con este proyecto",
              )}
              {renderStars(
                "communication",
                "Comunicación",
                "Qué tan clara y efectiva fue la comunicación",
              )}
              {renderStars(
                "quality",
                "Calidad del Trabajo",
                "Nivel de calidad del trabajo entregado",
              )}
              {renderStars(
                "timeliness",
                "Puntualidad",
                "Cumplimiento de fechas y entregas a tiempo",
              )}
            </div>

            {/* Review Text */}
            <div>
              <label className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-900">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500 to-teal-500 text-white shadow-lg">
                  <i className="ri-message-3-line text-sm"></i>
                </div>
                Comentario (Opcional)
              </label>
              <textarea
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                placeholder="Comparte tu experiencia trabajando en este proyecto..."
                rows={5}
                className="w-full resize-none rounded-xl border border-gray-300 bg-gradient-to-br from-gray-50 to-white px-4 py-3 text-sm text-gray-900 shadow-sm transition-all focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                maxLength={500}
              />
              <p className="mt-2 text-xs text-gray-500">{reviewText.length}/500 caracteres</p>
            </div>

            {/* Buttons */}
            <div className="sticky bottom-0 flex flex-col gap-3 border-t border-gray-200 bg-gradient-to-b from-white to-gray-50 pt-6 sm:flex-row sm:gap-4">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="group flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-gray-300 bg-white px-6 py-3 font-semibold text-gray-700 transition-all hover:-translate-y-0.5 hover:border-gray-400 hover:bg-gray-50 hover:shadow-md disabled:opacity-50 disabled:hover:translate-y-0"
              >
                <i className="ri-close-line"></i>
                <span>Cancelar</span>
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="group flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 px-6 py-3 font-semibold text-white shadow-lg shadow-cyan-500/30 transition-all hover:-translate-y-0.5 hover:scale-[1.02] hover:shadow-xl hover:shadow-cyan-500/40 disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:scale-100"
              >
                {submitting ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-white"></div>
                    <span>Enviando...</span>
                  </>
                ) : (
                  <>
                    <i className="ri-star-fill text-lg transition-transform group-hover:scale-125"></i>
                    <span>Enviar Reseña</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Info */}
          <div className="mt-6 rounded-2xl border border-cyan-200 bg-gradient-to-br from-cyan-50 to-teal-50 p-6 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-teal-500 text-white shadow-lg">
                <i className="ri-information-line text-lg"></i>
              </div>
              <div className="flex-1 text-sm text-cyan-900">
                <p className="mb-2 font-semibold">Información sobre las reseñas</p>
                <ul className="space-y-1 text-xs text-cyan-800">
                  <li>• Las reseñas son públicas y ayudan a otros usuarios</li>
                  <li>• Solo puedes reseñar proyectos completados</li>
                  <li>• Puedes editar tu reseña durante las primeras 24 horas</li>
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
