"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/AuthContext"
import Link from "next/link"
import { supabaseBrowser } from "@/utils/supabase/client"

const supabase = supabaseBrowser()

export default function Login() {
  const navigate = useRouter()

  const { user } = useAuth() as {
    user: any
  }
  useEffect(() => {
    if (user) {
      navigate.push("/dashboard")
    }
  }, [user, navigate])

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    document.title = "Login | GDN Pro"
  }, [])

  // Función para login directo con verificación de perfil
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      // Intentar login con Supabase Auth
      const { data: authData, error: authError } =
        await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: password,
        })

      if (authError) {
        // Si es error de email no confirmado, intentar confirmar automáticamente
        if (authError.message?.includes("Email not confirmed")) {
          try {
            // Llamar al edge function para confirmar email
            const confirmResponse = await fetch(
              `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/auth-handler`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  action: "confirm_email_by_credentials",
                  email: email.trim(),
                  password: password,
                }),
              }
            )

            if (confirmResponse.ok) {
              // Reintentar login después de confirmar
              const { data: retryAuthData, error: retryAuthError } =
                await supabase.auth.signInWithPassword({
                  email: email.trim(),
                  password: password,
                })

              if (retryAuthError) {
                throw new Error(retryAuthError.message)
              }

              if (!retryAuthData.user) {
                throw new Error("No se pudo obtener información del usuario")
              }
              await processSuccessfulLogin(retryAuthData.user)
              return
            } else {
              throw new Error("No se pudo confirmar el email automáticamente")
            }
          } catch (confirmError) {
            console.error("❌ Error confirmando email:", confirmError)
            throw new Error(
              "Tu cuenta necesita verificación de email. Por favor contacta al soporte."
            )
          }
        } else {
          throw new Error(authError.message)
        }
      }

      if (!authData.user) {
        throw new Error("No se pudo obtener información del usuario")
      }

      await processSuccessfulLogin(authData.user)
    } catch (error: any) {
      console.error("💥 Error completo de login:", error)

      // Mostrar errores más específicos
      if (error.message?.includes("Invalid login credentials")) {
        setError("Email o contraseña incorrectos. Verifica tus datos.")
      } else if (error.message?.includes("Invalid API key")) {
        setError(
          "Error de configuración. Las credenciales han sido actualizadas."
        )
      } else if (error.message?.includes("network")) {
        setError("Error de conexión. Verifica tu internet.")
      } else if (error.message?.includes("Email not confirmed")) {
        setError(
          "Tu cuenta necesita verificación. Intentando confirmar automáticamente..."
        )
      } else {
        setError(error.message || "Error desconocido al iniciar sesión")
      }
    } finally {
      setLoading(false)
    }
  }

  // Función separada para procesar login exitoso
  const processSuccessfulLogin = async (user: any) => {
    // Obtener perfil del usuario
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("user_type, full_name")
      .eq("user_id", user.id)
      .single()

    if (profileError) {
      console.error("⚠️ Error al obtener perfil:", profileError)
      // Si no encuentra perfil, redirigir a completar registro
      navigate.push("/register")
      return
    }

    navigate.push("/dashboard")
  }

  const handleResendEmail = async () => {
    try {
      supabase.auth.resend({ type: "signup", email: email })
    } catch (error) {
      console.log(error)
    }
  }

  const handleResetPassword = () => {
    if (!email || email === "") {
      window.toast({
        dismissible: true,
        title: "Escribe tu email",
        location: "bottom-center",
        type: "warning",
        icon: true,
      })
      return
    }

    supabase.auth.resetPasswordForEmail(email).then(() => {
      window.toast({
        dismissible: true,
        title: "Se envió un email de recuperación",
        location: "bottom-center",
        type: "success",
        icon: true,
      })
    })
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <Link href="/">
            <img
              src="/logo.png"
              alt="GDN PRO"
              className="h-12 w-auto mx-auto mb-6"
            />
          </Link>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Inicia Sesión
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            ¿No tienes cuenta?{" "}
            <Link
              href="/auth/register"
              className="font-medium text-primary hover:text-cyan-500"
            >
              Regístrate aquí
            </Link>
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
              <div className="flex items-center">
                <i className="ri-error-warning-line mr-2"></i>
                <strong>Error:</strong>
              </div>
              <p className="mt-1">{error}</p>
              <button className="underline pt-2" onClick={handleResendEmail}>
                Reenviar verificación
              </button>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleLogin}>
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
              >
                Email
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm"
                  placeholder="tu@email.com"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700"
              >
                Contraseña
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap cursor-pointer transition-colors"
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Iniciando sesión...
                  </div>
                ) : (
                  "Iniciar Sesión"
                )}
              </button>
            </div>
          </form>

          <div className="w-full flex mt-2 justify-end">
            <button
              onClick={handleResetPassword}
              className="text-primary cursor-pointer hover:underline"
            >
              ¿Olvidaste la contraseña?
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
