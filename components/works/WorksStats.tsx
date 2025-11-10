import { useTranslation } from "react-i18next"
import { gdnStats } from "@/constants/currentData"

export default function WorksStats() {
  const { t } = useTranslation()
  return (
    <section className="bg-gradient-to-br from-cyan-50 via-teal-50 to-white py-20">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid grid-cols-2 gap-6 md:grid-cols-3">
          <div className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-gradient-to-br from-white to-gray-50 p-6 text-center shadow-sm ring-1 ring-gray-100 transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-cyan-500/10">
            <div className="mb-4 flex items-center justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-teal-500 text-white shadow-lg shadow-cyan-500/30">
                <i className="ri-trophy-line text-3xl"></i>
              </div>
            </div>
            <div className="mb-2 text-4xl font-bold text-cyan-600">
              +{gdnStats.completedProjects}
            </div>
            <div className="font-medium text-gray-600">{t("works.stats.completedProjects")}</div>
          </div>

          <div className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-gradient-to-br from-white to-gray-50 p-6 text-center shadow-sm ring-1 ring-gray-100 transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-cyan-500/10">
            <div className="mb-4 flex items-center justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-teal-500 text-white shadow-lg shadow-cyan-500/30">
                <i className="ri-heart-line text-3xl"></i>
              </div>
            </div>
            <div className="mb-2 text-4xl font-bold text-cyan-600">+{gdnStats.qualifications}%</div>
            <div className="font-medium text-gray-600">{t("works.stats.clientSatisfaction")}</div>
          </div>

          <div className="group relative col-span-2 overflow-hidden rounded-2xl border border-gray-200 bg-gradient-to-br from-white to-gray-50 p-6 text-center shadow-sm ring-1 ring-gray-100 transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-cyan-500/10 md:col-span-1">
            <div className="mb-4 flex items-center justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-teal-500 text-white shadow-lg shadow-cyan-500/30">
                <i className="ri-customer-service-line text-3xl"></i>
              </div>
            </div>
            <div className="mb-2 text-4xl font-bold text-cyan-600">24/7</div>
            <div className="font-medium text-gray-600">{t("works.stats.supportAvailable")}</div>
          </div>
        </div>
      </div>
    </section>
  )
}
