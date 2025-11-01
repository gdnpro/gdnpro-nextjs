"use client"

import { useEffect } from "react"

export default function TermsOfService() {
  useEffect(() => {
    document.title = "Términos de Servicio | GDN Pro"
    window.scrollTo(0, 0)
  }, [])

  return (
    <div className="min-h-screen bg-white">
      <div className="pt-24 pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Términos de Servicio
            </h1>
            <p className="text-lg text-gray-600">
              Última actualización: {new Date().toLocaleDateString("es-ES")}
            </p>
          </div>

          {/* Content */}
          <div className="prose prose-lg max-w-none">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
              <h2 className="text-xl font-semibold text-blue-900 mb-3">
                <i className="ri-file-text-line mr-2"></i>
                Acuerdo de Servicios
              </h2>
              <p className="text-blue-800">
                Al utilizar los servicios de GDN Pro, aceptas estos términos y
                condiciones. Por favor, léelos cuidadosamente antes de utilizar
                nuestros servicios.
              </p>
            </div>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                1. Definiciones
              </h2>

              <div className="bg-gray-50 rounded-lg p-6 mb-4">
                <ul className="space-y-3">
                  <li>
                    <strong>"GDN Pro", "nosotros", "nuestro":</strong> Se
                    refiere a la empresa prestadora de servicios
                  </li>
                  <li>
                    <strong>"Cliente", "tú", "tu":</strong> Se refiere a la
                    persona o entidad que contrata nuestros servicios
                  </li>
                  <li>
                    <strong>"Servicios":</strong> Desarrollo web, aplicaciones
                    móviles, marketing digital y servicios relacionados
                  </li>
                  <li>
                    <strong>"Plataforma":</strong> Nuestro sitio web y
                    herramientas digitales
                  </li>
                  <li>
                    <strong>"Proyecto":</strong> Trabajo específico acordado
                    entre las partes
                  </li>
                  <li>
                    <strong>"Freelancer":</strong> Profesional independiente que
                    forma parte de nuestra red
                  </li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                2. Servicios Ofrecidos
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-green-800 mb-3">
                    <i className="ri-code-line mr-2"></i>
                    Desarrollo Técnico
                  </h3>
                  <ul className="list-disc pl-6 space-y-1 text-green-800">
                    <li>Sitios web responsivos</li>
                    <li>Aplicaciones móviles</li>
                    <li>E-commerce</li>
                    <li>Sistemas web personalizados</li>
                    <li>APIs y integraciones</li>
                  </ul>
                </div>

                <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-purple-800 mb-3">
                    <i className="ri-megaphone-line mr-2"></i>
                    Marketing Digital
                  </h3>
                  <ul className="list-disc pl-6 space-y-1 text-purple-800">
                    <li>Estrategias de marketing</li>
                    <li>Gestión de redes sociales</li>
                    <li>SEO y SEM</li>
                    <li>Email marketing</li>
                    <li>Análisis y reportes</li>
                  </ul>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-blue-800 mb-3">
                  <i className="ri-team-line mr-2"></i>
                  Red de Freelancers
                </h3>
                <p className="text-blue-800">
                  Conectamos clientes con freelancers especializados para
                  proyectos específicos, actuando como intermediarios y
                  garantizando la calidad del servicio.
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                3. Proceso de Contratación
              </h2>

              <div className="space-y-4">
                <div className="flex items-start space-x-4 bg-gray-50 rounded-lg p-4">
                  <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-bold text-sm">
                    1
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">
                      Consulta Inicial
                    </h3>
                    <p className="text-gray-700">
                      Análisis de requerimientos y propuesta inicial
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4 bg-gray-50 rounded-lg p-4">
                  <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-bold text-sm">
                    2
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">
                      Cotización Detallada
                    </h3>
                    <p className="text-gray-700">
                      Propuesta técnica, cronograma y presupuesto
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4 bg-gray-50 rounded-lg p-4">
                  <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-bold text-sm">
                    3
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">
                      Contrato y Anticipo
                    </h3>
                    <p className="text-gray-700">
                      Firma de contrato y pago inicial (30-50%)
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4 bg-gray-50 rounded-lg p-4">
                  <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-bold text-sm">
                    4
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">
                      Desarrollo y Entrega
                    </h3>
                    <p className="text-gray-700">
                      Ejecución del proyecto con entregas parciales
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                4. Obligaciones del Cliente
              </h2>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-yellow-800 mb-3">
                  <i className="ri-user-star-line mr-2"></i>
                  Responsabilidades del Cliente
                </h3>
                <ul className="list-disc pl-6 space-y-2 text-yellow-800">
                  <li>
                    <strong>Información completa:</strong> Proporcionar todos
                    los datos necesarios para el proyecto
                  </li>
                  <li>
                    <strong>Contenido:</strong> Suministrar textos, imágenes y
                    materiales requeridos
                  </li>
                  <li>
                    <strong>Feedback oportuno:</strong> Revisar y aprobar
                    entregas en los tiempos acordados
                  </li>
                  <li>
                    <strong>Pagos puntuales:</strong> Realizar pagos según el
                    cronograma establecido
                  </li>
                  <li>
                    <strong>Accesos necesarios:</strong> Proporcionar
                    credenciales de hosting, dominios, etc.
                  </li>
                  <li>
                    <strong>Comunicación:</strong> Mantener canales de
                    comunicación abiertos
                  </li>
                  <li>
                    <strong>Decisiones:</strong> Tomar decisiones de proyecto en
                    tiempo y forma
                  </li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                5. Obligaciones de GDN Pro
              </h2>

              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-green-800 mb-3">
                  <i className="ri-shield-check-line mr-2"></i>
                  Nuestros Compromisos
                </h3>
                <ul className="list-disc pl-6 space-y-2 text-green-800">
                  <li>
                    <strong>Calidad profesional:</strong> Entregar trabajo de
                    alta calidad técnica
                  </li>
                  <li>
                    <strong>Cumplimiento de plazos:</strong> Respetar
                    cronogramas acordados
                  </li>
                  <li>
                    <strong>Comunicación regular:</strong> Mantener informado
                    sobre el progreso
                  </li>
                  <li>
                    <strong>Soporte técnico:</strong> Brindar asistencia durante
                    el desarrollo
                  </li>
                  <li>
                    <strong>Confidencialidad:</strong> Proteger información
                    sensible del cliente
                  </li>
                  <li>
                    <strong>Mejores prácticas:</strong> Aplicar estándares de la
                    industria
                  </li>
                  <li>
                    <strong>Documentación:</strong> Entregar documentación
                    técnica necesaria
                  </li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                6. Pagos y Facturación
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-blue-800 mb-3">
                    <i className="ri-money-dollar-circle-line mr-2"></i>
                    Estructura de Pagos
                  </h3>
                  <ul className="list-disc pl-6 space-y-2 text-blue-800">
                    <li>
                      <strong>Anticipo:</strong> 20-30% al firmar contrato
                    </li>
                    <li>
                      <strong>Pagos parciales:</strong> Según hitos del proyecto
                    </li>
                    <li>
                      <strong>Pago final:</strong> Al completar y entregar
                    </li>
                    <li>
                      <strong>Moneda:</strong> Dollar (USD)
                    </li>
                  </ul>
                </div>

                <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-orange-800 mb-3">
                    <i className="ri-calendar-check-line mr-2"></i>
                    Términos de Pago
                  </h3>
                  <ul className="list-disc pl-6 space-y-2 text-orange-800">
                    <li>
                      <strong>Plazo:</strong> 15 días naturales
                    </li>
                    <li>
                      <strong>Métodos:</strong> Transferencia, tarjeta, Stripe
                    </li>
                    <li>
                      <strong>Facturación:</strong> Con datos fiscales válidos
                    </li>
                    <li>
                      <strong>Mora:</strong> 2% mensual por retraso
                    </li>
                  </ul>
                </div>
              </div>

              <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-red-800 mb-3">
                  <i className="ri-alert-line mr-2"></i>
                  Política de Pagos Atrasados
                </h3>
                <p className="text-red-800 mb-3">
                  En caso de retraso en pagos, nos reservamos el derecho a:
                </p>
                <ul className="list-disc pl-6 space-y-1 text-red-800">
                  <li>Suspender el desarrollo del proyecto</li>
                  <li>Aplicar intereses moratorios</li>
                  <li>Retener entregables hasta regularizar pagos</li>
                  <li>Cancelar el contrato por incumplimiento</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                7. Propiedad Intelectual
              </h2>

              <div className="space-y-6">
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-purple-800 mb-3">
                    <i className="ri-copyright-line mr-2"></i>
                    Derechos del Cliente
                  </h3>
                  <p className="text-purple-800 mb-3">
                    Una vez completado el pago total, el cliente obtiene:
                  </p>
                  <ul className="list-disc pl-6 space-y-1 text-purple-800">
                    <li>Derechos de uso completo del código desarrollado</li>
                    <li>Propiedad de contenidos y materiales proporcionados</li>
                    <li>Licencia de uso de diseños personalizados</li>
                    <li>Acceso a código fuente (cuando aplique)</li>
                  </ul>
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">
                    <i className="ri-shield-line mr-2"></i>
                    Derechos Reservados por GDN Pro
                  </h3>
                  <ul className="list-disc pl-6 space-y-1 text-gray-700">
                    <li>Metodologías y procesos de desarrollo</li>
                    <li>Frameworks y librerías propietarias</li>
                    <li>Conocimiento técnico y experiencia</li>
                    <li>Derecho a mostrar el proyecto en portafolio</li>
                  </ul>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-yellow-800 mb-3">
                    <i className="ri-creative-commons-line mr-2"></i>
                    Licencias de Terceros
                  </h3>
                  <p className="text-yellow-800">
                    Algunos componentes pueden estar sujetos a licencias de
                    terceros. El cliente es responsable de cumplir con estas
                    licencias en el uso del producto final.
                  </p>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                8. Garantías y Soporte
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-green-800 mb-3">
                    <i className="ri-shield-check-line mr-2"></i>
                    Garantía de Calidad
                  </h3>
                  <ul className="list-disc pl-6 space-y-2 text-green-800">
                    <li>
                      <strong>Funcionalidad:</strong> 90 días para bugs críticos
                    </li>
                    <li>
                      <strong>Compatibilidad:</strong> Navegadores principales
                    </li>
                    <li>
                      <strong>Rendimiento:</strong> Optimización básica incluida
                    </li>
                    <li>
                      <strong>Seguridad:</strong> Mejores prácticas aplicadas
                    </li>
                  </ul>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-blue-800 mb-3">
                    <i className="ri-customer-service-2-line mr-2"></i>
                    Soporte Incluido
                  </h3>
                  <ul className="list-disc pl-6 space-y-2 text-blue-800">
                    <li>
                      <strong>Duración:</strong> 30 días post-entrega
                    </li>
                    <li>
                      <strong>Alcance:</strong> Corrección de errores
                    </li>
                    <li>
                      <strong>Horario:</strong> Lun - Sab: 9:00 AM - 8:00 PM
                    </li>
                    <li>
                      <strong>Respuesta:</strong> 24-48 horas
                    </li>
                  </ul>
                </div>
              </div>

              <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-orange-800 mb-3">
                  <i className="ri-tools-line mr-2"></i>
                  Mantenimiento Adicional
                </h3>
                <p className="text-orange-800">
                  El mantenimiento continuo, actualizaciones de contenido y
                  nuevas funcionalidades están disponibles bajo contratos
                  separados con tarifas preferenciales.
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                9. Limitaciones y Exclusiones
              </h2>

              <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-4">
                <h3 className="text-lg font-semibold text-red-800 mb-3">
                  <i className="ri-error-warning-line mr-2"></i>
                  Limitaciones de Responsabilidad
                </h3>
                <ul className="list-disc pl-6 space-y-2 text-red-800">
                  <li>
                    No somos responsables por pérdidas de datos del cliente
                  </li>
                  <li>No garantizamos resultados específicos de marketing</li>
                  <li>
                    No nos hacemos responsables por contenido proporcionado por
                    el cliente
                  </li>
                  <li>
                    Nuestra responsabilidad se limita al monto pagado por el
                    proyecto
                  </li>
                  <li>No cubrimos daños indirectos o lucro cesante</li>
                </ul>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">
                  <i className="ri-information-line mr-2"></i>
                  Exclusiones de Garantía
                </h3>
                <p className="text-gray-700 mb-3">No garantizamos:</p>
                <ul className="list-disc pl-6 space-y-1 text-gray-700">
                  <li>Funcionamiento en navegadores obsoletos</li>
                  <li>Compatibilidad con modificaciones no autorizadas</li>
                  <li>Rendimiento en hosting inadecuado</li>
                  <li>Problemas causados por terceros</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                10. Cancelación y Terminación
              </h2>

              <div className="space-y-6">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-yellow-800 mb-3">
                    <i className="ri-close-circle-line mr-2"></i>
                    Cancelación por el Cliente
                  </h3>
                  <ul className="list-disc pl-6 space-y-2 text-yellow-800">
                    <li>
                      <strong>Antes del inicio:</strong> Reembolso del 90% del
                      anticipo
                    </li>
                    <li>
                      <strong>Durante desarrollo:</strong> Pago por trabajo
                      completado
                    </li>
                    <li>
                      <strong>Entrega de avances:</strong> Según porcentaje de
                      avance
                    </li>
                    <li>
                      <strong>Penalización:</strong> 20% por cancelación sin
                      causa justificada
                    </li>
                  </ul>
                </div>

                <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-red-800 mb-3">
                    <i className="ri-alert-line mr-2"></i>
                    Terminación por Incumplimiento
                  </h3>
                  <p className="text-red-800 mb-3">
                    Podemos terminar el contrato inmediatamente si:
                  </p>
                  <ul className="list-disc pl-6 space-y-1 text-red-800">
                    <li>El cliente no realiza pagos acordados</li>
                    <li>No proporciona información necesaria</li>
                    <li>Solicita actividades ilegales o no éticas</li>
                    <li>Incumple términos del contrato</li>
                  </ul>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                11. Confidencialidad
              </h2>

              <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-purple-800 mb-3">
                  <i className="ri-lock-line mr-2"></i>
                  Compromiso de Confidencialidad
                </h3>
                <p className="text-purple-800 mb-3">
                  Nos comprometemos a mantener la confidencialidad de:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-purple-800">
                  <li>Información comercial y estratégica del cliente</li>
                  <li>Datos técnicos y de sistemas</li>
                  <li>Información financiera y operativa</li>
                  <li>Cualquier información marcada como confidencial</li>
                  <li>Datos personales según nuestra política de privacidad</li>
                </ul>

                <p className="text-purple-800 mt-4">
                  <strong>Duración:</strong> Esta obligación permanece vigente
                  durante y después de la relación comercial, sin límite de
                  tiempo.
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                12. Resolución de Disputas
              </h2>

              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-blue-800 mb-3">
                    <i className="ri-discuss-line mr-2"></i>
                    Proceso de Resolución
                  </h3>
                  <ol className="list-decimal pl-6 space-y-2 text-blue-800">
                    <li>
                      <strong>Negociación directa:</strong> Intentar resolver
                      amigablemente
                    </li>
                    <li>
                      <strong>Mediación:</strong> Recurrir a mediador neutral
                    </li>
                    <li>
                      <strong>Arbitraje:</strong> Proceso arbitral vinculante
                    </li>
                    <li>
                      <strong>Jurisdicción:</strong> Tribunales de la Ciudad
                      correspondiente
                    </li>
                  </ol>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-green-800 mb-3">
                    <i className="ri-scales-line mr-2"></i>
                    Ley Aplicable
                  </h3>
                  <p className="text-green-800">
                    Estos términos se rigen por las leyes que corresponde.
                    Cualquier disputa será resuelta en los tribunales
                    competentes.
                  </p>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                13. Modificaciones
              </h2>

              <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-orange-800 mb-3">
                  <i className="ri-edit-line mr-2"></i>
                  Cambios en los Términos
                </h3>
                <p className="text-orange-800 mb-3">
                  Nos reservamos el derecho de modificar estos términos. Los
                  cambios serán notificados:
                </p>
                <ul className="list-disc pl-6 space-y-1 text-orange-800">
                  <li>Por email a clientes activos</li>
                  <li>Mediante aviso en nuestro sitio web</li>
                  <li>Con 30 días de anticipación mínimo</li>
                </ul>
                <p className="text-orange-800 mt-3">
                  <strong>
                    El uso continuado de nuestros servicios constituye
                    aceptación de los nuevos términos.
                  </strong>
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                14. Contacto
              </h2>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-blue-800 mb-4">
                  <i className="ri-customer-service-2-line mr-2"></i>
                  Información de Contacto
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-blue-800 mb-2">
                      Datos Generales
                    </h4>
                    <ul className="space-y-2 text-cyan-700">
                      <li>
                        <i className="ri-building-line mr-2"></i>
                        <strong>Empresa:</strong> GDN Pro
                      </li>
                      <li>
                        <i className="ri-mail-line mr-2"></i>
                        <strong>Email:</strong> contact@gdnpro.com
                      </li>
                      <li>
                        <i className="ri-map-pin-line mr-2"></i>
                        <strong>Dirección:</strong> Sede central: Newark, DE
                        (EE. UU.) — Próximamente se traslada a Tallin, Estonia
                        (UE)
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold text-blue-800 mb-2">
                      Datos Fiscales
                    </h4>
                    <ul className="space-y-2 text-cyan-700">
                      <li>
                        <i className="ri-bank-line mr-2"></i>
                        <strong>Régimen:</strong> LLC (Delaware, EE. UU.) —
                        Próximamente OÜ (Private Limited Company) en Estonia
                        (UE)
                      </li>
                      <li>
                        <i className="ri-time-line mr-2"></i>
                        <strong>Horario:</strong> Lun - Sab: 9:00 AM - 8:00 PM
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            {/* Footer Legal */}
            <div className="border-t border-gray-200 pt-8 mt-12">
              <div className="bg-gray-50 rounded-lg p-6">
                <p className="text-sm text-gray-600 text-center mb-2">
                  Estos Términos de Servicio constituyen un acuerdo legal
                  vinculante entre el cliente y GDN Pro para la prestación de
                  servicios de desarrollo digital.
                </p>
                <p className="text-xs text-gray-500 text-center">
                  Última actualización: {new Date().toLocaleDateString("es-ES")}{" "}
                  | Versión 1.0 | Vigente desde:{" "}
                  {new Date().toLocaleDateString("es-ES")}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
