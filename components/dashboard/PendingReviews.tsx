"use client"

import { useState, useEffect } from "react"
import { supabaseBrowser } from "@/utils/supabase/client"
import ReviewModal from "@/components/ReviewModal"

const supabase = supabaseBrowser()

interface PendingProject {
  id: string
  title: string
  description: string
  budget_min?: number
  budget_max?: number
  budget?: number
  status: string
  created_at: string
  reviewee: {
    id: string
    full_name: string
    avatar_url?: string
  }
  reviewee_type: "client" | "freelancer"
  client?: {
    id: string
    full_name: string
    avatar_url?: string
  }
  freelancer?: {
    id: string
    full_name: string
    avatar_url?: string
  }
}

interface PendingReviewsProps {
  onReviewsUpdate: () => Promise<void>
}

export const PendingReviews = ({ onReviewsUpdate }: PendingReviewsProps) => {
  const [pendingProjects, setPendingProjects] = useState<PendingProject[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [selectedProject, setSelectedProject] = useState<PendingProject | null>(
    null
  )
  const [showReviewModal, setShowReviewModal] = useState(false)

  useEffect(() => {
    loadPendingReviews()
  }, [])

  const loadPendingReviews = async () => {
    try {
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
            action: "get-pending-reviews",
          }),
        }
      )

      if (!response.ok) {
        throw new Error(`Error ${response.status}`)
      }

      const data = await response.json()

      if (data.success) {
        setPendingProjects(data.pendingReviews || [])
      } else {
        throw new Error(data.error || "Error al cargar proyectos pendientes")
      }
    } catch (error: unknown) {
      console.error("❌ Error cargando proyectos pendientes:", error)
      const errorMessage = error instanceof Error ? error.message : "Error al cargar proyectos pendientes"
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleReviewProject = (project: PendingProject) => {
    // Determinar el usuario a reseñar si no viene definido
    if (!project.reviewee) {
      const reviewee =
        project.reviewee_type === "freelancer"
          ? project.freelancer
          : project.client

      if (!reviewee?.id) {
        console.error("❌ No se pudo identificar a quién reseñar:", project)

        window.toast({
          title:
            "No se pudo identificar a quién reseñar. Faltan datos del usuario.",
          type: "error",
          location: "bottom-center",
          dismissible: true,
          icon: true,
        })

        return
      }

      // Asignar manualmente
      project.reviewee = reviewee
    }

    // 🔹 Agregar explícitamente el ID del reviewee
    // Add reviewee_id to project for review submission
    const projectWithReviewee = { ...project, reviewee_id: project.reviewee.id } as PendingProject & { reviewee_id: string }

    setSelectedProject(projectWithReviewee)
    setShowReviewModal(true)
  }

  const handleReviewSubmitted = () => {
    loadPendingReviews()
    if (onReviewsUpdate) {
      onReviewsUpdate()
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-6 sm:py-8">
        <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-primary sm:h-6 sm:w-6"></div>
        <span className="ml-2 text-sm text-gray-600 sm:text-base">Cargando proyectos...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-red-600 sm:px-4 sm:py-3">
        <div className="flex items-center gap-2">
          <i className="ri-error-warning-line text-base sm:text-lg"></i>
          <span className="text-sm sm:text-base">{error}</span>
        </div>
      </div>
    )
  }

  if (pendingProjects.length === 0) {
    return (
      <div className="rounded-lg bg-gray-50 py-8 text-center sm:py-12">
        <i className="ri-star-line mb-3 text-3xl text-gray-400 sm:mb-4 sm:text-4xl"></i>
        <h3 className="mb-2 text-base font-medium text-gray-900 sm:text-lg">
          No tienes proyectos pendientes de reseña
        </h3>
        <p className="text-sm text-gray-600 sm:text-base">
          Cuando completes proyectos, podrás calificar tu experiencia aquí.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-base font-bold text-gray-900 sm:text-xl">
          Proyectos Pendientes de Reseña
        </h3>
        <div className="w-fit rounded-full bg-yellow-100 px-3 py-1 text-xs font-medium text-yellow-800 sm:text-sm">
          {pendingProjects.length} pendiente
          {pendingProjects.length !== 1 ? "s" : ""}
        </div>
      </div>

      <div className="rounded-lg border border-cyan-200 bg-cyan-50 p-3 sm:p-4">
        <div className="flex items-start gap-2 sm:gap-3">
          <i className="ri-star-line mt-0.5 text-base text-primary shrink-0 sm:text-lg"></i>
          <div className="min-w-0 flex-1 text-xs text-cyan-800 sm:text-sm">
            <p className="mb-1 font-medium">
              ¿Por qué son importantes las reseñas?
            </p>
            <p>
              Las reseñas ayudan a otros usuarios a tomar mejores decisiones y
              mejoran la confianza en la plataforma. ¡Tu opinión cuenta!
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {pendingProjects.map((project) => (
          <div
            key={project.id}
            className="rounded-lg border border-gray-200 bg-white p-4 transition-shadow hover:shadow-md sm:p-6"
          >
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 flex-1">
                <h4 className="mb-2 text-base font-semibold text-gray-900 sm:text-lg">
                  {project.title}
                </h4>
                <p className="mb-3 line-clamp-2 text-xs text-gray-600 sm:text-sm">
                  {project.description}
                </p>
                <div className="flex items-center gap-1 text-xs text-gray-500 sm:text-sm">
                  <i className="ri-calendar-check-line shrink-0"></i>
                  <span>
                    Completado:{" "}
                    {new Date(project.created_at).toLocaleDateString("es-ES", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2 sm:ml-4 sm:shrink-0">
                <div className="text-base font-bold text-emerald-600 sm:text-lg">
                  $
                  {project.budget ||
                    `${project.budget_min} - ${project.budget_max}`}
                </div>
                <span className="inline-block rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800">
                  Completado
                </span>
              </div>
            </div>

            {/* Reviewee Info */}
            <div className="flex flex-col gap-3 rounded-lg bg-gray-50 p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 sm:h-10 sm:w-10">
                  {project.reviewee?.avatar_url ? (
                    <img
                      src={project.reviewee.avatar_url}
                      alt={project.reviewee.full_name}
                      className="h-10 w-10 rounded-full object-cover object-top"
                    />
                  ) : (
                    <i className="ri-user-line text-primary text-base sm:text-lg"></i>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-gray-900 sm:text-base">
                    {project.reviewee?.full_name || "Usuario"}
                  </p>
                  <p className="text-xs text-gray-600 sm:text-sm">
                    {project.reviewee_type === "freelancer"
                      ? "Freelancer"
                      : "Cliente"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleReviewProject(project)}
                className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-cyan-700 active:scale-95 sm:w-auto touch-manipulation"
              >
                <i className="ri-star-line text-base"></i>
                <span>Calificar Ahora</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Review Modal */}
      {showReviewModal && selectedProject && (
        <ReviewModal
          isOpen={showReviewModal}
          onClose={() => {
            setShowReviewModal(false)
            setSelectedProject(null)
          }}
          project={selectedProject}
          onReviewSubmitted={handleReviewSubmitted}
        />
      )}
    </div>
  )
}
