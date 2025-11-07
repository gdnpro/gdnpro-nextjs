"use client"

import { useActionState, useEffect, useState } from "react"
import Link from "next/link"
import { supabaseBrowser } from "@/utils/supabase/client"
import { actions } from "@/actions"
import { type FormState } from "@/validations/auth"
import { FormError } from "./FormError"
import { useRouter, useSearchParams } from "next/navigation"
import { FormInfo } from "./FormInfo"
import { useAuth } from "@/contexts/AuthContext"

const INITIAL_STATE: FormState = {
  success: false,
  session: {
    access_token: "",
    refresh_token: "",
  },
  message: undefined,
  loading: false,
  error: undefined,
  fields: {
    email: "",
    password: "",
  },
  databaseErrors: null,
  serverErrors: null,
}

export function LoginForm() {
  const supabase = supabaseBrowser()
  const { refreshAuth } = useAuth()
  const [formState, formAction, pending] = useActionState(
    actions.auth.loginUserAction,
    INITIAL_STATE,
  )
  const navigate = useRouter()
  const searchParams = useSearchParams()

  const verified = searchParams.get("verified")
  const emailParam = searchParams.get("email")

  const [email, setEmail] = useState(emailParam ?? "")
  const [password, setPassword] = useState("")

  useEffect(() => {
    document.title = "Login | GDN Pro"
  }, [])

  useEffect(() => {
    if (formState.success) {
      refreshAuth().then(() => {
        navigate.push(formState.redirectTo ?? "/dashboard")
      })
    }
  }, [formState.success, navigate])

  const handleResendEmail = async () => {
    try {
      supabase.auth.resend({ type: "signup", email: email })
    } catch (error) {
      console.error("Error resending email:", error)
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
    <div className="flex min-h-screen flex-col justify-center bg-gray-50 py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <Link href="/">
            <img src="/logo.png" alt="GDN PRO" className="mx-auto mb-6 h-12 w-auto" />
          </Link>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">Inicia Sesión</h2>
          <p className="mt-2 text-sm text-gray-600">
            ¿No tienes cuenta?{" "}
            <Link href="/auth/register" className="text-primary font-medium hover:text-cyan-500">
              Regístrate aquí
            </Link>
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white px-4 py-8 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" action={formAction}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
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
                  className="block w-full appearance-none rounded-md border border-gray-300 px-3 py-3 sm:py-2 placeholder-gray-400 focus:border-cyan-500 focus:ring-cyan-500 focus:outline-none text-base sm:text-sm min-h-[44px]"
                  placeholder="tu@email.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
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
                  className="block w-full appearance-none rounded-md border border-gray-300 px-3 py-3 sm:py-2 placeholder-gray-400 focus:border-cyan-500 focus:ring-cyan-500 focus:outline-none text-base sm:text-sm min-h-[44px]"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <FormError
              error={formState.error ?? null}
              flag={formState.flag ?? null}
              handleResendEmail={handleResendEmail}
            />
            {emailParam && email === emailParam && verified === "false" && (
              <FormInfo
                info="Te enviamos un correo de verificación. Revisa tu bandeja antes de iniciar sesión."
                handleResendEmail={handleResendEmail}
              />
            )}

            <div>
              <button
                type="submit"
                disabled={pending}
                className="bg-primary flex w-full cursor-pointer justify-center rounded-md border border-transparent px-4 py-3 sm:py-2 text-base sm:text-sm font-medium whitespace-nowrap text-white shadow-sm transition-colors hover:bg-cyan-700 active:bg-cyan-800 focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 min-h-[44px] touch-manipulation"
              >
                {pending ? (
                  <div className="flex items-center">
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white"></div>
                    Iniciando sesión...
                  </div>
                ) : (
                  "Iniciar Sesión"
                )}
              </button>
            </div>
          </form>

          <div className="mt-2 flex w-full justify-end">
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
