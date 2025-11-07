"use client"

import { supabaseBrowser } from "@/utils/supabase/client"
import type { Project } from "@/interfaces/Project"
import type { Transaction } from "@/interfaces/Transaction"
import type { Conversation } from "@/interfaces/Conversation"
import type { ChatMessage } from "@/interfaces/ChatMessage"
import type { Profile } from "@/interfaces/Profile"
import { useState, useEffect } from "react"
import { ConversationModal } from "@/components/ConversationModal"
import { useAuth } from "@/contexts/AuthContext"

const supabase = supabaseBrowser()

interface PaymentsTabProps {
  userType: "client" | "freelancer"
}

export default function PaymentsTab({ userType }: PaymentsTabProps) {
  const { profile: user } = useAuth()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [filter, setFilter] = useState("all")
  const [showProjectDetails, setShowProjectDetails] = useState(false)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)

  // Chat states
  const [showChat, setShowChat] = useState(false)
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [chatLoading, setChatLoading] = useState(false)
  const [sendingMessage, setSendingMessage] = useState(false)

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
              id, full_name, email, rating, skills, avatar_url
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
              id, full_name, email, rating, avatar_url
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

  // Find or create conversation with a client/freelancer
  const handleContactUser = async (contactId: string, contactName: string, projectId?: string) => {
    if (!user) {
      window.toast({
        title: "Necesitas iniciar sesión para chatear",
        type: "warning",
        location: "bottom-center",
        dismissible: true,
        icon: true,
      })
      return
    }

    try {
      const session = await supabase.auth.getSession()
      if (!session.data.session?.access_token) {
        window.toast({
          title: "Necesitas iniciar sesión para chatear",
          type: "warning",
          location: "bottom-center",
          dismissible: true,
          icon: true,
        })
        return
      }

      // First, try to find existing conversation
      const findResponse = await fetch(
        "https://kdmdhhhppizzlhvauofe.supabase.co/functions/v1/chat-handler",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.data.session.access_token}`,
          },
          body: JSON.stringify({
            action: "get-conversations",
            userId: user.id,
            userType: userType,
          }),
        },
      )

      let existingConversation: Conversation | null = null
      if (findResponse.ok) {
        const findData = await findResponse.json()
        if (findData.success && findData.conversations) {
          // Find conversation with this contact
          existingConversation =
            findData.conversations.find((conv: Conversation) => {
              if (userType === "freelancer") {
                return (
                  conv.client_id === contactId && (projectId ? conv.project_id === projectId : true)
                )
              } else {
                return (
                  conv.freelancer_id === contactId &&
                  (projectId ? conv.project_id === projectId : true)
                )
              }
            }) || null
        }
      }

      // If conversation exists, open it
      if (existingConversation) {
        await openChat(existingConversation)
        return
      }

      // Otherwise, create a new conversation
      const createResponse = await fetch(
        "https://kdmdhhhppizzlhvauofe.supabase.co/functions/v1/chat-handler",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.data.session.access_token}`,
          },
          body: JSON.stringify({
            action: "create-conversation",
            freelancerId: userType === "freelancer" ? user.id : contactId,
            clientId: userType === "client" ? user.id : contactId,
            projectId: projectId || null,
          }),
        },
      )

      if (!createResponse.ok) {
        const errorText = await createResponse.text()
        throw new Error(`Error ${createResponse.status}: ${errorText}`)
      }

      const createData = await createResponse.json()

      if (createData.success) {
        // Use the conversation returned from the API
        const newConversation: Conversation = createData.conversation

        await openChat(newConversation)
      } else {
        throw new Error(createData.error || "Error al crear conversación")
      }
    } catch (error: unknown) {
      window.toast({
        title: "Error al iniciar el chat",
        type: "error",
        location: "bottom-center",
        dismissible: true,
        icon: true,
      })
      console.error("Error creating chat:", error)
    }
  }

  const openChat = async (conversation: Conversation) => {
    setSelectedConversation(conversation)
    setShowChat(true)
    setChatLoading(true)

    try {
      await loadMessages(conversation.id)
    } catch (error) {
      console.error("Error opening chat:", error)
    } finally {
      setChatLoading(false)
    }
  }

  const loadMessages = async (conversationId: string) => {
    try {
      const session = await supabase.auth.getSession()
      if (!session.data.session?.access_token) {
        throw new Error("No hay sesión activa")
      }

      const response = await fetch(
        "https://kdmdhhhppizzlhvauofe.supabase.co/functions/v1/chat-handler",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.data.session.access_token}`,
          },
          body: JSON.stringify({
            action: "get-messages",
            conversationId,
          }),
        },
      )

      if (!response.ok) {
        throw new Error(`Error ${response.status}`)
      }

      const data = await response.json()
      if (data.success) {
        setChatMessages(data.messages)
      }
    } catch (error) {
      console.error("Error loading messages:", error)
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || sendingMessage) {
      return
    }

    setSendingMessage(true)

    try {
      const session = await supabase.auth.getSession()
      if (!session.data.session?.access_token) {
        throw new Error("No hay sesión activa")
      }

      const response = await fetch(
        "https://kdmdhhhppizzlhvauofe.supabase.co/functions/v1/chat-handler",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.data.session.access_token}`,
          },
          body: JSON.stringify({
            action: "send-message",
            conversationId: selectedConversation.id,
            messageText: newMessage.trim(),
          }),
        },
      )

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Error ${response.status}: ${errorText}`)
      }

      const data = await response.json()
      if (data.success) {
        setNewMessage("")
        await loadMessages(selectedConversation.id)
      } else {
        throw new Error(data.error || "Error desconocido al enviar mensaje")
      }
    } catch (error: unknown) {
      window.toast({
        title: "Error enviando mensaje",
        type: "error",
        location: "bottom-center",
        dismissible: true,
        icon: true,
      })
      console.error("Error sending message:", error)
    } finally {
      setSendingMessage(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const filteredTransactions = transactions.filter((transaction) => {
    if (filter === "all") return true
    return transaction.status === filter
  })

  const filteredProjects = projects.filter((project) => {
    if (filter === "all") return true
    if (filter === "paid")
      return project.payment_status === "paid" || project.payment_status === "success"
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
            {projects.filter((p) => p.payment_status === "paid" || p.payment_status === "success")
              .length + transactions.filter((t) => t.status === "paid").length}
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
                          project.payment_status === "paid" || project.payment_status === "success"
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        <span className="mr-1">
                          {project.payment_status === "paid" ||
                          project.payment_status === "success" ? (
                            <i className="ri-check-circle-fill"></i>
                          ) : (
                            <i className="ri-time-line"></i>
                          )}
                        </span>
                        {project.payment_status === "paid" || project.payment_status === "success"
                          ? "Pagado"
                          : "Pendiente"}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-black/60 via-black/50 to-black/60 p-2 backdrop-blur-md sm:p-4">
          <div className="flex h-[95vh] w-full max-w-full flex-col overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-black/5 sm:h-[90vh] sm:max-w-4xl">
            {/* Modern Header with Gradient */}
            <div className="relative shrink-0 overflow-hidden bg-gradient-to-r from-cyan-600 via-cyan-500 to-teal-500 p-6 text-white sm:p-8">
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIyIi8+PC9nPjwvZz48L3N2Zz4=')] opacity-20"></div>
              <div className="relative z-10 flex items-start justify-between">
                <div className="flex-1 pr-4">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 ring-1 ring-white/30 backdrop-blur-sm">
                      <i className="ri-briefcase-4-line text-2xl"></i>
                    </div>
                    <div>
                      <h2 className="text-2xl leading-tight font-bold sm:text-3xl">
                        {selectedProject.title}
                      </h2>
                      <div className="mt-3 flex items-center gap-4">
                        <span
                          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                            selectedProject.status === "in_progress"
                              ? "bg-blue-500/90 text-white"
                              : selectedProject.status === "completed"
                                ? "bg-emerald-500/90 text-white"
                                : "bg-cyan-500/90 text-white"
                          }`}
                        >
                          <i
                            className={`mr-1 ${
                              selectedProject.status === "in_progress"
                                ? "ri-time-line"
                                : selectedProject.status === "completed"
                                  ? "ri-check-line"
                                  : "ri-briefcase-line"
                            }`}
                          ></i>
                          {selectedProject.status === "in_progress"
                            ? "En Progreso"
                            : selectedProject.status === "completed"
                              ? "Completado"
                              : "Abierto"}
                        </span>
                        <span
                          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                            selectedProject.payment_status === "paid" ||
                            selectedProject.payment_status === "success"
                              ? "bg-green-500/90 text-white"
                              : "bg-yellow-500/90 text-white"
                          }`}
                        >
                          <i
                            className={`mr-1 ${
                              selectedProject.payment_status === "paid" ||
                              selectedProject.payment_status === "success"
                                ? "ri-check-line"
                                : "ri-time-line"
                            }`}
                          ></i>
                          {selectedProject.payment_status === "paid" ||
                          selectedProject.payment_status === "success"
                            ? "Pagado"
                            : "Pago Pendiente"}
                        </span>
                        <span className="text-lg font-bold text-white">
                          $
                          {selectedProject.budget ||
                            `${selectedProject.budget_min}-${selectedProject.budget_max}`}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowProjectDetails(false)
                    setSelectedProject(null)
                  }}
                  className="group flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/20 backdrop-blur-sm transition-all hover:scale-110 hover:bg-white/20"
                  aria-label="Cerrar"
                >
                  <i className="ri-close-line text-xl transition-transform group-hover:rotate-90"></i>
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-6 pb-24 sm:p-8">
              <div className="space-y-6">
                {/* Key Metrics Cards */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-cyan-50 to-teal-50 p-6 ring-1 ring-cyan-100 transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-cyan-500/10">
                    <div className="mb-3 flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-cyan-600 text-white shadow-lg shadow-cyan-500/30">
                        <i className="ri-money-dollar-circle-fill text-xl"></i>
                      </div>
                      <div className="text-sm font-medium text-cyan-700">Presupuesto</div>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">
                      $
                      {selectedProject.budget ||
                        `${selectedProject.budget_min || 0}-${selectedProject.budget_max || 0}`}
                    </p>
                  </div>

                  <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 p-6 ring-1 ring-blue-100 transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-blue-500/10">
                    <div className="mb-3 flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 text-white shadow-lg shadow-blue-500/30">
                        <i className="ri-file-list-3-line text-xl"></i>
                      </div>
                      <div className="text-sm font-medium text-blue-700">Estado</div>
                    </div>
                    <p className="text-xl font-bold text-gray-900">
                      {selectedProject.status === "in_progress"
                        ? "En Progreso"
                        : selectedProject.status === "completed"
                          ? "Completado"
                          : "Abierto"}
                    </p>
                  </div>

                  <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-50 to-pink-50 p-6 ring-1 ring-purple-100 transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-purple-500/10">
                    <div className="mb-3 flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/30">
                        <i className="ri-calendar-check-fill text-xl"></i>
                      </div>
                      <div className="text-sm font-medium text-purple-700">Fecha de Inicio</div>
                    </div>
                    <p className="text-xl font-bold text-gray-900">
                      {new Date(selectedProject.created_at).toLocaleDateString("es-ES", {
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                    <p className="text-sm text-gray-600">
                      {new Date(selectedProject.created_at).toLocaleDateString("es-ES", {
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>

                {/* Información del Cliente/Freelancer */}
                <div className="rounded-2xl border border-gray-200 bg-gradient-to-br from-gray-50 to-white p-6 shadow-sm">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-teal-500 text-white shadow-lg">
                      <i className="ri-user-3-line text-lg"></i>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">
                      Información del {userType === "client" ? "Freelancer" : "Cliente"}
                    </h3>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-cyan-100 to-teal-100 ring-2 ring-cyan-200">
                      {userType === "client" && selectedProject.freelancer ? (
                        (selectedProject.freelancer as any).avatar_url ? (
                          <img
                            src={(selectedProject.freelancer as any).avatar_url}
                            alt={selectedProject.freelancer.full_name}
                            className="h-full w-full object-cover object-top"
                          />
                        ) : (
                          <i className="ri-user-line text-xl text-cyan-600"></i>
                        )
                      ) : selectedProject.client ? (
                        selectedProject.client.avatar_url ? (
                          <img
                            src={selectedProject.client.avatar_url}
                            alt={selectedProject.client.full_name}
                            className="h-full w-full object-cover object-top"
                          />
                        ) : (
                          <i className="ri-user-line text-xl text-cyan-600"></i>
                        )
                      ) : (
                        <i className="ri-user-line text-xl text-cyan-600"></i>
                      )}
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">
                        {userType === "client"
                          ? selectedProject.freelancer?.full_name
                          : selectedProject.client?.full_name}
                      </h4>
                      <p className="text-gray-600">
                        {userType === "client"
                          ? selectedProject.freelancer?.email
                          : selectedProject.client?.email}
                      </p>
                      {((userType === "client" && selectedProject.freelancer?.rating) ||
                        (userType === "freelancer" && selectedProject.client?.rating)) && (
                        <div className="mt-1 flex items-center gap-1 text-sm text-cyan-600">
                          <i className="ri-star-fill text-yellow-300"></i>
                          <span className="font-medium">
                            {(userType === "client"
                              ? selectedProject.freelancer?.rating
                              : selectedProject.client?.rating
                            )?.toFixed(1)}
                          </span>
                          <span className="text-gray-500">
                            · {userType === "client" ? "Freelancer" : "Cliente"} verificado
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Descripción del Proyecto */}
                <div>
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 text-white shadow-lg">
                      <i className="ri-file-text-line text-lg"></i>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">Descripción del Proyecto</h3>
                  </div>
                  <div className="rounded-2xl border border-gray-200 bg-gradient-to-br from-gray-50 to-white p-6 shadow-sm">
                    <p className="leading-relaxed whitespace-pre-wrap text-gray-700">
                      {selectedProject.description || "Sin descripción disponible"}
                    </p>
                  </div>
                </div>

                {/* Duración y Requisitos */}
                {(selectedProject.duration || selectedProject.requirements) && (
                  <div className="rounded-2xl border border-gray-200 bg-gradient-to-br from-gray-50 to-white p-6 shadow-sm">
                    <div className="mb-4 flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500 to-pink-500 text-white shadow-lg">
                        <i className="ri-information-line text-lg"></i>
                      </div>
                      <h3 className="text-xl font-bold text-gray-900">Información Adicional</h3>
                    </div>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      {selectedProject.duration && (
                        <div>
                          <h4 className="mb-2 text-sm font-semibold text-gray-900">Duración</h4>
                          <p className="text-gray-700">{selectedProject.duration}</p>
                        </div>
                      )}
                      {selectedProject.requirements && (
                        <div>
                          <h4 className="mb-2 text-sm font-semibold text-gray-900">Requisitos</h4>
                          <p className="text-gray-700">{selectedProject.requirements}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Habilidades del Freelancer */}
                {userType === "client" &&
                  selectedProject.freelancer?.skills &&
                  selectedProject.freelancer.skills.length > 0 && (
                    <div className="rounded-2xl border border-gray-200 bg-gradient-to-br from-gray-50 to-white p-6 shadow-sm">
                      <div className="mb-4 flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-lg">
                          <i className="ri-code-s-slash-line text-lg"></i>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900">Habilidades</h3>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {selectedProject.freelancer.skills.map((skill, index) => (
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
            </div>
            {/* Botones de Acción */}
            <div className="flex shrink-0 flex-col gap-3 border-t border-gray-200 bg-gradient-to-b from-white to-gray-50 p-6 sm:flex-row sm:gap-4">
              {/* Show Contact button when there's a client/freelancer to contact */}
              {((userType === "freelancer" && selectedProject.client?.id) ||
                (userType === "client" && (selectedProject.freelancer as any)?.id)) && (
                <button
                  onClick={() => {
                    setShowProjectDetails(false)
                    const contactId =
                      userType === "freelancer"
                        ? selectedProject.client!.id
                        : (selectedProject.freelancer as any)!.id
                    const contactName =
                      userType === "freelancer"
                        ? selectedProject.client!.full_name
                        : selectedProject.freelancer!.full_name
                    handleContactUser(contactId, contactName, selectedProject.id)
                  }}
                  className="group flex flex-1 cursor-pointer items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 px-6 py-4 font-semibold text-white shadow-lg shadow-cyan-500/30 transition-all hover:-translate-y-0.5 hover:scale-[1.02] hover:shadow-xl hover:shadow-cyan-500/40"
                >
                  <i className="ri-chat-3-line text-xl transition-transform group-hover:scale-110"></i>
                  <span>Contactar {userType === "freelancer" ? "Cliente" : "Freelancer"}</span>
                </button>
              )}
              <button
                onClick={() => {
                  setShowProjectDetails(false)
                  setSelectedProject(null)
                }}
                className="cursor-pointer rounded-xl border border-gray-300 bg-white px-6 py-4 font-semibold text-gray-700 transition-all hover:bg-gray-50"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Conversation Modal */}
      {showChat && selectedConversation && user && (
        <ConversationModal
          selectedConversation={selectedConversation}
          setShowChat={setShowChat}
          setChatMessages={setChatMessages}
          setSelectedConversation={setSelectedConversation}
          setNewMessage={setNewMessage}
          chatLoading={chatLoading}
          chatMessages={chatMessages}
          user={user}
          newMessage={newMessage}
          handleKeyPress={handleKeyPress}
          sendingMessage={sendingMessage}
          sendMessage={sendMessage}
        />
      )}
    </div>
  )
}
