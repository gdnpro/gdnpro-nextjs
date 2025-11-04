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

  const handleContact = () => {
    setShowContactModal(true)
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
              className="bg-primary rounded-lg px-6 py-3 font-medium whitespace-nowrap text-white transition-colors hover:bg-cyan-700"
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
          <div className="mb-6 rounded-xl bg-white p-8 shadow-md">
            <div className="mb-6 flex flex-col items-start justify-between md:flex-row md:items-center">
              <div className="mb-4 flex items-center md:mb-0">
                <div className="relative">
                  {freelancer.avatar_url ? (
                    <img
                      src={freelancer.avatar_url}
                      alt={freelancer.full_name}
                      className="h-24 w-24 rounded-full border-4 border-gray-100 object-cover object-top"
                    />
                  ) : (
                    <div className="to-primary flex h-24 w-24 items-center justify-center rounded-full bg-linear-to-br from-cyan-400">
                      <span className="text-2xl font-bold text-white">
                        {freelancer.full_name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div className="absolute -right-1 -bottom-1 h-6 w-6 rounded-full border-4 border-white bg-cyan-500"></div>
                </div>

                <div className="ml-6">
                  <h1 className="mb-2 text-3xl font-bold text-gray-900">{freelancer.full_name}</h1>
                  <div className="mb-2 flex items-center text-gray-600">
                    <i className="ri-star-fill mr-1 text-yellow-400"></i>
                    <span className="font-medium">{freelancer.rating || 5.0}</span>
                    <span className="mx-2">•</span>
                    <span>{completedProjects || 0} proyectos completados</span>
                    <span className="mx-2">•</span>
                    <span>{freelancer.experience_years}+ años de experiencia</span>
                  </div>
                  <div className="flex items-center">
                    <div className="mr-2 h-3 w-3 rounded-full bg-cyan-500"></div>
                    <span className="text-gray-600 capitalize">{freelancer.availability}</span>
                  </div>
                </div>
              </div>

              {/* Botones de acción */}
              <div className="flex flex-row gap-3">
                <div className="group relative">
                  <button className="flex items-center rounded-lg border border-gray-300 px-4 py-2 whitespace-nowrap text-gray-700 transition-colors hover:bg-gray-50">
                    <i className="ri-share-line mr-2"></i>
                    Compartir
                  </button>

                  {/* Menú de compartir */}
                  <div className="invisible absolute top-full right-0 z-10 mt-2 min-w-40 rounded-lg border border-gray-200 bg-white py-2 opacity-0 shadow-lg transition-all duration-200 group-hover:visible group-hover:opacity-100">
                    <button
                      onClick={() => handleShare("linkedin")}
                      className="flex w-full items-center px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <i className="ri-linkedin-fill text-primary mr-3"></i>
                      LinkedIn
                    </button>
                    <button
                      onClick={() => handleShare("twitter")}
                      className="flex w-full items-center px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <i className="ri-twitter-fill mr-3 text-blue-400"></i>
                      Twitter
                    </button>
                    <button
                      onClick={() => handleShare("whatsapp")}
                      className="flex w-full items-center px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <i className="ri-whatsapp-fill mr-3 text-cyan-500"></i>
                      WhatsApp
                    </button>
                    <button
                      onClick={() => handleShare("copy")}
                      className="flex w-full items-center px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <i className="ri-link mr-3 text-gray-500"></i>
                      Copiar enlace
                    </button>
                  </div>
                </div>

                <button
                  onClick={handleContact}
                  className="bg-primary rounded-lg px-6 py-2 font-medium whitespace-nowrap text-white transition-colors hover:bg-cyan-700"
                >
                  Contactar
                </button>
              </div>
            </div>

            {/* Precio */}
            <div className="bg-primary/5 mb-6 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="mb-1 text-sm text-cyan-700">Tarifa por hora</p>
                  <p className="text-2xl font-bold text-cyan-800">${freelancer.hourly_rate}</p>
                </div>
                <div className="text-right">
                  <p className="mb-1 text-sm text-cyan-700">Disponibilidad</p>
                  <p className="font-medium text-cyan-800 capitalize">{freelancer.availability}</p>
                </div>
              </div>
            </div>

            {/* Skills */}
            <div className="mb-6">
              <h3 className="mb-3 text-lg font-semibold text-gray-900">Habilidades</h3>
              <div className="flex flex-wrap gap-2">
                {freelancer.skills.map((skill, index) => (
                  <span
                    key={index}
                    className="bg-primary/10 text-primary rounded-full px-4 py-2 font-medium"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            {/* Bio */}
            <div>
              <h3 className="mb-3 text-lg font-semibold text-gray-900">Acerca de mí</h3>
              <p className="leading-relaxed text-gray-700">
                {freelancer.bio ||
                  "Profesional experimentado con pasión por crear soluciones innovadoras y de alta calidad. Comprometido con la excelencia en cada proyecto y la satisfacción del cliente."}
              </p>
            </div>
          </div>

          {/* Tabs de contenido */}
          <div className="rounded-xl bg-white shadow-md">
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
                    className={`flex items-center border-b-2 px-1 py-4 text-sm font-medium whitespace-nowrap ${
                      activeTab === tab.id
                        ? "text-primary border-cyan-500"
                        : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
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
                      <div className="rounded-lg bg-gray-50 p-4 text-center">
                        <div className="text-primary text-2xl font-bold">{completedProjects}</div>
                        <div className="text-sm text-gray-600">Proyectos completados</div>
                      </div>

                      <div className="rounded-lg bg-gray-50 p-4 text-center">
                        <div className="text-primary text-2xl font-bold">
                          {freelancer.rating || 5.0}
                        </div>
                        <div className="text-sm text-gray-600">Calificación Promedio</div>
                      </div>
                      <div className="rounded-lg bg-gray-50 p-4 text-center">
                        <div className="text-primary text-2xl font-bold">100%</div>
                        <div className="text-sm text-gray-600">Tasa de Éxito</div>
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
                Para contactar a este freelancer, necesitas tener una cuenta en GDN Pro.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowContactModal(false)
                    navigate.push("/login")
                  }}
                  className="bg-primary flex-1 rounded-lg px-4 py-2 font-medium whitespace-nowrap text-white transition-colors hover:bg-cyan-700"
                >
                  Iniciar Sesión
                </button>
                <button
                  onClick={() => {
                    setShowContactModal(false)
                    navigate.push("/register")
                  }}
                  className="border-primary text-primary flex-1 rounded-lg border px-4 py-2 font-medium whitespace-nowrap transition-colors hover:bg-emerald-50"
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
