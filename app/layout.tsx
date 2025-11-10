"use client"

import "./globals.css"
import "./butterup.css"
import LiveChat from "@/components/ui/LiveChat"
import Footer from "@/components/ui/Footer"
import Header from "@/components/ui/Header"
import "@/libs/toast"
import "@/libs/i18n"
import { usePathname } from "next/navigation"
import { AuthProvider } from "@/contexts/AuthContext"
import { useEffect, useState } from "react"
import { butterup } from "@/libs/toast"
import SEO from "@/components/SEO"
import { GoToTop } from "@/components/ui/GoToTop"
import { Analytics } from "@vercel/analytics/next"
import { useTranslation } from "react-i18next"
import { SpeedInsights } from "@vercel/speed-insights/next"

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const noLayoutRoutes = ["/auth/login", "/auth/register"]
  const hideLayout = noLayoutRoutes.includes(usePathname())
  const { i18n, t } = useTranslation()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    window.toast = butterup.toast.bind(butterup)
    setMounted(true)
  }, [])

  useEffect(() => {
    // Update HTML lang attribute when language changes (only after mount to avoid hydration mismatch)
    if (mounted) {
      document.documentElement.lang = i18n.language
    }
  }, [i18n.language, mounted])

  // Use fallback language for initial render to match server
  const initialLang = mounted ? i18n.language : "es"

  return (
    <html data-scroll-behavior="smooth" lang={initialLang}>
      <head>
        <SEO
          title={t("seo.title")}
          description={t("seo.description")}
          canonical="https://gdnpro.com"
        />
      </head>
      <body>
        <Analytics />
        <SpeedInsights />

        <AuthProvider>
          {!hideLayout && <Header />}

          <main>{children}</main>

          {!hideLayout && <GoToTop />}
          {!hideLayout && <LiveChat />}
          {!hideLayout && <Footer />}
        </AuthProvider>
      </body>
    </html>
  )
}
