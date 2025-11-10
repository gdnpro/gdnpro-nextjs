"use client"

import { useRouter } from "next/navigation"
import { useTranslation } from "react-i18next"

export default function JoinFreelancer() {
  const { t } = useTranslation()
  const router = useRouter()

  return (
    <section id="join-freelancer" className="bg-white py-20">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-16 text-center">
          <h2 className="mb-6 text-4xl font-bold text-gray-900 md:text-5xl">
            {t("freelancers.join.title")}
          </h2>
          <p className="mx-auto max-w-3xl text-xl text-gray-600">
            {t("freelancers.join.description")}
          </p>
        </div>

        <div className="mb-16 flex flex-col justify-center gap-6 sm:flex-row">
          <button
            onClick={() => router.push("/auth/register")}
            className="bg-primary cursor-pointer rounded-full px-12 py-5 text-xl font-bold whitespace-nowrap text-white transition-all hover:scale-105 hover:bg-cyan-700"
          >
            {t("freelancers.join.joinButton")}
          </button>
        </div>

        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
          <div className="rounded-2xl bg-blue-50 p-8">
            <h3 className="mb-6 text-2xl font-bold text-gray-900">{t("freelancers.join.whyJoin")}</h3>

            <div className="space-y-6">
              <div className="flex items-start">
                <div className="mr-4 flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-100">
                  <i className="ri-money-dollar-circle-line text-primary text-xl"></i>
                </div>
                <div>
                  <h4 className="mb-1 font-semibold text-gray-900">{t("freelancers.join.guaranteedPayments")}</h4>
                  <p className="text-gray-600">
                    {t("freelancers.join.guaranteedPaymentsDesc")}
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="mr-4 flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-100">
                  <i className="ri-shield-check-line text-primary text-xl"></i>
                </div>
                <div>
                  <h4 className="mb-1 font-semibold text-gray-900">{t("freelancers.join.verifiedClients")}</h4>
                  <p className="text-gray-600">
                    {t("freelancers.join.verifiedClientsDesc")}
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="mr-4 flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-100">
                  <i className="ri-team-line text-primary text-xl"></i>
                </div>
                <div>
                  <h4 className="mb-1 font-semibold text-gray-900">{t("freelancers.join.support247")}</h4>
                  <p className="text-gray-600">{t("freelancers.join.support247Desc")}</p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="mr-4 flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-100">
                  <i className="ri-rocket-line text-primary text-xl"></i>
                </div>
                <div>
                  <h4 className="mb-1 font-semibold text-gray-900">{t("freelancers.join.qualityProjects")}</h4>
                  <p className="text-gray-600">
                    {t("freelancers.join.qualityProjectsDesc")}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col justify-center rounded-2xl bg-gray-900 p-8 text-white">
            <h3 className="mb-4 text-2xl font-bold">{t("freelancers.join.competitiveCommission")}</h3>
            <div className="mb-2 text-4xl font-bold text-cyan-400">{t("freelancers.join.commissionRate")}</div>
            <p className="mb-6 text-lg text-gray-300">
              {t("freelancers.join.commissionDesc")}
            </p>
            <ul className="space-y-3 text-gray-300">
              <li className="flex items-center">
                <i className="ri-check-line mr-2 text-green-400"></i>
                {t("freelancers.join.noHiddenCosts")}
              </li>
              <li className="flex items-center">
                <i className="ri-check-line mr-2 text-green-400"></i>
                {t("freelancers.join.weeklyPayments")}
              </li>
              <li className="flex items-center">
                <i className="ri-check-line mr-2 text-green-400"></i>
                {t("freelancers.join.multiplePaymentMethods")}
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}
