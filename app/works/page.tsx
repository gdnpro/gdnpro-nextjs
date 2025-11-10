"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useTranslation } from "react-i18next"
import { supabaseBrowser } from "@/utils/supabase/client"
import { useAuth } from "@/contexts/AuthContext"
import type { Project } from "@/interfaces/Project"
import type { Proposal } from "@/interfaces/Proposal"
import { Conversation } from "@/interfaces/Conversation"
import { ChatMessage } from "@/interfaces/ChatMessage"
import { ConversationModal } from "@/components/ConversationModal"
import WorksHero from "@/components/works/WorksHero"
import WorksStats from "@/components/works/WorksStats"
import WorksSearch from "@/components/works/WorksSearch"
import WorksGrid from "@/components/works/WorksGrid"
import WorksProposalModal from "@/components/works/WorksProposalModal"
import ProjectDetailsModal from "@/components/dashboard/ProjectDetailsModal"

const supabase = supabaseBrowser()

export default function Works() {
  const { t } = useTranslation()
  const { profile, loading: authLoading } = useAuth()
  const router = useRouter()
  const [projects, setProjects] = useState<Project[]>([])
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [showProposalModal, setShowProposalModal] = useState(false)
  const [showProjectDetailsModal, setShowProjectDetailsModal] = useState(false)
  const [showChat, setShowChat] = useState(false)
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [chatLoading, setChatLoading] = useState(false)
  const [sendingMessage, setSendingMessage] = useState(false)
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [searchFilters, setSearchFilters] = useState({
    search: "",
    category: "",
    budget: "",
    deadline: "",
  })
  const ITEMS_PER_PAGE = 12

  useEffect(() => {
    document.title = t("works.pageTitle")
    window.scrollTo(0, 0)
  }, [t])

  useEffect(() => {
    // Redirect if not a freelancer
    if (!authLoading && profile?.user_type !== "freelancer") {
      router.push("/freelancers")
    } else if (!authLoading && profile?.user_type === "freelancer") {
      loadData(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile, authLoading, router])

  useEffect(() => {
    // Reset pagination when filters change
    setPage(0)
    setHasMore(true)
    if (profile?.user_type === "freelancer") {
      loadData(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchFilters])

  const loadData = async (reset = false) => {
    try {
      if (!profile) return

      if (reset) {
        setLoading(true)
        setPage(0)
        setHasMore(true)
      } else {
        setLoadingMore(true)
      }

      const from = reset ? 0 : page * ITEMS_PER_PAGE
      const to = from + ITEMS_PER_PAGE - 1

      // Load available projects excluding those with accepted proposals
      const {
        data: projectsData,
        error,
        count,
      } = await supabase
        .from("projects")
        .select(
          `
          *,
          client:profiles!projects_client_id_fkey(id, full_name, rating, email)
        `,
        )
        .eq("status", "open")
        .is("freelancer_id", null) // Without freelancer assigned
        .order("created_at", { ascending: false })
        .range(from, to)

      // Get IDs of projects with accepted proposals
      const { data: acceptedProposals } = await supabase
        .from("proposals")
        .select("project_id")
        .eq("status", "accepted")

      const acceptedProjectIds = acceptedProposals?.map((p: Proposal) => p.project_id) || []

      // Filter projects that don't have accepted proposals
      const filteredProjects =
        projectsData?.filter((project: Project) => !acceptedProjectIds.includes(project.id)) || []

      setProjects(filteredProjects)

      // Load my proposals
      if (profile.id) {
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
              created_at
            )
          `,
          )
          .eq("freelancer_id", profile.id)
          .order("created_at", { ascending: false })

        if (proposalsError) {
          console.error("Error loading proposals:", proposalsError)
        } else {
          setProposals(proposalsData || [])
        }
      }
    } catch (error) {
      console.error("Error loading data:", error)
      if (reset) {
        setProjects([])
      }
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  const loadMoreProjects = () => {
    if (!loadingMore && hasMore) {
      loadData(false)
    }
  }

  useEffect(() => {
    const handleScroll = () => {
      if (
        !loadingMore &&
        hasMore &&
        window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 1000
      ) {
        loadMoreProjects()
      }
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadingMore, hasMore])

  const sendProposal = async (projectId: string) => {
    const project = projects.find((p) => p.id === projectId)
    if (project) {
      setSelectedProject(project)
      setShowProposalModal(true)
    }
  }

  const submitProposal = async (formData: {
    budget: string
    delivery_time: string
    message: string
  }) => {
    if (!selectedProject || !profile) return

    try {
      const { data, error } = await supabase
        .from("proposals")
        .insert({
          project_id: selectedProject.id,
          freelancer_id: profile.id,
          proposed_budget: parseFloat(formData.budget),
          delivery_time: parseInt(formData.delivery_time),
          message: formData.message,
          status: "pending",
        })
        .select()
        .single()

      if (error) throw error

      window.toast({
        title: t("works.proposal.success"),
        type: "success",
        location: "bottom-center",
        dismissible: true,
        icon: true,
      })

      setShowProposalModal(false)
      loadData() // Reload data
    } catch (error) {
      window.toast({
        title: t("works.proposal.error"),
        type: "error",
        location: "bottom-center",
        dismissible: true,
        icon: true,
      })
      console.error("Error sending proposal:", error)
    }
  }

  const loadMessages = async (conversationId: string) => {
    try {
      const session = await supabase.auth.getSession()
      if (!session.data.session?.access_token) {
        throw new Error(t("works.errors.noSession"))
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
        throw new Error(t("works.errors.noSession"))
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
        if (data.flagged) {
          window.toast({
            title: t("works.chat.contactInfoWarning"),
            type: "info",
            location: "bottom-center",
            dismissible: true,
            icon: true,
          })
        }
      } else {
        throw new Error(data.error || t("works.chat.unknownError"))
      }
    } catch (error: unknown) {
      window.toast({
        title: t("works.chat.sendError"),
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

  const startChat = async (projectId: string, clientId: string) => {
    if (!profile) {
      window.toast({
        title: t("works.chat.loginRequired"),
        type: "warning",
        location: "bottom-center",
        dismissible: true,
        icon: true,
      })
      return
    }

    setShowChat(true)
    setChatLoading(true)

    try {
      const session = await supabase.auth.getSession()
      if (!session.data.session?.access_token) {
        throw new Error(t("works.errors.noSession"))
      }

      // Find the project to get client info
      const project = projects.find((p) => p.id === projectId)

      // First, check if a conversation already exists
      const checkResponse = await fetch(
        "https://kdmdhhhppizzlhvauofe.supabase.co/functions/v1/chat-handler",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.data.session.access_token}`,
          },
          body: JSON.stringify({
            action: "get-conversations",
            userId: profile.id,
            userType: "freelancer",
          }),
        },
      )

      let conversation: Conversation | null = null

      if (checkResponse.ok) {
        const checkData = await checkResponse.json()
        if (checkData.success && checkData.conversations) {
          // Find existing conversation with this client and project
          conversation = checkData.conversations.find(
            (conv: Conversation) => conv.client_id === clientId && conv.project_id === projectId,
          )
        }
      }

      // If no existing conversation, create a new one
      if (!conversation) {
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
              freelancerId: profile.id,
            }),
          },
        )

        if (!response.ok) {
          const errorText = await response.text()
          throw new Error(`Error ${response.status}: ${errorText}`)
        }

        const data = await response.json()

        if (data.success) {
          conversation = {
            id: data.conversation.id,
            client_id: clientId,
            freelancer_id: profile.id,
            project_id: projectId,
            updated_at: new Date().toISOString(),
            client: {
              full_name: project?.client?.full_name || t("works.client"),
              avatar_url: project?.client?.avatar_url,
            },
            project: project
              ? {
                  title: project.title,
                }
              : undefined,
          }
        } else {
          throw new Error(data.error || t("works.chat.createError"))
        }
      } else {
        // Ensure conversation has client and project info
        if (project) {
          conversation.client = {
            full_name:
              project.client?.full_name || conversation.client?.full_name || t("works.client"),
            avatar_url: project.client?.avatar_url || conversation.client?.avatar_url,
          }
          conversation.project = {
            title: project.title,
          }
        }
      }

      // Set the conversation and load messages
      setSelectedConversation(conversation)
      await loadMessages(conversation.id)
    } catch (error) {
      window.toast({
        title: t("works.chat.startError"),
        type: "error",
        location: "bottom-center",
        dismissible: true,
        icon: true,
      })
      console.error("Error starting chat:", error)
      setShowChat(false)
      setSelectedConversation(null)
    } finally {
      setChatLoading(false)
    }
  }

  const viewProjectDetails = (project: Project) => {
    setSelectedProject(project)
    setShowProjectDetailsModal(true)
  }

  const handleFiltersChange = (filters: typeof searchFilters) => {
    setSearchFilters(filters)
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20">
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <div className="border-primary mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2"></div>
            <p className="text-gray-600">{t("works.loading")}</p>
          </div>
        </div>
      </div>
    )
  }

  if (profile?.user_type !== "freelancer") {
    return null
  }

  return (
    <>
      <WorksHero />
      <WorksStats />
      <WorksSearch onFiltersChange={handleFiltersChange} />
      <WorksGrid
        projects={projects}
        proposals={proposals}
        loading={loading}
        loadingMore={loadingMore}
        hasMore={hasMore}
        onSendProposal={sendProposal}
        onStartChat={startChat}
        onViewProjectDetails={viewProjectDetails}
        searchFilters={searchFilters}
      />
      <WorksProposalModal
        project={selectedProject}
        isOpen={showProposalModal}
        onClose={() => setShowProposalModal(false)}
        onSubmit={submitProposal}
      />
      <ProjectDetailsModal
        project={selectedProject}
        isOpen={showProjectDetailsModal}
        onClose={() => {
          setShowProjectDetailsModal(false)
          setSelectedProject(null)
        }}
        onSendProposal={sendProposal}
        onStartChat={startChat}
        showSendProposal={true}
        showStartChat={true}
        hasProposal={proposals.some((p) => p.project_id === selectedProject?.id)}
        variant="works"
      />
      {showChat && selectedConversation && (
        <ConversationModal
          selectedConversation={selectedConversation}
          setShowChat={setShowChat}
          setChatMessages={setChatMessages}
          setSelectedConversation={setSelectedConversation}
          setNewMessage={setNewMessage}
          chatLoading={chatLoading}
          chatMessages={chatMessages}
          user={profile}
          newMessage={newMessage}
          handleKeyPress={handleKeyPress}
          sendingMessage={sendingMessage}
          sendMessage={sendMessage}
        />
      )}
    </>
  )
}
