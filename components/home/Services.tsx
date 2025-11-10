"use client"

import { services } from "@/services/HomeServices"
import { useTranslation } from "react-i18next"

export default function Services() {
  const { t } = useTranslation()
  const scrollToContact = () => {
    const element = document.getElementById("contact")
    if (element) {
      element.scrollIntoView({ behavior: "smooth" })
    }
  }

  const Unirteahora = () => {
    window.location.href = "/freelancers"
  }

  return (
    <section id="services" className="bg-gray-50 py-20">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-16 text-center">
          <h2 className="mb-6 text-4xl font-bold text-gray-900 md:text-5xl">{t("services.title")}</h2>
          <p className="mx-auto max-w-3xl text-xl text-gray-600">
            {t("services.subtitle")}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
          {services.map((service, index) => (
            <article
              key={index}
              className="flex flex-col justify-between rounded-2xl bg-white p-8 shadow-lg transition-all hover:-translate-y-2 hover:shadow-xl"
            >
              <div>
                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-teal-500 text-white shadow-lg shadow-cyan-500/30">
                  <i className={`${service.icon} text-3xl`}></i>
                </div>
                <h3 className="mb-4 text-xl font-bold text-gray-900">{service.title}</h3>
                <p className="mb-6 leading-relaxed text-gray-600">{service.description}</p>
              </div>

              <ul className="mb-6 flex-1 space-y-2">
                {service.features.map((feature, idx) => (
                  <li key={idx} className="flex items-center text-sm text-gray-600">
                    <i className="ri-checkbox-circle-line mr-2 text-cyan-500"></i>
                    {feature}
                  </li>
                ))}
              </ul>

              <footer className="border-t border-gray-200 pt-6">
                <div className="text-primary mb-4 text-xl font-bold">{service.price}</div>
                <button
                  onClick={service.title === "Red de Freelancers" ? Unirteahora : scrollToContact}
                  className="group w-full cursor-pointer rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 py-3 font-semibold whitespace-nowrap text-white shadow-md shadow-cyan-500/30 transition-all hover:-translate-y-0.5 hover:scale-[1.02] hover:shadow-lg hover:shadow-cyan-500/40"
                >
                  {service.title === "Red de Freelancers" ? t("services.freelancerNetwork.cta") : t("services.requestQuote")}
                </button>
              </footer>
            </article>
          ))}
        </div>

        <div className="mt-16 text-center">
          <div className="rounded-2xl bg-white p-8 shadow-lg md:p-12">
            <h3 className="mb-4 text-2xl font-bold text-gray-900 md:text-3xl">
              {t("services.cta.title")}
            </h3>
            <p className="mx-auto mb-8 max-w-2xl text-lg text-gray-600">
              {t("services.cta.description")}
            </p>
            <button
              onClick={scrollToContact}
              className="group inline-flex cursor-pointer items-center gap-2 rounded-full bg-gradient-to-r from-cyan-500 to-teal-500 px-8 py-4 text-lg font-semibold whitespace-nowrap text-white shadow-lg shadow-cyan-500/30 transition-all hover:-translate-y-0.5 hover:scale-[1.02] hover:shadow-xl hover:shadow-cyan-500/40"
            >
              <i className="ri-calendar-check-line text-xl transition-transform group-hover:scale-110"></i>
              {t("services.cta.button")}
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
