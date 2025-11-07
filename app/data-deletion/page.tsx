"use client"

import { useEffect, useState } from "react"

export default function DataDeletion() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    requestType: "",
    description: "",
    verification: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle")
  const [submitMessage, setSubmitMessage] = useState("")

  useEffect(() => {
    document.title = "Eliminación de Datos | GDN Pro"
    window.scrollTo(0, 0)
  }, [])

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
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
      if (!formData.name || !formData.email || !formData.requestType || !formData.description) {
        throw new Error("Por favor completa todos los campos requeridos")
      }

      // Validar límite de caracteres
      if (formData.description.length > 500) {
        throw new Error("La descripción no puede exceder 500 caracteres")
      }

      // Simular envío (aquí conectarías con tu sistema real)
      await new Promise((resolve) => setTimeout(resolve, 2000))

      setSubmitStatus("success")
      setSubmitMessage(
        "Solicitud enviada correctamente. Te contactaremos en 24-48 horas para procesar tu solicitud.",
      )

      // Limpiar formulario
      setFormData({
        name: "",
        email: "",
        phone: "",
        requestType: "",
        description: "",
        verification: "",
      })
    } catch (error) {
      console.error("Error enviando solicitud:", error)
      setSubmitStatus("error")
      setSubmitMessage(error instanceof Error ? error.message : "Error al enviar la solicitud")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="pt-24 pb-16">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="mb-4 text-4xl font-bold text-gray-900">Eliminación de Datos de Usuario</h1>
          <p className="text-lg text-gray-600">
            Solicita la eliminación de tus datos personales de nuestros sistemas
          </p>
        </div>

        {/* Content */}
        <div className="prose prose-lg max-w-none">
          <div className="mb-8 rounded-lg border border-red-200 bg-red-50 p-6">
            <h2 className="mb-3 text-xl font-semibold text-red-900">
              <i className="ri-delete-bin-line mr-2"></i>
              Derecho a la Eliminación de Datos
            </h2>
            <p className="text-red-800">
              Tienes derecho a solicitar la eliminación de tus datos personales de nuestros
              sistemas. Este proceso es irreversible y puede afectar el acceso a ciertos servicios.
            </p>
          </div>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-bold text-gray-900">¿Qué Datos Podemos Eliminar?</h2>

            <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="rounded-lg border border-green-200 bg-green-50 p-6">
                <h3 className="mb-3 text-lg font-semibold text-green-800">
                  <i className="ri-check-line mr-2"></i>
                  Datos Eliminables
                </h3>
                <ul className="list-disc space-y-1 pl-6 text-green-800">
                  <li>Información de perfil personal</li>
                  <li>Datos de contacto</li>
                  <li>Preferencias de usuario</li>
                  <li>Historial de comunicaciones</li>
                  <li>Datos de marketing</li>
                  <li>Cookies y datos de navegación</li>
                </ul>
              </div>

              <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-6">
                <h3 className="mb-3 text-lg font-semibold text-yellow-800">
                  <i className="ri-alert-line mr-2"></i>
                  Datos que Debemos Conservar
                </h3>
                <ul className="list-disc space-y-1 pl-6 text-yellow-800">
                  <li>Información fiscal y contable (10 años)</li>
                  <li>Contratos y documentos legales</li>
                  <li>Datos requeridos por ley</li>
                  <li>Información de transacciones</li>
                  <li>Registros de auditoría</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Formulario de Solicitud */}
          <section className="mb-8">
            <h2 className="mb-6 text-2xl font-bold text-gray-900">
              Formulario de Solicitud de Eliminación
            </h2>

            <div className="rounded-lg border border-gray-200 bg-white p-8 shadow-lg">
              {submitStatus === "success" && (
                <div className="mb-6 rounded-lg border border-green-200 bg-green-50 p-4">
                  <div className="flex items-center">
                    <i className="ri-check-circle-line mr-2 text-green-600"></i>
                    <p className="text-green-800">{submitMessage}</p>
                  </div>
                </div>
              )}

              {submitStatus === "error" && (
                <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4">
                  <div className="flex items-center">
                    <i className="ri-error-warning-line mr-2 text-red-600"></i>
                    <p className="text-red-800">{submitMessage}</p>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div>
                    <label htmlFor="name" className="mb-2 block text-sm font-medium text-gray-700">
                      Nombre Completo *
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-transparent focus:ring-2 focus:ring-red-500"
                      placeholder="Tu nombre completo"
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="mb-2 block text-sm font-medium text-gray-700">
                      Email *
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-transparent focus:ring-2 focus:ring-red-500"
                      placeholder="tu@email.com"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="phone" className="mb-2 block text-sm font-medium text-gray-700">
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-transparent focus:ring-2 focus:ring-red-500"
                    placeholder="+1 (555) 123-4567"
                  />
                </div>

                <div>
                  <label
                    htmlFor="requestType"
                    className="mb-2 block text-sm font-medium text-gray-700"
                  >
                    Tipo de Solicitud *
                  </label>
                  <select
                    id="requestType"
                    name="requestType"
                    value={formData.requestType}
                    onChange={handleInputChange}
                    required
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 pr-8 text-sm focus:border-transparent focus:ring-2 focus:ring-red-500"
                  >
                    <option value="">Selecciona el tipo de solicitud</option>
                    <option value="eliminacion-completa">Eliminación Completa de Datos</option>
                    <option value="eliminacion-parcial">Eliminación Parcial de Datos</option>
                    <option value="desactivacion-cuenta">Desactivación de Cuenta</option>
                    <option value="limitacion-procesamiento">Limitación de Procesamiento</option>
                    <option value="opt-out-marketing">Opt-out de Marketing</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="description"
                    className="mb-2 block text-sm font-medium text-gray-700"
                  >
                    Descripción de la Solicitud *
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    required
                    rows={5}
                    maxLength={500}
                    className="w-full resize-none rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-transparent focus:ring-2 focus:ring-red-500"
                    placeholder="Describe específicamente qué datos quieres eliminar y por qué..."
                  />
                  <div className="mt-2 flex items-center justify-between">
                    <p className="text-xs text-gray-500">
                      Especifica qué datos quieres eliminar y el motivo
                    </p>
                    <span
                      className={`text-xs ${formData.description.length > 450 ? "text-red-600" : "text-gray-500"}`}
                    >
                      {formData.description.length}/500
                    </span>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="verification"
                    className="mb-2 block text-sm font-medium text-gray-700"
                  >
                    Verificación de Identidad
                  </label>
                  <input
                    type="text"
                    id="verification"
                    name="verification"
                    value={formData.verification}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-transparent focus:ring-2 focus:ring-red-500"
                    placeholder="Últimos 4 dígitos de tu teléfono registrado"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Para verificar tu identidad, proporciona información adicional que tengas
                    registrada con nosotros
                  </p>
                </div>

                <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
                  <div className="flex items-start">
                    <i className="ri-alert-line mt-1 mr-3 text-yellow-600"></i>
                    <div className="text-sm text-yellow-800">
                      <p className="mb-2 font-semibold">Importante:</p>
                      <ul className="list-disc space-y-1 pl-4">
                        <li>La eliminación de datos es un proceso irreversible</li>
                        <li>Puede afectar tu acceso a servicios y proyectos activos</li>
                        <li>El proceso puede tomar hasta 30 días hábiles</li>
                        <li>Algunos datos deben conservarse por obligaciones legales</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || formData.description.length > 500}
                  className="w-full rounded-lg bg-red-600 px-6 py-3 font-medium whitespace-nowrap text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center">
                      <i className="ri-loader-4-line mr-2 animate-spin"></i>
                      Enviando Solicitud...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center">
                      <i className="ri-delete-bin-line mr-2"></i>
                      Enviar Solicitud de Eliminación
                    </span>
                  )}
                </button>

                <p className="text-center text-xs text-gray-500">
                  Al enviar esta solicitud, confirmas que entiendes las consecuencias de la
                  eliminación de datos.
                </p>
              </form>
            </div>
          </section>

          {/* Información Adicional */}
          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-bold text-gray-900">Información Adicional</h2>

            <div className="rounded-lg border border-blue-200 bg-blue-50 p-6">
              <h3 className="mb-4 text-lg font-semibold text-blue-800">
                <i className="ri-customer-service-2-line mr-2"></i>
                ¿Necesitas Ayuda?
              </h3>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <h4 className="mb-2 font-semibold text-blue-800">Contacto Directo</h4>
                  <ul className="space-y-2 text-cyan-700">
                    <li>
                      <i className="ri-mail-line mr-2"></i>
                      <strong>Email:</strong> contact@gdnpro.com
                    </li>
                    <li>
                      <i className="ri-time-line mr-2"></i>
                      <strong>Horario:</strong> Lun - Sab: 9:00 AM - 8:00 PM
                    </li>
                  </ul>
                </div>

                <div>
                  <h4 className="mb-2 font-semibold text-blue-800">Tiempo de Respuesta</h4>
                  <ul className="space-y-2 text-cyan-700">
                    <li>
                      <i className="ri-time-line mr-2"></i>
                      <strong>Confirmación:</strong> 24-48 horas
                    </li>
                    <li>
                      <i className="ri-calendar-line mr-2"></i>
                      <strong>Procesamiento:</strong> 1-3 días
                    </li>
                    <li>
                      <i className="ri-check-line mr-2"></i>
                      <strong>Confirmación final:</strong> Por email
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Footer Legal */}
          <div className="mt-12 border-t border-gray-200 pt-8">
            <div className="rounded-lg bg-gray-50 p-6">
              <p className="text-center text-sm text-gray-600">
                Este proceso cumple con la Ley Federal de Protección de Datos Personales en Posesión
                de los Particulares (LFPDPPP) y el Reglamento General de Protección de Datos (GDPR).
              </p>
              <p className="mt-2 text-center text-xs text-gray-500">
                Para más información, consulta nuestra Política de Privacidad
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
