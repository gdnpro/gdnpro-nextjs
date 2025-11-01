export interface Conversation {
  id: string
  client_id: string
  freelancer_id: string
  project_id: string | null
  updated_at: string
  client: {
    full_name: string
    avatar_url?: string
  }
  project?: {
    title: string
  }
  latest_message?: {
    message_text: string
    created_at: string
    sender_id: string
  }
}
