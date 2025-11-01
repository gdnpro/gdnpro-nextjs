"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useNavigate } from "react-router-dom"
import { supabase } from "@/db/supabase"

export default function SuccessPayment() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const sessionId = searchParams.get("session_id")

  const [loading, setLoading] = useState(true)
  const [paymentData, setPaymentData] = useState<any>(null)
  const [error, setError] = useState("")

  useEffect(() => {
    if (sessionId) {
      verifyPayment()
    } else {
      setError("ID de sesión no encontrado")
      setLoading(false)
    }
  }, [sessionId])

  const verifyPayment = async () => {
    try {
      console.log("🔍 Verificando pago con sesión:", sessionId)

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
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Error al verificar el pago")
      }

      console.log("✅ Pago verificado:", data)
      setPaymentData(data)
    } catch (error: any) {
      console.error("❌ Error verificando pago:", error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const goToDashboard = () => {
    navigate("/dashboard/client")
  }

  const goToChat = () => {
    // Navegar al chat con el freelancer
    navigate("/dashboard/client?tab=messages")
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Verificando tu pago...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="ri-error-warning-line text-2xl text-red-600"></i>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Error en la Verificación
          </h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="space-y-3">
            <button
              onClick={() => window.location.reload()}
              className="w-full px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-cyan-700 transition-colors cursor-pointer whitespace-nowrap"
            >
              Intentar de Nuevo
            </button>
            <button
              onClick={goToDashboard}
              className="w-full px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer whitespace-nowrap"
            >
              Ir al Dashboard
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          {/* Icono de éxito */}
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="ri-check-line text-2xl text-green-600"></i>
          </div>

          {/* Título */}
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            ¡Pago Exitoso!
          </h2>

          <p className="text-gray-600 mb-6">
            Tu pago ha sido procesado correctamente. El freelancer ha sido
            notificado y pronto se pondrá en contacto contigo.
          </p>

          {/* Detalles del pago */}
          {paymentData?.transaction && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
              <h3 className="font-semibold text-gray-900 mb-3">
                Detalles del Pago
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Proyecto:</span>
                  <span className="font-medium">
                    {paymentData.transaction.project_title}
                  </span>
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
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                    <i className="ri-check-line mr-1"></i>
                    Pagado
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Información adicional */}
          <div className="bg-blue-50 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                <i className="ri-information-line text-primary text-sm"></i>
              </div>
              <div className="text-left">
                <h4 className="font-medium text-blue-900 mb-1">¿Qué sigue?</h4>
                <p className="text-sm text-blue-800">
                  El proyecto se ha creado automáticamente y el freelancer puede
                  comenzar a trabajar. Puedes comunicarte con él a través del
                  chat interno.
                </p>
              </div>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="space-y-3">
            <button
              onClick={goToChat}
              className="w-full flex items-center justify-center px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-cyan-700 transition-colors cursor-pointer whitespace-nowrap"
            >
              <i className="ri-chat-3-line mr-2"></i>
              Chatear con el Freelancer
            </button>

            <button
              onClick={goToDashboard}
              className="w-full px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer whitespace-nowrap"
            >
              Ir al Dashboard
            </button>
          </div>

          {/* Footer de seguridad */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-center text-xs text-gray-500">
              <i className="ri-shield-check-line mr-1 text-emerald-600"></i>
              <span>Transacción protegida por Stripe</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
