"use client"

import { supabaseBrowser } from "@/utils/supabase/client"
import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import type { Project } from "@/interfaces/Project"
import type { Transaction } from "@/interfaces/Transaction"
import type { Review } from "@/interfaces/Review"
import type { AnalyticsData, Recommendation } from "@/interfaces/AnalyticsData"

const supabase = supabaseBrowser()

interface AnalyticsDashboardProps {
  userId: string
  userType: "freelancer" | "client"
}

export default function AnalyticsDashboard({ userId, userType }: AnalyticsDashboardProps) {
  const { t, i18n } = useTranslation()
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState("6months")
  const [metrics, setMetrics] = useState<AnalyticsData["metrics"] | null>(null)
  const [chartData, setChartData] = useState<AnalyticsData["monthlyData"]>([])
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [growthRate, setGrowthRate] = useState(0)

  useEffect(() => {
    loadAnalytics()
  }, [userId, timeRange])

  const loadAnalytics = async () => {
    try {
      setLoading(true)

      if (userType === "freelancer") {
        await loadFreelancerAnalytics()
      } else {
        await loadClientAnalytics()
      }
    } catch (error) {
      console.error(t("dashboard.analytics.error"), error)
    } finally {
      setLoading(false)
    }
  }

  const loadFreelancerAnalytics = async () => {
    // Cargar proyectos del freelancer sin reviews por ahora
    const { data: projects, error: projectsError } = await supabase
      .from("projects")
      .select("*")
      .eq("freelancer_id", userId)
      .eq("status", "completed")

    if (projectsError) {
      console.error("Error cargando proyectos:", projectsError)
      return
    }

    // Cargar reseñas por separado usando la estructura correcta
    const { data: reviews, error: reviewsError } = await supabase
      .from("reviews")
      .select("overall_rating, project_id")
      .in("project_id", projects?.map((p: Project) => p.id) || [])

    if (reviewsError) {
      console.warn("Error cargando reseñas:", reviewsError)
    }

    // Cargar transacciones del freelancer directamente
    const { data: transactions, error: transactionsError } = await supabase
      .from("transactions")
      .select("*")
      .eq("freelancer_id", userId)
      .eq("status", "succeeded")

    if (transactionsError) {
      console.error("Error cargando transacciones:", transactionsError)
      return
    }

    // Calcular métricas
    const totalEarnings =
      transactions?.reduce((sum: number, transaction: Transaction) => {
        return sum + (Number(transaction.amount) || 0)
      }, 0) || 0

    const currentMonth = new Date().getMonth()
    const currentYear = new Date().getFullYear()

    const monthlyEarnings =
      transactions
        ?.filter((t: Transaction) => {
          const transactionDate = new Date(t.created_at)
          return (
            transactionDate.getMonth() === currentMonth &&
            transactionDate.getFullYear() === currentYear
          )
        })
        .reduce((sum: number, t: Transaction) => sum + (Number(t.amount) || 0), 0) || 0

    const completedProjects = projects?.length || 0

    // Calcular rating promedio usando overall_rating
    const averageRating =
      reviews && reviews.length > 0
        ? reviews.reduce(
            (sum: number, review: Review) => sum + (review.overall_rating || 0),
            (sum: number, review: Review) => sum + (review.overall_rating || 0),
            0,
          ) / reviews.length
        : 0

    // Calcular crecimiento (comparar con mes anterior)
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear

    const lastMonthEarnings =
      transactions
        ?.filter((t: Transaction) => {
          const transactionDate = new Date(t.created_at)
          return (
            transactionDate.getMonth() === lastMonth &&
            transactionDate.getFullYear() === lastMonthYear
          )
        })
        .reduce((sum: number, t: Transaction) => sum + (Number(t.amount) || 0), 0) || 0

    const calculatedGrowthRate =
      lastMonthEarnings > 0
        ? ((monthlyEarnings - lastMonthEarnings) / lastMonthEarnings) * 100
        : monthlyEarnings > 0
          ? 100
          : 0

    setGrowthRate(calculatedGrowthRate)

    // Generar datos para gráficos (últimos 6 meses)
    const chartData = []
    for (let i = 5; i >= 0; i--) {
      const targetDate = new Date()
      targetDate.setMonth(targetDate.getMonth() - i)
      const month = targetDate.getMonth()
      const year = targetDate.getFullYear()

      const monthEarnings =
        transactions
          ?.filter((t: Transaction) => {
            const transactionDate = new Date(t.created_at)
            return transactionDate.getMonth() === month && transactionDate.getFullYear() === year
          })
          .reduce((sum: number, t: Transaction) => sum + (Number(t.amount) || 0), 0) || 0

      chartData.push({
        month: targetDate.toLocaleDateString(i18n.language === "en" ? "en-US" : "es-ES", {
          month: "short",
        }),
        earnings: monthEarnings,
        projects:
          projects?.filter((p: Project) => {
            if (!p.completed_at) return false
            const completedDate = new Date(p.completed_at)
            return completedDate.getMonth() === month && completedDate.getFullYear() === year
          }).length || 0,
      })
    }

    // Servicios más rentables (basado en categorías de proyectos)
    const serviceStats =
      projects?.reduce(
        (acc: Record<string, { earnings: number; count: number }>, project: Project) => {
          const category = project.project_type || "Otros"
          const projectEarnings =
            transactions
              ?.filter((t: Transaction) => t.project_id === project.id)
              .reduce((sum: number, t: Transaction) => sum + (Number(t.amount) || 0), 0) || 0

          if (!acc[category]) {
            acc[category] = { earnings: 0, count: 0 }
          }
          acc[category].earnings += projectEarnings
          acc[category].count += 1

          return acc
        },
        {} as Record<string, { earnings: number; count: number }>,
      ) || {}

    const topServices = (
      Object.entries(serviceStats) as [string, { earnings: number; count: number }][]
    )
      .map(([service, stats]) => ({
        service,
        earnings: stats.earnings,
        projects: stats.count,
      }))
      .sort((a, b) => b.earnings - a.earnings)
      .slice(0, 5)

    // Predicciones con IA (basadas en tendencias)
    const avgMonthlyEarnings = chartData.reduce((sum, data) => sum + data.earnings, 0) / 6
    const trend =
      chartData.length >= 2
        ? chartData[chartData.length - 1].earnings - chartData[chartData.length - 2].earnings
        : 0

    const predictedNextMonth = Math.max(0, avgMonthlyEarnings + trend)
    const predictedProjects = Math.ceil((completedProjects / 6) * 1.1) // 10% de crecimiento estimado

    const totalProjects = projects?.length || 0
    const totalReviews = reviews?.length || 0

    setMetrics({
      totalEarnings,
      totalProjects,
      completedProjects,
      activeProjects: 0,
      averageRating,
      totalReviews,
      monthlyEarnings,
      pendingEarnings: 0,
    })

    setChartData(chartData)

    // Configurar analytics con datos calculados
    setAnalytics({
      metrics: {
        totalEarnings,
        totalProjects,
        completedProjects,
        activeProjects: 0,
        averageRating,
        totalReviews,
        monthlyEarnings,
        pendingEarnings: 0,
      },
      monthlyData: chartData,
      topServices,
    })

    // Generar recomendaciones inteligentes
    const recommendations = []

    if (averageRating < 4.5) {
      recommendations.push({
        type: "rating",
        title: t("dashboard.analytics.recommendations.improveRating.title"),
        description: t("dashboard.analytics.recommendations.improveRating.description"),
        impact: "Alto",
      })
    }

    if (calculatedGrowthRate < 0) {
      recommendations.push({
        type: "growth",
        title: t("dashboard.analytics.recommendations.increaseIncome.title"),
        description: t("dashboard.analytics.recommendations.increaseIncome.description"),
        impact: "Alto",
      })
    }

    if (completedProjects < 5) {
      recommendations.push({
        type: "projects",
        title: t("dashboard.analytics.recommendations.completeMoreProjects.title"),
        description: t("dashboard.analytics.recommendations.completeMoreProjects.description"),
        impact: "Medio",
      })
    }

    recommendations.push({
      type: "optimization",
      title: t("dashboard.analytics.recommendations.optimizeProfile.title"),
      description: t("dashboard.analytics.recommendations.optimizeProfile.description"),
      impact: "Alto",
    })

    setRecommendations(recommendations)
  }

  const loadClientAnalytics = async () => {
    // Cargar proyectos del cliente
    const { data: projects, error: projectsError } = await supabase
      .from("projects")
      .select("*")
      .eq("client_id", userId)

    if (projectsError) {
      console.error("Error cargando proyectos del cliente:", projectsError)
      return
    }

    // Cargar reseñas por separado
    const { data: reviews, error: reviewsError } = await supabase
      .from("reviews")
      .select("overall_rating, project_id")
      .in("project_id", projects?.map((p: Project) => p.id) || [])

    if (reviewsError) {
      console.warn("Error cargando reseñas:", reviewsError)
    }

    // Cargar transacciones del cliente
    const { data: transactions, error: transactionsError } = await supabase
      .from("transactions")
      .select("*")
      .eq("client_id", userId)
      .eq("status", "succeeded")

    if (transactionsError) {
      console.error("Error cargando transacciones del cliente:", transactionsError)
      return
    }

    // Calcular métricas para cliente
    const totalSpent =
      transactions?.reduce((sum: number, transaction: Transaction) => {
        return sum + (Number(transaction.amount) || 0)
      }, 0) || 0

    const activeProjects = projects?.filter((p: Project) => p.status === "in_progress").length || 0
    const completedProjects = projects?.filter((p: Project) => p.status === "completed").length || 0
    const totalProjects = projects?.length || 0

    // Calcular satisfacción promedio basada en reseñas
    const averageSatisfaction =
      reviews && reviews.length > 0
        ? reviews.reduce((sum: number, review: Review) => sum + (review.overall_rating || 0), 0) /
          reviews.length
        : 0

    // Generar datos para gráficos de cliente
    const chartData = []
    for (let i = 5; i >= 0; i--) {
      const targetDate = new Date()
      targetDate.setMonth(targetDate.getMonth() - i)
      const month = targetDate.getMonth()
      const year = targetDate.getFullYear()

      const monthSpent =
        transactions
          ?.filter((t: Transaction) => {
            const transactionDate = new Date(t.created_at)
            return transactionDate.getMonth() === month && transactionDate.getFullYear() === year
          })
          .reduce((sum: number, t: Transaction) => sum + (Number(t.amount) || 0), 0) || 0

      chartData.push({
        month: targetDate.toLocaleDateString(i18n.language === "en" ? "en-US" : "es-ES", {
          month: "short",
        }),
        earnings: monthSpent,
        projects:
          projects?.filter((p: Project) => {
            if (!p.created_at) return false
            const createdDate = new Date(p.created_at)
            return createdDate.getMonth() === month && createdDate.getFullYear() === year
          }).length || 0,
      })
    }

    const totalReviews = reviews?.length || 0

    setMetrics({
      totalEarnings: totalSpent,
      totalProjects,
      completedProjects,
      activeProjects,
      averageRating: averageSatisfaction,
      totalReviews,
      monthlyEarnings: chartData[chartData.length - 1]?.earnings || 0,
      pendingEarnings: 0,
    })

    setChartData(chartData)

    // Configurar analytics para cliente
    setAnalytics({
      metrics: {
        totalEarnings: totalSpent,
        totalProjects,
        completedProjects,
        activeProjects,
        averageRating: averageSatisfaction,
        totalReviews,
        monthlyEarnings: chartData[chartData.length - 1]?.earnings || 0,
        pendingEarnings: 0,
      },
      monthlyData: chartData,
      topServices: [],
    })

    // Recomendaciones para clientes
    const recommendations = []

    if (activeProjects === 0 && completedProjects > 0) {
      recommendations.push({
        type: "projects",
        title: t("dashboard.analytics.recommendations.startNewProject.title"),
        description: t("dashboard.analytics.recommendations.startNewProject.description"),
        impact: "Alto",
      })
    }

    if (averageSatisfaction < 4.0 && reviews && reviews.length > 0) {
      recommendations.push({
        type: "satisfaction",
        title: t("dashboard.analytics.recommendations.improveCommunication.title"),
        description: t("dashboard.analytics.recommendations.improveCommunication.description"),
        impact: "Medio",
      })
    }

    recommendations.push({
      type: "optimization",
      title: t("dashboard.analytics.recommendations.exploreFreelancers.title"),
      description: t("dashboard.analytics.recommendations.exploreFreelancers.description"),
      impact: "Medio",
    })

    setRecommendations(recommendations)
  }

  if (loading) {
    return (
      <div className="rounded-xl bg-white p-6 shadow-lg">
        <div className="animate-pulse">
          <div className="mb-4 h-6 w-1/3 rounded bg-gray-200"></div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {[1, 2, 3].map((i: number) => (
              <div key={i} className="h-24 rounded bg-gray-200"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!analytics) {
    return (
      <div className="rounded-xl bg-white p-6 text-center shadow-lg">
        <i className="ri-bar-chart-line mb-4 text-4xl text-gray-400"></i>
        <h3 className="mb-2 text-lg font-semibold text-gray-900">
          {t("dashboard.analytics.noData.title")}
        </h3>
        <p className="text-gray-600">{t("dashboard.analytics.noData.description")}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header con filtros */}
      <div className="rounded-xl bg-white p-6 shadow-lg">
        <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
          <div>
            <h2 className="flex items-center text-2xl font-bold text-gray-900">
              <i className="ri-bar-chart-line text-primary mr-3"></i>
              {t("dashboard.analytics.title")}
            </h2>
            <p className="mt-1 text-gray-600">
              {userType === "freelancer"
                ? t("dashboard.analytics.subtitle.freelancer")
                : t("dashboard.analytics.subtitle.client")}
            </p>
          </div>
          <select
            value={timeRange}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setTimeRange(e.target.value)}
            className="focus:ring-primary rounded-lg border border-gray-300 px-4 py-2 pr-8 focus:ring-2"
          >
            <option value="3months">{t("dashboard.analytics.timeRange.3months")}</option>
            <option value="6months">{t("dashboard.analytics.timeRange.6months")}</option>
            <option value="1year">{t("dashboard.analytics.timeRange.1year")}</option>
          </select>
        </div>
      </div>

      {/* Métricas principales */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <div className="to-primary from-primary rounded-xl bg-gradient-to-br p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-100">
                {userType === "freelancer"
                  ? t("dashboard.analytics.metrics.totalEarnings")
                  : t("dashboard.analytics.metrics.totalInvestment")}
              </p>
              <p className="mt-1 text-3xl font-bold">
                ${analytics.metrics.totalEarnings.toLocaleString()}
              </p>
              <div className="mt-2 flex items-center">
                <i className="ri-arrow-up-line mr-1 text-green-300"></i>
                <span className="text-sm text-green-300">
                  {t("dashboard.analytics.metrics.growthThisMonth", {
                    rate: growthRate.toFixed(1),
                  })}
                </span>
              </div>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-400">
              <i className="ri-money-dollar-circle-line text-2xl"></i>
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-emerald-100">
                {t("dashboard.analytics.metrics.thisMonth")}
              </p>
              <p className="mt-1 text-3xl font-bold">
                ${analytics.metrics.monthlyEarnings.toLocaleString()}
              </p>
              <div className="mt-2 flex items-center">
                <i className="ri-calendar-line mr-1 text-emerald-300"></i>
                <span className="text-sm text-emerald-300">
                  {t("dashboard.analytics.metrics.currentMonth")}
                </span>
              </div>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-400">
              <i className="ri-calendar-check-line text-2xl"></i>
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-100">
                {t("dashboard.analytics.metrics.completedProjects")}
              </p>
              <p className="mt-1 text-3xl font-bold">{analytics.metrics.completedProjects}</p>
              <div className="mt-2 flex items-center">
                <i className="ri-check-line mr-1 text-purple-300"></i>
                <span className="text-sm text-purple-300">
                  {t("dashboard.analytics.metrics.finished")}
                </span>
              </div>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-400">
              <i className="ri-briefcase-line text-2xl"></i>
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-amber-100">
                {t("dashboard.analytics.metrics.averageRating")}
              </p>
              <p className="mt-1 text-3xl font-bold">
                {analytics.metrics.averageRating.toFixed(1)}
              </p>
              <div className="mt-2 flex items-center">
                {[1, 2, 3, 4, 5].map((star: number) => (
                  <i
                    key={star}
                    className={`ri-star-${star <= analytics.metrics.averageRating ? "fill" : "line"} text-sm text-amber-300`}
                  ></i>
                ))}
              </div>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-amber-400">
              <i className="ri-star-line text-2xl"></i>
            </div>
          </div>
        </div>
      </div>

      {/* Gráfico de ingresos mensuales */}
      {userType === "freelancer" && analytics.monthlyData.length > 0 && (
        <div className="rounded-xl bg-white p-6 shadow-lg">
          <h3 className="mb-6 flex items-center text-lg font-semibold text-gray-900">
            <i className="ri-line-chart-line text-primary mr-2"></i>
            {t("dashboard.analytics.charts.earningsEvolution")}
          </h3>
          <div className="space-y-4">
            {analytics.monthlyData.map((month: AnalyticsData["monthlyData"][0], index: number) => {
              const maxEarnings = Math.max(
                ...analytics.monthlyData.map((m: AnalyticsData["monthlyData"][0]) => m.earnings),
              )
              const percentage = maxEarnings > 0 ? (month.earnings / maxEarnings) * 100 : 0

              return (
                <div key={index} className="flex items-center space-x-4">
                  <div className="w-12 text-sm font-medium text-gray-600">{month.month}</div>
                  <div className="flex-1">
                    <div className="relative h-3 overflow-hidden rounded-full bg-gray-200">
                      <div
                        className="to-primary from-primary h-full rounded-full bg-gradient-to-r transition-all duration-1000"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="w-20 text-right">
                    <span className="text-sm font-semibold text-gray-900">
                      ${month.earnings.toLocaleString()}
                    </span>
                    <div className="text-xs text-gray-500">
                      {month.projects} {t("dashboard.analytics.charts.projects")}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Servicios más rentables */}
      {userType === "freelancer" && analytics.topServices.length > 0 && (
        <div className="rounded-xl bg-white p-6 shadow-lg">
          <h3 className="mb-6 flex items-center text-lg font-semibold text-gray-900">
            <i className="ri-trophy-line mr-2 text-amber-600"></i>
            {t("dashboard.analytics.charts.topServices")}
          </h3>
          <div className="space-y-4">
            {analytics.topServices.map(
              (service: AnalyticsData["topServices"][0], index: number) => {
                const maxEarnings = Math.max(
                  ...analytics.topServices.map((s: AnalyticsData["topServices"][0]) => s.earnings),
                )
                const percentage = maxEarnings > 0 ? (service.earnings / maxEarnings) * 100 : 0

                return (
                  <div key={index} className="flex items-center space-x-4">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-amber-400 to-amber-500 text-sm font-bold text-white">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="mb-1 flex items-center justify-between">
                        <span className="font-medium text-gray-900">{service.service}</span>
                        <span className="text-sm text-gray-600">
                          {service.projects} {t("dashboard.analytics.charts.projects")}
                        </span>
                      </div>
                      <div className="relative h-2 overflow-hidden rounded-full bg-gray-200">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-500 transition-all duration-1000"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-semibold text-gray-900">
                        ${service.earnings.toLocaleString()}
                      </span>
                    </div>
                  </div>
                )
              },
            )}
          </div>
        </div>
      )}

      {/* Predicciones y recomendaciones */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-indigo-200 bg-gradient-to-br from-indigo-50 to-blue-50 p-6">
          <h3 className="mb-4 flex items-center text-lg font-semibold text-indigo-900">
            <i className="ri-crystal-ball-line mr-2"></i>
            {t("dashboard.analytics.predictions.title")}
          </h3>
          <div className="space-y-4">
            <div className="rounded-lg border border-indigo-100 bg-white p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">
                  {t("dashboard.analytics.predictions.nextMonthEarnings")}
                </span>
                <span className="font-semibold text-indigo-600">
                  ${Math.round(analytics.metrics.monthlyEarnings * 1.15).toLocaleString()}
                </span>
              </div>
            </div>
            <div className="rounded-lg border border-indigo-100 bg-white p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">
                  {t("dashboard.analytics.predictions.estimatedProjects")}
                </span>
                <span className="font-semibold text-indigo-600">
                  {Math.round(analytics.metrics.completedProjects * 0.3)}{" "}
                  {t("dashboard.analytics.predictions.new")}
                </span>
              </div>
            </div>
            <div className="rounded-lg border border-indigo-100 bg-white p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">
                  {t("dashboard.analytics.predictions.expectedGrowth")}
                </span>
                <span className="font-semibold text-green-600">+18%</span>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-green-50 p-6">
          <h3 className="mb-4 flex items-center text-lg font-semibold text-emerald-900">
            <i className="ri-lightbulb-line mr-2"></i>
            {t("dashboard.analytics.recommendations.title")}
          </h3>
          <div className="space-y-3">
            {recommendations.length > 0 ? (
              recommendations.map((rec, index) => (
                <div key={index} className="rounded-lg border border-emerald-100 bg-white p-4">
                  <div className="flex items-start space-x-3">
                    <i className="ri-arrow-up-circle-line mt-1 text-emerald-600"></i>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{rec.title}</p>
                      <p className="text-xs text-gray-600">{rec.description}</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <>
                <div className="rounded-lg border border-emerald-100 bg-white p-4">
                  <div className="flex items-start space-x-3">
                    <i className="ri-arrow-up-circle-line mt-1 text-emerald-600"></i>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {t("dashboard.analytics.recommendations.increaseRates.title")}
                      </p>
                      <p className="text-xs text-gray-600">
                        {t("dashboard.analytics.recommendations.increaseRates.description")}
                      </p>
                    </div>
                  </div>
                </div>
                {analytics.topServices[0] && (
                  <div className="rounded-lg border border-emerald-100 bg-white p-4">
                    <div className="flex items-start space-x-3">
                      <i className="ri-target-line mt-1 text-emerald-600"></i>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {t("dashboard.analytics.recommendations.focusService.title", {
                            service: analytics.topServices[0].service,
                          })}
                        </p>
                        <p className="text-xs text-gray-600">
                          {t("dashboard.analytics.recommendations.focusService.description")}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                <div className="rounded-lg border border-emerald-100 bg-white p-4">
                  <div className="flex items-start space-x-3">
                    <i className="ri-time-line mt-1 text-emerald-600"></i>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {t("dashboard.analytics.recommendations.optimizeTime.title")}
                      </p>
                      <p className="text-xs text-gray-600">
                        {t("dashboard.analytics.recommendations.optimizeTime.description")}
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
