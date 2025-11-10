"use client"

import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { useBadges, type Badge } from "@/hooks/useBadges"

interface BadgeSystemProps {
  userId: string
  userType: "freelancer" | "client"
  compact?: boolean
}

export default function BadgeSystem({ userId, userType, compact = false }: BadgeSystemProps) {
  const { t } = useTranslation()
  const [badges, setBadges] = useState<Badge[]>([])
  const [userStats, setUserStats] = useState({
    projectsCompleted: 0,
    averageRating: 0,
    totalRevenue: 0,
    experiencePoints: 0,
    daysActive: 0,
  })
  const [loading, setLoading] = useState(true)
  const [showAchievement, setShowAchievement] = useState<Badge | null>(null)
  const [newlyUnlockedBadges, setNewlyUnlockedBadges] = useState<Badge[]>([])

  const { getBadgesWithStatus, loadUserStats, checkAndUnlockBadges } = useBadges()

  useEffect(() => {
    loadBadgesAndStats()
  }, [userId])

  const loadBadgesAndStats = async () => {
    try {
      // Load user stats
      const stats = await loadUserStats(userId, userType)
      setUserStats(stats)

      // Check for newly unlocked badges
      const newlyUnlocked = await checkAndUnlockBadges(userId, userType)
      if (newlyUnlocked.length > 0) {
        setNewlyUnlockedBadges(newlyUnlocked)
        // Show the first newly unlocked badge
        if (newlyUnlocked[0]) {
          setShowAchievement(newlyUnlocked[0])
        }
      }

      // Get all badges with their status
      const badgesWithStatus = await getBadgesWithStatus(userId, userType)
      setBadges(badgesWithStatus)
    } catch (error) {
      console.error(t("dashboard.badges.error"), error)
    } finally {
      setLoading(false)
    }
  }

  const getUnlockedBadges = () => badges.filter((badge) => badge.unlocked)
  const getLockedBadges = () => badges.filter((badge) => !badge.unlocked)

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="border-primary h-6 w-6 animate-spin rounded-full border-b-2"></div>
      </div>
    )
  }

  if (compact) {
    const unlockedBadges = getUnlockedBadges()
    return (
      <div className="flex items-center space-x-2">
        <div className="flex -space-x-1">
          {unlockedBadges.slice(0, 3).map((badge) => (
            <div
              key={badge.id}
              className={`h-8 w-8 rounded-full ${badge.color} flex items-center justify-center border-2 border-white shadow-sm`}
              title={badge.name}
            >
              <i className={`${badge.icon} text-sm`}></i>
            </div>
          ))}
        </div>
        {unlockedBadges.length > 3 && (
          <span className="text-xs text-gray-500">
            +{unlockedBadges.length - 3} {t("dashboard.badges.more")}
          </span>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{t("dashboard.badges.title")}</h3>
          <p className="text-sm text-gray-600">
            {t("dashboard.badges.subtitle")
              .replace("{unlocked}", getUnlockedBadges().length.toString())
              .replace("{total}", badges.length.toString())}
          </p>
        </div>
        <div className="text-right">
          <div className="text-primary text-2xl font-bold">{userStats.experiencePoints}</div>
          <div className="text-xs text-gray-500">{t("dashboard.badges.totalXP")}</div>
        </div>
      </div>

      {/* Badges Desbloqueados */}
      {getUnlockedBadges().length > 0 && (
        <div>
          <h4 className="text-md mb-3 flex items-center font-medium text-gray-900">
            <i className="ri-trophy-line mr-2 text-yellow-500"></i>
            {t("dashboard.badges.unlockedBadges")} ({getUnlockedBadges().length})
          </h4>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {getUnlockedBadges().map((badge) => (
              <div
                key={badge.id}
                className="cursor-pointer rounded-lg border-2 border-green-200 bg-white p-3 text-center transition-shadow hover:shadow-md"
                onClick={() => setShowAchievement(badge)}
              >
                <div
                  className={`h-12 w-12 ${badge.color} mx-auto mb-2 flex items-center justify-center rounded-full`}
                >
                  <i className={`${badge.icon} text-xl`}></i>
                </div>
                <h5 className="mb-1 text-sm font-medium text-gray-900">{badge.name}</h5>
                <p className="text-xs leading-tight text-gray-600">{badge.description}</p>
                <div className="mt-2 text-xs font-medium text-green-600">
                  ✅ {t("dashboard.badges.unlocked")}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Badges Bloqueados */}
      {getLockedBadges().length > 0 && (
        <div>
          <h4 className="text-md mb-3 flex items-center font-medium text-gray-900">
            <i className="ri-lock-line mr-2 text-gray-400"></i>
            {t("dashboard.badges.lockedBadges")} ({getLockedBadges().length})
          </h4>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {getLockedBadges().map((badge) => (
              <div
                key={badge.id}
                className="rounded-lg border-2 border-gray-200 bg-gray-50 p-3 text-center opacity-75"
              >
                <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-gray-200 text-gray-400">
                  <i className={`${badge.icon} text-xl`}></i>
                </div>
                <h5 className="mb-1 text-sm font-medium text-gray-600">{badge.name}</h5>
                <p className="text-xs leading-tight text-gray-500">{badge.description}</p>
                <div className="mt-2 text-xs text-gray-400">🔒 {getProgressText(badge)}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal de Logro */}
      {showAchievement && (
        <div className="animate-fade-in fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="animate-scale-in w-full max-w-md rounded-xl bg-white p-6 text-center">
            <div className="mb-4">
              <div className="relative">
                <div
                  className={`h-20 w-20 ${showAchievement.color} mx-auto mb-4 flex animate-bounce items-center justify-center rounded-full`}
                >
                  <i className={`${showAchievement.icon} text-3xl`}></i>
                </div>
                <div className="absolute -top-2 -right-2 flex h-8 w-8 animate-pulse items-center justify-center rounded-full bg-yellow-400">
                  <i className="ri-star-fill text-sm text-white"></i>
                </div>
              </div>
              <h3 className="mb-2 text-2xl font-bold text-gray-900">
                {t("dashboard.badges.badgeUnlocked")}
              </h3>
              <h4 className="text-primary mb-2 text-xl font-semibold">{showAchievement.name}</h4>
              <p className="mb-4 text-gray-600">{showAchievement.description}</p>
              <div className="inline-block rounded-lg bg-green-50 px-4 py-2 text-green-800">
                {t("dashboard.badges.congratulations")}
              </div>
            </div>
            <button
              onClick={() => {
                setShowAchievement(null)
                // If there are more newly unlocked badges, show the next one
                if (newlyUnlockedBadges.length > 1) {
                  const remaining = newlyUnlockedBadges.slice(1)
                  setNewlyUnlockedBadges(remaining)
                  setShowAchievement(remaining[0])
                } else {
                  setNewlyUnlockedBadges([])
                }
              }}
              className="bg-primary cursor-pointer rounded-lg px-6 py-2 whitespace-nowrap text-white transition-colors hover:bg-cyan-700"
            >
              {t("dashboard.badges.great")}
            </button>
          </div>
        </div>
      )}
    </div>
  )

  function getProgressText(badge: Badge): string {
    switch (badge.type) {
      case "projects":
        return t("dashboard.badges.progress.projects")
          .replace("{current}", userStats.projectsCompleted.toString())
          .replace("{required}", badge.requirement.toString())
      case "reviews":
        return t("dashboard.badges.progress.reviews")
          .replace("{current}", userStats.averageRating.toFixed(1))
          .replace("{required}", badge.requirement.toString())
      case "revenue":
        return t("dashboard.badges.progress.revenue")
          .replace("{current}", userStats.totalRevenue.toString())
          .replace("{required}", badge.requirement.toString())
      case "experience":
        return t("dashboard.badges.progress.experience")
          .replace("{current}", userStats.daysActive.toString())
          .replace("{required}", badge.requirement.toString())
      default:
        return t("dashboard.badges.progress.comingSoon")
    }
  }
}
