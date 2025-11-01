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
  priority?: "low" | "normal" | "high" | "urgent"
  read?: boolean
  action_url?: string
  metadata?: any
  created_at?: string
  expires_at?: string
}
