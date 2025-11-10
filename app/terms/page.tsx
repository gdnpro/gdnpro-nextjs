"use client"

import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"

export default function TermsOfService() {
  const { t, i18n } = useTranslation()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    document.title = t("terms.pageTitle")
    window.scrollTo(0, 0)
  }, [t])

  // Use fallback language for initial render to match server
  const currentLocale = mounted ? (i18n.language === "en" ? "en-US" : "es-ES") : "es-ES"

  return (
    <div className="min-h-screen bg-white">
      <div className="pt-24 pb-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-12 text-center">
            <h1 className="mb-4 text-4xl font-bold text-gray-900">{t("terms.title")}</h1>
            <p className="text-lg text-gray-600">
              {t("terms.lastUpdated")}{" "}
              {new Date().toLocaleDateString(currentLocale)}
            </p>
          </div>

          {/* Content */}
          <div className="prose prose-lg max-w-none">
            <div className="mb-8 rounded-lg border border-blue-200 bg-blue-50 p-6">
              <h2 className="mb-3 text-xl font-semibold text-blue-900">
                <i className="ri-file-text-line mr-2"></i>
                {t("terms.agreement.title")}
              </h2>
              <p className="text-blue-800">{t("terms.agreement.description")}</p>
            </div>

            <section className="mb-8">
              <h2 className="mb-4 text-2xl font-bold text-gray-900">{t("terms.section1.title")}</h2>

              <div className="mb-4 rounded-lg bg-gray-50 p-6">
                <ul className="space-y-3">
                  <li>
                    <strong>{t("terms.section1.definitions.gdnpro").split(":")[0]}:</strong>{" "}
                    {t("terms.section1.definitions.gdnpro").split(":")[1]}
                  </li>
                  <li>
                    <strong>{t("terms.section1.definitions.client").split(":")[0]}:</strong>{" "}
                    {t("terms.section1.definitions.client").split(":")[1]}
                  </li>
                  <li>
                    <strong>{t("terms.section1.definitions.services").split(":")[0]}:</strong>{" "}
                    {t("terms.section1.definitions.services").split(":")[1]}
                  </li>
                  <li>
                    <strong>{t("terms.section1.definitions.platform").split(":")[0]}:</strong>{" "}
                    {t("terms.section1.definitions.platform").split(":")[1]}
                  </li>
                  <li>
                    <strong>{t("terms.section1.definitions.project").split(":")[0]}:</strong>{" "}
                    {t("terms.section1.definitions.project").split(":")[1]}
                  </li>
                  <li>
                    <strong>{t("terms.section1.definitions.freelancer").split(":")[0]}:</strong>{" "}
                    {t("terms.section1.definitions.freelancer").split(":")[1]}
                  </li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="mb-4 text-2xl font-bold text-gray-900">{t("terms.section2.title")}</h2>

              <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="rounded-lg border border-green-200 bg-green-50 p-6">
                  <h3 className="mb-3 text-lg font-semibold text-green-800">
                    <i className="ri-code-line mr-2"></i>
                    {t("terms.section2.technical.title")}
                  </h3>
                  <ul className="list-disc space-y-1 pl-6 text-green-800">
                    {(t("terms.section2.technical.items", { returnObjects: true }) as string[]).map(
                      (item, index) => (
                        <li key={index}>{item}</li>
                      ),
                    )}
                  </ul>
                </div>

                <div className="rounded-lg border border-purple-200 bg-purple-50 p-6">
                  <h3 className="mb-3 text-lg font-semibold text-purple-800">
                    <i className="ri-megaphone-line mr-2"></i>
                    {t("terms.section2.marketing.title")}
                  </h3>
                  <ul className="list-disc space-y-1 pl-6 text-purple-800">
                    {(t("terms.section2.marketing.items", { returnObjects: true }) as string[]).map(
                      (item, index) => (
                        <li key={index}>{item}</li>
                      ),
                    )}
                  </ul>
                </div>
              </div>

              <div className="rounded-lg border border-blue-200 bg-blue-50 p-6">
                <h3 className="mb-3 text-lg font-semibold text-blue-800">
                  <i className="ri-team-line mr-2"></i>
                  {t("terms.section2.freelancers.title")}
                </h3>
                <p className="text-blue-800">{t("terms.section2.freelancers.description")}</p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="mb-4 text-2xl font-bold text-gray-900">{t("terms.section3.title")}</h2>

              <div className="space-y-4">
                <div className="flex items-start space-x-4 rounded-lg bg-gray-50 p-4">
                  <div className="bg-primary flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold text-white">
                    1
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">
                      {t("terms.section3.steps.1.title")}
                    </h3>
                    <p className="text-gray-700">{t("terms.section3.steps.1.description")}</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4 rounded-lg bg-gray-50 p-4">
                  <div className="bg-primary flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold text-white">
                    2
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">
                      {t("terms.section3.steps.2.title")}
                    </h3>
                    <p className="text-gray-700">{t("terms.section3.steps.2.description")}</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4 rounded-lg bg-gray-50 p-4">
                  <div className="bg-primary flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold text-white">
                    3
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">
                      {t("terms.section3.steps.3.title")}
                    </h3>
                    <p className="text-gray-700">{t("terms.section3.steps.3.description")}</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4 rounded-lg bg-gray-50 p-4">
                  <div className="bg-primary flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold text-white">
                    4
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">
                      {t("terms.section3.steps.4.title")}
                    </h3>
                    <p className="text-gray-700">{t("terms.section3.steps.4.description")}</p>
                  </div>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="mb-4 text-2xl font-bold text-gray-900">{t("terms.section4.title")}</h2>

              <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-6">
                <h3 className="mb-3 text-lg font-semibold text-yellow-800">
                  <i className="ri-user-star-line mr-2"></i>
                  {t("terms.section4.subtitle")}
                </h3>
                <ul className="list-disc space-y-2 pl-6 text-yellow-800">
                  <li>
                    <strong>{t("terms.section4.items.information").split(":")[0]}:</strong>{" "}
                    {t("terms.section4.items.information").split(":")[1]}
                  </li>
                  <li>
                    <strong>{t("terms.section4.items.content").split(":")[0]}:</strong>{" "}
                    {t("terms.section4.items.content").split(":")[1]}
                  </li>
                  <li>
                    <strong>{t("terms.section4.items.feedback").split(":")[0]}:</strong>{" "}
                    {t("terms.section4.items.feedback").split(":")[1]}
                  </li>
                  <li>
                    <strong>{t("terms.section4.items.payments").split(":")[0]}:</strong>{" "}
                    {t("terms.section4.items.payments").split(":")[1]}
                  </li>
                  <li>
                    <strong>{t("terms.section4.items.access").split(":")[0]}:</strong>{" "}
                    {t("terms.section4.items.access").split(":")[1]}
                  </li>
                  <li>
                    <strong>{t("terms.section4.items.communication").split(":")[0]}:</strong>{" "}
                    {t("terms.section4.items.communication").split(":")[1]}
                  </li>
                  <li>
                    <strong>{t("terms.section4.items.decisions").split(":")[0]}:</strong>{" "}
                    {t("terms.section4.items.decisions").split(":")[1]}
                  </li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="mb-4 text-2xl font-bold text-gray-900">{t("terms.section5.title")}</h2>

              <div className="rounded-lg border border-green-200 bg-green-50 p-6">
                <h3 className="mb-3 text-lg font-semibold text-green-800">
                  <i className="ri-shield-check-line mr-2"></i>
                  {t("terms.section5.subtitle")}
                </h3>
                <ul className="list-disc space-y-2 pl-6 text-green-800">
                  <li>
                    <strong>{t("terms.section5.items.quality").split(":")[0]}:</strong>{" "}
                    {t("terms.section5.items.quality").split(":")[1]}
                  </li>
                  <li>
                    <strong>{t("terms.section5.items.deadlines").split(":")[0]}:</strong>{" "}
                    {t("terms.section5.items.deadlines").split(":")[1]}
                  </li>
                  <li>
                    <strong>{t("terms.section5.items.communication").split(":")[0]}:</strong>{" "}
                    {t("terms.section5.items.communication").split(":")[1]}
                  </li>
                  <li>
                    <strong>{t("terms.section5.items.support").split(":")[0]}:</strong>{" "}
                    {t("terms.section5.items.support").split(":")[1]}
                  </li>
                  <li>
                    <strong>{t("terms.section5.items.confidentiality").split(":")[0]}:</strong>{" "}
                    {t("terms.section5.items.confidentiality").split(":")[1]}
                  </li>
                  <li>
                    <strong>{t("terms.section5.items.practices").split(":")[0]}:</strong>{" "}
                    {t("terms.section5.items.practices").split(":")[1]}
                  </li>
                  <li>
                    <strong>{t("terms.section5.items.documentation").split(":")[0]}:</strong>{" "}
                    {t("terms.section5.items.documentation").split(":")[1]}
                  </li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="mb-4 text-2xl font-bold text-gray-900">{t("terms.section6.title")}</h2>

              <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-6">
                  <h3 className="mb-3 text-lg font-semibold text-blue-800">
                    <i className="ri-money-dollar-circle-line mr-2"></i>
                    {t("terms.section6.structure.title")}
                  </h3>
                  <ul className="list-disc space-y-2 pl-6 text-blue-800">
                    <li>
                      <strong>{t("terms.section6.structure.items.advance").split(":")[0]}:</strong>{" "}
                      {t("terms.section6.structure.items.advance").split(":")[1]}
                    </li>
                    <li>
                      <strong>{t("terms.section6.structure.items.partial").split(":")[0]}:</strong>{" "}
                      {t("terms.section6.structure.items.partial").split(":")[1]}
                    </li>
                    <li>
                      <strong>{t("terms.section6.structure.items.final").split(":")[0]}:</strong>{" "}
                      {t("terms.section6.structure.items.final").split(":")[1]}
                    </li>
                    <li>
                      <strong>{t("terms.section6.structure.items.currency").split(":")[0]}:</strong>{" "}
                      {t("terms.section6.structure.items.currency").split(":")[1]}
                    </li>
                  </ul>
                </div>

                <div className="rounded-lg border border-orange-200 bg-orange-50 p-6">
                  <h3 className="mb-3 text-lg font-semibold text-orange-800">
                    <i className="ri-calendar-check-line mr-2"></i>
                    {t("terms.section6.paymentTerms.title")}
                  </h3>
                  <ul className="list-disc space-y-2 pl-6 text-orange-800">
                    <li>
                      <strong>
                        {t("terms.section6.paymentTerms.items.deadline").split(":")[0]}:
                      </strong>{" "}
                      {t("terms.section6.paymentTerms.items.deadline").split(":")[1]}
                    </li>
                    <li>
                      <strong>
                        {t("terms.section6.paymentTerms.items.methods").split(":")[0]}:
                      </strong>{" "}
                      {t("terms.section6.paymentTerms.items.methods").split(":")[1]}
                    </li>
                    <li>
                      <strong>
                        {t("terms.section6.paymentTerms.items.billing").split(":")[0]}:
                      </strong>{" "}
                      {t("terms.section6.paymentTerms.items.billing").split(":")[1]}
                    </li>
                    <li>
                      <strong>{t("terms.section6.paymentTerms.items.late").split(":")[0]}:</strong>{" "}
                      {t("terms.section6.paymentTerms.items.late").split(":")[1]}
                    </li>
                  </ul>
                </div>
              </div>

              <div className="rounded-lg border border-red-200 bg-red-50 p-6">
                <h3 className="mb-3 text-lg font-semibold text-red-800">
                  <i className="ri-alert-line mr-2"></i>
                  {t("terms.section6.latePayment.title")}
                </h3>
                <p className="mb-3 text-red-800">{t("terms.section6.latePayment.description")}</p>
                <ul className="list-disc space-y-1 pl-6 text-red-800">
                  {(t("terms.section6.latePayment.items", { returnObjects: true }) as string[]).map(
                    (item, index) => (
                      <li key={index}>{item}</li>
                    ),
                  )}
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="mb-4 text-2xl font-bold text-gray-900">{t("terms.section7.title")}</h2>

              <div className="space-y-6">
                <div className="rounded-lg border border-purple-200 bg-purple-50 p-6">
                  <h3 className="mb-3 text-lg font-semibold text-purple-800">
                    <i className="ri-copyright-line mr-2"></i>
                    {t("terms.section7.clientRights.title")}
                  </h3>
                  <p className="mb-3 text-purple-800">
                    {t("terms.section7.clientRights.description")}
                  </p>
                  <ul className="list-disc space-y-1 pl-6 text-purple-800">
                    {(
                      t("terms.section7.clientRights.items", { returnObjects: true }) as string[]
                    ).map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-lg border border-gray-200 bg-gray-50 p-6">
                  <h3 className="mb-3 text-lg font-semibold text-gray-800">
                    <i className="ri-shield-line mr-2"></i>
                    {t("terms.section7.reservedRights.title")}
                  </h3>
                  <ul className="list-disc space-y-1 pl-6 text-gray-700">
                    {(
                      t("terms.section7.reservedRights.items", { returnObjects: true }) as string[]
                    ).map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-6">
                  <h3 className="mb-3 text-lg font-semibold text-yellow-800">
                    <i className="ri-creative-commons-line mr-2"></i>
                    {t("terms.section7.thirdParty.title")}
                  </h3>
                  <p className="text-yellow-800">{t("terms.section7.thirdParty.description")}</p>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="mb-4 text-2xl font-bold text-gray-900">{t("terms.section8.title")}</h2>

              <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="rounded-lg border border-green-200 bg-green-50 p-6">
                  <h3 className="mb-3 text-lg font-semibold text-green-800">
                    <i className="ri-shield-check-line mr-2"></i>
                    {t("terms.section8.quality.title")}
                  </h3>
                  <ul className="list-disc space-y-2 pl-6 text-green-800">
                    <li>
                      <strong>
                        {t("terms.section8.quality.items.functionality").split(":")[0]}:
                      </strong>{" "}
                      {t("terms.section8.quality.items.functionality").split(":")[1]}
                    </li>
                    <li>
                      <strong>
                        {t("terms.section8.quality.items.compatibility").split(":")[0]}:
                      </strong>{" "}
                      {t("terms.section8.quality.items.compatibility").split(":")[1]}
                    </li>
                    <li>
                      <strong>
                        {t("terms.section8.quality.items.performance").split(":")[0]}:
                      </strong>{" "}
                      {t("terms.section8.quality.items.performance").split(":")[1]}
                    </li>
                    <li>
                      <strong>{t("terms.section8.quality.items.security").split(":")[0]}:</strong>{" "}
                      {t("terms.section8.quality.items.security").split(":")[1]}
                    </li>
                  </ul>
                </div>

                <div className="rounded-lg border border-blue-200 bg-blue-50 p-6">
                  <h3 className="mb-3 text-lg font-semibold text-blue-800">
                    <i className="ri-customer-service-2-line mr-2"></i>
                    {t("terms.section8.support.title")}
                  </h3>
                  <ul className="list-disc space-y-2 pl-6 text-blue-800">
                    <li>
                      <strong>{t("terms.section8.support.items.duration").split(":")[0]}:</strong>{" "}
                      {t("terms.section8.support.items.duration").split(":")[1]}
                    </li>
                    <li>
                      <strong>{t("terms.section8.support.items.scope").split(":")[0]}:</strong>{" "}
                      {t("terms.section8.support.items.scope").split(":")[1]}
                    </li>
                    <li>
                      <strong>{t("terms.section8.support.items.schedule").split(":")[0]}:</strong>{" "}
                      {t("terms.section8.support.items.schedule").split(":")[1]}
                    </li>
                    <li>
                      <strong>{t("terms.section8.support.items.response").split(":")[0]}:</strong>{" "}
                      {t("terms.section8.support.items.response").split(":")[1]}
                    </li>
                  </ul>
                </div>
              </div>

              <div className="rounded-lg border border-orange-200 bg-orange-50 p-6">
                <h3 className="mb-3 text-lg font-semibold text-orange-800">
                  <i className="ri-tools-line mr-2"></i>
                  {t("terms.section8.maintenance.title")}
                </h3>
                <p className="text-orange-800">{t("terms.section8.maintenance.description")}</p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="mb-4 text-2xl font-bold text-gray-900">{t("terms.section9.title")}</h2>

              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-6">
                <h3 className="mb-3 text-lg font-semibold text-red-800">
                  <i className="ri-error-warning-line mr-2"></i>
                  {t("terms.section9.limitations.title")}
                </h3>
                <ul className="list-disc space-y-2 pl-6 text-red-800">
                  {(t("terms.section9.limitations.items", { returnObjects: true }) as string[]).map(
                    (item, index) => (
                      <li key={index}>{item}</li>
                    ),
                  )}
                </ul>
              </div>

              <div className="rounded-lg border border-gray-200 bg-gray-50 p-6">
                <h3 className="mb-3 text-lg font-semibold text-gray-800">
                  <i className="ri-information-line mr-2"></i>
                  {t("terms.section9.exclusions.title")}
                </h3>
                <p className="mb-3 text-gray-700">{t("terms.section9.exclusions.description")}</p>
                <ul className="list-disc space-y-1 pl-6 text-gray-700">
                  {(t("terms.section9.exclusions.items", { returnObjects: true }) as string[]).map(
                    (item, index) => (
                      <li key={index}>{item}</li>
                    ),
                  )}
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="mb-4 text-2xl font-bold text-gray-900">
                {t("terms.section10.title")}
              </h2>

              <div className="space-y-6">
                <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-6">
                  <h3 className="mb-3 text-lg font-semibold text-yellow-800">
                    <i className="ri-close-circle-line mr-2"></i>
                    {t("terms.section10.clientCancellation.title")}
                  </h3>
                  <ul className="list-disc space-y-2 pl-6 text-yellow-800">
                    <li>
                      <strong>
                        {t("terms.section10.clientCancellation.items.before").split(":")[0]}:
                      </strong>{" "}
                      {t("terms.section10.clientCancellation.items.before").split(":")[1]}
                    </li>
                    <li>
                      <strong>
                        {t("terms.section10.clientCancellation.items.during").split(":")[0]}:
                      </strong>{" "}
                      {t("terms.section10.clientCancellation.items.during").split(":")[1]}
                    </li>
                    <li>
                      <strong>
                        {t("terms.section10.clientCancellation.items.partial").split(":")[0]}:
                      </strong>{" "}
                      {t("terms.section10.clientCancellation.items.partial").split(":")[1]}
                    </li>
                    <li>
                      <strong>
                        {t("terms.section10.clientCancellation.items.penalty").split(":")[0]}:
                      </strong>{" "}
                      {t("terms.section10.clientCancellation.items.penalty").split(":")[1]}
                    </li>
                  </ul>
                </div>

                <div className="rounded-lg border border-red-200 bg-red-50 p-6">
                  <h3 className="mb-3 text-lg font-semibold text-red-800">
                    <i className="ri-alert-line mr-2"></i>
                    {t("terms.section10.termination.title")}
                  </h3>
                  <p className="mb-3 text-red-800">
                    {t("terms.section10.termination.description")}
                  </p>
                  <ul className="list-disc space-y-1 pl-6 text-red-800">
                    {(
                      t("terms.section10.termination.items", { returnObjects: true }) as string[]
                    ).map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="mb-4 text-2xl font-bold text-gray-900">
                {t("terms.section11.title")}
              </h2>

              <div className="rounded-lg border border-purple-200 bg-purple-50 p-6">
                <h3 className="mb-3 text-lg font-semibold text-purple-800">
                  <i className="ri-lock-line mr-2"></i>
                  {t("terms.section11.subtitle")}
                </h3>
                <p className="mb-3 text-purple-800">{t("terms.section11.description")}</p>
                <ul className="list-disc space-y-2 pl-6 text-purple-800">
                  {(t("terms.section11.items", { returnObjects: true }) as string[]).map(
                    (item, index) => (
                      <li key={index}>{item}</li>
                    ),
                  )}
                </ul>

                <p className="mt-4 text-purple-800">
                  <strong>{t("terms.section11.duration")}</strong>
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="mb-4 text-2xl font-bold text-gray-900">
                {t("terms.section12.title")}
              </h2>

              <div className="space-y-4">
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-6">
                  <h3 className="mb-3 text-lg font-semibold text-blue-800">
                    <i className="ri-discuss-line mr-2"></i>
                    {t("terms.section12.process.title")}
                  </h3>
                  <ol className="list-decimal space-y-2 pl-6 text-blue-800">
                    <li>
                      <strong>{t("terms.section12.process.steps.1").split(":")[0]}:</strong>{" "}
                      {t("terms.section12.process.steps.1").split(":")[1]}
                    </li>
                    <li>
                      <strong>{t("terms.section12.process.steps.2").split(":")[0]}:</strong>{" "}
                      {t("terms.section12.process.steps.2").split(":")[1]}
                    </li>
                    <li>
                      <strong>{t("terms.section12.process.steps.3").split(":")[0]}:</strong>{" "}
                      {t("terms.section12.process.steps.3").split(":")[1]}
                    </li>
                    <li>
                      <strong>{t("terms.section12.process.steps.4").split(":")[0]}:</strong>{" "}
                      {t("terms.section12.process.steps.4").split(":")[1]}
                    </li>
                  </ol>
                </div>

                <div className="rounded-lg border border-green-200 bg-green-50 p-6">
                  <h3 className="mb-3 text-lg font-semibold text-green-800">
                    <i className="ri-scales-line mr-2"></i>
                    {t("terms.section12.law.title")}
                  </h3>
                  <p className="text-green-800">{t("terms.section12.law.description")}</p>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="mb-4 text-2xl font-bold text-gray-900">
                {t("terms.section13.title")}
              </h2>

              <div className="rounded-lg border border-orange-200 bg-orange-50 p-6">
                <h3 className="mb-3 text-lg font-semibold text-orange-800">
                  <i className="ri-edit-line mr-2"></i>
                  {t("terms.section13.subtitle")}
                </h3>
                <p className="mb-3 text-orange-800">{t("terms.section13.description")}</p>
                <ul className="list-disc space-y-1 pl-6 text-orange-800">
                  {(t("terms.section13.items", { returnObjects: true }) as string[]).map(
                    (item, index) => (
                      <li key={index}>{item}</li>
                    ),
                  )}
                </ul>
                <p className="mt-3 text-orange-800">
                  <strong>{t("terms.section13.acceptance")}</strong>
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="mb-4 text-2xl font-bold text-gray-900">
                {t("terms.section14.title")}
              </h2>

              <div className="rounded-lg border border-blue-200 bg-blue-50 p-6">
                <h3 className="mb-4 text-lg font-semibold text-blue-800">
                  <i className="ri-customer-service-2-line mr-2"></i>
                  {t("terms.section14.subtitle")}
                </h3>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div>
                    <h4 className="mb-2 font-semibold text-blue-800">
                      {t("terms.section14.general.title")}
                    </h4>
                    <ul className="space-y-2 text-cyan-700">
                      <li>
                        <i className="ri-building-line mr-2"></i>
                        <strong>{t("terms.section14.general.company")}</strong> GDN Pro
                      </li>
                      <li>
                        <i className="ri-mail-line mr-2"></i>
                        <strong>{t("terms.section14.general.email")}</strong> contact@gdnpro.com
                      </li>
                      <li>
                        <i className="ri-map-pin-line mr-2"></i>
                        <strong>{t("terms.section14.general.address")}</strong>{" "}
                        {t("terms.section14.general.addressValue")}
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="mb-2 font-semibold text-blue-800">
                      {t("terms.section14.fiscal.title")}
                    </h4>
                    <ul className="space-y-2 text-cyan-700">
                      <li>
                        <i className="ri-bank-line mr-2"></i>
                        <strong>{t("terms.section14.fiscal.regime")}</strong>{" "}
                        {t("terms.section14.fiscal.regimeValue")}
                      </li>
                      <li>
                        <i className="ri-time-line mr-2"></i>
                        <strong>{t("terms.section14.fiscal.schedule")}</strong>{" "}
                        {t("terms.section14.fiscal.scheduleValue")}
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            {/* Footer Legal */}
            <div className="mt-12 border-t border-gray-200 pt-8">
              <div className="rounded-lg bg-gray-50 p-6">
                <p className="mb-2 text-center text-sm text-gray-600">
                  {t("terms.footer.compliance")}
                </p>
                 <p className="text-center text-xs text-gray-500">
                   {t("terms.footer.lastUpdated")}{" "}
                   {new Date().toLocaleDateString(currentLocale)} | {t("terms.footer.version")} |{" "}
                   {t("terms.footer.validFrom")} {new Date().toLocaleDateString(currentLocale)}
                 </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
