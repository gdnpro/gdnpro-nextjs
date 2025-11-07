"use client"

import { useState, useEffect, useRef } from "react"
import { useAuth } from "@/contexts/AuthContext"
import PaymentsTab from "@/components/dashboard/PaymentsTab"
import { ShareProfileTab } from "@/components/dashboard/ShareProfileTab"
import { PendingReviews } from "@/components/dashboard/PendingReviews"
import { ReviewsDisplay } from "@/components/dashboard/ReviewsDisplay"
import BadgeSystem from "@/components/dashboard/BadgeSystem"
import AnalyticsDashboard from "@/components/dashboard/AnalyticsDashboard"
import { FreelancerProjectManagement } from "@/components/freelancers/FreelancerProjectManagement"
import { useNotifications } from "@/hooks/useNotifications"
import { useBadges } from "@/hooks/useBadges"
import { MainComponent } from "@/components/MainComponent"
import type { Project } from "@/interfaces/Project"
import type { Conversation } from "@/interfaces/Conversation"
import type { Transaction } from "@/interfaces/Transaction"
import { useSessionStorage } from "@/hooks/useSessionStorage"
import type { Proposal } from "@/interfaces/Proposal"
import type { ChatMessage } from "@/interfaces/ChatMessage"
import { ConversationModal } from "@/components/ConversationModal"
import { AvailableProjectArticle } from "@/components/AvailableProjectArticle"
import { supabaseBrowser } from "@/utils/supabase/client"

const supabase = supabaseBrowser()

