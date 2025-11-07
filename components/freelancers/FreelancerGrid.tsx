"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabaseBrowser } from "@/utils/supabase/client"
import { Freelancer } from "@/interfaces/Freelancer"
import { ChatMessage } from "@/interfaces/ChatMessage"
import { Conversation } from "@/interfaces/Conversation"
import type { Profile } from "@/interfaces/Profile"
import { ConversationModal } from "@/components/ConversationModal"

interface FreelancerGridProps {
  searchFilters?: {
    search: string
    category: string
    location: string
    experience: string
    budget: string
    availability: string
  }
}

export default function FreelancerGrid({ searchFilters }: FreelancerGridProps) {
  const supabase = supabaseBrowser()
  const navigate = useRouter()
  const [freelancers, setFreelancers] = useState<Freelancer[]>([])
  const [filteredFreelancers, setFilteredFreelancers] = useState<Freelancer[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedFreelancer, setSelectedFreelancer] = useState<Freelancer | null>(null)
  const [showProfile, setShowProfile] = useState(false)
  const [showChat, setShowChat] = useState(false)
  const [currentUser, setCurrentUser] = useState<{ id: string } | null>(null)
  const [currentProfile, setCurrentProfile] = useState<Profile | null>(null)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [chatLoading, setChatLoading] = useState(false)
  const [sendingMessage, setSendingMessage] = useState(false)
  const [showAllFreelancers, setShowAllFreelancers] = useState(false)
  const [sortBy, setSortBy] = useState("rating")
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const ITEMS_PER_PAGE = 12

  useEffect(() => {
    loadFreelancers(true)
    checkCurrentUser()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [freelancers, searchFilters, sortBy])

  useEffect(() => {
    // Reset pagination when filters change and reload
    setPage(0)
    setHasMore(true)
    if (searchFilters && Object.values(searchFilters).some((v) => v)) {
      // If filters are active, we'll filter client-side
      // Otherwise reload from server
      if (
        !searchFilters.search &&
        !searchFilters.category &&
        !searchFilters.experience &&
        !searchFilters.budget &&
        !searchFilters.availability
      ) {
        loadFreelancers(true)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchFilters])

  // Handle body overflow when modals open/close
  useEffect(() => {
    if (showProfile || showChat) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }

    return () => {
      document.body.style.overflow = ""
    }
  }, [showProfile, showChat])

  const applyFilters = () => {
    let filtered = [...freelancers]

    if (searchFilters) {
      // Search term filter
      if (searchFilters.search) {
        const searchTerm = searchFilters.search.toLowerCase()
        filtered = filtered.filter(
          (freelancer) =>
            freelancer.full_name.toLowerCase().includes(searchTerm) ||
            freelancer.bio?.toLowerCase().includes(searchTerm) ||
            freelancer.skills?.some((skill) => skill.toLowerCase().includes(searchTerm)),
        )
      }

      // Category filter
      if (searchFilters.category) {
        filtered = filtered.filter((freelancer) =>
          freelancer.skills?.some((skill) =>
            skill.toLowerCase().includes(searchFilters.category.toLowerCase()),
          ),
        )
      }

      // Experience filter
      if (searchFilters.experience) {
        const experienceMap: { [key: string]: [number, number] } = {
          "Junior (1-3 años)": [1, 3],
          "Mid-level (3-5 años)": [3, 5],
          "Senior (5+ años)": [5, 10],
          "Expert (10+ años)": [10, 100],
        }
        const [minExp, maxExp] = experienceMap[searchFilters.experience] || [0, 100]
        filtered = filtered.filter(
          (freelancer) =>
            freelancer.experience_years >= minExp && freelancer.experience_years <= maxExp,
        )
      }

      // Budget filter
      if (searchFilters.budget) {
        const budgetMap: { [key: string]: [number, number] } = {
          "$10-25/hora": [10, 25],
          "$25-50/hora": [25, 50],
          "$50-100/hora": [50, 100],
          "$100+/hora": [100, 1000],
        }
        const [minRate, maxRate] = budgetMap[searchFilters.budget] || [0, 1000]
        filtered = filtered.filter(
          (freelancer) => freelancer.hourly_rate >= minRate && freelancer.hourly_rate <= maxRate,
        )
      }

      // Availability filter
      if (searchFilters.availability) {
        if (searchFilters.availability === "Disponible ahora") {
          filtered = filtered.filter((freelancer) => freelancer.availability === "Disponible")
        }
      }
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "rating":
          return b.rating - a.rating
        case "price-low":
          return a.hourly_rate - b.hourly_rate
        case "price-high":
          return b.hourly_rate - a.hourly_rate
        case "projects":
          return b.completed_projects - a.completed_projects
        case "response":
          return a.response_time.localeCompare(b.response_time)
        default:
          return b.rating - a.rating
      }
    })

    setFilteredFreelancers(filtered)
  }

  const checkCurrentUser = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setCurrentUser(user)

      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", user.id)
          .single()

        setCurrentProfile(profile)
      }
    } catch (err) {
      console.error("Error checking user:", err)
    }
  }

  const loadFreelancers = async (reset = false) => {
    try {
      if (reset) {
        setLoading(true)
        setPage(0)
        setHasMore(true)
      } else {
        setLoadingMore(true)
      }

      const from = reset ? 0 : page * ITEMS_PER_PAGE
      const to = from + ITEMS_PER_PAGE - 1

      const { data, error, count } = await supabase
        .from("profiles")
        .select("*", { count: "exact" })
        .eq("user_type", "freelancer")
        .eq("is_active", true)
        .order("rating", { ascending: false })
        .range(from, to)

      if (error) {
        console.error("Error loading freelancers:", error)
        if (reset) {
          setFreelancers([])
        }
        return
      }

      const enhancedFreelancers = (data ?? []).map((freelancer: Profile) => ({
        ...freelancer,
        avatar_url:
          freelancer.avatar_url ||
          `${getGenderFromName(
            freelancer.full_name,
          )}%20hispanic%20software%20developer%20portrait%2C%20confident%20tech%20professional%2C%20modern%20office%20background%2C%20programmer%20headshot%2C%20professional%20developer%20photo&width=300&height=300&seq=freelancer${freelancer.id}&orientation=squarish`,
        completed_projects: Math.floor(Math.random() * 50) + freelancer.experience_years * 10,
        response_time: ["1 hora", "2 horas", "3 horas", "4 horas"][Math.floor(Math.random() * 4)],
        languages: ["Español", "Inglés"],
        availability: Math.random() > 0.3 ? "Disponible" : "Ocupado hasta Feb 15",
        location:
          freelancer.location ||
          ["Ciudad de México", "Guadalajara", "Monterrey", "Puebla"][Math.floor(Math.random() * 4)],
        rating: parseFloat(freelancer.rating?.toString() ?? "5.0"),
        hourly_rate: parseFloat(freelancer.hourly_rate?.toString() ?? "25"),
        total_reviews: freelancer.total_reviews ?? Math.floor(Math.random() * 100) + 20,
      }))

      if (reset) {
        setFreelancers(enhancedFreelancers)
      } else {
        setFreelancers((prev) => [...prev, ...enhancedFreelancers])
      }

      // Check if there are more items to load
      const totalItems = count ?? 0
      const loadedItems = reset
        ? enhancedFreelancers.length
        : freelancers.length + enhancedFreelancers.length
      setHasMore(loadedItems < totalItems && enhancedFreelancers.length === ITEMS_PER_PAGE)

      if (!reset) {
        setPage((prev) => prev + 1)
      }
    } catch (err) {
      console.error("Error loading freelancers:", err)
      if (reset) {
        setFreelancers([])
      }
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  const loadMoreFreelancers = () => {
    if (!loadingMore && hasMore) {
      loadFreelancers(false)
    }
  }

  useEffect(() => {
    const handleScroll = () => {
      if (
        !loadingMore &&
        hasMore &&
        window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 1000
      ) {
        loadMoreFreelancers()
      }
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadingMore, hasMore])

  const getGenderFromName = (name: string) => {
    const femaleNames = [
      "María",
      "Ana",
      "Elena",
      "Carmen",
      "Rosa",
      "Isabel",
      "Sofía",
      "Laura",
      "Patricia",
      "Monica",
    ]
    const firstName = name.split(" ")[0]
    return femaleNames.some((fn) => firstName.includes(fn)) ? "female" : "male"
  }

  const handleContactFreelancer = async (freelancer: Freelancer) => {
    if (!currentUser) {
      window.toast({
        title: "Debes iniciar sesión para contactar freelancers",
        type: "warning",
        location: "bottom-center",
        dismissible: true,
        icon: true,
      })
      return
    }
    if (!currentProfile) {
      window.toast({
        title: "No se pudo cargar tu perfil",
        type: "warning",
        location: "bottom-center",
        dismissible: true,
        icon: true,
      })
      return
    }

    setSelectedFreelancer(freelancer)
    setShowChat(true)
    setChatLoading(true)

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session?.access_token) {
        window.toast({
          title: "No hay sesión activa",
          type: "error",
          location: "bottom-center",
          dismissible: true,
          icon: true,
        })
        throw new Error("No hay sesión activa")
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
            userId: currentProfile.id,
            userType: "client",
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
              clientId: currentProfile.id,
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
            client_id: currentProfile.id,
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
      window.toast({
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
        window.toast({
          title: "No hay sesión activa",
          type: "error",
          location: "bottom-center",
          dismissible: true,
          icon: true,
        })
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
      console.log("❌ Cannot send: empty message, no conversation, or already sending")
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
    } catch (err: unknown) {
      window.toast({
        title: "Error al enviar mensaje",
        type: "error",
        location: "bottom-center",
        dismissible: true,
        icon: true,
      })
      console.error("Error sending message:", err)
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

  const handleHireFreelancer = (freelancer: Freelancer) => {
    if (!currentUser) {
      window.toast({
        title: "Debes iniciar sesión para contratar freelancers",
        type: "warning",
        location: "bottom-center",
        dismissible: true,
        icon: true,
      })
      return
    }

    if (!currentProfile) {
      window.toast({
        title: "No se pudo cargar tu perfil",
        type: "error",
        location: "bottom-center",
        dismissible: true,
        icon: true,
      })
      return
    }

    const params = new URLSearchParams({
      title: `Proyecto con ${freelancer.full_name}`,
      description: `Proyecto de desarrollo con ${freelancer.full_name} - ${
        freelancer.skills?.[0] || "Freelancer"
      } especialista`,
      amount: (freelancer.hourly_rate * 10).toString(),
    })

    navigate.push(`/payment/checkout/${freelancer.id}?${params.toString()}`)
  }

  const handleViewProfile = (freelancer: Freelancer) => {
    setSelectedFreelancer(freelancer)
    setShowProfile(true)
  }

  const handleViewAllFreelancers = () => setShowAllFreelancers((prev) => !prev)

  const displayedFreelancers = filteredFreelancers

  if (loading) {
    return (
      <section className="bg-gradient-to-b from-cyan-50 to-gray-50 py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex h-64 items-center justify-center">
            <div className="text-center">
              <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-teal-500 text-white shadow-lg shadow-cyan-500/30">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-white/30 border-t-white"></div>
              </div>
              <p className="mt-4 text-gray-600">Cargando freelancers...</p>
            </div>
          </div>
        </div>
      </section>
    )
  }

  if (filteredFreelancers.length === 0) {
    return (
      <section className="bg-gradient-to-b from-cyan-50 to-gray-50 py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center">
            <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-gray-400 to-gray-500 text-white shadow-lg">
              <i className="ri-user-search-line text-3xl"></i>
            </div>
            <h3 className="mb-4 text-2xl font-bold text-gray-900">No se encontraron freelancers</h3>
            <p className="text-gray-600">
              {searchFilters &&
              (searchFilters.search ||
                searchFilters.category ||
                searchFilters.experience ||
                searchFilters.budget)
                ? "Intenta ajustar los filtros de búsqueda para encontrar más resultados."
                : "Actualmente no hay freelancers registrados en la plataforma."}
            </p>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="bg-gradient-to-b from-cyan-50 to-gray-50 py-20">
      <div className="mx-auto max-w-7xl px-6">
        {/* Header + Sorting */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-teal-500 text-white shadow-lg shadow-cyan-500/30">
                <i className="ri-team-line text-xl"></i>
              </div>
              <h3 className="text-3xl font-bold text-gray-900">Freelancers Destacados</h3>
            </div>
            <p className="mt-2 text-gray-600">
              Mostrando {displayedFreelancers.length} de {filteredFreelancers.length} freelancers
              {searchFilters &&
                (searchFilters.search ||
                  searchFilters.category ||
                  searchFilters.experience ||
                  searchFilters.budget) &&
                " (filtrados)"}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-4">
            <span className="flex items-center gap-2 font-medium text-gray-700">
              <i className="ri-sort-desc text-cyan-500"></i>
              Ordenar por:
            </span>
            <div className="relative w-full sm:w-auto">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full cursor-pointer appearance-none rounded-xl border border-gray-300 bg-gradient-to-r from-gray-50 to-white px-4 py-2.5 pr-8 font-medium transition-all focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 focus:outline-none sm:w-auto"
              >
                <option value="rating">Mejor calificados</option>
                <option value="price-low">Precio: menor a mayor</option>
                <option value="price-high">Precio: mayor a menor</option>
                <option value="projects">Más proyectos</option>
                <option value="response">Respuesta más rápida</option>
              </select>
              <i className="ri-arrow-down-s-line pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 transform text-cyan-500" />
            </div>
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {displayedFreelancers.map((freelancer) => (
            <div
              key={freelancer.id}
              className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-lg transition-all hover:-translate-y-2 hover:shadow-2xl hover:shadow-cyan-500/10"
            >
              <div className="flex h-full flex-col justify-between p-4">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/10 mb-4 size-16 overflow-hidden rounded-full">
                      {freelancer.avatar_url ? (
                        <img
                          src={freelancer.avatar_url}
                          alt={freelancer.full_name}
                          className="size-16 object-cover object-top"
                        />
                      ) : (
                        <i className="ri-user-line text-primary text-2xl" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">{freelancer.full_name}</h3>
                      <div
                        className={`mb-2 w-fit rounded-full px-3 py-1 text-xs font-semibold ${
                          freelancer.availability === "Disponible"
                            ? "bg-green-100 text-green-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {freelancer.availability}
                      </div>
                      <p className="text-primary font-semibold">
                        {freelancer.skills?.[0]
                          ? `${freelancer.skills[0]} Specialist`
                          : "Freelancer"}
                      </p>
                      <p className="flex items-center text-sm text-gray-500">
                        <i className="ri-map-pin-line mr-1" />
                        {freelancer.location}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Rating */}
                <div className="mb-4 flex items-center">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <i
                        key={i}
                        className={`ri-star-fill ${
                          i < Math.floor(freelancer.rating) ? "text-yellow-400" : "text-gray-300"
                        }`}
                      />
                    ))}
                    <span className="ml-2 font-semibold text-gray-600">{freelancer.rating}</span>
                    <span className="ml-1 text-gray-500">({freelancer.total_reviews} reviews)</span>
                  </div>
                </div>

                {/* Bio */}
                <div className="h-full flex-1">
                  <p className="mb-4 leading-relaxed text-gray-600">
                    {freelancer.bio || "Freelancer profesional con experiencia comprobada."}
                  </p>

                  {/* Skills */}
                  <div className="mb-4 flex flex-wrap gap-2">
                    {freelancer.skills?.slice(0, 3).map((skill, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-cyan-50 to-teal-50 px-3 py-1 text-sm font-medium text-cyan-700 ring-1 ring-cyan-200 transition-all hover:scale-105 hover:shadow-md"
                      >
                        <i className="ri-checkbox-circle-line text-xs"></i>
                        {skill}
                      </span>
                    ))}
                  </div>

                  {/* Stats */}
                  <div className="mb-6 grid grid-cols-2 gap-4 text-sm text-gray-600">
                    <div className="flex items-center">
                      <i className="ri-briefcase-line mr-2" />
                      {freelancer.completed_projects} proyectos
                    </div>
                    <div className="flex items-center">
                      <i className="ri-time-line mr-2" />
                      Responde en {freelancer.response_time}
                    </div>
                  </div>
                </div>
                {/* Footer */}
                <div className="border-t border-gray-300 pt-4">
                  <div className="mb-4 flex items-center justify-between">
                    <div className="text-2xl font-bold text-gray-900">
                      ${freelancer.hourly_rate}/hora
                    </div>
                    <div className="flex items-center text-gray-600">
                      {freelancer.languages?.map((lang, idx) => (
                        <span key={idx} className="mr-1 rounded bg-gray-100 px-2 py-1 text-xs">
                          {lang}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => handleContactFreelancer(freelancer)}
                    className="group flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 py-3 font-semibold text-white shadow-md shadow-cyan-500/30 transition-all hover:-translate-y-0.5 hover:scale-[1.02] hover:shadow-lg hover:shadow-cyan-500/40"
                  >
                    <i className="ri-chat-3-line transition-transform group-hover:scale-110"></i>
                    Contactar
                  </button>
                  <button
                    onClick={() => handleViewProfile(freelancer)}
                    className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-cyan-500 bg-white py-3 font-semibold text-cyan-600 transition-all hover:bg-gradient-to-r hover:from-cyan-500 hover:to-teal-500 hover:text-white hover:shadow-md"
                  >
                    <i className="ri-user-line"></i>
                    Ver Perfil
                  </button>
                </div>

                <div className="mt-3">
                  <button
                    onClick={() => handleHireFreelancer(freelancer)}
                    className="group flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 py-3 font-semibold text-white shadow-lg shadow-emerald-500/30 transition-all hover:-translate-y-0.5 hover:scale-[1.02] hover:shadow-xl hover:shadow-emerald-500/40"
                  >
                    <i className="ri-secure-payment-line text-lg transition-transform group-hover:scale-110" />
                    Contratar Ahora - ${freelancer.hourly_rate * 10}
                  </button>
                  <p className="mt-2 text-center text-xs text-gray-500">
                    <i className="ri-shield-check-line mr-1 text-emerald-500"></i>
                    Pago seguro con Stripe • Estimación 10 horas
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Loading More / No More Message */}
        <div className="mt-12 text-center">
          {loadingMore && (
            <div className="flex items-center justify-center">
              <div className="border-primary h-8 w-8 animate-spin rounded-full border-b-2"></div>
              <span className="ml-3 text-gray-600">Cargando más freelancers...</span>
            </div>
          )}
          {!hasMore && !loadingMore && filteredFreelancers.length > 0 && (
            <div className="py-8">
              <p className="text-gray-500">
                <i className="ri-check-line mr-2 text-green-500"></i>
                Has visto todos los freelancers disponibles
              </p>
            </div>
          )}
        </div>
      </div>

      {/* -------------------------- Profile Modal -------------------------- */}
      {showProfile && selectedFreelancer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-black/60 via-black/50 to-black/60 p-4 backdrop-blur-md">
          <div className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-black/5">
            {/* Modern Header with Gradient */}
            <div className="relative shrink-0 overflow-hidden bg-gradient-to-r from-cyan-600 via-cyan-500 to-teal-500 p-8 text-white">
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIyIi8+PC9nPjwvZz48L3N2Zz4=')] opacity-20"></div>
              <div className="relative z-10 flex items-start justify-between">
                <div className="flex-1 pr-4">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 ring-1 ring-white/30 backdrop-blur-sm">
                      <i className="ri-user-line text-2xl"></i>
                    </div>
                    <div>
                      <h2 className="text-3xl leading-tight font-bold sm:text-4xl">
                        Perfil del Freelancer
                      </h2>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setShowProfile(false)}
                  className="group flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/20 backdrop-blur-sm transition-all hover:scale-110 hover:bg-white/20"
                  aria-label="Cerrar"
                >
                  <i className="ri-close-line text-xl transition-transform group-hover:rotate-90"></i>
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-8 pb-24">
              {/* Main Info */}
              <div className="mb-8 flex items-center gap-6 rounded-2xl border border-gray-200 bg-gradient-to-br from-gray-50 to-white p-6 shadow-sm">
                <div className="relative flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-cyan-500 to-teal-500 ring-2 ring-cyan-200">
                  {selectedFreelancer.avatar_url ? (
                    <img
                      src={selectedFreelancer.avatar_url}
                      alt={selectedFreelancer.full_name}
                      className="h-full w-full object-cover object-top"
                    />
                  ) : (
                    <i className="ri-user-line text-4xl text-white"></i>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="mb-2 text-2xl font-bold text-gray-900">
                    {selectedFreelancer.full_name}
                  </h3>
                  <div className="mb-2 flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500 to-teal-500 text-white">
                      <i className="ri-star-fill text-sm"></i>
                    </div>
                    <p className="text-lg font-semibold text-cyan-700">
                      {selectedFreelancer.skills?.[0]
                        ? `${selectedFreelancer.skills[0]} Specialist`
                        : "Freelancer"}
                    </p>
                  </div>
                  <div className="mb-2 flex items-center gap-2 text-gray-600">
                    <i className="ri-map-pin-line text-cyan-500"></i>
                    {selectedFreelancer.location}
                  </div>
                  <div className="mb-2 flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <i
                          key={i}
                          className={`ri-star-fill ${
                            i < Math.floor(selectedFreelancer.rating)
                              ? "text-yellow-400"
                              : "text-gray-300"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="font-semibold text-gray-900">{selectedFreelancer.rating}</span>
                    <span className="text-gray-600">
                      ({selectedFreelancer.total_reviews} reseñas)
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">
                    <i className="ri-time-line mr-1 text-cyan-500"></i>
                    {selectedFreelancer.experience_years} años de experiencia
                  </p>
                </div>
              </div>

              {/* Summary stats */}
              <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-cyan-50 to-teal-50 p-6 ring-1 ring-cyan-100 transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-cyan-500/10">
                  <div className="mb-3 flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-cyan-600 text-white shadow-lg shadow-cyan-500/30">
                      <i className="ri-money-dollar-circle-fill text-xl"></i>
                    </div>
                    <div className="text-sm font-medium text-cyan-700">Tarifa por hora</div>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">
                    ${selectedFreelancer.hourly_rate}
                  </p>
                </div>
                <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-cyan-50 to-teal-50 p-6 ring-1 ring-cyan-100 transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-cyan-500/10">
                  <div className="mb-3 flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-teal-500 text-white shadow-lg shadow-cyan-500/30">
                      <i className="ri-briefcase-line text-xl"></i>
                    </div>
                    <div className="text-sm font-medium text-cyan-700">Proyectos</div>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">
                    {selectedFreelancer.completed_projects}
                  </p>
                </div>
                <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-cyan-50 to-teal-50 p-6 ring-1 ring-cyan-100 transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-cyan-500/10">
                  <div className="mb-3 flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-teal-500 text-white shadow-lg shadow-cyan-500/30">
                      <i className="ri-time-line text-xl"></i>
                    </div>
                    <div className="text-sm font-medium text-cyan-700">Respuesta</div>
                  </div>
                  <p className="text-xl font-bold text-gray-900">
                    {selectedFreelancer.response_time}
                  </p>
                </div>
              </div>

              {/* Sections */}
              <div className="mb-8">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-teal-500 text-white shadow-lg">
                    <i className="ri-file-text-line text-lg"></i>
                  </div>
                  <h4 className="text-xl font-bold text-gray-900">Acerca de</h4>
                </div>
                <div className="rounded-2xl border border-gray-200 bg-gradient-to-br from-gray-50 to-white p-6 shadow-sm">
                  <p className="leading-relaxed text-gray-700">{selectedFreelancer.bio}</p>
                </div>
              </div>

              <div className="mb-8">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-teal-500 text-white shadow-lg">
                    <i className="ri-tools-fill text-lg"></i>
                  </div>
                  <h4 className="text-xl font-bold text-gray-900">Habilidades</h4>
                </div>
                <div className="flex flex-wrap gap-3">
                  {selectedFreelancer.skills?.map((skill, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-500 to-teal-500 px-4 py-2 text-sm font-semibold text-white shadow-md transition-all hover:scale-105 hover:shadow-lg hover:shadow-cyan-500/30"
                    >
                      <i className="ri-checkbox-circle-line text-base"></i>
                      <span className="whitespace-nowrap">{skill}</span>
                    </span>
                  ))}
                </div>
              </div>

              <div className="mb-8">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-teal-500 text-white shadow-lg">
                    <i className="ri-mail-line text-lg"></i>
                  </div>
                  <h4 className="text-xl font-bold text-gray-900">Información de Contacto</h4>
                </div>
                <div className="rounded-2xl border border-gray-200 bg-gradient-to-br from-gray-50 to-white p-6 shadow-sm">
                  <p className="text-gray-700">
                    <span className="font-semibold">Email:</span> {selectedFreelancer.email}
                  </p>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="shrink-0 border-t border-gray-200 bg-gradient-to-b from-white to-gray-50 p-6 shadow-lg">
              <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
                <button
                  onClick={() => {
                    setShowProfile(false)
                    handleContactFreelancer(selectedFreelancer)
                  }}
                  className="group flex flex-1 cursor-pointer items-center justify-center gap-3 rounded-xl border-2 border-cyan-500 bg-white px-6 py-4 font-semibold text-cyan-600 transition-all hover:-translate-y-0.5 hover:bg-gradient-to-r hover:from-cyan-500 hover:to-teal-500 hover:text-white hover:shadow-lg hover:shadow-cyan-500/30"
                >
                  <i className="ri-chat-3-line text-xl transition-transform group-hover:scale-110"></i>
                  <span>Contactar Ahora</span>
                </button>
                <button
                  onClick={() => {
                    setShowProfile(false)
                    handleHireFreelancer(selectedFreelancer)
                  }}
                  className="group flex flex-1 cursor-pointer items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-4 font-semibold text-white shadow-lg shadow-emerald-500/30 transition-all hover:-translate-y-0.5 hover:scale-[1.02] hover:shadow-xl hover:shadow-emerald-500/40"
                >
                  <i className="ri-secure-payment-line text-xl transition-transform group-hover:scale-110"></i>
                  <span>Contratar Ahora</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* -------------------------- Chat Modal -------------------------- */}
      {showChat && selectedConversation && (
        <ConversationModal
          selectedConversation={selectedConversation}
          setShowChat={setShowChat}
          setChatMessages={setChatMessages}
          setSelectedConversation={setSelectedConversation}
          setNewMessage={setNewMessage}
          chatLoading={chatLoading}
          chatMessages={chatMessages}
          user={currentProfile}
          newMessage={newMessage}
          handleKeyPress={handleKeyPress}
          sendingMessage={sendingMessage}
          sendMessage={sendMessage}
        />
      )}
    </section>
  )
}

/* -------------------------------------------------------------------------- */
/*               SIMPLE LIST-STYLE FREELANCER GRID (NAMED EXPORT)            */
/* -------------------------------------------------------------------------- */

/**
 * This component provides a lightweight list view of freelancers.
 * It is exported as a **named** export to avoid colliding with the default export above.
 */
export const FreelancerGridList = ({
  freelancers,
  loading,
}: {
  freelancers: Freelancer[]
  loading: boolean
}) => {
  const navigate = useRouter()

  const handleViewProfile = (freelancer: Freelancer) => {
    const slug = freelancer.full_name
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "")

    navigate.push(`/freelancer/${slug}`)
  }

  const handleShareProfile = (freelancer: Freelancer, platform: string) => {
    const slug = freelancer.full_name
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "")

    const profileUrl = `${window.location.origin}/freelancer/${slug}`
    const shareText = `¡Conoce a ${freelancer.full_name}, ${freelancer.skills
      .slice(0, 3)
      .join(", ")} en GDN Pro! 💼`

    let shareUrl = ""

    switch (platform) {
      case "linkedin":
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
          profileUrl,
        )}&title=${encodeURIComponent(shareText)}`
        break
      case "twitter":
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
          shareText,
        )}&url=${encodeURIComponent(profileUrl)}`
        break
      case "whatsapp":
        shareUrl = `https://wa.me/?text=${encodeURIComponent(`${shareText} ${profileUrl}`)}`
        break
      case "copy":
        navigator.clipboard.writeText(profileUrl)
        const notification = document.createElement("div")
        notification.className =
          "fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50"
        notification.textContent = "¡Enlace copiado!"
        document.body.appendChild(notification)
        setTimeout(() => document.body.removeChild(notification), 3000)
        return
    }

    if (shareUrl) window.open(shareUrl, "_blank", "width=600,height=400")
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="animate-pulse rounded-xl border border-gray-100 bg-white p-6 shadow-sm"
          >
            <div className="mb-4 flex items-center">
              <div className="h-16 w-16 rounded-full bg-gray-200" />
              <div className="ml-4 flex-1">
                <div className="mb-2 h-4 rounded bg-gray-200" />
                <div className="h-3 w-2/3 rounded bg-gray-200" />
              </div>
            </div>
            <div className="mb-4 space-y-2">
              <div className="h-3 rounded bg-gray-200" />
              <div className="h-3 w-4/5 rounded bg-gray-200" />
            </div>
            <div className="mb-4 flex flex-wrap gap-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-6 w-16 rounded-full bg-gray-200" />
              ))}
            </div>
            <div className="h-10 rounded bg-gray-200" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {freelancers.map((freelancer) => (
        <div
          key={freelancer.id}
          className="group rounded-xl border border-gray-100 bg-white p-6 shadow-sm transition-all hover:shadow-lg"
        >
          {/* Header */}
          <div className="mb-4 flex items-center">
            <div className="relative">
              {freelancer.avatar_url ? (
                <img
                  src={freelancer.avatar_url}
                  alt={freelancer.full_name}
                  className="h-16 w-16 rounded-full border-2 border-gray-100 object-cover object-top"
                />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600">
                  <span className="text-lg font-semibold text-white">
                    {freelancer.full_name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <div className="absolute -right-1 -bottom-1 h-5 w-5 rounded-full border-2 border-white bg-green-500" />
            </div>

            <div className="ml-4 flex-1">
              <h3 className="text-lg font-semibold text-gray-900">{freelancer.full_name}</h3>
              <div className="flex items-center text-sm text-gray-600">
                <i className="ri-star-fill mr-1 text-yellow-400" />
                <span>{freelancer.rating ?? 5.0}</span>
                <span className="mx-2">•</span>
                <span>{freelancer.completed_projects ?? 0} proyectos</span>
              </div>
            </div>

            {/* Share button */}
            <div className="group/share relative">
              <button className="p-2 text-gray-400 opacity-0 transition-colors group-hover:opacity-100 hover:text-emerald-600">
                <i className="ri-share-line text-lg" />
              </button>

              {/* Share menu */}
              <div className="invisible absolute top-full right-0 z-10 mt-2 min-w-[160px] rounded-lg border border-gray-200 bg-white py-2 opacity-0 shadow-lg transition-all duration-200 group-hover/share:visible group-hover/share:opacity-100">
                <button
                  onClick={() => handleShareProfile(freelancer, "linkedin")}
                  className="flex w-full items-center px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                >
                  <i className="ri-linkedin-fill text-primary mr-3" />
                  LinkedIn
                </button>
                <button
                  onClick={() => handleShareProfile(freelancer, "twitter")}
                  className="flex w-full items-center px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                >
                  <i className="ri-twitter-fill mr-3 text-blue-400" />
                  Twitter
                </button>
                <button
                  onClick={() => handleShareProfile(freelancer, "whatsapp")}
                  className="flex w-full items-center px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                >
                  <i className="ri-whatsapp-fill mr-3 text-green-500" />
                  WhatsApp
                </button>
                <button
                  onClick={() => handleShareProfile(freelancer, "copy")}
                  className="flex w-full items-center px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                >
                  <i className="ri-link mr-3 text-gray-500" />
                  Copiar enlace
                </button>
              </div>
            </div>
          </div>

          {/* Bio */}
          <p className="mb-4 line-clamp-2 text-sm text-gray-600">
            {freelancer.bio || "Profesional experimentado listo para ayudarte con tus proyectos."}
          </p>

          {/* Skills */}
          <div className="mb-4 flex flex-wrap gap-2">
            {freelancer.skills.slice(0, 2).map((skill, i) => (
              <span
                key={i}
                className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700"
              >
                {skill}
              </span>
            ))}
            {freelancer.skills.length > 3 && (
              <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
                +{freelancer.skills.length - 3} más
              </span>
            )}
          </div>

          {/* Rate & Experience */}
          <div className="mb-4 flex items-center justify-between text-sm">
            <div className="flex items-center text-gray-600">
              <i className="ri-time-line mr-1" />
              <span>{freelancer.experience_years}+ años exp.</span>
            </div>
            <div className="font-semibold text-emerald-600">${freelancer.hourly_rate}/hora</div>
          </div>

          {/* Availability */}
          <div className="mb-4 flex items-center">
            <div className="flex items-center text-sm">
              <div className="mr-2 h-2 w-2 rounded-full bg-green-500"></div>
              <span className="text-gray-600 capitalize">{freelancer.availability}</span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => handleViewProfile(freelancer)}
              className="flex-1 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium whitespace-nowrap text-white transition-colors hover:bg-cyan-700"
            >
              Ver Perfil
            </button>
            <button className="rounded-lg border border-emerald-600 px-4 py-2 text-sm font-medium whitespace-nowrap text-emerald-600 transition-colors hover:bg-emerald-50">
              Contactar
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
