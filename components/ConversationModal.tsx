import { useEffect, useRef } from "react"
import type { ChatMessage } from "@/interfaces/ChatMessage"
import type { Conversation } from "@/interfaces/Conversation"
import type { Profile } from "@/interfaces/Profile"
import { supabaseBrowser } from "@/utils/supabase/client"

const supabase = supabaseBrowser()

interface Props {
  selectedConversation: Conversation
  setShowChat: (boolean: boolean) => void
  setChatMessages: (array: ChatMessage[]) => void
  setSelectedConversation: (conversation: null) => void
  setNewMessage: (message: string) => void
  chatLoading: boolean
  chatMessages: ChatMessage[]
  user: Profile | null
  newMessage: string
  handleKeyPress: (event: React.KeyboardEvent) => void
  sendingMessage: boolean
  sendMessage: () => void
}

export const ConversationModal = ({
  selectedConversation,
  setShowChat,
  setChatMessages,
  setSelectedConversation,
  setNewMessage,
  chatLoading,
  chatMessages,
  user,
  newMessage,
  handleKeyPress,
  sendingMessage,
  sendMessage,
}: Props) => {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const subscriptionRef = useRef<any>(null)
  const chatMessagesRef = useRef<ChatMessage[]>(chatMessages)

  // Keep ref in sync with chatMessages
  useEffect(() => {
    chatMessagesRef.current = chatMessages
  }, [chatMessages])

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [chatMessages])

  // Set up realtime subscription for new messages
  useEffect(() => {
    if (!selectedConversation?.id || !user?.id) return

    // Subscribe to new messages in this conversation
    const channel = supabase
      .channel(`conversation:${selectedConversation.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `conversation_id=eq.${selectedConversation.id}`,
        },
        async (payload: any) => {
          // Only add message if it's not from the current user (to avoid duplicates)
          const newMessage = payload.new as any
          if (newMessage.sender_id !== user.id) {
            // Check if message already exists to avoid duplicates using ref
            if (chatMessagesRef.current.some((m: ChatMessage) => m.id === newMessage.id)) {
              return
            }
            // Construct message object from payload with proper typing
            const chatMessage: ChatMessage = {
              id: newMessage.id,
              message_text: newMessage.message_text,
              sender_id: newMessage.sender_id,
              created_at: newMessage.created_at,
            }
            // Add the new message to the existing messages using ref for latest state
            setChatMessages([...chatMessagesRef.current, chatMessage])
          }
        },
      )
      .subscribe()

    subscriptionRef.current = channel

    return () => {
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current)
        subscriptionRef.current = null
      }
    }
  }, [selectedConversation?.id, user?.id, setChatMessages])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-black/60 via-black/50 to-black/60 p-0 backdrop-blur-md sm:p-4">
      <div className="flex h-screen w-full max-w-full flex-col overflow-hidden bg-white shadow-2xl sm:h-auto sm:max-h-[85vh] sm:max-w-2xl sm:rounded-3xl sm:ring-1 sm:ring-black/5">
        {/* Modern Header with linear */}
        <div className="relative shrink-0 overflow-hidden bg-gradient-to-r from-cyan-600 via-cyan-500 to-teal-500 p-4 text-white sm:p-6">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIyIi8+PC9nPjwvZz48L3N2Zz4=')] opacity-20"></div>
          <div className="relative z-10 flex min-w-0 flex-1 items-center justify-between gap-3">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <div className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white/20 ring-2 ring-white/30 backdrop-blur-sm sm:h-12 sm:w-12">
                {selectedConversation.client?.avatar_url ? (
                  <img
                    src={selectedConversation.client.avatar_url}
                    alt={selectedConversation.client.full_name}
                    className="h-full w-full object-cover object-top"
                  />
                ) : (
                  <i className="ri-user-3-line text-lg sm:text-xl text-white"></i>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-base font-bold sm:text-lg">
                  {selectedConversation.client.full_name}
                </h3>
                {selectedConversation.project && (
                  <p className="truncate text-xs text-cyan-100 sm:text-sm">
                    {selectedConversation.project.title}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={() => {
                setShowChat(false)
                setChatMessages([])
                setSelectedConversation(null)
                setNewMessage("")
              }}
              className="group flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/20 backdrop-blur-sm transition-all hover:scale-110 hover:bg-white/20 active:bg-white/30 active:scale-95 sm:h-12 sm:w-12 touch-manipulation"
              aria-label="Cerrar chat"
            >
              <i className="ri-close-line text-lg transition-transform group-hover:rotate-90 sm:text-xl"></i>
            </button>
          </div>
        </div>

        {/* Área de Mensajes */}
        <div className="flex-1 min-h-0 overflow-y-auto bg-gray-50 p-3 sm:p-4">
          {chatLoading ? (
            <div className="flex h-full items-center justify-center">
              <div className="border-primary h-6 w-6 animate-spin rounded-full border-b-2 sm:h-8 sm:w-8"></div>
              <span className="ml-2 text-sm text-gray-600 sm:text-base">
                Cargando conversación...
              </span>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {chatMessages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.sender_id === user?.id ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[85%] sm:max-w-xs lg:max-w-md rounded-2xl px-3 py-2 sm:px-4 ${
                      message.sender_id === user?.id
                        ? "bg-primary text-white"
                        : message.sender_id === null
                          ? "border border-yellow-300 bg-yellow-100 text-yellow-800"
                          : "border border-gray-200 bg-white text-gray-900"
                    }`}
                  >
                    <p className="text-sm sm:text-base break-words whitespace-pre-wrap">{message.message_text}</p>
                    <p
                      className={`mt-1 text-xs ${
                        message.sender_id === user?.id ? "text-cyan-300/50" : "text-gray-500"
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
                <div className="py-6 text-center text-gray-500 sm:py-8">
                  <i className="ri-chat-3-line sm:4xl mb-4 text-3xl"></i>
                  <p className="text-sm sm:text-base">No hay mensajes en esta conversación aún</p>
                  <p className="mt-2 text-xs sm:text-sm">
                    Inicia la conversación escribiendo un mensaje
                  </p>
                </div>
              )}
              {/* Invisible div to scroll to */}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input para Escribir */}
        <div className="shrink-0 border-t border-gray-200 bg-white p-3 sm:p-4 sm:rounded-b-2xl">
          <div className="flex items-center gap-2 sm:gap-3">
            <label htmlFor="conversation-message-input" className="sr-only">
              Escribe tu mensaje
            </label>
            <input
              type="text"
              id="conversation-message-input"
              name="message"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyUp={handleKeyPress}
              placeholder="Escribe tu mensaje..."
              disabled={chatLoading || sendingMessage}
              className="focus:ring-primary flex-1 rounded-full border border-gray-300 px-3 py-2.5 text-sm focus:border-transparent focus:ring-2 focus:outline-none disabled:bg-gray-100 sm:px-4 sm:py-3 min-h-[44px]"
              autoComplete="off"
            />
            <button
              onClick={sendMessage}
              disabled={!newMessage.trim() || chatLoading || sendingMessage}
              className="group flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full bg-gradient-to-r from-cyan-500 to-teal-500 text-white shadow-lg shadow-cyan-500/30 transition-all hover:scale-110 active:scale-95 hover:shadow-xl hover:shadow-cyan-500/40 disabled:bg-gray-300 disabled:shadow-none disabled:hover:scale-100 disabled:active:scale-100 sm:h-12 sm:w-12 touch-manipulation"
              aria-label="Enviar mensaje"
            >
              {sendingMessage ? (
                <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-white"></div>
              ) : (
                <i className="ri-send-plane-line text-base sm:text-lg"></i>
              )}
            </button>
          </div>
          <p className="mt-2 hidden items-center text-xs text-gray-500 sm:flex">
            <i className="ri-shield-check-line mr-1"></i>
            Chat seguro monitoreado por GDN Pro
          </p>
        </div>
      </div>
    </div>
  )
}
