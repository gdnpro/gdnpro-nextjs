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

const typeIcons = {
  message: "ri-chat-3-line",
  proposal: "ri-file-text-line",
  payment: "ri-secure-payment-line",
  project_update: "ri-briefcase-line",
  review: "ri-star-line",
  system: "ri-information-line",
  reminder: "ri-alarm-line",
  milestone: "ri-flag-line",
}

const typeColors = {
  message: "text-primary bg-primary/10",
  proposal: "text-primary bg-primary/10",
  payment: "text-green-600 bg-green-100",
  project_update: "text-purple-600 bg-purple-100",
  review: "text-yellow-600 bg-yellow-100",
  system: "text-gray-600 bg-gray-100",
  reminder: "text-orange-600 bg-orange-100",
  milestone: "text-indigo-600 bg-indigo-100",
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

      const filters: any = { limit: 50 }
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
        }
      )

      if (response.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
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
        }
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
        }
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
    } else if (notification.action_url) {
      window.location.href = notification.action_url
    }
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMinutes = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60)
    )

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
    <div className="fixed inset-0 flex items-start justify-center z-50 pt-16">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[85vh] mx-4 flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center mr-3">
              <i className="ri-notification-line text-primary text-xl"></i>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Notificaciones
              </h2>
              <p className="text-sm text-gray-500">
                {unreadCount > 0 ? `${unreadCount} sin leer` : "Todo al día"}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-primary hover:text-cyan-700 text-sm font-medium cursor-pointer"
              >
                Marcar todas como leídas
              </button>
            )}
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100 cursor-pointer"
            >
              <i className="ri-close-line text-xl"></i>
            </button>
          </div>
        </div>

        {/* Filtros */}
        <div className="px-6 py-4 border-b border-gray-100">
          <div className="flex space-x-1 overflow-x-auto">
            {filterOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setActiveFilter(option.value)}
                className={`px-3 py-2 rounded-full text-sm font-medium whitespace-nowrap cursor-pointer transition-colors ${
                  activeFilter === option.value
                    ? "bg-primary/10 text-cyan-700"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                {option.label}
                {option.count > 0 && (
                  <span className="ml-1 bg-gray-200 text-gray-600 text-xs px-1.5 py-0.5 rounded-full">
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
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-12">
              <i className="ri-notification-off-line text-4xl text-gray-400 mb-4"></i>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No hay notificaciones
              </h3>
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
                  className={`p-4 hover:bg-gray-50 cursor-pointer border-l-4 ${priorityColors[notification.priority!]} ${
                    !notification.read ? "bg-cyan-50/30" : ""
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start flex-1 min-w-0">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 shrink-0 ${typeColors[notification.type]}`}
                      >
                        <i
                          className={`${typeIcons[notification.type]} text-sm`}
                        ></i>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center mb-1">
                          <h4
                            className={`text-sm font-medium truncate ${
                              !notification.read
                                ? "text-gray-900"
                                : "text-gray-700"
                            }`}
                          >
                            {notification.title}
                          </h4>
                          {!notification.read && (
                            <div className="w-2 h-2 bg-cyan-500 rounded-full ml-2 shrink-0"></div>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 leading-relaxed">
                          {notification.message}
                        </p>
                        <div className="flex items-center mt-2 text-xs text-gray-500">
                          <span className="capitalize">
                            {notification.type.replace("_", " ")}
                          </span>
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
                                {notification.priority === "urgent"
                                  ? "Urgente"
                                  : "Alta prioridad"}
                              </span>
                            </>
                          ) : null}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 ml-2">
                      {!notification.read && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            markAsRead(notification.id!)
                          }}
                          className="text-primary hover:text-cyan-700 p-1 rounded cursor-pointer"
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
                        className="text-gray-400 hover:text-red-500 p-1 rounded cursor-pointer"
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
          <div className="p-4 border-t border-gray-200 text-center">
            <button
              onClick={loadNotifications}
              className="text-primary hover:text-cyan-700 text-sm font-medium cursor-pointer"
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
