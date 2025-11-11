"use client"

import { useState, useEffect, useRef } from "react"
import { useTranslation } from "react-i18next"

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
  const { t } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [clientName, setClientName] = useState("")
  const [isNameSet, setIsNameSet] = useState(false)
  const [conversation, setConversation] = useState<Conversation | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isWaitingForResponse, setIsWaitingForResponse] = useState(false)
  const [lastCheckedMessageId, setLastCheckedMessageId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages, isOpen])

  useEffect(() => {
    let interval: NodeJS.Timeout

    if (conversation && isWaitingForResponse) {
      interval = setInterval(checkForAdminResponse, 2000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [conversation, isWaitingForResponse, lastCheckedMessageId])

  const checkForAdminResponse = async () => {
    if (!conversation) return

    try {
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
        },
      )

      if (response.ok) {
        const data = await response.json()

        if (data.success && data.admin_response) {
          const adminMessage = data.admin_response

          const isNewMessage = !messages.some(
            (msg) =>
              msg.id === adminMessage.id ||
              (msg.sender_id === "admin" && msg.created_at === adminMessage.created_at),
          )

          const isNewerThanLastChecked =
            !lastCheckedMessageId || adminMessage.id !== lastCheckedMessageId

          if (isNewMessage && isNewerThanLastChecked) {
            const newAdminMessage: Message = {
              id: adminMessage.id,
              sender_id: "admin",
              message: adminMessage.message,
              created_at: adminMessage.created_at,
              sender_type: "admin",
            }

            setMessages((prev) => {
              const exists = prev.some((msg) => msg.id === adminMessage.id)
              if (exists) {
                return prev
              }

              return [...prev, newAdminMessage]
            })

            setIsWaitingForResponse(false)
            setLastCheckedMessageId(adminMessage.id)
          }
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
      localStorage.setItem("clientName", clientName)

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
        },
      )

      const data = await response.json()

      if (response.ok && data.success && data.conversation) {
        setConversation(data.conversation)

        const welcomeMessage: Message = {
          id: "welcome",
          sender_id: "system",
          message: t("virtualAssistant.welcomeMessage").replace("{name}", clientName),
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
        message: t("virtualAssistant.welcomeMessage").replace("{name}", clientName),
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

    try {
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
        },
      )

      const data = await response.json()

      if (response.ok && data.success) {
        const confirmMessage: Message = {
          id: "confirm-" + Date.now(),
          sender_id: "system",
          message:
            "✅ Tu mensaje ha sido enviado. El especialista te responderá por WhatsApp en breve...",
          created_at: new Date().toISOString(),
          sender_type: "admin",
        }

        setMessages((prev) => [...prev, confirmMessage])

        setTimeout(() => {
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
      <div className="fixed right-4 bottom-4 z-40 sm:right-6 sm:bottom-6">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="bg-primary group flex size-14 cursor-pointer touch-manipulation items-center justify-center rounded-full text-white shadow-lg transition-all hover:bg-cyan-700 active:bg-cyan-800 sm:size-16"
          aria-label={isOpen ? "Cerrar chat" : "Abrir chat"}
        >
          {isOpen ? (
            <i className="ri-close-line text-2xl sm:text-3xl"></i>
          ) : (
            <>
              <i className="ri-message-3-line text-2xl transition-transform group-hover:scale-110 sm:text-3xl"></i>
              {isWaitingForResponse && (
                <span className="absolute top-1 right-1 h-4 w-4 animate-pulse rounded-full bg-green-500"></span>
              )}
            </>
          )}
        </button>
      </div>

      {isOpen && (
        <div className="animate-slide-up fixed inset-0 z-50 flex flex-col bg-white sm:inset-auto sm:right-6 sm:bottom-24 sm:h-[500px] sm:w-96 sm:rounded-lg sm:border sm:border-gray-200 sm:shadow-2xl">
          {/* Header */}
          <div className="bg-primary flex shrink-0 items-center justify-between p-4 text-white sm:rounded-t-lg">
            <div className="flex min-w-0 flex-1 items-center">
              <div className="mr-3 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-cyan-700/30">
                <i className="ri-customer-service-2-line text-lg"></i>
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-sm font-semibold sm:text-base">
                  {t("virtualAssistant.title")}
                </h3>
                <p className="truncate text-xs text-blue-100 sm:text-sm">
                  {isWaitingForResponse ? "⚡ Esperando respuesta..." : "🟢 En línea"}
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="ml-2 flex size-8 shrink-0 cursor-pointer touch-manipulation items-center justify-center rounded-lg text-blue-100 transition-colors hover:bg-white/10 hover:text-white active:bg-white/20 active:text-white sm:size-10"
              aria-label="Cerrar chat"
            >
              <i className="ri-close-line text-xl sm:text-2xl"></i>
            </button>
          </div>

          {!isNameSet && (
            <div className="flex flex-1 flex-col justify-center overflow-y-auto p-4 sm:p-6">
              <div className="mb-6 text-center">
                <div className="bg-primary/20 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
                  <i className="ri-user-smile-line text-primary text-2xl"></i>
                </div>
                <h4 className="mb-2 text-lg font-semibold text-gray-800 sm:text-xl">
                  {t("virtualAssistant.helloMessage")}
                </h4>
                <p className="px-4 text-sm text-gray-600 sm:text-base">
                  {t("virtualAssistant.nameQuestion")}
                </p>
              </div>

              <div className="space-y-4 px-2 sm:px-0">
                <label htmlFor="livechat-name-input" className="sr-only">
                  {t("virtualAssistant.nameLabel")}
                </label>
                <input
                  type="text"
                  id="livechat-name-input"
                  name="clientName"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={t("virtualAssistant.namePlaceholder")}
                  className="focus:ring-primary w-full rounded-lg border border-gray-300 p-3 text-base transition-colors focus:ring-2 focus:outline-none sm:p-4 sm:text-sm"
                  disabled={isLoading}
                  autoComplete="name"
                />

                <button
                  onClick={startConversation}
                  disabled={!clientName.trim() || isLoading}
                  className="bg-primary min-h-[44px] w-full cursor-pointer touch-manipulation rounded-lg py-3 font-medium text-white transition-colors hover:bg-cyan-700 active:bg-cyan-800 disabled:cursor-not-allowed disabled:bg-gray-300 sm:py-4"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white"></div>
                      <span className="text-sm sm:text-base">
                        {t("virtualAssistant.startingChat")}
                      </span>
                    </div>
                  ) : (
                    <span className="text-sm sm:text-base">{t("virtualAssistant.startChat")}</span>
                  )}
                </button>
              </div>
            </div>
          )}

          {isNameSet && (
            <>
              <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-3 sm:p-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender_type === "client" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-lg p-3 text-sm sm:max-w-[80%] sm:text-base ${
                        message.sender_type === "client"
                          ? "bg-primary rounded-br-none text-white"
                          : "rounded-bl-none bg-gray-100 text-gray-800"
                      }`}
                    >
                      <p className="break-words whitespace-pre-wrap">{message.message}</p>
                      <p
                        className={`mt-1 text-xs ${
                          message.sender_type === "client" ? "text-primary/20" : "text-gray-500"
                        }`}
                      >
                        {new Date(message.created_at).toLocaleTimeString("es-ES", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                ))}

                {isWaitingForResponse && (
                  <div className="flex justify-start">
                    <div className="rounded-lg rounded-bl-none bg-gray-100 p-3">
                      <div className="flex space-x-1">
                        <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400"></div>
                        <div
                          className="h-2 w-2 animate-bounce rounded-full bg-gray-400"
                          style={{ animationDelay: "0.1s" }}
                        ></div>
                        <div
                          className="h-2 w-2 animate-bounce rounded-full bg-gray-400"
                          style={{ animationDelay: "0.2s" }}
                        ></div>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              <div className="shrink-0 border-t border-gray-200 bg-white p-3 sm:p-4">
                <div className="flex gap-2">
                  <label htmlFor="livechat-message-input" className="sr-only">
                    {t("virtualAssistant.messageLabel")}
                  </label>
                  <input
                    type="text"
                    id="livechat-message-input"
                    name="message"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder={t("virtualAssistant.messagePlaceholder")}
                    className="focus:ring-primary min-h-[44px] flex-1 rounded-lg border border-gray-300 p-3 text-base transition-colors focus:ring-2 focus:outline-none sm:p-4 sm:text-sm"
                    disabled={isLoading}
                    autoComplete="off"
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!newMessage.trim() || isLoading}
                    className="bg-primary flex min-h-[44px] min-w-[44px] shrink-0 cursor-pointer touch-manipulation items-center justify-center rounded-lg px-4 py-3 text-white transition-colors hover:bg-cyan-700 active:bg-cyan-800 disabled:cursor-not-allowed disabled:bg-gray-300 sm:px-5"
                    aria-label="Enviar mensaje"
                  >
                    {isLoading ? (
                      <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-white"></div>
                    ) : (
                      <i className="ri-send-plane-line text-lg sm:text-xl"></i>
                    )}
                  </button>
                </div>

                <p className="mt-2 hidden text-center text-xs text-gray-500 sm:block">
                  {t("virtualAssistant.connectedMessage")}
                </p>
              </div>
            </>
          )}
        </div>
      )}
    </>
  )
}
