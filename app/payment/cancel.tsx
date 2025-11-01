import { useRouter } from "next/router"

export default function CancelPayment() {
  const navigate = useRouter()

  const goBack = () => {
    window.history.back()
  }

  const goToFreelancers = () => {
    navigate.push("/freelancers")
  }

  const goToDashboard = () => {
    navigate.push("/dashboard")
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          {/* Icono de cancelación */}
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="ri-close-circle-line text-2xl text-yellow-600"></i>
          </div>

          {/* Título */}
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Pago Cancelado
          </h2>

          <p className="text-gray-600 mb-6">
            Has cancelado el proceso de pago. No se ha realizado ningún cargo a
            tu tarjeta.
          </p>

          {/* Información adicional */}
          <div className="bg-blue-50 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                <i className="ri-lightbulb-line text-primary text-sm"></i>
              </div>
              <div className="text-left">
                <h4 className="font-medium text-blue-900 mb-1">
                  ¿Cambié de opinión?
                </h4>
                <p className="text-sm text-blue-800">
                  Puedes regresar y completar tu contratación cuando estés
                  listo. El freelancer seguirá disponible.
                </p>
              </div>
            </div>
          </div>

          {/* Razones comunes */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
            <h4 className="font-medium text-gray-900 mb-3">
              Razones comunes para cancelar:
            </h4>
            <ul className="text-sm text-gray-600 space-y-2">
              <li className="flex items-start">
                <i className="ri-arrow-right-s-line text-gray-400 mr-1 mt-0.5"></i>
                <span>Necesito revisar los detalles del proyecto</span>
              </li>
              <li className="flex items-start">
                <i className="ri-arrow-right-s-line text-gray-400 mr-1 mt-0.5"></i>
                <span>Quiero comparar con otros freelancers</span>
              </li>
              <li className="flex items-start">
                <i className="ri-arrow-right-s-line text-gray-400 mr-1 mt-0.5"></i>
                <span>Problemas con el método de pago</span>
              </li>
            </ul>
          </div>

          {/* Botones de acción */}
          <div className="space-y-3">
            <button
              onClick={goBack}
              className="w-full flex items-center justify-center px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-cyan-700 transition-colors cursor-pointer whitespace-nowrap"
            >
              <i className="ri-arrow-left-line mr-2"></i>
              Volver e Intentar de Nuevo
            </button>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={goToFreelancers}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer whitespace-nowrap text-sm"
              >
                <i className="ri-team-line mr-1"></i>
                Ver Freelancers
              </button>

              <button
                onClick={goToDashboard}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer whitespace-nowrap text-sm"
              >
                <i className="ri-dashboard-line mr-1"></i>
                Dashboard
              </button>
            </div>
          </div>

          {/* Footer informativo */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-center text-xs text-gray-500">
              <i className="ri-customer-service-line mr-1"></i>
              <span>¿Necesitas ayuda? Contáctanos</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
