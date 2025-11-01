"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { supabase } from "@/db/supabase"

interface AuthContextType {
  profile: any
  user: any
  loading: boolean
  isAdmin: boolean
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType>({
  profile: null,
  user: null,
  loading: true,
  isAdmin: false,
  isAuthenticated: false,
})

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [profile, setProfile] = useState<any>(null)
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState<boolean>(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    if (typeof window === "undefined") return
    let mounted = true

    const initAuth = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (mounted) {
          setProfile(session?.user ?? null)

          const { data } = await supabase
            .from("profiles")
            .select("*")
            .eq("user_id", session?.user.id)
            .single()

          setUser(data)
          setIsAuthenticated(!!session?.user)
          setLoading(false)
        }

        const {
          data: { subscription },
        } = supabase.auth.onAuthStateChange(async (event, session) => {
          if (!mounted) return
          if (event === "SIGNED_OUT") {
            setUser(null)
            setLoading(false)
            setIsAuthenticated(false)
          }

          setProfile(session?.user ?? null)

          const { data } = await supabase
            .from("profiles")
            .select("*")
            .eq("user_id", session?.user.id)
            .single()

          if (data.role === "admin") setIsAdmin(true)

          setUser(data)
          setIsAuthenticated(!!session?.user)
          setLoading(false)
        })

        return () => {
          mounted = false
          subscription.unsubscribe()
        }
      } catch (err) {
        console.error("❌ Error en initAuth:", err)
        if (mounted) setLoading(false)
      }
    }

    initAuth()
  }, [])

  return (
    <AuthContext.Provider
      value={{ profile, user, loading, isAdmin, isAuthenticated }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
