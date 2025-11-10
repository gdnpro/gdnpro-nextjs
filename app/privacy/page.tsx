"use client"

import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"

export default function PrivacyPolicy() {
  const { t, i18n } = useTranslation()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    document.title = t("privacy.pageTitle")
    window.scrollTo(0, 0)
  }, [t])

  // Use fallback language for initial render to match server
  const currentLocale = mounted ? (i18n.language === "en" ? "en-US" : "es-ES") : "es-ES"

  return (
    <div className="min-h-screen bg-white">
      <div className="pt-24 pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              {t("privacy.title")}
            </h1>
            <p className="text-lg text-gray-600">
              {t("privacy.lastUpdated")}{" "}
              {new Date().toLocaleDateString(currentLocale)}
            </p>
          </div>

          {/* Content */}
          <div className="prose prose-lg max-w-none">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
              <h2 className="text-xl font-semibold text-blue-900 mb-3">
                <i className="ri-shield-check-line mr-2"></i>
                {t("privacy.commitment.title")}
              </h2>
              <p className="text-blue-800">{t("privacy.commitment.description")}</p>
            </div>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                {t("privacy.section1.title")}
              </h2>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">
                {t("privacy.section1.personal.title")}
              </h3>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                {(t("privacy.section1.personal.items", { returnObjects: true }) as string[]).map(
                  (item, index) => (
                    <li key={index}>{item}</li>
                  ),
                )}
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">
                {t("privacy.section1.technical.title")}
              </h3>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                {(t("privacy.section1.technical.items", { returnObjects: true }) as string[]).map(
                  (item, index) => (
                    <li key={index}>{item}</li>
                  ),
                )}
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                {t("privacy.section2.title")}
              </h2>

              <div className="bg-gray-50 rounded-lg p-6 mb-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">
                  {t("privacy.section2.subtitle")}
                </h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>
                    <strong>{t("privacy.section2.items.services").split(":")[0]}:</strong>{" "}
                    {t("privacy.section2.items.services").split(":")[1]}
                  </li>
                  <li>
                    <strong>{t("privacy.section2.items.communication").split(":")[0]}:</strong>{" "}
                    {t("privacy.section2.items.communication").split(":")[1]}
                  </li>
                  <li>
                    <strong>{t("privacy.section2.items.billing").split(":")[0]}:</strong>{" "}
                    {t("privacy.section2.items.billing").split(":")[1]}
                  </li>
                  <li>
                    <strong>{t("privacy.section2.items.improvement").split(":")[0]}:</strong>{" "}
                    {t("privacy.section2.items.improvement").split(":")[1]}
                  </li>
                  <li>
                    <strong>{t("privacy.section2.items.marketing").split(":")[0]}:</strong>{" "}
                    {t("privacy.section2.items.marketing").split(":")[1]}
                  </li>
                  <li>
                    <strong>{t("privacy.section2.items.legal").split(":")[0]}:</strong>{" "}
                    {t("privacy.section2.items.legal").split(":")[1]}
                  </li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                {t("privacy.section3.title")}
              </h2>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-4">
                <h3 className="text-lg font-semibold text-yellow-800 mb-3">
                  <i className="ri-alert-line mr-2"></i>
                  {t("privacy.section3.subtitle")}
                </h3>
                <ul className="list-disc pl-6 space-y-2 text-yellow-800">
                  <li>
                    <strong>{t("privacy.section3.items.providers").split(":")[0]}:</strong>{" "}
                    {t("privacy.section3.items.providers").split(":")[1]}
                  </li>
                  <li>
                    <strong>{t("privacy.section3.items.freelancers").split(":")[0]}:</strong>{" "}
                    {t("privacy.section3.items.freelancers").split(":")[1]}
                  </li>
                  <li>
                    <strong>{t("privacy.section3.items.legal").split(":")[0]}:</strong>{" "}
                    {t("privacy.section3.items.legal").split(":")[1]}
                  </li>
                  <li>
                    <strong>{t("privacy.section3.items.transfer").split(":")[0]}:</strong>{" "}
                    {t("privacy.section3.items.transfer").split(":")[1]}
                  </li>
                </ul>
              </div>

              <p className="text-gray-700">
                <strong>{t("privacy.section3.neverSell")}</strong>
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                {t("privacy.section4.title")}
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-green-800 mb-3">
                    <i className="ri-shield-check-line mr-2"></i>
                    {t("privacy.section4.security.title")}
                  </h3>
                  <ul className="list-disc pl-6 space-y-1 text-green-800">
                    {(t("privacy.section4.security.items", { returnObjects: true }) as string[]).map(
                      (item, index) => (
                        <li key={index}>{item}</li>
                      ),
                    )}
                  </ul>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-blue-800 mb-3">
                    <i className="ri-database-2-line mr-2"></i>
                    {t("privacy.section4.storage.title")}
                  </h3>
                  <ul className="list-disc pl-6 space-y-1 text-blue-800">
                    {(t("privacy.section4.storage.items", { returnObjects: true }) as string[]).map(
                      (item, index) => (
                        <li key={index}>{item}</li>
                      ),
                    )}
                  </ul>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                {t("privacy.section5.title")}
              </h2>

              <div className="bg-purple-50 border border-purple-200 rounded-lg p-6 mb-4">
                <h3 className="text-lg font-semibold text-purple-800 mb-3">
                  <i className="ri-user-settings-line mr-2"></i>
                  {t("privacy.section5.subtitle")}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <ul className="list-disc pl-6 space-y-2 text-purple-800">
                    <li>
                      <strong>{t("privacy.section5.rights.access").split(":")[0]}:</strong>{" "}
                      {t("privacy.section5.rights.access").split(":")[1]}
                    </li>
                    <li>
                      <strong>{t("privacy.section5.rights.rectification").split(":")[0]}:</strong>{" "}
                      {t("privacy.section5.rights.rectification").split(":")[1]}
                    </li>
                    <li>
                      <strong>{t("privacy.section5.rights.deletion").split(":")[0]}:</strong>{" "}
                      {t("privacy.section5.rights.deletion").split(":")[1]}
                    </li>
                    <li>
                      <strong>{t("privacy.section5.rights.portability").split(":")[0]}:</strong>{" "}
                      {t("privacy.section5.rights.portability").split(":")[1]}
                    </li>
                  </ul>
                  <ul className="list-disc pl-6 space-y-2 text-purple-800">
                    <li>
                      <strong>{t("privacy.section5.rights.limitation").split(":")[0]}:</strong>{" "}
                      {t("privacy.section5.rights.limitation").split(":")[1]}
                    </li>
                    <li>
                      <strong>{t("privacy.section5.rights.opposition").split(":")[0]}:</strong>{" "}
                      {t("privacy.section5.rights.opposition").split(":")[1]}
                    </li>
                    <li>
                      <strong>{t("privacy.section5.rights.revocation").split(":")[0]}:</strong>{" "}
                      {t("privacy.section5.rights.revocation").split(":")[1]}
                    </li>
                    <li>
                      <strong>{t("privacy.section5.rights.complaint").split(":")[0]}:</strong>{" "}
                      {t("privacy.section5.rights.complaint").split(":")[1]}
                    </li>
                  </ul>
                </div>
              </div>

              <p className="text-gray-700">
                {t("privacy.section5.contact")}
                <a
                  href="mailto:privacidad@gdnpro.com"
                  className="text-primary hover:text-blue-800 ml-1"
                >
                  contact@gdnpro.com
                </a>
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                {t("privacy.section6.title")}
              </h2>

              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-800 mb-2">
                    {t("privacy.section6.essential.title")}
                  </h3>
                  <p className="text-gray-700">{t("privacy.section6.essential.description")}</p>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-800 mb-2">
                    {t("privacy.section6.analytics.title")}
                  </h3>
                  <p className="text-gray-700">{t("privacy.section6.analytics.description")}</p>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-800 mb-2">
                    {t("privacy.section6.marketing.title")}
                  </h3>
                  <p className="text-gray-700">{t("privacy.section6.marketing.description")}</p>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                {t("privacy.section7.title")}
              </h2>

              <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-orange-800 mb-3">
                  <i className="ri-time-line mr-2"></i>
                  {t("privacy.section7.subtitle")}
                </h3>
                <ul className="list-disc pl-6 space-y-2 text-orange-800">
                  <li>
                    <strong>{t("privacy.section7.items.active").split(":")[0]}:</strong>{" "}
                    {t("privacy.section7.items.active").split(":")[1]}
                  </li>
                  <li>
                    <strong>{t("privacy.section7.items.projects").split(":")[0]}:</strong>{" "}
                    {t("privacy.section7.items.projects").split(":")[1]}
                  </li>
                  <li>
                    <strong>{t("privacy.section7.items.billing").split(":")[0]}:</strong>{" "}
                    {t("privacy.section7.items.billing").split(":")[1]}
                  </li>
                  <li>
                    <strong>{t("privacy.section7.items.marketing").split(":")[0]}:</strong>{" "}
                    {t("privacy.section7.items.marketing").split(":")[1]}
                  </li>
                  <li>
                    <strong>{t("privacy.section7.items.logs").split(":")[0]}:</strong>{" "}
                    {t("privacy.section7.items.logs").split(":")[1]}
                  </li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                {t("privacy.section8.title")}
              </h2>

              <p className="text-gray-700 mb-4">{t("privacy.section8.description")}</p>

              <ul className="list-disc pl-6 mb-4 space-y-2">
                {(t("privacy.section8.items", { returnObjects: true }) as string[]).map(
                  (item, index) => (
                    <li key={index}>{item}</li>
                  ),
                )}
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                {t("privacy.section9.title")}
              </h2>

              <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-red-800 mb-3">
                  <i className="ri-user-forbid-line mr-2"></i>
                  {t("privacy.section9.subtitle")}
                </h3>
                <p className="text-red-800">{t("privacy.section9.description")}</p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                {t("privacy.section10.title")}
              </h2>

              <p className="text-gray-700 mb-4">{t("privacy.section10.description")}</p>

              <ul className="list-disc pl-6 mb-4 space-y-2">
                {(t("privacy.section10.items", { returnObjects: true }) as string[]).map(
                  (item, index) => (
                    <li key={index}>{item}</li>
                  ),
                )}
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                {t("privacy.section11.title")}
              </h2>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-blue-800 mb-4">
                  <i className="ri-customer-service-2-line mr-2"></i>
                  {t("privacy.section11.subtitle")}
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-blue-800 mb-2">
                      {t("privacy.section11.contactInfo.title")}
                    </h4>
                    <ul className="space-y-2 text-cyan-700">
                      <li>
                        <i className="ri-mail-line mr-2"></i>
                        <strong>{t("privacy.section11.contactInfo.email")}</strong> privacidad@gdnpro.com
                      </li>
                      <li>
                        <i className="ri-map-pin-line mr-2"></i>
                        <strong>{t("privacy.section11.contactInfo.address")}</strong>{" "}
                        {t("privacy.section11.contactInfo.addressValue")}
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold text-blue-800 mb-2">
                      {t("privacy.section11.dataController.title")}
                    </h4>
                    <p className="text-cyan-700">
                      <strong>{t("privacy.section11.dataController.name")}</strong>
                      <br />
                      {t("privacy.section11.dataController.role")}
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Footer Legal */}
            <div className="border-t border-gray-200 pt-8 mt-12">
              <div className="bg-gray-50 rounded-lg p-6">
                <p className="text-sm text-gray-600 text-center">
                  {t("privacy.footer.compliance")}
                </p>
                <p className="text-xs text-gray-500 text-center mt-2">
                  {t("privacy.footer.lastUpdated")}{" "}
                  {new Date().toLocaleDateString(currentLocale)} | {t("privacy.footer.version")} |{" "}
                  {t("privacy.footer.validFrom")} {new Date().toLocaleDateString(currentLocale)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
