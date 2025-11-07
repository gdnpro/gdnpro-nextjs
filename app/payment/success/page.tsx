"use client"

import { supabaseBrowser } from "@/utils/supabase/client"
import { useSearchParams, useRouter } from "next/navigation"
import { useState, useEffect, Suspense } from "react"
import type { PaymentData } from "@/interfaces/PaymentData"

const supabase = supabaseBrowser()

function SuccessPaymentContent() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null)
  const [error, setError] = useState("")
  const [freelancerInfo, setFreelancerInfo] = useState<{
    full_name: string
    avatar_url?: string
  } | null>(null)

  useEffect(() => {
    // Try multiple ways to get the session_id
    const getSessionId = () => {
      // First try from searchParams
      let sessionId = searchParams.get("session_id")

      // If not found, try from URL directly (fallback)
      if (!sessionId && typeof window !== "undefined") {
        const urlParams = new URLSearchParams(window.location.search)
        sessionId = urlParams.get("session_id")
      }

      // Also check for other possible parameter names
      if (!sessionId) {
        sessionId = searchParams.get("sessionId") || searchParams.get("stripe_session_id")
      }

      return sessionId
    }

    const sessionId = getSessionId()

    if (sessionId) {
      verifyPayment(sessionId)
    } else {
      console.error("❌ Session ID not found in URL params:", {
        searchParams: searchParams.toString(),
        windowLocation: typeof window !== "undefined" ? window.location.search : "N/A",
      })
      setError("ID de sesión no encontrado en los parámetros de la URL")
      setLoading(false)
    }
  }, [searchParams])

  const verifyPayment = async (sessionId?: string) => {
    try {
      // Get session_id from parameter or try to get it again
      let finalSessionId = sessionId || searchParams.get("session_id")

      // Fallback: try to get from URL directly
      if (!finalSessionId && typeof window !== "undefined") {
        const urlParams = new URLSearchParams(window.location.search)
        finalSessionId = urlParams.get("session_id")
      }

      // Also check for other possible parameter names
      if (!finalSessionId) {
        finalSessionId = searchParams.get("sessionId") || searchParams.get("stripe_session_id")
      }

      if (!finalSessionId) {
        throw new Error("ID de sesión no encontrado en los parámetros de la URL")
      }

      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) {
        throw new Error("Sesión de usuario no encontrada")
      }

      // First, fetch the transaction to get contract data
      const { data: transaction } = await supabase
        .from("transactions")
        .select("*")
        .eq("stripe_session_id", finalSessionId)
        .single()

      // Prepare contractData from transaction if available
      const contractData = transaction
        ? {
            projectTitle: transaction.project_title || "",
            projectDescription: transaction.project_description || "",
            duration: "1-2 semanas", // Default duration
            requirements: "",
          }
        : undefined

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
            sessionId: finalSessionId,
            ...(contractData && { contractData }),
          }),
        },
      )

      // Read response body once as text to avoid consumption issues
      let responseText: string
      try {
        responseText = await response.text()
      } catch (err) {
        throw new Error(
          `Error reading response: ${err instanceof Error ? err.message : "Unknown error"}`,
        )
      }

      // Check response status after reading
      if (!response.ok) {
        // Try to parse error message from JSON
        let errorMessage = "Error al verificar el pago"
        try {
          const errorData = JSON.parse(responseText)
          errorMessage = errorData.error || errorMessage
        } catch {
          // If JSON parsing fails, use the text directly or status
          errorMessage = responseText || `Error ${response.status}: ${response.statusText}`
        }
        throw new Error(errorMessage)
      }

      // Parse response body only if status is ok
      let data: any
      try {
        data = JSON.parse(responseText)
      } catch (err) {
        throw new Error(
          `Error parsing response: ${err instanceof Error ? err.message : "Invalid JSON"}`,
        )
      }

      console.log("✅ Payment verified:", data)

      // Ensure transaction is saved/updated with success status
      if (data.success) {
        // Get user profile to get the correct client_id
        const { data: profile } = await supabase
          .from("profiles")
          .select("id")
          .eq("user_id", session.user.id)
          .single()

        // Check if transaction exists
        const { data: existingTransaction } = await supabase
          .from("transactions")
          .select("*")
          .eq("stripe_session_id", finalSessionId)
          .single()

        if (existingTransaction) {
          // Update existing transaction with paid status
          const { error: updateError } = await supabase
            .from("transactions")
            .update({
              status: "paid",
              paid_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq("stripe_session_id", finalSessionId)

          if (updateError) {
            console.error("Error updating transaction:", updateError)
          } else {
            console.log("✅ Transaction updated with paid status")
            // Reload the transaction to get updated data
            const { data: updatedTransaction } = await supabase
              .from("transactions")
              .select("*")
              .eq("stripe_session_id", finalSessionId)
              .single()
            if (updatedTransaction && data.transaction) {
              data.transaction = { ...data.transaction, ...updatedTransaction }
            }

            // Load freelancer info if available
            if (updatedTransaction.freelancer_id) {
              const { data: freelancer } = await supabase
                .from("profiles")
                .select("full_name, avatar_url")
                .eq("id", updatedTransaction.freelancer_id)
                .single()

              if (freelancer) {
                setFreelancerInfo(freelancer)
              }
            }
          }
        } else if (data.transaction) {
          // Create new transaction record if it doesn't exist
          const transactionData = {
            stripe_session_id: sessionId,
            freelancer_id: data.transaction.freelancer_id || "",
            client_id: data.transaction.client_id || profile?.id || "",
            amount: data.transaction.amount || 0,
            currency: data.transaction.currency || "usd",
            status: "paid" as const,
            project_title: data.transaction.project_title || "",
            project_description: data.transaction.project_description || "",
            paid_at: new Date().toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }

          const { error: insertError } = await supabase.from("transactions").insert(transactionData)

          if (insertError) {
            console.error("Error creating transaction:", insertError)
          } else {
            console.log("✅ Transaction created with paid status")

            // Load freelancer info if available
            if (data.transaction.freelancer_id) {
              const { data: freelancer } = await supabase
                .from("profiles")
                .select("full_name, avatar_url")
                .eq("id", data.transaction.freelancer_id)
                .single()

              if (freelancer) {
                setFreelancerInfo(freelancer)
              }
            }
          }
        }
      }

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

  const goToProjects = () => {
    router.push("/dashboard?tab=projects")
  }

  const goToChat = () => {
    router.push("/dashboard?tab=messages")
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-50">
        <div className="text-center">
          <div className="mx-auto mb-4 h-16 w-16 animate-spin rounded-full border-4 border-cyan-200 border-t-cyan-600"></div>
          <p className="text-lg font-semibold text-gray-700">Verificando tu pago...</p>
          <p className="mt-2 text-sm text-gray-500">Por favor espera un momento</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-50 px-4">
        <div className="w-full max-w-md text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-red-100 to-red-50 ring-4 ring-red-100">
            <i className="ri-error-warning-line text-3xl text-red-600"></i>
          </div>
          <h2 className="mb-3 text-2xl font-bold text-gray-900">Error en la Verificación</h2>
          <p className="mb-6 text-gray-600">{error}</p>
          <div className="space-y-3">
            <button
              onClick={() => window.location.reload()}
              className="w-full cursor-pointer rounded-xl bg-gradient-to-r from-cyan-600 to-teal-600 px-6 py-3 text-white shadow-lg shadow-cyan-500/30 transition-all hover:scale-105 hover:shadow-xl hover:shadow-cyan-500/40"
            >
              Intentar de Nuevo
            </button>
            <button
              onClick={goToDashboard}
              className="w-full cursor-pointer rounded-xl border-2 border-gray-300 bg-white px-6 py-3 text-gray-700 transition-all hover:bg-gray-50"
            >
              Ir al Dashboard
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 pt-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        {/* Success Card */}
        <div className="overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-black/5">
          {/* Success Header with Gradient */}
          <div className="relative overflow-hidden bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 px-6 py-12 text-white sm:px-8 sm:py-16">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIyIi8+PC9nPjwvZz48L3N2Zz4=')] opacity-20"></div>
            <div className="relative z-10 text-center">
              {/* Success Icon */}
              <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-white/20 ring-4 ring-white/30 backdrop-blur-sm">
                <i className="ri-checkbox-circle-fill text-5xl text-white"></i>
              </div>

              {/* Title */}
              <h1 className="mb-3 text-4xl font-bold sm:text-5xl">¡Pago Exitoso!</h1>
              <p className="text-lg text-green-100 sm:text-xl">
                Tu pago ha sido procesado correctamente
              </p>
            </div>
          </div>

          <div className="p-6 sm:p-8">
            {/* Notification Message */}
            <div className="mb-6 rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50 p-4 ring-1 ring-blue-100">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100">
                  <i className="ri-notification-line text-xl text-blue-600"></i>
                </div>
                <div className="flex-1">
                  <h3 className="mb-1 font-semibold text-blue-900">Proyecto Creado</h3>
                  <p className="text-sm text-blue-800">
                    El freelancer ha sido notificado y pronto se pondrá en contacto contigo. Puedes
                    comunicarte con él a través del chat interno.
                  </p>
                </div>
              </div>
            </div>

            {/* Payment Details */}
            {paymentData?.transaction && (
              <div className="mb-6 overflow-hidden rounded-2xl border border-gray-200 bg-gradient-to-br from-gray-50 to-white shadow-sm">
                <div className="border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white px-6 py-4">
                  <h3 className="text-lg font-bold text-gray-900">Detalles del Pago</h3>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="rounded-xl bg-gradient-to-br from-cyan-50 to-teal-50 p-4 ring-1 ring-cyan-100">
                      <div className="mb-2 flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500 to-teal-500 text-white">
                          <i className="ri-file-text-line text-sm"></i>
                        </div>
                        <span className="text-xs font-medium text-gray-600">Proyecto</span>
                      </div>
                      <p className="text-base font-semibold text-gray-900">
                        {paymentData.transaction.project_title}
                      </p>
                    </div>

                    <div className="rounded-xl bg-gradient-to-br from-emerald-50 to-green-50 p-4 ring-1 ring-emerald-100">
                      <div className="mb-2 flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-green-500 text-white">
                          <i className="ri-money-dollar-circle-line text-sm"></i>
                        </div>
                        <span className="text-xs font-medium text-gray-600">Monto</span>
                      </div>
                      <p className="text-base font-semibold text-emerald-700">
                        ${paymentData.transaction.amount}{" "}
                        {paymentData.transaction.currency.toUpperCase()}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-green-100 to-emerald-100 px-4 py-3 ring-1 ring-green-200">
                    <i className="ri-checkbox-circle-fill text-green-600"></i>
                    <span className="font-semibold text-green-800">Estado: Pagado</span>
                  </div>
                </div>
              </div>
            )}

            {/* Freelancer Info */}
            {freelancerInfo && (
              <div className="mb-6 overflow-hidden rounded-2xl border border-gray-200 bg-gradient-to-br from-white to-gray-50 shadow-sm">
                <div className="border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white px-6 py-4">
                  <h3 className="text-lg font-bold text-gray-900">Freelancer Asignado</h3>
                </div>
                <div className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-cyan-100 to-teal-100 ring-2 ring-cyan-200">
                      {freelancerInfo.avatar_url ? (
                        <img
                          src={freelancerInfo.avatar_url}
                          alt={freelancerInfo.full_name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <i className="ri-user-line text-2xl text-cyan-600"></i>
                      )}
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900">
                        {freelancerInfo.full_name}
                      </h4>
                      <p className="text-sm text-gray-600">Listo para comenzar tu proyecto</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <button
                onClick={goToChat}
                className="group flex cursor-pointer items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-cyan-600 to-teal-600 px-6 py-4 font-semibold text-white shadow-lg shadow-cyan-500/30 transition-all hover:scale-105 hover:shadow-xl hover:shadow-cyan-500/40"
              >
                <i className="ri-chat-3-line text-xl transition-transform group-hover:scale-110"></i>
                <span>Chatear con Freelancer</span>
              </button>

              <button
                onClick={goToProjects}
                className="group flex cursor-pointer items-center justify-center gap-3 rounded-xl border-2 border-gray-300 bg-white px-6 py-4 font-semibold text-gray-700 transition-all hover:scale-105 hover:bg-gray-50"
              >
                <i className="ri-folder-line text-xl transition-transform group-hover:scale-110"></i>
                <span>Ver Mis Proyectos</span>
              </button>
            </div>

            <button
              onClick={goToDashboard}
              className="mt-3 w-full cursor-pointer rounded-xl border border-gray-300 bg-gray-50 px-6 py-3 text-sm font-medium text-gray-700 transition-all hover:bg-gray-100"
            >
              Ir al Dashboard
            </button>

            {/* Security Footer */}
            <div className="mt-8 border-t border-gray-200 pt-6">
              <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-gray-500">
                <div className="flex items-center gap-2">
                  <i className="ri-shield-check-line text-emerald-600"></i>
                  <span>Transacción protegida por Stripe</span>
                </div>
                <div className="flex items-center gap-2">
                  <i className="ri-lock-line text-emerald-600"></i>
                  <span>Pago seguro y encriptado</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function SuccessPayment() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-50">
          <div className="text-center">
            <div className="mx-auto mb-4 h-16 w-16 animate-spin rounded-full border-4 border-cyan-200 border-t-cyan-600"></div>
            <p className="text-lg font-semibold text-gray-700">Cargando...</p>
          </div>
        </div>
      }
    >
      <SuccessPaymentContent />
    </Suspense>
  )
}
