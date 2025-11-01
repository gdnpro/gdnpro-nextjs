"use client"

import { supabaseBrowser } from "@/utils/supabase/client"
import type { Notification } from "@/interfaces/Notification"
import { useEffect, useState } from "react"

const supabase = supabaseBrowser()

export const useNotifications = () => {
  const [isEnabled, setIsEnabled] = useState(false)

  useEffect(() => {
    // Verificar si el usuario está autenticado
    const checkAuth = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setIsEnabled(!!user)
    }

    checkAuth()
  }, [])

  const createNotification = async (data: Notification) => {
    if (!isEnabled) return null

    try {
      const session = await supabase.auth.getSession()
      if (!session.data.session?.access_token) return null

      const response = await fetch(
        "https://kdmdhhhppizzlhvauofe.supabase.co/functions/v1/notifications-handler",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.data.session.access_token}`,
          },
          body: JSON.stringify({
            action: "create-notification",
            Notification: data,
          }),
        }
      )

      if (response.ok) {
        const result = await response.json()
        return result.success ? result.notification : null
      }
    } catch (error) {
      console.error("Error creating notification:", error)
    }

    return null
  }

  const createSystemNotifications = async (data: {
    projectId?: string
    proposalId?: string
    messageId?: string
    reviewId?: string
    paymentId?: string
    userId?: string
    projectEvent?:
      | "project_completed"
      | "milestone_completed"
      | "deadline_reminder"
    proposalEvent?:
      | "proposal_received"
      | "proposal_accepted"
      | "proposal_rejected"
  }) => {
    if (!isEnabled) return null

    try {
      const session = await supabase.auth.getSession()
      if (!session.data.session?.access_token) return null

      const response = await fetch(
        "https://kdmdhhhppizzlhvauofe.supabase.co/functions/v1/notifications-handler",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.data.session.access_token}`,
          },
          body: JSON.stringify({
            action: "create-system-notifications",
            Notification: data,
          }),
        }
      )

      if (response.ok) {
        const result = await response.json()
        return result.success ? result.notifications : null
      }
    } catch (error) {
      console.error("Error creating system notifications:", error)
    }

    return null
  }

  const notifyNewMessage = (messageId: string) => {
    return createSystemNotifications({ messageId })
  }

  const notifyProposal = (
    proposalId: string,
    event: "proposal_received" | "proposal_accepted" | "proposal_rejected"
  ) => {
    return createSystemNotifications({ proposalId, proposalEvent: event })
  }

  const notifyPayment = (paymentId: string) => {
    return createSystemNotifications({ paymentId })
  }

  const notifyProjectUpdate = (
    projectId: string,
    event: "project_completed" | "milestone_completed" | "deadline_reminder"
  ) => {
    return createSystemNotifications({ projectId, projectEvent: event })
  }

  const notifyReview = (reviewId: string) => {
    return createSystemNotifications({ reviewId })
  }

  const createWelcomeNotification = () => {
    return createNotification({
      title: "¡Bienvenido a GDN Pro! 🎉",
      message:
        "Tu cuenta está lista. Explora proyectos increíbles y conecta con los mejores profesionales.",
      type: "system",
      priority: "normal",
      action_url: "/freelancers",
    })
  }

  const createReminderNotification = (
    title: string,
    message: string,
    actionUrl?: string
  ) => {
    return createNotification({
      title,
      message,
      type: "reminder",
      priority: "high",
      action_url: actionUrl,
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    })
  }

  return {
    isEnabled,
    createNotification,
    createSystemNotifications,
    notifyNewMessage,
    notifyProposal,
    notifyPayment,
    notifyProjectUpdate,
    notifyReview,
    createWelcomeNotification,
    createReminderNotification,
  }
}
