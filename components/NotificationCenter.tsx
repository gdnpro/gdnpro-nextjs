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
            }
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
      <div className="mx-4 flex max-h-[85vh] w-full max-w-2xl flex-col rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 p-6">
          <div className="flex items-center">
            <div className="bg-primary/10 mr-3 flex h-10 w-10 items-center justify-center rounded-full">
              <i className="ri-notification-line text-primary text-xl"></i>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Notificaciones</h2>
              <p className="text-sm text-gray-500">
                {unreadCount > 0 ? `${unreadCount} sin leer` : "Todo al día"}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-primary cursor-pointer text-sm font-medium hover:text-cyan-700"
              >
                Marcar todas como leídas
              </button>
            )}
            <button
              onClick={onClose}
              className="cursor-pointer rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            >
              <i className="ri-close-line text-xl"></i>
            </button>
          </div>
        </div>

        {/* Filtros */}
        <div className="border-b border-gray-100 px-6 py-4">
          <div className="flex space-x-1 overflow-x-auto">
            {filterOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setActiveFilter(option.value)}
                className={`cursor-pointer rounded-full px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors ${
                  activeFilter === option.value
                    ? "bg-primary/10 text-cyan-700"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                {option.label}
                {option.count > 0 && (
                  <span className="ml-1 rounded-full bg-gray-200 px-1.5 py-0.5 text-xs text-gray-600">
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
              <i className="ri-notification-off-line mb-4 text-4xl text-gray-400"></i>
              <h3 className="mb-2 text-lg font-medium text-gray-900">No hay notificaciones</h3>
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
                  className={`cursor-pointer border-l-4 p-4 hover:bg-gray-50 ${priorityColors[notification.priority!]} ${
                    !notification.read ? "bg-cyan-50/30" : ""
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex min-w-0 flex-1 items-start">
                      <div
                        className={`mr-3 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${typeColors[notification.type]}`}
                      >
                        <i className={`${typeIcons[notification.type]} text-sm`}></i>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="mb-1 flex items-center">
                          <h4
                            className={`truncate text-sm font-medium ${
                              !notification.read ? "text-gray-900" : "text-gray-700"
                            }`}
                          >
                            {notification.title}
                          </h4>
                          {!notification.read && (
                            <div className="ml-2 h-2 w-2 shrink-0 rounded-full bg-cyan-500"></div>
                          )}
                        </div>
                        <p className="text-sm leading-relaxed text-gray-600">
                          {notification.message}
                        </p>
                        <div className="mt-2 flex items-center text-xs text-gray-500">
                          <span className="capitalize">{notification.type.replace("_", " ")}</span>
                          <span className="mx-2">•</span>
                          <span>{formatTime(notification.created_at!)}</span>
                          {notification.priority === "high" ||
                          notification.priority === "urgent" ? (
                            <>
                              <span className="mx-2">•</span>
                              <span
                                className={`font-medium ${
                                  notification.priority === "urgent"
                                    ? "text-red-600"
                                    : "text-orange-600"
                                }`}
                              >
                                {notification.priority === "urgent" ? "Urgente" : "Alta prioridad"}
                              </span>
                            </>
                          ) : null}
                        </div>
                      </div>
                    </div>
                    <div className="ml-2 flex items-center space-x-2">
                      {!notification.read && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            markAsRead(notification.id!)
                          }}
                          className="text-primary cursor-pointer rounded p-1 hover:text-cyan-700"
                          title="Marcar como leída"
                        >
                          <i className="ri-check-line text-sm"></i>
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteNotification(notification.id!)
                        }}
                        className="cursor-pointer rounded p-1 text-gray-400 hover:text-red-500"
                        title="Eliminar notificación"
                      >
                        <i className="ri-delete-bin-line text-sm"></i>
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
          <div className="border-t border-gray-200 p-4 text-center">
            <button
              onClick={loadNotifications}
              className="text-primary cursor-pointer text-sm font-medium hover:text-cyan-700"
            >
              <i className="ri-refresh-line mr-1"></i>
              Actualizar notificaciones
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
