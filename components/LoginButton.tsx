"use client"

import { signInAction } from "@/app/actions"
import { useState } from "react"

export default function LoginButton() {
  const [loading, setLoading] = useState(false)

  return (
    <button
      type="submit"
      formAction={async (formData) => {
        setLoading(true)
        await signInAction(formData)
      }}
      disabled={loading}
      className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap cursor-pointer transition-colors"
    >
      {loading ? (
        <div className="flex items-center">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
          Iniciando sesión...
        </div>
      ) : (
        "Iniciar Sesión"
      )}
    </button>
  )
}
