import { redirect } from "next/navigation"

// This check can be removed, it is just for tutorial purposes
export const hasEnvVars =
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

export function encodedRedirect(
  type: "success" | "error",
  path: string,
  message: string
) {
  const params = new URLSearchParams({
    type,
    message,
  })

  return redirect(`${path}?${params.toString()}`)
}
