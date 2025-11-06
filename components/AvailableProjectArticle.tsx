import type { Project } from "@/interfaces/Project"
import type { Proposal } from "@/interfaces/Proposal"

interface Props {
  project: Project
  viewProjectDetails: (project: Project) => void
  proposals: Proposal[]
  sendProposal: (id: string) => void
  startChat: (project_id: string, project_client_id: string) => void
}

export const AvailableProjectArticle = ({
  project,
  viewProjectDetails,
  proposals,
  sendProposal,
  startChat,
}: Props) => {
  return (
    <div
      key={project.id}
      className="bg-gray-50 rounded-lg p-4 sm:p-6 hover:shadow-md transition-shadow"
    >
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start space-y-4 lg:space-y-0">
        <div className="flex-1">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3">
            <h4 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-0">
              {project.title}
            </h4>
            <div className="flex items-center space-x-4">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                {project.status === "open" ? "Abierto" : project.status}
              </span>
              <span className="text-lg sm:text-xl font-bold text-primary">
                ${project.budget_min || project.budget || 0} - $
                {project.budget_max || project.budget || 0}
              </span>
            </div>
          </div>

          <p className="text-sm sm:text-base text-gray-600 mb-4 leading-relaxed">
            {project.description.length > 200
              ? `${project.description.substring(0, 200)}...`
              : project.description}
          </p>

          <div className="flex flex-wrap items-center gap-2 mb-4">
            {project.required_skills?.slice(0, 3).map((skill, index) => (
              <span
                key={index}
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-cyan-800"
              >
                {skill}
              </span>
            ))}
            {project.required_skills && project.required_skills.length > 3 && (
              <span className="text-xs text-gray-500">
                +{project.required_skills.length - 3} más
              </span>
            )}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <div className="flex items-center">
                <i className="ri-user-line mr-1"></i>
                <span>{project.client?.full_name}</span>
                <span className="ml-1 text-yellow-500">
                  {project.client?.rating!! > 0
                    ? `${project.client?.rating} ★`
                    : ""}
                </span>
              </div>
              <div className="flex items-center">
                <i className="ri-calendar-line mr-1"></i>
                <span>
                  {new Date(project.created_at).toLocaleDateString("es-ES")}
                </span>
              </div>
              {project.deadline && (
                <div className="flex items-center">
                  <i className="ri-time-line mr-1"></i>
                  <span>
                    Hasta{" "}
                    {new Date(project.deadline).toLocaleDateString("es-ES")}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row lg:flex-col space-y-2 sm:space-y-0 sm:space-x-2 lg:space-x-0 lg:space-y-2 lg:ml-6">
          <button
            onClick={() => viewProjectDetails(project)}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium whitespace-nowrap cursor-pointer"
          >
            <i className="ri-eye-line mr-2"></i>
            Ver Detalles
          </button>
          {!proposals.find((p) => p.project?.id === project.id) && (
            <button
              onClick={() => sendProposal(project.id)}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-cyan-700 transition-colors text-sm font-medium whitespace-nowrap cursor-pointer"
            >
              <i className="ri-send-plane-line mr-2"></i>
              Enviar Propuesta
            </button>
          )}
          {project.client?.id && (
            <button
              onClick={() => startChat(project.id, project.client?.id!)}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-cyan-700 transition-colors text-sm font-medium whitespace-nowrap cursor-pointer"
            >
              <i className="ri-chat-3-line mr-2"></i>
              Chat Cliente
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
