"use client"

import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import type { Project } from "@/interfaces/Project"

interface WorksProposalModalProps {
  project: Project | null
  isOpen: boolean
  onClose: () => void
  onSubmit: (formData: { budget: string; delivery_time: string; message: string }) => void
}

export default function WorksProposalModal({
  project,
  isOpen,
  onClose,
  onSubmit,
}: WorksProposalModalProps) {
  const { t, i18n } = useTranslation()
  const [formData, setFormData] = useState({
    budget: "",
    delivery_time: "",
    message: "",
  })

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

  if (!isOpen || !project) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
    setFormData({ budget: "", delivery_time: "", message: "" })
  }

  const handleClose = () => {
    setFormData({ budget: "", delivery_time: "", message: "" })
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-black/60 via-black/50 to-black/60 p-0 backdrop-blur-md sm:p-4"
      onClick={handleClose}
    >
      <div
        className="animate-in fade-in zoom-in-95 flex h-screen w-full max-w-full flex-col overflow-hidden bg-white shadow-2xl sm:h-auto sm:max-h-[92vh] sm:max-w-3xl sm:rounded-3xl sm:ring-1 sm:ring-black/5 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modern Header with lienar */}
        <div className="relative shrink-0 overflow-hidden bg-gradient-to-r from-cyan-600 via-cyan-500 to-teal-500 p-4 sm:p-6 md:p-8 text-white">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIyIi8+PC9nPjwvZz48L3N2Zz4=')] opacity-20"></div>
          <div className="relative z-10 flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0 pr-4">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-2xl bg-white/20 ring-1 ring-white/30 backdrop-blur-sm">
                  <i className="ri-send-plane-line text-xl sm:text-2xl"></i>
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-2xl sm:text-3xl md:text-4xl leading-tight font-bold truncate">{t("works.proposalModal.title")}</h2>
                  <p className="mt-2 text-xs sm:text-sm text-cyan-100">
                    {t("works.proposalModal.description")}
                  </p>
                </div>
              </div>
              <div className="mt-4 rounded-xl bg-white/10 p-3 sm:p-4 ring-1 ring-white/20 backdrop-blur-sm">
                <h3 className="mb-2 font-semibold text-white text-sm sm:text-base truncate">{project.title}</h3>
                <p className="mb-3 line-clamp-2 text-xs sm:text-sm text-cyan-100">{project.description}</p>
                <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs text-cyan-100">
                  <span className="flex items-center gap-1">
                    <i className="ri-money-dollar-circle-line"></i>${project.budget_min || 0} - $
                    {project.budget_max || 0}
                  </span>
                  {project.deadline && (
                    <span className="flex items-center gap-1">
                      <i className="ri-calendar-line"></i>
                      {new Date(project.deadline).toLocaleDateString(i18n.language === "en" ? "en-US" : "es-ES")}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="group flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/20 backdrop-blur-sm transition-all hover:scale-110 active:scale-95 hover:bg-white/20 active:bg-white/30 touch-manipulation"
              aria-label={t("works.proposalModal.cancel")}
            >
              <i className="ri-close-line text-xl transition-transform group-hover:rotate-90"></i>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 min-h-0">
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            <div>
              <label htmlFor="proposal-budget" className="mb-2 sm:mb-3 flex items-center gap-2 text-xs sm:text-sm font-semibold text-gray-900">
                <div className="bg-gradient-to-br flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg from-cyan-500 to-cyan-600 text-white shadow-lg">
                  <i className="ri-money-dollar-circle-fill text-xs sm:text-sm"></i>
                </div>
                {t("works.proposalModal.proposedBudget")}
              </label>
              <input
                type="number"
                id="proposal-budget"
                name="budget"
                value={formData.budget}
                onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                className="focus:ring-primary bg-gradient-to-br w-full rounded-xl border border-gray-300 from-gray-50 to-white px-4 py-3 text-base sm:text-sm text-gray-900 shadow-sm transition-all focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 focus:outline-none min-h-[44px]"
                placeholder={t("works.proposalModal.budgetPlaceholder")}
                required
              />
            </div>

            <div>
              <label htmlFor="proposal-delivery-time" className="mb-2 sm:mb-3 flex items-center gap-2 text-xs sm:text-sm font-semibold text-gray-900">
                <div className="bg-gradient-to-br flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg from-purple-500 to-pink-500 text-white shadow-lg">
                  <i className="ri-time-line text-xs sm:text-sm"></i>
                </div>
                {t("works.proposalModal.deliveryTime")}
              </label>
              <input
                type="number"
                id="proposal-delivery-time"
                name="delivery_time"
                value={formData.delivery_time}
                onChange={(e) => setFormData({ ...formData, delivery_time: e.target.value })}
                className="focus:ring-primary bg-gradient-to-br w-full rounded-xl border border-gray-300 from-gray-50 to-white px-4 py-3 text-base sm:text-sm text-gray-900 shadow-sm transition-all focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 focus:outline-none min-h-[44px]"
                placeholder={t("works.proposalModal.deliveryTimePlaceholder")}
                required
              />
            </div>

            <div>
              <label htmlFor="proposal-message" className="mb-2 sm:mb-3 flex items-center gap-2 text-xs sm:text-sm font-semibold text-gray-900">
                <div className="bg-gradient-to-br flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg from-blue-500 to-indigo-500 text-white shadow-lg">
                  <i className="ri-message-3-line text-xs sm:text-sm"></i>
                </div>
                {t("works.proposalModal.message")}
              </label>
              <textarea
                id="proposal-message"
                name="message"
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                rows={5}
                className="focus:ring-primary bg-gradient-to-br w-full resize-none rounded-xl border border-gray-300 from-gray-50 to-white px-4 py-3 text-base sm:text-sm text-gray-900 shadow-sm transition-all focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 focus:outline-none"
                placeholder={t("works.proposalModal.messagePlaceholder")}
                required
              />
            </div>

            <div className="flex flex-col gap-3 border-t border-gray-200 bg-white p-4 sm:p-6 sm:flex-row sm:gap-4 shrink-0">
              <button
                type="button"
                onClick={handleClose}
                className="group flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-gray-300 bg-white px-4 sm:px-6 py-3 font-semibold text-gray-700 transition-all hover:-translate-y-0.5 active:translate-y-0 hover:border-gray-400 hover:bg-gray-50 active:bg-gray-100 hover:shadow-md active:shadow-sm min-h-[44px] touch-manipulation"
              >
                <i className="ri-close-line text-base sm:text-lg"></i>
                <span className="text-sm sm:text-base">{t("works.proposalModal.cancel")}</span>
              </button>
              <button
                type="submit"
                className="group bg-gradient-to-r flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl from-cyan-500 to-teal-500 px-4 sm:px-6 py-3 font-semibold text-white shadow-lg shadow-cyan-500/30 transition-all hover:-translate-y-0.5 active:translate-y-0 hover:scale-[1.02] active:scale-100 hover:shadow-xl hover:shadow-cyan-500/40 min-h-[44px] touch-manipulation"
              >
                <i className="ri-send-plane-fill text-base sm:text-lg transition-transform group-hover:translate-x-1"></i>
                <span className="text-sm sm:text-base">{t("works.proposalModal.submit")}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
