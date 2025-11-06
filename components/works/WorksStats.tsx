import { gdnStats } from "@/constants/currentData"

export default function WorksStats() {
  return (
    <section className="bg-blue-50 py-20">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-3">
          <div className="text-center">
            <div className="bg-primary mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl">
              <i className="ri-briefcase-line text-3xl text-white"></i>
            </div>
            <div className="mb-2 text-4xl font-bold text-gray-900">
              +{gdnStats.completedProjects}
            </div>
            <div className="font-medium text-gray-600">Proyectos Disponibles</div>
          </div>

          <div className="text-center">
            <div className="bg-primary mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl">
              <i className="ri-user-star-line text-3xl text-white"></i>
            </div>
            <div className="mb-2 text-4xl font-bold text-gray-900">+{gdnStats.qualifications}%</div>
            <div className="font-medium text-gray-600">Tasa de Éxito</div>
          </div>

          <div className="text-center">
            <div className="bg-primary mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl">
              <i className="ri-time-line text-3xl text-white"></i>
            </div>
            <div className="mb-2 text-4xl font-bold text-gray-900">24/7</div>
            <div className="font-medium text-gray-600">Soporte Disponible</div>
          </div>
        </div>
      </div>
    </section>
  )
}
