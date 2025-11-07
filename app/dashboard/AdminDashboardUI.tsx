"use client"

import { useState, useEffect } from "react"
import Layout from "@/components/Layout"
import { useAuth } from "@/contexts/AuthContext"
import WhatsAppSetup from "@/components/WhatsAppSetup"
import { supabaseBrowser } from "@/utils/supabase/client"

const supabase = supabaseBrowser()

interface ContactMessage {
  id: string
  name: string
  email: string
  company?: string
  phone?: string
  service: string
  budget: string
  timeline: string
  message: string
  created_at: string
  status: "new" | "read" | "responded"
}

export default function AdminContacts() {
  const { profile: user, loading: authLoading, refreshAuth } = useAuth()
  const [contacts, setContacts] = useState<ContactMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedContact, setSelectedContact] = useState<ContactMessage | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [searchTerm, setSearchTerm] = useState("")

  // Estados para respuesta
  const [showReplyModal, setShowReplyModal] = useState(false)
  const [replyMessage, setReplyMessage] = useState("")
  const [sendingReply, setSendingReply] = useState(false)

  // Estado para WhatsApp Setup
  const [showWhatsAppSetup, setShowWhatsAppSetup] = useState(false)

  useEffect(() => {
    document.title = "Admin Dashboard | GDN Pro"
    window.scrollTo(0, 0)

    // Wait for auth to finish loading before trying to load contacts
    if (!authLoading) {
      loadContacts()
    }
  }, [authLoading])

  useEffect(() => {
    if (!user && !authLoading) {
      refreshAuth()
    }
  }, [user, authLoading, refreshAuth])

  // Handle body overflow when modal opens/closes
  useEffect(() => {
    if (showModal || showReplyModal || showWhatsAppSetup) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }

    return () => {
      document.body.style.overflow = ""
    }
  }, [showModal, showReplyModal, showWhatsAppSetup])

  const loadContacts = async () => {
    try {
      // First validate user exists using getUser() (validates with server, won't hang)
      const { data: userData, error: userError } = (await Promise.race([
        supabase.auth.getUser(),
        new Promise<{ data: { user: null }; error: Error }>((_, reject) =>
          setTimeout(() => reject(new Error("Get user timeout")), 5000),
        ),
      ]).catch((error) => {
        return { data: { user: null }, error: error as Error }
      })) as { data: { user: any }; error: any }

      if (userError || !userData.user) {
        window.toast({
          title: "No hay sesión activa",
          type: "info",
          location: "bottom-center",
          dismissible: true,
          icon: true,
        })
        setLoading(false)
        return
      }

      // Now get the session token (should be fast since user is validated)
      let accessToken = ""
      try {
        const sessionResult = await Promise.race([
          supabase.auth.getSession(),
          new Promise<{ data: { session: null } }>((_, reject) =>
            setTimeout(() => reject(new Error("Session timeout")), 3000),
          ),
        ]).catch((error) => {
          if (error.message === "Session timeout") {
            return { data: { session: null } }
          }
          throw error
        })

        const {
          data: { session },
        } = sessionResult as {
          data: { session: any }
        }

        accessToken = session?.access_token || ""
      } catch (error) {
        // If getSession fails, try to get token another way or skip
        console.warn("Could not get session token, trying alternative method")
        // For now, we'll skip - the API call will fail but won't hang
      }

      if (!accessToken) {
        window.toast({
          title: "No se pudo obtener el token de acceso",
          type: "warning",
          location: "bottom-center",
          dismissible: true,
          icon: true,
        })
        setLoading(false)
        return
      }

      // Add timeout for fetch request
      const controller = new AbortController()
      const fetchTimeout = setTimeout(() => controller.abort(), 10000) // 10 second timeout

      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/contact-form-handler`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
            signal: controller.signal,
          },
        )

        clearTimeout(fetchTimeout)

        if (response.ok) {
          const result = await response.json()
          if (result.success) {
            setContacts(result.messages || [])
          }
        } else {
          console.error("Error loading messages:", response.statusText)
          setContacts([])
        }
      } catch (fetchError: any) {
        clearTimeout(fetchTimeout)
        if (fetchError.name === "AbortError") {
          console.error("Request timeout while loading contacts")
        } else {
          console.error("Error loading contacts:", fetchError)
        }
        setContacts([])
      }
    } catch (error: any) {
      console.error("Error loading contacts:", error)
      setContacts([])
    } finally {
      setLoading(false)
    }
  }

  const updateContactStatus = async (
    contactId: string,
    newStatus: "new" | "read" | "responded",
  ) => {
    try {
      // Actualizar localmente primero
      setContacts((prev) =>
        prev.map((contact) =>
          contact.id === contactId ? { ...contact, status: newStatus } : contact,
        ),
      )

      // Actualizar en la base de datos
      const { error } = await supabase
        .from("contact_messages")
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq("id", contactId)

      if (error) {
        console.error("Error updating status:", error)
        // Revertir cambio local si hay error
        loadContacts()
      }
    } catch (error) {
      console.error("Error updating status:", error)
      loadContacts()
    }
  }

  const viewContact = (contact: ContactMessage) => {
    setSelectedContact(contact)
    setShowModal(true)

    // Marcar como leído si es nuevo
    if (contact.status === "new") {
      updateContactStatus(contact.id, "read")
    }
  }

  // Enviar respuesta por email
  const sendReply = async () => {
    if (!selectedContact || !replyMessage.trim()) {
      window.toast({
        title: "Por favor, escribe un mensaje de respuesta",
        type: "warning",
        location: "bottom-center",
        dismissible: true,
        icon: true,
      })
      return
    }

    setSendingReply(true)

    try {
      const session = await supabase.auth.getSession()
      if (!session.data.session?.access_token) {
        throw new Error("No hay sesión activa")
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/contact-form-handler`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.data.session.access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: "send-reply",
            contactId: selectedContact.id,
            replyMessage: replyMessage.trim(),
            adminName: user?.full_name || "Administrador",
            adminEmail: user?.email || user?.email || "admin@empresa.com",
          }),
        },
      )

      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          window.toast({
            title: "Respuesta enviada correctamente al cliente",
            type: "success",
            location: "bottom-center",
            dismissible: true,
            icon: true,
          })

          // Marcar como respondido
          await updateContactStatus(selectedContact.id, "responded")

          // Cerrar modales y limpiar
          setShowReplyModal(false)
          setShowModal(false)
          setReplyMessage("")
          setSelectedContact(null)

          // Recargar contactos
          loadContacts()
        } else {
          throw new Error(result.error || "Error enviando respuesta")
        }
      } else {
        throw new Error("Error en el servidor")
      }
    } catch (error: unknown) {
      window.toast({
        title: "Error enviando respuesta",
        type: "error",
        location: "bottom-center",
        dismissible: true,
        icon: true,
      })
      console.error("Error sending response:", error)
    } finally {
      setSendingReply(false)
    }
  }

  const filteredContacts = contacts.filter((contact) => {
    const matchesStatus = filterStatus === "all" || contact.status === filterStatus
    const matchesSearch =
      searchTerm === "" ||
      contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.service.toLowerCase().includes(searchTerm.toLowerCase())

    return matchesStatus && matchesSearch
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case "new":
        return "bg-red-100 text-red-800"
      case "read":
        return "bg-yellow-100 text-yellow-800"
      case "responded":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "new":
        return "Nuevo"
      case "read":
        return "Leído"
      case "responded":
        return "Respondido"
      default:
        return "Desconocido"
    }
  }

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="border-primary mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2"></div>
          <p className="text-gray-600">Verificando acceso de administrador...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="mx-auto max-w-7xl px-4 py-8 pt-24 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 rounded-lg bg-white p-6 shadow">
          <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Panel de Administración</h1>
              <p className="text-gray-600">Gestión de Mensajes de Contacto</p>
              <div className="text-primary mt-2 inline-block rounded-full bg-blue-50 px-3 py-1 text-sm">
                <i className="ri-shield-check-line mr-1"></i>
                Acceso Exclusivo para Administradores
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-500">
                Bienvenido, {user?.full_name || user?.email || "Administrador"}
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                <i className="ri-admin-line text-primary"></i>
              </div>
            </div>
          </div>
        </div>

        {/* Configuración WhatsApp */}
        <div className="mb-8 rounded-lg border border-cyan-200 bg-gradient-to-r from-cyan-50 to-teal-50 p-6">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center md:gap-0">
            <div className="flex items-start space-x-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-green-100">
                <i className="ri-whatsapp-line text-xl text-green-600"></i>
              </div>
              <div className="flex-1">
                <h3 className="mb-2 text-lg font-semibold text-gray-900">
                  📱 Configuración WhatsApp Business
                </h3>
                <div className="space-y-1 text-gray-700">
                  <p>
                    <strong>Función:</strong> Recibe notificaciones de Sofia directamente en tu
                    WhatsApp
                  </p>
                  <p>
                    <strong>Beneficio:</strong> Responde a clientes desde tu celular sin estar
                    logueado
                  </p>
                  <p className="mt-2 inline-block rounded-full bg-green-100 px-3 py-1 text-sm text-green-700">
                    <i className="ri-notification-line mr-1"></i>
                    Notificaciones instantáneas en tu celular
                  </p>
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowWhatsAppSetup(true)}
              className="cursor-pointer rounded-lg bg-green-600 px-6 py-3 font-medium whitespace-nowrap text-white transition-colors hover:bg-green-700"
            >
              <i className="ri-settings-3-line mr-2"></i>
              Configurar WhatsApp
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-4">
          <div className="rounded-lg bg-white p-6 shadow">
            <div className="flex items-center">
              <div className="mr-4 flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
                <i className="ri-mail-line text-primary text-xl"></i>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{contacts.length}</p>
                <p className="text-sm text-gray-600">Total Mensajes</p>
              </div>
            </div>
          </div>

          <div className="rounded-lg bg-white p-6 shadow">
            <div className="flex items-center">
              <div className="mr-4 flex h-12 w-12 items-center justify-center rounded-lg bg-red-100">
                <i className="ri-notification-line text-xl text-red-600"></i>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {contacts.filter((c) => c.status === "new").length}
                </p>
                <p className="text-sm text-gray-600">Nuevos</p>
              </div>
            </div>
          </div>

          <div className="rounded-lg bg-white p-6 shadow">
            <div className="flex items-center">
              <div className="mr-4 flex h-12 w-12 items-center justify-center rounded-lg bg-yellow-100">
                <i className="ri-eye-line text-xl text-yellow-600"></i>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {contacts.filter((c) => c.status === "read").length}
                </p>
                <p className="text-sm text-gray-600">Leídos</p>
              </div>
            </div>
          </div>

          <div className="rounded-lg bg-white p-6 shadow">
            <div className="flex items-center">
              <div className="mr-4 flex h-12 w-12 items-center justify-center rounded-lg bg-green-100">
                <i className="ri-check-line text-xl text-green-600"></i>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {contacts.filter((c) => c.status === "responded").length}
                </p>
                <p className="text-sm text-gray-600">Respondidos</p>
              </div>
            </div>
          </div>
        </div>

        {/* Instrucciones de Acceso */}
        <div className="mb-8 rounded-lg border border-cyan-200 bg-gradient-to-r from-cyan-50 to-teal-50 p-6">
          <div className="flex items-start space-x-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-blue-100">
              <i className="ri-information-line text-primary text-xl"></i>
            </div>
            <div className="flex-1">
              <h3 className="mb-2 text-lg font-semibold text-gray-900">
                🔐 Panel de Administración Exclusivo
              </h3>
              <div className="space-y-2 text-gray-700">
                <p>
                  <strong>Acceso:</strong> Solo tú y tu equipo de desarrollo pueden acceder a este
                  panel.
                </p>
                <p>
                  <strong>Función:</strong> Aquí puedes ver y gestionar todos los mensajes del
                  formulario de contacto.
                </p>
                <p>
                  <strong>Respuestas:</strong> Puedes responder directamente desde aquí y el email
                  se enviará desde tu correo.
                </p>
                <div className="mt-4 rounded-lg border border-blue-200 bg-white p-3">
                  <p className="text-sm">
                    <strong>💡 Tip:</strong> Haz clic en "Ver detalles" para leer el mensaje
                    completo y responder al cliente.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filtros y Búsqueda */}
        <div className="mb-8 rounded-lg bg-white p-6 shadow">
          <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
            <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-4">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="rounded-lg border border-gray-300 px-4 py-2 pr-8 focus:border-transparent focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Todos los estados</option>
                <option value="new">Nuevos</option>
                <option value="read">Leídos</option>
                <option value="responded">Respondidos</option>
              </select>

              <button
                onClick={loadContacts}
                className="bg-primary cursor-pointer rounded-lg px-4 py-2 whitespace-nowrap text-white transition-colors hover:bg-cyan-700"
              >
                <i className="ri-refresh-line mr-2"></i>
                Actualizar
              </button>
            </div>

            <div className="relative">
              <input
                type="text"
                placeholder="Buscar por nombre, email, empresa..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-lg border border-gray-300 py-2 pr-4 pl-10 text-sm focus:border-transparent focus:ring-2 focus:ring-blue-500 sm:w-80"
              />
              <i className="ri-search-line absolute top-1/2 left-3 -translate-y-1/2 transform text-gray-400"></i>
            </div>
          </div>
        </div>

        {/* Lista de Contactos */}
        <div className="overflow-hidden rounded-lg bg-white shadow">
          <div className="border-b border-gray-200 px-6 py-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Mensajes de Contacto ({filteredContacts.length})
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                    Contacto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                    Servicio
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                    Presupuesto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {filteredContacts.map((contact) => (
                  <tr key={contact.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{contact.name}</div>
                        <div className="text-sm text-gray-500">{contact.email}</div>
                        {contact.company && (
                          <div className="text-xs text-gray-400">{contact.company}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{contact.service}</div>
                      <div className="text-xs text-gray-500">{contact.timeline}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{contact.budget}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getStatusColor(contact.status)}`}
                      >
                        {getStatusText(contact.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm whitespace-nowrap text-gray-500">
                      {new Date(contact.created_at).toLocaleDateString("es-ES")}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium whitespace-nowrap">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => viewContact(contact)}
                          className="text-primary cursor-pointer rounded-md bg-blue-50 px-3 py-1 transition-colors hover:bg-blue-100 hover:text-blue-900"
                          title="Ver detalles completos"
                        >
                          <i className="ri-eye-line mr-1"></i>
                          Ver detalles
                        </button>
                        <select
                          value={contact.status}
                          onChange={(e) =>
                            updateContactStatus(
                              contact.id,
                              e.target.value as "new" | "read" | "responded",
                            )
                          }
                          className="rounded border border-gray-300 px-2 py-1 pr-6 text-xs"
                          title="Cambiar estado"
                        >
                          <option value="new">Nuevo</option>
                          <option value="read">Leído</option>
                          <option value="responded">Respondido</option>
                        </select>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredContacts.length === 0 && (
            <div className="py-12 text-center">
              <i className="ri-mail-line mb-4 text-4xl text-gray-400"></i>
              <h3 className="mb-2 text-lg font-medium text-gray-900">
                {contacts.length === 0 ? "No hay mensajes aún" : "No se encontraron mensajes"}
              </h3>
              <p className="text-gray-600">
                {searchTerm || filterStatus !== "all"
                  ? "No se encontraron mensajes con los filtros aplicados."
                  : "Los mensajes del formulario de contacto aparecerán aquí."}
              </p>
              {contacts.length === 0 && (
                <div className="mx-auto mt-4 max-w-md rounded-lg bg-blue-50 p-4">
                  <p className="text-sm text-blue-800">
                    <i className="ri-lightbulb-line mr-1"></i>
                    Los nuevos mensajes aparecerán automáticamente cuando los visitantes usen el
                    formulario de contacto.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal de Configuración WhatsApp */}
      {showWhatsAppSetup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-xl bg-white">
            <div className="p-6">
              <div className="mb-6 flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    📱 Configuración WhatsApp Business
                  </h2>
                  <p className="mt-1 text-gray-600">
                    Conecta tu WhatsApp para recibir notificaciones de Sofia
                  </p>
                </div>
                <button
                  onClick={() => setShowWhatsAppSetup(false)}
                  className="cursor-pointer rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                >
                  <i className="ri-close-line text-2xl"></i>
                </button>
              </div>

              <WhatsAppSetup onClose={() => {}} />

              <div className="mt-6 flex justify-end border-t border-gray-200 pt-4">
                <button
                  onClick={() => setShowWhatsAppSetup(false)}
                  className="cursor-pointer rounded-lg bg-gray-600 px-6 py-3 font-medium whitespace-nowrap text-white transition-colors hover:bg-gray-700"
                >
                  <i className="ri-close-line mr-2"></i>
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Detalles */}
      {showModal && selectedContact && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-black/60 via-black/50 to-black/60 p-4 backdrop-blur-md">
          <div className="max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-black/5">
            {/* Modern Header with Gradient */}
            <div className="relative overflow-hidden bg-gradient-to-r from-cyan-600 via-cyan-500 to-teal-500 p-6 text-white sm:p-8">
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIyIi8+PC9nPjwvZz48L3N2Zz4=')] opacity-20"></div>
              <div className="relative z-10 flex items-start justify-between">
                <div className="flex-1 pr-4">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 ring-1 ring-white/30 backdrop-blur-sm">
                      <i className="ri-mail-line text-2xl"></i>
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold leading-tight sm:text-3xl">Mensaje de Contacto</h2>
                      <span
                        className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                          selectedContact.status === "new"
                            ? "bg-yellow-500/90 text-white"
                            : selectedContact.status === "read"
                              ? "bg-blue-500/90 text-white"
                              : "bg-green-500/90 text-white"
                        }`}
                      >
                        {getStatusText(selectedContact.status)}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowModal(false)
                    setSelectedContact(null)
                  }}
                  className="group flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/20 backdrop-blur-sm transition-all hover:scale-110 hover:bg-white/20"
                  aria-label="Cerrar"
                >
                  <i className="ri-close-line text-xl transition-transform group-hover:rotate-90"></i>
                </button>
              </div>
            </div>
            <div className="overflow-y-auto p-6" style={{ maxHeight: "calc(90vh - 200px)" }}>

              <div className="space-y-6">
                {/* Información del Contacto */}
                <div className="rounded-lg border border-cyan-200 bg-gradient-to-br from-cyan-50 to-teal-50 p-6">
                  <h3 className="mb-4 flex items-center font-semibold text-cyan-900">
                    <i className="ri-user-line mr-2"></i>
                    Información del Contacto
                  </h3>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="rounded-lg bg-white p-4">
                      <p className="text-sm font-medium text-gray-600">Nombre Completo</p>
                      <p className="text-lg font-semibold text-gray-900">{selectedContact.name}</p>
                    </div>
                    <div className="rounded-lg bg-white p-4">
                      <p className="text-sm font-medium text-gray-600">Email de Contacto</p>
                      <p className="text-primary text-lg font-semibold">{selectedContact.email}</p>
                    </div>
                    {selectedContact.company && (
                      <div className="rounded-lg bg-white p-4">
                        <p className="text-sm font-medium text-gray-600">Empresa</p>
                        <p className="text-lg font-semibold text-gray-900">
                          {selectedContact.company}
                        </p>
                      </div>
                    )}
                    {selectedContact.phone && (
                      <div className="rounded-lg bg-white p-4">
                        <p className="text-sm font-medium text-gray-600">Teléfono</p>
                        <p className="text-lg font-semibold text-gray-900">
                          {selectedContact.phone}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Detalles del Proyecto */}
                <div className="rounded-lg border border-cyan-200 bg-gradient-to-br from-cyan-50 to-teal-50 p-6">
                  <h3 className="mb-4 flex items-center font-semibold text-cyan-900">
                    <i className="ri-briefcase-line mr-2"></i>
                    Detalles del Proyecto Solicitado
                  </h3>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div className="rounded-lg bg-white p-4">
                      <p className="text-sm font-medium text-gray-600">Servicio Requerido</p>
                      <p className="text-lg font-semibold text-cyan-700">
                        {selectedContact.service}
                      </p>
                    </div>
                    <div className="rounded-lg bg-white p-4">
                      <p className="text-sm font-medium text-gray-600">Presupuesto Estimado</p>
                      <p className="text-lg font-semibold text-cyan-700">
                        {selectedContact.budget}
                      </p>
                    </div>
                    <div className="rounded-lg bg-white p-4">
                      <p className="text-sm font-medium text-gray-600">Timeline Esperado</p>
                      <p className="text-lg font-semibold text-cyan-700">
                        {selectedContact.timeline}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Mensaje Completo */}
                <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-6">
                  <h3 className="mb-4 flex items-center font-semibold text-yellow-900">
                    <i className="ri-message-3-line mr-2"></i>
                    Mensaje Completo del Cliente
                  </h3>
                  <div className="rounded-lg border border-yellow-300 bg-white p-6">
                    <p className="text-base leading-relaxed whitespace-pre-wrap text-gray-800">
                      {selectedContact.message}
                    </p>
                  </div>
                </div>

                {/* Información Adicional */}
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span className="flex items-center">
                      <i className="ri-calendar-line mr-2"></i>
                      Recibido: {new Date(selectedContact.created_at).toLocaleString("es-ES")}
                    </span>
                    <span className="flex items-center">
                      <i className="ri-hashtag mr-1"></i>
                      ID: {selectedContact.id}
                    </span>
                  </div>
                </div>
              </div>

              {/* Acciones */}
              <div className="sticky bottom-0 mt-8 flex flex-col gap-3 border-t border-gray-200 bg-gradient-to-b from-white to-gray-50 pt-6 sm:flex-row sm:gap-4">
                <button
                  onClick={() => {
                    setShowModal(false)
                    setSelectedContact(null)
                  }}
                  className="group flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-gray-300 bg-white px-6 py-3 font-semibold text-gray-700 transition-all hover:-translate-y-0.5 hover:border-gray-400 hover:bg-gray-50 hover:shadow-md"
                >
                  <i className="ri-close-line"></i>
                  <span>Cerrar</span>
                </button>

                {selectedContact.status !== "responded" && (
                  <button
                    onClick={() => {
                      updateContactStatus(selectedContact.id, "responded")
                    }}
                    className="group flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 px-6 py-3 font-semibold text-white shadow-lg shadow-green-500/30 transition-all hover:-translate-y-0.5 hover:scale-[1.02] hover:shadow-xl hover:shadow-green-500/40"
                  >
                    <i className="ri-check-line"></i>
                    <span>Marcar como Respondido</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    setShowReplyModal(true)
                    setReplyMessage(
                      `Hola ${selectedContact.name},\n\nGracias por contactarnos sobre tu proyecto de ${selectedContact.service}.\n\nHemos revisado tu solicitud y nos gustaría programar una llamada para discutir los detalles.\n\n¿Cuándo sería un buen momento para ti?\n\nSaludos,\n${user?.full_name || "Tu Equipo"}`,
                    )
                  }}
                  className="group flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 px-6 py-3 font-semibold text-white shadow-lg shadow-cyan-500/30 transition-all hover:-translate-y-0.5 hover:scale-[1.02] hover:shadow-xl hover:shadow-cyan-500/40"
                >
                  <i className="ri-reply-line"></i>
                  <span>Responder desde Dashboard</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Respuesta */}
      {showReplyModal && selectedContact && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-black/60 via-black/50 to-black/60 p-4 backdrop-blur-md"
          style={{ zIndex: 70 }}
        >
          <div className="max-h-[90vh] w-full max-w-3xl overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-black/5">
            {/* Modern Header with Gradient */}
            <div className="relative overflow-hidden bg-gradient-to-r from-cyan-600 via-cyan-500 to-teal-500 p-6 text-white sm:p-8">
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIyIi8+PC9nPjwvZz48L3N2Zz4=')] opacity-20"></div>
              <div className="relative z-10 flex items-start justify-between">
                <div className="flex-1 pr-4">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 ring-1 ring-white/30 backdrop-blur-sm">
                      <i className="ri-reply-line text-2xl"></i>
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold leading-tight sm:text-3xl">
                        Responder a {selectedContact.name}
                      </h2>
                      <p className="mt-2 text-sm text-cyan-100">
                        El email se enviará desde tu correo: {user?.email}
                      </p>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowReplyModal(false)
                    setReplyMessage("")
                  }}
                  className="group flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/20 backdrop-blur-sm transition-all hover:scale-110 hover:bg-white/20"
                  aria-label="Cerrar"
                >
                  <i className="ri-close-line text-xl transition-transform group-hover:rotate-90"></i>
                </button>
              </div>
            </div>
            <div className="overflow-y-auto p-6" style={{ maxHeight: "calc(90vh - 200px)" }}>

              {/* Información del destinatario */}
              <div className="mb-6 rounded-lg border border-cyan-200 bg-gradient-to-br from-cyan-50 to-teal-50 p-4">
                <div className="flex items-center">
                  <i className="ri-mail-line mr-3 text-xl text-cyan-600"></i>
                  <div>
                    <p className="font-semibold text-cyan-900">Para: {selectedContact.email}</p>
                    <p className="text-sm text-cyan-700">
                      Asunto: Re: {selectedContact.service} - Respuesta a tu consulta
                    </p>
                  </div>
                </div>
              </div>

              {/* Editor de mensaje */}
              <div className="mb-6">
                <label className="mb-3 block text-sm font-medium text-gray-700">
                  Mensaje de Respuesta:
                </label>
                <textarea
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  rows={12}
                  className="w-full resize-none rounded-xl border border-gray-300 bg-gradient-to-br from-gray-50 to-white px-4 py-3 text-gray-900 shadow-sm transition-all focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                  placeholder="Escribe tu respuesta aquí..."
                />
                <p className="text-gray-5 mt-2 text-xs">
                  💡 Tip: Personaliza el mensaje según las necesidades específicas del cliente
                </p>
              </div>

              {/* Acciones */}
              <div className="sticky bottom-0 flex flex-col gap-3 border-t border-gray-200 bg-gradient-to-b from-white to-gray-50 pt-6 sm:flex-row sm:gap-4">
                <button
                  onClick={() => {
                    setShowReplyModal(false)
                    setReplyMessage("")
                  }}
                  className="group flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-gray-300 bg-white px-6 py-3 font-semibold text-gray-700 transition-all hover:-translate-y-0.5 hover:border-gray-400 hover:bg-gray-50 hover:shadow-md disabled:opacity-50 disabled:hover:translate-y-0"
                  disabled={sendingReply}
                >
                  <i className="ri-close-line"></i>
                  <span>Cancelar</span>
                </button>

                <button
                  onClick={sendReply}
                  disabled={sendingReply || !replyMessage.trim()}
                  className="group flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 px-6 py-3 font-semibold text-white shadow-lg shadow-cyan-500/30 transition-all hover:-translate-y-0.5 hover:scale-[1.02] hover:shadow-xl hover:shadow-cyan-500/40 disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:scale-100"
                >
                  {sendingReply ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-white"></div>
                      <span>Enviando...</span>
                    </>
                  ) : (
                    <>
                      <i className="ri-send-plane-fill text-lg transition-transform group-hover:translate-x-1"></i>
                      <span>Enviar Respuesta</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
