"use client"

import { useState } from "react"
import { useTranslation } from "react-i18next"

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
  const { t } = useTranslation()
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
    <section id="freelancer-search" className="bg-gradient-to-b from-gray-50 to-cyan-50 py-20">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-8 text-center">
          <div className="mb-4 inline-flex items-center justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-teal-500 text-white shadow-lg shadow-cyan-500/30">
              <i className="ri-user-search-line text-3xl"></i>
            </div>
          </div>
          <h2 className="mb-4 text-4xl font-bold text-gray-900">
            {t("freelancers.search.title")}
          </h2>
          <p className="text-xl text-gray-600">
            {t("freelancers.search.description")}
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-xl">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Search Input */}
            <div className="lg:col-span-3">
              <label htmlFor="freelancer-search-input" className="mb-2 flex items-center gap-2 font-semibold text-gray-700">
                <i className="ri-search-line text-cyan-500"></i>
                {t("freelancers.search.searchButton")}
              </label>
              <div className="relative">
                <i className="ri-search-line absolute top-1/2 left-4 -translate-y-1/2 transform text-xl text-cyan-500"></i>
                <input
                  type="text"
                  id="freelancer-search-input"
                  name="search"
                  placeholder={t("freelancers.search.searchPlaceholder")}
                  value={searchFilters.search}
                  onChange={(e) => handleFilterChange("search", e.target.value)}
                  className="w-full rounded-xl border border-gray-300 bg-gradient-to-r from-gray-50 to-white py-4 pr-4 pl-12 text-lg transition-all focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 focus:outline-none"
                />
              </div>
            </div>

            {/* Category Filter */}
            <div>
              <label htmlFor="freelancer-category" className="mb-2 flex items-center gap-2 font-semibold text-gray-700">
                <i className="ri-folder-line text-cyan-500"></i>
                {t("freelancers.search.category")}
              </label>
              <div className="relative">
                <select
                  id="freelancer-category"
                  name="category"
                  value={searchFilters.category}
                  onChange={(e) => handleFilterChange("category", e.target.value)}
                  className="w-full cursor-pointer appearance-none rounded-xl border border-gray-300 bg-gradient-to-r from-gray-50 to-white px-4 py-3 pr-8 transition-all focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 focus:outline-none"
                >
                  <option value="">{t("freelancers.search.allCategories")}</option>
                  {categories.map((category, index) => (
                    <option key={index} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
                <i className="ri-arrow-down-s-line pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 transform text-cyan-500"></i>
              </div>
            </div>

            {/* Experience Filter */}
            <div>
              <label htmlFor="freelancer-experience" className="mb-2 flex items-center gap-2 font-semibold text-gray-700">
                <i className="ri-star-line text-cyan-500"></i>
                {t("freelancers.search.experience")}
              </label>
              <div className="relative">
                <select
                  id="freelancer-experience"
                  name="experience"
                  value={searchFilters.experience}
                  onChange={(e) => handleFilterChange("experience", e.target.value)}
                  className="w-full cursor-pointer appearance-none rounded-xl border border-gray-300 bg-gradient-to-r from-gray-50 to-white px-4 py-3 pr-8 transition-all focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 focus:outline-none"
                >
                  <option value="">{t("freelancers.search.anyLevel")}</option>
                  {experienceLevels.map((level, index) => (
                    <option key={index} value={level}>
                      {level}
                    </option>
                  ))}
                </select>
                <i className="ri-arrow-down-s-line pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 transform text-cyan-500"></i>
              </div>
            </div>

            {/* Budget Filter */}
            <div>
              <label htmlFor="freelancer-budget" className="mb-2 flex items-center gap-2 font-semibold text-gray-700">
                <i className="ri-money-dollar-circle-line text-cyan-500"></i>
                {t("freelancers.search.budgetPerHour")}
              </label>
              <div className="relative">
                <select
                  id="freelancer-budget"
                  name="budget"
                  value={searchFilters.budget}
                  onChange={(e) => handleFilterChange("budget", e.target.value)}
                  className="w-full cursor-pointer appearance-none rounded-xl border border-gray-300 bg-gradient-to-r from-gray-50 to-white px-4 py-3 pr-8 transition-all focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 focus:outline-none"
                >
                  <option value="">{t("freelancers.search.anyBudget")}</option>
                  {budgetRanges.map((range, index) => (
                    <option key={index} value={range}>
                      {range}
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
              className="group inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 px-8 py-3 font-semibold text-white shadow-lg shadow-cyan-500/30 transition-all hover:-translate-y-0.5 hover:scale-[1.02] hover:shadow-xl hover:shadow-cyan-500/40"
            >
              <i className="ri-search-line text-lg transition-transform group-hover:scale-110"></i>
              {t("freelancers.search.searchButton")}
            </button>
            <button
              onClick={handleClearFilters}
              className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-gray-300 bg-white px-8 py-3 font-semibold text-gray-700 transition-all hover:border-cyan-500 hover:bg-cyan-50 hover:text-cyan-700"
            >
              <i className="ri-refresh-line text-lg"></i>
              {t("freelancers.search.clearFilters")}
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
