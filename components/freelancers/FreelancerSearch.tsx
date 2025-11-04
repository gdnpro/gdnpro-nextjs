"use client"

import { useState } from "react"

interface FreelancerSearchProps {
  onFiltersChange: (filters: {
    search: string
    category: string
    location: string
    experience: string
    budget: string
    availability: string
  }) => void
}

export default function FreelancerSearch({ onFiltersChange }: FreelancerSearchProps) {
  const [searchFilters, setSearchFilters] = useState({
    search: "",
    category: "",
    location: "",
    experience: "",
    budget: "",
    availability: "",
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

  const experienceLevels = [
    "Junior (1-3 años)",
    "Mid-level (3-5 años)",
    "Senior (5+ años)",
    "Expert (10+ años)",
  ]

  const budgetRanges = ["$10-25/hora", "$25-50/hora", "$50-100/hora", "$100+/hora"]

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
      location: "",
      experience: "",
      budget: "",
      availability: "",
    }
    setSearchFilters(clearedFilters)
    onFiltersChange(clearedFilters)
  }

  return (
    <section id="freelancer-search" className="bg-white py-20">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-8 text-center">
          <h2 className="mb-4 text-4xl font-bold text-gray-900">
            Encuentra el Freelancer Perfecto
          </h2>
          <p className="text-xl text-gray-600">
            Filtra por especialidad, experiencia y presupuesto para encontrar el talento ideal
          </p>
        </div>

        <div className="rounded-2xl bg-white p-8 shadow-lg">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Search Input */}
            <div className="lg:col-span-3">
              <div className="relative">
                <i className="ri-search-line absolute top-1/2 left-4 -translate-y-1/2 transform text-xl text-gray-400"></i>
                <input
                  type="text"
                  placeholder="Buscar por habilidades, nombre o descripción..."
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

            {/* Experience Filter */}
            <div>
              <label className="mb-2 block font-semibold text-gray-700">Experiencia</label>
              <div className="relative">
                <select
                  value={searchFilters.experience}
                  onChange={(e) => handleFilterChange("experience", e.target.value)}
                  className="w-full cursor-pointer appearance-none rounded-xl border border-gray-300 px-4 py-3 pr-8 focus:border-transparent focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                >
                  <option value="">Cualquier nivel</option>
                  {experienceLevels.map((level, index) => (
                    <option key={index} value={level}>
                      {level}
                    </option>
                  ))}
                </select>
                <i className="ri-arrow-down-s-line pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 transform text-gray-400"></i>
              </div>
            </div>

            {/* Budget Filter */}
            <div>
              <label className="mb-2 block font-semibold text-gray-700">Presupuesto por hora</label>
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
          </div>

          <div className="mt-8 flex flex-col gap-4 sm:flex-row">
            <button
              onClick={handleSearch}
              className="bg-primary cursor-pointer rounded-xl px-8 py-3 font-semibold whitespace-nowrap text-white transition-all hover:bg-cyan-700"
            >
              <i className="ri-search-line mr-2"></i>
              Buscar Freelancers
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
