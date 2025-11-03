"use client"

import { useState, useEffect } from "react"
import { removeAccents } from "@/libs/removeAccents"
import Layout from "@/components/Layout"
import type { Profile } from "@/interfaces/Profile"
import { useRouter, usePathname, useParams } from "next/navigation"
import { supabaseBrowser } from "@/utils/supabase/client"
import { ReviewsDisplayPublic } from "@/components/dashboard/ReviewsDisplayPublic"

const supabase = supabaseBrowser()

export default function FreelancerProfilePage() {
  const { slug } = useParams()
  const navigate = useRouter()
  const [freelancer, setFreelancer] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")
  const [showContactModal, setShowContactModal] = useState(false)

  useEffect(() => {
    document.title = "Freelancer | GDN Pro"
  }, [])

  useEffect(() => {
    loadFreelancerProfile()
  }, [slug])
  // 🔹 Estado para los proyectos completados
  const [completedProjects, setCompletedProjects] = useState(0)

  // 🔹 Cargar proyectos completados cuando el freelancer esté disponible
  useEffect(() => {
    if (freelancer?.id) {
      loadCompletedProjects(freelancer.id)
    }
  }, [freelancer])

  // 🔹 Función para contar proyectos completados desde Supabase
  const loadCompletedProjects = async (freelancerId: any) => {
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
      const matchedFreelancer = profiles?.find((profile) => {
        const profileSlug = profile.full_name
          ?.toLowerCase()
          .replace(/\s+/g, "-")
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

  const handleContact = () => {
    setShowContactModal(true)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="pt-20 pb-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="animate-pulse">
              <div className="bg-white rounded-xl shadow-sm p-8 mb-6">
                <div className="flex items-center mb-6">
                  <div className="w-24 h-24 bg-gray-200 rounded-full"></div>
                  <div className="ml-6 flex-1">
                    <div className="h-8 bg-gray-200 rounded mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-2/3 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded w-4/5"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/5"></div>
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
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Freelancer no encontrado
            </h1>
            <p className="text-gray-600 mb-6">
              El perfil que buscas no existe o ha sido eliminado.
            </p>
            <button
              onClick={() => navigate.replace("/freelancers")}
              className="bg-primary hover:bg-cyan-700 text-white px-6 py-3 rounded-lg font-medium transition-colors whitespace-nowrap"
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header del perfil */}
          <div className="bg-white rounded-xl shadow-md p-8 mb-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6">
              <div className="flex items-center mb-4 md:mb-0">
                <div className="relative">
                  {freelancer.avatar_url ? (
                    <img
                      src={freelancer.avatar_url}
                      alt={freelancer.full_name}
                      className="w-24 h-24 rounded-full object-cover object-top border-4 border-gray-100"
                    />
                  ) : (
                    <div className="w-24 h-24 bg-linear-to-br from-cyan-400 to-primary rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-2xl">
                        {freelancer.full_name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-cyan-500 rounded-full border-4 border-white"></div>
                </div>

                <div className="ml-6">
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    {freelancer.full_name}
                  </h1>
                  <div className="flex items-center text-gray-600 mb-2">
                    <i className="ri-star-fill text-yellow-400 mr-1"></i>
                    <span className="font-medium">
                      {freelancer.rating || 5.0}
                    </span>
                    <span className="mx-2">•</span>
                    <span>{completedProjects || 0} proyectos completados</span>
                    <span className="mx-2">•</span>
                    <span>
                      {freelancer.experience_years}+ años de experiencia
                    </span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-cyan-500 rounded-full mr-2"></div>
                    <span className="text-gray-600 capitalize">
                      {freelancer.availability}
                    </span>
                  </div>
                </div>
              </div>

              {/* Botones de acción */}
              <div className="flex flex-row gap-3">
                <div className="relative group">
                  <button className="flex items-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors whitespace-nowrap">
                    <i className="ri-share-line mr-2"></i>
                    Compartir
                  </button>

                  {/* Menú de compartir */}
                  <div className="absolute right-0 top-full mt-2 bg-white rounded-lg shadow-lg border border-gray-200 py-2 min-w-40 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                    <button
                      onClick={() => handleShare("linkedin")}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                    >
                      <i className="ri-linkedin-fill text-primary mr-3"></i>
                      LinkedIn
                    </button>
                    <button
                      onClick={() => handleShare("twitter")}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                    >
                      <i className="ri-twitter-fill text-blue-400 mr-3"></i>
                      Twitter
                    </button>
                    <button
                      onClick={() => handleShare("whatsapp")}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                    >
                      <i className="ri-whatsapp-fill text-cyan-500 mr-3"></i>
                      WhatsApp
                    </button>
                    <button
                      onClick={() => handleShare("copy")}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                    >
                      <i className="ri-link text-gray-500 mr-3"></i>
                      Copiar enlace
                    </button>
                  </div>
                </div>

                <button
                  onClick={handleContact}
                  className="bg-primary hover:bg-cyan-700 text-white px-6 py-2 rounded-lg font-medium transition-colors whitespace-nowrap"
                >
                  Contactar
                </button>
              </div>
            </div>

            {/* Precio */}
            <div className="bg-primary/5 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-cyan-700 mb-1">Tarifa por hora</p>
                  <p className="text-2xl font-bold text-cyan-800">
                    ${freelancer.hourly_rate}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-cyan-700 mb-1">Disponibilidad</p>
                  <p className="font-medium text-cyan-800 capitalize">
                    {freelancer.availability}
                  </p>
                </div>
              </div>
            </div>

            {/* Skills */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Habilidades
              </h3>
              <div className="flex flex-wrap gap-2">
                {freelancer.skills.map((skill, index) => (
                  <span
                    key={index}
                    className="px-4 py-2 bg-primary/10 text-primary rounded-full font-medium"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            {/* Bio */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Acerca de mí
              </h3>
              <p className="text-gray-700 leading-relaxed">
                {freelancer.bio ||
                  "Profesional experimentado con pasión por crear soluciones innovadoras y de alta calidad. Comprometido con la excelencia en cada proyecto y la satisfacción del cliente."}
              </p>
            </div>
          </div>

          {/* Tabs de contenido */}
          <div className="bg-white rounded-xl shadow-md">
            <div className="border-b border-gray-200">
              <nav className="flex space-x-8 px-8">
                {[
                  { id: "overview", label: "Resumen", icon: "ri-user-line" },
                  // {  id: "portfolio", label: "Portafolio", icon: "ri-folder-line", }, //
                  { id: "reviews", label: "Reseñas", icon: "ri-star-line" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                      activeTab === tab.id
                        ? "border-cyan-500 text-primary"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    <i className={`${tab.icon} mr-2`}></i>
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>

            <div className="p-8">
              {activeTab === "overview" && (
                <div className="space-y-6">
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">
                      Experiencia Profesional
                    </h4>
                    <p className="text-gray-700">
                      Con más de {freelancer.experience_years} años de
                      experiencia en el campo, he trabajado en diversos
                      proyectos que van desde startups hasta empresas Fortune
                      500. Mi enfoque se centra en entregar soluciones de alta
                      calidad que superen las expectativas del cliente.
                    </p>
                  </div>

                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">
                      Estadísticas
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="text-center p-4 bg-gray-50 rounded-lg">
                        <div className="text-2xl font-bold text-primary">
                          {completedProjects}
                        </div>
                        <div className="text-sm text-gray-600">
                          Proyectos completados
                        </div>
                      </div>

                      <div className="text-center p-4 bg-gray-50 rounded-lg">
                        <div className="text-2xl font-bold text-primary">
                          {freelancer.rating || 5.0}
                        </div>
                        <div className="text-sm text-gray-600">
                          Calificación Promedio
                        </div>
                      </div>
                      <div className="text-center p-4 bg-gray-50 rounded-lg">
                        <div className="text-2xl font-bold text-primary">
                          100%
                        </div>
                        <div className="text-sm text-gray-600">
                          Tasa de Éxito
                        </div>
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
                        <div className="h-48 bg-linear-to-br from-cyan-400 to-primary flex items-center justify-center">
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
                  <h4 className="text-lg font-semibold text-gray-900 mb-6">
                    Reseñas de Clientes
                  </h4>

                  <ReviewsDisplayPublic freelancerId={freelancer.id} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal de contacto */}
      {showContactModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Contactar a {freelancer.full_name}
              </h3>
              <button
                onClick={() => setShowContactModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <i className="ri-close-line text-xl"></i>
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-gray-600">
                Para contactar a este freelancer, necesitas tener una cuenta en
                GDN Pro.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowContactModal(false)
                    navigate.push("/login")
                  }}
                  className="flex-1 bg-primary hover:bg-cyan-700 text-white py-2 px-4 rounded-lg font-medium transition-colors whitespace-nowrap"
                >
                  Iniciar Sesión
                </button>
                <button
                  onClick={() => {
                    setShowContactModal(false)
                    navigate.push("/register")
                  }}
                  className="flex-1 border border-primary text-primary hover:bg-emerald-50 py-2 px-4 rounded-lg font-medium transition-colors whitespace-nowrap"
                >
                  Registrarse
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}
