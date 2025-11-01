"use client"

import { useEffect, useState } from "react"
import Layout from "@/components/Layout"

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
  const [submitStatus, setSubmitStatus] = useState<
    "idle" | "success" | "error"
  >("idle")
  const [submitMessage, setSubmitMessage] = useState("")

  useEffect(() => {
    document.title = "Eliminación de Datos | GDN Pro"
    window.scrollTo(0, 0)
  }, [])

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
        !formData.requestType ||
        !formData.description
      ) {
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
        "Solicitud enviada correctamente. Te contactaremos en 24-48 horas para procesar tu solicitud."
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
      setSubmitMessage(
        error instanceof Error ? error.message : "Error al enviar la solicitud"
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Layout>
      <div className="pt-24 pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Eliminación de Datos de Usuario
            </h1>
            <p className="text-lg text-gray-600">
              Solicita la eliminación de tus datos personales de nuestros
              sistemas
            </p>
          </div>

          {/* Content */}
          <div className="prose prose-lg max-w-none">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-8">
              <h2 className="text-xl font-semibold text-red-900 mb-3">
                <i className="ri-delete-bin-line mr-2"></i>
                Derecho a la Eliminación de Datos
              </h2>
              <p className="text-red-800">
                Tienes derecho a solicitar la eliminación de tus datos
                personales de nuestros sistemas. Este proceso es irreversible y
                puede afectar el acceso a ciertos servicios.
              </p>
            </div>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                ¿Qué Datos Podemos Eliminar?
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-green-800 mb-3">
                    <i className="ri-check-line mr-2"></i>
                    Datos Eliminables
                  </h3>
                  <ul className="list-disc pl-6 space-y-1 text-green-800">
                    <li>Información de perfil personal</li>
                    <li>Datos de contacto</li>
                    <li>Preferencias de usuario</li>
                    <li>Historial de comunicaciones</li>
                    <li>Datos de marketing</li>
                    <li>Cookies y datos de navegación</li>
                  </ul>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-yellow-800 mb-3">
                    <i className="ri-alert-line mr-2"></i>
                    Datos que Debemos Conservar
                  </h3>
                  <ul className="list-disc pl-6 space-y-1 text-yellow-800">
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
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Formulario de Solicitud de Eliminación
              </h2>

              <div className="bg-white border border-gray-200 rounded-lg p-8 shadow-lg">
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
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm"
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
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm"
                        placeholder="tu@email.com"
                      />
                    </div>
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
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm"
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="requestType"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Tipo de Solicitud *
                    </label>
                    <select
                      id="requestType"
                      name="requestType"
                      value={formData.requestType}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm pr-8"
                    >
                      <option value="">Selecciona el tipo de solicitud</option>
                      <option value="eliminacion-completa">
                        Eliminación Completa de Datos
                      </option>
                      <option value="eliminacion-parcial">
                        Eliminación Parcial de Datos
                      </option>
                      <option value="desactivacion-cuenta">
                        Desactivación de Cuenta
                      </option>
                      <option value="limitacion-procesamiento">
                        Limitación de Procesamiento
                      </option>
                      <option value="opt-out-marketing">
                        Opt-out de Marketing
                      </option>
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="description"
                      className="block text-sm font-medium text-gray-700 mb-2"
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
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm resize-none"
                      placeholder="Describe específicamente qué datos quieres eliminar y por qué..."
                    />
                    <div className="flex justify-between items-center mt-2">
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
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Verificación de Identidad
                    </label>
                    <input
                      type="text"
                      id="verification"
                      name="verification"
                      value={formData.verification}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm"
                      placeholder="Últimos 4 dígitos de tu teléfono registrado"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Para verificar tu identidad, proporciona información
                      adicional que tengas registrada con nosotros
                    </p>
                  </div>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-start">
                      <i className="ri-alert-line text-yellow-600 mr-3 mt-1"></i>
                      <div className="text-sm text-yellow-800">
                        <p className="font-semibold mb-2">Importante:</p>
                        <ul className="list-disc pl-4 space-y-1">
                          <li>
                            La eliminación de datos es un proceso irreversible
                          </li>
                          <li>
                            Puede afectar tu acceso a servicios y proyectos
                            activos
                          </li>
                          <li>El proceso puede tomar hasta 30 días hábiles</li>
                          <li>
                            Algunos datos deben conservarse por obligaciones
                            legales
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting || formData.description.length > 500}
                    className="w-full bg-red-600 text-white py-3 px-6 rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center justify-center">
                        <i className="ri-loader-4-line animate-spin mr-2"></i>
                        Enviando Solicitud...
                      </span>
                    ) : (
                      <span className="flex items-center justify-center">
                        <i className="ri-delete-bin-line mr-2"></i>
                        Enviar Solicitud de Eliminación
                      </span>
                    )}
                  </button>

                  <p className="text-xs text-gray-500 text-center">
                    Al enviar esta solicitud, confirmas que entiendes las
                    consecuencias de la eliminación de datos.
                  </p>
                </form>
              </div>
            </section>

            {/* Información Adicional */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Información Adicional
              </h2>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-blue-800 mb-4">
                  <i className="ri-customer-service-2-line mr-2"></i>
                  ¿Necesitas Ayuda?
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-blue-800 mb-2">
                      Contacto Directo
                    </h4>
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
                    <h4 className="font-semibold text-blue-800 mb-2">
                      Tiempo de Respuesta
                    </h4>
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
            <div className="border-t border-gray-200 pt-8 mt-12">
              <div className="bg-gray-50 rounded-lg p-6">
                <p className="text-sm text-gray-600 text-center">
                  Este proceso cumple con la Ley Federal de Protección de Datos
                  Personales en Posesión de los Particulares (LFPDPPP) y el
                  Reglamento General de Protección de Datos (GDPR).
                </p>
                <p className="text-xs text-gray-500 text-center mt-2">
                  Para más información, consulta nuestra Política de Privacidad
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
