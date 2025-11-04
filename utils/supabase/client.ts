import { createBrowserClient } from "@supabase/ssr"

// Create a singleton instance to ensure session persistence
let supabaseInstance: ReturnType<typeof createBrowserClient> | null = null

export const supabaseBrowser = () => {
  // Only create client on client-side
  // During SSR, return a mock client that won't be used
  if (typeof window === "undefined") {
    // Return a client that will be recreated on client-side
    // This is safe because client components only use this on mount
    return createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }

  // Return singleton instance if it exists
  if (supabaseInstance) {
    return supabaseInstance
  }

  // Create new instance with explicit localStorage configuration
  // This ensures session persistence across page refreshes
  supabaseInstance = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storage: window.localStorage,
      },
    }
  )

  return supabaseInstance
}
