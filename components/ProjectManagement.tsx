"use client"

import { useState, useEffect } from "react"
import type { ProjectDetails } from "@/interfaces/ProjectDetails"
import type { Milestone } from "@/interfaces/Milestone"
import { supabaseBrowser } from "@/utils/supabase/client"
import { useBadges } from "@/hooks/useBadges"
import { useNotifications } from "@/hooks/useNotifications"

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
  const [selectedMilestone, setSelectedMilestone] = useState<Milestone | null>(
    null
  )

  const { checkAndUnlockBadges } = useBadges()
  const { notifyProjectUpdate } = useNotifications()

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
        }
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
        }
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

  const updateMilestoneStatus = async (
    milestoneId: string,
    status: string,
    feedback?: string
  ) => {
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
        }
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
        }
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
    if (
      !confirm(
        "¿Estás seguro de que deseas marcar este proyecto como completado?"
      )
    )
      return

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
        }
      )

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          // Notify project completion
          await notifyProjectUpdate(projectId, "project_completed")

          // Get current user to check badges
          const { data: { user } } = await supabase.auth.getUser()
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
            title:
              "¡Proyecto completado! Los pagos han sido liberados automáticamente.",
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
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">No se pudo cargar el proyecto</p>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {project.title}
              </h2>
              <div className="flex items-center mt-2 space-x-4">
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    project.status === "completed"
                      ? "bg-green-100 text-green-800"
                      : project.status === "in_progress"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-yellow-100 text-yellow-800"
                  }`}
                >
                  {project.status === "completed"
                    ? "Completado"
                    : project.status === "in_progress"
                      ? "En Progreso"
                      : "Abierto"}
                </span>
                <div className="flex items-center text-sm text-gray-600">
                  <div className="w-20 bg-gray-200 rounded-full h-2 mr-2">
                    <div
                      className="bg-emerald-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${project.progress_percentage}%` }}
                    ></div>
                  </div>
                  <span>{project.progress_percentage}%</span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 cursor-pointer p-2"
            >
              <i className="ri-close-line text-2xl"></i>
            </button>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200 mb-6">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab("overview")}
                className={`py-2 px-1 border-b-2 font-medium text-sm cursor-pointer whitespace-nowrap ${
                  activeTab === "overview"
                    ? "border-emerald-500 text-emerald-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Resumen
              </button>
              <button
                onClick={() => setActiveTab("milestones")}
                className={`py-2 px-1 border-b-2 font-medium text-sm cursor-pointer whitespace-nowrap ${
                  activeTab === "milestones"
                    ? "border-emerald-500 text-emerald-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Hitos ({project.milestones.length})
              </button>
              <button
                onClick={() => setActiveTab("deliverables")}
                className={`py-2 px-1 border-b-2 font-medium text-sm cursor-pointer whitespace-nowrap ${
                  activeTab === "deliverables"
                    ? "border-emerald-500 text-emerald-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center">
                    <i className="ri-flag-line text-primary text-2xl mr-3"></i>
                    <div>
                      <p className="text-2xl font-bold text-blue-900">
                        {project.total_milestones}
                      </p>
                      <p className="text-cyan-700 text-sm">Hitos Totales</p>
                    </div>
                  </div>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="flex items-center">
                    <i className="ri-check-line text-green-600 text-2xl mr-3"></i>
                    <div>
                      <p className="text-2xl font-bold text-green-900">
                        {project.completed_milestones}
                      </p>
                      <p className="text-green-700 text-sm">
                        Hitos Completados
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-emerald-50 rounded-lg p-4">
                  <div className="flex items-center">
                    <i className="ri-progress-3-line text-emerald-600 text-2xl mr-3"></i>
                    <div>
                      <p className="text-2xl font-bold text-emerald-900">
                        {project.progress_percentage}%
                      </p>
                      <p className="text-emerald-700 text-sm">Progreso</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Project Info */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-4">
                    Información del Proyecto
                  </h3>
                  <p className="text-gray-700 mb-4">{project.description}</p>
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
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h4 className="font-semibold text-blue-900 mb-2">
                      {userType === "client"
                        ? "Freelancer Asignado"
                        : "Cliente"}
                    </h4>
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                        <i className="ri-user-line text-primary"></i>
                      </div>
                      <div>
                        <p className="font-medium text-blue-900">
                          {userType === "client"
                            ? project.freelancer.full_name
                            : project.client.full_name}
                        </p>
                        <p className="text-cyan-700 text-sm">
                          {userType === "client"
                            ? project.freelancer.email
                            : project.client.email}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  {project.status !== "completed" && (
                    <div className="space-y-2">
                      {userType === "client" &&
                        project.progress_percentage === 100 && (
                          <button
                            onClick={completeProject}
                            className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg font-medium transition-colors cursor-pointer whitespace-nowrap"
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
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold">Hitos del Proyecto</h3>
                {userType === "client" && project.status !== "completed" && (
                  <button
                    onClick={() => setShowNewMilestone(true)}
                    className="bg-emerald-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg font-medium transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <i className="ri-add-line mr-2"></i>
                    Nuevo Hito
                  </button>
                )}
              </div>

              <div className="space-y-4">
                {project.milestones.map((milestone) => (
                  <div
                    key={milestone.id}
                    className="border border-gray-200 rounded-lg p-6"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <h4 className="text-lg font-semibold text-gray-900">
                          {milestone.title}
                        </h4>
                        <p className="text-gray-600 mt-1">
                          {milestone.description}
                        </p>
                        <div className="flex items-center mt-2 space-x-4">
                          <span className="text-emerald-600 font-bold">
                            ${milestone.amount}
                          </span>
                          {milestone.due_date && (
                            <span className="text-gray-500 text-sm">
                              Vence:{" "}
                              {new Date(
                                milestone.due_date
                              ).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-medium ${
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
                      {userType === "freelancer" &&
                        milestone.status === "pending" && (
                          <button
                            onClick={() =>
                              updateMilestoneStatus(milestone.id, "in_progress")
                            }
                            className="px-3 py-1 bg-primary text-white rounded text-sm hover:bg-cyan-700 transition-colors cursor-pointer whitespace-nowrap"
                          >
                            Iniciar
                          </button>
                        )}
                      {userType === "freelancer" &&
                        milestone.status === "in_progress" && (
                          <>
                            <button
                              onClick={() => {
                                setSelectedMilestone(milestone)
                                setShowDeliverable(true)
                              }}
                              className="px-3 py-1 bg-emerald-600 text-white rounded text-sm hover:bg-cyan-700 transition-colors cursor-pointer whitespace-nowrap"
                            >
                              Subir Entregable
                            </button>
                            <button
                              onClick={() =>
                                updateMilestoneStatus(milestone.id, "completed")
                              }
                              className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition-colors cursor-pointer whitespace-nowrap"
                            >
                              Marcar Completado
                            </button>
                          </>
                        )}
                      {userType === "client" &&
                        milestone.status === "completed" && (
                          <button
                            onClick={() =>
                              updateMilestoneStatus(milestone.id, "approved")
                            }
                            className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition-colors cursor-pointer whitespace-nowrap"
                          >
                            Aprobar Hito
                          </button>
                        )}
                    </div>
                  </div>
                ))}

                {project.milestones.length === 0 && (
                  <div className="text-center py-12">
                    <i className="ri-flag-line text-4xl text-gray-400 mb-4"></i>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No hay hitos creados
                    </h3>
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
                  <div
                    key={deliverable.id}
                    className="border border-gray-200 rounded-lg p-6"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <h4 className="text-lg font-semibold text-gray-900">
                          {deliverable.title}
                        </h4>
                        <p className="text-gray-600 mt-1">
                          {deliverable.description}
                        </p>
                        {deliverable.file_name && (
                          <div className="flex items-center mt-2 text-sm text-primary">
                            <i className="ri-file-line mr-1"></i>
                            {deliverable.file_name}
                            {deliverable.file_size && (
                              <span className="text-gray-500 ml-2">
                                (
                                {(deliverable.file_size / 1024 / 1024).toFixed(
                                  2
                                )}{" "}
                                MB)
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${
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
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mt-4">
                        <p className="text-yellow-800 text-sm">
                          <strong>Comentarios:</strong> {deliverable.feedback}
                        </p>
                      </div>
                    )}
                  </div>
                ))}

                {project.deliverables.length === 0 && (
                  <div className="text-center py-12">
                    <i className="ri-file-upload-line text-4xl text-gray-400 mb-4"></i>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No hay entregables
                    </h3>
                    <p className="text-gray-600">
                      Los entregables aparecerán aquí cuando se suban
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal Nuevo Hito */}
      {showNewMilestone && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-60 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">Crear Nuevo Hito</h3>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Título del hito"
                value={newMilestone.title}
                onChange={(e) =>
                  setNewMilestone({ ...newMilestone, title: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                rows={3}
              />
              <input
                type="number"
                placeholder="Monto ($)"
                value={newMilestone.amount}
                onChange={(e) =>
                  setNewMilestone({ ...newMilestone, amount: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
              <input
                type="date"
                value={newMilestone.due_date}
                onChange={(e) =>
                  setNewMilestone({ ...newMilestone, due_date: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowNewMilestone(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 cursor-pointer whitespace-nowrap"
              >
                Cancelar
              </button>
              <button
                onClick={createMilestone}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-cyan-700 transition-colors cursor-pointer whitespace-nowrap"
              >
                Crear Hito
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Subir Entregable */}
      {showDeliverable && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-60 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">Subir Entregable</h3>
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                rows={3}
              />
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <i className="ri-upload-cloud-line text-3xl text-gray-400 mb-2"></i>
                <p className="text-gray-500">
                  Arrastra archivos aquí o haz clic para seleccionar
                </p>
                <p className="text-xs text-gray-400 mt-1">Máximo 10MB</p>
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowDeliverable(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 cursor-pointer whitespace-nowrap"
              >
                Cancelar
              </button>
              <button
                onClick={submitDeliverable}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-cyan-700 transition-colors cursor-pointer whitespace-nowrap"
              >
                Subir Entregable
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
