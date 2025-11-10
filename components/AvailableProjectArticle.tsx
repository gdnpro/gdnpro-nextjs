import type { Project } from "@/interfaces/Project"
import type { Proposal } from "@/interfaces/Proposal"
import { useTranslation } from "react-i18next"

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
  const { t } = useTranslation()
  return (
    <div
      key={project.id}
      className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 shadow-lg transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-cyan-500/10 sm:p-8"
    >
      <div className="flex flex-col space-y-4 lg:flex-row lg:items-start lg:justify-between lg:space-y-0">
        <div className="flex-1">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h4 className="text-xl font-bold text-gray-900 sm:text-2xl">{project.title}</h4>
            <div className="flex shrink-0 items-center gap-3">
              <span className="inline-flex items-center rounded-full bg-gradient-to-r from-emerald-500 to-green-500 px-3 py-1 text-xs font-semibold text-white shadow-md">
                <i className="ri-check-line mr-1"></i>
                {project.status === "open"
                  ? t("dashboard.projectsCard.status.open")
                  : t(`dashboard.projectsCard.status.${project.status}`)}
              </span>
              <div className="rounded-xl bg-gradient-to-br from-cyan-50 to-teal-50 px-4 py-2 ring-1 ring-cyan-200">
                <span className="text-primary text-md font-bold sm:text-lg">
                  ${project.budget_min || project.budget || 0} - $
                  {project.budget_max || project.budget || 0}
                </span>
              </div>
            </div>
          </div>

          <p className="mb-6 text-sm leading-relaxed text-gray-600 sm:text-base">
            {project.description.length > 200
              ? `${project.description.substring(0, 200)}...`
              : project.description}
          </p>

          <div className="mb-6 flex flex-wrap items-center gap-2">
            {project.required_skills?.slice(0, 3).map((skill, index) => (
              <span
                key={index}
                className="group/skill relative overflow-hidden rounded-full bg-gradient-to-r from-cyan-500 to-teal-500 px-4 py-1.5 text-xs font-semibold text-white shadow-md transition-all hover:scale-105 hover:shadow-lg hover:shadow-cyan-500/30"
              >
                <span className="relative z-10 flex items-center gap-1.5">
                  <i className="ri-checkbox-circle-line text-xs"></i>
                  <span>{skill}</span>
                </span>
              </span>
            ))}
            {project.required_skills && project.required_skills.length > 3 && (
              <span className="rounded-full bg-gradient-to-r from-gray-100 to-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700">
                +{project.required_skills.length - 3}
              </span>
            )}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-100 to-teal-100">
                  <i className="ri-user-line text-cyan-600"></i>
                </div>
                <span className="font-medium text-gray-700">{project.client?.full_name}</span>
                {project.client?.rating && project.client.rating > 0 && (
                  <span className="flex items-center gap-1 rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-semibold text-yellow-700">
                    <i className="ri-star-fill text-yellow-500"></i>
                    {project.client.rating}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-100 to-indigo-100">
                  <i className="ri-calendar-line text-blue-600"></i>
                </div>
                <span>
                  {t("dashboard.projectsCard.from")}{" "}
                  {new Date(project.created_at).toLocaleDateString("es-ES")}
                </span>
              </div>
              {project.deadline && (
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-purple-100 to-pink-100">
                    <i className="ri-time-line text-purple-600"></i>
                  </div>
                  <span>
                    {t("dashboard.projectsCard.to")}{" "}
                    {new Date(project.deadline).toLocaleDateString("es-ES")}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:gap-2 lg:ml-6 lg:flex-col lg:gap-3">
          <button
            onClick={() => viewProjectDetails(project)}
            className="group flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-gray-300 bg-white px-4 py-3 text-sm font-semibold whitespace-nowrap text-gray-700 transition-all hover:-translate-y-0.5 hover:border-gray-400 hover:bg-gray-50 hover:shadow-md"
          >
            <i className="ri-eye-line text-base transition-transform group-hover:scale-110"></i>
            {t("dashboard.projectsCard.viewDetails")}
          </button>
          {!proposals.find((p) => p.project?.id === project.id) && (
            <button
              onClick={() => sendProposal(project.id)}
              className="group flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 px-4 py-3 text-sm font-semibold whitespace-nowrap text-white shadow-lg shadow-cyan-500/30 transition-all hover:-translate-y-0.5 hover:scale-[1.02] hover:shadow-xl hover:shadow-cyan-500/40"
            >
              <i className="ri-send-plane-fill text-base transition-transform group-hover:translate-x-1"></i>
              {t("dashboard.projectsCard.sendProposal")}
            </button>
          )}
          {project.client?.id && (
            <button
              onClick={() => startChat(project.id, project.client?.id!)}
              className="group flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 px-4 py-3 text-sm font-semibold whitespace-nowrap text-white shadow-lg shadow-cyan-500/30 transition-all hover:-translate-y-0.5 hover:scale-[1.02] hover:shadow-xl hover:shadow-cyan-500/40"
            >
              <i className="ri-chat-3-line text-base transition-transform group-hover:scale-110"></i>
              {t("dashboard.projectsCard.chatWithClient")}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
