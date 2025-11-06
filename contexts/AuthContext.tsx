// contexts/AuthContext.tsx
"use client"

import React, { createContext, useContext, useEffect, useState } from "react"
import { User } from "@supabase/supabase-js"
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
  refreshAuth: async () => {},
})

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  const supabase = supabaseBrowser()

  const loadAuth = async () => {
    if (!supabase) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)

      // FORZAR lectura de cookies → escribe en localStorage
      const { data, error } = await supabase.auth.getSession()

      if (error) {
        console.warn("getSession error:", error)
        setUser(null)
        setProfile(null)
        return
      }

      const currentUser = data.session?.user ?? null
      setUser(currentUser)

      if (currentUser) {
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", currentUser.id)
          .single()

        if (profileError && profileError.code !== "PGRST116") {
          console.error("Profile error:", profileError)
          setProfile(null)
        } else {
          setProfile(profileData || null)
        }
      } else {
        setProfile(null)
      }
    } catch (err) {
      console.error("loadAuth error:", err)
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
    } = supabase.auth.onAuthStateChange((event: any, session: any) => {
      const newUser = session?.user ?? null
      if (newUser?.id !== user?.id) {
        loadAuth()
      }
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
