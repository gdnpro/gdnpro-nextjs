export interface ChatMessage {
  id: string
  message_text: string
  sender_id: string
  created_at: string
  sender?: {
    full_name: string
  }
}
