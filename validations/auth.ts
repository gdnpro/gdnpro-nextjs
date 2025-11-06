import z from "zod"

export const LoginFormSchema = z.object({
  email: z.email({ message: "El email no es válido" }),
  password: z
    .string()
    .min(6, { message: "La contraseña debe tener al menos 6 caracteres" })
    .max(100, { message: "La contraseña debe tener menos de 100 caracteres" }),
})

export const RegisterFormSchema = z.object({
  email: z.email({ message: "El email no es válido" }),
  password: z
    .string()
    .min(6, { message: "La contraseña debe tener al menos 6 caracteres" })
    .max(100, { message: "La contraseña debe tener menos de 100 caracteres" }),
  confirmPassword: z
    .string()
    .min(6, { message: "La contraseña debe tener al menos 6 caracteres" })
    .max(100, { message: "La contraseña debe tener menos de 100 caracteres" }),
})

export type LoginFormSchemaType = z.infer<typeof LoginFormSchema>
export type RegisterFormSchemaType = z.infer<typeof RegisterFormSchema>

export type FormState = {
  success?: boolean
  message?: string
  loading?: boolean
  error?: string
  fields?: {
    email?: string
    password?: string
    confirmPassword?: string
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
}
