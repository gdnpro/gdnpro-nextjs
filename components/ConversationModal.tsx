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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-2 sm:p-4">
      <div className="flex h-[90vh] w-full max-w-full flex-col rounded-xl bg-white sm:h-[80vh] sm:max-w-2xl sm:rounded-2xl">
        {/* Header del Chat */}
        <div className="bg-primary flex items-center justify-between rounded-t-xl p-3 text-white sm:rounded-t-2xl sm:p-4">
          <div className="flex min-w-0 flex-1 items-center">
            <div className="mr-2 flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-cyan-300/50 sm:mr-3 sm:h-10 sm:w-10">
              {selectedConversation.client?.avatar_url ? (
                <img
                  src={selectedConversation.client.avatar_url}
                  alt={selectedConversation.client.full_name}
                  className="h-full w-full object-cover object-top"
                />
              ) : (
                <i className="ri-user-line text-primary"></i>
              )}
            </div>
            <div className="min-w-0">
              <h3 className="truncate text-sm font-semibold sm:text-base">
                {selectedConversation.client.full_name}
              </h3>
              {selectedConversation.project && (
                <p className="truncate text-xs text-blue-100 sm:text-sm">
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
            className="shrink-0 cursor-pointer rounded p-1 hover:bg-cyan-700 sm:p-2"
          >
            <i className="ri-close-line text-lg sm:text-xl"></i>
          </button>
        </div>

        {/* Área de Mensajes */}
        <div className="flex-1 overflow-y-auto bg-gray-50 p-3 sm:p-4">
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
                    className={`max-w-[85%] rounded-2xl px-3 py-2 sm:max-w-xs sm:px-4 lg:max-w-md ${
                      message.sender_id === user?.id
                        ? "bg-primary text-white"
                        : message.sender_id === null
                          ? "border border-yellow-300 bg-yellow-100 text-yellow-800"
                          : "border border-gray-200 bg-white text-gray-900"
                    }`}
                  >
                    <p className="text-xs sm:text-sm">{message.message_text}</p>
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
        <div className="rounded-b-xl border-t border-gray-200 bg-white p-3 sm:rounded-b-2xl sm:p-4">
          <div className="flex items-center space-x-2 sm:space-x-3">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyUp={handleKeyPress}
              placeholder="Escribe tu mensaje..."
              disabled={chatLoading || sendingMessage}
              className="focus:ring-primary flex-1 rounded-full border border-gray-300 px-3 py-2 text-xs focus:border-transparent focus:ring-2 focus:outline-none disabled:bg-gray-100 sm:px-4 sm:py-3 sm:text-sm"
            />
            <button
              onClick={sendMessage}
              disabled={!newMessage.trim() || chatLoading || sendingMessage}
              className="bg-primary flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full text-white transition-colors hover:bg-cyan-700 disabled:bg-gray-300 sm:h-12 sm:w-12"
            >
              {sendingMessage ? (
                <div className="h-3 w-3 animate-spin rounded-full border-b-2 border-white sm:h-4 sm:w-4"></div>
              ) : (
                <i className="ri-send-plane-line text-sm sm:text-base"></i>
              )}
            </button>
          </div>
          <p className="mt-2 flex items-center text-xs text-gray-500">
            <i className="ri-shield-check-line mr-1"></i>
            Chat seguro monitoreado por GDN Pro
          </p>
        </div>
      </div>
    </div>
  )
}
