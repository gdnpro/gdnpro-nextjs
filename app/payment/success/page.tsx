"use client"

import { supabaseBrowser } from "@/utils/supabase/client"
import { useSearchParams, useRouter } from "next/navigation"
import { useState, useEffect, Suspense } from "react"
import type { PaymentData } from "@/interfaces/PaymentData"

const supabase = supabaseBrowser()

export default function SuccessPayment() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null)
  const [error, setError] = useState("")

  useEffect(() => {
    const sessionId = searchParams.get("session_id")
    if (sessionId) {
      verifyPayment()
    } else {
      setError("ID de sesión no encontrado")
      setLoading(false)
    }
  }, [searchParams])

  const verifyPayment = async () => {
    try {
      const sessionId = searchParams.get("session_id")
      if (!sessionId) {
        throw new Error("ID de sesión no encontrado")
      }

      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) {
        throw new Error("Sesión de usuario no encontrada")
      }

      const response = await fetch(
        "https://kdmdhhhppizzlhvauofe.supabase.co/functions/v1/stripe-payments",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            action: "verify-payment",
            sessionId: sessionId,
          }),
        },
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Error al verificar el pago")
      }

      console.log("✅ Payment verified:", data)
      setPaymentData(data)
    } catch (error: unknown) {
      console.error("❌ Error verifying payment:", error)
      const errorMessage = error instanceof Error ? error.message : "Unknown error"
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const goToDashboard = () => {
    router.push("/dashboard")
  }

  const goToChat = () => {
    // Navegar al chat con el freelancer
    router.push("/dashboard?tab=messages")
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-emerald-600"></div>
          <p className="mt-4 text-gray-600">Verificando tu pago...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="mx-auto max-w-md text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <i className="ri-error-warning-line text-2xl text-red-600"></i>
          </div>
          <h2 className="mb-2 text-xl font-semibold text-gray-900">Error en la Verificación</h2>
          <p className="mb-6 text-gray-600">{error}</p>
          <div className="space-y-3">
            <button
              onClick={() => window.location.reload()}
              className="w-full cursor-pointer rounded-lg bg-emerald-600 px-6 py-2 whitespace-nowrap text-white transition-colors hover:bg-cyan-700"
            >
              Intentar de Nuevo
            </button>
            <button
              onClick={goToDashboard}
              className="w-full cursor-pointer rounded-lg border border-gray-300 px-6 py-2 whitespace-nowrap text-gray-700 transition-colors hover:bg-gray-50"
            >
              Ir al Dashboard
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="border-primary mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2"></div>
          </div>
        </div>
      }
    >
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-md">
          <div className="rounded-lg bg-white p-8 text-center shadow-lg">
            {/* Icono de éxito */}
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <i className="ri-check-line text-2xl text-green-600"></i>
            </div>

            {/* Título */}
            <h2 className="mb-2 text-2xl font-bold text-gray-900">¡Pago Exitoso!</h2>

            <p className="mb-6 text-gray-600">
              Tu pago ha sido procesado correctamente. El freelancer ha sido notificado y pronto se
              pondrá en contacto contigo.
            </p>

            {/* Detalles del pago */}
            {paymentData?.transaction && (
              <div className="mb-6 rounded-lg bg-gray-50 p-4 text-left">
                <h3 className="mb-3 font-semibold text-gray-900">Detalles del Pago</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Proyecto:</span>
                    <span className="font-medium">{paymentData.transaction.project_title}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Monto:</span>
                    <span className="font-medium text-green-600">
                      ${paymentData.transaction.amount}{" "}
                      {paymentData.transaction.currency.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Estado:</span>
                    <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-1 text-xs text-green-800">
                      <i className="ri-check-line mr-1"></i>
                      Pagado
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Información adicional */}
            <div className="mb-6 rounded-lg bg-blue-50 p-4">
              <div className="flex items-start">
                <div className="mt-0.5 mr-3 flex h-6 w-6 items-center justify-center rounded-full bg-blue-100">
                  <i className="ri-information-line text-primary text-sm"></i>
                </div>
                <div className="text-left">
                  <h4 className="mb-1 font-medium text-blue-900">¿Qué sigue?</h4>
                  <p className="text-sm text-blue-800">
                    El proyecto se ha creado automáticamente y el freelancer puede comenzar a
                    trabajar. Puedes comunicarte con él a través del chat interno.
                  </p>
                </div>
              </div>
            </div>

            {/* Botones de acción */}
            <div className="space-y-3">
              <button
                onClick={goToChat}
                className="flex w-full cursor-pointer items-center justify-center rounded-lg bg-emerald-600 px-6 py-3 whitespace-nowrap text-white transition-colors hover:bg-cyan-700"
              >
                <i className="ri-chat-3-line mr-2"></i>
                Chatear con el Freelancer
              </button>

              <button
                onClick={goToDashboard}
                className="w-full cursor-pointer rounded-lg border border-gray-300 px-6 py-2 whitespace-nowrap text-gray-700 transition-colors hover:bg-gray-50"
              >
                Ir al Dashboard
              </button>
            </div>

            {/* Footer de seguridad */}
            <div className="mt-6 border-t border-gray-200 pt-4">
              <div className="flex items-center justify-center text-xs text-gray-500">
                <i className="ri-shield-check-line mr-1 text-emerald-600"></i>
                <span>Transacción protegida por Stripe</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Suspense>
  )
}
