"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/AuthContext"
import PaymentsTab from "@/components/PaymentsTab"
import ProjectManagement from "@/components/ProjectManagement"
import { PendingReviews } from "@/components/dashboard/PendingReviews"
import { ReviewsDisplay } from "@/components/dashboard/ReviewsDisplay"
import { useNotifications } from "@/hooks/useNotifications"
import { MainComponent } from "@/components/MainComponent"
import type { Project } from "@/interfaces/Project"
import type { Conversation } from "@/interfaces/Conversation"
import type { Proposal } from "@/interfaces/Proposal"
import type { ChatMessage } from "@/interfaces/ChatMessage"
import Layout from "@/components/Layout"
import { useSessionStorage } from "@/hooks/useSessionStorage"
import { ConversationModal } from "@/components/ConversationModal"
import { ProjectArticle } from "@/components/ProjectArticle"
import { ProposalArticle } from "@/components/ProposalArticle"
import { supabaseBrowser } from "@/utils/supabase/client"
import ProtectedRoute from "@/components/ProtectedRoute"

const supabase = supabaseBrowser()

export default function ClientDashboardUI() {
  const { user } = useAuth() as { user: any }
  const [projects, setProjects] = useState<Project[]>([])
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeTab, setActiveTab] = useState<string>()
  const [showProposalsModal, setShowProposalsModal] = useState(false)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [projectProposals, setProjectProposals] = useState<Proposal[]>([])

  // Chat states
  const [showChat, setShowChat] = useState(false)
  const [selectedConversation, setSelectedConversation] =
    useState<Conversation | null>(null)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [chatLoading, setChatLoading] = useState(false)
  const [sendingMessage, setSendingMessage] = useState(false)
  const [showProjectManagement, setShowProjectManagement] = useState(false)
  const [selectedProjectForManagement, setSelectedProjectForManagement] =
    useState<Project | null>(null)
  const [pendingReviewsCount, setPendingReviewsCount] = useState(0)
  const [showNewProjectModal, setShowNewProjectModal] = useState(false)
  const [newProject, setNewProject] = useState({
    title: "",
    description: "",
    budget_min: "",
    budget_max: "",
    project_type: "fixed",
    required_skills: [] as string[],
    deadline: "",
  })
  const [skillInput, setSkillInput] = useState("")

  const { setValue, getValue } = useSessionStorage("last_tab")
  const { notifyProposal, notifyNewMessage, createReminderNotification } =
    useNotifications()

  const popularSkills = [
    "JavaScript",
    "React",
    "Node.js",
    "Python",
    "WordPress",
    "Figma",
    "Photoshop",
    "Marketing Digital",
    "SEO",
    "Copywriting",
    "Traducción",
    "Diseño Gráfico",
    "Video Editing",
    "Excel",
    "Contabilidad",
    "Legal",
  ]

  useEffect(() => {
    document.title = "Cliente Dashboard | GDN Pro"
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
      loadProjects()
      loadConversations()
      loadPendingReviewsCount()
    }
  }, [user])

  const loadProjects = async () => {
    try {
      // 1. Cargar proyectos creados tradicionalmente - FILTRAR POR CLIENT_ID
      const { data: projectsData } = await supabase
        .from("projects")
        .select(
          `
          *,
          proposals(
            id,
            proposed_budget,
            status,
            created_at,
            freelancer:profiles(full_name, rating, hourly_rate)
          )
        `
        )
        .eq("client_id", user.id) // ✅ FILTRO AGREGADO: Solo proyectos del cliente actual
        .order("created_at", { ascending: false })

      // 2. Obtener TODOS los proyectos de transacciones (pagados Y pendientes) para mostrar en "Mis Proyectos"
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
                  "Proyecto contratado directamente al freelancer",
                budget_min: parseFloat(transaction.amount),
                budget_max: parseFloat(transaction.amount),
                budget: parseFloat(transaction.amount), // Para mostrar precio único
                status:
                  transaction.status === "paid"
                    ? "in_progress"
                    : "pending_payment",
                payment_status: transaction.status, // 'paid' o 'pending'
                created_at: transaction.created_at || transaction.paid_at,
                project_type: "Contrato Directo",
                required_skills: [], // Proyectos pagados no tienen habilidades específicas
                deadline: null,
                proposals: [], // Proyectos pagados no tienen propuestas
                // Información del freelancer
                freelancer: {
                  full_name: transaction.freelancer?.full_name || "Freelancer",
                  rating: transaction.freelancer?.rating || 5.0,
                  email: transaction.freelancer?.email || "",
                  avatar_url: transaction.freelancer?.avatar_url || "",
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

      // 3. Combinar proyectos tradicionales + proyectos de transacciones
      const allProjects = [...(projectsData || []), ...projectsFromTransactions]

      // Eliminar duplicados por ID si existen
      const uniqueProjects = allProjects.filter(
        (project, index, self) =>
          index === self.findIndex((p) => p.id === project.id)
      )

      if (uniqueProjects) setProjects(uniqueProjects)
    } catch (error) {
      console.error("Error loading projects:", error)
    }
  }

  const loadConversations = async () => {
    if (!user) return

    try {
      const session = await supabase.auth.getSession()
      if (!session.data.session?.access_token) {
        console.warn("No hay sesión activa para cargar conversaciones")
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
            userType: "client",
          }),
        }
      )

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setConversations(data.conversations || [])
        } else {
          console.error("Error en respuesta del servidor:", data.error)
        }
      } else {
        const errorText = await response.text()
        console.error("Error en respuesta HTTP:", response.status, errorText)
      }
    } catch (error) {
      console.error("Error loading conversations:", error)
      // No mostrar el error completo al usuario, solo registrarlo
      setConversations([])
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
      console.error("Error enviando mensaje:", error)
      window.toast({
        title: "Error al enviar mensaje",
        type: "error",
        location: "bottom-center",
        dismissible: true,
        icon: true,
      })
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

  const addSkill = (skill: string) => {
    if (skill && !newProject.required_skills.includes(skill)) {
      setNewProject({
        ...newProject,
        required_skills: [...newProject.required_skills, skill],
      })
      setSkillInput("")
    }
  }

  const removeSkill = (skillToRemove: string) => {
    setNewProject({
      ...newProject,
      required_skills: newProject.required_skills.filter(
        (skill) => skill !== skillToRemove
      ),
    })
  }

  const createProject = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const { error } = await supabase
        .from("projects")
        .insert({
          client_id: user.id, // ✅ ASEGURAR QUE SE ASIGNE EL CLIENT_ID CORRECTO
          title: newProject.title,
          description: newProject.description,
          budget_min: parseInt(newProject.budget_min),
          budget_max: parseInt(newProject.budget_max),
          project_type: newProject.project_type,
          required_skills: newProject.required_skills,
          deadline: newProject.deadline || null,
          status: "open",
        })
        .select()
        .single()

      if (error) throw error

      // NUEVO: Crear recordatorio automático
      if (newProject.deadline) {
        const deadlineDate = new Date(newProject.deadline)
        const reminderDate = new Date(
          deadlineDate.getTime() - 24 * 60 * 60 * 1000
        ) // 1 día antes

        if (reminderDate > new Date()) {
          await createReminderNotification(
            "⏰ Recordatorio de Proyecto",
            `El proyecto "${newProject.title}" tiene fecha límite mañana.`,
            "/dashboard/client"
          )
        }
      }

      setShowNewProjectModal(false)
      setNewProject({
        title: "",
        description: "",
        budget_min: "",
        budget_max: "",
        project_type: "fixed",
        required_skills: [],
        deadline: "",
      })
      loadProjects()

      window.toast({
        title: "Proyecto creado satisfactoriamente",
        type: "success",
        location: "bottom-center",
        dismissible: true,
        icon: true,
      })
    } catch (error) {
      window.toast({
        title: "Error al crear proyecto",
        type: "error",
        location: "bottom-center",
        dismissible: true,
        icon: true,
      })

      console.error("Error creating project:", error)
    }
  }

  const viewProjectProposals = async (project: Project) => {
    setSelectedProject(project)

    try {
      const { data, error } = await supabase
        .from("proposals")
        .select(
          `
          *,
          freelancer:profiles(full_name, rating, hourly_rate, skills)
        `
        )
        .eq("project_id", project.id)
        .order("created_at", { ascending: false })

      if (error) throw error
      setProjectProposals(data || [])
      setShowProposalsModal(true)
    } catch (error) {
      console.error("Error loading proposals:", error)
    }
  }

  const acceptProposal = async (
    proposalId: string,
    freelancer_id: string,
    project_id: string
  ) => {
    try {
      const { error } = await supabase
        .from("proposals")
        .update({ status: "accepted" })
        .eq("id", proposalId)

      if (error) throw error

      const { error: projectError } = await supabase
        .from("projects")
        .update({ freelancer_id: freelancer_id })
        .eq("id", project_id)

      if (projectError) throw projectError

      await notifyProposal(proposalId, "proposal_accepted")

      window.toast({
        title: "¡Propuesta aceptada! El freelancer ha sido notificado",
        type: "success",
        location: "bottom-center",
        dismissible: true,
        icon: true,
      })

      // Refresh proposals
      if (selectedProject) {
        viewProjectProposals(selectedProject)
      }
      loadProjects()
    } catch (error) {
      window.toast({
        title: "Error al aceptar la propuesta",
        type: "error",
        location: "bottom-center",
        dismissible: true,
        icon: true,
      })
      console.error("Error accepting proposal:", error)
    }
  }

  const rejectProposal = async (proposalId: string) => {
    try {
      const { error } = await supabase
        .from("proposals")
        .update({ status: "rejected" })
        .eq("id", proposalId)

      if (error) throw error

      // NUEVO: Crear notificación automática
      await notifyProposal(proposalId, "proposal_rejected")

      // Refresh proposals
      if (selectedProject) {
        viewProjectProposals(selectedProject)
      }
      loadProjects()
    } catch (error) {
      window.toast({
        title: "Error al rechazar la propuesta",
        type: "error",
        location: "bottom-center",
        dismissible: true,
        icon: true,
      })
      console.error("Error rejecting proposal:", error)
    }
  }

  const openProjectManagement = (project: Project) => {
    setSelectedProjectForManagement(project)
    setShowProjectManagement(true)
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

  const handleActiveTab = (flag: string) => {
    setActiveTab(flag)
    setValue("last_tab", flag)
  }

  return (
    <ProtectedRoute requiredRole="client">
      <Layout>
        <MainComponent>
          {/* Header - RESPONSIVE */}
          <div className="bg-white rounded-lg shadow p-4 sm:p-6 mb-6 sm:mb-8">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
              <div className="flex items-center">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-blue-100 rounded-full flex items-center justify-center mr-3 sm:mr-4">
                  <i className="ri-briefcase-line text-xl sm:text-2xl text-primary"></i>
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                    ¡Hola, {user?.full_name}!
                  </h1>
                  <p className="text-sm sm:text-base text-gray-600">
                    Cliente Dashboard
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowNewProjectModal(true)}
                className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 bg-primary hover:bg-cyan-700 text-white font-medium text-sm sm:text-base rounded-lg transition-colors whitespace-nowrap cursor-pointer"
              >
                <i className="ri-add-line mr-2"></i>
                Nuevo Proyecto
              </button>
            </div>
          </div>

          {/* Stats Cards - RESPONSIVE */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
            <div className="bg-white rounded-lg shadow p-3 sm:p-6">
              <div className="flex items-center">
                <div className="w-8 h-8 sm:w-12 sm:h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-2 sm:mr-4">
                  <i className="ri-file-text-line text-sm sm:text-xl text-primary"></i>
                </div>
                <div>
                  <p className="text-lg sm:text-2xl font-bold text-gray-900">
                    {projects.length}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-600">Proyectos</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-3 sm:p-6">
              <div className="flex items-center">
                <div className="w-8 h-8 sm:w-12 sm:h-12 bg-green-100 rounded-lg flex items-center justify-center mr-2 sm:mr-4">
                  <i className="ri-check-line text-sm sm:text-xl text-green-600"></i>
                </div>
                <div>
                  <p className="text-lg sm:text-2xl font-bold text-gray-900">
                    {projects.filter((p) => p.status === "completed").length}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-600">
                    Completados
                  </p>
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
                    {projects.filter((p) => p.status === "open").length}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-600">Activos</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-3 sm:p-6">
              <div className="flex items-center">
                <div className="w-8 h-8 sm:w-12 sm:h-12 bg-purple-100 rounded-lg flex items-center justify-center mr-2 sm:mr-4">
                  <i className="ri-chat-3-line text-sm sm:text-xl text-purple-600"></i>
                </div>
                <div>
                  <p className="text-lg sm:text-2xl font-bold text-gray-900">
                    {conversations.length}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-600">
                    Conversaciones
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs - RESPONSIVE */}
          <div className="bg-white rounded-lg shadow">
            <div className="border-b border-gray-200 overflow-x-auto overflow-y-hidden">
              <nav className="-mb-px flex min-w-max">
                <button
                  onClick={() => handleActiveTab("projects")}
                  className={`py-3 sm:py-4 px-3 sm:px-6 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap ${
                    activeTab === "projects"
                      ? "border-cyan-500 text-primary"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  Mis Proyectos ({projects.length})
                </button>
                <button
                  onClick={() => handleActiveTab("messages")}
                  className={`py-3 sm:py-4 px-3 sm:px-6 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap ${
                    activeTab === "messages"
                      ? "border-cyan-500 text-primary"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  Mensajes ({conversations.length})
                </button>
                {/* NUEVA PESTAÑA: Reseñas */}
                <button
                  onClick={() => {
                    handleActiveTab("reviews")
                    loadPendingReviewsCount()
                  }}
                  className={`py-3 sm:py-4 px-3 sm:px-6 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap relative ${
                    activeTab === "reviews"
                      ? "border-primary text-primary"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <i className="ri-star-line mr-1"></i>
                  Reseñas
                  {pendingReviewsCount > 0 && (
                    <span className="absolute top-[2px] right-[2px] bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {pendingReviewsCount}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => handleActiveTab("user")}
                  className={`py-3 sm:py-4 px-3 sm:px-6 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap ${
                    activeTab === "user"
                      ? "border-blue-500 text-primary"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  Mi Perfil
                </button>
                <button
                  onClick={() => handleActiveTab("payments")}
                  className={`flex items-center px-3 sm:px-4 py-2 sm:py-3 rounded-lg font-medium transition-colors cursor-pointer whitespace-nowrap text-xs sm:text-sm ${
                    activeTab === "payments"
                      ? "bg-primary/10 text-cyan-700"
                      : "text-gray-600 hover:text-primary hover:bg-cyan-50"
                  }`}
                >
                  <i className="ri-bank-card-line mr-1 sm:mr-2"></i>
                  Pagos
                </button>
              </nav>
            </div>

            <div className="p-4 sm:p-6">
              {/* Mis Proyectos */}
              {activeTab === "projects" && (
                <div className="space-y-4 sm:space-y-6">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-3 sm:space-y-0">
                    <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                      Mis Proyectos
                    </h2>
                    <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                      {/* NUEVO: Botón de Matching Inteligente */}
                      <button
                        onClick={async () => {
                          try {
                            const session = await supabase.auth.getSession()
                            if (!session.data.session?.access_token) {
                              window.toast({
                                title:
                                  "Necesitas iniciar sesión para usar el matching inteligente",
                                type: "error",
                                location: "bottom-center",
                                dismissible: true,
                                icon: true,
                              })
                              return
                            }

                            const response = await fetch(
                              "https://kdmdhhhppizzlhvauofe.supabase.co/functions/v1/ai-matching-engine",
                              {
                                method: "POST",
                                headers: {
                                  "Content-Type": "application/json",
                                  Authorization: `Bearer ${session.data.session.access_token}`,
                                },
                                body: JSON.stringify({
                                  action: "find-freelancers",
                                  userType: "client",
                                }),
                              }
                            )

                            if (response.ok) {
                              const data = await response.json()
                              if (data.success) {
                                window.toast({
                                  title: `🎯 ¡Matching completado! Encontramos ${data.matches?.length || 0} freelancers perfectos para tus proyectos. Los mejores matches han sido enviados por email.`,
                                  type: "sueccess",
                                  location: "bottom-center",
                                  dismissible: true,
                                  icon: true,
                                })
                              } else {
                                window.toast({
                                  title: "Error en el matching",
                                  type: "error",
                                  location: "bottom-center",
                                  dismissible: true,
                                  icon: true,
                                })
                              }
                            } else {
                              window.toast({
                                title: "Error conectando con el motor de IA",
                                type: "error",
                                location: "bottom-center",
                                dismissible: true,
                                icon: true,
                              })
                            }
                          } catch (error) {
                            window.toast({
                              title: "Error ejecutando el matching inteligente",
                              type: "error",
                              location: "bottom-center",
                              dismissible: true,
                              icon: true,
                            })
                            console.error("Error en matching:", error)
                          }
                        }}
                        className="w-full sm:w-auto bg-linear-to-r from-purple-600 to-primary hover:from-purple-700 hover:to-cyan-700 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-medium text-sm sm:text-base transition-all  whitespace-nowrap cursor-pointer shadow-lg"
                      >
                        <i className="ri-magic-line mr-2"></i>
                        🤖 Matching Inteligente
                      </button>
                      <button
                        onClick={() => setShowNewProjectModal(true)}
                        className="w-full sm:w-auto bg-primary hover:bg-cyan-700 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-medium text-sm sm:text-base transition-colors whitespace-nowrap cursor-pointer"
                      >
                        <i className="ri-add-line mr-2"></i>
                        Crear Proyecto
                      </button>
                    </div>
                  </div>

                  {/* NUEVO: Panel de Matches Inteligentes */}
                  <div className="bg-linear-to-br from-purple-50 to-blue-50 border border-purple-200 rounded-xl p-4 sm:p-6 mb-6">
                    <div className="flex items-center mb-4">
                      <div className="w-12 h-12 bg-linear-to-r from-purple-600 to-primary rounded-full flex items-center justify-center mr-4">
                        <i className="ri-magic-line text-white text-xl"></i>
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">
                          🤖 Motor de Matching Inteligente
                        </h3>
                        <p className="text-sm text-purple-700">
                          Encuentra freelancers perfectos usando inteligencia
                          artificial
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="bg-white rounded-lg p-4 shadow-sm">
                        <div className="flex items-center text-primary mb-2">
                          <i className="ri-brain-line text-xl mr-2"></i>
                          <span className="font-semibold">Análisis IA</span>
                        </div>
                        <p className="text-xs text-gray-600">
                          Algoritmo avanzado que analiza compatibilidad de
                          habilidades, presupuesto y experiencia
                        </p>
                      </div>

                      <div className="bg-white rounded-lg p-4 shadow-sm">
                        <div className="flex items-center text-primary mb-2">
                          <i className="ri-target-line text-xl mr-2"></i>
                          <span className="font-semibold">
                            Matching Preciso
                          </span>
                        </div>
                        <p className="text-xs text-gray-600">
                          Encuentra los Top 10 freelancers más compatibles con
                          tus proyectos específicos
                        </p>
                      </div>

                      <div className="bg-white rounded-lg p-4 shadow-sm">
                        <div className="flex items-center text-purple-600 mb-2">
                          <i className="ri-award-line text-xl mr-2"></i>
                          <span className="font-semibold">
                            Predicción Éxito
                          </span>
                        </div>
                        <p className="text-xs text-gray-600">
                          Calcula la probabilidad de éxito de cada colaboración
                          potencial
                        </p>
                      </div>
                    </div>

                    <div className="bg-white rounded-lg p-4 border border-purple-200">
                      <h4 className="font-medium text-gray-900 mb-2">
                        ¿Cómo Funciona el Matching Inteligente?
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                        <div className="flex items-start">
                          <i className="ri-check-line text-primary mr-2 mt-0.5"></i>
                          <span className="text-gray-700">
                            Analiza tus proyectos activos y requisitos
                          </span>
                        </div>
                        <div className="flex items-start">
                          <i className="ri-check-line text-primary mr-2 mt-0.5"></i>
                          <span className="text-gray-700">
                            Evalúa freelancers por habilidades y experiencia
                          </span>
                        </div>
                        <div className="flex items-start">
                          <i className="ri-check-line text-primary mr-2 mt-0.5"></i>
                          <span className="text-gray-700">
                            Calcula compatibilidad de presupuesto
                          </span>
                        </div>
                        <div className="flex items-start">
                          <i className="ri-check-line text-primary mr-2 mt-0.5"></i>
                          <span className="text-gray-700">
                            Predice probabilidad de éxito del proyecto
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {projects.map((project, idx) => (
                    <ProjectArticle
                      key={idx}
                      project={project}
                      openProjectManagement={() =>
                        openProjectManagement(project)
                      }
                      viewProjectProposals={() => viewProjectProposals(project)}
                      loadProjects={() => loadProjects()}
                      handleActiveTab={(flag) => handleActiveTab(flag)}
                    />
                  ))}
                </div>
              )}

              {/* Mensajes */}
              {activeTab === "messages" && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 sm:mb-6 space-y-3 sm:space-y-0">
                    <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                      Mis Conversaciones
                    </h2>
                    <button
                      onClick={loadConversations}
                      className="w-full sm:w-auto px-3 sm:px-4 py-2 bg-primary hover:bg-cyan-700 text-white font-medium text-xs sm:text-sm rounded-md transition-colors whitespace-nowrap cursor-pointer"
                    >
                      <i className="ri-refresh-line mr-2"></i>
                      Actualizar
                    </button>
                  </div>

                  {conversations.length > 0 ? (
                    <div className="space-y-3 sm:space-y-4">
                      {conversations.map((conversation) => (
                        <div
                          key={conversation.id}
                          className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4 hover:shadow-md transition-shadow cursor-pointer"
                          onClick={() => openChat(conversation)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center flex-1 min-w-0">
                              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-full flex items-center justify-center mr-3 sm:mr-4 shrink-0">
                                <i className="ri-user-line text-lg sm:text-xl text-primary"></i>
                              </div>
                              <div className="min-w-0 flex-1">
                                <h3 className="font-semibold text-sm sm:text-base text-gray-900 truncate">
                                  {conversation.client.full_name}
                                </h3>
                                {conversation.project && (
                                  <p className="text-xs sm:text-sm text-gray-600 truncate">
                                    Proyecto: {conversation.project.title}
                                  </p>
                                )}
                                {conversation.latest_message && (
                                  <p className="text-xs sm:text-sm text-gray-500 truncate">
                                    {conversation.latest_message.sender_id ===
                                    user?.id
                                      ? "Tú: "
                                      : ""}
                                    {conversation.latest_message.message_text}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="text-right shrink-0 ml-2">
                              {conversation.latest_message && (
                                <p className="text-xs text-gray-400">
                                  {new Date(
                                    conversation.latest_message.created_at
                                  ).toLocaleDateString()}
                                </p>
                              )}
                              <div className="flex items-center justify-end mt-1">
                                <i className="ri-chat-3-line text-gray-400 mr-1"></i>
                                <span className="text-xs sm:text-sm text-primary font-medium">
                                  Ver chat
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 sm:py-12">
                      <i className="ri-chat-3-line text-3xl sm:4xl text-gray-400 mb-4"></i>
                      <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">
                        No tienes conversaciones aún
                      </h3>
                      <p className="text-sm sm:text-base text-gray-600 px-4">
                        Las conversaciones con freelancers aparecerán aquí
                        cuando contactes freelancers desde la página principal.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Perfil */}
              {activeTab === "user" && (
                <div className="space-y-4 sm:space-y-6">
                  <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-6">
                    <div className="w-20 h-20 sm:w-24 sm:h-24 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
                      <i className="ri-user-line text-2xl sm:text-3xl text-primary"></i>
                    </div>
                    <div className="text-center sm:text-left">
                      <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                        {user?.full_name}
                      </h2>
                      <p className="text-sm sm:text-base text-gray-600">
                        {user?.email}
                      </p>
                      <div className="flex items-center justify-center sm:justify-start mt-2">
                        <span className="text-sm sm:text-base text-primary font-semibold">
                          Cliente activo desde {new Date().getFullYear()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
                      Información de perfil
                    </h3>
                    <p className="text-sm sm:text-base text-gray-700">
                      {user?.bio || "No has añadido una descripción aún."}
                    </p>
                  </div>

                  <button className="w-full sm:w-auto px-4 sm:px-6 py-2 bg-primary hover:bg-cyan-700 text-white font-medium text-sm sm:text-base rounded-md transition-colors whitespace-nowrap cursor-pointer">
                    Editar Perfil
                  </button>
                </div>
              )}

              {/* Reseñas Tab */}
              {activeTab === "reviews" && (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-3 sm:space-y-0">
                    <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                      Sistema de Reseñas
                    </h2>
                    <button
                      onClick={loadPendingReviewsCount}
                      className="w-full sm:w-auto px-3 sm:px-4 py-2 bg-primary hover:bg-cyan-700 text-white font-medium text-xs sm:text-sm rounded-md transition-colors whitespace-nowrap cursor-pointer"
                    >
                      <i className="ri-refresh-line mr-2"></i>
                      Actualizar
                    </button>
                  </div>

                  {/* Notificación de proyectos pendientes */}
                  {pendingReviewsCount > 0 && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <div className="flex items-center">
                        <i className="ri-notification-line text-yellow-600 mr-3 text-xl"></i>
                        <div>
                          <h4 className="font-medium text-yellow-800">
                            ¡Tienes {pendingReviewsCount} proyecto
                            {pendingReviewsCount !== 1 ? "s" : ""} pendiente
                            {pendingReviewsCount !== 1 ? "s" : ""} de reseña!
                          </h4>
                          <p className="text-yellow-700 text-sm mt-1">
                            Ayuda a otros usuarios compartiendo tu experiencia
                            con los freelancers.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Proyectos Pendientes de Reseña */}
                  <div>
                    <PendingReviews
                      onReviewsUpdate={() => loadPendingReviewsCount()}
                    />
                  </div>

                  {/* Separador */}
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-300" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-2 bg-white text-gray-500">
                        Tus Reseñas Recibidas
                      </span>
                    </div>
                  </div>

                  {/* Reseñas Recibidas */}
                  {user && (
                    <div>
                      <ReviewsDisplay
                        userId={user.id}
                        userType="client"
                        showStats={true}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Payments Tab */}
              {activeTab === "payments" && <PaymentsTab userType="client" />}
            </div>
          </div>
        </MainComponent>

        {/* Chat Modal - RESPONSIVE */}
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

        {/* Proposals Modal - RESPONSIVE */}
        {showProposalsModal && selectedProject && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4">
            <div className="bg-white rounded-xl sm:rounded-2xl w-full max-w-full sm:max-w-4xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
              <div className="p-4 sm:p-6">
                <div className="flex justify-between items-start mb-4 sm:mb-6">
                  <div>
                    <h2 className="text-lg sm:text-2xl font-bold text-gray-900">
                      Propuestas Recibidas
                    </h2>
                    <h3 className="text-sm sm:text-lg text-gray-600">
                      {selectedProject.title}
                    </h3>
                  </div>
                  <button
                    onClick={() => setShowProposalsModal(false)}
                    className="text-gray-400 hover:text-gray-600 cursor-pointer p-1"
                  >
                    <i className="ri-close-line text-xl sm:text-2xl"></i>
                  </button>
                </div>

                {/* NUEVO: Mostrar mensaje inicial del cliente */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 sm:p-6 mb-6">
                  <div className="flex items-start">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-full flex items-center justify-center mr-3 sm:mr-4 shrink-0">
                      <i className="ri-message-3-line text-primary text-lg sm:text-xl"></i>
                    </div>
                    <div className="flex-1">
                      <div className="bg-white rounded-lg p-3 sm:p-4 border border-blue-200">
                        <div className="space-y-3">
                          <div>
                            <p className="text-xs sm:text-sm text-gray-600 font-medium mb-1">
                              Título del Proyecto:
                            </p>
                            <p className="text-sm sm:text-base text-gray-900 font-semibold">
                              {selectedProject.title}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs sm:text-sm text-gray-600 font-medium mb-1">
                              Descripción Completa:
                            </p>
                            <p className="text-sm sm:text-base text-gray-900 leading-relaxed">
                              {selectedProject.description}
                            </p>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                            <div>
                              <p className="text-xs sm:text-sm text-gray-600 font-medium mb-1">
                                Presupuesto:
                              </p>
                              <p className="text-sm sm:text-base text-primary font-bold">
                                ${selectedProject.budget_min} - $
                                {selectedProject.budget_max}
                              </p>
                            </div>

                            <div>
                              <p className="text-xs sm:text-sm text-gray-600 font-medium mb-1">
                                Tipo de Proyecto:
                              </p>
                              <p className="text-sm sm:text-base text-gray-900">
                                {selectedProject.project_type === "hourly"
                                  ? "Precio por hora"
                                  : "Precio fijo"}
                              </p>
                            </div>
                          </div>

                          {selectedProject.required_skills &&
                            selectedProject.required_skills.length > 0 && (
                              <div>
                                <p className="text-xs sm:text-sm text-gray-600 font-medium mb-2">
                                  Habilidades Requeridas:
                                </p>
                                <div className="flex flex-wrap gap-1 sm:gap-2">
                                  {selectedProject.required_skills.map(
                                    (skill, index) => (
                                      <span
                                        key={index}
                                        className="px-2 sm:px-3 py-1 bg-blue-100 text-cyan-800 rounded-full text-xs sm:text-sm font-medium"
                                      >
                                        {skill}
                                      </span>
                                    )
                                  )}
                                </div>
                              </div>
                            )}

                          {selectedProject.deadline && (
                            <div>
                              <p className="text-xs sm:text-sm text-gray-600 font-medium mb-1">
                                Fecha Límite:
                              </p>
                              <p className="text-sm sm:text-base text-gray-900">
                                {new Date(
                                  selectedProject.deadline
                                ).toLocaleDateString("es-ES", {
                                  year: "numeric",
                                  month: "long",
                                  day: "numeric",
                                })}
                              </p>
                            </div>
                          )}

                          <div className="border-t border-blue-200 pt-3">
                            <p className="text-xs text-primary">
                              <i className="ri-calendar-line mr-1"></i>
                              Proyecto publicado:{" "}
                              {new Date(
                                selectedProject.created_at
                              ).toLocaleDateString("es-ES", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 sm:space-y-6">
                  {projectProposals.map((proposal) => (
                    <ProposalArticle
                      key={proposal.id}
                      proposal={proposal}
                      rejectProposal={(id) => rejectProposal(id)}
                      acceptProposal={(id, freelancer_id, project_id) =>
                        acceptProposal(id, freelancer_id, project_id)
                      }
                    />
                  ))}

                  {projectProposals.length === 0 && (
                    <div className="text-center py-8 sm:py-12">
                      <i className="ri-mail-line text-3xl sm:text-4xl text-gray-400 mb-4"></i>
                      <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">
                        No hay propuestas aún
                      </h3>
                      <p className="text-sm sm:text-base text-gray-600">
                        Los freelancers comenzarán a enviar propuestas pronto.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal Nuevo Proyecto - RESPONSIVE */}
        {showNewProjectModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-2 sm:p-4 z-50">
            <div className="bg-white rounded-lg w-full max-w-full sm:max-w-2xl max-h-[95vh] overflow-y-auto">
              <div className="p-4 sm:p-6">
                <div className="flex justify-between items-center mb-4 sm:mb-6">
                  <h2 className="text-lg sm:text-2xl font-bold text-gray-900">
                    Crear Nuevo Proyecto
                  </h2>
                  <button
                    onClick={() => setShowNewProjectModal(false)}
                    className="text-gray-400 hover:text-gray-600 cursor-pointer p-1"
                  >
                    <i className="ri-close-line text-xl sm:text-2xl"></i>
                  </button>
                </div>

                <form
                  onSubmit={createProject}
                  className="space-y-4 sm:space-y-6"
                >
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                      Título del Proyecto
                    </label>
                    <input
                      type="text"
                      required
                      value={newProject.title}
                      onChange={(e) =>
                        setNewProject({ ...newProject, title: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary text-sm sm:text-base"
                      placeholder="Ej: Desarrollo de sitio web corporativo"
                    />
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                      Descripción
                    </label>
                    <textarea
                      required
                      rows={4}
                      value={newProject.description}
                      onChange={(e) =>
                        setNewProject({
                          ...newProject,
                          description: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary text-sm sm:text-base"
                      placeholder="Describe tu proyecto en detalle..."
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                        Presupuesto Mínimo (USD)
                      </label>
                      <input
                        type="number"
                        required
                        min="1"
                        value={newProject.budget_min}
                        onChange={(e) =>
                          setNewProject({
                            ...newProject,
                            budget_min: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary text-sm sm:text-base"
                      />
                    </div>

                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                        Presupuesto Máximo (USD)
                      </label>
                      <input
                        type="number"
                        required
                        min="1"
                        value={newProject.budget_max}
                        onChange={(e) =>
                          setNewProject({
                            ...newProject,
                            budget_max: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary text-sm sm:text-base"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                      Tipo de Proyecto
                    </label>
                    <select
                      value={newProject.project_type}
                      onChange={(e) =>
                        setNewProject({
                          ...newProject,
                          project_type: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary text-sm sm:text-base"
                    >
                      <option value="fixed">Precio Fijo</option>
                      <option value="hourly">Por Hora</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                      Habilidades Requeridas
                    </label>
                    <div className="flex flex-wrap gap-1 sm:gap-2 mb-3">
                      {newProject.required_skills.map((skill) => (
                        <span
                          key={skill}
                          className="bg-blue-100 text-cyan-800 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm flex items-center"
                        >
                          {skill}
                          <button
                            type="button"
                            onClick={() => removeSkill(skill)}
                            className="ml-1 sm:ml-2 text-primary hover:text-cyan-800 cursor-pointer"
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
                            addSkill(skillInput.trim())
                          }
                        }}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-primary focus:border-primary text-sm sm:text-base"
                        placeholder="Añadir habilidad (presiona Enter)"
                      />
                      <button
                        type="button"
                        onClick={() => addSkill(skillInput.trim())}
                        className="bg-primary hover:bg-cyan-700 text-white px-3 sm:px-4 py-2 rounded-r-md transition-colors cursor-pointer"
                      >
                        <i className="ri-add-line"></i>
                      </button>
                    </div>
                    <div className="mt-2">
                      <p className="text-xs sm:text-sm text-gray-600">
                        Habilidades populares:
                      </p>
                      <div className="flex flex-wrap gap-1 sm:gap-2 mt-1">
                        {popularSkills.map((skill) => (
                          <button
                            key={skill}
                            type="button"
                            onClick={() => addSkill(skill)}
                            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-1 rounded-full text-xs cursor-pointer"
                          >
                            {skill}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                      Fecha límite (opcional)
                    </label>
                    <input
                      type="date"
                      value={newProject.deadline}
                      onChange={(e) =>
                        setNewProject({
                          ...newProject,
                          deadline: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary text-sm sm:text-base"
                      min={new Date().toISOString().split("T")[0]}
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowNewProjectModal(false)}
                      className="w-full sm:w-auto px-4 sm:px-6 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-md font-medium text-sm sm:text-base transition-colors cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="w-full sm:w-auto px-4 sm:px-6 py-2 bg-primary hover:bg-cyan-700 text-white rounded-md font-medium text-sm sm:text-base transition-colors cursor-pointer"
                    >
                      Crear Proyecto
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Gestión de Proyectos */}
        {showProjectManagement && selectedProjectForManagement && (
          <ProjectManagement
            projectId={selectedProjectForManagement.id}
            userType="client"
            onClose={() => {
              setShowProjectManagement(false)
              setSelectedProjectForManagement(null)
              loadProjects() // Recargar proyectos para actualizar el progreso
            }}
          />
        )}
      </Layout>
    </ProtectedRoute>
  )
}
