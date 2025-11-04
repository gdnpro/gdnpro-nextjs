"use client"

import { useRouter } from "next/navigation"

export default function JoinFreelancer() {
  const router = useRouter()

  return (
    <section id="join-freelancer" className="bg-white py-20">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-16 text-center">
          <h2 className="mb-6 text-4xl font-bold text-gray-900 md:text-5xl">
            Únete a Nuestra Red de Freelancers
          </h2>
          <p className="mx-auto max-w-3xl text-xl text-gray-600">
            Forma parte de nuestra comunidad de profesionales y accede a proyectos de alta calidad
            con clientes verificados
          </p>
        </div>

        <div className="mb-16 flex flex-col justify-center gap-6 sm:flex-row">
          <button
            onClick={() => router.push("/auth/register")}
            className="bg-primary cursor-pointer rounded-full px-12 py-5 text-xl font-bold whitespace-nowrap text-white transition-all hover:scale-105 hover:bg-cyan-700"
          >
            Únete Como Freelancer
          </button>
        </div>

        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
          <div className="rounded-2xl bg-blue-50 p-8">
            <h3 className="mb-6 text-2xl font-bold text-gray-900">¿Por qué unirse a GDN Pro?</h3>

            <div className="space-y-6">
              <div className="flex items-start">
                <div className="mr-4 flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-100">
                  <i className="ri-money-dollar-circle-line text-primary text-xl"></i>
                </div>
                <div>
                  <h4 className="mb-1 font-semibold text-gray-900">Pagos Garantizados</h4>
                  <p className="text-gray-600">
                    Recibe tus pagos de forma segura y puntual a través de nuestra plataforma.
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="mr-4 flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-100">
                  <i className="ri-shield-check-line text-primary text-xl"></i>
                </div>
                <div>
                  <h4 className="mb-1 font-semibold text-gray-900">Clientes Verificados</h4>
                  <p className="text-gray-600">
                    Todos nuestros clientes pasan por un proceso de verificación riguroso.
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="mr-4 flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-100">
                  <i className="ri-team-line text-primary text-xl"></i>
                </div>
                <div>
                  <h4 className="mb-1 font-semibold text-gray-900">Soporte 24/7</h4>
                  <p className="text-gray-600">Nuestro equipo te apoya en cada paso del proceso.</p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="mr-4 flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-100">
                  <i className="ri-rocket-line text-primary text-xl"></i>
                </div>
                <div>
                  <h4 className="mb-1 font-semibold text-gray-900">Proyectos de Calidad</h4>
                  <p className="text-gray-600">
                    Accede a proyectos interesantes y bien remunerados.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col justify-center rounded-2xl bg-gray-900 p-8 text-white">
            <h3 className="mb-4 text-2xl font-bold">Comisión Competitiva</h3>
            <div className="mb-2 text-4xl font-bold text-cyan-400">Solo 15%</div>
            <p className="mb-6 text-lg text-gray-300">
              Una de las comisiones más bajas del mercado. Mantén más de tus ganancias.
            </p>
            <ul className="space-y-3 text-gray-300">
              <li className="flex items-center">
                <i className="ri-check-line mr-2 text-green-400"></i>
                Sin costos ocultos
              </li>
              <li className="flex items-center">
                <i className="ri-check-line mr-2 text-green-400"></i>
                Pagos semanales
              </li>
              <li className="flex items-center">
                <i className="ri-check-line mr-2 text-green-400"></i>
                Múltiples métodos de pago
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}
