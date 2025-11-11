"use server"

import { supabaseServer } from "@/utils/supabase/server"
import { LoginFormSchema, RegisterFormSchema, type FormState } from "@/validations/auth"
import { z } from "zod"

export async function registerUserAction(
  prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const supabase = await supabaseServer()
  const skillsAll = formData.getAll("skills")
  const skills: string[] =
    skillsAll.length > 0
      ? skillsAll.filter((s): s is string => typeof s === "string")
      : (() => {
          const skillsValue = formData.get("skills")
          if (typeof skillsValue === "string") {
            try {
              return JSON.parse(skillsValue) as string[]
            } catch {
              return [skillsValue]
            }
          }
          return []
        })()

  const avatarFile = formData.get("avatar_url") as File | null

  const fields = {
    email: (formData.get("email") as string).trim(),
    password: formData.get("password") as string,
    confirmPassword: formData.get("confirmPassword") as string,
    full_name: formData.get("full_name") as string,
    location: formData.get("location") as string,
    skills,
    bio: formData.get("bio") as string,
    user_type: formData.get("user_type") as "freelancer" | "client",
    hourly_rate: Number(formData.get("hourly_rate")) || 0,
    experience_years: Number(formData.get("experience_years")) || 0,
    avatar_url: avatarFile,
  }

  const validatedFields = RegisterFormSchema.safeParse(fields)

  if (fields.password.length < 6) {
    return {
      success: false,
      error: "auth.errors.passwordMin",
      loading: false,
      fields: validatedFields.data,
      serverErrors: null,
      databaseErrors: null,
    }
  }

  if (fields.password !== fields.confirmPassword) {
    return {
      success: false,
      error: "auth.errors.passwordMismatch",
      loading: false,
      fields: validatedFields.data,
      serverErrors: null,
      databaseErrors: null,
    }
  }

  if (fields.user_type === "freelancer") {
    if (fields.skills.length === 0) {
      return {
        success: false,
        error: "auth.errors.skillsRequired",
        loading: false,
        fields: validatedFields.data,
        serverErrors: null,
        databaseErrors: null,
      }
    }

    if (fields.hourly_rate <= 5) {
      return {
        success: false,
        error: "auth.errors.hourlyRateMin",
        loading: false,
        fields: validatedFields.data,
        serverErrors: null,
        databaseErrors: null,
      }
    }
  }

  if (fields.bio === "" || fields.bio === null || fields.bio === undefined) {
    return {
      success: false,
      error: "auth.errors.bioRequired",
      loading: false,
      fields: validatedFields.data,
      serverErrors: null,
      databaseErrors: null,
    }
  }

  if (fields.bio.length < 10 || fields.bio.length > 1000) {
    return {
      success: false,
      error: "auth.errors.bioLength",
      loading: false,
      fields: validatedFields.data,
      serverErrors: null,
      databaseErrors: null,
    }
  }

  if (!validatedFields.success) {
    const flattenedErrors = z.flattenError(validatedFields.error)

    return {
      success: false,
      error: "auth.errors.invalidData",
      loading: false,
      fields: validatedFields.data,
      serverErrors: flattenedErrors.fieldErrors,
      databaseErrors: null,
    }
  }

  const { data: existingProfile, error: checkError } = await supabase
    .from("profiles")
    .select("email")
    .eq("email", fields.email)
    .maybeSingle()

  if (checkError && checkError.code !== "PGRST116") {
    return {
      success: false,
      error: "auth.errors.emailVerification",
      loading: false,
      fields: validatedFields.data,
      serverErrors: null,
      databaseErrors: checkError,
    }
  }

  if (existingProfile) {
    return {
      success: false,
      error: "auth.errors.emailRegistered",
      errorValues: { email: fields.email },
      loading: false,
      fields: validatedFields.data,
      serverErrors: null,
      databaseErrors: null,
    }
  }

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: fields.email,
    password: fields.password,
    options: {
      data: {
        full_name: fields.full_name,
        user_type: fields.user_type,
      },
      emailRedirectTo: undefined,
    },
  })

  if (authError) {
    await supabase.auth.signOut()

    if (authError.message.includes("Email already in use")) {
      return {
        success: false,
        error: "auth.errors.emailInUse",
        loading: false,
        fields: validatedFields.data,
        serverErrors: null,
        databaseErrors: authError,
      }
    }

    if (authError.message.includes("email rate limit exceeded")) {
      return {
        success: false,
        error: "auth.errors.registrationRateLimit",
        loading: false,
        fields: validatedFields.data,
        serverErrors: null,
        databaseErrors: authError,
      }
    }

    return {
      success: false,
      error: "auth.errors.registrationFailed",
      loading: false,
      fields: validatedFields.data,
      serverErrors: null,
      databaseErrors: authError,
    }
  }

  if (fields.user_type === "freelancer" && fields.avatar_url) {
    const fileExtension = fields.avatar_url.name.split(".").pop()
    const fileName = `${authData?.user?.id}-${Date.now()}.${fileExtension}`

    const formDataUpload = new FormData()
    formDataUpload.append("file", fields.avatar_url)
    formDataUpload.append("fileName", fileName)
    formDataUpload.append("bucket", "avatars")

    const uploadResponse = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/upload-avatar`,
      {
        method: "POST",
        body: formDataUpload,
      },
    )

    if (!uploadResponse.ok) {
      await supabase.auth.signOut()

      return {
        success: false,
        error: "auth.errors.imageUpload",
        loading: false,
        fields,
        serverErrors: null,
        databaseErrors: null,
      }
    }

    const uploadResult = await uploadResponse.json()

    let avatarUrl: string | null = null
    if (uploadResult.success && uploadResult.publicUrl) {
      avatarUrl = uploadResult.publicUrl
    } else {
      await supabase.auth.signOut()

      return {
        success: false,
        error: "auth.errors.imageUpload",
        loading: false,
        fields: validatedFields.data,
        serverErrors: null,
        databaseErrors: null,
      }
    }

    const { error: profileError } = await supabase.from("profiles").insert([
      {
        id: authData?.user?.id,
        user_id: authData?.user?.id,
        full_name: fields.full_name,
        email: fields.email,
        location: fields.location,
        user_type: fields.user_type,
        role: fields.user_type,
        avatar_url: avatarUrl,
        bio: fields.bio,
        skills: fields.skills,
        hourly_rate: fields.hourly_rate,
        experience_years: fields.experience_years,
        availability: "full-time",
      },
    ])

    if (profileError) {
      await supabase.auth.signOut()

      return {
        success: false,
        error: "auth.errors.profileCreation",
        loading: false,
        fields: validatedFields.data,
        serverErrors: null,
        databaseErrors: profileError,
      }
    }

    await supabase.auth.signOut()

    return {
      success: true,
      message: "auth.success.register",
      loading: false,
      fields: validatedFields.data,
      serverErrors: null,
      databaseErrors: null,
    }
  } else {
    const { error: profileError } = await supabase.from("profiles").insert([
      {
        id: authData?.user?.id,
        user_id: authData?.user?.id,
        full_name: fields.full_name,
        email: fields.email,
        location: fields.location,
        bio: fields.bio,
        user_type: fields.user_type,
      },
    ])

    if (profileError) {
      await supabase.auth.signOut()

      return {
        success: false,
        error: "auth.errors.profileCreation",
        loading: false,
        fields: validatedFields.data,
        serverErrors: null,
        databaseErrors: profileError,
      }
    }

    await supabase.auth.signOut()

    return {
      success: true,
      message: "auth.success.register",
      loading: false,
      fields: validatedFields.data,
      serverErrors: null,
      databaseErrors: null,
      redirectTo: `/auth/login?email=${encodeURIComponent(fields.email)}&verified=false`,
    }
  }
}

export async function loginUserAction(
  prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const supabase = await supabaseServer()

  const fields = {
    email: (formData.get("email") as string).trim(),
    password: formData.get("password") as string,
  }

  const validatedFields = LoginFormSchema.safeParse(fields)

  if (!validatedFields.success) {
    const flattenedErrors = z.flattenError(validatedFields.error)

    return {
      success: false,
      error: "auth.errors.invalidCredentials",
      loading: false,
      fields: validatedFields.data,
      serverErrors: flattenedErrors.fieldErrors,
      databaseErrors: null,
    }
  }

  const { data, error } = await supabase.auth.signInWithPassword(fields)

  if (error) {
    if (error?.message?.includes("Email not confirmed")) {
      const confirmResponse = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/auth-handler`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: "confirm_email_by_credentials",
            fields,
          }),
        },
      )

      if (confirmResponse.ok) {
        const { data: retryAuthData, error: retryAuthError } =
          await supabase.auth.signInWithPassword(fields)

        if (retryAuthError) {
          return {
            success: false,
            error: "auth.errors.retryLogin",
            loading: false,
            fields: validatedFields.data,
            databaseErrors: retryAuthError,
            serverErrors: null,
          }
        }

        if (!retryAuthData.user) {
          return {
            success: false,
            error: "auth.errors.userInfoMissing",
            loading: false,
            fields: validatedFields.data,
            databaseErrors: null,
            serverErrors: null,
          }
        }
      }

      return {
        success: false,
        error: "auth.errors.emailNotConfirmed",
        loading: false,
        flag: "Email not confirmed",
        fields: validatedFields.data,
        databaseErrors: null,
        serverErrors: null,
        redirectTo: `/auth/login?email=${encodeURIComponent(fields.email)}&verified=false`,
      }
    }

    if (error.message.includes("Invalid login credentials")) {
      return {
        success: false,
        error: "auth.errors.invalidCredentials",
        loading: false,
        fields: validatedFields.data,
        databaseErrors: null,
        serverErrors: null,
      }
    }

    if (error.message.includes("Invalid API key")) {
      return {
        success: false,
        error: "auth.errors.credentialsUpdated",
        loading: false,
        fields: validatedFields.data,
        databaseErrors: null,
        serverErrors: null,
      }
    }

    if (error.message.includes("network")) {
      return {
        success: false,
        error: "auth.errors.checkInternet",
        loading: false,
        fields: validatedFields.data,
        databaseErrors: null,
        serverErrors: null,
      }
    }

    return {
      success: false,
      error: "auth.errors.unknownLogin",
      loading: false,
      fields: validatedFields.data,
      databaseErrors: null,
      serverErrors: null,
    }
  }

  return {
    success: true,
    message: "auth.success.login",
    loading: false,
    fields,
    databaseErrors: null,
    serverErrors: null,
    redirectTo: `/dashboard`,
  }
}
