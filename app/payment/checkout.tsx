"use client"

import { supabaseBrowser } from "@/utils/supabase/client"
import { useParams, useSearchParams } from "next/navigation"
import { useRouter } from "next/router"
import { useState, useEffect } from "react"
import type { Profile } from "@/interfaces/Profile"

const supabase = supabaseBrowser()

export default function Checkout() {
  const { freelancerId } = useParams()
  const searchParams = useSearchParams()
  const navigate = useRouter()

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
            successUrl: `${window.location.origin}/payment/success`,
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
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-emerald-600"></div>
          <p className="mt-4 text-gray-600">Cargando información del freelancer...</p>
        </div>
      </div>
    )
  }

  if (error && !freelancer) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <i className="ri-error-warning-line text-2xl text-red-600"></i>
          </div>
          <h2 className="mb-2 text-xl font-semibold text-gray-900">Error</h2>
          <p className="mb-4 text-gray-600">{error}</p>
          <button
            onClick={() => navigate.push("/freelancers")}
            className="cursor-pointer rounded-lg bg-emerald-600 px-6 py-2 whitespace-nowrap text-white transition-colors hover:bg-cyan-700"
          >
            Ver Freelancers
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-3xl font-bold text-gray-900">Contratar Freelancer</h1>
          <p className="text-gray-600">
            Completa los detalles del proyecto y realiza el pago seguro
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Formulario de proyecto */}
          <div className="lg:col-span-2">
            <div className="rounded-lg bg-white p-6 shadow-sm">
              <h2 className="mb-6 text-xl font-semibold text-gray-900">Detalles del Proyecto</h2>

              {error && (
                <div className="mb-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-red-600">
                  <div className="flex items-center">
                    <i className="ri-error-warning-line mr-2"></i>
                    <strong>Error:</strong>
                  </div>
                  <p className="mt-1">{error}</p>
                </div>
              )}

              <form onSubmit={handlePayment} className="space-y-6">
                <div>
                  <label
                    htmlFor="projectTitle"
                    className="mb-2 block text-sm font-medium text-gray-700"
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
                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label
                    htmlFor="projectDescription"
                    className="mb-2 block text-sm font-medium text-gray-700"
                  >
                    Descripción del Proyecto *
                  </label>
                  <textarea
                    id="projectDescription"
                    name="projectDescription"
                    required
                    rows={4}
                    value={formData.projectDescription}
                    onChange={handleInputChange}
                    placeholder="Describe los detalles del proyecto, objetivos y expectativas..."
                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label
                      htmlFor="amount"
                      className="mb-2 block text-sm font-medium text-gray-700"
                    >
                      Presupuesto (USD) *
                    </label>
                    <div className="relative">
                      <span className="absolute top-2 left-3 text-gray-500">$</span>
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
                        className="w-full rounded-md border border-gray-300 py-2 pr-3 pl-8 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>
                    <p className="mt-1 text-xs text-gray-500">Mínimo $5 - Máximo $10,000</p>
                  </div>

                  <div>
                    <label
                      htmlFor="duration"
                      className="mb-2 block text-sm font-medium text-gray-700"
                    >
                      Duración Estimada
                    </label>
                    <select
                      id="duration"
                      name="duration"
                      value={formData.duration}
                      onChange={handleInputChange}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 pr-8 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
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
                    className="mb-2 block text-sm font-medium text-gray-700"
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
                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div className="border-t pt-6">
                  <button
                    type="submit"
                    disabled={processing}
                    className="flex w-full cursor-pointer items-center justify-center rounded-md border border-transparent bg-emerald-600 px-4 py-3 text-sm font-medium whitespace-nowrap text-white shadow-sm hover:bg-cyan-700 focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {processing ? (
                      <>
                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white"></div>
                        Procesando...
                      </>
                    ) : (
                      <>
                        <i className="ri-secure-payment-line mr-2"></i>
                        Proceder al Pago Seguro
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Resumen del freelancer */}
          <div className="lg:col-span-1">
            <div className="sticky top-4 rounded-lg bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-lg font-semibold text-gray-900">Freelancer Seleccionado</h3>

              <div className="mb-4 flex items-center">
                <div className="mr-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
                  {freelancer?.avatar_url ? (
                    <img
                      src={freelancer.avatar_url}
                      alt={freelancer.full_name}
                      className="h-12 w-12 rounded-full object-cover"
                    />
                  ) : (
                    <i className="ri-user-line text-xl text-emerald-600"></i>
                  )}
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">{freelancer?.full_name}</h4>
                  <div className="flex items-center text-sm text-gray-600">
                    <i className="ri-star-fill mr-1 text-yellow-500"></i>
                    <span>{freelancer?.rating?.toFixed(1) || "5.0"}</span>
                    <span className="mx-2">•</span>
                    <span>{freelancer?.total_reviews || 0} reseñas</span>
                  </div>
                </div>
              </div>

              <div className="mb-6 space-y-3">
                <div className="flex items-center text-sm text-gray-600">
                  <i className="ri-money-dollar-circle-line mr-2 text-emerald-600"></i>
                  <span>${freelancer?.hourly_rate}/hora</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <i className="ri-time-line mr-2 text-emerald-600"></i>
                  <span>{freelancer?.experience_years} años de experiencia</span>
                </div>
              </div>

              {freelancer?.skills && freelancer.skills.length > 0 && (
                <div className="mb-6">
                  <h5 className="mb-2 text-sm font-medium text-gray-900">Habilidades</h5>
                  <div className="flex flex-wrap gap-1">
                    {freelancer.skills.slice(0, 6).map((skill: string, index: number) => (
                      <span
                        key={index}
                        className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-1 text-xs text-emerald-800"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="border-t pt-4">
                <div className="mb-2 flex items-center text-xs text-gray-500">
                  <i className="ri-shield-check-line mr-1 text-emerald-600"></i>
                  <span>Pago protegido por Stripe</span>
                </div>
                <div className="flex items-center text-xs text-gray-500">
                  <i className="ri-refund-line mr-1 text-emerald-600"></i>
                  <span>100% garantía de satisfacción</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
