"use client"

import { supabaseBrowser } from "@/utils/supabase/client"
import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"

const supabase = supabaseBrowser()

interface ReviewModalProps {
  isOpen: boolean
  onClose: () => void
  project: {
    id: string
    title: string
    reviewee?: {
      id: string
      full_name: string
      avatar_url?: string
    }
    reviewee_type?: "client" | "freelancer"
  }
  onReviewSubmitted: () => void
}

interface Ratings {
  overall: number
  communication: number
  quality: number
  timeliness: number
}

export default function ReviewModal({
  isOpen,
  onClose,
  project,
  onReviewSubmitted,
}: ReviewModalProps) {
  const { t } = useTranslation()
  const [ratings, setRatings] = useState<Ratings>({
    overall: 5,
    communication: 5,
    quality: 5,
    timeliness: 5,
  })
  const [reviewText, setReviewText] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setRatings({
        overall: 5,
        communication: 5,
        quality: 5,
        timeliness: 5,
      })
      setReviewText("")
      setError("")
    }
  }, [isOpen])

  // Handle body overflow when modal opens/closes
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

  const handleRatingChange = (category: keyof Ratings, value: number) => {
    setRatings((prev) => ({
      ...prev,
      [category]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!project.reviewee) {
      setError(t("reviewModal.errors.noReviewee"))
      return
    }

    setSubmitting(true)
    setError("")

    try {
      const session = await supabase.auth.getSession()
      if (!session.data.session?.access_token) {
        throw new Error(t("reviewModal.errors.noSession"))
      }

      const response = await fetch(
        "https://kdmdhhhppizzlhvauofe.supabase.co/functions/v1/reviews-handler",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.data.session.access_token}`,
          },
          body: JSON.stringify({
            action: "create-review",
            projectId: project.id,
            revieweeId: project.reviewee.id,
            ratings,
            reviewText: reviewText.trim(),
          }),
        },
      )

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Error ${response.status}: ${errorText}`)
      }

      const data = await response.json()

      if (data.success) {
        onReviewSubmitted()
        onClose()

        window.toast({
          title: t("reviewModal.toast.success"),
          type: "success",
          location: "bottom-center",
          dismissible: true,
          icon: true,
        })
      } else {
        throw new Error(data.error || t("reviewModal.errors.createFailed"))
      }
    } catch (error: unknown) {
      console.error("❌ Error creando reseña:", error)
      const errorMessage = error instanceof Error ? error.message : "Unknown error"
      const normalizedError =
        errorMessage === t("reviewModal.errors.noSession") ||
        errorMessage === t("reviewModal.errors.createFailed") ||
        errorMessage === t("reviewModal.errors.noReviewee")
          ? errorMessage
          : errorMessage === "Unknown error"
            ? t("reviewModal.errors.generic")
            : errorMessage || t("reviewModal.errors.generic")
      setError(normalizedError)
    } finally {
      setSubmitting(false)
    }
  }

  const renderStars = (category: keyof Ratings, label: string, description: string) => {
    return (
      <div className="mb-6 rounded-2xl border border-gray-200 bg-gradient-to-br from-gray-50 to-white p-6 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <label className="text-sm font-semibold text-gray-900">{label}</label>
          <span className="rounded-full bg-gradient-to-r from-cyan-500 to-teal-500 px-3 py-1 text-xs font-bold text-white shadow-md">
            {ratings[category]}/5
          </span>
        </div>
        <p className="mb-4 text-xs text-gray-600">{description}</p>
        <div className="flex items-center gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => handleRatingChange(category, star)}
              className={`group flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl transition-all ${
                star <= ratings[category]
                  ? "scale-110 bg-gradient-to-br from-cyan-400 to-teal-500 text-white shadow-lg shadow-cyan-500/30"
                  : "bg-gray-100 text-gray-300 hover:scale-105 hover:bg-gray-200"
              }`}
            >
              <i className="ri-star-fill text-xl transition-transform group-hover:scale-125"></i>
            </button>
          ))}
        </div>
      </div>
    )
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-black/60 via-black/50 to-black/60 p-0 backdrop-blur-md sm:p-4">
      <div className="animate-in fade-in zoom-in-95 flex h-screen w-full max-w-full flex-col overflow-hidden bg-white shadow-2xl duration-300 sm:h-auto sm:max-h-[92vh] sm:max-w-3xl sm:rounded-3xl sm:ring-1 sm:ring-black/5">
        {/* Modern Header with Gradient */}
        <div className="relative shrink-0 overflow-hidden bg-gradient-to-r from-cyan-600 via-cyan-500 to-teal-500 p-4 text-white sm:p-6 md:p-8">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIyIi8+PC9nPjwvZz48L3N2Zz4=')] opacity-20"></div>
          <div className="relative z-10 flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1 pr-4">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/20 ring-1 ring-white/30 backdrop-blur-sm sm:h-12 sm:w-12">
                  <i className="ri-star-line text-xl sm:text-2xl"></i>
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="truncate text-2xl leading-tight font-bold sm:text-3xl md:text-4xl">
                    {t("reviewModal.header.title")}
                  </h2>
                  <p className="mt-2 truncate text-xs text-cyan-100 sm:text-sm">
                    {t("reviewModal.header.projectLabel", { title: project.title })}
                  </p>
                </div>
              </div>
              {/* Reviewee Info */}
              {project.reviewee && (
                <div className="mt-4 flex items-center gap-3 rounded-xl bg-white/10 p-3 ring-1 ring-white/20 backdrop-blur-sm">
                  <div className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white/20 ring-2 ring-white/30">
                    {project.reviewee.avatar_url ? (
                      <img
                        src={project.reviewee.avatar_url}
                        alt={project.reviewee.full_name}
                        className="h-full w-full object-cover object-top"
                      />
                    ) : (
                      <i className="ri-user-3-line text-xl text-white"></i>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate font-semibold text-white">
                      {project.reviewee.full_name}
                    </h3>
                    <p className="text-xs text-cyan-100">
                      {project.reviewee_type === "freelancer"
                        ? t("reviewModal.revieweeType.freelancer")
                        : t("reviewModal.revieweeType.client")}
                    </p>
                  </div>
                </div>
              )}
            </div>
            <button
              onClick={onClose}
              className="group flex h-10 w-10 shrink-0 cursor-pointer touch-manipulation items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/20 backdrop-blur-sm transition-all hover:scale-110 hover:bg-white/20 active:scale-95 active:bg-white/30"
              aria-label={t("reviewModal.common.close")}
            >
              <i className="ri-close-line text-xl transition-transform group-hover:rotate-90"></i>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">
          {error && (
            <div className="mb-6 rounded-xl border border-red-200 bg-gradient-to-r from-red-50 to-red-100 px-4 py-3 text-red-600 shadow-sm">
              <div className="flex items-center gap-2">
                <i className="ri-error-warning-line text-lg"></i>
                <span className="font-medium">{error}</span>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Rating Categories */}
            <div>
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-teal-500 text-white shadow-lg">
                  <i className="ri-star-fill text-lg"></i>
                </div>
                <h3 className="text-xl font-bold text-gray-900">
                  {t("reviewModal.ratings.title")}
                </h3>
              </div>

              {renderStars(
                "overall",
                t("reviewModal.ratings.overall.label"),
                t("reviewModal.ratings.overall.description"),
              )}
              {renderStars(
                "communication",
                t("reviewModal.ratings.communication.label"),
                t("reviewModal.ratings.communication.description"),
              )}
              {renderStars(
                "quality",
                t("reviewModal.ratings.quality.label"),
                t("reviewModal.ratings.quality.description"),
              )}
              {renderStars(
                "timeliness",
                t("reviewModal.ratings.timeliness.label"),
                t("reviewModal.ratings.timeliness.description"),
              )}
            </div>

            {/* Review Text */}
            <div>
              <label
                htmlFor="review-text"
                className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-900"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500 to-teal-500 text-white shadow-lg">
                  <i className="ri-message-3-line text-sm"></i>
                </div>
                {t("reviewModal.comment.label")}
              </label>
              <textarea
                id="review-text"
                name="reviewText"
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                placeholder={t("reviewModal.comment.placeholder")}
                rows={5}
                className="w-full resize-none rounded-xl border border-gray-300 bg-gradient-to-br from-gray-50 to-white px-4 py-3 text-sm text-gray-900 shadow-sm transition-all focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                maxLength={500}
              />
              <p className="mt-2 text-xs text-gray-500">
                {t("reviewModal.comment.charactersCount", { count: reviewText.length, max: 500 })}
              </p>
            </div>

            {/* Buttons */}
            <div className="flex shrink-0 flex-col gap-3 border-t border-gray-200 bg-white p-4 sm:flex-row sm:gap-4 sm:p-6">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="group flex min-h-[44px] flex-1 cursor-pointer touch-manipulation items-center justify-center gap-2 rounded-xl border-2 border-gray-300 bg-white px-4 py-3 font-semibold text-gray-700 transition-all hover:-translate-y-0.5 hover:border-gray-400 hover:bg-gray-50 hover:shadow-md active:translate-y-0 active:bg-gray-100 disabled:opacity-50 disabled:hover:translate-y-0 disabled:active:translate-y-0 sm:px-6"
              >
                <i className="ri-close-line text-base sm:text-lg"></i>
                <span className="text-sm sm:text-base">{t("reviewModal.buttons.cancel")}</span>
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="group flex min-h-[44px] flex-1 cursor-pointer touch-manipulation items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 px-4 py-3 font-semibold text-white shadow-lg shadow-cyan-500/30 transition-all hover:-translate-y-0.5 hover:scale-[1.02] hover:shadow-xl hover:shadow-cyan-500/40 active:translate-y-0 active:scale-100 disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:scale-100 disabled:active:translate-y-0 disabled:active:scale-100 sm:px-6"
              >
                {submitting ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-white"></div>
                    <span className="text-sm sm:text-base">
                      {t("reviewModal.buttons.submitting")}
                    </span>
                  </>
                ) : (
                  <>
                    <i className="ri-star-fill text-base transition-transform group-hover:scale-125 sm:text-lg"></i>
                    <span className="text-sm sm:text-base">{t("reviewModal.buttons.submit")}</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Info */}
          <div className="mt-6 rounded-2xl border border-cyan-200 bg-gradient-to-br from-cyan-50 to-teal-50 p-6 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-teal-500 text-white shadow-lg">
                <i className="ri-information-line text-lg"></i>
              </div>
              <div className="flex-1 text-sm text-cyan-900">
                <p className="mb-2 font-semibold">{t("reviewModal.info.title")}</p>
                <ul className="space-y-1 text-xs text-cyan-800">
                  {(t("reviewModal.info.items", { returnObjects: true }) as string[]).map(
                    (item, index) => (
                      <li key={index}>• {item}</li>
                    ),
                  )}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
