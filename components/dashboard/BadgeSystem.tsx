"use client"

import { useState, useEffect } from "react"
import { useBadges, type Badge } from "@/hooks/useBadges"

interface BadgeSystemProps {
  userId: string
  userType: "freelancer" | "client"
  compact?: boolean
}

export default function BadgeSystem({
  userId,
  userType,
  compact = false,
}: BadgeSystemProps) {
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
      console.error("Error cargando badges:", error)
    } finally {
      setLoading(false)
    }
  }

  const getUnlockedBadges = () => badges.filter((badge) => badge.unlocked)
  const getLockedBadges = () => badges.filter((badge) => !badge.unlocked)

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
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
              className={`w-8 h-8 rounded-full ${badge.color} flex items-center justify-center border-2 border-white shadow-sm`}
              title={badge.name}
            >
              <i className={`${badge.icon} text-sm`}></i>
            </div>
          ))}
        </div>
        {unlockedBadges.length > 3 && (
          <span className="text-xs text-gray-500">
            +{unlockedBadges.length - 3} más
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
          <h3 className="text-lg font-semibold text-gray-900">
            🏆 Logros y Badges
          </h3>
          <p className="text-sm text-gray-600">
            {getUnlockedBadges().length} de {badges.length} badges desbloqueados
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-primary">
            {userStats.experiencePoints}
          </div>
          <div className="text-xs text-gray-500">XP Total</div>
        </div>
      </div>

      {/* Badges Desbloqueados */}
      {getUnlockedBadges().length > 0 && (
        <div>
          <h4 className="text-md font-medium text-gray-900 mb-3 flex items-center">
            <i className="ri-trophy-line text-yellow-500 mr-2"></i>
            Badges Desbloqueados ({getUnlockedBadges().length})
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {getUnlockedBadges().map((badge) => (
              <div
                key={badge.id}
                className="bg-white border-2 border-green-200 rounded-lg p-3 text-center hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => setShowAchievement(badge)}
              >
                <div
                  className={`w-12 h-12 ${badge.color} rounded-full flex items-center justify-center mx-auto mb-2`}
                >
                  <i className={`${badge.icon} text-xl`}></i>
                </div>
                <h5 className="font-medium text-sm text-gray-900 mb-1">
                  {badge.name}
                </h5>
                <p className="text-xs text-gray-600 leading-tight">
                  {badge.description}
                </p>
                <div className="mt-2 text-xs text-green-600 font-medium">
                  ✅ Desbloqueado
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Badges Bloqueados */}
      {getLockedBadges().length > 0 && (
        <div>
          <h4 className="text-md font-medium text-gray-900 mb-3 flex items-center">
            <i className="ri-lock-line text-gray-400 mr-2"></i>
            Próximos Logros ({getLockedBadges().length})
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {getLockedBadges().map((badge) => (
              <div
                key={badge.id}
                className="bg-gray-50 border-2 border-gray-200 rounded-lg p-3 text-center opacity-75"
              >
                <div className="w-12 h-12 bg-gray-200 text-gray-400 rounded-full flex items-center justify-center mx-auto mb-2">
                  <i className={`${badge.icon} text-xl`}></i>
                </div>
                <h5 className="font-medium text-sm text-gray-600 mb-1">
                  {badge.name}
                </h5>
                <p className="text-xs text-gray-500 leading-tight">
                  {badge.description}
                </p>
                <div className="mt-2 text-xs text-gray-400">
                  🔒 {getProgressText(badge)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal de Logro */}
      {showAchievement && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-xl p-6 max-w-md w-full text-center animate-scale-in">
            <div className="mb-4">
              <div className="relative">
                <div
                  className={`w-20 h-20 ${showAchievement.color} rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce`}
                >
                  <i className={`${showAchievement.icon} text-3xl`}></i>
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center animate-pulse">
                  <i className="ri-star-fill text-white text-sm"></i>
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                ¡Badge Desbloqueado! 🎉
              </h3>
              <h4 className="text-xl font-semibold text-primary mb-2">
                {showAchievement.name}
              </h4>
              <p className="text-gray-600 mb-4">
                {showAchievement.description}
              </p>
              <div className="bg-green-50 text-green-800 px-4 py-2 rounded-lg inline-block">
                ✅ ¡Felicidades!
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
              className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-cyan-700 transition-colors cursor-pointer whitespace-nowrap"
            >
              ¡Genial!
            </button>
          </div>
        </div>
      )}
    </div>
  )

  function getProgressText(badge: Badge): string {
    switch (badge.type) {
      case "projects":
        return `${userStats.projectsCompleted}/${badge.requirement} proyectos`
      case "reviews":
        return `${userStats.averageRating.toFixed(1)}/${badge.requirement} rating`
      case "revenue":
        return `$${userStats.totalRevenue}/$${badge.requirement}`
      case "experience":
        return `${userStats.daysActive}/${badge.requirement} días`
      default:
        return "Próximamente"
    }
  }
}
