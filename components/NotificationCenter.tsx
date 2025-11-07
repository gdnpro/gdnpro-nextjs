"use client"

import { supabaseBrowser } from "@/utils/supabase/client"
import type { Notification } from "@/interfaces/Notification"
import { useState, useEffect } from "react"

const supabase = supabaseBrowser()

interface NotificationCenterProps {
  isOpen: boolean
  onClose: () => void
  onNotificationClick?: (notification: Notification) => void
}

const typeIcons: Record<string, string> = {
  message: "ri-chat-3-line",
  proposal: "ri-file-text-line",
  payment: "ri-secure-payment-line",
  project_update: "ri-briefcase-line",
  review: "ri-star-line",
  system: "ri-information-line",
  reminder: "ri-alarm-line",
  milestone: "ri-flag-line",
  badge: "ri-award-line",
  achievement: "ri-trophy-line",
}

const typeColors: Record<string, string> = {
  message: "text-primary bg-primary/10",
  proposal: "text-primary bg-primary/10",
  payment: "text-green-600 bg-green-100",
  project_update: "text-purple-600 bg-purple-100",
  review: "text-yellow-600 bg-yellow-100",
  system: "text-gray-600 bg-gray-100",
  reminder: "text-orange-600 bg-orange-100",
  milestone: "text-indigo-600 bg-indigo-100",
  badge: "text-yellow-600 bg-yellow-100",
  achievement: "text-amber-600 bg-amber-100",
}

const priorityColors = {
  low: "border-l-gray-300",
  normal: "border-l-blue-400",
  high: "border-l-orange-400",
  urgent: "border-l-red-500",
}

