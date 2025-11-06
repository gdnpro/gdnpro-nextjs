"use client"

import { useRouter } from "next/navigation"

export default function CancelPayment() {
  const router = useRouter()

  const goBack = () => {
    window.history.back()
  }

  const goToFreelancers = () => {
    router.push("/freelancers")
  }

  const goToDashboard = () => {
    router.push("/dashboard")
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <div className="rounded-lg bg-white p-8 text-center shadow-lg">
          {/* Icono de cancelación */}
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-yellow-100">
            <i className="ri-close-circle-line text-2xl text-yellow-600"></i>
          </div>

          {/* Título */}
          <h2 className="mb-2 text-2xl font-bold text-gray-900">Pago Cancelado</h2>

          <p className="mb-6 text-gray-600">
            Has cancelado el proceso de pago. No se ha realizado ningún cargo a tu tarjeta.
          </p>

          {/* Información adicional */}
          <div className="mb-6 rounded-lg bg-blue-50 p-4">
            <div className="flex items-start">
              <div className="mt-0.5 mr-3 flex h-6 w-6 items-center justify-center rounded-full bg-blue-100">
                <i className="ri-lightbulb-line text-primary text-sm"></i>
              </div>
              <div className="text-left">
                <h4 className="mb-1 font-medium text-blue-900">¿Cambié de opinión?</h4>
                <p className="text-sm text-blue-800">
                  Puedes regresar y completar tu contratación cuando estés listo. El freelancer
                  seguirá disponible.
                </p>
              </div>
            </div>
          </div>

          {/* Razones comunes */}
          <div className="mb-6 rounded-lg bg-gray-50 p-4 text-left">
            <h4 className="mb-3 font-medium text-gray-900">Razones comunes para cancelar:</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start">
                <i className="ri-arrow-right-s-line mt-0.5 mr-1 text-gray-400"></i>
                <span>Necesito revisar los detalles del proyecto</span>
              </li>
              <li className="flex items-start">
                <i className="ri-arrow-right-s-line mt-0.5 mr-1 text-gray-400"></i>
                <span>Quiero comparar con otros freelancers</span>
              </li>
              <li className="flex items-start">
                <i className="ri-arrow-right-s-line mt-0.5 mr-1 text-gray-400"></i>
                <span>Problemas con el método de pago</span>
              </li>
            </ul>
          </div>

          {/* Botones de acción */}
          <div className="space-y-3">
            <button
              onClick={goBack}
              className="flex w-full cursor-pointer items-center justify-center rounded-lg bg-emerald-600 px-6 py-3 whitespace-nowrap text-white transition-colors hover:bg-cyan-700"
            >
              <i className="ri-arrow-left-line mr-2"></i>
              Volver e Intentar de Nuevo
            </button>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={goToFreelancers}
                className="cursor-pointer rounded-lg border border-gray-300 px-4 py-2 text-sm whitespace-nowrap text-gray-700 transition-colors hover:bg-gray-50"
              >
                <i className="ri-team-line mr-1"></i>
                Ver Freelancers
              </button>

              <button
                onClick={goToDashboard}
                className="cursor-pointer rounded-lg border border-gray-300 px-4 py-2 text-sm whitespace-nowrap text-gray-700 transition-colors hover:bg-gray-50"
              >
                <i className="ri-dashboard-line mr-1"></i>
                Dashboard
              </button>
            </div>
          </div>

          {/* Footer informativo */}
          <div className="mt-6 border-t border-gray-200 pt-4">
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
