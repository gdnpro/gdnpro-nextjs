"use client"

import { useState, useEffect } from "react"
import Layout from "@/components/Layout"
import { useAuth } from "@/components/AuthContext"
import WhatsAppSetup from "@/components/feature/WhatsAppSetup"
import { supabaseBrowser } from "@/utils/supabase/client"
import ProtectedRoute from "@/components/feature/ProtectedRoute"

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
  const { user, profile, loading: authLoading } = useAuth()
  const [contacts, setContacts] = useState<ContactMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedContact, setSelectedContact] = useState<ContactMessage | null>(
    null
  )
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
    document.title = "Contactos | GDN Pro"
    window.scrollTo(0, 0)

    loadContacts()
  }, [])

  const loadContacts = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        window.toast({
          title: "No hay sesión activa",
          type: "info",
          location: "bottom-center",
          dismissible: true,
          icon: true,
        })
        return
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/contact-form-handler`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
          },
        }
      )

      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          setContacts(result.messages || [])
        }
      } else {
        console.error("Error cargando mensajes:", response.statusText)
        setContacts([])
      }
    } catch (error) {
      console.error("Error cargando contactos:", error)
      setContacts([])
    } finally {
      setLoading(false)
    }
  }

  const updateContactStatus = async (
    contactId: string,
    newStatus: "new" | "read" | "responded"
  ) => {
    try {
      // Actualizar localmente primero
      setContacts((prev) =>
        prev.map((contact) =>
          contact.id === contactId ? { ...contact, status: newStatus } : contact
        )
      )

      // Actualizar en la base de datos
      const { error } = await supabase
        .from("contact_messages")
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq("id", contactId)

      if (error) {
        console.error("Error actualizando estado:", error)
        // Revertir cambio local si hay error
        loadContacts()
      }
    } catch (error) {
      console.error("Error actualizando estado:", error)
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
            adminName: profile?.full_name || "Administrador",
            adminEmail: user?.email || "admin@empresa.com",
          }),
        }
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
    } catch (error: any) {
      window.toast({
        title: "Error enviando respuesta",
        type: "error",
        location: "bottom-center",
        dismissible: true,
        icon: true,
      })
      console.error("Error enviando respuesta:", error)
    } finally {
      setSendingReply(false)
    }
  }

  const filteredContacts = contacts.filter((contact) => {
    const matchesStatus =
      filterStatus === "all" || contact.status === filterStatus
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">
            Verificando acceso de administrador...
          </p>
        </div>
      </div>
    )
  }

  return (
    <ProtectedRoute requiredRole="admin">
      <Layout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
          {/* Header */}
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Panel de Administración
                </h1>
                <p className="text-gray-600">Gestión de Mensajes de Contacto</p>
                <div className="mt-2 text-sm text-primary bg-blue-50 px-3 py-1 rounded-full inline-block">
                  <i className="ri-shield-check-line mr-1"></i>
                  Acceso Exclusivo para Administradores
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-sm text-gray-500">
                  Bienvenido, {profile?.full_name || user?.email}
                </div>
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <i className="ri-admin-line text-primary"></i>
                </div>
              </div>
            </div>
          </div>

          {/* Configuración WhatsApp */}
          <div className="bg-linear-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-6 mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center shrink-0">
                  <i className="ri-whatsapp-line text-xl text-green-600"></i>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    📱 Configuración WhatsApp Business
                  </h3>
                  <div className="text-gray-700 space-y-1">
                    <p>
                      <strong>Función:</strong> Recibe notificaciones de Sofia
                      directamente en tu WhatsApp
                    </p>
                    <p>
                      <strong>Beneficio:</strong> Responde a clientes desde tu
                      celular sin estar logueado
                    </p>
                    <p className="text-sm text-green-700 bg-green-100 px-3 py-1 rounded-full inline-block mt-2">
                      <i className="ri-notification-line mr-1"></i>
                      Notificaciones instantáneas en tu celular
                    </p>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowWhatsAppSetup(true)}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors whitespace-nowrap cursor-pointer font-medium"
              >
                <i className="ri-settings-3-line mr-2"></i>
                Configurar WhatsApp
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                  <i className="ri-mail-line text-xl text-primary"></i>
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {contacts.length}
                  </p>
                  <p className="text-sm text-gray-600">Total Mensajes</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mr-4">
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

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mr-4">
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

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4">
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
          <div className="bg-linear-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6 mb-8">
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
                <i className="ri-information-line text-xl text-primary"></i>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  🔐 Panel de Administración Exclusivo
                </h3>
                <div className="text-gray-700 space-y-2">
                  <p>
                    <strong>Acceso:</strong> Solo tú y tu equipo de desarrollo
                    pueden acceder a este panel.
                  </p>
                  <p>
                    <strong>Función:</strong> Aquí puedes ver y gestionar todos
                    los mensajes del formulario de contacto.
                  </p>
                  <p>
                    <strong>Respuestas:</strong> Puedes responder directamente
                    desde aquí y el email se enviará desde tu correo.
                  </p>
                  <div className="mt-4 p-3 bg-white rounded-lg border border-blue-200">
                    <p className="text-sm">
                      <strong>💡 Tip:</strong> Haz clic en "Ver detalles" para
                      leer el mensaje completo y responder al cliente.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Filtros y Búsqueda */}
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-8"
                >
                  <option value="all">Todos los estados</option>
                  <option value="new">Nuevos</option>
                  <option value="read">Leídos</option>
                  <option value="responded">Respondidos</option>
                </select>

                <button
                  onClick={loadContacts}
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-cyan-700 transition-colors whitespace-nowrap cursor-pointer"
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
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full sm:w-80 text-sm"
                />
                <i className="ri-search-line absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
              </div>
            </div>
          </div>

          {/* Lista de Contactos */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                Mensajes de Contacto ({filteredContacts.length})
              </h2>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contacto
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Servicio
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Presupuesto
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredContacts.map((contact) => (
                    <tr key={contact.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {contact.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {contact.email}
                          </div>
                          {contact.company && (
                            <div className="text-xs text-gray-400">
                              {contact.company}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {contact.service}
                        </div>
                        <div className="text-xs text-gray-500">
                          {contact.timeline}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {contact.budget}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(contact.status)}`}
                        >
                          {getStatusText(contact.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(contact.created_at).toLocaleDateString(
                          "es-ES"
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => viewContact(contact)}
                            className="text-primary hover:text-blue-900 cursor-pointer bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded-md transition-colors"
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
                                e.target.value as any
                              )
                            }
                            className="text-xs border border-gray-300 rounded px-2 py-1 pr-6"
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
              <div className="text-center py-12">
                <i className="ri-mail-line text-4xl text-gray-400 mb-4"></i>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {contacts.length === 0
                    ? "No hay mensajes aún"
                    : "No se encontraron mensajes"}
                </h3>
                <p className="text-gray-600">
                  {searchTerm || filterStatus !== "all"
                    ? "No se encontraron mensajes con los filtros aplicados."
                    : "Los mensajes del formulario de contacto aparecerán aquí."}
                </p>
                {contacts.length === 0 && (
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg max-w-md mx-auto">
                    <p className="text-sm text-blue-800">
                      <i className="ri-lightbulb-line mr-1"></i>
                      Los nuevos mensajes aparecerán automáticamente cuando los
                      visitantes usen el formulario de contacto.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Modal de Configuración WhatsApp */}
        {showWhatsAppSetup && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      📱 Configuración WhatsApp Business
                    </h2>
                    <p className="text-gray-600 mt-1">
                      Conecta tu WhatsApp para recibir notificaciones de Sofia
                    </p>
                  </div>
                  <button
                    onClick={() => setShowWhatsAppSetup(false)}
                    className="text-gray-400 hover:text-gray-600 cursor-pointer p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <i className="ri-close-line text-2xl"></i>
                  </button>
                </div>

                <WhatsAppSetup onClose={() => {}} />

                <div className="flex justify-end mt-6 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => setShowWhatsAppSetup(false)}
                    className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors cursor-pointer whitespace-nowrap font-medium"
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
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      📧 Mensaje de Contacto
                    </h2>
                    <span
                      className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full mt-2 ${getStatusColor(selectedContact.status)}`}
                    >
                      {getStatusText(selectedContact.status)}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      setShowModal(false)
                      setSelectedContact(null)
                    }}
                    className="text-gray-400 hover:text-gray-600 cursor-pointer p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <i className="ri-close-line text-2xl"></i>
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Información del Contacto */}
                  <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
                    <h3 className="font-semibold text-blue-900 mb-4 flex items-center">
                      <i className="ri-user-line mr-2"></i>
                      Información del Contacto
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-white rounded-lg p-4">
                        <p className="text-sm text-gray-600 font-medium">
                          Nombre Completo
                        </p>
                        <p className="font-semibold text-lg text-gray-900">
                          {selectedContact.name}
                        </p>
                      </div>
                      <div className="bg-white rounded-lg p-4">
                        <p className="text-sm text-gray-600 font-medium">
                          Email de Contacto
                        </p>
                        <p className="font-semibold text-lg text-primary">
                          {selectedContact.email}
                        </p>
                      </div>
                      {selectedContact.company && (
                        <div className="bg-white rounded-lg p-4">
                          <p className="text-sm text-gray-600 font-medium">
                            Empresa
                          </p>
                          <p className="font-semibold text-lg text-gray-900">
                            {selectedContact.company}
                          </p>
                        </div>
                      )}
                      {selectedContact.phone && (
                        <div className="bg-white rounded-lg p-4">
                          <p className="text-sm text-gray-600 font-medium">
                            Teléfono
                          </p>
                          <p className="font-semibold text-lg text-gray-900">
                            {selectedContact.phone}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Detalles del Proyecto */}
                  <div className="bg-emerald-50 rounded-lg p-6 border border-emerald-200">
                    <h3 className="font-semibold text-emerald-900 mb-4 flex items-center">
                      <i className="ri-briefcase-line mr-2"></i>
                      Detalles del Proyecto Solicitado
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-white rounded-lg p-4">
                        <p className="text-sm text-gray-600 font-medium">
                          Servicio Requerido
                        </p>
                        <p className="font-semibold text-lg text-emerald-700">
                          {selectedContact.service}
                        </p>
                      </div>
                      <div className="bg-white rounded-lg p-4">
                        <p className="text-sm text-gray-600 font-medium">
                          Presupuesto Estimado
                        </p>
                        <p className="font-semibold text-lg text-emerald-700">
                          {selectedContact.budget}
                        </p>
                      </div>
                      <div className="bg-white rounded-lg p-4">
                        <p className="text-sm text-gray-600 font-medium">
                          Timeline Esperado
                        </p>
                        <p className="font-semibold text-lg text-emerald-700">
                          {selectedContact.timeline}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Mensaje Completo */}
                  <div className="bg-yellow-50 rounded-lg p-6 border border-yellow-200">
                    <h3 className="font-semibold text-yellow-900 mb-4 flex items-center">
                      <i className="ri-message-3-line mr-2"></i>
                      Mensaje Completo del Cliente
                    </h3>
                    <div className="bg-white border border-yellow-300 rounded-lg p-6">
                      <p className="text-gray-800 leading-relaxed whitespace-pre-wrap text-base">
                        {selectedContact.message}
                      </p>
                    </div>
                  </div>

                  {/* Información Adicional */}
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="flex justify-between items-center text-sm text-gray-600">
                      <span className="flex items-center">
                        <i className="ri-calendar-line mr-2"></i>
                        Recibido:{" "}
                        {new Date(selectedContact.created_at).toLocaleString(
                          "es-ES"
                        )}
                      </span>
                      <span className="flex items-center">
                        <i className="ri-hashtag mr-1"></i>
                        ID: {selectedContact.id}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Acciones */}
                <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-3 mt-8 pt-6 border-t border-gray-200">
                  <button
                    onClick={() => {
                      setShowModal(false)
                      setSelectedContact(null)
                    }}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer whitespace-nowrap font-medium"
                  >
                    <i className="ri-close-line mr-2"></i>
                    Cerrar
                  </button>

                  {selectedContact.status !== "responded" && (
                    <button
                      onClick={() => {
                        updateContactStatus(selectedContact.id, "responded")
                      }}
                      className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors cursor-pointer whitespace-nowrap font-medium"
                    >
                      <i className="ri-check-line mr-2"></i>
                      Marcar como Respondido
                    </button>
                  )}

                  <button
                    onClick={() => {
                      setShowReplyModal(true)
                      setReplyMessage(
                        `Hola ${selectedContact.name},\n\nGracias por contactarnos sobre tu proyecto de ${selectedContact.service}.\n\nHemos revisado tu solicitud y nos gustaría programar una llamada para discutir los detalles.\n\n¿Cuándo sería un buen momento para ti?\n\nSaludos,\n${profile?.full_name || "Tu Equipo"}`
                      )
                    }}
                    className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-cyan-700 transition-colors whitespace-nowrap font-medium"
                  >
                    <i className="ri-reply-line mr-2"></i>
                    Responder desde Dashboard
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Respuesta */}
        {showReplyModal && selectedContact && (
          <div
            className="fixed inset-0 bg-black/60 flex items-center justify-center p-4"
            style={{ zIndex: 70 }}
          >
            <div className="bg-white rounded-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      📧 Responder a {selectedContact.name}
                    </h2>
                    <p className="text-gray-600 mt-1">
                      El email se enviará desde tu correo: {user?.email}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setShowReplyModal(false)
                      setReplyMessage("")
                    }}
                    className="text-gray-400 hover:text-gray-600 cursor-pointer p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <i className="ri-close-line text-2xl"></i>
                  </button>
                </div>

                {/* Información del destinatario */}
                <div className="bg-blue-50 rounded-lg p-4 mb-6 border border-blue-200">
                  <div className="flex items-center">
                    <i className="ri-mail-line text-primary mr-3 text-xl"></i>
                    <div>
                      <p className="font-semibold text-blue-900">
                        Para: {selectedContact.email}
                      </p>
                      <p className="text-cyan-700 text-sm">
                        Asunto: Re: {selectedContact.service} - Respuesta a tu
                        consulta
                      </p>
                    </div>
                  </div>
                </div>

                {/* Editor de mensaje */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Mensaje de Respuesta:
                  </label>
                  <textarea
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    rows={12}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    placeholder="Escribe tu respuesta aquí..."
                  />
                  <p
                    className="text-xs text-gray-5

                mt-2"
                  >
                    💡 Tip: Personaliza el mensaje según las necesidades
                    específicas del cliente
                  </p>
                </div>

                {/* Acciones */}
                <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-3 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => {
                      setShowReplyModal(false)
                      setReplyMessage("")
                    }}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer whitespace-nowrap font-medium"
                    disabled={sendingReply}
                  >
                    <i className="ri-close-line mr-2"></i>
                    Cancelar
                  </button>

                  <button
                    onClick={sendReply}
                    disabled={sendingReply || !replyMessage.trim()}
                    className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-cyan-700 transition-colors whitespace-nowrap font-medium disabled:bg-gray-400 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {sendingReply ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2 inline-block"></div>
                        Enviando...
                      </>
                    ) : (
                      <>
                        <i className="ri-send-plane-line mr-2"></i>
                        Enviar Respuesta
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </Layout>
    </ProtectedRoute>
  )
}
