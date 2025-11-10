"use client"

import { Counter } from "@/components/Counter"
import { gdnStats } from "@/constants/currentData"
import { useTranslation } from "react-i18next"

export default function About() {
  const { t } = useTranslation()
  const stats = [
    { number: gdnStats.completedProjects, label: t("about.stats.completedProjects") },
    { number: gdnStats.satisfiedClients, label: t("about.stats.satisfiedClients") },
    { number: gdnStats.experienceYears, label: t("about.stats.yearsExperience") },
    { number: gdnStats.qualifications, label: t("about.stats.satisfactionRate") },
  ]

  const scrollToContact = () => {
    const element = document.getElementById("contact")
    if (element) {
      element.scrollIntoView({ behavior: "smooth" })
    }
  }

  return (
    <section id="about" className="bg-gray-50 py-20">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid grid-cols-1 items-center gap-16 lg:grid-cols-2">
          <div>
            <h2 className="mb-6 text-4xl font-bold text-gray-900 md:text-5xl">{t("about.title")}</h2>
            <p className="mb-8 text-xl leading-relaxed text-gray-600">
              {t("about.description1")}
            </p>
            <p className="mb-8 text-lg leading-relaxed text-gray-600">
              {t("about.description2")}
            </p>

            <div className="mb-8 space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-teal-500 text-white shadow-lg shadow-cyan-500/30">
                  <i className="ri-checkbox-circle-line text-lg"></i>
                </div>
                <span className="text-lg text-gray-700">
                  {t("about.features.customSolutions")}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-teal-500 text-white shadow-lg shadow-cyan-500/30">
                  <i className="ri-checkbox-circle-line text-lg"></i>
                </div>
                <span className="text-lg text-gray-700">{t("about.features.cuttingEdge")}</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-teal-500 text-white shadow-lg shadow-cyan-500/30">
                  <i className="ri-checkbox-circle-line text-lg"></i>
                </div>
                <span className="text-lg text-gray-700">{t("about.features.continuousSupport")}</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-teal-500 text-white shadow-lg shadow-cyan-500/30">
                  <i className="ri-checkbox-circle-line text-lg"></i>
                </div>
                <span className="text-lg text-gray-700">{t("about.features.freelancerNetwork")}</span>
              </div>
            </div>

            <button
              onClick={scrollToContact}
              className="group inline-flex cursor-pointer items-center gap-2 rounded-full bg-gradient-to-r from-cyan-500 to-teal-500 px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-semibold text-white shadow-lg shadow-cyan-500/30 transition-all hover:-translate-y-0.5 hover:scale-[1.02] active:scale-100 hover:shadow-xl hover:shadow-cyan-500/40 whitespace-nowrap min-h-[44px] touch-manipulation"
            >
              <i className="ri-information-line text-lg sm:text-xl transition-transform group-hover:scale-110"></i>
              <span className="text-sm sm:text-base">{t("about.cta")}</span>
            </button>
          </div>

          <div className="relative">
            <img
              src="/images/about-image.avif"
              alt="GDN Pro Team"
              className="h-64 sm:h-80 md:h-96 w-full rounded-2xl object-cover object-top shadow-2xl"
            />
            <div className="absolute -bottom-4 -left-4 sm:-bottom-8 sm:-left-8 rounded-xl sm:rounded-2xl border border-gray-200 bg-gradient-to-br from-white to-gray-50 p-4 sm:p-6 shadow-xl ring-1 ring-gray-200">
              <div className="text-center">
                <div className="mb-2 flex items-center justify-center gap-2 text-gray-600 text-xs sm:text-sm">
                  <i className="ri-calendar-check-line text-cyan-500 text-sm sm:text-base"></i>
                  {t("about.founded")}
                </div>
                <div className="text-2xl sm:text-3xl font-bold text-cyan-600">2023</div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 sm:mt-20 grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-4">
          {stats.map((stat, index) => (
            <div key={index} className="group relative overflow-hidden rounded-xl sm:rounded-2xl border border-gray-200 bg-gradient-to-br from-white to-gray-50 p-4 sm:p-6 text-center shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-cyan-500/10 ring-1 ring-gray-100">
              <div className="mb-3 flex items-center justify-center">
                <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-teal-500 text-white shadow-lg shadow-cyan-500/30">
                  <i className="ri-bar-chart-line text-lg sm:text-xl"></i>
                </div>
              </div>
              <div className="mb-2 text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-cyan-600">
                <span>
                  <Counter initial={0} final={stat.number} />
                  {index === 3 ? "%" : ""}
                </span>
              </div>
              <div className="text-xs sm:text-sm font-medium text-gray-600">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
