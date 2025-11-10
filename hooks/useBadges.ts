"use client"

import { supabaseBrowser } from "@/utils/supabase/client"
import { useNotifications } from "./useNotifications"
import { useState, useCallback } from "react"
import i18n from "@/libs/i18n"

const supabase = supabaseBrowser()

export interface Badge {
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

interface UserStats {
  projectsCompleted: number
  averageRating: number
  totalRevenue: number
  experiencePoints: number
  daysActive: number
}

export const useBadges = () => {
  const [checkingBadges, setCheckingBadges] = useState(false)
  const { createNotification } = useNotifications()

  // Get badge definitions
  const getBadgeDefinitions = useCallback((userType: "freelancer" | "client"): Badge[] => {
    const t = (key: string) => i18n.t(key)
    const commonBadges: Badge[] = [
      {
        id: "welcome",
        name: t("dashboard.badges.common.welcome.name"),
        description: t("dashboard.badges.common.welcome.description"),
        icon: "ri-hand-heart-line",
        color: "bg-primary/10 text-primary",
        requirement: 0,
        type: "special",
        unlocked: false,
      },
      {
        id: "first_week",
        name: t("dashboard.badges.common.firstWeek.name"),
        description: t("dashboard.badges.common.firstWeek.description"),
        icon: "ri-calendar-check-line",
        color: "bg-green-100 text-green-600",
        requirement: 7,
        type: "experience",
        unlocked: false,
      },
      {
        id: "month_veteran",
        name: t("dashboard.badges.common.monthVeteran.name"),
        description: t("dashboard.badges.common.monthVeteran.description"),
        icon: "ri-trophy-line",
        color: "bg-purple-100 text-purple-600",
        requirement: 30,
        type: "experience",
        unlocked: false,
      },
    ]

    if (userType === "freelancer") {
      const freelancerBadges: Badge[] = [
        {
          id: "first_project",
          name: t("dashboard.badges.freelancer.firstProject.name"),
          description: t("dashboard.badges.freelancer.firstProject.description"),
          icon: "ri-rocket-line",
          color: "bg-emerald-100 text-primary",
          requirement: 1,
          type: "projects",
          unlocked: false,
        },
        {
          id: "project_master",
          name: t("dashboard.badges.freelancer.projectMaster.name"),
          description: t("dashboard.badges.freelancer.projectMaster.description"),
          icon: "ri-star-line",
          color: "bg-yellow-100 text-yellow-600",
          requirement: 5,
          type: "projects",
          unlocked: false,
        },
        {
          id: "project_legend",
          name: t("dashboard.badges.freelancer.projectLegend.name"),
          description: t("dashboard.badges.freelancer.projectLegend.description"),
          icon: "ri-trophy-line",
          color: "bg-orange-100 text-orange-600",
          requirement: 20,
          type: "projects",
          unlocked: false,
        },
        {
          id: "five_stars",
          name: t("dashboard.badges.freelancer.fiveStars.name"),
          description: t("dashboard.badges.freelancer.fiveStars.description"),
          icon: "ri-star-fill",
          color: "bg-yellow-100 text-yellow-600",
          requirement: 4.5,
          type: "reviews",
          unlocked: false,
        },
        {
          id: "top_earner",
          name: t("dashboard.badges.freelancer.topEarner.name"),
          description: t("dashboard.badges.freelancer.topEarner.description"),
          icon: "ri-money-dollar-circle-line",
          color: "bg-green-100 text-green-600",
          requirement: 5000,
          type: "revenue",
          unlocked: false,
        },
        {
          id: "high_roller",
          name: t("dashboard.badges.freelancer.highRoller.name"),
          description: t("dashboard.badges.freelancer.highRoller.description"),
          icon: "ri-gem-line",
          color: "bg-indigo-100 text-indigo-600",
          requirement: 20000,
          type: "revenue",
          unlocked: false,
        },
      ]
      return [...commonBadges, ...freelancerBadges]
    } else {
      const clientBadges: Badge[] = [
        {
          id: "first_hire",
          name: t("dashboard.badges.client.firstHire.name"),
          description: t("dashboard.badges.client.firstHire.description"),
          icon: "ri-handshake-line",
          color: "bg-blue-100 text-primary",
          requirement: 1,
          type: "projects",
          unlocked: false,
        },
        {
          id: "project_sponsor",
          name: t("dashboard.badges.client.projectSponsor.name"),
          description: t("dashboard.badges.client.projectSponsor.description"),
          icon: "ri-briefcase-line",
          color: "bg-purple-100 text-purple-600",
          requirement: 5,
          type: "projects",
          unlocked: false,
        },
        {
          id: "enterprise_client",
          name: t("dashboard.badges.client.enterpriseClient.name"),
          description: t("dashboard.badges.client.enterpriseClient.description"),
          icon: "ri-building-line",
          color: "bg-gray-100 text-gray-600",
          requirement: 20,
          type: "projects",
          unlocked: false,
        },
      ]
      return [...commonBadges, ...clientBadges]
    }
  }, [])

  // Load user stats
  const loadUserStats = useCallback(
    async (userId: string, userType: "freelancer" | "client"): Promise<UserStats> => {
      try {
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", userId)
          .single()

        if (!profile) {
          return {
            projectsCompleted: 0,
            averageRating: 0,
            totalRevenue: 0,
            experiencePoints: 0,
            daysActive: 0,
          }
        }

        // Calculate completed projects
        const { count: projectsCount } = await supabase
          .from("projects")
          .select("*", { count: "exact", head: true })
          .eq(userType === "freelancer" ? "freelancer_id" : "client_id", userId)
          .eq("status", "completed")

        // Calculate average rating
        const { data: reviews, error: reviewsError } = await supabase
          .from("reviews")
          .select("overall_rating")
          .eq("reviewee_id", userId)
          .eq("reviewee_type", userType)

        // Handle errors gracefully (e.g., if reviews table doesn't exist or has different structure)
        if (reviewsError) {
          console.warn("Error loading reviews for badge calculation:", reviewsError)
        }

        const averageRating =
          reviews && reviews.length > 0
            ? reviews.reduce(
                (sum: number, review: { overall_rating: number }) =>
                  sum + (review.overall_rating || 0),
                0,
              ) / reviews.length
            : 0

        // Calculate total revenue (for freelancers)
        let totalRevenue = 0
        if (userType === "freelancer") {
          const { data: transactions } = await supabase
            .from("transactions")
            .select("amount")
            .eq("freelancer_id", userId)
            .eq("status", "completed")

          totalRevenue = transactions
            ? transactions.reduce(
                (sum: number, transaction: { amount: number }) => sum + transaction.amount,
                0,
              )
            : 0
        }

        // Calculate days active
        const createdAt = new Date(profile.created_at)
        const now = new Date()
        const daysActive = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24))

        // Calculate XP
        const experiencePoints = calculateExperiencePoints({
          projectsCompleted: projectsCount || 0,
          averageRating,
          totalRevenue,
          daysActive,
        })

        return {
          projectsCompleted: projectsCount || 0,
          averageRating,
          totalRevenue,
          experiencePoints,
          daysActive,
        }
      } catch (error) {
        console.error("Error loading user stats:", error)
        return {
          projectsCompleted: 0,
          averageRating: 0,
          totalRevenue: 0,
          experiencePoints: 0,
          daysActive: 0,
        }
      }
    },
    [],
  )

  // Calculate experience points
  const calculateExperiencePoints = (stats: {
    projectsCompleted: number
    averageRating: number
    totalRevenue: number
    daysActive: number
  }) => {
    let xp = 0
    xp += stats.projectsCompleted * 100
    if (stats.averageRating >= 4.5) xp += 500
    else if (stats.averageRating >= 4.0) xp += 300
    else if (stats.averageRating >= 3.5) xp += 100
    xp += Math.floor(stats.totalRevenue / 100) * 10
    xp += stats.daysActive * 5
    return xp
  }

  // Get unlocked badges from database
  const getUnlockedBadgesFromDB = useCallback(async (userId: string): Promise<string[]> => {
    try {
      const { data, error } = await supabase
        .from("user_badges")
        .select("badge_id")
        .eq("user_id", userId)

      if (error) {
        // If table doesn't exist, return empty array (graceful degradation)
        if (error.code === "42P01" || error.message?.includes("does not exist")) {
          console.warn("user_badges table does not exist yet. Please run the migration.")
          return []
        }
        console.error("Error loading unlocked badges:", error)
        return []
      }

      return data?.map((row: { badge_id: string }) => row.badge_id) || []
    } catch (error: any) {
      // Handle table not found errors gracefully
      if (error?.code === "42P01" || error?.message?.includes("does not exist")) {
        console.warn("user_badges table does not exist yet. Please run the migration.")
        return []
      }
      console.error("Error loading unlocked badges:", error)
      return []
    }
  }, [])

  // Unlock a badge in the database
  const unlockBadge = useCallback(async (userId: string, badgeId: string): Promise<boolean> => {
    try {
      // Check if badge is already unlocked
      const { data: existing, error: checkError } = await supabase
        .from("user_badges")
        .select("id")
        .eq("user_id", userId)
        .eq("badge_id", badgeId)
        .maybeSingle()

      // Handle table not found
      if (
        checkError &&
        (checkError.code === "42P01" || checkError.message?.includes("does not exist"))
      ) {
        console.warn(
          "user_badges table does not exist yet. Badge unlock will not be persisted. Please run the migration.",
        )
        return true // Return true so notification is still sent, but badge won't be persisted
      }

      // If badge already exists, don't unlock again
      if (existing) {
        return false // Already unlocked
      }

      // Insert new badge unlock
      const { error } = await supabase.from("user_badges").insert({
        user_id: userId,
        badge_id: badgeId,
        unlocked_at: new Date().toISOString(),
      })

      if (error) {
        // Handle table not found
        if (error.code === "42P01" || error.message?.includes("does not exist")) {
          console.warn(
            "user_badges table does not exist yet. Badge unlock will not be persisted. Please run the migration.",
          )
          return true // Return true so notification is still sent
        }
        console.error("Error unlocking badge:", error)
        return false
      }

      return true
    } catch (error: any) {
      // Handle table not found errors gracefully
      if (error?.code === "42P01" || error?.message?.includes("does not exist")) {
        console.warn(
          "user_badges table does not exist yet. Badge unlock will not be persisted. Please run the migration.",
        )
        return true // Return true so notification is still sent
      }
      console.error("Error unlocking badge:", error)
      return false
    }
  }, [])

  // Check and unlock badges based on current stats
  const checkAndUnlockBadges = useCallback(
    async (userId: string, userType: "freelancer" | "client"): Promise<Badge[]> => {
      if (checkingBadges) return []
      setCheckingBadges(true)

      try {
        // Load current stats
        const stats = await loadUserStats(userId, userType)

        // Get badge definitions
        const badgeDefinitions = getBadgeDefinitions(userType)

        // Get already unlocked badges
        const unlockedBadgeIds = await getUnlockedBadgesFromDB(userId)

        // Check each badge
        const newlyUnlocked: Badge[] = []

        for (const badge of badgeDefinitions) {
          // Skip if already unlocked
          if (unlockedBadgeIds.includes(badge.id)) {
            continue
          }

          let shouldUnlock = false

          switch (badge.type) {
            case "special":
              shouldUnlock = true // Special badges are always unlocked
              break
            case "projects":
              shouldUnlock = stats.projectsCompleted >= badge.requirement
              break
            case "reviews":
              shouldUnlock = stats.averageRating >= badge.requirement
              break
            case "revenue":
              shouldUnlock = stats.totalRevenue >= badge.requirement
              break
            case "experience":
              shouldUnlock = stats.daysActive >= badge.requirement
              break
          }

          if (shouldUnlock) {
            // Unlock badge in database
            const unlocked = await unlockBadge(userId, badge.id)
            if (unlocked) {
              newlyUnlocked.push({
                ...badge,
                unlocked: true,
                unlockedAt: new Date().toISOString(),
              })

              // Send notification
              const t = (key: string, options?: any) => i18n.t(key, options)
              await createNotification({
                title: t("dashboard.badges.notification.title"),
                message: t("dashboard.badges.notification.message", {
                  name: badge.name,
                  description: badge.description,
                }),
                type: "badge",
                priority: "high",
                action_url: "/dashboard?tab=achievements",
                metadata: {
                  badge_id: badge.id,
                  badge_name: badge.name,
                },
              })
            }
          }
        }

        return newlyUnlocked
      } catch (error) {
        console.error("Error checking badges:", error)
        return []
      } finally {
        setCheckingBadges(false)
      }
    },
    [
      checkingBadges,
      loadUserStats,
      getBadgeDefinitions,
      getUnlockedBadgesFromDB,
      unlockBadge,
      createNotification,
    ],
  )

  // Get all badges with their unlock status
  const getBadgesWithStatus = useCallback(
    async (userId: string, userType: "freelancer" | "client"): Promise<Badge[]> => {
      try {
        const stats = await loadUserStats(userId, userType)
        const badgeDefinitions = getBadgeDefinitions(userType)
        const unlockedBadgeIds = await getUnlockedBadgesFromDB(userId)

        return badgeDefinitions.map((badge) => {
          const isUnlocked = unlockedBadgeIds.includes(badge.id)

          // Also check if it should be unlocked based on current stats
          let shouldBeUnlocked = isUnlocked

          if (!isUnlocked) {
            switch (badge.type) {
              case "special":
                shouldBeUnlocked = true
                break
              case "projects":
                shouldBeUnlocked = stats.projectsCompleted >= badge.requirement
                break
              case "reviews":
                shouldBeUnlocked = stats.averageRating >= badge.requirement
                break
              case "revenue":
                shouldBeUnlocked = stats.totalRevenue >= badge.requirement
                break
              case "experience":
                shouldBeUnlocked = stats.daysActive >= badge.requirement
                break
            }
          }

          return {
            ...badge,
            unlocked: shouldBeUnlocked,
            unlockedAt: isUnlocked
              ? undefined
              : shouldBeUnlocked
                ? new Date().toISOString()
                : undefined,
          }
        })
      } catch (error) {
        console.error("Error getting badges with status:", error)
        return []
      }
    },
    [loadUserStats, getBadgeDefinitions, getUnlockedBadgesFromDB],
  )

  return {
    checkingBadges,
    checkAndUnlockBadges,
    getBadgesWithStatus,
    loadUserStats,
    getBadgeDefinitions,
  }
}
