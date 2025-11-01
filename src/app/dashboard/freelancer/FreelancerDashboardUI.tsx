"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/AuthContext"
import PaymentsTab from "@/components/PaymentsTab"
import { ShareProfileTab } from "@/components/ShareProfileTab"
import { PendingReviews } from "@/components/feature/PendingReviews"
import { ReviewsDisplay } from "@/components/feature/ReviewsDisplay"
import BadgeSystem from "@/components/feature/BadgeSystem"
import AnalyticsDashboard from "@/components/feature/AnalyticsDashboard"
import { FreelancerProjectManagement } from "@/components/FreelancerProjectManagement"
import { useNotifications } from "@/hooks/useNotifications"
import { MainComponent } from "@/components/MainComponent"
import type { Project } from "@/interfaces/Project"
import type { Conversation } from "@/interfaces/Conversation"
import Layout from "@/components/Layout"
import { useSessionStorage } from "@/hooks/useSessionStorage"
import type { Proposal } from "@/interfaces/Proposal"
import type { ChatMessage } from "@/interfaces/ChatMessage"
import { ConversationModal } from "@/components/ConversationModal"
import { AvailableProjectArticle } from "@/components/AvailableProjectArticle"
import { supabaseBrowser } from "@/db/supabase/client"
import ProtectedRoute from "@/components/feature/ProtectedRoute"

const supabase = supabaseBrowser()

