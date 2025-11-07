"use client"

import { useEffect } from "react"

interface ConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  onCancel: () => void
  title: string
  description: string
  manageOverflow?: boolean // Optional prop to control overflow management
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  onCancel,
  title,
  description,
  manageOverflow = true, // Default to true for standalone usage
}: ConfirmDialogProps) {
  useEffect(() => {
    if (!manageOverflow) return

    if (isOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }

    return () => {
      if (manageOverflow) {
        document.body.style.overflow = ""
      }
    }
  }, [isOpen, manageOverflow])

  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onCancel()
        onClose()
      } else if (e.key === "Enter") {
        onConfirm()
        onClose()
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => {
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [isOpen, onCancel, onClose, onConfirm])

  const handleConfirm = () => {
    onConfirm()
    onClose()
  }

  const handleCancel = () => {
    onCancel()
    onClose()
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-black/60 via-black/50 to-black/60 p-4 backdrop-blur-md sm:p-6"
      onClick={handleCancel}
    >
      <div
        className="animate-in fade-in zoom-in-95 w-full max-w-md overflow-hidden rounded-2xl sm:rounded-3xl bg-white shadow-2xl ring-1 ring-black/5 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modern Header with Gradient */}
        <div className="relative overflow-hidden bg-gradient-to-r from-orange-600 via-amber-500 to-yellow-500 p-6 text-white">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIyIi8+PC9nPjwvZz48L3N2Zz4=')] opacity-20"></div>
          <div className="relative z-10 flex items-start justify-between">
            <div className="flex-1 pr-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 ring-1 ring-white/30 backdrop-blur-sm">
                  <i className="ri-question-line text-2xl"></i>
                </div>
                <div>
                  <h2 className="text-2xl font-bold leading-tight sm:text-3xl">{title}</h2>
                </div>
              </div>
            </div>
            <button
              onClick={handleCancel}
              className="group flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/20 backdrop-blur-sm transition-all hover:scale-110 hover:bg-white/20"
              aria-label="Cerrar"
            >
              <i className="ri-close-line text-xl transition-transform group-hover:rotate-90"></i>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-base text-gray-700 leading-relaxed">{description}</p>
        </div>

        {/* Footer */}
        <div className="flex flex-col sm:flex-row gap-3 border-t border-gray-200 bg-gray-50 p-4 sm:p-6">
          <button
            onClick={handleCancel}
            className="flex-1 cursor-pointer rounded-xl border-2 border-gray-300 bg-white px-4 py-3 font-semibold text-gray-700 transition-all hover:bg-gray-50 active:bg-gray-100 hover:shadow-md active:shadow-sm min-h-[44px] touch-manipulation"
          >
            <span className="text-sm sm:text-base">Cancelar</span>
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 cursor-pointer rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 px-4 py-3 font-semibold text-white shadow-lg shadow-orange-500/30 transition-all hover:scale-[1.02] active:scale-100 hover:shadow-xl hover:shadow-orange-500/40 active:shadow-lg min-h-[44px] touch-manipulation"
          >
            <span className="text-sm sm:text-base">Confirmar</span>
          </button>
        </div>
      </div>
    </div>
  )
}

