"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabaseBrowser } from "@/utils/supabase/client"
import { Freelancer } from "@/interfaces/Freelancer"
import { ChatMessage } from "@/interfaces/ChatMessage"

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
  const [filteredFreelancers, setFilteredFreelancers] = useState<Freelancer[]>(
    []
  )
  const [loading, setLoading] = useState(true)
  const [selectedFreelancer, setSelectedFreelancer] =
    useState<Freelancer | null>(null)
  const [showProfile, setShowProfile] = useState(false)
  const [showChat, setShowChat] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [currentProfile, setCurrentProfile] = useState<any>(null)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [chatLoading, setChatLoading] = useState(false)
  const [sendingMessage, setSendingMessage] = useState(false)
  const [showAllFreelancers, setShowAllFreelancers] = useState(false)
  const [sortBy, setSortBy] = useState("rating")

  useEffect(() => {
    loadFreelancers()
    checkCurrentUser()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [freelancers, searchFilters, sortBy])

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
            freelancer.skills?.some((skill) =>
              skill.toLowerCase().includes(searchTerm)
            )
        )
      }

      // Category filter
      if (searchFilters.category) {
        filtered = filtered.filter((freelancer) =>
          freelancer.skills?.some((skill) =>
            skill.toLowerCase().includes(searchFilters.category.toLowerCase())
          )
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
        const [minExp, maxExp] = experienceMap[searchFilters.experience] || [
          0, 100,
        ]
        filtered = filtered.filter(
          (freelancer) =>
            freelancer.experience_years >= minExp &&
            freelancer.experience_years <= maxExp
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
          (freelancer) =>
            freelancer.hourly_rate >= minRate &&
            freelancer.hourly_rate <= maxRate
        )
      }

      // Availability filter
      if (searchFilters.availability) {
        if (searchFilters.availability === "Disponible ahora") {
          filtered = filtered.filter(
            (freelancer) => freelancer.availability === "Disponible"
          )
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

  const loadFreelancers = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_type", "freelancer")
        .eq("is_active", true)
        .order("rating", { ascending: false })

      if (error) {
        console.error("Error loading freelancers:", error)
        setFreelancers([])
        return
      }

      const enhancedFreelancers = (data ?? []).map((freelancer: any) => ({
        ...freelancer,
        avatar_url:
          freelancer.avatar_url ||
          `${getGenderFromName(
            freelancer.full_name
          )}%20hispanic%20software%20developer%20portrait%2C%20confident%20tech%20professional%2C%20modern%20office%20background%2C%20programmer%20headshot%2C%20professional%20developer%20photo&width=300&height=300&seq=freelancer${freelancer.id}&orientation=squarish`,
        completed_projects:
          Math.floor(Math.random() * 50) + freelancer.experience_years * 10,
        response_time: ["1 hora", "2 horas", "3 horas", "4 horas"][
          Math.floor(Math.random() * 4)
        ],
        languages: ["Español", "Inglés"],
        availability:
          Math.random() > 0.3 ? "Disponible" : "Ocupado hasta Feb 15",
        location:
          freelancer.location ||
          ["Ciudad de México", "Guadalajara", "Monterrey", "Puebla"][
            Math.floor(Math.random() * 4)
          ],
        rating: parseFloat(freelancer.rating ?? "5.0"),
        hourly_rate: parseFloat(freelancer.hourly_rate ?? "25"),
        total_reviews:
          freelancer.total_reviews ?? Math.floor(Math.random() * 100) + 20,
      }))

      setFreelancers(enhancedFreelancers)
    } catch (err) {
      console.error("Error loading freelancers:", err)
      setFreelancers([])
    } finally {
      setLoading(false)
    }
  }

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
        }
      )

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Error ${response.status}: ${errorText}`)
      }

      const data = await response.json()

      if (data.success) {
        setConversationId(data.conversation.id)
        await loadMessages(data.conversation.id)
      } else {
        throw new Error(data.error || "Error al crear conversación")
      }
    } catch (err: any) {
      window.toast({
        title: "Error al iniciar el chat",
        type: "error",
        location: "bottom-center",
        dismissible: true,
        icon: true,
      })
      console.error("Error creating chat:", err)
      setShowChat(false)
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
        }
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
    if (!newMessage.trim() || !conversationId || sendingMessage) {
      console.log(
        "❌ No se puede enviar: mensaje vacío, sin conversación o ya enviando"
      )
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
            conversationId,
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
        await loadMessages(conversationId)
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
    } catch (err: any) {
      window.toast({
        title: "Error al enviar mensaje",
        type: "error",
        location: "bottom-center",
        dismissible: true,
        icon: true,
      })
      console.error("Error enviando mensaje:", err)
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

  const displayedFreelancers = showAllFreelancers
    ? filteredFreelancers
    : filteredFreelancers.slice(0, 6)

  if (loading) {
    return (
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
          </div>
        </div>
      </section>
    )
  }

  if (filteredFreelancers.length === 0) {
    return (
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              No se encontraron freelancers
            </h3>
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
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header + Sorting */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h3 className="text-2xl font-bold text-gray-900">
              Freelancers Destacados
            </h3>
            <p className="text-gray-600">
              Mostrando {displayedFreelancers.length} de{" "}
              {filteredFreelancers.length} freelancers
              {searchFilters &&
                (searchFilters.search ||
                  searchFilters.category ||
                  searchFilters.experience ||
                  searchFilters.budget) &&
                " (filtrados)"}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-4">
            <span className="text-gray-600">Ordenar por:</span>
            <div className="relative w-full sm:w-auto">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full sm:w-auto px-4 py-2 pr-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none cursor-pointer"
              >
                <option value="rating">Mejor calificados</option>
                <option value="price-low">Precio: menor a mayor</option>
                <option value="price-high">Precio: mayor a menor</option>
                <option value="projects">Más proyectos</option>
                <option value="response">Respuesta más rápida</option>
              </select>
              <i className="ri-arrow-down-s-line absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {displayedFreelancers.map((freelancer) => (
            <div
              key={freelancer.id}
              className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all  hover:-translate-y-1"
            >
              <div className="p-4 flex flex-col justify-between h-full">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="size-16 bg-primary/10 rounded-full mb-4 overflow-hidden">
                      {freelancer.avatar_url ? (
                        <img
                          src={freelancer.avatar_url}
                          alt={freelancer.full_name}
                          className="size-16 object-cover object-top"
                        />
                      ) : (
                        <i className="ri-user-line text-2xl text-primary" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">
                        {freelancer.full_name}
                      </h3>
                      <div
                        className={`px-3 py-1 mb-2 w-fit rounded-full text-xs font-semibold ${
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
                      <p className="text-gray-500 text-sm flex items-center">
                        <i className="ri-map-pin-line mr-1" />
                        {freelancer.location}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Rating */}
                <div className="flex items-center mb-4">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <i
                        key={i}
                        className={`ri-star-fill ${
                          i < Math.floor(freelancer.rating)
                            ? "text-yellow-400"
                            : "text-gray-300"
                        }`}
                      />
                    ))}
                    <span className="ml-2 text-gray-600 font-semibold">
                      {freelancer.rating}
                    </span>
                    <span className="ml-1 text-gray-500">
                      ({freelancer.total_reviews} reviews)
                    </span>
                  </div>
                </div>

                {/* Bio */}
                <div className="flex-1 h-full">
                  <p className="text-gray-600 mb-4 leading-relaxed">
                    {freelancer.bio ||
                      "Freelancer profesional con experiencia comprobada."}
                  </p>

                  {/* Skills */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {freelancer.skills?.slice(0, 3).map((skill, idx) => (
                      <span
                        key={idx}
                        className="bg-blue-100 text-cyan-700 px-3 py-1 rounded-full text-sm font-medium"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4 mb-6 text-sm text-gray-600">
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
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-2xl font-bold text-gray-900">
                      ${freelancer.hourly_rate}/hora
                    </div>
                    <div className="flex items-center text-gray-600">
                      {freelancer.languages?.map((lang, idx) => (
                        <span
                          key={idx}
                          className="text-xs bg-gray-100 px-2 py-1 rounded mr-1"
                        >
                          {lang}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => handleContactFreelancer(freelancer)}
                    className="flex-1 bg-primary hover:bg-cyan-700 text-white py-3 rounded-xl font-semibold transition-all  whitespace-nowrap cursor-pointer"
                  >
                    Contactar
                  </button>
                  <button
                    onClick={() => handleViewProfile(freelancer)}
                    className="flex-1 border border-primary text-primary hover:bg-blue-50 py-3 rounded-xl font-semibold transition-all  whitespace-nowrap cursor-pointer"
                  >
                    Ver Perfil
                  </button>
                </div>

                <div className="mt-3">
                  <button
                    onClick={() => handleHireFreelancer(freelancer)}
                    className="w-full bg-primary hover:bg-cyan-700 text-white py-3 rounded-xl font-semibold transition-all  whitespace-nowrap cursor-pointer flex items-center justify-center"
                  >
                    <i className="ri-secure-payment-line mr-2" />
                    Contratar Ahora - ${freelancer.hourly_rate * 10}
                  </button>
                  <p className="text-xs text-gray-500 text-center mt-1">
                    Pago seguro con Stripe • Estimación 10 horas
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Show all / less button */}
        {filteredFreelancers.length > 6 && (
          <div className="text-center mt-12">
            <button
              onClick={handleViewAllFreelancers}
              className="bg-primary hover:bg-cyan-700 text-white px-8 py-4 rounded-full text-lg font-semibold transition-all  whitespace-nowrap cursor-pointer"
            >
              {showAllFreelancers
                ? "Ver Menos Freelancers"
                : `Ver Todos los Freelancers (${filteredFreelancers.length})`}
            </button>
          </div>
        )}
      </div>

      {/* -------------------------- Profile Modal -------------------------- */}
      {showProfile && selectedFreelancer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Header */}
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  Perfil del Freelancer
                </h2>
                <button
                  onClick={() => setShowProfile(false)}
                  className="text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  <i className="ri-close-line text-2xl" />
                </button>
              </div>

              {/* Main Info */}
              <div className="flex items-center mb-6">
                <img
                  src={selectedFreelancer.avatar_url}
                  alt={selectedFreelancer.full_name}
                  className="w-24 h-24 rounded-full object-cover object-top mr-6"
                />
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">
                    {selectedFreelancer.full_name}
                  </h3>
                  <p className="text-primary font-semibold text-lg">
                    {selectedFreelancer.skills?.[0]
                      ? `${selectedFreelancer.skills[0]} Specialist`
                      : "Freelancer"}
                  </p>
                  <p className="text-gray-600">{selectedFreelancer.location}</p>
                  <div className="flex items-center mt-2">
                    <span className="text-yellow-500 mr-1">
                      {selectedFreelancer.rating}★
                    </span>
                    <span className="text-gray-600">
                      ({selectedFreelancer.total_reviews} reseñas)
                    </span>
                  </div>
                  <p className="text-gray-500 mt-1">
                    {selectedFreelancer.experience_years} años de experiencia
                  </p>
                </div>
              </div>

              {/* Summary stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900">
                    ${selectedFreelancer.hourly_rate}
                  </div>
                  <div className="text-gray-600">Por hora</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900">
                    {selectedFreelancer.completed_projects}
                  </div>
                  <div className="text-gray-600">Proyectos</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900">
                    {selectedFreelancer.response_time}
                  </div>
                  <div className="text-gray-600">Respuesta</div>
                </div>
              </div>

              {/* Sections */}
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-3">
                  Acerca de
                </h4>
                <p className="text-gray-700 leading-relaxed">
                  {selectedFreelancer.bio}
                </p>
              </div>

              <div className="mb-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-3">
                  Habilidades
                </h4>
                <div className="flex flex-wrap gap-2">
                  {selectedFreelancer.skills?.map((skill, idx) => (
                    <span
                      key={idx}
                      className="bg-blue-100 text-cyan-700 px-3 py-2 rounded-full text-sm font-medium"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mb-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-3">
                  Información de Contacto
                </h4>
                <p className="text-gray-600">
                  Email: {selectedFreelancer.email}
                </p>
              </div>

              {/* Action buttons */}
              <div className="flex gap-4">
                <button
                  onClick={() => {
                    setShowProfile(false)
                    handleContactFreelancer(selectedFreelancer)
                  }}
                  className="flex-1 bg-primary hover:bg-cyan-700 text-white py-3 rounded-xl font-semibold transition-all  whitespace-nowrap cursor-pointer"
                >
                  <i className="ri-chat-3-line mr-2" />
                  Contactar Ahora
                </button>
                <button
                  onClick={() => {
                    setShowProfile(false)
                    handleHireFreelancer(selectedFreelancer)
                  }}
                  className="flex-1 bg-emerald-600 hover:bg-cyan-700 text-white py-3 rounded-xl font-semibold transition-all  whitespace-nowrap cursor-pointer"
                >
                  <i className="ri-secure-payment-line mr-2" />
                  Contratar Ahora
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* -------------------------- Chat Modal -------------------------- */}
      {showChat && selectedFreelancer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl h-[80vh] flex flex-col">
            {/* Header */}
            <div className="bg-primary text-white p-4 rounded-t-2xl flex items-center justify-between">
              <div className="flex items-center">
                <img
                  src={selectedFreelancer.avatar_url}
                  alt={selectedFreelancer.full_name}
                  className="w-10 h-10 rounded-full object-cover object-top mr-3"
                />
                <div>
                  <h3 className="font-semibold">
                    {selectedFreelancer.full_name}
                  </h3>
                  <p className="text-blue-100 text-sm">
                    {selectedFreelancer.skills?.[0]} Specialist
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowChat(false)
                  setChatMessages([])
                  setConversationId(null)
                  setNewMessage("")
                }}
                className="hover:bg-cyan-700 p-2 rounded cursor-pointer"
              >
                <i className="ri-close-line text-xl" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
              {chatLoading ? (
                <div className="flex justify-center items-center h-full">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                  <span className="ml-2 text-gray-600">
                    Cargando conversación...
                  </span>
                </div>
              ) : (
                <div className="space-y-4">
                  {chatMessages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${
                        message.sender_id === currentProfile?.id
                          ? "justify-end"
                          : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                          message.sender_id === currentProfile?.id
                            ? "bg-primary text-white"
                            : message.sender_id === null
                              ? "bg-yellow-100 text-yellow-800 border border-yellow-300"
                              : "bg-white text-gray-900 border border-gray-200"
                        }`}
                      >
                        <p className="text-sm">{message.message_text}</p>
                        <p
                          className={`text-xs mt-1 ${
                            message.sender_id === currentProfile?.id
                              ? "text-blue-100"
                              : "text-gray-500"
                          }`}
                        >
                          {new Date(message.created_at).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  ))}

                  {chatMessages.length === 0 && !chatLoading && (
                    <div className="text-center text-gray-500 py-8">
                      <i className="ri-chat-3-line text-4xl mb-4" />
                      <p>
                        Inicia la conversación con{" "}
                        {selectedFreelancer.full_name.split(" ")[0]}
                      </p>
                      <p className="text-sm mt-2">
                        Tu primer mensaje aparecerá aquí
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Input area */}
            <div className="p-4 border-t bg-white rounded-b-2xl">
              <div className="flex items-center space-x-3">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Escribe tu mensaje..."
                  disabled={chatLoading || !conversationId || sendingMessage}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm disabled:bg-gray-100"
                />
                <button
                  onClick={sendMessage}
                  disabled={
                    !newMessage.trim() ||
                    chatLoading ||
                    !conversationId ||
                    sendingMessage
                  }
                  className="w-12 h-12 bg-primary hover:bg-cyan-700 disabled:bg-gray-300 text-white rounded-full flex items-center justify-center transition-colors cursor-pointer"
                >
                  {sendingMessage ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  ) : (
                    <i className="ri-send-plane-line" />
                  )}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2 flex items-center">
                <i className="ri-shield-check-line mr-1" />
                Chat seguro monitoreado por GDN Pro
              </p>
            </div>
          </div>
        </div>
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
          profileUrl
        )}&title=${encodeURIComponent(shareText)}`
        break
      case "twitter":
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
          shareText
        )}&url=${encodeURIComponent(profileUrl)}`
        break
      case "whatsapp":
        shareUrl = `https://wa.me/?text=${encodeURIComponent(
          `${shareText} ${profileUrl}`
        )}`
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 animate-pulse"
          >
            <div className="flex items-center mb-4">
              <div className="w-16 h-16 bg-gray-200 rounded-full" />
              <div className="ml-4 flex-1">
                <div className="h-4 bg-gray-200 rounded mb-2" />
                <div className="h-3 bg-gray-200 rounded w-2/3" />
              </div>
            </div>
            <div className="space-y-2 mb-4">
              <div className="h-3 bg-gray-200 rounded" />
              <div className="h-3 bg-gray-200 rounded w-4/5" />
            </div>
            <div className="flex flex-wrap gap-2 mb-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-6 bg-gray-200 rounded-full w-16" />
              ))}
            </div>
            <div className="h-10 bg-gray-200 rounded" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {freelancers.map((freelancer) => (
        <div
          key={freelancer.id}
          className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-lg transition-all  p-6 group"
        >
          {/* Header */}
          <div className="flex items-center mb-4">
            <div className="relative">
              {freelancer.avatar_url ? (
                <img
                  src={freelancer.avatar_url}
                  alt={freelancer.full_name}
                  className="w-16 h-16 rounded-full object-cover object-top border-2 border-gray-100"
                />
              ) : (
                <div className="w-16 h-16 bg-linear-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold text-lg">
                    {freelancer.full_name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white" />
            </div>

            <div className="ml-4 flex-1">
              <h3 className="font-semibold text-gray-900 text-lg">
                {freelancer.full_name}
              </h3>
              <div className="flex items-center text-sm text-gray-600">
                <i className="ri-star-fill text-yellow-400 mr-1" />
                <span>{freelancer.rating ?? 5.0}</span>
                <span className="mx-2">•</span>
                <span>{freelancer.completed_projects ?? 0} proyectos</span>
              </div>
            </div>

            {/* Share button */}
            <div className="relative group/share">
              <button className="p-2 text-gray-400 hover:text-emerald-600 transition-colors opacity-0 group-hover:opacity-100">
                <i className="ri-share-line text-lg" />
              </button>

              {/* Share menu */}
              <div className="absolute right-0 top-full mt-2 bg-white rounded-lg shadow-lg border border-gray-200 py-2 min-w-[160px] opacity-0 invisible group-hover/share:opacity-100 group-hover/share:visible transition-all duration-200 z-10">
                <button
                  onClick={() => handleShareProfile(freelancer, "linkedin")}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                >
                  <i className="ri-linkedin-fill text-primary mr-3" />
                  LinkedIn
                </button>
                <button
                  onClick={() => handleShareProfile(freelancer, "twitter")}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                >
                  <i className="ri-twitter-fill text-blue-400 mr-3" />
                  Twitter
                </button>
                <button
                  onClick={() => handleShareProfile(freelancer, "whatsapp")}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                >
                  <i className="ri-whatsapp-fill text-green-500 mr-3" />
                  WhatsApp
                </button>
                <button
                  onClick={() => handleShareProfile(freelancer, "copy")}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                >
                  <i className="ri-link text-gray-500 mr-3" />
                  Copiar enlace
                </button>
              </div>
            </div>
          </div>

          {/* Bio */}
          <p className="text-gray-600 text-sm mb-4 line-clamp-2">
            {freelancer.bio ||
              "Profesional experimentado listo para ayudarte con tus proyectos."}
          </p>

          {/* Skills */}
          <div className="flex flex-wrap gap-2 mb-4">
            {freelancer.skills.slice(0, 2).map((skill, i) => (
              <span
                key={i}
                className="px-3 py-1 bg-emerald-50 text-emerald-700 text-xs rounded-full font-medium"
              >
                {skill}
              </span>
            ))}
            {freelancer.skills.length > 3 && (
              <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs rounded-full font-medium">
                +{freelancer.skills.length - 3} más
              </span>
            )}
          </div>

          {/* Rate & Experience */}
          <div className="flex items-center justify-between mb-4 text-sm">
            <div className="flex items-center text-gray-600">
              <i className="ri-time-line mr-1" />
              <span>{freelancer.experience_years}+ años exp.</span>
            </div>
            <div className="font-semibold text-emerald-600">
              ${freelancer.hourly_rate}/hora
            </div>
          </div>

          {/* Availability */}
          <div className="flex items-center mb-4">
            <div className="flex items-center text-sm">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
              <span className="text-gray-600 capitalize">
                {freelancer.availability}
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => handleViewProfile(freelancer)}
              className="flex-1 bg-emerald-600 hover:bg-cyan-700 text-white py-2 px-4 rounded-lg font-medium transition-colors text-sm whitespace-nowrap"
            >
              Ver Perfil
            </button>
            <button className="px-4 py-2 border border-emerald-600 text-emerald-600 hover:bg-emerald-50 rounded-lg font-medium transition-colors text-sm whitespace-nowrap">
              Contactar
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
