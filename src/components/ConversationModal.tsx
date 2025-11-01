import type { ChatMessage } from "@/interfaces/ChatMessage"
import type { Conversation } from "@/interfaces/Conversation"

interface Props {
  selectedConversation: Conversation
  setShowChat: (boolean: boolean) => void
  setChatMessages: (array: any[]) => void
  setSelectedConversation: (conversation: null) => void
  setNewMessage: (message: string) => void
  chatLoading: boolean
  chatMessages: ChatMessage[]
  user: any
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
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-xl sm:rounded-2xl w-full max-w-full sm:max-w-2xl h-[90vh] sm:h-[80vh] flex flex-col">
        {/* Header del Chat */}
        <div className="bg-primary text-white p-3 sm:p-4 rounded-t-xl sm:rounded-t-2xl flex items-center justify-between">
          <div className="flex items-center min-w-0 flex-1">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-cyan-300/50 rounded-full overflow-hidden flex items-center justify-center mr-2 sm:mr-3 shrink-0">
              {selectedConversation.client?.avatar_url ? (
                <img
                  src={selectedConversation.client.avatar_url}
                  alt={selectedConversation.client.full_name}
                  className="w-full h-full object-cover object-top"
                />
              ) : (
                <i className="ri-user-line text-primary"></i>
              )}
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-sm sm:text-base truncate">
                {selectedConversation.client.full_name}
              </h3>
              {selectedConversation.project && (
                <p className="text-blue-100 text-xs sm:text-sm truncate">
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
            className="hover:bg-cyan-700 p-1 sm:p-2 rounded cursor-pointer shrink-0"
          >
            <i className="ri-close-line text-lg sm:text-xl"></i>
          </button>
        </div>

        {/* Área de Mensajes */}
        <div className="flex-1 p-3 sm:p-4 overflow-y-auto bg-gray-50">
          {chatLoading ? (
            <div className="flex justify-center items-center h-full">
              <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-primary"></div>
              <span className="ml-2 text-sm sm:text-base text-gray-600">
                Cargando conversación...
              </span>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {chatMessages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.sender_id === user?.id
                      ? "justify-end"
                      : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[85%] sm:max-w-xs lg:max-w-md px-3 sm:px-4 py-2 rounded-2xl ${
                      message.sender_id === user?.id
                        ? "bg-primary text-white"
                        : message.sender_id === null
                          ? "bg-yellow-100 text-yellow-800 border border-yellow-300"
                          : "bg-white text-gray-900 border border-gray-200"
                    }`}
                  >
                    <p className="text-xs sm:text-sm">{message.message_text}</p>
                    <p
                      className={`text-xs mt-1 ${
                        message.sender_id === user?.id
                          ? "text-cyan-300/50"
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
                <div className="text-center text-gray-500 py-6 sm:py-8">
                  <i className="ri-chat-3-line text-3xl sm:4xl mb-4"></i>
                  <p className="text-sm sm:text-base">
                    No hay mensajes en esta conversación aún
                  </p>
                  <p className="text-xs sm:text-sm mt-2">
                    Inicia la conversación escribiendo un mensaje
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Input para Escribir */}
        <div className="p-3 sm:p-4 border-t bg-white rounded-b-xl sm:rounded-b-2xl">
          <div className="flex items-center space-x-2 sm:space-x-3">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyUp={handleKeyPress}
              placeholder="Escribe tu mensaje..."
              disabled={chatLoading || sendingMessage}
              className="flex-1 px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-full focus:ring-2 focus:ring-primary focus:border-transparent text-xs sm:text-sm disabled:bg-gray-100 focus:outline-none"
            />
            <button
              onClick={sendMessage}
              disabled={!newMessage.trim() || chatLoading || sendingMessage}
              className="w-10 h-10 sm:w-12 sm:h-12 bg-primary hover:bg-cyan-700 disabled:bg-gray-300 text-white rounded-full flex items-center justify-center transition-colors cursor-pointer shrink-0"
            >
              {sendingMessage ? (
                <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-b-2 border-white"></div>
              ) : (
                <i className="ri-send-plane-line text-sm sm:text-base"></i>
              )}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2 flex items-center">
            <i className="ri-shield-check-line mr-1"></i>
            Chat seguro monitoreado por GDN Pro
          </p>
        </div>
      </div>
    </div>
  )
}
