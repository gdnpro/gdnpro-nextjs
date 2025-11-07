"use client"

import { supabaseBrowser } from "@/utils/supabase/client"
import { useParams, useSearchParams, useRouter } from "next/navigation"
import { useState, useEffect, Suspense } from "react"
import type { Profile } from "@/interfaces/Profile"

const supabase = supabaseBrowser()

function CheckoutContent() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const freelancerId = params.freelancerId as string

  const [freelancer, setFreelancer] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState("")

  const [formData, setFormData] = useState({
    projectTitle: searchParams.get("title") || "",
    projectDescription: searchParams.get("description") || "",
    amount: searchParams.get("amount") || "",
    duration: "1-2 semanas",
    requirements: "",
  })

  useEffect(() => {
    loadFreelancer()
  }, [freelancerId])

  const loadFreelancer = async () => {
    try {
      if (!freelancerId) {
        throw new Error("ID de freelancer requerido")
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", freelancerId)
        .eq("user_type", "freelancer")
        .single()

      if (error) throw error
      if (!data) throw new Error("Freelancer no encontrado")

      setFreelancer(data)
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error"
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault()
    setProcessing(true)
    setError("")

    try {
      // Validaciones
      if (!formData.projectTitle.trim()) {
        throw new Error("El título del proyecto es requerido")
      }
      if (!formData.amount || parseFloat(formData.amount) < 5) {
        throw new Error("El monto mínimo es $5 USD")
      }
      if (parseFloat(formData.amount) > 10000) {
        throw new Error("El monto máximo es $10,000 USD")
      }

      console.log("💳 Starting payment process...")

      // Obtener token de autenticación
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) {
        throw new Error("Debes estar autenticado para realizar un pago")
      }

      // Crear sesión de pago con Stripe
      const response = await fetch(
        "https://kdmdhhhppizzlhvauofe.supabase.co/functions/v1/stripe-payments",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            action: "create-payment-session",
            freelancerId: freelancer?.id,
            amount: parseFloat(formData.amount),
            currency: "usd",
            projectTitle: formData.projectTitle,
            projectDescription: formData.projectDescription,
            successUrl: `${window.location.origin}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
            cancelUrl: `${window.location.origin}/payment/cancel`,
            contractData: {
              projectTitle: formData.projectTitle,
              projectDescription: formData.projectDescription,
              duration: formData.duration,
              requirements: formData.requirements,
            },
          }),
        },
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Error al crear la sesión de pago")
      }

      console.log("✅ Payment session created, redirecting...")

      // Redirigir a Stripe Checkout
      window.location.href = data.checkout_url
    } catch (error: unknown) {
      console.error("❌ Payment error:", error)
      const errorMessage = error instanceof Error ? error.message : "Unknown error"
      setError(errorMessage)
    } finally {
      setProcessing(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-cyan-600"></div>
          <p className="mt-4 text-lg font-medium text-gray-700">
            Cargando información del freelancer...
          </p>
        </div>
      </div>
    )
  }

  if (error && !freelancer) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-4">
        <div className="w-full max-w-md text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-red-100 to-red-50 ring-4 ring-red-100">
            <i className="ri-error-warning-line text-3xl text-red-600"></i>
          </div>
          <h2 className="mb-3 text-2xl font-bold text-gray-900">Error</h2>
          <p className="mb-6 text-gray-600">{error}</p>
          <button
            onClick={() => router.push("/freelancers")}
            className="cursor-pointer rounded-xl bg-gradient-to-r from-cyan-600 to-teal-600 px-6 py-3 text-white shadow-lg shadow-cyan-500/30 transition-all hover:scale-105 hover:shadow-xl hover:shadow-cyan-500/40"
          >
            Ver Freelancers
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 pt-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Modern Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-teal-500 text-white shadow-lg shadow-cyan-500/30">
            <i className="ri-bank-card-line text-2xl"></i>
          </div>
          <h1 className="mb-3 text-4xl font-bold text-gray-900 sm:text-5xl">
            Contratar Freelancer
          </h1>
          <p className="text-lg text-gray-600">
            Completa los detalles del proyecto y realiza el pago seguro
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Formulario de proyecto */}
          <div className="lg:col-span-2">
            <div className="overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-black/5">
              {/* Form Header with Gradient */}
              <div className="relative overflow-hidden bg-gradient-to-r from-cyan-600 via-cyan-500 to-teal-500 px-6 py-6 text-white sm:px-8 sm:py-8">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIyIi8+PC9nPjwvZz48L3N2Zz4=')] opacity-20"></div>
                <div className="relative z-10 flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 ring-1 ring-white/30 backdrop-blur-sm">
                    <i className="ri-file-edit-line text-2xl"></i>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold sm:text-3xl">Detalles del Proyecto</h2>
                    <p className="mt-1 text-sm text-cyan-100">
                      Completa la información de tu proyecto
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6 sm:p-8">
                {error && (
                  <div className="mb-6 rounded-xl border border-red-200 bg-gradient-to-br from-red-50 to-red-100 p-4 text-red-700 ring-1 ring-red-200">
                    <div className="flex items-start">
                      <div className="mr-3 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-200">
                        <i className="ri-error-warning-line text-sm"></i>
                      </div>
                      <div className="flex-1">
                        <strong className="font-semibold">Error:</strong>
                        <p className="mt-1 text-sm">{error}</p>
                      </div>
                    </div>
                  </div>
                )}

                <form onSubmit={handlePayment} className="space-y-6">
                  <div>
                    <label
                      htmlFor="projectTitle"
                      className="mb-2 block text-sm font-semibold text-gray-700"
                    >
                      Título del Proyecto *
                    </label>
                    <input
                      type="text"
                      id="projectTitle"
                      name="projectTitle"
                      required
                      value={formData.projectTitle}
                      onChange={handleInputChange}
                      placeholder="Ej: Desarrollo de sitio web corporativo"
                      className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 shadow-sm transition-all focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="projectDescription"
                      className="mb-2 block text-sm font-semibold text-gray-700"
                    >
                      Descripción del Proyecto *
                    </label>
                    <textarea
                      id="projectDescription"
                      name="projectDescription"
                      required
                      rows={5}
                      value={formData.projectDescription}
                      onChange={handleInputChange}
                      placeholder="Describe los detalles del proyecto, objetivos y expectativas..."
                      className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 shadow-sm transition-all focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <label
                        htmlFor="amount"
                        className="mb-2 block text-sm font-semibold text-gray-700"
                      >
                        Presupuesto (USD) *
                      </label>
                      <div className="relative">
                        <span className="absolute top-1/2 left-4 -translate-y-1/2 text-gray-500">
                          $
                        </span>
                        <input
                          type="number"
                          id="amount"
                          name="amount"
                          required
                          min="5"
                          max="10000"
                          step="0.01"
                          value={formData.amount}
                          onChange={handleInputChange}
                          placeholder="100.00"
                          className="w-full rounded-xl border border-gray-300 bg-white py-3 pr-4 pl-8 text-gray-900 shadow-sm transition-all focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 focus:outline-none"
                        />
                      </div>
                      <p className="mt-2 text-xs text-gray-500">Mínimo $5 - Máximo $10,000</p>
                    </div>

                    <div>
                      <label
                        htmlFor="duration"
                        className="mb-2 block text-sm font-semibold text-gray-700"
                      >
                        Duración Estimada
                      </label>
                      <select
                        id="duration"
                        name="duration"
                        value={formData.duration}
                        onChange={handleInputChange}
                        className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 pr-8 text-gray-900 shadow-sm transition-all focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 focus:outline-none"
                      >
                        <option value="1-3 días">1-3 días</option>
                        <option value="1 semana">1 semana</option>
                        <option value="1-2 semanas">1-2 semanas</option>
                        <option value="3-4 semanas">3-4 semanas</option>
                        <option value="1-2 meses">1-2 meses</option>
                        <option value="2+ meses">2+ meses</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="requirements"
                      className="mb-2 block text-sm font-semibold text-gray-700"
                    >
                      Requisitos Especiales
                    </label>
                    <textarea
                      id="requirements"
                      name="requirements"
                      rows={3}
                      value={formData.requirements}
                      onChange={handleInputChange}
                      placeholder="Cualquier requisito adicional o especificación técnica..."
                      className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 shadow-sm transition-all focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 focus:outline-none"
                    />
                  </div>

                  <div className="border-t border-gray-200 pt-6">
                    <button
                      type="submit"
                      disabled={processing}
                      className="group flex w-full cursor-pointer items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-cyan-600 to-teal-600 px-6 py-4 text-base font-semibold text-white shadow-lg shadow-cyan-500/30 transition-all hover:scale-[1.02] hover:shadow-xl hover:shadow-cyan-500/40 focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
                    >
                      {processing ? (
                        <>
                          <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                          Procesando...
                        </>
                      ) : (
                        <>
                          <i className="ri-secure-payment-line text-xl transition-transform group-hover:scale-110"></i>
                          Proceder al Pago Seguro
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>

          {/* Resumen del freelancer */}
          <div className="lg:col-span-1">
            <div className="sticky top-18 overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-black/5">
              {/* Freelancer Header with Gradient */}
              <div className="relative overflow-hidden bg-gradient-to-br from-cyan-500 to-teal-500 px-6 py-6 text-white">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIyIi8+PC9nPjwvZz48L3N2Zz4=')] opacity-20"></div>
                <div className="relative z-10">
                  <h3 className="mb-4 text-xl font-bold">Freelancer Seleccionado</h3>

                  <div className="flex items-center gap-4">
                    <div className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white/20 ring-2 ring-white/30 backdrop-blur-sm">
                      {freelancer?.avatar_url ? (
                        <img
                          src={freelancer.avatar_url}
                          alt={freelancer.full_name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <i className="ri-user-line text-2xl"></i>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="truncate text-lg font-semibold">{freelancer?.full_name}</h4>
                      <div className="mt-1 flex items-center text-sm text-cyan-100">
                        <i className="ri-star-fill mr-1 text-yellow-300"></i>
                        <span className="font-medium">
                          {freelancer?.rating?.toFixed(1) || "5.0"}
                        </span>
                        <span className="mx-2">•</span>
                        <span>{freelancer?.total_reviews || 0} reseñas</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <div className="mb-6 space-y-4">
                  <div className="flex items-center gap-3 rounded-xl bg-gradient-to-br from-cyan-50 to-teal-50 p-3 ring-1 ring-cyan-100">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-teal-500 text-white shadow-lg shadow-cyan-500/30">
                      <i className="ri-money-dollar-circle-line text-lg"></i>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-600">Tarifa por hora</p>
                      <p className="text-base font-bold text-gray-900">
                        ${freelancer?.hourly_rate}/hora
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 rounded-xl bg-gradient-to-br from-emerald-50 to-green-50 p-3 ring-1 ring-emerald-100">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-green-500 text-white shadow-lg shadow-emerald-500/30">
                      <i className="ri-time-line text-lg"></i>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-600">Experiencia</p>
                      <p className="text-base font-bold text-gray-900">
                        {freelancer?.experience_years} años
                      </p>
                    </div>
                  </div>
                </div>

                {freelancer?.skills && freelancer.skills.length > 0 && (
                  <div className="mb-6">
                    <h5 className="mb-3 text-sm font-semibold text-gray-900">Habilidades</h5>
                    <div className="flex flex-wrap gap-2">
                      {freelancer.skills.slice(0, 6).map((skill: string, index: number) => (
                        <span
                          key={index}
                          className="inline-flex items-center rounded-full bg-gradient-to-r from-cyan-100 to-teal-100 px-3 py-1 text-xs font-medium text-cyan-800 ring-1 ring-cyan-200"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-3 rounded-xl border border-gray-200 bg-gradient-to-br from-gray-50 to-white p-4">
                  <div className="flex items-start gap-3 text-sm text-gray-600">
                    <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100">
                      <i className="ri-shield-check-line text-xs text-emerald-600"></i>
                    </div>
                    <span>Pago protegido por Stripe</span>
                  </div>
                  <div className="flex items-start gap-3 text-sm text-gray-600">
                    <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100">
                      <i className="ri-refund-line text-xs text-emerald-600"></i>
                    </div>
                    <span>100% garantía de satisfacción</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Checkout() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-cyan-600"></div>
            <p className="mt-4 text-lg font-medium text-gray-700">Cargando...</p>
          </div>
        </div>
      }
    >
      <CheckoutContent />
    </Suspense>
  )
}
