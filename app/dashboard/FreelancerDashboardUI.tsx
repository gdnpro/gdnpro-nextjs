"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/AuthContext"
import PaymentsTab from "@/components/PaymentsTab"
import { ShareProfileTab } from "@/components/ShareProfileTab"
import { PendingReviews } from "@/components/dashboard/PendingReviews"
import { ReviewsDisplay } from "@/components/dashboard/ReviewsDisplay"
import BadgeSystem from "@/components/dashboard/BadgeSystem"
import AnalyticsDashboard from "@/components/dashboard/AnalyticsDashboard"
import { FreelancerProjectManagement } from "@/components/freelancers/FreelancerProjectManagement"
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
import { supabaseBrowser } from "@/utils/supabase/client"
import ProtectedRoute from "@/components/ProtectedRoute"

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
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [chatLoading, setChatLoading] = useState(false)
  const [sendingMessage, setSendingMessage] = useState(false)

  const [myProjects, setMyProjects] = useState<Project[]>([])
  const [showProjectDetails, setShowProjectDetails] = useState(false)
  const [selectedProjectDetails, setSelectedProjectDetails] = useState<Project | null>(null)

  const [showProjectManagement, setShowProjectManagement] = useState(false)
  const [selectedProjectForManagement, setSelectedProjectForManagement] = useState<Project | null>(
    null,
  )

  const [pendingReviewsCount, setPendingReviewsCount] = useState(0)

  // RESTAURADO: Estados para modal de detalles de propuesta
  const [showProposalDetails, setShowProposalDetails] = useState(false)
  const [selectedProposalForDetails, setSelectedProposalForDetails] = useState<Proposal | null>(
    null,
  )
  const [proposalProjectDetails, setProposalProjectDetails] = useState<any>(null)

  // RESTAURADO: Estados para modal de detalles de proyecto en "Mis Proyectos"
  const [showProjectDetailsModal, setShowProjectDetailsModal] = useState(false)
  const [selectedProjectForDetails, setSelectedProjectForDetails] = useState<Project | null>(null)

  // NUEVO: Estados para modal de gestión de progreso
  const [showProgressManagement, setShowProgressManagement] = useState(false)
  const [selectedProjectForProgress, setSelectedProjectForProgress] = useState<Project | null>(null)

  const { notifyProposal, notifyNewMessage } = useNotifications()

  const { setValue, getValue } = useSessionStorage("last_tab")

  useEffect(() => {
    document.title = "Freelancer Dashboard | GDN Pro"
    window.scrollTo(0, 0)

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
        `,
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
        `,
        )
        .eq("status", "open")
        .is("freelancer_id", null) // Sin freelancer asignado
        .order("created_at", { ascending: false })

      // Obtener IDs de proyectos que SÍ tienen propuestas aceptadas
      const { data: acceptedProposals } = await supabase
        .from("proposals")
        .select("project_id")
        .eq("status", "accepted")

      const acceptedProjectIds = acceptedProposals?.map((p: Proposal) => p.project_id) || []

      // Filtrar proyectos sin propuestas que NO tengan propuestas aceptadas
      const filteredProjectsWithoutProposals =
        projectsWithoutProposals?.filter(
          (project: Project) => !acceptedProjectIds.includes(project.id),
        ) || []

      // Combinar ambos conjuntos de proyectos
      const allAvailableProjects = [...(projectsData || []), ...filteredProjectsWithoutProposals]

      // Eliminar duplicados por ID
      const uniqueProjects = allAvailableProjects.filter(
        (project, index, self) => index === self.findIndex((p) => p.id === project.id),
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
          `,
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
              },
            )

            if (response.ok) {
              const data = await response.json()
              // CORREGIDO: Incluir transacciones PAGADAS Y PENDIENTES
              const allTransactions = (data.transactions || []).filter(
                (t: any) => t.status === "paid" || t.status === "pending",
              )

              // Crear "proyectos virtuales" desde TODAS las transacciones para mostrar en "Mis Proyectos"
              projectsFromTransactions = allTransactions.map((transaction: any) => ({
                id: `transaction-${transaction.id}`,
                title: transaction.project_title || "Proyecto Contratado",
                description:
                  transaction.project_description ||
                  "Proyecto contratado directamente por el cliente",
                budget: parseFloat(transaction.amount),
                status: transaction.status === "paid" ? "in_progress" : "pending_payment",
                payment_status: transaction.status, // 'paid' o 'pending'
                created_at: transaction.created_at || transaction.paid_at,
                duration: "Según acuerdo con cliente",
                requirements: "Proyecto contratado directamente - revisar detalles en chat",
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
              }))
            }
          } catch (error) {
            console.error("⚠️ Error cargando transacciones para proyectos:", error)
          }
        }

        // 3. Combinar proyectos asignados + proyectos de transacciones
        const allMyProjects = [...(assignedProjects || []), ...projectsFromTransactions]

        // Eliminar duplicados por ID si existen
        const uniqueProjects = allMyProjects.filter(
          (project, index, self) => index === self.findIndex((p) => p.id === project.id),
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
        `,
        )
        .eq("freelancer_id", user.id)
        .order("created_at", { ascending: false })

      if (proposalsError) {
        console.error("❌ Error loading proposals:", proposalsError)
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
        },
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
      console.log("❌ No profile available")
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
        },
      )

      if (!response.ok) {
        console.error("❌ HTTP Error:", response.status, response.statusText)
        const errorText = await response.text()
        console.error("❌ Error detail:", errorText)
        setConversations([])
        setConversationsLoading(false)
        return
      }

      const data = await response.json()

      if (data.success) {
        setConversations(data.conversations || [])
      } else {
        console.error("❌ Error in response:", data.error)
        setConversations([])
      }
    } catch (error) {
      console.error("💥 Complete error loading conversations:", error)
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
        await loadConversations() // Refresh conversations list

        // NUEVO: Crear notificación automática de nuevo mensaje
        if (data.message?.id) {
          await notifyNewMessage(data.message.id)
        }

        if (data.flagged) {
          window.toast({
            title:
              "Tu mensaje contiene información de contacto. Por seguridad, usa solo el chat interno de la plataforma.",
            type: "info",
            location: "bottom-center",
            dismissible: true,
            icon: true,
          })
        }
      } else {
        throw new Error(data.error || "Error desconocido al enviar mensaje")
      }
    } catch (error: any) {
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
      window.toast({
        title: "Error al enviar la propuesta. Inténtalo de nuevo.",
        type: "error",
        location: "bottom-center",
        dismissible: true,
        icon: true,
      })
      console.error("Error sending proposal:", error)
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
        },
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
          `,
          )
          .eq("id", proposal.project_id)
          .single()

        if (error) {
          window.toast({
            title: "Error al cargar los detalles del proyecto",
            type: "error",
            location: "bottom-center",
            dismissible: true,
            icon: true,
          })
          console.error("Error loading project details:", error)
          return
        }

        setProposalProjectDetails(projectDetails)
        setShowProposalDetails(true)
      }
    } catch (error) {
      window.toast({
        title: "Error al cargar los detalles del proyecto",
        type: "error",
        location: "bottom-center",
        dismissible: true,
        icon: true,
      })
      console.error("Error:", error)
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
          `,
          )
          .eq("id", project.id)
          .single()

        if (error) {
          window.toast({
            title: "Error al cargar los detalles del proyecto",
            type: "error",
            location: "bottom-center",
            dismissible: true,
            icon: true,
          })
          console.error("Error loading project details:", error)
          return
        }

        setSelectedProjectForDetails(projectDetails)
        setShowProjectDetailsModal(true)
      }
    } catch (error) {
      window.toast({
        title: "Error al cargar los detalles del proyecto",
        type: "error",
        location: "bottom-center",
        dismissible: true,
        icon: true,
      })
      console.error("Error:", error)
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
          `,
          )
          .eq("id", project.id)
          .single()

        if (error) {
          window.toast({
            title: "Error al cargar los detalles del proyecto",
            type: "error",
            location: "bottom-center",
            dismissible: true,
            icon: true,
          })
          console.error("Error loading project details:", error)
          return
        }

        setSelectedProjectForProgress(projectDetails)
        setShowProgressManagement(true)
      }
    } catch (error) {
      window.toast({
        title: "Error al cargar los detalles del proyecto",
        type: "error",
        location: "bottom-center",
        dismissible: true,
        icon: true,
      })
      console.error("Error:", error)
    }
  }

  // RESTAURADO: Función para manejar contacto con cliente
  const handleContactClient = async (clientId: string, clientName: string) => {
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
        },
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

  const handleActiveTab = (flag: string) => {
    setActiveTab(flag)
    setValue("last_tab", flag)
  }

  return (
    <ProtectedRoute requiredRole="freelancer">
      <Layout>
        <MainComponent>
          {/* Header - RESPONSIVE */}
          <div className="mb-6 rounded-lg bg-white p-4 shadow sm:mb-8 sm:p-6">
            <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
              <div className="flex items-center">
                <div className="bg-primary/10 mr-3 flex h-12 w-12 items-center justify-center overflow-hidden rounded-full sm:mr-4 sm:h-16 sm:w-16">
                  {user?.avatar_url ? (
                    <img
                      src={user.avatar_url}
                      alt={user.full_name}
                      className="h-full w-full rounded-full object-cover object-top"
                    />
                  ) : (
                    <i className="ri-user-line text-primary text-xl sm:text-2xl"></i>
                  )}
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">
                    ¡Hola, {user?.full_name}!
                  </h1>
                  <p className="text-sm text-gray-600 sm:text-base">Freelancer Dashboard</p>
                </div>
              </div>

              <div className="text-center sm:text-right">
                <div className="text-primary text-2xl font-bold sm:text-3xl">
                  {user?.rating || 0}★
                </div>
                <p className="text-xs text-gray-500 sm:text-sm">Rating</p>
              </div>
            </div>
          </div>

          {/* Stats Cards - RESPONSIVE */}
          <div className="mb-6 grid grid-cols-2 gap-3 sm:mb-8 sm:gap-6 lg:grid-cols-4">
            <div className="rounded-lg bg-white p-3 shadow sm:p-6">
              <div className="flex items-center">
                <div className="bg-primary/10 mr-2 flex h-8 w-8 items-center justify-center rounded-lg sm:mr-4 sm:h-12 sm:w-12">
                  <i className="ri-file-text-line text-primary text-sm sm:text-xl"></i>
                </div>
                <div>
                  <p className="text-lg font-bold text-gray-900 sm:text-2xl">{proposals.length}</p>
                  <p className="text-xs text-gray-600 sm:text-sm">Propuestas</p>
                </div>
              </div>
            </div>

            <div className="rounded-lg bg-white p-3 shadow sm:p-6">
              <div className="flex items-center">
                <div className="mr-2 flex h-8 w-8 items-center justify-center rounded-lg bg-green-100 sm:mr-4 sm:h-12 sm:w-12">
                  <i className="ri-check-line text-primary text-sm sm:text-xl"></i>
                </div>
                <div>
                  <p className="text-lg font-bold text-gray-900 sm:text-2xl">
                    {proposals.filter((p) => p.status === "accepted").length}
                  </p>
                  <p className="text-xs text-gray-600 sm:text-sm">Aceptadas</p>
                </div>
              </div>
            </div>

            <div className="rounded-lg bg-white p-3 shadow sm:p-6">
              <div className="flex items-center">
                <div className="mr-2 flex h-8 w-8 items-center justify-center rounded-lg bg-yellow-100 sm:mr-4 sm:h-12 sm:w-12">
                  <i className="ri-time-line text-sm text-yellow-600 sm:text-xl"></i>
                </div>
                <div>
                  <p className="text-lg font-bold text-gray-900 sm:text-2xl">
                    {proposals.filter((p) => p.status === "pending").length}
                  </p>
                  <p className="text-xs text-gray-600 sm:text-sm">Pendientes</p>
                </div>
              </div>
            </div>

            <div className="rounded-lg bg-white p-3 shadow sm:p-6">
              <div className="flex items-center">
                <div className="bg-primary/10 mr-2 flex h-8 w-8 items-center justify-center rounded-lg sm:mr-4 sm:h-12 sm:w-12">
                  <i className="ri-chat-3-line text-primary text-sm sm:text-xl"></i>
                </div>
                <div>
                  <p className="text-lg font-bold text-gray-900 sm:text-2xl">
                    {conversations.length}
                  </p>
                  <p className="text-xs text-gray-600 sm:text-sm">Mensajes</p>
                </div>
              </div>
            </div>
          </div>

          {/* NUEVO: Panel de Gamificación - Solo se muestra si hay datos */}
          {user?.id && (
            <div className="from-primary/10 border-primary/20 mb-6 rounded-xl border bg-linear-to-br to-cyan-50 p-4 sm:mb-8 sm:p-6">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center">
                  <div className="from-primary to-primary mr-4 flex h-12 w-12 items-center justify-center rounded-full bg-linear-to-r">
                    <i className="ri-trophy-line text-xl text-white"></i>
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
                <BadgeSystem userId={user.id} userType="freelancer" compact={true} />
              </div>

              <div className="rounded-lg border border-cyan-200 bg-white p-4">
                <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-3">
                  <div className="flex items-center">
                    <i className="ri-check-line text-primary mr-2"></i>
                    <span className="text-gray-700">Gana XP completando proyectos</span>
                  </div>
                  <div className="flex items-center">
                    <i className="ri-star-line mr-2 text-yellow-500"></i>
                    <span className="text-gray-700">Desbloquea badges por logros</span>
                  </div>
                  <div className="flex items-center">
                    <i className="ri-trophy-line text-primary mr-2"></i>
                    <span className="text-gray-700">Sube tu nivel profesional</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tabs - RESPONSIVE */}
          <div className="rounded-lg bg-white shadow">
            <div className="overflow-x-auto overflow-y-hidden border-b border-gray-200">
              <nav className="-mb-px flex min-w-max">
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    handleActiveTab("projects")
                  }}
                  className={`cursor-pointer border-b-2 px-3 py-3 text-xs font-medium whitespace-nowrap sm:px-6 sm:py-4 sm:text-sm ${
                    activeTab === "projects"
                      ? "border-primary text-primary"
                      : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
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
                  className={`cursor-pointer border-b-2 px-3 py-3 text-xs font-medium whitespace-nowrap sm:px-6 sm:py-4 sm:text-sm ${
                    activeTab === "my-projects"
                      ? "border-primary text-primary"
                      : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
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
                  className={`cursor-pointer border-b-2 px-3 py-3 text-xs font-medium whitespace-nowrap sm:px-6 sm:py-4 sm:text-sm ${
                    activeTab === "proposals"
                      ? "border-primary text-primary"
                      : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
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
                  className={`cursor-pointer border-b-2 px-3 py-3 text-xs font-medium whitespace-nowrap sm:px-6 sm:py-4 sm:text-sm ${
                    activeTab === "messages"
                      ? "border-primary text-primary"
                      : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
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
                  className={`relative cursor-pointer border-b-2 px-3 py-3 text-xs font-medium whitespace-nowrap sm:px-6 sm:py-4 sm:text-sm ${
                    activeTab === "reviews"
                      ? "border-primary text-primary"
                      : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                  }`}
                >
                  <i className="ri-star-line mr-1"></i>
                  Reseñas
                  {pendingReviewsCount > 0 && (
                    <span className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">
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
                  className={`cursor-pointer border-b-2 px-3 py-3 text-xs font-medium whitespace-nowrap sm:px-6 sm:py-4 sm:text-sm ${
                    activeTab === "achievements"
                      ? "border-primary text-primary"
                      : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
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
                  className={`cursor-pointer border-b-2 px-3 py-3 text-xs font-medium whitespace-nowrap sm:px-6 sm:py-4 sm:text-sm ${
                    activeTab === "user"
                      ? "border-primary text-primary"
                      : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                  }`}
                >
                  Mi Perfil
                </button>
                <button
                  onClick={() => handleActiveTab("payments")}
                  className={`flex cursor-pointer items-center rounded-lg px-3 py-2 text-xs font-medium whitespace-nowrap transition-colors sm:px-4 sm:py-3 sm:text-sm ${
                    activeTab === "payments"
                      ? "bg-primary/10 text-emerald-700"
                      : "hover:text-primary text-gray-600 hover:bg-emerald-50"
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
                  className={`cursor-pointer border-b-2 px-3 py-3 text-xs font-medium whitespace-nowrap sm:px-6 sm:py-4 sm:text-sm ${
                    activeTab === "analytics"
                      ? "border-primary text-primary"
                      : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
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
                  <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
                    <h3 className="text-lg font-semibold text-gray-900">Proyectos Disponibles</h3>
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <i className="ri-information-line"></i>
                      <span>Proyectos sin propuestas aceptadas</span>
                    </div>
                  </div>

                  {projects.length === 0 ? (
                    <div className="py-8 text-center sm:py-12">
                      <i className="ri-folder-open-line mb-4 text-4xl text-gray-300 sm:text-6xl"></i>
                      <h3 className="mb-2 text-lg font-medium text-gray-900 sm:text-xl">
                        No hay proyectos disponibles
                      </h3>
                      <p className="text-sm text-gray-500 sm:text-base">
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
                          startChat={() => startChat(project.id, project.client?.id!)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Mis Proyectos */}
              {activeTab === "my-projects" && (
                <div className="space-y-4 sm:space-y-6">
                  <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
                    <h3 className="text-lg font-semibold text-gray-900">Mis Proyectos Activos</h3>
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <i className="ri-briefcase-line"></i>
                      <span>{myProjects.length} proyectos en total</span>
                    </div>
                  </div>

                  {myProjects.length === 0 ? (
                    <div className="py-8 text-center sm:py-12">
                      <i className="ri-briefcase-line mb-4 text-4xl text-gray-300 sm:text-6xl"></i>
                      <h3 className="mb-2 text-lg font-medium text-gray-900 sm:text-xl">
                        No tienes proyectos asignados
                      </h3>
                      <p className="text-sm text-gray-500 sm:text-base">
                        Envía propuestas para conseguir tus primeros proyectos
                      </p>
                    </div>
                  ) : (
                    <div className="grid gap-4 sm:gap-6">
                      {myProjects.map((project) => (
                        <div
                          key={project.id}
                          className="rounded-lg border border-cyan-200 bg-linear-to-r from-cyan-50 to-cyan-100 p-4 sm:p-6"
                        >
                          <div className="flex flex-col space-y-4 lg:flex-row lg:items-start lg:justify-between lg:space-y-0">
                            <div className="flex-1">
                              <div className="mb-3 flex flex-col sm:flex-row sm:justify-between">
                                <h4 className="mb-2 text-lg font-semibold text-gray-900 sm:mb-0 sm:text-xl">
                                  {project.title}
                                </h4>
                                <div className="flex items-center space-x-4">
                                  {project._isFromTransaction ? (
                                    <div className="flex items-center space-x-2">
                                      <span
                                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
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
                                      <span className="text-primary text-lg font-bold sm:text-xl">
                                        ${project.budget}
                                      </span>
                                    </div>
                                  ) : (
                                    <div className="flex items-center space-x-2">
                                      <span
                                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
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
                                      <span className="text-primary text-lg font-bold sm:text-xl">
                                        $
                                        {project.budget ||
                                          `${project.budget_min}-${project.budget_max}`}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>

                              <p className="mb-4 text-sm leading-relaxed text-gray-600 sm:text-base">
                                {project.description && project.description.length > 200
                                  ? `${project.description.substring(0, 200)}...`
                                  : project.description || "Proyecto contratado directamente"}
                              </p>

                              <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
                                <div className="flex items-center space-x-4 text-sm text-gray-500">
                                  <div className="flex items-center">
                                    <i className="ri-user-line mr-1"></i>
                                    <span>{project.client?.full_name || "Cliente"}</span>
                                    {project.client?.rating && (
                                      <span className="ml-1 text-yellow-500">
                                        ★{project.client.rating}
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center">
                                    <i className="ri-calendar-line mr-1"></i>
                                    <span>
                                      {new Date(project.created_at).toLocaleDateString("es-ES")}
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

                            <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2 lg:ml-6 lg:flex-col lg:space-y-2 lg:space-x-0">
                              <button
                                onClick={() => viewProjectDetailsInMyProjects(project)}
                                className="cursor-pointer rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium whitespace-nowrap text-gray-700 transition-colors hover:bg-gray-200"
                              >
                                <i className="ri-eye-line mr-2"></i>
                                Ver Detalles
                              </button>
                              {!project._isFromTransaction && (
                                <>
                                  <button
                                    onClick={() => openProjectManagement(project)}
                                    className="bg-primary cursor-pointer rounded-lg px-4 py-2 text-sm font-medium whitespace-nowrap text-white transition-colors hover:bg-cyan-700"
                                  >
                                    <i className="ri-settings-3-line mr-2"></i>
                                    Gestionar
                                  </button>
                                  <button
                                    onClick={() => openProgressManagement(project)}
                                    className="cursor-pointer rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium whitespace-nowrap text-white transition-colors hover:bg-purple-700"
                                  >
                                    <i className="ri-bar-chart-line mr-2"></i>
                                    Gestionar Progreso
                                  </button>
                                </>
                              )}
                              {project.client?.id && (
                                <button
                                  onClick={() => startChat(project.id, project.client?.id!)}
                                  className="bg-primary cursor-pointer rounded-lg px-4 py-2 text-sm font-medium whitespace-nowrap text-white transition-colors hover:bg-cyan-700"
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
                  <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
                    <h3 className="text-lg font-semibold text-gray-900">Mis Propuestas</h3>
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2 text-sm">
                        <div className="h-3 w-3 rounded-full bg-green-500"></div>
                        <span>
                          Aceptadas: {proposals.filter((p) => p.status === "accepted").length}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm">
                        <div className="h-3 w-3 rounded-full bg-yellow-500"></div>
                        <span>
                          Pendientes: {proposals.filter((p) => p.status === "pending").length}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm">
                        <div className="h-3 w-3 rounded-full bg-red-500"></div>
                        <span>
                          Rechazadas: {proposals.filter((p) => p.status === "rejected").length}
                        </span>
                      </div>
                    </div>
                  </div>

                  {proposals.length === 0 ? (
                    <div className="py-8 text-center sm:py-12">
                      <i className="ri-file-text-line mb-4 text-4xl text-gray-300 sm:text-6xl"></i>
                      <h3 className="mb-2 text-lg font-medium text-gray-900 sm:text-xl">
                        No has enviado propuestas
                      </h3>
                      <p className="text-sm text-gray-500 sm:text-base">
                        Explora los proyectos disponibles y envía tu primera propuesta
                      </p>
                    </div>
                  ) : (
                    <div className="grid gap-4 sm:gap-6">
                      {proposals.map((proposal) => (
                        <div
                          key={proposal.id}
                          className={`rounded-lg border-2 p-4 sm:p-6 ${
                            proposal.status === "accepted"
                              ? "border-green-200 bg-green-50"
                              : proposal.status === "pending"
                                ? "border-yellow-200 bg-yellow-50"
                                : "border-red-200 bg-red-50"
                          }`}
                        >
                          <div className="flex flex-col space-y-4 lg:flex-row lg:items-start lg:justify-between lg:space-y-0">
                            <div className="flex-1">
                              <div className="mb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between">
                                <h4 className="mb-2 text-lg font-semibold text-gray-900 sm:mb-0 sm:text-xl">
                                  {proposal.project?.title || "Proyecto"}
                                </h4>
                                <div className="flex items-center space-x-4">
                                  <span
                                    className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${
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
                                  <span className="text-primary text-lg font-bold sm:text-xl">
                                    ${proposal.proposed_budget}
                                  </span>
                                </div>
                              </div>

                              <p className="mb-4 text-sm leading-relaxed text-gray-600 sm:text-base">
                                {/*  */}
                                {proposal.message.length > 150
                                  ? `${proposal.message.substring(0, 150)}...`
                                  : proposal.message}
                              </p>

                              {/* NUEVO: Mostrar progreso si la propuesta está aceptada */}
                              {proposal.status === "accepted" &&
                                proposal.project?.progress_percentage !== undefined && (
                                  <div className="mb-3 flex items-center">
                                    <div className="mr-3 h-2 flex-1 rounded-full bg-gray-200">
                                      <div
                                        className="bg-primary h-2 rounded-full transition-all duration-500"
                                        style={{
                                          width: `${proposal.project.progress_percentage || 0}%`,
                                        }}
                                      ></div>
                                    </div>
                                    <span className="text-sm font-medium text-gray-600">
                                      {proposal.project.progress_percentage || 0}%
                                    </span>
                                  </div>
                                )}

                              <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
                                <div className="flex items-center space-x-4 text-sm text-gray-500">
                                  <div className="flex items-center">
                                    <i className="ri-user-line mr-1"></i>
                                    <span>{proposal.project?.client?.full_name || "Cliente"}</span>
                                  </div>
                                  <div className="flex items-center">
                                    <i className="ri-calendar-line mr-1"></i>
                                    <span>
                                      {new Date(proposal.created_at).toLocaleDateString("es-ES")}
                                    </span>
                                  </div>
                                  <div className="flex items-center">
                                    <i className="ri-time-line mr-1"></i>
                                    <span>{proposal.delivery_time} días</span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2 lg:ml-6 lg:flex-col lg:space-y-2 lg:space-x-0">
                              <button
                                onClick={() => viewProposalDetails(proposal)}
                                className="cursor-pointer rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium whitespace-nowrap text-gray-700 transition-colors hover:bg-gray-200"
                              >
                                <i className="ri-eye-line mr-2"></i>
                                Ver Detalles
                              </button>

                              {/* NUEVO: Botón Gestionar Progreso para propuestas aceptadas */}
                              {proposal.status === "accepted" && (
                                <button
                                  onClick={() => openProgressManagement(proposal.project)}
                                  className="bg-primary cursor-pointer rounded-lg px-4 py-2 text-sm font-medium whitespace-nowrap text-white transition-colors hover:bg-cyan-700"
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
                                      proposal.project.client?.full_name!,
                                    )
                                  }
                                  className="bg-primary cursor-pointer rounded-lg px-4 py-2 text-sm font-medium whitespace-nowrap text-white transition-colors hover:bg-cyan-700"
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
                  <div className="flex flex-col space-y-4 sm:items-center sm:justify-between sm:space-y-0">
                    <h3 className="text-lg font-semibold text-gray-900">Mensajes</h3>
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <i className="ri-chat-3-line"></i>
                      <span>{conversations.length} conversaciones</span>
                    </div>
                  </div>

                  {conversationsLoading ? (
                    <div className="py-8 text-center">
                      <div className="border-primary mx-auto h-8 w-8 animate-spin rounded-full border-b-2"></div>
                      <p className="mt-2 text-gray-500">Cargando conversaciones...</p>
                    </div>
                  ) : conversations.length === 0 ? (
                    <div className="py-8 text-center sm:py-12">
                      <i className="ri-chat-3-line sm:6xl mb-4 text-4xl text-gray-300"></i>
                      <h3 className="mb-2 text-lg font-medium text-gray-900 sm:text-xl">
                        No tienes mensajes
                      </h3>
                      <p className="text-sm text-gray-500 sm:text-base">
                        Las conversaciones con los clientes aparecerán aquí
                      </p>
                    </div>
                  ) : (
                    <div className="grid gap-4">
                      {conversations.map((conversation) => (
                        <div
                          key={conversation.id}
                          className="cursor-pointer rounded-lg border border-gray-200 bg-white p-4 transition-shadow hover:shadow-md"
                          onClick={() => openChat(conversation)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="bg-primary/10 flex h-10 w-10 items-center justify-center overflow-hidden rounded-full">
                                {conversation.client?.avatar_url ? (
                                  <img
                                    src={conversation.client.avatar_url}
                                    alt={conversation.client.full_name}
                                    className="h-full w-full object-cover object-top"
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
                                  <p className="mt-1 text-sm text-gray-600">
                                    {conversation.latest_message.message_text.length > 50
                                      ? `${conversation.latest_message.message_text.substring(0, 50)}...`
                                      : conversation.latest_message.message_text}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              {conversation.latest_message && (
                                <p className="text-xs text-gray-500">
                                  {new Date(
                                    conversation.latest_message.created_at,
                                  ).toLocaleDateString("es-ES")}
                                </p>
                              )}
                              <i className="ri-arrow-right-line mt-2 text-gray-400"></i>
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
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">Gestión de Reseñas</h3>
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <i className="ri-star-line"></i>
                      <span>Calificación promedio: {user?.rating || 0}★</span>
                    </div>
                  </div>

                  {/* Reseñas pendientes de escribir */}
                  <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-6">
                    <h4 className="mb-4 flex items-center text-lg font-semibold text-yellow-800">
                      <i className="ri-edit-line mr-2"></i>
                      Reseñas Pendientes de Escribir
                      {pendingReviewsCount > 0 && (
                        <span className="ml-2 flex h-6 w-6 items-center justify-center rounded-full bg-yellow-500 text-sm text-white">
                          {pendingReviewsCount}
                        </span>
                      )}
                    </h4>
                    <PendingReviews onReviewsUpdate={() => loadPendingReviewsCount()} />
                  </div>

                  {/* Reseñas recibidas */}
                  <div className="rounded-lg border border-gray-200 bg-white p-6">
                    <h4 className="mb-4 flex items-center text-lg font-semibold text-gray-900">
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
                  <h3 className="text-lg font-semibold text-gray-900">Mi Perfil</h3>

                  <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    {/* Información Personal */}
                    <div className="rounded-lg border border-gray-200 bg-white p-6">
                      <h4 className="mb-4 text-lg font-semibold text-gray-900">
                        Información Personal
                      </h4>
                      <div className="space-y-4">
                        <div className="flex items-center space-x-4">
                          <div className="bg-primary/10 flex h-16 w-16 items-center justify-center overflow-hidden rounded-full">
                            {user?.avatar_url ? (
                              <img
                                src={user.avatar_url}
                                alt={user.full_name}
                                className="h-full w-full rounded-full object-cover object-top"
                              />
                            ) : (
                              <i className="ri-user-line text-primary text-2xl"></i>
                            )}
                          </div>
                          <div>
                            <h5 className="font-semibold text-gray-900">{user?.full_name}</h5>
                            <p className="text-gray-600">{user?.email}</p>
                            <div className="mt-1 flex items-center">
                              <span className="text-yellow-500">★</span>
                              <span className="ml-1 text-sm text-gray-600">
                                {user?.rating || 0} calificación
                              </span>
                            </div>
                          </div>
                        </div>

                        <div>
                          <label className="mb-1 block text-sm font-medium text-gray-700">
                            Bio
                          </label>
                          <p className="text-gray-600">
                            {user?.bio || "No has agregado una biografía"}
                          </p>
                        </div>

                        <div>
                          <label className="mb-1 block text-sm font-medium text-gray-700">
                            Habilidades
                          </label>
                          <div className="flex flex-wrap gap-2">
                            {user?.skills ? (
                              user.skills.map((skill: string, index: number) => (
                                <span
                                  key={index}
                                  className="bg-primary/10 text-primary inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
                                >
                                  {skill}
                                </span>
                              ))
                            ) : (
                              <span className="text-sm text-gray-500">
                                No has agregado habilidades
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Estadísticas */}
                    <div className="rounded-lg border border-gray-200 bg-white p-6">
                      <h4 className="mb-4 text-lg font-semibold text-gray-900">Estadísticas</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="rounded-lg bg-emerald-50 p-4 text-center">
                          <div className="text-primary text-2xl font-bold">{myProjects.length}</div>
                          <div className="text-sm text-gray-600">Proyectos Activos</div>
                        </div>
                        <div className="rounded-lg bg-blue-50 p-4 text-center">
                          <div className="text-primary text-2xl font-bold">{proposals.length}</div>
                          <div className="text-sm text-gray-600">Propuestas Enviadas</div>
                        </div>
                        <div className="rounded-lg bg-yellow-50 p-4 text-center">
                          <div className="text-2xl font-bold text-yellow-600">
                            {proposals.filter((p) => p.status === "accepted").length}
                          </div>
                          <div className="text-sm text-gray-600">Propuestas Aceptadas</div>
                        </div>
                        <div className="rounded-lg bg-purple-50 p-4 text-center">
                          <div className="text-2xl font-bold text-purple-600">
                            {conversations.length}
                          </div>
                          <div className="text-sm text-gray-600">Conversaciones</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <ShareProfileTab />
                </div>
              )}

              {/* Ingresos */}
              {activeTab === "payments" && <PaymentsTab userType="freelancer" />}

              {/* Analytics Profesionales */}
              {activeTab === "analytics" && user?.id && (
                <AnalyticsDashboard userId={user.id} userType="freelancer" />
              )}

              {/* NUEVA PESTAÑA: Logros y Badges */}
              {activeTab === "achievements" && user?.id && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">🏆 Sistema de Logros</h3>
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
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-2 sm:p-4">
            <div className="max-h-[95vh] w-full max-w-full overflow-y-auto rounded-xl bg-white sm:max-h-[90vh] sm:max-w-6xl sm:rounded-2xl">
              <div className="p-4 sm:p-6">
                <div className="mb-4 flex items-start justify-between sm:mb-6">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900 sm:text-2xl">
                      Gestión de Progreso
                    </h2>
                    <h3 className="text-sm text-gray-600 sm:text-lg">
                      {selectedProjectForProgress.title}
                    </h3>
                    <div className="mt-2 flex items-center">
                      <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
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
                    className="cursor-pointer p-1 text-gray-400 hover:text-gray-600"
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
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-2 sm:p-4">
            <div className="max-h-[95vh] w-full max-w-full overflow-y-auto rounded-xl bg-white sm:max-h-[90vh] sm:max-w-4xl sm:rounded-2xl">
              <div className="p-4 sm:p-6">
                <div className="mb-4 flex items-start justify-between sm:mb-6">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900 sm:text-2xl">
                      {selectedProjectDetails.title}
                    </h2>
                    <div className="mt-2 flex items-center space-x-4">
                      <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                        <i className="ri-check-line mr-1"></i>
                        {selectedProjectDetails.status === "open"
                          ? "Abierto"
                          : selectedProjectDetails.status}
                      </span>
                      <span className="text-primary text-lg font-bold">
                        ${selectedProjectDetails.budget_min || selectedProjectDetails.budget || 0} -
                        ${selectedProjectDetails.budget_max || selectedProjectDetails.budget || 0}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setShowProjectDetails(false)
                      setSelectedProjectDetails(null)
                    }}
                    className="cursor-pointer p-1 text-gray-400 hover:text-gray-600"
                  >
                    <i className="ri-close-line text-xl sm:text-2xl"></i>
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Información del Cliente */}
                  <div className="rounded-lg bg-gray-50 p-4">
                    <h3 className="mb-3 text-lg font-semibold text-gray-900">
                      Información del Cliente
                    </h3>
                    <div className="flex items-center space-x-4">
                      <div className="bg-primary/10 flex h-12 w-12 items-center justify-center overflow-hidden rounded-full">
                        {selectedProjectDetails.client?.avatar_url ? (
                          <img
                            src={selectedProjectDetails.client.avatar_url}
                            alt={selectedProjectDetails.client.full_name}
                            className="h-full w-full object-cover object-top"
                          />
                        ) : (
                          <i className="ri-user-line text-primary text-xl"></i>
                        )}
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">
                          {selectedProjectDetails.client?.full_name}
                        </h4>
                        <p className="text-gray-600">{selectedProjectDetails.client?.email}</p>
                        {selectedProjectDetails.client?.rating && (
                          <div className="mt-1 flex items-center">
                            <span className="text-yellow-500">★</span>
                            <span className="ml-1 text-sm text-gray-600">
                              {selectedProjectDetails.client.rating} calificación
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Descripción del Proyecto */}
                  <div>
                    <h3 className="mb-3 text-lg font-semibold text-gray-900">
                      Descripción del Proyecto
                    </h3>
                    <p className="leading-relaxed text-gray-700">
                      {selectedProjectDetails.description}
                    </p>
                  </div>

                  {/* Habilidades Requeridas */}
                  {selectedProjectDetails.required_skills &&
                    selectedProjectDetails.required_skills.length > 0 && (
                      <div>
                        <h3 className="mb-3 text-lg font-semibold text-gray-900">
                          Habilidades Requeridas
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {selectedProjectDetails.required_skills.map((skill, index) => (
                            <span
                              key={index}
                              className="bg-primary/10 inline-flex items-center rounded-full px-3 py-1 text-sm font-medium text-cyan-800"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                  {/* Detalles del Proyecto */}
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="rounded-lg bg-gray-50 p-4">
                      <h4 className="mb-2 font-semibold text-gray-900">Presupuesto</h4>
                      <p className="text-primary text-2xl font-bold">
                        ${selectedProjectDetails.budget_min || selectedProjectDetails.budget || 0} -
                        ${selectedProjectDetails.budget_max || selectedProjectDetails.budget || 0}
                      </p>
                    </div>
                    <div className="rounded-lg bg-gray-50 p-4">
                      <h4 className="mb-2 font-semibold text-gray-900">Tipo de Proyecto</h4>
                      <p className="text-gray-700">
                        {selectedProjectDetails.project_type || "No especificado"}
                      </p>
                    </div>
                    {selectedProjectDetails.deadline && (
                      <div className="rounded-lg bg-gray-50 p-4">
                        <h4 className="mb-2 font-semibold text-gray-900">Fecha Límite</h4>
                        <p className="text-gray-700">
                          {new Date(selectedProjectDetails.deadline).toLocaleDateString("es-ES")}
                        </p>
                      </div>
                    )}
                    <div className="rounded-lg bg-gray-50 p-4">
                      <h4 className="mb-2 font-semibold text-gray-900">Publicado</h4>
                      <p className="text-gray-700">
                        {new Date(selectedProjectDetails.created_at).toLocaleDateString("es-ES")}
                      </p>
                    </div>
                  </div>

                  {/* Botones de Acción */}
                  <div className="flex flex-col space-y-2 border-t pt-4 sm:flex-row sm:space-y-0 sm:space-x-4">
                    {!proposals.find((p) => p.project.id === selectedProjectDetails.id) &&
                      proposals &&
                      selectedProjectDetails && (
                        <button
                          onClick={() => {
                            setShowProjectDetails(false)
                            sendProposal(selectedProjectDetails.id)
                          }}
                          className="bg-primary flex-1 cursor-pointer rounded-lg px-6 py-3 font-medium text-white transition-colors hover:bg-cyan-700"
                        >
                          <i className="ri-send-plane-line mr-2"></i>
                          Enviar Propuesta
                        </button>
                      )}
                    {selectedProjectDetails.client?.id && (
                      <button
                        onClick={() => {
                          setShowProjectDetails(false)
                          startChat(selectedProjectDetails.id, selectedProjectDetails.client!.id)
                        }}
                        className="bg-primary flex-1 cursor-pointer rounded-lg px-6 py-3 font-medium text-white transition-colors hover:bg-cyan-700"
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
        {showProposalDetails && selectedProposalForDetails && proposalProjectDetails && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-2 sm:p-4">
            <div className="max-h-[95vh] w-full max-w-full overflow-y-auto rounded-xl bg-white sm:max-h-[90vh] sm:max-w-4xl sm:rounded-2xl">
              <div className="p-4 sm:p-6">
                <div className="mb-4 flex items-start justify-between sm:mb-6">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900 sm:text-2xl">
                      Detalles de la Propuesta
                    </h2>
                    <h3 className="text-sm text-gray-600 sm:text-lg">
                      {proposalProjectDetails.title}
                    </h3>
                    <div className="mt-2 flex items-center space-x-4">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
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
                              : selectedProposalForDetails.status === "pending"
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
                      <span className="text-primary text-lg font-bold">
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
                    className="cursor-pointer p-1 text-gray-400 hover:text-gray-600"
                  >
                    <i className="ri-close-line text-xl sm:text-2xl"></i>
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Mi Propuesta */}
                  <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                    <h3 className="mb-3 text-lg font-semibold text-emerald-800">Mi Propuesta</h3>
                    <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
                      <div>
                        <h4 className="font-semibold text-emerald-700">Presupuesto Propuesto</h4>
                        <p className="text-primary text-2xl font-bold">
                          ${selectedProposalForDetails.proposed_budget}
                        </p>
                      </div>
                      <div>
                        <h4 className="font-semibold text-emerald-700">Tiempo de Entrega</h4>
                        <p className="text-primary text-xl font-semibold">
                          {selectedProposalForDetails.delivery_time} días
                        </p>
                      </div>
                      <div>
                        <h4 className="font-semibold text-emerald-700">Enviada</h4>
                        <p className="text-primary">
                          {new Date(selectedProposalForDetails.created_at).toLocaleDateString(
                            "es-ES",
                          )}
                        </p>
                      </div>
                    </div>
                    <div>
                      <h4 className="mb-2 font-semibold text-cyan-700">Carta de Presentación</h4>
                      <p className="leading-relaxed text-cyan-700">
                        {selectedProposalForDetails.message}
                      </p>
                    </div>
                  </div>

                  {/* Información del Proyecto */}
                  <div>
                    <h3 className="mb-3 text-lg font-semibold text-gray-900">
                      Información del Proyecto
                    </h3>
                    <p className="mb-4 leading-relaxed text-gray-700">
                      {proposalProjectDetails.description}
                    </p>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="rounded-lg bg-gray-50 p-4">
                        <h4 className="mb-2 font-semibold text-gray-900">
                          Presupuesto del Cliente
                        </h4>
                        <p className="text-xl font-bold text-gray-700">
                          ${proposalProjectDetails.budget_min} - $
                          {proposalProjectDetails.budget_max}
                        </p>
                      </div>
                      <div className="rounded-lg bg-gray-50 p-4">
                        <h4 className="mb-2 font-semibold text-gray-900">Tipo de Proyecto</h4>
                        <p className="text-gray-700">
                          {proposalProjectDetails.project_type || "No especificado"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Información del Cliente */}
                  <div className="rounded-lg bg-gray-50 p-4">
                    <h3 className="mb-3 text-lg font-semibold text-gray-900">Cliente</h3>
                    <div className="flex items-center space-x-4">
                      <div className="bg-primary/10 flex h-12 w-12 items-center justify-center overflow-hidden rounded-full">
                        {proposalProjectDetails.client?.avatar_url ? (
                          <img
                            src={proposalProjectDetails.client.avatar_url}
                            alt={proposalProjectDetails.client.full_name}
                            className="h-full w-full object-cover object-top"
                          />
                        ) : (
                          <i className="ri-user-line text-primary text-xl"></i>
                        )}
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">
                          {proposalProjectDetails.client?.full_name}
                        </h4>
                        <p className="text-gray-600">{proposalProjectDetails.client?.email}</p>
                        {proposalProjectDetails.client?.rating && (
                          <div className="mt-1 flex items-center">
                            <span className="text-yellow-500">★</span>
                            <span className="ml-1 text-sm text-gray-600">
                              {proposalProjectDetails.client.rating} calificación
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Botones de Acción */}
                  {selectedProposalForDetails.status === "accepted" && (
                    <div className="flex flex-col space-y-2 border-t pt-4 sm:flex-row sm:space-y-0 sm:space-x-4">
                      <button
                        onClick={() => {
                          setShowProposalDetails(false)
                          openProgressManagement(proposalProjectDetails)
                        }}
                        className="bg-primary flex-1 cursor-pointer rounded-lg px-6 py-3 font-medium text-white transition-colors hover:bg-cyan-700"
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
                              proposalProjectDetails.client.full_name,
                            )
                          }}
                          className="bg-primary flex-1 cursor-pointer rounded-lg px-6 py-3 font-medium text-white transition-colors hover:bg-cyan-700"
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
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-2 sm:p-4">
            <div className="max-h-[95vh] w-full max-w-full overflow-y-auto rounded-xl bg-white sm:max-h-[90vh] sm:max-w-4xl sm:rounded-2xl">
              <div className="p-4 sm:p-6">
                <div className="mb-4 flex items-start justify-between sm:mb-6">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900 sm:text-2xl">
                      {selectedProjectForDetails.title}
                    </h2>
                    <div className="mt-2 flex items-center space-x-4">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          selectedProjectForDetails._isFromTransaction
                            ? selectedProjectForDetails.payment_status === "paid"
                              ? "bg-green-100 text-green-800"
                              : "bg-yellow-100 text-yellow-800"
                            : "bg-primary/10 text-cyan-800"
                        }`}
                      >
                        <i
                          className={`mr-1 ${
                            selectedProjectForDetails._isFromTransaction
                              ? selectedProjectForDetails.payment_status === "paid"
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
                      <span className="text-primary text-lg font-bold">
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
                    className="cursor-pointer p-1 text-gray-400 hover:text-gray-600"
                  >
                    <i className="ri-close-line text-xl sm:text-2xl"></i>
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Información del Cliente */}
                  <div className="rounded-lg bg-gray-50 p-4">
                    <h3 className="mb-3 text-lg font-semibold text-gray-900">Cliente</h3>
                    <div className="flex items-center space-x-4">
                      <div className="bg-primary/10 flex h-12 w-12 items-center justify-center overflow-hidden rounded-full">
                        {selectedProjectForDetails.client?.avatar_url ? (
                          <img
                            src={selectedProjectForDetails.client.avatar_url}
                            alt={selectedProjectForDetails.client.full_name}
                            className="h-full w-full object-cover object-top"
                          />
                        ) : (
                          <i className="ri-user-line text-primary text-xl"></i>
                        )}
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">
                          {selectedProjectForDetails.client?.full_name}
                        </h4>
                        <p className="text-gray-600">{selectedProjectForDetails.client?.email}</p>
                        {selectedProjectForDetails.client?.rating && (
                          <div className="mt-1 flex items-center">
                            <span className="text-yellow-500">★</span>
                            <span className="ml-1 text-sm text-gray-600">
                              {selectedProjectForDetails.client.rating} calificación
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Descripción del Proyecto */}
                  <div>
                    <h3 className="mb-3 text-lg font-semibold text-gray-900">Descripción</h3>
                    <p className="leading-relaxed text-gray-700">
                      {selectedProjectForDetails.description ||
                        "Proyecto contratado directamente por el cliente"}
                    </p>
                  </div>

                  {/* Detalles del Proyecto */}
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="rounded-lg bg-gray-50 p-4">
                      <h4 className="mb-2 font-semibold text-gray-900">Valor del Proyecto</h4>
                      <p className="text-primary text-2xl font-bold">
                        $
                        {selectedProjectForDetails.budget ||
                          `${selectedProjectForDetails.budget_min}-${selectedProjectForDetails.budget_max}`}
                      </p>
                    </div>
                    <div className="rounded-lg bg-gray-50 p-4">
                      <h4 className="mb-2 font-semibold text-gray-900">Estado</h4>
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
                    <div className="rounded-lg bg-gray-50 p-4">
                      <h4 className="mb-2 font-semibold text-gray-900">Fecha de Inicio</h4>
                      <p className="text-gray-700">
                        {new Date(selectedProjectForDetails.created_at).toLocaleDateString("es-ES")}
                      </p>
                    </div>
                    {selectedProjectForDetails._isFromTransaction && (
                      <div className="rounded-lg bg-gray-50 p-4">
                        <h4 className="mb-2 font-semibold text-gray-900">Tipo</h4>
                        <p className="text-gray-700">Contratación Directa</p>
                      </div>
                    )}
                  </div>

                  {/* Botones de Acción */}
                  <div className="flex flex-col space-y-2 border-t pt-4 sm:flex-row sm:space-y-0 sm:space-x-4">
                    {!selectedProjectForDetails._isFromTransaction && (
                      <button
                        onClick={() => {
                          setShowProjectDetailsModal(false)
                          openProjectManagement(selectedProjectForDetails)
                        }}
                        className="bg-primary flex-1 cursor-pointer rounded-lg px-6 py-3 font-medium text-white transition-colors hover:bg-cyan-700"
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
                      className="bg-primary flex-1 cursor-pointer rounded-lg px-6 py-3 font-medium text-white transition-colors hover:bg-cyan-700"
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
                            selectedProjectForDetails.client!.id,
                          )
                        }}
                        className="flex-1 cursor-pointer rounded-lg bg-purple-600 px-6 py-3 font-medium text-white transition-colors hover:bg-purple-700"
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
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-2 sm:p-4">
            <div className="max-h-[95vh] w-full max-w-full overflow-y-auto rounded-xl bg-white sm:max-h-[90vh] sm:max-w-2xl sm:rounded-2xl">
              <div className="p-4 sm:p-6">
                <div className="mb-4 flex items-start justify-between sm:mb-6">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900 sm:text-2xl">
                      Enviar Propuesta
                    </h2>
                    <h3 className="text-sm text-gray-600 sm:text-lg">{selectedProject.title}</h3>
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
                    className="cursor-pointer p-1 text-gray-400 hover:text-gray-600"
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
                    <label className="mb-2 block text-sm font-medium text-gray-700">
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
                      className="focus:ring-primary focus:border-primary w-full rounded-lg border border-gray-300 px-4 py-3 focus:ring-2"
                      placeholder="Ej: 500"
                      required
                    />
                    <p className="mt-1 text-sm text-gray-500">
                      Presupuesto del cliente: ${selectedProject.budget_min} - $
                      {selectedProject.budget_max}
                    </p>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
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
                      className="focus:ring-primary focus:border-primary w-full rounded-lg border border-gray-300 px-4 py-3 focus:ring-2"
                      placeholder="Ej: 7"
                      required
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
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
                      className="focus:ring-primary focus:border-primary w-full rounded-lg border border-gray-300 px-4 py-3 focus:ring-2"
                      placeholder="Explica por qué eres el freelancer ideal para este proyecto..."
                      required
                    />
                  </div>

                  <div className="flex flex-col space-y-2 border-t pt-4 sm:flex-row sm:space-y-0 sm:space-x-4">
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
                      className="flex-1 cursor-pointer rounded-lg bg-gray-100 px-6 py-3 font-medium text-gray-700 transition-colors hover:bg-gray-200"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="bg-primary flex-1 cursor-pointer rounded-lg px-6 py-3 font-medium text-white transition-colors hover:bg-cyan-700"
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
            setSelectedConversation={(conversation) => setSelectedConversation(conversation)}
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
