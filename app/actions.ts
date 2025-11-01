import { supabaseServer } from "@/utils/supabase/server"
import { encodedRedirect } from "@/utils/utils"
import { headers } from "next/headers"
import { redirect } from "next/navigation"

export const signUpAction = async (formData: FormData) => {
  const email = formData.get("email")?.toString()
  const password = formData.get("password")?.toString()
  const fullName = formData.get("full_name")?.toString()
  const userType = formData.get("user_type")?.toString()
  const supabase = await supabaseServer()
  const origin = (await headers()).get("origin")

  if (!email || !password) {
    return encodedRedirect(
      "error",
      "/register",
      "Email y contraseña requeridos"
    )
  }

  const { data, error } = await supabase.auth.signUp({
    email: email,
    password: password,
    options: {
      data: {
        full_name: fullName,
        user_type: userType,
      },
      emailRedirectTo: `${origin}/auth/callback`,
    },
  })

  if (error) {
    console.error(error.code + " " + error.message)
    return encodedRedirect("error", "/register", error.message)
  } else {
    return encodedRedirect(
      "success",
      "/register",
      "Signed up! Please check your email for a verification link."
    )
  }
}

export const signInAction = async (formData: FormData) => {
  const email = formData.get("email") as string
  const password = formData.get("password") as string
  const supabase = await supabaseServer()

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return encodedRedirect("error", "/login", error.message)
  }

  return redirect("/dashboard")
}
