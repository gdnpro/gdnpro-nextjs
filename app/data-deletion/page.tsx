"use client"

import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"

export default function DataDeletion() {
  const { t } = useTranslation()
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
    document.title = t("dataDeletion.pageTitle")
    window.scrollTo(0, 0)
  }, [t])

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
        throw new Error(t("dataDeletion.form.errors.required"))
      }

      // Validar límite de caracteres
      if (formData.description.length > 500) {
        throw new Error(t("dataDeletion.form.errors.descriptionLength"))
      }

      // Simular envío (aquí conectarías con tu sistema real)
      await new Promise((resolve) => setTimeout(resolve, 2000))

      setSubmitStatus("success")
      setSubmitMessage(t("dataDeletion.form.success"))

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
        error instanceof Error ? error.message : t("dataDeletion.form.errors.submit"),
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="pt-24 pb-16">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="mb-4 text-4xl font-bold text-gray-900">{t("dataDeletion.title")}</h1>
          <p className="text-lg text-gray-600">{t("dataDeletion.subtitle")}</p>
        </div>

        {/* Content */}
        <div className="prose prose-lg max-w-none">
          <div className="mb-8 rounded-lg border border-red-200 bg-red-50 p-6">
            <h2 className="mb-3 text-xl font-semibold text-red-900">
              <i className="ri-delete-bin-line mr-2"></i>
              {t("dataDeletion.right.title")}
            </h2>
            <p className="text-red-800">{t("dataDeletion.right.description")}</p>
          </div>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-bold text-gray-900">
              {t("dataDeletion.section1.title")}
            </h2>

            <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="rounded-lg border border-green-200 bg-green-50 p-6">
                <h3 className="mb-3 text-lg font-semibold text-green-800">
                  <i className="ri-check-line mr-2"></i>
                  {t("dataDeletion.section1.deletable.title")}
                </h3>
                <ul className="list-disc space-y-1 pl-6 text-green-800">
                  {(t("dataDeletion.section1.deletable.items", { returnObjects: true }) as string[]).map(
                    (item, index) => (
                      <li key={index}>{item}</li>
                    ),
                  )}
                </ul>
              </div>

              <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-6">
                <h3 className="mb-3 text-lg font-semibold text-yellow-800">
                  <i className="ri-alert-line mr-2"></i>
                  {t("dataDeletion.section1.retained.title")}
                </h3>
                <ul className="list-disc space-y-1 pl-6 text-yellow-800">
                  {(t("dataDeletion.section1.retained.items", { returnObjects: true }) as string[]).map(
                    (item, index) => (
                      <li key={index}>{item}</li>
                    ),
                  )}
                </ul>
              </div>
            </div>
          </section>

          {/* Formulario de Solicitud */}
          <section className="mb-8">
            <h2 className="mb-6 text-2xl font-bold text-gray-900">
              {t("dataDeletion.form.title")}
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
                      {t("dataDeletion.form.fields.name")}
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-transparent focus:ring-2 focus:ring-red-500"
                      placeholder={t("dataDeletion.form.fields.namePlaceholder")}
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="mb-2 block text-sm font-medium text-gray-700">
                      {t("dataDeletion.form.fields.email")}
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-transparent focus:ring-2 focus:ring-red-500"
                      placeholder={t("dataDeletion.form.fields.emailPlaceholder")}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="phone" className="mb-2 block text-sm font-medium text-gray-700">
                    {t("dataDeletion.form.fields.phone")}
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-transparent focus:ring-2 focus:ring-red-500"
                    placeholder={t("dataDeletion.form.fields.phonePlaceholder")}
                  />
                </div>

                <div>
                  <label
                    htmlFor="requestType"
                    className="mb-2 block text-sm font-medium text-gray-700"
                  >
                    {t("dataDeletion.form.fields.requestType")}
                  </label>
                  <select
                    id="requestType"
                    name="requestType"
                    value={formData.requestType}
                    onChange={handleInputChange}
                    required
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 pr-8 text-sm focus:border-transparent focus:ring-2 focus:ring-red-500"
                  >
                    <option value="">{t("dataDeletion.form.fields.requestTypePlaceholder")}</option>
                    <option value="eliminacion-completa">
                      {t("dataDeletion.form.fields.requestTypes.complete")}
                    </option>
                    <option value="eliminacion-parcial">
                      {t("dataDeletion.form.fields.requestTypes.partial")}
                    </option>
                    <option value="desactivacion-cuenta">
                      {t("dataDeletion.form.fields.requestTypes.deactivate")}
                    </option>
                    <option value="limitacion-procesamiento">
                      {t("dataDeletion.form.fields.requestTypes.limit")}
                    </option>
                    <option value="opt-out-marketing">
                      {t("dataDeletion.form.fields.requestTypes.optout")}
                    </option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="description"
                    className="mb-2 block text-sm font-medium text-gray-700"
                  >
                    {t("dataDeletion.form.fields.description")}
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
                    placeholder={t("dataDeletion.form.fields.descriptionPlaceholder")}
                  />
                  <div className="mt-2 flex items-center justify-between">
                    <p className="text-xs text-gray-500">
                      {t("dataDeletion.form.fields.descriptionHint")}
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
                    {t("dataDeletion.form.fields.verification")}
                  </label>
                  <input
                    type="text"
                    id="verification"
                    name="verification"
                    value={formData.verification}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-transparent focus:ring-2 focus:ring-red-500"
                    placeholder={t("dataDeletion.form.fields.verificationPlaceholder")}
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    {t("dataDeletion.form.fields.verificationHint")}
                  </p>
                </div>

                <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
                  <div className="flex items-start">
                    <i className="ri-alert-line mt-1 mr-3 text-yellow-600"></i>
                    <div className="text-sm text-yellow-800">
                      <p className="mb-2 font-semibold">{t("dataDeletion.form.important.title")}</p>
                      <ul className="list-disc space-y-1 pl-4">
                        {(t("dataDeletion.form.important.items", { returnObjects: true }) as string[]).map(
                          (item, index) => (
                            <li key={index}>{item}</li>
                          ),
                        )}
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
                      {t("dataDeletion.form.submitting")}
                    </span>
                  ) : (
                    <span className="flex items-center justify-center">
                      <i className="ri-delete-bin-line mr-2"></i>
                      {t("dataDeletion.form.submit")}
                    </span>
                  )}
                </button>

                <p className="text-center text-xs text-gray-500">
                  {t("dataDeletion.form.confirmation")}
                </p>
              </form>
            </div>
          </section>

          {/* Información Adicional */}
          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-bold text-gray-900">
              {t("dataDeletion.section2.title")}
            </h2>

            <div className="rounded-lg border border-blue-200 bg-blue-50 p-6">
              <h3 className="mb-4 text-lg font-semibold text-blue-800">
                <i className="ri-customer-service-2-line mr-2"></i>
                {t("dataDeletion.section2.subtitle")}
              </h3>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <h4 className="mb-2 font-semibold text-blue-800">
                    {t("dataDeletion.section2.contact.title")}
                  </h4>
                  <ul className="space-y-2 text-cyan-700">
                    <li>
                      <i className="ri-mail-line mr-2"></i>
                      <strong>{t("dataDeletion.section2.contact.email")}</strong> contact@gdnpro.com
                    </li>
                    <li>
                      <i className="ri-time-line mr-2"></i>
                      <strong>{t("dataDeletion.section2.contact.schedule")}</strong>{" "}
                      {t("dataDeletion.section2.contact.scheduleValue")}
                    </li>
                  </ul>
                </div>

                <div>
                  <h4 className="mb-2 font-semibold text-blue-800">
                    {t("dataDeletion.section2.response.title")}
                  </h4>
                  <ul className="space-y-2 text-cyan-700">
                    <li>
                      <i className="ri-time-line mr-2"></i>
                      <strong>{t("dataDeletion.section2.response.confirmation")}</strong>{" "}
                      {t("dataDeletion.section2.response.confirmationValue")}
                    </li>
                    <li>
                      <i className="ri-calendar-line mr-2"></i>
                      <strong>{t("dataDeletion.section2.response.processing")}</strong>{" "}
                      {t("dataDeletion.section2.response.processingValue")}
                    </li>
                    <li>
                      <i className="ri-check-line mr-2"></i>
                      <strong>{t("dataDeletion.section2.response.final")}</strong>{" "}
                      {t("dataDeletion.section2.response.finalValue")}
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
                {t("dataDeletion.footer.compliance")}
              </p>
              <p className="mt-2 text-center text-xs text-gray-500">
                {t("dataDeletion.footer.moreInfo")}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
