"use client"

import { useRoutes, useNavigate, type NavigateFunction } from "react-router-dom"
import { useEffect } from "react"
import routes from "./config"
import MainLayout from "@/layouts/MainLayout"

let navigateResolver: (navigate: NavigateFunction) => void

declare global {
  interface Window {
    REACT_APP_NAVIGATE: NavigateFunction
  }
}

export const navigatePromise = new Promise<NavigateFunction>((resolve) => {
  navigateResolver = resolve
})

export function AppRoutes() {
  const element = useRoutes(routes)
  const navigate = useNavigate()

  useEffect(() => {
    if (!window.REACT_APP_NAVIGATE) {
      window.REACT_APP_NAVIGATE = navigate
      navigateResolver(navigate)
    }
  }, [navigate])

  return <MainLayout>{element}</MainLayout>
}
