"use client"

import { useEffect } from "react"
import { useTranslation } from "react-i18next"
import type { Project } from "@/interfaces/Project"

interface WorksProjectDetailsModalProps {
  project: Project | null
  isOpen: boolean
  onClose: () => void
  onSendProposal: (projectId: string) => void
  onStartChat: (projectId: string, clientId: string) => void
}

export default function WorksProjectDetailsModal({
  project,
  isOpen,
  onClose,
  onSendProposal,
  onStartChat,
}: WorksProjectDetailsModalProps) {
  const { t, i18n } = useTranslation()
  
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }

    return () => {
      document.body.style.overflow = ""
    }
  }, [isOpen])

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose()
      }
    }

    window.addEventListener("keydown", handleEscape)
    return () => window.removeEventListener("keydown", handleEscape)
  }, [isOpen, onClose])

  if (!isOpen || !project) return null

  const handleSendProposal = () => {
    onSendProposal(project.id)
    onClose()
  }

  const handleStartChat = () => {
    if (project.client?.id) {
      onStartChat(project.id, project.client.id)
      onClose()
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-black/60 via-black/50 to-black/60 p-0 backdrop-blur-md sm:p-4"
      onClick={onClose}
    >
      <div
        className="animate-in fade-in zoom-in-95 flex h-screen w-full max-w-full flex-col overflow-hidden bg-white shadow-2xl sm:h-auto sm:max-h-[92vh] sm:max-w-5xl sm:rounded-3xl sm:ring-1 sm:ring-black/5 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modern Header with Gradient */}
        <div className="relative shrink-0 overflow-hidden bg-gradient-to-r from-cyan-600 via-cyan-500 to-teal-500 p-4 sm:p-6 md:p-8 text-white">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIyIi8+PC9nPjwvZz48L3N2Zz4=')] opacity-20"></div>
          <div className="relative z-10 flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0 pr-4">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-2xl bg-white/20 ring-1 ring-white/30 backdrop-blur-sm">
                  <i className="ri-briefcase-4-line text-xl sm:text-2xl"></i>
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl leading-tight font-bold truncate">{project.title}</h2>
                  {project.status && (
                    <span
                      className={`mt-2 inline-flex items-center rounded-full px-2 sm:px-3 py-1 text-xs font-semibold ${
                        project.status === "open"
                          ? "bg-emerald-500/90 text-white"
                          : project.status === "in_progress"
                            ? "bg-blue-500/90 text-white"
                            : "bg-gray-500/90 text-white"
                      }`}
                    >
                      {project.status === "open"
                        ? t("works.projectDetails.statusOpen")
                        : project.status === "in_progress"
                          ? t("works.projectDetails.statusInProgress")
                          : project.status}
                    </span>
                  )}
                </div>
              </div>
              {project.client && (
                <div className="mt-4 flex items-center gap-3 rounded-xl bg-white/10 p-3 ring-1 ring-white/20 backdrop-blur-sm">
                  <div className="relative flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white/20 ring-2 ring-white/30">
                    {project.client.avatar_url ? (
                      <img
                        src={project.client.avatar_url}
                        alt={project.client.full_name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <i className="ri-user-3-line text-lg sm:text-xl"></i>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-white text-sm sm:text-base">{project.client.full_name}</p>
                    {project.client.rating && (
                      <div className="mt-1 flex items-center gap-1 text-xs sm:text-sm text-cyan-100">
                        <i className="ri-star-fill text-yellow-300"></i>
                        <span className="font-medium">{project.client.rating.toFixed(1)}</span>
                        <span className="text-white/70 hidden sm:inline">· {t("works.projectDetails.verifiedClient")}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            <button
              onClick={onClose}
              className="group flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/20 backdrop-blur-sm transition-all hover:scale-110 active:scale-95 hover:bg-white/20 active:bg-white/30 touch-manipulation"
              aria-label={t("works.projectDetails.close")}
            >
              <i className="ri-close-line text-xl transition-transform group-hover:rotate-90"></i>
            </button>
          </div>
        </div>

        {/* Content with Modern Cards */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 pb-20 sm:pb-24 min-h-0">
          {/* Key Metrics Cards */}
          <div className="mb-6 sm:mb-8 grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-3">
            <div className="group relative overflow-hidden rounded-xl sm:rounded-2xl bg-gradient-to-br from-cyan-50 to-teal-50 p-4 sm:p-6 ring-1 ring-cyan-100 transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-cyan-500/10">
              <div className="mb-3 flex items-center gap-3">
                <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-cyan-600 text-white shadow-lg shadow-cyan-500/30">
                  <i className="ri-money-dollar-circle-fill text-lg sm:text-xl"></i>
                </div>
                <div className="text-xs sm:text-sm font-medium text-cyan-700">{t("works.projectDetails.budget")}</div>
              </div>
              <p className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 break-words">
                {project.budget_min && project.budget_max
                  ? `$${project.budget_min.toLocaleString()} - $${project.budget_max.toLocaleString()}`
                  : project.budget
                    ? `$${project.budget.toLocaleString()}`
                    : t("works.projectDetails.notSpecified")}
              </p>
            </div>

            {project.deadline && (
              <div className="group relative overflow-hidden rounded-xl sm:rounded-2xl bg-gradient-to-br from-cyan-50 to-teal-50 p-4 sm:p-6 ring-1 ring-cyan-100 transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-cyan-500/10">
                <div className="mb-3 flex items-center gap-3">
                  <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-teal-500 text-white shadow-lg shadow-cyan-500/30">
                    <i className="ri-calendar-check-fill text-lg sm:text-xl"></i>
                  </div>
                  <div className="text-xs sm:text-sm font-medium text-cyan-700">{t("works.projectDetails.deadline")}</div>
                </div>
                <p className="text-base sm:text-lg md:text-xl font-bold text-gray-900">
                  {new Date(project.deadline).toLocaleDateString(i18n.language === "en" ? "en-US" : "es-ES", {
                    month: "short",
                    day: "numeric",
                  })}
                </p>
                <p className="text-xs sm:text-sm text-gray-600">
                  {new Date(project.deadline).toLocaleDateString(i18n.language === "en" ? "en-US" : "es-ES", { year: "numeric" })}
                </p>
              </div>
            )}

            {project.project_type && (
              <div className="group relative overflow-hidden rounded-xl sm:rounded-2xl bg-gradient-to-br from-cyan-50 to-teal-50 p-4 sm:p-6 ring-1 ring-cyan-100 transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-cyan-500/10">
                <div className="mb-3 flex items-center gap-3">
                  <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-teal-500 text-white shadow-lg shadow-cyan-500/30">
                    <i className="ri-folder-fill text-lg sm:text-xl"></i>
                  </div>
                  <div className="text-xs sm:text-sm font-medium text-cyan-700">{t("works.projectDetails.type")}</div>
                </div>
                <p className="text-base sm:text-lg md:text-xl font-bold text-gray-900 capitalize break-words">{project.project_type}</p>
              </div>
            )}
          </div>

          {/* Description Section */}
          <div className="mb-6 sm:mb-8">
            <div className="mb-3 sm:mb-4 flex items-center gap-2 sm:gap-3">
              <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-teal-500 text-white shadow-lg">
                <i className="ri-file-text-line text-sm sm:text-lg"></i>
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-900">{t("works.projectDetails.projectDescription")}</h3>
            </div>
            <div className="rounded-xl sm:rounded-2xl border border-gray-200 bg-gradient-to-br from-gray-50 to-white p-4 sm:p-6 shadow-sm">
              <p className="leading-relaxed whitespace-pre-wrap text-sm sm:text-base text-gray-700 break-words">
                {project.description}
              </p>
            </div>
          </div>

          {/* Requirements Section */}
          {project.requirements && (
            <div className="mb-6 sm:mb-8">
              <div className="mb-3 sm:mb-4 flex items-center gap-2 sm:gap-3">
                <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-teal-500 text-white shadow-lg">
                  <i className="ri-list-check-2 text-sm sm:text-lg"></i>
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-gray-900">{t("works.projectDetails.requirements")}</h3>
              </div>
              <div className="rounded-xl sm:rounded-2xl border border-gray-200 bg-gradient-to-br from-gray-50 to-white p-4 sm:p-6 shadow-sm">
                <p className="leading-relaxed whitespace-pre-wrap text-sm sm:text-base text-gray-700 break-words">
                  {project.requirements}
                </p>
              </div>
            </div>
          )}

          {/* Skills Section */}
          {project.required_skills && project.required_skills.length > 0 && (
            <div className="mb-6 sm:mb-8">
              <div className="mb-3 sm:mb-4 flex items-center gap-2 sm:gap-3">
                <div className="flex h-8 w-8 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-teal-500 text-white shadow-lg">
                  <i className="ri-tools-fill text-sm sm:text-lg"></i>
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-gray-900">{t("works.projectDetails.requiredSkills")}</h3>
              </div>
              <div className="flex flex-wrap gap-2 sm:gap-3">
                {project.required_skills.map((skill, index) => {
                  const skillText = typeof skill === "string" ? skill : skill || skill
                  return (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1.5 sm:gap-2 rounded-full bg-gradient-to-r from-cyan-500 to-teal-500 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold text-white shadow-md transition-all hover:scale-105 hover:shadow-lg hover:shadow-cyan-500/30"
                    >
                      <i className="ri-checkbox-circle-line text-xs sm:text-base"></i>
                      <span className="whitespace-nowrap">{skillText}</span>
                    </span>
                  )
                })}
              </div>
            </div>
          )}

          {/* Duration Section */}
          {project.duration && (
            <div className="mb-6 sm:mb-8">
              <div className="mb-3 sm:mb-4 flex items-center gap-2 sm:gap-3">
                <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-teal-500 text-white shadow-lg">
                  <i className="ri-time-line text-sm sm:text-lg"></i>
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-gray-900">{t("works.projectDetails.estimatedDuration")}</h3>
              </div>
              <div className="rounded-xl sm:rounded-2xl border border-gray-200 bg-gradient-to-br from-gray-50 to-white p-4 sm:p-6 shadow-sm">
                <p className="text-base sm:text-lg font-medium text-gray-700">{project.duration}</p>
              </div>
            </div>
          )}

          {/* Footer Info */}
          <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-xl sm:rounded-2xl border border-gray-200 bg-gradient-to-r from-gray-50 to-white p-4 sm:p-6">
            <div className="flex items-center gap-3 text-xs sm:text-sm text-gray-600">
              <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-gray-100">
                <i className="ri-calendar-check-line text-gray-600 text-sm sm:text-base"></i>
              </div>
              <div>
                <p className="font-medium text-gray-900 text-xs sm:text-sm">{t("works.projectDetails.publishedOn")}</p>
                <p className="text-gray-600 text-xs sm:text-sm">
                  {new Date(project.created_at).toLocaleDateString(i18n.language === "en" ? "en-US" : "es-ES", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-500">
              <i className="ri-eye-line"></i>
              <span>{t("works.projectDetails.detailedView")}</span>
            </div>
          </div>
        </div>

        {/* Modern Action Buttons */}
        <div className="shrink-0 border-t border-gray-200 bg-gradient-to-b from-white to-gray-50 p-4 sm:p-6 shadow-lg">
          <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
            <button
              onClick={handleStartChat}
              className="group flex flex-1 cursor-pointer items-center justify-center gap-2 sm:gap-3 rounded-xl border-2 border-cyan-500 bg-white px-4 sm:px-6 py-3 sm:py-4 font-semibold text-cyan-600 transition-all hover:-translate-y-0.5 active:translate-y-0 hover:bg-gradient-to-r hover:from-cyan-500 hover:to-teal-500 hover:text-white active:bg-cyan-50 hover:shadow-lg hover:shadow-cyan-500/30 min-h-[44px] touch-manipulation"
            >
              <i className="ri-chat-3-line text-lg sm:text-xl transition-transform group-hover:scale-110"></i>
              <span className="text-sm sm:text-base">{t("works.projectDetails.startChat")}</span>
            </button>
            <button
              onClick={handleSendProposal}
              className="group flex flex-1 cursor-pointer items-center justify-center gap-2 sm:gap-3 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 px-4 sm:px-6 py-3 sm:py-4 font-semibold text-white shadow-lg shadow-cyan-500/30 transition-all hover:-translate-y-0.5 active:translate-y-0 hover:scale-[1.02] active:scale-100 hover:shadow-xl hover:shadow-cyan-500/40 min-h-[44px] touch-manipulation"
            >
              <i className="ri-send-plane-fill text-lg sm:text-xl transition-transform group-hover:translate-x-1"></i>
              <span className="text-sm sm:text-base">{t("works.projectDetails.sendProposal")}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
