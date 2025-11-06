"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/ui/AuthContext"
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
import type { Transaction } from "@/interfaces/Transaction"
import Layout from "@/components/Layout"
import { useSessionStorage } from "@/hooks/useSessionStorage"
import { ConversationModal } from "@/components/ConversationModal"
import { ProjectArticle } from "@/components/ProjectArticle"
import { ProposalArticle } from "@/components/ProposalArticle"
import { supabaseBrowser } from "@/utils/supabase/client"

const supabase = supabaseBrowser()

export default function ClientDashboardUI() {
  const { profile: user, loading, refreshAuth } = useAuth()
  const [projects, setProjects] = useState<Project[]>([])
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeTab, setActiveTab] = useState<string>()
  const [showProposalsModal, setShowProposalsModal] = useState(false)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [projectProposals, setProjectProposals] = useState<Proposal[]>([])

  // Chat states
  const [showChat, setShowChat] = useState(false)
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [chatLoading, setChatLoading] = useState(false)
  const [sendingMessage, setSendingMessage] = useState(false)
  const [showProjectManagement, setShowProjectManagement] = useState(false)
  const [selectedProjectForManagement, setSelectedProjectForManagement] = useState<Project | null>(
    null,
  )
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
  const { notifyProposal, notifyNewMessage, createReminderNotification } = useNotifications()

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
    if (!user && !loading) {
      refreshAuth()
    }
  }, [user, loading, refreshAuth])

  useEffect(() => {
    if (user) {
      loadProjects()
      loadConversations()
      loadPendingReviewsCount()
    }
  }, [user])

  const loadProjects = async () => {
    if (!user) return

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
        `,
        )
        .eq("client_id", user.id)
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
            },
          )

          if (response.ok) {
            const data = await response.json()
            // CORREGIDO: Incluir transacciones PAGADAS Y PENDIENTES
            const allTransactions = (data.transactions || []).filter(
              (t: Transaction) => t.status === "paid" || t.status === "pending",
            )

            // Crear "proyectos virtuales" desde TODAS las transacciones para mostrar en "Mis Proyectos"
            projectsFromTransactions = allTransactions.map((transaction: Transaction) => ({
              id: `transaction-${transaction.id}`,
              title: transaction.project_title || "Proyecto Contratado",
              description: "Proyecto contratado directamente al freelancer",
              budget_min: Number(transaction.amount),
              budget_max: Number(transaction.amount),
              budget: Number(transaction.amount), // Para mostrar precio único
              status: transaction.status === "paid" ? "in_progress" : "pending_payment",
              payment_status: transaction.status, // 'paid' o 'pending'
              created_at: transaction.created_at || transaction.paid_at || new Date().toISOString(),
              project_type: "Contrato Directo",
              required_skills: [], // Proyectos pagados no tienen habilidades específicas
              deadline: null,
              proposals: [], // Proyectos pagados no tienen propuestas
              // Información del freelancer - usar placeholder por ahora (se puede cargar después usando freelancer_id)
              freelancer: {
                full_name: "Freelancer",
                rating: 5.0,
                email: "",
                avatar_url: "",
              },
              // Marcar como proyecto de transacción para diferenciar
              _isFromTransaction: true,
              _transactionId: transaction.id,
              _stripeSessionId: transaction.stripe_session_id,
              _freelancerId: transaction.freelancer_id, // Guardar ID para cargar datos después si es necesario
            }))
          }
        } catch (error) {
          console.error("⚠️ Error cargando transacciones para proyectos:", error)
        }
      }

      // 3. Combinar proyectos tradicionales + proyectos de transacciones
      const allProjects = [...(projectsData || []), ...projectsFromTransactions]

      // Eliminar duplicados por ID si existen
      const uniqueProjects = allProjects.filter(
        (project, index, self) => index === self.findIndex((p) => p.id === project.id),
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
        },
      )

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setConversations(data.conversations || [])
        } else {
          console.error("Error in server response:", data.error)
        }
      } else {
        const errorText = await response.text()
        console.error("Error in HTTP response:", response.status, errorText)
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
    } catch (error: unknown) {
      console.error("Error sending message:", error)
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
      required_skills: newProject.required_skills.filter((skill) => skill !== skillToRemove),
    })
  }

  const createProject = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) return

    try {
      const { error } = await supabase
        .from("projects")
        .insert({
          client_id: user.id,
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
        const reminderDate = new Date(deadlineDate.getTime() - 24 * 60 * 60 * 1000) // 1 día antes

        if (reminderDate > new Date()) {
          await createReminderNotification(
            "⏰ Recordatorio de Proyecto",
            `El proyecto "${newProject.title}" tiene fecha límite mañana.`,
            "/dashboard/client",
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
        `,
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

  const acceptProposal = async (proposalId: string, freelancer_id: string, project_id: string) => {
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

  const handleActiveTab = (flag: string) => {
    setActiveTab(flag)
    setValue("last_tab", flag)
  }

  return (
    <Layout>
      <MainComponent>
        {/* Header - RESPONSIVE */}
        <div className="mb-6 rounded-lg bg-white p-4 shadow sm:mb-8 sm:p-6">
          <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
            <div className="flex items-center">
              <div className="mr-3 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 sm:mr-4 sm:h-16 sm:w-16">
                <i className="ri-briefcase-line text-primary text-xl sm:text-2xl"></i>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">
                  ¡Hola, {user?.full_name}!
                </h1>
                <p className="text-sm text-gray-600 sm:text-base">Cliente Dashboard</p>
              </div>
            </div>
            <button
              onClick={() => setShowNewProjectModal(true)}
              className="bg-primary w-full cursor-pointer rounded-lg px-4 py-2 text-sm font-medium whitespace-nowrap text-white transition-colors hover:bg-cyan-700 sm:w-auto sm:px-6 sm:py-3 sm:text-base"
            >
              <i className="ri-add-line mr-2"></i>
              Nuevo Proyecto
            </button>
          </div>
        </div>

        {/* Stats Cards - RESPONSIVE */}
        <div className="mb-6 grid grid-cols-2 gap-3 sm:mb-8 sm:gap-6 lg:grid-cols-4">
          <div className="rounded-lg bg-white p-3 shadow sm:p-6">
            <div className="flex items-center">
              <div className="mr-2 flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 sm:mr-4 sm:h-12 sm:w-12">
                <i className="ri-file-text-line text-primary text-sm sm:text-xl"></i>
              </div>
              <div>
                <p className="text-lg font-bold text-gray-900 sm:text-2xl">{projects.length}</p>
                <p className="text-xs text-gray-600 sm:text-sm">Proyectos</p>
              </div>
            </div>
          </div>

          <div className="rounded-lg bg-white p-3 shadow sm:p-6">
            <div className="flex items-center">
              <div className="mr-2 flex h-8 w-8 items-center justify-center rounded-lg bg-green-100 sm:mr-4 sm:h-12 sm:w-12">
                <i className="ri-check-line text-sm text-green-600 sm:text-xl"></i>
              </div>
              <div>
                <p className="text-lg font-bold text-gray-900 sm:text-2xl">
                  {projects.filter((p) => p.status === "completed").length}
                </p>
                <p className="text-xs text-gray-600 sm:text-sm">Completados</p>
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
                  {projects.filter((p) => p.status === "open").length}
                </p>
                <p className="text-xs text-gray-600 sm:text-sm">Activos</p>
              </div>
            </div>
          </div>

          <div className="rounded-lg bg-white p-3 shadow sm:p-6">
            <div className="flex items-center">
              <div className="mr-2 flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100 sm:mr-4 sm:h-12 sm:w-12">
                <i className="ri-chat-3-line text-sm text-purple-600 sm:text-xl"></i>
              </div>
              <div>
                <p className="text-lg font-bold text-gray-900 sm:text-2xl">
                  {conversations.length}
                </p>
                <p className="text-xs text-gray-600 sm:text-sm">Conversaciones</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs - RESPONSIVE */}
        <div className="rounded-lg bg-white shadow">
          <div className="overflow-x-auto overflow-y-hidden border-b border-gray-200">
            <nav className="-mb-px flex min-w-max">
              <button
                onClick={() => handleActiveTab("projects")}
                className={`border-b-2 px-3 py-3 text-xs font-medium whitespace-nowrap sm:px-6 sm:py-4 sm:text-sm ${
                  activeTab === "projects"
                    ? "text-primary border-cyan-500"
                    : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                }`}
              >
                Mis Proyectos ({projects.length})
              </button>
              <button
                onClick={() => handleActiveTab("messages")}
                className={`border-b-2 px-3 py-3 text-xs font-medium whitespace-nowrap sm:px-6 sm:py-4 sm:text-sm ${
                  activeTab === "messages"
                    ? "text-primary border-cyan-500"
                    : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
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
                className={`relative border-b-2 px-3 py-3 text-xs font-medium whitespace-nowrap sm:px-6 sm:py-4 sm:text-sm ${
                  activeTab === "reviews"
                    ? "border-primary text-primary"
                    : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                }`}
              >
                <i className="ri-star-line mr-1"></i>
                Reseñas
                {pendingReviewsCount > 0 && (
                  <span className="absolute top-[2px] right-[2px] flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">
                    {pendingReviewsCount}
                  </span>
                )}
              </button>
              <button
                onClick={() => handleActiveTab("user")}
                className={`border-b-2 px-3 py-3 text-xs font-medium whitespace-nowrap sm:px-6 sm:py-4 sm:text-sm ${
                  activeTab === "user"
                    ? "text-primary border-blue-500"
                    : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                }`}
              >
                Mi Perfil
              </button>
              <button
                onClick={() => handleActiveTab("payments")}
                className={`flex cursor-pointer items-center rounded-lg px-3 py-2 text-xs font-medium whitespace-nowrap transition-colors sm:px-4 sm:py-3 sm:text-sm ${
                  activeTab === "payments"
                    ? "bg-primary/10 text-cyan-700"
                    : "hover:text-primary text-gray-600 hover:bg-cyan-50"
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
                <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
                  <h2 className="text-lg font-semibold text-gray-900 sm:text-xl">Mis Proyectos</h2>
                  <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-3">
                    {/* NUEVO: Botón de Matching Inteligente */}
                    <button
                      onClick={async () => {
                        try {
                          const session = await supabase.auth.getSession()
                          if (!session.data.session?.access_token) {
                            window.toast({
                              title: "Necesitas iniciar sesión para usar el matching inteligente",
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
                            },
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
                      className="to-primary w-full cursor-pointer rounded-lg bg-linear-to-r from-purple-600 px-4 py-2 text-sm font-medium whitespace-nowrap text-white shadow-lg transition-all hover:from-purple-700 hover:to-cyan-700 sm:w-auto sm:px-6 sm:py-3 sm:text-base"
                    >
                      <i className="ri-magic-line mr-2"></i>
                      🤖 Matching Inteligente
                    </button>
                    <button
                      onClick={() => setShowNewProjectModal(true)}
                      className="bg-primary w-full cursor-pointer rounded-lg px-4 py-2 text-sm font-medium whitespace-nowrap text-white transition-colors hover:bg-cyan-700 sm:w-auto sm:px-6 sm:py-3 sm:text-base"
                    >
                      <i className="ri-add-line mr-2"></i>
                      Crear Proyecto
                    </button>
                  </div>
                </div>

                {/* NUEVO: Panel de Matches Inteligentes */}
                <div className="mb-6 rounded-xl border border-purple-200 bg-linear-to-br from-purple-50 to-blue-50 p-4 sm:p-6">
                  <div className="mb-4 flex items-center">
                    <div className="to-primary mr-4 flex h-12 w-12 items-center justify-center rounded-full bg-linear-to-r from-purple-600">
                      <i className="ri-magic-line text-xl text-white"></i>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">
                        🤖 Motor de Matching Inteligente
                      </h3>
                      <p className="text-sm text-purple-700">
                        Encuentra freelancers perfectos usando inteligencia artificial
                      </p>
                    </div>
                  </div>

                  <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div className="rounded-lg bg-white p-4 shadow-sm">
                      <div className="text-primary mb-2 flex items-center">
                        <i className="ri-brain-line mr-2 text-xl"></i>
                        <span className="font-semibold">Análisis IA</span>
                      </div>
                      <p className="text-xs text-gray-600">
                        Algoritmo avanzado que analiza compatibilidad de habilidades, presupuesto y
                        experiencia
                      </p>
                    </div>

                    <div className="rounded-lg bg-white p-4 shadow-sm">
                      <div className="text-primary mb-2 flex items-center">
                        <i className="ri-target-line mr-2 text-xl"></i>
                        <span className="font-semibold">Matching Preciso</span>
                      </div>
                      <p className="text-xs text-gray-600">
                        Encuentra los Top 10 freelancers más compatibles con tus proyectos
                        específicos
                      </p>
                    </div>

                    <div className="rounded-lg bg-white p-4 shadow-sm">
                      <div className="mb-2 flex items-center text-purple-600">
                        <i className="ri-award-line mr-2 text-xl"></i>
                        <span className="font-semibold">Predicción Éxito</span>
                      </div>
                      <p className="text-xs text-gray-600">
                        Calcula la probabilidad de éxito de cada colaboración potencial
                      </p>
                    </div>
                  </div>

                  <div className="rounded-lg border border-purple-200 bg-white p-4">
                    <h4 className="mb-2 font-medium text-gray-900">
                      ¿Cómo Funciona el Matching Inteligente?
                    </h4>
                    <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                      <div className="flex items-start">
                        <i className="ri-check-line text-primary mt-0.5 mr-2"></i>
                        <span className="text-gray-700">
                          Analiza tus proyectos activos y requisitos
                        </span>
                      </div>
                      <div className="flex items-start">
                        <i className="ri-check-line text-primary mt-0.5 mr-2"></i>
                        <span className="text-gray-700">
                          Evalúa freelancers por habilidades y experiencia
                        </span>
                      </div>
                      <div className="flex items-start">
                        <i className="ri-check-line text-primary mt-0.5 mr-2"></i>
                        <span className="text-gray-700">Calcula compatibilidad de presupuesto</span>
                      </div>
                      <div className="flex items-start">
                        <i className="ri-check-line text-primary mt-0.5 mr-2"></i>
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
                    openProjectManagement={() => openProjectManagement(project)}
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
                <div className="mb-4 flex flex-col space-y-3 sm:mb-6 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
                  <h2 className="text-lg font-semibold text-gray-900 sm:text-xl">
                    Mis Conversaciones
                  </h2>
                  <button
                    onClick={loadConversations}
                    className="bg-primary w-full cursor-pointer rounded-md px-3 py-2 text-xs font-medium whitespace-nowrap text-white transition-colors hover:bg-cyan-700 sm:w-auto sm:px-4 sm:text-sm"
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
                        className="cursor-pointer rounded-lg border border-gray-200 bg-white p-3 transition-shadow hover:shadow-md sm:p-4"
                        onClick={() => openChat(conversation)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex min-w-0 flex-1 items-center">
                            <div className="mr-3 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 sm:mr-4 sm:h-12 sm:w-12">
                              <i className="ri-user-line text-primary text-lg sm:text-xl"></i>
                            </div>
                            <div className="min-w-0 flex-1">
                              <h3 className="truncate text-sm font-semibold text-gray-900 sm:text-base">
                                {conversation.client.full_name}
                              </h3>
                              {conversation.project && (
                                <p className="truncate text-xs text-gray-600 sm:text-sm">
                                  Proyecto: {conversation.project.title}
                                </p>
                              )}
                              {conversation.latest_message && (
                                <p className="truncate text-xs text-gray-500 sm:text-sm">
                                  {conversation.latest_message.sender_id === user?.id ? "Tú: " : ""}
                                  {conversation.latest_message.message_text}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="ml-2 shrink-0 text-right">
                            {conversation.latest_message && (
                              <p className="text-xs text-gray-400">
                                {new Date(
                                  conversation.latest_message.created_at,
                                ).toLocaleDateString()}
                              </p>
                            )}
                            <div className="mt-1 flex items-center justify-end">
                              <i className="ri-chat-3-line mr-1 text-gray-400"></i>
                              <span className="text-primary text-xs font-medium sm:text-sm">
                                Ver chat
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center sm:py-12">
                    <i className="ri-chat-3-line sm:4xl mb-4 text-3xl text-gray-400"></i>
                    <h3 className="mb-2 text-base font-medium text-gray-900 sm:text-lg">
                      No tienes conversaciones aún
                    </h3>
                    <p className="px-4 text-sm text-gray-600 sm:text-base">
                      Las conversaciones con freelancers aparecerán aquí cuando contactes
                      freelancers desde la página principal.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Perfil */}
            {activeTab === "user" && (
              <div className="space-y-4 sm:space-y-6">
                <div className="flex flex-col items-center space-y-4 sm:flex-row sm:items-start sm:space-y-0 sm:space-x-6">
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-blue-100 sm:h-24 sm:w-24">
                    <i className="ri-user-line text-primary text-2xl sm:text-3xl"></i>
                  </div>
                  <div className="text-center sm:text-left">
                    <h2 className="text-xl font-bold text-gray-900 sm:text-2xl">
                      {user?.full_name}
                    </h2>
                    <p className="text-sm text-gray-600 sm:text-base">{user?.email}</p>
                    <div className="mt-2 flex items-center justify-center sm:justify-start">
                      <span className="text-primary text-sm font-semibold sm:text-base">
                        Cliente activo desde {new Date().getFullYear()}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="mb-2 text-base font-semibold text-gray-900 sm:text-lg">
                    Información de perfil
                  </h3>
                  <p className="text-sm text-gray-700 sm:text-base">
                    {user?.bio || "No has añadido una descripción aún."}
                  </p>
                </div>

                <button className="bg-primary w-full cursor-pointer rounded-md px-4 py-2 text-sm font-medium whitespace-nowrap text-white transition-colors hover:bg-cyan-700 sm:w-auto sm:px-6 sm:text-base">
                  Editar Perfil
                </button>
              </div>
            )}

            {/* Reseñas Tab */}
            {activeTab === "reviews" && (
              <div className="space-y-6">
                <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
                  <h2 className="text-lg font-semibold text-gray-900 sm:text-xl">
                    Sistema de Reseñas
                  </h2>
                  <button
                    onClick={loadPendingReviewsCount}
                    className="bg-primary w-full cursor-pointer rounded-md px-3 py-2 text-xs font-medium whitespace-nowrap text-white transition-colors hover:bg-cyan-700 sm:w-auto sm:px-4 sm:text-sm"
                  >
                    <i className="ri-refresh-line mr-2"></i>
                    Actualizar
                  </button>
                </div>

                {/* Notificación de proyectos pendientes */}
                {pendingReviewsCount > 0 && (
                  <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
                    <div className="flex items-center">
                      <i className="ri-notification-line mr-3 text-xl text-yellow-600"></i>
                      <div>
                        <h4 className="font-medium text-yellow-800">
                          ¡Tienes {pendingReviewsCount} proyecto
                          {pendingReviewsCount !== 1 ? "s" : ""} pendiente
                          {pendingReviewsCount !== 1 ? "s" : ""} de reseña!
                        </h4>
                        <p className="mt-1 text-sm text-yellow-700">
                          Ayuda a otros usuarios compartiendo tu experiencia con los freelancers.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Proyectos Pendientes de Reseña */}
                <div>
                  <PendingReviews onReviewsUpdate={() => loadPendingReviewsCount()} />
                </div>

                {/* Separador */}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="bg-white px-2 text-gray-500">Tus Reseñas Recibidas</span>
                  </div>
                </div>

                {/* Reseñas Recibidas */}
                {user && (
                  <div>
                    <ReviewsDisplay userId={user.id} userType="client" showStats={true} />
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

      {/* Proposals Modal - RESPONSIVE */}
      {showProposalsModal && selectedProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-2 sm:p-4">
          <div className="max-h-[95vh] w-full max-w-full overflow-y-auto rounded-xl bg-white sm:max-h-[90vh] sm:max-w-4xl sm:rounded-2xl">
            <div className="p-4 sm:p-6">
              <div className="mb-4 flex items-start justify-between sm:mb-6">
                <div>
                  <h2 className="text-lg font-bold text-gray-900 sm:text-2xl">
                    Propuestas Recibidas
                  </h2>
                  <h3 className="text-sm text-gray-600 sm:text-lg">{selectedProject.title}</h3>
                </div>
                <button
                  onClick={() => setShowProposalsModal(false)}
                  className="cursor-pointer p-1 text-gray-400 hover:text-gray-600"
                >
                  <i className="ri-close-line text-xl sm:text-2xl"></i>
                </button>
              </div>

              {/* NUEVO: Mostrar mensaje inicial del cliente */}
              <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4 sm:p-6">
                <div className="flex items-start">
                  <div className="mr-3 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 sm:mr-4 sm:h-12 sm:w-12">
                    <i className="ri-message-3-line text-primary text-lg sm:text-xl"></i>
                  </div>
                  <div className="flex-1">
                    <div className="rounded-lg border border-blue-200 bg-white p-3 sm:p-4">
                      <div className="space-y-3">
                        <div>
                          <p className="mb-1 text-xs font-medium text-gray-600 sm:text-sm">
                            Título del Proyecto:
                          </p>
                          <p className="text-sm font-semibold text-gray-900 sm:text-base">
                            {selectedProject.title}
                          </p>
                        </div>

                        <div>
                          <p className="mb-1 text-xs font-medium text-gray-600 sm:text-sm">
                            Descripción Completa:
                          </p>
                          <p className="text-sm leading-relaxed text-gray-900 sm:text-base">
                            {selectedProject.description}
                          </p>
                        </div>

                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
                          <div>
                            <p className="mb-1 text-xs font-medium text-gray-600 sm:text-sm">
                              Presupuesto:
                            </p>
                            <p className="text-primary text-sm font-bold sm:text-base">
                              ${selectedProject.budget_min} - ${selectedProject.budget_max}
                            </p>
                          </div>

                          <div>
                            <p className="mb-1 text-xs font-medium text-gray-600 sm:text-sm">
                              Tipo de Proyecto:
                            </p>
                            <p className="text-sm text-gray-900 sm:text-base">
                              {selectedProject.project_type === "hourly"
                                ? "Precio por hora"
                                : "Precio fijo"}
                            </p>
                          </div>
                        </div>

                        {selectedProject.required_skills &&
                          selectedProject.required_skills.length > 0 && (
                            <div>
                              <p className="mb-2 text-xs font-medium text-gray-600 sm:text-sm">
                                Habilidades Requeridas:
                              </p>
                              <div className="flex flex-wrap gap-1 sm:gap-2">
                                {selectedProject.required_skills.map((skill, index) => (
                                  <span
                                    key={index}
                                    className="rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-cyan-800 sm:px-3 sm:text-sm"
                                  >
                                    {skill}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                        {selectedProject.deadline && (
                          <div>
                            <p className="mb-1 text-xs font-medium text-gray-600 sm:text-sm">
                              Fecha Límite:
                            </p>
                            <p className="text-sm text-gray-900 sm:text-base">
                              {new Date(selectedProject.deadline).toLocaleDateString("es-ES", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              })}
                            </p>
                          </div>
                        )}

                        <div className="border-t border-blue-200 pt-3">
                          <p className="text-primary text-xs">
                            <i className="ri-calendar-line mr-1"></i>
                            Proyecto publicado:{" "}
                            {new Date(selectedProject.created_at).toLocaleDateString("es-ES", {
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
                  <div className="py-8 text-center sm:py-12">
                    <i className="ri-mail-line mb-4 text-3xl text-gray-400 sm:text-4xl"></i>
                    <h3 className="mb-2 text-base font-medium text-gray-900 sm:text-lg">
                      No hay propuestas aún
                    </h3>
                    <p className="text-sm text-gray-600 sm:text-base">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-2 sm:p-4">
          <div className="max-h-[95vh] w-full max-w-full overflow-y-auto rounded-lg bg-white sm:max-w-2xl">
            <div className="p-4 sm:p-6">
              <div className="mb-4 flex items-center justify-between sm:mb-6">
                <h2 className="text-lg font-bold text-gray-900 sm:text-2xl">
                  Crear Nuevo Proyecto
                </h2>
                <button
                  onClick={() => setShowNewProjectModal(false)}
                  className="cursor-pointer p-1 text-gray-400 hover:text-gray-600"
                >
                  <i className="ri-close-line text-xl sm:text-2xl"></i>
                </button>
              </div>

              <form onSubmit={createProject} className="space-y-4 sm:space-y-6">
                <div>
                  <label className="mb-2 block text-xs font-medium text-gray-700 sm:text-sm">
                    Título del Proyecto
                  </label>
                  <input
                    type="text"
                    required
                    value={newProject.title}
                    onChange={(e) => setNewProject({ ...newProject, title: e.target.value })}
                    className="focus:ring-primary focus:border-primary w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none sm:text-base"
                    placeholder="Ej: Desarrollo de sitio web corporativo"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-medium text-gray-700 sm:text-sm">
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
                    className="focus:ring-primary focus:border-primary w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none sm:text-base"
                    placeholder="Describe tu proyecto en detalle..."
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-xs font-medium text-gray-700 sm:text-sm">
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
                      className="focus:ring-primary focus:border-primary w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none sm:text-base"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-xs font-medium text-gray-700 sm:text-sm">
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
                      className="focus:ring-primary focus:border-primary w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none sm:text-base"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-xs font-medium text-gray-700 sm:text-sm">
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
                    className="focus:ring-primary focus:border-primary w-full rounded-md border border-gray-300 px-3 py-2 pr-8 text-sm focus:outline-none sm:text-base"
                  >
                    <option value="fixed">Precio Fijo</option>
                    <option value="hourly">Por Hora</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-xs font-medium text-gray-700 sm:text-sm">
                    Habilidades Requeridas
                  </label>
                  <div className="mb-3 flex flex-wrap gap-1 sm:gap-2">
                    {newProject.required_skills.map((skill) => (
                      <span
                        key={skill}
                        className="flex items-center rounded-full bg-blue-100 px-2 py-1 text-xs text-cyan-800 sm:px-3 sm:text-sm"
                      >
                        {skill}
                        <button
                          type="button"
                          onClick={() => removeSkill(skill)}
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
                          addSkill(skillInput.trim())
                        }
                      }}
                      className="focus:ring-primary focus:border-primary flex-1 rounded-l-md border border-gray-300 px-3 py-2 text-sm focus:outline-none sm:text-base"
                      placeholder="Añadir habilidad (presiona Enter)"
                    />
                    <button
                      type="button"
                      onClick={() => addSkill(skillInput.trim())}
                      className="bg-primary cursor-pointer rounded-r-md px-3 py-2 text-white transition-colors hover:bg-cyan-700 sm:px-4"
                    >
                      <i className="ri-add-line"></i>
                    </button>
                  </div>
                  <div className="mt-2">
                    <p className="text-xs text-gray-600 sm:text-sm">Habilidades populares:</p>
                    <div className="mt-1 flex flex-wrap gap-1 sm:gap-2">
                      {popularSkills.map((skill) => (
                        <button
                          key={skill}
                          type="button"
                          onClick={() => addSkill(skill)}
                          className="cursor-pointer rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-700 hover:bg-gray-200"
                        >
                          {skill}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-xs font-medium text-gray-700 sm:text-sm">
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
                    className="focus:ring-primary focus:border-primary w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none sm:text-base"
                    min={new Date().toISOString().split("T")[0]}
                  />
                </div>

                <div className="flex flex-col justify-end space-y-2 pt-4 sm:flex-row sm:space-y-0 sm:space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowNewProjectModal(false)}
                    className="w-full cursor-pointer rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 sm:w-auto sm:px-6 sm:text-base"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="bg-primary w-full cursor-pointer rounded-md px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-cyan-700 sm:w-auto sm:px-6 sm:text-base"
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
  )
}
