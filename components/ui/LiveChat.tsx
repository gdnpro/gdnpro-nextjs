"use client"

import { useState, useEffect, useRef } from "react"

interface Message {
  id: string
  sender_id: string
  message: string
  created_at: string
  sender_type: "client" | "admin"
}

interface Conversation {
  id: string
  client_name?: string
  status: "active" | "closed"
  created_at: string
}

export default function LiveChat() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [clientName, setClientName] = useState("")
  const [isNameSet, setIsNameSet] = useState(false)
  const [conversation, setConversation] = useState<Conversation | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isWaitingForResponse, setIsWaitingForResponse] = useState(false)
  const [lastCheckedMessageId, setLastCheckedMessageId] = useState<
    string | null
  >(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages, isOpen])

  useEffect(() => {
    let interval: NodeJS.Timeout

    if (conversation && isWaitingForResponse) {
      // Verificar respuestas del admin cada 2 segundos (más frecuente)
      interval = setInterval(checkForAdminResponse, 2000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [conversation, isWaitingForResponse, lastCheckedMessageId])

  const checkForAdminResponse = async () => {
    if (!conversation) return

    try {
      console.log(
        "🔍 Checking admin response for conversation:",
        conversation.id
      )

      const response = await fetch(
        "https://kdmdhhhppizzlhvauofe.supabase.co/functions/v1/whatsapp-integration?action=get-admin-response",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            conversationId: conversation.id,
          }),
        }
      )

      if (response.ok) {
        const data = await response.json()
        console.log("📨 Server response:", data)

        if (data.success && data.admin_response) {
          const adminMessage = data.admin_response

          console.log("💬 Admin message found:", {
            id: adminMessage.id,
            message: adminMessage.message.substring(0, 50) + "...",
            created_at: adminMessage.created_at,
          })

          // Verificar si es un mensaje nuevo que no hemos mostrado
          const isNewMessage = !messages.some(
            (msg) =>
              msg.id === adminMessage.id ||
              (msg.sender_id === "admin" &&
                msg.created_at === adminMessage.created_at)
          )

          // También verificar contra el último mensaje verificado
          const isNewerThanLastChecked =
            !lastCheckedMessageId || adminMessage.id !== lastCheckedMessageId

          console.log("🔄 Message verification:", {
            isNewMessage,
            isNewerThanLastChecked,
            lastCheckedMessageId,
            currentMessageId: adminMessage.id,
          })

          if (isNewMessage && isNewerThanLastChecked) {
            console.log("✅ Adding new admin message")

            const newAdminMessage: Message = {
              id: adminMessage.id,
              sender_id: "admin",
              message: adminMessage.message,
              created_at: adminMessage.created_at,
              sender_type: "admin",
            }

            setMessages((prev) => {
              // Verificar una vez más que no esté duplicado
              const exists = prev.some((msg) => msg.id === adminMessage.id)
              if (exists) {
                console.log("⚠️ Message already exists, not adding")
                return prev
              }
              console.log("📝 Adding message to list")
              return [...prev, newAdminMessage]
            })

            setIsWaitingForResponse(false)
            setLastCheckedMessageId(adminMessage.id)
          } else {
            console.log("ℹ️ Message already processed or not new")
          }
        } else {
          console.log("📭 No new admin responses")
        }
      } else {
        console.error("❌ Error in server response:", response.status)
      }
    } catch (error) {
      console.error("❌ Error checking admin response:", error)
    }
  }

  const startConversation = async () => {
    if (!clientName.trim()) return

    setIsLoading(true)
    setIsNameSet(true)

    try {
      // Guardar nombre del cliente
      localStorage.setItem("clientName", clientName)

      console.log("🆕 Starting conversation for:", clientName)

      // Usar el edge function para crear la conversación de soporte
      const response = await fetch(
        "https://kdmdhhhppizzlhvauofe.supabase.co/functions/v1/whatsapp-integration?action=create-support-conversation",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            clientName: clientName,
          }),
        }
      )

      const data = await response.json()

      if (response.ok && data.success && data.conversation) {
        setConversation(data.conversation)
        console.log("✅ Conversation created:", data.conversation.id)

        // Mensaje de bienvenida
        const welcomeMessage: Message = {
          id: "welcome",
          sender_id: "system",
          message: `¡Hola ${clientName}! 👋 Soy Liah, tu asistente virtual. Un especialista real te responderá en breve. ¿En qué puedo ayudarte?`,
          created_at: new Date().toISOString(),
          sender_type: "admin",
        }

        setMessages([welcomeMessage])
      } else {
        console.error("Error in server response:", data)
        throw new Error(data.error || "Error creando conversación")
      }
    } catch (error) {
      console.error("Error starting conversation:", error)

      // Fallback: crear conversación local sin base de datos
      const fallbackConversation: Conversation = {
        id: "local-" + Date.now(),
        client_name: clientName,
        status: "active",
        created_at: new Date().toISOString(),
      }

      setConversation(fallbackConversation)

      const welcomeMessage: Message = {
        id: "welcome",
        sender_id: "system",
        message: `¡Hola ${clientName}! 👋 Soy Liah, tu asistente virtual. Un especialista real te responderá en breve. ¿En qué puedo ayudarte?`,
        created_at: new Date().toISOString(),
        sender_type: "admin",
      }

      setMessages([welcomeMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !conversation || isLoading) return

    const clientMessage: Message = {
      id: Date.now().toString(),
      sender_id: "client",
      message: newMessage,
      created_at: new Date().toISOString(),
      sender_type: "client",
    }

    setMessages((prev) => [...prev, clientMessage])
    setIsLoading(true)
    setIsWaitingForResponse(true)

    console.log("📤 Sending message:", newMessage.substring(0, 50) + "...")

    try {
      // Enviar mensaje a WhatsApp del admin
      const response = await fetch(
        "https://kdmdhhhppizzlhvauofe.supabase.co/functions/v1/whatsapp-integration?action=send-to-whatsapp",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            conversationId: conversation.id,
            clientMessage: newMessage,
            clientName: clientName,
          }),
        }
      )

      const data = await response.json()

      if (response.ok && data.success) {
        console.log("✅ Message sent successfully")

        // Mostrar mensaje de confirmación
        const confirmMessage: Message = {
          id: "confirm-" + Date.now(),
          sender_id: "system",
          message:
            "✅ Tu mensaje ha sido enviado. El especialista te responderá por WhatsApp en breve...",
          created_at: new Date().toISOString(),
          sender_type: "admin",
        }

        setMessages((prev) => [...prev, confirmMessage])

        // Iniciar verificación inmediata de respuestas
        setTimeout(() => {
          console.log("🔄 Starting response verification...")
          checkForAdminResponse()
        }, 1000)
      } else {
        console.error("Error in server response:", data)
        throw new Error(data.error || "Error enviando mensaje")
      }
    } catch (error) {
      console.error("Error sending message:", error)

      const errorMessage: Message = {
        id: "error-" + Date.now(),
        sender_id: "system",
        message: "❌ Error enviando mensaje. Por favor intenta nuevamente.",
        created_at: new Date().toISOString(),
        sender_type: "admin",
      }

      setMessages((prev) => [...prev, errorMessage])
      setIsWaitingForResponse(false)
    } finally {
      setNewMessage("")
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      if (isNameSet) {
        sendMessage()
      } else {
        startConversation()
      }
    }
  }

  return (
    <>
      {/* Botón del Chat */}
      <div className="fixed bottom-4 right-4 z-40 sm:bottom-6 sm:right-6">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="bg-primary hover:bg-cyan-700 active:bg-cyan-800 text-white rounded-full size-14 sm:size-16 flex items-center justify-center shadow-lg transition-all cursor-pointer group touch-manipulation"
          aria-label={isOpen ? "Cerrar chat" : "Abrir chat"}
        >
          {isOpen ? (
            <i className="ri-close-line text-2xl sm:text-3xl"></i>
          ) : (
            <>
              <i className="ri-message-3-line text-2xl sm:text-3xl group-hover:scale-110 transition-transform"></i>
              {isWaitingForResponse && (
                <span className="absolute top-1 right-1 bg-green-500 w-4 h-4 rounded-full animate-pulse"></span>
              )}
            </>
          )}
        </button>
      </div>

      {/* Ventana del Chat */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-white sm:inset-auto sm:bottom-24 sm:right-6 sm:w-96 sm:h-[500px] sm:rounded-lg sm:shadow-2xl sm:border sm:border-gray-200 animate-slide-up">
          {/* Header */}
          <div className="bg-primary text-white p-4 sm:rounded-t-lg flex items-center justify-between shrink-0">
            <div className="flex items-center min-w-0 flex-1">
              <div className="w-10 h-10 bg-cyan-700/30 rounded-full flex items-center justify-center mr-3 shrink-0">
                <i className="ri-customer-service-2-line text-lg"></i>
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-sm sm:text-base truncate">Liah - Asistente Virtual</h3>
                <p className="text-blue-100 text-xs sm:text-sm truncate">
                  {isWaitingForResponse
                    ? "⚡ Esperando respuesta..."
                    : "🟢 En línea"}
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="text-blue-100 hover:text-white active:text-white cursor-pointer ml-2 shrink-0 flex items-center justify-center size-8 sm:size-10 rounded-lg hover:bg-white/10 active:bg-white/20 transition-colors touch-manipulation"
              aria-label="Cerrar chat"
            >
              <i className="ri-close-line text-xl sm:text-2xl"></i>
            </button>
          </div>

          {/* Configuración de Nombre */}
          {!isNameSet && (
            <div className="p-4 sm:p-6 flex-1 flex flex-col justify-center overflow-y-auto">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="ri-user-smile-line text-2xl text-primary"></i>
                </div>
                <h4 className="text-lg sm:text-xl font-semibold text-gray-800 mb-2">
                  ¡Hola! Soy Liah 👋
                </h4>
                <p className="text-gray-600 text-sm sm:text-base px-4">
                  Para brindarte una mejor atención, ¿podrías decirme tu nombre?
                </p>
              </div>

              <div className="space-y-4 px-2 sm:px-0">
                <input
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Escribe tu nombre..."
                  className="w-full p-3 sm:p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition-colors text-base sm:text-sm"
                  disabled={isLoading}
                  autoComplete="name"
                />

                <button
                  onClick={startConversation}
                  disabled={!clientName.trim() || isLoading}
                  className="w-full bg-primary hover:bg-cyan-700 active:bg-cyan-800 disabled:bg-gray-300 text-white py-3 sm:py-4 rounded-lg font-medium transition-colors cursor-pointer disabled:cursor-not-allowed touch-manipulation min-h-[44px]"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      <span className="text-sm sm:text-base">Iniciando chat...</span>
                    </div>
                  ) : (
                    <span className="text-sm sm:text-base">Iniciar Chat</span>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Área de Mensajes */}
          {isNameSet && (
            <>
              <div className="flex-1 p-3 sm:p-4 overflow-y-auto space-y-3 min-h-0">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender_type === "client" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[85%] sm:max-w-[80%] p-3 rounded-lg text-sm sm:text-base ${
                        message.sender_type === "client"
                          ? "bg-primary text-white rounded-br-none"
                          : "bg-gray-100 text-gray-800 rounded-bl-none"
                      }`}
                    >
                      <p className="whitespace-pre-wrap break-words">{message.message}</p>
                      <p
                        className={`text-xs mt-1 ${
                          message.sender_type === "client"
                            ? "text-primary/20"
                            : "text-gray-500"
                        }`}
                      >
                        {new Date(message.created_at).toLocaleTimeString(
                          "es-ES",
                          {
                            hour: "2-digit",
                            minute: "2-digit",
                          }
                        )}
                      </p>
                    </div>
                  </div>
                ))}

                {isWaitingForResponse && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 p-3 rounded-lg rounded-bl-none">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div
                          className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                          style={{ animationDelay: "0.1s" }}
                        ></div>
                        <div
                          className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                          style={{ animationDelay: "0.2s" }}
                        ></div>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Input de Mensaje */}
              <div className="p-3 sm:p-4 border-t border-gray-200 shrink-0 bg-white">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Escribe tu mensaje..."
                    className="flex-1 p-3 sm:p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 transition-colors focus:ring-primary text-base sm:text-sm min-h-[44px]"
                    disabled={isLoading}
                    autoComplete="off"
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!newMessage.trim() || isLoading}
                    className="bg-primary hover:bg-cyan-700 active:bg-cyan-800 disabled:bg-gray-300 text-white px-4 sm:px-5 py-3 rounded-lg transition-colors cursor-pointer disabled:cursor-not-allowed shrink-0 min-w-[44px] min-h-[44px] flex items-center justify-center touch-manipulation"
                    aria-label="Enviar mensaje"
                  >
                    {isLoading ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    ) : (
                      <i className="ri-send-plane-line text-lg sm:text-xl"></i>
                    )}
                  </button>
                </div>

                <p className="text-xs text-gray-500 mt-2 text-center hidden sm:block">
                  💬 Conectado con WhatsApp Business - Respuestas en tiempo real
                </p>
              </div>
            </>
          )}
        </div>
      )}
    </>
  )
}
