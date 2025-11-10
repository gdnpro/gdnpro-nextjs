"use client"

import { useState } from "react"
import { useTranslation } from "react-i18next"

export default function Contact() {
  const { t } = useTranslation()
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
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle")
  const [submitMessage, setSubmitMessage] = useState("")

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
      if (!formData.name || !formData.email || !formData.service || !formData.message) {
        throw new Error(t("contact.form.errors.fillRequired"))
      }

      // Validar límite de caracteres del mensaje
      if (formData.message.length > 500) {
        throw new Error(t("contact.form.errors.messageTooLong"))
      }

      // Crear FormData para envío
      const submitData = new FormData()
      Object.entries(formData).forEach(([key, value]) => {
        if (value) submitData.append(key, value)
      })

      // Enviar al Edge Function
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/contact-form-handler`,
        {
          method: "POST",
          body: submitData,
        },
      )

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || t("contact.form.errors.errorSending"))
      }

      setSubmitStatus("success")
      setSubmitMessage(t("contact.form.success"))

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
        error instanceof Error ? error.message : t("contact.form.errors.errorSending"),
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section id="contact" className="bg-gray-50 py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-4xl font-bold text-gray-900">{t("contact.title")}</h2>
          <p className="mx-auto max-w-3xl text-xl text-gray-600">{t("contact.subtitle")}</p>
        </div>

        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
          {/* Información de Contacto */}
          <div className="space-y-8">
            <div>
              <h3 className="mb-6 text-2xl font-bold text-gray-900">
                {t("contact.talkAboutProject.title")}
              </h3>
              <p className="mb-8 text-gray-600">{t("contact.talkAboutProject.description")}</p>
            </div>

            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="bg-primary/10 flex h-12 w-12 shrink-0 items-center justify-center rounded-lg">
                  <i className="ri-map-pin-line text-primary text-xl"></i>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">{t("contact.info.location")}</h4>
                  <p className="text-gray-600">{t("contact.info.locationValue")}</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="bg-primary/10 flex h-12 w-12 shrink-0 items-center justify-center rounded-lg">
                  <i className="ri-mail-line text-primary text-xl"></i>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">{t("contact.info.email")}</h4>
                  <p className="text-gray-600">{t("contact.info.emailValue")}</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="bg-primary/10 flex h-12 w-12 shrink-0 items-center justify-center rounded-lg">
                  <i className="ri-time-line text-primary text-xl"></i>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">{t("contact.info.schedule")}</h4>
                  <p className="text-gray-600">{t("contact.info.scheduleValue")}</p>
                </div>
              </div>
            </div>

            <div className="bg-primary/10 rounded-lg p-6">
              <h4 className="mb-3 font-semibold text-gray-900">
                <i className="ri-lightbulb-line text-primary mr-2"></i>
                {t("contact.whyChooseUs.title")}
              </h4>
              <ul className="space-y-2 text-gray-600">
                {(t("contact.whyChooseUs.features", { returnObjects: true }) as string[]).map(
                  (feature, index) => (
                    <li key={index} className="flex items-center">
                      <i className="ri-check-line text-primary mr-2"></i>
                      {feature}
                    </li>
                  ),
                )}
              </ul>
            </div>
          </div>

          {/* Formulario de Contacto */}
          <div className="rounded-xl bg-white p-8 shadow-lg">
            <h3 className="mb-6 text-2xl font-bold text-gray-900">{t("contact.form.title")}</h3>

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
              {/* Nombres y Email */}
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <label htmlFor="name" className="mb-2 block text-sm font-medium text-gray-700">
                    {t("contact.form.fields.fullName")}
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="focus:ring-primary min-h-[44px] w-full rounded-lg border border-gray-300 px-4 py-3 text-base transition-colors focus:border-transparent focus:ring-2 focus:outline-none sm:text-sm"
                    placeholder={t("contact.form.fields.fullNamePlaceholder")}
                    autoComplete="name"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="mb-2 block text-sm font-medium text-gray-700">
                    {t("contact.form.fields.email")}
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="focus:ring-primary min-h-[44px] w-full rounded-lg border border-gray-300 px-4 py-3 text-base transition-colors focus:border-transparent focus:ring-2 focus:outline-none sm:text-sm"
                    placeholder={t("contact.form.fields.emailPlaceholder")}
                    autoComplete="email"
                  />
                </div>
              </div>

              {/* Empresa y Teléfono */}
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <label htmlFor="company" className="mb-2 block text-sm font-medium text-gray-700">
                    {t("contact.form.fields.company")}
                  </label>
                  <input
                    type="text"
                    id="company"
                    name="company"
                    value={formData.company}
                    onChange={handleInputChange}
                    className="focus:ring-primary min-h-[44px] w-full rounded-lg border border-gray-300 px-4 py-3 text-base transition-colors focus:border-transparent focus:ring-2 focus:outline-none sm:text-sm"
                    placeholder={t("contact.form.fields.companyPlaceholder")}
                    autoComplete="organization"
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="mb-2 block text-sm font-medium text-gray-700">
                    {t("contact.form.fields.phone")}
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="focus:ring-primary min-h-[44px] w-full rounded-lg border border-gray-300 px-4 py-3 text-base transition-colors focus:border-transparent focus:ring-2 focus:outline-none sm:text-sm"
                    placeholder={t("contact.form.fields.phonePlaceholder")}
                    autoComplete="tel"
                  />
                </div>
              </div>

              {/* Servicio */}
              <div>
                <label htmlFor="service" className="mb-2 block text-sm font-medium text-gray-700">
                  {t("contact.form.fields.serviceType")}
                </label>
                <select
                  id="service"
                  name="service"
                  value={formData.service}
                  onChange={handleInputChange}
                  required
                  className="focus:ring-primary min-h-[44px] w-full rounded-lg border border-gray-300 px-4 py-3 pr-8 text-base transition-colors focus:border-transparent focus:ring-2 focus:outline-none sm:text-sm"
                >
                  <option value="">{t("contact.form.fields.servicePlaceholder")}</option>
                  <option value={t("contact.form.fields.services.web")}>
                    {t("contact.form.fields.services.web")}
                  </option>
                  <option value={t("contact.form.fields.services.mobile")}>
                    {t("contact.form.fields.services.mobile")}
                  </option>
                  <option value={t("contact.form.fields.services.uiux")}>
                    {t("contact.form.fields.services.uiux")}
                  </option>
                  <option value={t("contact.form.fields.services.ecommerce")}>
                    {t("contact.form.fields.services.ecommerce")}
                  </option>
                  <option value={t("contact.form.fields.services.marketing")}>
                    {t("contact.form.fields.services.marketing")}
                  </option>
                  <option value={t("contact.form.fields.services.consulting")}>
                    {t("contact.form.fields.services.consulting")}
                  </option>
                  <option value={t("contact.form.fields.services.other")}>
                    {t("contact.form.fields.services.other")}
                  </option>
                </select>
              </div>

              {/* Presupuesto y Timeline */}
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <label htmlFor="budget" className="mb-2 block text-sm font-medium text-gray-700">
                    {t("contact.form.fields.budget")}
                  </label>
                  <select
                    id="budget"
                    name="budget"
                    value={formData.budget}
                    onChange={handleInputChange}
                    required
                    className="focus:ring-primary min-h-[44px] w-full rounded-lg border border-gray-300 px-4 py-3 pr-8 text-base transition-colors focus:border-transparent focus:ring-2 focus:outline-none sm:text-sm"
                  >
                    <option value="">{t("contact.form.fields.budgetPlaceholder")}</option>
                    <option value={t("contact.form.fields.budgetOptions.less1000")}>
                      {t("contact.form.fields.budgetOptions.less1000")}
                    </option>
                    <option value={t("contact.form.fields.budgetOptions.1000-2000")}>
                      {t("contact.form.fields.budgetOptions.1000-2000")}
                    </option>
                    <option value={t("contact.form.fields.budgetOptions.2000-5000")}>
                      {t("contact.form.fields.budgetOptions.2000-5000")}
                    </option>
                    <option value={t("contact.form.fields.budgetOptions.5000-10000")}>
                      {t("contact.form.fields.budgetOptions.5000-10000")}
                    </option>
                    <option value={t("contact.form.fields.budgetOptions.10000-25000")}>
                      {t("contact.form.fields.budgetOptions.10000-25000")}
                    </option>
                    <option value={t("contact.form.fields.budgetOptions.more25000")}>
                      {t("contact.form.fields.budgetOptions.more25000")}
                    </option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="timeline"
                    className="mb-2 block text-sm font-medium text-gray-700"
                  >
                    {t("contact.form.fields.timeline")}
                  </label>
                  <select
                    id="timeline"
                    name="timeline"
                    value={formData.timeline}
                    onChange={handleInputChange}
                    required
                    className="focus:ring-primary min-h-[44px] w-full rounded-lg border border-gray-300 px-4 py-3 pr-8 text-base transition-colors focus:border-transparent focus:ring-2 focus:outline-none sm:text-sm"
                  >
                    <option value="">{t("contact.form.fields.timelinePlaceholder")}</option>
                    <option value={t("contact.form.fields.timelineOptions.1-2weeks")}>
                      {t("contact.form.fields.timelineOptions.1-2weeks")}
                    </option>
                    <option value={t("contact.form.fields.timelineOptions.2-4weeks")}>
                      {t("contact.form.fields.timelineOptions.2-4weeks")}
                    </option>
                    <option value={t("contact.form.fields.timelineOptions.1month")}>
                      {t("contact.form.fields.timelineOptions.1month")}
                    </option>
                    <option value={t("contact.form.fields.timelineOptions.2-3months")}>
                      {t("contact.form.fields.timelineOptions.2-3months")}
                    </option>
                    <option value={t("contact.form.fields.timelineOptions.3-6months")}>
                      {t("contact.form.fields.timelineOptions.3-6months")}
                    </option>
                    <option value={t("contact.form.fields.timelineOptions.more6months")}>
                      {t("contact.form.fields.timelineOptions.more6months")}
                    </option>
                  </select>
                </div>
              </div>

              {/* Mensaje */}
              <div>
                <label htmlFor="message" className="mb-2 block text-sm font-medium text-gray-700">
                  {t("contact.form.fields.projectDescription")}
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  required
                  rows={5}
                  maxLength={500}
                  className="focus:ring-primary w-full resize-none rounded-lg border border-gray-300 px-4 py-3 text-base transition-colors focus:border-transparent focus:ring-2 focus:outline-none sm:text-sm"
                  placeholder={t("contact.form.fields.projectDescriptionPlaceholder")}
                />
                <div className="mt-2 flex items-center justify-between">
                  <p className="text-xs text-gray-500">
                    {t("contact.form.fields.projectDescriptionHint")}
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
                className="bg-primary min-h-[44px] w-full touch-manipulation rounded-lg px-6 py-3 font-medium whitespace-nowrap text-white transition-colors hover:bg-cyan-700 active:bg-cyan-800 disabled:cursor-not-allowed disabled:opacity-50 sm:py-3.5"
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center">
                    <i className="ri-loader-4-line mr-2 animate-spin"></i>
                    {t("contact.form.submitting")}
                  </span>
                ) : (
                  <span className="flex items-center justify-center">
                    <i className="ri-send-plane-line mr-2"></i>
                    {t("contact.form.submit")}
                  </span>
                )}
              </button>

              <p className="text-center text-xs text-gray-500">{t("contact.form.disclaimer")}</p>
            </form>
          </div>
        </div>
      </div>
    </section>
  )
}
