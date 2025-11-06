"use server"

import { supabaseServer } from "@/utils/supabase/server"
import { LoginFormSchema, type FormState } from "@/validations/auth"
import { z } from "zod"

export async function registerUserAction(prevState: FormState, formData: FormData) {
  console.log(formData)
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
      error: "Email o contraseña incorrectos",
      loading: false,
      fields: validatedFields.data,
      serverErrors: flattenedErrors.fieldErrors,
      databaseErrors: null,
    }
  }

  const { error } = await supabase.auth.signInWithPassword(fields)

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
            error: retryAuthError.message,
            loading: false,
            fields: validatedFields.data,
            databaseErrors: retryAuthError,
            serverErrors: null,
          }
        }

        if (!retryAuthData.user) {
          return {
            success: false,
            error: "No se pudo obtener información del usuario",
            loading: false,
            fields: validatedFields.data,
            databaseErrors: null,
            serverErrors: null,
          }
        }
      }
    }

    if (error.message.includes("Invalid login credentials")) {
      return {
        success: false,
        error: "Email o contraseña incorrectos",
        loading: false,
        fields: validatedFields.data,
        databaseErrors: null,
        serverErrors: null,
      }
    }

    if (error.message.includes("Invalid API key")) {
      return {
        success: false,
        error: "Las credenciales han sido actualizadas",
        loading: false,
        fields: validatedFields.data,
        databaseErrors: null,
        serverErrors: null,
      }
    }

    if (error.message.includes("network")) {
      return {
        success: false,
        error: "Verifica tu internet",
        loading: false,
        fields: validatedFields.data,
        databaseErrors: null,
        serverErrors: null,
      }
    }

    return {
      success: false,
      error: "Error desconocido al iniciar sesión",
      loading: false,
      fields: validatedFields.data,
      databaseErrors: null,
      serverErrors: null,
    }
  }

  return {
    success: true,
    message: "Inicio de sesión exitoso",
    loading: false,
    fields,
    databaseErrors: null,
    serverErrors: null,
  }
}
