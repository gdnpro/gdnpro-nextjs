"use client"

import { supabaseBrowser } from "@/utils/supabase/client"
import type { Project } from "@/interfaces/Project"
import { useState, useEffect } from "react"

const supabase = supabaseBrowser()

interface FreelancerProjectManagementProps {
  project: Project
  onClose: () => void
  onUpdate?: () => void
}

export function FreelancerProjectManagement({
  project,
  onClose,
  onUpdate,
}: FreelancerProjectManagementProps) {
  const [projectData, setProjectData] = useState<Project>(project)
  const [loading, setLoading] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [newProgressNote, setNewProgressNote] = useState("")

  const getProfileId = async () => {
    const { data: userData } = await supabase.auth.getUser()
    if (!userData?.user) return null

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("id")
      .eq("user_id", userData.user.id)
      .single()

    if (error) {
      console.error("Error obteniendo profile.id:", error)
      return null
    }

    return profile.id
  }

  useEffect(() => {
    loadProjectData()
  }, [project.id])

  const loadProjectData = async () => {
    if (project._isFromTransaction) {
      // Para proyectos de transacción, usar los datos que ya tenemos
      setProjectData(project)
      return
    }

    setLoading(true)
    try {
      const { data: projectDetails, error } = await supabase
        .from("projects")
        .select(
          `
          *,
          client:profiles!client_id(
            id, full_name, email, rating, avatar_url
          ),
          project_milestones(
            id, title, description, due_date, status, amount, created_at
          )
        `
        )
        .eq("id", project.id)
        .single()

      if (error) {
        console.error("Error cargando proyecto:", error)
        return
      }

      setProjectData(projectDetails)
    } catch (error) {
      console.error("Error:", error)
    } finally {
      setLoading(false)
    }
  }

  const updateProjectProgress = async (updates: any) => {
    if (project._isFromTransaction) {
      window.toast({
        title:
          "Los proyectos de transacción no se pueden actualizar desde aquí. Contacta al cliente para coordinar el progreso.",
        type: "info",
        location: "bottom-center",
        dismissible: true,
        icon: true,
      })

      return
    }

    setUpdating(true)
    try {
      const { error } = await supabase
        .from("projects")
        .update({
          ...updates,
          last_progress_update: new Date().toISOString(),
        })
        .eq("id", projectData.id)

      if (error) {
        window.toast({
          title: "Error al actualizar el progreso",
          type: "error",
          location: "bottom-center",
          dismissible: true,
          icon: true,
        })
        console.error("Error actualizando progreso:", error)
        return
      }

      // Recargar datos del proyecto
      await loadProjectData()
      if (onUpdate) onUpdate()

      window.toast({
        title: "Progreso actualizado correctamente",
        type: "success",
        location: "bottom-center",
        dismissible: true,
        icon: true,
      })
    } catch (error) {
      window.toast({
        title: "Error al actualizar el progreso",
        type: "error",
        location: "bottom-center",
        dismissible: true,
        icon: true,
      })
      console.error("Error:", error)
    } finally {
      setUpdating(false)
    }
  }

  const completeProjectMilestone = async () => {
    const newCompletedMilestones = (projectData.completed_milestones || 0) + 1
    const totalMilestones = projectData.total_milestones || 1
    const newProgressPercentage = Math.min(
      100,
      Math.round((newCompletedMilestones / totalMilestones) * 100)
    )

    await updateProjectProgress({
      completed_milestones: newCompletedMilestones,
      progress_percentage: newProgressPercentage,
    })
  }

  const addProgressNote = async () => {
    if (!newProgressNote.trim()) return

    const currentNotes = projectData.progress_notes || ""
    const timestamp = new Date().toLocaleString("es-ES")
    const newNote = `[${timestamp}] ${newProgressNote.trim()}`
    const updatedNotes = currentNotes ? `${currentNotes}\n${newNote}` : newNote

    await updateProjectProgress({
      progress_notes: updatedNotes,
    })

    setNewProgressNote("")
  }

  const updateProgressPercentage = async () => {
    const percentage = prompt("Actualizar porcentaje de progreso (0-100):")
    if (percentage && !isNaN(Number(percentage))) {
      const value = Math.max(0, Math.min(100, Number(percentage)))
      await updateProjectProgress({ progress_percentage: value })
    }
  }

  const markProjectAsCompleted = async () => {
    const profileId = await getProfileId()
    if (!profileId) {
      window.toast({
        title: "No se pudo obtener el ID del freelancer",
        type: "error",
        location: "bottom-center",
        dismissible: true,
        icon: true,
      })
      return
    }

    if (
      confirm(
        "¿Estás seguro de que quieres marcar este proyecto como completado?"
      )
    ) {
      await updateProjectProgress({
        status: "completed",
        progress_percentage: 100,
        completed_at: new Date().toISOString(),
        freelancer_id: profileId,
      }).then(() => {
        window.toast({
          title: "¡Proyecto completado!",
          type: "success",
          location: "bottom-center",
          dismissible: true,
          icon: true,
        })
      })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Información General del Proyecto */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-50 p-4 rounded-lg">
          <h5 className="font-semibold text-gray-900 mb-3">
            📋 Información del Proyecto
          </h5>
          <div className="space-y-2 text-sm">
            <div>
              <span className="font-medium">Tipo:</span>{" "}
              {projectData.project_type || "No especificado"}
            </div>
            <div>
              <span className="font-medium">Presupuesto:</span>
              {projectData.budget
                ? `$${projectData.budget.toLocaleString()}`
                : `$${projectData.budget_min?.toLocaleString()} - $${projectData.budget_max?.toLocaleString()}`}
            </div>
            <div>
              <span className="font-medium">Estado:</span>
              <span
                className={`ml-2 px-2 py-1 rounded-full text-xs ${
                  projectData.status === "completed"
                    ? "bg-green-100 text-green-800"
                    : projectData.status === "in_progress"
                      ? "bg-blue-100 text-blue-800"
                      : projectData._isFromTransaction
                        ? projectData.payment_status === "paid"
                          ? "bg-green-100 text-green-800"
                          : "bg-yellow-100 text-yellow-800"
                        : "bg-yellow-100 text-yellow-800"
                }`}
              >
                {projectData.status === "completed"
                  ? "Completado"
                  : projectData.status === "in_progress"
                    ? "En Progreso"
                    : projectData._isFromTransaction
                      ? projectData.payment_status === "paid"
                        ? "Pagado"
                        : "Pago Pendiente"
                      : "Activo"}
              </span>
            </div>
            <div>
              <span className="font-medium">Fecha límite:</span>{" "}
              {projectData.deadline
                ? new Date(projectData.deadline).toLocaleDateString("es-ES")
                : "No definida"}
            </div>
            <div>
              <span className="font-medium">Iniciado:</span>{" "}
              {projectData.started_at
                ? new Date(projectData.started_at).toLocaleDateString("es-ES")
                : new Date(projectData.created_at).toLocaleDateString("es-ES")}
            </div>
            {projectData.completed_at && (
              <div>
                <span className="font-medium">Completado:</span>{" "}
                {new Date(projectData.completed_at).toLocaleDateString("es-ES")}
              </div>
            )}
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <h5 className="font-semibold text-gray-900 mb-3">
            📊 Progreso Actual
          </h5>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Progreso General</span>
                <span className="font-medium">
                  {projectData.progress_percentage || 0}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-emerald-600 h-3 rounded-full transition-all "
                  style={{ width: `${projectData.progress_percentage || 0}%` }}
                ></div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Hitos Completados:</span>
                <div className="text-lg font-bold text-emerald-600">
                  {projectData.completed_milestones || 0} /{" "}
                  {projectData.total_milestones || 0}
                </div>
              </div>
              <div>
                <span className="font-medium">Entregables:</span>
                <div className="text-lg font-bold text-primary">
                  {projectData.approved_deliverables || 0} /{" "}
                  {projectData.total_deliverables || 0}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Descripción del Proyecto */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h5 className="font-semibold text-gray-900 mb-3">
          📝 Descripción del Proyecto
        </h5>
        <p className="text-sm text-gray-700 leading-relaxed">
          {projectData.description}
        </p>
        {projectData.requirements && (
          <div className="mt-3">
            <span className="font-medium text-sm">Requisitos:</span>
            <p className="text-sm text-gray-700 mt-1">
              {projectData.requirements}
            </p>
          </div>
        )}
      </div>

      {/* Habilidades Requeridas */}
      {projectData.required_skills &&
        projectData.required_skills.length > 0 && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <h5 className="font-semibold text-gray-900 mb-3">
              🛠️ Habilidades Requeridas
            </h5>
            <div className="flex flex-wrap gap-2">
              {projectData.required_skills.map(
                (skill: string, index: number) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                  >
                    {skill}
                  </span>
                )
              )}
            </div>
          </div>
        )}

      {/* Información del Cliente */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h5 className="font-semibold text-gray-900 mb-3">👤 Cliente</h5>
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center overflow-hidden">
            {projectData.client?.avatar_url ? (
              <img
                src={projectData.client.avatar_url}
                alt={projectData.client.full_name}
                className="w-full h-full object-cover object-top"
              />
            ) : (
              <i className="ri-user-line text-emerald-600 text-xl"></i>
            )}
          </div>
          <div>
            <h4 className="font-semibold text-gray-900">
              {projectData.client?.full_name || "Cliente"}
            </h4>
            <p className="text-gray-600">
              {projectData.client?.email || "No disponible"}
            </p>
            {projectData.client?.rating && (
              <div className="flex items-center mt-1">
                <span className="text-yellow-500">★</span>
                <span className="ml-1 text-sm text-gray-600">
                  {projectData.client.rating} calificación
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Hitos del Proyecto */}
      {projectData.project_milestones &&
        projectData.project_milestones.length > 0 && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <h5 className="font-semibold text-gray-900 mb-3">
              🎯 Hitos del Proyecto
            </h5>
            <div className="space-y-3">
              {projectData.project_milestones.map((milestone) => (
                <div key={milestone.id} className="bg-white p-3 rounded border">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h6 className="font-medium text-gray-900">
                        {milestone.title}
                      </h6>
                      {milestone.description && (
                        <p className="text-sm text-gray-600 mt-1">
                          {milestone.description}
                        </p>
                      )}
                      <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                        {milestone.due_date && (
                          <span>
                            📅{" "}
                            {new Date(milestone.due_date).toLocaleDateString(
                              "es-ES"
                            )}
                          </span>
                        )}
                        {milestone.amount && (
                          <span>💰 ${milestone.amount}</span>
                        )}
                      </div>
                    </div>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        milestone.status === "completed"
                          ? "bg-green-100 text-green-800"
                          : milestone.status === "in_progress"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {milestone.status === "completed"
                        ? "Completado"
                        : milestone.status === "in_progress"
                          ? "En Progreso"
                          : "Pendiente"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      {/* Acciones de Progreso */}
      {!projectData._isFromTransaction && (
        <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-lg">
          <h5 className="font-semibold text-emerald-800 mb-3">
            ⚡ Acciones de Progreso
          </h5>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <button
              onClick={completeProjectMilestone}
              disabled={
                updating ||
                projectData.completed_milestones! >=
                  projectData.total_milestones!
              }
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-cyan-700 transition-colors text-sm font-medium whitespace-nowrap cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <i className="ri-checkbox-circle-line mr-2"></i>
              Completar Hito
            </button>
            <button
              onClick={updateProgressPercentage}
              disabled={updating}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-cyan-700 transition-colors text-sm font-medium whitespace-nowrap cursor-pointer disabled:opacity-50"
            >
              <i className="ri-percent-line mr-2"></i>
              Actualizar %
            </button>
            <button
              onClick={markProjectAsCompleted}
              disabled={updating || projectData.status === "completed"}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium whitespace-nowrap cursor-pointer disabled:opacity-50"
            >
              <i className="ri-check-double-line mr-2"></i>
              Marcar Completado
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium whitespace-nowrap cursor-pointer"
            >
              <i className="ri-close-line mr-2"></i>
              Cerrar
            </button>
          </div>
        </div>
      )}

      {/* Agregar Nota de Progreso */}
      {!projectData._isFromTransaction && (
        <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
          <h5 className="font-semibold text-blue-800 mb-3">
            📝 Agregar Nota de Progreso
          </h5>
          <div className="flex space-x-3">
            <input
              type="text"
              value={newProgressNote}
              onChange={(e) => setNewProgressNote(e.target.value)}
              placeholder="Describe el progreso realizado..."
              className="flex-1 px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              onKeyPress={(e) => e.key === "Enter" && addProgressNote()}
            />
            <button
              onClick={addProgressNote}
              disabled={updating || !newProgressNote.trim()}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-cyan-700 transition-colors text-sm font-medium whitespace-nowrap cursor-pointer disabled:opacity-50"
            >
              <i className="ri-add-line mr-2"></i>
              Agregar
            </button>
          </div>
        </div>
      )}

      {/* Historial de Notas */}
      {projectData.progress_notes && (
        <div className="bg-gray-50 p-4 rounded-lg">
          <h5 className="font-semibold text-gray-900 mb-3">
            📋 Historial de Notas
          </h5>
          <div className="bg-white p-3 rounded border max-h-40 overflow-y-auto">
            <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono">
              {projectData.progress_notes}
            </pre>
          </div>
        </div>
      )}

      {/* Información de Pago */}
      <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
        <h5 className="font-semibold text-yellow-800 mb-3">
          💳 Estado de Pago
        </h5>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="font-medium">Estado de Pago:</span>
            <span
              className={`ml-2 px-2 py-1 rounded-full text-xs ${
                projectData.payment_status === "paid"
                  ? "bg-green-100 text-green-800"
                  : projectData.payment_status === "pending"
                    ? "bg-yellow-100 text-yellow-800"
                    : "bg-red-100 text-red-800"
              }`}
            >
              {projectData.payment_status === "paid"
                ? "Pagado"
                : projectData.payment_status === "pending"
                  ? "Pendiente"
                  : projectData.payment_status || "No definido"}
            </span>
          </div>
          <div>
            <span className="font-medium">Auto-liberación:</span>
            <span
              className={`ml-2 px-2 py-1 rounded-full text-xs ${
                projectData.auto_release_enabled
                  ? "bg-green-100 text-green-800"
                  : "bg-gray-100 text-gray-800"
              }`}
            >
              {projectData.auto_release_enabled
                ? "Habilitada"
                : "Deshabilitada"}
            </span>
          </div>
          <div>
            <span className="font-medium">Tipo:</span>
            <span className="ml-2 text-gray-700">
              {projectData._isFromTransaction
                ? "Contratación Directa"
                : "Proyecto por Propuesta"}
            </span>
          </div>
        </div>
      </div>

      {/* Última Actualización */}
      <div className="text-center text-sm text-gray-500 pt-4 border-t border-gray-200">
        <i className="ri-time-line mr-1"></i>
        Última actualización:{" "}
        {projectData.last_progress_update
          ? new Date(projectData.last_progress_update).toLocaleString("es-ES")
          : "Nunca actualizado"}
      </div>

      {/* Mensaje para proyectos de transacción */}
      {projectData._isFromTransaction && (
        <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
          <div className="flex items-start space-x-3">
            <i className="ri-information-line text-primary text-xl mt-0.5"></i>
            <div>
              <h5 className="font-semibold text-blue-800 mb-2">
                💡 Proyecto de Contratación Directa
              </h5>
              <p className="text-sm text-cyan-700 leading-relaxed">
                Este proyecto fue contratado directamente por el cliente. Para
                actualizar el progreso y coordinar entregables, utiliza el chat
                interno para comunicarte directamente con el cliente. Los
                cambios de estado se manejan mediante la comunicación directa.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
