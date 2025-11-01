"use client"

import { useEffect } from "react"

export default function PrivacyPolicy() {
  useEffect(() => {
    document.title = "Política de Privacidad | GDN Pro"
    window.scrollTo(0, 0)
  }, [])

  return (
    <div className="min-h-screen bg-white">
      <div className="pt-24 pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Política de Privacidad
            </h1>
            <p className="text-lg text-gray-600">
              Última actualización: {new Date().toLocaleDateString("es-ES")}
            </p>
          </div>

          {/* Content */}
          <div className="prose prose-lg max-w-none">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
              <h2 className="text-xl font-semibold text-blue-900 mb-3">
                <i className="ri-shield-check-line mr-2"></i>
                Compromiso con tu Privacidad
              </h2>
              <p className="text-blue-800">
                En GDN Pro, respetamos y protegemos tu privacidad. Esta política
                explica cómo recopilamos, usamos y protegemos tu información
                personal cuando utilizas nuestros servicios.
              </p>
            </div>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                1. Información que Recopilamos
              </h2>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">
                1.1 Información Personal
              </h3>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>Nombre completo y datos de contacto (email, teléfono)</li>
                <li>Información de la empresa (nombre, dirección, sector)</li>
                <li>Detalles del proyecto y requerimientos técnicos</li>
                <li>Información de facturación y pagos</li>
                <li>Comunicaciones y mensajes intercambiados</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">
                1.2 Información Técnica
              </h3>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>Dirección IP y datos de navegación</li>
                <li>Tipo de dispositivo y navegador utilizado</li>
                <li>Páginas visitadas y tiempo de permanencia</li>
                <li>Cookies y tecnologías similares</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                2. Cómo Utilizamos tu Información
              </h2>

              <div className="bg-gray-50 rounded-lg p-6 mb-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">
                  Utilizamos tu información para:
                </h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>
                    <strong>Prestación de servicios:</strong> Desarrollo web,
                    aplicaciones móviles y marketing digital
                  </li>
                  <li>
                    <strong>Comunicación:</strong> Responder consultas, enviar
                    actualizaciones del proyecto
                  </li>
                  <li>
                    <strong>Facturación:</strong> Procesar pagos y generar
                    facturas
                  </li>
                  <li>
                    <strong>Mejora de servicios:</strong> Analizar uso y
                    optimizar nuestra plataforma
                  </li>
                  <li>
                    <strong>Marketing:</strong> Enviar información relevante
                    (solo con tu consentimiento)
                  </li>
                  <li>
                    <strong>Cumplimiento legal:</strong> Cumplir obligaciones
                    legales y fiscales
                  </li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                3. Compartir Información
              </h2>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-4">
                <h3 className="text-lg font-semibold text-yellow-800 mb-3">
                  <i className="ri-alert-line mr-2"></i>
                  Cuándo Compartimos tu Información
                </h3>
                <ul className="list-disc pl-6 space-y-2 text-yellow-800">
                  <li>
                    <strong>Proveedores de servicios:</strong> Empresas que nos
                    ayudan a operar (hosting, pagos, email)
                  </li>
                  <li>
                    <strong>Freelancers:</strong> Solo información necesaria
                    para ejecutar tu proyecto
                  </li>
                  <li>
                    <strong>Requerimientos legales:</strong> Cuando sea
                    requerido por ley o autoridades
                  </li>
                  <li>
                    <strong>Transferencia de negocio:</strong> En caso de
                    fusión, adquisición o venta
                  </li>
                </ul>
              </div>

              <p className="text-gray-700">
                <strong>Nunca vendemos</strong> tu información personal a
                terceros para fines comerciales.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                4. Seguridad de Datos
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-green-800 mb-3">
                    <i className="ri-shield-check-line mr-2"></i>
                    Medidas de Seguridad
                  </h3>
                  <ul className="list-disc pl-6 space-y-1 text-green-800">
                    <li>Encriptación SSL/TLS</li>
                    <li>Servidores seguros</li>
                    <li>Acceso restringido</li>
                    <li>Monitoreo continuo</li>
                  </ul>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-blue-800 mb-3">
                    <i className="ri-database-2-line mr-2"></i>
                    Almacenamiento
                  </h3>
                  <ul className="list-disc pl-6 space-y-1 text-blue-800">
                    <li>Servidores en la nube seguros</li>
                    <li>Respaldos regulares</li>
                    <li>Retención limitada</li>
                    <li>Eliminación segura</li>
                  </ul>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                5. Tus Derechos
              </h2>

              <div className="bg-purple-50 border border-purple-200 rounded-lg p-6 mb-4">
                <h3 className="text-lg font-semibold text-purple-800 mb-3">
                  <i className="ri-user-settings-line mr-2"></i>
                  Derechos sobre tus Datos
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <ul className="list-disc pl-6 space-y-2 text-purple-800">
                    <li>
                      <strong>Acceso:</strong> Solicitar copia de tus datos
                    </li>
                    <li>
                      <strong>Rectificación:</strong> Corregir datos incorrectos
                    </li>
                    <li>
                      <strong>Eliminación:</strong> Solicitar borrado de datos
                    </li>
                    <li>
                      <strong>Portabilidad:</strong> Transferir datos a otro
                      proveedor
                    </li>
                  </ul>
                  <ul className="list-disc pl-6 space-y-2 text-purple-800">
                    <li>
                      <strong>Limitación:</strong> Restringir el procesamiento
                    </li>
                    <li>
                      <strong>Oposición:</strong> Oponerte al procesamiento
                    </li>
                    <li>
                      <strong>Revocación:</strong> Retirar consentimiento
                    </li>
                    <li>
                      <strong>Reclamación:</strong> Presentar quejas ante
                      autoridades
                    </li>
                  </ul>
                </div>
              </div>

              <p className="text-gray-700">
                Para ejercer estos derechos, contáctanos en:
                <a
                  href="mailto:privacidad@gdnpro.com"
                  className="text-primary hover:text-blue-800 ml-1"
                >
                  contact@gdnpro.com
                </a>
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                6. Cookies y Tecnologías Similares
              </h2>

              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-800 mb-2">
                    🍪 Cookies Esenciales
                  </h3>
                  <p className="text-gray-700">
                    Necesarias para el funcionamiento básico del sitio web.
                  </p>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-800 mb-2">
                    📊 Cookies de Análisis
                  </h3>
                  <p className="text-gray-700">
                    Nos ayudan a entender cómo los usuarios interactúan con
                    nuestro sitio.
                  </p>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-800 mb-2">
                    🎯 Cookies de Marketing
                  </h3>
                  <p className="text-gray-700">
                    Utilizadas para mostrar anuncios relevantes (solo con tu
                    consentimiento).
                  </p>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                7. Retención de Datos
              </h2>

              <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-orange-800 mb-3">
                  <i className="ri-time-line mr-2"></i>
                  Períodos de Retención
                </h3>
                <ul className="list-disc pl-6 space-y-2 text-orange-800">
                  <li>
                    <strong>Datos de clientes activos:</strong> Durante la
                    relación comercial
                  </li>
                  <li>
                    <strong>Datos de proyectos:</strong> 5 años después de
                    finalización
                  </li>
                  <li>
                    <strong>Datos de facturación:</strong> 10 años
                    (requerimiento fiscal)
                  </li>
                  <li>
                    <strong>Datos de marketing:</strong> Hasta revocación del
                    consentimiento
                  </li>
                  <li>
                    <strong>Logs técnicos:</strong> 12 meses máximo
                  </li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                8. Transferencias Internacionales
              </h2>

              <p className="text-gray-700 mb-4">
                Algunos de nuestros proveedores de servicios pueden estar
                ubicados en distintos paises. En estos casos, aseguramos que:
              </p>

              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>Se implementen salvaguardas adecuadas</li>
                <li>Se cumplan estándares internacionales de protección</li>
                <li>Se mantenga el mismo nivel de protección</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                9. Menores de Edad
              </h2>

              <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-red-800 mb-3">
                  <i className="ri-user-forbid-line mr-2"></i>
                  Protección de Menores
                </h3>
                <p className="text-red-800">
                  Nuestros servicios están dirigidos a empresas y profesionales.
                  No recopilamos intencionalmente información de menores de 18
                  años. Si detectamos que hemos recopilado datos de un menor,
                  los eliminaremos inmediatamente.
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                10. Cambios en esta Política
              </h2>

              <p className="text-gray-700 mb-4">
                Podemos actualizar esta política ocasionalmente. Te
                notificaremos sobre cambios significativos mediante:
              </p>

              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>Email a tu dirección registrada</li>
                <li>Aviso prominente en nuestro sitio web</li>
                <li>Notificación en nuestros servicios</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                11. Contacto
              </h2>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-blue-800 mb-4">
                  <i className="ri-customer-service-2-line mr-2"></i>
                  ¿Preguntas sobre Privacidad?
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-blue-800 mb-2">
                      Datos de Contacto
                    </h4>
                    <ul className="space-y-2 text-cyan-700">
                      <li>
                        <i className="ri-mail-line mr-2"></i>
                        <strong>Email:</strong> privacidad@gdnpro.com
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
                      Responsable de Datos
                    </h4>
                    <p className="text-cyan-700">
                      <strong>GDN Pro</strong>
                      <br />
                      Responsable de Protección de Datos
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Footer Legal */}
            <div className="border-t border-gray-200 pt-8 mt-12">
              <div className="bg-gray-50 rounded-lg p-6">
                <p className="text-sm text-gray-600 text-center">
                  Esta Política de Privacidad cumple con la Ley Federal de
                  Protección de Datos Personales en Posesión de los Particulares
                  (LFPDPPP) y el Reglamento General de Protección de Datos
                  (GDPR).
                </p>
                <p className="text-xs text-gray-500 text-center mt-2">
                  Última actualización: {new Date().toLocaleDateString("es-ES")}{" "}
                  | Versión 1.0 | Válida desde:{" "}
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
