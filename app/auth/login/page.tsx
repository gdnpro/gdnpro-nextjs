"use client"

import { LoginForm } from "@/components/auth/LoginForm"
import { Suspense } from "react"

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="border-primary mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2"></div>
          </div>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  )
}
