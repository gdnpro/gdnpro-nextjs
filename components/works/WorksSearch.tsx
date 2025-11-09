"use client"

import { useState } from "react"

interface WorksSearchProps {
  onFiltersChange: (filters: {
    search: string
    category: string
    budget: string
    deadline: string
  }) => void
}

export default function WorksSearch({ onFiltersChange }: WorksSearchProps) {
  const [searchFilters, setSearchFilters] = useState({
    search: "",
    category: "",
    budget: "",
    deadline: "",
  })

  const categories = [
    "Desarrollo Web",
    "Desarrollo Móvil",
    "Diseño UX/UI",
    "Marketing Digital",
    "DevOps",
    "Data Science",
    "Copywriting",
    "SEO/SEM",
    "Redes Sociales",
    "E-commerce",
  ]

  const budgetRanges = ["$0-500", "$500-1,000", "$1,000-2,500", "$2,500-5,000", "$5,000+"]

  const deadlineOptions = [
    "Urgente (1-7 días)",
    "Corto plazo (1-2 semanas)",
    "Mediano plazo (2-4 semanas)",
    "Largo plazo (1+ mes)",
  ]

  const handleFilterChange = (key: string, value: string) => {
    const newFilters = {
      ...searchFilters,
      [key]: value,
    }
    setSearchFilters(newFilters)
    onFiltersChange(newFilters)
  }

  const handleSearch = () => {
    onFiltersChange(searchFilters)
  }

  const handleClearFilters = () => {
    const clearedFilters = {
      search: "",
      category: "",
      budget: "",
      deadline: "",
    }
    setSearchFilters(clearedFilters)
    onFiltersChange(clearedFilters)
  }

  return (
    <section id="works-search" className="bg-gradient-to-br from-gray-50 via-white to-cyan-50/30 py-20">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-12 text-center">
          <div className="mb-6 flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-teal-500 shadow-lg shadow-cyan-500/30">
              <i className="ri-search-line text-3xl text-white"></i>
            </div>
          </div>
          <h2 className="mb-4 text-4xl font-bold text-gray-900 sm:text-5xl">
            Encuentra el Proyecto Perfecto
          </h2>
          <p className="mx-auto max-w-2xl text-xl text-gray-600">
            Filtra por categoría, presupuesto y plazo para encontrar proyectos que se ajusten a ti
          </p>
        </div>

        <div className="rounded-3xl border border-gray-200 bg-white p-8 shadow-xl ring-1 ring-black/5 sm:p-10">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {/* Search Input */}
            <div className="lg:col-span-4">
              <label htmlFor="works-search-input" className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-700">
                <i className="ri-search-line text-cyan-600"></i>
                Buscar Proyectos
              </label>
              <div className="relative">
                <i className="ri-search-line absolute top-1/2 left-4 -translate-y-1/2 transform text-xl text-cyan-500"></i>
                <input
                  type="text"
                  id="works-search-input"
                  name="search"
                  placeholder="Buscar por título, descripción o habilidades requeridas..."
                  value={searchFilters.search}
                  onChange={(e) => handleFilterChange("search", e.target.value)}
                  className="w-full rounded-xl border border-gray-300 bg-gradient-to-br from-gray-50 to-white py-4 pr-4 pl-12 text-lg shadow-sm transition-all focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 focus:outline-none"
                />
              </div>
            </div>

            {/* Category Filter */}
            <div>
              <label htmlFor="works-category" className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-700">
                <i className="ri-folder-line text-cyan-600"></i>
                Categoría
              </label>
              <div className="relative">
                <select
                  id="works-category"
                  name="category"
                  value={searchFilters.category}
                  onChange={(e) => handleFilterChange("category", e.target.value)}
                  className="w-full cursor-pointer appearance-none rounded-xl border border-gray-300 bg-gradient-to-br from-gray-50 to-white px-4 py-3 pr-8 shadow-sm transition-all focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 focus:outline-none"
                >
                  <option value="">Todas las categorías</option>
                  {categories.map((category, index) => (
                    <option key={index} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
                <i className="ri-arrow-down-s-line pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 transform text-cyan-500"></i>
              </div>
            </div>

            {/* Budget Filter */}
            <div>
              <label htmlFor="works-budget" className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-700">
                <i className="ri-money-dollar-circle-line text-cyan-600"></i>
                Presupuesto
              </label>
              <div className="relative">
                <select
                  id="works-budget"
                  name="budget"
                  value={searchFilters.budget}
                  onChange={(e) => handleFilterChange("budget", e.target.value)}
                  className="w-full cursor-pointer appearance-none rounded-xl border border-gray-300 bg-gradient-to-br from-gray-50 to-white px-4 py-3 pr-8 shadow-sm transition-all focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 focus:outline-none"
                >
                  <option value="">Cualquier presupuesto</option>
                  {budgetRanges.map((range, index) => (
                    <option key={index} value={range}>
                      {range}
                    </option>
                  ))}
                </select>
                <i className="ri-arrow-down-s-line pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 transform text-cyan-500"></i>
              </div>
            </div>

            {/* Deadline Filter */}
            <div>
              <label htmlFor="works-deadline" className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-700">
                <i className="ri-calendar-line text-cyan-600"></i>
                Plazo
              </label>
              <div className="relative">
                <select
                  id="works-deadline"
                  name="deadline"
                  value={searchFilters.deadline}
                  onChange={(e) => handleFilterChange("deadline", e.target.value)}
                  className="w-full cursor-pointer appearance-none rounded-xl border border-gray-300 bg-gradient-to-br from-gray-50 to-white px-4 py-3 pr-8 shadow-sm transition-all focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 focus:outline-none"
                >
                  <option value="">Cualquier plazo</option>
                  {deadlineOptions.map((option, index) => (
                    <option key={index} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                <i className="ri-arrow-down-s-line pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 transform text-cyan-500"></i>
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-4 sm:flex-row">
            <button
              onClick={handleSearch}
              className="group flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 px-8 py-3 font-semibold whitespace-nowrap text-white shadow-lg shadow-cyan-500/30 transition-all hover:-translate-y-0.5 hover:scale-[1.02] hover:shadow-xl hover:shadow-cyan-500/40"
            >
              <i className="ri-search-line text-lg transition-transform group-hover:scale-110"></i>
              Buscar Proyectos
            </button>
            <button
              onClick={handleClearFilters}
              className="group flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-gray-300 bg-white px-8 py-3 font-semibold whitespace-nowrap text-gray-700 transition-all hover:-translate-y-0.5 hover:border-gray-400 hover:bg-gray-50 hover:shadow-md"
            >
              <i className="ri-refresh-line text-lg transition-transform group-hover:rotate-180"></i>
              Limpiar Filtros
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
