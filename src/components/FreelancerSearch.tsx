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

export default function FreelancerSearch({
  onFiltersChange,
}: FreelancerSearchProps) {
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

  const budgetRanges = [
    "$10-25/hora",
    "$25-50/hora",
    "$50-100/hora",
    "$100+/hora",
  ]

  const availabilityOptions = [
    "Disponible ahora",
    "Esta semana",
    "Este mes",
    "Próximo mes",
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
      location: "",
      experience: "",
      budget: "",
      availability: "",
    }
    setSearchFilters(clearedFilters)
    onFiltersChange(clearedFilters)
  }

  return (
    <section id="freelancer-search" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Encuentra el Freelancer Perfecto
          </h2>
          <p className="text-xl text-gray-600">
            Filtra por especialidad, experiencia y presupuesto para encontrar el
            talento ideal
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8 mb-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Search Input */}
            <div className="lg:col-span-3">
              <div className="relative">
                <i className="ri-search-line absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-xl"></i>
                <input
                  type="text"
                  placeholder="Buscar por habilidades, nombre o descripción..."
                  value={searchFilters.search}
                  onChange={(e) => handleFilterChange("search", e.target.value)}
                  className="w-full pl-12 pr-4 py-4 border transition-colors border-gray-300 rounded-xl focus:ring-2 focus:outline-none focus:ring-cyan-500 focus:border-transparent text-lg"
                />
              </div>
            </div>

            {/* Category Filter */}
            <div>
              <label className="block text-gray-700 font-semibold mb-2">
                Categoría
              </label>
              <div className="relative">
                <select
                  value={searchFilters.category}
                  onChange={(e) =>
                    handleFilterChange("category", e.target.value)
                  }
                  className="w-full px-4 focus:outline-none py-3 pr-8 border border-gray-300 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent appearance-none cursor-pointer"
                >
                  <option value="">Todas las categorías</option>
                  {categories.map((category, index) => (
                    <option key={index} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
                <i className="ri-arrow-down-s-line absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none"></i>
              </div>
            </div>

            {/* Experience Filter */}
            <div>
              <label className="block text-gray-700 font-semibold mb-2">
                Experiencia
              </label>
              <div className="relative">
                <select
                  value={searchFilters.experience}
                  onChange={(e) =>
                    handleFilterChange("experience", e.target.value)
                  }
                  className="w-full px-4 py-3 pr-8 focus:outline-none border border-gray-300 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent appearance-none cursor-pointer"
                >
                  <option value="">Cualquier nivel</option>
                  {experienceLevels.map((level, index) => (
                    <option key={index} value={level}>
                      {level}
                    </option>
                  ))}
                </select>
                <i className="ri-arrow-down-s-line absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none"></i>
              </div>
            </div>

            {/* Budget Filter */}
            <div>
              <label className="block text-gray-700 font-semibold mb-2">
                Presupuesto por hora
              </label>
              <div className="relative">
                <select
                  value={searchFilters.budget}
                  onChange={(e) => handleFilterChange("budget", e.target.value)}
                  className="w-full px-4 py-3 pr-8 border focus:outline-none border-gray-300 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent appearance-none cursor-pointer"
                >
                  <option value="">Cualquier presupuesto</option>
                  {budgetRanges.map((range, index) => (
                    <option key={index} value={range}>
                      {range}
                    </option>
                  ))}
                </select>
                <i className="ri-arrow-down-s-line absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none"></i>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 mt-8">
            <button
              onClick={handleSearch}
              className="bg-primary hover:bg-cyan-700 text-white px-8 py-3 rounded-xl font-semibold transition-all  whitespace-nowrap cursor-pointer"
            >
              <i className="ri-search-line mr-2"></i>
              Buscar Freelancers
            </button>
            <button
              onClick={handleClearFilters}
              className="border border-gray-300 text-gray-700 hover:bg-gray-50 px-8 py-3 rounded-xl font-semibold transition-all  whitespace-nowrap cursor-pointer"
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
