import Footer from "@/components/Footer"
import Navigation from "@/components/Navigation"
import LiveChat from "@/components/ui/LiveChat"
import { useLocation } from "react-router-dom"

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const location = useLocation()
  const noLayoutRoutes = ["/login", "/register"]
  const hideLayout = noLayoutRoutes.includes(location.pathname)

  return (
    <>
      {!hideLayout && <Navigation />}
      <main>{children}</main>
      <LiveChat />
      {!hideLayout && <Footer />}
    </>
  )
}
