"use client"

import { supabase } from "@/db/supabase"
import { useState, useEffect } from "react"

interface Badge {
  id: string
  name: string
  description: string
  icon: string
  color: string
  requirement: number
  type: "projects" | "reviews" | "revenue" | "experience" | "special"
  unlocked: boolean
  unlockedAt?: string
}

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

  useEffect(() => {
    loadBadgesAndStats()
  }, [userId])

  const loadBadgesAndStats = async () => {
    try {
      // Cargar estadísticas del usuario
      await loadUserStats()

      // Definir badges disponibles
      const availableBadges = getBadgeDefinitions()

      // Verificar qué badges ha desbloqueado
      const badgesWithStatus = await checkUnlockedBadges(availableBadges)

      setBadges(badgesWithStatus)
    } catch (error) {
      console.error("Error cargando badges:", error)
    } finally {
      setLoading(false)
    }
  }

  const loadUserStats = async () => {
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single()

      if (profile) {
        // Calcular proyectos completados
        const { count: projectsCount } = await supabase
          .from("projects")
          .select("*", { count: "exact" })
          .eq(userType === "freelancer" ? "freelancer_id" : "client_id", userId)
          .eq("status", "completed")

        // Calcular rating promedio
        const { data: reviews } = await supabase
          .from("reviews")
          .select("rating")
          .eq("reviewed_user_id", userId)

        const averageRating =
          reviews && reviews.length > 0
            ? reviews.reduce((sum, review) => sum + review.rating, 0) /
              reviews.length
            : 0

        // Calcular ingresos totales (para freelancers)
        let totalRevenue = 0
        if (userType === "freelancer") {
          const { data: transactions } = await supabase
            .from("transactions")
            .select("amount")
            .eq("freelancer_id", userId)
            .eq("status", "completed")

          totalRevenue = transactions
            ? transactions.reduce(
                (sum, transaction) => sum + transaction.amount,
                0
              )
            : 0
        }

        // Calcular días activos
        const createdAt = new Date(profile.created_at)
        const now = new Date()
        const daysActive = Math.floor(
          (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24)
        )

        // Calcular XP basado en actividad
        const experiencePoints = calculateExperiencePoints({
          projectsCompleted: projectsCount || 0,
          averageRating,
          totalRevenue,
          daysActive,
        })

        setUserStats({
          projectsCompleted: projectsCount || 0,
          averageRating,
          totalRevenue,
          experiencePoints,
          daysActive,
        })
      }
    } catch (error) {
      console.error("Error cargando estadísticas:", error)
    }
  }

  const calculateExperiencePoints = (stats: any) => {
    let xp = 0

    // XP por proyectos completados
    xp += stats.projectsCompleted * 100

    // XP por rating alto
    if (stats.averageRating >= 4.5) xp += 500
    else if (stats.averageRating >= 4.0) xp += 300
    else if (stats.averageRating >= 3.5) xp += 100

    // XP por ingresos (freelancers)
    xp += Math.floor(stats.totalRevenue / 100) * 10

    // XP por días activos
    xp += stats.daysActive * 5

    return xp
  }

  const getBadgeDefinitions = (): Badge[] => {
    const commonBadges = [
      {
        id: "welcome",
        name: "🎉 Bienvenido",
        description: "Te uniste a la plataforma",
        icon: "ri-hand-heart-line",
        color: "bg-primary/10 text-primary",
        requirement: 0,
        type: "special" as const,
        unlocked: false,
      },
      {
        id: "first_week",
        name: "📅 Primera Semana",
        description: "Una semana activo en la plataforma",
        icon: "ri-calendar-check-line",
        color: "bg-green-100 text-green-600",
        requirement: 7,
        type: "experience" as const,
        unlocked: false,
      },
      {
        id: "month_veteran",
        name: "🗓️ Veterano Mensual",
        description: "Un mes activo en la plataforma",
        icon: "ri-trophy-line",
        color: "bg-purple-100 text-purple-600",
        requirement: 30,
        type: "experience" as const,
        unlocked: false,
      },
    ]

    const freelancerBadges = [
      {
        id: "first_project",
        name: "🚀 Primer Proyecto",
        description: "Completaste tu primer proyecto",
        icon: "ri-rocket-line",
        color: "bg-emerald-100 text-primary",
        requirement: 1,
        type: "projects" as const,
        unlocked: false,
      },
      {
        id: "project_master",
        name: "⭐ Maestro de Proyectos",
        description: "Completaste 5 proyectos",
        icon: "ri-star-line",
        color: "bg-yellow-100 text-yellow-600",
        requirement: 5,
        type: "projects" as const,
        unlocked: false,
      },
      {
        id: "project_legend",
        name: "🏆 Leyenda de Proyectos",
        description: "Completaste 20 proyectos",
        icon: "ri-trophy-line",
        color: "bg-orange-100 text-orange-600",
        requirement: 20,
        type: "projects" as const,
        unlocked: false,
      },
      {
        id: "five_stars",
        name: "⭐ 5 Estrellas",
        description: "Rating promedio de 4.5 o más",
        icon: "ri-star-fill",
        color: "bg-yellow-100 text-yellow-600",
        requirement: 4.5,
        type: "reviews" as const,
        unlocked: false,
      },
      {
        id: "top_earner",
        name: "💰 Top Earner",
        description: "Ganaste más de $5,000",
        icon: "ri-money-dollar-circle-line",
        color: "bg-green-100 text-green-600",
        requirement: 5000,
        type: "revenue" as const,
        unlocked: false,
      },
      {
        id: "high_roller",
        name: "💎 High Roller",
        description: "Ganaste más de $20,000",
        icon: "ri-gem-line",
        color: "bg-indigo-100 text-indigo-600",
        requirement: 20000,
        type: "revenue" as const,
        unlocked: false,
      },
    ]

    const clientBadges = [
      {
        id: "first_hire",
        name: "🤝 Primera Contratación",
        description: "Contrataste tu primer freelancer",
        icon: "ri-handshake-line",
        color: "bg-blue-100 text-primary",
        requirement: 1,
        type: "projects" as const,
        unlocked: false,
      },
      {
        id: "project_sponsor",
        name: "💼 Patrocinador de Proyectos",
        description: "Creaste 5 proyectos",
        icon: "ri-briefcase-line",
        color: "bg-purple-100 text-purple-600",
        requirement: 5,
        type: "projects" as const,
        unlocked: false,
      },
      {
        id: "enterprise_client",
        name: "🏢 Cliente Empresarial",
        description: "Creaste más de 20 proyectos",
        icon: "ri-building-line",
        color: "bg-gray-100 text-gray-600",
        requirement: 20,
        type: "projects" as const,
        unlocked: false,
      },
    ]

    return userType === "freelancer"
      ? [...commonBadges, ...freelancerBadges]
      : [...commonBadges, ...clientBadges]
  }

  const checkUnlockedBadges = async (badgeList: Badge[]) => {
    return badgeList.map((badge) => {
      let unlocked = false

      switch (badge.type) {
        case "special":
          unlocked = true // Badges especiales siempre desbloqueados
          break
        case "projects":
          unlocked = userStats.projectsCompleted >= badge.requirement
          break
        case "reviews":
          unlocked = userStats.averageRating >= badge.requirement
          break
        case "revenue":
          unlocked = userStats.totalRevenue >= badge.requirement
          break
        case "experience":
          unlocked = userStats.daysActive >= badge.requirement
          break
      }

      return {
        ...badge,
        unlocked,
        unlockedAt: unlocked ? new Date().toISOString() : undefined,
      }
    })
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full text-center">
            <div className="mb-4">
              <div
                className={`w-20 h-20 ${showAchievement.color} rounded-full flex items-center justify-center mx-auto mb-4`}
              >
                <i className={`${showAchievement.icon} text-3xl`}></i>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {showAchievement.name}
              </h3>
              <p className="text-gray-600 mb-4">
                {showAchievement.description}
              </p>
              <div className="bg-green-50 text-green-800 px-4 py-2 rounded-lg inline-block">
                ✅ Badge Desbloqueado
              </div>
            </div>
            <button
              onClick={() => setShowAchievement(null)}
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