export default function NotificationCenter({
  isOpen,
  onClose,
  onNotificationClick,
}: NotificationCenterProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(false)
  const [activeFilter, setActiveFilter] = useState<string>("all")
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    if (isOpen) {
      loadNotifications()
    }
  }, [isOpen, activeFilter])

  // Smart polling for notifications when panel is open (since Realtime replication is not available)
  useEffect(() => {
    if (!isOpen) return

    let pollInterval: NodeJS.Timeout | null = null

    const startPolling = () => {
      // Poll every 3 seconds when panel is open to get new notifications quickly
      const poll = async () => {
        try {
          const session = await supabase.auth.getSession()
          if (!session.data.session?.access_token) return

          const filters: { limit: number; read?: boolean; type?: string } = { limit: 50 }
          if (activeFilter !== "all") {
            if (activeFilter === "unread") {
              filters.read = false
            } else {
              filters.type = activeFilter
            }
          }

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
                filters,
              }),
            },
          )

          if (response.ok) {
            const data = await response.json()
            if (data.success) {
              // Check if we have new notifications by comparing IDs
              setNotifications((prev) => {
                const newNotifications = data.notifications || []
                // Merge and deduplicate, keeping the latest version
                const notificationMap = new Map<string, Notification>()

                // Add existing notifications first
                prev.forEach((n) => {
                  if (n.id) notificationMap.set(n.id, n)
                })

                // Add/update with new notifications (newer ones take precedence)
                newNotifications.forEach((n: Notification) => {
                  if (n.id) notificationMap.set(n.id, n)
                })

                // Convert back to array and sort by created_at descending
                return Array.from(notificationMap.values()).sort((a, b) => {
                  const timeA = new Date(a.created_at || 0).getTime()
                  const timeB = new Date(b.created_at || 0).getTime()
                  return timeB - timeA
                })
              })

              setUnreadCount(data.unreadCount || 0)
            }
          }
        } catch (error) {
          console.error("Error polling notifications:", error)
        }
      }

      // Poll immediately, then set up interval
      poll()
      pollInterval = setInterval(poll, 3000)
    }

    startPolling()

    return () => {
      if (pollInterval) {
        clearInterval(pollInterval)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, activeFilter])

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
  }, [isOpen])

  const loadNotifications = async () => {
    setLoading(true)
    try {
      const session = await supabase.auth.getSession()
      if (!session.data.session?.access_token) return

      const filters: { limit: number; read?: boolean; type?: string } = { limit: 50 }
      if (activeFilter !== "all") {
        if (activeFilter === "unread") {
          filters.read = false
        } else {
          filters.type = activeFilter
        }
      }

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
            filters,
          }),
        },
      )

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setNotifications(data.notifications || [])
          setUnreadCount(data.unreadCount || 0)
        }
      }
    } catch (error) {
      console.error("Error loading notifications:", error)
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (notificationId: string) => {
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
            action: "mark-as-read",
            notificationId,
          }),
        },
      )

      if (response.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n)),
        )
        setUnreadCount((prev) => Math.max(0, prev - 1))
      }
    } catch (error) {
      console.error("Error marking notification as read:", error)
    }
  }

  const markAllAsRead = async () => {
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
            action: "mark-as-read",
            markAllRead: true,
          }),
        },
      )

      if (response.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
        setUnreadCount(0)
      }
    } catch (error) {
      console.error("Error marking all notifications as read:", error)
    }
  }

  const deleteNotification = async (notificationId: string) => {
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
            action: "delete-notification",
            notificationId,
          }),
        },
      )

      if (response.ok) {
        setNotifications((prev) => prev.filter((n) => n.id !== notificationId))
        // Si era no leída, reducir contador
        const notification = notifications.find((n) => n.id === notificationId)
        if (notification && !notification.read) {
          setUnreadCount((prev) => Math.max(0, prev - 1))
        }
      }
    } catch (error) {
      console.error("Error deleting notification:", error)
    }
  }

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markAsRead(notification.id!)
    }

    if (onNotificationClick) {
      onNotificationClick(notification)
    } else {
      // Navigate to dashboard section based on notification type
      navigateToNotificationSection(notification)
    }
  }

  const navigateToNotificationSection = (notification: Notification) => {
    // Map notification types to dashboard sections
    const typeToSectionMap: Record<string, string> = {
      message: "messages",
      proposal: "proposals",
      payment: "payments",
      project_update: "projects",
      review: "reviews",
      system: "projects", // Default to projects for system notifications
      reminder: "projects",
      milestone: "projects",
      badge: "achievements",
      achievement: "achievements",
    }

    const section = typeToSectionMap[notification.type] || "projects"

    // Store the section in session storage for the dashboard to read
    if (typeof window !== "undefined") {
      sessionStorage.setItem("last_tab", section)
    }

    // Navigate to dashboard
    if (notification.action_url) {
      window.location.href = notification.action_url
    } else {
      // Default to dashboard if no action_url
      window.location.href = "/dashboard"
    }
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))

    if (diffInMinutes < 1) return "Ahora"
    if (diffInMinutes < 60) return `${diffInMinutes}m`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`
    return `${Math.floor(diffInMinutes / 1440)}d`
  }

  const filterOptions = [
    { value: "all", label: "Todas", count: notifications.length },
    { value: "unread", label: "No leídas", count: unreadCount },
    {
      value: "message",
      label: "Mensajes",
      count: notifications.filter((n) => n.type === "message").length,
    },
    {
      value: "proposal",
      label: "Propuestas",
      count: notifications.filter((n) => n.type === "proposal").length,
    },
    {
      value: "payment",
      label: "Pagos",
      count: notifications.filter((n) => n.type === "payment").length,
    },
    {
      value: "project_update",
      label: "Proyectos",
      count: notifications.filter((n) => n.type === "project_update").length,
    },
  ]

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16">
      <div className="mx-4 flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-black/5">
        {/* Modern Header with Gradient */}
        <div className="relative overflow-hidden bg-gradient-to-r from-cyan-600 via-cyan-500 to-teal-500 p-6 text-white">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIyIi8+PC9nPjwvZz48L3N2Zz4=')] opacity-20"></div>
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 ring-1 ring-white/30 backdrop-blur-sm">
                <i className="ri-notification-line text-2xl"></i>
              </div>
              <div>
                <h2 className="text-2xl leading-tight font-bold sm:text-3xl">Notificaciones</h2>
                <p className="mt-1 text-sm text-cyan-100">
                  {unreadCount > 0 ? `${unreadCount} sin leer` : "Todo al día"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="group flex cursor-pointer items-center gap-2 rounded-xl bg-white/10 px-4 py-2 text-sm font-semibold text-white ring-1 ring-white/20 backdrop-blur-sm transition-all hover:scale-105 hover:bg-white/20"
                >
                  <i className="ri-check-double-line text-base"></i>
                  <span>Marcar todas</span>
                </button>
              )}
              <button
                onClick={onClose}
                className="group flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/20 backdrop-blur-sm transition-all hover:scale-110 hover:bg-white/20"
                aria-label="Cerrar"
              >
                <i className="ri-close-line text-xl transition-transform group-hover:rotate-90"></i>
              </button>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="border-b border-gray-200 bg-gradient-to-b from-gray-50 to-white px-6 py-4">
          <div className="flex gap-2 overflow-x-auto">
            {filterOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setActiveFilter(option.value)}
                className={`group flex cursor-pointer items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold whitespace-nowrap transition-all ${
                  activeFilter === option.value
                    ? "bg-gradient-to-r from-cyan-500 to-teal-500 text-white shadow-lg shadow-cyan-500/30"
                    : "bg-white text-gray-600 ring-1 ring-gray-200 hover:bg-gray-50 hover:ring-gray-300"
                }`}
              >
                <span>{option.label}</span>
                {option.count > 0 && (
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                      activeFilter === option.value
                        ? "bg-white/20 text-white"
                        : "bg-gradient-to-r from-cyan-500 to-teal-500 text-white"
                    }`}
                  >
                    {option.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Lista de Notificaciones */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex h-32 items-center justify-center">
              <div className="border-primary h-8 w-8 animate-spin rounded-full border-b-2"></div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="py-12 text-center">
              <div className="mb-4 flex justify-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-gray-100 to-gray-200">
                  <i className="ri-notification-off-line text-3xl text-gray-400"></i>
                </div>
              </div>
              <h3 className="mb-2 text-lg font-semibold text-gray-900">No hay notificaciones</h3>
              <p className="text-gray-500">
                {activeFilter === "unread"
                  ? "Todas las notificaciones están leídas"
                  : "Las notificaciones aparecerán aquí"}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`group relative cursor-pointer border-l-4 p-4 transition-all hover:bg-gradient-to-r hover:from-cyan-50/50 hover:to-teal-50/50 ${
                    priorityColors[notification.priority!]
                  } ${!notification.read ? "bg-gradient-to-r from-cyan-50/30 to-teal-50/30" : ""}`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex min-w-0 flex-1 items-start gap-3">
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl shadow-lg transition-transform group-hover:scale-110 ${
                          notification.type === "message"
                            ? "bg-gradient-to-br from-cyan-500 to-teal-500 text-white"
                            : notification.type === "proposal"
                              ? "bg-gradient-to-br from-blue-500 to-indigo-500 text-white"
                              : notification.type === "payment"
                                ? "bg-gradient-to-br from-emerald-500 to-green-500 text-white"
                                : notification.type === "project_update"
                                  ? "bg-gradient-to-br from-purple-500 to-pink-500 text-white"
                                  : notification.type === "review"
                                    ? "bg-gradient-to-br from-yellow-500 to-amber-500 text-white"
                                    : notification.type === "badge" ||
                                        notification.type === "achievement"
                                      ? "bg-gradient-to-br from-amber-500 to-orange-500 text-white"
                                      : "bg-gradient-to-br from-gray-500 to-gray-600 text-white"
                        }`}
                      >
                        <i className={`${typeIcons[notification.type]} text-base`}></i>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="mb-2 flex items-center gap-2">
                          <h4
                            className={`truncate text-sm font-semibold ${
                              !notification.read ? "text-gray-900" : "text-gray-700"
                            }`}
                          >
                            {notification.title}
                          </h4>
                          {!notification.read && (
                            <div className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-gradient-to-r from-cyan-500 to-teal-500 ring-2 ring-cyan-200"></div>
                          )}
                        </div>
                        <p className="mb-3 text-sm leading-relaxed text-gray-600">
                          {notification.message}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          <span className="rounded-full bg-gradient-to-r from-gray-100 to-gray-200 px-2.5 py-1 font-medium text-gray-700 capitalize">
                            {notification.type.replace("_", " ")}
                          </span>
                          <span className="text-gray-400">•</span>
                          <span className="font-medium text-gray-500">
                            {formatTime(notification.created_at!)}
                          </span>
                          {(notification.priority === "high" ||
                            notification.priority === "urgent") && (
                            <>
                              <span className="text-gray-400">•</span>
                              <span
                                className={`rounded-full px-2.5 py-1 font-semibold ${
                                  notification.priority === "urgent"
                                    ? "bg-gradient-to-r from-red-500 to-red-600 text-white"
                                    : "bg-gradient-to-r from-orange-500 to-orange-600 text-white"
                                }`}
                              >
                                {notification.priority === "urgent" ? "Urgente" : "Alta prioridad"}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      {!notification.read && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            markAsRead(notification.id!)
                          }}
                          className="group/btn flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg bg-gradient-to-r from-cyan-500 to-teal-500 text-white shadow-md transition-all hover:scale-110 hover:shadow-lg"
                          title="Marcar como leída"
                        >
                          <i className="ri-check-line text-sm transition-transform group-hover/btn:scale-125"></i>
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteNotification(notification.id!)
                        }}
                        className="group/btn flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg bg-white text-gray-400 ring-1 ring-gray-200 transition-all hover:scale-110 hover:bg-red-50 hover:text-red-500 hover:ring-red-200"
                        title="Eliminar notificación"
                      >
                        <i className="ri-delete-bin-line text-sm transition-transform group-hover/btn:scale-125"></i>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="border-t border-gray-200 bg-gradient-to-b from-white to-gray-50 p-4 text-center">
            <button
              onClick={loadNotifications}
              className="group inline-flex cursor-pointer items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-cyan-500/30 transition-all hover:-translate-y-0.5 hover:scale-[1.02] hover:shadow-xl hover:shadow-cyan-500/40"
            >
              <i className="ri-refresh-line text-base transition-transform group-hover:rotate-180"></i>
              <span>Actualizar notificaciones</span>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
