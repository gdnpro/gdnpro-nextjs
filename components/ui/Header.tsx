"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import NotificationBell from "@/components/NotificationBell"
import { useAuth } from "@/contexts/AuthContext"
import { supabaseBrowser } from "@/utils/supabase/client"

const supabase = supabaseBrowser()

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)

  const { profile: user, loading, refreshAuth } = useAuth()
  const navigate = useRouter()

  const userMenuRef = useRef<HTMLDivElement>(null)
  const mobileMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!user && !loading) {
      refreshAuth()
    }
  }, [user, loading, refreshAuth])

  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
  }, [isMenuOpen])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node

      if (isUserMenuOpen && userMenuRef.current && !userMenuRef.current.contains(target)) {
        setIsUserMenuOpen(false)
      }

      if (isMenuOpen && mobileMenuRef.current && !mobileMenuRef.current.contains(target)) {
        setIsMenuOpen(false)
      }
    }

    document.addEventListener("click", handleClickOutside)
    return () => document.removeEventListener("click", handleClickOutside)
  }, [isUserMenuOpen, isMenuOpen])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate.push("/auth/login")
    setIsUserMenuOpen(false)
  }

  // Menu items based on user type
  const getMenuItems = () => {
    const baseItems = [
      { label: "Inicio", url: "/" },
      { label: "Servicios", url: "/#services" },
      { label: "Portafolio", url: "/#portfolio" },
      { label: "Equipo", url: "/#team" },
    ]

    // Show "Works" for freelancers, "Freelancers" for clients and non-logged users
    if (user?.user_type === "freelancer") {
      return [
        ...baseItems,
        { label: "Trabajos", url: "/works" },
        { label: "Contacto", url: "/#contact" },
      ]
    } else {
      return [
        ...baseItems,
        { label: "Freelancers", url: "/freelancers" },
        { label: "Contacto", url: "/#contact" },
      ]
    }
  }

  const menuItems = getMenuItems()

  return (
    <header className="fixed top-0 right-0 left-0 z-50 bg-white/95 shadow-sm backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-3 sm:gap-4 md:gap-8">
          {/* Mobile Menu Button - First on mobile */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="hover:text-primary flex size-10 touch-manipulation items-center justify-center text-gray-700 transition-colors"
              aria-label={isMenuOpen ? "Cerrar menú" : "Abrir menú"}
            >
              <i
                className={`text-2xl transition-transform ${
                  isMenuOpen ? "ri-close-line rotate-90" : "ri-menu-line"
                }`}
              ></i>
            </button>
          </div>

          {/* Logo - Second on mobile, first on desktop */}
          <a href="/" className="flex-shrink-0 cursor-pointer">
            <img src="/logo.png" alt="GDN PRO" className="h-8 w-auto sm:h-10" />
          </a>

          {/* Desktop Menu - Center on desktop */}
          <ul className="hidden items-center gap-x-8 md:flex md:flex-1 md:justify-center">
            {menuItems.map((item, index) => (
              <li
                key={index}
                className="hover:text-primary cursor-pointer font-medium text-gray-700 transition-colors"
              >
                <a href={item.url}>{item.label}</a>
              </li>
            ))}
          </ul>

          {/* Mobile: NotificationBell and Profile - Third and Fourth on mobile */}
          {!loading && user && (
            <div className="flex items-center gap-2">
              <div className="md:hidden">
                <NotificationBell />
              </div>
              <div className="bg-primary/10 flex size-9 items-center justify-center overflow-hidden rounded-full sm:size-10 md:hidden">
                {user?.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt={user.full_name}
                    className="size-full rounded-full object-cover object-top"
                  />
                ) : (
                  <i className="ri-user-line text-primary text-xl"></i>
                )}
              </div>
            </div>
          )}

          {/* Desktop: Right section */}
          {!loading && user ? (
            <div className="relative hidden md:block">
              <div className="flex items-center space-x-3">
                <NotificationBell />
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="hover:text-primary flex cursor-pointer items-center space-x-2 font-medium text-gray-700"
                >
                  <div className="bg-primary/10 mr-3 flex size-8 items-center justify-center overflow-hidden rounded-full sm:mr-4 sm:size-10">
                    {user?.avatar_url ? (
                      <img
                        src={user.avatar_url}
                        alt={user.full_name}
                        className="size-full rounded-full object-cover object-top"
                      />
                    ) : (
                      <i className="ri-user-line text-primary text-xl sm:text-2xl"></i>
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
                <div
                  className="absolute right-0 z-50 mt-3 w-48 rounded-lg border border-none bg-white py-2 shadow-lg"
                  ref={userMenuRef}
                >
                  <a
                    href="/dashboard"
                    className="flex w-full cursor-pointer px-4 py-2 text-left text-gray-700 hover:bg-gray-100"
                  >
                    <i className="ri-dashboard-line mr-2"></i>
                    Dashboard
                  </a>
                  <button
                    onClick={handleLogout}
                    className="flex w-full cursor-pointer px-4 py-2 text-left text-red-600 hover:bg-red-50"
                  >
                    <i className="ri-logout-box-line mr-2"></i>
                    Cerrar sesión
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="hidden items-center space-x-4 md:flex">
              <a
                href="/auth/login"
                className="hover:text-primary cursor-pointer font-medium text-gray-700 transition-colors"
              >
                Iniciar Sesión
              </a>
              <a
                href="/auth/register"
                className="bg-primary transform cursor-pointer rounded-full px-6 py-2 font-semibold text-white transition-all hover:scale-105 hover:bg-cyan-700"
              >
                Registrarse
              </a>
            </div>
          )}
        </div>

        {isMenuOpen && (
          <div className="border-t border-gray-200 md:hidden" ref={mobileMenuRef}>
            <div className="space-y-1 px-2 pt-2 pb-4">
              <ul>
                {menuItems.map((item, index) => (
                  <li key={index} className="block w-full">
                    <a
                      href={item.url}
                      onClick={() => setIsMenuOpen(false)}
                      className="hover:text-primary block w-full rounded-lg px-4 py-3 text-left font-medium text-gray-700 transition-all hover:bg-gray-50 active:bg-gray-100"
                    >
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>

              {user && (
                <div className="mt-3 space-y-1 border-t border-gray-200 pt-3">
                  <a
                    href="/dashboard"
                    onClick={() => setIsMenuOpen(false)}
                    className="block w-full rounded-lg px-4 py-3 text-left font-medium text-gray-700 transition-colors hover:bg-gray-50 active:bg-gray-100"
                  >
                    <i className="ri-dashboard-line mr-2"></i>
                    Dashboard
                  </a>
                  <button
                    onClick={() => {
                      handleLogout()
                      setIsMenuOpen(false)
                    }}
                    className="block w-full rounded-lg px-4 py-3 text-left font-medium text-red-600 transition-colors hover:bg-red-50 active:bg-red-100"
                  >
                    <i className="ri-logout-box-line mr-2"></i>
                    Cerrar Sesión
                  </button>
                </div>
              )}

              {!user && (
                <div className="mt-3 space-y-2 border-t border-gray-200 pt-3">
                  <a
                    href="/auth/login"
                    onClick={() => setIsMenuOpen(false)}
                    className="block w-full rounded-lg px-4 py-3 text-center font-medium text-gray-700 transition-colors hover:bg-gray-50 active:bg-gray-100"
                  >
                    Iniciar Sesión
                  </a>
                  <a
                    href="/auth/register"
                    onClick={() => setIsMenuOpen(false)}
                    className="bg-primary block w-full rounded-lg px-4 py-3 text-center font-medium text-white transition-colors hover:bg-cyan-700 active:bg-cyan-800"
                  >
                    Registrarse
                  </a>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
