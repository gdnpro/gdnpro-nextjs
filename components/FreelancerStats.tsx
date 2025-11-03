import { gdnStats } from "@/constants/currentData"

export default function FreelancerStats() {
  return (
    <section className="py-20 bg-blue-50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
              <i className="ri-trophy-line text-white text-3xl"></i>
            </div>
            <div className="text-4xl font-bold text-gray-900 mb-2">
              +{gdnStats.completedProjects}
            </div>
            <div className="text-gray-600 font-medium">
              Proyectos Completados
            </div>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
              <i className="ri-heart-line text-white text-3xl"></i>
            </div>
            <div className="text-4xl font-bold text-gray-900 mb-2">
              +{gdnStats.qualifications}%
            </div>
            <div className="text-gray-600 font-medium">
              Satisfacción del Cliente
            </div>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
              <i className="ri-customer-service-line text-white text-3xl"></i>
            </div>
            <div className="text-4xl font-bold text-gray-900 mb-2">24/7</div>
            <div className="text-gray-600 font-medium">Soporte Disponible</div>
          </div>
        </div>
      </div>
    </section>
  )
}
