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
