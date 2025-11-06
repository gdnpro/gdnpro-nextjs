"use client"

import { usePathname } from "next/navigation"
import Header from "@/components/ui/Header"
import Footer from "@/components/ui/Footer"
import LiveChat from "@/components/ui/LiveChat"
import { GoToTop } from "@/components/ui/GoToTop"
import { AuthProvider } from "@/components/ui/AuthContext"
import { useEffect } from "react"
import { butterup } from "@/libs/toast"

export default function ClientLayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const noLayoutRoutes = ["/auth/login", "/auth/register"]
  const hideLayout = noLayoutRoutes.includes(pathname)

  useEffect(() => {
    window.toast = butterup.toast.bind(butterup)
  }, [])

  return (
    <AuthProvider>
      {!hideLayout && <Header />}

      <main>{children}</main>

      {!hideLayout && <GoToTop />}
      {!hideLayout && <LiveChat />}
      {!hideLayout && <Footer />}
    </AuthProvider>
  )
}