export default function FreelancerDashboardUI() {
  const { profile: user, loading, refreshAuth } = useAuth()
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
  const [proposalProjectDetails, setProposalProjectDetails] = useState<Project | null>(null)

  // RESTAURADO: Estados para modal de detalles de proyecto en "Mis Proyectos"
  const [showProjectDetailsModal, setShowProjectDetailsModal] = useState(false)
  const [selectedProjectForDetails, setSelectedProjectForDetails] = useState<Project | null>(null)

  // NUEVO: Estados para modal de gestión de progreso
  const [showProgressManagement, setShowProgressManagement] = useState(false)
  const [selectedProjectForProgress, setSelectedProjectForProgress] = useState<Project | null>(null)

  // Estados para editar perfil
  const [showEditProfileModal, setShowEditProfileModal] = useState(false)
  const [editProfileForm, setEditProfileForm] = useState({
    full_name: "",
    bio: "",
    location: "",
    hourly_rate: "",
    experience_years: "",
    skills: [] as string[],
  })
  const [updatingProfile, setUpdatingProfile] = useState(false)
  const [skillInput, setSkillInput] = useState("")

  const { notifyProposal, notifyNewMessage } = useNotifications()
  const { checkAndUnlockBadges } = useBadges()

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

  useEffect(() => {
    if (!user && !loading) {
      refreshAuth()
    }
  }, [user, loading, refreshAuth])

  // Track modal state in ref for cleanup function
  const modalStateRef = useRef({
    showChat,
    selectedConversation,
    showProposalModal,
    selectedProject,
    showProjectDetails,
    selectedProjectDetails,
    showProjectDetailsModal,
    selectedProjectForDetails,
    showProjectManagement,
    selectedProjectForManagement,
    showEditProfileModal,
    showProposalDetails,
    selectedProposalForDetails,
    proposalProjectDetails,
    showProgressManagement,
    selectedProjectForProgress,
  })

  // Update ref whenever state changes
  useEffect(() => {
    modalStateRef.current = {
      showChat,
      selectedConversation,
      showProposalModal,
      selectedProject,
      showProjectDetails,
      selectedProjectDetails,
      showProjectDetailsModal,
      selectedProjectForDetails,
      showProjectManagement,
      selectedProjectForManagement,
      showEditProfileModal,
      showProposalDetails,
      selectedProposalForDetails,
      proposalProjectDetails,
      showProgressManagement,
      selectedProjectForProgress,
    }
  }, [
    showChat,
    selectedConversation,
    showProposalModal,
    selectedProject,
    showProjectDetails,
    selectedProjectDetails,
    showProjectDetailsModal,
    selectedProjectForDetails,
    showProjectManagement,
    selectedProjectForManagement,
    showEditProfileModal,
    showProposalDetails,
    selectedProposalForDetails,
    proposalProjectDetails,
    showProgressManagement,
    selectedProjectForProgress,
  ])

  useEffect(() => {
    const isAnyModalOpen =
      (showChat && selectedConversation !== null) ||
      (showProposalModal && selectedProject !== null) ||
      (showProjectDetails && selectedProjectDetails !== null) ||
      (showProjectDetailsModal && selectedProjectForDetails !== null) ||
      (showProjectManagement && selectedProjectForManagement !== null) ||
      showEditProfileModal ||
      (showProposalDetails &&
        selectedProposalForDetails !== null &&
        proposalProjectDetails !== null) ||
      (showProgressManagement && !!selectedProjectForProgress)

    if (isAnyModalOpen) {
      document.body.style.overflow = "hidden"
      document.body.style.overflowX = "hidden"
      document.body.style.overflowY = "hidden"
    } else {
      document.body.style.overflow = ""
      document.body.style.overflowX = ""
      document.body.style.overflowY = ""
    }

    return () => {
      const state = modalStateRef.current
      const stillOpen =
        (state.showChat && state.selectedConversation !== null) ||
        (state.showProposalModal && state.selectedProject !== null) ||
        (state.showProjectDetails && state.selectedProjectDetails !== null) ||
        (state.showProjectDetailsModal && state.selectedProjectForDetails !== null) ||
        (state.showProjectManagement && state.selectedProjectForManagement !== null) ||
        state.showEditProfileModal ||
        (state.showProposalDetails &&
          state.selectedProposalForDetails !== null &&
          state.proposalProjectDetails !== null) ||
        (state.showProgressManagement && !!state.selectedProjectForProgress)

      if (!stillOpen) {
        document.body.style.overflow = ""
        document.body.style.overflowX = ""
        document.body.style.overflowY = ""
      }
    }
  }, [
    showChat,
    selectedConversation,
    showProposalModal,
    selectedProject,
    showProjectDetails,
    selectedProjectDetails,
    showProjectDetailsModal,
    selectedProjectForDetails,
    showProjectManagement,
    selectedProjectForManagement,
    showEditProfileModal,
    showProposalDetails,
    selectedProposalForDetails,
    proposalProjectDetails,
    showProgressManagement,
    selectedProjectForProgress,
  ])

  const loadData = async () => {
    try {
      if (!user) return

      // FIXED: Load available projects excluding projects with accepted proposals
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
        .neq("proposals.status", "accepted") // Exclude projects with accepted proposals
        .order("created_at", { ascending: false })

      // Also load projects that have no proposals at all
      const { data: projectsWithoutProposals } = await supabase
        .from("projects")
        .select(
          `
          *,
          client:profiles!projects_client_id_fkey(id, full_name, rating, email)
        `,
        )
        .eq("status", "open")
        .is("freelancer_id", null)
        .order("created_at", { ascending: false })

      const { data: acceptedProposals } = await supabase
        .from("proposals")
        .select("project_id")
        .eq("status", "accepted")

      const acceptedProjectIds = acceptedProposals?.map((p: Proposal) => p.project_id) || []

      // Filter projects without proposals that do not have accepted proposals
      const filteredProjectsWithoutProposals =
        projectsWithoutProposals?.filter(
          (project: Project) => !acceptedProjectIds.includes(project.id),
        ) || []

      // Combine both sets of projects
      const allAvailableProjects = [...(projectsData || []), ...filteredProjectsWithoutProposals]

      // Remove duplicates by ID
      const uniqueProjects = allAvailableProjects.filter(
        (project, index, self) => index === self.findIndex((p) => p.id === project.id),
      )

      if (uniqueProjects) setProjects(uniqueProjects)

      // FIXED: Load MY projects - INCLUDING ALL projects with transactions
      if (user?.id) {
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

        // 2. Load ALL transactions (paid AND pending) where I am the freelancer
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
              // INCLUDE ALL transactions (paid AND pending) - admins will manage payment statuses
              const allTransactions = data.transactions || []

              // Load client information for all transactions (only if there are client IDs)
              const clientIds = allTransactions
                .map((t: Transaction) => t.client_id)
                .filter((id: string) => id)

              // Fetch all client profiles at once
              let clientsMap = new Map<
                string,
                { id: string; full_name: string; email: string; rating: number; avatar_url: string }
              >()
              if (clientIds.length > 0) {
                const { data: clientsData } = await supabase
                  .from("profiles")
                  .select("id, full_name, email, rating, avatar_url")
                  .in("id", clientIds)

                // Create a map for quick lookups
                clientsMap = new Map(
                  (clientsData || []).map(
                    (client: {
                      id: string
                      full_name: string
                      email: string
                      rating: number
                      avatar_url: string
                    }) => [client.id, client],
                  ),
                )
              }

              // Create "virtual projects" from ALL transactions to display in "My Projects"
              projectsFromTransactions = allTransactions.map((transaction: Transaction) => {
                // Get client information from the map
                const clientInfo = clientsMap.get(transaction.client_id) || {
                  id: transaction.client_id || "",
                  full_name: "Cliente",
                  email: "",
                  rating: 5.0,
                  avatar_url: "",
                }

                return {
                  id: `transaction-${transaction.id}`,
                  title: transaction.project_title || "Proyecto Contratado",
                  description:
                    transaction.project_description ||
                    "Proyecto contratado directamente por el cliente",
                  budget: Number(transaction.amount),
                  status: "in_progress", // Proyectos de transacciones siempre están en progreso
                  payment_status: transaction.status || "pending", // Usar el estado real de la transacción
                  created_at:
                    transaction.created_at || transaction.paid_at || new Date().toISOString(),
                  duration: "Según acuerdo con cliente",
                  requirements: "Proyecto contratado directamente - revisar detalles en chat",
                  // Información del cliente cargada correctamente
                  client: {
                    id: clientInfo.id,
                    full_name: clientInfo.full_name || "Cliente",
                    email: clientInfo.email || "",
                    rating: clientInfo.rating || 5.0,
                    avatar_url: clientInfo.avatar_url || "",
                  },
                  // Marcar como proyecto de transacción para diferenciar
                  _isFromTransaction: true,
                  _transactionId: transaction.id,
                  _stripeSessionId: transaction.stripe_session_id,
                  _clientId: transaction.client_id,
                }
              })
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

        // Check for badges after sending message
        if (user?.id) {
          await checkAndUnlockBadges(user.id, "freelancer")
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
        // Para proyectos de transacción, cargar información completa del cliente si no está disponible
        let projectWithClient = { ...project }

        // Si el cliente no tiene información completa, cargarla
        if (!project.client?.id || project.client?.full_name === "Cliente") {
          const clientId = (project as any)._clientId || project.client?.id

          if (clientId) {
            const { data: clientData, error: clientError } = await supabase
              .from("profiles")
              .select("id, full_name, email, rating, avatar_url")
              .eq("id", clientId)
              .single()

            if (!clientError && clientData) {
              projectWithClient = {
                ...project,
                client: {
                  id: clientData.id,
                  full_name: clientData.full_name || "Cliente",
                  email: clientData.email || "",
                  rating: clientData.rating || 5.0,
                  avatar_url: clientData.avatar_url || "",
                },
              }
            }
          }
        }

        setSelectedProjectForDetails(projectWithClient)
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
        // Para proyectos de transacción, cargar información completa del cliente si no está disponible
        let projectWithClient = { ...project }

        // Si el cliente no tiene información completa, cargarla
        if (!project.client?.id || project.client?.full_name === "Cliente") {
          const clientId = (project as any)._clientId || project.client?.id

          if (clientId) {
            const { data: clientData, error: clientError } = await supabase
              .from("profiles")
              .select("id, full_name, email, rating, avatar_url")
              .eq("id", clientId)
              .single()

            if (!clientError && clientData) {
              projectWithClient = {
                ...project,
                client: {
                  id: clientData.id,
                  full_name: clientData.full_name || "Cliente",
                  email: clientData.email || "",
                  rating: clientData.rating || 5.0,
                  avatar_url: clientData.avatar_url || "",
                },
              }
            }
          }
        }

        setSelectedProjectForProgress(projectWithClient)
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
  const handleContactClient = async (
    clientId: string,
    clientName: string,
    projectId?: string | null,
  ) => {
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
            userType: "freelancer",
          }),
        },
      )

      let existingConversation: Conversation | null = null
      if (findResponse.ok) {
        const findData = await findResponse.json()
        if (findData.success && findData.conversations) {
          // Find conversation with this client
          existingConversation =
            findData.conversations.find((conv: Conversation) => {
              return (
                conv.client_id === clientId && (projectId ? conv.project_id === projectId : true)
              )
            }) || null
        }
      }

      // If conversation exists, open it
      if (existingConversation) {
        await openChat(existingConversation)
        return
      }

      // Otherwise, create a new conversation
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
            freelancerId: user.id,
            clientId: clientId,
            projectId: projectId || null,
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

        // Use the conversation returned from the API
        const newConversation: Conversation = data.conversation

        await openChat(newConversation)
      } else {
        throw new Error(data.error || "Error al crear conversación")
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

  const handleActiveTab = (flag: string) => {
    setActiveTab(flag)
    setValue("last_tab", flag)
  }

  const openEditProfileModal = () => {
    if (user) {
      setEditProfileForm({
        full_name: user.full_name || "",
        bio: user.bio || "",
        location: user.location || "",
        hourly_rate: user.hourly_rate?.toString() || "",
        experience_years: user.experience_years?.toString() || "",
        skills: user.skills || [],
      })
      setShowEditProfileModal(true)
    }
  }

  const addSkillToProfile = (skill: string) => {
    if (skill && !editProfileForm.skills.includes(skill)) {
      setEditProfileForm({
        ...editProfileForm,
        skills: [...editProfileForm.skills, skill],
      })
      setSkillInput("")
    }
  }

  const removeSkillFromProfile = (skillToRemove: string) => {
    setEditProfileForm({
      ...editProfileForm,
      skills: editProfileForm.skills.filter((skill) => skill !== skillToRemove),
    })
  }

  const updateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || updatingProfile) return

    setUpdatingProfile(true)

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: editProfileForm.full_name.trim(),
          bio: editProfileForm.bio.trim(),
          location: editProfileForm.location.trim(),
          hourly_rate: editProfileForm.hourly_rate ? Number(editProfileForm.hourly_rate) : null,
          experience_years: editProfileForm.experience_years
            ? Number(editProfileForm.experience_years)
            : null,
          skills: editProfileForm.skills,
        })
        .eq("user_id", user.id)

      if (error) throw error

      setShowEditProfileModal(false)
      await refreshAuth()

      window.toast({
        title: "Perfil actualizado exitosamente",
        type: "success",
        location: "bottom-center",
        dismissible: true,
        icon: true,
      })
    } catch (error) {
      console.error("Error updating profile:", error)
      window.toast({
        title: "Error al actualizar el perfil",
        type: "error",
        location: "bottom-center",
        dismissible: true,
        icon: true,
      })
    } finally {
      setUpdatingProfile(false)
    }
  }

  const tabsOptions = [
    {
      value: "projects",
      label: "Proyectos Disponibles",
      count: projects.length,
    },
    {
      value: "my-projects",
      label: "Mis Proyectos",
      count: myProjects.length,
    },
    {
      value: "proposals",
      label: "Mis Propuestas",
      count: proposals.length,
    },
    {
      value: "messages",
      label: "Mensajes",
      count: conversations.length,
    },
    {
      value: "reviews",
      label: "Reseñas",
      count: pendingReviewsCount,
      hasBadge: true,
      hasIcon: true,
      icon: "ri-star-line",
      onSelect: (e?: React.MouseEvent<HTMLButtonElement>) => {
        if (e) {
          e.preventDefault()
          e.stopPropagation()
        }
        handleActiveTab("reviews")
        loadPendingReviewsCount()
      },
    },
    {
      value: "achievements",
      label: "Logros",
      hasIcon: true,
      icon: "ri-trophy-line",
    },
    {
      value: "user",
      label: "Mi Perfil",
    },
    {
      value: "payments",
      label: "Ingresos",
      hasIcon: true,
      icon: "ri-bank-card-line",
      specialStyle: true,
    },
    {
      value: "analytics",
      label: "Analytics",
      hasIcon: true,
      icon: "ri-bar-chart-line",
    },
  ]

  return (
    <>
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
          <div className="mb-6 rounded-xl border border-cyan-200 bg-gradient-to-br from-cyan-50 to-teal-50 p-4 sm:mb-8 sm:p-6">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center">
                <div className="mr-4 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r from-cyan-600 to-teal-600">
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
              {tabsOptions.map((tab, idx) => {
                const isActive = activeTab === tab.value
                const isReviews = tab.value === "reviews"
                const isPayments = tab.value === "payments"

                if (isPayments) {
                  return (
                    <button
                      key={idx}
                      onClick={() => handleActiveTab(tab.value)}
                      className={`flex cursor-pointer items-center rounded-lg px-3 py-2 text-xs font-medium whitespace-nowrap transition-colors sm:px-4 sm:py-3 sm:text-sm ${
                        isActive
                          ? "bg-primary/10 text-emerald-700"
                          : "hover:text-primary text-gray-600 hover:bg-emerald-50"
                      }`}
                    >
                      {tab.icon && <i className={`${tab.icon} mr-1 sm:mr-2`}></i>}
                      {tab.label}
                    </button>
                  )
                }

                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      if (tab.onSelect) {
                        tab.onSelect(e)
                      } else {
                        handleActiveTab(tab.value)
                      }
                    }}
                    className={`relative cursor-pointer border-b-2 px-3 py-3 text-xs font-medium whitespace-nowrap sm:px-6 sm:py-4 sm:text-sm ${
                      isActive
                        ? "border-primary text-primary"
                        : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                    }`}
                  >
                    {tab.icon && <i className={`${tab.icon} mr-1`}></i>}
                    {tab.label}
                    {tab.count !== undefined && tab.count > 0 && !isReviews && ` (${tab.count})`}
                    {isReviews && tab.count !== undefined && tab.count > 0 && (
                      <span className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">
                        {tab.count}
                      </span>
                    )}
                  </button>
                )
              })}
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
                        className="rounded-lg border border-cyan-200 bg-gradient-to-r from-cyan-50 to-teal-50 p-4 sm:p-6"
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
                                        project.payment_status === "paid" ||
                                        project.payment_status === "success"
                                          ? "bg-green-100 text-green-800"
                                          : "bg-yellow-100 text-yellow-800"
                                      }`}
                                    >
                                      <i
                                        className={`mr-1 ${
                                          project.payment_status === "paid" ||
                                          project.payment_status === "success"
                                            ? "ri-check-line"
                                            : "ri-time-line"
                                        }`}
                                      ></i>
                                      {project.payment_status === "paid" ||
                                      project.payment_status === "success"
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
                                onClick={() => {
                                  const clientId = project.client?.id
                                  const clientName = project.client?.full_name || "Cliente"
                                  // For transaction projects, pass null as projectId since there's no real project record
                                  // For regular projects, use the actual project ID
                                  const projectId = project._isFromTransaction ? null : project.id
                                  handleContactClient(clientId!, clientName, projectId)
                                }}
                                className="bg-primary cursor-pointer rounded-lg px-4 py-2 text-sm font-medium whitespace-nowrap text-white transition-colors hover:bg-cyan-700"
                              >
                                <i className="ri-chat-3-line mr-2"></i>
                                Contactar Cliente
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
                        <label className="mb-1 block text-sm font-medium text-gray-700">Bio</label>
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

                        <div className="mt-6 flex justify-end">
                          <button
                            onClick={openEditProfileModal}
                            className="bg-primary cursor-pointer rounded-md px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-cyan-700 sm:px-6 sm:text-base"
                          >
                            <i className="ri-edit-line mr-2"></i>
                            Editar Perfil
                          </button>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-black/60 via-black/50 to-black/60 p-2 backdrop-blur-md sm:p-4">
          <div className="max-h-[95vh] w-full max-w-full overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-black/5 sm:max-h-[90vh] sm:max-w-6xl">
            {/* Modern Header with Gradient */}
            <div className="relative overflow-hidden bg-gradient-to-r from-cyan-600 via-cyan-500 to-teal-500 p-6 text-white sm:p-8">
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIyIi8+PC9nPjwvZz48L3N2Zz4=')] opacity-20"></div>
              <div className="relative z-10 flex items-start justify-between">
                <div className="flex-1 pr-4">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 ring-1 ring-white/30 backdrop-blur-sm">
                      <i className="ri-bar-chart-line text-2xl"></i>
                    </div>
                    <div>
                      <h2 className="text-2xl leading-tight font-bold sm:text-3xl">
                        Gestión de Progreso
                      </h2>
                      <p className="mt-2 text-sm text-cyan-100">
                        {selectedProjectForProgress.title}
                      </p>
                      <div className="mt-3 flex items-center gap-4">
                        <span
                          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                            selectedProjectForProgress._isFromTransaction
                              ? selectedProjectForProgress.payment_status === "paid"
                                ? "bg-emerald-500/90 text-white"
                                : "bg-yellow-500/90 text-white"
                              : "bg-emerald-500/90 text-white"
                          }`}
                        >
                          <i className="ri-check-line mr-1"></i>
                          {selectedProjectForProgress._isFromTransaction
                            ? "Proyecto Contratado"
                            : "Propuesta Aceptada"}
                        </span>
                        <span className="text-sm text-cyan-100">
                          Cliente: {selectedProjectForProgress.client?.full_name}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowProgressManagement(false)
                    setSelectedProjectForProgress(null)
                  }}
                  className="group flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/20 backdrop-blur-sm transition-all hover:scale-110 hover:bg-white/20"
                  aria-label="Cerrar"
                >
                  <i className="ri-close-line text-xl transition-transform group-hover:rotate-90"></i>
                </button>
              </div>
            </div>
            <div className="overflow-y-auto p-4 sm:p-6" style={{ maxHeight: "calc(90vh - 200px)" }}>
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
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-black/60 via-black/50 to-black/60 p-2 backdrop-blur-md sm:p-4"
          onClick={() => {
            setShowProjectManagement(false)
            setSelectedProjectForManagement(null)
          }}
        >
          <div
            className="flex h-[95vh] w-full max-w-full flex-col overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-black/5 sm:h-[90vh] sm:max-w-6xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modern Header with Gradient */}
            <div className="relative shrink-0 overflow-hidden bg-gradient-to-r from-cyan-600 via-cyan-500 to-teal-500 p-6 text-white sm:p-8">
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIyIi8+PC9nPjwvZz48L3N2Zz4=')] opacity-20"></div>
              <div className="relative z-10 flex items-start justify-between">
                <div className="flex-1 pr-4">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 ring-1 ring-white/30 backdrop-blur-sm">
                      <i className="ri-settings-3-line text-2xl"></i>
                    </div>
                    <div>
                      <h2 className="text-2xl leading-tight font-bold sm:text-3xl">
                        Gestión de Proyecto
                      </h2>
                      <h3 className="mt-2 text-sm text-cyan-100 sm:text-base">
                        {selectedProjectForManagement.title}
                      </h3>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowProjectManagement(false)
                    setSelectedProjectForManagement(null)
                    loadData() // Recargar datos para actualizar el progreso
                  }}
                  className="group flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/20 backdrop-blur-sm transition-all hover:scale-110 hover:bg-white/20"
                  aria-label="Cerrar"
                >
                  <i className="ri-close-line text-xl transition-transform group-hover:rotate-90"></i>
                </button>
              </div>
            </div>
            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6 pb-24 sm:p-8">
              <FreelancerProjectManagement
                project={selectedProjectForManagement}
                onClose={() => {
                  setShowProjectManagement(false)
                  setSelectedProjectForManagement(null)
                  loadData() // Recargar datos para actualizar el progreso
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Modal de Detalles de Proyecto (Proyectos Disponibles) */}
      {showProjectDetails && selectedProjectDetails && (
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
                        {selectedProjectDetails.title}
                      </h2>
                      <div className="mt-3 flex items-center gap-4">
                        <span
                          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                            selectedProjectDetails.status === "open"
                              ? "bg-emerald-500/90 text-white"
                              : selectedProjectDetails.status === "in_progress"
                                ? "bg-blue-500/90 text-white"
                                : "bg-gray-500/90 text-white"
                          }`}
                        >
                          <i className="ri-check-line mr-1"></i>
                          {selectedProjectDetails.status === "open"
                            ? "Abierto"
                            : selectedProjectDetails.status === "in_progress"
                              ? "En Progreso"
                              : selectedProjectDetails.status}
                        </span>
                        <span className="text-lg font-bold text-white">
                          ${selectedProjectDetails.budget_min || selectedProjectDetails.budget || 0}{" "}
                          - $
                          {selectedProjectDetails.budget_max || selectedProjectDetails.budget || 0}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowProjectDetails(false)
                    setSelectedProjectDetails(null)
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
                      ${selectedProjectDetails.budget_min || selectedProjectDetails.budget || 0} - $
                      {selectedProjectDetails.budget_max || selectedProjectDetails.budget || 0}
                    </p>
                  </div>

                  {selectedProjectDetails.deadline && (
                    <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-50 to-pink-50 p-6 ring-1 ring-purple-100 transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-purple-500/10">
                      <div className="mb-3 flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/30">
                          <i className="ri-calendar-check-fill text-xl"></i>
                        </div>
                        <div className="text-sm font-medium text-purple-700">Fecha límite</div>
                      </div>
                      <p className="text-xl font-bold text-gray-900">
                        {new Date(selectedProjectDetails.deadline).toLocaleDateString("es-ES", {
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                      <p className="text-sm text-gray-600">
                        {new Date(selectedProjectDetails.deadline).toLocaleDateString("es-ES", {
                          year: "numeric",
                        })}
                      </p>
                    </div>
                  )}

                  {selectedProjectDetails.project_type && (
                    <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-orange-50 to-amber-50 p-6 ring-1 ring-orange-100 transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-orange-500/10">
                      <div className="mb-3 flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/30">
                          <i className="ri-folder-fill text-xl"></i>
                        </div>
                        <div className="text-sm font-medium text-orange-700">Tipo</div>
                      </div>
                      <p className="text-xl font-bold text-gray-900 capitalize">
                        {selectedProjectDetails.project_type}
                      </p>
                    </div>
                  )}
                </div>

                {/* Información del Cliente */}
                <div className="rounded-2xl border border-gray-200 bg-gradient-to-br from-gray-50 to-white p-6 shadow-sm">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-teal-500 text-white shadow-lg">
                      <i className="ri-user-3-line text-lg"></i>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">Información del Cliente</h3>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-cyan-100 to-teal-100 ring-2 ring-cyan-200">
                      {selectedProjectDetails.client?.avatar_url ? (
                        <img
                          src={selectedProjectDetails.client.avatar_url}
                          alt={selectedProjectDetails.client.full_name}
                          className="h-full w-full object-cover object-top"
                        />
                      ) : (
                        <i className="ri-user-line text-xl text-cyan-600"></i>
                      )}
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">
                        {selectedProjectDetails.client?.full_name}
                      </h4>
                      <p className="text-gray-600">{selectedProjectDetails.client?.email}</p>
                      {selectedProjectDetails.client?.rating && (
                        <div className="mt-1 flex items-center gap-1 text-sm text-cyan-600">
                          <i className="ri-star-fill text-yellow-300"></i>
                          <span className="font-medium">
                            {selectedProjectDetails.client.rating.toFixed(1)}
                          </span>
                          <span className="text-gray-500">· Cliente verificado</span>
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
                      {selectedProjectDetails.description}
                    </p>
                  </div>
                </div>

                {/* Habilidades Requeridas */}
                {selectedProjectDetails.required_skills &&
                  selectedProjectDetails.required_skills.length > 0 && (
                    <div>
                      <div className="mb-4 flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 text-white shadow-lg">
                          <i className="ri-tools-fill text-lg"></i>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900">Habilidades Requeridas</h3>
                      </div>
                      <div className="flex flex-wrap gap-3">
                        {selectedProjectDetails.required_skills.map((skill, index) => {
                          const skillName = typeof skill === "string" ? skill : skill || skill
                          return (
                            <span
                              key={index}
                              className="group relative overflow-hidden rounded-full bg-gradient-to-r from-cyan-500 to-teal-500 px-5 py-2.5 text-sm font-semibold whitespace-nowrap text-white shadow-md transition-all hover:scale-105 hover:shadow-lg hover:shadow-cyan-500/30"
                            >
                              <span className="relative z-10 flex items-center gap-2">
                                <i className="ri-checkbox-circle-line"></i>
                                <span>{skillName}</span>
                              </span>
                            </span>
                          )
                        })}
                      </div>
                    </div>
                  )}

                {/* Detalles Adicionales */}
                <div className="rounded-2xl border border-gray-200 bg-gradient-to-br from-gray-50 to-white p-6 shadow-sm">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500 to-pink-500 text-white shadow-lg">
                      <i className="ri-calendar-check-line text-lg"></i>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">Información Adicional</h3>
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <h4 className="mb-2 text-sm font-semibold text-gray-900">Publicado el</h4>
                      <p className="text-gray-700">
                        {new Date(selectedProjectDetails.created_at).toLocaleDateString("es-ES", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                    {selectedProjectDetails.deadline && (
                      <div>
                        <h4 className="mb-2 text-sm font-semibold text-gray-900">Fecha Límite</h4>
                        <p className="text-gray-700">
                          {new Date(selectedProjectDetails.deadline).toLocaleDateString("es-ES", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            {/* Botones de Acción */}
            <div className="flex shrink-0 flex-col gap-3 border-t border-gray-200 bg-gradient-to-b from-white to-gray-50 p-6 sm:flex-row sm:gap-4">
              {!proposals.find((p) => p.project?.id === selectedProjectDetails.id) &&
                proposals &&
                selectedProjectDetails && (
                  <button
                    onClick={() => {
                      setShowProjectDetails(false)
                      sendProposal(selectedProjectDetails.id)
                    }}
                    className="group flex flex-1 cursor-pointer items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 px-6 py-4 font-semibold text-white shadow-lg shadow-cyan-500/30 transition-all hover:-translate-y-0.5 hover:scale-[1.02] hover:shadow-xl hover:shadow-cyan-500/40"
                  >
                    <i className="ri-send-plane-fill text-xl transition-transform group-hover:translate-x-1"></i>
                    <span>Enviar Propuesta</span>
                  </button>
                )}
              {selectedProjectDetails.client?.id && (
                <button
                  onClick={() => {
                    setShowProjectDetails(false)
                    startChat(selectedProjectDetails.id, selectedProjectDetails.client!.id)
                  }}
                  className="group flex flex-1 cursor-pointer items-center justify-center gap-3 rounded-xl border-2 border-cyan-500 bg-white px-6 py-4 font-semibold text-cyan-600 transition-all hover:-translate-y-0.5 hover:bg-gradient-to-r hover:from-cyan-500 hover:to-teal-500 hover:text-white hover:shadow-lg hover:shadow-cyan-500/30"
                >
                  <i className="ri-chat-3-line text-xl transition-transform group-hover:scale-110"></i>
                  <span>Chat con Cliente</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* RESTAURADO: Modal de detalles de propuesta */}
      {showProposalDetails && selectedProposalForDetails && proposalProjectDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-black/60 via-black/50 to-black/60 p-2 backdrop-blur-md sm:p-4">
          <div className="flex h-[95vh] w-full max-w-full flex-col overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-black/5 sm:h-[90vh] sm:max-w-4xl">
            {/* Modern Header with Gradient */}
            <div className="relative shrink-0 overflow-hidden bg-gradient-to-r from-cyan-600 via-cyan-500 to-teal-500 p-6 text-white sm:p-8">
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIyIi8+PC9nPjwvZz48L3N2Zz4=')] opacity-20"></div>
              <div className="relative z-10 flex items-start justify-between">
                <div className="flex-1 pr-4">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 ring-1 ring-white/30 backdrop-blur-sm">
                      <i className="ri-file-list-3-line text-2xl"></i>
                    </div>
                    <div>
                      <h2 className="text-2xl leading-tight font-bold sm:text-3xl">
                        Detalles de la Propuesta
                      </h2>
                      <p className="mt-2 text-sm text-cyan-100">{proposalProjectDetails.title}</p>
                      <div className="mt-3 flex items-center gap-4">
                        <span
                          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                            selectedProposalForDetails.status === "accepted"
                              ? "bg-emerald-500/90 text-white"
                              : selectedProposalForDetails.status === "pending"
                                ? "bg-yellow-500/90 text-white"
                                : "bg-red-500/90 text-white"
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
                        <span className="text-lg font-bold text-white">
                          ${selectedProposalForDetails.proposed_budget}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowProposalDetails(false)
                    setSelectedProposalForDetails(null)
                    setProposalProjectDetails(null)
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
                {/* Mi Propuesta */}
                <div className="rounded-2xl border border-cyan-200 bg-gradient-to-br from-cyan-50 to-teal-50 p-6 shadow-sm">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-teal-500 text-white shadow-lg">
                      <i className="ri-file-list-3-line text-lg"></i>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">Mi Propuesta</h3>
                  </div>
                  <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div className="rounded-xl border border-cyan-100 bg-white p-4 shadow-sm">
                      <h4 className="mb-2 text-sm font-semibold text-cyan-700">
                        Presupuesto Propuesto
                      </h4>
                      <p className="text-2xl font-bold text-cyan-600">
                        ${selectedProposalForDetails.proposed_budget}
                      </p>
                    </div>
                    <div className="rounded-xl border border-cyan-100 bg-white p-4 shadow-sm">
                      <h4 className="mb-2 text-sm font-semibold text-cyan-700">
                        Tiempo de Entrega
                      </h4>
                      <p className="text-xl font-semibold text-cyan-600">
                        {selectedProposalForDetails.delivery_time} días
                      </p>
                    </div>
                    <div className="rounded-xl border border-cyan-100 bg-white p-4 shadow-sm">
                      <h4 className="mb-2 text-sm font-semibold text-cyan-700">Enviada</h4>
                      <p className="text-cyan-600">
                        {new Date(selectedProposalForDetails.created_at).toLocaleDateString(
                          "es-ES",
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="rounded-xl border border-cyan-100 bg-white p-4 shadow-sm">
                    <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-cyan-700">
                      <i className="ri-message-3-line"></i>
                      Carta de Presentación
                    </h4>
                    <p className="leading-relaxed text-gray-700">
                      {selectedProposalForDetails.message}
                    </p>
                  </div>
                </div>

                {/* Información del Proyecto */}
                <div>
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 text-white shadow-lg">
                      <i className="ri-briefcase-4-line text-lg"></i>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">Información del Proyecto</h3>
                  </div>
                  <div className="mb-6 rounded-2xl border border-gray-200 bg-gradient-to-br from-gray-50 to-white p-6 shadow-sm">
                    <p className="leading-relaxed text-gray-700">
                      {proposalProjectDetails.description}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="rounded-xl border border-gray-200 bg-gradient-to-br from-gray-50 to-white p-4 shadow-sm">
                      <h4 className="mb-2 text-sm font-semibold text-gray-900">
                        Presupuesto del Cliente
                      </h4>
                      <p className="text-xl font-bold text-cyan-600">
                        ${proposalProjectDetails.budget_min} - ${proposalProjectDetails.budget_max}
                      </p>
                    </div>
                    <div className="rounded-xl border border-gray-200 bg-gradient-to-br from-gray-50 to-white p-4 shadow-sm">
                      <h4 className="mb-2 text-sm font-semibold text-gray-900">Tipo de Proyecto</h4>
                      <p className="text-gray-700">
                        {proposalProjectDetails.project_type || "No especificado"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Información del Cliente */}
                <div className="rounded-2xl border border-gray-200 bg-gradient-to-br from-gray-50 to-white p-6 shadow-sm">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-teal-500 text-white shadow-lg">
                      <i className="ri-user-3-line text-lg"></i>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">Cliente</h3>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-cyan-100 to-teal-100 ring-2 ring-cyan-200">
                      {proposalProjectDetails.client?.avatar_url ? (
                        <img
                          src={proposalProjectDetails.client.avatar_url}
                          alt={proposalProjectDetails.client.full_name}
                          className="h-full w-full object-cover object-top"
                        />
                      ) : (
                        <i className="ri-user-line text-xl text-cyan-600"></i>
                      )}
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">
                        {proposalProjectDetails.client?.full_name}
                      </h4>
                      <p className="text-gray-600">{proposalProjectDetails.client?.email}</p>
                      {proposalProjectDetails.client?.rating && (
                        <div className="mt-1 flex items-center gap-1 text-sm text-cyan-600">
                          <i className="ri-star-fill text-yellow-300"></i>
                          <span className="font-medium">
                            {proposalProjectDetails.client.rating.toFixed(1)}
                          </span>
                          <span className="text-gray-500">· Cliente verificado</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* Botones de Acción */}
            {selectedProposalForDetails.status === "accepted" && (
              <div className="flex shrink-0 flex-col gap-3 border-t border-gray-200 bg-gradient-to-b from-white to-gray-50 p-6 sm:flex-row sm:gap-4">
                <button
                  onClick={() => {
                    setShowProposalDetails(false)
                    openProgressManagement(proposalProjectDetails)
                  }}
                  className="group flex flex-1 cursor-pointer items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 px-6 py-4 font-semibold text-white shadow-lg shadow-cyan-500/30 transition-all hover:-translate-y-0.5 hover:scale-[1.02] hover:shadow-xl hover:shadow-cyan-500/40"
                >
                  <i className="ri-bar-chart-line text-xl transition-transform group-hover:scale-110"></i>
                  <span>Gestionar Progreso</span>
                </button>
                {proposalProjectDetails.client?.id && (
                  <button
                    onClick={() => {
                      setShowProposalDetails(false)
                      const client = proposalProjectDetails.client
                      if (client) {
                        // For proposal projects, use the actual project ID from the proposal
                        const projectId =
                          selectedProposalForDetails?.project_id ||
                          proposalProjectDetails.id ||
                          null
                        handleContactClient(client.id, client.full_name, projectId)
                      }
                    }}
                    className="group flex flex-1 cursor-pointer items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 px-6 py-4 font-semibold text-white shadow-lg shadow-cyan-500/30 transition-all hover:-translate-y-0.5 hover:scale-[1.02] hover:shadow-xl hover:shadow-cyan-500/40"
                  >
                    <i className="ri-chat-3-line text-xl transition-transform group-hover:scale-110"></i>
                    <span>Contactar Cliente</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* RESTAURADO: Modal de detalles de proyecto en "Mis Proyectos" */}
      {showProjectDetailsModal && selectedProjectForDetails && (
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
                        {selectedProjectForDetails.title}
                      </h2>
                      <div className="mt-3 flex items-center gap-4">
                        <span
                          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                            selectedProjectForDetails._isFromTransaction
                              ? selectedProjectForDetails.payment_status === "paid"
                                ? "bg-green-500/90 text-white"
                                : "bg-yellow-500/90 text-white"
                              : selectedProjectForDetails.status === "in_progress"
                                ? "bg-blue-500/90 text-white"
                                : selectedProjectForDetails.status === "completed"
                                  ? "bg-emerald-500/90 text-white"
                                  : "bg-cyan-500/90 text-white"
                          }`}
                        >
                          <i
                            className={`mr-1 ${
                              selectedProjectForDetails._isFromTransaction
                                ? selectedProjectForDetails.payment_status === "paid"
                                  ? "ri-check-line"
                                  : "ri-time-line"
                                : selectedProjectForDetails.status === "in_progress"
                                  ? "ri-time-line"
                                  : selectedProjectForDetails.status === "completed"
                                    ? "ri-check-line"
                                    : "ri-briefcase-line"
                            }`}
                          ></i>
                          {selectedProjectForDetails._isFromTransaction
                            ? selectedProjectForDetails.payment_status === "paid"
                              ? "Pagado"
                              : "Pago Pendiente"
                            : selectedProjectForDetails.status === "in_progress"
                              ? "En Progreso"
                              : selectedProjectForDetails.status === "completed"
                                ? "Completado"
                                : "Mi Proyecto"}
                        </span>
                        <span className="text-lg font-bold text-white">
                          $
                          {selectedProjectForDetails.budget ||
                            `${selectedProjectForDetails.budget_min}-${selectedProjectForDetails.budget_max}`}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowProjectDetailsModal(false)
                    setSelectedProjectForDetails(null)
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
                      {selectedProjectForDetails.budget ||
                        `${selectedProjectForDetails.budget_min || 0}-${selectedProjectForDetails.budget_max || 0}`}
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
                      {selectedProjectForDetails._isFromTransaction
                        ? selectedProjectForDetails.payment_status === "paid"
                          ? "Pagado - En Progreso"
                          : "Pago Pendiente"
                        : selectedProjectForDetails.status === "in_progress"
                          ? "En Progreso"
                          : selectedProjectForDetails.status === "completed"
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
                      {new Date(selectedProjectForDetails.created_at).toLocaleDateString("es-ES", {
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                    <p className="text-sm text-gray-600">
                      {new Date(selectedProjectForDetails.created_at).toLocaleDateString("es-ES", {
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>

                {/* Información del Cliente */}
                <div className="rounded-2xl border border-gray-200 bg-gradient-to-br from-gray-50 to-white p-6 shadow-sm">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-teal-500 text-white shadow-lg">
                      <i className="ri-user-3-line text-lg"></i>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">Información del Cliente</h3>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-cyan-100 to-teal-100 ring-2 ring-cyan-200">
                      {selectedProjectForDetails.client?.avatar_url ? (
                        <img
                          src={selectedProjectForDetails.client.avatar_url}
                          alt={selectedProjectForDetails.client.full_name}
                          className="h-full w-full object-cover object-top"
                        />
                      ) : (
                        <i className="ri-user-line text-xl text-cyan-600"></i>
                      )}
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">
                        {selectedProjectForDetails.client?.full_name}
                      </h4>
                      <p className="text-gray-600">{selectedProjectForDetails.client?.email}</p>
                      {selectedProjectForDetails.client?.rating && (
                        <div className="mt-1 flex items-center gap-1 text-sm text-cyan-600">
                          <i className="ri-star-fill text-yellow-300"></i>
                          <span className="font-medium">
                            {selectedProjectForDetails.client.rating.toFixed(1)}
                          </span>
                          <span className="text-gray-500">· Cliente verificado</span>
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
                      {selectedProjectForDetails.description ||
                        "Proyecto contratado directamente por el cliente"}
                    </p>
                  </div>
                </div>

                {/* Detalles Adicionales */}
                {selectedProjectForDetails._isFromTransaction && (
                  <div className="rounded-2xl border border-gray-200 bg-gradient-to-br from-gray-50 to-white p-6 shadow-sm">
                    <div className="mb-4 flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500 to-pink-500 text-white shadow-lg">
                        <i className="ri-information-line text-lg"></i>
                      </div>
                      <h3 className="text-xl font-bold text-gray-900">Información Adicional</h3>
                    </div>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <h4 className="mb-2 text-sm font-semibold text-gray-900">Tipo</h4>
                        <p className="text-gray-700">Contratación Directa</p>
                      </div>
                      <div>
                        <h4 className="mb-2 text-sm font-semibold text-gray-900">Estado de Pago</h4>
                        <p className="text-gray-700">
                          {selectedProjectForDetails.payment_status === "paid" ||
                          selectedProjectForDetails.payment_status === "success"
                            ? "Pagado"
                            : "Pendiente"}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            {/* Botones de Acción */}
            <div className="flex shrink-0 flex-col gap-3 border-t border-gray-200 bg-gradient-to-b from-white to-gray-50 p-6 sm:flex-row sm:gap-4">
              {!selectedProjectForDetails._isFromTransaction && (
                <button
                  onClick={() => {
                    setShowProjectDetailsModal(false)
                    openProjectManagement(selectedProjectForDetails)
                  }}
                  className="group flex flex-1 cursor-pointer items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 px-6 py-4 font-semibold text-white shadow-lg shadow-cyan-500/30 transition-all hover:-translate-y-0.5 hover:scale-[1.02] hover:shadow-xl hover:shadow-cyan-500/40"
                >
                  <i className="ri-settings-3-line text-xl transition-transform group-hover:rotate-90"></i>
                  <span>Gestionar Proyecto</span>
                </button>
              )}
              <button
                onClick={() => {
                  setShowProjectDetailsModal(false)
                  openProgressManagement(selectedProjectForDetails)
                }}
                className="group flex flex-1 cursor-pointer items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 px-6 py-4 font-semibold text-white shadow-lg shadow-cyan-500/30 transition-all hover:-translate-y-0.5 hover:scale-[1.02] hover:shadow-xl hover:shadow-cyan-500/40"
              >
                <i className="ri-bar-chart-line text-xl transition-transform group-hover:scale-110"></i>
                <span>Gestionar Progreso</span>
              </button>
              {selectedProjectForDetails.client?.id && (
                <button
                  onClick={() => {
                    setShowProjectDetailsModal(false)
                    const clientId = selectedProjectForDetails.client!.id
                    const clientName = selectedProjectForDetails.client!.full_name || "Cliente"
                    // For transaction projects, pass null as projectId since there's no real project record
                    // For regular projects, use the actual project ID
                    const projectId = selectedProjectForDetails._isFromTransaction
                      ? null
                      : selectedProjectForDetails.id
                    handleContactClient(clientId, clientName, projectId)
                  }}
                  className="group flex flex-1 cursor-pointer items-center justify-center gap-3 rounded-xl border-2 border-cyan-500 bg-white px-6 py-4 font-semibold text-cyan-600 transition-all hover:-translate-y-0.5 hover:bg-gradient-to-r hover:from-cyan-500 hover:to-teal-500 hover:text-white hover:shadow-lg hover:shadow-cyan-500/30"
                >
                  <i className="ri-chat-3-line text-xl transition-transform group-hover:scale-110"></i>
                  <span>Contactar Cliente</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de Envío de Propuesta */}
      {showProposalModal && selectedProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-black/60 via-black/50 to-black/60 p-2 backdrop-blur-md sm:p-4">
          <div className="max-h-[95vh] w-full max-w-full overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-black/5 sm:max-h-[90vh] sm:max-w-2xl">
            {/* Modern Header with Gradient */}
            <div className="relative overflow-hidden bg-gradient-to-r from-cyan-600 via-cyan-500 to-teal-500 p-6 text-white sm:p-8">
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIyIi8+PC9nPjwvZz48L3N2Zz4=')] opacity-20"></div>
              <div className="relative z-10 flex items-start justify-between">
                <div className="flex-1 pr-4">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 ring-1 ring-white/30 backdrop-blur-sm">
                      <i className="ri-send-plane-line text-2xl"></i>
                    </div>
                    <div>
                      <h2 className="text-2xl leading-tight font-bold sm:text-3xl">
                        Enviar Propuesta
                      </h2>
                      <p className="mt-2 text-sm text-cyan-100">{selectedProject.title}</p>
                    </div>
                  </div>
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
                  className="group flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/20 backdrop-blur-sm transition-all hover:scale-110 hover:bg-white/20"
                  aria-label="Cerrar"
                >
                  <i className="ri-close-line text-xl transition-transform group-hover:rotate-90"></i>
                </button>
              </div>
            </div>
            <div className="overflow-y-auto p-4 sm:p-6" style={{ maxHeight: "calc(90vh - 200px)" }}>
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
                    className="w-full rounded-xl border border-gray-300 bg-gradient-to-br from-gray-50 to-white px-4 py-3 text-gray-900 shadow-sm transition-all focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
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
                    className="w-full rounded-xl border border-gray-300 bg-gradient-to-br from-gray-50 to-white px-4 py-3 text-gray-900 shadow-sm transition-all focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
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
                    className="w-full rounded-xl border border-gray-300 bg-gradient-to-br from-gray-50 to-white px-4 py-3 text-gray-900 shadow-sm transition-all focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                    placeholder="Explica por qué eres el freelancer ideal para este proyecto..."
                    required
                  />
                </div>

                <div className="sticky bottom-0 flex flex-col gap-3 border-t border-gray-200 bg-gradient-to-b from-white to-gray-50 pt-6 sm:flex-row sm:gap-4">
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
                    className="group flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-gray-300 bg-white px-6 py-3 font-semibold text-gray-700 transition-all hover:-translate-y-0.5 hover:border-gray-400 hover:bg-gray-50 hover:shadow-md"
                  >
                    <i className="ri-close-line"></i>
                    <span>Cancelar</span>
                  </button>
                  <button
                    type="submit"
                    className="group flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 px-6 py-3 font-semibold text-white shadow-lg shadow-cyan-500/30 transition-all hover:-translate-y-0.5 hover:scale-[1.02] hover:shadow-xl hover:shadow-cyan-500/40"
                  >
                    <i className="ri-send-plane-fill text-lg transition-transform group-hover:translate-x-1"></i>
                    <span>Enviar Propuesta</span>
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

      {/* Modal Editar Perfil */}
      {showEditProfileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-black/60 via-black/50 to-black/60 p-2 backdrop-blur-md sm:p-4">
          <div className="max-h-[95vh] w-full max-w-full overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-black/5 sm:max-w-2xl">
            {/* Modern Header with Gradient */}
            <div className="relative overflow-hidden bg-gradient-to-r from-cyan-600 via-cyan-500 to-teal-500 p-6 text-white sm:p-8">
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIyIi8+PC9nPjwvZz48L3N2Zz4=')] opacity-20"></div>
              <div className="relative z-10 flex items-start justify-between">
                <div className="flex-1 pr-4">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 ring-1 ring-white/30 backdrop-blur-sm">
                      <i className="ri-user-settings-line text-2xl"></i>
                    </div>
                    <div>
                      <h2 className="text-2xl leading-tight font-bold sm:text-3xl">
                        Editar Perfil
                      </h2>
                      <p className="mt-2 text-sm text-cyan-100">
                        Actualiza tu información personal
                      </p>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setShowEditProfileModal(false)}
                  className="group flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/20 backdrop-blur-sm transition-all hover:scale-110 hover:bg-white/20"
                  aria-label="Cerrar"
                >
                  <i className="ri-close-line text-xl transition-transform group-hover:rotate-90"></i>
                </button>
              </div>
            </div>
            <div className="overflow-y-auto p-4 sm:p-6" style={{ maxHeight: "calc(95vh - 200px)" }}>
              <form onSubmit={updateProfile} className="space-y-4 sm:space-y-6">
                <div>
                  <label className="mb-2 block text-xs font-medium text-gray-700 sm:text-sm">
                    Nombre Completo
                  </label>
                  <input
                    type="text"
                    required
                    value={editProfileForm.full_name}
                    onChange={(e) =>
                      setEditProfileForm({ ...editProfileForm, full_name: e.target.value })
                    }
                    className="w-full rounded-xl border border-gray-300 bg-gradient-to-br from-gray-50 to-white px-3 py-2 text-sm text-gray-900 shadow-sm transition-all focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 focus:outline-none sm:text-base"
                    placeholder="Tu nombre completo"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-medium text-gray-700 sm:text-sm">
                    Ubicación
                  </label>
                  <input
                    type="text"
                    value={editProfileForm.location}
                    onChange={(e) =>
                      setEditProfileForm({ ...editProfileForm, location: e.target.value })
                    }
                    className="w-full rounded-xl border border-gray-300 bg-gradient-to-br from-gray-50 to-white px-3 py-2 text-sm text-gray-900 shadow-sm transition-all focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 focus:outline-none sm:text-base"
                    placeholder="Ej: Ciudad, País"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-medium text-gray-700 sm:text-sm">
                    Biografía
                  </label>
                  <textarea
                    rows={4}
                    value={editProfileForm.bio}
                    onChange={(e) =>
                      setEditProfileForm({ ...editProfileForm, bio: e.target.value })
                    }
                    className="w-full rounded-xl border border-gray-300 bg-gradient-to-br from-gray-50 to-white px-3 py-2 text-sm text-gray-900 shadow-sm transition-all focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 focus:outline-none sm:text-base"
                    placeholder="Describe tu perfil profesional..."
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-xs font-medium text-gray-700 sm:text-sm">
                      Tarifa por Hora (USD)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={editProfileForm.hourly_rate}
                      onChange={(e) =>
                        setEditProfileForm({ ...editProfileForm, hourly_rate: e.target.value })
                      }
                      className="w-full rounded-xl border border-gray-300 bg-gradient-to-br from-gray-50 to-white px-3 py-2 text-sm text-gray-900 shadow-sm transition-all focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 focus:outline-none sm:text-base"
                      placeholder="Ej: 25.00"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-xs font-medium text-gray-700 sm:text-sm">
                      Años de Experiencia
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={editProfileForm.experience_years}
                      onChange={(e) =>
                        setEditProfileForm({ ...editProfileForm, experience_years: e.target.value })
                      }
                      className="w-full rounded-xl border border-gray-300 bg-gradient-to-br from-gray-50 to-white px-3 py-2 text-sm text-gray-900 shadow-sm transition-all focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 focus:outline-none sm:text-base"
                      placeholder="Ej: 5"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-xs font-medium text-gray-700 sm:text-sm">
                    Habilidades
                  </label>
                  <div className="mb-3 flex flex-wrap gap-1 sm:gap-2">
                    {editProfileForm.skills.map((skill) => (
                      <span
                        key={skill}
                        className="flex items-center rounded-full bg-blue-100 px-2 py-1 text-xs text-cyan-800 sm:px-3 sm:text-sm"
                      >
                        {skill}
                        <button
                          type="button"
                          onClick={() => removeSkillFromProfile(skill)}
                          className="text-primary ml-1 cursor-pointer hover:text-cyan-800 sm:ml-2"
                        >
                          <i className="ri-close-line text-xs"></i>
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex">
                    <input
                      type="text"
                      value={skillInput}
                      onChange={(e) => setSkillInput(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault()
                          addSkillToProfile(skillInput.trim())
                        }
                      }}
                      className="focus:ring-primary focus:border-primary flex-1 rounded-l-md border border-gray-300 px-3 py-2 text-sm focus:outline-none sm:text-base"
                      placeholder="Añadir habilidad (presiona Enter)"
                    />
                    <button
                      type="button"
                      onClick={() => addSkillToProfile(skillInput.trim())}
                      className="bg-primary cursor-pointer rounded-r-md px-3 py-2 text-white transition-colors hover:bg-cyan-700 sm:px-4"
                    >
                      <i className="ri-add-line"></i>
                    </button>
                  </div>
                </div>

                <div className="sticky bottom-0 flex flex-col gap-3 border-t border-gray-200 bg-gradient-to-b from-white to-gray-50 pt-6 sm:flex-row sm:gap-4">
                  <button
                    type="button"
                    onClick={() => setShowEditProfileModal(false)}
                    disabled={updatingProfile}
                    className="group flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-gray-300 bg-white px-6 py-3 font-semibold text-gray-700 transition-all hover:-translate-y-0.5 hover:border-gray-400 hover:bg-gray-50 hover:shadow-md disabled:opacity-50 disabled:hover:translate-y-0"
                  >
                    <i className="ri-close-line"></i>
                    <span>Cancelar</span>
                  </button>
                  <button
                    type="submit"
                    disabled={updatingProfile}
                    className="group flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 px-6 py-3 font-semibold text-white shadow-lg shadow-cyan-500/30 transition-all hover:-translate-y-0.5 hover:scale-[1.02] hover:shadow-xl hover:shadow-cyan-500/40 disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:scale-100"
                  >
                    {updatingProfile ? "Guardando..." : "Guardar Cambios"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
