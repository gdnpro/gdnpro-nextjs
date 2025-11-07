"use client"

import { useState, useEffect } from "react"

interface InputDialogProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (value: string) => void
  title: string
  label?: string
  placeholder?: string
  type?: "text" | "number" | "email" | "password" | "tel" | "url"
  defaultValue?: string
  validate?: (value: string) => { isValid: boolean; error?: string }
  required?: boolean
  min?: number
  max?: number
  icon?: string
}

export function InputDialog({
  isOpen,
  onClose,
  onSubmit,
  title,
  label,
  placeholder = "",
  type = "text",
  defaultValue = "",
  validate,
  required = false,
  min,
  max,
  icon = "ri-edit-line",
}: InputDialogProps) {
  const [value, setValue] = useState(defaultValue)
  const [error, setError] = useState<string>("")

  useEffect(() => {
    if (isOpen) {
      setValue(defaultValue)
      setError("")
      // Note: We don't manage body overflow here because InputDialog is typically
      // used inside modals that already manage body overflow at a higher level
    }
  }, [isOpen, defaultValue])

  const handleSubmit = () => {
    // Clear previous errors
    setError("")

    // Check if required and empty
    if (required && !value.trim()) {
      setError("Este campo es requerido")
      return
    }

    // Run custom validation if provided
    if (validate) {
      const validation = validate(value)
      if (!validation.isValid) {
        setError(validation.error || "Valor inválido")
        return
      }
    }

    // Type-specific validation
    if (type === "number") {
      const numValue = Number(value)
      if (isNaN(numValue)) {
        setError("Por favor ingresa un número válido")
        return
      }
      if (min !== undefined && numValue < min) {
        setError(`El valor mínimo es ${min}`)
        return
      }
      if (max !== undefined && numValue > max) {
        setError(`El valor máximo es ${max}`)
        return
      }
    }

    onSubmit(value)
    onClose()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSubmit()
    } else if (e.key === "Escape") {
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-black/60 via-black/50 to-black/60 p-4 backdrop-blur-md sm:p-6">
      <div className="animate-in fade-in zoom-in-95 w-full max-w-md overflow-hidden rounded-2xl sm:rounded-3xl bg-white shadow-2xl ring-1 ring-black/5 duration-300">
        {/* Modern Header with Gradient */}
        <div className="relative overflow-hidden bg-gradient-to-r from-cyan-600 via-cyan-500 to-teal-500 p-6 text-white">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIyIi8+PC9nPjwvZz48L3N2Zz4=')] opacity-20"></div>
          <div className="relative z-10 flex items-start justify-between">
            <div className="flex-1 pr-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 ring-1 ring-white/30 backdrop-blur-sm">
                  <i className={`${icon} text-2xl`}></i>
                </div>
                <div>
                  <h2 className="text-2xl font-bold leading-tight sm:text-3xl">{title}</h2>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="group flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/20 backdrop-blur-sm transition-all hover:scale-110 hover:bg-white/20"
              aria-label="Cerrar"
            >
              <i className="ri-close-line text-xl transition-transform group-hover:rotate-90"></i>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {label && (
            <label className="mb-2 block text-sm font-semibold text-gray-700">{label}</label>
          )}
          <input
            type={type}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            min={min}
            max={max}
            className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm transition-all focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500 focus:outline-none"
            autoFocus
          />
          {error && (
            <p className="mt-2 text-sm text-red-600">
              <i className="ri-error-warning-line mr-1"></i>
              {error}
            </p>
          )}
          {(min !== undefined || max !== undefined) && type === "number" && (
            <p className="mt-2 text-xs text-gray-500">
              {min !== undefined && max !== undefined
                ? `Rango: ${min} - ${max}`
                : min !== undefined
                  ? `Mínimo: ${min}`
                  : `Máximo: ${max}`}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex flex-col sm:flex-row gap-3 border-t border-gray-200 bg-gray-50 p-4 sm:p-6">
          <button
            onClick={onClose}
            className="flex-1 cursor-pointer rounded-xl border-2 border-gray-300 bg-white px-4 py-3 font-semibold text-gray-700 transition-all hover:bg-gray-50 active:bg-gray-100 hover:shadow-md active:shadow-sm min-h-[44px] touch-manipulation"
          >
            <span className="text-sm sm:text-base">Cancelar</span>
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 cursor-pointer rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 px-4 py-3 font-semibold text-white shadow-lg shadow-cyan-500/30 transition-all hover:scale-[1.02] active:scale-100 hover:shadow-xl hover:shadow-cyan-500/40 active:shadow-lg min-h-[44px] touch-manipulation"
          >
            <span className="text-sm sm:text-base">Confirmar</span>
          </button>
        </div>
      </div>
    </div>
  )
}

