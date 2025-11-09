import { Conversation } from "@/interfaces/Conversation"
import { User } from "@supabase/supabase-js"

interface Props {
  conversation: Conversation
  openChat: (conversation: Conversation) => void
  user: any
}

export const ConversationCard = ({ conversation, openChat, user }: Props) => {
  return (
    <div
      key={conversation.id}
      className="w-full cursor-pointer touch-manipulation overflow-hidden rounded-lg border border-gray-200 bg-white p-3 transition-shadow hover:shadow-md active:scale-[0.98] sm:p-4"
      onClick={() => openChat(conversation)}
    >
      <div className="flex w-full items-start gap-3 sm:items-center sm:justify-between">
        <div className="flex min-w-0 flex-1 items-start gap-3 overflow-hidden">
          <div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-blue-100 sm:size-10 sm:size-12">
            {conversation.client?.avatar_url || conversation.client?.avatar_url ? (
              <img
                src={conversation.client?.avatar_url || conversation.client?.avatar_url}
                alt={conversation.client?.full_name || conversation.client?.full_name || "Usuario"}
                className="size-10 object-cover object-top sm:size-12"
              />
            ) : (
              <i className="ri-user-line text-primary text-base sm:text-lg"></i>
            )}
          </div>
          <div className="min-w-0 flex-1 overflow-hidden">
            <h3 className="truncate text-sm font-semibold text-gray-900 sm:text-base">
              {conversation.client?.full_name || conversation.client?.full_name || "Usuario"}
            </h3>
            {conversation.project && (
              <p className="mt-1 truncate text-xs text-gray-600 sm:text-sm">
                Proyecto: {conversation.project.title}
              </p>
            )}
            {conversation.latest_message && (
              <p className="mt-1 line-clamp-2 text-xs break-words text-gray-500 sm:text-sm">
                {conversation.latest_message.sender_id === user?.id ? "Tú: " : ""}
                {conversation.latest_message.message_text}
              </p>
            )}
          </div>
        </div>
        <div className="ml-2 flex shrink-0 flex-col items-end gap-1 sm:gap-2">
          {conversation.latest_message && (
            <p className="text-xs whitespace-nowrap text-gray-400">
              {new Date(conversation.latest_message.created_at).toLocaleDateString("es-ES", {
                month: "short",
                day: "numeric",
              })}
            </p>
          )}
          <div className="flex shrink-0 items-center gap-1">
            <i className="ri-chat-3-line text-base text-gray-400 sm:text-lg"></i>
            <span className="text-primary hidden text-xs font-medium sm:inline sm:text-sm">
              Ver chat
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
