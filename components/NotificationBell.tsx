"use client"

import { useState, useEffect } from "react"
import NotificationCenter from "./NotificationCenter"
import type { Notification } from "@/interfaces/Notification"
import { useSessionStorage } from "@/hooks/useSessionStorage"
import { useTranslation } from "react-i18next"
import { supabaseBrowser } from "@/utils/supabase/client"

const supabase = supabaseBrowser()

export default function NotificationBell() {
  const { t } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [showToast, setShowToast] = useState(false)
  const [toastNotification, setToastNotification] = useState<Notification | null>(null)

  const { setValue } = useSessionStorage("last_tab")

  useEffect(() => {
    checkAuthStatus()

    const authInterval = setInterval(checkAuthStatus, 30000)

    return () => clearInterval(authInterval)
  }, [])

  // Smart polling for notifications (since Realtime replication is not available)
  useEffect(() => {
    if (!isLoggedIn) return

    let pollInterval: NodeJS.Timeout | null = null
    const lastCheckedCountRef = { current: 0 }
    let isPageVisible = !document.hidden

    // Handle page visibility changes
    const handleVisibilityChange = () => {
      const wasVisible = isPageVisible
      isPageVisible = !document.hidden

      if (isPageVisible && !wasVisible) {
        // Page became visible - immediately check and restart polling
        if (pollInterval) {
          clearInterval(pollInterval)
        }
        loadUnreadCount().then((count) => {
          lastCheckedCountRef.current = count
        })
        pollInterval = setInterval(poll, 5000)
      } else if (!isPageVisible && wasVisible) {
        // Page became hidden - use longer interval
        if (pollInterval) {
          clearInterval(pollInterval)
        }
        pollInterval = setInterval(poll, 30000)
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)

    // Poll function
    const poll = async () => {
      if (!isPageVisible) return

      try {
        const session = await supabase.auth.getSession()
        if (!session.data.session?.access_token) return

        const response = await fetch(
          "https://kdmdhhhppizzlhvauofe.supabase.co/functions/v1/notifications-handler",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${session.data.session.access_token}`,
            },
            body: JSON.stringify({
              action: "get-unread-count",
            }),
          },
        )

        if (response.ok) {
          const data = await response.json()
          if (data.success) {
            const newCount = data.count || 0

            // If count increased, we have new notifications
            if (newCount > lastCheckedCountRef.current && lastCheckedCountRef.current > 0) {
              // Load the most recent notification to show in toast
              loadRecentNotifications()
            }

            setUnreadCount(newCount)
            lastCheckedCountRef.current = newCount
          }
        }
      } catch (error) {
        console.error("Error polling notifications:", error)
      }
    }

    // Initial load and start polling
    loadUnreadCount().then((count) => {
      lastCheckedCountRef.current = count
    })

    // Start polling with appropriate interval based on visibility
    pollInterval = setInterval(poll, isPageVisible ? 5000 : 30000)

    return () => {
      if (pollInterval) {
        clearInterval(pollInterval)
      }
      document.removeEventListener("visibilitychange", handleVisibilityChange)
    }
  }, [isLoggedIn])

  const checkAuthStatus = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setIsLoggedIn(!!user)
    } catch (error) {
      console.error("Error checking auth status:", error)
      setIsLoggedIn(false)
    }
  }

  const loadUnreadCount = async (): Promise<number> => {
    try {
      const session = await supabase.auth.getSession()
      if (!session.data.session?.access_token) return 0

      const response = await fetch(
        "https://kdmdhhhppizzlhvauofe.supabase.co/functions/v1/notifications-handler",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.data.session.access_token}`,
          },
          body: JSON.stringify({
            action: "get-unread-count",
          }),
        },
      )

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          const newCount = data.count || 0
          setUnreadCount(newCount)
          return newCount
        }
      }
    } catch (error) {
      console.error("Error loading unread count:", error)
    }
    return 0
  }

  const loadRecentNotifications = async () => {
    try {
      const session = await supabase.auth.getSession()
      if (!session.data.session?.access_token) return

      const response = await fetch(
        "https://kdmdhhhppizzlhvauofe.supabase.co/functions/v1/notifications-handler",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.data.session.access_token}`,
          },
          body: JSON.stringify({
            action: "get-notifications",
            filters: { read: false, limit: 5 },
          }),
        },
      )

      if (response.ok) {
        const data = await response.json()
        if (data.success && data.notifications.length > 0) {
          const latest = data.notifications[0]
          setToastNotification(latest)
          setShowToast(true)

          setTimeout(() => {
            setShowToast(false)
            setToastNotification(null)
          }, 5000)
        }
      }
    } catch (error) {
      console.error("Error loading recent notifications: ", error)
    }
  }

  const handleNotificationClick = (notification: Notification) => {
    setIsOpen(false)

    // Map notification types to dashboard sections
    const typeToSectionMap: Record<string, string> = {
      message: "messages",
      proposal: "proposals",
      payment: "payments",
      project_update: "projects",
      review: "reviews",
      system: "projects",
      reminder: "projects",
      milestone: "projects",
      badge: "achievements",
      achievement: "achievements",
    }

    const section = typeToSectionMap[notification.type] || "projects"
    setValue("last_tab", section)

    if (notification.action_url) {
      window.location.href = notification.action_url
    } else {
      // Default to dashboard if no action_url
      window.location.href = "/dashboard"
    }
  }

  const handleToastClick = () => {
    if (toastNotification) {
      handleNotificationClick(toastNotification)
    }
    setShowToast(false)
  }

  if (!isLoggedIn) {
    return null
  }

  return (
    <>
      {/* Botón de Notificaciones */}
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="relative cursor-pointer rounded-lg p-2 text-gray-600 transition-colors hover:text-gray-900 focus:outline-none"
          aria-label="Notificaciones"
        >
          <i className="ri-notification-line text-xl"></i>

          {/* Badge de conteo */}
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 flex h-5 w-5 animate-pulse items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}

          {/* Indicador de animación para nuevas notificaciones */}
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 h-5 w-5 animate-ping rounded-full bg-red-500 opacity-75"></span>
          )}
        </button>
      </div>

      {/* Toast Notification */}
      {showToast && toastNotification && (
        <div className="animate-slide-in-right fixed top-20 right-4 z-50 max-w-sm rounded-lg border border-gray-200 bg-white shadow-lg">
          <div
            className="cursor-pointer rounded-lg p-4 transition-colors hover:bg-gray-50"
            onClick={handleToastClick}
          >
            <div className="flex items-start">
              <div className="bg-primary/10 mr-3 flex h-8 w-8 shrink-0 items-center justify-center rounded-full">
                <i className="ri-notification-line text-primary text-sm"></i>
              </div>
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex items-center justify-between">
                  <h4 className="truncate text-sm font-medium text-gray-900">
                    {toastNotification.title_key
                      ? t(toastNotification.title_key, toastNotification.translation_params || {})
                      : toastNotification.title}
                  </h4>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setShowToast(false)
                    }}
                    className="ml-2 cursor-pointer text-gray-400 hover:text-gray-600"
                  >
                    <i className="ri-close-line text-sm"></i>
                  </button>
                </div>
                <p className="line-clamp-2 text-sm text-gray-600">
                  {toastNotification.message_key
                    ? t(toastNotification.message_key, toastNotification.translation_params || {})
                    : toastNotification.message}
                </p>
                <p className="text-primary mt-1 text-xs">Clic para ver detalles</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Centro de Notificaciones */}
      <NotificationCenter
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onNotificationClick={handleNotificationClick}
      />
    </>
  )
}
