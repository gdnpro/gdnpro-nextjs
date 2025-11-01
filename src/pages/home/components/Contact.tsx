"use client"

import { useState } from "react"

export default function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    phone: "",
    service: "",
    budget: "",
    timeline: "",
    message: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<
    "idle" | "success" | "error"
  >("idle")
  const [submitMessage, setSubmitMessage] = useState("")

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitStatus("idle")

    try {
      // Validar campos requeridos
      if (
        !formData.name ||
        !formData.email ||
        !formData.service ||
        !formData.message
      ) {
        throw new Error("Por favor completa todos los campos requeridos")
      }

      // Validar límite de caracteres del mensaje
      if (formData.message.length > 500) {
        throw new Error("El mensaje no puede exceder 500 caracteres")
      }

      // Crear FormData para envío
      const submitData = new FormData()
      Object.entries(formData).forEach(([key, value]) => {
        if (value) submitData.append(key, value)
      })

      // Enviar al Edge Function
      const response = await fetch(
        `${import.meta.env.VITE_PUBLIC_SUPABASE_URL}/functions/v1/contact-form-handler`,
        {
          method: "POST",
          body: submitData,
        }
      )

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Error al enviar el mensaje")
      }

      setSubmitStatus("success")
      setSubmitMessage(
        "¡Mensaje enviado correctamente! Te contactaremos pronto."
      )

      // Limpiar formulario
      setFormData({
        name: "",
        email: "",
        company: "",
        phone: "",
        service: "",
        budget: "",
        timeline: "",
        message: "",
      })
    } catch (error) {
      console.error("Error enviando formulario:", error)
      setSubmitStatus("error")
      setSubmitMessage(
        error instanceof Error ? error.message : "Error al enviar el mensaje"
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section id="contact" className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Información de Contacto
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            ¿Tienes un proyecto en mente? Cuéntanos sobre tu idea y te
            ayudaremos a hacerla realidad.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Información de Contacto */}
          <div className="space-y-8">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-6">
                Hablemos de tu proyecto
              </h3>
              <p className="text-gray-600 mb-8">
                Estamos aquí para ayudarte a transformar tus ideas en soluciones
                digitales exitosas. Contáctanos y descubre cómo podemos impulsar
                tu negocio.
              </p>
            </div>

            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <i className="ri-map-pin-line text-xl text-primary"></i>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">Ubicación</h4>
                  <p className="text-gray-600">Nueva Jersey, Estados Unidos</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <i className="ri-mail-line text-xl text-primary"></i>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">Email</h4>
                  <p className="text-gray-600">contact@gdnpro.com</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <i className="ri-time-line text-xl text-primary"></i>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">Horario</h4>
                  <p className="text-gray-600">Lun - Sab: 9:00 AM - 8:00 PM</p>
                </div>
              </div>
            </div>

            <div className="bg-primary/10 rounded-lg p-6">
              <h4 className="font-semibold text-gray-900 mb-3">
                <i className="ri-lightbulb-line text-primary mr-2"></i>
                ¿Por qué elegirnos?
              </h4>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-center">
                  <i className="ri-check-line text-primary mr-2"></i>
                  Experiencia comprobada en proyectos exitosos
                </li>
                <li className="flex items-center">
                  <i className="ri-check-line text-primary mr-2"></i>
                  Equipo de desarrolladores especializados
                </li>
                <li className="flex items-center">
                  <i className="ri-check-line text-primary mr-2"></i>
                  Soporte continuo y mantenimiento
                </li>
                <li className="flex items-center">
                  <i className="ri-check-line text-primary mr-2"></i>
                  Precios competitivos y transparentes
                </li>
              </ul>
            </div>
          </div>

          {/* Formulario de Contacto */}
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">
              Solicita una Cotización
            </h3>

            {submitStatus === "success" && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center">
                  <i className="ri-check-circle-line text-green-600 mr-2"></i>
                  <p className="text-green-800">{submitMessage}</p>
                </div>
              </div>
            )}

            {submitStatus === "error" && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center">
                  <i className="ri-error-warning-line text-red-600 mr-2"></i>
                  <p className="text-red-800">{submitMessage}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Nombres y Email */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Nombre Completo *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full transition-colors px-4 py-3 focus:outline-none border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                    placeholder="Tu nombre completo"
                  />
                </div>

                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Email *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 transition-colors border focus:outline-none border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                    placeholder="tu@email.com"
                  />
                </div>
              </div>

              {/* Empresa y Teléfono */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label
                    htmlFor="company"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Empresa
                  </label>
                  <input
                    type="text"
                    id="company"
                    name="company"
                    value={formData.company}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 transition-colors focus:outline-none border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                    placeholder="Nombre de tu empresa"
                  />
                </div>

                <div>
                  <label
                    htmlFor="phone"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 transition-colors focus:outline-none border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                    placeholder="+000 000 0000"
                  />
                </div>
              </div>

              {/* Servicio */}
              <div>
                <label
                  htmlFor="service"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Tipo de Servicio *
                </label>
                <select
                  id="service"
                  name="service"
                  value={formData.service}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 transition-colors focus:outline-none border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm pr-8"
                >
                  <option value="">Selecciona un servicio</option>
                  <option value="Desarrollo Web">Desarrollo Web</option>
                  <option value="Aplicación Móvil">Aplicación Móvil</option>
                  <option value="Diseño UI/UX">Diseño UI/UX</option>
                  <option value="E-commerce">E-commerce</option>
                  <option value="Marketing Digital">Marketing Digital</option>
                  <option value="Consultoría">Consultoría</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>

              {/* Presupuesto y Timeline */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label
                    htmlFor="budget"
                    className="block text-sm  font-medium text-gray-700 mb-2"
                  >
                    Presupuesto Estimado *
                  </label>
                  <select
                    id="budget"
                    name="budget"
                    value={formData.budget}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 transition-colors focus:outline-none py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm pr-8"
                  >
                    <option value="">Selecciona un rango</option>
                    <option value="Menos de $1,000">Menos de $1,000</option>
                    <option value="$1,000 - $2,000">$1,000 - $2,000</option>
                    <option value="$2,000 - $5,000">$2,000 - $5,000</option>
                    <option value="$5,000 - $10,000">$5,000 - $10,000</option>
                    <option value="$10,000 - $25,000">$10,000 - $25,000</option>
                    <option value="Más de $25,000">Más de $25,000</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="timeline"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Timeline del Proyecto *
                  </label>
                  <select
                    id="timeline"
                    name="timeline"
                    value={formData.timeline}
                    onChange={handleInputChange}
                    required
                    className="w-full transition-colors focus:outline-none px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm pr-8"
                  >
                    <option value="">Selecciona un timeline</option>
                    <option value="1-2 semanas">1-2 semanas</option>
                    <option value="2-4 semanas">2-4 semanas</option>
                    <option value="1 mes">1 mes</option>
                    <option value="2-3 meses">2-3 meses</option>
                    <option value="3-6 meses">3-6 meses</option>
                    <option value="Más de 6 meses">Más de 6 meses</option>
                  </select>
                </div>
              </div>

              {/* Mensaje */}
              <div>
                <label
                  htmlFor="message"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Descripción del Proyecto *
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  required
                  rows={5}
                  maxLength={500}
                  className="w-full transition-colors focus:outline-none px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm resize-none"
                  placeholder="Cuéntanos sobre tu proyecto, objetivos, funcionalidades requeridas, etc."
                />
                <div className="flex justify-between items-center mt-2">
                  <p className="text-xs text-gray-500">
                    Describe tu proyecto con el mayor detalle posible
                  </p>
                  <span
                    className={`text-xs ${formData.message.length > 450 ? "text-red-600" : "text-gray-500"}`}
                  >
                    {formData.message.length}/500
                  </span>
                </div>
              </div>

              {/* Botón de enviar */}
              <button
                type="submit"
                disabled={isSubmitting || formData.message.length > 500}
                className="w-full bg-primary text-white py-3 px-6 rounded-lg hover:bg-cyan-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center">
                    <i className="ri-loader-4-line animate-spin mr-2"></i>
                    Enviando...
                  </span>
                ) : (
                  <span className="flex items-center justify-center">
                    <i className="ri-send-plane-line mr-2"></i>
                    Enviar Mensaje
                  </span>
                )}
              </button>

              <p className="text-xs text-gray-500 text-center">
                Al enviar este formulario, aceptas que nos pongamos en contacto
                contigo para discutir tu proyecto.
              </p>
            </form>
          </div>
        </div>
      </div>
    </section>
  )
}
