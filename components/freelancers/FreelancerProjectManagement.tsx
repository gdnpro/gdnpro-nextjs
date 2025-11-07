"use client"

import { supabaseBrowser } from "@/utils/supabase/client"
import type { Project } from "@/interfaces/Project"
import type { ProjectUpdates } from "@/interfaces/ProjectUpdates"
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

  const updateProjectProgress = async (updates: ProjectUpdates) => {
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
        <div className="rounded-2xl border border-gray-200 bg-gradient-to-br from-gray-50 to-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-teal-500 text-white shadow-lg">
              <i className="ri-file-list-3-line text-lg"></i>
            </div>
            <h5 className="text-xl font-bold text-gray-900">Información del Proyecto</h5>
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="font-medium text-gray-700">Tipo:</span>
              <span className="text-gray-900">{projectData.project_type || "No especificado"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-medium text-gray-700">Presupuesto:</span>
              <span className="font-semibold text-cyan-600">
                {projectData.budget
                  ? `$${projectData.budget.toLocaleString()}`
                  : `$${projectData.budget_min?.toLocaleString()} - $${projectData.budget_max?.toLocaleString()}`}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-medium text-gray-700">Estado:</span>
              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  projectData.status === "completed"
                    ? "bg-emerald-500/90 text-white"
                    : projectData.status === "in_progress"
                      ? "bg-blue-500/90 text-white"
                      : projectData._isFromTransaction
                        ? projectData.payment_status === "paid"
                          ? "bg-emerald-500/90 text-white"
                          : "bg-yellow-500/90 text-white"
                        : "bg-yellow-500/90 text-white"
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
            <div className="flex items-center justify-between">
              <span className="font-medium text-gray-700">Fecha límite:</span>
              <span className="text-gray-900">
                {projectData.deadline
                  ? new Date(projectData.deadline).toLocaleDateString("es-ES")
                  : "No definida"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-medium text-gray-700">Iniciado:</span>
              <span className="text-gray-900">
                {projectData.started_at
                  ? new Date(projectData.started_at).toLocaleDateString("es-ES")
                  : new Date(projectData.created_at).toLocaleDateString("es-ES")}
              </span>
            </div>
            {projectData.completed_at && (
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-700">Completado:</span>
                <span className="text-gray-900">
                  {new Date(projectData.completed_at).toLocaleDateString("es-ES")}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-gradient-to-br from-gray-50 to-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 text-white shadow-lg">
              <i className="ri-bar-chart-box-line text-lg"></i>
            </div>
            <h5 className="text-xl font-bold text-gray-900">Progreso Actual</h5>
          </div>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="font-medium text-gray-700">Progreso General</span>
                <span className="font-bold text-cyan-600">
                  {projectData.progress_percentage || 0}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-cyan-500 to-teal-500 h-3 rounded-full transition-all shadow-lg shadow-cyan-500/30"
                  style={{ width: `${projectData.progress_percentage || 0}%` }}
                ></div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 p-4 ring-1 ring-emerald-100">
                <span className="text-xs font-medium text-emerald-700">Hitos Completados</span>
                <div className="text-2xl font-bold text-emerald-600 mt-1">
                  {projectData.completed_milestones || 0} /{" "}
                  {projectData.total_milestones || 0}
                </div>
              </div>
              <div className="rounded-xl bg-gradient-to-br from-cyan-50 to-teal-50 p-4 ring-1 ring-cyan-100">
                <span className="text-xs font-medium text-cyan-700">Entregables</span>
                <div className="text-2xl font-bold text-cyan-600 mt-1">
                  {projectData.approved_deliverables || 0} /{" "}
                  {projectData.total_deliverables || 0}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Descripción del Proyecto */}
      <div className="rounded-2xl border border-gray-200 bg-gradient-to-br from-gray-50 to-white p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 text-white shadow-lg">
            <i className="ri-file-text-line text-lg"></i>
          </div>
          <h5 className="text-xl font-bold text-gray-900">Descripción del Proyecto</h5>
        </div>
        <p className="leading-relaxed whitespace-pre-wrap text-gray-700">
          {projectData.description}
        </p>
        {projectData.requirements && (
          <div className="mt-4 rounded-xl border border-gray-200 bg-white p-4">
            <span className="font-semibold text-sm text-gray-900">Requisitos:</span>
            <p className="text-sm text-gray-700 mt-2 leading-relaxed">
              {projectData.requirements}
            </p>
          </div>
        )}
      </div>

      {/* Habilidades Requeridas */}
      {projectData.required_skills &&
        projectData.required_skills.length > 0 && (
          <div className="rounded-2xl border border-gray-200 bg-gradient-to-br from-gray-50 to-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 text-white shadow-lg">
                <i className="ri-tools-fill text-lg"></i>
              </div>
              <h5 className="text-xl font-bold text-gray-900">Habilidades Requeridas</h5>
            </div>
            <div className="flex flex-wrap gap-3">
              {projectData.required_skills.map(
                (skill: string, index: number) => (
                  <span
                    key={index}
                    className="group relative overflow-hidden rounded-full bg-gradient-to-r from-cyan-500 to-teal-500 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:scale-105 hover:shadow-lg hover:shadow-cyan-500/30"
                  >
                    <span className="relative z-10 flex items-center gap-2">
                      <i className="ri-checkbox-circle-line"></i>
                      <span>{skill}</span>
                    </span>
                  </span>
                )
              )}
            </div>
          </div>
        )}

      {/* Información del Cliente */}
      <div className="rounded-2xl border border-gray-200 bg-gradient-to-br from-gray-50 to-white p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-teal-500 text-white shadow-lg">
            <i className="ri-user-3-line text-lg"></i>
          </div>
          <h5 className="text-xl font-bold text-gray-900">Cliente</h5>
        </div>
        <div className="flex items-center space-x-4">
          <div className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-cyan-100 to-teal-100 ring-2 ring-cyan-200">
            {projectData.client?.avatar_url ? (
              <img
                src={projectData.client.avatar_url}
                alt={projectData.client.full_name}
                className="h-full w-full object-cover object-top"
              />
            ) : (
              <i className="ri-user-line text-xl text-cyan-600"></i>
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
              <div className="mt-1 flex items-center gap-1 text-sm text-cyan-600">
                <i className="ri-star-fill text-yellow-300"></i>
                <span className="font-medium">{projectData.client.rating.toFixed(1)}</span>
                <span className="text-gray-500">· Cliente verificado</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Hitos del Proyecto */}
      {projectData.project_milestones &&
        projectData.project_milestones.length > 0 && (
          <div className="rounded-2xl border border-gray-200 bg-gradient-to-br from-gray-50 to-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 text-white shadow-lg">
                <i className="ri-flag-line text-lg"></i>
              </div>
              <h5 className="text-xl font-bold text-gray-900">Hitos del Proyecto</h5>
            </div>
            <div className="space-y-3">
              {projectData.project_milestones.map((milestone) => (
                <div key={milestone.id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-all hover:shadow-md">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h6 className="font-semibold text-gray-900">
                        {milestone.title}
                      </h6>
                      {milestone.description && (
                        <p className="text-sm text-gray-600 mt-2 leading-relaxed">
                          {milestone.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                        {milestone.due_date && (
                          <span className="flex items-center gap-1">
                            <i className="ri-calendar-line"></i>
                            {new Date(milestone.due_date).toLocaleDateString("es-ES")}
                          </span>
                        )}
                        {milestone.amount && (
                          <span className="flex items-center gap-1 font-semibold text-cyan-600">
                            <i className="ri-money-dollar-circle-line"></i>
                            ${milestone.amount}
                          </span>
                        )}
                      </div>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        milestone.status === "completed"
                          ? "bg-emerald-500/90 text-white"
                          : milestone.status === "in_progress"
                            ? "bg-blue-500/90 text-white"
                            : "bg-gray-500/90 text-white"
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
        <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-lg">
              <i className="ri-flashlight-line text-lg"></i>
            </div>
            <h5 className="text-xl font-bold text-emerald-800">Acciones de Progreso</h5>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <button
              onClick={completeProjectMilestone}
              disabled={
                updating ||
                projectData.completed_milestones! >=
                  projectData.total_milestones!
              }
              className="group flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-3 font-semibold text-white shadow-lg shadow-emerald-500/30 transition-all hover:-translate-y-0.5 hover:scale-[1.02] hover:shadow-xl hover:shadow-emerald-500/40 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:scale-100"
            >
              <i className="ri-checkbox-circle-line text-lg transition-transform group-hover:scale-110"></i>
              <span>Completar Hito</span>
            </button>
            <button
              onClick={updateProgressPercentage}
              disabled={updating}
              className="group flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 px-4 py-3 font-semibold text-white shadow-lg shadow-cyan-500/30 transition-all hover:-translate-y-0.5 hover:scale-[1.02] hover:shadow-xl hover:shadow-cyan-500/40 cursor-pointer disabled:opacity-50"
            >
              <i className="ri-percent-line text-lg transition-transform group-hover:scale-110"></i>
              <span>Actualizar %</span>
            </button>
            <button
              onClick={markProjectAsCompleted}
              disabled={updating || projectData.status === "completed"}
              className="group flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 px-4 py-3 font-semibold text-white shadow-lg shadow-green-500/30 transition-all hover:-translate-y-0.5 hover:scale-[1.02] hover:shadow-xl hover:shadow-green-500/40 cursor-pointer disabled:opacity-50"
            >
              <i className="ri-check-double-line text-lg transition-transform group-hover:scale-110"></i>
              <span>Marcar Completado</span>
            </button>
            <button
              onClick={onClose}
              className="group flex items-center justify-center gap-2 rounded-xl border-2 border-gray-400 bg-white px-4 py-3 font-semibold text-gray-700 transition-all hover:-translate-y-0.5 hover:bg-gray-50 hover:shadow-lg cursor-pointer"
            >
              <i className="ri-close-line text-lg transition-transform group-hover:rotate-90"></i>
              <span>Cerrar</span>
            </button>
          </div>
        </div>
      )}

      {/* Agregar Nota de Progreso */}
      {!projectData._isFromTransaction && (
        <div className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50 p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 text-white shadow-lg">
              <i className="ri-file-add-line text-lg"></i>
            </div>
            <h5 className="text-xl font-bold text-blue-800">Agregar Nota de Progreso</h5>
          </div>
          <div className="flex gap-3">
            <input
              type="text"
              value={newProgressNote}
              onChange={(e) => setNewProgressNote(e.target.value)}
              placeholder="Describe el progreso realizado..."
              className="flex-1 rounded-xl border border-blue-300 bg-white px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              onKeyPress={(e) => e.key === "Enter" && addProgressNote()}
            />
            <button
              onClick={addProgressNote}
              disabled={updating || !newProgressNote.trim()}
              className="group flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 px-6 py-3 font-semibold text-white shadow-lg shadow-cyan-500/30 transition-all hover:-translate-y-0.5 hover:scale-[1.02] hover:shadow-xl hover:shadow-cyan-500/40 cursor-pointer disabled:opacity-50"
            >
              <i className="ri-add-line text-lg transition-transform group-hover:scale-110"></i>
              <span>Agregar</span>
            </button>
          </div>
        </div>
      )}

      {/* Historial de Notas */}
      {projectData.progress_notes && (
        <div className="rounded-2xl border border-gray-200 bg-gradient-to-br from-gray-50 to-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-lg">
              <i className="ri-file-list-line text-lg"></i>
            </div>
            <h5 className="text-xl font-bold text-gray-900">Historial de Notas</h5>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-4 max-h-40 overflow-y-auto shadow-sm">
            <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono leading-relaxed">
              {projectData.progress_notes}
            </pre>
          </div>
        </div>
      )}

      {/* Información de Pago */}
      <div className="rounded-2xl border border-yellow-200 bg-gradient-to-br from-yellow-50 to-amber-50 p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-yellow-500 to-amber-500 text-white shadow-lg">
            <i className="ri-money-dollar-circle-line text-lg"></i>
          </div>
          <h5 className="text-xl font-bold text-yellow-800">Estado de Pago</h5>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-xl bg-white p-4 ring-1 ring-gray-200">
            <span className="text-xs font-medium text-gray-700">Estado de Pago</span>
            <div className="mt-2">
              <span
                className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                  projectData.payment_status === "paid"
                    ? "bg-emerald-500/90 text-white"
                    : projectData.payment_status === "pending"
                      ? "bg-yellow-500/90 text-white"
                      : "bg-red-500/90 text-white"
                }`}
              >
                {projectData.payment_status === "paid"
                  ? "Pagado"
                  : projectData.payment_status === "pending"
                    ? "Pendiente"
                    : projectData.payment_status || "No definido"}
              </span>
            </div>
          </div>
          <div className="rounded-xl bg-white p-4 ring-1 ring-gray-200">
            <span className="text-xs font-medium text-gray-700">Auto-liberación</span>
            <div className="mt-2">
              <span
                className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                  projectData.auto_release_enabled
                    ? "bg-emerald-500/90 text-white"
                    : "bg-gray-500/90 text-white"
                }`}
              >
                {projectData.auto_release_enabled
                  ? "Habilitada"
                  : "Deshabilitada"}
              </span>
            </div>
          </div>
          <div className="rounded-xl bg-white p-4 ring-1 ring-gray-200">
            <span className="text-xs font-medium text-gray-700">Tipo</span>
            <p className="mt-2 text-sm font-semibold text-gray-900">
              {projectData._isFromTransaction
                ? "Contratación Directa"
                : "Proyecto por Propuesta"}
            </p>
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
        <div className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50 p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 text-white shadow-lg">
              <i className="ri-information-line text-lg"></i>
            </div>
            <div>
              <h5 className="text-lg font-bold text-blue-800 mb-2">
                Proyecto de Contratación Directa
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
