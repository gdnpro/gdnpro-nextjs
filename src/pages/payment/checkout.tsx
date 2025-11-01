"use client"

import { useState, useEffect } from "react"
import { useParams, useNavigate, useSearchParams } from "react-router-dom"
import { supabase } from "@/db/supabase"

export default function Checkout() {
  const { freelancerId } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const [freelancer, setFreelancer] = useState<any>(null)
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
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
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

      console.log("💳 Iniciando proceso de pago...")

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
            freelancerId: freelancer.id,
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
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Error al crear la sesión de pago")
      }

      console.log("✅ Sesión de pago creada, redirigiendo...")

      // Redirigir a Stripe Checkout
      window.location.href = data.checkout_url
    } catch (error: any) {
      console.error("❌ Error en pago:", error)
      setError(error.message)
    } finally {
      setProcessing(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">
            Cargando información del freelancer...
          </p>
        </div>
      </div>
    )
  }

  if (error && !freelancer) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="ri-error-warning-line text-2xl text-red-600"></i>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => navigate("/freelancers")}
            className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-cyan-700 transition-colors cursor-pointer whitespace-nowrap"
          >
            Ver Freelancers
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Contratar Freelancer
          </h1>
          <p className="text-gray-600">
            Completa los detalles del proyecto y realiza el pago seguro
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Formulario de proyecto */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                Detalles del Proyecto
              </h2>

              {error && (
                <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
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
                    className="block text-sm font-medium text-gray-700 mb-2"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label
                    htmlFor="projectDescription"
                    className="block text-sm font-medium text-gray-700 mb-2"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="amount"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Presupuesto (USD) *
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-gray-500">
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
                        className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Mínimo $5 - Máximo $10,000
                    </p>
                  </div>

                  <div>
                    <label
                      htmlFor="duration"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Duración Estimada
                    </label>
                    <select
                      id="duration"
                      name="duration"
                      value={formData.duration}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 pr-8"
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
                    className="block text-sm font-medium text-gray-700 mb-2"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>

                <div className="border-t pt-6">
                  <button
                    type="submit"
                    disabled={processing}
                    className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap cursor-pointer"
                  >
                    {processing ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
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
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Freelancer Seleccionado
              </h3>

              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mr-3">
                  {freelancer?.avatar_url ? (
                    <img
                      src={freelancer.avatar_url}
                      alt={freelancer.full_name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <i className="ri-user-line text-emerald-600 text-xl"></i>
                  )}
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">
                    {freelancer?.full_name}
                  </h4>
                  <div className="flex items-center text-sm text-gray-600">
                    <i className="ri-star-fill text-yellow-500 mr-1"></i>
                    <span>{freelancer?.rating?.toFixed(1) || "5.0"}</span>
                    <span className="mx-2">•</span>
                    <span>{freelancer?.total_reviews || 0} reseñas</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-center text-sm text-gray-600">
                  <i className="ri-money-dollar-circle-line mr-2 text-emerald-600"></i>
                  <span>${freelancer?.hourly_rate}/hora</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <i className="ri-time-line mr-2 text-emerald-600"></i>
                  <span>
                    {freelancer?.experience_years} años de experiencia
                  </span>
                </div>
              </div>

              {freelancer?.skills && freelancer.skills.length > 0 && (
                <div className="mb-6">
                  <h5 className="text-sm font-medium text-gray-900 mb-2">
                    Habilidades
                  </h5>
                  <div className="flex flex-wrap gap-1">
                    {freelancer.skills
                      .slice(0, 6)
                      .map((skill: string, index: number) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-emerald-100 text-emerald-800"
                        >
                          {skill}
                        </span>
                      ))}
                  </div>
                </div>
              )}

              <div className="border-t pt-4">
                <div className="flex items-center text-xs text-gray-500 mb-2">
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
