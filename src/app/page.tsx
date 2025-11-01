import { BrowserRouter } from "react-router-dom"
import { AppRoutes } from "@/router/index"
import { AuthProvider } from "@/components/AuthContext"
import "./globals.css"
import "@/libs/toast"

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
