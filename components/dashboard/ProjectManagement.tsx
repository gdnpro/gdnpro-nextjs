"use client"

import { useState, useEffect } from "react"
import type { ProjectDetails } from "@/interfaces/ProjectDetails"
import type { Milestone } from "@/interfaces/Milestone"
import { supabaseBrowser } from "@/utils/supabase/client"
import { useBadges } from "@/hooks/useBadges"
import { useNotifications } from "@/hooks/useNotifications"
import { ConfirmDialog } from "@/components/ui/ConfirmDialog"
import { useConfirm } from "@/hooks/useConfirm"

const supabase = supabaseBrowser()

interface ProjectManagementProps {
  projectId: string
  userType: "client" | "freelancer"
  onClose: () => void
}

export default function ProjectManagement({
  projectId,
  userType,
  onClose,
}: ProjectManagementProps) {
  const [project, setProject] = useState<ProjectDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")
  const [showNewMilestone, setShowNewMilestone] = useState(false)
  const [showDeliverable, setShowDeliverable] = useState(false)
  const [selectedMilestone, setSelectedMilestone] = useState<Milestone | null>(null)

  const { checkAndUnlockBadges } = useBadges()
  const { notifyProjectUpdate } = useNotifications()
  const { confirm, isOpen, config, handleConfirm, handleCancel } = useConfirm()

  // Estados para nuevo hito
  const [newMilestone, setNewMilestone] = useState({
    title: "",
    description: "",
    amount: "",
    due_date: "",
  })

  // Estados para nuevo entregable
  const [newDeliverable, setNewDeliverable] = useState({
    title: "",
    description: "",
    fileUrl: "",
    fileName: "",
    fileSize: 0,
  })

  useEffect(() => {
    loadProjectDetails()
  }, [projectId])

  const loadProjectDetails = async () => {
    try {
      setLoading(true)
      const session = await supabase.auth.getSession()
      if (!session.data.session?.access_token) return

      const response = await fetch(
        "https://kdmdhhhppizzlhvauofe.supabase.co/functions/v1/project-management",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.data.session.access_token}`,
          },
          body: JSON.stringify({
            action: "get-project-details",
            projectId,
          }),
        },
      )

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setProject(data.project)
        }
      }
    } catch (error) {
      console.error("Error loading project details:", error)
    } finally {
      setLoading(false)
    }
  }

  const createMilestone = async () => {
    try {
      const session = await supabase.auth.getSession()
      if (!session.data.session?.access_token) return

      const response = await fetch(
        "https://kdmdhhhppizzlhvauofe.supabase.co/functions/v1/project-management",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.data.session.access_token}`,
          },
          body: JSON.stringify({
            action: "create-milestone",
            projectId,
            data: newMilestone,
          }),
        },
      )

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setShowNewMilestone(false)
          setNewMilestone({
            title: "",
            description: "",
            amount: "",
            due_date: "",
          })
          await loadProjectDetails()
        }
      }
    } catch (error) {
      console.error("Error creating milestone:", error)
    }
  }

  const updateMilestoneStatus = async (milestoneId: string, status: string, feedback?: string) => {
    try {
      const session = await supabase.auth.getSession()
      if (!session.data.session?.access_token) return

      const response = await fetch(
        "https://kdmdhhhppizzlhvauofe.supabase.co/functions/v1/project-management",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.data.session.access_token}`,
          },
          body: JSON.stringify({
            action: "update-milestone-status",
            milestoneId,
            data: { status, feedback },
          }),
        },
      )

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          await loadProjectDetails()
        }
      }
    } catch (error) {
      console.error("Error updating milestone:", error)
    }
  }

  const submitDeliverable = async () => {
    try {
      const session = await supabase.auth.getSession()
      if (!session.data.session?.access_token) return

      const response = await fetch(
        "https://kdmdhhhppizzlhvauofe.supabase.co/functions/v1/project-management",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.data.session.access_token}`,
          },
          body: JSON.stringify({
            action: "submit-deliverable",
            projectId,
            data: {
              milestoneId: selectedMilestone?.id,
              ...newDeliverable,
            },
          }),
        },
      )

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setShowDeliverable(false)
          setNewDeliverable({
            title: "",
            description: "",
            fileUrl: "",
            fileName: "",
            fileSize: 0,
          })
          await loadProjectDetails()
        }
      }
    } catch (error) {
      console.error("Error submitting deliverable:", error)
    }
  }

  const completeProject = async () => {
    const confirmed = await confirm(
      "Confirmar Completación",
      "¿Estás seguro de que deseas marcar este proyecto como completado?",
    )
    if (!confirmed) return

    try {
      const session = await supabase.auth.getSession()
      if (!session.data.session?.access_token) return

      const response = await fetch(
        "https://kdmdhhhppizzlhvauofe.supabase.co/functions/v1/project-management",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.data.session.access_token}`,
          },
          body: JSON.stringify({
            action: "complete-project",
            projectId,
          }),
        },
      )

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          // Notify project completion
          await notifyProjectUpdate(projectId, "project_completed")

          // Get current user to check badges
          const {
            data: { user },
          } = await supabase.auth.getUser()
          if (user) {
            // Check badges for both freelancer and client
            const projectData = await supabase
              .from("projects")
              .select("freelancer_id, client_id")
              .eq("id", projectId)
              .single()

            if (projectData.data) {
              // Check badges for freelancer
              if (projectData.data.freelancer_id) {
                await checkAndUnlockBadges(projectData.data.freelancer_id, "freelancer")
              }
              // Check badges for client
              if (projectData.data.client_id) {
                await checkAndUnlockBadges(projectData.data.client_id, "client")
              }
            }
          }

          window.toast({
            title: "¡Proyecto completado! Los pagos han sido liberados automáticamente.",
            type: "success",
            location: "bottom-center",
            dismissible: true,
            icon: true,
          })

          await loadProjectDetails()
        }
      }
    } catch (error) {
      console.error("Error completing project:", error)
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-emerald-600"></div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="py-8 text-center">
        <p className="text-gray-600">No se pudo cargar el proyecto</p>
      </div>
    )
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-black/60 via-black/50 to-black/60 p-4 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        className="max-h-[92vh] w-full max-w-6xl overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-black/5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modern Header with Gradient */}
        <div className="relative overflow-hidden bg-gradient-to-r from-emerald-600 via-teal-500 to-cyan-500 p-6 text-white sm:p-8">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIyIi8+PC9nPjwvZz48L3N2Zz4=')] opacity-20"></div>
          <div className="relative z-10 flex items-start justify-between">
            <div className="flex-1 pr-4">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 ring-1 ring-white/30 backdrop-blur-sm">
                  <i className="ri-settings-3-line text-2xl"></i>
                </div>
                <div>
                  <h2 className="text-2xl leading-tight font-bold sm:text-3xl">{project.title}</h2>
                  <div className="mt-3 flex items-center gap-4">
                    <span
                      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                        project.status === "completed"
                          ? "bg-emerald-500/90 text-white"
                          : project.status === "in_progress"
                            ? "bg-blue-500/90 text-white"
                            : "bg-yellow-500/90 text-white"
                      }`}
                    >
                      {project.status === "completed"
                        ? "Completado"
                        : project.status === "in_progress"
                          ? "En Progreso"
                          : "Abierto"}
                    </span>
                    <div className="flex items-center gap-2 text-sm text-emerald-100">
                      <div className="h-2 w-20 overflow-hidden rounded-full bg-white/20">
                        <div
                          className="h-full rounded-full bg-white transition-all duration-500"
                          style={{ width: `${project.progress_percentage}%` }}
                        ></div>
                      </div>
                      <span className="font-semibold">{project.progress_percentage}%</span>
                    </div>
                  </div>
                </div>
              </div>
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
        <div className="overflow-y-auto p-6" style={{ maxHeight: "calc(92vh - 200px)" }}>
          {/* Tabs */}
          <div className="mb-6 border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab("overview")}
                className={`cursor-pointer border-b-2 px-1 py-2 text-sm font-medium whitespace-nowrap ${
                  activeTab === "overview"
                    ? "border-emerald-500 text-emerald-600"
                    : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                }`}
              >
                Resumen
              </button>
              <button
                onClick={() => setActiveTab("milestones")}
                className={`cursor-pointer border-b-2 px-1 py-2 text-sm font-medium whitespace-nowrap ${
                  activeTab === "milestones"
                    ? "border-emerald-500 text-emerald-600"
                    : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                }`}
              >
                Hitos ({project.milestones.length})
              </button>
              <button
                onClick={() => setActiveTab("deliverables")}
                className={`cursor-pointer border-b-2 px-1 py-2 text-sm font-medium whitespace-nowrap ${
                  activeTab === "deliverables"
                    ? "border-emerald-500 text-emerald-600"
                    : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                }`}
              >
                Entregables ({project.deliverables.length})
              </button>
            </nav>
          </div>

          {/* Content */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* Progress Cards */}
              <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                <div className="rounded-lg bg-blue-50 p-4">
                  <div className="flex items-center">
                    <i className="ri-flag-line text-primary mr-3 text-2xl"></i>
                    <div>
                      <p className="text-2xl font-bold text-blue-900">{project.total_milestones}</p>
                      <p className="text-sm text-cyan-700">Hitos Totales</p>
                    </div>
                  </div>
                </div>
                <div className="rounded-lg bg-green-50 p-4">
                  <div className="flex items-center">
                    <i className="ri-check-line mr-3 text-2xl text-green-600"></i>
                    <div>
                      <p className="text-2xl font-bold text-green-900">
                        {project.completed_milestones}
                      </p>
                      <p className="text-sm text-green-700">Hitos Completados</p>
                    </div>
                  </div>
                </div>
                <div className="rounded-lg bg-emerald-50 p-4">
                  <div className="flex items-center">
                    <i className="ri-progress-3-line mr-3 text-2xl text-emerald-600"></i>
                    <div>
                      <p className="text-2xl font-bold text-emerald-900">
                        {project.progress_percentage}%
                      </p>
                      <p className="text-sm text-emerald-700">Progreso</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Project Info */}
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <div className="rounded-lg bg-gray-50 p-6">
                  <h3 className="mb-4 text-lg font-semibold">Información del Proyecto</h3>
                  <p className="mb-4 text-gray-700">{project.description}</p>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Iniciado:</span>
                      <span className="font-medium">
                        {new Date(project.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    {project.completed_at && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Completado:</span>
                        <span className="font-medium">
                          {new Date(project.completed_at).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Client/Freelancer Info */}
                  <div className="rounded-lg bg-blue-50 p-4">
                    <h4 className="mb-2 font-semibold text-blue-900">
                      {userType === "client" ? "Freelancer Asignado" : "Cliente"}
                    </h4>
                    <div className="flex items-center">
                      <div className="mr-3 flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                        <i className="ri-user-line text-primary"></i>
                      </div>
                      <div>
                        <p className="font-medium text-blue-900">
                          {userType === "client"
                            ? project.freelancer.full_name
                            : project.client.full_name}
                        </p>
                        <p className="text-sm text-cyan-700">
                          {userType === "client" ? project.freelancer.email : project.client.email}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  {project.status !== "completed" && (
                    <div className="space-y-2">
                      {userType === "client" && project.progress_percentage === 100 && (
                        <button
                          onClick={completeProject}
                          className="w-full cursor-pointer rounded-lg bg-green-600 px-4 py-2 font-medium whitespace-nowrap text-white transition-colors hover:bg-green-700"
                        >
                          <i className="ri-check-double-line mr-2"></i>
                          Completar Proyecto
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === "milestones" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold">Hitos del Proyecto</h3>
                {userType === "client" && project.status !== "completed" && (
                  <button
                    onClick={() => setShowNewMilestone(true)}
                    className="cursor-pointer rounded-lg bg-emerald-600 px-4 py-2 font-medium whitespace-nowrap text-white transition-colors hover:bg-cyan-700"
                  >
                    <i className="ri-add-line mr-2"></i>
                    Nuevo Hito
                  </button>
                )}
              </div>

              <div className="space-y-4">
                {project.milestones.map((milestone) => (
                  <div key={milestone.id} className="rounded-lg border border-gray-200 p-6">
                    <div className="mb-4 flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="text-lg font-semibold text-gray-900">{milestone.title}</h4>
                        <p className="mt-1 text-gray-600">{milestone.description}</p>
                        <div className="mt-2 flex items-center space-x-4">
                          <span className="font-bold text-emerald-600">${milestone.amount}</span>
                          {milestone.due_date && (
                            <span className="text-sm text-gray-500">
                              Vence: {new Date(milestone.due_date).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <span
                          className={`rounded-full px-3 py-1 text-sm font-medium ${
                            milestone.status === "approved"
                              ? "bg-green-100 text-green-800"
                              : milestone.status === "completed"
                                ? "bg-blue-100 text-blue-800"
                                : milestone.status === "in_progress"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {milestone.status === "approved"
                            ? "Aprobado"
                            : milestone.status === "completed"
                              ? "Completado"
                              : milestone.status === "in_progress"
                                ? "En Progreso"
                                : "Pendiente"}
                        </span>
                      </div>
                    </div>

                    <div className="flex justify-end space-x-2">
                      {userType === "freelancer" && milestone.status === "pending" && (
                        <button
                          onClick={() => updateMilestoneStatus(milestone.id, "in_progress")}
                          className="bg-primary cursor-pointer rounded px-3 py-1 text-sm whitespace-nowrap text-white transition-colors hover:bg-cyan-700"
                        >
                          Iniciar
                        </button>
                      )}
                      {userType === "freelancer" && milestone.status === "in_progress" && (
                        <>
                          <button
                            onClick={() => {
                              setSelectedMilestone(milestone)
                              setShowDeliverable(true)
                            }}
                            className="cursor-pointer rounded bg-emerald-600 px-3 py-1 text-sm whitespace-nowrap text-white transition-colors hover:bg-cyan-700"
                          >
                            Subir Entregable
                          </button>
                          <button
                            onClick={() => updateMilestoneStatus(milestone.id, "completed")}
                            className="cursor-pointer rounded bg-green-600 px-3 py-1 text-sm whitespace-nowrap text-white transition-colors hover:bg-green-700"
                          >
                            Marcar Completado
                          </button>
                        </>
                      )}
                      {userType === "client" && milestone.status === "completed" && (
                        <button
                          onClick={() => updateMilestoneStatus(milestone.id, "approved")}
                          className="cursor-pointer rounded bg-green-600 px-3 py-1 text-sm whitespace-nowrap text-white transition-colors hover:bg-green-700"
                        >
                          Aprobar Hito
                        </button>
                      )}
                    </div>
                  </div>
                ))}

                {project.milestones.length === 0 && (
                  <div className="py-12 text-center">
                    <i className="ri-flag-line mb-4 text-4xl text-gray-400"></i>
                    <h3 className="mb-2 text-lg font-medium text-gray-900">No hay hitos creados</h3>
                    <p className="text-gray-600">
                      {userType === "client"
                        ? "Crea hitos para organizar mejor el proyecto"
                        : "El cliente creará los hitos del proyecto"}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "deliverables" && (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold">Entregables</h3>

              <div className="space-y-4">
                {project.deliverables.map((deliverable) => (
                  <div key={deliverable.id} className="rounded-lg border border-gray-200 p-6">
                    <div className="mb-4 flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="text-lg font-semibold text-gray-900">{deliverable.title}</h4>
                        <p className="mt-1 text-gray-600">{deliverable.description}</p>
                        {deliverable.file_name && (
                          <div className="text-primary mt-2 flex items-center text-sm">
                            <i className="ri-file-line mr-1"></i>
                            {deliverable.file_name}
                            {deliverable.file_size && (
                              <span className="ml-2 text-gray-500">
                                ({(deliverable.file_size / 1024 / 1024).toFixed(2)} MB)
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      <span
                        className={`rounded-full px-3 py-1 text-sm font-medium ${
                          deliverable.status === "approved"
                            ? "bg-green-100 text-green-800"
                            : deliverable.status === "submitted"
                              ? "bg-blue-100 text-blue-800"
                              : deliverable.status === "revision_requested"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {deliverable.status === "approved"
                          ? "Aprobado"
                          : deliverable.status === "submitted"
                            ? "Enviado"
                            : deliverable.status === "revision_requested"
                              ? "Revisión Solicitada"
                              : "Pendiente"}
                      </span>
                    </div>

                    {deliverable.feedback && (
                      <div className="mt-4 rounded-lg border border-yellow-200 bg-yellow-50 p-3">
                        <p className="text-sm text-yellow-800">
                          <strong>Comentarios:</strong> {deliverable.feedback}
                        </p>
                      </div>
                    )}
                  </div>
                ))}

                {project.deliverables.length === 0 && (
                  <div className="py-12 text-center">
                    <i className="ri-file-upload-line mb-4 text-4xl text-gray-400"></i>
                    <h3 className="mb-2 text-lg font-medium text-gray-900">No hay entregables</h3>
                    <p className="text-gray-600">Los entregables aparecerán aquí cuando se suban</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal Nuevo Hito */}
      {showNewMilestone && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-gradient-to-br from-black/60 via-black/50 to-black/60 p-4 backdrop-blur-md"
          onClick={() => setShowNewMilestone(false)}
        >
          <div
            className="max-h-[92vh] w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-black/5"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modern Header with Gradient */}
            <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-500 p-6 text-white">
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIyIi8+PC9nPjwvZz48L3N2Zz4=')] opacity-20"></div>
              <div className="relative z-10 flex items-start justify-between">
                <div className="flex-1 pr-4">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 ring-1 ring-white/30 backdrop-blur-sm">
                      <i className="ri-flag-line text-lg"></i>
                    </div>
                    <h3 className="text-xl font-bold">Crear Nuevo Hito</h3>
                  </div>
                </div>
                <button
                  onClick={() => setShowNewMilestone(false)}
                  className="group flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg bg-white/10 ring-1 ring-white/20 backdrop-blur-sm transition-all hover:scale-110 hover:bg-white/20"
                  aria-label="Cerrar"
                >
                  <i className="ri-close-line text-sm transition-transform group-hover:rotate-90"></i>
                </button>
              </div>
            </div>
            <div className="overflow-y-auto p-6" style={{ maxHeight: "calc(92vh - 150px)" }}>
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Título del hito"
                  value={newMilestone.title}
                  onChange={(e) => setNewMilestone({ ...newMilestone, title: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-emerald-500"
                />
                <textarea
                  placeholder="Descripción"
                  value={newMilestone.description}
                  onChange={(e) =>
                    setNewMilestone({
                      ...newMilestone,
                      description: e.target.value,
                    })
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-emerald-500"
                  rows={3}
                />
                <input
                  type="number"
                  placeholder="Monto ($)"
                  value={newMilestone.amount}
                  onChange={(e) => setNewMilestone({ ...newMilestone, amount: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-emerald-500"
                />
                <input
                  type="date"
                  value={newMilestone.due_date}
                  onChange={(e) => setNewMilestone({ ...newMilestone, due_date: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div className="sticky bottom-0 flex gap-3 border-t border-gray-200 bg-gradient-to-b from-white to-gray-50 pt-6">
                <button
                  onClick={() => setShowNewMilestone(false)}
                  className="group flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-gray-300 bg-white px-4 py-2.5 font-semibold text-gray-700 transition-all hover:-translate-y-0.5 hover:border-gray-400 hover:bg-gray-50 hover:shadow-md"
                >
                  <i className="ri-close-line text-sm"></i>
                  <span>Cancelar</span>
                </button>
                <button
                  onClick={createMilestone}
                  className="group flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 px-4 py-2.5 font-semibold text-white shadow-lg shadow-blue-500/30 transition-all hover:-translate-y-0.5 hover:scale-[1.02] hover:shadow-xl hover:shadow-blue-500/40"
                >
                  <i className="ri-flag-fill text-sm transition-transform group-hover:scale-110"></i>
                  <span>Crear Hito</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Subir Entregable */}
      {showDeliverable && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-gradient-to-br from-black/60 via-black/50 to-black/60 p-4 backdrop-blur-md"
          onClick={() => setShowDeliverable(false)}
        >
          <div
            className="max-h-[92vh] w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-black/5"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modern Header with Gradient */}
            <div className="relative overflow-hidden bg-gradient-to-r from-orange-600 via-amber-500 to-yellow-500 p-6 text-white">
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIyIi8+PC9nPjwvZz48L3N2Zz4=')] opacity-20"></div>
              <div className="relative z-10 flex items-start justify-between">
                <div className="flex-1 pr-4">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 ring-1 ring-white/30 backdrop-blur-sm">
                      <i className="ri-upload-cloud-line text-lg"></i>
                    </div>
                    <h3 className="text-xl font-bold">Subir Entregable</h3>
                  </div>
                </div>
                <button
                  onClick={() => setShowDeliverable(false)}
                  className="group flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg bg-white/10 ring-1 ring-white/20 backdrop-blur-sm transition-all hover:scale-110 hover:bg-white/20"
                  aria-label="Cerrar"
                >
                  <i className="ri-close-line text-sm transition-transform group-hover:rotate-90"></i>
                </button>
              </div>
            </div>
            <div className="overflow-y-auto p-6" style={{ maxHeight: "calc(92vh - 150px)" }}>
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Título del entregable"
                  value={newDeliverable.title}
                  onChange={(e) =>
                    setNewDeliverable({
                      ...newDeliverable,
                      title: e.target.value,
                    })
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-emerald-500"
                />
                <textarea
                  placeholder="Descripción"
                  value={newDeliverable.description}
                  onChange={(e) =>
                    setNewDeliverable({
                      ...newDeliverable,
                      description: e.target.value,
                    })
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-emerald-500"
                  rows={3}
                />
                <div className="rounded-lg border-2 border-dashed border-gray-300 p-6 text-center">
                  <i className="ri-upload-cloud-line mb-2 text-3xl text-gray-400"></i>
                  <p className="text-gray-500">
                    Arrastra archivos aquí o haz clic para seleccionar
                  </p>
                  <p className="mt-1 text-xs text-gray-400">Máximo 10MB</p>
                </div>
              </div>
              <div className="sticky bottom-0 flex gap-3 border-t border-gray-200 bg-gradient-to-b from-white to-gray-50 pt-6">
                <button
                  onClick={() => setShowDeliverable(false)}
                  className="group flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-gray-300 bg-white px-4 py-2.5 font-semibold text-gray-700 transition-all hover:-translate-y-0.5 hover:border-gray-400 hover:bg-gray-50 hover:shadow-md"
                >
                  <i className="ri-close-line text-sm"></i>
                  <span>Cancelar</span>
                </button>
                <button
                  onClick={submitDeliverable}
                  className="group flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-yellow-500 px-4 py-2.5 font-semibold text-white shadow-lg shadow-orange-500/30 transition-all hover:-translate-y-0.5 hover:scale-[1.02] hover:shadow-xl hover:shadow-orange-500/40"
                >
                  <i className="ri-upload-cloud-fill text-sm transition-transform group-hover:scale-110"></i>
                  <span>Subir Entregable</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={isOpen}
        onClose={handleCancel}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        title={config.title}
        description={config.description}
        manageOverflow={false}
      />
    </div>
  )
}
