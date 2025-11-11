"use client"

import { useState, useEffect, useRef } from "react"
import { useAuth } from "@/contexts/AuthContext"
import PaymentsTab from "@/components/dashboard/PaymentsTab"
import ProjectManagement from "@/components/dashboard/ProjectManagement"
import { PendingReviews } from "@/components/dashboard/PendingReviews"
import { ReviewsDisplay } from "@/components/dashboard/ReviewsDisplay"
import { useNotifications } from "@/hooks/useNotifications"
import { useBadges } from "@/hooks/useBadges"
import { MainComponent } from "@/components/MainComponent"
import type { Project } from "@/interfaces/Project"
import type { Conversation } from "@/interfaces/Conversation"
import type { Proposal } from "@/interfaces/Proposal"
import type { ChatMessage } from "@/interfaces/ChatMessage"
import type { Transaction } from "@/interfaces/Transaction"
import { useSessionStorage } from "@/hooks/useSessionStorage"
import { ConversationModal } from "@/components/ConversationModal"
import { ProjectArticle } from "@/components/dashboard/ProjectArticle"
import { ProposalArticle } from "@/components/dashboard/ProposalArticle"
import { supabaseBrowser } from "@/utils/supabase/client"
import { ConversationCard } from "@/components/dashboard/ConversationCard"
import { useTranslation } from "react-i18next"

const supabase = supabaseBrowser()

