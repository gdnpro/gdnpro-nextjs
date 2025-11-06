"use client"

import { useState, useEffect } from "react"
import { AvailableProjectArticle } from "@/components/AvailableProjectArticle"
import type { Project } from "@/interfaces/Project"
import type { Proposal } from "@/interfaces/Proposal"

interface WorksGridProps {
  projects: Project[]
  proposals: Proposal[]
  loading: boolean
  loadingMore?: boolean
  hasMore?: boolean
  onSendProposal: (projectId: string) => void
  onStartChat: (projectId: string, clientId: string) => void
  onViewProjectDetails: (project: Project) => void
  searchFilters?: {
    search: string
    category: string
    budget: string
    deadline: string
  }
}

export default function WorksGrid({
  projects,
  proposals,
  loading,
  loadingMore = false,
  hasMore = false,
  onSendProposal,
  onStartChat,
  onViewProjectDetails,
  searchFilters,
}: WorksGridProps) {
  const [filteredProjects, setFilteredProjects] = useState<Project[]>(projects)

  useEffect(() => {
    let filtered = [...projects]

    if (searchFilters) {
      // Search term filter
      if (searchFilters.search) {
        const searchTerm = searchFilters.search.toLowerCase()
        filtered = filtered.filter(
          (project) =>
            project.title.toLowerCase().includes(searchTerm) ||
            project.description?.toLowerCase().includes(searchTerm) ||
            project.required_skills?.some((skill) => skill.toLowerCase().includes(searchTerm)),
        )
      }

      // Category filter
      if (searchFilters.category) {
        filtered = filtered.filter((project) =>
          project.required_skills?.some((skill) =>
            skill.toLowerCase().includes(searchFilters.category.toLowerCase()),
          ),
        )
      }

      // Budget filter
      if (searchFilters.budget) {
        const budgetMap: { [key: string]: [number, number] } = {
          "$0-500": [0, 500],
          "$500-1,000": [500, 1000],
          "$1,000-2,500": [1000, 2500],
          "$2,500-5,000": [2500, 5000],
          "$5,000+": [5000, 1000000],
        }
        const [minBudget, maxBudget] = budgetMap[searchFilters.budget] || [0, 1000000]
        filtered = filtered.filter((project) => {
          const projectBudget = project.budget || project.budget_min || 0
          return projectBudget >= minBudget && projectBudget <= maxBudget
        })
      }

      // Deadline filter (this is a simplified version - you might want to enhance it)
      if (searchFilters.deadline) {
        // Filter logic for deadline can be implemented based on project.deadline
        // For now, we'll just keep all projects
      }
    }

    setFilteredProjects(filtered)
  }, [projects, searchFilters])

  if (loading) {
    return (
      <section className="bg-gray-50 py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <i className="ri-loader-4-line text-primary mb-4 animate-spin text-4xl"></i>
              <p className="text-gray-600">Cargando proyectos...</p>
            </div>
          </div>
        </div>
      </section>
    )
  }

  if (filteredProjects.length === 0) {
    return (
      <section className="bg-gray-50 py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="py-12 text-center">
            <i className="ri-briefcase-line mb-4 text-6xl text-gray-300"></i>
            <h3 className="mb-2 text-xl font-medium text-gray-900">No se encontraron proyectos</h3>
            <p className="text-sm text-gray-500">Intenta ajustar tus filtros de búsqueda</p>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="bg-gray-50 py-20">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-8">
          <h2 className="mb-2 text-3xl font-bold text-gray-900 sm:text-4xl">
            Proyectos Disponibles
          </h2>
          <p className="text-gray-600">
            {filteredProjects.length} proyecto{filteredProjects.length !== 1 ? "s" : ""} encontrado
            {filteredProjects.length !== 1 ? "s" : ""}
          </p>
        </div>

        <div className="space-y-6">
          {filteredProjects.map((project) => (
            <AvailableProjectArticle
              key={project.id}
              project={project}
              viewProjectDetails={onViewProjectDetails}
              proposals={proposals}
              sendProposal={onSendProposal}
              startChat={onStartChat}
            />
          ))}
        </div>

        {/* Loading More / No More Message */}
        <div className="mt-12 text-center">
          {loadingMore && (
            <div className="flex items-center justify-center">
              <div className="border-primary h-8 w-8 animate-spin rounded-full border-b-2"></div>
              <span className="ml-3 text-gray-600">Cargando más proyectos...</span>
            </div>
          )}
          {!hasMore && !loadingMore && filteredProjects.length > 0 && (
            <div className="py-8">
              <p className="text-gray-500">
                <i className="ri-check-line mr-2 text-green-500"></i>
                Has visto todos los proyectos disponibles
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
