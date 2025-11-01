import { createClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"

export const supabaseServer = async () => {
  const nextCookies = await cookies()

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        persistSession: true,
        detectSessionInUrl: false,
        autoRefreshToken: true,
        storage: {
          getItem: (key) => {
            const cookie = nextCookies.get(key)
            return cookie ? cookie.value : null
          },
          setItem: () => {
            // No aplicable en server
          },
          removeItem: () => {
            // No aplicable en server
          },
        },
      },
    }
  )
}