export default function FreelancerDashboardUI() {
  const { user } = useAuth()
  const [projects, setProjects] = useState<Project[]>([])
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeTab, setActiveTab] = useState("projects")
  const [conversationsLoading, setConversationsLoading] = useState(false)
  const [showProposalModal, setShowProposalModal] = useState(false)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [proposalForm, setProposalForm] = useState({
    budget: "",
    delivery_time: "",
    message: "",
  })

  // Chat states
  const [showChat, setShowChat] = useState(false)
  const [selectedConversation, setSelectedConversation] =
    useState<Conversation | null>(null)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [chatLoading, setChatLoading] = useState(false)
  const [sendingMessage, setSendingMessage] = useState(false)

  const [myProjects, setMyProjects] = useState<Project[]>([])
  const [showProjectDetails, setShowProjectDetails] = useState(false)
  const [selectedProjectDetails, setSelectedProjectDetails] =
    useState<Project | null>(null)

  const [showProjectManagement, setShowProjectManagement] = useState(false)
  const [selectedProjectForManagement, setSelectedProjectForManagement] =
    useState<Project | null>(null)

  const [pendingReviewsCount, setPendingReviewsCount] = useState(0)

  // RESTAURADO: Estados para modal de detalles de propuesta
  const [showProposalDetails, setShowProposalDetails] = useState(false)
  const [selectedProposalForDetails, setSelectedProposalForDetails] =
    useState<Proposal | null>(null)
  const [proposalProjectDetails, setProposalProjectDetails] =
    useState<any>(null)

  // RESTAURADO: Estados para modal de detalles de proyecto en "Mis Proyectos"
  const [showProjectDetailsModal, setShowProjectDetailsModal] = useState(false)
  const [selectedProjectForDetails, setSelectedProjectForDetails] =
    useState<Project | null>(null)

  // NUEVO: Estados para modal de gestión de progreso
  const [showProgressManagement, setShowProgressManagement] = useState(false)
  const [selectedProjectForProgress, setSelectedProjectForProgress] =
    useState<Project | null>(null)

  const { notifyProposal, notifyNewMessage } = useNotifications()

  const { setValue, getValue } = useSessionStorage("last_tab")

  useEffect(() => {
    document.title = "Freelancer Dashboard | GDN Pro"

    if (getValue("last_tab")) {
      setActiveTab(getValue("last_tab"))
    } else {
      setActiveTab("projects")
      setValue("last_tab", "projects")
    }
  }, [])

  useEffect(() => {
    if (user) {
      loadData()
      loadPendingReviewsCount()
    }
  }, [user])

  useEffect(() => {
    if (user && activeTab === "messages") {
      loadConversations()
    }
  }, [user, activeTab])

  const loadData = async () => {
    try {
      if (!user) return

      // ARREGLADO: Cargar proyectos disponibles EXCLUYENDO los que ya tienen propuestas aceptadas
      const { data: projectsData } = await supabase
        .from("projects")
        .select(
          `
          *,
          client:profiles!projects_client_id_fkey(id, full_name, rating, email),
          proposals!inner(status)
        `
        )
        .eq("status", "open")
        .neq("proposals.status", "accepted") // EXCLUIR proyectos con propuestas aceptadas
        .order("created_at", { ascending: false })

      // También cargar proyectos que NO tienen propuestas en absoluto
      const { data: projectsWithoutProposals } = await supabase
        .from("projects")
        .select(
          `
          *,
          client:profiles!projects_client_id_fkey(id, full_name, rating, email)
        `
        )
        .eq("status", "open")
        .is("freelancer_id", null) // Sin freelancer asignado
        .order("created_at", { ascending: false })

      // Obtener IDs de proyectos que SÍ tienen propuestas aceptadas
      const { data: acceptedProposals } = await supabase
        .from("proposals")
        .select("project_id")
        .eq("status", "accepted")

      const acceptedProjectIds =
        acceptedProposals?.map((p) => p.project_id) || []

      // Filtrar proyectos sin propuestas que NO tengan propuestas aceptadas
      const filteredProjectsWithoutProposals =
        projectsWithoutProposals?.filter(
          (project) => !acceptedProjectIds.includes(project.id)
        ) || []

      // Combinar ambos conjuntos de proyectos
      const allAvailableProjects = [
        ...(projectsData || []),
        ...filteredProjectsWithoutProposals,
      ]

      // Eliminar duplicados por ID
      const uniqueProjects = allAvailableProjects.filter(
        (project, index, self) =>
          index === self.findIndex((p) => p.id === project.id)
      )

      if (uniqueProjects) setProjects(uniqueProjects)

      // ARREGLADO: Cargar MIS proyectos - INCLUYENDO TODOS los proyectos con transacciones
      if (user?.id) {
        // 1. Proyectos directamente asignados
        const { data: assignedProjects } = await supabase
          .from("projects")
          .select(
            `
            *,
            client:profiles!projects_client_id_fkey(
              id,
              full_name,
              email,
              rating,
              avatar_url
            )
          `
          )
          .eq("freelancer_id", user.id)
          .order("created_at", { ascending: false })

        // 2. Obtener TODAS las transacciones (pagadas Y pendientes) donde soy el freelancer
        const session = await supabase.auth.getSession()
        let projectsFromTransactions = []

        if (session.data.session?.access_token) {
          try {
            const response = await fetch(
              "https://kdmdhhhppizzlhvauofe.supabase.co/functions/v1/stripe-payments",
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${session.data.session.access_token}`,
                },
                body: JSON.stringify({
                  action: "get-transactions",
                }),
              }
            )

            if (response.ok) {
              const data = await response.json()
              // CORREGIDO: Incluir transacciones PAGADAS Y PENDIENTES
              const allTransactions = (data.transactions || []).filter(
                (t: any) => t.status === "paid" || t.status === "pending"
              )

              // Crear "proyectos virtuales" desde TODAS las transacciones para mostrar en "Mis Proyectos"
              projectsFromTransactions = allTransactions.map(
                (transaction: any) => ({
                  id: `transaction-${transaction.id}`,
                  title: transaction.project_title || "Proyecto Contratado",
                  description:
                    transaction.project_description ||
                    "Proyecto contratado directamente por el cliente",
                  budget: parseFloat(transaction.amount),
                  status:
                    transaction.status === "paid"
                      ? "in_progress"
                      : "pending_payment",
                  payment_status: transaction.status, // 'paid' o 'pending'
                  created_at: transaction.created_at || transaction.paid_at,
                  duration: "Según acuerdo con cliente",
                  requirements:
                    "Proyecto contratado directamente - revisar detalles en chat",
                  client: {
                    id: transaction.client?.id || "",
                    full_name: transaction.client?.full_name || "Cliente",
                    email: transaction.client?.email || "",
                    rating: transaction.client?.rating || 5.0,
                    avatar_url: transaction.client?.avatar_url || "",
                  },
                  // Marcar como proyecto de transacción para diferenciar
                  _isFromTransaction: true,
                  _transactionId: transaction.id,
                  _stripeSessionId: transaction.stripe_session_id,
                })
              )
            }
          } catch (error) {
            console.error(
              "⚠️ Error cargando transacciones para proyectos:",
              error
            )
          }
        }

        // 3. Combinar proyectos asignados + proyectos de transacciones
        const allMyProjects = [
          ...(assignedProjects || []),
          ...projectsFromTransactions,
        ]

        // Eliminar duplicados por ID si existen
        const uniqueProjects = allMyProjects.filter(
          (project, index, self) =>
            index === self.findIndex((p) => p.id === project.id)
        )
        setMyProjects(uniqueProjects)
      }

      // Cargar propuestas con TODAS las relaciones necesarias
      const { data: proposalsData, error: proposalsError } = await supabase
        .from("proposals")
        .select(
          `
          *,
          project:projects(
            id,
            title,
            description,
            budget_min,
            budget_max,
            project_type,
            required_skills,
            deadline,
            status,
            created_at,
            client:profiles!projects_client_id_fkey(
              id,
              full_name,
              email,
              rating,
              avatar_url
            ),
            progress_percentage
          )
        `
        )
        .eq("freelancer_id", user.id)
        .order("created_at", { ascending: false })

      if (proposalsError) {
        console.error("❌ Error cargando propuestas:", proposalsError)
      } else {
        setProposals(proposalsData || [])
      }
    } catch (error) {
      console.error("Error loading data:", error)
    }
  }

  const loadPendingReviewsCount = async () => {
    try {
      const session = await supabase.auth.getSession()
      if (!session.data.session?.access_token) return

      const response = await fetch(
        "https://kdmdhhhppizzlhvauofe.supabase.co/functions/v1/reviews-handler",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.data.session.access_token}`,
          },
          body: JSON.stringify({
            action: "get-pending-reviews",
          }),
        }
      )

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setPendingReviewsCount(data.pendingReviews?.length || 0)
        }
      }
    } catch (error) {
      console.error("Error loading pending reviews count:", error)
    }
  }

  const loadConversations = async () => {
    if (!user) {
      console.log("❌ No hay perfil disponible")
      return
    }

    setConversationsLoading(true)

    try {
      const session = await supabase.auth.getSession()
      if (!session.data.session?.access_token) {
        console.error("❌ No hay sesión activa")
        setConversationsLoading(false)
        return
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
            action: "get-conversations",
            userId: user.id,
            userType: "freelancer",
          }),
        }
      )

      if (!response.ok) {
        console.error("❌ Error HTTP:", response.status, response.statusText)
        const errorText = await response.text()
        console.error("❌ Error detalle:", errorText)
        setConversations([])
        setConversationsLoading(false)
        return
      }

      const data = await response.json()

      if (data.success) {
        setConversations(data.conversations || [])
      } else {
        console.error("❌ Error en respuesta:", data.error)
        setConversations([])
      }
    } catch (error) {
      console.error("💥 Error completo loading conversations:", error)
      setConversations([])
    } finally {
      setConversationsLoading(false)
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
        }
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
        }
      )

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Error ${response.status}: ${errorText}`)
      }

      const data = await response.json()
      if (data.success) {
        setNewMessage("")
        await loadMessages(selectedConversation.id)
        await loadConversations() // Refresh conversations list

        // NUEVO: Crear notificación automática de nuevo mensaje
        if (data.message?.id) {
          await notifyNewMessage(data.message.id)
        }

        if (data.flagged) {
          alert(
            "⚠️ Tu mensaje contiene información de contacto. Por seguridad, usa solo el chat interno de la plataforma."
          )
        }
      } else {
        throw new Error(data.error || "Error desconocido al enviar mensaje")
      }
    } catch (error: any) {
      console.error("Error enviando mensaje:", error)
      alert(`Error al enviar mensaje: ${error.message}`)
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

  const sendProposal = async (projectId: string) => {
    const project = projects.find((p) => p.id === projectId)
    if (project) {
      setSelectedProject(project)
      setShowProposalModal(true)
    }
  }

  const submitProposal = async () => {
    if (!selectedProject || !user) return

    try {
      const { data, error } = await supabase
        .from("proposals")
        .insert({
          project_id: selectedProject.id,
          freelancer_id: user.id,
          proposed_budget: parseFloat(proposalForm.budget),
          delivery_time: parseInt(proposalForm.delivery_time),
          message: proposalForm.message,
          status: "pending",
        })
        .select()
        .single()

      if (error) throw error

      // NUEVO: Crear notificación automática al cliente
      await notifyProposal(data.id, "proposal_received")

      window.toast({
        title: "¡Propuesta enviada exitosamente!",
        type: "success",
        location: "bottom-center",
        dismissible: true,
        icon: true,
      })

      setShowProposalModal(false)
      setProposalForm({ budget: "", delivery_time: "", message: "" })
      loadData() // Reload data
    } catch (error) {
      console.error("Error sending proposal:", error)
      alert("Error al enviar la propuesta. Inténtalo de nuevo.")
    }
  }

  const startChat = async (projectId: string, clientId: string) => {
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
            action: "create-conversation",
            projectId,
            clientId,
            freelancerId: user?.id,
          }),
        }
      )

      const data = await response.json()
      if (data.success) {
        // Reload conversations and open chat
        await loadConversations()
        openChat(data.conversation)
      }
    } catch (error) {
      console.error("Error creating chat:", error)
    }
  }

  const viewProjectDetails = (project: Project) => {
    setSelectedProjectDetails(project)
    setShowProjectDetails(true)
  }

  // RESTAURADO: Función para ver detalles de propuesta
  const viewProposalDetails = async (proposal: Proposal) => {
    try {
      setSelectedProposalForDetails(proposal)

      // Los detalles del proyecto ya vienen incluidos en la propuesta
      if (proposal.project) {
        setProposalProjectDetails(proposal.project)
        setShowProposalDetails(true)
      } else {
        // Fallback: cargar detalles del proyecto si no están incluidos
        const { data: projectDetails, error } = await supabase
          .from("projects")
          .select(
            `
            *,
            client:profiles!projects_client_id_fkey(
              id, full_name, email, rating, avatar_url
            )
          `
          )
          .eq("id", proposal.project_id)
          .single()

        if (error) {
          console.error("Error cargando detalles del proyecto:", error)
          alert("Error al cargar los detalles del proyecto")
          return
        }

        setProposalProjectDetails(projectDetails)
        setShowProposalDetails(true)
      }
    } catch (error) {
      console.error("Error:", error)
      alert("Error al cargar los detalles")
    }
  }

  // RESTAURADO: Función para ver detalles del proyecto en "Mis Proyectos"
  const viewProjectDetailsInMyProjects = async (project: Project) => {
    try {
      if (project._isFromTransaction) {
        // Para proyectos de transacción, usar la información que ya tenemos
        setSelectedProjectForDetails(project)
        setShowProjectDetailsModal(true)
      } else {
        // Para proyectos normales, cargar información completa
        const { data: projectDetails, error } = await supabase
          .from("projects")
          .select(
            `
            *,
            client:profiles!projects_client_id_fkey(
              id, full_name, email, rating, avatar_url
            )
          `
          )
          .eq("id", project.id)
          .single()

        if (error) {
          console.error("Error cargando detalles del proyecto:", error)
          alert("Error al cargar los detalles del proyecto")
          return
        }

        setSelectedProjectForDetails(projectDetails)
        setShowProjectDetailsModal(true)
      }
    } catch (error) {
      console.error("Error:", error)
      alert("Error al cargar los detalles del proyecto")
    }
  }

  const openProjectManagement = (project: Project) => {
    setSelectedProjectForManagement(project)
    setShowProjectManagement(true)
  }

  // NUEVO: Función para abrir gestión de progreso desde propuestas aceptadas
  const openProgressManagement = async (project: Project) => {
    try {
      if (project._isFromTransaction) {
        // Para proyectos de transacción, usar datos que ya tenemos
        setSelectedProjectForProgress(project)
        setShowProgressManagement(true)
      } else {
        // Para proyectos normales, cargar datos completos desde Supabase
        const { data: projectDetails, error } = await supabase
          .from("projects")
          .select(
            `
            *,
            client:profiles!projects_client_id_fkey(
              id, full_name, email, rating, avatar_url
            ),
            project_milestones(
              id, title, description, due_date, status, amount, created_at
            )
          `
          )
          .eq("id", project.id)
          .single()

        if (error) {
          console.error("Error cargando detalles del proyecto:", error)
          alert("Error al cargar los detalles del proyecto")
          return
        }

        setSelectedProjectForProgress(projectDetails)
        setShowProgressManagement(true)
      }
    } catch (error) {
      console.error("Error:", error)
      alert("Error al cargar el proyecto para gestión de progreso")
    }
  }

  // RESTAURADO: Función para manejar contacto con cliente
  const handleContactClient = async (clientId: string, clientName: string) => {
    try {
      const session = await supabase.auth.getSession()
      if (!session.data.session?.access_token) {
        alert("Necesitas iniciar sesión para chatear")
        return
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
            action: "create-conversation",
            freelancerId: user?.id,
            clientId: clientId,
            projectId: null,
          }),
        }
      )

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Error ${response.status}: ${errorText}`)
      }

      const data = await response.json()

      if (data.success) {
        // Recargar conversaciones y abrir el chat
        await loadConversations()

        // Encontrar la conversación recién creada y abrirla
        const newConversation: any = {
          id: data.conversation.id,
          client_id: clientId,
          freelancer_id: user?.id,
          project_id: null,
          updated_at: new Date().toISOString(),
          client: {
            full_name: clientName,
            avatar_url: null,
          },
          project: null,
          latest_message: null,
        }

        openChat(newConversation)
      } else {
        throw new Error(data.error || "Error al crear conversación")
      }
    } catch (error: any) {
      console.error("Error creating chat:", error)
      alert(`Error al iniciar el chat: ${error.message}`)
    }
  }

  const handleActiveTab = (flag: string) => {
    setActiveTab(flag)
    setValue("last_tab", flag)
  }

  return (
    <ProtectedRoute requiredRole="freelancer">
      <Layout>
        <MainComponent>
          {/* Header - RESPONSIVE */}
          <div className="bg-white rounded-lg shadow p-4 sm:p-6 mb-6 sm:mb-8">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
              <div className="flex items-center">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-primary/10 rounded-full flex items-center justify-center mr-3 sm:mr-4 overflow-hidden">
                  {user?.avatar_url ? (
                    <img
                      src={user.avatar_url}
                      alt={user.full_name}
                      className="w-full h-full object-cover object-top rounded-full"
                    />
                  ) : (
                    <i className="ri-user-line text-xl sm:text-2xl text-primary"></i>
                  )}
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                    ¡Hola, {user?.full_name}!
                  </h1>
                  <p className="text-sm sm:text-base text-gray-600">
                    Freelancer Dashboard
                  </p>
                </div>
              </div>

              <div className="text-center sm:text-right">
                <div className="text-2xl sm:text-3xl font-bold text-primary">
                  {user?.rating || 0}★
                </div>
                <p className="text-xs sm:text-sm text-gray-500">Rating</p>
              </div>
            </div>
          </div>

          {/* Stats Cards - RESPONSIVE */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
            <div className="bg-white rounded-lg shadow p-3 sm:p-6">
              <div className="flex items-center">
                <div className="w-8 h-8 sm:w-12 sm:h-12 bg-primary/10 rounded-lg flex items-center justify-center mr-2 sm:mr-4">
                  <i className="ri-file-text-line text-sm sm:text-xl text-primary"></i>
                </div>
                <div>
                  <p className="text-lg sm:text-2xl font-bold text-gray-900">
                    {proposals.length}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-600">Propuestas</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-3 sm:p-6">
              <div className="flex items-center">
                <div className="w-8 h-8 sm:w-12 sm:h-12 bg-green-100 rounded-lg flex items-center justify-center mr-2 sm:mr-4">
                  <i className="ri-check-line text-sm sm:text-xl text-primary"></i>
                </div>
                <div>
                  <p className="text-lg sm:text-2xl font-bold text-gray-900">
                    {proposals.filter((p) => p.status === "accepted").length}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-600">Aceptadas</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-3 sm:p-6">
              <div className="flex items-center">
                <div className="w-8 h-8 sm:w-12 sm:h-12 bg-yellow-100 rounded-lg flex items-center justify-center mr-2 sm:mr-4">
                  <i className="ri-time-line text-sm sm:text-xl text-yellow-600"></i>
                </div>
                <div>
                  <p className="text-lg sm:text-2xl font-bold text-gray-900">
                    {proposals.filter((p) => p.status === "pending").length}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-600">Pendientes</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-3 sm:p-6">
              <div className="flex items-center">
                <div className="w-8 h-8 sm:w-12 sm:h-12 bg-primary/10 rounded-lg flex items-center justify-center mr-2 sm:mr-4">
                  <i className="ri-chat-3-line text-sm sm:text-xl text-primary"></i>
                </div>
                <div>
                  <p className="text-lg sm:text-2xl font-bold text-gray-900">
                    {conversations.length}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-600">Mensajes</p>
                </div>
              </div>
            </div>
          </div>

          {/* NUEVO: Panel de Gamificación - Solo se muestra si hay datos */}
          {user?.id && (
            <div className="bg-linear-to-br from-primary/10 to-cyan-50 border border-primary/20 rounded-xl p-4 sm:p-6 mb-6 sm:mb-8">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-linear-to-r from-primary to-primary rounded-full flex items-center justify-center mr-4">
                    <i className="ri-trophy-line text-white text-xl"></i>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">
                      🏆 Tu Progreso como Freelancer
                    </h3>
                    <p className="text-sm text-cyan-700">
                      Desbloquea logros y sube de nivel completando proyectos
                    </p>
                  </div>
                </div>
                <BadgeSystem
                  userId={user.id}
                  userType="freelancer"
                  compact={true}
                />
              </div>

              <div className="bg-white rounded-lg p-4 border border-cyan-200">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                  <div className="flex items-center">
                    <i className="ri-check-line text-primary mr-2"></i>
                    <span className="text-gray-700">
                      Gana XP completando proyectos
                    </span>
                  </div>
                  <div className="flex items-center">
                    <i className="ri-star-line text-yellow-500 mr-2"></i>
                    <span className="text-gray-700">
                      Desbloquea badges por logros
                    </span>
                  </div>
                  <div className="flex items-center">
                    <i className="ri-trophy-line text-primary mr-2"></i>
                    <span className="text-gray-700">
                      Sube tu nivel profesional
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tabs - RESPONSIVE */}
          <div className="bg-white rounded-lg shadow">
            <div className="border-b border-gray-200 overflow-x-auto overflow-y-hidden">
              <nav className="-mb-px flex min-w-max">
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    handleActiveTab("projects")
                  }}
                  className={`py-3 sm:py-4 px-3 sm:px-6 border-b-2 font-medium text-xs sm:text-sm cursor-pointer whitespace-nowrap ${
                    activeTab === "projects"
                      ? "border-primary text-primary"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  Proyectos Disponibles ({projects.length})
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    handleActiveTab("my-projects")
                  }}
                  className={`py-3 sm:py-4 px-3 sm:px-6 border-b-2 font-medium text-xs sm:text-sm cursor-pointer whitespace-nowrap ${
                    activeTab === "my-projects"
                      ? "border-primary text-primary"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  Mis Proyectos ({myProjects.length})
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    handleActiveTab("proposals")
                  }}
                  className={`py-3 sm:py-4 px-3 sm:px-6 border-b-2 font-medium text-xs sm:text-sm cursor-pointer whitespace-nowrap ${
                    activeTab === "proposals"
                      ? "border-primary text-primary"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  Mis Propuestas ({proposals.length})
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    handleActiveTab("messages")
                  }}
                  className={`py-3 sm:py-4 px-3 sm:px-6 border-b-2 font-medium text-xs sm:text-sm cursor-pointer whitespace-nowrap ${
                    activeTab === "messages"
                      ? "border-primary text-primary"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  Mensajes ({conversations.length})
                </button>
                {/* NUEVA PESTAÑA: Reseñas */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    handleActiveTab("reviews")
                    loadPendingReviewsCount()
                  }}
                  className={`py-3 sm:py-4 px-3 sm:px-6 border-b-2 font-medium text-xs sm:text-sm cursor-pointer whitespace-nowrap relative ${
                    activeTab === "reviews"
                      ? "border-primary text-primary"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <i className="ri-star-line mr-1"></i>
                  Reseñas
                  {pendingReviewsCount > 0 && (
                    <span className="absolute top-1 right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {pendingReviewsCount}
                    </span>
                  )}
                </button>
                {/* NUEVA PESTAÑA: Logros */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    handleActiveTab("achievements")
                  }}
                  className={`py-3 sm:py-4 px-3 sm:px-6 border-b-2 font-medium text-xs sm:text-sm cursor-pointer whitespace-nowrap ${
                    activeTab === "achievements"
                      ? "border-primary text-primary"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <i className="ri-trophy-line mr-1"></i>
                  Logros
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    handleActiveTab("user")
                  }}
                  className={`py-3 sm:py-4 px-3 sm:px-6 border-b-2 font-medium text-xs sm:text-sm cursor-pointer whitespace-nowrap ${
                    activeTab === "user"
                      ? "border-primary text-primary"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  Mi Perfil
                </button>
                <button
                  onClick={() => handleActiveTab("payments")}
                  className={`flex items-center px-3 sm:px-4 py-2 sm:py-3 rounded-lg font-medium transition-colors cursor-pointer whitespace-nowrap text-xs sm:text-sm ${
                    activeTab === "payments"
                      ? "bg-primary/10 text-emerald-700"
                      : "text-gray-600 hover:text-primary hover:bg-emerald-50"
                  }`}
                >
                  <i className="ri-bank-card-line mr-1 sm:mr-2"></i>
                  Ingresos
                </button>
                {/* NUEVA PESTAÑA: Analytics */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    handleActiveTab("analytics")
                  }}
                  className={`py-3 sm:py-4 px-3 sm:px-6 border-b-2 font-medium text-xs sm:text-sm cursor-pointer whitespace-nowrap ${
                    activeTab === "analytics"
                      ? "border-primary text-primary"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <i className="ri-bar-chart-line mr-1"></i>
                  Analytics
                </button>
              </nav>
            </div>

            <div className="p-4 sm:p-6">
              {/* Proyectos Disponibles */}
              {activeTab === "projects" && (
                <div className="space-y-4 sm:space-y-6">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Proyectos Disponibles
                    </h3>
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <i className="ri-information-line"></i>
                      <span>Proyectos sin propuestas aceptadas</span>
                    </div>
                  </div>

                  {projects.length === 0 ? (
                    <div className="text-center py-8 sm:py-12">
                      <i className="ri-folder-open-line text-4xl sm:text-6xl text-gray-300 mb-4"></i>
                      <h3 className="text-lg sm:text-xl font-medium text-gray-900 mb-2">
                        No hay proyectos disponibles
                      </h3>
                      <p className="text-sm sm:text-base text-gray-500">
                        Vuelve más tarde para ver nuevas oportunidades
                      </p>
                    </div>
                  ) : (
                    <div className="grid gap-4 sm:gap-6">
                      {projects.map((project) => (
                        <AvailableProjectArticle
                          key={project.id}
                          project={project}
                          viewProjectDetails={() => viewProjectDetails(project)}
                          proposals={proposals}
                          sendProposal={() => sendProposal(project.id)}
                          startChat={() =>
                            startChat(project.id, project.client?.id!)
                          }
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Mis Proyectos */}
              {activeTab === "my-projects" && (
                <div className="space-y-4 sm:space-y-6">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Mis Proyectos Activos
                    </h3>
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <i className="ri-briefcase-line"></i>
                      <span>{myProjects.length} proyectos en total</span>
                    </div>
                  </div>

                  {myProjects.length === 0 ? (
                    <div className="text-center py-8 sm:py-12">
                      <i className="ri-briefcase-line text-4xl sm:text-6xl text-gray-300 mb-4"></i>
                      <h3 className="text-lg sm:text-xl font-medium text-gray-900 mb-2">
                        No tienes proyectos asignados
                      </h3>
                      <p className="text-sm sm:text-base text-gray-500">
                        Envía propuestas para conseguir tus primeros proyectos
                      </p>
                    </div>
                  ) : (
                    <div className="grid gap-4 sm:gap-6">
                      {myProjects.map((project) => (
                        <div
                          key={project.id}
                          className="bg-linear-to-r from-cyan-50 to-cyan-100 rounded-lg p-4 sm:p-6 border border-cyan-200"
                        >
                          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start space-y-4 lg:space-y-0">
                            <div className="flex-1">
                              <div className="flex flex-col sm:flex-row sm:justify-between mb-3">
                                <h4 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-0">
                                  {project.title}
                                </h4>
                                <div className="flex items-center space-x-4">
                                  {project._isFromTransaction ? (
                                    <div className="flex items-center space-x-2">
                                      <span
                                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                          project.payment_status === "paid"
                                            ? "bg-green-100 text-green-800"
                                            : "bg-yellow-100 text-yellow-800"
                                        }`}
                                      >
                                        <i
                                          className={`mr-1 ${
                                            project.payment_status === "paid"
                                              ? "ri-check-line"
                                              : "ri-time-line"
                                          }`}
                                        ></i>
                                        {project.payment_status === "paid"
                                          ? "Pagado"
                                          : "Pago Pendiente"}
                                      </span>
                                      <span className="text-lg sm:text-xl font-bold text-primary">
                                        ${project.budget}
                                      </span>
                                    </div>
                                  ) : (
                                    <div className="flex items-center space-x-2">
                                      <span
                                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                          project.status === "in_progress"
                                            ? "bg-primary/10 text-cyan-800"
                                            : project.status === "completed"
                                              ? "bg-green-100 text-green-800"
                                              : "bg-yellow-100 text-yellow-800"
                                        }`}
                                      >
                                        {project.status === "in_progress"
                                          ? "En Progreso"
                                          : project.status === "completed"
                                            ? "Completado"
                                            : "Pendiente"}
                                      </span>
                                      <span className="text-lg sm:text-xl font-bold text-primary">
                                        $
                                        {project.budget ||
                                          `${project.budget_min}-${project.budget_max}`}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>

                              <p className="text-sm sm:text-base text-gray-600 mb-4 leading-relaxed">
                                {project.description &&
                                project.description.length > 200
                                  ? `${project.description.substring(0, 200)}...`
                                  : project.description ||
                                    "Proyecto contratado directamente"}
                              </p>

                              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                                <div className="flex items-center space-x-4 text-sm text-gray-500">
                                  <div className="flex items-center">
                                    <i className="ri-user-line mr-1"></i>
                                    <span>
                                      {project.client?.full_name || "Cliente"}
                                    </span>
                                    {project.client?.rating && (
                                      <span className="ml-1 text-yellow-500">
                                        ★{project.client.rating}
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center">
                                    <i className="ri-calendar-line mr-1"></i>
                                    <span>
                                      {new Date(
                                        project.created_at
                                      ).toLocaleDateString("es-ES")}
                                    </span>
                                  </div>
                                  {project._isFromTransaction && (
                                    <div className="flex items-center">
                                      <i className="ri-bank-card-line mr-1"></i>
                                      <span>Pago Directo</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="flex flex-col sm:flex-row lg:flex-col space-y-2 sm:space-y-0 sm:space-x-2 lg:space-x-0 lg:space-y-2 lg:ml-6">
                              <button
                                onClick={() =>
                                  viewProjectDetailsInMyProjects(project)
                                }
                                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium whitespace-nowrap cursor-pointer"
                              >
                                <i className="ri-eye-line mr-2"></i>
                                Ver Detalles
                              </button>
                              {!project._isFromTransaction && (
                                <>
                                  <button
                                    onClick={() =>
                                      openProjectManagement(project)
                                    }
                                    className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-cyan-700 transition-colors text-sm font-medium whitespace-nowrap cursor-pointer"
                                  >
                                    <i className="ri-settings-3-line mr-2"></i>
                                    Gestionar
                                  </button>
                                  <button
                                    onClick={() =>
                                      openProgressManagement(project)
                                    }
                                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium whitespace-nowrap cursor-pointer"
                                  >
                                    <i className="ri-bar-chart-line mr-2"></i>
                                    Gestionar Progreso
                                  </button>
                                </>
                              )}
                              {project.client?.id && (
                                <button
                                  onClick={() =>
                                    startChat(project.id, project.client?.id!)
                                  }
                                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-cyan-700 transition-colors text-sm font-medium whitespace-nowrap cursor-pointer"
                                >
                                  <i className="ri-chat-3-line mr-2"></i>
                                  Chat Cliente
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Mis Propuestas */}
              {activeTab === "proposals" && (
                <div className="space-y-4 sm:space-y-6">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Mis Propuestas
                    </h3>
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2 text-sm">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span>
                          Aceptadas:{" "}
                          {
                            proposals.filter((p) => p.status === "accepted")
                              .length
                          }
                        </span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm">
                        <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                        <span>
                          Pendientes:{" "}
                          {
                            proposals.filter((p) => p.status === "pending")
                              .length
                          }
                        </span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm">
                        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                        <span>
                          Rechazadas:{" "}
                          {
                            proposals.filter((p) => p.status === "rejected")
                              .length
                          }
                        </span>
                      </div>
                    </div>
                  </div>

                  {proposals.length === 0 ? (
                    <div className="text-center py-8 sm:py-12">
                      <i className="ri-file-text-line text-4xl sm:text-6xl text-gray-300 mb-4"></i>
                      <h3 className="text-lg sm:text-xl font-medium text-gray-900 mb-2">
                        No has enviado propuestas
                      </h3>
                      <p className="text-sm sm:text-base text-gray-500">
                        Explora los proyectos disponibles y envía tu primera
                        propuesta
                      </p>
                    </div>
                  ) : (
                    <div className="grid gap-4 sm:gap-6">
                      {proposals.map((proposal) => (
                        <div
                          key={proposal.id}
                          className={`rounded-lg p-4 sm:p-6 border-2 ${
                            proposal.status === "accepted"
                              ? "bg-green-50 border-green-200"
                              : proposal.status === "pending"
                                ? "bg-yellow-50 border-yellow-200"
                                : "bg-red-50 border-red-200"
                          }`}
                        >
                          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start space-y-4 lg:space-y-0">
                            <div className="flex-1">
                              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3">
                                <h4 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-0">
                                  {proposal.project?.title || "Proyecto"}
                                </h4>
                                <div className="flex items-center space-x-4">
                                  <span
                                    className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                                      proposal.status === "accepted"
                                        ? "bg-green-100 text-green-800"
                                        : proposal.status === "pending"
                                          ? "bg-yellow-100 text-yellow-800"
                                          : "bg-red-100 text-red-800"
                                    }`}
                                  >
                                    <i
                                      className={`mr-1 ${
                                        proposal.status === "accepted"
                                          ? "ri-check-line"
                                          : proposal.status === "pending"
                                            ? "ri-time-line"
                                            : "ri-close-line"
                                      }`}
                                    ></i>
                                    {proposal.status === "accepted"
                                      ? "Aceptada"
                                      : proposal.status === "pending"
                                        ? "Pendiente"
                                        : "Rechazada"}
                                  </span>
                                  <span className="text-lg sm:text-xl font-bold text-primary">
                                    ${proposal.proposed_budget}
                                  </span>
                                </div>
                              </div>

                              <p className="text-sm sm:text-base text-gray-600 mb-4 leading-relaxed">
                                {/*  */}
                                {proposal.message.length > 150
                                  ? `${proposal.message.substring(0, 150)}...`
                                  : proposal.message}
                              </p>

                              {/* NUEVO: Mostrar progreso si la propuesta está aceptada */}
                              {proposal.status === "accepted" &&
                                proposal.project?.progress_percentage !==
                                  undefined && (
                                  <div className="flex items-center mb-3">
                                    <div className="flex-1 bg-gray-200 rounded-full h-2 mr-3">
                                      <div
                                        className="bg-primary h-2 rounded-full transition-all duration-500"
                                        style={{
                                          width: `${proposal.project.progress_percentage || 0}%`,
                                        }}
                                      ></div>
                                    </div>
                                    <span className="text-sm text-gray-600 font-medium">
                                      {proposal.project.progress_percentage ||
                                        0}
                                      %
                                    </span>
                                  </div>
                                )}

                              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                                <div className="flex items-center space-x-4 text-sm text-gray-500">
                                  <div className="flex items-center">
                                    <i className="ri-user-line mr-1"></i>
                                    <span>
                                      {proposal.project?.client?.full_name ||
                                        "Cliente"}
                                    </span>
                                  </div>
                                  <div className="flex items-center">
                                    <i className="ri-calendar-line mr-1"></i>
                                    <span>
                                      {new Date(
                                        proposal.created_at
                                      ).toLocaleDateString("es-ES")}
                                    </span>
                                  </div>
                                  <div className="flex items-center">
                                    <i className="ri-time-line mr-1"></i>
                                    <span>{proposal.delivery_time} días</span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="flex flex-col sm:flex-row lg:flex-col space-y-2 sm:space-y-0 sm:space-x-2 lg:space-x-0 lg:space-y-2 lg:ml-6">
                              <button
                                onClick={() => viewProposalDetails(proposal)}
                                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium whitespace-nowrap cursor-pointer"
                              >
                                <i className="ri-eye-line mr-2"></i>
                                Ver Detalles
                              </button>

                              {/* NUEVO: Botón Gestionar Progreso para propuestas aceptadas */}
                              {proposal.status === "accepted" && (
                                <button
                                  onClick={() =>
                                    openProgressManagement(proposal.project)
                                  }
                                  className="px-4 py-2 bg-primary hover:bg-cyan-700 text-white font-medium text-sm rounded-lg transition-colors whitespace-nowrap cursor-pointer"
                                >
                                  <i className="ri-bar-chart-line mr-2"></i>
                                  Gestionar Progreso
                                </button>
                              )}

                              {proposal.project?.client?.id && (
                                <button
                                  onClick={() =>
                                    handleContactClient(
                                      proposal.project.client?.id!,
                                      proposal.project.client?.full_name!
                                    )
                                  }
                                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-cyan-700 transition-colors text-sm font-medium whitespace-nowrap cursor-pointer"
                                >
                                  <i className="ri-chat-3-line mr-2"></i>
                                  Contactar
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Mensajes */}
              {activeTab === "messages" && (
                <div className="space-y-4 sm:space-y-6">
                  <div className="flex flex-col sm:justify-between sm:items-center space-y-4 sm:space-y-0">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Mensajes
                    </h3>
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <i className="ri-chat-3-line"></i>
                      <span>{conversations.length} conversaciones</span>
                    </div>
                  </div>

                  {conversationsLoading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                      <p className="mt-2 text-gray-500">
                        Cargando conversaciones...
                      </p>
                    </div>
                  ) : conversations.length === 0 ? (
                    <div className="text-center py-8 sm:py-12">
                      <i className="ri-chat-3-line text-4xl sm:6xl text-gray-300 mb-4"></i>
                      <h3 className="text-lg sm:text-xl font-medium text-gray-900 mb-2">
                        No tienes mensajes
                      </h3>
                      <p className="text-sm sm:text-base text-gray-500">
                        Las conversaciones con los clientes aparecerán aquí
                      </p>
                    </div>
                  ) : (
                    <div className="grid gap-4">
                      {conversations.map((conversation) => (
                        <div
                          key={conversation.id}
                          className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                          onClick={() => openChat(conversation)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center overflow-hidden">
                                {conversation.client?.avatar_url ? (
                                  <img
                                    src={conversation.client.avatar_url}
                                    alt={conversation.client.full_name}
                                    className="w-full h-full object-cover object-top"
                                  />
                                ) : (
                                  <i className="ri-user-line text-primary"></i>
                                )}
                              </div>
                              <div>
                                <h4 className="font-semibold text-gray-900">
                                  {conversation.client?.full_name}
                                </h4>
                                {conversation.project && (
                                  <p className="text-sm text-gray-500">
                                    {conversation.project.title}
                                  </p>
                                )}
                                {conversation.latest_message && (
                                  <p className="text-sm text-gray-600 mt-1">
                                    {conversation.latest_message.message_text
                                      .length > 50
                                      ? `${conversation.latest_message.message_text.substring(0, 50)}...`
                                      : conversation.latest_message
                                          .message_text}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              {conversation.latest_message && (
                                <p className="text-xs text-gray-500">
                                  {new Date(
                                    conversation.latest_message.created_at
                                  ).toLocaleDateString("es-ES")}
                                </p>
                              )}
                              <i className="ri-arrow-right-line text-gray-400 mt-2"></i>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Reseñas */}
              {activeTab === "reviews" && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Gestión de Reseñas
                    </h3>
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <i className="ri-star-line"></i>
                      <span>Calificación promedio: {user?.rating || 0}★</span>
                    </div>
                  </div>

                  {/* Reseñas pendientes de escribir */}
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                    <h4 className="text-lg font-semibold text-yellow-800 mb-4 flex items-center">
                      <i className="ri-edit-line mr-2"></i>
                      Reseñas Pendientes de Escribir
                      {pendingReviewsCount > 0 && (
                        <span className="ml-2 bg-yellow-500 text-white text-sm rounded-full w-6 h-6 flex items-center justify-center">
                          {pendingReviewsCount}
                        </span>
                      )}
                    </h4>
                    <PendingReviews
                      onReviewsUpdate={() => loadPendingReviewsCount()}
                    />
                  </div>

                  {/* Reseñas recibidas */}
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <i className="ri-star-fill mr-2 text-yellow-500"></i>
                      Reseñas Recibidas
                    </h4>
                    <ReviewsDisplay userId={user?.id} userType="freelancer" />
                  </div>
                </div>
              )}

              {/* Mi Perfil */}
              {activeTab === "user" && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Mi Perfil
                  </h3>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Información Personal */}
                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                      <h4 className="text-lg font-semibold text-gray-900 mb-4">
                        Información Personal
                      </h4>
                      <div className="space-y-4">
                        <div className="flex items-center space-x-4">
                          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center overflow-hidden">
                            {user?.avatar_url ? (
                              <img
                                src={user.avatar_url}
                                alt={user.full_name}
                                className="w-full h-full object-cover object-top rounded-full"
                              />
                            ) : (
                              <i className="ri-user-line text-2xl text-primary"></i>
                            )}
                          </div>
                          <div>
                            <h5 className="font-semibold text-gray-900">
                              {user?.full_name}
                            </h5>
                            <p className="text-gray-600">{user?.email}</p>
                            <div className="flex items-center mt-1">
                              <span className="text-yellow-500">★</span>
                              <span className="ml-1 text-sm text-gray-600">
                                {user?.rating || 0} calificación
                              </span>
                            </div>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Bio
                          </label>
                          <p className="text-gray-600">
                            {user?.bio || "No has agregado una biografía"}
                          </p>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Habilidades
                          </label>
                          <div className="flex flex-wrap gap-2">
                            {user?.skills ? (
                              user.skills.map(
                                (skill: string, index: number) => (
                                  <span
                                    key={index}
                                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary"
                                  >
                                    {skill}
                                  </span>
                                )
                              )
                            ) : (
                              <span className="text-gray-500 text-sm">
                                No has agregado habilidades
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Estadísticas */}
                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                      <h4 className="text-lg font-semibold text-gray-900 mb-4">
                        Estadísticas
                      </h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-4 bg-emerald-50 rounded-lg">
                          <div className="text-2xl font-bold text-primary">
                            {myProjects.length}
                          </div>
                          <div className="text-sm text-gray-600">
                            Proyectos Activos
                          </div>
                        </div>
                        <div className="text-center p-4 bg-blue-50 rounded-lg">
                          <div className="text-2xl font-bold text-primary">
                            {proposals.length}
                          </div>
                          <div className="text-sm text-gray-600">
                            Propuestas Enviadas
                          </div>
                        </div>
                        <div className="text-center p-4 bg-yellow-50 rounded-lg">
                          <div className="text-2xl font-bold text-yellow-600">
                            {
                              proposals.filter((p) => p.status === "accepted")
                                .length
                            }
                          </div>
                          <div className="text-sm text-gray-600">
                            Propuestas Aceptadas
                          </div>
                        </div>
                        <div className="text-center p-4 bg-purple-50 rounded-lg">
                          <div className="text-2xl font-bold text-purple-600">
                            {conversations.length}
                          </div>
                          <div className="text-sm text-gray-600">
                            Conversaciones
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <ShareProfileTab />
                </div>
              )}

              {/* Ingresos */}
              {activeTab === "payments" && (
                <PaymentsTab userType="freelancer" />
              )}

              {/* Analytics Profesionales */}
              {activeTab === "analytics" && user?.id && (
                <AnalyticsDashboard userId={user.id} userType="freelancer" />
              )}

              {/* NUEVA PESTAÑA: Logros y Badges */}
              {activeTab === "achievements" && user?.id && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-gray-900">
                      🏆 Sistema de Logros
                    </h3>
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <i className="ri-magic-line"></i>
                      <span>Gamificación activada</span>
                    </div>
                  </div>

                  <BadgeSystem userId={user.id} userType="freelancer" />
                </div>
              )}
            </div>
          </div>
        </MainComponent>

        {/* NUEVO: Modal de Gestión de Progreso para Propuestas Aceptadas */}
        {showProgressManagement && selectedProjectForProgress && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4">
            <div className="bg-white rounded-xl sm:rounded-2xl w-full max-w-full sm:max-w-6xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
              <div className="p-4 sm:p-6">
                <div className="flex justify-between items-start mb-4 sm:mb-6">
                  <div>
                    <h2 className="text-lg sm:text-2xl font-bold text-gray-900">
                      Gestión de Progreso
                    </h2>
                    <h3 className="text-sm sm:text-lg text-gray-600">
                      {selectedProjectForProgress.title}
                    </h3>
                    <div className="flex items-center mt-2">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <i className="ri-check-line mr-1"></i>
                        {selectedProjectForProgress._isFromTransaction
                          ? "Proyecto Contratado"
                          : "Propuesta Aceptada"}
                      </span>
                      <span className="ml-2 text-sm text-gray-600">
                        Cliente: {selectedProjectForProgress.client?.full_name}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setShowProgressManagement(false)
                      setSelectedProjectForProgress(null)
                    }}
                    className="text-gray-400 hover:text-gray-600 cursor-pointer p-1"
                  >
                    <i className="ri-close-line text-xl sm:text-2xl"></i>
                  </button>
                </div>

                <FreelancerProjectManagement
                  project={selectedProjectForProgress}
                  onClose={() => {
                    setShowProgressManagement(false)
                    setSelectedProjectForProgress(null)
                    loadData() // Recargar datos para actualizar el progreso
                  }}
                  onUpdate={() => {
                    loadData() // Recargar datos cuando se actualice el progreso
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Modal de Gestión de Proyectos */}
        {showProjectManagement && selectedProjectForManagement && (
          <FreelancerProjectManagement
            project={selectedProjectForManagement}
            onClose={() => {
              setShowProjectManagement(false)
              setSelectedProjectForManagement(null)
              loadData() // Recargar datos para actualizar el progreso
            }}
          />
        )}

        {/* Modal de Detalles de Proyecto (Proyectos Disponibles) */}
        {showProjectDetails && selectedProjectDetails && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4">
            <div className="bg-white rounded-xl sm:rounded-2xl w-full max-w-full sm:max-w-4xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
              <div className="p-4 sm:p-6">
                <div className="flex justify-between items-start mb-4 sm:mb-6">
                  <div>
                    <h2 className="text-lg sm:text-2xl font-bold text-gray-900">
                      {selectedProjectDetails.title}
                    </h2>
                    <div className="flex items-center mt-2 space-x-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <i className="ri-check-line mr-1"></i>
                        {selectedProjectDetails.status === "open"
                          ? "Abierto"
                          : selectedProjectDetails.status}
                      </span>
                      <span className="text-lg font-bold text-primary">
                        $
                        {selectedProjectDetails.budget_min ||
                          selectedProjectDetails.budget ||
                          0}{" "}
                        - $
                        {selectedProjectDetails.budget_max ||
                          selectedProjectDetails.budget ||
                          0}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setShowProjectDetails(false)
                      setSelectedProjectDetails(null)
                    }}
                    className="text-gray-400 hover:text-gray-600 cursor-pointer p-1"
                  >
                    <i className="ri-close-line text-xl sm:text-2xl"></i>
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Información del Cliente */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">
                      Información del Cliente
                    </h3>
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center overflow-hidden">
                        {selectedProjectDetails.client?.avatar_url ? (
                          <img
                            src={selectedProjectDetails.client.avatar_url}
                            alt={selectedProjectDetails.client.full_name}
                            className="w-full h-full object-cover object-top"
                          />
                        ) : (
                          <i className="ri-user-line text-primary text-xl"></i>
                        )}
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">
                          {selectedProjectDetails.client?.full_name}
                        </h4>
                        <p className="text-gray-600">
                          {selectedProjectDetails.client?.email}
                        </p>
                        {selectedProjectDetails.client?.rating && (
                          <div className="flex items-center mt-1">
                            <span className="text-yellow-500">★</span>
                            <span className="ml-1 text-sm text-gray-600">
                              {selectedProjectDetails.client.rating}{" "}
                              calificación
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Descripción del Proyecto */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">
                      Descripción del Proyecto
                    </h3>
                    <p className="text-gray-700 leading-relaxed">
                      {selectedProjectDetails.description}
                    </p>
                  </div>

                  {/* Habilidades Requeridas */}
                  {selectedProjectDetails.required_skills &&
                    selectedProjectDetails.required_skills.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">
                          Habilidades Requeridas
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {selectedProjectDetails.required_skills.map(
                            (skill, index) => (
                              <span
                                key={index}
                                className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary/10 text-cyan-800"
                              >
                                {skill}
                              </span>
                            )
                          )}
                        </div>
                      </div>
                    )}

                  {/* Detalles del Proyecto */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 mb-2">
                        Presupuesto
                      </h4>
                      <p className="text-2xl font-bold text-primary">
                        $
                        {selectedProjectDetails.budget_min ||
                          selectedProjectDetails.budget ||
                          0}{" "}
                        - $
                        {selectedProjectDetails.budget_max ||
                          selectedProjectDetails.budget ||
                          0}
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 mb-2">
                        Tipo de Proyecto
                      </h4>
                      <p className="text-gray-700">
                        {selectedProjectDetails.project_type ||
                          "No especificado"}
                      </p>
                    </div>
                    {selectedProjectDetails.deadline && (
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="font-semibold text-gray-900 mb-2">
                          Fecha Límite
                        </h4>
                        <p className="text-gray-700">
                          {new Date(
                            selectedProjectDetails.deadline
                          ).toLocaleDateString("es-ES")}
                        </p>
                      </div>
                    )}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 mb-2">
                        Publicado
                      </h4>
                      <p className="text-gray-700">
                        {new Date(
                          selectedProjectDetails.created_at
                        ).toLocaleDateString("es-ES")}
                      </p>
                    </div>
                  </div>

                  {/* Botones de Acción */}
                  <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4 pt-4 border-t">
                    {!proposals.find(
                      (p) => p.project.id === selectedProjectDetails.id
                    ) &&
                      proposals &&
                      selectedProjectDetails && (
                        <button
                          onClick={() => {
                            setShowProjectDetails(false)
                            sendProposal(selectedProjectDetails.id)
                          }}
                          className="flex-1 px-6 py-3 bg-primary text-white rounded-lg hover:bg-cyan-700 transition-colors font-medium cursor-pointer"
                        >
                          <i className="ri-send-plane-line mr-2"></i>
                          Enviar Propuesta
                        </button>
                      )}
                    {selectedProjectDetails.client?.id && (
                      <button
                        onClick={() => {
                          setShowProjectDetails(false)
                          startChat(
                            selectedProjectDetails.id,
                            selectedProjectDetails.client!.id
                          )
                        }}
                        className="flex-1 px-6 py-3 bg-primary text-white rounded-lg hover:bg-cyan-700 transition-colors font-medium cursor-pointer"
                      >
                        <i className="ri-chat-3-line mr-2"></i>
                        Chat con Cliente
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* RESTAURADO: Modal de detalles de propuesta */}
        {showProposalDetails &&
          selectedProposalForDetails &&
          proposalProjectDetails && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4">
              <div className="bg-white rounded-xl sm:rounded-2xl w-full max-w-full sm:max-w-4xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
                <div className="p-4 sm:p-6">
                  <div className="flex justify-between items-start mb-4 sm:mb-6">
                    <div>
                      <h2 className="text-lg sm:text-2xl font-bold text-gray-900">
                        Detalles de la Propuesta
                      </h2>
                      <h3 className="text-sm sm:text-lg text-gray-600">
                        {proposalProjectDetails.title}
                      </h3>
                      <div className="flex items-center mt-2 space-x-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            selectedProposalForDetails.status === "accepted"
                              ? "bg-green-100 text-green-800"
                              : selectedProposalForDetails.status === "pending"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-red-100 text-red-800"
                          }`}
                        >
                          <i
                            className={`mr-1 ${
                              selectedProposalForDetails.status === "accepted"
                                ? "ri-check-line"
                                : selectedProposalForDetails.status ===
                                    "pending"
                                  ? "ri-time-line"
                                  : "ri-close-line"
                            }`}
                          ></i>
                          {selectedProposalForDetails.status === "accepted"
                            ? "Aceptada"
                            : selectedProposalForDetails.status === "pending"
                              ? "Pendiente"
                              : "Rechazada"}
                        </span>
                        <span className="text-lg font-bold text-primary">
                          ${selectedProposalForDetails.proposed_budget}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setShowProposalDetails(false)
                        setSelectedProposalForDetails(null)
                        setProposalProjectDetails(null)
                      }}
                      className="text-gray-400 hover:text-gray-600 cursor-pointer p-1"
                    >
                      <i className="ri-close-line text-xl sm:text-2xl"></i>
                    </button>
                  </div>

                  <div className="space-y-6">
                    {/* Mi Propuesta */}
                    <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                      <h3 className="text-lg font-semibold text-emerald-800 mb-3">
                        Mi Propuesta
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                        <div>
                          <h4 className="font-semibold text-emerald-700">
                            Presupuesto Propuesto
                          </h4>
                          <p className="text-2xl font-bold text-primary">
                            ${selectedProposalForDetails.proposed_budget}
                          </p>
                        </div>
                        <div>
                          <h4 className="font-semibold text-emerald-700">
                            Tiempo de Entrega
                          </h4>
                          <p className="text-xl font-semibold text-primary">
                            {selectedProposalForDetails.delivery_time} días
                          </p>
                        </div>
                        <div>
                          <h4 className="font-semibold text-emerald-700">
                            Enviada
                          </h4>
                          <p className="text-primary">
                            {new Date(
                              selectedProposalForDetails.created_at
                            ).toLocaleDateString("es-ES")}
                          </p>
                        </div>
                      </div>
                      <div>
                        <h4 className="font-semibold text-cyan-700 mb-2">
                          Carta de Presentación
                        </h4>
                        <p className="text-cyan-700 leading-relaxed">
                          {selectedProposalForDetails.message}
                        </p>
                      </div>
                    </div>

                    {/* Información del Proyecto */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">
                        Información del Proyecto
                      </h3>
                      <p className="text-gray-700 leading-relaxed mb-4">
                        {proposalProjectDetails.description}
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="bg-gray-50 rounded-lg p-4">
                          <h4 className="font-semibold text-gray-900 mb-2">
                            Presupuesto del Cliente
                          </h4>
                          <p className="text-xl font-bold text-gray-700">
                            ${proposalProjectDetails.budget_min} - $
                            {proposalProjectDetails.budget_max}
                          </p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-4">
                          <h4 className="font-semibold text-gray-900 mb-2">
                            Tipo de Proyecto
                          </h4>
                          <p className="text-gray-700">
                            {proposalProjectDetails.project_type ||
                              "No especificado"}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Información del Cliente */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">
                        Cliente
                      </h3>
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center overflow-hidden">
                          {proposalProjectDetails.client?.avatar_url ? (
                            <img
                              src={proposalProjectDetails.client.avatar_url}
                              alt={proposalProjectDetails.client.full_name}
                              className="w-full h-full object-cover object-top"
                            />
                          ) : (
                            <i className="ri-user-line text-primary text-xl"></i>
                          )}
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">
                            {proposalProjectDetails.client?.full_name}
                          </h4>
                          <p className="text-gray-600">
                            {proposalProjectDetails.client?.email}
                          </p>
                          {proposalProjectDetails.client?.rating && (
                            <div className="flex items-center mt-1">
                              <span className="text-yellow-500">★</span>
                              <span className="ml-1 text-sm text-gray-600">
                                {proposalProjectDetails.client.rating}{" "}
                                calificación
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Botones de Acción */}
                    {selectedProposalForDetails.status === "accepted" && (
                      <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4 pt-4 border-t">
                        <button
                          onClick={() => {
                            setShowProposalDetails(false)
                            openProgressManagement(proposalProjectDetails)
                          }}
                          className="flex-1 px-6 py-3 bg-primary text-white rounded-lg hover:bg-cyan-700 transition-colors font-medium cursor-pointer"
                        >
                          <i className="ri-bar-chart-line mr-2"></i>
                          Gestionar Progreso
                        </button>
                        {proposalProjectDetails.client?.id && (
                          <button
                            onClick={() => {
                              setShowProposalDetails(false)
                              handleContactClient(
                                proposalProjectDetails.client.id,
                                proposalProjectDetails.client.full_name
                              )
                            }}
                            className="flex-1 px-6 py-3 bg-primary text-white rounded-lg hover:bg-cyan-700 transition-colors font-medium cursor-pointer"
                          >
                            <i className="ri-chat-3-line mr-2"></i>
                            Contactar Cliente
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

        {/* RESTAURADO: Modal de detalles de proyecto en "Mis Proyectos" */}
        {showProjectDetailsModal && selectedProjectForDetails && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4">
            <div className="bg-white rounded-xl sm:rounded-2xl w-full max-w-full sm:max-w-4xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
              <div className="p-4 sm:p-6">
                <div className="flex justify-between items-start mb-4 sm:mb-6">
                  <div>
                    <h2 className="text-lg sm:text-2xl font-bold text-gray-900">
                      {selectedProjectForDetails.title}
                    </h2>
                    <div className="flex items-center mt-2 space-x-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          selectedProjectForDetails._isFromTransaction
                            ? selectedProjectForDetails.payment_status ===
                              "paid"
                              ? "bg-green-100 text-green-800"
                              : "bg-yellow-100 text-yellow-800"
                            : "bg-primary/10 text-cyan-800"
                        }`}
                      >
                        <i
                          className={`mr-1 ${
                            selectedProjectForDetails._isFromTransaction
                              ? selectedProjectForDetails.payment_status ===
                                "paid"
                                ? "ri-check-line"
                                : "ri-time-line"
                              : "ri-briefcase-line"
                          }`}
                        ></i>
                        {selectedProjectForDetails._isFromTransaction
                          ? selectedProjectForDetails.payment_status === "paid"
                            ? "Pagado"
                            : "Pago Pendiente"
                          : "Mi Proyecto"}
                      </span>
                      <span className="text-lg font-bold text-primary">
                        $
                        {selectedProjectForDetails.budget ||
                          `${selectedProjectForDetails.budget_min}-${selectedProjectForDetails.budget_max}`}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setShowProjectDetailsModal(false)
                      setSelectedProjectForDetails(null)
                    }}
                    className="text-gray-400 hover:text-gray-600 cursor-pointer p-1"
                  >
                    <i className="ri-close-line text-xl sm:text-2xl"></i>
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Información del Cliente */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">
                      Cliente
                    </h3>
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center overflow-hidden">
                        {selectedProjectForDetails.client?.avatar_url ? (
                          <img
                            src={selectedProjectForDetails.client.avatar_url}
                            alt={selectedProjectForDetails.client.full_name}
                            className="w-full h-full object-cover object-top"
                          />
                        ) : (
                          <i className="ri-user-line text-primary text-xl"></i>
                        )}
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">
                          {selectedProjectForDetails.client?.full_name}
                        </h4>
                        <p className="text-gray-600">
                          {selectedProjectForDetails.client?.email}
                        </p>
                        {selectedProjectForDetails.client?.rating && (
                          <div className="flex items-center mt-1">
                            <span className="text-yellow-500">★</span>
                            <span className="ml-1 text-sm text-gray-600">
                              {selectedProjectForDetails.client.rating}{" "}
                              calificación
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Descripción del Proyecto */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">
                      Descripción
                    </h3>
                    <p className="text-gray-700 leading-relaxed">
                      {selectedProjectForDetails.description ||
                        "Proyecto contratado directamente por el cliente"}
                    </p>
                  </div>

                  {/* Detalles del Proyecto */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 mb-2">
                        Valor del Proyecto
                      </h4>
                      <p className="text-2xl font-bold text-primary">
                        $
                        {selectedProjectForDetails.budget ||
                          `${selectedProjectForDetails.budget_min}-${selectedProjectForDetails.budget_max}`}
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 mb-2">
                        Estado
                      </h4>
                      <p className="text-gray-700">
                        {selectedProjectForDetails._isFromTransaction
                          ? selectedProjectForDetails.payment_status === "paid"
                            ? "Pagado - En Progreso"
                            : "Pago Pendiente"
                          : selectedProjectForDetails.status === "in_progress"
                            ? "En Progreso"
                            : "Completado"}
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 mb-2">
                        Fecha de Inicio
                      </h4>
                      <p className="text-gray-700">
                        {new Date(
                          selectedProjectForDetails.created_at
                        ).toLocaleDateString("es-ES")}
                      </p>
                    </div>
                    {selectedProjectForDetails._isFromTransaction && (
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="font-semibold text-gray-900 mb-2">
                          Tipo
                        </h4>
                        <p className="text-gray-700">Contratación Directa</p>
                      </div>
                    )}
                  </div>

                  {/* Botones de Acción */}
                  <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4 pt-4 border-t">
                    {!selectedProjectForDetails._isFromTransaction && (
                      <button
                        onClick={() => {
                          setShowProjectDetailsModal(false)
                          openProjectManagement(selectedProjectForDetails)
                        }}
                        className="flex-1 px-6 py-3 bg-primary text-white rounded-lg hover:bg-cyan-700 transition-colors font-medium cursor-pointer"
                      >
                        <i className="ri-settings-3-line mr-2"></i>
                        Gestionar Proyecto
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setShowProjectDetailsModal(false)
                        openProgressManagement(selectedProjectForDetails)
                      }}
                      className="flex-1 px-6 py-3 bg-primary text-white rounded-lg hover:bg-cyan-700 transition-colors font-medium cursor-pointer"
                    >
                      <i className="ri-bar-chart-line mr-2"></i>
                      Gestionar Progreso
                    </button>
                    {selectedProjectForDetails.client?.id && (
                      <button
                        onClick={() => {
                          setShowProjectDetailsModal(false)
                          startChat(
                            selectedProjectForDetails.id,
                            selectedProjectForDetails.client!.id
                          )
                        }}
                        className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium cursor-pointer"
                      >
                        <i className="ri-chat-3-line mr-2"></i>
                        Chat Cliente
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Envío de Propuesta */}
        {showProposalModal && selectedProject && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4">
            <div className="bg-white rounded-xl sm:rounded-2xl w-full max-w-full sm:max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
              <div className="p-4 sm:p-6">
                <div className="flex justify-between items-start mb-4 sm:mb-6">
                  <div>
                    <h2 className="text-lg sm:text-2xl font-bold text-gray-900">
                      Enviar Propuesta
                    </h2>
                    <h3 className="text-sm sm:text-lg text-gray-600">
                      {selectedProject.title}
                    </h3>
                  </div>
                  <button
                    onClick={() => {
                      setShowProposalModal(false)
                      setSelectedProject(null)
                      setProposalForm({
                        budget: "",
                        delivery_time: "",
                        message: "",
                      })
                    }}
                    className="text-gray-400 hover:text-gray-600 cursor-pointer p-1"
                  >
                    <i className="ri-close-line text-xl sm:text-2xl"></i>
                  </button>
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    submitProposal()
                  }}
                  className="space-y-6"
                >
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Presupuesto Propuesto (USD)
                    </label>
                    <input
                      type="number"
                      value={proposalForm.budget}
                      onChange={(e) =>
                        setProposalForm({
                          ...proposalForm,
                          budget: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                      placeholder="Ej: 500"
                      required
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Presupuesto del cliente: ${selectedProject.budget_min} - $
                      {selectedProject.budget_max}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tiempo de Entrega (días)
                    </label>
                    <input
                      type="number"
                      value={proposalForm.delivery_time}
                      onChange={(e) =>
                        setProposalForm({
                          ...proposalForm,
                          delivery_time: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                      placeholder="Ej: 7"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Carta de Presentación
                    </label>
                    <textarea
                      value={proposalForm.message}
                      onChange={(e) =>
                        setProposalForm({
                          ...proposalForm,
                          message: e.target.value,
                        })
                      }
                      rows={6}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                      placeholder="Explica por qué eres el freelancer ideal para este proyecto..."
                      required
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4 pt-4 border-t">
                    <button
                      type="button"
                      onClick={() => {
                        setShowProposalModal(false)
                        setSelectedProject(null)
                        setProposalForm({
                          budget: "",
                          delivery_time: "",
                          message: "",
                        })
                      }}
                      className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-6 py-3 bg-primary text-white rounded-lg hover:bg-cyan-700 transition-colors font-medium cursor-pointer"
                    >
                      <i className="ri-send-plane-line mr-2"></i>
                      Enviar Propuesta
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Chat Modal */}
        {showChat && selectedConversation && (
          <ConversationModal
            selectedConversation={selectedConversation}
            setShowChat={(boolean) => setShowChat(boolean)}
            setChatMessages={(array) => setChatMessages(array)}
            setSelectedConversation={(conversation) =>
              setSelectedConversation(conversation)
            }
            setNewMessage={(message: string) => setNewMessage(message)}
            chatLoading={chatLoading}
            chatMessages={chatMessages}
            user={user}
            newMessage={newMessage}
            handleKeyPress={(event) => handleKeyPress(event)}
            sendingMessage={sendingMessage}
            sendMessage={() => sendMessage()}
          />
        )}
      </Layout>
    </ProtectedRoute>
  )
}
