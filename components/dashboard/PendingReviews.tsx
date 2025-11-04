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
      setError(error.message || "Error al cargar proyectos pendientes")
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
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
        <span className="ml-2 text-gray-600">Cargando proyectos...</span>
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

  if (pendingProjects.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg">
        <i className="ri-star-line text-4xl text-gray-400 mb-4"></i>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No tienes proyectos pendientes de reseña
        </h3>
        <p className="text-gray-600">
          Cuando completes proyectos, podrás calificar tu experiencia aquí.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-gray-900">
          Proyectos Pendientes de Reseña
        </h3>
        <div className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">
          {pendingProjects.length} pendiente
          {pendingProjects.length !== 1 ? "s" : ""}
        </div>
      </div>

      <div className="bg-cyan-50 border border-cyan-200 rounded-lg p-4">
        <div className="flex items-start">
          <i className="ri-star-line text-primary mr-2 mt-0.5"></i>
          <div className="text-sm text-cyan-800">
            <p className="font-medium mb-1">
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
            className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h4 className="text-lg font-semibold text-gray-900 mb-2">
                  {project.title}
                </h4>
                <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                  {project.description}
                </p>
                <div className="flex items-center text-sm text-gray-500">
                  <i className="ri-calendar-check-line mr-1"></i>
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
              <div className="text-right ml-4">
                <div className="text-lg font-bold text-emerald-600 mb-2">
                  $
                  {project.budget ||
                    `${project.budget_min} - ${project.budget_max}`}
                </div>
                <span className="inline-block px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                  Completado
                </span>
              </div>
            </div>

            {/* Reviewee Info */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                  {project.reviewee?.avatar_url ? (
                    <img
                      src={project.reviewee.avatar_url}
                      alt={project.reviewee.full_name}
                      className="w-10 h-10 rounded-full object-cover object-top"
                    />
                  ) : (
                    <i className="ri-user-line text-primary"></i>
                  )}
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    {project.reviewee?.full_name || "Usuario"}
                  </p>
                  <p className="text-sm text-gray-600">
                    {project.reviewee_type === "freelancer"
                      ? "Freelancer"
                      : "Cliente"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleReviewProject(project)}
                className="bg-primary hover:bg-cyan-700 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors cursor-pointer flex items-center"
              >
                <i className="ri-star-line mr-2"></i>
                Calificar Ahora
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
