"use client"

import { useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import NotificationBell from "@/components/NotificationBell"
import { useAuth } from "@/components/AuthContext"
import { supabaseBrowser } from "@/db/supabase/client"

const supabase = supabaseBrowser()

export default function Navigation() {
  const { user, loading } = useAuth() as { user: any; loading: boolean }
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const navigate = useRouter()
  const location = usePathname()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate.push("/")
    setIsUserMenuOpen(false)
  }

  const goToDashboard = () => {
    if (user?.role === "admin") navigate.push("/admin")
    else if (user?.role === "freelancer") navigate.push("/dashboard/freelancer")
    else if (user?.role === "client") navigate.push("/dashboard/client")
    setIsUserMenuOpen(false)
  }

  const scrollToSection = (sectionId: string) => {
    if (location !== "/") {
      navigate.push("/")
      setTimeout(() => {
        document
          .getElementById(sectionId)
          ?.scrollIntoView({ behavior: "smooth" })
      }, 100)
    } else {
      document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth" })
    }
    setIsMenuOpen(false)
  }

  const goToHome = () => {
    navigate.push("/")
    window.scrollTo({ top: 0, behavior: "smooth" })
    setIsMenuOpen(false)
  }

  const goToFreelancers = () => {
    navigate.push("/freelancers")
    setIsMenuOpen(false)
  }

  const goToLogin = () => {
    navigate.push("/login")
    setIsMenuOpen(false)
  }

  const goToRegister = () => {
    navigate.push("/register")
    setIsMenuOpen(false)
  }

  const menuItems = [
    { label: "Inicio", action: goToHome },
    { label: "Servicios", action: () => scrollToSection("services") },
    { label: "Portafolio", action: () => scrollToSection("portfolio") },
    { label: "Equipo", action: () => scrollToSection("team") },
    { label: "Freelancers", action: goToFreelancers },
    { label: "Contacto", action: () => scrollToSection("contact") },
  ]

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm shadow-sm lg:px-8 sm:px-6 px-4">
      <div className="max-w-7xl px-6 mx-auto">
        <div className="flex gap-8 justify-between items-center h-16">
          {/* Logo */}
          <button
            onClick={goToHome}
            className={`${user ? "hidden md:block" : "block"} cursor-pointer`}
          >
            <img src="/logo.png" alt="GDN PRO" className="h-10 w-auto" />
          </button>

          {/* Campanita + Avatar SOLO en móvil si hay sesión */}
          {!loading && user && (
            <div className="flex items-center space-x-3 md:hidden">
              <NotificationBell />
              <div className="size-8 bg-primary/10 rounded-full flex items-center justify-center mr-3 sm:mr-4 overflow-hidden">
                {user?.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt={user.full_name}
                    className="size-full object-cover object-top rounded-full"
                  />
                ) : (
                  <i className="ri-user-line text-xl sm:text-2xl text-primary"></i>
                )}
              </div>
            </div>
          )}

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-x-8">
            {menuItems.map((item, index) => (
              <button
                key={index}
                onClick={item.action}
                className="text-gray-700 hover:text-primary cursor-pointer font-medium transition-colors"
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Right section escritorio */}
          {!loading && user ? (
            <div className="relative hidden md:block">
              <div className="flex items-center space-x-3">
                <NotificationBell />
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center space-x-2 text-gray-700 cursor-pointer hover:text-primary font-medium"
                >
                  <div className="size-8 sm:size-10 bg-primary/10 rounded-full flex items-center justify-center mr-3 sm:mr-4 overflow-hidden">
                    {user?.avatar_url ? (
                      <img
                        src={user.avatar_url}
                        alt={user.full_name}
                        className="size-full object-cover object-top rounded-full"
                      />
                    ) : (
                      <i className="ri-user-line text-xl sm:text-2xl text-primary"></i>
                    )}
                  </div>
                  <span>{user?.full_name?.split(" ")[0] || "Usuario"}</span>
                  <i
                    className={`ri-arrow-down-s-line transition-transform ${
                      isUserMenuOpen ? "rotate-180" : ""
                    }`}
                  ></i>
                </button>
              </div>

              {/* Dropdown */}
              {isUserMenuOpen && (
                <div className="absolute right-0 mt-3 w-48 bg-white border-none rounded-lg shadow-lg border py-2 z-50">
                  <button
                    onClick={goToDashboard}
                    className="flex w-full px-4 py-2 text-left cursor-pointer text-gray-700 hover:bg-gray-100"
                  >
                    <i className="ri-dashboard-line mr-2"></i>
                    Dashboard
                  </button>
                  <button
                    onClick={handleLogout}
                    className="flex w-full px-4 py-2 text-left cursor-pointer text-red-600 hover:bg-red-50"
                  >
                    <i className="ri-logout-box-line mr-2"></i>
                    Cerrar sesión
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="hidden md:flex items-center space-x-4">
              <button
                onClick={goToLogin}
                className="text-gray-700 cursor-pointer hover:text-primary font-medium transition-colors"
              >
                Iniciar Sesión
              </button>
              <button
                onClick={goToRegister}
                className="bg-primary cursor-pointer hover:bg-cyan-700 text-white px-6 py-2 rounded-full font-semibold transition-all transform hover:scale-105"
              >
                Registrarse
              </button>
            </div>
          )}

          {/* Botón hamburguesa móvil */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-700 hover:text-primary"
            >
              <i
                className={`text-2xl transition-transform ${
                  isMenuOpen ? "ri-close-line rotate-90" : "ri-menu-line"
                }`}
              ></i>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden border-t bg-white/95 backdrop-blur-sm">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {menuItems.map((item, index) => (
                <button
                  key={index}
                  onClick={item.action}
                  className="block w-full text-left px-3 py-3 text-gray-700 hover:text-primary hover:bg-gray-50 rounded-lg font-medium transition-all"
                >
                  {item.label}
                </button>
              ))}

              {/* Si hay sesión: dashboard + cerrar sesión */}
              {user && (
                <div className="border-t pt-3 mt-3 space-y-2">
                  <button
                    onClick={goToDashboard}
                    className="block w-full text-left px-3 py-3 text-gray-700 hover:bg-gray-50"
                  >
                    Dashboard
                  </button>
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-3 py-3 text-red-600 hover:bg-red-50"
                  >
                    Cerrar Sesión
                  </button>
                </div>
              )}

              {/* Si NO hay sesión: iniciar sesión + registrarse */}
              {!user && (
                <div className="border-t pt-3 mt-3 space-y-2">
                  <button
                    onClick={goToLogin}
                    className="block w-full text-left px-3 py-3 text-gray-700 hover:bg-gray-50"
                  >
                    Iniciar Sesión
                  </button>
                  <button
                    onClick={goToRegister}
                    className="block w-full text-left px-3 py-3 text-white bg-primary hover:bg-cyan-700 rounded-lg font-medium"
                  >
                    Registrarse
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
