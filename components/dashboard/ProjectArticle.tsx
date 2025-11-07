"use client"

import { supabaseBrowser } from "@/utils/supabase/client"
import type { Project } from "@/interfaces/Project"
import { useBadges } from "@/hooks/useBadges"
import { useNotifications } from "@/hooks/useNotifications"
import { ConfirmDialog } from "@/components/ui/ConfirmDialog"
import { useConfirm } from "@/hooks/useConfirm"

const supabase = supabaseBrowser()

interface Props {
  project: Project
  openProjectManagement: (project: Project) => void
  viewProjectProposals: (project: Project) => void
  loadProjects: () => void
  handleActiveTab: (flag: string) => void
  handleContactFreelancer?: () => void
  handleViewTransaction?: () => void
  handleEditProject?: () => void
  handleDeleteProject?: () => void
}

export const ProjectArticle = ({
  project,
  openProjectManagement,
  loadProjects,
  handleActiveTab,
  viewProjectProposals,
  handleContactFreelancer,
  handleViewTransaction,
  handleEditProject,
  handleDeleteProject,
}: Props) => {
  const { checkAndUnlockBadges } = useBadges()
  const { notifyProjectUpdate } = useNotifications()
  const { confirm, isOpen, config, handleConfirm, handleCancel } = useConfirm()

  // Check if project can be edited/deleted
  // Can edit/delete if: no accepted proposals AND no freelancer assigned OR project is completed
  const hasAcceptedProposals = project.proposals?.some((p) => p.status === "accepted") || false
  const hasFreelancerAssigned = !!project.freelancer?.id
  const canEditOrDelete =
    !project._isFromTransaction &&
    ((!hasAcceptedProposals && !hasFreelancerAssigned) || project.status === "completed")
  return (
    <article
      key={project.id}
      className="rounded-lg border border-gray-200 p-4 transition-shadow hover:shadow-md sm:p-6"
    >
      <div className="flex flex-col space-y-3 sm:flex-row sm:items-start sm:justify-between sm:space-y-0">
        <div className="flex-1">
          <h3 className="mb-2 text-lg font-semibold text-gray-900 sm:text-xl">{project.title}</h3>

          {/* NUEVO: Barra de progreso para proyectos con gestión avanzada */}
          {!project._isFromTransaction && project.progress_percentage !== undefined && (
            <div className="mb-2 flex items-center">
              <div className="mr-3 h-2 flex-1 rounded-full bg-gray-200">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-500"
                  style={{
                    width: `${project.progress_percentage || 0}%`,
                  }}
                ></div>
              </div>
              <span className="text-sm font-medium text-gray-600">
                {project.progress_percentage || 0}%
              </span>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 sm:text-sm">
            <span
              className={`rounded-full px-2 py-1 text-xs font-medium ${
                project.status === "open"
                  ? "bg-green-100 text-green-800"
                  : project.status === "in_progress"
                    ? "bg-blue-100 text-cyan-800"
                    : project.status === "pending_payment"
                      ? "bg-yellow-100 text-yellow-800"
                      : project.status === "pending_approval"
                        ? "bg-orange-100 text-orange-800"
                        : project.status === "completed"
                          ? "bg-gray-100 text-gray-800"
                          : "bg-gray-100 text-gray-800"
              }`}
            >
              {project.status === "open"
                ? "Abierto"
                : project.status === "in_progress"
                  ? "En Progreso"
                  : project.status === "pending_payment"
                    ? "Pago Pendiente"
                    : project.status === "pending_approval"
                      ? "⏰ Pendiente de Aprobación"
                      : project.status === "completed"
                        ? "Completado"
                        : "Completado"}
            </span>
            <span>•</span>
            <span>Publicado: {new Date(project.created_at).toLocaleDateString()}</span>

            {/* NUEVO: Mostrar hitos */}
            {!project._isFromTransaction &&
              project.total_milestones !== undefined &&
              project.total_milestones > 0 && (
                <>
                  <span>•</span>
                  <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-cyan-800">
                    <i className="ri-flag-line mr-1"></i>
                    {project.completed_milestones || 0}/{project.total_milestones} Hitos
                  </span>
                </>
              )}

            {/* Estado de pago para proyectos de transacciones */}
            {project._isFromTransaction && (
              <>
                <span>•</span>
                <span
                  className={`rounded-full px-2 py-1 text-xs font-medium ${
                    project.payment_status === "paid"
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-yellow-100 text-yellow-800"
                  }`}
                >
                  <i className="ri-secure-payment-line mr-1"></i>
                  {project.payment_status === "paid" ? "Pagado" : "Pago Pendiente"}
                </span>
              </>
            )}

            {/* Indicador de contrato directo */}
            {project._isFromTransaction && (
              <>
                <span>•</span>
                <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-cyan-800">
                  <i className="ri-bank-card-line mr-1"></i>
                  Contrato Directo
                </span>
              </>
            )}
          </div>

          {project.status === "pending_approval" && (
            <div className="mt-3 rounded-lg border border-orange-200 bg-orange-50 p-3">
              <div className="flex items-start">
                <div className="shrink-0">
                  <i className="ri-notification-line mr-3 text-xl text-orange-600"></i>
                </div>
                <div className="flex-1">
                  <h4 className="mb-1 font-semibold text-orange-800">
                    🎉 ¡El freelancer ha completado el proyecto!
                  </h4>
                  <p className="mb-2 text-sm text-orange-700">
                    El proyecto está listo para tu revisión y aprobación final.
                  </p>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <button
                      onClick={() => openProjectManagement(project)}
                      className="cursor-pointer rounded-md bg-orange-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-orange-700"
                    >
                      <i className="ri-eye-line mr-1"></i>
                      Revisar Entregables
                    </button>
                    <button
                      onClick={async () => {
                        const confirmed = await confirm(
                          "Confirmar Aprobación",
                          "¿Estás seguro de que quieres aprobar este proyecto? El pago se liberará automáticamente.",
                        )
                        if (!confirmed) return

                        try {
                          const { error } = await supabase
                            .from("projects")
                            .update({
                              status: "completed",
                              completed_at: new Date().toISOString(),
                            })
                            .eq("id", project.id)

                          if (error) throw error

                          // Notify project completion
                          await notifyProjectUpdate(project.id, "project_completed")

                          // Check badges for both freelancer and client
                          // Fetch project data to get client_id and freelancer_id
                          const { data: projectData } = await supabase
                            .from("projects")
                            .select("client_id, freelancer_id")
                            .eq("id", project.id)
                            .single()

                          if (projectData) {
                            const {
                              data: { user },
                            } = await supabase.auth.getUser()
                            if (user) {
                              if (projectData.freelancer_id) {
                                await checkAndUnlockBadges(projectData.freelancer_id, "freelancer")
                              }
                              if (projectData.client_id) {
                                await checkAndUnlockBadges(projectData.client_id, "client")
                              }
                            }
                          }

                          window.toast({
                            title: "Proyecto aprobado",
                            type: "success",
                            location: "bottom-center",
                            dismissible: true,
                            icon: true,
                          })

                          loadProjects()
                        } catch (error) {
                          window.toast({
                            title: "Error al aprobar el proyecto",
                            type: "error",
                            location: "bottom-center",
                            dismissible: true,
                            icon: true,
                          })
                          console.error("Error aprobando proyecto:", error)
                        }
                      }}
                      className="bg-primary cursor-pointer rounded-md px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-cyan-700"
                    >
                      <i className="ri-check-line mr-1"></i>
                      Aprobar y Pagar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="text-left sm:text-right">
          <div className="text-primary text-base font-bold sm:text-lg">
            ${project.budget_min}{" "}
            {project.budget_max && project.budget_min !== project.budget_max
              ? `- $${project.budget_max}`
              : ""}
          </div>
          <div className="text-xs text-gray-500 sm:text-sm">
            {project.project_type || "Proyecto"}
          </div>
          {project._isFromTransaction && (
            <div className="text-primary mt-1 text-xs font-medium">
              {project.payment_status === "paid" ? "Pago Procesado" : "Procesando Pago"}
            </div>
          )}
        </div>
      </div>

      <p className="mb-4 line-clamp-2 text-sm text-gray-700 sm:text-base">{project.description}</p>

      {/* Mostrar freelancer para proyectos de transacciones */}
      {project._isFromTransaction && project.freelancer && (
        <div className="mb-4 flex items-center rounded-lg bg-emerald-50 p-3 text-xs text-gray-600 sm:text-sm">
          <i className="ri-user-check-line text-primary mr-2"></i>
          <span className="font-medium">Freelancer asignado: {project.freelancer.full_name}</span>
          {project.freelancer.rating && (
            <>
              <span className="mx-2 hidden sm:inline">•</span>
              <i className="ri-star-fill mr-1 ml-2 text-yellow-500 sm:ml-0"></i>
              <span>{project.freelancer.rating.toFixed(1)}</span>
            </>
          )}
        </div>
      )}

      {/* Habilidades solo para proyectos creados */}
      {!project._isFromTransaction &&
        project.required_skills &&
        project.required_skills.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-2">
            {project.required_skills.map((skill, index) => (
              <span
                key={index}
                className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-700 sm:px-3 sm:text-sm"
              >
                {skill}
              </span>
            ))}
          </div>
        )}

      <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div className="text-xs text-gray-600 sm:text-sm">
          {project._isFromTransaction ? (
            <div className="flex items-center">
              <i className="ri-check-circle-line text-primary mr-1"></i>
              <span>Proyecto contratado directamente</span>
            </div>
          ) : (
            <>
              <i className="ri-user-line mr-1"></i>
              {project.proposals?.length || 0} propuestas recibidas
            </>
          )}

          {project._isFromTransaction && (
            <div className="text-primary mt-1 flex items-center text-xs">
              <i className="ri-shield-check-line mr-1"></i>
              <span>
                Pago {project.payment_status === "paid" ? "verificado" : "procesándose"} con Stripe
              </span>
            </div>
          )}
        </div>

        <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
          {project._isFromTransaction ? (
            <>
              {handleContactFreelancer && (
                <button
                  onClick={handleContactFreelancer}
                  className="bg-primary w-full cursor-pointer rounded-md px-3 py-2 text-xs font-medium whitespace-nowrap text-white transition-colors hover:bg-cyan-700 sm:w-auto sm:px-4 sm:text-sm"
                >
                  <i className="ri-chat-3-line mr-1"></i>
                  Chatear con Freelancer
                </button>
              )}
              {handleViewTransaction && (
                <button
                  onClick={handleViewTransaction}
                  className="bg-primary w-full cursor-pointer rounded-md px-3 py-2 text-xs font-medium whitespace-nowrap text-white transition-colors hover:bg-cyan-700 sm:w-auto sm:px-4 sm:text-sm"
                >
                  <i className="ri-eye-line mr-1"></i>
                  Ver Pago
                </button>
              )}
            </>
          ) : (
            <>
              {/* Edit and Delete buttons - only show if no accepted proposals or project is completed */}
              {canEditOrDelete && (
                <>
                  {handleEditProject && (
                    <button
                      onClick={handleEditProject}
                      className="w-full cursor-pointer rounded-md bg-yellow-500 px-3 py-2 text-xs font-medium whitespace-nowrap text-white transition-colors hover:bg-yellow-600 sm:w-auto sm:px-4 sm:text-sm"
                    >
                      <i className="ri-edit-line mr-1"></i>
                      Editar
                    </button>
                  )}
                  {handleDeleteProject && (
                    <button
                      onClick={async () => {
                        const confirmed = await confirm(
                          "Confirmar Eliminación",
                          "¿Estás seguro de que quieres eliminar este proyecto? Esta acción no se puede deshacer.",
                        )
                        if (confirmed) {
                          handleDeleteProject()
                        }
                      }}
                      className="w-full cursor-pointer rounded-md bg-red-500 px-3 py-2 text-xs font-medium whitespace-nowrap text-white transition-colors hover:bg-red-600 sm:w-auto sm:px-4 sm:text-sm"
                    >
                      <i className="ri-delete-bin-line mr-1"></i>
                      Eliminar
                    </button>
                  )}
                </>
              )}
              {/* NUEVO: Botón de gestión avanzada */}
              {(project.status === "in_progress" || project.status === "pending_approval") && (
                <button
                  onClick={() => openProjectManagement(project)}
                  className="bg-primary w-full cursor-pointer rounded-md px-3 py-2 text-xs font-medium whitespace-nowrap text-white transition-colors hover:bg-cyan-700 sm:w-auto sm:px-4 sm:text-sm"
                >
                  <i className="ri-settings-3-line mr-1"></i>
                  {project.status === "pending_approval"
                    ? "Revisar Entregables"
                    : "Gestionar Proyecto"}
                </button>
              )}
              <button
                onClick={() => viewProjectProposals(project)}
                className="bg-primary w-full cursor-pointer rounded-md px-3 py-2 text-xs font-medium whitespace-nowrap text-white transition-colors hover:bg-cyan-700 sm:w-auto sm:px-4 sm:text-sm"
              >
                <i className="ri-eye-line mr-1"></i>
                Ver Propuestas
              </button>
            </>
          )}
        </div>
      </div>

      <ConfirmDialog
        isOpen={isOpen}
        onClose={handleCancel}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        title={config.title}
        description={config.description}
      />
    </article>
  )
}
