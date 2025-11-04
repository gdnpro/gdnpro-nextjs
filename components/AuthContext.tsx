"use client"

import React, { createContext, useContext, useEffect, useState } from "react"
import type { Session, User } from "@supabase/supabase-js"
import { supabaseBrowser } from "@/utils/supabase/client"
import type { Profile } from "@/interfaces/Profile"

// Initialize supabase client only on client-side
const getSupabase = () => {
  if (typeof window === "undefined") {
    return null
  }
  try {
    return supabaseBrowser()
  } catch {
    return null
  }
}

interface AuthContextType {
  profile: User | null
  user: Profile | null
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
  const [user, setUser] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    let mounted = true

    const init = async () => {
      // Wait for window and localStorage to be available (client-side only)
      if (typeof window === "undefined") {
        setLoading(false)
        return
      }

      // Wait for localStorage to be ready (some browsers need a moment)
      let retries = 0
      while (typeof window.localStorage === "undefined" && retries < 10) {
        await new Promise((resolve) => setTimeout(resolve, 50))
        retries++
      }

      const supabase = getSupabase()
      if (!supabase) {
        setLoading(false)
        return
      }

      // Use getSession() instead of getUser() to properly restore sessions from localStorage
      // getSession() reads from localStorage/cookies, while getUser() makes an API call
      try {
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession()

        if (!mounted) return

        if (sessionError) {
          console.error("Error getting session:", sessionError)
          setProfile(null)
          setIsAuthenticated(false)
          setUser(null)
          setLoading(false)
          return
        }

        const user = session?.user ?? null
        setProfile(user)
        setIsAuthenticated(!!user)

        if (user) {
          try {
            const { data, error } = await supabase!
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
      } catch (error) {
        console.error("Error initializing auth:", error)
        setProfile(null)
        setIsAuthenticated(false)
        setUser(null)
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    init()

    const supabase = getSupabase()
    if (!supabase) {
      setLoading(false)
      return
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event: string, session: Session | null) => {
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
