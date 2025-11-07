"use client"

import { useState, useEffect } from "react"
import { removeAccents } from "@/libs/removeAccents"
import Layout from "@/components/Layout"
import type { Profile } from "@/interfaces/Profile"
import type { Conversation } from "@/interfaces/Conversation"
import type { ChatMessage } from "@/interfaces/ChatMessage"
import { useRouter, usePathname, useParams } from "next/navigation"
import { supabaseBrowser } from "@/utils/supabase/client"
import { ReviewsDisplayPublic } from "@/components/dashboard/ReviewsDisplayPublic"
import { ConversationModal } from "@/components/ConversationModal"
import { useAuth } from "@/contexts/AuthContext"

const supabase = supabaseBrowser()

export default function FreelancerProfilePage() {
  const { slug } = useParams()
  const navigate = useRouter()
  const { profile: currentUser, loading: authLoading } = useAuth()
  const [freelancer, setFreelancer] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")
  const [showContactModal, setShowContactModal] = useState(false)
  const [showShareMenu, setShowShareMenu] = useState(false)

  // Conversation states
  const [showChat, setShowChat] = useState(false)
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [chatLoading, setChatLoading] = useState(false)
  const [sendingMessage, setSendingMessage] = useState(false)

  useEffect(() => {
    document.title = "Freelancer | GDN Pro"
  }, [])

  useEffect(() => {
    loadFreelancerProfile()
  }, [slug])

  // Close share menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (showShareMenu && !target.closest(".share-menu-container")) {
        setShowShareMenu(false)
      }
    }

    if (showShareMenu) {
      document.addEventListener("mousedown", handleClickOutside)
      return () => {
        document.removeEventListener("mousedown", handleClickOutside)
      }
    }
  }, [showShareMenu])

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (showChat || showContactModal) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = ""
    }
  }, [showChat, showContactModal])
  // 🔹 Estado para los proyectos completados
  const [completedProjects, setCompletedProjects] = useState(0)

  // 🔹 Cargar proyectos completados cuando el freelancer esté disponible
  useEffect(() => {
    if (freelancer?.id) {
      loadCompletedProjects(freelancer.id)
    }
  }, [freelancer])

  // 🔹 Función para contar proyectos completados desde Supabase
  const loadCompletedProjects = async (freelancerId: string) => {
    try {
      const { data, error } = await supabase
        .from("projects")
        .select("id, status")
        .eq("freelancer_id", freelancerId)
        .eq("status", "completed")

      if (error) throw error

      setCompletedProjects(data?.length || 0)
    } catch (err) {
      console.error("Error al cargar proyectos completados:", err)
    }
  }

  const loadFreelancerProfile = async () => {
    try {
      setLoading(true)

      // Buscar por slug en la base de datos
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_type", "freelancer")

      if (error) throw error

      // Buscar el freelancer que coincida con el slug
      const matchedFreelancer = profiles?.find((profile: Profile) => {
        const profileSlug = profile.full_name?.toLowerCase().replace(/\s+/g, "-")
        return removeAccents(profileSlug) === removeAccents(slug as string)
      })

      if (matchedFreelancer) {
        setFreelancer(matchedFreelancer)
      } else {
        // Redirigir a 404 si no se encuentra
        navigate.replace("/404")
      }
    } catch (error) {
      console.error("Error loading freelancer profile:", error)
      navigate.replace("/404")
    } finally {
      setLoading(false)
    }
  }

  const handleShare = (platform: string) => {
    const profileUrl = window.location.href
    const shareText = `¡Conoce a ${freelancer?.full_name}, ${freelancer?.skills.slice(0, 3).join(", ")} en GDN Pro! 💼`

    let shareUrl = ""

    switch (platform) {
      case "linkedin":
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(profileUrl)}&title=${encodeURIComponent(shareText)}`
        break
      case "twitter":
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(profileUrl)}`
        break
      case "whatsapp":
        shareUrl = `https://wa.me/?text=${encodeURIComponent(shareText + " " + profileUrl)}`
        break
      case "copy":
        navigator.clipboard.writeText(profileUrl)
        // Mostrar notificación
        const notification = document.createElement("div")
        notification.className =
          "fixed top-4 right-4 bg-cyan-500 text-white px-4 py-2 rounded-lg shadow-lg z-50"
        notification.textContent = "¡Enlace copiado al portapapeles!"
        document.body.appendChild(notification)
        setTimeout(() => document.body.removeChild(notification), 3000)
        return
    }

    if (shareUrl) {
      window.open(shareUrl, "_blank", "width=600,height=400")
    }
  }

  const handleContact = async () => {
    if (!currentUser) {
      setShowContactModal(true)
      return
    }

    if (!freelancer) return

    // Check if current user is the freelancer being viewed
    if (currentUser.id === freelancer.id) {
      return // Don't show contact button for own profile
    }

    setChatLoading(true)
    setShowChat(true)

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session?.access_token) {
        window.toast?.({
          title: "Necesitas iniciar sesión para chatear",
          type: "warning",
          location: "bottom-center",
          dismissible: true,
          icon: true,
        })
        setShowChat(false)
        setShowContactModal(true)
        return
      }

      // First, check if a conversation already exists
      const checkResponse = await fetch(
        "https://kdmdhhhppizzlhvauofe.supabase.co/functions/v1/chat-handler",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            action: "get-conversations",
            userId: currentUser.id,
            userType: currentUser.user_type,
          }),
        },
      )

      let conversation: Conversation | null = null

      if (checkResponse.ok) {
        const checkData = await checkResponse.json()
        if (checkData.success && checkData.conversations) {
          // Find existing conversation with this freelancer
          conversation = checkData.conversations.find(
            (conv: Conversation) =>
              conv.freelancer_id === freelancer.id && conv.project_id === null,
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
              Authorization: `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({
              action: "create-conversation",
              freelancerId: freelancer.id,
              clientId: currentUser.id,
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
          conversation = {
            id: data.conversation.id,
            client_id: currentUser.id,
            freelancer_id: freelancer.id,
            project_id: null,
            updated_at: new Date().toISOString(),
            client: {
              full_name: freelancer.full_name,
              avatar_url: freelancer.avatar_url,
            },
          }
        } else {
          throw new Error(data.error || "Error al crear conversación")
        }
      } else {
        // Ensure conversation has freelancer info (shown as "client" in modal)
        conversation.client = {
          full_name: freelancer.full_name,
          avatar_url: freelancer.avatar_url,
        }
      }

      // Set the conversation and load messages
      setSelectedConversation(conversation)
      await loadMessages(conversation.id)
    } catch (err: unknown) {
      window.toast?.({
        title: "Error al iniciar el chat",
        type: "error",
        location: "bottom-center",
        dismissible: true,
        icon: true,
      })
      console.error("Error creating chat:", err)
      setShowChat(false)
      setSelectedConversation(null)
    } finally {
      setChatLoading(false)
    }
  }

  const loadMessages = async (convId: string) => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session?.access_token) {
        throw new Error("No hay sesión activa")
      }

      const response = await fetch(
        "https://kdmdhhhppizzlhvauofe.supabase.co/functions/v1/chat-handler",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            action: "get-messages",
            conversationId: convId,
          }),
        },
      )

      if (!response.ok) {
        throw new Error(`Error ${response.status}`)
      }

      const data = await response.json()
      if (data.success) setChatMessages(data.messages)
    } catch (err) {
      console.error("Error loading messages:", err)
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || sendingMessage) {
      return
    }

    setSendingMessage(true)

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session?.access_token) {
        throw new Error("No hay sesión activa")
      }

      const response = await fetch(
        "https://kdmdhhhppizzlhvauofe.supabase.co/functions/v1/chat-handler",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
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
      }
    } catch (err) {
      console.error("Error sending message:", err)
    } finally {
      setSendingMessage(false)
    }
  }

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault()
      sendMessage()
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="pt-20 pb-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="animate-pulse">
              <div className="mb-6 rounded-xl bg-white p-8 shadow-sm">
                <div className="mb-6 flex items-center">
                  <div className="h-24 w-24 rounded-full bg-gray-200"></div>
                  <div className="ml-6 flex-1">
                    <div className="mb-2 h-8 rounded bg-gray-200"></div>
                    <div className="mb-2 h-4 w-2/3 rounded bg-gray-200"></div>
                    <div className="h-4 w-1/2 rounded bg-gray-200"></div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="h-4 rounded bg-gray-200"></div>
                  <div className="h-4 w-4/5 rounded bg-gray-200"></div>
                  <div className="h-4 w-3/5 rounded bg-gray-200"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!freelancer) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="pt-20 pb-12">
          <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
            <h1 className="mb-4 text-2xl font-bold text-gray-900">Freelancer no encontrado</h1>
            <p className="mb-6 text-gray-600">
              El perfil que buscas no existe o ha sido eliminado.
            </p>
            <button
              onClick={() => navigate.replace("/freelancers")}
              className="bg-primary cursor-pointer rounded-lg px-6 py-3 font-medium whitespace-nowrap text-white transition-colors hover:bg-cyan-700"
            >
              Ver todos los freelancers
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <Layout>
      <div className="pt-20 pb-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Header del perfil */}
          <div className="mb-6 overflow-hidden rounded-2xl border border-gray-200 bg-gradient-to-br from-white to-gray-50 p-4 shadow-lg ring-1 ring-gray-100 sm:p-8">
            {/* Profile Header Section */}
            <div className="mb-6 space-y-4 sm:mb-0 sm:space-y-0">
              {/* Avatar and Info Row */}
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
                {/* Avatar */}
                <div className="flex justify-center sm:justify-start">
                  <div className="relative shrink-0">
                    {freelancer.avatar_url ? (
                      <div className="relative">
                        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-cyan-400 to-teal-500 p-1 shadow-lg shadow-cyan-500/30">
                          <div className="h-full w-full rounded-full bg-white"></div>
                        </div>
                        <img
                          src={freelancer.avatar_url}
                          alt={freelancer.full_name}
                          className="relative h-24 w-24 rounded-full object-cover object-center ring-4 ring-white sm:h-32 sm:w-32"
                        />
                      </div>
                    ) : (
                      <div className="relative">
                        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-cyan-400 to-teal-500 p-1 shadow-lg shadow-cyan-500/30">
                          <div className="h-full w-full rounded-full bg-white"></div>
                        </div>
                        <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-teal-500 ring-4 ring-white sm:h-32 sm:w-32">
                          <span className="text-3xl font-bold text-white sm:text-5xl">
                            {freelancer.full_name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      </div>
                    )}
                    <div className="absolute -right-1 -bottom-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-gradient-to-br from-cyan-500 to-teal-500 shadow-lg shadow-cyan-500/30 sm:h-10 sm:w-10 sm:border-4">
                      <i className="ri-checkbox-circle-fill text-xs text-white sm:text-base"></i>
                    </div>
                  </div>
                </div>

                {/* User Info */}
                <div className="flex flex-1 flex-col items-center gap-2 text-center sm:items-start sm:text-left">
                  <h1 className="text-xl font-bold text-gray-900 sm:text-3xl">
                    {freelancer.full_name}
                  </h1>
                  <div className="flex flex-wrap items-center justify-center gap-1.5 text-xs text-gray-600 sm:justify-start sm:gap-2 sm:text-sm">
                    <div className="flex items-center gap-1">
                      <i className="ri-star-fill text-yellow-400"></i>
                      <span className="font-medium">{freelancer.rating || 5.0}</span>
                    </div>
                    <span className="hidden text-gray-400 sm:inline">•</span>
                    <span className="text-xs sm:text-sm">{completedProjects || 0} proyectos</span>
                    <span className="hidden text-gray-400 sm:inline">•</span>
                    <span className="text-xs sm:text-sm">{freelancer.experience_years}+ años</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-2.5 w-2.5 rounded-full bg-gradient-to-br from-cyan-500 to-teal-500 shadow-md shadow-cyan-500/30 sm:h-3 sm:w-3"></div>
                    <span className="text-xs font-medium text-gray-600 capitalize sm:text-base">
                      {freelancer.availability}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                <div className="share-menu-container relative w-full sm:w-auto">
                  <button
                    onClick={() => setShowShareMenu(!showShareMenu)}
                    className="flex w-full cursor-pointer items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-all hover:border-cyan-300 hover:bg-cyan-50 hover:shadow-md sm:w-auto sm:text-base"
                  >
                    <i className="ri-share-line mr-2 text-base"></i>
                    Compartir
                  </button>

                  {/* Menú de compartir */}
                  {showShareMenu && (
                    <>
                      {/* Backdrop to close menu on mobile */}
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setShowShareMenu(false)}
                      ></div>
                      <div className="absolute top-full left-0 z-20 mt-2 w-full min-w-[180px] rounded-lg border border-gray-200 bg-white py-2 shadow-xl sm:right-0 sm:left-auto sm:w-auto">
                        <button
                          onClick={() => {
                            handleShare("linkedin")
                            setShowShareMenu(false)
                          }}
                          className="flex w-full cursor-pointer items-center px-4 py-2 text-left text-sm text-gray-700 transition-colors hover:bg-gray-50"
                        >
                          <i className="ri-linkedin-fill text-primary mr-3"></i>
                          LinkedIn
                        </button>
                        <button
                          onClick={() => {
                            handleShare("twitter")
                            setShowShareMenu(false)
                          }}
                          className="flex w-full cursor-pointer items-center px-4 py-2 text-left text-sm text-gray-700 transition-colors hover:bg-gray-50"
                        >
                          <i className="ri-twitter-fill mr-3 text-blue-400"></i>
                          Twitter
                        </button>
                        <button
                          onClick={() => {
                            handleShare("whatsapp")
                            setShowShareMenu(false)
                          }}
                          className="flex w-full cursor-pointer items-center px-4 py-2 text-left text-sm text-gray-700 transition-colors hover:bg-gray-50"
                        >
                          <i className="ri-whatsapp-fill mr-3 text-cyan-500"></i>
                          WhatsApp
                        </button>
                        <button
                          onClick={() => {
                            handleShare("copy")
                            setShowShareMenu(false)
                          }}
                          className="flex w-full cursor-pointer items-center px-4 py-2 text-left text-sm text-gray-700 transition-colors hover:bg-gray-50"
                        >
                          <i className="ri-link mr-3 text-gray-500"></i>
                          Copiar enlace
                        </button>
                      </div>
                    </>
                  )}
                </div>

                {/* Only show Contact button if user is logged in and not viewing their own profile */}
                {currentUser && currentUser.id !== freelancer?.id && (
                  <button
                    onClick={handleContact}
                    className="group inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-cyan-500 to-teal-500 px-4 py-2.5 text-sm font-medium whitespace-nowrap text-white shadow-md shadow-cyan-500/30 transition-all hover:-translate-y-0.5 hover:scale-[1.02] hover:shadow-lg hover:shadow-cyan-500/40 sm:w-auto sm:px-6 sm:text-base"
                  >
                    <i className="ri-message-3-line text-base transition-transform group-hover:scale-110 sm:text-lg"></i>
                    Contactar
                  </button>
                )}
              </div>
            </div>

            {/* Precio */}
            <div className="my-6 rounded-xl border border-cyan-200 bg-gradient-to-br from-cyan-50 to-teal-50 p-4 ring-1 ring-cyan-100 sm:p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex-1">
                  <div className="mb-2 flex items-center gap-2">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500 to-teal-500 text-white shadow-md shadow-cyan-500/30">
                      <i className="ri-money-dollar-circle-line text-sm"></i>
                    </div>
                    <p className="text-xs font-medium text-cyan-700 sm:text-sm">Tarifa por hora</p>
                  </div>
                  <p className="text-2xl font-bold text-cyan-600 sm:text-3xl">
                    ${freelancer.hourly_rate}
                  </p>
                </div>
                <div className="flex-1 text-left sm:text-right">
                  <div className="mb-2 flex items-center gap-2 sm:justify-end">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500 to-teal-500 text-white shadow-md shadow-cyan-500/30">
                      <i className="ri-time-line text-sm"></i>
                    </div>
                    <p className="text-xs font-medium text-cyan-700 sm:text-sm">Disponibilidad</p>
                  </div>
                  <p className="text-lg font-semibold text-cyan-600 capitalize sm:text-xl">
                    {freelancer.availability}
                  </p>
                </div>
              </div>
            </div>

            {/* Skills */}
            <div className="mb-6">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-teal-500 text-white shadow-lg shadow-cyan-500/30">
                  <i className="ri-tools-fill text-lg"></i>
                </div>
                <h3 className="text-base font-semibold text-gray-900 sm:text-lg">Habilidades</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {freelancer.skills.map((skill, index) => (
                  <span
                    key={index}
                    className="rounded-full border border-cyan-200 bg-gradient-to-r from-cyan-50 to-teal-50 px-3 py-1.5 text-xs font-medium text-cyan-700 shadow-sm ring-1 ring-cyan-100 transition-all hover:scale-105 hover:shadow-md sm:px-4 sm:py-2 sm:text-sm"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            {/* Bio */}
            <div>
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-teal-500 text-white shadow-lg shadow-cyan-500/30">
                  <i className="ri-user-line text-lg"></i>
                </div>
                <h3 className="text-base font-semibold text-gray-900 sm:text-lg">Acerca de mí</h3>
              </div>
              <div className="rounded-xl border border-gray-200 bg-gradient-to-br from-gray-50 to-white p-4 shadow-sm sm:p-6">
                <p className="text-sm leading-relaxed text-gray-700 sm:text-base">
                  {freelancer.bio ||
                    "Profesional experimentado con pasión por crear soluciones innovadoras y de alta calidad. Comprometido con la excelencia en cada proyecto y la satisfacción del cliente."}
                </p>
              </div>
            </div>
          </div>

          {/* Tabs de contenido */}
          <div className="rounded-2xl border border-gray-200 bg-gradient-to-br from-white to-gray-50 shadow-lg ring-1 ring-gray-100">
            <div className="border-b border-gray-200 bg-gradient-to-r from-cyan-50/50 to-teal-50/50">
              <nav className="flex space-x-8 px-8">
                {[
                  { id: "overview", label: "Resumen", icon: "ri-user-line" },
                  // {  id: "portfolio", label: "Portafolio", icon: "ri-folder-line", }, //
                  { id: "reviews", label: "Reseñas", icon: "ri-star-line" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`group flex cursor-pointer items-center border-b-2 px-1 py-4 text-sm font-medium whitespace-nowrap transition-all ${
                      activeTab === tab.id
                        ? "border-cyan-500 text-cyan-600"
                        : "border-transparent text-gray-500 transition-colors hover:border-gray-300 hover:text-gray-700"
                    }`}
                  >
                    <i
                      className={`${tab.icon} mr-2 transition-transform group-hover:scale-110`}
                    ></i>
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>

            <div className="p-8">
              {activeTab === "overview" && (
                <div className="space-y-6">
                  <div>
                    <h4 className="mb-3 text-lg font-semibold text-gray-900">
                      Experiencia Profesional
                    </h4>
                    <p className="text-gray-700">
                      Con más de {freelancer.experience_years} años de experiencia en el campo, he
                      trabajado en diversos proyectos que van desde startups hasta empresas Fortune
                      500. Mi enfoque se centra en entregar soluciones de alta calidad que superen
                      las expectativas del cliente.
                    </p>
                  </div>

                  <div>
                    <h4 className="mb-3 text-lg font-semibold text-gray-900">Estadísticas</h4>
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                      <div className="group relative overflow-hidden rounded-xl border border-gray-200 bg-gradient-to-br from-cyan-50 to-teal-50 p-6 text-center shadow-sm ring-1 ring-gray-100 transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-cyan-500/10">
                        <div className="mb-3 flex items-center justify-center">
                          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-teal-500 text-white shadow-lg shadow-cyan-500/30">
                            <i className="ri-briefcase-line text-xl"></i>
                          </div>
                        </div>
                        <div className="mb-2 text-3xl font-bold text-cyan-600">
                          {completedProjects}
                        </div>
                        <div className="text-sm font-medium text-gray-600">
                          Proyectos completados
                        </div>
                      </div>

                      <div className="group relative overflow-hidden rounded-xl border border-gray-200 bg-gradient-to-br from-cyan-50 to-teal-50 p-6 text-center shadow-sm ring-1 ring-gray-100 transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-cyan-500/10">
                        <div className="mb-3 flex items-center justify-center">
                          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-teal-500 text-white shadow-lg shadow-cyan-500/30">
                            <i className="ri-star-fill text-xl"></i>
                          </div>
                        </div>
                        <div className="mb-2 text-3xl font-bold text-cyan-600">
                          {freelancer.rating || 5.0}
                        </div>
                        <div className="text-sm font-medium text-gray-600">
                          Calificación Promedio
                        </div>
                      </div>
                      <div className="group relative overflow-hidden rounded-xl border border-gray-200 bg-gradient-to-br from-cyan-50 to-teal-50 p-6 text-center shadow-sm ring-1 ring-gray-100 transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-cyan-500/10">
                        <div className="mb-3 flex items-center justify-center">
                          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-teal-500 text-white shadow-lg shadow-cyan-500/30">
                            <i className="ri-checkbox-circle-line text-xl"></i>
                          </div>
                        </div>
                        <div className="mb-2 text-3xl font-bold text-cyan-600">100%</div>
                        <div className="text-sm font-medium text-gray-600">Tasa de Éxito</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tabs de contenido 
              {activeTab === "portfolio" && (
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-6">
                    Portafolio de Proyectos
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[1, 2, 3, 4].map((item) => (
                      <div
                        key={item}
                        className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                      >
                        <div className="h-48 bg-gradient-to-br from-cyan-400 to-primary flex items-center justify-center">
                          <i className="ri-image-line text-white text-4xl"></i>
                        </div>
                        <div className="p-4">
                          <h5 className="font-semibold text-gray-900 mb-2">
                            Proyecto {item}
                          </h5>
                          <p className="text-gray-600 text-sm mb-3">
                            Descripción del proyecto realizado con tecnologías
                            modernas y mejores prácticas.
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {freelancer.skills
                              .slice(0, 3)
                              .map((skill, index) => (
                                <span
                                  key={index}
                                  className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                                >
                                  {skill}
                                </span>
                              ))}
                          </div>
                        </div>
                      </div>
                    ))} 
                  </div>
                </div>
              )} */}

              {activeTab === "reviews" && (
                <div className="space-y-6">
                  <h4 className="mb-6 text-lg font-semibold text-gray-900">Reseñas de Clientes</h4>

                  <ReviewsDisplayPublic freelancerId={freelancer.id} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal de contacto */}
      {showContactModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Contactar a {freelancer?.full_name}
              </h3>
              <button
                onClick={() => setShowContactModal(false)}
                className="cursor-pointer text-gray-400 transition-colors hover:text-gray-600"
              >
                <i className="ri-close-line text-xl"></i>
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-gray-600">
                Para contactar a este freelancer, necesitas tener una cuenta en GDN Pro.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowContactModal(false)
                    navigate.push("/login")
                  }}
                  className="bg-primary flex-1 cursor-pointer rounded-lg px-4 py-2 font-medium whitespace-nowrap text-white transition-colors hover:bg-cyan-700"
                >
                  Iniciar Sesión
                </button>
                <button
                  onClick={() => {
                    setShowContactModal(false)
                    navigate.push("/register")
                  }}
                  className="border-primary text-primary flex-1 cursor-pointer rounded-lg border px-4 py-2 font-medium whitespace-nowrap transition-colors hover:bg-emerald-50"
                >
                  Registrarse
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Conversation Modal */}
      {showChat && selectedConversation && currentUser && (
        <ConversationModal
          selectedConversation={selectedConversation}
          setShowChat={setShowChat}
          setChatMessages={setChatMessages}
          setSelectedConversation={setSelectedConversation}
          setNewMessage={setNewMessage}
          chatLoading={chatLoading}
          chatMessages={chatMessages}
          user={currentUser}
          newMessage={newMessage}
          handleKeyPress={handleKeyPress}
          sendingMessage={sendingMessage}
          sendMessage={sendMessage}
        />
      )}
    </Layout>
  )
}
