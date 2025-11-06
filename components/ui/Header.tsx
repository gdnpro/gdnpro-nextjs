"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import NotificationBell from "@/components/NotificationBell"
import { useAuth } from "@/components/ui/AuthContext"
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

  const menuItems = [
    { label: "Inicio", url: "/" },
    { label: "Servicios", url: "/#services" },
    { label: "Portafolio", url: "/#portfolio" },
    { label: "Equipo", url: "/#team" },
    { label: "Freelancers", url: "/freelancers" },
    { label: "Contacto", url: "/#contact" },
  ]

  return (
    <header className="fixed top-0 right-0 left-0 z-50 bg-white/95 px-4 shadow-sm backdrop-blur-sm sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex h-16 items-center justify-between gap-8">
          <a href="/" className={`${user ? "hidden md:block" : "block"} cursor-pointer`}>
            <img src="/logo.png" alt="GDN PRO" className="h-10 w-auto" />
          </a>

          {!loading && user && (
            <div className="flex items-center space-x-3 md:hidden">
              <NotificationBell />
              <div className="bg-primary/10 mr-3 flex size-8 items-center justify-center overflow-hidden rounded-full sm:mr-4">
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
            </div>
          )}

          {/* Desktop Menu */}
          <ul className="hidden items-center gap-x-8 md:flex">
            {menuItems.map((item, index) => (
              <li
                key={index}
                className="hover:text-primary cursor-pointer font-medium text-gray-700 transition-colors"
              >
                <a href={item.url}>{item.label}</a>
              </li>
            ))}
          </ul>

          {/* Right section desktop */}
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

          {/* Mobile Menu */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="hover:text-primary text-gray-700"
            >
              <i
                className={`text-2xl transition-transform ${
                  isMenuOpen ? "ri-close-line rotate-90" : "ri-menu-line"
                }`}
              ></i>
            </button>
          </div>
        </div>

        {isMenuOpen && (
          <div className="md:hidden" ref={mobileMenuRef}>
            <div className="space-y-1 px-2 pt-2 pb-3">
              <ul>
                {menuItems.map((item, index) => (
                  <li
                    key={index}
                    className="hover:text-primary block w-full rounded-lg px-3 py-3 text-left font-medium text-gray-700 transition-all hover:bg-gray-50"
                  >
                    <a href={item.url}>{item.label}</a>
                  </li>
                ))}
              </ul>

              {user && (
                <div className="mt-3 space-y-2 border-t pt-3">
                  <a
                    href="/dashboard"
                    className="block w-full px-3 py-3 text-left text-gray-700 hover:bg-gray-50"
                  >
                    Dashboard
                  </a>
                  <button
                    onClick={handleLogout}
                    className="block w-full px-3 py-3 text-left text-red-600 hover:bg-red-50"
                  >
                    Cerrar Sesión
                  </button>
                </div>
              )}

              {!user && (
                <div className="mt-3 space-y-2 border-t pt-3">
                  <a
                    href="/auth/login"
                    className="block w-full px-3 py-3 text-left text-gray-700 hover:bg-gray-50"
                  >
                    Iniciar Sesión
                  </a>
                  <a
                    href="/auth/register"
                    className="bg-primary block w-full rounded-lg px-3 py-3 text-left font-medium text-white hover:bg-cyan-700"
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
