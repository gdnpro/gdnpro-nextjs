export interface NotificationMetadata {
  [key: string]: string | number | boolean | null | undefined
  project_id?: string
  proposal_id?: string
  transaction_id?: string
  conversation_id?: string
  user_id?: string
}

export interface Notification {
  id?: string
  title: string
  message: string
  title_key?: string // Translation key for title
  message_key?: string // Translation key for message
  translation_params?: Record<string, string | number> // Parameters for translation interpolation
  type:
    | "message"
    | "proposal"
    | "payment"
    | "project_update"
    | "review"
    | "system"
    | "reminder"
    | "milestone"
    | "badge"
    | "achievement"
  priority?: "low" | "normal" | "high" | "urgent"
  read?: boolean
  action_url?: string
  metadata?: NotificationMetadata
  created_at?: string
  expires_at?: string
}
