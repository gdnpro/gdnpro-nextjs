import "./globals.css"
import "./butterup.css"
import SEO from "@/components/SEO"
import { Analytics } from "@vercel/analytics/next"
import ClientLayoutWrapper from "@/components/ClientLayoutWrapper"

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <SEO
          title="GDN Pro"
          description="GDN Pro es una plataforma..."
          canonical="https://gdnpro.com"
        />
      </head>

      <body>
        <Analytics />
        <ClientLayoutWrapper>{children}</ClientLayoutWrapper>
      </body>
    </html>
  )
}
