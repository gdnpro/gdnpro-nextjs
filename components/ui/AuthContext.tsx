"use client"

import React, { createContext, useContext, useEffect, useState } from "react"
import { Session, User } from "@supabase/supabase-js"
import { supabaseBrowser } from "@/utils/supabase/client"
import type { Profile } from "@/interfaces/Profile"

interface AuthContextType {
  user: User | null
  profile: Profile | null
  loading: boolean
  isAuthenticated: boolean
  refreshAuth: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  isAuthenticated: false,
  refreshAuth: () => Promise.resolve(),
})

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  const supabase = supabaseBrowser()

  const loadAuth = async () => {
    if (!supabase) return

    try {
      setLoading(true)
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession()
      if (error) throw error

      const currentUser = session?.user ?? null
      setUser(currentUser)

      if (currentUser) {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", currentUser.id)
          .single()

        if (error && error.code !== "PGRST116") {
          console.error("Error loading profile:", error)
          setProfile(null)
        } else {
          setProfile(data || null)
        }
      } else {
        setProfile(null)
      }
    } catch (error) {
      console.error("Error loading auth:", error)
      setUser(null)
      setProfile(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAuth()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event: any, session: any) => {
      await loadAuth()
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const value = {
    user,
    profile,
    loading,
    isAuthenticated: !!user,
    refreshAuth: loadAuth,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
