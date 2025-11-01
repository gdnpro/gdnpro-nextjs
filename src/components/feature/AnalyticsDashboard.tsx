"use client"

import { supabase } from "@/db/supabase"
import { useState, useEffect } from "react"

interface AnalyticsData {
  totalEarnings: number
  monthlyEarnings: number
  projectsCompleted: number
  averageRating: number
  clientRetention: number
  earningsGrowth: number
  monthlyData: Array<{
    month: string
    earnings: number
    projects: number
  }>
  topServices: Array<{
    service: string
    earnings: number
    count: number
  }>
}

interface AnalyticsDashboardProps {
  userId: string
  userType: "freelancer" | "client"
}

export default function AnalyticsDashboard({
  userId,
  userType,
}: AnalyticsDashboardProps) {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState("6months")
  const [metrics, setMetrics] = useState<any>(null)
  const [chartData, setChartData] = useState<any[]>([])
  const [recommendations, setRecommendations] = useState<any[]>([])

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
      console.error("Error cargando analytics:", error)
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
      .in("project_id", projects?.map((p) => p.id) || [])

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
      transactions?.reduce((sum, transaction) => {
        return sum + (Number(transaction.amount) || 0)
      }, 0) || 0

    const currentMonth = new Date().getMonth()
    const currentYear = new Date().getFullYear()

    const monthlyEarnings =
      transactions
        ?.filter((t) => {
          const transactionDate = new Date(t.created_at)
          return (
            transactionDate.getMonth() === currentMonth &&
            transactionDate.getFullYear() === currentYear
          )
        })
        .reduce((sum, t) => sum + (Number(t.amount) || 0), 0) || 0

    const completedProjects = projects?.length || 0

    // Calcular rating promedio usando overall_rating
    const averageRating =
      reviews && reviews.length > 0
        ? reviews.reduce(
            (sum, review) => sum + (review.overall_rating || 0),
            0
          ) / reviews.length
        : 0

    // Calcular crecimiento (comparar con mes anterior)
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear

    const lastMonthEarnings =
      transactions
        ?.filter((t) => {
          const transactionDate = new Date(t.created_at)
          return (
            transactionDate.getMonth() === lastMonth &&
            transactionDate.getFullYear() === lastMonthYear
          )
        })
        .reduce((sum, t) => sum + (Number(t.amount) || 0), 0) || 0

    const growthRate =
      lastMonthEarnings > 0
        ? ((monthlyEarnings - lastMonthEarnings) / lastMonthEarnings) * 100
        : monthlyEarnings > 0
          ? 100
          : 0

    // Generar datos para gráficos (últimos 6 meses)
    const chartData = []
    for (let i = 5; i >= 0; i--) {
      const targetDate = new Date()
      targetDate.setMonth(targetDate.getMonth() - i)
      const month = targetDate.getMonth()
      const year = targetDate.getFullYear()

      const monthEarnings =
        transactions
          ?.filter((t) => {
            const transactionDate = new Date(t.created_at)
            return (
              transactionDate.getMonth() === month &&
              transactionDate.getFullYear() === year
            )
          })
          .reduce((sum, t) => sum + (Number(t.amount) || 0), 0) || 0

      chartData.push({
        month: targetDate.toLocaleDateString("es-ES", { month: "short" }),
        earnings: monthEarnings,
        projects:
          projects?.filter((p) => {
            if (!p.completed_at) return false
            const completedDate = new Date(p.completed_at)
            return (
              completedDate.getMonth() === month &&
              completedDate.getFullYear() === year
            )
          }).length || 0,
      })
    }

    // Servicios más rentables (basado en categorías de proyectos)
    const serviceStats =
      projects?.reduce((acc: any, project) => {
        const category = project.category || "Otros"
        const projectEarnings =
          transactions
            ?.filter((t) => t.project_id === project.id)
            .reduce((sum, t) => sum + (Number(t.amount) || 0), 0) || 0

        if (!acc[category]) {
          acc[category] = { earnings: 0, count: 0 }
        }
        acc[category].earnings += projectEarnings
        acc[category].count += 1

        return acc
      }, {}) || {}

    const topServices = Object.entries(serviceStats)
      .map(([service, stats]: [string, any]) => ({
        service,
        earnings: stats.earnings,
        count: stats.count,
      }))
      .sort((a, b) => b.earnings - a.earnings)
      .slice(0, 5)

    // Predicciones con IA (basadas en tendencias)
    const avgMonthlyEarnings =
      chartData.reduce((sum, data) => sum + data.earnings, 0) / 6
    const trend =
      chartData.length >= 2
        ? chartData[chartData.length - 1].earnings -
          chartData[chartData.length - 2].earnings
        : 0

    const predictedNextMonth = Math.max(0, avgMonthlyEarnings + trend)
    const predictedProjects = Math.ceil((completedProjects / 6) * 1.1) // 10% de crecimiento estimado

    setMetrics({
      totalEarnings,
      monthlyEarnings,
      completedProjects,
      averageRating,
      growthRate,
      predictedNextMonth,
      predictedProjects,
    })

    setChartData(chartData)

    // Configurar analytics con datos calculados
    setAnalytics({
      totalEarnings,
      monthlyEarnings,
      projectsCompleted: completedProjects,
      averageRating,
      clientRetention: 85, // Valor por defecto
      earningsGrowth: growthRate,
      monthlyData: chartData,
      topServices,
    })

    // Generar recomendaciones inteligentes
    const recommendations = []

    if (averageRating < 4.5) {
      recommendations.push({
        type: "rating",
        title: "Mejora tu calificación",
        description: "Enfócate en la calidad para obtener mejores reseñas",
        impact: "Alto",
      })
    }

    if (growthRate < 0) {
      recommendations.push({
        type: "growth",
        title: "Aumenta tus ingresos",
        description: "Considera subir tus tarifas o tomar más proyectos",
        impact: "Alto",
      })
    }

    if (completedProjects < 5) {
      recommendations.push({
        type: "projects",
        title: "Completa más proyectos",
        description: "Más proyectos = mejor reputación y más ingresos",
        impact: "Medio",
      })
    }

    recommendations.push({
      type: "optimization",
      title: "Optimiza tu perfil",
      description: "Un perfil completo atrae 3x más clientes",
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
      .in("project_id", projects?.map((p) => p.id) || [])

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
      console.error(
        "Error cargando transacciones del cliente:",
        transactionsError
      )
      return
    }

    // Calcular métricas para cliente
    const totalSpent =
      transactions?.reduce((sum, transaction) => {
        return sum + (Number(transaction.amount) || 0)
      }, 0) || 0

    const activeProjects =
      projects?.filter((p) => p.status === "in_progress").length || 0
    const completedProjects =
      projects?.filter((p) => p.status === "completed").length || 0
    const totalProjects = projects?.length || 0

    // Calcular satisfacción promedio basada en reseñas
    const averageSatisfaction =
      reviews && reviews.length > 0
        ? reviews.reduce(
            (sum, review) => sum + (review.overall_rating || 0),
            0
          ) / reviews.length
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
          ?.filter((t) => {
            const transactionDate = new Date(t.created_at)
            return (
              transactionDate.getMonth() === month &&
              transactionDate.getFullYear() === year
            )
          })
          .reduce((sum, t) => sum + (Number(t.amount) || 0), 0) || 0

      chartData.push({
        month: targetDate.toLocaleDateString("es-ES", { month: "short" }),
        earnings: monthSpent,
        projects:
          projects?.filter((p) => {
            if (!p.created_at) return false
            const createdDate = new Date(p.created_at)
            return (
              createdDate.getMonth() === month &&
              createdDate.getFullYear() === year
            )
          }).length || 0,
      })
    }

    setMetrics({
      totalEarnings: totalSpent,
      monthlyEarnings: chartData[chartData.length - 1]?.earnings || 0,
      completedProjects,
      averageRating: averageSatisfaction,
      activeProjects,
      totalProjects,
      growthRate: 0, // Para clientes, no calculamos crecimiento de la misma manera
    })

    setChartData(chartData)

    // Configurar analytics para cliente
    setAnalytics({
      totalEarnings: totalSpent,
      monthlyEarnings: chartData[chartData.length - 1]?.earnings || 0,
      projectsCompleted: completedProjects,
      averageRating: averageSatisfaction,
      clientRetention: 90,
      earningsGrowth: 0,
      monthlyData: chartData,
      topServices: [],
    })

    // Recomendaciones para clientes
    const recommendations = []

    if (activeProjects === 0 && completedProjects > 0) {
      recommendations.push({
        type: "projects",
        title: "Inicia un nuevo proyecto",
        description:
          "Tienes freelancers de confianza esperando trabajar contigo",
        impact: "Alto",
      })
    }

    if (averageSatisfaction < 4.0 && reviews && reviews.length > 0) {
      recommendations.push({
        type: "satisfaction",
        title: "Mejora la comunicación",
        description: "Una mejor comunicación lleva a mejores resultados",
        impact: "Medio",
      })
    }

    recommendations.push({
      type: "optimization",
      title: "Explora nuevos freelancers",
      description:
        "Diversifica tu red de colaboradores para mejores resultados",
      impact: "Medio",
    })

    setRecommendations(recommendations)
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!analytics) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6 text-center">
        <i className="ri-bar-chart-line text-4xl text-gray-400 mb-4"></i>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Sin datos suficientes
        </h3>
        <p className="text-gray-600">
          Completa algunos proyectos para ver tus analytics
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header con filtros */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              <i className="ri-bar-chart-line mr-3 text-primary"></i>
              Analytics Profesionales
            </h2>
            <p className="text-gray-600 mt-1">
              {userType === "freelancer"
                ? "Análisis de tu rendimiento como freelancer"
                : "Análisis de tus proyectos como cliente"}
            </p>
          </div>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 pr-8"
          >
            <option value="3months">Últimos 3 meses</option>
            <option value="6months">Últimos 6 meses</option>
            <option value="1year">Último año</option>
          </select>
        </div>
      </div>

      {/* Métricas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-primary rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">
                {userType === "freelancer"
                  ? "Ingresos Totales"
                  : "Inversión Total"}
              </p>
              <p className="text-3xl font-bold mt-1">
                ${analytics.totalEarnings.toLocaleString()}
              </p>
              <div className="flex items-center mt-2">
                <i className="ri-arrow-up-line text-green-300 mr-1"></i>
                <span className="text-green-300 text-sm">
                  +{analytics.earningsGrowth.toFixed(1)}% este mes
                </span>
              </div>
            </div>
            <div className="w-12 h-12 bg-blue-400 rounded-lg flex items-center justify-center">
              <i className="ri-money-dollar-circle-line text-2xl"></i>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-emerald-100 text-sm font-medium">Este Mes</p>
              <p className="text-3xl font-bold mt-1">
                ${analytics.monthlyEarnings.toLocaleString()}
              </p>
              <div className="flex items-center mt-2">
                <i className="ri-calendar-line text-emerald-300 mr-1"></i>
                <span className="text-emerald-300 text-sm">Mes actual</span>
              </div>
            </div>
            <div className="w-12 h-12 bg-emerald-400 rounded-lg flex items-center justify-center">
              <i className="ri-calendar-check-line text-2xl"></i>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm font-medium">
                Proyectos Completados
              </p>
              <p className="text-3xl font-bold mt-1">
                {analytics.projectsCompleted}
              </p>
              <div className="flex items-center mt-2">
                <i className="ri-check-line text-purple-300 mr-1"></i>
                <span className="text-purple-300 text-sm">Finalizados</span>
              </div>
            </div>
            <div className="w-12 h-12 bg-purple-400 rounded-lg flex items-center justify-center">
              <i className="ri-briefcase-line text-2xl"></i>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-amber-100 text-sm font-medium">
                Rating Promedio
              </p>
              <p className="text-3xl font-bold mt-1">
                {analytics.averageRating.toFixed(1)}
              </p>
              <div className="flex items-center mt-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <i
                    key={star}
                    className={`ri-star-${star <= analytics.averageRating ? "fill" : "line"} text-amber-300 text-sm`}
                  ></i>
                ))}
              </div>
            </div>
            <div className="w-12 h-12 bg-amber-400 rounded-lg flex items-center justify-center">
              <i className="ri-star-line text-2xl"></i>
            </div>
          </div>
        </div>
      </div>

      {/* Gráfico de ingresos mensuales */}
      {userType === "freelancer" && analytics.monthlyData.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
            <i className="ri-line-chart-line mr-2 text-primary"></i>
            Evolución de Ingresos
          </h3>
          <div className="space-y-4">
            {analytics.monthlyData.map((month, index) => {
              const maxEarnings = Math.max(
                ...analytics.monthlyData.map((m) => m.earnings)
              )
              const percentage =
                maxEarnings > 0 ? (month.earnings / maxEarnings) * 100 : 0

              return (
                <div key={index} className="flex items-center space-x-4">
                  <div className="w-12 text-sm font-medium text-gray-600">
                    {month.month}
                  </div>
                  <div className="flex-1">
                    <div className="bg-gray-200 rounded-full h-3 relative overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-primary h-full rounded-full transition-all duration-1000"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="w-20 text-right">
                    <span className="text-sm font-semibold text-gray-900">
                      ${month.earnings.toLocaleString()}
                    </span>
                    <div className="text-xs text-gray-500">
                      {month.projects} proyectos
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
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
            <i className="ri-trophy-line mr-2 text-amber-600"></i>
            Servicios Más Rentables
          </h3>
          <div className="space-y-4">
            {analytics.topServices.map((service, index) => {
              const maxEarnings = Math.max(
                ...analytics.topServices.map((s) => s.earnings)
              )
              const percentage =
                maxEarnings > 0 ? (service.earnings / maxEarnings) * 100 : 0

              return (
                <div key={index} className="flex items-center space-x-4">
                  <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-amber-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-medium text-gray-900">
                        {service.service}
                      </span>
                      <span className="text-sm text-gray-600">
                        {service.count} proyectos
                      </span>
                    </div>
                    <div className="bg-gray-200 rounded-full h-2 relative overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-amber-400 to-amber-500 h-full rounded-full transition-all duration-1000"
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
            })}
          </div>
        </div>
      )}

      {/* Predicciones y recomendaciones */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl border border-indigo-200 p-6">
          <h3 className="text-lg font-semibold text-indigo-900 mb-4 flex items-center">
            <i className="ri-crystal-ball-line mr-2"></i>
            Predicciones IA
          </h3>
          <div className="space-y-4">
            <div className="bg-white rounded-lg p-4 border border-indigo-100">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">
                  Ingresos próximo mes
                </span>
                <span className="font-semibold text-indigo-600">
                  $
                  {Math.round(
                    analytics.monthlyEarnings * 1.15
                  ).toLocaleString()}
                </span>
              </div>
            </div>
            <div className="bg-white rounded-lg p-4 border border-indigo-100">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">
                  Proyectos estimados
                </span>
                <span className="font-semibold text-indigo-600">
                  {Math.round(analytics.projectsCompleted * 0.3)} nuevos
                </span>
              </div>
            </div>
            <div className="bg-white rounded-lg p-4 border border-indigo-100">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">
                  Crecimiento esperado
                </span>
                <span className="font-semibold text-green-600">+18%</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl border border-emerald-200 p-6">
          <h3 className="text-lg font-semibold text-emerald-900 mb-4 flex items-center">
            <i className="ri-lightbulb-line mr-2"></i>
            Recomendaciones IA
          </h3>
          <div className="space-y-3">
            <div className="bg-white rounded-lg p-4 border border-emerald-100">
              <div className="flex items-start space-x-3">
                <i className="ri-arrow-up-circle-line text-emerald-600 mt-1"></i>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Aumenta tus tarifas
                  </p>
                  <p className="text-xs text-gray-600">
                    Tu rating es excelente, puedes cobrar 20% más
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg p-4 border border-emerald-100">
              <div className="flex items-start space-x-3">
                <i className="ri-target-line text-emerald-600 mt-1"></i>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Enfócate en{" "}
                    {analytics.topServices[0]?.service || "tu mejor servicio"}
                  </p>
                  <p className="text-xs text-gray-600">
                    Es tu servicio más rentable
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg p-4 border border-emerald-100">
              <div className="flex items-start space-x-3">
                <i className="ri-time-line text-emerald-600 mt-1"></i>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Optimiza tu tiempo
                  </p>
                  <p className="text-xs text-gray-600">
                    Puedes manejar 2 proyectos más este mes
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
