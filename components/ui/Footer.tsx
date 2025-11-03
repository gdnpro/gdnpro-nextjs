export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-8 mb-8 items-start md:justify-items-center">
          <div className="space-y-4 flex flex-col justify-start">
            <div className="w-fit">
              <img src="/logo.png" alt="GDN PRO" className="h-12 w-auto" />
            </div>
            <p className="text-gray-300 text-sm leading-relaxed">
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

          <div className="flex-row flex flex-1 gap-12">
            <div>
              <h3 className="text-xl font-bold mb-2">Servicios</h3>
              <ul className="space-y-3">
                <li>
                  <a
                    href="/#services"
                    className="text-gray-300 hover:text-white transition-colors cursor-pointer"
                  >
                    Desarrollo Web
                  </a>
                </li>
                <li>
                  <a
                    href="/#services"
                    className="text-gray-300 hover:text-white transition-colors cursor-pointer"
                  >
                    Desarrollo Móvil
                  </a>
                </li>
                <li>
                  <a
                    href="/#services"
                    className="text-gray-300 hover:text-white transition-colors cursor-pointer"
                  >
                    Marketing Digital
                  </a>
                </li>
                <li>
                  <a
                    href="/freelancers"
                    className="text-gray-300 hover:text-white transition-colors cursor-pointer"
                  >
                    Red de Freelancers
                  </a>
                </li>
                <li>
                  <a
                    href="/#contact"
                    className="text-gray-300 hover:text-white transition-colors cursor-pointer"
                  >
                    Consultoría
                  </a>
                </li>
              </ul>
            </div>

            {/* Empresa */}
            <div>
              <h3 className="text-xl font-bold mb-2">Empresa</h3>
              <ul className="space-y-3">
                <li>
                  <a
                    href="/#about"
                    className="text-gray-300 hover:text-white transition-colors cursor-pointer"
                  >
                    Sobre Nosotros
                  </a>
                </li>
                <li>
                  <a
                    href="/#portfolio"
                    className="text-gray-300 hover:text-white transition-colors cursor-pointer"
                  >
                    Portafolio
                  </a>
                </li>
                <li>
                  <a
                    href="/#team"
                    className="text-gray-300 hover:text-white transition-colors cursor-pointer"
                  >
                    Nuestro Equipo
                  </a>
                </li>
                <li>
                  <a
                    href="/#testimonials"
                    className="text-gray-300 hover:text-white transition-colors cursor-pointer"
                  >
                    Testimonios
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div>
            <h3 className="text-xl font-bold mb-2">Newsletter</h3>
            <p className="text-gray-300 mb-4">
              Suscríbete para recibir las últimas noticias y ofertas especiales.
            </p>
            <div className="space-y-3">
              <input
                id="email-footer"
                type="email"
                placeholder="Tu email"
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl focus:ring-2 focus:ring-primary text-white focus:outline-none placeholder-gray-400"
              />
              <button className="w-full bg-primary hover:bg-cyan-700 text-white py-3 rounded-xl font-semibold transition-all  whitespace-nowrap cursor-pointer">
                Suscribirse
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-gray-800 mt-12 pt-8">
          <div className="flex flex-col justify-between gap-2 items-center">
            <div className="text-gray-400 text-sm">
              © {currentYear} GDN Pro. Todos los derechos reservados.
            </div>
            <div className="flex flex-col md:flex-row flex-wrap gap-3">
              <a
                href="/privacy"
                className="text-gray-400  text-sm hover:text-white transition-colors cursor-pointer"
              >
                Política de Privacidad
              </a>
              <span className="text-gray-400 hidden md:block text-sm cursor-default">
                •
              </span>
              <a
                href="/terms"
                className="text-gray-400 text-sm hover:text-white transition-colors cursor-pointer"
              >
                Términos de Servicio
              </a>
              <span className="text-gray-400 hidden md:block text-sm cursor-default">
                •
              </span>
              <a
                href="/data-deletion"
                className="text-gray-400 text-sm hover:text-white transition-colors cursor-pointer"
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
