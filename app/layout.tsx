"use client"

import "./globals.css"
import "./butterup.css"
import LiveChat from "@/components/ui/LiveChat"
import Footer from "@/components/ui/Footer"
import Header from "@/components/ui/Header"
import "@/libs/toast"
import { usePathname } from "next/navigation"
import { AuthProvider } from "@/components/ui/AuthContext"
import { useEffect } from "react"
import { butterup } from "@/libs/toast"
import SEO from "@/components/SEO"
import { GoToTop } from "@/components/ui/GoToTop"
import { Analytics } from "@vercel/analytics/next"

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const noLayoutRoutes = ["/auth/login", "/auth/register"]
  const hideLayout = noLayoutRoutes.includes(usePathname())

  useEffect(() => {
    window.toast = butterup.toast.bind(butterup)
  }, [])

  return (
    <html data-scroll-behavior="smooth" lang="es">
      <head>
        <SEO
          title="GDN Pro"
          description="GDN Pro es una plataforma en la que desarrolladores freelancers y clientes en búsqueda de trabajadores se encuentran y llegan a acuerdos corporativos. En GDN PRO creamos soluciones digitales innovadoras. Desarrollo web, apps móviles y marketing digital de clase mundial."
          canonical="https://gdnpro.com"
        />
      </head>
      <body>
        <Analytics />

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
