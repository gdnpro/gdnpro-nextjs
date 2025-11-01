"use client"

import { useState, useEffect } from "react"
import NotificationCenter from "./NotificationCenter"
import type { Notification } from "@/interfaces/Notification"
import { useSessionStorage } from "@/hooks/useSessionStorage"
import { supabaseBrowser } from "@/utils/supabase/client"

const supabase = supabaseBrowser()

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [showToast, setShowToast] = useState(false)
  const [toastNotification, setToastNotification] =
    useState<Notification | null>(null)

  const { setValue } = useSessionStorage("last_tab")

  useEffect(() => {
    checkAuthStatus()

    const authInterval = setInterval(checkAuthStatus, 30000)

    return () => clearInterval(authInterval)
  }, [])

  useEffect(() => {
    if (isLoggedIn) {
      loadUnreadCount()

      // Actualizar conteo cada 10 segundos
      const countInterval = setInterval(loadUnreadCount, 10000)

      return () => clearInterval(countInterval)
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

  const loadUnreadCount = async () => {
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
        }
      )

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          const newCount = data.count || 0

          // Si hay nuevas notificaciones, cargar las recientes para mostrar toast
          if (newCount > unreadCount && unreadCount !== 0) {
            loadRecentNotifications()
          }

          setUnreadCount(newCount)
        }
      }
    } catch (error) {
      console.error("Error loading unread count:", error)
    }
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
        }
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

    if (notification.action_url) {
      setValue("last_tab", `${notification.type}s`)
      window.location.href = notification.action_url
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
          className="relative p-2 text-gray-600 hover:text-gray-900 focus:outline-none rounded-lg transition-colors cursor-pointer"
          aria-label="Notificaciones"
        >
          <i className="ri-notification-line text-xl"></i>

          {/* Badge de conteo */}
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}

          {/* Indicador de animación para nuevas notificaciones */}
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 bg-red-500 rounded-full w-5 h-5 animate-ping opacity-75"></span>
          )}
        </button>
      </div>

      {/* Toast Notification */}
      {showToast && toastNotification && (
        <div className="fixed top-20 right-4 z-50 bg-white rounded-lg shadow-lg border border-gray-200 max-w-sm animate-slide-in-right">
          <div
            className="p-4 cursor-pointer hover:bg-gray-50 rounded-lg transition-colors"
            onClick={handleToastClick}
          >
            <div className="flex items-start">
              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center mr-3 shrink-0">
                <i className="ri-notification-line text-primary text-sm"></i>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="text-sm font-medium text-gray-900 truncate">
                    {toastNotification.title}
                  </h4>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setShowToast(false)
                    }}
                    className="text-gray-400 hover:text-gray-600 ml-2 cursor-pointer"
                  >
                    <i className="ri-close-line text-sm"></i>
                  </button>
                </div>
                <p className="text-sm text-gray-600 line-clamp-2">
                  {toastNotification.message}
                </p>
                <p className="text-xs text-primary mt-1">
                  Clic para ver detalles
                </p>
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

      {/* Estilos para animaciones */}
      <style jsx="true">{`
        @keyframes slide-in-right {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        .animate-slide-in-right {
          animation: slide-in-right 0.3s ease-out;
        }

        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </>
  )
}
