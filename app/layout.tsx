"use client"

import "./globals.css"
import "./butterup.css"
import LiveChat from "@/components/ui/LiveChat"
import Footer from "@/components/ui/Footer"
import Navigation from "@/components/ui/Navigation"
import "@/libs/toast"
import { usePathname } from "next/navigation"
import { AuthProvider } from "@/components/AuthContext"
import { useEffect } from "react"
import { butterup } from "@/libs/toast"

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const noLayoutRoutes = ["/login", "/register"]
  const hideLayout = noLayoutRoutes.includes(usePathname())

  useEffect(() => {
    window.toast = butterup.toast.bind(butterup)
  }, [])

  return (
    <html lang="es">
      <head>
        <title>GDN Pro</title>
        <meta
          name="description"
          content="GDN Pro es una plataforma de freelancers y clientes"
        />
        <meta
          name="keywords"
          content="freelancers, clientes, trabajo, proyecto, trabajo remoto, trabajo freelance, trabajo online, trabajo remoto, trabajo freelance, trabajo online"
        />
        <meta name="author" content="GDN Pro" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="robots" content="index, follow" />
        <meta name="googlebot" content="index, follow" />

        <link
          href="https://fonts.googleapis.com/css2?family=Pacifico&display=swap"
          rel="stylesheet"
        ></link>
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
        ></link>
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/remixicon/4.5.0/remixicon.min.css"
        ></link>
      </head>
      <body>
        <AuthProvider>
          {!hideLayout && <Navigation />}

          <main>{children}</main>

          {!hideLayout && <LiveChat />}
          {!hideLayout && <Footer />}
        </AuthProvider>
      </body>
    </html>
  )
}
