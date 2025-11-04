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

      // Add timeout to prevent infinite loading
      const timeoutId = setTimeout(() => {
        if (mounted) {
          console.warn("Auth initialization timeout, setting loading to false")
          setProfile(null)
          setIsAuthenticated(false)
          setUser(null)
          setLoading(false)
        }
      }, 10000) // 10 second timeout

      try {
        // Use getUser() which validates with server and doesn't hang on corrupted localStorage
        // This is more reliable than getSession() when cache might be corrupted
        let user: User | null = null

        try {
          const getUserPromise = supabase.auth.getUser()
          const timeoutPromise = new Promise<{ data: { user: null }; error: Error }>(
            (_, reject) => {
              setTimeout(() => reject(new Error("Get user timeout")), 8000)
            },
          )

          const result = await Promise.race([getUserPromise, timeoutPromise])
          const userData = result as { data: { user: User | null }; error: any }

          if (userData.error) {
            console.error("Error getting user:", userData.error)
            user = null
            // If there's an error, clear potentially corrupted session
            try {
              await supabase.auth.signOut()
            } catch {}
          } else {
            user = userData.data.user
          }
        } catch (error: any) {
          // If getUser times out or fails, treat as no user
          console.warn("getUser() failed or timed out:", error.message)
          user = null
          // Clear potentially corrupted session
          try {
            await supabase.auth.signOut()
          } catch {}
        }

        clearTimeout(timeoutId)

        if (!mounted) return

        setProfile(user)
        setIsAuthenticated(!!user)

        if (user) {
          try {
            // Add timeout for profile fetch
            const profilePromise = supabase!
              .from("profiles")
              .select("*")
              .eq("user_id", user.id)
              .single()

            const profileTimeoutPromise = new Promise<{ data: null; error: Error }>((_, reject) =>
              setTimeout(() => reject(new Error("Profile fetch timeout")), 5000),
            )

            const profileResult = await Promise.race([profilePromise, profileTimeoutPromise]).catch(
              (error) => {
                if (error.message === "Profile fetch timeout") {
                  return { data: null, error: new Error("Profile fetch timeout") }
                }
                throw error
              },
            )

            const { data, error } = profileResult as { data: any; error: any }

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
        clearTimeout(timeoutId)
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
