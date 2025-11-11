import z from "zod"

export const LoginFormSchema = z.object({
  email: z.email({ message: "auth.errors.emailInvalid" }),
  password: z
    .string()
    .min(6, { message: "auth.errors.passwordMin" })
    .max(100, { message: "auth.errors.passwordMax" }),
})

export const RegisterFormSchema = z.object({
  email: z.email({ message: "auth.errors.emailInvalid" }),
  password: z
    .string()
    .min(6, { message: "auth.errors.passwordMin" })
    .max(100, { message: "auth.errors.passwordMax" }),
  confirmPassword: z
    .string()
    .min(6, { message: "auth.errors.passwordMin" })
    .max(100, { message: "auth.errors.passwordMax" }),
})

export type LoginFormSchemaType = z.infer<typeof LoginFormSchema>
export type RegisterFormSchemaType = z.infer<typeof RegisterFormSchema>

export type FormState = {
  success?: boolean
  session?: {
    access_token: string
    refresh_token: string
  } | null
  message?: string
  loading?: boolean
  error?: string
  flag?: string
  errorValues?: Record<string, string | number>
  fields?: {
    avatar_url?: File | null
    full_name?: string
    email?: string
    password?: string
    confirmPassword?: string
    location?: string
    skills?: string[]
    bio?: string
    user_type?: "freelancer" | "client"
    hourly_rate?: number
    experience_years?: number
  }
  databaseErrors?: {
    message?: string
    code?: string
  } | null
  serverErrors?: {
    identifier?: string[]
    email?: string[]
    password?: string[]
    confirmPassword?: string[]
  } | null
  redirectTo?: string | null
}
