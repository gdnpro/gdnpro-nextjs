"use client"

import { supabaseBrowser } from "@/utils/supabase/client"
import type { Project } from "@/interfaces/Project"
import type { Transaction } from "@/interfaces/Transaction"
import { useState, useEffect } from "react"

const supabase = supabaseBrowser()

interface PaymentsTabProps {
  userType: "client" | "freelancer"
}

export default function PaymentsTab({ userType }: PaymentsTabProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [filter, setFilter] = useState("all")
  const [showProjectDetails, setShowProjectDetails] = useState(false)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) {
        throw new Error("No hay sesión activa")
      }

      // Obtener perfil del usuario
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", session.user.id)
        .single()

      if (!profile) {
        throw new Error("Perfil no encontrado")
      }

      // Cargar transacciones
      const response = await fetch(
        "https://kdmdhhhppizzlhvauofe.supabase.co/functions/v1/stripe-payments",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            action: "get-transactions",
          }),
        },
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Error al cargar transacciones")
      }

      setTransactions(data.transactions || [])

      // Cargar proyectos pagados según el tipo de usuario
      let projectsQuery

      if (userType === "client") {
        projectsQuery = supabase
          .from("projects")
          .select(
            `
            *,
            freelancer:profiles!projects_freelancer_id_fkey(
              id, full_name, email, rating, skills
            )
          `,
          )
          .eq("client_id", profile.id)
          .not("freelancer_id", "is", null) // Solo proyectos con freelancer asignado
          .in("status", ["in_progress", "completed"])
      } else {
        projectsQuery = supabase
          .from("projects")
          .select(
            `
            *,
            client:profiles!projects_client_id_fkey(
              id, full_name, email, rating
            )
          `,
          )
          .eq("freelancer_id", profile.id)
          .in("status", ["in_progress", "completed"])
      }

      const { data: projectsData, error: projectsError } = await projectsQuery

      if (projectsError) {
        console.error("Error cargando proyectos:", projectsError)
      } else {
        setProjects(projectsData || [])
      }
    } catch (error: unknown) {
      console.error("❌ Error cargando datos:", error)
      const errorMessage = error instanceof Error ? error.message : "Unknown error"
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const viewProjectDetails = (project: Project) => {
    setSelectedProject(project)
    setShowProjectDetails(true)
  }

  const filteredTransactions = transactions.filter((transaction) => {
    if (filter === "all") return true
    return transaction.status === filter
  })

  const filteredProjects = projects.filter((project) => {
    if (filter === "all") return true
    if (filter === "paid") return project.payment_status === "paid"
    if (filter === "pending") return project.payment_status === "pending" || !project.payment_status
    return false
  })

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "paid":
        return <i className="ri-check-circle-fill text-green-500"></i>
      case "pending":
        return <i className="ri-time-line text-yellow-500"></i>
      case "failed":
        return <i className="ri-close-circle-fill text-red-500"></i>
      case "refunded":
        return <i className="ri-refund-line text-blue-500"></i>
      default:
        return <i className="ri-question-line text-gray-500"></i>
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "paid":
        return "Completado"
      case "pending":
        return "Pendiente"
      case "failed":
        return "Fallido"
      case "refunded":
        return "Reembolsado"
      default:
        return status
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "failed":
        return "bg-red-100 text-red-800"
      case "refunded":
        return "bg-primary/10 text-blue-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const calculateTotals = () => {
    const paidTransactions = transactions.filter((t) => t.status === "paid")
    const totalAmount = paidTransactions.reduce((sum, t) => sum + t.amount, 0)
    const thisMonth = paidTransactions.filter((t) => {
      const transactionDate = new Date(t.paid_at || t.created_at)
      const now = new Date()
      return (
        transactionDate.getMonth() === now.getMonth() &&
        transactionDate.getFullYear() === now.getFullYear()
      )
    })
    const monthlyAmount = thisMonth.reduce((sum, t) => sum + t.amount, 0)

    return {
      totalAmount,
      monthlyAmount,
      totalTransactions: paidTransactions.length,
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="border-primary mx-auto h-8 w-8 animate-spin rounded-full border-b-2"></div>
          <p className="mt-2 text-gray-600">Cargando información de pagos...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="py-12 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
          <i className="ri-error-warning-line text-2xl text-red-600"></i>
        </div>
        <h3 className="mb-2 text-lg font-medium text-gray-900">Error al cargar</h3>
        <p className="mb-4 text-gray-600">{error}</p>
        <button
          onClick={loadData}
          className="bg-primary cursor-pointer rounded-lg px-4 py-2 whitespace-nowrap text-white transition-colors hover:bg-cyan-700"
        >
          Intentar de Nuevo
        </button>
      </div>
    )
  }

  const { totalAmount, monthlyAmount } = calculateTotals()

  return (
    <div className="space-y-6">
      {/* Estadísticas de pagos */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="rounded-lg bg-white p-6 shadow-md">
          <div className="flex items-center">
            <div className="bg-primary/10 mr-4 flex h-12 w-12 items-center justify-center rounded-lg">
              <i className="ri-money-dollar-circle-line text-primary text-xl"></i>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">
                {userType === "client" ? "Total Pagado" : "Total Recibido"}
              </p>
              <p className="text-2xl font-bold text-gray-900">${totalAmount.toFixed(2)}</p>
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-white p-6 shadow-md">
          <div className="flex items-center">
            <div className="bg-primary/10 mr-4 flex h-12 w-12 items-center justify-center rounded-lg">
              <i className="ri-calendar-line text-primary text-xl"></i>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Este Mes</p>
              <p className="text-2xl font-bold text-gray-900">${monthlyAmount.toFixed(2)}</p>
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-white p-6 shadow-md">
          <div className="flex items-center">
            <div className="mr-4 flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100">
              <i className="ri-briefcase-line text-xl text-purple-600"></i>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Proyectos</p>
              <p className="text-2xl font-bold text-gray-900">{projects.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="rounded-lg bg-white p-4 shadow-md">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilter("all")}
            className={`cursor-pointer rounded-full px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors ${
              filter === "all"
                ? "bg-primary/10 text-emerald-800"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            Todos ({projects.length + transactions.length})
          </button>
          <button
            onClick={() => setFilter("paid")}
            className={`cursor-pointer rounded-full px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors ${
              filter === "paid"
                ? "bg-green-100 text-green-800"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            Pagados (
            {projects.filter((p) => p.payment_status === "paid").length +
              transactions.filter((t) => t.status === "paid").length}
            )
          </button>
          <button
            onClick={() => setFilter("pending")}
            className={`cursor-pointer rounded-full px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors ${
              filter === "pending"
                ? "bg-yellow-100 text-yellow-800"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            Pendientes (
            {projects.filter((p) => p.payment_status === "pending" || !p.payment_status).length +
              transactions.filter((t) => t.status === "pending").length}
            )
          </button>
        </div>
      </div>

      {/* Lista de proyectos pagados */}
      <div className="overflow-hidden rounded-lg bg-white shadow-md">
        <div className="border-b border-gray-200 px-6 py-4">
          <h3 className="flex items-center text-lg font-semibold text-gray-900">
            <i className="ri-briefcase-line text-primary mr-2"></i>
            Proyectos Contratados
          </h3>
        </div>

        {filteredProjects.length === 0 && filteredTransactions.length === 0 ? (
          <div className="py-12 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
              <i className="ri-receipt-line text-2xl text-gray-400"></i>
            </div>
            <h3 className="mb-2 text-lg font-medium text-gray-900">No hay proyectos</h3>
            <p className="text-gray-600">
              {filter === "all"
                ? "Aún no tienes proyectos contratados."
                : `No tienes proyectos con estado "${getStatusText(filter).toLowerCase()}".`}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {/* Proyectos */}
            {filteredProjects.map((project) => (
              <div key={`project-${project.id}`} className="p-6 transition-colors hover:bg-gray-50">
                <div className="mb-4 flex items-start justify-between">
                  <div className="flex-1">
                    <div className="mb-2 flex items-center">
                      <i className="ri-briefcase-line text-primary mr-2"></i>
                      <h4 className="text-lg font-semibold text-gray-900">{project.title}</h4>
                    </div>

                    <div className="mb-3 flex items-center space-x-4 text-sm text-gray-600">
                      <div className="flex items-center">
                        <i className="ri-user-line mr-1"></i>
                        <span>
                          {userType === "client"
                            ? project.freelancer?.full_name
                            : project.client?.full_name}
                        </span>
                      </div>

                      <div className="flex items-center">
                        <i className="ri-calendar-line mr-1"></i>
                        <span>{formatDate(project.created_at)}</span>
                      </div>

                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          project.payment_status === "paid"
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        <span className="mr-1">
                          {project.payment_status === "paid" ? (
                            <i className="ri-check-circle-fill"></i>
                          ) : (
                            <i className="ri-time-line"></i>
                          )}
                        </span>
                        {project.payment_status === "paid" ? "Pagado" : "Pendiente"}
                      </span>
                    </div>

                    <p className="mb-3 line-clamp-2 text-sm text-gray-700">{project.description}</p>
                  </div>

                  <div className="ml-6 text-right">
                    <div className="text-primary mb-2 text-xl font-bold">
                      ${project.budget || `${project.budget_min}-${project.budget_max}`}
                    </div>

                    <button
                      onClick={() => viewProjectDetails(project)}
                      className="bg-primary cursor-pointer rounded-lg px-4 py-2 text-sm font-medium whitespace-nowrap text-white transition-colors hover:bg-cyan-700"
                    >
                      <i className="ri-eye-line mr-1"></i>
                      Ver Detalles
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {/* Transacciones tradicionales */}
            {filteredTransactions.map((transaction) => (
              <div
                key={`transaction-${transaction.id}`}
                className="p-6 transition-colors hover:bg-gray-50"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="mb-2 flex items-center">
                      <i className="ri-money-dollar-circle-line text-primary mr-2"></i>
                      <h4 className="text-lg font-semibold text-gray-900">
                        {transaction.project_title}
                      </h4>
                    </div>

                    <div className="mb-3 flex items-center space-x-4 text-sm text-gray-600">
                      <div className="flex items-center">
                        <i className="ri-user-line mr-1"></i>
                        <span>{userType === "client" ? "Freelancer" : "Cliente"}</span>
                      </div>

                      <div className="flex items-center">
                        <i className="ri-calendar-line mr-1"></i>
                        <span>{formatDate(transaction.paid_at || transaction.created_at)}</span>
                      </div>

                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(transaction.status)}`}
                      >
                        <span className="mr-1">{getStatusIcon(transaction.status)}</span>
                        {getStatusText(transaction.status)}
                      </span>
                    </div>
                  </div>

                  <div className="ml-6 text-right">
                    <div className="text-primary mb-2 text-xl font-bold">
                      ${transaction.amount} {transaction.currency.toUpperCase()}
                    </div>

                    <button className="bg-primary cursor-pointer rounded-lg px-4 py-2 text-sm font-medium whitespace-nowrap text-white transition-colors hover:bg-cyan-700">
                      <i className="ri-eye-line mr-1"></i>
                      Ver Detalles
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de Detalles del Proyecto */}
      {showProjectDetails && selectedProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white">
            <div className="p-6">
              <div className="mb-6 flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{selectedProject.title}</h2>
                  <div className="mt-2 flex items-center space-x-4">
                    <span
                      className={`rounded-full px-3 py-1 text-sm font-medium ${
                        selectedProject.status === "in_progress"
                          ? "bg-primary/10 text-blue-800"
                          : selectedProject.status === "completed"
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {selectedProject.status === "in_progress"
                        ? "En Progreso"
                        : selectedProject.status === "completed"
                          ? "Completado"
                          : "Completado"}
                    </span>
                    <span
                      className={`rounded-full px-3 py-1 text-sm font-medium ${
                        selectedProject.payment_status === "paid"
                          ? "bg-primary/10 text-emerald-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      <i className="ri-secure-payment-line mr-1"></i>
                      {selectedProject.payment_status === "paid" ? "Pagado" : "Pendiente"}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setShowProjectDetails(false)}
                  className="cursor-pointer text-gray-400 hover:text-gray-600"
                >
                  <i className="ri-close-line text-2xl"></i>
                </button>
              </div>

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* Información del Proyecto */}
                <div className="space-y-6 lg:col-span-2">
                  <div>
                    <h3 className="mb-3 text-lg font-semibold text-gray-900">
                      Descripción del Proyecto
                    </h3>
                    <p className="leading-relaxed text-gray-700">{selectedProject.description}</p>
                  </div>

                  {selectedProject.duration && (
                    <div>
                      <h3 className="mb-3 text-lg font-semibold text-gray-900">
                        Duración Estimada
                      </h3>
                      <p className="text-gray-700">{selectedProject.duration}</p>
                    </div>
                  )}

                  {selectedProject.requirements && (
                    <div>
                      <h3 className="mb-3 text-lg font-semibold text-gray-900">
                        Requisitos Especiales
                      </h3>
                      <p className="text-gray-700">{selectedProject.requirements}</p>
                    </div>
                  )}

                  {/* Mostrar habilidades si las hay */}
                  {((userType === "client" && selectedProject.freelancer?.skills) ||
                    (userType === "freelancer" && selectedProject.freelancer?.skills)) && (
                    <div>
                      <h3 className="mb-3 text-lg font-semibold text-gray-900">
                        Habilidades del Freelancer
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {(selectedProject.freelancer?.skills || []).map((skill, index) => (
                          <span
                            key={index}
                            className="bg-primary/10 rounded-full px-3 py-1 text-sm font-medium text-emerald-800"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Panel lateral */}
                <div className="space-y-6">
                  {/* Información del Presupuesto */}
                  <div className="rounded-lg bg-emerald-50 p-4">
                    <h3 className="mb-3 text-lg font-semibold text-gray-900">Presupuesto</h3>
                    <div className="text-primary text-2xl font-bold">
                      $
                      {selectedProject.budget ||
                        `${selectedProject.budget_min} - ${selectedProject.budget_max}`}
                    </div>
                    <p className="mt-1 text-sm text-gray-600">Precio del proyecto</p>
                  </div>

                  {/* Información del Cliente/Freelancer */}
                  <div className="rounded-lg bg-blue-50 p-4">
                    <h3 className="mb-3 text-lg font-semibold text-gray-900">
                      {userType === "client" ? "Freelancer" : "Cliente"}
                    </h3>
                    <div className="mb-3 flex items-center">
                      <div className="bg-primary/10 mr-3 flex h-12 w-12 items-center justify-center rounded-full">
                        <i className="ri-user-line text-primary text-xl"></i>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">
                          {userType === "client"
                            ? selectedProject.freelancer?.full_name
                            : selectedProject.client?.full_name}
                        </h4>
                        <div className="flex items-center text-sm text-gray-600">
                          {((userType === "client" && selectedProject.freelancer?.rating) ||
                            (userType === "freelancer" && selectedProject.client?.rating)) && (
                            <>
                              <i className="ri-star-fill mr-1 text-yellow-500"></i>
                              <span>
                                {(userType === "client"
                                  ? selectedProject.freelancer?.rating
                                  : selectedProject.client?.rating
                                )?.toFixed(1)}
                              </span>
                            </>
                          )}
                          <span className="mx-2">•</span>
                          <span>
                            {userType === "client"
                              ? selectedProject.freelancer?.email
                              : selectedProject.client?.email}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Fechas importantes */}
                  <div className="rounded-lg bg-gray-50 p-4">
                    <h3 className="mb-3 text-lg font-semibold text-gray-900">Fechas</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Iniciado:</span>
                        <span className="font-medium">
                          {formatDate(selectedProject.created_at)}
                        </span>
                      </div>
                      {selectedProject.status === "completed" && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Estado:</span>
                          <span className="font-medium text-green-600">Completado</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Botones de Acción */}
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setShowProjectDetails(false)}
                  className="cursor-pointer rounded-lg border border-gray-300 px-6 py-2 whitespace-nowrap text-gray-700 transition-colors hover:bg-gray-50"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
