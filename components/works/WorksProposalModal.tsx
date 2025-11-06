"use client"

import { useState, useEffect } from "react"
import type { Project } from "@/interfaces/Project"

interface WorksProposalModalProps {
  project: Project | null
  isOpen: boolean
  onClose: () => void
  onSubmit: (formData: { budget: string; delivery_time: string; message: string }) => void
}

export default function WorksProposalModal({
  project,
  isOpen,
  onClose,
  onSubmit,
}: WorksProposalModalProps) {
  const [formData, setFormData] = useState({
    budget: "",
    delivery_time: "",
    message: "",
  })

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }

    return () => {
      document.body.style.overflow = ""
    }
  }, [isOpen])

  if (!isOpen || !project) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
    setFormData({ budget: "", delivery_time: "", message: "" })
  }

  const handleClose = () => {
    setFormData({ budget: "", delivery_time: "", message: "" })
    onClose()
  }

  return (
    <div className="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-6">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Enviar Propuesta</h2>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600">
            <i className="ri-close-line text-2xl"></i>
          </button>
        </div>

        <div className="mb-6">
          <h3 className="mb-2 text-lg font-semibold text-gray-900">{project.title}</h3>
          <p className="mb-4 text-gray-600">{project.description}</p>
          <div className="flex items-center space-x-4 text-sm text-gray-500">
            <span>
              Presupuesto: ${project.budget_min || 0} - ${project.budget_max || 0}
            </span>
            {project.deadline && (
              <span>Fecha límite: {new Date(project.deadline).toLocaleDateString("es-ES")}</span>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Presupuesto Propuesto ($)
            </label>
            <input
              type="number"
              value={formData.budget}
              onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
              className="focus:ring-primary w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2"
              placeholder="Ej: 500"
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Tiempo de Entrega (días)
            </label>
            <input
              type="number"
              value={formData.delivery_time}
              onChange={(e) => setFormData({ ...formData, delivery_time: e.target.value })}
              className="focus:ring-primary w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2"
              placeholder="Ej: 30"
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Mensaje</label>
            <textarea
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              rows={4}
              className="focus:ring-primary w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2"
              placeholder="Explica por qué eres el mejor candidato para este proyecto..."
              required
            />
          </div>

          <div className="flex items-center justify-end space-x-4 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="rounded-lg border border-gray-300 px-6 py-2 text-gray-700 transition-colors hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="bg-primary rounded-lg px-6 py-2 text-white transition-colors hover:bg-cyan-700"
            >
              Enviar Propuesta
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
