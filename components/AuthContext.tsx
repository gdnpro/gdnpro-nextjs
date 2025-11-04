"use client"

import React, { createContext, useContext, useEffect, useState } from "react"
import type { Session, User } from "@supabase/supabase-js"
import { supabaseBrowser } from "@/utils/supabase/client"

const supabase = supabaseBrowser()

interface AuthContextType {
  profile: any
  user: any
  loading: boolean
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType>({
  profile: null,
  user: null,
  loading: true,
  isAuthenticated: false,
})

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [profile, setProfile] = useState<User | null>(null)
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    let mounted = true

    const init = async () => {
      // Use getSession() instead of getUser() to properly restore sessions from localStorage
      // getSession() reads from localStorage/cookies, while getUser() makes an API call
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!mounted) return

      const user = session?.user ?? null
      setProfile(user)
      setIsAuthenticated(!!user)

      if (user) {
        try {
          const { data, error } = await supabase
            .from("profiles")
            .select("*")
            .eq("user_id", user.id)
            .single()

          if (error) {
            console.error("Error loading profile:", error)
            setUser(null)
          } else {
            setUser(data)
          }
        } catch (error) {
          console.error("Error loading profile:", error)
          setUser(null)
        }
      } else {
        setUser(null)
      }

      setLoading(false)
    }

    init()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return

      const user = session?.user ?? null
      setProfile(user)
      setIsAuthenticated(!!user)

      if (user) {
        try {
          const { data, error } = await supabase
            .from("profiles")
            .select("*")
            .eq("user_id", user.id)
            .single()

          if (error) {
            console.error("Error loading profile:", error)
            setUser(null)
          } else {
            setUser(data)
          }
        } catch (error) {
          console.error("Error loading profile:", error)
          setUser(null)
        }
      } else {
        setUser(null)
      }

      setLoading(false)
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  return (
    <AuthContext.Provider value={{ profile, user, loading, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
