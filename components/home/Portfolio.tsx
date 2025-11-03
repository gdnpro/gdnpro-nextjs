"use client"

import { projects } from "@/services/Projects"
import { useState } from "react"

export default function Portfolio() {
  const [activeFilter, setActiveFilter] = useState("all")

  const filters = [
    { id: "all", label: "Todos los Proyectos" },
    { id: "web", label: "Desarrollo Web" },
    { id: "mobile", label: "Apps Móviles" },
    { id: "marketing", label: "Marketing Digital" },
  ]

  const filteredProjects =
    activeFilter === "all"
      ? projects
      : projects.filter((project) => project.category === activeFilter)

  const scrollToContact = () => {
    const element = document.getElementById("contact")
    if (element) {
      element.scrollIntoView({ behavior: "smooth" })
    }
  }

  return (
    <section id="portfolio" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Nuestro Portafolio
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Algunos de los proyectos exitosos que hemos desarrollado para
            nuestros clientes
          </p>

          {/* Filter Buttons */}
          <div className="flex flex-wrap justify-center gap-4 mb-12">
            {filters.map((filter) => (
              <button
                key={filter.id}
                onClick={() => setActiveFilter(filter.id)}
                className={`px-6 py-3 rounded-full font-semibold transition-all text-sm md:text-md whitespace-nowrap cursor-pointer ${
                  activeFilter === filter.id
                    ? "bg-sky-600 text-white shadow-lg"
                    : "bg-gray-100 text-gray-700 hover:bg-sky-50 hover:text-sky-600"
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredProjects.map((project) => (
            <article
              key={project.id}
              className="bg-white flex flex-col justify-between rounded-2xl shadow-lg hover:shadow-xl transition-all  hover:-translate-y-2 overflow-hidden"
            >
              <div className="relative">
                <img
                  src={project.image}
                  alt={project.title}
                  className="w-full h-48 object-cover object-top"
                />
                <div className="absolute top-4 right-4 bg-sky-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                  {project.category === "web"
                    ? "Web"
                    : project.category === "mobile"
                      ? "Móvil"
                      : "Marketing"}
                </div>
              </div>

              <div className="p-6 flex-1">
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  {project.title}
                </h3>
                <p className="text-gray-600 mb-4 leading-relaxed">
                  {project.description}
                </p>

                <div className="flex flex-wrap gap-2 mb-4">
                  {project.technologies.map((tech, idx) => (
                    <span
                      key={idx}
                      className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>

              <a
                href={project.link}
                target="_blank"
                className="w-auto m-6 flex justify-center items-center bg-sky-600 hover:bg-sky-700 text-white py-3 rounded-xl font-semibold transition-all  whitespace-nowrap cursor-pointer"
              >
                Ver Detalles
              </a>
            </article>
          ))}
        </div>

        {projects.length > 6 && (
          <div className="text-center mt-16">
            <button
              onClick={scrollToContact}
              className="bg-sky-600 hover:bg-sky-700 text-white px-8 py-4 rounded-full text-lg font-semibold transition-all  whitespace-nowrap cursor-pointer"
            >
              Ver Más Proyectos
            </button>
          </div>
        )}
      </div>
    </section>
  )
}
