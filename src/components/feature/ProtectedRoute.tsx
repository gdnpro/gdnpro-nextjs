"use client"

import { useAuth } from "@/components/AuthContext"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: "admin" | "client" | "freelancer"
}

export default function ProtectedRoute({
  children,
  requiredRole,
}: ProtectedRouteProps) {
  const { profile, user, loading, isAuthenticated } = useAuth()
  const navigate = useRouter()

  useEffect(() => {
    if (loading) return

    // No autenticado
    if (!isAuthenticated) {
      navigate.push("/")
      return
    }

    // Requiere rol y el usuario no lo tiene
    if (requiredRole && user?.role !== requiredRole) {
      const getDashboardUrl = () => {
        switch (user?.role) {
          case "admin":
            return "/admin"
          case "freelancer":
            return "/dashboard/freelancer"
          default:
            return "/dashboard/client"
        }
      }

      navigate.push(getDashboardUrl())
    }
  }, [loading, isAuthenticated, requiredRole, profile?.role, navigate])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated && !loading) {
    return null
  }

  return <>{children}</>
}