export default function ClientDashboardUI() {
  const { t, i18n } = useTranslation()
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
  const [showEditProfileModal, setShowEditProfileModal] = useState(false)
  const [editProfileForm, setEditProfileForm] = useState({
    full_name: "",
    bio: "",
    location: "",
  })
  const [updatingProfile, setUpdatingProfile] = useState(false)
  const [showTransactionDetails, setShowTransactionDetails] = useState(false)
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)
  const [showEditProjectModal, setShowEditProjectModal] = useState(false)
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [editProjectForm, setEditProjectForm] = useState({
    title: "",
    description: "",
    budget_min: "",
    budget_max: "",
    project_type: "fixed",
    required_skills: [] as string[],
    deadline: "",
  })
  const [editSkillInput, setEditSkillInput] = useState("")
  const [updatingProject, setUpdatingProject] = useState(false)

  const { setValue, getValue } = useSessionStorage("last_tab")
  const { notifyProposal, notifyNewMessage, notifyNewProject, createReminderNotification } = useNotifications()
  const { checkAndUnlockBadges } = useBadges()

  // Track previous user ID to prevent unnecessary reloads on auth refresh
  const previousUserIdRef = useRef<string | null>(null)

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
    document.title = t("dashboard.client.pageTitle")
    window.scrollTo(0, 0)

    if (getValue("last_tab")) {
      setActiveTab(getValue("last_tab"))
    } else {
      setActiveTab("projects")
      setValue("last_tab", "projects")
    }
  }, [t])

  useEffect(() => {
    if (!user && !loading) {
      refreshAuth()
    }
  }, [user, loading, refreshAuth])

  useEffect(() => {
    // Only reload data if user ID actually changed (not just on auth refresh)
    const currentUserId = user?.id || null
    if (currentUserId && currentUserId !== previousUserIdRef.current) {
      previousUserIdRef.current = currentUserId
      loadProjects()
      loadConversations()
      loadPendingReviewsCount()
    } else if (!currentUserId) {
      // User logged out
      previousUserIdRef.current = null
    }
  }, [user?.id])

  // Handle body overflow when modals open/close
  useEffect(() => {
    if (
      showChat ||
      showProposalsModal ||
      showProjectManagement ||
      showNewProjectModal ||
      showEditProfileModal ||
      showEditProjectModal
    ) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }

    return () => {
      document.body.style.overflow = ""
    }
  }, [
    showChat,
    showProposalsModal,
    showProjectManagement,
    showNewProjectModal,
    showEditProfileModal,
    showEditProjectModal,
  ])

  const loadProjects = async () => {
    if (!user) return

    try {
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
            const allTransactions = (data.transactions || []).filter(
              (t: Transaction) => t.status === "paid" || t.status === "pending",
            )

            // Load freelancer information for all transactions
            const freelancerIds = allTransactions
              .map((t: Transaction) => t.freelancer_id)
              .filter((id: string) => id)

            // Fetch all freelancer profiles at once (only if there are freelancer IDs)
            let freelancersMap = new Map()
            if (freelancerIds.length > 0) {
              const { data: freelancersData } = await supabase
                .from("profiles")
                .select("id, full_name, email, rating, avatar_url")
                .in("id", freelancerIds)

              // Create a map for quick lookup
              freelancersMap = new Map(
                (freelancersData || []).map((freelancer: any) => [freelancer.id, freelancer]),
              )
            }

            projectsFromTransactions = allTransactions.map((transaction: Transaction) => {
              // Get freelancer information from the map
              const freelancerInfo = freelancersMap.get(transaction.freelancer_id) || {
                id: transaction.freelancer_id || "",
                full_name: "Freelancer",
                email: "",
                rating: 5.0,
                avatar_url: "",
              }

              return {
                id: `transaction-${transaction.id}`,
                title: transaction.project_title || t("dashboard.client.projects.directContract"),
                description:
                  transaction.project_description ||
                  t("dashboard.client.projects.directContractDesc"),
                budget_min: Number(transaction.amount),
                budget_max: Number(transaction.amount),
                budget: Number(transaction.amount),
                status: transaction.status === "paid" ? "in_progress" : "pending_payment",
                payment_status: transaction.status,
                created_at:
                  transaction.created_at || transaction.paid_at || new Date().toISOString(),
                project_type: t("dashboard.client.projects.directContractType"),
                required_skills: [],
                deadline: null,
                proposals: [],
                freelancer: {
                  id: freelancerInfo.id,
                  full_name: freelancerInfo.full_name || t("common.freelancer"),
                  email: freelancerInfo.email || "",
                  rating: freelancerInfo.rating || 5.0,
                  avatar_url: freelancerInfo.avatar_url || "",
                },
                _isFromTransaction: true,
                _transactionId: transaction.id,
                _stripeSessionId: transaction.stripe_session_id,
                _freelancerId: transaction.freelancer_id,
              }
            })
          }
        } catch (error) {
          console.error("⚠️ Error cargando transacciones para proyectos:", error)
        }
      }

      const allProjects = [...(projectsData || []), ...projectsFromTransactions]

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

        if (data.message?.id) {
          await notifyNewMessage(data.message.id)
        }

        // Check for badges after sending message
        if (user?.id) {
          await checkAndUnlockBadges(user.id, "client")
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

  const handleContactFreelancer = async (
    freelancerId: string,
    freelancerName: string,
    projectId?: string | null,
  ) => {
    if (!user) return

    try {
      const session = await supabase.auth.getSession()
      if (!session.data.session?.access_token) {
        window.toast({
          title: "Necesitas iniciar sesión para chatear",
          type: "error",
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
            userType: "client",
          }),
        },
      )

      let existingConversation: Conversation | null = null
      if (findResponse.ok) {
        const findData = await findResponse.json()
        if (findData.success && findData.conversations) {
          // Find conversation with this freelancer
          existingConversation =
            findData.conversations.find((conv: Conversation) => {
              return (
                conv.freelancer_id === freelancerId &&
                (projectId ? conv.project_id === projectId : true)
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
            freelancerId: freelancerId,
            clientId: user.id,
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

  const handleViewTransaction = async (project: Project) => {
    if (!project._isFromTransaction || !project._transactionId) {
      return
    }

    try {
      const session = await supabase.auth.getSession()
      if (!session.data.session?.access_token) {
        window.toast({
          title: "Necesitas iniciar sesión para ver los detalles",
          type: "error",
          location: "bottom-center",
          dismissible: true,
          icon: true,
        })
        return
      }

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
        const transaction = (data.transactions || []).find(
          (t: Transaction) => t.id === project._transactionId,
        )

        if (transaction) {
          setSelectedTransaction(transaction)
          setShowTransactionDetails(true)
        } else {
          window.toast({
            title: "No se encontró la transacción",
            type: "error",
            location: "bottom-center",
            dismissible: true,
            icon: true,
          })
        }
      } else {
        throw new Error(`Error ${response.status}`)
      }
    } catch (error: unknown) {
      window.toast({
        title: "Error al cargar los detalles de la transacción",
        type: "error",
        location: "bottom-center",
        dismissible: true,
        icon: true,
      })
      console.error("Error loading transaction:", error)
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
      const { data: projectData, error } = await supabase
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

      // Notify freelancers about the new project
      if (projectData?.id) {
        await notifyNewProject(projectData.id)
      }

      if (newProject.deadline) {
        const deadlineDate = new Date(newProject.deadline)
        const reminderDate = new Date(deadlineDate.getTime() - 24 * 60 * 60 * 1000)

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

      // Check for badges after creating project
      if (user?.id) {
        await checkAndUnlockBadges(user.id, "client")
      }

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
      const { data: projectData, error } = await supabase
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

      // Check for badges after accepting proposal
      if (user?.id) {
        await checkAndUnlockBadges(user.id, "client")
      }

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
      const { data: projectData, error } = await supabase
        .from("proposals")
        .update({ status: "rejected" })
        .eq("id", proposalId)

      if (error) throw error

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

  const openEditProfileModal = () => {
    if (user) {
      setEditProfileForm({
        full_name: user.full_name || "",
        bio: user.bio || "",
        location: user.location || "",
      })
      setShowEditProfileModal(true)
    }
  }

  const updateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || updatingProfile) return

    setUpdatingProfile(true)

    try {
      const { data: projectData, error } = await supabase
        .from("profiles")
        .update({
          full_name: editProfileForm.full_name.trim(),
          bio: editProfileForm.bio.trim(),
          location: editProfileForm.location.trim(),
        })
        .eq("user_id", user.id)

      if (error) throw error

      setShowEditProfileModal(false)
      await refreshAuth()

      window.toast({
        title: t("dashboard.client.success.profileUpdated"),
        type: "success",
        location: "bottom-center",
        dismissible: true,
        icon: true,
      })
    } catch (error) {
      console.error("Error updating profile:", error)
      window.toast({
        title: t("dashboard.client.errors.updateProfile"),
        type: "error",
        location: "bottom-center",
        dismissible: true,
        icon: true,
      })
    } finally {
      setUpdatingProfile(false)
    }
  }

  const openEditProjectModal = (project: Project) => {
    if (project._isFromTransaction) return // Can't edit transaction projects

    setEditingProject(project)
    setEditProjectForm({
      title: project.title || "",
      description: project.description || "",
      budget_min: project.budget_min?.toString() || "",
      budget_max: project.budget_max?.toString() || "",
      project_type: project.project_type || "fixed",
      required_skills: project.required_skills || [],
      deadline: project.deadline || "",
    })
    setEditSkillInput("")
    setShowEditProjectModal(true)
  }

  const updateProject = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingProject || updatingProject) return

    setUpdatingProject(true)

    try {
      const { data: projectData, error } = await supabase
        .from("projects")
        .update({
          title: editProjectForm.title.trim(),
          description: editProjectForm.description.trim(),
          budget_min: parseInt(editProjectForm.budget_min),
          budget_max: parseInt(editProjectForm.budget_max),
          project_type: editProjectForm.project_type,
          required_skills: editProjectForm.required_skills,
          deadline: editProjectForm.deadline || null,
        })
        .eq("id", editingProject.id)

      if (error) throw error

      setShowEditProjectModal(false)
      setEditingProject(null)
      loadProjects()

      window.toast({
        title: "Proyecto actualizado exitosamente",
        type: "success",
        location: "bottom-center",
        dismissible: true,
        icon: true,
      })
    } catch (error) {
      console.error("Error updating project:", error)
      window.toast({
        title: "Error al actualizar el proyecto",
        type: "error",
        location: "bottom-center",
        dismissible: true,
        icon: true,
      })
    } finally {
      setUpdatingProject(false)
    }
  }

  const deleteProject = async (project: Project) => {
    if (project._isFromTransaction) return // Can't delete transaction projects

    try {
      // Check if there are accepted proposals or if a freelancer is assigned
      const hasAcceptedProposals = project.proposals?.some((p) => p.status === "accepted") || false
      const hasFreelancerAssigned = !!project.freelancer?.id

      if ((hasAcceptedProposals || hasFreelancerAssigned) && project.status !== "completed") {
        window.toast({
          title: "No puedes eliminar un proyecto con propuestas aceptadas o freelancer asignado",
          type: "error",
          location: "bottom-center",
          dismissible: true,
          icon: true,
        })
        return
      }

      // Delete the project
      const { data: projectData, error } = await supabase.from("projects").delete().eq("id", project.id)

      if (error) throw error

      loadProjects()

      window.toast({
        title: "Proyecto eliminado exitosamente",
        type: "success",
        location: "bottom-center",
        dismissible: true,
        icon: true,
      })
    } catch (error) {
      console.error("Error deleting project:", error)
      window.toast({
        title: "Error al eliminar el proyecto",
        type: "error",
        location: "bottom-center",
        dismissible: true,
        icon: true,
      })
    }
  }

  const addEditSkill = (skill: string) => {
    if (skill && !editProjectForm.required_skills.includes(skill)) {
      setEditProjectForm({
        ...editProjectForm,
        required_skills: [...editProjectForm.required_skills, skill],
      })
      setEditSkillInput("")
    }
  }

  const removeEditSkill = (skillToRemove: string) => {
    setEditProjectForm({
      ...editProjectForm,
      required_skills: editProjectForm.required_skills.filter((skill) => skill !== skillToRemove),
    })
  }

  const tabsOptions = [
    {
      value: "projects",
      label: t("dashboard.client.tabs.projects"),
      count: projects.length,
    },
    {
      value: "messages",
      label: t("dashboard.client.tabs.messages"),
      count: conversations.length,
    },
    {
      value: "reviews",
      label: t("dashboard.client.tabs.reviews"),
      count: pendingReviewsCount,
      hasBadge: true,
      onSelect: () => {
        handleActiveTab("reviews")
        loadPendingReviewsCount()
      },
    },
    {
      value: "user",
      label: t("dashboard.client.tabs.profile"),
      count: pendingReviewsCount,
    },
    {
      value: "payments",
      label: t("dashboard.client.tabs.payments"),
      hasIcon: true,
    },
  ]

  return (
    <>
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
                  {t("dashboard.client.greeting").replace("{name}", user?.full_name || "")}
                </h1>
                <p className="text-sm text-gray-600 sm:text-base">{t("dashboard.client.title")}</p>
              </div>
            </div>
            <button
              onClick={() => setShowNewProjectModal(true)}
              className="bg-primary w-full cursor-pointer rounded-lg px-4 py-2 text-sm font-medium whitespace-nowrap text-white transition-colors hover:bg-cyan-700 sm:w-auto sm:px-6 sm:py-3 sm:text-base"
            >
              <i className="ri-add-line mr-2"></i>
              {t("dashboard.client.projects.createProject")}
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
                <p className="text-xs text-gray-600 sm:text-sm">
                  {t("dashboard.client.stats.activeProjects")}
                </p>
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
                <p className="text-xs text-gray-600 sm:text-sm">
                  {t("dashboard.client.stats.completedProjects")}
                </p>
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
                <p className="text-xs text-gray-600 sm:text-sm">
                  {t("dashboard.client.stats.pendingProposals")}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-lg bg-white p-3 shadow sm:p-6">
            <div className="flex items-center">
              <div className="mr-2 flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100 sm:mr-4 sm:h-12 sm:w-12">
                <i className="ri-chat-3-line text-sm text-cyan-600 sm:text-xl"></i>
              </div>
              <div>
                <p className="text-lg font-bold text-gray-900 sm:text-2xl">
                  {conversations.length}
                </p>
                <p className="text-xs text-gray-600 sm:text-sm">
                  {t("dashboard.client.stats.messages")}
                </p>
              </div>
            </div>
          </div>
        </div>

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
                          ? "bg-primary/10 text-cyan-700"
                          : "hover:text-primary text-gray-600 hover:bg-cyan-50"
                      }`}
                    >
                      <i className="ri-bank-card-line mr-1 sm:mr-2"></i>
                      {tab.label}
                    </button>
                  )
                }

                return (
                  <button
                    key={idx}
                    onClick={tab.onSelect || (() => handleActiveTab(tab.value))}
                    className={`relative cursor-pointer border-b-2 px-3 py-3 text-xs font-medium whitespace-nowrap sm:px-6 sm:py-4 sm:text-sm ${
                      isActive
                        ? isReviews
                          ? "border-primary text-primary"
                          : "text-primary border-cyan-500"
                        : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                    }`}
                  >
                    {isReviews && <i className="ri-star-line mr-1"></i>}
                    {tab.label}
                    {tab.count !== undefined && tab.count > 0 && !isReviews && ` (${tab.count})`}
                    {isReviews && tab.count !== undefined && tab.count > 0 && (
                      <span className="absolute top-[2px] right-[2px] flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">
                        {tab.count}
                      </span>
                    )}
                  </button>
                )
              })}
            </nav>
          </div>

          <div className="p-4 sm:p-6">
            {activeTab === "projects" && (
              <div className="space-y-4 sm:space-y-6">
                <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
                  <h2 className="text-lg font-semibold text-gray-900 sm:text-xl">
                    {t("dashboard.client.projects.title")}
                  </h2>
                  <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-3">
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
                      className="w-full cursor-pointer rounded-lg bg-gradient-to-r from-cyan-600 to-teal-600 px-4 py-2 text-sm font-medium whitespace-nowrap text-white shadow-lg transition-all hover:from-cyan-700 hover:to-teal-700 sm:w-auto sm:px-6 sm:py-3 sm:text-base"
                    >
                      <i className="ri-magic-line mr-2"></i>
                      🤖 Matching Inteligente
                    </button>
                    <button
                      onClick={() => setShowNewProjectModal(true)}
                      className="bg-primary w-full cursor-pointer rounded-lg px-4 py-2 text-sm font-medium whitespace-nowrap text-white transition-colors hover:bg-cyan-700 sm:w-auto sm:px-6 sm:py-3 sm:text-base"
                    >
                      <i className="ri-add-line mr-2"></i>
                      {t("dashboard.client.projects.createProject")}
                    </button>
                  </div>
                </div>

                <div className="mb-6 rounded-xl border border-cyan-200 bg-gradient-to-br from-cyan-50 to-teal-50 p-4 sm:p-6">
                  <div className="mb-4 flex items-center">
                    <div className="mr-4 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r from-cyan-600 to-teal-600">
                      <i className="ri-magic-line text-xl text-white"></i>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">
                        🤖 Motor de Matching Inteligente
                      </h3>
                      <p className="text-sm text-cyan-700">
                        Encuentra freelancers perfectos usando inteligencia artificial
                      </p>
                    </div>
                  </div>

                  <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div className="rounded-lg bg-white p-4 shadow-sm">
                      <div className="text-primary mb-2 flex items-center">
                        <i className="ri-brain-line mr-2 text-xl"></i>
                        <span className="font-semibold">
                          {t("dashboard.client.analytics.aiAnalysis")}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600">
                        {t("dashboard.client.analytics.aiAnalysisDesc")}
                      </p>
                    </div>

                    <div className="rounded-lg bg-white p-4 shadow-sm">
                      <div className="text-primary mb-2 flex items-center">
                        <i className="ri-target-line mr-2 text-xl"></i>
                        <span className="font-semibold">
                          {t("dashboard.client.analytics.preciseMatching")}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600">
                        {t("dashboard.client.analytics.preciseMatchingDesc")}
                      </p>
                    </div>

                    <div className="rounded-lg bg-white p-4 shadow-sm">
                      <div className="mb-2 flex items-center text-cyan-600">
                        <i className="ri-award-line mr-2 text-xl"></i>
                        <span className="font-semibold">
                          {t("dashboard.client.analytics.successPrediction")}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600">
                        {t("dashboard.client.analytics.successPredictionDesc")}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-lg border border-purple-200 bg-white p-4">
                    <h4 className="mb-2 font-medium text-gray-900">
                      {t("dashboard.client.analytics.howItWorks")}
                    </h4>
                    <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                      <div className="flex items-start">
                        <i className="ri-check-line text-primary mt-0.5 mr-2"></i>
                        <span className="text-gray-700">
                          {t("dashboard.client.analytics.analyzeProjects")}
                        </span>
                      </div>
                      <div className="flex items-start">
                        <i className="ri-check-line text-primary mt-0.5 mr-2"></i>
                        <span className="text-gray-700">
                          {t("dashboard.client.analytics.evaluateFreelancers")}
                        </span>
                      </div>
                      <div className="flex items-start">
                        <i className="ri-check-line text-primary mt-0.5 mr-2"></i>
                        <span className="text-gray-700">
                          {t("dashboard.client.analytics.calculateBudget")}
                        </span>
                      </div>
                      <div className="flex items-start">
                        <i className="ri-check-line text-primary mt-0.5 mr-2"></i>
                        <span className="text-gray-700">
                          {t("dashboard.client.analytics.predictSuccess")}
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
                    handleContactFreelancer={
                      project._isFromTransaction && project.freelancer?.id
                        ? () => {
                            const freelancerId = project.freelancer?.id
                            const freelancerName = project.freelancer?.full_name || "Freelancer"
                            // For transaction projects, pass null as projectId (not a valid UUID)
                            const projectId = project._isFromTransaction ? null : project.id
                            if (freelancerId) {
                              handleContactFreelancer(freelancerId, freelancerName, projectId)
                            }
                          }
                        : undefined
                    }
                    handleViewTransaction={
                      project._isFromTransaction ? () => handleViewTransaction(project) : undefined
                    }
                    handleEditProject={() => openEditProjectModal(project)}
                    handleDeleteProject={() => deleteProject(project)}
                  />
                ))}
              </div>
            )}

            {activeTab === "messages" && (
              <div className="space-y-4 sm:space-y-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <h2 className="text-base font-semibold text-gray-900 sm:text-lg sm:text-xl">
                    {t("dashboard.client.messages.title")}
                  </h2>
                  <button
                    onClick={loadConversations}
                    className="bg-primary flex w-full cursor-pointer touch-manipulation items-center justify-center gap-2 rounded-md px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-cyan-700 active:scale-95 sm:w-auto sm:px-4 sm:text-sm"
                  >
                    <i className="ri-refresh-line"></i>
                    <span>{t("common.refresh")}</span>
                  </button>
                </div>

                {conversations.length > 0 ? (
                  <div className="w-full space-y-3 sm:space-y-4">
                    {conversations.map((conversation, idx) => (
                      <ConversationCard
                        key={idx}
                        conversation={conversation}
                        openChat={openChat}
                        user={user}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center sm:py-12">
                    <i className="ri-chat-3-line mb-3 text-4xl text-gray-400 sm:mb-4 sm:text-6xl"></i>
                    <h3 className="mb-2 text-base font-medium text-gray-900 sm:text-lg">
                      {t("dashboard.client.messages.noMessages")}
                    </h3>
                    <p className="px-4 text-sm text-gray-600 sm:text-base">
                      {t("dashboard.client.messages.noMessagesDesc")}
                    </p>
                  </div>
                )}
              </div>
            )}

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
                        {t("dashboard.client.profile.personalInfo")}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="mb-2 text-base font-semibold text-gray-900 sm:text-lg">
                    {t("dashboard.client.profile.personalInfo")}
                  </h3>
                  <p className="text-sm text-gray-700 sm:text-base">
                    {user?.bio || t("dashboard.client.profile.noBio")}
                  </p>
                </div>

                <button
                  onClick={openEditProfileModal}
                  className="bg-primary w-full cursor-pointer rounded-md px-4 py-2 text-sm font-medium whitespace-nowrap text-white transition-colors hover:bg-cyan-700 sm:w-auto sm:px-6 sm:text-base"
                >
                  {t("dashboard.client.profile.editProfile")}
                </button>
              </div>
            )}

            {activeTab === "reviews" && (
              <div className="space-y-4 sm:space-y-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <h2 className="text-base font-semibold text-gray-900 sm:text-lg sm:text-xl">
                    {t("dashboard.client.reviews.title")}
                  </h2>
                  <button
                    onClick={loadPendingReviewsCount}
                    className="bg-primary flex w-full cursor-pointer touch-manipulation items-center justify-center gap-2 rounded-md px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-cyan-700 active:scale-95 sm:w-auto sm:px-4 sm:text-sm"
                  >
                    <i className="ri-refresh-line"></i>
                    <span>{t("common.refresh")}</span>
                  </button>
                </div>

                {pendingReviewsCount > 0 && (
                  <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3 sm:p-4">
                    <div className="flex items-start gap-2 sm:items-center sm:gap-3">
                      <i className="ri-notification-line mt-0.5 shrink-0 text-base text-yellow-600 sm:text-xl"></i>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-sm font-medium text-yellow-800 sm:text-base">
                          {pendingReviewsCount === 1
                            ? t("dashboard.client.reviews.pendingTitleSingular", {
                                count: pendingReviewsCount,
                              })
                            : t("dashboard.client.reviews.pendingTitlePlural", {
                                count: pendingReviewsCount,
                              })}
                        </h4>
                        <p className="mt-1 text-xs text-yellow-700 sm:text-sm">
                          {t("dashboard.client.reviews.pendingDescription")}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <PendingReviews onReviewsUpdate={() => loadPendingReviewsCount()} />
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300" />
                  </div>
                  <div className="relative flex justify-center text-xs sm:text-sm">
                    <span className="bg-white px-2 text-gray-500">
                      {t("dashboard.client.reviews.givenTitle")}
                    </span>
                  </div>
                </div>

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

      {/* Transaction Details Modal */}
      {showTransactionDetails && selectedTransaction && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-black/60 via-black/50 to-black/60 p-0 backdrop-blur-md sm:p-4"
          onClick={() => {
            setShowTransactionDetails(false)
            setSelectedTransaction(null)
          }}
        >
          <div
            className="flex h-screen w-full max-w-full flex-col overflow-hidden bg-white shadow-2xl sm:h-auto sm:max-h-[90vh] sm:max-w-4xl sm:rounded-3xl sm:ring-1 sm:ring-black/5"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modern Header with Gradient */}
            <div className="relative shrink-0 overflow-hidden bg-gradient-to-r from-cyan-600 via-cyan-500 to-teal-500 p-4 text-white sm:p-6 md:p-8">
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIyIi8+PC9nPjwvZz48L3N2Zz4=')] opacity-20"></div>
              <div className="relative z-10 flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1 pr-4">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/20 ring-1 ring-white/30 backdrop-blur-sm sm:h-12 sm:w-12">
                      <i className="ri-money-dollar-circle-line text-lg sm:text-xl md:text-2xl"></i>
                    </div>
                    <div className="min-w-0 flex-1">
                      <h2 className="truncate text-xl leading-tight font-bold sm:text-2xl md:text-3xl">
                        Detalles de la Transacción
                      </h2>
                      <p className="mt-2 truncate text-xs text-cyan-100 sm:text-sm">
                        {selectedTransaction.project_title ||
                          t("dashboard.client.projects.directContract")}
                      </p>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowTransactionDetails(false)
                    setSelectedTransaction(null)
                  }}
                  className="group flex h-10 w-10 shrink-0 cursor-pointer touch-manipulation items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/20 backdrop-blur-sm transition-all hover:scale-110 hover:bg-white/20 active:scale-95 active:bg-white/30"
                  aria-label="Cerrar"
                >
                  <i className="ri-close-line text-xl transition-transform group-hover:rotate-90"></i>
                </button>
              </div>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">
              <div className="space-y-4 sm:space-y-6">
                {/* Transaction Info Cards */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-cyan-50 to-teal-50 p-4 ring-1 ring-cyan-100 transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-cyan-500/10 sm:p-6">
                    <div className="mb-3 flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-teal-500 text-white shadow-lg shadow-cyan-500/30 sm:h-12 sm:w-12">
                        <i className="ri-money-dollar-circle-fill text-lg sm:text-xl"></i>
                      </div>
                      <div className="text-xs font-medium text-cyan-700 sm:text-sm">
                        {t("dashboard.client.transactions.amount")}
                      </div>
                    </div>
                    <p className="text-xl font-bold text-gray-900 sm:text-2xl">
                      ${selectedTransaction.amount} {selectedTransaction.currency.toUpperCase()}
                    </p>
                  </div>

                  <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-50 to-green-50 p-4 ring-1 ring-emerald-100 transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-emerald-500/10 sm:p-6">
                    <div className="mb-3 flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-green-500 text-white shadow-lg shadow-emerald-500/30 sm:h-12 sm:w-12">
                        <i className="ri-checkbox-circle-fill text-lg sm:text-xl"></i>
                      </div>
                      <div className="text-xs font-medium text-emerald-700 sm:text-sm">
                        {t("dashboard.client.transactions.status")}
                      </div>
                    </div>
                    <p
                      className={`text-xl font-bold sm:text-2xl ${
                        selectedTransaction.status === "paid"
                          ? "text-emerald-700"
                          : "text-yellow-700"
                      }`}
                    >
                      {selectedTransaction.status === "paid"
                        ? t("dashboard.client.transactions.paid")
                        : t("dashboard.client.transactions.pending")}
                    </p>
                  </div>
                </div>

                {/* Transaction Details */}
                <div className="rounded-2xl border border-gray-200 bg-gradient-to-br from-gray-50 to-white p-4 shadow-sm sm:p-6">
                  <h3 className="mb-4 text-base font-bold text-gray-900 sm:text-xl">
                    Información de la Transacción
                  </h3>
                  <div className="space-y-3 sm:space-y-4">
                    <div className="flex flex-col gap-2 border-b border-gray-200 pb-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <i className="ri-file-text-line text-base text-cyan-600 sm:text-lg"></i>
                        <span className="text-xs font-medium text-gray-700 sm:text-sm">
                          Título del Proyecto
                        </span>
                      </div>
                      <span className="text-left text-sm font-semibold break-words text-gray-900 sm:text-right">
                        {selectedTransaction.project_title || "N/A"}
                      </span>
                    </div>

                    {selectedTransaction.project_description && (
                      <div className="flex flex-col gap-2 border-b border-gray-200 pb-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <i className="ri-file-list-3-line text-base text-cyan-600 sm:text-lg"></i>
                          <span className="text-xs font-medium text-gray-700 sm:text-sm">
                            Descripción
                          </span>
                        </div>
                        <span className="max-w-md text-left text-xs break-words text-gray-600 sm:text-right sm:text-sm">
                          {selectedTransaction.project_description}
                        </span>
                      </div>
                    )}

                    <div className="flex flex-col gap-2 border-b border-gray-200 pb-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <i className="ri-calendar-line text-base text-cyan-600 sm:text-lg"></i>
                        <span className="text-xs font-medium text-gray-700 sm:text-sm">
                          Fecha de Creación
                        </span>
                      </div>
                      <span className="text-left text-xs text-gray-600 sm:text-right sm:text-sm">
                        {selectedTransaction.created_at
                          ? new Date(selectedTransaction.created_at).toLocaleDateString("es-ES", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })
                          : "N/A"}
                      </span>
                    </div>

                    {selectedTransaction.paid_at && (
                      <div className="flex flex-col gap-2 border-b border-gray-200 pb-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <i className="ri-checkbox-circle-line text-base text-cyan-600 sm:text-lg"></i>
                          <span className="text-xs font-medium text-gray-700 sm:text-sm">
                            Fecha de Pago
                          </span>
                        </div>
                        <span className="text-left text-xs text-gray-600 sm:text-right sm:text-sm">
                          {new Date(selectedTransaction.paid_at).toLocaleDateString("es-ES", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </span>
                      </div>
                    )}

                    {selectedTransaction.stripe_session_id && (
                      <div className="flex flex-col gap-2 pb-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <i className="ri-bank-card-line text-base text-cyan-600 sm:text-lg"></i>
                          <span className="text-xs font-medium text-gray-700 sm:text-sm">
                            ID de Sesión Stripe
                          </span>
                        </div>
                        <span className="max-w-md text-left font-mono text-xs break-all text-gray-600 sm:text-right">
                          {selectedTransaction.stripe_session_id}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Proposals Modal - RESPONSIVE */}
      {showProposalsModal && selectedProject && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-black/60 via-black/50 to-black/60 p-0 backdrop-blur-md sm:p-4"
          onClick={() => setShowProposalsModal(false)}
        >
          <div
            className="flex h-screen w-full max-w-full flex-col overflow-hidden bg-white shadow-2xl sm:h-auto sm:max-h-[90vh] sm:max-w-5xl sm:rounded-3xl sm:ring-1 sm:ring-black/5"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modern Header with Gradient */}
            <div className="relative shrink-0 overflow-hidden bg-gradient-to-r from-cyan-600 via-cyan-500 to-teal-500 p-4 text-white sm:p-6 md:p-8">
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIyIi8+PC9nPjwvZz48L3N2Zz4=')] opacity-20"></div>
              <div className="relative z-10 flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1 pr-4">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/20 ring-1 ring-white/30 backdrop-blur-sm sm:h-12 sm:w-12">
                      <i className="ri-mail-line text-lg sm:text-xl md:text-2xl"></i>
                    </div>
                    <div className="min-w-0 flex-1">
                      <h2 className="truncate text-xl leading-tight font-bold sm:text-2xl md:text-3xl">
                        Propuestas Recibidas
                      </h2>
                      <p className="mt-2 truncate text-xs text-cyan-100 sm:text-sm">
                        {selectedProject.title}
                      </p>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setShowProposalsModal(false)}
                  className="group flex h-10 w-10 shrink-0 cursor-pointer touch-manipulation items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/20 backdrop-blur-sm transition-all hover:scale-110 hover:bg-white/20 active:scale-95 active:bg-white/30"
                  aria-label="Cerrar"
                >
                  <i className="ri-close-line text-xl transition-transform group-hover:rotate-90"></i>
                </button>
              </div>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">
              <div className="mb-4 rounded-2xl border border-cyan-200 bg-gradient-to-br from-cyan-50 to-teal-50 p-3 shadow-sm sm:mb-6 sm:p-6">
                <div className="flex items-start">
                  <div className="mr-3 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 sm:mr-4 sm:h-12 sm:w-12">
                    <i className="ri-message-3-line text-primary text-base sm:text-xl"></i>
                  </div>
                  <div className="flex-1">
                    <div className="rounded-lg border border-blue-200 bg-white p-3 sm:p-4">
                      <div className="space-y-2 sm:space-y-3">
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
                          <p className="text-sm leading-relaxed whitespace-pre-wrap text-gray-900 sm:text-base">
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
                                ? t("dashboard.client.common.hourlyPrice")
                                : t("dashboard.client.common.fixedPrice")}
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
                                {selectedProject.required_skills.map((skill, index) => {
                                  const skillName =
                                    typeof skill === "string" ? skill : skill || skill
                                  return (
                                    <span
                                      key={index}
                                      className="rounded-full bg-blue-100 px-2 py-1 text-xs font-medium whitespace-nowrap text-cyan-800 sm:px-3 sm:text-sm"
                                    >
                                      {skillName}
                                    </span>
                                  )
                                })}
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

              <div className="space-y-3 sm:space-y-4">
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
      {showNewProjectModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-black/60 via-black/50 to-black/60 p-0 backdrop-blur-md sm:p-4"
          onClick={() => setShowNewProjectModal(false)}
        >
          <div
            className="flex h-screen w-full max-w-full flex-col overflow-hidden bg-white shadow-2xl sm:h-auto sm:max-h-[90vh] sm:max-w-3xl sm:rounded-3xl sm:ring-1 sm:ring-black/5"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modern Header with Gradient */}
            <div className="relative shrink-0 overflow-hidden bg-gradient-to-r from-cyan-600 via-cyan-500 to-teal-500 p-4 text-white sm:p-6 md:p-8">
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIyIi8+PC9nPjwvZz48L3N2Zz4=')] opacity-20"></div>
              <div className="relative z-10 flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1 pr-4">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/20 ring-1 ring-white/30 backdrop-blur-sm sm:h-12 sm:w-12">
                      <i className="ri-add-circle-line text-lg sm:text-xl md:text-2xl"></i>
                    </div>
                    <div className="min-w-0 flex-1">
                      <h2 className="truncate text-xl leading-tight font-bold sm:text-2xl md:text-3xl">
                        {t("dashboard.client.modals.newProject.title")}
                      </h2>
                      <p className="mt-2 text-xs text-cyan-100 sm:text-sm">
                        {t("dashboard.client.modals.newProject.subtitle")}
                      </p>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setShowNewProjectModal(false)}
                  className="group flex h-10 w-10 shrink-0 cursor-pointer touch-manipulation items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/20 backdrop-blur-sm transition-all hover:scale-110 hover:bg-white/20 active:scale-95 active:bg-white/30"
                  aria-label={t("common.close")}
                >
                  <i className="ri-close-line text-xl transition-transform group-hover:rotate-90"></i>
                </button>
              </div>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">
              <form
                id="new-project-form"
                onSubmit={createProject}
                className="space-y-4 sm:space-y-6"
              >
                <div>
                  <label className="mb-2 block text-xs font-medium text-gray-700 sm:text-sm">
                    {t("dashboard.client.modals.newProject.projectTitle")}
                  </label>
                  <input
                    type="text"
                    required
                    value={newProject.title}
                    onChange={(e) => setNewProject({ ...newProject, title: e.target.value })}
                    className="focus:ring-primary focus:border-primary min-h-[44px] w-full rounded-md border border-gray-300 px-3 py-3 text-base focus:outline-none sm:py-2 sm:text-sm"
                    placeholder={t("dashboard.client.modals.newProject.projectTitlePlaceholder")}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-medium text-gray-700 sm:text-sm">
                    {t("dashboard.client.modals.newProject.description")}
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
                    className="focus:ring-primary focus:border-primary min-h-[44px] w-full rounded-md border border-gray-300 px-3 py-3 text-base focus:outline-none sm:py-2 sm:text-sm"
                    placeholder={t("dashboard.client.modals.newProject.descriptionPlaceholder")}
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-xs font-medium text-gray-700 sm:text-sm">
                      {t("dashboard.client.modals.newProject.budgetMin")}
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
                      className="focus:ring-primary focus:border-primary min-h-[44px] w-full rounded-md border border-gray-300 px-3 py-3 text-base focus:outline-none sm:py-2 sm:text-sm"
                      placeholder={t("dashboard.client.modals.newProject.budgetMinPlaceholder")}
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-xs font-medium text-gray-700 sm:text-sm">
                      {t("dashboard.client.modals.newProject.budgetMax")}
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
                      className="focus:ring-primary focus:border-primary min-h-[44px] w-full rounded-md border border-gray-300 px-3 py-3 text-base focus:outline-none sm:py-2 sm:text-sm"
                      placeholder={t("dashboard.client.modals.newProject.budgetMaxPlaceholder")}
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-xs font-medium text-gray-700 sm:text-sm">
                    {t("dashboard.client.modals.newProject.projectType")}
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
                    <option value="fixed">{t("dashboard.client.modals.newProject.fixed")}</option>
                    <option value="hourly">{t("dashboard.client.modals.newProject.hourly")}</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-xs font-medium text-gray-700 sm:text-sm">
                    {t("dashboard.client.modals.newProject.requiredSkills")}
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
                      placeholder={t("dashboard.client.modals.newProject.skillsPlaceholder")}
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
                    <p className="text-xs text-gray-600 sm:text-sm">
                      {t("dashboard.client.common.popularSkills")}
                    </p>
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
                    {t("dashboard.client.modals.newProject.deadline")}
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
                    className="focus:ring-primary focus:border-primary min-h-[44px] w-full rounded-md border border-gray-300 px-3 py-3 text-base focus:outline-none sm:py-2 sm:text-sm"
                    min={new Date().toISOString().split("T")[0]}
                  />
                </div>
              </form>
            </div>

            <div className="flex shrink-0 flex-col gap-3 border-t border-gray-200 bg-gradient-to-b from-white to-gray-50 p-4 sm:flex-row sm:gap-4 sm:p-6">
              <button
                type="button"
                onClick={() => setShowNewProjectModal(false)}
                className="group flex flex-1 cursor-pointer touch-manipulation items-center justify-center gap-2 rounded-xl border-2 border-gray-300 bg-white px-4 py-3 font-semibold text-gray-700 transition-all hover:-translate-y-0.5 hover:border-gray-400 hover:bg-gray-50 hover:shadow-md active:scale-95 sm:px-6"
              >
                <i className="ri-close-line"></i>
                <span className="text-sm sm:text-base">{t("dashboard.client.common.cancel")}</span>
              </button>
              <button
                type="submit"
                form="new-project-form"
                className="group flex flex-1 cursor-pointer touch-manipulation items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 px-4 py-3 font-semibold text-white shadow-lg shadow-cyan-500/30 transition-all hover:-translate-y-0.5 hover:scale-[1.02] hover:shadow-xl hover:shadow-cyan-500/40 active:scale-95 sm:px-6"
              >
                <i className="ri-add-circle-fill text-lg transition-transform group-hover:scale-110"></i>
                <span className="text-sm sm:text-base">
                  {t("dashboard.client.common.createProject")}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {showProjectManagement && selectedProjectForManagement && (
        <ProjectManagement
          projectId={selectedProjectForManagement.id}
          userType="client"
          onClose={() => {
            setShowProjectManagement(false)
            setSelectedProjectForManagement(null)
            loadProjects()
          }}
        />
      )}

      {showEditProfileModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-black/60 via-black/50 to-black/60 p-0 backdrop-blur-md sm:p-4"
          onClick={() => setShowEditProfileModal(false)}
        >
          <div
            className="flex h-screen w-full max-w-full flex-col overflow-hidden bg-white shadow-2xl sm:h-auto sm:max-h-[90vh] sm:max-w-3xl sm:rounded-3xl sm:ring-1 sm:ring-black/5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative shrink-0 overflow-hidden bg-gradient-to-r from-cyan-600 via-cyan-500 to-teal-500 p-4 text-white sm:p-6 md:p-8">
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIyIi8+PC9nPjwvZz48L3N2Zz4=')] opacity-20"></div>
              <div className="relative z-10 flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1 pr-4">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/20 ring-1 ring-white/30 backdrop-blur-sm sm:h-12 sm:w-12">
                      <i className="ri-user-settings-line text-xl sm:text-2xl"></i>
                    </div>
                    <div className="min-w-0 flex-1">
                      <h2 className="truncate text-xl leading-tight font-bold sm:text-2xl md:text-3xl">
                        {t("dashboard.client.modals.editProfile.title")}
                      </h2>
                      <p className="mt-2 text-xs text-cyan-100 sm:text-sm">
                        {t("dashboard.client.modals.editProfile.subtitle")}
                      </p>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setShowEditProfileModal(false)}
                  className="group flex h-10 w-10 shrink-0 cursor-pointer touch-manipulation items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/20 backdrop-blur-sm transition-all hover:scale-110 hover:bg-white/20 active:scale-95 active:bg-white/30"
                  aria-label={t("common.close")}
                >
                  <i className="ri-close-line text-xl transition-transform group-hover:rotate-90"></i>
                </button>
              </div>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">
              <form
                id="edit-profile-form"
                onSubmit={updateProfile}
                className="space-y-4 sm:space-y-6"
              >
                <div>
                  <label className="mb-2 block text-xs font-medium text-gray-700 sm:text-sm">
                    {t("dashboard.client.modals.editProfile.fullName")}
                  </label>
                  <input
                    type="text"
                    required
                    value={editProfileForm.full_name}
                    onChange={(e) =>
                      setEditProfileForm({ ...editProfileForm, full_name: e.target.value })
                    }
                    className="focus:ring-primary focus:border-primary min-h-[44px] w-full rounded-md border border-gray-300 px-3 py-3 text-base focus:outline-none sm:py-2 sm:text-sm"
                    placeholder={t("dashboard.client.modals.editProfile.fullNamePlaceholder")}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-medium text-gray-700 sm:text-sm">
                    {t("dashboard.client.modals.editProfile.location")}
                  </label>
                  <input
                    type="text"
                    value={editProfileForm.location}
                    onChange={(e) =>
                      setEditProfileForm({ ...editProfileForm, location: e.target.value })
                    }
                    className="focus:ring-primary focus:border-primary min-h-[44px] w-full rounded-md border border-gray-300 px-3 py-3 text-base focus:outline-none sm:py-2 sm:text-sm"
                    placeholder={t("dashboard.client.modals.editProfile.locationPlaceholder")}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-medium text-gray-700 sm:text-sm">
                    {t("dashboard.client.modals.editProfile.bio")}
                  </label>
                  <textarea
                    rows={4}
                    value={editProfileForm.bio}
                    onChange={(e) =>
                      setEditProfileForm({ ...editProfileForm, bio: e.target.value })
                    }
                    className="focus:ring-primary focus:border-primary min-h-[44px] w-full rounded-md border border-gray-300 px-3 py-3 text-base focus:outline-none sm:py-2 sm:text-sm"
                    placeholder={t("dashboard.client.modals.editProfile.bioPlaceholder")}
                  />
                </div>
              </form>
            </div>

            <div className="flex shrink-0 flex-col gap-3 border-t border-gray-200 bg-gradient-to-b from-white to-gray-50 p-4 sm:flex-row sm:gap-4 sm:p-6">
              <button
                type="button"
                onClick={() => setShowEditProfileModal(false)}
                disabled={updatingProfile}
                className="group flex flex-1 cursor-pointer touch-manipulation items-center justify-center gap-2 rounded-xl border-2 border-gray-300 bg-white px-4 py-3 font-semibold text-gray-700 transition-all hover:-translate-y-0.5 hover:border-gray-400 hover:bg-gray-50 hover:shadow-md active:scale-95 disabled:opacity-50 disabled:hover:translate-y-0 disabled:active:scale-100 sm:px-6"
              >
                <i className="ri-close-line text-base sm:text-lg"></i>
                <span className="text-sm sm:text-base">{t("dashboard.client.common.cancel")}</span>
              </button>
              <button
                type="submit"
                form="edit-profile-form"
                disabled={updatingProfile}
                className="group flex flex-1 cursor-pointer touch-manipulation items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 px-4 py-3 font-semibold text-white shadow-lg shadow-cyan-500/30 transition-all hover:-translate-y-0.5 hover:scale-[1.02] hover:shadow-xl hover:shadow-cyan-500/40 active:scale-95 disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:scale-100 disabled:active:scale-100 sm:px-6"
              >
                {updatingProfile ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-white"></div>
                    <span className="text-sm sm:text-base">
                      {t("dashboard.client.common.saving")}
                    </span>
                  </>
                ) : (
                  <>
                    <i className="ri-save-line text-base transition-transform group-hover:scale-110 sm:text-lg"></i>
                    <span className="text-sm sm:text-base">
                      {t("dashboard.client.common.saveChanges")}
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {showEditProjectModal && editingProject && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-black/60 via-black/50 to-black/60 p-0 backdrop-blur-md sm:p-4"
          onClick={() => {
            setShowEditProjectModal(false)
            setEditingProject(null)
          }}
        >
          <div
            className="flex h-screen w-full max-w-full flex-col overflow-hidden bg-white shadow-2xl sm:h-auto sm:max-h-[90vh] sm:max-w-3xl sm:rounded-3xl sm:ring-1 sm:ring-black/5"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modern Header with Gradient */}
            <div className="relative shrink-0 overflow-hidden bg-gradient-to-r from-cyan-600 via-cyan-500 to-teal-500 p-4 text-white sm:p-6 md:p-8">
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIyIi8+PC9nPjwvZz48L3N2Zz4=')] opacity-20"></div>
              <div className="relative z-10 flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1 pr-4">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/20 ring-1 ring-white/30 backdrop-blur-sm sm:h-12 sm:w-12">
                      <i className="ri-edit-line text-lg sm:text-xl md:text-2xl"></i>
                    </div>
                    <div className="min-w-0 flex-1">
                      <h2 className="truncate text-xl leading-tight font-bold sm:text-2xl md:text-3xl">
                        Editar Proyecto
                      </h2>
                      <p className="mt-2 text-xs text-cyan-100 sm:text-sm">
                        Actualiza la información de tu proyecto
                      </p>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowEditProjectModal(false)
                    setEditingProject(null)
                  }}
                  className="group flex h-10 w-10 shrink-0 cursor-pointer touch-manipulation items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/20 backdrop-blur-sm transition-all hover:scale-110 hover:bg-white/20 active:scale-95 active:bg-white/30"
                  aria-label="Cerrar"
                >
                  <i className="ri-close-line text-xl transition-transform group-hover:rotate-90"></i>
                </button>
              </div>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">
              <form
                id="edit-project-form"
                onSubmit={updateProject}
                className="space-y-4 sm:space-y-6"
              >
                <div>
                  <label className="mb-2 block text-xs font-medium text-gray-700 sm:text-sm">
                    Título del Proyecto
                  </label>
                  <input
                    type="text"
                    required
                    value={editProjectForm.title}
                    onChange={(e) =>
                      setEditProjectForm({ ...editProjectForm, title: e.target.value })
                    }
                    className="focus:ring-primary focus:border-primary min-h-[44px] w-full rounded-md border border-gray-300 px-3 py-3 text-base focus:outline-none sm:py-2 sm:text-sm"
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
                    value={editProjectForm.description}
                    onChange={(e) =>
                      setEditProjectForm({
                        ...editProjectForm,
                        description: e.target.value,
                      })
                    }
                    className="focus:ring-primary focus:border-primary min-h-[44px] w-full rounded-md border border-gray-300 px-3 py-3 text-base focus:outline-none sm:py-2 sm:text-sm"
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
                      value={editProjectForm.budget_min}
                      onChange={(e) =>
                        setEditProjectForm({
                          ...editProjectForm,
                          budget_min: e.target.value,
                        })
                      }
                      className="focus:ring-primary focus:border-primary min-h-[44px] w-full rounded-md border border-gray-300 px-3 py-3 text-base focus:outline-none sm:py-2 sm:text-sm"
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
                      value={editProjectForm.budget_max}
                      onChange={(e) =>
                        setEditProjectForm({
                          ...editProjectForm,
                          budget_max: e.target.value,
                        })
                      }
                      className="focus:ring-primary focus:border-primary min-h-[44px] w-full rounded-md border border-gray-300 px-3 py-3 text-base focus:outline-none sm:py-2 sm:text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-xs font-medium text-gray-700 sm:text-sm">
                    Tipo de Proyecto
                  </label>
                  <select
                    value={editProjectForm.project_type}
                    onChange={(e) =>
                      setEditProjectForm({
                        ...editProjectForm,
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
                    {editProjectForm.required_skills.map((skill) => (
                      <span
                        key={skill}
                        className="flex items-center rounded-full bg-blue-100 px-2 py-1 text-xs text-cyan-800 sm:px-3 sm:text-sm"
                      >
                        {skill}
                        <button
                          type="button"
                          onClick={() => removeEditSkill(skill)}
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
                      value={editSkillInput}
                      onChange={(e) => setEditSkillInput(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault()
                          addEditSkill(editSkillInput.trim())
                        }
                      }}
                      className="focus:ring-primary focus:border-primary flex-1 rounded-l-md border border-gray-300 px-3 py-2 text-sm focus:outline-none sm:text-base"
                      placeholder="Añadir habilidad (presiona Enter)"
                    />
                    <button
                      type="button"
                      onClick={() => addEditSkill(editSkillInput.trim())}
                      className="bg-primary cursor-pointer rounded-r-md px-3 py-2 text-white transition-colors hover:bg-cyan-700 sm:px-4"
                    >
                      <i className="ri-add-line"></i>
                    </button>
                  </div>
                  <div className="mt-2">
                    <p className="text-xs text-gray-600 sm:text-sm">
                      {t("dashboard.client.common.popularSkills")}
                    </p>
                    <div className="mt-1 flex flex-wrap gap-1 sm:gap-2">
                      {popularSkills.map((skill) => (
                        <button
                          key={skill}
                          type="button"
                          onClick={() => addEditSkill(skill)}
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
                    value={editProjectForm.deadline}
                    onChange={(e) =>
                      setEditProjectForm({
                        ...editProjectForm,
                        deadline: e.target.value,
                      })
                    }
                    className="focus:ring-primary focus:border-primary min-h-[44px] w-full rounded-md border border-gray-300 px-3 py-3 text-base focus:outline-none sm:py-2 sm:text-sm"
                    min={new Date().toISOString().split("T")[0]}
                  />
                </div>
              </form>
            </div>

            <div className="flex shrink-0 flex-col gap-3 border-t border-gray-200 bg-gradient-to-b from-white to-gray-50 p-4 sm:flex-row sm:gap-4 sm:p-6">
              <button
                type="button"
                onClick={() => {
                  setShowEditProjectModal(false)
                  setEditingProject(null)
                }}
                disabled={updatingProject}
                className="group flex flex-1 cursor-pointer touch-manipulation items-center justify-center gap-2 rounded-xl border-2 border-gray-300 bg-white px-4 py-3 font-semibold text-gray-700 transition-all hover:-translate-y-0.5 hover:border-gray-400 hover:bg-gray-50 hover:shadow-md active:scale-95 disabled:opacity-50 disabled:hover:translate-y-0 disabled:active:scale-100 sm:px-6"
              >
                <i className="ri-close-line"></i>
                <span className="text-sm sm:text-base">{t("dashboard.client.common.cancel")}</span>
              </button>
              <button
                type="submit"
                form="edit-project-form"
                disabled={updatingProject}
                className="group flex flex-1 cursor-pointer touch-manipulation items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 px-4 py-3 font-semibold text-white shadow-lg shadow-cyan-500/30 transition-all hover:-translate-y-0.5 hover:scale-[1.02] hover:shadow-xl hover:shadow-cyan-500/40 active:scale-95 disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:scale-100 disabled:active:scale-100 sm:px-6"
              >
                {updatingProject ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-white"></div>
                    <span className="text-sm sm:text-base">
                      {t("dashboard.client.common.saving")}
                    </span>
                  </>
                ) : (
                  <>
                    <i className="ri-save-line text-lg transition-transform group-hover:scale-110"></i>
                    <span className="text-sm sm:text-base">
                      {t("dashboard.client.common.saveChanges")}
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}



