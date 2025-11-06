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
    <section id="works-search" className="bg-white py-20">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-8 text-center">
          <h2 className="mb-4 text-4xl font-bold text-gray-900">Encuentra el Proyecto Perfecto</h2>
          <p className="text-xl text-gray-600">
            Filtra por categoría, presupuesto y plazo para encontrar proyectos que se ajusten a ti
          </p>
        </div>

        <div className="rounded-2xl bg-white p-8 shadow-lg">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {/* Search Input */}
            <div className="lg:col-span-4">
              <div className="relative">
                <i className="ri-search-line absolute top-1/2 left-4 -translate-y-1/2 transform text-xl text-gray-400"></i>
                <input
                  type="text"
                  placeholder="Buscar por título, descripción o habilidades requeridas..."
                  value={searchFilters.search}
                  onChange={(e) => handleFilterChange("search", e.target.value)}
                  className="w-full rounded-xl border border-gray-300 py-4 pr-4 pl-12 text-lg transition-colors focus:border-transparent focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Category Filter */}
            <div>
              <label className="mb-2 block font-semibold text-gray-700">Categoría</label>
              <div className="relative">
                <select
                  value={searchFilters.category}
                  onChange={(e) => handleFilterChange("category", e.target.value)}
                  className="w-full cursor-pointer appearance-none rounded-xl border border-gray-300 px-4 py-3 pr-8 focus:border-transparent focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                >
                  <option value="">Todas las categorías</option>
                  {categories.map((category, index) => (
                    <option key={index} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
                <i className="ri-arrow-down-s-line pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 transform text-gray-400"></i>
              </div>
            </div>

            {/* Budget Filter */}
            <div>
              <label className="mb-2 block font-semibold text-gray-700">Presupuesto</label>
              <div className="relative">
                <select
                  value={searchFilters.budget}
                  onChange={(e) => handleFilterChange("budget", e.target.value)}
                  className="w-full cursor-pointer appearance-none rounded-xl border border-gray-300 px-4 py-3 pr-8 focus:border-transparent focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                >
                  <option value="">Cualquier presupuesto</option>
                  {budgetRanges.map((range, index) => (
                    <option key={index} value={range}>
                      {range}
                    </option>
                  ))}
                </select>
                <i className="ri-arrow-down-s-line pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 transform text-gray-400"></i>
              </div>
            </div>

            {/* Deadline Filter */}
            <div>
              <label className="mb-2 block font-semibold text-gray-700">Plazo</label>
              <div className="relative">
                <select
                  value={searchFilters.deadline}
                  onChange={(e) => handleFilterChange("deadline", e.target.value)}
                  className="w-full cursor-pointer appearance-none rounded-xl border border-gray-300 px-4 py-3 pr-8 focus:border-transparent focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                >
                  <option value="">Cualquier plazo</option>
                  {deadlineOptions.map((option, index) => (
                    <option key={index} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                <i className="ri-arrow-down-s-line pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 transform text-gray-400"></i>
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-4 sm:flex-row">
            <button
              onClick={handleSearch}
              className="bg-primary cursor-pointer rounded-xl px-8 py-3 font-semibold whitespace-nowrap text-white transition-all hover:bg-cyan-700"
            >
              <i className="ri-search-line mr-2"></i>
              Buscar Proyectos
            </button>
            <button
              onClick={handleClearFilters}
              className="cursor-pointer rounded-xl border border-gray-300 px-8 py-3 font-semibold whitespace-nowrap text-gray-700 transition-all hover:bg-gray-50"
            >
              <i className="ri-refresh-line mr-2"></i>
              Limpiar Filtros
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
