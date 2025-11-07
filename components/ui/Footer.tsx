export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-12 mb-8">
          <div className="space-y-4">
            <div className="w-fit">
              <img src="/logo.png" alt="GDN PRO" className="h-10 sm:h-12 w-auto" />
            </div>
            <p className="text-gray-300 text-sm sm:text-base leading-relaxed max-w-sm">
              Transformamos ideas en realidad digital. Expertos en desarrollo
              web, apps móviles y marketing digital.
            </p>

            {/* Redes sociales 
            <div className="flex space-x-4 pt-2">
              <a
                href="#"
                className="w-10 h-10 bg-primary hover:bg-cyan-700 rounded-full flex items-center justify-center transition-all  cursor-pointer"
              >
                <i className="ri-linkedin-line"></i>
              </a>
              <a
                href="#"
                className="w-10 h-10 bg-primary hover:bg-cyan-700 rounded-full flex items-center justify-center transition-all  cursor-pointer"
              >
                <i className="ri-twitter-line"></i>
              </a>
              <a
                href="#"
                className="w-10 h-10 bg-primary hover:bg-cyan-700 rounded-full flex items-center justify-center transition-all  cursor-pointer"
              >
                <i className="ri-instagram-line"></i>
              </a>
              <a
                href="#"
                className="w-10 h-10 bg-primary hover:bg-cyan-700 rounded-full flex items-center justify-center transition-all  cursor-pointer"
              >
                <i className="ri-github-line"></i>
              </a>
            </div>*/}
          </div>

          <div className="grid grid-cols-2 gap-6 sm:gap-8 md:gap-12">
            <div>
              <h3 className="text-lg sm:text-xl font-bold mb-4 sm:mb-6">Servicios</h3>
              <ul className="space-y-2 sm:space-y-3">
                <li>
                  <a
                    href="/#services"
                    className="text-gray-300 hover:text-white active:text-white transition-colors cursor-pointer text-sm sm:text-base block py-1"
                  >
                    Desarrollo Web
                  </a>
                </li>
                <li>
                  <a
                    href="/#services"
                    className="text-gray-300 hover:text-white active:text-white transition-colors cursor-pointer text-sm sm:text-base block py-1"
                  >
                    Desarrollo Móvil
                  </a>
                </li>
                <li>
                  <a
                    href="/#services"
                    className="text-gray-300 hover:text-white active:text-white transition-colors cursor-pointer text-sm sm:text-base block py-1"
                  >
                    Marketing Digital
                  </a>
                </li>
                <li>
                  <a
                    href="/freelancers"
                    className="text-gray-300 hover:text-white active:text-white transition-colors cursor-pointer text-sm sm:text-base block py-1"
                  >
                    Red de Freelancers
                  </a>
                </li>
                <li>
                  <a
                    href="/#contact"
                    className="text-gray-300 hover:text-white active:text-white transition-colors cursor-pointer text-sm sm:text-base block py-1"
                  >
                    Consultoría
                  </a>
                </li>
              </ul>
            </div>

            {/* Empresa */}
            <div>
              <h3 className="text-lg sm:text-xl font-bold mb-4 sm:mb-6">Empresa</h3>
              <ul className="space-y-2 sm:space-y-3">
                <li>
                  <a
                    href="/#about"
                    className="text-gray-300 hover:text-white active:text-white transition-colors cursor-pointer text-sm sm:text-base block py-1"
                  >
                    Sobre Nosotros
                  </a>
                </li>
                <li>
                  <a
                    href="/#portfolio"
                    className="text-gray-300 hover:text-white active:text-white transition-colors cursor-pointer text-sm sm:text-base block py-1"
                  >
                    Portafolio
                  </a>
                </li>
                <li>
                  <a
                    href="/#team"
                    className="text-gray-300 hover:text-white active:text-white transition-colors cursor-pointer text-sm sm:text-base block py-1"
                  >
                    Nuestro Equipo
                  </a>
                </li>
                <li>
                  <a
                    href="/#testimonials"
                    className="text-gray-300 hover:text-white active:text-white transition-colors cursor-pointer text-sm sm:text-base block py-1"
                  >
                    Testimonios
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="md:col-span-1">
            <h3 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4">Newsletter</h3>
            <p className="text-gray-300 mb-4 text-sm sm:text-base">
              Suscríbete para recibir las últimas noticias y ofertas especiales.
            </p>
            <div className="space-y-3">
              <input
                id="email-footer"
                type="email"
                placeholder="Tu email"
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl focus:ring-2 focus:ring-primary text-white focus:outline-none placeholder-gray-400 text-base sm:text-sm min-h-[44px]"
                autoComplete="email"
              />
              <button className="w-full bg-primary hover:bg-cyan-700 active:bg-cyan-800 text-white py-3 rounded-xl font-semibold transition-all whitespace-nowrap cursor-pointer min-h-[44px] touch-manipulation">
                Suscribirse
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-gray-800 mt-8 sm:mt-12 pt-6 sm:pt-8">
          <div className="flex flex-col gap-4 sm:gap-6 items-center text-center">
            <div className="text-gray-400 text-xs sm:text-sm">
              © {currentYear} GDN Pro. Todos los derechos reservados.
            </div>
            <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 items-center justify-center">
              <a
                href="/privacy"
                className="text-gray-400 text-xs sm:text-sm hover:text-white active:text-white transition-colors cursor-pointer py-1"
              >
                Política de Privacidad
              </a>
              <span className="text-gray-400 hidden sm:block text-sm cursor-default">
                •
              </span>
              <a
                href="/terms"
                className="text-gray-400 text-xs sm:text-sm hover:text-white active:text-white transition-colors cursor-pointer py-1"
              >
                Términos de Servicio
              </a>
              <span className="text-gray-400 hidden sm:block text-sm cursor-default">
                •
              </span>
              <a
                href="/data-deletion"
                className="text-gray-400 text-xs sm:text-sm hover:text-white active:text-white transition-colors cursor-pointer py-1"
              >
                Eliminación de Datos
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
