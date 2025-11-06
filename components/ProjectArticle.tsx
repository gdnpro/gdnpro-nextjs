"use client"

import { supabaseBrowser } from "@/utils/supabase/client"
import type { Project } from "@/interfaces/Project"
import { useBadges } from "@/hooks/useBadges"
import { useNotifications } from "@/hooks/useNotifications"

const supabase = supabaseBrowser()

interface Props {
  project: Project
  openProjectManagement: (project: Project) => void
  viewProjectProposals: (project: Project) => void
  loadProjects: () => void
  handleActiveTab: (flag: string) => void
}

export const ProjectArticle = ({
  project,
  openProjectManagement,
  loadProjects,
  handleActiveTab,
  viewProjectProposals,
}: Props) => {
  const { checkAndUnlockBadges } = useBadges()
  const { notifyProjectUpdate } = useNotifications()
  return (
    <article
      key={project.id}
      className="border border-gray-200 rounded-lg p-4 sm:p-6 hover:shadow-md transition-shadow"
    >
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start space-y-3 sm:space-y-0">
        <div className="flex-1">
          <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
            {project.title}
          </h3>

          {/* NUEVO: Barra de progreso para proyectos con gestión avanzada */}
          {!project._isFromTransaction &&
            project.progress_percentage !== undefined && (
              <div className="flex items-center mb-2">
                <div className="flex-1 bg-gray-200 rounded-full h-2 mr-3">
                  <div
                    className="bg-primary h-2 rounded-full transition-all duration-500"
                    style={{
                      width: `${project.progress_percentage || 0}%`,
                    }}
                  ></div>
                </div>
                <span className="text-sm text-gray-600 font-medium">
                  {project.progress_percentage || 0}%
                </span>
              </div>
            )}

          <div className="flex flex-wrap items-center text-xs sm:text-sm text-gray-500 gap-2">
            <span
              className={`px-2 py-1 rounded-full text-xs font-medium ${
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
            <span>
              Publicado: {new Date(project.created_at).toLocaleDateString()}
            </span>

            {/* NUEVO: Mostrar hitos */}
            {!project._isFromTransaction &&
              project.total_milestones !== undefined &&
              project.total_milestones > 0 && (
                <>
                  <span>•</span>
                  <span className="px-2 py-1 bg-blue-100 text-cyan-800 rounded-full text-xs font-medium">
                    <i className="ri-flag-line mr-1"></i>
                    {project.completed_milestones || 0}/
                    {project.total_milestones} Hitos
                  </span>
                </>
              )}

            {/* Estado de pago para proyectos de transacciones */}
            {project._isFromTransaction && (
              <>
                <span>•</span>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    project.payment_status === "paid"
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-yellow-100 text-yellow-800"
                  }`}
                >
                  <i className="ri-secure-payment-line mr-1"></i>
                  {project.payment_status === "paid"
                    ? "Pagado"
                    : "Pago Pendiente"}
                </span>
              </>
            )}

            {/* Indicador de contrato directo */}
            {project._isFromTransaction && (
              <>
                <span>•</span>
                <span className="px-2 py-1 bg-blue-100 text-cyan-800 rounded-full text-xs font-medium">
                  <i className="ri-bank-card-line mr-1"></i>
                  Contrato Directo
                </span>
              </>
            )}
          </div>

          {project.status === "pending_approval" && (
            <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <div className="flex items-start">
                <div className="shrink-0">
                  <i className="ri-notification-line text-orange-600 text-xl mr-3"></i>
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-orange-800 mb-1">
                    🎉 ¡El freelancer ha completado el proyecto!
                  </h4>
                  <p className="text-orange-700 text-sm mb-2">
                    El proyecto está listo para tu revisión y aprobación final.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <button
                      onClick={() => openProjectManagement(project)}
                      className="px-3 py-2 bg-orange-600 text-white rounded-md text-sm font-medium hover:bg-orange-700 transition-colors cursor-pointer"
                    >
                      <i className="ri-eye-line mr-1"></i>
                      Revisar Entregables
                    </button>
                    <button
                      onClick={async () => {
                        if (
                          confirm(
                            "¿Estás seguro de que quieres aprobar este proyecto? El pago se liberará automáticamente."
                          )
                        ) {
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
                            const { data: { user } } = await supabase.auth.getUser()
                            if (user) {
                              if (project.freelancer_id) {
                                await checkAndUnlockBadges(project.freelancer_id, "freelancer")
                              }
                              if (project.client_id) {
                                await checkAndUnlockBadges(project.client_id, "client")
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
                        }
                      }}
                      className="px-3 py-2 bg-primary text-white rounded-md text-sm font-medium hover:bg-cyan-700 transition-colors cursor-pointer"
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
          <div className="text-base sm:text-lg font-bold text-primary">
            ${project.budget_min}{" "}
            {project.budget_max && project.budget_min !== project.budget_max
              ? `- $${project.budget_max}`
              : ""}
          </div>
          <div className="text-xs sm:text-sm text-gray-500">
            {project.project_type || "Proyecto"}
          </div>
          {project._isFromTransaction && (
            <div className="text-xs text-primary font-medium mt-1">
              {project.payment_status === "paid"
                ? "Pago Procesado"
                : "Procesando Pago"}
            </div>
          )}
        </div>
      </div>

      <p className="text-sm sm:text-base text-gray-700 mb-4 line-clamp-2">
        {project.description}
      </p>

      {/* Mostrar freelancer para proyectos de transacciones */}
      {project._isFromTransaction && project.freelancer && (
        <div className="flex items-center text-xs sm:text-sm text-gray-600 mb-4 p-3 bg-emerald-50 rounded-lg">
          <i className="ri-user-check-line text-primary mr-2"></i>
          <span className="font-medium">
            Freelancer asignado: {project.freelancer.full_name}
          </span>
          {project.freelancer.rating && (
            <>
              <span className="mx-2 hidden sm:inline">•</span>
              <i className="ri-star-fill text-yellow-500 mr-1 ml-2 sm:ml-0"></i>
              <span>{project.freelancer.rating.toFixed(1)}</span>
            </>
          )}
        </div>
      )}

      {/* Habilidades solo para proyectos creados */}
      {!project._isFromTransaction &&
        project.required_skills &&
        project.required_skills.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {project.required_skills.map((skill, index) => (
              <span
                key={index}
                className="px-2 sm:px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs sm:text-sm"
              >
                {skill}
              </span>
            ))}
          </div>
        )}

      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-3 sm:space-y-0">
        <div className="text-xs sm:text-sm text-gray-600">
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
            <div className="flex items-center mt-1 text-xs text-primary">
              <i className="ri-shield-check-line mr-1"></i>
              <span>
                Pago{" "}
                {project.payment_status === "paid"
                  ? "verificado"
                  : "procesándose"}{" "}
                con Stripe
              </span>
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
          {project._isFromTransaction ? (
            <>
              <button
                onClick={() => handleActiveTab("messages")}
                className="w-full sm:w-auto px-3 sm:px-4 py-2 bg-primary hover:bg-cyan-700 text-white font-medium text-xs sm:text-sm rounded-md transition-colors whitespace-nowrap cursor-pointer"
              >
                <i className="ri-chat-3-line mr-1"></i>
                Chatear con Freelancer
              </button>
              <button
                onClick={() => handleActiveTab("payments")}
                className="w-full sm:w-auto px-3 sm:px-4 py-2 bg-primary hover:bg-cyan-700 text-white font-medium text-xs sm:text-sm rounded-md transition-colors whitespace-nowrap cursor-pointer"
              >
                <i className="ri-eye-line mr-1"></i>
                Ver Pago
              </button>
            </>
          ) : (
            <>
              {/* NUEVO: Botón de gestión avanzada */}
              {(project.status === "in_progress" ||
                project.status === "pending_approval") && (
                <button
                  onClick={() => openProjectManagement(project)}
                  className="w-full sm:w-auto px-3 sm:px-4 py-2 bg-primary hover:bg-cyan-700 text-white font-medium text-xs sm:text-sm rounded-md transition-colors whitespace-nowrap cursor-pointer"
                >
                  <i className="ri-settings-3-line mr-1"></i>
                  {project.status === "pending_approval"
                    ? "Revisar Entregables"
                    : "Gestionar Proyecto"}
                </button>
              )}
              <button
                onClick={() => viewProjectProposals(project)}
                className="w-full sm:w-auto px-3 sm:px-4 py-2 bg-primary hover:bg-cyan-700 text-white font-medium text-xs sm:text-sm rounded-md transition-colors whitespace-nowrap cursor-pointer"
              >
                <i className="ri-eye-line mr-1"></i>
                Ver Propuestas
              </button>
            </>
          )}
        </div>
      </div>
    </article>
  )
}
